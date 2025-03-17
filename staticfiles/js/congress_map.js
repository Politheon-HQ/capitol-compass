// JavaScript code for interactive map of US Congress members //
// HEROKU PUSH VERSION //
// congress_map.js

let currentViewLevel = "national";  // Tracks zoom state: "national", "state", "district"
let lastSelectedState = null;
let lastSelectedDistrict = null;
let states = null;
let allDistricts = null;  // Store full districts data in memory
let cachedDistricts = {};  // Cache for district data by state
let stateDistricts = [];  // Store districts of the currently selected state

// Cache keys and expiry time (24 hours)
const CACHE_KEYS = {
    STATES: "us_states_cache",
    DISTRICTS: "congressional_districts_cache"
};
const CACHE_EXPIRY_MAP = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Fetch data from API with caching
async function fetchGeoData(cachekey, api_url) {
    const cachedData = localStorage.getItem(cachekey);
    const cachedTime = localStorage.getItem(`${cachekey}_time`);

    if (cachedData && cachedTime) {
        const now = Date.now();
        if (now - Number(cachedTime) < CACHE_EXPIRY_MAP) {
            console.log(`Using cached data for ${cachekey}.`);
            return JSON.parse(cachedData);
        }
    }

    try {
        console.log(`Fetching new data for ${cachekey} from API...`);
        const response = await fetch(api_url);
        if (!response.ok) throw new Error(`Failed to fetch ${cachekey} data`);
        const data = await response.json();

        localStorage.setItem(cachekey, JSON.stringify(data));
        localStorage.setItem(`${cachekey}_time`, Date.now());

        return data;
    } catch (error) {
        console.error(`Error fetching ${cachekey} data:`, error);
        return null;
    }
}

// Load US states and congressional districts
async function loadMapData() {
    try {
        const [loadedStates, loadedDistricts] = await Promise.all([
            fetchGeoData(CACHE_KEYS.STATES, "/api/us_states_topojson/"),
            fetchGeoData(CACHE_KEYS.DISTRICTS, "/api/us_districts_topojson/")
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

// Initialize Plotly map
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
        modeBarButtonsToRemove: ['toImage', 'sendDataToCloud', 'editInChartStudio', 'zoom2d', 'select2d', 'lasso2d']
    });

    console.log("Plotly map initialized");

    // Event listener for clicking on states and districts
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

// Function to load district data (update existing district traces)
function updateDistricts(districts) {
    // Remove previous district traces (all traces except the first state trace)
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
        text: stateDistricts.map(d => `${d.properties.LISTING_NAME} (${d.properties.PARTY}) - District ${d.properties.DISTRICT}`),
        visible: true
    };

    Plotly.addTraces("plotly-map", districtTrace);
}

// Helper function to add a state overlay using scattergeo (outline only)
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
            line: { color: "gold", width: 4 },
            hoverinfo: "skip",
            showlegend: false
        };
    });

    Plotly.addTraces("plotly-map", overlayTraces).then(result => {
        console.log("State overlay added.");
    });
}

// Remove any existing district overlay traces by scanning for custom property overlayType === 'district'
// Now returns a promise so we can chain the addition of a new overlay.
function removeDistrictOverlays() {
    const mapDiv = document.getElementById("plotly-map");
    let indicesToRemove = [];
    mapDiv.data.forEach((trace, index) => {
        if (trace.overlayType && trace.overlayType === "district") {
            indicesToRemove.push(index);
        }
    });
    if (indicesToRemove.length > 0) {
        // Delete indices in descending order to prevent shifting issues
        indicesToRemove.sort((a, b) => b - a);
        return Plotly.deleteTraces("plotly-map", indicesToRemove).then(() => {
            console.log("Existing district overlays removed.");
        });
    } else {
        return Promise.resolve();
    }
}

// Helper function to update district overlay: remove any existing district overlay before adding a new one
function updateDistrictOverlay(districtFeature) {
    removeDistrictOverlays().then(() => {
        addDistrictOverlay(districtFeature);
    });
}

// Helper function to add a district overlay with a glow effect using scattergeo
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

    // Main overlay trace with turquoise color
    let mainOverlay = {
        type: "scattergeo",
        mode: "lines",
        lon: lons,
        lat: lats,
        line: { color: "turquoise", width: 3, dash: "solid" },
        opacity: 0.8,
        hoverinfo: "skip",
        showlegend: false,
        overlayType: "district"  // Custom property to identify district overlays
    };

    // Glow effect trace: wider, dotted, semi-transparent
    let glowOverlay = {
        type: "scattergeo",
        mode: "lines",
        lon: lons,
        lat: lats,
        line: { color: "turquoise", width: 4, dash: "solid" },
        opacity: 0.4,
        hoverinfo: "skip",
        showlegend: false,
        overlayType: "district"
    };

    // Add both traces
    Plotly.addTraces("plotly-map", [glowOverlay, mainOverlay]).then(result => {
        console.log("District overlay with glow effect added.");
    });
}

// Function to zoom into a state
function stateClicked(stateID) {
    let stateFeature = states.features.find(d => d.properties.STATEFP === stateID);
    if (!stateFeature) {
        console.log("State not found:", stateID);
        return;
    }

    let stateAbbr = stateFeature.properties.STUSPS;
    let stateName = stateFeature.properties.NAME;

    document.getElementById("map-header").innerText = stateName + " Selected";
    document.getElementById("member-header").innerText = "Congress Members for " + stateName;

    console.log(`Checking data for districts of ${stateAbbr}`);
    stateDistricts = cachedDistricts[stateAbbr] || allDistricts.features.filter(d => d.properties.OFFICE_ID.startsWith(stateAbbr));
    cachedDistricts[stateAbbr] = stateDistricts;
    updateDistricts(stateDistricts);

    let { minLon, maxLon, minLat, maxLat } = getGeoBounds(stateFeature.geometry);
    let lonRange = maxLon - minLon;
    let latRange = maxLat - minLat;

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
        "geo.projection.scale": optimalScale,
    });

    currentViewLevel = "state";
    lastSelectedState = stateName;
    lastSelectedDistrict = null;

    updateButtonVisibility(true, false);
    console.log("State clicked:", stateAbbr);

    updateMemberProfile(stateName);
    
    if (window.selectedMemberID) {
        updateRadarChart(window.selectedMemberID);
    }

    addStateOverlay(stateFeature);
}

// Function to zoom into a district
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
        "geo.projection.scale": optimalScale,
    });

    currentViewLevel = "district";
    lastSelectedDistrict = districtID;
    updateButtonVisibility(false, true);

    let districtNumber = districtFeature.properties.DISTRICT || lastSelectedDistrict.slice(-2);
    updateMemberProfile(lastSelectedState, districtNumber);

    if (window.selectedMemberID) {
        updateRadarChart(window.selectedMemberID);
    }

    updateDistrictOverlay(districtFeature);
}

// Function to reset to national view
function resetView() {
    document.getElementById("map-header").innerText = "Select Your State / District";
    document.getElementById("member-header").innerText = "Member Information";

    Plotly.relayout("plotly-map", {
        "geo.center.lon": -95.7129,
        "geo.center.lat": 37.0902,
        "geo.projection.scale": 0.9
    });

    let numTraces = document.getElementById("plotly-map").data.length;
    if (numTraces > 1) {
        for (let i = numTraces - 1; i >= 1; i--) {
            Plotly.deleteTraces("plotly-map", i);
        }
    }

    // Remove any state or district overlays
    removeDistrictOverlays();
    
    currentViewLevel = "national";
    lastSelectedState = null;
    updateButtonVisibility(false, false);

    const sidebarContent = document.getElementById("member-details");
    if (sidebarContent) {
        sidebarContent.innerHTML = "";
        sidebarContent.classList.remove("has-content");
    }
}

// Function to go back to state view
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
    Plotly.restyle("plotly-map", { z: [originalValues] }, [districtTraceIndex]);

    currentViewLevel = "state";
    lastSelectedDistrict = null;
    updateButtonVisibility(true, false);

    updateMemberProfile(lastSelectedState);
}

function getGeoBounds(geometry) {
    if (!geometry || !geometry.coordinates) {
        console.error("Invalid geometry:", geometry);
        return { minLon: 0, maxLon: 0, minLat: 0, maxLat: 0 };
    }

    let allCoords = geometry.type === "MultiPolygon"
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

function calculateZoom(minLon, maxLon, minLat, maxLat) {
    let latDiff = maxLat - minLat;
    let lonDiff = maxLon - minLon;

    let baseScale = 5;
    let scaleFactor = Math.max(lonDiff, latDiff) * 0.1;
    let optimalScale;

    if (lonDiff > 15 || latDiff > 10) {
        optimalScale = baseScale - (scaleFactor * 1.65);
    } else if (lonDiff > 5 || latDiff > 5) {
        optimalScale = baseScale - scaleFactor;
    } else {
        optimalScale = baseScale - (scaleFactor * 0.7);
    }

    return Math.max(2, Math.min(optimalScale, 6));
}

function updateButtonVisibility(showBackToNational, showBackToState) {
    document.getElementById("backToNationalView").style.display = showBackToNational ? "block" : "none";
    document.getElementById("backToStateView").style.display = showBackToState ? "block" : "none";
}

document.addEventListener("DOMContentLoaded", loadMapData);
