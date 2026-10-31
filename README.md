# Singapore Resident Population Density

This is the static web conversion of the archived R/Shiny choropleth project. It is designed to run on static hosting such as Neocities while remaining easy to test locally. The map uses Leaflet in the browser, derives a `Total` age group from the source rows, and supports every year present in `data/population.csv`.

## Run locally

Fetching the CSV and KML requires HTTP; opening `index.html` directly with `file://` will not work. With Python installed, double-click `run.bat` (it opens the browser for you), or run:

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

The checked-in dataset covers June 2000–2026 and is rebuilt entirely from SingStat's current downloads, summed over subzones, sex and (for 2000–2010) dwelling type into 10-year age groups:

- 2000–2010: "Singapore Residents by Planning Area / Subzone, Age Group, Sex and Type of Dwelling, June 2000 to 2010"
- 2011–2026: "Singapore Residents by Planning Area / Subzone, Single Year of Age and Sex" (2011–2020 combined file, then one file per year; June 2026 released 25 Sep 2026)

Every row was checked against those files. The archived extract already matched SingStat exactly for 2011–2023, but its 2000–2010 rows did not match any file SingStat currently publishes. They differed by roughly ±100 per row, and their yearly totals sat further from the official resident figures, so those years were replaced with sums from the dwelling-type table above. Some 2011–2022 Tampines cells are published with thousands separators (for example `"1,180"`), so strip commas when parsing. The 2000 "Not Stated" rows (5,320 residents with no planning area) are left out because they cannot be mapped.

About the numbers:

- Counts are residents (citizens and permanent residents), not the total population, and not density per km².
- SingStat rounds every published figure to the nearest 10, so summed totals run slightly above the headline figures (about 0.3%; 2026 sums to 4,244,570 against the published 4.23 million).
- Planning areas follow the URA master plan in force for each year (1998 for 2000, 2008 for 2001–2010, 2014 for 2011–2019, 2019 for 2020–2025, 2025 for 2026). The map draws Master Plan 2019 boundaries throughout, and the 55 planning-area names are unchanged.
- Map colours are five quantile classes computed per age group across all years, so a colour means the same count in every year.

To add a newer annual extract, append rows to `data/population.csv` in the same four-column shape:

```text
PA,AgeGroup,Time,TotalPop
```

No application code changes are needed. The controls and default year are derived from the data at load time. Record the source publication date and URL in the commit when refreshing it. The boundary file is kept separately so population updates do not require a geometry change.

## Hosting

The repository root can be uploaded to a static host. For the Neocities project card, the hosted `index.html` can be linked directly once the repository is deployed to a static host. The external Leaflet, OpenStreetMap, and togeojson resources are intentionally loaded from public CDNs; they can be vendored later if an offline or dependency-free deployment is needed.

## Sources

- [Singapore Department of Statistics: geographic distribution](https://www.singstat.gov.sg/find-data/search-by-theme/population/geographic-distribution/latest-data)
- [URA Master Plan](https://www.ura.gov.sg/maps/#master-plan)
