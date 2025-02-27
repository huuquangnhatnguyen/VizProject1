class Barchart {
  /**
   * Class constructor with basic chart configuration
   * @param {Object}
   * @param {Array}
   * @param {Array}
   */
  constructor(_config, _mockData, _mockData2) {
    // Configuration object with defaults
    this.config = {
      parentElement: _config.parentElement,
      colorScale: _config.colorScale,
      containerWidth: _config.containerWidth || 1000,
      containerHeight: _config.containerHeight || 700,
      margin: _config.margin || { top: 40, right: 20, bottom: 70, left: 40 },
      title: _config.title || "Bar Chart",
      legendHeight: 20,
      legendSpacing: 10,
      tooltipPadding: 10,
    };
    this.mockData = _mockData;
    this.mockData2 = _mockData2;
    this.initVis();
  }

  /**
   * Initialize scales/axes and append static elements, such as axis titles
   */
  initVis() {
    let vis = this;
    const mock2 = vis.mockData2;
    console.log(mock2);

    // Calculate inner chart size. Margin specifies the space around the actual chart.
    vis.width =
      vis.config.containerWidth -
      vis.config.margin.left -
      vis.config.margin.right;
    vis.height =
      vis.config.containerHeight -
      vis.config.margin.top -
      vis.config.margin.bottom;

    // Initialize scales
    vis.colorScale = d3
      .scaleOrdinal()
      .range(["#B6995A", "#275031", "#E41134", "#00265B"]) // light green to dark green
      .domain(keys);

    // Important: we flip array elements in the y output range to position the rectangles correctly
    vis.yScale = d3.scaleLinear().range([vis.height, 0]);

    vis.xScale = d3.scaleBand().range([0, vis.width]).paddingInner(0.2);

    vis.xAxis = d3.axisBottom(vis.xScale).ticks(keys).tickSizeOuter(0);

    vis.yAxis = d3.axisLeft(vis.yScale).ticks(6).tickSizeOuter(0);

    // Define size of SVG drawing area
    vis.svg = d3
      .select(vis.config.parentElement)
      .attr("width", vis.config.containerWidth)
      .attr("height", vis.config.containerHeight);

    // Add title
    vis.svg
      .append("text")
      .attr("class", "chart-title")
      .attr("x", vis.config.containerWidth / 2)
      .attr("y", vis.config.margin.top / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text(vis.config.title);

    // SVG Group containing the actual chart; D3 margin convention
    vis.chart = vis.svg
      .append("g")
      .attr(
        "transform",
        `translate(${vis.config.margin.left},${vis.config.margin.top})`
      );

    // Append empty x-axis group and move it to the bottom of the chart
    vis.xAxisG = vis.chart
      .append("g")
      .attr("class", "axis x-axis")
      .attr("transform", `translate(0,${vis.height})`);

    // Append y-axis group
    vis.yAxisG = vis.chart.append("g").attr("class", "axis y-axis");

    // Append axis title
    vis.svg
      .append("text")
      .attr("class", "axis-title")
      .attr("x", 0)
      .attr("y", 0)
      .attr("dy", ".71em")
      .text("%");

    // Create legend group
    vis.legend = vis.svg
      .append("g")
      .attr("class", "legend")
      .attr(
        "transform",
        `translate(${vis.config.margin.left}, ${
          vis.height + vis.config.margin.top + 40
        })`
      );

    // Ensure tooltip container exists in the HTML
    // If it doesn't exist, create it
    if (d3.select("#tooltip").empty()) {
      d3.select("body")
        .append("div")
        .attr("id", "tooltip")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("background-color", "white")
        .style("border", "1px solid #ddd")
        .style("border-radius", "4px")
        .style("padding", "8px")
        .style("pointer-events", "none")
        .style("font-size", "12px")
        .style("box-shadow", "0 2px 5px rgba(0, 0, 0, 0.1)");
    }
  }

  /**
   * Prepare data and scales before we render it
   */
  updateVis(updateData) {
    let vis = this;

    vis.colorValue = (d) => d.key;
    vis.xValue = (d) => formatAttribute(d.key);
    vis.yValue = (d) => d.count;

    // Set the scale input domains
    vis.xScale.domain(vis.mockData.map(vis.xValue));
    vis.yScale.domain([0, d3.max(vis.mockData, vis.yValue)]);

    // Update legend
    vis.updateLegend();

    vis.renderVis();
  }

  /**
   * Update the legend
   */
  updateLegend() {
    let vis = this;

    // Clear existing legend
    vis.legend.selectAll("*").remove();

    // Get unique categories from the color scale domain
    const categories = vis.colorScale.domain();

    // Calculate the legend item width based on available width
    const legendItemWidth = Math.min(150, vis.width / categories.length);

    // Create legend items
    const legendItems = vis.legend
      .selectAll(".legend-item")
      .data(categories)
      .enter()
      .append("g")
      .attr("class", "legend-item")
      .attr(
        "transform",
        (d, i) =>
          `translate(${i * (legendItemWidth + vis.config.legendSpacing)}, 0)`
      );

    // Add colored rectangles
    legendItems
      .append("rect")
      .attr("width", 20)
      .attr("height", vis.config.legendHeight)
      .attr("fill", (d) => vis.colorScale(d));

    // Add text labels
    legendItems
      .append("text")
      .attr("x", 25)
      .attr("y", vis.config.legendHeight / 2)
      .attr("dy", "0.35em")
      .style("font-size", "12px")
      .text((d) => formatAttribute(d));
  }

  /**
   * Bind data to visual elements
   */
  renderVis() {
    let vis = this;
    const mockData = formatData(mock2);
    console.log(mockData);
    var x = d3.scaleBand().domain(keys).range([0, vis.width]).padding([0.2]);

    // Add rectangles
    const bars = vis.chart
      .selectAll(".bar")
      .data(vis.mockData, vis.xValue)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", (d) => vis.xScale(vis.xValue(d)))
      .attr("width", vis.xScale.bandwidth())
      .attr("height", (d) => vis.height - vis.yScale(vis.yValue(d)))
      .attr("y", (d) => vis.yScale(vis.yValue(d)))
      .attr("fill", (d) => vis.colorScale(vis.colorValue(d)))
      // Add tooltip interactions
      .on("mousemove", function (d) {
        // Highlight the bar when hovered
        console.log(d);
        d3.select(this)
          .transition()
          .duration(100)
          .style("opacity", 0.8)
          .style("stroke", "white")
          .style("stroke-width", 2);

        // Show tooltip
        d3
          .select("#tooltip2")
          .style("display", "block")
          .style("left", event.pageX + vis.config.tooltipPadding + "px")
          .style("top", event.pageY + vis.config.tooltipPadding + "px").html(`
            <div class="tooltip-title" style={color: ${vis.colorValue(
              d
            )}}>${formatAttribute(d.key)}: ${Math.round(d.count)}%</div>
          `);
      })

      .on("mouseleave", function () {
        // Remove highlighting
        d3.select(this)
          .transition()
          .duration(100)
          .style("opacity", 1)
          .style("stroke", "none");

        // Hide tooltip
        d3.select("#tooltip2").style("display", "none");
      });

    // Update axes
    vis.xAxisG.call(vis.xAxis);
    vis.yAxisG.call(vis.yAxis);

    // Add x-axis label if needed
    vis.chart.selectAll(".x-axis-label").remove();
    vis.chart
      .append("text")
      .attr("class", "x-axis-label")
      .attr("x", vis.width / 2)
      .attr("y", vis.height + 35)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .text("Category");

    // Add y-axis label if needed
    vis.chart.selectAll(".y-axis-label").remove();
    vis.chart
      .append("text")
      .attr("class", "y-axis-label")
      .attr("transform", "rotate(-90)")
      .attr("x", -vis.height / 2)
      .attr("y", -30)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .text("Value (%)");
  }
}
