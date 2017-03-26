$( document ).ready(function() {

	d3.csv('data/emigration-by-sex-and-age.csv')
		.row(function(d) {
					return {
						age: d.age,
						change_f: +d.change_f,
						change_m: +d.change_m,
						emigration_f_2014: +d.emigration_f_2014,
						emigration_f_2015: +d.emigration_f_2015,
						emigration_m_2015: +d.emigration_m_2015,
						emigration_m_2014: +d.emigration_m_2014 };
				})
		.get(function(error, rows) {

				var table = d3.select(".emigration-grid-container")
						.append("table")
						.attr("cellspacing", 0)
						.attr("class", "emigration-grid")

				var tableHeader = table.append('tr');

				tableHeader.append('th').attr('class', 'age-col');
				tableHeader.append('th').text("Vyrai").attr("colspan", 3).attr('class','header-1 male');;
				tableHeader.append('th').text("Moterys").attr("colspan", 3).attr('class','header-1 female');;

				tableHeader = table.append('tr');

				tableHeader.append('th').text("Amžius").attr('class', 'age-col');
				tableHeader.append('th').text('2014').attr('class', 'male');
				tableHeader.append('th').text('2015').attr('class', 'male');;
				tableHeader.append('th').text('pokytis').attr('class', 'male');;
				tableHeader.append('th').text('pokytis').attr('class', 'female');
				tableHeader.append('th').text('2015').attr('class', 'female');
				tableHeader.append('th').text('2014').attr('class', 'female');

				var totals = _.last(rows);
				rows = _.take(rows, rows.length-1);

				var tableRows = table.selectAll("tr.data-row")
								.data(rows).enter()
								.append("tr")
								.attr('class', 'data-row');

				var maleColorScale = d3.scale.linear()
					.domain([0, 1759])
					.range(['white', '#666699']);

				var femaleColorScale = d3.scale.linear()
					.domain([0, 1759])
					.range(['white', '#993366']);

				var appendTd = function(rowElement, property, maleOrFemale) {
					rowElement.append("td")
						.attr("class", function(d, i) {
							return property + "-col " + maleOrFemale;
						})
						.text(_.property(property));
				}

				var appendTdWithSign = function(rowElement, property, maleOrFemale, applyStyles) {
					var prop = function(d) {
						var number = d[property]
						var sign = number > 0 ? "+" : "";
						return sign + number;
					};

					var el = rowElement.append("td")
						.attr("class", function(d, i) {
							return property + "-col " + maleOrFemale;
						})
						.text(prop);

					if (applyStyles) {
						el = el
							.style("background-color", function(d, i) {
								var colorScale = maleOrFemale === 'male' ? maleColorScale : femaleColorScale;
								return colorScale(d[property]);
							})
							.style("color", function(d, i) { return (d[property] > 1700 && i+1 !== rows.length) ? "#EFEFEF": "#333"; })
					}
					return el;

				}

				appendTd(tableRows, 'age');
				appendTd(tableRows, 'emigration_m_2014', 'male');
				appendTd(tableRows, 'emigration_m_2015', 'male');
				appendTdWithSign(tableRows, 'change_m', 'male', true);
				appendTdWithSign(tableRows, 'change_f', 'female', true);
				appendTd(tableRows, 'emigration_f_2015', 'female');
				appendTd(tableRows, 'emigration_f_2014', 'female');

				console.log(totals);
				var lastRow = table.append('tr').attr('class', 'last-row').datum(totals);

				appendTd(lastRow, 'age');
				appendTd(lastRow, 'emigration_m_2014', 'male');
				appendTd(lastRow, 'emigration_m_2015', 'male');
				appendTdWithSign(lastRow, 'change_m', 'male', false).style('color', "#333");
				appendTdWithSign(lastRow, 'change_f', 'female', false).style('color', "#333");
				appendTd(lastRow, 'emigration_f_2015', 'female');
				appendTd(lastRow, 'emigration_f_2014', 'female');
		 });

});
