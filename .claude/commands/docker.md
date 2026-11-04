---
description: Docker helper commands. Supports all services.
---

# /docker

Action: $ARGUMENTS (start|stop|restart|logs|shell|rebuild|status|db-reset|web)

Optional service filter: `--service <name>` or `-s <name>`

The backend stack is defined in `backend/docker-compose.yml`, so run every command from the repo root with
`-f backend/docker-compose.yml` (it also reads `backend/.env`; copy `backend/example.env` if it is missing).

Services: `be`, `postgres` (PostGIS), `redis`, `rabbitmq`, `celery_worker`, and `unit_tests` (one-off test runner, used by CI).

- `be` runs `entrypoint_web.sh`: `collectstatic` → Gunicorn (`config.wsgi:application`, `config/gunicorn.conf.py`).
  It does **not** migrate on start; run `migrate` yourself after pulling new migrations.
- `be` waits for `celery_worker` to be healthy, and the worker waits for `redis`, `rabbitmq` and `postgres`.
- Celery uses RabbitMQ as broker (`CELERY_BROKER_URL`). Tasks live in `apps/*/tasks.py`.
- Code is mounted at `/code` in `be`, `celery_worker` and `unit_tests`. Restart `celery_worker` after changing task code.

The Next.js live map (`web_app/hrs_map`) has its own compose file: `web_app/docker-compose.yml` (see `web` below).

---

## Commands

### start
```bash
# All services
docker compose -f backend/docker-compose.yml up -d
docker compose -f backend/docker-compose.yml ps

# Specific service
docker compose -f backend/docker-compose.yml up -d <service>
```

### stop
```bash
# All services
docker compose -f backend/docker-compose.yml down

# Specific service
docker compose -f backend/docker-compose.yml stop <service>
```

### restart
```bash
# All services
docker compose -f backend/docker-compose.yml restart
docker compose -f backend/docker-compose.yml ps

# Specific service
docker compose -f backend/docker-compose.yml restart <service>
```

### logs
```bash
# Django backend
docker compose -f backend/docker-compose.yml logs -f be

# Celery worker
docker compose -f backend/docker-compose.yml logs -f celery_worker

# Postgres
docker compose -f backend/docker-compose.yml logs -f postgres

# All services
docker compose -f backend/docker-compose.yml logs -f
```

### shell
```bash
# Django shell
docker compose -f backend/docker-compose.yml exec be python manage.py shell

# Django bash
docker compose -f backend/docker-compose.yml exec be bash

# Postgres
docker compose -f backend/docker-compose.yml exec postgres sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
```

### rebuild
```bash
# All services
docker compose -f backend/docker-compose.yml down
docker compose -f backend/docker-compose.yml build --no-cache
docker compose -f backend/docker-compose.yml up -d
docker compose -f backend/docker-compose.yml exec be python manage.py migrate

# Specific service
docker compose -f backend/docker-compose.yml build --no-cache <service>
docker compose -f backend/docker-compose.yml up -d <service>
```

### status
```bash
docker compose -f backend/docker-compose.yml ps
docker compose -f backend/docker-compose.yml exec be python manage.py check
docker compose -f backend/docker-compose.yml exec be python manage.py showmigrations | grep '\[ \]'
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:8001/admin/
```

### db-reset
Destroys the `postgres_data` volume. Confirm with the user before running.
```bash
docker compose -f backend/docker-compose.yml down -v
docker compose -f backend/docker-compose.yml up -d
docker compose -f backend/docker-compose.yml exec be python manage.py migrate
docker compose -f backend/docker-compose.yml exec be python manage.py createsuperuser
```

### web
```bash
# Next.js live map (needs web_app/hrs_map/.env)
docker compose -f web_app/docker-compose.yml up -d --build
docker compose -f web_app/docker-compose.yml logs -f nextjs

# Or on the host
cd web_app/hrs_map && npm install && npm run dev
```

---

## Quick Reference

### Django Backend (be)
| Action | Command |
|--------|---------|
| Start | `docker compose -f backend/docker-compose.yml up -d be` |
| Logs | `docker compose -f backend/docker-compose.yml logs -f be` |
| Shell | `docker compose -f backend/docker-compose.yml exec be python manage.py shell` |
| Bash | `docker compose -f backend/docker-compose.yml exec be bash` |
| Test | `docker compose -f backend/docker-compose.yml exec be python manage.py test` |
| Migrate | `docker compose -f backend/docker-compose.yml exec be python manage.py migrate` |
| Make migrations | `docker compose -f backend/docker-compose.yml exec be python manage.py makemigrations` |
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
| Next.js map (`web_app`) | 3000 | 3001 |
