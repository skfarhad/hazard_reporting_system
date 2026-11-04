---
description: Docker helper commands. Supports all services.
---

# /docker

Action: $ARGUMENTS (start|stop|restart|logs|shell|rebuild|status|db-reset|js-test)

Optional service filter: `--service <name>` or `-s <name>`

The stack is defined in `docker-compose.yaml` at the repo root; run every command from there
(it also reads `.env`; copy `example.env` if it is missing).

Services: `be`, `postgres` (PostGIS), `redis`, `rabbitmq`, `celery_worker`, and `unit_tests` (one-off test runner, used by CI).

- `be` runs `entrypoint_web.sh`: `collectstatic` → Gunicorn (`config.wsgi:application`, `config/gunicorn.conf.py`).
  With `DEBUG=True`, Gunicorn reloads on code and template changes, and static files are served from the app folders.
  It does **not** migrate on start; run `migrate` yourself after pulling new migrations.
- `be` waits for `celery_worker` to be healthy, and the worker waits for `redis`, `rabbitmq` and `postgres`.
- Celery uses RabbitMQ as broker (`CELERY_BROKER_URL`). Tasks live in `apps/*/tasks.py`.
- Code is mounted at `/code` in `be`, `celery_worker` and `unit_tests`. Restart `celery_worker` after changing task code.

The web dashboard is part of `be` (served at http://localhost:8001/app/); there is no separate frontend container.

---

## Commands

### start
```bash
# All services
docker compose up -d
docker compose ps

# Specific service
docker compose up -d <service>
```

### stop
```bash
# All services
docker compose down

# Specific service
docker compose stop <service>
```

### restart
```bash
# All services
docker compose restart
docker compose ps

# Specific service
docker compose restart <service>
```

### logs
```bash
# Django backend
docker compose logs -f be

# Celery worker
docker compose logs -f celery_worker

# Postgres
docker compose logs -f postgres

# All services
docker compose logs -f
```

### shell
```bash
# Django shell
docker compose exec be python manage.py shell

# Django bash
docker compose exec be bash

# Postgres
docker compose exec postgres sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
```

### rebuild
```bash
# All services
docker compose down
docker compose build --no-cache
docker compose up -d
docker compose exec be python manage.py migrate

# Specific service
docker compose build --no-cache <service>
docker compose up -d <service>
```

### status
```bash
docker compose ps
docker compose exec be python manage.py check
docker compose exec be python manage.py showmigrations | grep '\[ \]'
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:8001/admin/
```

### db-reset
Destroys the `postgres_data` volume. Confirm with the user before running.
```bash
docker compose down -v
docker compose up -d
docker compose exec be python manage.py migrate
docker compose exec be python manage.py createsuperuser
```

### js-test
```bash
# Web dashboard JS tests run on the host (the be image has no Node)
npm install   # once
npm test
```

---

## Quick Reference

### Django Backend (be)
| Action | Command |
|--------|---------|
| Start | `docker compose up -d be` |
| Logs | `docker compose logs -f be` |
| Shell | `docker compose exec be python manage.py shell` |
| Bash | `docker compose exec be bash` |
| Test | `docker compose exec be python manage.py test` |
| Migrate | `docker compose exec be python manage.py migrate` |
| Make migrations | `docker compose exec be python manage.py makemigrations` |
| Web dashboard | http://localhost:8001/app/ |
| API docs | http://localhost:8001/swagger/ (also `/redoc/`) |
| Admin | http://localhost:8001/admin/ |

---

## Service Ports

| Service | Internal Port | External Port |
|---------|---------------|---------------|
| Django (be) | 8000 | 8001 |
| Postgres (PostGIS) | 5432 | 5433 |
| RabbitMQ | 5672 | 5672 |
| RabbitMQ UI | 15672 | 15672 |
| Redis | 6379 | (not published) |
