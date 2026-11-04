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
- As a **signed-in user** (to confirm in `/plan`), I want to report an incident from the web app,
  so that staff can review it and send help.
- As an **operator**, I want web reports to start as pending and show who reported them and that
  they came from the web, so that I review them before acting.

## Functional Requirements

1. A **"Report incident"** button on the dashboard (`/app/`) and the Incidents page
   (`/app/incidents/`) opens a report form (form type to decide in `/plan`).
2. The form collects (to confirm in `/plan`): message, needs (chips, at least one; or "not sure"
   → Other), life-threatening, people affected, contact number, address, district and thana,
   and the location (map pick and/or "use my location").
3. A new **API endpoint** for signed-in users creates the incident (JWT auth, not the provider API
   key). The server always sets `validation_status = pending`; clients cannot set it.
4. The incident records **who reported it** and that it came from the web app (data model to
   decide in `/plan`), and operators see this in the incident details.
5. The new incident goes through the same processing as provider reports: needs (explicit or from
   SMS keywords), district/thana, auto-attach to an active event.
6. After submitting, the reporter sees a confirmation; operators see the new incident at the top of
   the list as pending.
7. Basic abuse protection for the public path (rate limit; to confirm in `/plan`).

## Non-Functional Requirements

- **Performance:** one request to submit; the form loads need types and districts once.
- **Security:** authenticated only; status forced to pending; validated inputs (phone format,
  coordinates inside Bangladesh, lengths); text escaped everywhere it is shown.
- **Accessibility:** labelled fields, keyboard-usable map alternative (typed address / "use my
  location"), errors linked to fields, focus management in the form.
- **Responsive:** usable on a phone in the field.

## Acceptance Criteria

- [ ] "Report incident" is available on the dashboard and the Incidents page.
- [ ] Submitting a valid form creates a pending incident with needs, triage fields, place and
      location, and attaches it to an active event when it applies.
- [ ] The server ignores any attempt to set the status; the reporter and source are recorded.
- [ ] Invalid input shows errors next to the fields.
- [ ] Operators see the new incident as pending and can validate or reject it.
- [ ] Tests written first and passing.

## Out of Scope (unless `/plan` decides otherwise)

- Anonymous (signed-out) reporting.
- Photo or file attachments.
- Reporters tracking or editing their reports later.
- SMS confirmation to the reporter.

## Notes

- Existing create path: `IncidentSerializer` (provider API key) in
  `apps/incident_manager/serializers.py`; it accepts `validation_status` from the provider — a
  provider can submit an already-validated incident. Decide in `/plan` whether to close that too.
- `Incident` has no reporter field today (only `provider`).
- Dashboard and Incidents page currently show non-operators an "operator access" notice.
- Builds on need-type-map-icons and incident-list-needs-filters-details (merged).
