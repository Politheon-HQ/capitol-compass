// ideologySankey.js
// This file creates a D3-based Sankey diagram in the "ideology-chart-container".
// It adds its own state selector with extra sample states.

(function() {
    // Sample data with several states
    const testData = {
      national: {
        "Agriculture and Food": 0.15,
        "Crime and Law Enforcement": 0.10,
        "Culture and Recreation": 0.08,
        "Economy and Finance": 0.20,
        "Education and Social Services": 0.12,
        "Environment and Natural Resources": 0.05,
        "Government Operations and Politics": 0.10,
        "Health and Healthcare": 0.10,
        "Immigration and Civil Rights": 0.05,
        "National Security and International Affairs": 0.05
      },
      states: {
        "CA": {
          "Agriculture and Food": 0.10,
          "Crime and Law Enforcement": 0.12,
          "Culture and Recreation": 0.12,
          "Economy and Finance": 0.18,
          "Education and Social Services": 0.15,
          "Environment and Natural Resources": 0.10,
          "Government Operations and Politics": 0.05,
          "Health and Healthcare": 0.10,
          "Immigration and Civil Rights": 0.05,
          "National Security and International Affairs": 0.03
        },
        "TX": {
          "Agriculture and Food": 0.12,
          "Crime and Law Enforcement": 0.11,
          "Culture and Recreation": 0.09,
          "Economy and Finance": 0.22,
          "Education and Social Services": 0.10,
          "Environment and Natural Resources": 0.07,
          "Government Operations and Politics": 0.08,
          "Health and Healthcare": 0.08,
          "Immigration and Civil Rights": 0.04,
          "National Security and International Affairs": 0.09
        },
        "NY": {
          "Agriculture and Food": 0.08,
          "Crime and Law Enforcement": 0.09,
          "Culture and Recreation": 0.15,
          "Economy and Finance": 0.18,
          "Education and Social Services": 0.14,
          "Environment and Natural Resources": 0.06,
          "Government Operations and Politics": 0.11,
          "Health and Healthcare": 0.10,
          "Immigration and Civil Rights": 0.05,
          "National Security and International Affairs": 0.04
        },
        "FL": {
          "Agriculture and Food": 0.11,
          "Crime and Law Enforcement": 0.10,
          "Culture and Recreation": 0.10,
          "Economy and Finance": 0.20,
          "Education and Social Services": 0.13,
          "Environment and Natural Resources": 0.07,
          "Government Operations and Politics": 0.06,
          "Health and Healthcare": 0.09,
          "Immigration and Civil Rights": 0.05,
          "National Security and International Affairs": 0.09
        }
      }
    };
  
    // Draw the Sankey diagram for the given state
    function drawSankey(selectedState) {
      const national = testData.national;
      const stateData = testData.states[selectedState];
      if (!stateData) {
        console.error("No data found for state:", selectedState);
        return;
      }
      // Get topics sorted by national proportion
      const topics = Object.keys(national).sort((a, b) => national[b] - national[a]);
  
      // Build nodes: index 0 is "National", next are topics, last is the selected state.
      const nodes = [];
      nodes.push({ name: "National" });
      topics.forEach(topic => nodes.push({ name: topic }));
      nodes.push({ name: selectedState });
  
      // Build links:
      // From National (index 0) to each topic (index 1...N)
      // Then from each topic (index 1...N) to the state (index N+1)
      const links = [];
      topics.forEach((topic, i) => {
        links.push({ source: 0, target: i + 1, value: national[topic] });
        links.push({ source: i + 1, target: topics.length + 1, value: stateData[topic] });
      });
  
      const graph = {
        nodes: nodes.map(d => Object.assign({}, d)),
        links: links.map(d => Object.assign({}, d))
      };
  
      // Select container. Create a dedicated sub-container for the diagram if it doesn't exist.
      const container = d3.select("#ideology-chart-container");
      let diagram = container.select("#ideology-chart");
      if (diagram.empty()) {
        diagram = container.append("div").attr("id", "ideology-chart");
      }
      // Remove any existing SVG
      diagram.select("svg").remove();
  
      const width = 600;
      const height = 400;
  
      const svg = diagram.append("svg")
                         .attr("width", width)
                         .attr("height", height);
  
      // Set up the sankey generator
      const sankeyGenerator = d3.sankey()
        .nodeWidth(20)
        .nodePadding(10)
        .extent([[1, 1], [width - 1, height - 6]]);
  
      const sankeyData = sankeyGenerator(graph);
  
      // Draw links
      svg.append("g")
        .attr("fill", "none")
        .attr("stroke-opacity", 0.5)
        .selectAll("path")
        .data(sankeyData.links)
        .enter().append("path")
        .attr("d", d3.sankeyLinkHorizontal())
        .attr("stroke", "#888")
        .attr("stroke-width", d => Math.max(1, d.width))
        .on("mouseover", function(event, d) {
          d3.select(this).attr("stroke-opacity", 0.8);
        })
        .on("mouseout", function(event, d) {
          d3.select(this).attr("stroke-opacity", 0.5);
        })
        .append("title")
        .text(d => `${d.source.name} → ${d.target.name}\nValue: ${d.value}`);
  
      // Draw nodes
      const node = svg.append("g")
        .selectAll("g")
        .data(sankeyData.nodes)
        .enter().append("g");
  
      node.append("rect")
        .attr("x", d => d.x0)
        .attr("y", d => d.y0)
        .attr("height", d => d.y1 - d.y0)
        .attr("width", d => d.x1 - d.x0)
        .attr("fill", d => (d.name === "National" || d.name === selectedState) ? "#ccc" : "#1f77b4")
        .attr("stroke", "#000")
        .append("title")
        .text(d => `${d.name}\nValue: ${d.value}`);
  
      node.append("text")
        .attr("x", d => d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6)
        .attr("y", d => (d.y1 + d.y0) / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", d => d.x0 < width / 2 ? "start" : "end")
        .text(d => d.name);
    }
  
    // Initialize the state selector. It will be placed at the top of the "ideology-chart-container".
    function initStateSelector() {
      const container = d3.select("#ideology-chart-container");
      let stateSelect = container.select("#sankey-state-select");
      if (stateSelect.empty()) {
        stateSelect = container.insert("select", ":first-child")
                               .attr("id", "sankey-state-select");
        stateSelect.selectAll("option")
          .data(Object.keys(testData.states))
          .enter()
          .append("option")
          .attr("value", d => d)
          .text(d => d);
        stateSelect.on("change", function() {
          const selectedState = d3.select(this).property("value");
          drawSankey(selectedState);
        });
        // Set default state and draw diagram
        const defaultState = Object.keys(testData.states)[0];
        stateSelect.property("value", defaultState);
        drawSankey(defaultState);
      }
    }
  
    document.addEventListener("DOMContentLoaded", function() {
      initStateSelector();
    });
  })();
  