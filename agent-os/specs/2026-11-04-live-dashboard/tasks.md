# Task Breakdown: Live three-panel dashboard (incidents, map, volunteers)

**Spec**: `2026-11-04-live-dashboard`
**Status**: Implemented; next: `/run-tests live-dashboard`
**Branch**: `feat/live-dashboard`. Commit after each group with prefix `feat(live-dashboard):`.

Every subtask is test-first:
1. Write the failing test.
2. Run it and confirm it fails for the expected reason (missing feature, not a typo or import error).
3. Write the minimal code to pass.
4. Refactor while green.

- **Backend tests:** `docker compose exec be python manage.py test apps.<app>.tests.<module>`.
- **Web app tests:** `npm test`.

## Task List

### Task Group 1: Dependencies and data model

**Priority**: High
**Files**:
- `pyproject.toml`, `poetry.lock`, `config/settings.py`, `config/urls.py`, `.gitignore`
- `apps/incident_manager/models/incident.py`, `apps/incident_manager/migrations/0012_*`
- `apps/volunteer_hub/models/volunteer.py`, `apps/volunteer_hub/migrations/*`
- `apps/user/models.py`, `apps/user/migrations/*`
- `apps/incident_manager/admin.py`, `apps/volunteer_hub/admin.py`

#### Subtasks (test-first, RED before GREEN):

**1.0 Dependencies (configuration, no behaviour; covered by later tests)**
- [x] Add `channels`, `channels-redis`, `uvicorn[standard]` and `Pillow` (versions that support Python 3.8), then rebuild the `be`/`unit_tests` images.
- [x] Add MEDIA settings (served in DEBUG) and add `media/` to `.gitignore`.

**1.1 Several volunteers per incident**
- [x] Write a failing test: `test_assigning_volunteers_to_an_incident_keeps_all_of_them`.
- [x] Add the `Incident.volunteers` M2M; deprecate the `volunteer` FK (help_text).
- [x] Write a failing test: `test_the_data_migration_copies_the_single_volunteer_into_the_volunteers_list`.
- [x] Add the reversible data migration in `0012`.

**1.2 Volunteer photo**
- [x] Write a failing test: `test_a_volunteer_photo_must_be_an_image_of_at_most_2_mb` (JPEG/PNG/WebP).
- [x] Add the `photo` ImageField and validators; admin thumbnail; `is_active` in list_filter.

**1.3 Bell last-seen time**
- [x] Write a failing test: `User.notifications_seen_at` defaults to null (covered in the 4.x API tests, written first there if simpler).
- [x] Add the field and migration.

Notes: added `validate_photo_content` (the model ImageField does not check content, only forms do); admin photo thumbnail tested. 1.3 moved into 4.1, test-first there.

**Acceptance Criteria**:
- Migrations apply and reverse cleanly; existing single assignments are copied.
- Tests written first, watched fail, now passing.

---

### Task Group 2: Incident filters, summary and assignment APIs

**Priority**: High
**Files**:
- `apps/incident_manager/services/periods.py` (new), `filters.py`, `serializers.py`, `apis.py`, `urls.py`
- Tests: `test_dashboard_filters.py`, `test_incident_summary_api.py`, `test_incident_volunteers_api.py`, updates to `test_incident_detail_api.py`, `test_operator_update.py`

#### Subtasks (test-first, RED before GREEN):

**2.1 Period filter**
- [x] Write failing tests:
  - `test_today_starts_at_midnight_bangladesh_time_not_utc`;
  - `test_last_24_hours_and_last_7_days_include_only_incidents_created_in_that_window`;
  - `test_active_event_period_lists_only_incidents_attached_to_an_active_event`;
  - `test_an_unknown_period_is_rejected_with_400`.
- [x] Implement `period_start` and the `period` filter.

**2.2 Area and task-status filters, and the volunteer count**
- [x] Write failing tests:
  - `test_district_and_thana_filters_narrow_the_list_by_id`;
  - `test_task_status_closed_lists_only_resolved_incidents`;
  - `test_each_listed_incident_has_its_volunteer_count_without_extra_queries`.
- [x] Implement the filters, the annotation, and the `task_status`/`volunteer_count` fields.

**2.3 Summary endpoint**
- [x] Write failing tests:
  - `test_summary_counts_pending_resolved_and_total_for_the_period_and_area`;
  - `test_summary_matches_the_list_count_for_the_same_filters`;
  - `test_summary_is_one_query`;
  - `test_non_operators_cannot_read_the_summary`.
- [x] Implement `IncidentSummaryView` (reuses `IncidentFilter` without the status filters).

**2.4 Assignment**
- [x] Write failing tests:
  - `test_an_operator_can_assign_a_volunteer_and_assigning_again_changes_nothing`;
  - `test_unassigning_removes_only_that_volunteer`;
  - `test_unassigning_someone_not_assigned_is_404`;
  - `test_patching_volunteers_replaces_the_list`;
  - `test_unknown_volunteer_ids_are_rejected`;
  - `test_details_list_the_assigned_volunteers_with_photos`;
  - `test_non_operators_cannot_assign`.
- [x] Implement the POST/DELETE assignment views, `volunteers` on the operator update serializer, and `volunteers` in the detail.

Notes: the list and details now include `district`/`thana` names and `volunteer_count`. Details replace `volunteer` with `volunteers` [{id, full_name, contact_number, photo}] ordered by name; PATCH responds with the details shape (re-read, annotated).

**Acceptance Criteria**:
- List and summary agree for every filter; bounded query counts.
- Tests written first, watched fail, now passing.

---

### Task Group 3: Volunteers API (operator-only)

**Priority**: High
**Files**:
- `apps/volunteer_hub/views.py`, `serializers.py`, `urls.py`, `filters.py` (new)
- `apps/volunteer_hub/tests/test_get_volunteer.py`, `test_volunteer_summary_api.py` (new)

#### Subtasks (test-first, RED before GREEN):

**3.1 Permission and fields**
- [x] Write failing tests:
  - `test_only_operators_can_list_volunteers` (regression: it was AllowAny);
  - `test_operators_see_active_and_inactive_volunteers_with_phone_area_and_photo`.
- [x] Implement `IsAdminUser`, the new serializer fields, the `select_related` and the `assigned_incident_count` annotation.

**3.2 Filters and nearest-first**
- [x] Write failing tests:
  - `test_active_district_thana_and_search_filters`;
  - `test_near_orders_volunteers_by_distance_and_reports_km`;
  - a bad `near` gives a 400.
- [x] Implement the FilterSet and the `Distance` annotation.

**3.3 Summary**
- [x] Write a failing test: `test_volunteer_summary_counts_active_inactive_and_total` (with area filters; operator-only).
- [x] Implement `VolunteerSummaryView`.

**Acceptance Criteria**:
- The Volunteers page (`volunteers.js`) is updated to the new shape in Group 6.
- Tests written first, watched fail, now passing.

---

### Task Group 4: Notifications (bell) and Location management APIs

**Priority**: Medium
**Files**:
- `apps/incident_manager/apis.py`, `serializers.py`, `urls.py`, `services/places.py`
- Tests: `test_notifications_api.py`, `test_place_management_api.py`

#### Subtasks (test-first, RED before GREEN):

**4.1 Notifications**
- [x] Write failing tests:
  - `test_unread_counts_pending_incidents_reported_since_the_bell_was_last_opened`;
  - `test_a_user_who_never_opened_the_bell_sees_the_last_24_hours`;
  - `test_marking_seen_resets_unread_to_zero_for_that_user_only`;
  - `test_non_operators_get_403`.
- [x] Implement the GET notifications and POST seen endpoints.

**4.2 District and thana management**
- [x] Write failing tests:
  - `test_operators_can_create_rename_and_delete_districts_and_thanas`;
  - `test_creating_a_district_needs_a_division_and_a_unique_name`;
  - `test_deleting_a_district_or_thana_in_use_is_refused_with_409`;
  - `test_non_operators_cannot_manage_places`.
- [x] Implement the manage views (with counts) and the read-only divisions list.

**4.3 Boundaries**
- [x] Write failing tests:
  - `test_a_geojson_polygon_boundary_is_stored_as_a_multipolygon`;
  - `test_bad_geojson_a_point_or_a_boundary_outside_bangladesh_is_rejected`;
  - `test_an_uploaded_boundary_is_used_to_detect_the_area_of_a_web_report`.
- [x] Implement the `boundary` field (GEOS parse, type and bounds check, null clears); GeoJSON in responses.

Notes: place management lives in `apps/incident_manager/places_manage.py`. List rows carry `has_boundary` and counts (subqueries, so the joins don't multiply); the detail GET/PATCH/POST responses carry `boundary` as GeoJSON. `User.notifications_seen_at` (task 1.3) is added here, test-first.

**Acceptance Criteria**:
- Tests written first, watched fail, now passing.

---

### Task Group 5: Live updates (Channels and ASGI)

**Priority**: High
**Files**:
- `config/asgi.py`, `config/settings.py`, `config/gunicorn.conf.py`, `entrypoint_web.sh`, `docker-compose.yaml` (if needed), `example.env`
- `apps/incident_manager/consumers.py` (new), `services/broadcast.py` (new), `signals.py`
- Tests: `test_dashboard_socket.py`

#### Subtasks (test-first, RED before GREEN):

**5.1 Consumer authentication**
- [x] Write failing tests:
  - `test_an_operator_with_a_valid_token_joins_and_gets_ready`;
  - `test_a_non_operator_or_bad_token_is_closed_with_4403_or_4401`;
  - `test_no_auth_message_within_the_timeout_closes_the_socket`.
- [x] Implement `DashboardConsumer`, the routing and `ASGI_APPLICATION`.

**5.2 Nudges**
- [x] Write failing tests:
  - `test_saving_an_incident_nudges_connected_dashboards_after_commit`;
  - `test_assigning_a_volunteer_and_saving_a_volunteer_send_nudges`;
  - `test_a_channel_layer_error_does_not_break_saving_an_incident`.
- [x] Implement `broadcast.notify` and the signals.

**5.3 Serve ASGI**
- [x] Switch Gunicorn to `uvicorn.workers.UvicornWorker` with `config.asgi:application`.
- [x] Set `CHANNEL_LAYERS` from `REDIS_URL`; raise `THROTTLE_RATE` to 1000/hour.
- [x] Update `example.env`.
- [x] Verify by hand that `ws://localhost:8001/ws/dashboard/` connects (Playwright).
- [x] Run the full Django suite in `unit_tests`.

Notes:
- `daphne` added as a dev dependency, because `channels.testing` imports it.
- Socket tests patch `channels.db.close_old_connections`, so the TestCase connection stays open.
- `routing.websocket_application()` builds the origin check from `ALLOWED_HOSTS`, so the test can set real hosts (dev `.env` uses `*`).
- `config/workers.AsgiWorker` turns off the unused ASGI lifespan protocol.
- Checked against the running server with Redis: "ready", then nudges on create and delete, and 4401 for a bad token.

**Acceptance Criteria**:
- Pages, API and sockets all served by `be` on 8001.
- Tests written first, watched fail, now passing.

---

### Task Group 6: Dashboard web app

**Priority**: High
**Files**:
- `templates/webui/dashboard.html`, `components/incident_detail_modal.html` (moved from `incidents.html`)
- `static/webui/js/`:
  - new: `dashboard-query.js`, `dashboard-views.js`, `dashboard-layout.js`, `live.js` (each with a `.test.js`);
  - changed: `dashboard.js`, `map.js`, `incidents.js`, `incident-views.js`, `volunteers.js`, `constants.js`, `api.js` (add `apiPost`/`apiDelete` if missing)
- `static/webui/css/hrs.css`

#### Subtasks (test-first, RED before GREEN):

**6.1 Query state**
- [x] Write failing tests in `dashboard-query.test.js` (URL round-trip, Resolved → `task_status=closed`, `near` only with a selection, showing text).
- [x] Implement.

**6.2 Views**
- [x] Write failing tests in `dashboard-views.test.js`:
  - title fallbacks;
  - card fields and plurals;
  - selected class;
  - avatar photo/initials/dot;
  - Assign/Unassign;
  - XSS escaping.
- [x] Implement.

**6.3 Layout**
- [x] Write failing tests in `dashboard-layout.test.js` (collapse remembered, storage errors tolerated; mobile tabs set `aria-selected` and `hidden`).
- [x] Implement.

**6.4 Live socket**
- [x] Write failing tests in `live.test.js`:
  - auth first;
  - nudge handler;
  - backoff 1→30 s, reset after ready;
  - re-fetch after reconnect;
  - 4403 stops retrying;
  - debounce.
- [x] Implement.

**6.5 Map links**
- [x] Write failing tests in `map.test.js` (`drawMarkers` returns markers by id; inactive volunteers grey; popup card content).
- [x] Implement.

**6.6 Volunteers in the details modal**
- [x] Write failing tests in `incident-views.test.js` (volunteer multi-select in the edit form; `formToPatch` sends `volunteers`; details list assigned volunteers).
- [x] Implement.
- [x] Move the modal markup into a shared component.

**6.7 Controller and page**
- [x] Write `dashboard.html` and the controller wiring (thin, so it's covered by the helper tests plus the E2E check).
- [x] Adapt `volunteers.js` to the new API shape.
- [x] Add the CSS (tokens, light and dark, the 992px breakpoint, no horizontal scroll at 375px).

Notes:
- The incident details dialog is now shared (`components/incident_modal.html` and `incident-modal.js`); the Incidents page uses it too.
- `api.js` gains `apiDelete` and a `quiet` option, so live refreshes don't flash the spinner.
- The Volunteers page shows the new fields; non-operators get an operators-only notice (`operatorsOnlyHtml`).
- Per the user's request during /execute, the Report incident button sits at the bottom-centre of the map.
- On the dashboard the legend starts collapsed so it doesn't cover the button; an operator's own choice is still remembered.
- Popups pan clear of the top badge and the bottom button.
- On phones the map is hidden under the incident and volunteer sheets so it doesn't take their taps.

Browser check (Playwright, 1280×800 and 375×812, seeded TEMP-LIVE data, cleaned up afterwards):
- Counts match `/summary/`.
- A card opens its popup.
- A pin selects its card.
- Volunteers are listed nearest first.
- Assign and Unassign update the badge.
- A report from another session appears in about 2 s.
- Panels collapse to 48 px rails.
- Phone tabs work, with no horizontal scroll.
- No console errors.

**Acceptance Criteria**:
- The desktop layout matches the mockup; list and map are linked both ways; assignment updates badges; live updates arrive within 2 s.
- Tests written first, watched fail, now passing.

---

### Task Group 7: Navbar: bell, avatar menu and Location tab

**Priority**: Medium
**Files**:
- `templates/webui/base.html`, `templates/webui/locations.html` (new), `apps/webui/urls.py`, `views.py`
- `static/webui/js/`:
  - new: `notifications.js`, `avatar-menu.js`, `locations.js`, `locations-views.js` (each with tests where pure);
  - changed: `auth.js` (`initNavbar`)
- Tests: `apps/webui` view test for `/app/locations/` (if view tests exist), Vitest tests

#### Subtasks (test-first, RED before GREEN):

**7.1 Bell**
- [x] Write failing tests in `notifications.test.js` (badge text 0/n/9+, item escaping).
- [x] Implement the bell: fetch on load and on nudge; opening it lists the items and POSTs seen.

**7.2 Avatar menu**
- [x] Write failing tests for `userInitials`.
- [x] Implement the menu (name, theme toggle, Sign out), replacing the old controls on every page.

**7.3 Location page**
- [x] Write failing tests in `locations-views.test.js` (GeoJSON parsing, accepted and rejected shapes; row HTML escaped with counts).
- [x] Implement the page: district list expanding to thanas; add/rename/delete with 409 messages; boundary upload with map preview.
- [x] Add the route test: `/app/locations/` renders with `page="locations"`.

Notes:
- Login doesn't return `is_staff`, so the bell's own request decides who is an operator: when `/notifications/` answers, the bell and the `[data-operator-only]` Location tab appear.
- Pages other than the dashboard open their own socket for the bell only after it shows. The dashboard passes `liveBell: false` and sends `hrs:incidents-changed` events instead.

Browser check:
- Bell: the count rises live after a report from another session (1 → 2); opening it lists the reports and clears the count.
- Avatar menu: shows the name, the theme toggle and Sign out.
- Location, as an operator: add a district (refused without a division), add a thana, upload a boundary (a Point file is refused; the polygon is previewed), rename, and delete an unused district. Deleting Feni, which is in use, shows the 409 message.
- Location, as a viewer: the bell and Location tab are hidden, and the Location page shows the operators-only notice.
- Phone: no horizontal scroll.
- Test data cleaned up afterwards.

**Acceptance Criteria**:
- The bell count rises live and clears when opened.
- The Location tab manages places and boundaries.
- Tests written first, watched fail, now passing.

---

### Task Group 8: Docs and verification

**Priority**: Medium
**Files**:
- `docs/development.md`, `docs/design-system.md`
- `agent-os/specs/2026-11-04-live-dashboard/spec.md`, `tasks.md`

#### Subtasks:
- [x] Document:
  - the ASGI server and WebSocket;
  - new APIs and the behaviour changes (volunteers API operator-only, `volunteer` FK deprecated, throttle default);
  - media/photos;
  - the dashboard components.
- [x] Run the E2E Playwright checks (desktop, phone, live from a second context, Location tab).
- [x] Run the mutation checks listed in the spec and close any survivors with tests.
- [x] Record the results in tasks.md.

---

Results:
- Django: 231 tests, all passing; no missing migrations.
- Vitest: 172 tests in 17 files, all passing.
- Mutation checks:
  - Backend: 14 mutants. 13 were caught at once. The survivor (no nudge when assigning from the volunteer's side) is now caught by `test_assigning_from_the_volunteers_side_nudges_about_each_incident`.
  - JS: 15 mutants. 14 were caught at once. The survivor (card dates not converted to Bangladesh time) went unnoticed because this machine runs on UTC+6. `vitest.config.js` now pins `TZ=UTC`, so it is caught.
- Found by the browser checks and fixed:
  - Popups were hidden behind the Report button.
  - The legend covered the button.
  - On phones the map took taps meant for the sheets.
  - The phone toggle arrow was visible.
  - The volunteer panel had a double border.
  - Dev static files raised ASGI streaming warnings.

## Execution Order

1. **Dependencies and data model** (Group 1)
2. **Incident filters, summary and assignment APIs** (Group 2)
3. **Volunteers API** (Group 3)
4. **Notifications and Location APIs** (Group 4)
5. **Live updates** (Group 5)
6. **Dashboard web app** (Group 6)
7. **Navbar: bell, avatar, Location** (Group 7)
8. **Docs and verification** (Group 8)

---

## Key Implementation Notes

### Patterns to Follow
- **Filters:** django-filter FilterSets as in `IncidentFilter`; a 400 for bad values via DRF `ValidationError`.
- **Query counts:** prove them with `CaptureQueriesContext` (see `test_incident_list_filters.py`).
- **Operator APIs:** `IsAdminUser`; non-operators get 403, and the page shows `reportPanelHtml()`.
- **Web app:** pure ES-module helpers with Vitest next to them, thin controllers, all text through `escapeHtml`, colours and icons through `safeColour`/`safeIcon`.
- **State:** page state in the URL query string; per-viewer UI choices in localStorage wrapped in try/catch.
- **Design:** HRS design tokens only; check light and dark.

### Risk Mitigation
- **Python 3.8 images:** pin dependency versions that still support 3.8 (uvicorn ≤ 0.33, Pillow 10.4, channels 4.1/4.2).
- **ASGI switch:** run the full Django suite and the existing Playwright checks after Group 5, before building the UI.
- **Socket tests:** `TransactionTestCase` + `WebsocketCommunicator` with an in-memory layer, so no Redis is needed in CI.
- **API shape changes:** grep the web app for `API.volunteers` and `.volunteer` and update every caller.
- **Dev data:** E2E checks must clean up the incidents, places and assignments they create.

---

## Dependencies

**External Dependencies:**
- `channels`, `channels-redis`, `uvicorn[standard]`, `Pillow` (new Python packages)
- Redis (already in Docker Compose)
- Leaflet 1.9.4 (already loaded from CDN)

**Internal Dependencies:**
- `IncidentFilter`, `IncidentListView`, `IncidentDetailView`, `OperatorUpdateSerializer`
- `services/incidents.create_incident` (boundary detection)
- `map.js`, `map-legend.js`, `incident-views.js`, `incident-detail.js`, `report-modal.js`, `tables.reportPanelHtml`
