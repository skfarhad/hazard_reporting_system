---
description: Show progress status for features/bugfixes/refactors. Quick overview of implementation state.
---

# /progress-status

Input: $ARGUMENTS (optional, shows all if empty)

## Format
```
<slug> --type <type>
```

Type: `feature`, `bugfix`, `refactor`, `all` (default: auto-detect or `all`)

---

## Rules
- Read-only command
- Summarizes progress across features/bugfixes/refactors

---

## Steps

### 1. If slug specified:
- Detect type from branch or argument
- Find spec folder: `ls agent-os/specs/ | grep <slug>`
- Read `agent-os/specs/<YYYY-MM-DD>-<slug>/tasks.md`
- Show detailed status

### 2. If no slug specified:
- Scan all spec folders in `agent-os/specs/`
- Read each tasks.md file
- Show summary table

### 3. Calculate metrics:
- Total tasks
- Completed tasks
- Overall progress percentage
- Blockers count

---

## Output Format

### Single Feature/Bugfix/Refactor
```
## <Name>

**Type:** Feature | Bugfix | Refactor
**Status:** In Progress
**Branch:** <type>/<slug>
**Spec Folder:** agent-os/specs/<YYYY-MM-DD>-<slug>/

### Overall Progress
Progress: 8/10 tasks (80%)

### Completed Tasks
  ✓ Models created
  ✓ Migrations applied
  ✓ Views implemented

### Remaining Tasks
  ○ Unit tests
  ○ Integration tests

### Blockers
  ⚠ <blocker description>
```

### All Items Summary
```
## Active Specs in agent-os/specs/

### Features (<count>)
| Folder | Status | Progress | Last Updated |
|--------|--------|----------|--------------|
| 2026-01-21-user-export | In Progress | 60% | 2026-01-20 |

### Bugfixes (<count>)
| Folder | Status | Progress | Last Updated |
|--------|--------|----------|--------------|
| 2026-01-22-login-timeout | In Progress | 80% | 2026-01-22 |

### Refactors (<count>)
| Folder | Status | Progress | Last Updated |
|--------|--------|----------|--------------|
| 2026-01-18-auth-service | In Progress | 40% | 2026-01-18 |

## Summary
- Features: X in progress, Y complete
- Bugfixes: X open, Y fixed
- Refactors: X in progress, Y complete
- Total blockers: Z
```

---

## Quick Filters

```bash
# Show only features
/progress-status --type feature

# Show only bugfixes
/progress-status --type bugfix

# Show specific item
/progress-status user-export
```
