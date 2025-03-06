function loadIdeologyChart() {
    const sidebar = document.getElementById("sidebar-content");

    // Change sidebar content dynamically
    sidebar.innerHTML = `
    <h2>Congress Members Ideology Chart</h2>
    <label for="topic-select">Select a Topic:</label>
    <select id="topic-select"></select>
    <div id="ideology-chart"></div>
    `;

    // Load CSV data
    fetch("/static/data/combined_data.csv")
        .then(response => response.text())
        .then(csv => {
            let data = Papa.parse(csv, { header: true }).data;  // Using PapaParse for CSV

            // Extract unique topics
            let topics = [...new Set(data.flatMap(d => JSON.parse(d.assigned_label.replace(/'/g, '"'))))];

            // Populate topic dropdown
            let topicSelect = document.getElementById("topic-select");
            topicSelect.innerHTML = '<option value="">--Select a Topic--</option>';
            topics.forEach(topic => {
                let option = document.createElement("option");
                option.value = topic;
                option.textContent = topic.charAt(0).toUpperCase() + topic.slice(1);
                topicSelect.appendChild(option);
            });

            // Default to empty chart
            updateIdeologyChart([]);

            // Handle topic selection
            topicSelect.addEventListener("change", function() {
                let selectedTopic = this.value;
                let filteredData = getDataForTopic(data, selectedTopic);
                updateIdeologyChart(filteredData);
            });
        })
        .catch(error => console.error("Error loading CSV data:", error));
}

// Function to get aggregated data per topic
function getDataForTopic(data, topic) {
    if (!topic) return [];

    let counts = data.reduce((acc, d) => {
        let topics = JSON.parse(d.assigned_label.replace(/'/g, '"'));
        if (topics.includes(topic)) {
            acc[d.state] = (acc[d.state] || 0) + 1;
        }
        return acc;
    }, {});
    return Object.entries(counts).map(([state, count]) => ({ state, count }));
}

// Function to update ideology chart
function updateIdeologyChart(data) {
    let states = data.map(d => d.state);
    let counts = data.map(d => d.count);

    let trace = {
        x: states,
        y: counts,
        type: 'bar',
        marker: { color: 'blue' },
    };

    let layout = {
        title: "Ideology Distribution by State",
        xaxis: { title: "State" },
        yaxis: { title: "Count" },
        margin: { b: 100 }
    };

    Plotly.newPlot('ideology-chart', [trace], layout);
}