let width = 1000;
let height = 350;

const margin = { top: 20, bottom: 50, left: 40, right: 50 };
width = width - margin.right - margin.left;
height = height - margin.top - margin.bottom;

parseDate = d3.timeParse("%Y-%m-%d");
formatValue = d3.format(".2s");
formatDate = d3.timeFormat("%d-%b-%Y");

var dataForChart;

var colors = {
  0: ["United Kingdom 1st dose daily", "#abcbe5"],
  1: ["United Kingdom 2nd dose daily", "#5694ca"],
  2: ["United Kingdom Booster or 3rd dose daily", "#003078"],
};

function processRow(row) {
  return {
    date: parseDate(row.date),
    value_d1: parseInt(row.newPeopleVaccinatedFirstDoseByPublishDate) || 0,
    value_d2: parseInt(row.newPeopleVaccinatedSecondDoseByPublishDate) || 0,
    value_d3: parseInt(row.newPeopleVaccinatedThirdInjectionByPublishDate) || 0,
    cum_d1: parseInt(row.cumPeopleVaccinatedFirstDoseByPublishDate) || 0,
    cum_d2: parseInt(row.cumPeopleVaccinatedSecondDoseByPublishDate) || 0,
    cum_d3: parseInt(row.cumPeopleVaccinatedThirdInjectionByPublishDate) || 0,
    cum_all: parseInt(row.cumVaccinesGivenByPublishDate) || 0,
  };
}

updateData_all();

function updateData_all() {
  d3.csv("data/data_2022-Jul-13.csv", processRow)
    .then(addTotals)
    .then(processData);  
}

function updateData_1y() {
  function filterData(data) {
    var cutoffDate = d3.max(data, function (d) {
      return d.date;
    });
    cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);
    data_1y = data.filter(function (d) {
      return d.date > cutoffDate;
    });
    return data_1y;
  }
  d3.csv("data/data_2022-Jul-13.csv", processRow)
    .then(filterData)
    .then(processData);
}

function updateData_6m() {
  function filterData(data) {
    var cutoffDate = d3.max(data, function (d) {
      return d.date;
    });

    cutoffDate.setDate(cutoffDate.getDate() - 180);
    data_6m = data.filter(function (d) {
      return d.date > cutoffDate;
    });
    return data_6m;
  }

  d3.csv("data/data_2022-Jul-13.csv", processRow)
    .then(filterData)
    .then(processData);
}

function updateData_3m() {
  function filterData(data) {
    var cutoffDate = d3.max(data, function (d) {
      return d.date;
    });

    cutoffDate.setDate(cutoffDate.getDate() - 90);
    data_3m = data.filter(function (d) {
      return d.date > cutoffDate;
    });
    return data_3m;
  }

  d3.csv("data/data_2022-Jul-13.csv", processRow)
    .then(filterData)
    .then(processData);
}

function updateData_1m() {
  function filterData(data) {
    var cutoffDate = d3.max(data, function (d) {
      return d.date;
    });

    cutoffDate.setDate(cutoffDate.getDate() - 30);
    data_1m = data.filter(function (d) {
      return d.date > cutoffDate;
    });
    return data_1m;
  }

  d3.csv("data/data_2022-Jul-13.csv", processRow)
    .then(filterData)
    .then(processData);
}

function processData(data) {
  d3.select("#chart").selectAll("*").remove();
  const svg = d3
    .select("#chart")
    .append("svg")
    .attr("viewBox", [
      0,
      0,
      width + margin.right + margin.left,
      height + margin.top + margin.bottom,
    ])
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  svg
    .append("rect")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("fill", "#f8f8f8");

  let chart_tooltip = d3
    .select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

  var stck = d3
    .stack()
    .keys(["value_d1", "value_d2", "value_d3"])
    .order(d3.stackOrderNone)
    .offset(d3.stackOffsetNone);
  var dataset = stck(data);

  const x = d3
    .scaleTime()
    .domain(
      d3.extent(data, function (d) {
        return d.date;
      })
    )
    .range([0, width]);

  const y = d3
    .scaleLinear()
    .domain([
      0,
      d3.max(dataset, function (d) {
        return d3.max(d, function (d) {
          return d[1];
        });
      }),
    ])
    .range([height, 0]);

  const yAxis = d3
    .axisLeft(y)
    .tickFormat(function (d) {
      return formatValue(d);
    })
    .tickSizeOuter(0)
    .tickSizeInner(0)
    .ticks(6);

  const xAxis = d3
    .axisBottom(x)
    .tickFormat(formatDate)
    .tickSizeOuter(0)
    .tickSizeInner(0)
    .ticks(6);

  svg.append("g").attr("class", "axis").call(yAxis);

  svg
    .append("g")
    .attr("class", "axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

  var groups = svg
    .selectAll("g.dose")
    .data(dataset)
    .enter()
    .append("g")
    .style("fill", function (d, i) {
      return colors[i][1];
    });

  var rect = groups
    .selectAll("rect")
    .data(function (d) {
      return d;
    })
    .enter()
    .append("rect")
    .attr("x", function (d) {
      return x(d.data.date);
    })
    .attr("y", function (d) {
      return y(d[1]);
    })
    .attr("height", function (d) {
      return y(d[0]) - y(d[1]);
    })
    .attr("width", width / data.length);

  rect
    .on("mousemove", function (event, d) {
      chart_tooltip.transition().duration(200).style("opacity", 0.9);
      chart_tooltip
        .html(function () {
          let res =
            "<div class='tt-legend'><div class='legend-scale'><ul class='legend-labels'>" +
            formatDate(d.data.date) +
            "<br/><br/><li><span style='background:#abcbe5;'></span>United Kingdom 1st dose daily : " +
            d.data.value_d1 +
            "</li>";
          if (d.data.value_d2 > 0) {
            res +=
              "<li><span style='background:#5694ca;'></span>United Kingdom 2nd dose daily : " +
              d.data.value_d2 +
              "</li>";
          }
          if (d.data.value_d3 > 0) {
            res +=
              "<li><span style='background:#003078;'></span>United Kingdom Booster or 3rd dose daily : " +
              d.data.value_d3 +
              "</li>";
          }
          res += "</ul></div></div>";
          return res;
        })
        .style("left", function () {
          if (event.pageX + 350 > width) return event.pageX - 370 + "px";
          else return event.pageX + 10 + "px";
        })
        .style("top", event.pageY - 28 + "px");
    })
    .on("mouseout", function (event, d) {
      chart_tooltip.transition().style("opacity", 0);
    });

  var legend = svg
    .append("g")
    .attr("class", "legend")
    .attr("x", width - 250)
    .attr("y", 35)
    .attr("height", 100)
    .attr("width", 100);

  legend
    .selectAll("g")
    .data(dataset)
    .enter()
    .append("g")
    .each(function (d, i) {
      var g = d3.select(this);
      g.append("rect")
        .attr("x", 40 + i * 240)
        .attr("y", height + 35)
        .attr("width", 10)
        .attr("height", 10)
        .style("fill", function (d, ii) {
          return colors[i][1];
        });

      g.append("text")
        .attr("x", 60 + i * 240)
        .attr("y", height + 46)
        .attr("height", 30)
        .attr("width", 100)
        // .style("fill", function (d, ii) {
        //   return colors[i][1];
        // })
        .text(function (d, ii) {
          return colors[i][0];
        });
    });
}

function addTotals(data) {
  format = d3.format(",");
  d3.select("#totals").html("");
  d3.select("#totals")
    .append("p")
    .html(
      "<h3>People vaccinated                                                " +
        "                                               Vaccinations given</h2>"
    )
    .append("p")
    .html(
      "<snap class='txt'>First dose total</snap>                <snap class='txt'>Second dose total</snap>                 " +
      "<snap class='txt'>Booster or 3rd dose total</snap>                                   <snap class='txt'>Total</snap>"
    )
    .append("p")
    .html(
      "<span class='totals'>" +
        format(data[0].cum_d1) +
        "</span>            <span class='totals'>" +
        format(data[0].cum_d2) +
        "</span>                 <span class='totals'>" +
        format(data[0].cum_d3) +
        "</span>                                             <span class='totals'>" +
        format(data[0].cum_all) +
        "</span><hr>"
    );
  return data;
}
