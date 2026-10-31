const DATA_URL = "data/population.csv";
const KML_URL = "data/planning-areas.kml";
const numberFormatter = new Intl.NumberFormat("en-SG");
const palette = ["#f7fbff", "#deebf7", "#c6dbef", "#9ecae1", "#6baed6", "#3182bd", "#08519c"];

const yearInput = document.querySelector("#year");
const yearValue = document.querySelector("#year-value");
const ageGroupInput = document.querySelector("#age-group");
const playButton = document.querySelector("#play");
const status = document.querySelector("#status");
const details = document.querySelector("#details");

let map;
let boundaries;
let records = [];
let years = [];
let selectedYear;
let selectedAgeGroup;
let timer;

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines.shift().split(",");
  return lines.map((line) => {
    const values = line.split(",");
    return Object.fromEntries(headers.map((header, index) => [header, values[index]]));
  });
}

function normaliseName(name) {
  return name.trim().toUpperCase();
}

function buildRecords(rows) {
  const grouped = new Map();
  rows.forEach((row) => {
    const key = `${normaliseName(row.PA)}|${row.AgeGroup}|${row.Time}`;
    grouped.set(key, {
      area: normaliseName(row.PA),
      ageGroup: row.AgeGroup,
      year: Number(row.Time),
      population: Number(row.TotalPop),
    });
  });

  const totals = new Map();
  grouped.forEach((record) => {
    const key = `${record.area}|${record.year}`;
    totals.set(key, (totals.get(key) || 0) + record.population);
  });
  totals.forEach((population, key) => {
    const [area, year] = key.split("|");
    grouped.set(`${area}|Total|${year}`, { area, ageGroup: "Total", year: Number(year), population });
  });
  return [...grouped.values()];
}

function valuesForSelection() {
  const values = new Map();
  records
    .filter((record) => record.year === selectedYear && record.ageGroup === selectedAgeGroup)
    .forEach((record) => {
      // Older extracts report some areas combined (e.g. "BOON LAY/PIONEER" in 2000);
      // show the combined figure on each constituent boundary.
      record.area.split("/").forEach((area) => {
        values.set(area, { population: record.population, label: record.area });
      });
    });
  return values;
}

function colour(value, min, max) {
  if (value == null) return "#d9e1e8";
  if (max === min) return palette[palette.length - 1];
  const index = Math.min(palette.length - 1, Math.floor(((value - min) / (max - min)) * palette.length));
  return palette[index];
}

function renderMap() {
  if (!boundaries || !selectedAgeGroup) return;
  const values = valuesForSelection();
  const numbers = [...values.values()].map((entry) => entry.population);
  const min = Math.min(...numbers);
  const max = Math.max(...numbers);
  boundaries.eachLayer((layer) => {
    const entry = values.get(normaliseName(layer.feature.properties.name || layer.feature.properties.Name));
    const value = entry?.population;
    const area = entry ? entry.label : normaliseName(layer.feature.properties.name || layer.feature.properties.Name);
    layer.setStyle({ fillColor: colour(value, min, max) });
    layer.unbindTooltip();
    layer.bindTooltip(`${area}: ${value == null ? "No data" : numberFormatter.format(value)}`);
    layer.off("mouseover mouseout");
    layer.on({
      mouseover: () => {
        layer.setStyle({ weight: 3, color: "#172033", fillOpacity: .9 });
        details.textContent = `${area}: ${value == null ? "No data" : `${numberFormatter.format(value)} residents`} in ${selectedYear} (${selectedAgeGroup})`;
      },
      mouseout: () => {
        layer.setStyle({ weight: 1, color: "#fff", fillOpacity: .8 });
        details.textContent = "Hover over a planning area for details.";
      },
    });
  });
  yearValue.textContent = selectedYear;
}

function setYear(year) {
  selectedYear = Number(year);
  yearInput.value = selectedYear;
  renderMap();
}

function setStatus(message, isError = false) {
  status.textContent = message;
  status.classList.toggle("error", isError);
}

async function load() {
  try {
    const [csvResponse, kmlResponse] = await Promise.all([fetch(DATA_URL), fetch(KML_URL)]);
    if (!csvResponse.ok || !kmlResponse.ok) throw new Error("The data files could not be loaded.");
    const [csv, kml] = await Promise.all([csvResponse.text(), kmlResponse.text()]);
    records = buildRecords(parseCsv(csv));
    years = [...new Set(records.map((record) => record.year))].sort((a, b) => a - b);
    const ageGroups = [...new Set(records.map((record) => record.ageGroup))].sort();
    ageGroups.splice(ageGroups.indexOf("Total"), 1);
    ageGroups.unshift("Total");
    ageGroups.forEach((ageGroup) => ageGroupInput.add(new Option(ageGroup, ageGroup)));
    yearInput.min = years[0];
    yearInput.max = years.at(-1);
    selectedAgeGroup = "Total";

    const xml = new DOMParser().parseFromString(kml, "text/xml");
    const geojson = toGeoJSON.kml(xml);
    boundaries = L.geoJSON(geojson, {
      style: { color: "#fff", weight: 1, fillOpacity: .8 },
    }).addTo(map);
    map.fitBounds(boundaries.getBounds(), { padding: [12, 12] });
    setYear(years.at(-1));
    renderMap();
    setStatus(`Loaded ${years[0]}–${years.at(-1)} population data for ${new Set(records.map((r) => r.area).filter((area) => !area.includes("/"))).size} planning areas.`);
  } catch (error) {
    setStatus(`Unable to load the visualization: ${error.message}`, true);
  }
}

map = L.map("map").setView([1.3521, 103.8198], 11);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  maxZoom: 18,
}).addTo(map);

yearInput.addEventListener("input", (event) => setYear(event.target.value));
ageGroupInput.addEventListener("change", (event) => {
  selectedAgeGroup = event.target.value;
  renderMap();
});
playButton.addEventListener("click", () => {
  if (timer) {
    clearInterval(timer);
    timer = undefined;
    playButton.textContent = "Play years";
    playButton.setAttribute("aria-pressed", "false");
    return;
  }
  playButton.textContent = "Pause years";
  playButton.setAttribute("aria-pressed", "true");
  timer = setInterval(() => {
    const nextIndex = (years.indexOf(selectedYear) + 1) % years.length;
    setYear(years[nextIndex]);
  }, 1200);
});

load();
