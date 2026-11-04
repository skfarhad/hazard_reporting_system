---
description: Ask questions about this project - features, bugs, roadmap, architecture, or codebase. Read-only exploration. Fast parallel search.
---

# /query

Input: $ARGUMENTS

## Rules
- Read-only command - no code edits
- Use parallel searches for speed
- Provide concise, accurate answers with references
- If answer not found, say so explicitly

---

## Step 1: Classify Question (FAST)

Detect category from keywords:

| Category | Keywords |
|----------|----------|
| Features | feature, implement, planned, status, spec, what does X do |
| Bugs | bug, fix, error, issue, broken, not working |
| Roadmap | roadmap, phase, milestone, next, progress, timeline |
| Architecture | how, architecture, flow, design, structure, pattern |
| Code | where, find, located, function, class, file, module |
| Status | status, progress, complete, done, remaining |
| Standards | standard, convention, pattern, rule, guideline |

**Multiple categories?** Search all in parallel.

---

## Step 2: Parallel Search Strategy

Execute searches **IN PARALLEL** based on category:

### For Features/Specs:
```
PARALLEL:
- List: agent-os/specs/*/
- Read: agent-os/product/roadmap.md
- Grep: "<keyword>" in agent-os/specs/
```

### For Bugs:
```
PARALLEL:
- List: agent-os/specs/*/ (look for bugfix in folder names)
- Grep: "<keyword>" in agent-os/specs/
```

### For Roadmap:
```
PARALLEL:
- Read: agent-os/product/roadmap.md
- Read: agent-os/product/mission.md
- Read: CLAUDE.md (first 100 lines)
```

### For Architecture:
```
PARALLEL:
- Read: CLAUDE.md
- Read: agent-os/product/tech-stack.md
- Read: agent-os/standards/global/tech-stack.md
```

### For Code:
```
PARALLEL:
- Grep: "<symbol>" in backend/apps/
- Grep: "<symbol>" in backend/config/
- Grep: "<symbol>" in backend/incident_manager/smsparser/
- Grep: "<symbol>" in web_app/hrs_map/
- Read: CLAUDE.md
```

### For Status:
```
PARALLEL:
- Read: agent-os/product/roadmap.md
- List: agent-os/specs/*/tasks.md
```

### For Standards:
```
PARALLEL:
- Read: agent-os/standards/index.yml
- List: agent-os/standards/
- Read: agent-os/standards/<category>/<file>.md
```

---

## Step 3: Quick Scan (if needed)

If initial search insufficient, do targeted follow-up:

| Need | Action |
|------|--------|
| Spec details | Read `agent-os/specs/<YYYY-MM-DD>-<slug>/spec.md` |
| Task progress | Read `agent-os/specs/<YYYY-MM-DD>-<slug>/tasks.md` |
| Implementation | Read source file in `backend/apps/` or `web_app/hrs_map/` |
| Standard details | Read `agent-os/standards/<category>/<file>.md` |

---

## Step 4: Synthesize Answer

Format based on question type:

### Status Questions
```
## <Feature/Bug Name>
Status: <status>
Progress: <X/Y tasks> (<percent>%)
Branch: <branch-name>
Spec: agent-os/specs/<folder>/
Last Updated: <date>
```

### List Questions
```
## <Category> (<count>)
| Name | Status | Description |
|------|--------|-------------|
| ... | ... | ... |
```

### How/Where Questions
```
## Answer
<direct answer>

## Implementation
| File | Key Functions |
|------|---------------|
| <path> | <list> |
```

### Standards Questions
```
## <Standard Name>

### Summary
<key points>

### Location
agent-os/standards/<category>/<file>.md

### Key Rules
- 
- 
```

### General Questions
```
## Answer
<concise answer>

## References
- <file1>
- <file2>
```

---

## Fallback Handling

If answer not found:
1. State explicitly: "No information found for <topic>"
2. Suggest where info might be added
3. Recommend commands to create the info:
   - `/plan <slug>` - Create feature/bug spec
   - `/onboard` - Refresh project docs
   - `/re-onboard` - Update existing docs
   - `/init-standards` - Setup standards

---

## Output

Always include:
- **Direct answer** (first line)
- **References** (files consulted)
- **Suggested Commands** (if actionable)

Omit sections if empty (no "Related: None").

---

## Performance Tips

1. **Prefer grep over read** for keyword searches
2. **List directories first** before reading files
3. **Parallel everything** that doesn't depend on prior results
4. **Cache CLAUDE.md** - read once, reference often
5. **Stop early** when answer found - don't over-search
6. **Use agent-os/** - specs, standards, and product info are centralized there
