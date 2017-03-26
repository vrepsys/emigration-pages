$( document ).ready(function() {

    var data, geodata, remaining = 2;

    var dimensions = {
      large: {
        width: 360,
        height: 290,
        scale: 3500,
        transformX: -300,
        transformY: -100,
        captionX: 130,
        captionY: 25
      },
      medium: {
        width: 340,
        height: 280,
        scale: 3000,
        transformX: -310,
        transformY: -100,
        captionX: 130,
        captionY: 25
      },
      small: {
        width: 230,
        height: 210,
        scale: 2000,
        transformX: -360,
        transformY: -135,
        captionX: 75,
        captionY: 25
      },
      tiny: {
        width: 200,
        height: 190,
        scale: 1700,
        transformX: -380,
        transformY: -135,
        captionX: 75,
        captionY: 25
      }
    }

    d3.json('data/emigration.json', function(err, json) {
        data = json;
        if (!--remaining) onDataLoaded();
    });

    d3.json('data/regions.json', function(err, json) {
        geodata = json;
        if (!--remaining) onDataLoaded();
    });

    function onDataLoaded() {
        map(geodata, geodata.objects.LTU, data, '2015', '2016', dimensions.large, d3.select('.map2016'));
    }
});

function map(geoJSON, mappedFeature, metric, yearFrom, yearTo, dimensions, container) {
    var d = dimensions;
    var tooltip = d3.select('.map-tooltip');
    var filter = yearFrom + '-' + yearTo;
    // console.log(metric);

    var svg = container.append('svg')
        .attr('width', d.width)
        .attr('height', d.height)
        .attr('class', 'map centered-item');

    var greenScale = d3.scale.linear()
      .domain([0, 1])
      .range(['#e6f3e6', 'green']);

    var redScale = d3.scale.linear()
      .domain([-1, 0])
      .range(['red', '#f3e6e6']);

    var colorScale = function(x) {
      if (x == 0) return '#ffffff'
      else if (x > 0) return redScale(-x);
      else return greenScale(-x);
    };


    var featureCollection = topojson.feature(geoJSON, mappedFeature);
    var bounds = d3.geo.bounds(featureCollection);

    var centerX = d3.sum(bounds, function(d) {return d[0];}) / 2,
        centerY = d3.sum(bounds, function(d) {return d[1];}) / 2;

    var projection = d3.geo.mercator()
        .scale(d.scale)
        .center([centerX, centerY]);

    var path = d3.geo.path()
        .projection(projection);

    svg.selectAll('path')
        .data(featureCollection.features).enter()
        .append('path')
        .attr('d', path)
        .attr('transform', 'translate(' + d.transformX + ' ' + d.transformY + ')')
        .attr('fill', function(d) { return colorScale(+metric[d.properties.name][filter]);})
        .attr('class', 'region')
        .on("mouseover", function(d) {
          d3.select(this.parentNode.appendChild(this)).transition().duration(300);
        })
        .on("mousemove", function(d) {
            d3.select(this).classed("active-region", true)
            tooltip.style("opacity", 0.9);
            tooltip.select('.map-tooltip-header').html(d.properties.name)
            var migrants2015 = metric[d.properties.name][yearFrom];
            var migrants2016 = metric[d.properties.name][yearTo];

            var prc = (parseFloat(metric[d.properties.name][filter])*100).toFixed(1);
            var arrow = prc > 0 ? "arrow-up" : "arrow-down";
            var color = prc > 0 ? "red" : "green";
            var prcText = prc + '%';
            tooltip.select('.map-tooltip-contents').html(
              "Emigravo žmonių:<br/>" +
              "2015 metais " + migrants2015 +
              "<br/>2016 metais " + migrants2016 +
              "<div class='map-tooltip-prc " + color + "'><span class='"+arrow+"'></span>" + prcText + "</div>");
            tooltip
                .style("left", (d3.event.pageX + 25) + "px")
                .style("top", (d3.event.pageY - 130) + "px")
        })
        .on("mouseout", function() {
            d3.select(this).classed("active-region", false)
            tooltip.style("opacity", 0);
        });
}
