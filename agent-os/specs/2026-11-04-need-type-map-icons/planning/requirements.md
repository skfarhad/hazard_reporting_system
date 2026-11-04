# Feature Requirements: Need-type icons on the incident map

## Overview

Every incident on the dashboard map is the same coloured circle; the colour only shows validation
status. Since #75, each incident has needs (rescue, medical, food, …), a life-threatening flag and
a people count, but the map doesn't show them. Operators have to open each popup to know what
help is needed. Showing the need as the marker's icon lets them read the situation at a glance and
spot life-threatening reports first.

## User Stories

- As an **operator**, I want each incident marker to show what help is needed, so that I can see
  where rescue, medical or food requests cluster without opening every popup.
- As an **operator**, I want life-threatening incidents to stand out and sit on top of other
  markers, so that I deal with them first.
- As an **operator**, I still want to see whether an incident is pending, validated or rejected.
- As an **operator**, I want a legend that explains the icons.
- As an **administrator**, I want a new need type or a changed icon/colour in the admin to show on
  the map without a deploy.

## Functional Requirements

1. Incident markers are **teardrop pins** (tip on the exact point), not plain circles. Each pin is
   filled with the colour of the incident's **main need** (the first of its needs in need-type
   `sort_order`) and shows that need's Bootstrap icon in white in its head.
2. An incident with no known need uses the fallback need type (`is_fallback`, "Other"); if need
   types could not be loaded, a generic question-mark icon in grey.
3. The pin's **outline** shows validation status using the existing status tokens
   (`--hrs-status-pending|validated|rejected`); rejected pins are also faded. Unknown status is
   treated as pending.
4. When an incident has more than one need, the marker shows **"+N"** (N = further needs).
5. **Life-threatening** incidents get a red "!" badge and are drawn above other markers.
6. The **popup** adds the need labels, "Life-threatening" and "N people" when present.
7. A **collapsible legend on the map** (bottom-right Leaflet control) has three sections: Needs
   (icon + label for each active need type), Status (pin outline colours; rejected = faded;
   "!" = life-threatening) and Volunteer. It starts open on screens ≥768px and collapsed on
   smaller ones; after the operator toggles it, the choice is remembered in this browser
   (localStorage, failures ignored). The old footer legend under the map is removed.
8. The dashboard loads need types from `GET /api/incidents/need-types/`. If that call fails the
   map still draws (generic icon), and the legend's Needs section is left out.
9. Volunteer markers are unchanged.

## Non-Functional Requirements

- **Performance:** one extra API call on dashboard load; markers are lightweight `L.divIcon`s
  (HTML/CSS, no image downloads). Up to 500 incidents must stay smooth.
- **Security:** icon names and colours come from an admin-editable table and go into HTML/CSS;
  only `[a-z0-9-]+` icon names and `#RRGGBB` colours are used, anything else falls back to the
  generic icon/colour. Labels are HTML-escaped.
- **Accessibility:** colour is never the only signal (icon shape, "+N", "!" badge, ring and
  legend text). Each marker has `role="img"` and an `aria-label` naming every need and
  "life-threatening". Contrast works in light and dark themes.
- **No backend change:** the list and need-type APIs from #75 already return what's needed.

## Acceptance Criteria

- [x] Markers show the main need's icon and colour; an incident with rescue and food shows rescue.
- [x] Unknown/missing needs show the fallback ("Other"); failed need-type load shows a generic icon.
- [x] Markers are teardrop pins; the outline colour shows validation status; rejected pins are faded.
- [x] "+N" appears for incidents with several needs.
- [x] Life-threatening incidents show a red badge and sit above other markers.
- [x] Popup lists needs, life-threatening and people count; all text is escaped.
- [x] A collapsible on-map legend lists needs, status and volunteer; open on desktop, collapsed on
      phones, choice remembered; the footer legend is gone.
- [x] Unsafe icon names or colours from the database never reach the markup.
- [x] Works in light and dark themes; Vitest suite passes.

## Out of Scope

- Filtering the map by need or event (dashboard filters feature).
- Editing needs from the dashboard.
- Marker clustering for dense areas.
- Volunteer marker icons by skill.
- Bangla labels in the UI (the UI is English-only for now; `label_bn` is available later).

## Notes

- Need types are seeded in `apps/incident_manager/migrations/0009_seed_need_types.py` with
  Bootstrap Icons names (`life-preserver`, `heart-pulse`, `basket`, …) and colours.
- Bootstrap Icons 1.11.3 is already loaded in `components/hrs_head.html`.
- Related: #75 (need types), dashboard design system (`docs/design-system.md`).
