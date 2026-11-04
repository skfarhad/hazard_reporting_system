---
description: Initialize coding standards for this project. Sets conventions for Django/DRF using agent-os/standards/.
---

# /init-standards

## Rules
- Run once per project (or when standards need updating)
- Creates/updates standards docs in `agent-os/standards/`
- Interview user for preferences if not specified

---

## Steps

### 1. Check Existing Standards

Check if `agent-os/standards/` already exists with structure:
```
agent-os/standards/
├── backend/
│   ├── api.md
│   ├── migrations.md
│   ├── models.md
│   └── python-django.md
├── frontend/
│   ├── accessibility.md
│   ├── components.md
│   └── css.md
├── global/
│   ├── coding-style.md
│   ├── conventions.md
│   ├── error-handling.md
│   ├── tech-stack.md
│   └── validation.md
├── testing/
│   └── test-writing.md
└── index.yml
```

If exists, ask: "Standards exist. Update specific sections? Or full refresh?"

---

### 2. Interview for Preferences (if not already defined)

**General:**
- Line length: 80 (CONTRIBUTING.md); confirm or change?
- Any existing linters/formatters in use?

**Python (Django):**
- Indentation: spaces (4)?
- Quotes: single or double?
- Docstring style: Google, NumPy, Sphinx?
- Type hints: strict or optional?

---

### 3. Create/Update Standards Structure

#### 3.1 Create `agent-os/standards/index.yml`

```yaml
# Agent OS Standards Index

backend:
  api:
    description: REST API design patterns and conventions
  migrations:
    description: Database migration best practices
  models:
    description: Django model patterns and conventions
  python-django:
    description: Python and Django coding standards

frontend:
  accessibility:
    description: Accessibility (a11y) requirements
  components:
    description: Component architecture patterns
  css:
    description: CSS/styling conventions

global:
  coding-style:
    description: General code style across all languages
  conventions:
    description: Naming and structural conventions
  error-handling:
    description: Error handling patterns
  tech-stack:
    description: Technology stack decisions
  validation:
    description: Input validation patterns

testing:
  test-writing:
    description: Test writing patterns and coverage requirements
```

#### 3.2 `agent-os/standards/global/coding-style.md`

```markdown
# General Coding Standards

## All Languages
- Max line length: 80 (per CONTRIBUTING.md)
- Use meaningful variable names
- Prefer explicit over implicit

## Error Handling
- Always handle errors explicitly
- Log errors with context
- Use custom exceptions where appropriate

## Logging
- Use structured logging
- Include request IDs for tracing
- Log levels: DEBUG, INFO, WARNING, ERROR
```

#### 3.3 `agent-os/standards/backend/python-django.md`

```markdown
# Django Standards

## Models
- Add `__str__` method to all models
- Use `related_name` for ForeignKey/M2M

## Views/APIs
- Use DRF ViewSets for CRUD
- Filter querysets by user for IDOR protection

## Python version
- The image runs Python 3.8: no `match`, no `X | Y` type unions, no builtin generics like `list[int]` at runtime

## Geo
- Locations are GeoDjango `PointField`s on PostGIS; build them as `Point(lon, lat, srid=4326)`

## Background Tasks
- Use Celery `@shared_task` in `apps/{app}/tasks.py` (broker: RabbitMQ)
- Pass IDs, not model instances; tasks must be idempotent
- Trigger from signals/views with `.delay()`; patch `.delay` in tests
- Handle retries explicitly
```

#### 3.4 `agent-os/standards/backend/api.md`

```markdown
# API Standards

## REST Conventions
- Use plural nouns for resources
- Use HTTP methods correctly (GET, POST, PUT, PATCH, DELETE)
- Return appropriate status codes

## Authentication
- JWT (simplejwt) for user authentication
- `djangorestframework-api-key` (`HasAPIKey`, header `Authorization: Api-Key <key>`) for providers posting incidents
- Document endpoints with `drf_yasg` `@swagger_auto_schema`

## Response Format
- Use consistent response structure
- Include pagination for lists

## Error Responses
- Include error code and message
- Provide helpful error details in development
```

#### 3.5 `agent-os/standards/testing/test-writing.md`

```markdown
# Testing Standards

## Django Tests
- Location: `backend/apps/<app>/tests/`
- Use `TestCase` for DB tests
- Create test data in `setUp` (as the existing tests do); fixtures optional
- Run: `docker compose -f backend/docker-compose.yml exec be python manage.py test`

## Web App (web_app/hrs_map)
- No test runner yet; `npm run lint` and `npm run build` must pass
- Don't call the live backend in builds; sample data lives in `public/fake_incident_response.json`
```

#### 3.6 `agent-os/standards/global/conventions.md`

```markdown
# Conventions

## Branch Naming
- Features: `feat/<slug>`
- Bugfixes: `bugfix/<slug>`
- Refactors: `refactor/<slug>`

## Commit Messages
- Features: `feat(<slug>): <description>`
- Bugfixes: `fix(<slug>): <description>`
- Refactors: `refactor(<slug>): <description>`
- Chores: `chore: <description>`

## Spec Organization
- Location: `agent-os/specs/<YYYY-MM-DD>-<slug>/`
- Contains: spec.md, tasks.md, planning/

## PR Guidelines
- Link to spec
- Include test plan
- Tag reviewers
```

---

### 4. Update CLAUDE.md

Add reference to standards:
```markdown
## Standards
See `agent-os/standards/` for coding conventions:
- `index.yml` - Standards index
- `global/` - Cross-language standards
- `backend/` - Django patterns
- `testing/` - Test patterns
```

---

## Output

```
## Standards Initialized

### Files Created/Updated
- [x] agent-os/standards/index.yml
- [x] agent-os/standards/global/coding-style.md
- [x] agent-os/standards/global/conventions.md
- [x] agent-os/standards/backend/python-django.md
- [x] agent-os/standards/backend/api.md
- [x] agent-os/standards/testing/test-writing.md

### Conventions Set
| Language | Formatter | Linter |
|----------|-----------|--------|
| Python | none configured (PEP 8, 80 cols per CONTRIBUTING.md) | none configured |
| TypeScript (web_app/hrs_map) | prettier | eslint (`next lint`) |

### Next Steps
- /execute <slug> - Standards will be applied
- /verify <slug> - Will check against standards
- /query "standards" - Search standards
```
