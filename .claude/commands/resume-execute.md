---
description: Resume implementation from tasks.md. Picks up where you left off.
---

# /resume-execute

Input: $ARGUMENTS

## Format A (Preferred): YAML block
```
slug: user-export
type: feature  # feature | bugfix | refactor (auto-detected from branch if omitted)
notes: |
  Session context or focus areas.
```

## Format B: One-liner
```
user-export --type feature --notes "focus on backend only"
```

---

## Rules
- Must be on correct branch (`feat/<slug>`, `bugfix/<slug>`, or `refactor/<slug>`)
- Reads progress from `agent-os/specs/<YYYY-MM-DD>-<slug>/tasks.md`
- Continues from last incomplete task
- Local commits only (no push)

## Type Detection
If `type` not provided, detect from current branch:
- `feat/<slug>` → feature
- `bugfix/<slug>` → bugfix
- `refactor/<slug>` → refactor

### Finding Existing Specs
To find an existing spec folder by slug:
```bash
ls agent-os/specs/ | grep <slug>
```

---

## Steps

### 1. Confirm branch
Verify current branch matches `<type>/<slug>`

### 2. Read tasks.md and orchestration.yml
Read `agent-os/specs/<YYYY-MM-DD>-<slug>/tasks.md`:
- Identify last completed task
- Identify current/next incomplete task
- Note any blockers or issues

Read `agent-os/specs/<YYYY-MM-DD>-<slug>/orchestration.yml` (if exists):
- Check task group assignments

### 3. Read spec for context
Read `agent-os/specs/<YYYY-MM-DD>-<slug>/spec.md`:
- Review acceptance criteria
- Check test plan

### 4. Resume implementation

```bash
# Create/update models
# Generate migrations
docker compose -f backend/docker-compose.yml exec be python manage.py makemigrations
# Apply migrations
docker compose -f backend/docker-compose.yml exec be python manage.py migrate
# Create views/APIs
# Configure URLs
# Add background tasks if needed (Celery @shared_task in apps/<app>/tasks.py)
```

### 5. After each task completion

```bash
docker compose -f backend/docker-compose.yml exec be python manage.py test apps.<app>
docker compose -f backend/docker-compose.yml logs be --tail=50
```

### 6. Update tasks.md
After each task:
- Mark task status: `[x]`
- Add completion timestamp if needed
- Note any issues or blockers

### 7. Commit changes
```bash
git add <files>
git commit -m "<prefix>(<slug>): <description>"
```

Use appropriate prefix:
- `feat(<slug>):` for features
- `fix(<slug>):` for bugfixes
- `refactor(<slug>):` for refactors

---

## Output

```
## Resume Session Complete

### Progress
| Task | Before | After | Remaining |
|------|--------|-------|-----------|
| Total | X/Y | X/Y | Z tasks |

### Tasks Completed This Session
- [x] <task 1>
- [x] <task 2>

### Commits Made
- <hash>: <message>
- <hash>: <message>

### Next Tasks
- [ ] <next task 1>
- [ ] <next task 2>

### Blockers
- (none or list)
```

---

## Next Commands
- `/run-tests <slug>` - Run tests
- `/progress-status <slug>` - Check detailed progress
- `/verify <slug>` - Run full verification
