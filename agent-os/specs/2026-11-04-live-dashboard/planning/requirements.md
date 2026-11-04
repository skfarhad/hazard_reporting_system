# Feature Requirements: Live three-panel dashboard (incidents, map, volunteers)

## Overview
Operators need one screen showing what is happening now: the incidents waiting for action, where they
are on the map, and which volunteers are available nearby. The mockup `live_dashboard.jpeg` (repo root)
defines the layout. Operators benefit; non-operators keep the "Report incident" panel.

## User Stories
- As an operator, I want to see today's pending incidents in a list beside the map, so that I can triage without switching pages.
- As an operator, I want Pending / Resolved / Total counts for the chosen period, so that I know the workload at a glance.
- As an operator, I want to filter incidents and volunteers by district (Zilla) and thana (Upazilla), so that I can focus on one area.
- As an operator, I want to pick an incident in the list and see it on the map (and the reverse), so that I can relate places to reports.
- As an operator, I want to see which volunteers are active and where they are, so that I can assign help.
- As an operator, I want the dashboard to update by itself, so that new reports appear without reloading.

## Functional Requirements
1. Three-panel layout: incident panel (left), map (centre), volunteer panel (right); side panels collapse.
2. Incident panel: period dropdown (e.g. Today), Pending / Resolved / Total cards (clickable as filters), Zilla and Upazilla filters, search, "Showing N <status> Incidents", incident cards (title "District-Thana Incident", date and time, district and thana, short message, volunteers count, status badge).
3. Map: incident pins (existing need-type pins); selecting a card highlights its pin and opens a popup card; clicking a pin highlights its card.
4. Volunteer panel: Active / Inactive / Total cards, Zilla and Upazilla filters, search, volunteer cards (name, phone, district and thana, avatar with an active dot).
5. Live updates (mechanism to be decided in /plan).
6. Navbar per the mockup (Dashboard, Incidents, Volunteers, Location; notifications; avatar) — scope to be decided in /plan.

## Non-Functional Requirements
- Performance: bounded query counts for list and summary APIs; no N+1 for volunteer counts.
- Security: operator-only data (incidents, volunteers) stays staff-only; non-operators see the report panel.
- Accessibility: keyboard reachable cards and filters; counts announced politely; works on phones (panels stack or become drawers).

## Acceptance Criteria
- [ ] The dashboard matches the mockup layout on desktop and is usable on phones.
- [ ] Counts, list and map agree for the chosen period and area.
- [ ] List and map selection are linked both ways.
- [ ] Volunteer panel shows active/inactive counts and filters by area.
- [ ] New incidents appear without a manual reload.

## Out of Scope
- To be settled in /plan (e.g. notifications, Location tab).

## Notes
Gaps against today's code: "Resolved" status (today: pending/validated/rejected), volunteers-per-incident count, volunteer active/inactive, live updates (polling vs push), notifications, and the Location tab.
