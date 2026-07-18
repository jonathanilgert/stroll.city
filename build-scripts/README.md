# Stroll — data pipeline reference scripts

Working Python scripts from the prototype. They show exactly how to pull City of
Calgary open data, categorize businesses, snap them to real building footprints,
and slim geometry. Nicholas should treat these as a **reference for the production
import pipeline** (re-implement against Postgres/PostGIS), not as final code.

- `assign.py`  — early version: snaps businesses to footprints fronting a street.
- `build3.py`  — pulls business licences (`vdjc-pybd`), categorizes all 140 strip
  businesses, point-in-polygon snaps each to its building (`uc4c-6kbd`),
  outputs business + building GeoJSON.
- `build4.py`  — adds the bike network (`jjqk-9b73`) + parks pathways (`qndb-27qm`),
  Douglas–Peucker simplification, reliable photo URLs, and logo domains.

## Calgary Open Data datasets used
| ID | Dataset |
|----|---------|
| uc4c-6kbd | Buildings (footprints) |
| 4dx8-rtm5 | Street Centreline |
| vdjc-pybd | Business Licences (name, address, coords) |
| tfs4-3wwa | Public Trees |
| jjqk-9b73 | Bikeways |
| qndb-27qm | Parks Pathways |
| n625-9k5x | City Events |

Query pattern:
`https://data.calgary.ca/resource/{id}.geojson?$where=within_box({geocol},{NWlat},{NWlon},{SElat},{SElon})&$limit=N`
