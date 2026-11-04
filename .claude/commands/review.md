# Code Review Command

Perform comprehensive code review following project standards.

## Review Focus

1. **Architecture**: App boundaries (`incident_manager`, `volunteer_hub`, `user`, `common`), thin views, logic in models/tasks
2. **Security**: API-key vs JWT permissions, IDOR, phone-number/PII handling, OWASP Top 10
3. **Code Quality**: PEP 8, SOLID, DRY/KISS/YAGNI
4. **Django/DRF/GeoDjango**: Models (indexes, `PointField` SRID), Serializers, APIViews/ViewSets, `drf_yasg` docs, signals, Celery tasks
5. **Performance**: DB optimization, N+1 queries, caching
6. **Testing**: Coverage, mocking, AAA pattern

## Process

1. Read `CLAUDE.md` for project context
2. Examine changed files thoroughly
3. Check pattern adherence against codebase standards
4. Verify security requirements (API keys, JWT, input validation)
5. Assess performance implications
6. Review test coverage
7. Provide specific file:line feedback with code examples

## Output Format

```markdown
## Code Review Summary

### ✅ Strengths
- [Positive aspects]

### ⚠️ Issues

#### 🔴 Critical (Must Fix)
- **file.py:123**: Issue → Fix

#### 🟡 Important (Should Fix)
- **file.py:456**: Issue → Solution

#### 🔵 Suggestions
- **file.py:789**: Current → Better

### 📊 Metrics
- Files: X | Security: X critical, X important
- Pattern compliance: X% | Tests: [status]

### ✅ Decision
- [ ] Ready to merge
- [ ] Approve with changes
- [ ] Request changes
```

## Key Patterns to Check

**Python 3.8**: The `be` image is `python:3.8-slim`. No `match`, no `X | Y` unions, no `list[int]`-style builtin generics at runtime, no 3.9+ stdlib APIs.

**Security**: Correct permission class per endpoint (`HasAPIKey` for provider incident intake, `IsAuthenticated` + JWT for users; the DRF default requires both), querysets filtered for IDOR, phone numbers and locations treated as PII (not logged), input validation (model + serializer), no hardcoded secrets

**Models**: `__str__`, indexes on lookup fields, `related_name` on FKs, `created_at`/`updated_at`, migrations included, choices from the `Enum`s in `constants.py` (`IncidentStatus.choices()`)

**Geo**: `PointField` built as `Point(lon, lat, srid=4326)`; distance queries use PostGIS lookups, not Python loops

**APIs**: `@swagger_auto_schema` on new endpoints, proper HTTP codes, pagination (`LimitOffsetPagination`, `apps/common/helpers.get_paginated`), throttling left on

**Signals and tasks**: `apps/incident_manager/signals.py` reacts to `validation_status` changes on `pre_save`; Celery `@shared_task`s take IDs, are idempotent, and are mocked/patched (`.delay`) in tests. Watch for `QuerySet.update()` bypassing signals, and for extra queries in `pre_save`.

**Web dashboard** (`apps/webui`): all API/SMS text goes through `escapeHtml` before `innerHTML`, API calls go through `api.js`, no secrets in templates or JS, CDN assets pinned to exact versions, Vitest tests for new logic (`npm test`)

## Critical Issues (Auto-fail)

**Hardcoded status strings**: Use the enums in `apps/incident_manager/constants.py` instead of literals.

```python
# 🔴 CRITICAL - Hardcoded strings
if incident.validation_status == "validated": ...

# ✅ CORRECT - Use constants
from apps.incident_manager.constants import IncidentStatus
if incident.validation_status == IncidentStatus.VALIDATED.value: ...
```

**Real external calls in tests**: Firebase, SMS/telecom APIs or email called for real in a test.

Be constructive and specific. Prioritize security and patterns over style.
