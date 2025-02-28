/**
 * Load TopoJSON data of the world and the data of the world wonders
 */

const mock2 = [
  [
    { key: "percent_high_blood_pressure", count: 0.25 },
    { key: "percent_coronary_heart_disease", count: 0.5 },
    { key: "percent_stroke", count: 0.75 },
    { key: "percent_high_cholesterol", count: 1 },
  ],
  [
    { key: "percent_high_blood_pressure", count: 0.5 },
    { key: "percent_coronary_heart_disease", count: 0.75 },
    { key: "percent_stroke", count: 1 },
    { key: "percent_high_cholesterol", count: 0.25 },
  ],
];

const keys = [
  "percent_high_blood_pressure",
  "percent_coronary_heart_disease",
  "percent_stroke",
  "percent_high_cholesterol",
];

function changeSelectHandler() {
  console.log("changeSelectHandler");
  console.log(test.value);
}

let mean, attribute, choroplethMap1, barchart, groupedBarChart;

Promise.all([
  d3.json("data/counties-10m.json"),
  d3.csv("data/national_health_data_2024.csv"),
])
  .then((data) => {
    const geoData = data[0];
    const nationHealthData = data[1];

    // Combine both datasets by adding the population density to the TopoJSON file
    // console.log(geoData);

    geoData.objects.counties.geometries.forEach((d) => {
      // console.log(d);
      for (let i = 0; i < nationHealthData.length; i++) {
        if (d.id === nationHealthData[i].cnty_fips) {
          keys.forEach((key) => {
            d.properties[key] = +nationHealthData[i][key];
          });
        }
      }
    });
    // });
    const {
      meanStroke,
      meanHighBloodPressure,
      meanCoronaryHeartDisease,
      meanHighCholesterol,
    } = statistics(nationHealthData);
    console.log(
      meanStroke,
      meanHighBloodPressure,
      meanCoronaryHeartDisease,
      meanHighCholesterol
    );
    const statsData = [
      { key: "percent_high_blood_pressure", count: meanHighBloodPressure },
      {
        key: "percent_coronary_heart_disease",
        count: meanCoronaryHeartDisease,
      },
      { key: "percent_stroke", count: meanStroke },
      { key: "percent_high_cholesterol", count: meanHighCholesterol },
    ];

    choroplethMap1 = new ChoroplethMap(
      {
        parentElement: ".viz",
      },
      geoData,
      "percent_high_cholesterol"
    );
    choroplethMap1.updateVis();

    barchart = new Barchart(
      {
        parentElement: "#barchart",
      },
      statsData
    );
    barchart.updateVis();

    // Define national average data
    const nationalAverages = [
      { key: "percent_high_cholesterol", count: 33.1 },
      { key: "percent_high_blood_pressure", count: 32.3 },
      { key: "percent_coronary_heart_disease", count: 6.2 },
      { key: "percent_stroke", count: 3.0 },
    ];

    // Initialize the grouped bar chart
    groupedBarChart = new GroupedBarchart(
      {
        parentElement: "#bar-chart-container",
        containerWidth: 800,
        containerHeight: 400,
        margin: { top: 50, right: 50, bottom: 90, left: 50 },
      },
      nationalAverages
    );

    // Initial render
    groupedBarChart.updateVis();
  })
  .catch((error) => console.error(error));

const test = document.getElementById("selectAttribute");
// console.log(test.value);
test.addEventListener("change", () => {
  choroplethMap1.config.attribute = test.value;
  // console.log(choroplethMap1.config.attribute);
  choroplethMap1.updateVis();
});

function statistics(data) {
  const meanStroke = d3.mean(data, (d) => d.percent_stroke);
  const meanHighBloodPressure = d3.mean(
    data,
    (d) => d.percent_high_blood_pressure
  );
  const meanCoronaryHeartDisease = d3.mean(
    data,
    (d) => d.percent_coronary_heart_disease
  );
  const meanHighCholesterol = d3.mean(data, (d) => d.percent_high_cholesterol);
  return {
    meanStroke,
    meanHighBloodPressure,
    meanCoronaryHeartDisease,
    meanHighCholesterol,
  };
}

function filterData(data, attribute) {
  return data.map((d) => {
    return {
      key: attribute,
      count: d[attribute],
    };
  });
}

function formatData(data) {
  let result = [
    { key: "percent_coronary_heart_disease", values: [] },
    { key: "percent_high_blood_pressure", values: [] },
    { key: "percent_high_cholesterol", values: [] },
    { key: "percent_stroke", values: [] },
  ];
  data.map((d) => {
    d.map((e, index) => {
      result[index].values.push(e.count);
    });
  });
  return result;
}

formatData(mock2);
