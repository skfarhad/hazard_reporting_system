---
description: Update project roadmap based on current progress and scope changes. Reviews agent-os/product/roadmap.md against scope/ folder.
---

# /update-project-roadmap

## Rules
- Run periodically to keep roadmap in sync with progress
- Compares current `agent-os/product/roadmap.md` with `scope/` docs
- Updates phase completion status and adds new items from scope changes
- Preserves existing structure while incorporating updates

---

## Steps

### 1. Read Current State

Read and analyze existing documents:

**Roadmap:**
- `agent-os/product/roadmap.md`

**Scope Documents:**
- All `.md` files in `scope/` (e.g. `scope/prd.md`, `scope/scope.md`, `scope/mvp_checklist.md`, `scope/ui_user_flow.md`)
- If `scope/` does not exist, use `README.md`, `agent-os/product/mission.md` and the user's input instead

**Spec Progress:**
- `agent-os/specs/*/tasks.md` (check completion status)

---

### 2. Analyze Progress

For each roadmap item, check:
- Is it marked complete `[x]` or pending `[ ]`?
- Does corresponding code exist in `backend/apps/` or `web_app/hrs_map/`?
- Is there a spec in `agent-os/specs/` for it?
- What's the actual implementation status?

Calculate phase completion:
```
Phase 1: X/Y items complete (Z%)
Phase 2: X/Y items complete (Z%)
...
```

---

### 3. Detect Scope Changes

Compare current scope docs against roadmap:

**New Features:**
- Items in `scope/` not yet in roadmap
- New schemas or pipelines added
- New user flow requirements

**Modified Requirements:**
- Changed SMS format, coverage area (districts/thanas) or provider integrations
- Updated API contracts (incident/volunteer/user APIs) or SMS parser behaviour
- New constraints or exclusions

**Removed/Deprecated:**
- Items in roadmap no longer in scope
- Features explicitly marked out of scope

---

### 4. Interview User (if needed)

Ask brief questions only if scope changes detected:

- "I found new items in scope/. Should I add them to the roadmap?"
- "These items appear complete. Should I mark them done?"
- "Priority changes detected. Update phase assignments?"

---

### 5. Update Roadmap

Update `agent-os/product/roadmap.md` with:

**Progress Updates:**
- Mark completed items: `[ ]` → `[x]`
- Add completion dates where applicable
- Update phase progress percentages

**New Items:**
- Add items discovered in scope docs
- Assign appropriate phase and priority
- Link to relevant scope documents

**Structure (preserve existing format):**

```markdown
# Product Roadmap

## Phase 1: Incident Intake (apps/incident_manager)

- [x] Incident, Provider, Division/District/Thana models
- [x] Provider API-key incident create endpoint
- [ ] SMS processing and dispatch in `process_incident_and_send_sms`

**Progress:** X/Y complete (Z%)

---

## Phase 2: Volunteer Coordination (apps/volunteer_hub)

### Volunteers and Teams
- [x] Volunteer and VolunteerTeam models, volunteer list API
- [ ] Match nearby volunteers to validated incidents
...

**Progress:** X/Y complete (Z%)

---

## Phase 3: Live Map (web_app/hrs_map)

- [ ] Map reads real incidents from the backend instead of `fake_incident_response.json`
...

**Progress:** X/Y complete (Z%)

---

(continue for all phases)

---

## Summary

| Phase | Items | Complete | Progress |
|-------|-------|----------|----------|
| Phase 1 | X | Y | Z% |
| Phase 2 | X | Y | Z% |
...

## Recent Changes

### YYYY-MM-DD
- Added: <new items>
- Completed: <finished items>
- Modified: <changed items>
```

---

### 6. Cross-Reference Specs

Link active specs to roadmap items:
- Check `agent-os/specs/*/spec.md` for related features
- Note which specs cover which roadmap items
- Identify roadmap items without specs (need `/feature-new`)

---

### 7. Identify Gaps

Report items needing attention:

**Missing Specs:**
- Roadmap items without corresponding spec folders

**Stale Items:**
- Items marked in-progress but no recent activity

**Blocking Dependencies:**
- Items blocked by incomplete prerequisites

---

## Output

```
## Roadmap Updated

### Progress Summary
| Phase | Before | After | Delta |
|-------|--------|-------|-------|
| Phase 1 | X% | Y% | +Z% |
| Phase 2 | X% | Y% | +Z% |
...

### Items Updated
**Completed:**
- [x] <item 1>
- [x] <item 2>

**Added (from scope/):**
- [ ] <new item 1> — from prd.md
- [ ] <new item 2> — from scope.md

**Modified:**
- <item>: <change description>

### Scope Changes Detected
| Document | Changes |
|----------|---------|
| prd.md | <summary> |
| scope.md | <summary> |

### Items Needing Attention
**No spec created:**
- <item 1>
- <item 2>

**Blocked:**
- <item>: waiting on <dependency>

### Next Steps
- /feature-new <slug> - Create spec for new items
- /plan <slug> - Plan implementation
- /progress-status - Check detailed progress
```

---

## Quick Update Mode

For fast updates without interview:

```
/update-project-roadmap --quick
```

This will:
1. Auto-mark items with completed specs as done
2. Add all new scope items to appropriate phases
3. Generate change summary
4. Skip confirmation prompts
