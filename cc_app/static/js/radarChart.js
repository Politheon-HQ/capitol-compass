/////////////////////////////////////////////////////////
// The Radar Chart Function (Enhanced with .update())
// by Daniel Forcade (Gallop), adapted from Nadieh Bremer
// ensuring consistent two-color usage (blue/orange) 
// and proper transitions without leftover fills
/////////////////////////////////////////////////////////


function RadarChart(id, data, options = {}) {
    /////////////// CONFIGURATION //////////////////////////
    // Default configuration settings for the radar chart.
    const cfg = {
        w: 800,              // Chart width
        h: 800,              // Chart height
        margin: { top: 100, right: 100, bottom: 100, left: 100 },
        levels: 5,           // Number of concentric grid levels
        maxValue: 0,         // Computed maximum value (from data)
        labelFactor: 1.2,    // Factor for positioning axis labels
        wrapWidth: 60,       // Maximum width before wrapping axis labels
        opacityArea: 0.35,   // Default fill opacity for the radar areas
        dotRadius: 4,        // Radius of the circles marking data points
        opacityCircles: 0.1, // Opacity for the background grid circles
        strokeWidth: 2,      // Width of the polygon outlines
        roundStrokes: false, // If true, use rounded strokes for the polygons
        // Fixed two-color scale: dataset index 0 = blue, index 1 = orange
        color: d3.scaleOrdinal().domain([0, 1]).range(["#1f77b4", "#ff7f0e"]),
        transitionDuration: 750 // Duration for transitions (ms)
    };

    // Merge any user-supplied options with defaults
    Object.assign(cfg, options);

    /////////////// CALCULATE SCALES /////////////////////////
    // Compute the maximum data value with a 10% buffer.
    const maxDataValue = d3.max(data, d => d3.max(d.map(o => o.value)));
    const buffer = 0.1; // 10% buffer
    let maxValue = maxDataValue * (1 + buffer);

    // Ensure each dataset is assigned a fixed index (0 or 1) for color mapping.
    data.forEach((dataset, i) => dataset.index = i);

    // Extract the axis names from the first dataset.
    const allAxis = data[0].map(i => i.axis),
          total = allAxis.length,
          // Determine the radius for the chart (80% of half the chart's width or height)
          radius = Math.min(cfg.w / 2, cfg.h / 2) * 0.8,
          // Calculate the angle for each axis slice.
          angleSlice = (Math.PI * 2) / total;

    // Create a scale to map data values to radial distances.
    const rScale = d3.scaleLinear()
        .range([0, radius])
        .domain([0, maxValue]);

    /////////////// CUSTOM LABEL COLOR SCALE ////////////////////////
    // This scale assigns a distinct color to each policy area label.
    // Using d3.schemeCategory10 as a trial
    const labelColorScale = d3.scaleOrdinal()
          .domain(allAxis)
          .range(d3.schemeCategory10);

    /////////////// INITIAL SVG SETUP ////////////////////////
    // Remove any existing SVG in the target element.
    d3.select(id).select("svg").remove();

    // Create the main SVG element.
    const svg = d3.select(id).append("svg")
        .attr("width", cfg.w + cfg.margin.left + cfg.margin.right)
        .attr("height", cfg.h + cfg.margin.top + cfg.margin.bottom + 10)
        .attr("class", "radar" + id);

    // Append a group element to center the chart.
    const g = svg.append("g")
        .attr("class", "radarChartGroup")
        .attr("transform", `translate(${(cfg.w / 2) + cfg.margin.left + 50}, ${(cfg.h / 2) + cfg.margin.top})`);

    /////////////// GLOW FILTER (OPTIONAL) /////////////////
    // Define a glow filter to add a soft blur effect around elements.
    const defs = g.append('defs');
    const filter = defs.append('filter').attr('id', 'glow');
    filter.append('feGaussianBlur')
        .attr('stdDeviation', '2.5')
        .attr('result', 'coloredBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    /////////////// DRAW GRID CIRCLES ////////////////////////
    // Append a group to hold the grid (background circles).
    const axisGrid = g.append("g").attr("class", "axisWrapper");

    // Draw concentric circles.
    axisGrid.selectAll(".levels")
       .data(d3.range(1, (cfg.levels + 1)).reverse())
       .enter()
       .append("circle")
       .attr("class", "gridCircle")
       .attr("r", d => (radius / cfg.levels) * d)
       .style("fill", "#CDCDCD")
       .style("stroke", "#CDCDCD")
       .style("fill-opacity", cfg.opacityCircles)
       .style("filter", "url(#glow)");

    // Add text labels to the grid circles (e.g., 20%, 40%, etc.).
    axisGrid.selectAll(".axisLabel")
       .data(d3.range(1, (cfg.levels + 1)).reverse())
       .enter()
       .append("text")
       .attr("class", "axisLabel")
       .attr("x", -10)
       .attr("y", d => -d * (radius / cfg.levels))
       .attr("dy", "0.4em")
       .style("font-size", "12px")
       .style("font-weight", "bold")
       .attr("fill", "#737373")
       .attr("text-anchor", "end")
       .text(d => formatPercent(maxValue * d / cfg.levels));

    /////////////// DRAW AXES ////////////////////////////////
    // Create groups for each axis (line + label).
    const axis = axisGrid.selectAll(".axis")
        .data(allAxis)
        .enter()
        .append("g")
        .attr("class", "axis");

    // Draw the axis lines (spokes).
    axis.append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", (d, i) => rScale(maxValue * 1.1) * Math.cos(angleSlice * i - Math.PI / 2))
        .attr("y2", (d, i) => rScale(maxValue * 1.1) * Math.sin(angleSlice * i - Math.PI / 2))
        .attr("class", "line")
        .style("stroke", "white")
        .style("stroke-width", "2px");

    // Append the axis labels with custom text color.
    axis.append("text")
        .attr("class", "legend")
        .style("font-size", "11px")
        .style("font-weight", "bold")
        .style("fill", d => labelColorScale(d))  // Custom label color based on policy area.
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em")
        .attr("x", (d, i) => rScale(maxValue * cfg.labelFactor) * Math.cos(angleSlice * i - Math.PI / 2))
        .attr("y", (d, i) => rScale(maxValue * cfg.labelFactor) * Math.sin(angleSlice * i - Math.PI / 2))
        .text(d => d)
        .call(wrap, cfg.wrapWidth);

    /////////////// DEFINE RADAR LINE GENERATOR /////////////
    // Create a radial line generator for drawing the polygons.
    const radarLine = d3.lineRadial()
        .curve(cfg.roundStrokes ? d3.curveCardinalClosed : d3.curveLinearClosed)
        .radius(d => rScale(d.value))
        .angle((d, i) => i * angleSlice);

    /////////////// CREATE RADAR BLOBS ///////////////////////
    // Create a group for each dataset.
    let blobWrapper = g.selectAll(".radarWrapper")
        .data(data)
        .enter()
        .append("g")
        .attr("class", "radarWrapper");

    /////////////// MOUSE EVENT HANDLERS /////////////////////
    // Define mouse event handlers so we can re‑bind them after updates.
    function mouseoverHandler(event, d) {
        d3.selectAll(".radarArea")
            .transition().duration(200)
            .style("fill-opacity", 0.1);
        d3.select(this)
            .transition().duration(200)
            .style("fill-opacity", 0.7);
    }

    function mouseoutHandler(event, d) {
        d3.selectAll(".radarArea")
            .transition().duration(200)
            .style("fill-opacity", cfg.opacityArea);
    }

    /////////////// DRAW POLYGONS (FILLED AREA) /////////////
    blobWrapper.append("path")
        .attr("class", "radarArea")
        .attr("d", d => radarLine(d))
        .style("fill", d => cfg.color(d.index))
        .style("fill-opacity", cfg.opacityArea)
        .on("mouseover", mouseoverHandler)
        .on("mouseout", mouseoutHandler);

    /////////////// DRAW POLYGON OUTLINES ///////////////////
    blobWrapper.append("path")
        .attr("class", "radarStroke")
        .attr("d", d => radarLine(d))
        .style("stroke-width", `${cfg.strokeWidth}px`)
        .style("stroke", d => cfg.color(d.index))
        .style("fill", "none")
        .style("filter", "url(#glow)");

    /////////////// DRAW DATA POINT CIRCLES /////////////////
    blobWrapper.selectAll(".radarCircle")
        .data(d => d)
        .enter()
        .append("circle")
        .attr("class", "radarCircle")
        .attr("r", cfg.dotRadius)
        .attr("cx", (d, i) => rScale(d.value) * Math.cos(angleSlice * i - Math.PI / 2))
        .attr("cy", (d, i) => rScale(d.value) * Math.sin(angleSlice * i - Math.PI / 2))
        .style("fill", (d, i, nodes) => {
            // Use parent's dataset index for color
            const datasetIndex = d3.select(nodes[i].parentNode).datum().index;
            return cfg.color(datasetIndex);
        })
        .style("fill-opacity", 0.8);

    /////////////// DRAW INVISIBLE TOOLTIP CIRCLES //////////
    // These circles capture mouse events without affecting the visible chart.
    let blobCircleWrapper = g.selectAll(".radarCircleWrapper")
        .data(data)
        .enter()
        .append("g")
        .attr("class", "radarCircleWrapper");

    blobCircleWrapper.selectAll(".radarInvisibleCircle")
        .data(d => d)
        .enter()
        .append("circle")
        .attr("class", "radarInvisibleCircle")
        .attr("r", cfg.dotRadius * 1.5)
        .attr("cx", (d, i) => rScale(d.value) * Math.cos(angleSlice * i - Math.PI / 2))
        .attr("cy", (d, i) => rScale(d.value) * Math.sin(angleSlice * i - Math.PI / 2))
        .style("fill", "none")
        .style("pointer-events", "all")
        .on("mouseover", function(event, d) {
            const [x, y] = d3.pointer(event);
            tooltip
                .attr('x', x)
                .attr('y', y)
                .text(formatPercent(d.value))
                .transition().duration(200)
                .style('opacity', 1);
        })
        .on("mouseout", function(){
            tooltip.transition().duration(200)
                .style("opacity", 0);
        });

    // Append a text element for displaying tooltips.
    const tooltip = g.append("text")
        .attr("class", "tooltip")
        .style("opacity", 0);

    /////////////// HELPER FUNCTIONS /////////////////////////
    // Wraps SVG text so that labels do not overflow.
    function wrap(text, width) {
        text.each(function() {
            const textElement = d3.select(this);
            const words = textElement.text().split(/\s+/).reverse();
            let word;
            let line = [];
            let lineNumber = 0;
            const lineHeight = 1.4; // ems
            const y = textElement.attr("y");
            const x = textElement.attr("x");
            const dy = parseFloat(textElement.attr("dy"));
            let tspan = textElement.text(null).append("tspan")
                .attr("x", x)
                .attr("y", y)
                .attr("dy", `${dy}em`);

            while ((word = words.pop())) {
                line.push(word);
                tspan.text(line.join(" "));
                if (tspan.node().getComputedTextLength() > width) {
                    line.pop();
                    tspan.text(line.join(" "));
                    line = [word];
                    tspan = textElement.append("tspan")
                        .attr("x", x)
                        .attr("y", y)
                        .attr("dy", `${++lineNumber * lineHeight + dy}em`)
                        .text(word);
                }
            }
        });
    }

    // Formats a value as a percentage with one decimal place.
    function formatPercent(value) {
        return d3.format('.1%')(value);
    }

    /////////////// THE .update() METHOD /////////////////////
    // This method updates the chart with new data.
    RadarChart.update = function(newData) {
        // --- STEP 1: Remove existing hover handlers ---
        g.selectAll(".radarArea")
            .on("mouseover", null)
            .on("mouseout", null);

        // --- STEP 2: Dispatch synthetic mouseout to force reset of hover state ---
        g.selectAll(".radarArea").each(function() {
            this.dispatchEvent(new MouseEvent('mouseout', {
                bubbles: true,
                cancelable: true
            }));
        });

        // --- STEP 3: Disable pointer events before transition ---
        g.selectAll(".radarArea")
            .style("pointer-events", "none");

        // Force fixed color domain and reassign indices.
        cfg.color.domain([0, 1]);
        newData.forEach((dataset, i) => { dataset.index = i; });

        // Recalculate the maximum value with a buffer and update the scale.
        const newMaxDataValue = d3.max(newData, d => d3.max(d.map(o => o.value)));
        const newMaxValue = newMaxDataValue * (1 + 0.1); // 10% buffer
        maxValue = newMaxValue;
        rScale.domain([0, maxValue]);

        // Update grid labels and circles.
        axisGrid.selectAll(".axisLabel")
            .text(d => formatPercent(maxValue * d / cfg.levels));
        axisGrid.selectAll(".gridCircle")
            .attr("r", d => (radius / cfg.levels) * d);
        axis.select("line")
            .attr("x2", (d, i) => rScale(maxValue * 1.1) * Math.cos(angleSlice * i - Math.PI / 2))
            .attr("y2", (d, i) => rScale(maxValue * 1.1) * Math.sin(angleSlice * i - Math.PI / 2));
        axis.select(".legend")
            .attr("x", (d, i) => rScale(maxValue * cfg.labelFactor) * Math.cos(angleSlice * i - Math.PI / 2))
            .attr("y", (d, i) => rScale(maxValue * cfg.labelFactor) * Math.sin(angleSlice * i - Math.PI / 2));

        // Update the radar line generator with the new scale.
        radarLine.radius(d => rScale(d.value));

        // Rebind newData to the radar wrapper groups.
        const blobWrappers = g.selectAll(".radarWrapper").data(newData);

        // --- STEP 4: Update the filled polygons (radar areas) ---
        blobWrappers.select(".radarArea")
            .transition()
            .duration(cfg.transitionDuration)
            .attr("d", d => radarLine(d))
            .style("fill", d => cfg.color(d.index))
            .style("fill-opacity", cfg.opacityArea)
            .on("end", function() {
                // Re-enable pointer events & rebind handlers after transition
                d3.select(this)
                  .style("pointer-events", "all")
                  .on("mouseover", mouseoverHandler)
                  .on("mouseout", mouseoutHandler);
            });

        // Update the polygon outlines.
        blobWrappers.select(".radarStroke")
            .transition()
            .duration(cfg.transitionDuration)
            .attr("d", d => radarLine(d))
            .style("stroke", d => cfg.color(d.index));

        // Update the data point circles.
        blobWrappers.selectAll(".radarCircle")
            .data(d => d)
            .transition()
            .duration(cfg.transitionDuration)
            .attr("cx", (d, i) => rScale(d.value) * Math.cos(angleSlice * i - Math.PI / 2))
            .attr("cy", (d, i) => rScale(d.value) * Math.sin(angleSlice * i - Math.PI / 2))
            .style("fill", (d, i, nodes) => {
                const datasetIndex = d3.select(nodes[i].parentNode).datum().index;
                return cfg.color(datasetIndex);
            });

        // Update invisible tooltip circles.
        blobWrappers.selectAll(".radarInvisibleCircle")
            .data(d => d)
            .transition()
            .duration(cfg.transitionDuration)
            .attr("cx", (d, i) => rScale(d.value) * Math.cos(angleSlice * i - Math.PI / 2))
            .attr("cy", (d, i) => rScale(d.value) * Math.sin(angleSlice * i - Math.PI / 2));

        // --- Optional final reset of fill opacity after transitions ---
        setTimeout(() => {
            d3.selectAll(".radarArea").style("fill-opacity", cfg.opacityArea);
        }, cfg.transitionDuration + 50);
    };
} // End RadarChart
