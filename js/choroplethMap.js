class ChoroplethMap {
  /**
   * Class constructor with basic configuration
   * @param {Object}
   * @param {Array}
   * @param {String}
   */
  constructor(_config, _data, _attribute) {
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: _config.containerWidth || 1000,
      containerHeight: _config.containerHeight || 700,
      margin: _config.margin || { top: 30, right: 10, bottom: 10, left: 10 },
      tooltipPadding: 10,
      legendBottom: 50,
      legendLeft: 50,
      legendRectHeight: 12,
      legendRectWidth: 150,
      attribute: _attribute,
      title: _config.title || formatAttribute(_attribute) + " by County",
    };
    this.data = _data;
    // this.config = _config;

    this.us = _data;

    this.active = d3.select(null);

    this.initVis();
    this.updateVis();
  }

  /**
   * We initialize scales/axes and append static elements, such as axis titles.
   */
  initVis() {
    let vis = this;
    let attribute = vis.config.attribute;

    // // Calculate inner chart size. Margin specifies the space around the actual chart.
    vis.width = vis.config.containerWidth;
    vis.height = vis.config.containerHeight;

    // Define size of SVG drawing area
    vis.svg = d3
      .select(vis.config.parentElement)
      .append("svg")
      .attr("class", "center-container")
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

    vis.projection = d3
      .geoAlbersUsa()
      .translate([vis.width / 2, vis.height / 2])
      .scale(vis.width);

    vis.path = d3.geoPath().projection(vis.projection);

    vis.g = vis.svg
      .append("g")
      .attr("class", "center-container center-items us-state")
      .attr(
        "transform",
        "translate(" +
          vis.config.margin.left +
          "," +
          vis.config.margin.top +
          ")"
      )
      .attr(
        "width",
        vis.width + vis.config.margin.left + vis.config.margin.right
      )
      .attr(
        "height",
        vis.height + vis.config.margin.top + vis.config.margin.bottom
      );

    // Add legend group
    vis.legend = vis.svg.append("g").attr("class", "legend").attr(
      "transform",
      // `translate(${vis.config.margin.left}, ${
      //   vis.height + vis.config.margin.top + 20
      // })`
      `translate(${100}, ${100})`
    );
  }

  updateVis() {
    let vis = this;
    let attribute = vis.config.attribute;

    // Get domain values for color scale
    const extent = d3.extent(vis.data.objects.counties.geometries, (d) => {
      return d.properties[attribute];
    });

    vis.colorScale = d3
      .scaleLinear()
      .domain(extent)
      .range(
        attribute === "percent_high_cholesterol"
          ? ["#fff", "#00265B"]
          : attribute === "percent_high_blood_pressure"
          ? ["#fff", "#B6995A"]
          : attribute === "percent_coronary_heart_disease"
          ? ["#fff", "#275031"]
          : ["#fff", "#E41134"]
      )
      .interpolate(d3.interpolateHcl);

    // Update legend with new scale
    this.updateLegend(extent);
    this.renderVis();
  }

  updateLegend(extent) {
    let vis = this;

    // Clear any existing legend
    vis.legend.selectAll("*").remove();

    // Create linear gradient for the legend
    const legendWidth = 200;
    const legendHeight = 15;

    // Create gradient for the legend
    const defs = vis.legend.append("defs");
    const linearGradient = defs
      .append("linearGradient")
      .attr("id", "legend-gradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "100%")
      .attr("y2", "0%");

    // Add color stops to gradient
    linearGradient
      .append("stop")
      .attr("offset", "0%")
      .attr("stop-color", vis.colorScale(extent[0]));

    linearGradient
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", vis.colorScale(extent[1]));

    // Create the color rectangle for the legend
    vis.legend
      .append("rect")
      .attr("width", legendWidth)
      .attr("height", legendHeight)
      .style("fill", "url(#legend-gradient)")
      .style("stroke", "#ccc")
      .style("stroke-width", 0.5);

    // Add legend title
    vis.legend
      .append("text")
      .attr("x", 0)
      .attr("y", -5)
      .style("font-size", "12px")
      .style("font-weight", "bold")
      .text(formatAttribute(vis.config.attribute) + " (%)");

    // Add tick marks and labels
    [0, 0.25, 0.5, 0.75, 1].forEach((percent) => {
      const value = extent[0] + (extent[1] - extent[0]) * percent;
      const xPos = percent * legendWidth;

      // Add tick mark
      vis.legend
        .append("line")
        .attr("x1", xPos)
        .attr("x2", xPos)
        .attr("y1", legendHeight)
        .attr("y2", legendHeight + 5)
        .style("stroke", "#000")
        .style("stroke-width", 1);

      // Add label
      vis.legend
        .append("text")
        .attr("x", xPos)
        .attr("y", legendHeight + 20)
        .style("font-size", "10px")
        .style("text-anchor", "middle")
        .text(value.toFixed(1));
    });

    // Add text for missing data
    vis.legend
      .append("g")
      .attr("transform", `translate(${legendWidth + 30}, ${legendHeight / 2})`)
      .append("text")
      .attr("alignment-baseline", "middle")
      .style("font-size", "10px")
      .text("No data");

    // Add a pattern rectangle for missing data
    const patternSize = 12;
    vis.legend
      .append("rect")
      .attr("x", legendWidth + 80)
      .attr("y", legendHeight / 2 - patternSize / 2)
      .attr("width", patternSize)
      .attr("height", patternSize)
      .style("fill", "url(#lightstripe)")
      .style("stroke", "#ccc")
      .style("stroke-width", 0.5);
  }

  renderVis() {
    // Calculate inner chart size. Margin specifies the space around the actual chart.
    let vis = this;
    let attribute = vis.config.attribute;
    // console.log(attribute);

    // Create a pattern for counties with no data
    const defs = vis.svg.append("defs");
    const pattern = defs
      .append("pattern")
      .attr("id", "lightstripe")
      .attr("patternUnits", "userSpaceOnUse")
      .attr("width", 4)
      .attr("height", 4)
      .attr("patternTransform", "rotate(45)");
    pattern
      .append("rect")
      .attr("width", 4)
      .attr("height", 4)
      .attr("fill", "#f5f5f5");
    pattern
      .append("line")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", 0)
      .attr("y2", 4)
      .attr("stroke", "#ccc")
      .attr("stroke-width", 1);

    vis.counties = vis.g
      .append("g")
      .attr("id", "counties")
      .selectAll("path")
      .data(topojson.feature(vis.us, vis.us.objects.counties).features)
      .enter()
      .append("path")
      .attr("class", "county") // add class to every county
      .attr("d", vis.path)
      .attr("id", (d) => d.properties.name)
      .attr("fill", (d) => {
        if (d.properties[attribute]) {
          return vis.colorScale(d.properties[attribute]);
        } else {
          return "url(#lightstripe)";
        }
      })
      .style("stroke", "transparent")
      .style("opacity", 0.8);

    vis.counties
      .on("mousemove", (d) => {
        const tooltipData =
          d.properties[attribute] > 0
            ? `${formatAttribute(attribute)}: <strong>${
                d.properties[attribute]
              }</strong>%`
            : "No data available";
        d3
          .select("#tooltip")
          .style("display", "block")
          .style("left", event.pageX + vis.config.tooltipPadding + "px")
          .style("top", event.pageY + vis.config.tooltipPadding + "px").html(`
                        <div class="tooltip-title">${d.properties.name}</div>
                        <div>${tooltipData}</div>
                      `);
      })
      .on("mouseover", mouseOver)
      .on("mouseleave", mouseLeave)
      .on("click", function (d) {
        d3.selectAll(".county").style("opacity", "0.2");
        d3.select(this).attr("class", "active");
        d3.selectAll(".active").style("opacity", "1");
      });

    vis.g
      .append("path")
      .datum(
        topojson.mesh(vis.us, vis.us.objects.states, function (a, b) {
          return a !== b;
        })
      )
      .attr("id", "state-borders")
      .attr("d", vis.path);
  }
}
// helper functions
function formatAttribute(attribute) {
  return camelize(attribute.replace(/_/g, " ").replace("percent", "% "));
}

function camelize(str) {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, function (word, index) {
      return index === 0 ? word.toLowerCase() : word.toUpperCase();
    })
    .replace(/\s+/g, " ");
}

let mouseOver = function (d) {
  d3.select(this)
    .transition()
    .duration(100)
    .style("stroke", "white")
    .style("stroke-width", 1.8);
};

let mouseLeave = function (d) {
  d3.select("#tooltip").style("display", "none");

  d3.select(this).transition().duration(200).style("stroke", "transparent");
};
