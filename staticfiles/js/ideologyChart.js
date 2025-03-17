// Global variable to store ideology data
window.ideologyData = [];
window.ideologyTopics = [];

// API Endpoint
const IDEOLOGY_API = "/api/combined_data/";

// Function to fetch data from API with caching
async function fetchIdeologyData() {
    try {
        console.log("Fetching new ideology data from API...");
        const response = await fetch(IDEOLOGY_API);
        if (!response.ok) throw new Error(`Failed to fetch data from ${IDEOLOGY_API}`);

        const data = await response.json();
        console.log("Fetched data:", data);

        // Extract unique topics
        let topics = new Set();
        data.forEach(d => {
            if (d.assigned_label) {
                try {
                    let labels;

                    if (Array.isArray(d.assigned_label)) {
                        labels = d.assigned_label;
                    } else if (typeof d.assigned_label === 'string') {
                        let fixed_string = d.assigned_label.replace(/'/g, '"');
                        labels = JSON.parse(fixed_string);
                    } else {
                        throw new Error("Invalid assigned_label format");
                    }

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

        return { ideologyData: data, ideologyTopics: [...topics] };
    } catch(error) {
        console.error("Error fetching ideology data:", error);
        return null;
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

    // Ensure data is loaded
    await ensureIdeologyDataLoaded();

    // Ensure dropdown populated
    populateTopicDropdown(window.ideologyTopics);

    // Add event listener to update chart on selection
    topicSelect.addEventListener("change", function() {
        let selectedTopic = this.value;
        console.log("Selected topic:", selectedTopic);

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

// Function to get aggregated data per topic
function getDataForTopic(data, topic) {
    if (!topic) return [];

    let counts = data.reduce((acc, d) => {
        try {
            let topics;

            if (Array.isArray(d.assigned_label)) {
                topics = d.assigned_label;
            } else if (typeof d.assigned_label === 'string') {
                let fixed_string = d.assigned_label.replace(/'/g, '"');
                topics = JSON.parse(fixed_string);
            } else {
                throw new Error("Invalid assigned_label format");
            }
           
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
        await fetchIdeologyData();
    }
}
