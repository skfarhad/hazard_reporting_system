# Task Breakdown: Report an incident from the web app for staff review

**Spec**: `2026-11-04-report-incident-from-dashboard`
**Status**: Tested, ready for PR

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
- [x] Write failing tests: non-operator can report, pending; records reporter + web source; status ignored; anonymous rejected; keeps fields; response has only id/status/time; no SMS task queued
- [x] Verify they fail (404 route)
- [x] Implement `IncidentReportSerializer`, `IncidentReportView`, URL

**3.2 Needs, place and event**
- [x] Write failing tests: SMS keywords/fallback needs; chosen district+thana; thana not in district rejected; polygon detection; active event attached
- [x] Verify they fail; implement via the service

**3.3 Validation**
- [x] Write failing tests: contact required + BD mobile; +880/880 normalised; location missing/outside BD rejected; message/address required + length; unknown need; negative people count
- [x] Verify they fail; implement validators

**3.4 Rate limit**
- [x] Write failing tests: non-operators limited to 10/hour; operators not limited
- [x] Verify they fail; implement `IncidentReportThrottle` + settings rate (tests clear the cache)

**Acceptance Criteria**: FR3, FR6–FR8; tests first, now passing

---

### Task Group 4: Lookups and operator views of source

**Priority**: High
**Files**: `apis.py`, `serializers.py`, `urls.py`, `tests/test_places_api.py` (new), `tests/test_need_types.py`, list/detail tests

**4.1 Places API**
- [x] Write failing tests: districts with thanas by name; anonymous rejected; constant queries
- [x] Verify they fail; implement `PlaceListView`

**4.2 Need types for everyone signed in**
- [x] Write failing test: any signed-in user can list need types; anonymous cannot
- [x] Verify it fails; switch permission (update the old operator-only test)

**4.3 Source in operator views**
- [x] Write failing test: operators see the source in the list and the reporter's name in the details
- [x] Verify it fails; add fields

**Acceptance Criteria**: FR9, FR10, FR12 (API); tests first, now passing

---

### Task Group 5: Report form helpers and views

**Priority**: High
**Files**: `static/webui/js/report-form.js` (+ test, new), `tables.js` (+ test), `incident-views.js` (+ test), `constants.js`

**5.1 Pure helpers**
- [x] Write failing tests (report-form.test.js): phone normalising; inside Bangladesh; form → body; missing fields; people count; thana filter; profile phone pre-fill; escaping
- [x] Verify they fail; implement `report-form.js`

**5.2 Panel and source display**
- [x] Write failing tests: report panel for non-operators; Web badge in rows/cards; details name the reporter or provider
- [x] Verify they fail; implement `reportPanelHtml`, badge, details source

**Acceptance Criteria**: FR2–FR4, FR12 (UI); tests first, now passing

---

### Task Group 6: Report pop-up on dashboard and Incidents page

**Priority**: High
**Files**: `report-modal.js` (new), `templates/webui/components/report_modal.html` (new), `dashboard.html`, `incidents.html`, `dashboard.js`, `incidents.js`, CSS

**6.1 Modal**
- [x] Markup partial; lazy lookups; form render; profile phone; map click + draggable pin; "Use my location" with inline errors; submit, 400 → field errors, 429 → form message; success → close, toast, `onCreated`

**6.2 Pages**
- [x] Report button in both headers; non-operator panel replaces the access notice; operators reload data after a report

**Acceptance Criteria**: FR1, FR2, FR4, FR5 (browser-checked in Group 7)

---

### Task Group 7: Verification and docs

**Priority**: High
- [x] `docker compose exec be python manage.py test apps` and `npm test` green
- [x] Browser check per spec "Manual" list; remove test data afterwards
- [x] Docs: `docs/development.md`, `docs/design-system.md`
- [x] Record results here

---

## Session Notes (2026-11-04, /execute)

**Results**
- Django: 160 tests, all passing (new: `test_incident_report_api.py` 22, `test_places_api.py` 3,
  `test_incident_model_source.py` 1, provider status 1, need types 2, source/reporter 1).
- Vitest: 11 files, 99 tests, all passing (new: `report-form.test.js` 10; panel, Web badge,
  reporter in details, `drawMarkers` return value).
- The provider-path refactor into `services/incidents.py` was done under the existing provider,
  parser and event tests (all green before and after).

**Browser check (headless Chromium; temporary reports and viewer1's phone removed afterwards)**
- Operator, Incidents page 1280 light: Report button, empty-submit errors with focus on the first
  field, district -> thana, fake GPS places the pin, submit -> "Report #34 sent for staff review.",
  new row first: Rescue, 4 people, pending, Web badge, event attached.
- Non-operator (viewer1), dashboard 375 dark: report panel instead of data, profile phone
  pre-filled, map tap moves the pin, full-screen form, submit -> toast.
- Denied geolocation message; faked 429 -> form-level message (form stays open); faked 400 -> field
  error next to Thana.

**Decisions made while implementing**
- A thana chosen without a district also sets its district (test added).
- Boundary detection lives in the shared service, so provider reports get it too once boundary
  shapes are loaded.
- The dashboard "Total incidents" card now uses the API's total instead of the loaded page.
- `operatorAccessNotice` removed (replaced by `reportPanelHtml` on both pages).
- `drawMarkers` returns its layers so the dashboard can redraw after a report.

**Known limits**
- The existing global API throttle (`THROTTLE_RATE`, default 100/hour per user; 1000/hour in
  `example.env`) also applies to operators' normal browsing.
- Throttle counters use the default local-memory cache (per process).
- No district/thana boundary shapes are loaded yet, so detection from the pin is inactive in dev.

## Test Results (2026-11-04, /run-tests)

- **Django** (`docker compose run --rm unit_tests`, as in CI, fresh DB incl. migration 0011):
  162 run, 162 passed, 0 failed. `makemigrations --check`: no changes.
- **Vitest** (`npm test`): 11 files, 99 run, 99 passed, 0 failed.
- All 38 tests named in the spec exist (need-types access is split into two tests).
- **Mutation check**, 22 deliberate breaks:
  - Backend (12): provider status writable, web report saved as provider, reporter not saved,
    thana/district mismatch allowed, no boundary fallback, location bounds unchecked, loose phone
    regex, staff throttled, no throttle, response leaking the contact number — caught.
    Survivors fixed:
    - "always pending" in the service was only backed by the model default, and a caller passing
      its own status crashed → the service now drops a caller's status
      (`test_incident_service.py`: "the creation service ignores a status from its caller");
    - thana detection ignoring the chosen district → new test with overlapping boundaries in two
      districts.
  - Frontend (10): unanchored / too-wide phone pattern, needs always sent, untrimmed message,
    fractional people, thanas of all districts, unescaped phone and reporter, Web badge on every
    incident — caught. Survivor fixed: the longitude bound was untested (only London used) →
    Myanmar and India points added to the client and server tests.
- No coverage tool is installed, so no coverage figure.

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
