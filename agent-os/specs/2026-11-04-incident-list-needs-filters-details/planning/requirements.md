# Feature Requirements: Incident list: needs and hazard, filters, search and details view

## Overview

The operator Incidents page (`/app/incidents/`) is a plain table: reported time, description,
address, contact, status and task. It has a text search (description, address, phone) and a
status dropdown. Since #75 every incident has needs, a life-threatening flag, a people count and
an optional event with a hazard type, but the table shows none of them, and there is no way to
open one incident and see everything about it. Operators triaging a busy event need to see and
filter by what help is needed and which emergency an incident belongs to, and to open an incident
to read the full message and details.

## User Stories

- As an **operator**, I want to see each incident's needs (icon + label) in the list, so that I
  know what help is required without opening it.
- As an **operator**, I want to see which event and hazard (e.g. "Feni Flood · Flood") an
  incident belongs to.
- As an **operator**, I want to filter the list by need, status, event/hazard and
  life-threatening, and search it, so that I can work through one kind of request at a time.
- As an **operator**, I want to open an incident and see all its details (full message, needs,
  triage, event and hazard, location, contact, statuses, times), so that I can act on it.

## Functional Requirements

1. **List columns** show each incident's needs (icons and labels in need-type order, from
   `GET /api/incidents/need-types/`), life-threatening and people count, and its event name with
   the hazard type (icon + label). Incidents without an event show "No event".
2. The incident **list API** returns the event's hazard (`code`, `label_en`, `icon`, `colour`)
   inside `event`, still in a constant number of queries.
3. **Filters** (to be confirmed in `/plan`): need, validation status, event or hazard,
   life-threatening only. Filters combine (AND) with each other and with search.
4. **Search** covers description, address, contact number and (to confirm) event name and need
   labels; case-insensitive.
5. **Details view** for one incident (form to be decided in `/plan`: side panel/drawer, modal or
   separate page): full description, needs, life-threatening, people count, event and hazard,
   address and location (map preview to be decided), contact (tap to call), validation and task
   status, reported/updated times.
6. A **detail API** (`GET /api/incidents/<id>/`, operators only) returns one incident in the list
   shape if the details view needs data the list doesn't have, or for deep links.
7. Non-operators keep seeing the operator access notice.

## Non-Functional Requirements

- **Performance:** up to 500 incidents (the list API cap) filter and search instantly on the
  client; list API stays a constant number of queries with the hazard added.
- **Security:** operator-only APIs (`IsAdminUser`); all text escaped; icon names/colours from the
  database validated as in need-type-map-icons.
- **Accessibility:** filters are labelled controls; needs and hazard are never colour-only (icon +
  text); the details view is keyboard-reachable, focus-managed and closable with Escape.
- **Responsive:** usable at 375px (the table scrolls or becomes cards; to decide in `/plan`).

## Acceptance Criteria

- [ ] The list shows needs, life-threatening/people count and event + hazard for every incident.
- [ ] The list API includes the event's hazard without extra queries per incident.
- [ ] Filters for need, status, event/hazard and life-threatening work together with search.
- [ ] Search matches description, address and contact (plus any fields agreed in `/plan`).
- [ ] An operator can open an incident's details view and see all its fields; text is escaped.
- [ ] Non-operators still see the access notice; all tests pass.

## Out of Scope (unless `/plan` decides otherwise)

- Editing an incident (needs, status, event) from the details view — the PATCH API exists; a
  later feature can add the form.
- Server-side pagination or filtering beyond the 500-incident cap.
- Volunteer assignment from the details view (#41).
- Bangla labels in the UI.

## Notes

- Existing: `apps/webui/templates/webui/incidents.html`, `static/webui/js/incidents.js`,
  `tables.js` (`filterIncidents`, `incidentRow`), `IncidentListSerializer.get_event`.
- Need helpers from need-type-map-icons: `incidentNeeds`, `primaryNeed`, `safeIcon`, `safeColour`
  in `map.js`. This branch is based on `feat/need-type-map-icons` (not yet merged).
- Hazard types: `apps/events` (`HazardType`, `Event.hazard`).
