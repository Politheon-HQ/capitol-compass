// Function to dynamically update sidebar content based on selected tab
function loadTab(tabName) {
    const sidebar = document.getElementById("sidebar-content");

    if (tabName === "general") {
        sidebar.innerHTML = `
            <h2>General Information</h2>
            <p>Welcome to Gallop, a data visualization tool for exploring the U.S. Congress!</p>
            <p>Click on a state to view its congressional districts, or click on a district to view its representatives.</p>
        `;
    } else if (tabName === "members") {
        sidebar.innerHTML = `
            <h2>Congress Members</h2>
            <p>Click on a state to view its congressional representatives.</p>
            <div id="member-details">Loading members...</div>
        `;

        // If a state or district is selected, update members immediately
        if (lastSelectedState) {
            updateMemberProfile(lastSelectedState);
        }
        if (lastSelectedDistrict) {
            filterMembersByDistrict(lastSelectedDistrict);
        }
    } else if (tabName === "network") {
        sidebar.innerHTML = `
            <h2>Network Analysis</h2>
            <p>Click on a state to view its congressional representatives.</p>
            <div id="radar-chart"></div>
        `;

        // If a state or district is selected, update radar chart immediately
        if (lastSelectedState) {
            updateRadarChart(lastSelectedState);
        }
        if (lastSelectedDistrict) {
            updateRadarChart(lastSelectedDistrict);
        }
    } else if (tabName === "ideology") {
        sidebar.innerHTML = `
            <h2>Congress Members Ideology Chart</h2>
            <label for="topic-select">Select a Topic:</label>
            <select id="topic-select"></select>
            <div id="ideology-chart"></div>
        `;

        // Load ideology chart data
        loadIdeologyChart();
    }

    // Update active tab styling
    document.querySelectorAll(".tabs button").forEach(btn => btn.classList.remove("active"));
    document.querySelector(`[onclick="loadTab('${tabName}')"]`).classList.add("active");
}