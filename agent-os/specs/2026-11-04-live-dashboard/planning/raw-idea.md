# Raw Idea: Live three-panel dashboard (incidents, map, volunteers)

**Type:** feature
**Slug:** live-dashboard
**Created:** 2026-11-04

## Original Input

```
live-dashboard --title "Live three-panel dashboard (incidents, map, volunteers)" --notes "User request: 'now, let's implement the live dashboard as specified in the picture @live_dashboard.jpeg' (mockup at repo root: live_dashboard.jpeg). Mockup layout: top navbar with Dashboard, Incidents, Volunteers, Location tabs, a notification bell with an unread count, and the user avatar. LEFT panel 'Incident Details' (search icon, collapse chevron): a 'Today's incident' period dropdown; summary cards Pending (32), Resolved (16), Total (48); Zilla (district) and 'All Upazilla' (thana) filters; 'Showing 32 Pending Incidents'; scrolling incident cards with title (e.g. 'Feni-Parshuram Incident' = district-thana), date and time, District and Thana, a truncated message, an 'N volunteers' badge, and a status badge (e.g. 'Resolved'); the selected card is highlighted. CENTRE: a full-height map with incident pins; a pin shows a popup card in the same style as the list card. RIGHT panel 'Volunteers' (collapse chevron, search): Active (65), Inactive (15), Total (80) cards; Zilla and All Upazilla filters; 'Showing All Volunteers'; volunteer cards with name, phone, District and Thana, and an avatar with an online/offline dot. Gaps against today's code that /plan must settle: 'Resolved' status (today: pending/validated/rejected), volunteers-per-incident count, volunteer active/inactive, 'live' updates (polling vs push), notifications, and the Location tab."
```

## Parsed Values

- **Slug:** live-dashboard
- **Title:** Live three-panel dashboard (incidents, map, volunteers)
- **Notes:** Implement the dashboard in `live_dashboard.jpeg`: incident panel (left), map (centre), volunteer panel (right). Open questions for /plan: Resolved status, volunteers per incident, volunteer active/inactive, live updates, notifications, Location tab.
