# Feature Requirements: Hazard-agnostic incident types: needs, hazards and events

## Overview

Incidents have no type today: `Incident.description` is free text, the SMS format
(`District#Thana#Area#Message`) carries no category, and `Volunteer.assistance_type` is free
text, so "doctor", "Doctor" and "medical" are three different values. Without shared categories we
can't match volunteers to incidents (#41), filter the dashboard, or reuse the platform beyond
floods.

The platform should work for any hazard. We separate two questions:

- **What help is needed?** (need type, per incident). This is reported by the person in distress
  and offered by volunteers, and it's the same across hazards.
- **What is happening?** (hazard, per event). This is set by operators when they activate an
  event such as "Sylhet Flood, June 2027". Reporters never have to name the hazard.

Benefits: reporters (simple SMS keywords in English or Banglish), operators (triage and filters),
volunteers (matched to needs they can meet), and the project (new hazards need no code change).

## User Stories

- As a **person in distress**, I want to start my SMS with one word like `RESCUE` or `UDDHAR`, so
  that the right kind of help is sent.
- As a **person in distress**, I want my message accepted even if I get the keyword wrong or leave
  it out, so that I'm never turned away.
- As an **operator**, I want each incident to show its needs, whether it is life-threatening and
  how many people are affected, so that I can triage quickly.
- As an **operator**, I want to set or correct an incident's needs while validating it, so that
  messages marked "Other" still reach the right volunteers.
- As an **operator**, I want to activate an event with a hazard, an area and a start date, so that
  incoming incidents are grouped under it, and to close it when the response ends.
- As a **volunteer coordinator**, I want each volunteer to pick the needs they can meet from the
  same list, so that matching is exact.
- As an **administrator**, I want to add a need or hazard type, or a new SMS keyword spelling, in
  the Django admin, so that no deploy is needed.

## Functional Requirements

1. **Need types** are a database table: `code` (unique, e.g. `rescue`), `label_en`, `label_bn`,
   `sms_keywords` (list of keywords, matched case-insensitively), `icon` (Bootstrap Icons name),
   `colour`, `sort_order`, `is_active`, `is_fallback` (exactly one: `other`).
2. A data migration seeds the need types: Rescue, Medical, Food, Water & sanitation, Shelter,
   Missing person, Safety, Damage report, Other, with the English and Banglish keywords from
   the notes (plus Bangla script where given).
3. **Hazard types** are a database table with the same fields plus `group` (water & weather,
   geological, fire & structural, transport, biological, other). A data migration seeds the list
   from the notes.
4. **Incident** gets:
   - `needs`: many-to-many to need types, at least one; the fallback is `other`;
   - `life_threatening`: boolean, default false;
   - `people_count`: positive integer, optional;
   - `event`: optional foreign key to Event.
5. **Event** model: `name`, `hazard` (FK to hazard type), `districts` (M2M to District, the
   affected area), `started_at`, `ended_at` (null while active), `notes`. Managed in the admin.
6. **Auto-attach**: a new incident is attached to the active event whose districts include the
   incident's district. If none matches (or the district is unknown), `event` stays empty for an
   operator to set. If several match, the most recently started one wins.
7. **SMS keyword parsing** (pure function in the incident app, no Django request needed):
   - Input `NEED#District#Thana#Area#Message`. The first segment may hold several keywords
     separated by `,` or `+` (e.g. `RESCUE+MEDICAL`).
   - Unknown or missing keyword: needs = `[other]`, and the whole text is kept as the message.
   - The old 4-part format (`District#Thana#Area#Message`) is still accepted as `other`.
   - Keyword matching ignores case and surrounding spaces.
8. **Incident create API** (`POST /api/incidents/`, provider API key) accepts optional `needs`
   (list of codes), `life_threatening` and `people_count`. If `needs` is absent, they are parsed
   from the description using requirement 7. Unknown codes are rejected with 400.
9. **Incident list API** (`GET /api/incidents/list/`) returns `needs` (codes), `life_threatening`,
   `people_count` and `event` (id and name) for each incident.
10. **Operators can update** an incident's needs, `life_threatening`, `people_count` and `event`
    (admin now; dashboard drawer in the dashboard feature).
11. **Read-only lookup APIs** for the dashboard: `GET /api/incidents/need-types/` and
    `GET /api/incidents/events/?active=true`, returning labels in both languages, icon and colour.
12. **Volunteers** get `skills`: M2M to need types. A data migration maps existing free-text
    `assistance_type` values to need types (`food` → food, `doctor`/`medical`/`medicine` →
    medical, `boat`/`rescue` → rescue, …). Unmapped values are appended to `notes` so nothing is
    lost. `assistance_type` stays as a deprecated column for one release, then is removed.
13. Volunteer list API returns `skills` (codes) next to the existing fields.

## Non-Functional Requirements

- **Performance:** listing 500 incidents with needs and event must stay a constant number of
  queries (`prefetch_related` / `select_related`); test with `assertNumQueries`.
- **Security:**
  - Lookup APIs are read-only.
  - Changing types, events and incident needs requires staff (operators), not just any signed-in
    account, because anyone can sign up.
  - Parsing never evaluates input; message text is stored as plain text and escaped in the UI.
- **Compatibility:** existing providers posting without `needs` keep working (parsed or `other`).
  Existing incidents get `other` in a data migration.
- **Python 3.8:** the backend image is still 3.8, so no newer syntax.
- **Accessibility / i18n:** every type has an English and a Bangla label; colour is never the
  only signal (icons and labels too).

## Acceptance Criteria

- [ ] Need and hazard types exist as admin-editable tables, seeded with the proposed lists.
- [ ] `RESCUE+MEDICAL#Feni#Parshuram#School#5 people on roof` creates an incident with needs
      rescue and medical.
- [ ] `uddhar#Feni#...` matches rescue; `HELP#Feni#...` and `Feni#Parshuram#School#text` give
      `other`.
- [ ] A provider can post explicit `needs`, `life_threatening` and `people_count`; unknown need
      codes return 400.
- [ ] A new incident in a district covered by an active event is attached to it; otherwise
      `event` is empty.
- [ ] The incident list API returns needs, triage fields and event, in a constant number of
      queries.
- [ ] Volunteers have `skills` from the need list; existing `assistance_type` values are migrated
      or preserved in notes.
- [ ] Existing incidents get need `other` after migrating; all existing tests still pass.
- [ ] Need-type and active-event lookup APIs return both labels, icon and colour.

## Out of Scope

- The SMS gateway webhook itself (receiving real SMS from a telco); this feature defines the
  format and parser that it will use.
- Dashboard UI changes (filter chips by need, icons on markers, editing in the drawer); those go
  in the dashboard feature, which will use the lookup APIs from this one.
- Volunteer-to-incident matching and dispatch (#41); this feature provides the shared categories it
  needs.
- Free-text classification (guessing needs from the message without a keyword).
- Event areas drawn as custom polygons; districts are enough for now.

## Notes

- The lists come from a proposal based on the UN humanitarian clusters (needs) and EM-DAT /
  Common Alerting Protocol groupings (hazards), with Bangladesh's common hazards first. **Review
  them with someone who has run relief operations** before launch, especially Safety and Damage
  report. Because they're DB tables, changes after review need no code.
- Banglish keyword spellings vary (`uddhar`, `uddhaar`, `udhar`). Seed the common ones and add
  more from real messages in the admin.
- Related issues: #41 (volunteer assignment), #40 (SMS parsing), #14 (grouping nearby incidents),
  #47 (incident details page).
