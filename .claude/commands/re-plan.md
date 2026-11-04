---
description: Remove existing spec files (preserving raw-idea.md) and start a fresh planning session from the original user prompt.
---

# /re-plan

Input: $ARGUMENTS

## Format
```
<slug>
```

Example: `user-export`

---

## Rules
- No code edits
- Delete spec files EXCEPT `planning/raw-idea.md`
- Start fresh planning session using original prompt
- Preserve the dated folder name

---

## Steps

### Step 1: Parse $ARGUMENTS
Extract:
- slug (required, lowercase, hyphen-separated)

### Step 2: Find existing spec folder
```bash
ls agent-os/specs/ | grep <slug>
```

If no folder found, abort with:
> "No spec folder found for slug `<slug>`. Use `/feature-new`, `/bugfix-new`, or `/refactor` to create a new spec."

### Step 3: Read raw-idea.md
Read `agent-os/specs/<YYYY-MM-DD>-<slug>/planning/raw-idea.md`

If file doesn't exist, warn:
> "No raw-idea.md found. Planning will start without original context."

### Step 4: Confirm deletion
Ask user:
> "Found spec folder `<folder-name>/`. This will delete:
> - spec.md
> - tasks.md
> - orchestration.yml
> - planning/requirements.md
>
> **PRESERVED:** planning/raw-idea.md (original prompt)
>
> Proceed with re-planning?"

Wait for explicit confirmation.

### Step 5: Delete spec files
Delete the following files if they exist:
- `agent-os/specs/<YYYY-MM-DD>-<slug>/spec.md`
- `agent-os/specs/<YYYY-MM-DD>-<slug>/tasks.md`
- `agent-os/specs/<YYYY-MM-DD>-<slug>/orchestration.yml`
- `agent-os/specs/<YYYY-MM-DD>-<slug>/planning/requirements.md`

**DO NOT DELETE:**
- `agent-os/specs/<YYYY-MM-DD>-<slug>/planning/raw-idea.md`

Keep the dated folder and planning/ folder.

### Step 6: Start fresh planning with original context
Run the `/plan` command, passing the original input from raw-idea.md:

```
slug: <slug>
notes: |
  [Original context from raw-idea.md]
```

The `/plan` command will:
1. Detect type from current branch
2. Read CLAUDE.md and standards
3. Read the preserved raw-idea.md for original context
4. Interview about requirements (starting from original prompt)
5. Create fresh spec.md, tasks.md, orchestration.yml, requirements.md

---

## Output
- Confirmation of deleted files
- Confirmation that raw-idea.md was preserved
- Fresh planning session started with original context
- Follow `/plan` output format

## IMPORTANT
- **Always confirm before deleting.** Spec files may contain valuable design decisions.
- **raw-idea.md is sacred.** It preserves the user's original intent and should never be deleted during re-plan.
