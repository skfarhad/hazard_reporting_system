---
description: Run all quality checks and tests. Verify feature is complete.
---

# /verify

Input: $ARGUMENTS

## Format
```
<slug>
```

---

## Rules
- All checks run inside Docker
- Must pass before marking feature complete
- Update spec with results

### Finding Existing Specs
To find an existing spec folder by slug:
```bash
ls agent-os/specs/ | grep <slug>
```

---

## Steps

### 1. Start Docker Environment
```bash
docker compose -f backend/docker-compose.yml up -d
docker compose -f backend/docker-compose.yml ps  # Verify all services running
```

---

### 2. Django Backend Verification

#### Migrations
```bash
docker compose -f backend/docker-compose.yml exec be python manage.py migrate
docker compose -f backend/docker-compose.yml exec be python manage.py check
docker compose -f backend/docker-compose.yml exec be python manage.py showmigrations --list
```

#### Linting (if configured)
No linter/formatter/type checker is in `pyproject.toml` yet. If `ruff`, `black` or `mypy`
gets added, run it here; otherwise skip and say so in the report.

#### Unit Tests
```bash
docker compose -f backend/docker-compose.yml exec be python manage.py test
```

#### Coverage (if `coverage` is installed)
```bash
docker compose -f backend/docker-compose.yml exec be coverage run manage.py test && docker compose -f backend/docker-compose.yml exec be coverage report
```

---

### 3. E2E / Smoke Checks

There is no E2E suite. Smoke-test the running server instead:
```bash
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:8001/admin/  # /admin/ is the compose healthcheck endpoint
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8001/swagger/
```

---

### 4. Manual Verification

- Check Docker logs: `docker compose -f backend/docker-compose.yml logs be --tail=100`
- Access API docs: http://localhost:8001/swagger/
- Test key endpoints manually

---

### 5. Update Spec Docs

Update `agent-os/specs/<YYYY-MM-DD>-<slug>/spec.md`:
- Record verification results
- Mark Success Criteria items as verified

Update `agent-os/specs/<YYYY-MM-DD>-<slug>/tasks.md`:
- Note verification status
- Record any issues found

---

## Output

```
## Verification Results

### Django Backend
| Check | Status |
|-------|--------|
| Migrations | ✓ / ✗ |
| Django check | ✓ / ✗ |
| Linting | ✓ / ✗ |
| Type check | n/a (none configured) |
| Unit tests | ✓ X/Y passed |
| Coverage | X% |

### Smoke Checks
| Check | Status |
|-------|--------|
| /admin/ | ✓ / ✗ |
| /swagger/ | ✓ / ✗ |

### Summary
- All checks: ✓ Passing / ✗ X failures
- Feature status: Verified / Needs fixes

### Issues Found
- (none or list with severity)

### Next Steps
- /merge-to <target> - Merge to target branch (if verified)
- /submit <slug> - Final submission
```
