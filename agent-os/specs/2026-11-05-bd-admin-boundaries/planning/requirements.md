# Feature Requirements: Bangladesh administrative boundaries

## Overview
The app knows only one division, one district and one thana, with no boundary shapes. Operators
can only filter the dashboard by Feni/Parshuram, and new reports never get a district or thana
from their location, because that lookup needs boundaries. Place names are also forced to be
unique across the whole country, which is wrong for Bangladesh (13 upazila names and 423 union
names repeat in different parents). This feature loads the full official hierarchy with
boundaries, adds the union level, and fixes the uniqueness rule.

## User Stories
- As an operator, I want every division, district (zilla) and upazila/thana in the area filters, so that I can narrow the dashboard to any part of the country.
- As an operator, I want a new report to get its district, thana and union from its location, so that I don't have to set them by hand.
- As an operator, I want to add a thana whose name exists in another district (e.g. Kaliganj), so that real place names are accepted.
- As a maintainer, I want a repeatable import command for the OCHA/BBS boundary files, so that the data can be loaded on any environment and refreshed when a newer release comes out.

## Functional Requirements
1. Name uniqueness per parent: Division across the country; District within its division; Thana within its district; Union within its thana.
2. Every level gets a nationally unique `code` (OCHA/BBS P-code, e.g. `BD2030` Feni, `BD203094` Parshuram).
3. New Union model under Thana (name, code, polygon, center).
4. Import command reads the GeoJSON files (divisions, districts, upazilas, unions), builds the hierarchy from P-codes, stores boundaries and centre points, and is idempotent (re-running updates rather than duplicates).
5. Existing rows (Chattogram, Feni, Parshuram) are matched and kept, not duplicated, despite spelling differences (Chittagong vs Chattogram); incidents and volunteers linked to them stay linked.
6. New incidents get district, thana (and union) from the boundaries that contain their location when not given otherwise.
7. Location tab / place management API reports a duplicate name within the same parent clearly, and accepts the same name under a different parent.
8. Data attribution (OCHA / BBS, CC BY-IGO) in docs and on the Location page.

## Non-Functional Requirements
- Performance: point-in-polygon lookup stays fast with full-detail shapes (spatial index); map drawing uses simplified shapes.
- Security: import is a management command (server-side only); place management stays operator-only.
- Accessibility: no new UI beyond existing patterns.
- Data files are not committed (`.local/` is gitignored; files exceed GitHub limits).

## Acceptance Criteria
- [ ] 8 divisions, 64 districts, 544 upazilas/thanas and 5,160 unions in the DB with boundaries and centres
- [ ] Same thana name allowed in different districts; rejected twice in one district (API and DB)
- [ ] Re-running the import creates no duplicates
- [ ] Existing Chattogram/Feni/Parshuram rows keep their ids and links
- [ ] A new report with only a location gets the right district, thana and union
- [ ] All tests written first, now passing

## Out of Scope
- Upazilas created after the data's date (Lalmai, Guimara, Eidgaon, Dasar, Madhyanagar), unless a newer dataset is used
- City corporation wards as a separate concept
- Bangla names (dataset has English only)

## Notes
See `raw-idea.md` for the data findings. Data files: `.local/Bangladesh_GeoJSON/` (Kaggle repackaging of OCHA COD-AB for Bangladesh, BBS source, dated 2015, valid on 2020-11-13).
