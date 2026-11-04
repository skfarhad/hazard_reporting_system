# Raw Idea: Report an incident from the web app for staff review

**Type:** feature
**Slug:** report-incident-from-dashboard
**Created:** 2026-11-04

## Original Input

User request: "provide an option to add incidents that will be reviewed by staff, add the option in dashboard and in insident list view"

```
report-incident-from-dashboard --title "Report an incident from the web app for staff review" --notes "User request: 'provide an option to add incidents that will be reviewed by staff, add the option in dashboard and in insident list view'. A 'Report incident' action on the dashboard (/app/) and the Incidents page (/app/incidents/) opens a form to submit a new incident (message, needs, life-threatening, people count, contact number, address/district/thana, location on a map). New incidents start as pending so staff (operators) review and validate/reject them. Today incidents are only created by providers via POST /api/incidents/ with an API key; this needs a signed-in-user path. Who may report (any signed-in account vs operators only), how location is picked, and what non-operators see afterwards are to be decided in /plan."
```

## Parsed Values

- **Slug:** report-incident-from-dashboard
- **Title:** Report an incident from the web app for staff review
- **Notes:** "Report incident" on the dashboard and the Incidents page; form for message, needs, urgency, people count, contact, place and map location; new incidents are pending until staff review them; needs a signed-in-user create path (today only API-key providers can create). Who may report, location picking and the non-operator experience to decide in `/plan`.
