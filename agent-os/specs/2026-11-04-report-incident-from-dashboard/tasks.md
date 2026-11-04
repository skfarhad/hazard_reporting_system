# Task Breakdown: Report an incident from the web app for staff review

**Spec**: `2026-11-04-report-incident-from-dashboard`
**Status**: Ready for Implementation

Django: `docker compose exec be python manage.py test apps.incident_manager.tests.<module>`.
Vitest: `npx vitest run apps/webui/static/webui/js/<file>.test.js`; full `npm test`.

## Task List

### Task Group 1: Source and reporter on incidents

**Priority**: High
**Files**: `apps/incident_manager/constants.py`, `models/incident.py`, migration `0011_…`, `admin.py`, `tests/test_incident_model_source.py` (new)

**1.1 Fields**
- [x] Write failing test: existing and provider incidents have the provider source and no reporter
- [x] Verify it fails (fields missing)
- [x] Add `IncidentSource`, `source`, `reported_by`; `makemigrations`; admin columns
- [x] Refactor while green

**Acceptance Criteria**: migration applies; existing tests green; tests first, now passing

---

### Task Group 2: Shared creation service and provider status fix

**Priority**: High
**Files**: `services/incidents.py` (new), `serializers.py`, `tests/test_create_incidents.py`

**2.1 Provider cannot skip review**
- [x] Write failing test: a provider cannot create an already validated incident
- [x] Verify it fails; make `validation_status` read-only on create

**2.2 Service refactor**
- [x] Move creation into `create_incident(...)` (needs, district/thana explicit → parsed → polygon, pending, event); provider serializer uses it
- [x] All existing provider/parser/event tests stay green (refactor under the existing safety net)

**Acceptance Criteria**: FR13; provider behaviour otherwise unchanged

---

### Task Group 3: Report API, validation and rate limit

**Priority**: High
**Files**: `serializers.py`, `apis.py`, `urls.py`, `config/settings.py`, `tests/test_incident_report_api.py` (new)

**3.1 Create as pending with reporter and source**
- [ ] Write failing tests: non-operator can report, pending; records reporter + web source; status ignored; anonymous rejected; keeps fields; response has only id/status/time; no SMS task queued
- [ ] Verify they fail (404 route)
- [ ] Implement `IncidentReportSerializer`, `IncidentReportView`, URL

**3.2 Needs, place and event**
- [ ] Write failing tests: SMS keywords/fallback needs; chosen district+thana; thana not in district rejected; polygon detection; active event attached
- [ ] Verify they fail; implement via the service

**3.3 Validation**
- [ ] Write failing tests: contact required + BD mobile; +880/880 normalised; location missing/outside BD rejected; message/address required + length; unknown need; negative people count
- [ ] Verify they fail; implement validators

**3.4 Rate limit**
- [ ] Write failing tests: non-operators limited to 10/hour; operators not limited
- [ ] Verify they fail; implement `IncidentReportThrottle` + settings rate (tests clear the cache)

**Acceptance Criteria**: FR3, FR6–FR8; tests first, now passing

---

### Task Group 4: Lookups and operator views of source

**Priority**: High
**Files**: `apis.py`, `serializers.py`, `urls.py`, `tests/test_places_api.py` (new), `tests/test_need_types.py`, list/detail tests

**4.1 Places API**
- [ ] Write failing tests: districts with thanas by name; anonymous rejected; constant queries
- [ ] Verify they fail; implement `PlaceListView`

**4.2 Need types for everyone signed in**
- [ ] Write failing test: any signed-in user can list need types; anonymous cannot
- [ ] Verify it fails; switch permission (update the old operator-only test)

**4.3 Source in operator views**
- [ ] Write failing test: operators see the source in the list and the reporter's name in the details
- [ ] Verify it fails; add fields

**Acceptance Criteria**: FR9, FR10, FR12 (API); tests first, now passing

---

### Task Group 5: Report form helpers and views

**Priority**: High
**Files**: `static/webui/js/report-form.js` (+ test, new), `tables.js` (+ test), `incident-views.js` (+ test), `constants.js`

**5.1 Pure helpers**
- [ ] Write failing tests (report-form.test.js): phone normalising; inside Bangladesh; form → body; missing fields; people count; thana filter; profile phone pre-fill; escaping
- [ ] Verify they fail; implement `report-form.js`

**5.2 Panel and source display**
- [ ] Write failing tests: report panel for non-operators; Web badge in rows/cards; details name the reporter or provider
- [ ] Verify they fail; implement `reportPanelHtml`, badge, details source

**Acceptance Criteria**: FR2–FR4, FR12 (UI); tests first, now passing

---

### Task Group 6: Report pop-up on dashboard and Incidents page

**Priority**: High
**Files**: `report-modal.js` (new), `templates/webui/components/report_modal.html` (new), `dashboard.html`, `incidents.html`, `dashboard.js`, `incidents.js`, CSS

**6.1 Modal**
- [ ] Markup partial; lazy lookups; form render; profile phone; map click + draggable pin; "Use my location" with inline errors; submit, 400 → field errors, 429 → form message; success → close, toast, `onCreated`

**6.2 Pages**
- [ ] Report button in both headers; non-operator panel replaces the access notice; operators reload data after a report

**Acceptance Criteria**: FR1, FR2, FR4, FR5 (browser-checked in Group 7)

---

### Task Group 7: Verification and docs

**Priority**: High
- [ ] `docker compose exec be python manage.py test apps` and `npm test` green
- [ ] Browser check per spec "Manual" list; remove test data afterwards
- [ ] Docs: `docs/development.md`, `docs/design-system.md`
- [ ] Record results here

---

## Execution Order

1. **Source and reporter on incidents**
2. **Shared creation service and provider status fix**
3. **Report API, validation and rate limit**
4. **Lookups (places, need types) and operator views of source**
5. **Report form helpers and views**
6. **Report pop-up on dashboard and Incidents page**
7. **Verification and docs**

---

## Key Implementation Notes

### Patterns to Follow
- Services for shared domain logic (`services/`), thin serializers/views; DRF throttling; `assertNumQueries`.
- Frontend: pure tested helpers + thin controllers; reuse `showFieldErrors`, `incidentIcon`, `safeIcon`/`safeColour`, `escapeHtml`.

### Risk Mitigation
- Service refactor of the provider path → keep all existing provider tests green before adding features.
- Throttle state leaks between tests → clear the cache in `setUp`.
- Point-in-polygon with no shapes → fall through to None (tested with a polygon fixture).
- Geolocation in tests/browsers → handle denied/unavailable; browser check uses Playwright's fake geolocation.
- Providers relying on sending "validated" → documented behaviour change.

---

## Dependencies

**External Dependencies:**
- DRF throttling (built in), Django cache (default local memory), Leaflet, Bootstrap modal, browser Geolocation API.

**Internal Dependencies:**
- `parse_report`, `attach_event`, `NeedType`, `showFieldErrors`, `incidentIcon`, Incidents page (merged).
