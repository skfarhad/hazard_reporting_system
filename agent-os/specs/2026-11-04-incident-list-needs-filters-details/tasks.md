# Task Breakdown: Incident list: needs and hazard, filters, search and details view

**Spec**: `2026-11-04-incident-list-needs-filters-details`
**Status**: Implemented (awaiting `/run-tests`)

Django: `docker compose exec be python manage.py test apps.incident_manager.tests.<module>`.
Vitest: `npx vitest run apps/webui/static/webui/js/<file>.test.js`; full `npm test`.

## Task List

### Task Group 1: List API filters, search, pagination and hazard

**Priority**: High
**Files**:
- `apps/incident_manager/filters.py` (new), `pagination.py` (new), `apis.py`, `serializers.py`
- `apps/incident_manager/tests/test_incident_list_filters.py` (new); existing list tests updated

#### Subtasks (test-first — RED before GREEN):

**1.1 Pagination**
- [x] Write failing tests: the list is paginated with 25 incidents per page by default and reports the total count; page_size can be raised up to 500 but not beyond
- [x] Verify they fail (plain array today)
- [x] Implement `IncidentPagination`; `IncidentListView` → `ListAPIView`; update existing list tests to read `results`
- [x] Refactor while green

**1.2 Filters**
- [x] Write failing tests: needs (any, distinct; unknown → 400); status (+ invalid 400); event id / none (+ invalid 400); hazard; life_threatening; filters combine
- [x] Verify they fail
- [x] Implement `IncidentFilter`
- [x] Refactor while green

**1.3 Search**
- [x] Write failing test: search matches description, address, contact number, district, thana and event name, ignoring case
- [x] Verify it fails
- [x] Implement `q`

**1.4 Hazard and query count**
- [x] Write failing tests: each result's event includes its hazard code, label, icon and colour; a page takes the same number of queries whatever the page size
- [x] Verify they fail
- [x] Extend `get_event`; `select_related("event__hazard", "district", "thana")`
- [x] Non-operators still get 403 (regression test)

**Acceptance Criteria**:
- FR1–FR4 covered; existing tests green; tests written first, watched fail, now passing

---

### Task Group 2: Detail API

**Priority**: High
**Files**: `apps/incident_manager/apis.py`, `serializers.py`, `tests/test_incident_detail_api.py` (new), existing PATCH tests

**2.1 GET one incident**
- [x] Write failing tests: an operator can fetch one incident with district, thana, provider, volunteer and update time; missing → 404; non-operators cannot fetch
- [x] Verify they fail (GET not allowed today)
- [x] Implement `IncidentDetailSerializer` and `get`

**2.2 PATCH response**
- [x] Write failing test: updating an incident responds with the detail shape
- [x] Verify it fails
- [x] Respond with `IncidentDetailSerializer`; existing PATCH tests still pass

**Acceptance Criteria**: FR6–FR7; tests first, now passing

---

### Task Group 3: Query state and dashboard map

**Priority**: High
**Files**: `static/webui/js/incident-query.js` (+ test, new), `constants.js`, `api.js` (+ test), `dashboard.js`

**3.1 URL ↔ filters ↔ API params**
- [x] Write failing tests (incident-query.test.js): reads filters from the page URL; ignores unknown keys / invalid page; writes only non-default filters; API params with page and page size; event/hazard choice mapping incl. no event; filter change resets page, page change keeps filters
- [x] Verify they fail
- [x] Implement `readFilters`, `filtersToSearch`, `filtersToApiParams`, `withFilter`

**3.2 Pager and showing text**
- [x] Write failing tests: page numbers with ellipses; showing x–y of n
- [x] Verify they fail
- [x] Implement `pageRange`, `showingText`

**3.3 apiPatch and dashboard**
- [x] Write failing test (api.test.js): sends PATCH with a JSON body and the token
- [x] Verify it fails; implement `apiPatch`
- [x] `dashboard.js` requests `?page_size=500` and uses `results` (browser-checked in Group 7)

**Acceptance Criteria**: FR5, FR8 state, FR11 helpers; tests first, now passing

---

### Task Group 4: List views, filter bar and page

**Priority**: High
**Files**: `static/webui/js/incident-views.js` (+ test, new), `incidents.js`, `tables.js` (+ test), `templates/webui/incidents.html`, `css/hrs.css`, `css/app.css`

**4.1 Cells and rows**
- [x] Write failing tests: need icons in order with screen-reader labels; event + hazard or No event; urgency + people count; table row clickable/keyboard with id; card content; escaping and unsafe icons/colours
- [x] Verify they fail
- [x] Implement `needIcons`, `hazardLabel`, `urgencyBadge`, `locationText`, `incidentTableRow`, `incidentCard`

**4.2 Filter bar and pager**
- [x] Write failing tests: need chips show selection; event/hazard dropdown groups and keeps the choice; pager disables Prev/Next at the ends
- [x] Verify they fail
- [x] Implement `needChips`, `eventHazardOptions`, `pagerHtml`

**4.3 Page wiring**
- [x] Template: filter bar, chips, table + cards, pager, showing text
- [x] `incidents.js`: load need types + events, URL state, fetch page, render, debounced search, popstate, 403 notice
- [x] Remove `filterIncidents` / `incidentRow` and their tests from `tables.js`
- [x] Styles: need icons, cards, clickable rows

**Acceptance Criteria**: FR8–FR11, FR13; tests first, now passing

---

### Task Group 5: Details pop-up, map and prev/next

**Priority**: High
**Files**: `static/webui/js/incident-detail.js` (+ test, new), `incident-views.js` (+ test), `incidents.html`, CSS

**5.1 Details content**
- [x] Write failing test: details show every field and a Google Maps link only with coordinates
- [x] Verify it fails; implement `incidentDetailsHtml`

**5.2 Prev/Next and deep link**
- [x] Write failing tests: next/previous within the page and adjacent-page requests at the edges; none before first/after last; reads and writes `#incident-<id>`
- [x] Verify they fail; implement `adjacentIncident`, hash helpers

**5.3 Modal controller**
- [x] Modal markup; open from row/card/hash; GET detail; Leaflet map preview with `incidentIcon` (reuse one map, `invalidateSize`); Prev/Next buttons and ←/→; focus back to the row on close

**Acceptance Criteria**: FR12 (read-only, map, Prev/Next, deep link); tests first, now passing

---

### Task Group 6: Quick actions

**Priority**: Medium
**Files**: `incident-views.js` (+ test), `incident-detail.js`, `incidents.js`

**6.1 Form**
- [x] Write failing tests: edit form pre-filled and turned back into a PATCH body; at least one need required; server field errors shown next to fields
- [x] Verify they fail
- [x] Implement `editFormHtml`, `formToPatch`, `formErrorsHtml`

**6.2 Wiring**
- [x] Validate / Reject / Pending buttons and Save → `apiPatch`; on success refresh pop-up + row/card and toast; on 400 show errors

**Acceptance Criteria**: FR12 quick actions; tests first, now passing

---

### Task Group 7: Verification and docs

**Priority**: High
- [x] `docker compose exec be python manage.py test apps` and `npm test` green
- [x] Browser check per spec "Manual" list
- [x] `docs/development.md` (list params, pagination, detail GET, breaking change), `docs/design-system.md` (incident card, need icons)
- [x] Record results here

---

## Session Notes (2026-11-04, /execute)

**Results**
- Django: 131 tests, all passing (`apps`), including 18 new in `test_incident_list_filters.py`
  and 5 in `test_incident_detail_api.py`.
- Vitest: 10 files, 86 tests, all passing (new: `incident-query.test.js` 9,
  `incident-views.test.js` 21, `incident-detail.test.js` 4; `api.test.js` +1).
- The N+1 guard was watched failing (5 vs 24 queries) before `select_related("event__hazard", …)`.

**Browser check (headless Chromium, dev data + 30 temporary incidents, removed afterwards)**
- Desktop 1280 light, phone 375 light/dark: table vs cards, need chips, filters, search
  (debounced), Clear, "Showing x–y of n", pager, URL state with Back/Forward.
- Details pop-up: all fields, map preview with the need pin, ←/→ and buttons, Prev across a page
  edge (page 2 first → page 1 last), Escape returns focus to the row/card, `#incident-<id>` deep link,
  full-screen on phones.
- Quick actions: Validate / Back to pending with toast and row refresh; edit needs + people count
  saved; "Pick at least one need"; faked 400 shows field and form-level errors.
- `viewer1` (non-operator) sees the access notice; dashboard shows total and pins from the paginated API.

**Found and fixed during the check**
- Desktop table too wide in the 900px column: urgency moved under the need icons (5 columns).
- Need chips took four rows on phones: one swipeable row below 768px.
- Place repeated the thana ("…, Parshuram, Parshuram, Feni"): not repeated when the address names it (test added).
- Focus didn't return to the card on phones (hidden table row matched first).
- Checked need chips in the edit form had no selected style (`.btn-check + .hrs-chip`).
- Pagination used Bootstrap's default blue; mapped to brand tokens, with readable active text in dark mode.

**Known limits**
- Dashboard summary cards still count the incidents the map loads (≤500), as before.
- Validating queues the SMS task, which is still a placeholder.

## Execution Order

1. **List API filters, search, pagination and hazard**
2. **Detail API**
3. **Query state and dashboard map**
4. **List views, filter bar and page**
5. **Details pop-up, map and prev/next**
6. **Quick actions**
7. **Verification and docs**

---

## Key Implementation Notes

### Patterns to Follow
- Backend: DRF generics + django-filter `FilterSet`; operator-only `IsAdminUser`; `select_related`/`prefetch_related` with `assertNumQueries`; factories from existing tests.
- Frontend: pure, tested HTML/state helpers; page modules only wire DOM; `escapeHtml` for text; `safeIcon`/`safeColour` for DB icons/colours; Bootstrap modal; design tokens in `hrs.css`.

### Risk Mitigation
- Breaking list shape → update dashboard in the same PR (Group 3) and browser-check the map.
- `needs` filter duplicates → `.distinct()` + test.
- Leaflet in a hidden modal renders grey → `invalidateSize()` on `shown.bs.modal`.
- Prev/Next at page edges → page fetch callback, tested via `adjacentIncident`.
- Validate fires the SMS task → placeholder today; note in PR.

---

## Dependencies

**External Dependencies:**
- django-filter (installed), Leaflet 1.9.4, Bootstrap 5 (modal), Bootstrap Icons.

**Internal Dependencies:**
- #75 (needs, events, hazards, PATCH endpoint); need-type-map-icons (`map.js` helpers) — merge that PR first.
