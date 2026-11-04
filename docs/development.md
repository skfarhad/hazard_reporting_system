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
| `apps/incident_manager` | Incidents, providers (API-key intake), Division/District/Thana boundaries, the SMS Celery task |
| `apps/volunteer_hub` | Volunteers and volunteer teams |
| `apps/user` | Custom user model, signup/login (JWT) |
| `apps/common` | Shared helpers and base models |
| `apps/webui` | Web dashboard: templates in `templates/webui/`, JS modules and CSS in `static/webui/` |
| `config/` | Settings, URLs, Celery and Gunicorn config |
| `smsparser/` | District/thana spell-correction for SMS text (not yet wired into Django) |

## APIs

- `POST /api/incidents/` — providers submit incidents, header `Authorization: Api-Key <key>`
  (create a Provider in the admin to get a key).
- `GET /api/incidents/list/` — newest 500 incidents, for signed-in users (JWT).
- `GET /api/volunteers/volunteers/` — active volunteers.
- `/api/user/` — `signup/`, `login/password/`, `token/refresh/`, `profile/`, password change.

## Web dashboard

The pages in `apps/webui` are static shells; each loads one ES module (`dashboard.js`,
`incidents.js`, `volunteers.js`, `login.js`) that checks the login and calls the API through
`api.js`. The JWT is kept in `localStorage`. Bootstrap, Bootstrap Icons and Leaflet load from
jsDelivr; there is no build step. Keep DOM-free logic in modules like `tables.js` and `map.js` so
it can be tested with Vitest.
