---
description: Plan work and update the spec. No code edits. Works with features, bugfixes, and refactors.
---

# /plan

Input: $ARGUMENTS

## Format A (Preferred): YAML block
```
slug: user-export
type: feature  # feature | bugfix | refactor (auto-detected from branch if omitted)
notes: |
  Any extra context for planning.
```

## Format B: One-liner
```
user-export --type feature --notes "prioritize API design"
```

---

## Rules
- No code edits
- Update spec only
- **MUST use `AskUserQuestion` tool for interactive planning** - do not assume, ask the user
- Auto-detect type from current branch if not specified
- **Plan for Test-Driven Development.** The spec's Testing Strategy and every task in
  `tasks.md` must be test-first: each task begins with the failing test(s) it introduces,
  and its acceptance criteria include those tests passing. `/execute` follows the `tdd`
  skill (`.claude/skills/tdd/SKILL.md`) — plan so it can.

## Type Detection
If `type` not provided, detect from current branch:
- `feat/<slug>` → feature
- `bugfix/<slug>` → bugfix
- `refactor/<slug>` → refactor

## Path Mapping
| Type | Branch | Spec Folder |
|------|--------|-------------|
| feature | `feat/<slug>` | `agent-os/specs/<YYYY-MM-DD>-<slug>/` |
| bugfix | `bugfix/<slug>` | `agent-os/specs/<YYYY-MM-DD>-<slug>/` |
| refactor | `refactor/<slug>` | `agent-os/specs/<YYYY-MM-DD>-<slug>/` |

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
- notes (optional)

### Step 2: Determine type and paths
1. If type not provided, detect from current branch
2. Find existing spec folder
3. Set paths based on found folder

### Step 3: Read context
1. Read `CLAUDE.md` + `agent-os/standards/` (including `standards/testing/test-writing.md`
   and the `tdd` skill, which govern how implementation will be tested)
2. Open spec file, requirements, and `planning/raw-idea.md` (if exists)
3. **CRITICAL: Use the `AskUserQuestion` tool** to interview me interactively.

#### Interview Process (REQUIRED)
You MUST use `AskUserQuestion` to ask questions ONE AT A TIME. Do not proceed without user input.

**Question Categories** (ask as needed):
- What areas of the codebase are affected?
- Preferred folder and module structure
- Technical implementation approach
- API design
- UI and UX (if applicable)
- Concerns and tradeoffs
- Design decisions
- Implementation order

Wait for my response before asking the next question. Continue until you have enough context to write the spec.

### Step 4: Update spec based on type

> In every type below, **Testing Strategy** must state the tests to write *before*
> implementation (unit/integration/regression), what each proves, and how they map to the
> acceptance/fix criteria — not tests added afterward.
>
> Name the tests as full sentences that describe the behaviour they prove.

#### For Features:
- Executive Summary
- Problem Statement
- Goals & Success Criteria
- Technical Design (models, serializers, DRF views, URLs, signals, Celery tasks, live-map changes)
- Testing Strategy

#### For Bugfixes:
- Problem Statement
- Root Cause Analysis
- Proposed Fix
- Testing Strategy (regression, unit, integration)
- Success Criteria

#### For Refactors:
- Problem Statement
- Current State vs Target State
- Safety Net (existing tests, tests to add)
- Refactor Strategy
- Files Affected
- Testing Strategy
- Rollback Plan

### Step 5: Create orchestration.yml

```yaml
task_groups:
  - name: <Task Group 1 Name>
    claude_code_subagent: general-purpose
  - name: <Task Group 2 Name>
    claude_code_subagent: general-purpose
```

### Step 6: Create tasks.md

```markdown
# Task Breakdown: <Title>

**Spec**: `<YYYY-MM-DD>-<slug>`
**Status**: Ready for Implementation

## Task List

### Task Group 1: <Group Name>

**Priority**: High | Medium | Low
**Files**:
- `<path/to/file1>`

#### Subtasks (test-first — RED before GREEN):

**1.1 <Subtask Name>**
- [ ] Write failing test: <behavior it should verify>
- [ ] Verify it fails for the expected reason
- [ ] Implement minimal code to pass
- [ ] Refactor while green

**Acceptance Criteria**:
- <criterion 1>
- Tests written first, watched fail, now passing

---

## Execution Order

1. **<Group 1>**
2. **<Group 2>**

---

## Key Implementation Notes

### Patterns to Follow
- 

### Risk Mitigation
- 

---

## Dependencies

**External Dependencies:**
- 

**Internal Dependencies:**
- 
```

### Step 7: Finalize
1. Update spec Status section if present
2. Output plan summary

---

## Output
- Updated spec saved
- orchestration.yml created/updated
- tasks.md created/updated
- Short summary of changes made

## Next Commands
- `/execute <slug>` - Start fresh implementation
- `/resume-execute <slug>` - Resume from tasks.md
- `/progress-status <slug>` - Check progress

## IMPORTANT
**DO NOT automatically run `/execute`.** Always ask the user:
> "Planning complete. Ready to run `/execute <slug>`?"

Wait for explicit user confirmation before proceeding.
