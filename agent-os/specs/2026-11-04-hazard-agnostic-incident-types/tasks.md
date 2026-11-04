# Task Breakdown: Hazard-agnostic incident types: needs, hazards and events

**Spec**: `2026-11-04-hazard-agnostic-incident-types`
**Status**: In progress (Task Groups 1-4 done)
**Branch**: `feat/hazard-agnostic-incident-types` (one PR; one green commit per task group)

Every subtask is test-first (`tdd` skill): write the failing test, watch it fail for the expected
reason, write the minimum code to pass, refactor while green. Test names below are the behaviour
they prove.

Run commands:
- One app: `docker compose exec be python manage.py test --noinput apps.<app>`
- Full backend suite: `docker compose run --rm unit_tests`
- JS: `npm test`
- New migrations: `docker compose exec be python manage.py makemigrations <app>`. Files created
  in the container are owned by root, so fix ownership if needed.

## Task List

### Task Group 1: Operator access and PATCH endpoint

**Priority**: High (closes the phone-number exposure; later groups extend the PATCH)
**Files**:
- `apps/incident_manager/tests/test_list_incidents.py` (restore from `git stash` "WIP: incident status endpoint tests", then adapt)
- `apps/incident_manager/tests/test_operator_update.py` (new)
- `apps/incident_manager/apis.py`, `serializers.py`, `urls.py`
- `apps/webui/static/webui/js/api.js`, `api.test.js`, `tables.js`, `tables.test.js`, `dashboard.js`, `incidents.js`

#### Subtasks (test-first — RED before GREEN):

**1.1 Incident list is staff-only**
- [x] Restore the stashed tests (`git stash pop`). Keep "anonymous requests are refused with 401"
      and "signed-in accounts that are not operators are refused with 403"; make the list tests
      authenticate a staff user. Drop the stashed status-endpoint tests (replaced by 1.2).
- [x] Verify the 403 test fails (the list currently returns 200 to any signed-in user)
- [x] Set `IncidentListView.permission_classes = [IsAdminUser]`
- [x] Refactor while green

**1.2 Operator PATCH for validation and task status**
- [x] Write failing tests:
  - an operator validates an incident and the SMS task is queued (patch
    `apps.incident_manager.signals.process_incident_and_send_sms.delay`);
  - an operator rejects an incident and no SMS task is queued;
  - an unknown status is refused with 400 and nothing changes;
  - non-operators cannot update incidents (403);
  - a missing incident returns 404.
- [x] Verify they fail (no route, NoReverseMatch)
- [x] Add `IncidentOperatorSerializer` (`validation_status`, `task_status`; responds in list
      shape), `IncidentDetailView` (PATCH, `IsAdminUser`, saves via the instance), and route
      `<int:pk>/` named `incident-detail`
- [x] Refactor while green

**1.3 Web UI tells non-operators why there's no data**
- [x] Write failing Vitest tests:
  - a 403 from the API is returned to the page as not allowed, without ending the session;
  - the operator-access notice explains how to get operator access (helper in `tables.js`).
- [x] Verify they fail
- [x] `api.js` already returns non-401 errors; confirm a 403 doesn't call `clearSession`. Add
      `operatorAccessNotice()` to `tables.js` and use it in `dashboard.js` and `incidents.js`
      when `status === 403`.
- [x] Refactor while green

**1.4 Local data**
- [x] Give the dev accounts operator access:
      `User.objects.filter(username__in=[...]).update(is_staff=True)`. This changes local data
      only, not code.

**Acceptance Criteria**:
- Non-staff accounts get 403 on the incident list and the PATCH; the dashboard and incidents page
  show the operator-access message.
- Validating through the PATCH queues the SMS task; rejecting doesn't.
- Tests written first, watched fail, now passing; full backend and JS suites green; commit.

---

### Task Group 2: Need types and incident triage fields

**Priority**: High
**Files**:
- `apps/common/models.py` (`TypeBase`)
- `apps/incident_manager/models/types.py` (new), `models/__init__.py`, `models/incident.py`, `admin.py`
- `apps/incident_manager/migrations/0008_…`, `0009_seed_need_types.py`
- `apps/incident_manager/tests/test_need_types.py` (new), `test_model_validation.py`, `test_operator_update.py`, `test_list_incidents.py`

#### Subtasks (test-first — RED before GREEN):

**2.1 TypeBase and NeedType**
- [x] Write failing tests:
  - only one need type can be the fallback;
  - keywords are stored lowercased and stripped;
  - the keyword map includes only active need types;
  - an invalid colour is rejected by validation.
- [x] Verify they fail (ImportError or missing model)
- [x] Implement `TypeBase` (abstract, in `apps/common/models.py`) and
      `NeedType(TypeBase, is_fallback)` with the unique-fallback constraint, plus `fallback()`
      and `keyword_map()`; run `makemigrations` (0008)
- [x] Refactor while green

**2.2 Incident triage fields and `__str__` fix**
- [x] Write failing tests:
  - an incident's string representation names its id and validation status (regression: it
    referenced a non-existent `status`);
  - a new incident is not life-threatening and has no people count by default.
- [x] Verify they fail (AttributeError, missing field)
- [x] Add `needs` (M2M), `life_threatening`, `people_count`; fix `__str__`; include them in
      migration 0008
- [x] Refactor while green

**2.3 Seed need types and backfill existing incidents**
- [x] Write failing tests:
  - the seeded need types include every proposed code and exactly one fallback;
  - running the seed again doesn't create duplicates or overwrite edited labels;
  - existing incidents get the Other need (call the migration functions directly with
    `django.apps.apps`).
- [x] Verify they fail
- [x] Write data migration 0009 (seed table from spec, `update_or_create` by code with defaults
      only on create; backfill `other`; reverse deletes seeded rows)
- [x] Refactor while green

**2.4 Needs and triage in the list and PATCH**
- [x] Write failing tests:
  - operators see each incident's needs and triage fields in the list;
  - listing incidents uses the same number of queries for one or twenty incidents;
  - an operator reclassifies needs and sets triage fields in the same request as validating;
  - an unknown need code or an empty needs list is refused with 400 and nothing changes.
- [x] Verify they fail
- [x] Extend `IncidentListSerializer` and `IncidentOperatorSerializer`; add `prefetch_related`
- [x] Refactor while green

**2.5 Need types lookup and admin**
- [x] Write failing tests:
  - operators get active need types with both labels, icon and colour, and inactive ones are
    hidden;
  - non-operators get 403.
- [x] Verify they fail
- [x] `NeedTypeListView` at `need-types/`; `NeedTypeAdmin`; `IncidentAdmin` gets
      `filter_horizontal` needs and the triage fields
- [x] Refactor while green

**Acceptance Criteria**:
- Need types are seeded and editable in the admin; existing incidents have Other.
- List and PATCH carry needs and triage fields, with a constant query count.
- Tests written first, watched fail, now passing; full suite green; commit.

---

### Task Group 3: Report parser and provider intake

**Priority**: High
**Files**:
- `apps/incident_manager/services/__init__.py`, `services/report_parser.py` (new)
- `apps/incident_manager/tests/test_report_parser.py` (new), `test_create_incidents.py`
- `apps/incident_manager/serializers.py`

#### Subtasks (test-first — RED before GREEN):

**3.1 `parse_report` (pure, `SimpleTestCase`)**
- [x] Write failing tests:
  - a report starting with a known keyword gets that need and the location parts;
  - several keywords joined by plus or comma give every matching need;
  - keywords match regardless of case and surrounding spaces;
  - Banglish and Bangla-script keywords match the same need as the English keyword;
  - an unknown keyword gives the Other need and keeps the whole text as the message;
  - the old four-part format without a keyword still parses its location and gives Other;
  - a hash sign inside the message is kept as part of the message;
  - empty text gives Other and an empty message;
  - text longer than 2,000 characters is truncated before parsing.
- [x] Verify they fail (ImportError)
- [x] Implement `ParsedReport` (NamedTuple) and `parse_report(text, keyword_map)`
- [x] Refactor while green

**3.2 Provider intake uses needs**
- [x] Write failing tests:
  - a provider can send explicit needs and triage fields;
  - needs are parsed from the report text when the provider sends none;
  - a report without a recognised keyword is accepted with the Other need;
  - an unknown need code from a provider is refused with 400;
  - the existing provider payload without the new fields is still accepted (regression).
- [x] Verify they fail
- [x] Extend `IncidentSerializer` (fields and `create()`)
- [x] Refactor while green

**Acceptance Criteria**:
- `RESCUE+MEDICAL#Feni#Parshuram#School#…` gives rescue and medical; unknown or missing keywords
  give Other; existing providers are unaffected.
- Tests written first, watched fail, now passing; full suite green; commit.

---

### Task Group 4: Events and hazards

**Priority**: High
**Files**:
- `apps/events/` (new app: `apps.py`, `models.py`, `services.py`, `serializers.py`, `apis.py`, `urls.py`, `admin.py`, `migrations/`, `tests/`)
- `config/settings.py` (INSTALLED_APPS), `config/urls.py`
- `apps/incident_manager/models/incident.py`, `migrations/0010_incident_event.py`, `serializers.py`

#### Subtasks (test-first — RED before GREEN):

**4.1 HazardType, Event and active events**
- [x] Write failing tests:
  - an active event has started and not ended;
  - ended and future events are not active;
  - the seeded hazard types cover every proposed group.
- [x] Verify they fail
- [x] Create app `apps.events`; `HazardType(TypeBase, group)`, `Event`, `EventQuerySet.active()`;
      migrations 0001 (depends on incident_manager 0008) and 0002 (seed hazards)
- [x] Refactor while green

**4.2 `attach_event` and Incident.event**
- [x] Write failing tests:
  - an incident in a district covered by an active event is attached to it;
  - ended and not-yet-started events are ignored;
  - when several active events cover the district, the most recently started one wins;
  - an incident without a district is not attached to any event.
- [x] Verify they fail
- [x] `Incident.event` FK (`"events.Event"`) in incident_manager 0010 (depends on events 0001);
      `attach_event()` in `apps/events/services.py`
- [x] Refactor while green

**4.3 Events in intake, list, PATCH and lookup**
- [x] Write failing tests:
  - the district and thana named in a report are set when they match known ones, ignoring case
    (added during execution: providers send no district, so auto-attach needs this);
  - an unknown district name leaves the incident without a district;
  - a new incident in a district with an active event is attached to that event;
  - operators see the incident's event (id and name) in the list;
  - an operator can attach an incident to an event, and an unknown event is refused with 400;
  - the events list with `active=true` returns only active events with their hazard;
  - non-operators get 403 on the events list.
- [x] Verify they fail
- [x] Call `attach_event` in `IncidentSerializer.create`; add `event` to the list and operator
      serializers (`select_related`); `EventListView` and `/api/events/`; `HazardTypeAdmin`,
      `EventAdmin`
- [x] Refactor while green

**Acceptance Criteria**:
- Operators can create events in the admin; new incidents attach automatically; events are
  visible and settable through the API.
- Migrations apply on a fresh database and on the existing dev database.
- Tests written first, watched fail, now passing; full suite green; commit.

---

### Task Group 5: Volunteer skills

**Priority**: Medium
**Files**:
- `apps/volunteer_hub/models/volunteer.py`, `serializers.py`, `admin.py`
- `apps/volunteer_hub/migrations/0006_volunteer_skills.py`
- `apps/volunteer_hub/tests/test_get_volunteer.py`, `tests/test_skills_migration.py` (new)
- `apps/incident_manager/tests/test_model_validation.py` (asserts on `assistance_type`)

#### Subtasks (test-first — RED before GREEN):

**5.1 Skills field and API**
- [ ] Write failing test: the volunteer list includes each volunteer's skills
- [ ] Verify it fails
- [ ] `Volunteer.skills` (M2M NeedType); `assistance_type` becomes `blank=True, default=""` with a
      deprecation `help_text`; the serializer adds `skills`; the admin uses
      `filter_horizontal`
- [ ] Refactor while green

**5.2 Migrate assistance types**
- [ ] Write failing test: existing volunteer assistance types map to skills, and unmapped values
      are kept in notes (call the migration function directly)
- [ ] Verify it fails
- [ ] Data step in migration 0006, using the mapping from the spec; reverse is a no-op for notes
- [ ] Update `test_model_validation.py` if its `assistance_type` assertions change
- [ ] Refactor while green

**Acceptance Criteria**:
- Volunteers expose skills; existing values are migrated or preserved; `assistance_type` is still
  present.
- Tests written first, watched fail, now passing; full suite green; commit.

---

### Task Group 6: Verification and docs

**Priority**: Medium
**Files**:
- `docs/development.md` (APIs, operator access, SMS format)
- `agent-os/specs/2026-11-04-hazard-agnostic-incident-types/tasks.md`, `spec.md` (status)

#### Subtasks:

**6.1 Full verification**
- [ ] `docker compose run --rm unit_tests` and `npm test` green
- [ ] Apply migrations to the running dev database (`migrate`); confirm the existing incidents
      have Other and the volunteers have skills
- [ ] Headless Chrome check: a staff user sees the map and list; a non-staff user sees the
      operator-access message on both pages
- [ ] Manual API smoke test: provider POST with `RESCUE+MEDICAL#…`, PATCH validate plus
      reclassify, `GET /api/events/?active=true` after creating an event in the admin

**6.2 Docs**
- [ ] `docs/development.md`: operator (staff) access, new endpoints, the SMS format and keywords,
      how to create an event
- [ ] Mark tasks complete and set the spec status

**Acceptance Criteria**:
- All suites green; manual checks pass; docs updated; final commit; ready for `/pr-create`.

---

## Execution Order

1. **Operator access and PATCH endpoint**: closes the data exposure first; later groups extend
   the PATCH.
2. **Need types and incident triage fields**: the models everything else depends on.
3. **Report parser and provider intake**: needs the NeedType keyword map.
4. **Events and hazards**: needs District and Incident; adds the cross-app FK last.
5. **Volunteer skills**: needs NeedType; independent of events.
6. **Verification and docs**.

---

## Key Implementation Notes

### Patterns to Follow
- **Tests:**
  - `APITestCase` plus `force_authenticate` for API tests; `SimpleTestCase` for the parser.
  - Patch `apps.incident_manager.signals.process_incident_and_send_sms.delay`, as in
    `test_incident.py`.
  - Locations use `Point(lon, lat, srid=4326)`.
- **Enums** stay in `constants.py` (`IncidentStatus`, `TaskStatus`); never compare to string
  literals.
- **Python 3.8:** no `match`, no `X | Y`, no `list[str]` at runtime; use `typing.List` and
  `NamedTuple`.
- **`drf_yasg` `@swagger_auto_schema`** on every new view.
- **Data migrations** use `apps.get_model()`, never imported models. Expose the forward function
  at module level so tests can call it with `django.apps.apps`.

### Risk Mitigation
- **Circular app references** (events ↔ incident_manager): string FK references
  (`"events.Event"`, `"incident_manager.District"`) and the migration order in the spec. Run
  `migrate` from zero (`unit_tests` does) and on the dev database.
- **Locking out current users:** the incident list becomes staff-only, so mark dev operator
  accounts `is_staff` (1.4) and say so in the PR description.
- **Seed overwrites:** use `update_or_create` with defaults only on create (`get_or_create`
  plus a no-op on existing rows), so admin edits survive re-runs.
- **Signal bypass:** the PATCH must save via the instance, not `QuerySet.update()`. A test
  asserts the SMS task is queued.
- **Root-owned migration files** created in the container: `chown` them after `makemigrations`.

---

## Dependencies

**External Dependencies:**
- PostgreSQL (`ArrayField` for keywords) is already in use with PostGIS. No new Python or JS
  packages.

**Internal Dependencies:**
- `District` / `Thana` (`apps/incident_manager/models/address.py`). Districts aren't loaded yet
  (PR #59), so tests create their own; auto-attach only works in real use once districts exist.
- The stashed WIP tests (`git stash list`: "WIP: incident status endpoint tests") are the starting
  point for Task Group 1.
- `docker compose` stack running for `exec`-based test runs.
