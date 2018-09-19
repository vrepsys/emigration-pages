$( document ).ready(function() {

  function translate(x, y) {
    return 'translate(' + x + ',' + y + ')'
  };

  var utils = Kandinsky.utils;

  function drawLinechart(settings) {

    var parseDate = settings.dateParser;

    var margin = settings.margins,
        width  = settings.width - margin.left - margin.right,
        height = settings.height - margin.top - margin.bottom;

    var xScale = d3.time.scale()
        .range([0, width]);

    var yScale = d3.scale.linear()
        .range([height, 0]);

    var width2 = function() { return 2; }
    var lineWidth = settings.lineWidth || width2;

    var colorScale = d3.scale.ordinal().range(
      ['#993366', '#339966', '#666699', '#FF6600', '#0066CC', '#008080',
      '#993300', '#333399', '#800000', '#660066', '#003366', '#FF8080']);

    var xAxis = d3.svg.axis()
        .scale(xScale)
        .orient("bottom")
        .innerTickSize(-height)
        .outerTickSize(-height)
        .tickPadding(10)
        .tickValues(settings.tickValues)
        .tickFormat(settings.tickFormat);

    var yAxis = d3.svg.axis()
        .scale(yScale)
        .orient("left")
        .innerTickSize(-width)
        .outerTickSize(0)
        .tickPadding(10);

    var line = d3.svg.line()
        .x(function(d) { return xScale(d.date); })
        .y(function(d) { return yScale(d.count); });

    var svg = settings.container.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", translate(margin.left, margin.top));

    d3.csv(settings.csvDataPath,
      function(d) {
        d = _.chain(d)
             .pick(settings.dimensions)
             .pickBy(function(d) { return d && d.length > 0; })
             .value();

        function allExceptDate(value, key) { return key == "date"; }

        d = { date: parseDate(d.date), observations: _.omitBy(d, allExceptDate) };
        return d;
      },
      function(error, data) {
        if (error) throw error;

        colorScale.domain(d3.keys(data[0].observations));

        var migrants = colorScale.domain().map(function(name) {
          var color = colorScale(name);
          return {
            name  : name,
            color : color,
            values: data.map(function(d) {
              return {label: name, date: d.date, color: color, count: +d.observations[name]};
            }).filter(function(d) { return !isNaN(d.count); })
          };
        });


        xScale.domain(d3.extent(data, function(d) { return d.date; }));
        yScale.domain(settings.domain);

        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

        svg.append("g")
            .attr("class", "y axis")
            .call(yAxis);

        var city = svg.selectAll(".city")
          .data(migrants)
          .enter().append("g")
          .attr("class", "city");

        city.append("path")
            .attr("class", "line")
            .attr("stroke-width", lineWidth)
            .attr("d", function(d) { return line(d.values); })
            .style("stroke", function(d) { return d.color; });

        var defaultRadius = function() { return 2; };
        var circleRadius = settings.circleRadius || defaultRadius;

        city.selectAll("circle").data(function(d) {
            return d.values.filter(settings.highlightedTicks);
          })
          .enter()
          .append("circle")
          .attr("class", "circle")
          .attr("cx", function(d) { return xScale(d.date); })
          .attr("cy", function(d) { return yScale(d.count); })
          .attr("stroke", function(d) { return d.color; })
          .attr("fill",   function(d) { return d.color; })
          .attr("r", circleRadius);

        var endPoints = migrants.map(function(c) {
          var val = c.values[c.values.length - 1];
          return {
              name: c.name,
              color: val.color,
              label: settings.labels[c.name],
              date:  val.date,
              value: val.count
            };
          }
        );

        endPoints.sort(function(ep1,ep2) { return ep1.value-ep2.value; });

        endPoints.forEach(function(ep) { ep.y = yScale(ep.value) + 5 });

        endPoints.forEach(function(ep, i) {
          if (i > 0) {
            var ep_prev = endPoints[i-1];
            var dist = ep_prev.y - ep.y;
            if (dist < 30) {
              ep.y -= (30-dist);
            }
          }
        });

        var categoryLabels = svg.append('g').attr('class', 'category-labels');

        var catLabel = categoryLabels
            .selectAll('.category-label')
            .data(endPoints);

        var catLabelEnter = catLabel.enter().append('g').attr('class', 'category-label');

        catLabelEnter.append('text')
          .attr('dx', 8)
          .attr('dy', 0);

        catLabelEnter.insert('rect', ':first-child').attr('rx', '2').attr('ry', '2');

        var x = xScale.range()[1]+8;

        catLabel.select('text')
          .text(function(d) { return d.label})
          .attr('transform', function(ep) { return translate(x, ep.y); });

        catLabel.select('rect')
          .attr('fill', function(d) { return d.color; })
          .attr('width', function(d) {
            var textEl = this.parentNode.getElementsByTagName('text')[0].getBBox();
            return textEl.width + 16;
          })
          .attr('height', function() {
            var textEl = this.parentNode.getElementsByTagName('text')[0].getBBox();
            return textEl.height + 4;
          })
          .attr('transform', function(ep) { return translate(x, ep.y - 18); });

          // INTERACTIONS
          var focus = utils.selectOrAppendG(svg, 'focus').style('display', 'none');
          var bisectDate = d3.bisector(function(d) { return d.date; }).left;

          // set up vertical focus indicator
          var focusVertical = utils.selectOrAppend(focus, 'line', 'focus-vertical-line')
            .attr('y1', 1).attr('y2', height);

          focusVertical
            .attr("x1", 100)
            .attr("x2", 100);

          var infoBox = utils.selectOrAppend(settings.container, 'div', 'info-box').style('display', 'none');

          // overlay to capture mouse events
          overlay = utils.selectOrAppend(settings.container, 'div', 'overlay', function (div) {
            div
              .on('mouseover', function () {
                focus.style('display', null);
                infoBox.style('display', null);
              })
              .on('mouseout', function () {
                focus.style('display', 'none');
                infoBox.style('display', 'none');
              })
          })
          .on('mousemove', function() { onMouseMove.call(this, data); })
            .style('height', height + 'px')
            .style('width', (width + 10) + 'px')
            .style('margin-left', margin.left + 'px')
            .style('margin-top', margin.top + 'px')
            .style('display', null);

          infoBox.style('top', (margin.top + 3) + 'px');

          // when we move the mouse over the overlay
          var onMouseMove = function(rows) {

            // var rows = series.arrayGroupedByDate;
            //
            // // compute which date/row should be focused
            var x0 = xScale.invert(d3.mouse(this)[0]),
                i = bisectDate(rows, x0, 1);

            if (i === rows.length) i--;
            var d0 = rows[i - 1],
                d1 = rows[i],
                rowFocused = x0 - d0.date > d1.date - x0 ? d1 : d0;

            // calculate x coord for the vertical focus line
            var xCoord = xScale(rowFocused.date);

            console.log(xCoord, rowFocused.date);

            focusVertical
              .attr("x1", xCoord)
              .attr("x2", xCoord);

            var observationsForDate = _.map(rowFocused.observations, function(v, k) {
              return {identifier: k, value: v};
            });

            // highight focused data points
            var circles = focus.selectAll('circle').data(observationsForDate);


            circles.enter().append('circle').attr("r", 3);

            circles.attr("transform",
                function(o) {
                  return "translate(" + xScale(rowFocused.date) + "," + yScale(o.value) + ")"
                })
                  .attr("stroke", function (o) { return colorScale(o.identifier); })
                  .attr("fill", function (o) { return colorScale(o.identifier)});

            circles.exit().remove();

            var offset = 5;
            var infoBoxWidth = 160;
            if (xCoord - (infoBoxWidth+offset) < margin.left) {
              infoBox.style('left', (xCoord + offset + margin.left) + 'px');
            }
            else {
              infoBox.style('left', (xCoord - (infoBoxWidth + offset) + margin.left) + 'px');
            }

            var infoBoxTickFormat = settings.infoBoxTickFormat || settings.tickFormat;

            utils.selectOrAppend(infoBox, 'div', 'date').text(infoBoxTickFormat(rowFocused.date));

            var table = utils.selectOrAppend(infoBox, 'table', 'category-values-list');

            table.selectAll('tr').remove();


            var order = settings.infoBoxOrder || [];
            var records = observationsForDate.map(function(o) {
              return {label: settings.labels[o.identifier], obs: o};
            })
            .sort(function(rec1, rec2) {
              return order.indexOf(rec1.obs.identifier) - order.indexOf(rec2.obs.identifier);
            });

            var tr = table.selectAll('tr').data(records);
            tr.enter().append('tr');
            tr.append('td').text(function(rec) { return rec.label });

            var format = yScale.tickFormat();

            tr.append('td').attr('class', 'value')
              .html(function(rec) {
                var o = rec.obs;
                var text = format(o.value);
                return text;
              });

          };

      });

  }

  var yearFormat = d3.time.format("%Y");
  var parseYear = yearFormat.parse;
  var highlightedYears = [2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017].map(function(year) {
    return parseYear(_.toString(year)).getTime();
  });

  var parseMonth = d3.time.format("%m").parse;

  var imigrationEmigrationChartSettings = {
    csvDataPath: 'data/total-migration.csv',
    dateParser: parseYear,
    tickFormat: yearFormat,
    highlightedTicks: function(d) {
      return _.includes(highlightedYears, d.date.getTime());
    },
    container: d3.select(".migration-linechart-container"),
    dimensions: ['date', 'expats', 'immigrants'],
    labels: {expats: 'Emigrantai', immigrants: 'Imigrantai'},
    tickValues: _.range(2010, 2018).map(_.toString).map(parseYear),
    domain: [0, 90000],
    width: 420,
    height: 330,
    margins: {top: 20, right: 120, bottom: 30, left: 50},
  };

  drawLinechart(imigrationEmigrationChartSettings);

  var immigrationByBirthplaceChartSettings = {
    csvDataPath: 'data/total-migration.csv',
    dateParser: parseYear,
    tickFormat: yearFormat,
    highlightedTicks: function(d) {
      return _.includes(highlightedYears, d.date.getTime());
    },
    container: d3.select(".imigration-local-foreign-container"),
    dimensions: ['date', 'immigrants_lt', 'immigrants_foreign'],
    labels: {immigrants_lt: 'Lietuva', immigrants_foreign: 'Užsienis'},
    tickValues: _.range(2010, 2018).map(_.toString).map(parseYear),
    domain: [0, 20000],
    width: 400,
    height: 350,
    margins: {top: 20, right: 90, bottom: 30, left: 50},
  };

  drawLinechart(immigrationByBirthplaceChartSettings);


  var immigrationByBirthCountryChartSettings = {
    csvDataPath: 'data/total-migration.csv',
    dateParser: parseYear,
    tickFormat: yearFormat,
    highlightedTicks: function(d) {
      return _.includes(highlightedYears, d.date.getTime());
    },
    container: d3.select(".imigration-birthcountry-container"),
    dimensions: ['date', 'immigrants_other', 'immigrants_ukraine','immigrants_russia','immigrants_belarus','immigrants_us'],
    labels: {immigrants_ukraine: 'Ukraina', 'immigrants_russia': 'Rusija', immigrants_belarus: 'Baltarusija', immigrants_us: 'JAV', immigrants_other: 'Kitos Šalys'},
    tickValues: _.range(2010, 2018).map(_.toString).map(parseYear),
    domain: [0, 4500],
    width: 420,
    height: 340,
    margins: {top: 20, right: 110, bottom: 30, left: 50},
  };

  drawLinechart(immigrationByBirthCountryChartSettings);

  var immigrationByDirectionChartSettings = {
    csvDataPath: 'data/total-migration.csv',
    dateParser: parseYear,
    tickFormat: yearFormat,
    highlightedTicks: function(d) {
      return _.includes(highlightedYears, d.date.getTime());
    },
    container: d3.select(".emigration-direction-container"),
    dimensions: ['date', 'expats_uk', 'expats_other', 'expats_ireland', 'expats_norway', 'expats_germany' ],
    labels: {expats_ireland: 'Airija', expats_norway: 'Norvegija', expats_uk: 'Jungtinė Karalystė', expats_other: 'Kitos Valstybės', expats_germany: 'Vokietija'},
    tickValues: _.range(2010, 2018).map(_.toString).map(parseYear),
    domain: [0, 45000],
    width: 460,
    height: 360,
    margins: {top: 20, right: 170, bottom: 30, left: 50},
  };

  drawLinechart(immigrationByDirectionChartSettings);


  var monthNames = {
    "01": { short: "Saus",long: "Sausis" },
    "02": { short: "Vas", long: "Vasaris" },
    "03": { short: "Kov", long: "Kovas" },
    "04": { short: "Bal", long: "Balandis" },
    "05": { short: "Geg", long: "Gegužė" },
    "06": { short: "Bir", long: "Birželis" },
    "07": { short: "Liep",long: "Liepa" },
    "08": { short: "Rgp", long: "Rugpjūtis" },
    "09": { short: "Rgs", long: "Rugsėjis" },
    "10": { short: "Spa", long: "Spalis" },
    "11": { short: "Lap", long: "Lapkritis" },
    "12": { short: "Grd", long: "Gruodis" }
  }

  var mothlyEmigrationChartSettings = {
    csvDataPath: 'data/monthly-emigration.csv',
    dateParser: parseMonth,
    tickFormat: function(month) {
      var f = d3.time.format("%m")(month);
      return monthNames[f].short;
    },
    infoBoxTickFormat: function(month) {
      var f = d3.time.format("%m")(month);
      return monthNames[f].long;
    },
    highlightedTicks: function(d) {
      return true;
    },
    lineWidth: function(d) {
      return d && d.name == '2018' ? 3 : 1;
    },
    circleRadius: function(d) {
      return d && d.name == '2018' ? 2 : 1;
    },
    container: d3.select(".monthly-emigration-linechart-container"),
    dimensions: ['date', '2014', '2015', '2016', '2017', '2018'],
    labels: {2014: '2014', 2015: '2015', 2016: '2016', 2017: '2017', 2018: '2018'},
    tickValues: _.range(1, 13).map(_.toString).map(parseMonth),
    domain: [2000, 6500],
    width: 460,
    height: 300,
    margins: {top: 20, right: 95, bottom: 30, left: 50},
  };

  drawLinechart(mothlyEmigrationChartSettings);



  var mothlyNetMigrationChartSettings = {
    csvDataPath: 'data/monthly-net-migration.csv',
    dateParser: parseMonth,
    tickFormat: function(month) {
      var f = d3.time.format("%m")(month);
      return monthNames[f].short;
    },
    infoBoxTickFormat: function(month) {
      var f = d3.time.format("%m")(month);
      return monthNames[f].long;
    },
    highlightedTicks: function(d) {
      return true;
    },
    // circleRadius: '3',
    container: d3.select(".monthly-net-migration-linechart-container"),
    dimensions: ['date', '2014', '2015', '2016', '2017', '2018'],
    labels: {2014: '2014', 2015: '2015', 2016: '2016', 2017: '2017', 2018: '2018'},
    tickValues: _.range(1, 13).map(_.toString).map(parseMonth),
    domain: [-5000, 1000],
    width: 460,
    height: 300,
    margins: {top: 20, right: 95, bottom: 30, left: 50},
  };

  drawLinechart(mothlyNetMigrationChartSettings);

  var emigrationBySexChartSettings = {
    csvDataPath: 'data/emigration-by-sex.csv',
    dateParser: parseYear,
    tickFormat: yearFormat,
    highlightedTicks: function(d) {
      return _.includes(highlightedYears, d.date.getTime());
    },
    container: d3.select(".emigration-by-sex-linechart-container"),
    dimensions: ['date', 'male', 'female'],
    labels: {male: 'Vyrai', female: 'Moterys'},
    tickValues: _.range(2010, 2016).map(_.toString).map(parseYear),
    domain: [0, 50000],
    width: 330,
    height: 300,
    margins: {top: 20, right: 120, bottom: 30, left: 50},
  };

  drawLinechart(emigrationBySexChartSettings);
});
