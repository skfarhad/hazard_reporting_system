# Task Breakdown: Bangladesh administrative boundaries

**Spec**: `2026-11-05-bd-admin-boundaries`
**Status**: Ready for Implementation

## Task List

### Task Group 1: Name rules, area codes and the Union model

**Priority**: High
**Files**:
- `apps/incident_manager/models/address.py`, `models/__init__.py`, `models/incident.py`
- `apps/incident_manager/migrations/0013_admin_boundaries.py`
- `apps/incident_manager/admin.py`
- `apps/incident_manager/tests/test_admin_boundary_models.py`

#### Subtasks (test-first — RED before GREEN):

**1.1 Names unique per parent**
- [x] Write failing tests: same thana name allowed in two districts; rejected twice in one district ignoring case; district name rejected twice in one division
- [x] Verify they fail (global unique rule) for the expected reason
- [x] Drop `unique=True`, add `UniqueConstraint(Lower("name"), parent)`; migration
- [x] Refactor while green

**1.2 Area codes**
- [x] Write failing tests: codes unique across the country; hand-added places need no code
- [x] Verify fail → add nullable unique `code` on each level

**1.3 Union model and `Incident.union`**
- [x] Write failing test: same union name allowed in two thanas, not twice in one
- [x] Verify fail → add `Union`, `Incident.union` (SET_NULL), admin registration

**Acceptance Criteria**:
- One migration `0013`, applies on the current DB; existing place tests still pass
- Tests written first, watched fail, now passing

---

### Task Group 2: Import service and command

**Priority**: High
**Files**:
- `apps/incident_manager/services/boundaries.py`
- `apps/incident_manager/management/__init__.py`, `management/commands/__init__.py`, `management/commands/import_bd_boundaries.py`
- `apps/incident_manager/tests/test_import_bd_boundaries.py`

#### Subtasks:

**2.1 Official spellings**
- [ ] Failing test: old spellings become official ones as whole words (Comilla Sadar Dakshin → Cumilla Sadar Dakshin), others unchanged
- [ ] Implement `OFFICIAL_NAMES`, `official_name()`

**2.2 Build the hierarchy from codes**
- [ ] Failing tests: builds all four levels from tiny temp GeoJSON files; polygons stored as multipolygons; centre inside each area
- [ ] Implement reading with GDAL `DataSource`, rename, simplify (0.0001°, topology preserved), make valid, `point_on_surface`, upsert by code, parents first

**2.3 Idempotent and adopting**
- [ ] Failing tests: second run creates no duplicates and updates shapes; hand-added Chattogram/Feni/Parshuram are adopted (ids, incidents kept, codes set)
- [ ] Implement code-then-(parent, name) matching; batch saves for unions

**2.4 Safety and reporting**
- [ ] Failing tests: missing level file → error naming it; unknown parent code → nothing saved; small island kept after simplifying; command prints created/updated per level
- [ ] Implement one transaction, `CommandError`s, summary output

**Acceptance Criteria**:
- `python manage.py import_bd_boundaries <folder>` works on the test files; no network access
- Tests written first, watched fail, now passing

---

### Task Group 3: Area assignment for new reports

**Priority**: High
**Files**:
- `apps/incident_manager/services/incidents.py`
- `apps/incident_manager/tests/test_incident_service.py`

#### Subtasks:

**3.1 Union by location**
- [ ] Failing tests: location-only report gets district, thana and union; union limited to the report's thana when known; outside every boundary → no area
- [ ] Implement union lookup in `create_incident`

**3.2 Old spellings in SMS**
- [ ] Failing test: SMS naming "Comilla" finds Cumilla
- [ ] Use `official_name()` in the name lookups

**Acceptance Criteria**:
- Tests written first, watched fail, now passing; existing service tests green

---

### Task Group 4: API, web app and docs

**Priority**: Medium
**Files**:
- `apps/incident_manager/places_manage.py`, `apps/incident_manager/serializers.py`
- `apps/incident_manager/tests/test_place_management_api.py`, `tests/test_incident_detail_api.py`
- `apps/webui/static/webui/js/incident-views.js` (+ `.test.js`)
- `apps/webui/templates/webui/locations.html`
- `docs/development.md`

#### Subtasks:

**4.1 Place management validation**
- [x] Failing tests: thana name from another district accepted; same name twice in one district → 400 `name` error (not 500) — pulled into Group 1 (dropping the global rule broke the existing duplicate-district test)
- [x] Implement serializer validation (case-insensitive, per parent)
- [ ] Failing test + implementation: rows and details show read-only `code`

**4.2 Union in incident data**
- [ ] Failing test: incident list and details include `union` name
- [ ] Add `union` to the serializer and `select_related`

**4.3 Union in incident details (web)**
- [ ] Failing Vitest: details list union with thana and district, escaped; omitted when unknown
- [ ] Implement in `incident-views.js`

**4.4 Attribution and docs**
- [ ] Failing test: Location page shows the OCHA/BBS attribution
- [ ] Add it; document `import_bd_boundaries` in `docs/development.md`

**Acceptance Criteria**:
- Tests written first, watched fail, now passing

---

### Task Group 5: Real-data run

**Priority**: High
**Files**: none (record results here)

- [ ] Run `docker compose exec be python manage.py import_bd_boundaries .local/Bangladesh_GeoJSON`
- [ ] Check counts 8 / 64 / 544 / 5,160, every row with polygon, centre and code
- [ ] Chattogram / Feni / Parshuram ids unchanged; incidents still linked
- [ ] Second run creates 0
- [ ] Point (20.627, 92.322) → Teknaf thana and its union
- [ ] Record run time, peak memory and DB size

---

## Execution Order

1. **Task Group 1** (schema first)
2. **Task Group 2** (needs the schema)
3. **Task Group 3** (needs Union and `official_name`)
4. **Task Group 4**
5. **Task Group 5**, then `/run-tests bd-admin-boundaries`

---

## Key Implementation Notes

### Patterns to Follow
- Services hold logic; the command is a thin wrapper (like `services/incidents.py`).
- Test names are full sentences; tests use tiny hand-made GeoJSON in a temp folder, never `.local/`.
- `Point(lon, lat)` for locations.
- Serializers return clear field errors instead of letting `IntegrityError` become a 500.

### Risk Mitigation
- Memory: GDAL `DataSource` per feature + batched saves (the unions file is 319 MB).
- Shared-border slivers from per-area simplification: small tolerance (≈11 m).
- `Union` shadows `typing.Union` only if both are imported; don't import `typing.Union` in these modules.
- Migration dropping `unique` on names: safe, current data has no duplicates.

---

## Dependencies

**External Dependencies:**
- GDAL 3.6 in the `be` image (already present); no new packages.
- Data: `.local/Bangladesh_GeoJSON/` (OCHA COD-AB via Kaggle, CC BY-IGO), not committed.

**Internal Dependencies:**
- `services/incidents.py` (area assignment), `places_manage.py` (Location tab API), `incident-views.js`.
