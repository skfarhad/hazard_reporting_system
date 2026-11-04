# Raw Idea: Hazard-agnostic incident types: needs, hazards and events

**Type:** feature
**Slug:** hazard-agnostic-incident-types
**Created:** 2026-11-04

## Original Input

```
hazard-agnostic-incident-types --title "Hazard-agnostic incident types: needs, hazards and events" --notes "Two dimensions. (1) Need type per incident, multi-select, sent by reporter via SMS keyword and offered by volunteers (replaces free-text Volunteer.assistance_type): Rescue (RESCUE/UDDHAR), Medical (MEDICAL/OSHUDH), Food (FOOD/KHABAR), Water & sanitation (WATER/PANI), Shelter (SHELTER/ASHROY), Missing person (MISSING/NIKHOJ), Safety (SAFETY/NIRAPOTTA), Damage report (DAMAGE/KHOTI), Other (fallback; operator classifies at validation). Triage fields on Incident: life_threatening (bool), people_count (int). (2) Hazard per Event, set by operators: Event model (e.g. 'Sylhet Flood, June 2027') with hazard, area, active period; incidents attach to an event. Hazard list grouped like EM-DAT/CAP: water & weather (flood, flash flood, waterlogging, cyclone/storm surge, storm/tornado, lightning, heatwave, cold wave, drought), geological (earthquake, landslide, riverbank erosion, tsunami), fire & structural (fire, building collapse, industrial/chemical accident, explosion), transport (road accident, boat/launch capsize), biological (epidemic), other. Both lists are admin-editable DB tables (code, label_en, label_bn, sms_keywords, icon, colour), seeded via data migration. SMS format: NEED#District#Thana#Area#Message; unknown keyword -> Other. Lists are a proposal to review with relief-ops people."
```

User's request in conversation: "as I want it to be a hazard agnostic platform, what are the types we should include?", then "yes, start with /feature-new".

## Parsed Values

- **Slug:** hazard-agnostic-incident-types
- **Title:** Hazard-agnostic incident types: needs, hazards and events
- **Notes:** Two dimensions: need types per incident (reported by SMS keyword, offered by volunteers) and hazard per operator-activated Event. Both lists are admin-editable tables seeded by data migration. SMS format `NEED#District#Thana#Area#Message`. Lists to be reviewed with relief-operations people.
