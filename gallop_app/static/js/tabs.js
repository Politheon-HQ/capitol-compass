// Function to dynamically update sidebar content based on selected tab
function loadTab(tabName) {
    console.log(`Switching to tab: ${tabName}`);

    // Hide all tab containers
    document.querySelectorAll(".tab-container").forEach(tab => tab.style.display = "none");

    // Show the selected tab container
    const selectedTab = document.getElementById(`${tabName}-container`);
    if (selectedTab) {
        selectedTab.style.display = "block";
    } 
    
    // Handle tab-specific content updates
    if (tabName === "general") {
        console.log("Loading general tab...");
    } else if (tabName === "members") {
        if (window.previousMemberList && window.previousMemberList.length > 0) {
            console.log("Restoring previous member list....");
            restorePreviousMemberList();
        } 
    } else if (tabName === "radar-chart") {
        console.log("Loading radar chart...");
        // Ensure that globalMembersData is loaded and the dropdown is updated
        if (window.congressMembersData && window.congressMembersData.length > 0) {
            initRadarDropdown(window.congressMembersData);
        } else {
            console.warn("Congress members data not loaded. Fetching data...");
        }

        document.getElementById("radar-member-select").addEventListener("change", function() {
            let selectedMember = this.value;
            if (!selectedMember) return;

            console.log("Selected member:", selectedMember);
            updateRadarChart(selectedMember);
        });

        if (window.selectedMemberID) {
            updateRadarChart(window.selectedMemberID);
        } else {
            console.warn("No member selected for radar chart.");
        }
    } else if (tabName === "ideology-chart") {
        console.log("Loading ideology chart...");
        ensureIdeologyDataLoaded().then(() => {
            loadIdeologyChart();
        });
    }

    // Update active tab styling
    document.querySelectorAll(".tabs button").forEach(btn => btn.classList.remove("active"));

    let activeTab = document.querySelector(`.tabs button[data-tab="${tabName}"]`);
    if (activeTab) {
        activeTab.classList.add("active");
    } else {
        console.warn(`Tab not found: ${tabName}`);
    }
}