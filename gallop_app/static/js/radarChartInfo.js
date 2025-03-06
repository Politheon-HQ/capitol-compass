
// Global variable to store congress members data
window.congressMembersData = [];

// Function to get data for radar chart
function getRadarData(member) {
    console.log("Extracting radar data for member:", member.name);

    // Define policy areas and mapping to CSV column names
    const policyAreas = [
        {
            display: "Agriculture and Food",
            member_self: "Agriculture_and_Food_self_proportion",
            member_across_all: "Agriculture_and_Food_across_all_proportion",
            state_self: "Agriculture_And_Food_state_self_proportion",
            state_national: "Agriculture_And_Food_state_national_proportion"
        },
        {
            display: "Crime and Law Enforcement",
            member_self: "Crime_and_Law_Enforcement_self_proportion",
            member_across_all: "Crime_and_Law_Enforcement_across_all_proportion",
            state_self: "Crime_And_Law_Enforcement_state_self_proportion",
            state_national: "Crime_And_Law_Enforcement_state_national_proportion"
        },
        {
            display: "Culture and Recreation",
            member_self: "Culture_and_Recreation_self_proportion",
            member_across_all: "Culture_and_Recreation_across_all_proportion",
            state_self: "Culture_And_Recreation_state_self_proportion",
            state_national: "Culture_And_Recreation_state_national_proportion"
        },
        {
            display: "Economy and Finance",
            member_self: "Economy_and_Finance_self_proportion",
            member_across_all: "Economy_and_Finance_across_all_proportion",
            state_self: "Economy_And_Finance_state_self_proportion",
            state_national: "Economy_And_Finance_state_national_proportion"
        },
        {
            display: "Education and Social Services",
            member_self: "Education_and_Social_Services_self_proportion",
            member_across_all: "Education_and_Social_Services_across_all_proportion",
            state_self: "Education_And_Social_Services_state_self_proportion",
            state_national: "Education_And_Social_Services_state_national_proportion"
        },
        {
            display: "Environment and Natural Resources",
            member_self: "Environment_and_Natural_Resources_self_proportion",
            member_across_all: "Environment_and_Natural_Resources_across_all_proportion",
            state_self: "Environment_And_Natural_Resources_state_self_proportion",
            state_national: "Environment_And_Natural_Resources_state_national_proportion"
        },
        {
            display: "Government Operations and Politics",
            member_self: "Government_Operations_and_Politics_self_proportion",
            member_across_all: "Government_Operations_and_Politics_across_all_proportion",
            state_self: "Government_Operations_And_Politics_state_self_proportion",
            state_national: "Government_Operations_And_Politics_state_national_proportion"
        },
        {
            display: "Health and Healthcare",
            member_self: "Health_and_Healthcare_self_proportion",
            member_across_all: "Health_and_Healthcare_across_all_proportion",
            state_self: "Health_And_Healthcare_state_self_proportion",
            state_national: "Health_And_Healthcare_state_national_proportion"
        },
        {
            display: "Immigration and Civil Rights",
            member_self: "Immigration_and_Civil_Rights_self_proportion",
            member_across_all: "Immigration_and_Civil_Rights_across_all_proportion",
            state_self: "Immigration_And_Civil_Rights_state_self_proportion",
            state_national: "Immigration_And_Civil_Rights_state_national_proportion"
        },
        {
            display: "National Security and International Affairs",
            member_self: "National_Security_and_International_Affairs_self_proportion",
            member_across_all: "National_Security_and_International_Affairs_across_all_proportion",
            state_self: "National_Security_And_International_Affairs_state_self_proportion",
            state_national: "National_Security_And_International_Affairs_state_national_proportion"
        },
        {
            display: "Science, Technology and Communications",
            member_self: "Science__Technology__and_Communications_self_proportion", // Note double underscores
            member_across_all: "Science__Technology__and_Communications_across_all_proportion",
            state_self: "Science_Technology_And_Communications_state_self_proportion",
            state_national: "Science_Technology_And_Communications_state_national_proportion" // Corrected mapping
        },
        {
            display: "Transportation and Infrastructure",
            member_self: "Transportation_and_Infrastructure_self_proportion",
            member_across_all: "Transportation_and_Infrastructure_across_all_proportion",
            state_self: "Transportation_And_Infrastructure_state_self_proportion",
            state_national: "Transportation_And_Infrastructure_state_national_proportion"
        }
    ];

    // Extract values from the members data for both proportions
    return {
        memberData: policyAreas.map(policy => ({
            theta: policy.display,
            r: parseFloat(member[policy.member_self]) || 0
        })),
        stateData: policyAreas.map(policy => ({
            theta: policy.display,
            r: parseFloat(member[policy.state_self]) || 0
        }))
    };
}

// Function to update radar chart
function updateRadarChart(bioguideId) {
    console.log("Updating radar chart for member ID:", bioguideId);

    if (!window.congressMembersData || window.congressMembersData.length === 0) {
        console.error("Radar Chart data not loaded.");
        return;
    }

    // Find member in congressMembersData
    const member = window.congressMembersData.find(d => d.bioguide_id === bioguideId);
    if (!member) return console.error(`Member with ID ${bioguideId} not found`);

    // Update title dynamically
    document.getElementById("radar-chart-title").textContent = `Radar Chart for ${member.name}`;

    let radarData = getRadarData(member);

    // Trace for Congress Member
    let traceMember = {
        type: 'scatterpolar',
        r: radarData.memberData.map(d => d.r),
        theta: radarData.memberData.map(d => d.theta),
        fill: 'toself',
        name: `${member.name}'s Focus`,
        line: { color: 'rgba(44, 160, 44, 0.8)'}
    }

    // Trace for State Proportion
    let traceState = {
        type: 'scatterpolar',
        r: radarData.stateData.map(d => d.r),
        theta: radarData.stateData.map(d => d.theta),
        fill: 'toself',
        name: `State Proportion`,
        line: { color: 'rgba(31, 119, 180, 0.8)' }
    };

    let layout = {
        autosize: true,
        polar: { radialaxis: { visible: true, range: [0, 1] } },
        showlegend: true,
        legend: {
            orientation: 'vertical',
            x: 0.5,
            y: -0.4,
            xanchor: 'center',
            yanchor: 'bottom'
        },
        title: {
            text: `${member.name}'s Legislative Focus vs. State Proportion`,
            font: { size: 16 },
            x: 0.5,
            xanchor: 'center',
            y: 1.25,
            yanchor: 'bottom'
        }
    };

    console.log("Rendering Radar Chart for:", member.name);
    Plotly.newPlot('radar-chart', [traceMember, traceState], layout, {
        responsive: true,
        displayModeBar: false,
        scrollZoom: false,
        modeBarButtonsToRemove: ['toImage', 'sendDataToCloud', 'editInChartStudio', 'zoom2d', 'select2d', 'lasso2d']
    });
}

// Function to load radar chart data from CSV
function loadRadarChartData() {
    console.log("Loading radar chart data...");

    Papa.parse("/static/data/congress_members_with_proportions.csv", {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            console.log("Radar chart data loaded:", results.data);
            window.congressMembersData = results.data;
        },
        error: function(error) {
            console.error("Error loading radar chart data:", error);
        }
    });
}

// Function to initialize proportion toggles
function initProportionToggles() {
    document.querySelectorAll('input[name="proportion-toggle"]').forEach(input => {
        input.addEventListener('change', function() {
            let selectedMember = window.selectedMemberID;
            if (selectedMember) {
                updateRadarChart(selectedMember);
            }
        });
    });
}

// Function to initialize dropwdown for members
function initRadarDropdown(members) {
    console.log("Initializing radar dropdown with members:", members);

    const dropdown = document.getElementById("radar-member-select");
    if (!dropdown) {
        console.error("Radar chart member list not found.");
        return;
    }

    dropdown.innerHTML = "";
    dropdown.append(new Option("-- Select a Member --", ""));

    members.forEach(member => {
        let option = document.createElement("option");
        option.value = member.bioguide_id;
        option.textContent = `${member.name} (${member.state})`;
        dropdown.appendChild(option);
    });
}

// Event listener to load radar chart data on page load
document.addEventListener('DOMContentLoaded', function() {
    loadRadarChartData();
    initProportionToggles();
});