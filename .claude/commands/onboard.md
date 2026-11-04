---
description: Onboard project. Reads scope docs and sets up agent-os structure.
---

# /onboard

## Step 0: Check if Already Onboarded

**Run these checks IN PARALLEL:**

1. Check `CLAUDE.md` exists and has "## Stack" section
2. Check `agent-os/product/roadmap.md` exists
3. Check `agent-os/standards/index.yml` exists
4. Check `agent-os/config.yml` exists

**If ALL exist:**
```
✓ Already onboarded. Skipping.

To refresh docs, run: /re-onboard
To check project status, run: /query "current status"
```
**Exit early - do not proceed.**

**If ANY missing:** Continue with Step 1.

---

## Step 1: Repo Discovery (Parallel)

### Batch A: Core Config Files
```
PARALLEL:
- Read: README.md, backend/README.md, CONTRIBUTING.md
- Read: backend/pyproject.toml
- Read: backend/docker-compose.yml
- Read: backend/example.env
- Read: web_app/hrs_map/package.json
- Read: .github/workflows/django.yml
```

### Batch B: Structure Discovery
```
PARALLEL:
- List: backend/apps/
- List: backend/config/
- List: backend/incident_manager/smsparser/
- List: web_app/hrs_map/
- List: dev_ops_pipeline/
- List: scope/
```

### Batch C: Scope Documents (Product Context)
```
PARALLEL:
- List: scope/*.md (discover all scope documents)
- Read: ALL .md files found in scope/ folder
- This repo has no `scope/` folder yet. If it is missing, use `README.md` (problem statement, goals, tech stack),
  `CONTRIBUTING.md`, `backend/README.md`, `dev_ops_pipeline/*.md` and `architechture_roadmap.drawio` instead
```

Known scope documents (read if present):
- `scope/scope.md` - Project goals and features
- `scope/prd.md` - Product requirements
- `scope/ui_user_flow.md` - UI screens and flow
- `scope/mvp_checklist.md` - MVP phases
- Any other `.md` files discovered

---

## Step 2: Understand Product Context

From scope documents, extract:

### From scope/prd.md
- Product overview and problem statement
- Target users
- Core user flow
- Functional requirements
- Non-functional requirements
- Explicit non-goals

### From scope/ui_user_flow.md
- Design principles
- Screen-by-screen flow
- UI elements per screen
- Error states

### From scope/mvp_checklist.md
- MVP phases and tasks
- Current progress status

### From scope/scope.md
- Goals (primary and secondary)
- Out of scope items
- Feature list
- Success criteria

---

## Step 3: Identify Services

| Service | Path | Stack | Port |
|---------|------|-------|------|
| Django Backend (`be`) | `backend/apps/`, `backend/config/` | Python 3.8, Django 4.2, DRF, GeoDjango, Gunicorn | 8001 |
| Postgres (`postgres`) | — | PostGIS | 5433 |
| Celery Worker (`celery_worker`) | `backend/config/celery.py`, `backend/apps/*/tasks.py` | Celery on RabbitMQ | N/A |
| RabbitMQ (`rabbitmq`) | — | RabbitMQ 3 + management UI | 5672 / 15672 |
| Live map (`web_app`) | `web_app/hrs_map/` | Next.js 14, TypeScript, Tailwind, Mapbox GL, next-auth | 3001 |
| SMS parser | `backend/incident_manager/smsparser/` | Standalone spell-correction scripts (districts/thanas) | N/A |

---

## Step 4: Update CLAUDE.md

Create/update with:
- Product overview (from scope/prd.md)
- Stack overview (all services)
- Docker commands per service
- Test commands per service
- Migration commands
- Project structure

---

## Step 5: Setup agent-os structure

Ensure directories exist:
- `agent-os/`
- `agent-os/product/`
- `agent-os/specs/`
- `agent-os/standards/`

Create `agent-os/config.yml` if missing:
```yaml
version: 3.0
last_compiled: <today>

# ================================================
# Project - Agent OS Configuration
# ================================================
profile: default
product_name: <project-name>
product_type: <project-type>
description: <project description from scope docs>
```

---

## Step 6: Initialize Product Roadmap

Create `agent-os/product/roadmap.md` from scope documents:
- Import phases from `scope/mvp_checklist.md`
- Import features from `scope/scope.md`
- Import user flow from `scope/ui_user_flow.md`
- Map to implementation tasks

---

## Step 7: Verify Docker Setup

```bash
# Build all services
docker compose -f backend/docker-compose.yml build

# Start all services
docker compose -f backend/docker-compose.yml up -d

# Check service status
docker compose -f backend/docker-compose.yml ps

# Verify Django
docker compose -f backend/docker-compose.yml exec be python manage.py check
docker compose -f backend/docker-compose.yml exec be python manage.py migrate
```

---

## Step 8: Verify Test Harnesses

### Django Tests
```bash
docker compose -f backend/docker-compose.yml exec be python manage.py test
```

If no tests exist, note as blocker.

---

## Step 9: Check agent-os Standards

Verify `agent-os/standards/` structure exists.

If missing, recommend running `/init-standards`.

---

## Step 10: Document Workflow

Add to CLAUDE.md:
- Branch naming: `feat/<slug>`, `bugfix/<slug>`, `refactor/<slug>`
- Local commits only
- E2E testing with Docker
- Spec location: `agent-os/specs/<YYYY-MM-DD>-<slug>/`

---

## Output

```
## Onboard Complete

### Product: <project-name>
<product description from scope docs>

### Scope Documents Loaded
(List all .md files discovered in scope/ folder)
- [x] scope/scope.md - Project goals and features
- [x] scope/prd.md - Product requirements
- [x] scope/ui_user_flow.md - UI screens and flow
- [x] scope/mvp_checklist.md - MVP phases
- [x] (any other .md files found)

### Services Discovered
| Service | Status | Tests |
|---------|--------|-------|
| Django Backend | ✓ Running | ✓ X tests |
| Postgres | ✓ Running | - |

### Docker Status
- All services: [running/issues]
- Ports: 8001 (Django)

### Agent OS Structure
- [x] agent-os/config.yml
- [x] agent-os/product/roadmap.md
- [x] agent-os/standards/index.yml
- [x] agent-os/specs/

### Blockers
- (list any issues)

### Next Steps
- /query "<topic>" - Explore codebase
- /init-project-roadmap - Create/update roadmap from scope docs
- /init-standards - Setup coding standards
```
