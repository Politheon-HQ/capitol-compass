/////////////////////////////////////////////////////////
// The Radar Chart Function (Enhanced with .update())
// by Daniel Forcade (Gallop), adapted from Nadieh Bremer
// ensuring consistent two-color usage (blue/orange) 
// and proper transitions without leftover fills
/////////////////////////////////////////////////////////
function RadarChart(id, data, options = {}) {
    const cfg = {
        w: 800,
        h: 800,
        margin: { top: 100, right: 100, bottom: 100, left: 100 },
        levels: 5, 
        maxValue: 0,        
        labelFactor: 1.2,
        wrapWidth: 60,
        opacityArea: 0.35,
        dotRadius: 4,
        opacityCircles: 0.1,
        strokeWidth: 2,
        roundStrokes: false,
        // Explicit color scale for exactly 2 datasets: 
        //  index=0 => #1f77b4 (blue), index=1 => #ff7f0e (orange)
        color: d3.scaleOrdinal().domain([0,1]).range(["#1f77b4","#ff7f0e"]),
        transitionDuration: 750
    };
    
    Object.assign(cfg, options);
    
    // Compute an overall maxValue from the data
    const maxDataValue = d3.max(data, d => d3.max(d.map(o => o.value)));
    const buffer = 0.1; // 10% buffer
    let maxValue = maxDataValue * (1 + buffer);

    // Assign a stable index to each dataset: 0 => Member, 1 => State
    data.forEach((dataset, i) => dataset.index = i); 
    
    const allAxis = data[0].map(i => i.axis), 
          total = allAxis.length,
          radius = Math.min(cfg.w / 2, cfg.h / 2) * 0.8,
          angleSlice = (Math.PI * 2) / total;
    
    // Radius scale
    const rScale = d3.scaleLinear()
        .range([0, radius])
        .domain([0, maxValue]);

    // Remove any existing SVG
    d3.select(id).select("svg").remove();

    // Create main SVG
    const svg = d3.select(id).append("svg")
        .attr("width", cfg.w + cfg.margin.left + cfg.margin.right)
        .attr("height", cfg.h + cfg.margin.top + cfg.margin.bottom)
        .attr("class", "radar" + id);

    const g = svg.append("g")
        .attr("class", "radarChartGroup")
        .attr("transform", `translate(${(cfg.w / 2) + cfg.margin.left}, ${(cfg.h / 2) + cfg.margin.top})`);

    // Add glow filter if desired
    const defs = g.append('defs');
    const filter = defs.append('filter').attr('id','glow');
    filter.append('feGaussianBlur')
        .attr('stdDeviation','2.5')
        .attr('result','coloredBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in','coloredBlur');
    feMerge.append('feMergeNode').attr('in','SourceGraphic');

    ///////////////////////////////////////////////////////////
    ///////////////////// Draw Grid Circles ///////////////////
    ///////////////////////////////////////////////////////////
    
    const axisGrid = g.append("g").attr("class", "axisWrapper");

    // Concentric circles
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
    
    // Text for each level (0%, 20%, etc.)
    axisGrid.selectAll(".axisLabel")
       .data(d3.range(1, (cfg.levels + 1)).reverse())
       .enter().append("text")
       .attr("class", "axisLabel")
       .attr("x", -10)
       .attr("y", d => -d * (radius / cfg.levels))
       .attr("dy", "0.4em")
       .style("font-size", "12px")
       .style("font-weight", "bold")
       .attr("fill", "#737373")
       .attr("text-anchor", "end")
       .text(d => formatPercent(maxValue * d / cfg.levels));

    ///////////////////////////////////////////////////////////
    ////////////////////// Draw Axes //////////////////////////
    ///////////////////////////////////////////////////////////
    
    const axis = axisGrid.selectAll(".axis")
        .data(allAxis)
        .enter()
        .append("g")
        .attr("class", "axis");
    
    axis.append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", (d, i) => rScale(maxValue * 1.1) * Math.cos(angleSlice * i - Math.PI / 2))
        .attr("y2", (d, i) => rScale(maxValue * 1.1) * Math.sin(angleSlice * i - Math.PI / 2))
        .attr("class", "line")
        .style("stroke", "white")
        .style("stroke-width", "2px");

    axis.append("text")
        .attr("class", "legend")
        .style("font-size", "11px")
        .style("font-weight", "bold")
        // Use a neutral axis label color so it doesn't burn the 2-color scale
        .style("fill", "#444")
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em")
        .attr("x", (d, i) => rScale(maxValue * cfg.labelFactor) * Math.cos(angleSlice * i - Math.PI / 2))
        .attr("y", (d, i) => rScale(maxValue * cfg.labelFactor) * Math.sin(angleSlice * i - Math.PI / 2))
        .text(d => d)
        .call(wrap, cfg.wrapWidth);

    ///////////////////////////////////////////////////////////
    //////////////////// Draw the Blobs ///////////////////////
    ///////////////////////////////////////////////////////////
    
    // The line function for the polygons
    const radarLine = d3.lineRadial()
        .curve(cfg.roundStrokes ? d3.curveCardinalClosed : d3.curveLinearClosed)
        .radius(d => rScale(d.value))
        .angle((d, i) => i * angleSlice);

    // Make a group for each dataset
    let blobWrapper = g.selectAll(".radarWrapper")
        .data(data)
        .enter().append("g")
        .attr("class", "radarWrapper");
    
    // Filled polygons ("areas")
    blobWrapper.append("path")
        .attr("class", "radarArea")
        .attr("d", d => radarLine(d))
        .style("fill", d => cfg.color(d.index)) // index=0 => blue, 1 => orange
        .style("fill-opacity", cfg.opacityArea)
        .on('mouseover', function(event, d) {
            d3.selectAll(".radarArea")
                .transition().duration(200)
                .style("fill-opacity", 0.1); 
            d3.select(this)
                .transition().duration(200)
                .style("fill-opacity", 0.7);	
        })
        .on('mouseout', function(){
            d3.selectAll(".radarArea")
                .transition().duration(200)
                .style("fill-opacity", cfg.opacityArea);
        });
    
    // Polygon outlines ("strokes")
    blobWrapper.append("path")
        .attr("class", "radarStroke")
        .attr("d", d => radarLine(d))
        .style("stroke-width", `${cfg.strokeWidth}px`)
        .style("stroke", d => cfg.color(d.index))
        .style("fill", "none")
        .style("filter", "url(#glow)");		
    
    // Circles at each data point
    blobWrapper.selectAll(".radarCircle")
        .data(d => d)
        .enter().append("circle")
        .attr("class", "radarCircle")
        .attr("r", cfg.dotRadius)
        .attr("cx", (d, i) => rScale(d.value) * Math.cos(angleSlice * i - Math.PI / 2))
        .attr("cy", (d, i) => rScale(d.value) * Math.sin(angleSlice * i - Math.PI / 2))
        .style("fill", (d, i, nodes) => {
            const datasetIndex = d3.select(nodes[i].parentNode).datum().index;
            return cfg.color(datasetIndex);
        })
        .style("fill-opacity", 0.8);

    ///////////////////////////////////////////////////////////
    ////////// Invisible Circles for Tooltips /////////////////
    ///////////////////////////////////////////////////////////
    
    let blobCircleWrapper = g.selectAll(".radarCircleWrapper")
        .data(data)
        .enter().append("g")
        .attr("class", "radarCircleWrapper");
    
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
    
    // Tooltip
    const tooltip = g.append("text")
        .attr("class", "tooltip")
        .style("opacity", 0);

    ///////////////////////////////////////////////////////////
    /////////////// Helper Functions //////////////////////////
    ///////////////////////////////////////////////////////////
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
    
    function formatPercent(value) {
        return d3.format('.1%')(value);
    }

    ///////////////////////////////////////////////////////////
    /////////////// The .update() Method //////////////////////
    ///////////////////////////////////////////////////////////
    RadarChart.update = function(newData) {
        // Force 2-color domain again
        // (Prevents the scale from drifting if 'index' is 2 or 3 for any reason)
        cfg.color.domain([0,1]);

        // Reassign index=0 or 1 to each sub-array
        newData.forEach((dataset, i) => dataset.index = i);

        // Recalc maxValue with buffer
        const newMaxDataValue = d3.max(newData, d => d3.max(d.map(o => o.value)));
        const newMaxValue = newMaxDataValue * (1 + buffer);
        maxValue = newMaxValue;

        // Update radius domain
        rScale.domain([0, maxValue]);

        // Update the level labels (like 80%, 100%, etc.)
        axisGrid.selectAll(".axisLabel")
            .text(d => formatPercent(maxValue * d / cfg.levels));

        // Update the grid circles
        axisGrid.selectAll(".gridCircle")
            .attr("r", d => (radius / cfg.levels) * d);

        // Update the axis lines length
        axis.select("line")
            .attr("x2", (d, i) => rScale(maxValue * 1.1) * Math.cos(angleSlice * i - Math.PI / 2))
            .attr("y2", (d, i) => rScale(maxValue * 1.1) * Math.sin(angleSlice * i - Math.PI / 2));

        // Update axis label positions
        axis.select(".legend")
            .attr("x", (d, i) => rScale(maxValue * cfg.labelFactor) * Math.cos(angleSlice * i - Math.PI / 2))
            .attr("y", (d, i) => rScale(maxValue * cfg.labelFactor) * Math.sin(angleSlice * i - Math.PI / 2));

        // Update the radar line function
        radarLine.radius(d => rScale(d.value));

        //------------------------------------------------------
        // 1) Rebind newData to the .radarWrapper groups
        //------------------------------------------------------
        const blobWrappers = g.selectAll(".radarWrapper").data(newData);

        // For each group, update the .radarArea
        blobWrappers.select(".radarArea")
            .transition()
            .duration(cfg.transitionDuration)
            .attr("d", d => radarLine(d))
            .style("fill", d => cfg.color(d.index));

        // Update the .radarStroke
        blobWrappers.select(".radarStroke")
            .transition()
            .duration(cfg.transitionDuration)
            .attr("d", d => radarLine(d))
            .style("stroke", d => cfg.color(d.index));

        // Update circles
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

        // Update invisible circles (tooltips)
        blobWrappers.selectAll(".radarInvisibleCircle")
            .data(d => d)
            .transition()
            .duration(cfg.transitionDuration)
            .attr("cx", (d, i) => rScale(d.value) * Math.cos(angleSlice * i - Math.PI / 2))
            .attr("cy", (d, i) => rScale(d.value) * Math.sin(angleSlice * i - Math.PI / 2));
    };
} // end RadarChart