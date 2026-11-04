---
description: Start a bugfix: create branch bugfix/<slug>, create agent-os/specs/<date-slug>/spec.md. Local development only.
---

# /bugfix-new

Input: $ARGUMENTS

## Format A (Preferred): YAML block
```
slug: login-timeout
title: Fix login timeout issue
notes: |
  Any extra context about the bug.
```

## Format B: One-liner
```
login-timeout --title "Fix login timeout issue" --notes "..."
```

---

## Rules
1. Branch name: `bugfix/<slug>`
2. Spec folder: `agent-os/specs/<YYYY-MM-DD>-<slug>/`
3. No secrets, no `.env` reads
4. Local commits only (no push)

---

## Steps

### Step 1: Parse $ARGUMENTS
Extract:
- slug (required, lowercase, hyphen-separated)
- title (optional, derived from slug)
- notes (optional)

### Step 2: Ensure agent-os folders exist
- `agent-os/specs/`

### Step 3: Create branch
```bash
git checkout -b bugfix/<slug>
```

### Step 4: Create Spec Folder Structure
Create `agent-os/specs/<YYYY-MM-DD>-<slug>/`:
```
agent-os/specs/<YYYY-MM-DD>-<slug>/
├── planning/
│   ├── raw-idea.md        # User's original prompt (PRESERVED on re-plan)
│   └── requirements.md    # Bug requirements and context
├── spec.md                # Bug specification
└── tasks.md               # Task breakdown (created by /plan)
```

### Step 5: Create Raw Idea (User's Original Prompt)
Create `agent-os/specs/<YYYY-MM-DD>-<slug>/planning/raw-idea.md`:

```markdown
# Raw Idea: <Title>

**Type:** bugfix
**Slug:** <slug>
**Created:** <YYYY-MM-DD>

## Original Input

```
<Copy the entire $ARGUMENTS exactly as provided by user>
```

## Parsed Values

- **Slug:** <slug>
- **Title:** <title or derived from slug>
- **Notes:** <notes if provided, or "none">
```

### Step 6: Create Bug Requirements
Create `agent-os/specs/<YYYY-MM-DD>-<slug>/planning/requirements.md`:

```markdown
# Bug Report: <Title>

## Summary
<!-- Brief description of the bug -->

## Steps to Reproduce
1. 
2. 
3. 

## Expected Behavior
<!-- What should happen? -->

## Actual Behavior
<!-- What actually happens? -->

## Environment
- Browser/Client:
- OS:
- Docker: Yes/No

## Additional Context
<notes if provided>
```

### Step 7: Create Bug Spec
Create `agent-os/specs/<YYYY-MM-DD>-<slug>/spec.md`:

```markdown
# Specification: <Title>

## Executive Summary

<!-- Brief overview of the bug and fix -->

## Problem Statement

**Current State:**
- 

**Desired State:**
- 

**Impact:**
- 

---

## Root Cause Analysis

### Django Backend
- 

---

## Proposed Fix

### Django Backend
- Models:
- Views/APIs:
- URLs:

---

## Testing Strategy

### Regression Tests
- 

### Django Tests
- Unit:
- Integration:

---

## Success Criteria

- [ ] Root cause identified
- [ ] Fix implemented
- [ ] Unit tests added/updated
- [ ] Regression tests passing
- [ ] Manual testing completed

---

## Notes

<notes if provided>
```

### Step 8: Commit
```bash
git add agent-os/specs/<YYYY-MM-DD>-<slug>/
git commit -m "chore(bugfix): initialize <slug> spec"
```

## Output
- Bugfix slug:
- Branch name:
- Spec path: `agent-os/specs/<YYYY-MM-DD>-<slug>/spec.md`
- Next: `/plan <slug>`

## IMPORTANT
**DO NOT automatically run `/plan`.** Always ask the user:
> "Bugfix initialized. Ready to run `/plan <slug>`?"

Wait for explicit user confirmation before proceeding.
