# Development

Everything runs in Docker Compose from the repo root. Python code and templates are mounted into
the containers, and Gunicorn reloads on changes while `DEBUG=True`.

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

`migrate` does not run on container start; run it after pulling new migrations.

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
| `config/` | Settings, URLs, Celery and Gunicorn config |
| `smsparser/` | District/thana spell-correction for SMS text (not yet wired into Django) |

## Operators

Incident data (reporters' phone numbers, locations) and operator actions need a **staff** account
(`is_staff`), because anyone can sign up. Give access in the Django admin (Users → Staff status),
or in a shell: `User.objects.filter(username="...").update(is_staff=True)`. Signed-in accounts
without it see "Your account isn't an operator yet" on the dashboard.

## APIs

| Method | Path | Who | What |
|---|---|---|---|
| POST | `/api/incidents/` | Provider (`Authorization: Api-Key <key>`; create a Provider in the admin to get one) | Submit an incident. Optional `needs` (codes), `life_threatening`, `people_count`; without `needs` they are read from the SMS keywords in `description` |
| GET | `/api/incidents/list/` | Operators | Incidents, newest first, paginated: `{count, next, previous, results}`, 25 per page, `page`, `page_size` (max 500). Filters: `needs=rescue,medical` (any of them), `status`, `event=<id>` or `event=none`, `hazard=<code>`, `life_threatening=true\|false`, `q` (searches description, address, contact, district, thana and event name). Each result has needs, triage fields and `event` with its `hazard`. Bad filter values give 400 |
| GET | `/api/incidents/<id>/` | Operators | One incident: the list fields plus `district`, `thana`, `provider`, `volunteer` and `updated_at` |
| PATCH | `/api/incidents/<id>/` | Operators | Any of `validation_status`, `task_status`, `needs`, `life_threatening`, `people_count`, `event`; responds with the detail shape. Validating queues the SMS task (still a placeholder: no SMS is sent yet) |
| GET | `/api/incidents/need-types/` | Operators | Active need types (English and Bangla labels, icon, colour) |
| GET | `/api/events/?active=true` | Operators | Events with their hazard and districts; `active=true` keeps ongoing ones |
| GET | `/api/volunteers/volunteers/` | Anyone | Active volunteers with their skills |
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
`incidents.js`, `volunteers.js`, `login.js`) that checks the login and calls the API through
`api.js`. The JWT is kept in `localStorage`. Bootstrap, Bootstrap Icons and Leaflet load from
jsDelivr; there is no build step. Keep DOM-free logic in modules like `tables.js` and `map.js` so
it can be tested with Vitest.

The Incidents page (`incidents.js`) filters, searches and pages on the server. Its state lives in
the page URL (`/app/incidents/?needs=rescue&status=pending&page=2`), so refresh, Back and shared
links keep the view; `#incident-12` opens that incident's details pop-up. The pure parts are in
`incident-query.js` (URL ↔ filters ↔ API params, pager), `incident-views.js` (rows, cards, chips,
details and the edit form) and `incident-detail.js` (prev/next, deep link, the modal). The
dashboard map asks the list API for one page of up to 500 incidents.
