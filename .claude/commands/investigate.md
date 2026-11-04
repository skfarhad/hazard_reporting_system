# /investigate - End-to-End Root Cause Analysis

Perform comprehensive investigation across the project to identify root causes.

## Usage

```
/investigate <environment> [token] [problem_description]
```

## Parameters

- **environment** (required): `local` for now (http://localhost:8001, the Docker `be` service).
  There is no production deployment documented in this repo; if the user names one, ask for its URL and how to reach its logs.
- **token** (optional): either a JWT access token (`POST /api/user/token/get/`) for user endpoints,
  or a provider API key (sent as `Authorization: Api-Key <key>`) for the incident API
- **problem_description** (optional): Brief description of the issue

## Examples

```
/investigate local
/investigate local <provider-api-key> "incident POST returns 403"
/investigate local eyJ... "profile endpoint returns 401"
/investigate local "validated incidents never trigger the SMS task"
```

## What This Command Does

1. **Environment Setup**: Confirms the stack is up (`docker compose ps`), all services healthy
2. **Health Check**: `GET /admin/` (compose healthcheck), `GET /swagger.json`, `POST /api/user/token/verify/`
3. **Incident intake**: `POST /api/incidents/` (`IncidentCreateView`, `HasAPIKey`, no user auth) — provider API key, serializer errors, lat/long → `PointField`
4. **Incident pipeline**: `pre_save` signal in `apps/incident_manager/signals.py` queues `process_incident_and_send_sms` when `validation_status` becomes `validated` — check the worker received and ran it
5. **Volunteers**: `GET /api/volunteers/volunteers/` (`apps/volunteer_hub`), teams, locations
6. **Users / auth**: JWT (simplejwt), password login/signup/OTP in `apps/user/apis_auth.py`, Firebase phone verification in `apps/user/fb_auth.py`
7. **SMS parser**: `smsparser/` (district/thana spell correction models) — standalone scripts, not a Django app
8. **Database Queries**: Inspect `Incident`, `Provider`, `Division`/`District`/`Thana`, `Volunteer`, `VolunteerTeam`, `User` rows directly
9. **Recovery Actions**: Suggest admin fixes, task re-queues, data corrections
10. **Report Generation**: Produces structured root cause analysis

## Investigation Flow

```
┌─────────────────┐
│ Health Check    │ → Containers healthy? /admin/ responding? Token / API key valid?
└────────┬────────┘
         │
┌────────▼────────┐
│ API Layer       │ → Permission classes (HasAPIKey vs IsAuthenticated), throttling (THROTTLE_RATE), serializer errors
└────────┬────────┘
         │
┌────────▼────────┐
│ App Logs        │ → docker compose logs be — tracebacks, patterns
└────────┬────────┘
         │
┌────────▼────────┐
│ Background work │ → celery_worker logs, RabbitMQ queue depth, signal fired?
└────────┬────────┘
         │
┌────────▼────────┐
│ Integrations    │ → Firebase (phone auth), SMS gateway / telecom providers
└────────┬────────┘
         │
┌────────▼────────┐
│ Database        │ → PostGIS geometry valid? Orphaned rows? Migration state?
└────────┬────────┘
         │
┌────────▼────────┐
│ Root Cause      │ → Identify cause with accuracy %
│ Report          │ → Recommend fixes
└─────────────────┘
```

## Useful Commands

```bash
docker compose ps
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:8001/admin/
curl -s -X POST -H 'Content-Type: application/json' -d "{\"token\": \"$TOKEN\"}" http://localhost:8001/api/user/token/verify/
curl -s -X POST -H "Authorization: Api-Key $API_KEY" -H 'Content-Type: application/json' -d '{...}' http://localhost:8001/api/incidents/
curl -s http://localhost:8001/api/volunteers/volunteers/
docker compose logs --tail=200 be
docker compose logs --tail=200 celery_worker
docker compose exec rabbitmq rabbitmqctl list_queues
docker compose exec be python manage.py showmigrations --list
docker compose exec be python manage.py shell
```

Never print secrets (`DJANGO_SECRET_KEY`, provider API keys, Firebase credentials, `POSTGRES_PASSWORD`) into the report.
Read-only by default — confirm with the user before writing to the database or re-queuing tasks.

## Output Format

The investigation produces a structured report:

```markdown
# Root Cause Analysis Report

## Environment: local
## Investigation Date: YYYY-MM-DD

## Affected Data Summary
| Entity | ID | State | Notes |
|--------|----|-------|-------|

## Root Causes (Sorted by Accuracy)
### #1: [Cause] (99% accuracy)
### #2: [Cause] (95% accuracy)

## Immediate Actions Required
1. [ ] Action 1
2. [ ] Action 2

## Available Recovery Paths
- Django admin: /admin/ (Incident, Provider, Volunteer, VolunteerTeam, User)
- Re-queue task: `process_incident_and_send_sms.delay(<incident_id>)` from the Django shell
- Token refresh: POST /api/user/token/refresh/
```

## Common Issues Detected

| Issue | Detection Method | Fix |
|-------|------------------|-----|
| Expired JWT | `token/verify/` returns 401 | Refresh token / re-login |
| Incident POST 403 | Missing/invalid `Authorization: Api-Key <key>` header | Use the provider's key; check `Provider.api_key` |
| Throttled requests | 429 responses | Raise `THROTTLE_RATE` in `.env` |
| Task never runs | Nothing in `celery_worker` logs; queue growing | Check worker health, `CELERY_BROKER_URL`, restart `celery_worker` |
| Signal didn't fire | Status changed via `QuerySet.update()` (bypasses `pre_save`) | Save through the model instance |
| Bad location | lat/long swapped (`Point(lon, lat)`) | Fix the serializer/caller |
| `be` never starts | `depends_on` chain: worker/rabbitmq unhealthy | Check `celery_worker` and `rabbitmq` health first |
| Migration drift | `showmigrations` shows unapplied | Run `migrate` (not automatic on `be` start) |
