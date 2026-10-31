# Singapore Resident Population Density

This is the static web conversion of the archived R/Shiny choropleth project. It is designed to run on static hosting such as Neocities while remaining easy to test locally. The map uses Leaflet in the browser, derives a `Total` age group from the source rows, and supports every year present in `data/population.csv`.

## Run locally

Fetching the CSV and KML requires HTTP; opening `index.html` directly with `file://` will not work. With Python installed, run:

```powershell
.\run-local.ps1
```

Then open <http://localhost:8000>. The equivalent command is `python -m http.server 8000`.

## Project layout

- `index.html`, `app.js`, `styles.css`: static application
- `data/population.csv`: resident population by planning area, age group, and year
- `data/planning-areas.kml`: URA Master Plan 2019 planning-area boundaries
- `assets/data-visualization.png`: archived reference visualization

## Data refresh

The checked-in dataset covers June 2000–2026. 2000–2023 come from the archived Singapore Department of Statistics extract; 2024–2026 were added from SingStat's "Singapore Residents by Planning Area / Subzone, Single Year of Age and Sex, June 20xx" CSVs (2026 released 25 Sep 2026), summed over subzones and sex into 10-year age groups. The same aggregation reproduces the archived 2023 rows exactly. Note that SingStat reports June 2026 on the URA Master Plan 2025 planning-area demarcation, while the boundaries here are Master Plan 2019; the 55 planning-area names are unchanged. To add a newer annual extract, append rows to `data/population.csv` in the same four-column shape:

```text
PA,AgeGroup,Time,TotalPop
```

No application code changes are needed. The controls and default year are derived from the data at load time. Record the source publication date and URL in the commit when refreshing it. The boundary file is kept separately so population updates do not require a geometry change.

## Hosting

The repository root can be uploaded to a static host. For the Neocities project card, the hosted `index.html` can be linked directly once the repository is deployed to a static host. The external Leaflet, OpenStreetMap, and togeojson resources are intentionally loaded from public CDNs; they can be vendored later if an offline or dependency-free deployment is needed.

## Sources

- [Singapore Department of Statistics: geographic distribution](https://www.singstat.gov.sg/find-data/search-by-theme/population/geographic-distribution/latest-data)
- [URA Master Plan](https://www.ura.gov.sg/maps/#master-plan)
