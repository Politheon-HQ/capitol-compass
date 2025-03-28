// Global variable to store ideology data
window.ideologyTopics = [];

// API Endpoint
const TOPICS_API = "/api/ideology_topics/";
const IDEOLOGY_API = "/api/ideology_data_by_topic/";

// Function to fetch data from API with caching
async function fetchIdeologyTopics() {
    try {
        const response = await fetch(TOPICS_API);
        if (!response.ok) throw new Error("Failed to fetch data.");

        const topics = await response.json();
        window.ideologyTopics = topics;
        console.log("Fetched topics:", topics);
        return topics;
    } catch (error) {
        console.error("Error fetching topics:", error);
        return [];
    }
}

// Function to load ideology data and initialize chart
async function loadIdeologyChart() {
    let chartContainer = document.getElementById("ideology-chart-container");
    let topicSelect = document.getElementById("topic-select");

    if (!chartContainer || !topicSelect) {
        console.error("Chart container not found.");
        return;
    }

    // Ensure dropdown populated
    const topics = await fetchIdeologyTopics();
    populateTopicDropdown(topics);

    // Add event listener to update chart on selection
    topicSelect.addEventListener("change", async function() {
        let selectedTopic = this.value;
        console.log("Selected topic:", selectedTopic);

        if (!selectedTopic) {
            // Clear chart if no topic selected
            document.getElementById("ideology-chart").innerHTML = "";
            return;
        }

        try {
            const response = await fetch(`${IDEOLOGY_API}${encodeURIComponent(selectedTopic)}`);
            if (response.status === 202) {
                updateIdeologyChart([], false, "Data is being fetched. Please wait...");
                return;
            }
            if (!response.ok) throw new Error("Failed to fetch topic data.");

            const filteredData = await response.json();
            if (filteredData.length === 0) {
                updateIdeologyChart([], false, "No data found for selected topic.");
            } else {
                updateIdeologyChart(filteredData);
            }
        } catch (error) {
            console.error("Error fetching ideology data:", error);
            updateIdeologyChart([], false, "Failed to fetch data. Please try again later.");
        }
    });

    // Prevent displaying "No data" message on initial load
    updateIdeologyChart([], "Select a Topic to Display Data", true);
}

// Function to populate topic dropdown
function populateTopicDropdown(topics) {
    console.log("Populating topic dropdown with:", topics);

    const dropdown = document.getElementById("topic-select");
    if (!dropdown) {
        console.error("Dropdown element not found.");
        return;
    }

    dropdown.innerHTML = "";
    dropdown.append(new Option("-- Select a Topic --", ""));

    topics.forEach(topic => {
        let option = document.createElement("option");
        option.value = topic;
        option.textContent = topic.charAt(0).toUpperCase() + topic.slice(1);
        dropdown.appendChild(option);
    });
}


// Function to update ideology chart
function updateIdeologyChart(data, isInitialLoad = false, message = null) {
    let chartDiv = document.getElementById("ideology-chart");

    if (!chartDiv) {
        console.error("Chart container not found.");
        return;
    }

    // Prevent displaying "No data" message on initial load
    if (isInitialLoad) {
        chartDiv.innerHTML = "";
        return;
    }

    if (data.length === 0) {
        chartDiv.innerHTML = `<p>${message || "No data available for selected topic."}</p>`;
        return;
    }

    let trace = {
        x: data.map(d => d.state),
        y: data.map(d => d.count),
        type: 'bar',
        marker: { color: 'blue' },
    };

    let layout = {
        title: "Ideology Distribution by State",
        xaxis: { 
            title: "State",
            tickangle: -45,
            automargin: true
        },
        yaxis: { title: "Count" },
        margin: { l: 70, r: 40, t: 50, b: 100 },
        autosize: true,
    };

    Plotly.newPlot('ideology-chart', [trace], layout, {
        responsive: true,
        displayModeBar: false,
        scrollZoom: false,
        modeBarButtonsToRemove: ['toImage', 'sendDataToCloud', 'editInChartStudio', 'zoom2d', 'select2d', 'lasso2d']
    });
}

// Call loadIdeologyChart on page load
document.addEventListener("DOMContentLoaded", () => {
    loadIdeologyChart();
});
