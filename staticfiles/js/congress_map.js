let currentViewLevel = "national";  // Tracks zoom state: "national", "state", "district"
let lastSelectedState = null;
let lastSelectedDistrict = null;
let states, districts;


// Load GeoJSON data from API
Promise.all([
    fetch("https://backend-server-304538040372.us-central1.run.app/api/us_states")
        .then(response => response.json())
        .then(data => ({
            type: "FeatureCollection",
            features: data.states.map(state => ({
                type: "Feature",
                geometry: JSON.parse(state.geometry),
                properties: {
                    NAME: state.name,
                    STUSPS: state.stusps,
                    STATEFP: state.statefp,
                    STATE_PARTY: state.state_party,
                },
            })),
        })),
    fetch("https://backend-server-304538040372.us-central1.run.app/api/congressional_districts")
        .then(response => response.json())
        .then(data => ({
            type: "FeatureCollection",
            features: data.districts.map(district => ({
                type: "Feature",
                geometry: JSON.parse(district.geometry),
                properties: {
                    STATEFP20: district.statefp20,
                    CD118FP: district.cd118fp,
                    OFFICE_ID: district.office_id,
                    LISTING_NAME: district.listing_name,
                    WEBSITE_URL: district.website_url,
                    PARTY: district.party,
                    DISTRICT: district.district,
                    COMMITTEE_ASSIGNMENTS: district.committee_assignments,
                },
            })),
        })),
]).then(([loadedStates, loadedDistricts]) => {
    states = loadedStates;
    districts = loadedDistricts;
    console.log("Loaded states and districts:", states, districts);
    initPlotlyMap(states, districts);
}).catch(error => {
    console.error("Error loading GeoJSON:", error);
});

// Initialize Plotly map
function initPlotlyMap(states, districts) {
    let mapData = [
        {
            type: "choroplethmapbox",
            geojson: states,
            locations: states.features.map(d => d.properties.STATEFP),
            z: states.features.map(d => d.properties.STATE_PARTY === "R" ? 1 : 2),
            colorscale: [[0, "red"], [1, "blue"]],
            text: states.featires.map(d => d.properties.NAME),
            hoverinfo: "text",
            marker: { opacity: 0.7}
        },
        {
            type: "scattermapbox",
            geojson: districts,
            locations: districts.features.map(d => d.properties.OFFICE_ID),
            marker: {
                color: districts.features.map(d => d.properties.PARTY === "R" ? "red" : "blue"),
                size: 8,
                opacity: 0.6,
            },
            text: districts.features.map(d => `${d.properties.LISTING_NAME} (${d.properties.PARTY})`),
            hoverinfo: "text",
        }
    ];

    let layout = {
        mapbox: {
            style: "carto-positron",
            center: { lon: -95.7129, lat: 37.0902 },
            zoom: 3
        },
        margin: { t: 0, b: 0, l: 0, r: 0 },
    };

    Plotly.newPlot("plotly-map", mapData, layout, { responsive: true });

    // Event Listeners for clicking on states and districts
    document.getElementById("plotly-map").on("plotly_click", function(data) {
        let clickedPoint = data.points[0];
        if (currentViewLevel === "national") {
            stateClicked(clickedPoint.location);
        } else if (currentViewLevel === "state") {
            districtClicked(clickedPoint.location);
        }
    });
}

// Function to zoom into a state
function stateClicked(stateID) {
    let stateFeature = states.features.find(d => d.properties.STATEFP === stateID);
    if (!stateFeature) return;
    let center = getGeoCenter(stateFeature.geometry);

    Plotly.relayout("plotly-map", {
        "mapbox.zoom": 6,
        "mapbox.center": { lon: center[0], lat: center[1] }
    });

    currentViewLevel = "state";
    lastSelectedState = stateID;
    lastSelectedDistrict = null;  // Reset district when clicking a state

    updateButtonVisibility(true, false);

    // Load members and radar chart data (if selected)
    if (document.querySelector(`[onclick="loadTab('members')"].active`)) {
        updateMemberProfile(stateID);
    }
    if (document.querySelector(`[onclick="loadTab('network')"].active`)) {
        updateRadarChart(stateID);
    }
}

// Function to zoom into a district
function districtClicked(districtID) {
    let districtFeature = districts.features.find(d => d.properties.OFFICE_ID === districtID);
    if (!districtFeature) return;
    let center = getGeoCenter(districtFeature.geometry);

    Plotly.relayout("plotly-map", {
        "mapbox.zoom": 10,
        "mapbox.center": { lon: center[0], lat: center[1] } 
    });

    currentViewLevel = "district";
    lastSelectedDistrict = districtID;

    updateButtonVisibility(true, true);

    // Load members and radar chart data (if selected)
    if (document.querySelector(`[onclick="loadTab('members')"].active`)) {
        filterMembersByDistrict(districtID);
    }
    if (document.querySelector(`[onclick="loadTab('network')"].active`)) {
        updateRadarChart(districtID);
    }
}

// Function to reset to national view
function resetView() {
    initPlotlyMap.relayout("plotly-map", {
        "mapbox.zoom": 3,
        "mapbox.center": { lon: -95.7129, lat: 37.0902 }
    });

    currentViewLevel = "national";
    lastSelectedState = null;
    lastSelectedDistrict = null;

    updateButtonVisibility(false, false);
}

// Function to go back to state view
function backToStateView() {
    if (!lastSelectedState) return;

    let stateFeature = states.features.find(d => d.properties.STATEFP === lastSelectedState);
    if (!stateFeature) return;
    let center = getGeoCenter(stateFeature.geometry);

    Plotly.relayout("plotly-map", {
        "mapbox.zoom": 6,
        "mapbox.center": { lon: center[0], lat: center[1] }
    });

    currentViewLevel = "state";
    lastSelectedDistrict = null;

    updateButtonVisibility(true, false);
}

// Function to calculate geometric center of a feature
function getGeoCenter(geometry) {
    let coords = geometry.coordinates[0];
    let avgLon = coords.reduce((sum, c) => sum + c[0], 0) / coords.length;
    let avgLat = coords.reduce((sum, c) => sum + c[1], 0) / coords.length;
    return [avgLon, avgLat];
}

// Function to update button visibility
function updateButtonVisibility(showBackToNational, showBackToState) {
    document.getElementById("backToNationalView").style.display = showBackToNational ? "block" : "none";
    document.getElementById("backToStateView").style.display = showBackToState ? "block" : "none";
}