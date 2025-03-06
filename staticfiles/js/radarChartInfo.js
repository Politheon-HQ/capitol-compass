// Global variable to store congress members data
window.congressMembersData = [];

// Define policy areas and data mappings
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

// Load CSV data
fetch("/static/data/congress_members_with_proportions.csv")
    .then(response => response.text())
    .then(csv => {
        let data = PerformancePaintTiming.parse(csv, { header: true }).data;  // Using PapaParse for CSV
        window.congressMembersData = data;

        // Populate member dropdown
        let memberSelect = document.getElementById("member-select");
        data.forEach(member => {
            let option = document.createElement("option");
            option.value = member.bioguide_id;
            option.textContent = `${member.name} (${member.state})`;
            memberSelect.appendChild(option);
        });

        // Default to the first member
        if (data.length > 0) {
            updateRadarChart(data[0].bioguide_id);
        }
    })
    .catch(error => console.error("Error loading CSV data:", error));

// Function to get data for radar chart
function getRadarData(member, proportionType) {
    return policyAreas.map(policy => ({
        theta: policy.display,
        r: parseFloat(member[policy[proportionType]]) || 0
    }));
}

// Function to update radar chart
function updateRadarChart(bioguideId) {
    let member = window.congressMembersData.find(d => d.bioguide_id === bioguideId);
    if (!member) return console.error(`Member with ID ${bioguideId} not found`);

    let proportionType = document.querySelector('input[name="proportion-type"]:checked').value;
    let radarData = getRadarData(member, proportionType === 'self' ? 'member_self' : 'member_across_all');

    let trace = {
        type: 'scatterpolar',
        r: radarData.map(d => d.r),
        theta: radarData.map(d => d.theta),
        fill: 'toself',
        name: `${member.name} (${member.state})`
    };

    let layout = {
        polar: { radialaxis: { visible: true, range: [0, 1] } },
        showlegend: false,
        title: `${member.name}'s Legislative Focus`
    };

    initPlotlyMap.newPlot('radar-chart', [trace], layout);
}

// Handle dropdown selection change
document.getElementById("member-select").addEventListener("change", function() {
    updateRadarChart(this.value);
});

// Handle proportion type toggle change
document.querySelectorAll('input[name="proportion-toggle"]').forEach(input => {
    input.addEventListener("change", function() {
        let selectedMember = document.getElementById("member-select").value;
        if (selectedMember) {
            updateRadarChart(selectedMember);
        };
    });
});