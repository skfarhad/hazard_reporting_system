# Feature Requirements: Report an incident from the web app for staff review

## Overview

Incidents can only be created by SMS/telecom **providers** through `POST /api/incidents/` with an
API key. People using the web app (operators taking a phone call, volunteers in the field, or
members of the public with an account) have no way to report an incident. This feature adds a
"Report incident" option on the dashboard and the Incidents page. Every web report starts as
**pending** and is reviewed by staff (operators), who validate or reject it with the existing
quick actions.

## User Stories

- As an **operator** taking a phone call, I want to enter an incident from the dashboard or the
  Incidents page, so that it joins the same review and response flow as SMS reports.
- As **anyone with an account** (operator or not), I want to report an incident from the web app,
  so that staff can review it and send help.
- As an **operator**, I want web reports to start as pending and show who reported them and that
  they came from the web, so that I review them before acting.

## Functional Requirements

### Who and where
1. **Anyone with an account** can report (decided). Operators and non-operators both get a
   **"Report incident"** button in the header of the dashboard (`/app/`) and the Incidents page
   (`/app/incidents/`).
2. Non-operators still see no incident data: the access notice becomes a panel ("Need help or saw
   an emergency? Report it. Staff review every report before help is sent." + Report button +
   "Operator? Ask an admin for access.").

### Form (Bootstrap pop-up, full screen on phones)
3. Fields:
   - **What's happening** (message, required, ≤ 2000 characters);
   - **Needs** chips (optional; none picked → read SMS keywords from the message, else "Other");
   - **Life-threatening** switch; **People affected** (optional, whole number ≥ 0);
   - **Contact number** (required, pre-filled from the reporter's profile phone, editable;
     Bangladeshi mobile `01XXXXXXXXX`, `+8801…`/`8801…` accepted and normalised);
   - **District** and **Thana** dropdowns (optional; thanas filtered by district);
   - **Address** (required, ≤ 255);
   - **Location** (required): tap the map to place the pin (drag to adjust) or "Use my location"
     (browser GPS); must be inside Bangladesh.
4. Errors appear next to fields (client checks + server 400s); submit is disabled while sending.
5. After success: the pop-up closes and a toast says "Report #123 sent for staff review."
   Operators' list/map refresh and show it as pending.

### API
6. `POST /api/incidents/report/` (JWT, any signed-in user) creates the incident:
   `validation_status` is always **pending** (not accepted from the client), `source = "web"`,
   `reported_by = request.user`. Needs, district/thana and event follow the same rules as provider
   reports (shared service). Response `201 {id, validation_status, created_at}`.
7. District/thana: a dropdown choice wins (thana must belong to the district); otherwise the
   names from SMS keywords in the message; otherwise the district/thana whose boundary contains
   the pin (works once boundary shapes are loaded); otherwise empty.
8. **Rate limit**: non-operators 10 reports per hour per account (429 with a clear message);
   operators are not limited. Rate in settings.
9. `GET /api/incidents/places/` (any signed-in user): districts with their thanas, for the form.
10. `GET /api/incidents/need-types/` opens to any signed-in user (read-only labels/icons) so
    non-operators get the need chips.

### Data and review
11. `Incident.reported_by` (user, nullable, kept as NULL if the user is deleted) and
    `Incident.source` (`provider` | `web`, existing rows `provider`).
12. Operators see the source in the list (small "Web" badge) and "Web · reported by <name>" in the
    details pop-up; they validate or reject as usual.
13. **Providers too:** the provider create API no longer accepts `validation_status`; every new
    incident from any source starts pending.

## Non-Functional Requirements

- **Performance:** one request to submit; the form loads need types and districts once.
- **Security:** authenticated only; status forced to pending; validated inputs (phone format,
  coordinates inside Bangladesh, lengths); text escaped everywhere it is shown.
- **Accessibility:** labelled fields; the map has a keyboard-usable alternative ("Use my
  location", and the typed address/district/thana); errors linked to fields with
  `aria-describedby`; focus moves to the first invalid field.
- **Responsive:** usable on a phone in the field.

## Acceptance Criteria

- [ ] "Report incident" is on the dashboard and the Incidents page for operators and non-operators.
- [ ] Non-operators see the report panel, not incident data.
- [ ] A valid report creates a pending incident with `source=web`, `reported_by`, needs, triage
      fields, contact (normalised), address, district/thana and location; attached to an active
      event when one covers the district.
- [ ] Clients cannot set the status (web and provider APIs).
- [ ] Invalid input (missing message/address/location, bad phone, outside Bangladesh, thana not in
      district, bad people count, unknown need) gives errors next to the fields.
- [ ] Non-operators are limited to 10 reports per hour; operators are not.
- [ ] Operators see the "Web" badge and reporter, and can validate/reject it.
- [ ] Tests written first and passing.

## Out of Scope (unless `/plan` decides otherwise)

- Anonymous (signed-out) reporting.
- Photo or file attachments.
- A "My reports" list / reporters tracking or editing their reports.
- SMS confirmation to the reporter.
- Loading district/thana boundary shapes (detection works once they are loaded).

## Notes

- Existing create path: `IncidentSerializer` (provider API key) in
  `apps/incident_manager/serializers.py`; it accepts `validation_status` from the provider — a
  provider can submit an already-validated incident. Decide in `/plan` whether to close that too.
- `Incident` has no reporter field today (only `provider`).
- Dashboard and Incidents page currently show non-operators an "operator access" notice.
- Builds on need-type-map-icons and incident-list-needs-filters-details (merged).
