// Global variable to store ideology data
window.ideologyData = [];
window.ideologyTopics = [];

// Function to load ideology chart data
async function loadIdeologyData() {
    return fetch("/static/data/combined_data.csv")
        .then(response => response.text())
        .then(csv => {
            let data = Papa.parse(csv, { header: true }).data;
            console.log("Loaded ideology data:", data);

            // Extract unique topics
            let topics =  new Set();
            data.forEach(d => {
                if (d.assigned_label) {
                    try {
                        let labels = JSON.parse(d.assigned_label.replace(/'/g, '"'));
                        if (Array.isArray(labels)) {
                            labels.forEach(topic => topics.add(topic));
                        }
                    } catch (error) {
                        console.error("Error parsing assigned_label:", error, "Raw value:", d.assigned_label);
                    }
                }
            });
            
            console.log("Extracted topics:", [...topics]);

            // Store data globally
            window.ideologyData = data;
            window.ideologyTopics = [...topics];

            return { ideologyData, ideologyTopics };
        })
        .catch(error => console.error("Error loading ideology data:", error));
}

function loadIdeologyChart() {
    let chartContainer = document.getElementById("ideology-chart-container");
    let topicSelect = document.getElementById("topic-select");

    if (!chartContainer || !topicSelect) {
        console.error("Chart container not found.");
        return;
    }

    // Ensure dropdown populated
    populateTopicDropdown(window.ideologyTopics);

    // Add event listener to update chart on selection
    topicSelect.addEventListener("change", function() {
        let selectedTopic = this.value;
        console.log("Selected topic:", this.value);

        if (!selectedTopic) {
            // Clear chart if no topic selected
            document.getElementById("ideology-chart").innerHTML = "";
            return;
        }

        let filteredData = getDataForTopic(window.ideologyData, selectedTopic);
        if (filteredData.length === 0) {
            updateIdeologyChart([], "No data found for selected topic.");
        } else {
            updateIdeologyChart(filteredData);
        }
    });

    // Prevent displaying "No data" message on initial load
    updateIdeologyChart([], "Select a Topic to Display Data", true);
}

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

// Function to get aggregated data per topic
function getDataForTopic(data, topic) {
    if (!topic) return [];

    let counts = data.reduce((acc, d) => {
        try {
            let topics = JSON.parse(d.assigned_label.replace(/'/g, '"'));
            if (Array.isArray(topics) && topics.includes(topic)) {
                acc[d.state] = (acc[d.state] || 0) + 1;
            }
        } catch (error) {
            console.error("Error parsing assigned_label:", error, "Raw value:", d.assigned_label);
        }
        return acc;
    }, {});
    return Object.entries(counts).map(([state, count]) => ({ state, count }));
}

// Function to update ideology chart
function updateIdeologyChart(data, isInitialLoad = false) {
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
        chartDiv.innerHTML = `<p>No data available for selected topic.</p>`;
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

async function ensureIdeologyDataLoaded() {
    if (!window.ideologyData || window.ideologyData.length === 0) {
        console.warn("Ideology data not loaded. Fetching data...");
        await loadIdeologyData();
    }
}
