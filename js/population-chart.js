$( document ).ready(function() {

    d3.csv("data/emigracija-processed.csv", function(error, data) {

        if (error) throw error;

        data.reverse();

        var finalData = [];

        // TODO: structure data in csv instead of here
        data = data.filter(function(point) {
            if (point.year === '2014') {
                finalData.push({
                    gender: point.gender,
                    count: parseInt(point.count),
                    ageGroup: point.ageGroup
                })
            }
            return point.year === "2014" && point.gender === "V";
        });

        var dataF = finalData.filter(function(d) {
            return d.gender === "M"
        });

        var dataM = finalData.filter(function(d) {
           return d.gender === "V"
        });

        data = dataF.map(function(d) {
            var mVal;
            for (var i = 0; i < dataM.length; i ++) {
                if (d.ageGroup === dataM[i].ageGroup) {
                    mVal = dataM[i].count;
                    break;
                }
            }
            return {
                v: mVal,
                m: d.count,
                ageGroup: d.ageGroup
            }
        });

        // everything till here is just data mashing

        var margin = {top: 20, right: 80, bottom: 30, left: 50},
            width = 500 - margin.left - margin.right,
            height = 250 - margin.top - margin.bottom;

        var posOffset = width/2 + 20;
        var posOffsetLeft = width/2 - 20;
        var xRight = d3.scale.linear()
            .range([0, width - posOffset]);
        var xLeft = d3.scale.linear()
            .range([width - posOffset, 0]);

        var y = d3.scale.ordinal();

        var xRightAxis = d3.svg.axis()
            .scale(xRight)
            .orient("bottom")
            .ticks(4);

        var xLeftAxis = d3.svg.axis()
            .scale(xLeft)
            .orient("bottom")
            .ticks(4);

        var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left")
            .tickSize(0,0)
            .tickPadding(20);

        var svg = d3.select(".population-chart").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        var max = Math.max(d3.max(data, function(d) {return d.v}), d3.max(data, function(d) {return d.m}));

        xRight.domain([0, max + 20]);
        xLeft.domain([0, max + 20]);

        y.domain(data.map(function(d) { return d.ageGroup })).rangeRoundBands([0, height]);

        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xLeftAxis);

        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(" + posOffset + "," + height + ")")
            .call(xRightAxis);

        svg.append("g")
            .attr("class", "y axis")
            .attr("transform", "translate(" + posOffset + ",0)")
            .call(yAxis)
            .selectAll('text')
            .attr('data-selector', function(d, i) { return 'age-' + i})
            .style('text-anchor', 'middle');

        var ageGroup = svg.selectAll(".age-group")
            .data(data)
            .enter().append("g")
            .attr("class", function(d, i) {
                return 'age-group age-' + i
            });

        ageGroup.append("rect")
            .attr("height", y.rangeBand() - 2)
            .attr("width", function(d) { return xRight(d.m); })
            .attr("transform", translation(posOffsetLeft,0) + 'scale(-1,1)')
            .attr("x", 0.5)
            .attr("y", function(d, i) { return 3+ i*y.rangeBand() + y.rangeBand() / 2})
            .style("fill", "#E91E63").style("stroke", "#BB1D52");


        ageGroup.append("rect")
            .attr("height", y.rangeBand() - 2)
            .attr("width", function(d) { return xRight(d.v); })
            .attr("transform", translation(posOffset, 0))
            .attr("x", 0.5)
            .attr("y", function(d, i) { return 3+ i*y.rangeBand() + y.rangeBand() / 2})
            .style("fill", "#00BCD4").style("stroke", "rgb(21, 121, 134)");

        var tick = $('.population-chart .y.axis g.tick');
        tick.on('mouseover', function(e) {
            var age = e.target.textContent;

            data.forEach(function(el) {
                if (el.ageGroup === age) {
                    var div = $('.population-data');
                    div.addClass('active');

                    div.find('.men').first().text(el.v);
                    div.find('.women').first().text(el.m);
                }
            });
            $('.age-group.' + $(e.target).attr('data-selector')).addClass('active');
        });


        tick.on('mouseout', function(e) {
            var div = $('.population-data');
            div.removeClass('active');
            $('.age-group.' + $(e.target).attr('data-selector')).removeClass('active');
        })

    });

    function translation(x,y) {
        return 'translate(' + x + ',' + y + ')';
    }

});
