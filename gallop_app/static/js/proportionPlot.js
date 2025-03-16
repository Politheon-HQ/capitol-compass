// proportionPlot.js
// This file uses Observable Plot to render a proportion plot in the "proportion-plot-container".

(function() {
    // Dummy data for the proportion plot
    const data = [
      { type: "population", value: 30, age: "Young" },
      { type: "wealth", value: 70, age: "Young" },
      { type: "population", value: 50, age: "Middle" },
      { type: "wealth", value: 50, age: "Middle" },
      { type: "population", value: 80, age: "Old" },
      { type: "wealth", value: 20, age: "Old" }
    ];
    const columns = ["population", "wealth"];
  
    function renderProportionPlot() {
      const container = document.getElementById("proportion-plot-container");
      if (!container) {
        console.error("Container for proportion plot not found.");
        return;
      }
      // Clear any existing content
      container.innerHTML = "";
      // Create the plot using Observable Plot (Plot is available globally)
      const plot = Plot.plot({
        x: {
          domain: columns,
          axis: "top",
          label: null,
          tickFormat: d => `Share of ${d}`,
          tickSize: 0,
          padding: 0
        },
        y: {
          axis: null,
          reverse: true
        },
        color: {
          scheme: "prgn",
          reverse: true
        },
        marginLeft: 50,
        marginRight: 60,
        marks: [
          Plot.areaY(
            data,
            {
              x: "type",
              y: "value",
              z: "age",
              curve: "bump-x",
              fill: "age",
              stroke: "white"
            }
          ),
          Plot.text(
            data.filter(d => d.type === "population"),
            {
              x: "type",
              y: "value",
              z: "age",
              text: d => `${d.value}%`,
              textAnchor: "end",
              dx: -6
            }
          ),
          Plot.text(
            data.filter(d => d.type === "wealth"),
            {
              x: "type",
              y: "value",
              z: "age",
              text: d => `${d.value}%`,
              textAnchor: "start",
              dx: 6
            }
          ),
          Plot.text(
            data.filter(d => d.type === "population"),
            {
              x: "type",
              y: "value",
              z: "age",
              text: "age",
              textAnchor: "start",
              fill: "white",
              fontWeight: "bold",
              dx: 8
            }
          )
        ]
      });
      container.appendChild(plot);
    }
  
    document.addEventListener("DOMContentLoaded", function() {
      renderProportionPlot();
    });
  })();
  