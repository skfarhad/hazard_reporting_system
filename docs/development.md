# Development

Everything runs in Docker Compose from the repo root. Python code and templates are mounted into
the containers, and Gunicorn reloads on changes while `DEBUG=True`. Gunicorn runs Uvicorn workers
(`config/workers.py`) that serve the ASGI app (`config/asgi.py`): pages, the API and the live
dashboard's WebSocket, all on port 8001.

## Setup

```bash
cp example.env .env                      # then set real values
docker compose up -d --build             # be, celery_worker, postgres, rabbitmq, redis
docker compose exec be python manage.py migrate
docker compose exec be python manage.py createsuperuser
```

- Web dashboard: http://localhost:8001/app/ (sign in or register on the login page)
- Django admin: http://localhost:8001/admin/
- API docs: http://localhost:8001/swagger/

`migrate` does not run on container start; run it after pulling new migrations. After a change to
`pyproject.toml`, rebuild the images (`docker compose build be unit_tests celery_worker`) and
recreate the containers (`docker compose up -d --force-recreate be`).

Volunteer photos are uploaded to `MEDIA_ROOT` (`media/`, git-ignored), which Django serves only while
`DEBUG=True`. In production, serve that folder from the web server.

## Tests

```bash
docker compose run --rm unit_tests       # Django tests (migrate + `manage.py test apps`), as CI runs them
docker compose exec be python manage.py test apps.incident_manager   # one app, against the running stack
npm install && npm test                  # web app JS tests (Vitest + jsdom), on the host
```

`smsparser/` holds standalone scripts with their own tests; they are not part of the Django suite.

## Layout

| Path | What |
|------|------|
| `apps/incident_manager` | Incidents, need types, providers (API-key intake), the SMS report parser, Division/District/Thana boundaries, the SMS Celery task |
| `apps/events` | Hazard types and events (emergencies operators activate); incidents attach to the active event covering their district |
| `apps/volunteer_hub` | Volunteers (with skills from the need list) and volunteer teams |
| `apps/user` | Custom user model, signup/login (JWT) |
| `apps/common` | Shared helpers and base models |
| `apps/webui` | Web dashboard: templates in `templates/webui/`, JS modules and CSS in `static/webui/` |
| `config/` | Settings, URLs, ASGI app (HTTP + WebSocket), Celery and Gunicorn config |
| `smsparser/` | District/thana spell-correction for SMS text (not yet wired into Django) |

## Operators

Incident data (reporters' phone numbers, locations) and operator actions need a **staff** account
(`is_staff`), because anyone can sign up. Give access in the Django admin (Users → Staff status),
or in a shell: `User.objects.filter(username="...").update(is_staff=True)`. Signed-in accounts
without it can't see incidents; the dashboard and Incidents page show them a "Report incident" panel.

**Anyone with an account can report an incident** (button on the dashboard and the Incidents page).
Every new incident, from the web or from a provider, starts **pending**; staff validate or reject
it. Incidents record their `source` (`provider` or `web`) and, for web reports, `reported_by`.
Non-operators can send 10 reports an hour (`INCIDENT_REPORT_RATE`); operators are not limited.
Throttle counters live in Django's cache (local memory per process by default), so with several
Gunicorn workers the effective limit is per worker until a shared cache (e.g. Redis) is configured.
Every signed-in account is limited to `THROTTLE_RATE` requests an hour (default 1000/hour). The
live dashboard re-fetches after changes, at most once every 2 seconds per open tab.

## APIs

| Method | Path | Who | What |
|---|---|---|---|
| POST | `/api/incidents/` | Provider (`Authorization: Api-Key <key>`; create a Provider in the admin to get one) | Submit an incident. Optional `needs` (codes), `life_threatening`, `people_count`; without `needs` they are read from the SMS keywords in `description`. `validation_status` is ignored: new incidents are always pending |
| POST | `/api/incidents/report/` | Any signed-in user (non-operators 10/hour) | Report an incident from the web app: `description`, `address`, `contact_number` (Bangladeshi mobile, `+880` normalised to `01…`), `latitude`/`longitude` (inside Bangladesh), optional `needs`, `life_threatening`, `people_count`, `district`, `thana` (ids). District/thana: the ones given, else names in SMS keywords, else the boundaries containing the point. Always pending, `source=web`. Responds `{id, validation_status, created_at}`; 429 when limited |
| GET | `/api/incidents/places/` | Any signed-in user | Districts with their thanas (`[{id, name, thanas: [{id, name}]}]`) for the report form |
| GET | `/api/incidents/list/` | Operators | Incidents, newest first, paginated: `{count, next, previous, results}`, 25 per page, `page`, `page_size` (max 500). Filters: `needs=rescue,medical` (any of them), `status`, `task_status` (`closed` = resolved), `event=<id>` or `event=none`, `hazard=<code>`, `life_threatening=true\|false`, `period` (`today` from midnight Bangladesh time, `24h`, `7d`, `event` = attached to an active event), `district`/`thana` (ids), `q` (searches description, address, contact, district, thana and event name). Each result has needs, triage fields, `source`, `district`/`thana` names, `volunteer_count` and `event` with its `hazard`. Bad filter values give 400 |
| GET | `/api/incidents/summary/` | Operators | `{pending, resolved, total}` for the list's filters (status filters ignored, so each dashboard card keeps its count). Resolved = task `closed` |
| GET | `/api/incidents/<id>/` | Operators | One incident: the list fields plus `provider`, `volunteers` (`[{id, full_name, contact_number, photo}]`), `reported_by` (`{id, name}`) and `updated_at` |
| PATCH | `/api/incidents/<id>/` | Operators | Any of `validation_status`, `task_status`, `needs`, `life_threatening`, `people_count`, `event`, `volunteers` (ids; replaces the list); responds with the detail shape. Validating queues the SMS task (still a placeholder: no SMS is sent yet) |
| POST / DELETE | `/api/incidents/<id>/volunteers/` `{volunteer}` · `/api/incidents/<id>/volunteers/<volunteer_id>/` | Operators | Assign one volunteer (assigning twice changes nothing; responds `{volunteer_count}`) · unassign one (204, 404 if not assigned) |
| GET · POST | `/api/incidents/notifications/` · `notifications/seen/` | Operators | The bell: `{unread, results}` (10 newest pending reports since the user last opened it; the last 24 hours the first time) · mark all seen |
| GET | `/api/incidents/need-types/` | Any signed-in user | Active need types (English and Bangla labels, icon, colour) |
| GET | `/api/incidents/places/manage/divisions/` | Operators | Divisions, for the add-district form |
| GET · POST | `/api/incidents/places/manage/districts/` · `thanas/?district=<id>` | Operators | Districts (division, `has_boundary`, thana/incident/volunteer counts) or thanas · add one (`name`, `division` or `district`, optional `boundary`) |
| GET · PATCH · DELETE | `/api/incidents/places/manage/districts/<id>/` · `thanas/<id>/` | Operators | One place with its `boundary` (GeoJSON MultiPolygon or null) · rename or set `boundary` (a GeoJSON Polygon or MultiPolygon in Bangladesh; `null` clears it) · delete (409 while incidents, volunteers or events use it) |
| GET | `/api/events/?active=true` | Operators | Events with their hazard and districts; `active=true` keeps ongoing ones |
| GET | `/api/volunteers/volunteers/` | Operators | All volunteers (active and inactive): phone, `district`/`thana` (`{id, name}`), `photo`, skills, `assigned_incident_count`. Filters: `active`, `district`, `thana`, `q`; `near=lat,lng` lists nearest first and adds `distance_km` |
| GET | `/api/volunteers/summary/` | Operators | `{active, inactive, total}` for `district`, `thana`, `q` |
| | `/api/user/` | Anyone | `signup/`, `login/password/`, `token/refresh/`, `profile/`, password change |

Full schema: `/swagger/`.

## Needs, hazards and events

The platform is hazard-agnostic: **reporters say what help they need, operators say what is
happening.**

- **Need types** (per incident, several allowed): rescue, medical, food, water & sanitation,
  shelter, missing person, safety, damage report, and other (the fallback). Volunteers pick their
  skills from the same list.
- **Hazard types** (per event): flood, cyclone, landslide, fire, boat capsize, epidemic and so on,
  grouped like EM-DAT.
- **Events** are created by operators in the admin (name, hazard, affected districts, start
  date; set an end date when the response is over). A new incident joins the newest active event
  covering its district.

Both type lists are tables you can edit in the admin (labels, SMS keywords, icon, colour, order,
active), seeded by migrations. The lists are a proposal to review with relief-operations people.
See `agent-os/specs/2026-11-04-hazard-agnostic-incident-types/`.

**SMS format:** `NEED#District#Thana#Area#Message`, e.g.
`RESCUE+MEDICAL#Feni#Parshuram#Govt. Primary School#5 people on roof`.
- Several needs are joined with `+` or `,`. Keywords ignore case and can be English, Banglish or
  Bangla (`UDDHAR`, `উদ্ধার`).
- A report is never rejected: without a recognised keyword it gets the fallback need and the
  operator classifies it while validating.
- The old `District#Thana#Area#Message` format still works.
- District and thana are matched by name, ignoring case; misspellings aren't corrected yet (that's
  what `smsparser/` will do).

## Web dashboard

The pages in `apps/webui` are static shells; each loads one ES module (`dashboard.js`,
`incidents.js`, `volunteers.js`, `locations.js`, `login.js`) that checks the login and calls the API through
`api.js`. The JWT is kept in `localStorage`. Bootstrap, Bootstrap Icons and Leaflet load from
jsDelivr; there is no build step. Keep DOM-free logic in modules like `tables.js` and `map.js` so
it can be tested with Vitest.

The Incidents page (`incidents.js`) filters, searches and pages on the server. Its state lives in
the page URL (`/app/incidents/?needs=rescue&status=pending&page=2`), so refresh, Back and shared
links keep the view; `#incident-12` opens that incident's details pop-up. The pure parts are in
`incident-query.js` (URL ↔ filters ↔ API params, pager), `incident-views.js` (rows, cards, chips,
details and the edit form) and `incident-detail.js` (prev/next, deep link, the modal). The
dashboard map asks the list API for one page of up to 500 incidents.

### Live dashboard

`/app/` is three panels:
- **Incidents (left):** the period dropdown; Pending / Resolved / Total cards, which filter the list and the pins; Zilla and Upazilla; search; and the incident cards.
- **Map (centre):** the incident pins, with the Report incident button at its bottom-centre.
- **Volunteers (right):** Active / Inactive / Total cards, the same area filters, search, and the volunteer cards.

Selecting an incident card pans the map and opens its popup, and clicking a pin highlights its card. While an incident is selected, volunteers are listed nearest first, with Assign/Unassign. "View details" opens the shared details pop-up (`incident-modal.js`), whose edit form also assigns volunteers. The state is in the URL: `?period=7d&status=resolved&district=1&selected=12`.

On desktop the side panels collapse to a rail, and the choice is remembered. Under 992px the map fills the screen and bottom tabs switch between Incidents, Map and Volunteers.

Modules:
- `dashboard-query.js`: URL state and API parameters.
- `dashboard-views.js`: cards, popup, count cards, avatars and area dropdowns.
- `dashboard-layout.js`: panels and phone tabs.
- `live.js`: the socket.

**Live updates.** The page opens `/ws/dashboard/` and sends `{"type": "auth", "token": "<JWT>"}` first. The token goes in a message, never in the URL, so it stays out of logs.
- **Operators** get `{"type": "ready"}`, then nudges such as `{"type": "incident.changed", "id": 12}` when an incident or volunteer is saved, deleted or (un)assigned. Signals in `incident_manager/signals.py` send them through `services/broadcast.py` after the transaction commits.
- **Anyone else** is closed with 4401 (not signed in) or 4403 (not an operator).

Nudges carry no data: the page re-fetches through the API, at most once every 2 s. When the socket drops, it reconnects after 1, 2, 4… up to 30 s, then re-fetches. Sockets on different workers reach each other through Redis (`REDIS_URL`, database 1). Tests use an in-memory layer.

Only pages from `ALLOWED_HOSTS` may open the socket. In production, set real host names there, not `*`.

**Navbar.** For operators, the bell counts new pending reports since they last opened it, and pages other than the dashboard open their own socket to keep it current. The Location tab also shows for operators only. Login doesn't return `is_staff`, so both appear when `/notifications/` answers. The avatar menu holds the theme toggle and Sign out.

**Location tab** (`/app/locations/`). Operators add, rename and delete districts and thanas, and upload a GeoJSON boundary, previewed on a small map. Boundaries let web reports find their district and thana from the map pin.
