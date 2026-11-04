---
description: Refresh codebase understanding. Parallel scanning. Syncs with scope docs.
---

# /re-onboard

## Rules
- Assumes `/onboard` was run previously
- Preserves existing docs, updates with changes
- Non-destructive (adds, doesn't remove without confirmation)
- Use parallel scans for speed
- Syncs with scope/ documents for product context

---

## Step 1: Parallel Discovery

Execute ALL discovery tasks **IN PARALLEL**:

### Batch A: Read Existing Docs
```
PARALLEL:
- Read: CLAUDE.md
- Read: agent-os/config.yml
- Read: agent-os/product/roadmap.md
- Read: agent-os/standards/index.yml
```

### Batch B: Scope Documents (Product Context)
```
PARALLEL:
- List: scope/*.md (discover all scope documents)
- Read: ALL .md files found in scope/ folder
- This repo has no `scope/` folder yet. If it is missing, use `README.md` (problem statement, goals, tech stack),
  `CONTRIBUTING.md`, `docs/development.md`, `dev_ops_pipeline/*.md` and `architechture_roadmap.drawio` instead
```

### Batch C: Django Backend Structure
```
PARALLEL:
- List: apps/*/
- List: config/
- List: apps/webui/
- List: dev_ops_pipeline/
- Read: pyproject.toml (dependencies)
- Read: docker-compose.yaml (services)
- Read: example.env (env vars)
```

### Batch D: Scan Code Patterns (Django)
```
PARALLEL:
- Grep: "class.*Model" in apps/*/models.py and apps/*/models/*.py
- Grep: "class.*Serializer" in apps/*/serializers.py
- Grep: "class.*View\|class.*API" in apps/*/
- Grep: "@shared_task" in apps/*/tasks.py
- Grep: "path\(" in apps/*/urls.py
```

### Batch E: Check Recent Git Activity
```
PARALLEL:
- git log --oneline -20 (recent commits)
- git diff --stat HEAD~10 (files changed recently)
- git branch -a (active branches)
```

### Batch F: Scan Active Specs
```
PARALLEL:
- List: agent-os/specs/*/
- Check for tasks.md in each spec folder
```

---

## Step 2: Sync Scope Documents

Compare scope/ docs with agent-os/ docs:

### Scope Changes
| Check | Source | Compare To |
|-------|--------|------------|
| Goals | scope/scope.md | agent-os/product/roadmap.md |
| Features | scope/scope.md | agent-os/product/roadmap.md |
| MVP Phases | scope/mvp_checklist.md | agent-os/product/roadmap.md |
| User Flow | scope/ui_user_flow.md | agent-os/product/roadmap.md |
| Requirements | scope/prd.md | CLAUDE.md |

---

## Step 3: Build Change Inventory

Compare discovered vs documented:

### Django Backend
| Check | Source | Compare To |
|-------|--------|------------|
| Django apps | `apps/*/` listing | `CLAUDE.md` |
| Models | Grep from models.py | CLAUDE.md models section |
| Serializers | Grep from serializers.py | CLAUDE.md |
| URL patterns | Grep from urls.py | CLAUDE.md |
| Background tasks | Grep @shared_task in apps/*/tasks.py, signals.py | CLAUDE.md |
| SMS parser | smsparser/ | CLAUDE.md |
| Web dashboard | apps/webui/ (templates, static/webui/js) | CLAUDE.md |

### Infrastructure
| Check | Source | Compare To |
|-------|--------|------------|
| Docker services | docker-compose.yaml | `CLAUDE.md` |
| Dependencies | pyproject.toml, package.json (Vitest only) | `CLAUDE.md` |
| Env vars | example.env | `CLAUDE.md` |

### Active Specs
| Check | Source | Compare To |
|-------|--------|------------|
| Spec folders | `agent-os/specs/*/` | Active branches |
| Tasks progress | `tasks.md` files | Branch status |

---

## Step 4: Generate Diff Report

Before updating, show what changed:

```
## Change Detection Report

### SCOPE DOCUMENT CHANGES
(List all .md files discovered in scope/ folder)
- scope/scope.md: [modified/unchanged]
- scope/prd.md: [modified/unchanged]
- scope/ui_user_flow.md: [modified/unchanged]
- scope/mvp_checklist.md: [modified/unchanged]
- (any other .md files found): [status]

### DJANGO BACKEND
- NEW Apps: [list]
- NEW Models: [list]
- NEW Endpoints: [list]
- NEW Tasks: [list]

### INFRASTRUCTURE
- NEW Docker services: [list]
- NEW Dependencies: [list]
- NEW Env vars: [list]

### ACTIVE SPECS
- In Progress: [list spec folders with incomplete tasks]
- Recently Completed: [list]

### MODIFIED (docs outdated)
- [file]: [what changed]

### REMOVED (in docs but not codebase)
- [list - requires confirmation to remove from docs]

### RECENT GIT ACTIVITY
- Commits: [count] since [date]
- Key changes: [summary]
- Active branches: [list]

Proceed with updates? (y/n)
```

**Wait for confirmation before updating docs.**

---

## Step 5: Update Documentation

Update in this order (dependencies first):

### 5.1 Update `CLAUDE.md`
- Update product overview (if scope docs changed)
- Update project structure section
- Add new commands
- Update environment variables
- Update Docker services
- Update test commands

### 5.2 Update `agent-os/product/roadmap.md`
- Sync with scope/mvp_checklist.md phases
- Sync feature statuses from active specs
- Mark completed features
- Add untracked features to backlog
- Update phase progress

### 5.3 Update `agent-os/standards/index.yml`
- Add descriptions for standards if missing
- Note any new standards files discovered

---

## Step 6: Verify Environment

```bash
# Docker services
docker compose ps

# Django checks
docker compose exec be python manage.py check
docker compose exec be python manage.py showmigrations --list
```

Check for:
- [ ] All Docker services running
- [ ] No Django check errors
- [ ] No unapplied migrations
- [ ] No missing env vars

---

## Step 7: Validate Updates

Quick verification:
1. Re-read updated docs
2. Spot-check 2-3 new items against code
3. Ensure no formatting issues

---

## Output

```
## Re-onboard Complete

### Product: <project-name>
<product description from scope docs>

### Scope Documents Status
| Document | Status | Last Modified |
|----------|--------|---------------|
| scope/scope.md | [synced/updated] | [date] |
| scope/prd.md | [synced/updated] | [date] |
| scope/ui_user_flow.md | [synced/updated] | [date] |
| scope/mvp_checklist.md | [synced/updated] | [date] |
| (any other .md files found) | [status] | [date] |

### Changes Detected
| Category | New | Modified | Removed |
|----------|-----|----------|---------|
| Django Apps | X | X | X |
| Django Models | X | X | X |
| Django Endpoints | X | X | X |
| Background Tasks | X | X | X |

### Documentation Updated
- [x] CLAUDE.md (+X lines)
- [x] agent-os/product/roadmap.md (X features synced)
- [x] agent-os/standards/index.yml (X descriptions added)

### Active Specs Status
| Spec | Progress | Last Updated |
|------|----------|--------------|
| <spec-folder> | X% | <date> |

### Environment Status
- Docker: ✓ All services running
- Django: ✓ No errors
- Migrations: ✓ All applied

### Issues Found
- (none or list with severity)

### Suggested Next Steps
- /query "<topic>" - Explore specific area
- /plan <slug> - Start next feature
- /execute <slug> - Resume in-progress work
```
