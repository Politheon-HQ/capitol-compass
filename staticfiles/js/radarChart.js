/////////////////////////////////////////////////////////
// The Radar Chart Function
// Written by Nadieh Bremer - VisualCinnamon.com
// Inspired by the code of alangrafu
///////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////
// The Radar Chart Function with Enhanced Features
// Updated to handle multiple datasets with distinct colors
///////////////////////////////////////////////////////////

function RadarChart(id, data, options = {}) {
    const cfg = {
        w: 800,                // Width of the chart
        h: 800,                // Height of the chart
        margin: {top: 100, right: 100, bottom: 100, left: 100}, // Adjusted margins
        levels: 5,             // Number of concentric circles
        maxValue: 0,           // Will be dynamically set based on data
        labelFactor: 1.2,      // Adjusted labelFactor to prevent labels from being cut off
        wrapWidth: 60,         // The number of pixels after which a label needs to be given a new line
        opacityArea: 0.35,     // Opacity of the area of the blob
        dotRadius: 4,          // Radius of the circles representing data points
        opacityCircles: 0.1,   // Opacity of the concentric circles
        strokeWidth: 2,        // Stroke width of the blob outline
        roundStrokes: false,   // If true, the blob will have rounded strokes
        color: d3.scaleOrdinal(d3.schemeCategory10), // Color scale
        transitionDuration: 750       // Duration of transitions in ms
    };
    
    // Merge user options with default config
    Object.assign(cfg, options);
    
    // Calculate maxValue based on the current data
    const maxDataValue = d3.max(data, d => d3.max(d.map(o => o.value)));
    const buffer = 0.1; // 10% buffer
    let maxValue = maxDataValue * (1 + buffer);
    
    const allAxis = data[0].map(i => i.axis), // Names of each axis
        total = allAxis.length,                // Number of different axes
        radius = Math.min(cfg.w / 2, cfg.h / 2)*.8, // Radius of the outermost circle
        angleSlice = Math.PI * 2 / total;     // Width in radians of each "slice"
    
    // Scale for the radius
    const rScale = d3.scaleLinear()
        .range([0, radius])
        .domain([0, maxValue]);
        
    ///////////////////////////////////////////////////////////
    //////////// Create the container SVG and g ///////////////
    ///////////////////////////////////////////////////////////

    // Remove any existing SVG
    d3.select(id).select("svg").remove();

    // Create the container SVG
    const svg = d3.select(id).append("svg")
        .attr("width",  cfg.w + cfg.margin.left + cfg.margin.right)
        .attr("height", cfg.h + cfg.margin.top + cfg.margin.bottom)
        .attr("class", "radar"+id);

    // Append a group element with a specific class for easy selection
    const g = svg.append("g")
        .attr("class", "radarChartGroup")
        .attr("transform", `translate(${(cfg.w / 2) + cfg.margin.left}, ${(cfg.h / 2) + cfg.margin.top})`);

    // Add glow filter (optional)
    const defs = g.append('defs');
    const filter = defs.append('filter').attr('id','glow');
    filter.append('feGaussianBlur')
        .attr('stdDeviation','2.5')
        .attr('result','coloredBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in','coloredBlur');
    feMerge.append('feMergeNode').attr('in','SourceGraphic');

    ///////////////////////////////////////////////////////////
    /////////////// Draw the Circular grid ////////////////////
    ///////////////////////////////////////////////////////////
    
    const axisGrid = g.append("g").attr("class", "axisWrapper");
    
    // Draw the background circles
    axisGrid.selectAll(".levels")
       .data(d3.range(1, (cfg.levels + 1)).reverse())
       .enter()
        .append("circle")
        .attr("class", "gridCircle")
        .attr("r", d => radius / cfg.levels * d)
        .style("fill", "#CDCDCD")
        .style("stroke", "#CDCDCD")
        .style("fill-opacity", cfg.opacityCircles)
        .style("filter" , "url(#glow)");
    
    // Text indicating at what % each level is
    axisGrid.selectAll(".axisLabel")
       .data(d3.range(1, (cfg.levels + 1)).reverse())
       .enter().append("text")
       .attr("class", "axisLabel")
       .attr("x", -10) // Offset to the left
       .attr("y", d => -d * radius / cfg.levels)
       .attr("dy", "0.4em")
       .style("font-size", "12px") // Increased font size
       .style("font-weight", "bold") // Bold font
       .attr("fill", "#737373")
       .attr("text-anchor", "end") // Align text to the end (right)
       .text(d => formatPercent(maxValue * d / cfg.levels));
    
    ///////////////////////////////////////////////////////////
    //////////////////// Draw the axes ///////////////////////
    ///////////////////////////////////////////////////////////
    
    // Create the straight lines radiating outward from the center
    const axis = axisGrid.selectAll(".axis")
        .data(allAxis)
        .enter()
        .append("g")
        .attr("class", "axis");
    
    // Append the lines
    axis.append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", (d, i) => rScale(maxValue * 1.1) * Math.cos(angleSlice * i - Math.PI / 2))
        .attr("y2", (d, i) => rScale(maxValue * 1.1) * Math.sin(angleSlice * i - Math.PI / 2))
        .attr("class", "line")
        .style("stroke", "white")
        .style("stroke-width", "2px");
    
    // Append the labels at each axis
    axis.append("text")
        .attr("class", "legend")
        .style("font-size", "11px")
        .style("font-weight", "bold") // Make policy text bold
        .style("fill", (d, i) => cfg.color(i)) // Set color based on axis index
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em")
        .attr("x", (d, i) => rScale(maxValue * cfg.labelFactor) * Math.cos(angleSlice * i - Math.PI / 2))
        .attr("y", (d, i) => rScale(maxValue * cfg.labelFactor) * Math.sin(angleSlice * i - Math.PI / 2))
        .text(d => d)
        .call(wrap, cfg.wrapWidth);
    
    ///////////////////////////////////////////////////////////
    ///////////////// Draw the radar chart blobs ////////////////
    ///////////////////////////////////////////////////////////
    
    // The radar line function
    const radarLine = d3.lineRadial()
        .curve(cfg.roundStrokes ? d3.curveCardinalClosed : d3.curveLinearClosed)
        .radius(d => rScale(d.value))
        .angle((d, i) => i * angleSlice);

    // Assign an index to each dataset for color mapping
    data.forEach((dataset, i) => dataset.index = i);
    
    // Create a wrapper for the blobs	
    const blobWrapper = g.selectAll(".radarWrapper")
        .data(data)
        .enter().append("g")
        .attr("class", "radarWrapper");
    
    // Append the backgrounds	
    blobWrapper.append("path")
        .attr("class", "radarArea")
        .attr("d", d => radarLine(d))
        .style("fill", (d) => cfg.color(d.index)) // Fill color based on dataset index
        .style("fill-opacity", cfg.opacityArea)
        .on('mouseover', function (event, d) {
            // Dim all blobs
            d3.selectAll(".radarArea")
                .transition().duration(200)
                .style("fill-opacity", 0.1); 
            // Bring back the hovered over blob
            d3.select(this)
                .transition().duration(200)
                .style("fill-opacity", 0.7);	
        })
        .on('mouseout', function(){
            // Bring back all blobs
            d3.selectAll(".radarArea")
                .transition().duration(200)
                .style("fill-opacity", cfg.opacityArea);
        });
    
    // Create the outlines	
    blobWrapper.append("path")
        .attr("class", "radarStroke")
        .attr("d", d => radarLine(d))
        .style("stroke-width", `${cfg.strokeWidth}px`)
        .style("stroke", (d) => cfg.color(d.index)) // Stroke color based on dataset index
        .style("fill", "none")
        .style("filter" , "url(#glow)");		
    
    // Append the circles
    blobWrapper.selectAll(".radarCircle")
        .data(d => d)
        .enter().append("circle")
        .attr("class", "radarCircle")
        .attr("r", cfg.dotRadius)
        .attr("cx", (d, i) => rScale(d.value) * Math.cos(angleSlice * i - Math.PI / 2))
        .attr("cy", (d, i) => rScale(d.value) * Math.sin(angleSlice * i - Math.PI / 2))
        .style("fill", (d, i, nodes) => {
            // Determine the dataset index based on parent group
            const datasetIndex = d3.select(nodes[i].parentNode).datum().index;
            return cfg.color(datasetIndex);
        }) // Set dot color based on dataset index
        .style("fill-opacity", 0.8);
    
    ///////////////////////////////////////////////////////////
    ////////// Append invisible circles for tooltip /////////////
    ///////////////////////////////////////////////////////////
    
    // Wrapper for the invisible circles on top
    const blobCircleWrapper = g.selectAll(".radarCircleWrapper")
        .data(data)
        .enter().append("g")
        .attr("class", "radarCircleWrapper");
    
    // Append a set of invisible circles on top for the mouseover pop-up
    blobCircleWrapper.selectAll(".radarInvisibleCircle")
        .data(d => d)
        .enter().append("circle")
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
    
    // Set up the small tooltip for when you hover over a circle
    const tooltip = g.append("text")
        .attr("class", "tooltip")
        .style("opacity", 0);
    
    ///////////////////////////////////////////////////////////
    /////////////////// Helper Functions //////////////////////
    ///////////////////////////////////////////////////////////
    
    // Wraps SVG text	
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
        let tspan = textElement.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", `${dy}em`);
            
        while (word = words.pop()) {
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
    } // wrap	

    // Format percentages with precision
    function formatPercent(value) {
        return d3.format('.1%')(value);
    }
    
    ///////////////////////////////////////////////////////////
    /////////////// Update Function for Data Change ////////////
    ///////////////////////////////////////////////////////////
    
    RadarChart.update = function(newData) {
        // Recalculate maxValue based on the new data
        const newMaxDataValue = d3.max(newData, d => d3.max(d.map(o => o.value)));
        const buffer = 0.1; // 10% buffer
        const newMaxValue = newMaxDataValue * (1 + buffer);
        maxValue = newMaxValue; // Update the maxValue variable

        // Update the scale domain
        rScale.domain([0, newMaxValue]);

        // Update the axis labels (percentage text)
        axisGrid.selectAll(".axisLabel")
            .text(d => formatPercent(maxValue * d / cfg.levels));

        // Update the grid circles
        axisGrid.selectAll(".gridCircle")
            .attr("r", d => radius / cfg.levels * d);

        // Update the axis lines
        axis.select("line")
            .attr("x2", (d, i) => rScale(maxValue * 1.1) * Math.cos(angleSlice * i - Math.PI / 2))
            .attr("y2", (d, i) => rScale(maxValue * 1.1) * Math.sin(angleSlice * i - Math.PI / 2));

        // Update the axis labels' positions
        axis.select(".legend")
            .attr("x", (d, i) => rScale(maxValue * cfg.labelFactor) * Math.cos(angleSlice * i - Math.PI / 2))
            .attr("y", (d, i) => rScale(maxValue * cfg.labelFactor) * Math.sin(angleSlice * i - Math.PI / 2));
        
        // Update the radar line function with the new scale
        radarLine.radius(d => rScale(d.value));

        // Update the radar areas
        blobWrapper.data(newData)
            .select(".radarArea")
            .transition()
            .duration(cfg.transitionDuration)
            .attr("d", d => radarLine(d))
            .style("fill", (d) => cfg.color(d.index)); // Update fill color based on dataset index

        // Update the radar strokes
        blobWrapper.select(".radarStroke")
            .transition()
            .duration(cfg.transitionDuration)
            .attr("d", d => radarLine(d))
            .style("stroke", (d) => cfg.color(d.index)); // Update stroke color based on dataset index

        // Update the radar circles
        blobWrapper.selectAll(".radarCircle")
            .data(d => d)
            .transition()
            .duration(cfg.transitionDuration)
            .attr("cx", (d, i) => rScale(d.value) * Math.cos(angleSlice * i - Math.PI / 2))
            .attr("cy", (d, i) => rScale(d.value) * Math.sin(angleSlice * i - Math.PI / 2))
            .style("fill", (d, i, nodes) => {
                // Determine the dataset index based on parent group
                const datasetIndex = d3.select(nodes[i].parentNode).datum().index;
                return cfg.color(datasetIndex);
            }); // Update dot color based on dataset index

        // Update the invisible circles for tooltips
        blobCircleWrapper.data(newData)
            .selectAll(".radarInvisibleCircle")
            .data(d => d)
            .transition()
            .duration(cfg.transitionDuration)
            .attr("cx", (d, i) => rScale(d.value) * Math.cos(angleSlice * i - Math.PI / 2))
            .attr("cy", (d, i) => rScale(d.value) * Math.sin(angleSlice * i - Math.PI / 2));
    };
} // RadarChart
