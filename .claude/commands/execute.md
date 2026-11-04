---
description: Implement per spec for Django/DRF project. Small commits. Run tests in Docker. Local only. Works with features, bugfixes, and refactors.
---

# /execute

Input: $ARGUMENTS

## Format A (Preferred): YAML block
```
slug: user-export
type: feature  # feature | bugfix | refactor (auto-detected from branch if omitted)
service: django  # django | all (auto-detected if omitted)
notes: |
  Session context or focus areas.
```

## Format B: One-liner
```
user-export --type feature --service django --notes "focus on backend only"
```

---

## Rules
- Must be on correct branch (`feat/<slug>`, `bugfix/<slug>`, or `refactor/<slug>`)
- Follow spec at `agent-os/specs/<YYYY-MM-DD>-<slug>/spec.md`
- Update `agent-os/specs/<YYYY-MM-DD>-<slug>/tasks.md` after each task
- Scope changes require spec update first
- **Test-Driven Development is mandatory** — write the failing test first, watch it fail,
  then write the minimal code to pass. Invoke the `tdd` skill and follow it. No production
  code without a failing test first.
- Local commits only (no push)

## Type Detection
If `type` not provided, detect from current branch:
- `feat/<slug>` → feature
- `bugfix/<slug>` → bugfix
- `refactor/<slug>` → refactor

## Service Detection
If `service` not provided:
1. Check spec for affected services
2. Check files modified in spec
3. Default to `all` if unclear

## Path Mapping
| Type | Branch | Spec Folder | Commit Prefix |
|------|--------|-------------|---------------|
| feature | `feat/<slug>` | `agent-os/specs/<YYYY-MM-DD>-<slug>/` | `feat(<slug>):` |
| bugfix | `bugfix/<slug>` | `agent-os/specs/<YYYY-MM-DD>-<slug>/` | `fix(<slug>):` |
| refactor | `refactor/<slug>` | `agent-os/specs/<YYYY-MM-DD>-<slug>/` | `refactor(<slug>):` |

### Finding Existing Specs
To find an existing spec folder by slug:
```bash
ls agent-os/specs/ | grep <slug>
```

---

## Steps

### Step 1: Parse $ARGUMENTS
Extract:
- slug (required, lowercase, hyphen-separated)
- type (optional, auto-detected)
- service (optional, auto-detected)
- notes (optional - session context or focus areas)

### Step 2: Verify branch and read spec
1. Confirm branch matches `<type>/<slug>`
2. Find spec folder: `ls agent-os/specs/ | grep <slug>`
3. Read spec and tasks.md, restate:
   - Objective
   - Acceptance criteria / Fix criteria / Refactor goals
   - Affected services
   - Test plan

### Step 3: Implement each task via Red-Green-Refactor

**Invoke the `tdd` skill first**, then work one behavior at a time. For every task in
`tasks.md`:

1. **RED** — Write one minimal failing test for the next behavior.
2. **Verify RED** — Run it. Confirm it fails for the *expected* reason (feature missing,
   not a typo/import error). If it passes or errors, fix the test first.
   ```bash
   docker compose -f backend/docker-compose.yml exec be python manage.py test apps.<app>.tests.test_<thing>
   ```
3. **GREEN** — Write the simplest production code that makes it pass. No extra features.
   For Django backend (`backend/apps/`, `backend/config/`): models, migrations
   (`docker compose -f backend/docker-compose.yml exec be python manage.py makemigrations && ... migrate`), views, URLs,
   serializers, background tasks (Celery `@shared_task` in `apps/<app>/tasks.py`; restart
   `celery_worker` after changing them) — but only as far as the current test requires.
   For the live map (`web_app/hrs_map/`), check with `npm run lint` and `npm run build`; it has no test runner.
4. **Verify GREEN** — Re-run the test; confirm it passes and no other tests broke.
5. **REFACTOR** — Clean up while staying green. Add no new behavior.

Repeat until the task's acceptance criteria are met. Never write production code ahead of
a failing test; if you do, delete it and restart from the test.

### Step 4: After each increment

#### Run the affected app's suite and check for regressions:
```bash
docker compose -f backend/docker-compose.yml exec be python manage.py test apps.<app>
docker compose -f backend/docker-compose.yml logs be --tail=50
```
Output must be pristine (no errors/warnings). Fix any broken test before committing.

#### Commit changes:
```bash
git add <files>
git commit -m "<prefix> <description>"
```
Use commit prefix from Path Mapping table.

### Step 5: Update tracking
1. Mark completed tasks in `agent-os/specs/<YYYY-MM-DD>-<slug>/tasks.md`
2. Add session notes if needed
3. Mark completed checklist items in spec

---

## Output
- Summary of changes per service
- Tests run + results
- Commits made
- tasks.md updates

## Next Commands
- `/run-tests <slug>` - **MANDATORY** Run full test suite
- `/resume-execute <slug>` - Continue after break
- `/progress-status <slug>` - Check progress
- `/verify <slug>` - Run full verification
- `/merge-to <target>` - Merge to target branch
- `/submit <slug>` - Final submission

## IMPORTANT
**After execution completes, `/run-tests` is MANDATORY.** Always ask the user:
> "Execution complete. Ready to run `/run-tests <slug>`?"

Wait for explicit user confirmation before proceeding.

**DO NOT run `/merge-to` until `/run-tests` passes.**
