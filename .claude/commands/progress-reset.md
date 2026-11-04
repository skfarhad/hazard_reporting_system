---
description: Reset task tracking for feature/bugfix/refactor. Clears tasks and keeps spec intact.
---

# /progress-reset

Input: $ARGUMENTS

## Format
```
<slug> --type <type> --hard
```

- Type: `feature`, `bugfix`, `refactor` (auto-detected from branch if omitted)
- `--hard`: Also reset git branch (destructive)

---

## Rules
- Preserves spec.md (no changes to requirements)
- Resets tasks.md to initial state
- Does NOT delete git commits (use `--hard` flag for that)
- Requires confirmation before reset

---

## Steps

### 1. Confirm tasks.md exists
Find spec folder:
```bash
ls agent-os/specs/ | grep <slug>
```

Check `agent-os/specs/<YYYY-MM-DD>-<slug>/tasks.md` exists.
If not, error: "No task tracking found for <slug>"

### 2. Show current progress
Display before reset:
```
## Current Progress: <slug>

| Progress | Tasks |
|----------|-------|
| X% | X/Y |
```

### 3. Confirm reset with user
Ask: "Reset progress for <slug>? This will clear all task checkmarks."

### 4. Reset tasks.md
- Uncheck all tasks: `[x]` → `[ ]`
- Keep task list structure intact

### 5. If `--hard` flag specified
- Warning: "This will also reset git branch to base"
- Confirm again
- Run: `git reset --hard origin/main`
- Note: Destructive, cannot be undone

---

## Output

```
## Progress Reset Complete

### <Type>: <slug>

#### Before
| Progress |
|----------|
| X% |

#### After
| Progress |
|----------|
| 0% |

### Tasks Cleared
- **Total:** X tasks

### Next Steps
- /execute <slug> - Start fresh implementation
- /plan <slug> - Review/update spec first
```
