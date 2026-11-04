# Raw Idea: Need-type icons on the incident map

**Type:** feature
**Slug:** need-type-map-icons
**Created:** 2026-11-04

## Original Input

User request: "now I want different types of icon on map for different incidents"

```
need-type-map-icons --title "Need-type icons on the incident map" --notes "Different map icons per incident. Each incident marker shows the icon and colour of its highest-priority need type (need types are ordered by sort_order; fallback 'other' or a generic icon when need types fail to load). Ring colour shows validation status (pending/validated/rejected). '+N' badge for additional needs. Life-threatening incidents get a red badge and sit above other markers. Popup lists need labels, life-threatening and people count. A legend under the map lists need types with icon and label. Icons and colours come from the NeedType table via GET /api/incidents/need-types/ (operators only); icon names and colours are validated before going into markup. Accessible: aria-label names every need, colour is never the only signal."
```

## Parsed Values

- **Slug:** need-type-map-icons
- **Title:** Need-type icons on the incident map
- **Notes:** Marker icon and colour from the highest-priority need; ring colour for validation status; "+N" for more needs; red badge and higher z-order for life-threatening incidents; popup with needs and triage; need legend under the map; icons and colours from `GET /api/incidents/need-types/`, validated before use; accessible labels.
