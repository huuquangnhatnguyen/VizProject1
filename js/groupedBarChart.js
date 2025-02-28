// Modify the Barchart class to support grouped bar chart functionality

/**
 * Class constructor with basic chart configuration for grouped bar chart
 * @param {Object} _config
 * @param {Array} _nationalData - National average data for comparison
 * @param {Array} _countyData - Initial county data (optional)
 */
class GroupedBarchart {
  constructor(_config, _nationalData, _countyData) {
    // Configuration object with defaults
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: _config.containerWidth || 1000,
      containerHeight: _config.containerHeight || 800,
      margin: _config.margin || { top: 30, right: 10, bottom: 10, left: 40 },
      title: _config.title || "Health Conditions Comparison",
      legendHeight: 20,
      legendSpacing: 10,
      tooltipPadding: 10,
      groupPadding: 0.3,
      barPadding: 0.1,
      groupNames: ["National Average", "Selected County"],
    };
    this.nationalData = _nationalData;
    this.countyData =
      _countyData || _nationalData.map((d) => ({ ...d, count: 0 }));
    this.originalData = {
      national: _nationalData,
      county: this.countyData,
    };
    this.selectedCounty = null;
    this.initVis();
  }

  /**
   * Initialize scales/axes and append static elements
   */
  initVis() {
    let vis = this;

    // Calculate inner chart size
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
      .range(["#B6995A", "#275031", "#E41134", "#00265B"]) // Colors for health condition categories
      .domain([
        "percent_high_cholesterol",
        "percent_high_blood_pressure",
        "percent_coronary_heart_disease",
        "percent_stroke",
      ]);
    // Group scale for x-axis (categories)
    vis.xScale = d3
      .scaleBand()
      .range([0, vis.width])
      .padding(vis.config.groupPadding);

    // Bar scale for grouped bars within each category
    vis.barScale = d3.scaleBand().padding(vis.config.barPadding);

    // Y scale for bar heights
    vis.yScale = d3.scaleLinear().range([vis.height, 0]);

    // Create axes
    vis.xAxis = d3.axisBottom(vis.xScale).tickSizeOuter(0);
    vis.yAxis = d3.axisLeft(vis.yScale).ticks(6).tickSizeOuter(0);

    // Define SVG drawing area
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

    // SVG Group containing the actual chart
    vis.chart = vis.svg
      .append("g")
      .attr(
        "transform",
        `translate(${vis.config.margin.left},${vis.config.margin.top})`
      );

    // Append empty x-axis group
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
      .attr("dy", ".71em");
    //   .text("%");

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

    // Create tooltip if it doesn't exist
    if (d3.select("#tooltip2").empty()) {
      d3.select("body")
        .append("div")
        .attr("id", "tooltip2")
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
   * Prepare data and scales before rendering
   */
  updateVis() {
    let vis = this;

    // Prepare data for grouped bars
    vis.categories = vis.nationalData.map((d) => formatAttribute(d.key));
    vis.groupedData = vis.categories.map((category) => {
      const catKey = vis.nationalData.find(
        (d) => formatAttribute(d.key) === category
      ).key;
      const data = {
        category: category,
        key: catKey,
        values: [
          {
            group: "National Average",
            value:
              vis.nationalData.find((d) => formatAttribute(d.key) === category)
                .count || 0,
          },
          {
            group: "Selected County",
            value:
              vis.countyData.find((d) => formatAttribute(d.key) === category)
                ?.count || 0,
          },
        ],
      };
      return data;
    });

    // Update scales
    vis.xScale.domain(vis.categories);
    vis.barScale
      .domain(vis.config.groupNames)
      .range([0, vis.xScale.bandwidth()]);

    // Find max value for y scale
    const maxValue = d3.max(vis.groupedData, (d) =>
      d3.max(d.values, (v) => v.value)
    );
    vis.yScale.domain([0, maxValue * 1.1]); // Add 10% padding on top

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

    // Create legend for categories (health conditions)
    const categoryLegend = vis.legend
      .append("g")
      .attr("class", "category-legend");

    const categoryItems = categoryLegend
      .selectAll(".category-item")
      .data(vis.nationalData)
      .enter()
      .append("g")
      .attr("class", "category-item")
      .attr("transform", (d, i) => `translate(${i * 150}, 0)`);

    categoryItems
      .append("rect")
      .attr("width", 15)
      .attr("height", 15)
      .attr("fill", (d) => {
        console.log(vis.colorScale(d.key), d);
        return vis.colorScale(d.key);
      });

    categoryItems
      .append("text")
      .attr("x", 20)
      .attr("y", 7.5)
      .attr("dy", "0.35em")
      .style("font-size", "12px")
      .text((d) => formatAttribute(d.key));

    // Create legend for groups (National vs County)
    const groupLegend = vis.legend
      .append("g")
      .attr("class", "group-legend")
      .style("display", "none")
      .attr("transform", `translate(0, 30)`);

    const groupItems = groupLegend
      .selectAll(".group-item")
      .data(vis.config.groupNames)
      .enter()
      .append("g")
      .attr("class", "group-item")
      .attr("transform", (d, i) => `translate(${i * 150}, 0)`);

    groupItems
      .append("rect")
      .attr("width", 15)
      .attr("height", 15)
      .attr("fill", (d, i) => (i === 0 ? "#74a9cf" : "#ef6548"));

    groupItems
      .append("text")
      .attr("x", 20)
      .attr("y", 7.5)
      .attr("dy", "0.35em")
      .style("font-size", "12px")
      .text((d) => d);
  }

  /**
   * Render the visualization
   */
  renderVis() {
    let vis = this;

    // Clear existing bars
    vis.chart.selectAll(".category-group").remove();
    vis.colorScale2 = d3
      .scaleOrdinal()
      .range(["#B6995A", "#275031", "#E41134", "#00265B"]) // Colors for health condition categories
      .domain([33.1, 32.3, 6.2, 3.0]);
    // Create groups for each category
    const categoryGroups = vis.chart
      .selectAll(".category-group")
      .data(vis.groupedData)
      .enter()
      .append("g")
      .attr("class", "category-group")
      .attr("transform", (d) => `translate(${vis.xScale(d.category)}, 0)`);
    console.log();
    // Create bars for each group within categories
    if (vis.groupedData[0].values[1].value !== 0) {
      categoryGroups
        .selectAll(".bar")
        .data((d) => d.values)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", (d) => vis.barScale(d.group))
        .attr("y", (d) => vis.yScale(d.value))
        .attr("width", vis.barScale.bandwidth())
        .attr("height", (d) => vis.height - vis.yScale(d.value))
        .attr("fill", (d, i) => {
          console.log(d, i);
          return i === 0 ? "#74a9cf" : "#ef6548";
        }) // Different colors for national vs county
        .on("mousemove", function (d) {
          // Get parent data for category name
          const parentGroup = d3.select(this.parentNode).datum();

          // Highlight bar on hover
          d3.select(this)
            .transition()
            .duration(100)
            .style("opacity", 0.8)
            .style("stroke", "white")
            .style("stroke-width", 2);

          // Show tooltip
          d3
            .select("#tooltip")
            .style("display", "block")
            .style("left", event.pageX + vis.config.tooltipPadding + "px")
            .style("top", event.pageY + vis.config.tooltipPadding + "px").html(`
              <div class="tooltip-title">${parentGroup.category}</div>
              <div>${d.group}: ${d.value.toFixed(1)}%</div>
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
          d3.select("#tooltip").style("display", "none");
        });
    } else {
      categoryGroups
        .selectAll(".bar")
        .data((d) => d.values)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", (d) => vis.barScale(d.group))
        .attr("y", (d) => vis.yScale(d.value))
        .attr("width", vis.barScale.bandwidth())
        .attr("height", (d) => vis.height - vis.yScale(d.value))
        .attr("fill", (d, i) => {
          //   console.log(d, vis.colorScale2(d.value));
          return i === 0 ? vis.colorScale2(d.value) : "#ef6548";
        }) // Different colors for national vs county
        .on("mousemove", function (d) {
          // Get parent data for category name
          const parentGroup = d3.select(this.parentNode).datum();

          // Highlight bar on hover
          d3.select(this)
            .transition()
            .duration(100)
            .style("opacity", 0.8)
            .style("stroke", "white")
            .style("stroke-width", 2);

          // Show tooltip
          d3
            .select("#tooltip")
            .style("display", "block")
            .style("left", event.pageX + vis.config.tooltipPadding + "px")
            .style("top", event.pageY + vis.config.tooltipPadding + "px").html(`
              <div class="tooltip-title">${parentGroup.category}</div>
              <div>${d.group}: ${d.value.toFixed(1)}%</div>
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
          d3.select("#tooltip").style("display", "none");
        })
        .on("click", (d) => {
          const key = vis.nationalData.find(
            (data) => data.count === d.value
          ).key;

          choroplethMap1.config.attribute = key;
          choroplethMap1.updateVis();
        });
    }

    // Add value labels on top of bars
    categoryGroups
      .selectAll(".bar-label")
      .data((d) => d.values)
      .enter()
      .append("text")
      .attr("class", "bar-label")
      .attr("x", (d) => vis.barScale(d.group) + vis.barScale.bandwidth() / 2)
      .attr("y", (d) => vis.yScale(d.value) - 5)
      .attr("text-anchor", "middle")
      .style("font-size", "10px")
      .style("fill", "#333")
      .text((d) => (d.value > 0 ? d.value.toFixed(1) : ""));

    // Update axes
    vis.xAxisG.call(vis.xAxis);
    vis.yAxisG.call(vis.yAxis);

    // Add x-axis label
    vis.chart.selectAll(".x-axis-label").remove();
    vis.chart
      .append("text")
      .attr("class", "x-axis-label")
      .attr("x", vis.width / 2)
      .attr("y", vis.height + 35)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .text("Health Condition");

    // Add y-axis label
    vis.chart.selectAll(".y-axis-label").remove();
    vis.chart
      .append("text")
      .attr("class", "y-axis-label")
      .attr("transform", "rotate(-90)")
      .attr("x", -vis.height / 2)
      .attr("y", -30)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .text("Percent (%)");
  }

  /**
   * Updates the chart with county-specific data
   * @param {Array} countyData - Array of health metrics for a specific county
   * @param {String} countyName - Name of the selected county
   */
  updateCountyData(countyData, countyName) {
    let vis = this;

    // Update county data
    vis.countyData = countyData;
    vis.selectedCounty = countyName;

    // Update title
    vis.config.title = `Health Conditions: National vs ${countyName} County`;
    vis.svg.select(".chart-title").text(vis.config.title);

    // Update the second group name
    vis.config.groupNames[1] = `${countyName} County`;

    // Update visualization
    vis.updateVis();
    d3.select(".category-legend").style("display", "none");
    d3.select(".group-legend").style("display", "block");
    // Add reset button if it doesn't exist
    if (!d3.select("#reset-button").node()) {
      d3.select("body")
        .append("button")
        .attr("id", "reset-button")
        .text("Reset Comparison")
        .style("position", "absolute")
        .style("top", "20px")
        .style("right", "20px")
        .on("click", function () {
          vis.resetToOriginalData();
          // Reset map highlighting
          d3.selectAll(".county").style("opacity", "0.7");
          choroplethMap1.updateVis();
          d3.select(".category-legend").style("display", "block");
          d3.select(".group-legend").style("display", "none");
        });
    }
  }

  /**
   * Resets the chart to original data
   */
  resetToOriginalData() {
    let vis = this;

    // Reset data and title
    vis.nationalData = vis.originalData.national;
    vis.countyData = vis.originalData.county;
    vis.selectedCounty = null;
    vis.config.title = "Health Conditions Comparison";
    vis.config.groupNames = ["National Average", "Selected County"];

    // Update visualization
    vis.updateVis();

    // Remove reset button
    d3.select("#reset-button").remove();
  }
}
