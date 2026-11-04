# Task Breakdown: Need-type icons on the incident map

**Spec**: `2026-11-04-need-type-map-icons`
**Status**: Ready for Implementation

Run JS tests on the host: `npx vitest run apps/webui/static/webui/js/<file>.test.js`, full suite `npm test`.

## Task List

### Task Group 1: Need lookup and pin markup

**Priority**: High
**Files**:
- `apps/webui/static/webui/js/constants.js`
- `apps/webui/static/webui/js/map.js`
- `apps/webui/static/webui/js/map.test.js`

#### Subtasks (test-first — RED before GREEN):

**1.1 Main need and fallback**
- [x] Write failing tests: uses the highest-priority need in need-type order, whatever order the incident lists them; falls back to the fallback need type when the incident has no known need; uses a generic question-mark need when need types could not be loaded
- [x] Verify they fail for the expected reason (functions missing)
- [x] Implement `incidentNeeds`, `primaryNeed`, `GENERIC_NEED`
- [x] Refactor while green

**1.2 Safe icon and colour**
- [x] Write failing test: never puts an unsafe icon name or colour from the database into the markup, and escapes labels
- [x] Verify it fails
- [x] Implement `safeIcon`, `safeColour`
- [x] Refactor while green

**1.3 Pin markup**
- [x] Write failing tests: fills the pin with the main need's colour and shows its icon; marks the pin with its validation status, treating an unknown status as pending; shows how many further needs the incident has; flags life-threatening incidents with an alert badge; names every need, life-threatening and the status in the pin's aria-label
- [x] Verify they fail
- [x] Implement `incidentPinHtml` (inline SVG teardrop + icon + badges)
- [x] Refactor while green

**Acceptance Criteria**:
- FR1–FR5 markup behaviour and the security rule covered
- Tests written first, watched fail, now passing

---

### Task Group 2: Drawing pins and popup

**Priority**: High
**Files**:
- `apps/webui/static/webui/js/map.js`
- `apps/webui/static/webui/js/map.test.js`

**2.1 Leaflet icon**
- [x] Write failing test: anchors the pin's tip on the incident's point
- [x] Verify it fails
- [x] Implement `incidentIcon` (`L.divIcon`, 32×42, anchor at the tip)

**2.2 Popup**
- [x] Write failing test: lists the need labels, life-threatening and people count in the popup
- [x] Verify it fails
- [x] Extend `incidentPopup(i, needTypes)`

**2.3 drawMarkers**
- [x] Write failing tests: draws incidents as pins and volunteers as circles; draws life-threatening incidents above the others
- [x] Update the existing drawMarkers tests' fake Leaflet; verify the new tests fail
- [x] Switch incidents to `L.marker` with `incidentIcon` and `zIndexOffset`; accept `needTypes`
- [x] Remove `incidentMarkerColor` and its test if unused
- [x] Existing coordinate/fit-bounds/OSM tests still pass

**Acceptance Criteria**:
- FR1, FR5, FR6, FR9 covered; regression tests green
- Tests written first, watched fail, now passing

---

### Task Group 3: Collapsible map legend

**Priority**: High
**Files**:
- `apps/webui/static/webui/js/map-legend.js` (new)
- `apps/webui/static/webui/js/map-legend.test.js` (new)
- `apps/webui/static/webui/js/constants.js`

**3.1 Legend content**
- [x] Write failing tests: lists every need type with its icon and label; leaves out the needs section when need types could not be loaded; explains pin outlines for each status, rejected as faded, life-threatening and volunteers; escapes labels and ignores unsafe icons and colours
- [x] Verify they fail
- [x] Implement `legendHtml`

**3.2 Initial state**
- [x] Write failing tests: starts open on wide screens and collapsed on narrow ones; a remembered choice wins over the screen width
- [x] Verify they fail
- [x] Implement `legendInitiallyOpen`

**3.3 Control and toggle**
- [x] Write failing tests: toggling collapses and expands the body, updates aria-expanded and saves the choice; keeps working when the browser refuses storage
- [x] Verify they fail
- [x] Implement `addLegend` (Leaflet control, bottom-right, click/scroll propagation stopped)

**Acceptance Criteria**:
- FR7, FR8 legend behaviour covered
- Tests written first, watched fail, now passing

---

### Task Group 4: Styles, dashboard wiring and docs

**Priority**: Medium
**Files**:
- `apps/webui/static/webui/css/hrs.css`
- `apps/webui/static/webui/js/dashboard.js`
- `apps/webui/templates/webui/dashboard.html`
- `apps/webui/templates/webui/design.html`, `docs/design-system.md`

**4.1 Wiring**
- [x] Fetch `API.needTypes` in parallel; pass to `drawMarkers` and `addLegend`; no toast when it fails (covered by 1.1/3.1 fallback tests; `dashboard.js` is an entry module without tests, like the other pages)
- [x] Remove the footer legend from `dashboard.html`

**4.2 Styles**
- [x] `.hrs-pin*` and `.hrs-map-legend*` components using `--hrs-*` tokens, scoped under `.leaflet-container`, light/dark

**4.3 Docs**
- [x] Add pin and legend to `docs/design-system.md` and sample pins to `/app/design/`

**Acceptance Criteria**:
- Dashboard shows pins and the legend; nothing else on the page changes

---

### Task Group 5: Verification

**Priority**: High

- [ ] `npm test` all green
- [ ] `docker compose exec be python manage.py test apps` all green (no backend change)
- [ ] Browser check per spec "Manual" list (light/dark, 1280px/375px, remembered state, 403 on need types)
- [ ] Record results in this file

---

## Execution Order

1. **Need lookup and pin markup**
2. **Drawing pins and popup**
3. **Collapsible map legend**
4. **Styles, dashboard wiring and docs**
5. **Verification**

---

## Key Implementation Notes

### Patterns to Follow
- ES modules with pure, testable helpers; Leaflet passed in as `L` (see `createMap`, `drawMarkers`).
- `escapeHtml` from `utils.js` for all text; tokens from `hrs.css`; Leaflet overrides scoped under `.leaflet-container`.
- localStorage access wrapped in try/catch.

### Risk Mitigation
- Admin-editable icon/colour → whitelist regexes before markup.
- Leaflet adds a white box to divIcons by default → reset via `className: 'hrs-pin-wrap'` CSS.
- Legend covering the map on phones → collapsed by default below 768px, max-height + scroll.

---

## Dependencies

**External Dependencies:**
- Leaflet 1.9.4 and Bootstrap Icons 1.11.3 (already loaded from CDN).

**Internal Dependencies:**
- Need types and incident fields from #75 (`/api/incidents/need-types/`, `/api/incidents/list/`).
