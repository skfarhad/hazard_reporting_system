---
description: Start a refactor: create branch refactor/<slug>, create agent-os/specs/<date-slug>/spec.md. Local development only.
---

# /refactor

Input: $ARGUMENTS

## Format A (Preferred): YAML block
```
slug: extract-auth-service
title: Extract authentication into service layer
notes: |
  Any extra context about the refactor.
```

## Format B: One-liner
```
extract-auth-service --title "Extract authentication into service layer" --notes "..."
```

---

## Rules
1. Branch name: `refactor/<slug>`
2. Spec folder: `agent-os/specs/<YYYY-MM-DD>-<slug>/`
3. No secrets, no `.env` reads
4. Local commits only (no push)
5. No behavior changes unless explicitly documented
6. Ensure tests exist before refactoring

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
git checkout -b refactor/<slug>
```

### Step 4: Create Refactor Folder Structure
Create `agent-os/specs/<YYYY-MM-DD>-<slug>/`:
```
agent-os/specs/<YYYY-MM-DD>-<slug>/
├── planning/
│   ├── raw-idea.md
│   └── requirements.md
├── orchestration.yml
├── spec.md
└── tasks.md
```

### Step 5: Create Raw Idea
Create `agent-os/specs/<YYYY-MM-DD>-<slug>/planning/raw-idea.md`:

```markdown
# Raw Idea: <Title>

**Type:** refactor
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

### Step 6: Create Refactor Requirements
Create `agent-os/specs/<YYYY-MM-DD>-<slug>/planning/requirements.md`:

```markdown
# Refactor Requirements: <Title>

## Motivation
<!-- Why is this refactor needed? -->

## Current State
<!-- Current implementation and its issues -->

## Target State
<!-- Desired implementation after refactor -->

## Constraints
- No behavior changes unless explicitly documented
- All existing tests must pass

## Success Criteria
- [ ] 
- [ ] 

## Notes
<notes if provided>
```

### Step 7: Create Refactor Spec
Create `agent-os/specs/<YYYY-MM-DD>-<slug>/spec.md`:

```markdown
# Specification: <Title>

## Executive Summary
<!-- Brief overview of the refactor -->

---

## Problem Statement

**Current State:**
- 

**Desired State:**
- 

---

## Goals & Success Criteria

### Primary Goals
1. 
2. 

### Non-Goals
- 

---

## Current State Analysis
- 

---

## Target State Design
- Models:
- Views:
- Services:

---

## Files Affected
- 

---

## Safety Net

### Existing Tests
<!-- Tests covering refactored code -->

### Tests to Add
- 

---

## Refactor Strategy
1. 
2. 
3. 

---

## Testing Strategy
- Unit:
- Integration:
- Regression:

---

## Rollback Plan
<!-- How to revert if issues arise -->
```

### Step 8: Commit
```bash
git add agent-os/specs/<YYYY-MM-DD>-<slug>/
git commit -m "chore(refactor): initialize <slug> spec"
```

## Output
- Refactor slug:
- Branch name:
- Spec path: `agent-os/specs/<YYYY-MM-DD>-<slug>/spec.md`
- Next: `/plan <slug>`

## IMPORTANT
**DO NOT automatically run `/plan`.** Always ask the user:
> "Refactor initialized. Ready to run `/plan <slug>`?"

Wait for explicit user confirmation before proceeding.
