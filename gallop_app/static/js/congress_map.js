// JavaScript code for interactive map of US Congress members

let currentViewLevel = "national";  // Tracks zoom state: "national", "state", "district"
let lastSelectedState = null;
let lastSelectedDistrict = null;
let states, districts;


// Load GeoJSON data from API
Promise.all([
    fetch("/static/data/us_states.geojson").then(response => response.json()),
    fetch("/static/data/congressional_districts.geojson").then(response => response.json())
        
]).then(([loadedStates, loadedDistricts]) => {
    states = loadedStates;
    districts = loadedDistricts;
    console.log("Loaded states and districts:", states, districts);
    initPlotlyMap(states, districts);
}).catch(error => {
    console.error("Error loading GeoJSON:", error);
});

// Initialize Plotly map
function initPlotlyMap() {
    let zValuesStates = states.features.map(d => d.properties.STATE_PARTY === "R" ? 1 : 0);
    let zValuesDistricts = districts.features.map(d => d.properties.PARTY === "R" ? 1 : 0);

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

    let districtTrace = {
        type: "choropleth",
        geojson: districts,
        locations: districts.features.map(d => d.properties.OFFICE_ID),
        z: zValuesDistricts,
        featureidkey: "properties.OFFICE_ID",
        colorscale: [[0, "rgba(247, 23, 19, 0.8)"], [1, "rgba(51, 7, 246, 0.89)"]],
        autocolorcale: false,
        reversescale: true,
        zmin: 0,
        zmax: 1,
        showscale: false,
        marker: { line: { color: "black", width: 1.5 } },
        hoverinfo: "text",
        text: districts.features.map(d => `${d.properties.LISTING_NAME} (${d.properties.PARTY}) - District ${d.properties.DISTRICT}`),
        visible: false
    }

    let layout = {
        geo: {
            scope: "usa",
            showlakes: false,
            showland: true,
            lakescolor: "rgba(244,244,244,1)",
            bgcolor: "rgba(244,244,244,1)",
        },
        paper_bgcolor: "rgba(244,244,244,1)",
        plot_bgcolor: "rgba(244,244,244,1)",
    };

    console.log("Rendering state mep with:", stateTrace, districtTrace);

    Plotly.newPlot("plotly-map", [stateTrace, districtTrace], layout, {
        responsive: true,
        displayModeBar: false,
        scrollZoom: false,
        modeBarButtonsToRemove: ['toImage', 'sendDataToCloud', 'editInChartStudio', 'zoom2d', 'select2d', 'lasso2d']
    }).then(() => {
        setTimeout(() => {
            let choroplethLayer = document.querySelector(".choroplethlayer");
            if (choroplethLayer) {
                choroplethLayer.parentNode.appendChild(choroplethLayer);
                console.log("Choropleth layer moved to top");
            }
        }, 1000);
    });

    console.log("Plotly map initialized");

    // Event Listeners for clicking on states and districts
    document.getElementById("plotly-map").on("plotly_click", function(data) {
        let clickedPoint = data.points[0].location;
        console.log("Clicked point:", clickedPoint);

        let isStateClick = states.features.find(d => d.properties.STATEFP === clickedPoint);

        if (isStateClick) {
            console.log(`Clicked on state: ${clickedPoint}`);
            stateClicked(clickedPoint);
        } else if (currentViewLevel === "state") {
            districtClicked(clickedPoint);
        }
    });
}

// Function to zoom into a state
function stateClicked(stateID) {
    let stateFeature = states.features.find(d => d.properties.STATEFP === stateID);
    console.log("State feature:", stateFeature);
    if (!stateFeature) {
        console.log("State not found:", stateID);
        return;
    }

    // Extract state abbreviation from selected state
    let stateAbbr = stateFeature.properties.STUSPS;
    let stateName = stateFeature.properties.NAME;

    // Filter districts that belong to the state
    let stateDistricts = districts.features.filter(d =>
        d.properties.OFFICE_ID.startsWith(stateAbbr)
    );

    let center = getGeoCenter(stateFeature.geometry);
    
    // Switch to 'Members' tab
    loadTab("members");

    // Clear all district traces
    let numTraces = document.getElementById("plotly-map").data.length;
    if (numTraces > 1) {
        for (let i = numTraces - 1; i >= 1; i--) {
            Plotly.deleteTraces("plotly-map", i);
        }
    }

    Plotly.relayout("plotly-map", {
        "geo.center.lon": center[0],
        "geo.center.lat": center[1],
        "geo.projection.scale": 5,
    });

    Plotly.restyle("plotly-map", { visible: false }, [1]);

    let districtTrace = {
        type: "choropleth",
        geojson: { type: "FeatureCollection", features: stateDistricts },
        locations: stateDistricts.map(d => d.properties.OFFICE_ID),
        z: stateDistricts.map(d => d.properties.PARTY === "R" ? 1 : 0),
        featureidkey: "properties.OFFICE_ID",
        colorscale: [[0, "rgba(247, 23, 19, 0.8)"], [1, "rgba(51, 7, 246, 0.93)"]],
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
    /*Plotly.restyle("plotly-map", { visible: [false, true] }, [1]);*/

    currentViewLevel = "state";
    lastSelectedState = stateName;
    lastSelectedDistrict = null;  // Reset district when clicking a state

    updateButtonVisibility(true, false);
    console.log("State clicked:", stateAbbr);

    updateMemberProfile(stateName);
    console.log("Calling updateMemberProfile for:", stateName);

   // Load members and radar chart data (if selected)
   if (document.querySelector(`[onclick="loadTab('radar-chart')"].active`)) {
        updateRadarChart(window.selectedMemberID);
    }   
}

// Function to zoom into a district
function districtClicked(districtID) {
    let districtFeature = districts.features.find(d => d.properties.OFFICE_ID === districtID);
    if (!districtFeature) return;
    let center = getGeoCenter(districtFeature.geometry);

    let stateAbbr = districtFeature.properties.OFFICE_ID.slice(0, 2);
    let districtNum = districtFeature.properties.STATEFP20;

    console.log(`District clicked: ${districtNum} in ${stateAbbr}`);

    Plotly.relayout("plotly-map", {
        "geo.center.lon": center[0],
        "geo.center.lat": center[1],
        "geo.projection.scale": 10
    });

    currentViewLevel = "district";
    lastSelectedDistrict = districtID;

    updateButtonVisibility(false, true);

    // Load members and radar chart data (if selected)
    if (document.querySelector(`[onclick="loadTab('members')"].active`)) {
        updateMemberProfile(lastSelectedState, districtNum);
    }
    if (document.querySelector(`[onclick="loadTab('radar-chart')"].active`)) {
        updateRadarChart(window.selectedMemberID);
    }
}

// Function to reset to national view
function resetView() {
    Plotly.relayout("plotly-map", {
        "geo.center.lon": -95.7129,
        "geo.center.lat": 37.0902,
        "geo.projection.scale": 0.9
    });

    // Clear all district traces
    let numTraces = document.getElementById("plotly-map").data.length;
    if (numTraces > 1) {
        for (let i = numTraces - 1; i >= 1; i--) {
            Plotly.deleteTraces("plotly-map", i);
        }
    }

    currentViewLevel = "national";
    lastSelectedState = null;
    lastSelectedDistrict = null;

    updateButtonVisibility(false, false);

    // Reset sidebar content to the original welcome message
    const sidebarContent = document.getElementById("member-details");
    if (sidebarContent) {
        sidebarContent.innerHTML = `
            <p>Select a state from the Map, or click on one of the Tabs to get started.</p>
        `;
    }

    const sidebarTitle = document.querySelector("#sidebar-content h2");
    sidebarTitle.textContent = "";
}

// Function to go back to state view
function backToStateView() {
    if (!lastSelectedState) return;

    let stateFeature = states.features.find(d => d.properties.NAME === lastSelectedState);
    if (!stateFeature) return;
    let center = getGeoCenter(stateFeature.geometry);

    Plotly.relayout("plotly-map", {
        "geo.center.lon": center[0],
        "geo.center.lat": center[1],
        "geo.projection.scale": 5.5
    });

    // Restore state trace visibility
    Plotly.restyle("plotly-map", { visible: true }, [0]);

    currentViewLevel = "state";
    lastSelectedDistrict = null;

    updateButtonVisibility(true, false);

    // Reset the sidebar to show all members of the state
    updateMemberProfile(lastSelectedState);
}

// Function to calculate geometric center of a feature
function getGeoCenter(geometry) {
    if (!geometry || !geometry.coordinates) {
        console.error("Invalid geometry:", geometry);
        return [0, 0];  // Default to center of the map
    }

    let allCoords = geometry.type === "MultiPolygon"
        ? geometry.coordinates.flat(2)  // Flatten multi-polygons
        : geometry.coordinates[0]; // Single polygon

    let avgLon = allCoords.reduce((sum, c) => sum + c[0], 0) / allCoords.length;
    let avgLat = allCoords.reduce((sum, c) => sum + c[1], 0) / allCoords.length;

    return [avgLon, avgLat];
}

// Function to update button visibility
function updateButtonVisibility(showBackToNational, showBackToState) {
    document.getElementById("backToNationalView").style.display = showBackToNational ? "block" : "none";
    document.getElementById("backToStateView").style.display = showBackToState ? "block" : "none";
}