// JavaScript code for interactive map of US Congress members //
// Combined version: structural redesign + server-side caching (via Redis or otherwise)
//
// congress_map.js

let currentViewLevel = "national";  // Tracks zoom state: "national", "state", "district"
let lastSelectedState = null;
let lastSelectedDistrict = null;
let states = null;
let allDistricts = null;  // Store full districts data in memory
let cachedDistricts = {};  // Cache for district data by state (in-memory only)
let stateDistricts = [];  // Store districts of the currently selected state

// Geometry API Endpoints (same as your original Django endpoints)
const GEO_APIS = {
  STATES: "/api/us_states_topojson/",
  DISTRICTS: "/api/us_districts_topojson/"
};

// 1. Fetch data from API: no localStorage calls, so you rely on server-side caching.
async function fetchGeoData(apiUrl) {
  try {
    console.log(`Fetching data from ${apiUrl}...`);
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch data from ${apiUrl}`);
    }
    const data = await response.json();
    console.log(`Data fetched from ${apiUrl} successfully:`, data);
    return data;
  } catch (error) {
    console.error(`Error fetching data from ${apiUrl}:`, error);
    return null;
  }
}

// 2. Load states & districts; data is already cached on the server (e.g. Redis).
async function loadMapData() {
  try {
    const [loadedStates, loadedDistricts] = await Promise.all([
      fetchGeoData(GEO_APIS.STATES),
      fetchGeoData(GEO_APIS.DISTRICTS)
    ]);

    if (!loadedStates || !loadedDistricts) {
      console.error("Failed to load data for states or districts.");
      return;
    }

    // Convert JSON to GeoJSON
    states = topojson.feature(loadedStates, loadedStates.objects.us_states);
    allDistricts = topojson.feature(loadedDistricts, loadedDistricts.objects.congressional_districts);

    console.log("Loaded states and districts:", states, allDistricts);
    initPlotlyMap();
  } catch (error) {
    console.error("Error loading map data:", error);
  }
}

// 3. Initialize Plotly map
function initPlotlyMap() {
  let zValuesStates = states.features.map(d => d.properties.STATE_PARTY === "R" ? 1 : 0);

  let stateTrace = {
    type: "choropleth",
    geojson: states,
    locations: states.features.map(d => d.properties.STATEFP),
    z: zValuesStates,
    featureidkey: "properties.STATEFP",
    colorscale: [[0, "rgba(247, 23, 19, 0.8)"], [1, "rgba(51, 8, 241, 0.94)"]],
    autocolorcale: false,
    reversescale: true,
    zmin: 0,
    zmax: 1,
    showscale: false,
    marker: { line: { color: "black", width: 1.5 } },
    style: { fill: "currentColor !important" },
    hoverinfo: "text",
    text: states.features.map(d => `${d.properties.NAME} (${d.properties.STATE_PARTY})`),
  };

  let layout = {
    geo: {
      scope: "usa",
      showlakes: false,
      showland: false,
      lakescolor: "rgba(244,244,244,1)",
      bgcolor: "rgba(244,244,244,1)",
    },
    paper_bgcolor: "rgba(244,244,244,1)",
    plot_bgcolor: "rgba(244,244,244,1)",
  };

  console.log("Rendering state map with:", stateTrace);

  Plotly.newPlot("plotly-map", [stateTrace], layout, {
    responsive: true,
    displayModeBar: false,
    scrollZoom: false,
    modeBarButtonsToRemove: ["toImage", "sendDataToCloud", "editInChartStudio", "zoom2d", "select2d", "lasso2d"]
  });

  console.log("Plotly map initialized");

  // 4. Event listener for clicking on states and districts
  document.getElementById("plotly-map").on("plotly_click", function(data) {
    let clickedPoint = data.points[0].location;
    console.log("Clicked point:", clickedPoint);

    let isStateClick = states.features.find(d => d.properties.STATEFP === clickedPoint);
    let isDistrictClick = stateDistricts.find(d => d.properties.OFFICE_ID === clickedPoint);

    if (isStateClick) {
      console.log(`Clicked on state: ${clickedPoint}`);
      stateClicked(clickedPoint);
    } else if (isDistrictClick) {
      districtClicked(clickedPoint);
    }
  });
}

// 5. Render the chosen state's districts
function updateDistricts(districts) {
  // Remove previous district traces (all but the first)
  let numTraces = document.getElementById("plotly-map").data.length;
  if (numTraces > 1) {
    for (let i = numTraces - 1; i >= 1; i--) {
      Plotly.deleteTraces("plotly-map", i);
    }
  }

  let districtTrace = {
    type: "choropleth",
    geojson: { type: "FeatureCollection", features: districts },
    locations: districts.map(d => d.properties.OFFICE_ID),
    z: districts.map(d => d.properties.PARTY === "R" ? 1 : 0),
    featureidkey: "properties.OFFICE_ID",
    colorscale: [
      [0, "rgba(247, 23, 19, 0.8)"],
      [0.5, "yellow"],
      [1, "rgba(51, 7, 246, 0.93)"],
    ],
    autocolorcale: false,
    reversescale: true,
    zmin: 0,
    zmax: 1,
    showscale: false,
    marker: { line: { color: "black", width: 1.5 } },
    hoverinfo: "text",
    text: districts.map(d => `${d.properties.LISTING_NAME} (${d.properties.PARTY}) - District ${d.properties.DISTRICT}`),
    visible: true
  };

  Plotly.addTraces("plotly-map", districtTrace);
}

// 6a. Helper: add an overlay outline for a single state
function addStateOverlay(stateFeature) {
  let overlays = [];
  if (stateFeature.geometry.type === "Polygon") {
    overlays.push(stateFeature.geometry.coordinates[0]);
  } else if (stateFeature.geometry.type === "MultiPolygon") {
    stateFeature.geometry.coordinates.forEach(polygon => {
      overlays.push(polygon[0]);
    });
  } else {
    console.error("Unsupported geometry type for state overlay");
    return;
  }

  let overlayTraces = overlays.map(ring => {
    let lons = ring.map(c => c[0]);
    let lats = ring.map(c => c[1]);
    return {
      type: "scattergeo",
      mode: "lines",
      lon: lons,
      lat: lats,
      line: { color: "turquoise", width: 4 },
      hoverinfo: "skip",
      showlegend: false
    };
  });

  Plotly.addTraces("plotly-map", overlayTraces).then(() => {
    console.log("State overlay added.");
  });
}

// 6b. Helper: remove any existing district overlay traces
function removeDistrictOverlays() {
  const mapDiv = document.getElementById("plotly-map");
  let indicesToRemove = [];
  mapDiv.data.forEach((trace, index) => {
    // We tag district overlays with overlayType === "district"
    if (trace.overlayType && trace.overlayType === "district") {
      indicesToRemove.push(index);
    }
  });

  if (indicesToRemove.length > 0) {
    indicesToRemove.sort((a, b) => b - a); // remove highest indices first
    return Plotly.deleteTraces("plotly-map", indicesToRemove).then(() => {
      console.log("Existing district overlays removed.");
    });
  } else {
    return Promise.resolve();
  }
}

// 6c. Helper: add a highlight/glow overlay for the chosen district
function addDistrictOverlay(districtFeature) {
  let coords;
  if (districtFeature.geometry.type === "Polygon") {
    coords = districtFeature.geometry.coordinates[0];
  } else if (districtFeature.geometry.type === "MultiPolygon") {
    coords = districtFeature.geometry.coordinates[0][0];
  } else {
    console.error("Unsupported geometry type for district overlay");
    return;
  }
  let lons = coords.map(c => c[0]);
  let lats = coords.map(c => c[1]);

  let fillOverlay = {
    type: "scattergeo",
    mode: "lines",
    lon: lons,
    lat: lats,
    fill: "toself",
    fillcolor: "gold",                    // Yellow fill
    line: { color: "white", width: 2 },  // White border
    hoverinfo: "skip",
    showlegend: false,
    overlayType: "district"              // Custom property to remove later
  };

  Plotly.addTraces("plotly-map", [fillOverlay]).then(() => {
    console.log("District overlay added.");
  });
}

// 6d. Helper: remove old district overlays, then add a new one
function updateDistrictOverlay(districtFeature) {
  removeDistrictOverlays().then(() => {
    addDistrictOverlay(districtFeature);
  });
}

// 7. Zoom into a selected state
function stateClicked(stateID) {
  let stateFeature = states.features.find(d => d.properties.STATEFP === stateID);
  if (!stateFeature) {
    console.log("State not found:", stateID);
    return;
  }

  let stateAbbr = stateFeature.properties.STUSPS;
  let stateName = stateFeature.properties.NAME;

  // Just an example for updating some UI text
  document.getElementById("map-header").innerText = stateName + " Selected";
  document.getElementById("member-header").innerText = "Congress Members for " + stateName;

  console.log(`Checking data for districts of ${stateAbbr}`);
  // Reuse from memory cache if we've fetched these districts before
  stateDistricts = cachedDistricts[stateAbbr] || allDistricts.features.filter(d => d.properties.OFFICE_ID.startsWith(stateAbbr));
  cachedDistricts[stateAbbr] = stateDistricts;

  updateDistricts(stateDistricts);

  let { minLon, maxLon, minLat, maxLat } = getGeoBounds(stateFeature.geometry);
  let lonRange = maxLon - minLon;
  let latRange = maxLat - minLat;

  // Some padding rules from your existing logic
  let lonPadding, latPadding;
  if (["CA", "TX", "NV"].includes(stateAbbr)) {
    lonPadding = lonRange * 0.25;
    latPadding = latRange * 0.3;
  } else if (lonRange > 15 || latRange > 10) {
    lonPadding = lonRange * 0.15;
    latPadding = latRange * 0.15;
  } else {
    lonPadding = lonRange * 0.1;
    latPadding = latRange * 0.1;
  }

  let adjMinLon = minLon - lonPadding;
  let adjMaxLon = maxLon + lonPadding;
  let adjMinLat = minLat - latPadding;
  let adjMaxLat = maxLat + latPadding;

  let newLonCenter = (adjMinLon + adjMaxLon) / 2;
  let newLatCenter = (adjMinLat + adjMaxLat) / 2;
  let optimalScale = calculateZoom(adjMinLon, adjMaxLon, adjMinLat, adjMaxLat);

  Plotly.relayout("plotly-map", {
    "geo.center": { lon: newLonCenter, lat: newLatCenter },
    "geo.projection.scale": optimalScale
  });

  currentViewLevel = "state";
  lastSelectedState = stateName;
  lastSelectedDistrict = null;

  updateButtonVisibility(true, false);
  console.log("State clicked:", stateAbbr);

  // Example calls to your profile / chart logic (if you have them)
  updateMemberProfile(stateName);
  if (window.selectedMemberID) {
    updateRadarChart(window.selectedMemberID);
  }

  // Visually highlight the state boundary
  addStateOverlay(stateFeature);
}

// 8. Zoom into a selected district
function districtClicked(districtID) {
  let districtFeature = stateDistricts.find(d => d.properties.OFFICE_ID === districtID);
  console.log("District feature:", districtFeature);
  if (!districtFeature) return;

  let { minLon, maxLon, minLat, maxLat } = getGeoBounds(districtFeature.geometry);
  let lonCenter = (minLon + maxLon) / 2;
  let latCenter = (minLat + maxLat) / 2;
  let optimalScale = calculateZoom(minLon, maxLon, minLat, maxLat);

  Plotly.relayout("plotly-map", {
    "geo.center": { lon: lonCenter, lat: latCenter },
    "geo.projection.scale": optimalScale
  });

  currentViewLevel = "district";
  lastSelectedDistrict = districtID;
  updateButtonVisibility(false, true);

  // The district # from properties or from the last two chars
  let districtNumber = districtFeature.properties.DISTRICT || districtID.slice(-2);
  updateMemberProfile(lastSelectedState, districtNumber);

  if (window.selectedMemberID) {
    updateRadarChart(window.selectedMemberID);
  }

  // Highlight the chosen district boundary
  updateDistrictOverlay(districtFeature);
}

// 9. Reset the map back to the national view
function resetView() {
  document.getElementById("map-header").innerText = "Select Your State / District";
  document.getElementById("member-header").innerText = "Member Information";

  Plotly.relayout("plotly-map", {
    "geo.center.lon": -95.7129,
    "geo.center.lat": 37.0902,
    "geo.projection.scale": 0.9
  });

  // Remove any extra traces
  let numTraces = document.getElementById("plotly-map").data.length;
  if (numTraces > 1) {
    for (let i = numTraces - 1; i >= 1; i--) {
      Plotly.deleteTraces("plotly-map", i);
    }
  }

  // Remove overlays
  removeDistrictOverlays();

  currentViewLevel = "national";
  lastSelectedState = null;
  updateButtonVisibility(false, false);

  // Reset sidebar content
  const sidebarContent = document.getElementById("member-details");
  if (sidebarContent) {
    sidebarContent.innerHTML = "";
    sidebarContent.classList.remove("has-content");
  }
}

// 10. Return to just the state view (if already zoomed into a district)
function backToStateView() {
  if (!lastSelectedState) return;
  let stateFeature = states.features.find(d => d.properties.NAME === lastSelectedState);
  if (!stateFeature) return;

  let { minLon, maxLon, minLat, maxLat } = getGeoBounds(stateFeature.geometry);
  let center = [(minLon + maxLon) / 2, (minLat + maxLat) / 2];
  let optimalScale = calculateZoom(minLon, maxLon, minLat, maxLat);

  Plotly.relayout("plotly-map", {
    "geo.center.lon": center[0],
    "geo.center.lat": center[1],
    "geo.projection.scale": optimalScale
  });

  Plotly.restyle("plotly-map", { visible: true });

  let originalValues = stateDistricts.map(d => d.properties.PARTY === "R" ? 1 : 0);
  let plotData = document.getElementById("plotly-map").data;
  let districtTraceIndex = plotData.findIndex(trace => trace.featureidkey === "properties.OFFICE_ID");
  if (districtTraceIndex !== -1) {
    Plotly.restyle("plotly-map", { z: [originalValues] }, [districtTraceIndex]);
  }

  currentViewLevel = "state";
  lastSelectedDistrict = null;
  updateButtonVisibility(true, false);

  updateMemberProfile(lastSelectedState);
}

// 11. Utility for computing bounding box of a feature
function getGeoBounds(geometry) {
  if (!geometry || !geometry.coordinates) {
    console.error("Invalid geometry:", geometry);
    return { minLon: 0, maxLon: 0, minLat: 0, maxLat: 0 };
  }

  let allCoords = (geometry.type === "MultiPolygon")
    ? geometry.coordinates.flat(2)
    : geometry.coordinates[0];

  let lats = allCoords.map(c => c[1]);
  let lons = allCoords.map(c => c[0]);

  let minLon = Math.min(...lons);
  let maxLon = Math.max(...lons);
  let minLat = Math.min(...lats);
  let maxLat = Math.max(...lats);

  return { minLon, maxLon, minLat, maxLat };
}

// 12. Utility for deriving a “zoom scale” from bounding box size
function calculateZoom(minLon, maxLon, minLat, maxLat) {
  let latDiff = maxLat - minLat;
  let lonDiff = maxLon - minLon;

  let baseScale = 5;
  let scaleFactor = Math.max(lonDiff, latDiff) * 0.1;
  let optimalScale;

  if (lonDiff > 15 || latDiff > 10) {
    // Large states
    optimalScale = baseScale - (scaleFactor * 1.65);
  } else if (lonDiff > 5 || latDiff > 5) {
    // Medium states
    optimalScale = baseScale - scaleFactor;
  } else {
    // Small states
    optimalScale = baseScale - (scaleFactor * 0.7);
  }

  return Math.max(2, Math.min(optimalScale, 6));
}

// 13. Show/hide "Back to National" or "Back to State" buttons
function updateButtonVisibility(showBackToNational, showBackToState) {
  document.getElementById("backToNationalView").style.display = showBackToNational ? "block" : "none";
  document.getElementById("backToStateView").style.display = showBackToState ? "block" : "none";
}

// When the DOM is ready, load everything:
document.addEventListener("DOMContentLoaded", loadMapData);
