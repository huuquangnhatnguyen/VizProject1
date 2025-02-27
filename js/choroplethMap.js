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
      containerHeight: _config.containerHeight || 500,
      margin: _config.margin || { top: 30, right: 10, bottom: 10, left: 10 },
      tooltipPadding: 10,
      legendBottom: 50,
      legendLeft: 50,
      legendRectHeight: 12,
      legendRectWidth: 150,
      attribute: _attribute,
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
    vis.width =
      vis.config.containerWidth -
      vis.config.margin.left -
      vis.config.margin.right;
    vis.height =
      vis.config.containerHeight -
      vis.config.margin.top -
      vis.config.margin.bottom;

    // Define size of SVG drawing area
    vis.svg = d3
      .select(vis.config.parentElement)
      .append("svg")
      .attr("class", "center-container")
      .attr("width", vis.config.containerWidth)
      .attr("height", vis.config.containerHeight);

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
  }

  updateVis() {
    let vis = this;
    let attribute = vis.config.attribute;
    vis.colorScale = d3
      .scaleLinear()
      .domain(
        d3.extent(vis.data.objects.counties.geometries, (d) => {
          return d.properties[attribute];
        })
      )
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
    this.renderVis();
  }

  renderVis() {
    // Calculate inner chart size. Margin specifies the space around the actual chart.
    let vis = this;
    let attribute = vis.config.attribute;
    // console.log(attribute);

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
    // .on("mouseover", mouseOver)
    // .on("mouseleave", mouseLeave);

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
