# Feature Requirements: Incident list: needs and hazard, filters, search and details view

## Overview

The operator Incidents page (`/app/incidents/`) is a plain table (reported, description, address,
contact, status, task) with a client-side search and a status dropdown over the newest 500
incidents. Since #75 every incident has needs, a life-threatening flag, a people count and an
optional event with a hazard, but the page shows none of them, cannot filter by them, cannot
reach incidents beyond the newest 500, and there is no way to open one incident, see everything
about it or act on it. This feature turns the page into the operators' triage tool.

## User Stories

- As an **operator**, I want to see each incident's needs, urgency and its event and hazard in
  the list, so that I know what help is needed and for which emergency.
- As an **operator**, I want to filter by need, status, event or hazard and life-threatening, and
  search by text and place, across all incidents, so that I can work through one kind of request.
- As an **operator**, I want my filters and page in the URL, so that a refresh or a shared link
  shows the same view.
- As an **operator**, I want to open an incident in a pop-up with all its details and a small map,
  step to the previous/next incident, validate or reject it, and correct its needs, urgency,
  people count, event and task status, without leaving the list.
- As an **operator on a phone**, I want the list as readable cards.

## Functional Requirements

### List API (server-side filtering and pagination)
1. `GET /api/incidents/list/` is paginated (DRF page-number style):
   `{count, next, previous, results}`; default 25 per page, `?page_size=` up to 500, newest first.
2. Filters (all optional, combined with AND):
   - `needs=rescue,medical`: incidents with **any** of the listed need codes (no duplicates);
     unknown codes → 400.
   - `status=pending|validated|rejected`; invalid → 400.
   - `event=<id>` or `event=none` (no event).
   - `hazard=<code>`: incidents whose event has that hazard.
   - `life_threatening=true|false`.
   - `q=<text>`: case-insensitive contains over description, address, contact number, district
     name, thana name and event name.
3. Each result's `event` includes its `hazard` `{code, label_en, icon, colour}`.
4. Constant number of queries per page regardless of page size.
5. The dashboard map requests `?page_size=500` and reads `results`.

### Detail API
6. `GET /api/incidents/<id>/` (operators only) returns one incident with everything in a list row
   plus district and thana names, provider name, assigned volunteer (id, name), `updated_at`.
7. `PATCH /api/incidents/<id>/` (exists) responds with the same detail shape.

### Incidents page
8. **Filter bar:** search box (debounced), Status dropdown, Event/hazard dropdown (All, No event,
   events grouped, hazards grouped), "Life-threatening" toggle, and a row of need chips (icon +
   label, multi-select). "Showing 26–50 of 148" and "Clear filters". Filters, search and page are
   kept in the page URL query string and restored on load/back/forward. Changing a filter goes
   back to page 1.
9. **List (≥768px table):** needs (icons, labels in tooltip/visually-hidden text), message
   (truncated), location (thana, district or address), event + hazard (icon + label, or "No
   event"), life-threatening badge and people count, status, reported time. Rows are clickable
   and keyboard-activatable (open details).
10. **List (<768px cards):** need icons, "!" and people count, status, two-line message,
    location, event + hazard, time. Tap to open details.
11. **Pagination:** Prev, page numbers (with ellipsis), Next; 25 per page.
12. **Details pop-up** (Bootstrap modal, opens from a row/card; deep link `#incident-<id>`):
    - all fields read-only: full message, needs, life-threatening, people count, event + hazard,
      address/district/thana, coordinates, contact (`tel:` link), validation and task status,
      volunteer, provider, reported/updated times;
    - small Leaflet map with the incident's need pin (from need-type-map-icons) and an "Open in
      Google Maps" link; "No location" when there are no coordinates;
    - **Prev / Next** through the current filtered list (also ← / → keys); at a page edge it
      loads the adjacent page;
    - **Quick actions:** Validate / Reject / back to Pending buttons, and an Edit section for
      needs (chips, at least one), life-threatening, people count, event (active events plus the
      current one, or none) and task status. Save sends one PATCH; errors are shown in the form;
      on success the row/card and the pop-up refresh and a toast confirms.
13. Non-operators keep seeing the operator access notice.

## Non-Functional Requirements

- **Performance:** list API constant queries per page (`select_related` event, hazard, district,
  thana; `prefetch_related` needs); indexes exist on `life_threatening`; search uses `icontains`
  (fine at current volumes; full-text search is out of scope).
- **Security:** all incident APIs operator-only (`IsAdminUser`); filter values validated; text
  escaped; icon names/colours validated (`safeIcon`/`safeColour`). Validating fires the existing
  `process_incident_and_send_sms` task, which is still a placeholder (no SMS is sent yet).
- **Accessibility:** labelled filter controls; chips are `<button aria-pressed>`; needs/hazard
  never colour-only; rows keyboard-activatable; modal focus-trapped (Bootstrap), Escape closes,
  focus returns to the row; form errors linked with `aria-describedby`.
- **Responsive:** cards below 768px; modal full-screen below 576px.

## Acceptance Criteria

- [ ] List API paginates (25 default, `page_size` ≤ 500) and filters by needs (any), status,
      event/none, hazard, life-threatening and `q`; bad values give 400; constant queries.
- [ ] Results' `event` carries the hazard.
- [ ] Detail GET returns the extended shape; PATCH responds with it; both operator-only.
- [ ] Dashboard map still shows up to 500 incidents.
- [ ] Incidents page shows needs, urgency, event + hazard; table on desktop, cards on phones.
- [ ] Filter bar, search, need chips, Clear, "Showing x–y of n", pagination; state in the URL.
- [ ] Details pop-up with all fields, map preview, Prev/Next (keys too, across pages), deep link.
- [ ] Validate/Reject/Pending and triage edit save via PATCH, show errors, refresh the row.
- [ ] Non-operators see the access notice; all tests pass.

## Out of Scope

- Volunteer assignment from the pop-up (#41).
- Editing description, address, location or contact.
- Bulk actions on several incidents.
- Full-text search / ranking; exporting.
- Bangla labels in the UI.
- Real SMS sending on validate (task is a placeholder).

## Notes

- Based on `feat/need-type-map-icons` (not yet merged); reuses `incidentNeeds`, `primaryNeed`,
  `safeIcon`, `safeColour`, `incidentPinHtml`/`incidentIcon` from `map.js`.
- `django-filter` is installed and `DjangoFilterBackend` is the default filter backend.
- Incidents have no separate "area" field; the parsed area is part of `address`.
