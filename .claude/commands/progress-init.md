---
description: Initialize task tracking. Standalone utility if /plan wasn't used.
---

# /progress-init

Input: $ARGUMENTS

## Format
```
<slug> --type <type>
```

Type: `feature`, `bugfix`, `refactor` (auto-detected from branch if omitted)

---

## Rules
- Use when tasks.md doesn't exist yet
- Note: `/plan` already creates tasks.md automatically
- This is a standalone utility for manual initialization

---

## Steps

### 1. Verify spec exists
Find spec folder:
```bash
ls agent-os/specs/ | grep <slug>
```

Check that exists:
- `agent-os/specs/<YYYY-MM-DD>-<slug>/spec.md`

If not found, recommend running `/plan <slug>` first.

### 2. Read spec to identify scope
Parse spec for:
- Success Criteria sections
- Technical Design sections

### 3. Create orchestration.yml
Create `agent-os/specs/<YYYY-MM-DD>-<slug>/orchestration.yml`:

```yaml
task_groups:
  - name: <Task Group 1 Name>
    claude_code_subagent: general-purpose
  - name: <Task Group 2 Name>
    claude_code_subagent: general-purpose
```

### 4. Create tasks.md
Create `agent-os/specs/<YYYY-MM-DD>-<slug>/tasks.md`:

```markdown
# Task Breakdown: <Name>

**Spec**: `<YYYY-MM-DD>-<slug>`
**Status**: Ready for Implementation

## Overview
Total Tasks: X task groups with Y sub-tasks

## Task List

### Task Group 1: <Group Name>

**Priority**: High | Medium | Low
**Files**:
- `<path/to/file1>`

#### Subtasks:

**1.1 <Subtask Name>**
- [ ] Step 1
- [ ] Step 2

**Acceptance Criteria**:
- <criterion 1>

---

## Execution Order

1. **<Group 1>** - X days
2. **<Group 2>** - X days

---

## Key Implementation Notes

### Patterns to Follow
- 

### File References
**Files to Modify:**
- 

**Test Files to Create:**
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

### 5. Extract tasks from spec
- Parse implementation sections from spec
- Populate tasks.md task groups

---

## Output

```
## Progress Initialized

### <Type>: <slug>
- Folder: agent-os/specs/<YYYY-MM-DD>-<slug>/
- Orchestration: agent-os/specs/<YYYY-MM-DD>-<slug>/orchestration.yml
- Tasks doc: agent-os/specs/<YYYY-MM-DD>-<slug>/tasks.md
- Spec: agent-os/specs/<YYYY-MM-DD>-<slug>/spec.md

### Total Tasks
- **Total:** X tasks

### Next Steps
- /execute <slug> - Start implementation
- /resume-execute <slug> - Resume from progress
```
