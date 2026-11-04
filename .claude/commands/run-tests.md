---
description: Run tests for this project with Django's test runner. Mandatory after /execute.
---

# /run-tests

Input: $ARGUMENTS

## Format
```
<slug>
```

---

## Rules
- Read `agent-os/specs/<YYYY-MM-DD>-<slug>/spec.md` Test plan (if slug provided)
- Update tasks.md with test results
- All tests run inside Docker (`be` service)
- Use `python manage.py test` — `pytest` and `pytest-django` are not installed, so bare `pytest` won't work
- Never call real external services in tests (Firebase, SMS gateways / telecom provider APIs, email) — mock them
- Celery tasks: call the function directly or patch `.delay`; don't depend on the worker running
- **MANDATORY** - Must run after `/execute` completes

### Finding Existing Specs
To find an existing spec folder by slug:
```bash
ls agent-os/specs/ | grep <slug>
```

---

## Steps

### 1. Read Spec Test Plan (if slug provided)

Check `agent-os/specs/<YYYY-MM-DD>-<slug>/spec.md` for:
- Required test types
- Specific test scenarios
- Coverage requirements

---

### 2. Run Django Backend Tests

```bash
# All tests
docker compose exec be python manage.py test

# Faster local reruns (parallel, reuse test DB)
docker compose exec be python manage.py test --parallel auto --keepdb

# Specific app
docker compose exec be python manage.py test apps.<app>

# Specific module / class / method (dotted paths)
docker compose exec be python manage.py test apps.<app>.tests.test_<module>
docker compose exec be python manage.py test apps.<app>.tests.test_<module>.<Class>
docker compose exec be python manage.py test apps.<app>.tests.test_<module>.<Class>.test_<method>

# Stop at first failure
docker compose exec be python manage.py test --failfast apps.<app>
```

> After a migration changes the schema, a `--keepdb` test DB is stale: drop
> `--keepdb` once to force a rebuild.

**Test locations:**
- Apps live in `apps/`; test labels are relative to the repo root (the container's `/code`)
- Apps with a `tests/` package (`apps/incident_manager`, `apps/volunteer_hub`): `apps/<app>/tests/test_<module>.py`
- Apps with a single `tests.py` (`apps/common`, `apps/user`): add to `tests.py`, or convert it to a `tests/` package (with `__init__.py`) when it grows
- Existing examples: `apps/incident_manager/tests/test_create_incidents.py` (API-key auth via `APIClient.credentials`), `apps/incident_manager/tests/test_model_validation.py`, `apps/volunteer_hub/tests/test_team.py`
- CI (`.github/workflows/django.yml`) runs `docker compose run --rm unit_tests`, i.e. `run_tests.sh` (`migrate` + `test apps`), plus `npm test` in a `webui` job
- `smsparser/tests.py` is outside the Django apps and is not picked up by `manage.py test`

---

### 3. Create Test Fixtures (if needed)

```python
[
  {
    "model": "app.Model",
    "pk": 1,
    "fields": { ... }
  }
]
```

---

### 4. Implement Missing Tests

#### Django Unit Test Template
```python
from unittest.mock import patch

from django.test import TestCase
from rest_framework.test import APIClient


class <Feature>Tests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_<scenario>(self):
        pass
```

Typical things to mock: `firebase_admin.auth` (`apps/user/fb_auth.py`), `process_incident_and_send_sms.delay` (`apps/incident_manager/tasks.py`), any SMS/telecom HTTP calls.
Use `django.contrib.gis.geos.Point(lon, lat)` for locations.

---

### 5. Run Full Test Suite

```bash
docker compose exec be python manage.py test
```

---

### 6. Update Spec and Tasks

Update `agent-os/specs/<YYYY-MM-DD>-<slug>/tasks.md`:
- Mark testing tasks complete
- Record test counts and results

Update `agent-os/specs/<YYYY-MM-DD>-<slug>/spec.md`:
- Add test file paths to Testing Strategy section
- Record coverage metrics if available

---

## Output

```
## Test Results

### Django Backend
- Tests run: X
- Passed: X
- Failed: X

### Summary
- Status: ✓ All passing / ✗ X failures

### Next Steps
- /verify <slug> - Run full verification
- /merge-to <target> - Merge to target branch (only if the suite passes)
```
