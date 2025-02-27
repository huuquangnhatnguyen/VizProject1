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
      containerHeight: _config.containerHeight || 500,
      margin: _config.margin || { top: 25, right: 20, bottom: 20, left: 40 },
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

    // Initialize scales and axes

    // Initialize scales
    // vis.colorScale = d3
    //   .scaleOrdinal()
    //   .range(["#d3eecd", "#7bc77e", "#2a8d46"]) // light green to dark green
    //   .domain(["Easy", "Intermediate", "Difficult"]);
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

    // var y = d3.scaleLinear().domain([0, 40]).range([height, 0]);
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

    vis.renderVis();
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
      // .enter()
      // .append("g")
      // .attr("transform", function (d) {
      //   return "translate(" + x(d.key) + ",0)";
      // })
      // .data(mockData)
      // .selectAll("rect")
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", (d) => vis.xScale(vis.xValue(d)))
      .attr("width", vis.xScale.bandwidth())
      .attr("height", (d) => vis.height - vis.yScale(vis.yValue(d)))
      .attr("y", (d) => vis.yScale(vis.yValue(d)))
      .attr("fill", (d) => vis.colorScale(vis.colorValue(d)));
    // .on("click", function (event, d) {
    //   const isActive = difficultyFilter.includes(d.key);
    //   if (isActive) {
    //     difficultyFilter = difficultyFilter.filter((f) => f !== d.key); // Remove filter
    //   } else {
    //     difficultyFilter.push(d.key); // Append filter
    //   }
    //   filterData(); // Call global function to update scatter plot
    //   d3.select(this).classed("active", !isActive); // Add class to style active filters with CSS
    // });

    // Update axes
    vis.xAxisG.call(vis.xAxis);
    vis.yAxisG.call(vis.yAxis);
  }
}
