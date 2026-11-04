# Raw Idea: Bangladesh administrative boundaries: divisions, districts, upazilas/thanas and unions

**Type:** feature
**Slug:** bd-admin-boundaries
**Created:** 2026-11-05

## Original Input

```
bd-admin-boundaries --title "Bangladesh administrative boundaries: divisions, districts, upazilas/thanas and unions" --notes "User request: 'okay, we need to change the rule, also need to create those admin boundary and entities in DB, do we have model for unions?' (follows: 'names can be repeated across thana if those are in different districts or unions if those are in different thanas that's fine. and why is there a uniq constraint on names?'). Findings so far: (1) Models in apps/incident_manager/models/address.py: Division, District (FK division), Thana (FK district), each with name (unique=True since the first model commit b5f4190, Aug 2024, no recorded reason), polygon MultiPolygonField, center PointField, description. No Union model. (2) Rule change: name unique per parent instead of globally (Division global, District per division, Thana per district, Union per thana); add a nationally unique `code` (OCHA/BBS P-code) on every level and match imports on it. No app code relies on global uniqueness (SMS lookup at services/incidents.py:20-22 already scopes thana to district; filters use ids); tests in test_place_management_api.py look up by name and test duplicate-name rejection. (3) Data: user downloaded OCHA COD-AB (BBS) GeoJSON from Kaggle into .local/Bangladesh_GeoJSON/ (gitignored; full + small/ simplified files): ADM1 8 divisions, ADM2 64 districts, ADM3 544 upazilas incl. city thanas (file name says 492), ADM4 5160 unions; properties ADMn_EN, ADMn_PCODE and parent PCODEs; all parent codes resolve; ADM1-3 geometries GEOS-valid, extent within Bangladesh; data dated 2015, validOn 2020-11-13; licence CC BY-IGO (attribution OCHA/BBS). Duplicate names: 13 at ADM3 (Kaliganj x4, Kotwali x3, Daulatpur x3...), 423 at ADM4. Old spellings (Chittagong, Comilla, Jessore, Barisal, Bogra) vs existing DB row 'Chattogram'. Missing newer upazilas (Lalmai, Guimara 2017; Eidgaon, Dasar, Madhyanagar 2021). Full files are large (ADM3 116 MB / 2.8M points, ADM4 319 MB); small/ files are simplified and drop small southern islands (min lat 20.78 vs 20.59). Current local DB: 1 division (Chattogram), 1 district (Feni), 1 thana (Parshuram), no polygons; 3 incidents (1 with district/thana). Automatic district/thana assignment by polygon__contains (services/incidents.py:25-27) is idle until polygons load. The .gitignore change adding .local/ is uncommitted on main and should go into this branch."
```

## Parsed Values

- **Slug:** bd-admin-boundaries
- **Title:** Bangladesh administrative boundaries: divisions, districts, upazilas/thanas and unions
- **Notes:** see Original Input (user request, model findings, rule change, OCHA/BBS data findings, current DB state)
