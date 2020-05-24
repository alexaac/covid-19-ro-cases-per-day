const locale = d3.timeFormatLocale({
    "dateTime": "%A, %e %B %Y г. %X",
    "date": "%d.%m.%Y",
    "time": "%H:%M:%S",
    "periods": ["AM", "PM"],
    "days": ["Luni", "Marți", "Miercuri", "Joi", "Vineri", "Sâmbătă", "Duminică"],
    "shortDays": ["Lu", "Ma", "Mi", "Jo", "Vi", "Sa", "Du"],
    "months": ["Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie", "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie"],
    "shortMonths": ["Ian", "Feb", "Mart", "Apr", "Mai", "Iun", "Iul", "Aug", "Sept", "Oct", "Nov", "Dec"]
});

const formatMillisecond = locale.format(".%L"),
    formatSecond = locale.format(":%S"),
    formatMinute = locale.format("%I:%M"),
    formatHour = locale.format("%I %p"),
    formatDay = locale.format("%a %d"),
    formatWeek = locale.format("%b %d"),
    formatMonth = locale.format("%B"),
    formatYear = locale.format("%Y");

const multiFormat = (date) => {
    return (d3.timeSecond(date) < date ? formatMillisecond
        : d3.timeMinute(date) < date ? formatSecond
        : d3.timeHour(date) < date ? formatMinute
        : d3.timeDay(date) < date ? formatHour
        : d3.timeMonth(date) < date ? (d3.timeWeek(date) < date ? formatDay : formatWeek)
        : d3.timeYear(date) < date ? formatMonth
        : formatYear)(date);
};

// Tooltip Code
const tooltip_div = d3.select("body")
    .append("tooltip_div")
    .attr("class", "tooltip")
    .style("opacity", 0);

const highlight = (d) => {
    tooltip_div.transition()
        .duration(200)
        .style("opacity", .9);
    tooltip_div.html(tooltipHTML(d))
        .style("left", (d3.event.pageX/1.5) + "px")
        .style("top", (d3.event.pageY/1.5) + "px");
    };

const tooltipHTML = (d) => {
    const ro_date = d3.timeFormat("%Y-%m-%d")(d.date);
    return "<b>Ziua " + d.day_no + " (" + ro_date + ")</b><br />" +
            "Cazuri confirmate noi: " + d.new_case_no + "<br />" +
            "Cazuri confirmate total: " + d.total_case + "<br />" +
            "Recuperări noi: " + d.new_healed_no + "<br />" +
            "Recuperări total: " + d.total_healed + "<br />" +
            "Decese noi: " + d.new_dead_no + "<br />" +
            "Decese total: " + d.total_dead + "<br />";
};

// LineChart Class
export default class LineChart {
    constructor (_parentElement, data) {
        this.parentElement = _parentElement;
        this.data = data;

        this.initViz();
    };
  
    initViz () {
        var viz = this;

        viz.margin = {top: 50, right: 50, bottom: 50, left: 100},
        viz.width = 960 - viz.margin.left - viz.margin.right,
        viz.height = 500 - viz.margin.top - viz.margin.bottom,
        viz.svg_width = viz.width + viz.margin.left + viz.margin.right,
        viz.svg_height = viz.height + viz.margin.top + viz.margin.bottom;
    
        // append the svg object to the chart div
        viz.svg = d3.select(viz.parentElement)
            .append("svg")
            .attr("class", "chart-group")
            .attr("preserveAspectRatio", "xMidYMid")
            .attr("width", viz.svg_width)
            .attr("height", viz.svg_height)
            .attr('viewBox', '0 0 ' + viz.svg_width + ' ' + viz.svg_height)
                .append("g")
                    .attr("transform",
                    "translate(" + viz.margin.left + "," + viz.margin.top + ")");

        viz.t = function() { return d3.transition().duration(1000); };

        viz.bisectDate = d3.bisector(function(d) { return d.date; }).left;
        
        // Set the ranges

        viz.linePathTotal = viz.svg.append("path")
            .attr("class", "line_total");
        viz.linePathHealed = viz.svg.append("path")
            .attr("class", "line_healed");
        viz.linePathDead = viz.svg.append("path")
            .attr("class", "line_dead");

        // Labels
        viz.xLabel = viz.svg.append("text")
            .attr("y", viz.height + 50)
            .attr("x", viz.width / 2)
            .attr("font-size", "16px")
            .attr("text-anchor", "middle")
            .text("Perioadă de timp");
        viz.yLabel = viz.svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", -50)
            .attr("x", -170)
            .attr("font-size", "16px")
            .attr("text-anchor", "middle")
            .text("Număr de persoane");

        // Set scales
        viz.xScale = d3.scaleTime().range([0, viz.width]);
        viz.yScale = d3.scaleLinear().range([viz.height, 0]);
    
        viz.yAxisCall = d3.axisLeft().ticks(5);
        viz.xAxisCall = d3.axisBottom().ticks(5);
    
        viz.xAxis = viz.svg.append('g')
            .attr("class", "line-chart-x")
            .attr('transform', `translate(0,${viz.height})`);
        viz.yAxis = viz.svg.append('g')
            .attr('class', 'line-chart-y');

        // Title
        viz.title = viz.svg.append("text")
            .attr("x", (viz.width / 2))
            .attr("y", 0 - (viz.margin.top / 4))
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("text-decoration", "underline")
            .text("Evoluția cazurilor pe zile");

        // Legend
        const statuses = [
            { status: "total", color: "var(--main-confirmate)", label: "Cazuri confirmate"},
            { status: "healed", color: "var(--main-recuperari)", label: "Recuperări" },
            { status: "dead", color: "var(--main-decese)", label: "Decese" }
        ];

        viz.legend = viz.svg.append("g")
            .attr("transform", "translate(130,0)");

        statuses.forEach(function(elem, i){
            const legendRow = viz.legend.append("g")
                .attr("transform", "translate(0, " + (i * 20) + ")");

            legendRow.append("rect")
                .attr("width", 10)
                .attr("height", 10)
                .attr("fill", elem.color);

            legendRow.append("text")
                .attr("x", -10)
                .attr("y", 10)
                .attr("text-anchor", "end")
                .style("text-transform", "capitalize")
                .text(elem.label);
        });

        viz.setupData();
    };

    setupData () {
        var viz = this;

        viz.dataFiltered = viz.data;
        
        viz.updateVis();
    };

    updateVis () {
        var viz = this;

        if (viz.dataFiltered !== undefined) {
            console.log(viz.dataFiltered);

            // Update scales
            viz.xScale.domain(d3.extent(viz.dataFiltered, d => d.date));
            viz.yScale.domain([0, d3.max(viz.dataFiltered, d => d.total_case)]);

            // viz.xScale.domain(d3.extent(viz.dataFiltered, d => d.date));
            // viz.yScale.domain(d3.extent(viz.dataFiltered, d => d.dayOrder));

            // Update axes
            viz.xAxisCall.scale(viz.xScale);
            viz.xAxis.transition(viz.t()).call(viz.xAxisCall.tickFormat(multiFormat));
            viz.yAxisCall.scale(viz.yScale);
            viz.yAxis.transition(viz.t()).call(viz.yAxisCall);

            viz.xAxis.selectAll('text').attr("font-weight", "bold");
            viz.yAxis.selectAll('text').attr("font-weight", "bold");

            // Tooltip Code

            const focus = viz.svg.append("g")
                .attr("class", "focus")
                .style("display", "none");

            focus.append("line")
                .attr("class", "x-hover-line hover-line")
                .attr("y1", 0)
                .attr("y2", viz.height);

            focus.append("line")
                .attr("class", "y-hover-line hover-line")
                .attr("x1", 0)
                .attr("x2", viz.width);

            focus.append("circle")
                .attr("r", 5.5);

            focus.append("text")
                .attr("x", 0)
                .attr("dy", "-1em");

            viz.svg.append("rect")
                .attr("class", "overlay")
                .attr("width", viz.width)
                .attr("height", viz.height)
                .on("mouseover", function() { focus.style("display", null); tooltip_div.style("display", null); })
                .on("mouseout", function() { focus.style("display", "none"); tooltip_div.style("display", "none"); })
                .on("mousemove", mousemove);

            function mousemove() {
                const x0 = viz.xScale.invert(d3.mouse(this)[0]),
                    i = viz.bisectDate(viz.dataFiltered, x0, 1),
                    d0 = viz.dataFiltered[i - 1],
                    d1 = viz.dataFiltered[i],
                    d = x0 - d0.date > d1.date - x0 ? d1 : d0;
                focus.attr("transform", "translate(" + viz.xScale(d.date) + "," + viz.yScale(d.total_case) + ")");
                // focus.select("text").html("Ziua " + d.day_no);
                focus.select(".x-hover-line").attr("y2", viz.height - viz.yScale(d.total_case));
                focus.select(".y-hover-line").attr("x2", - viz.xScale(d.date));
                highlight(d);
            }

            // Define the lines
            viz.valueline_total = d3.line()
                .x(function(d) { return viz.xScale(d.date); })
                .y(function(d) { return viz.yScale(d.total_case); });

            viz.valueline_healed = d3.line()
                .x(function(d) { return d.total_healed !== 0 ? viz.xScale(d.date) : null; })
                .y(function(d) { return viz.yScale(d.total_healed); });

            viz.valueline_dead = d3.line()
                .x(function(d) { return d.total_dead !== 0 ? viz.xScale(d.date) : null; })
                .y(function(d) { return viz.yScale(d.total_dead); });

            viz.svg.select(".line_total")
                .transition(viz.t)
                .attr("d", viz.valueline_total(viz.dataFiltered));
            viz.svg.select(".line_healed")
                .transition(viz.t)
                .attr("d", viz.valueline_healed(viz.dataFiltered));
            viz.svg.select(".line_dead")
                .transition(viz.t)
                .attr("d", viz.valueline_dead(viz.dataFiltered));

            // Scatterplot
            viz.svg.selectAll("dot")
                .data(viz.dataFiltered)
                .enter().append("circle")
                    .attr("r", 3)
                    .attr("class", "dot_total")
                    .attr("cx", function(d) { return viz.xScale(d.date); })
                    .attr("cy", function(d) { return viz.yScale(d.total_case); });

            viz.svg.selectAll("dot")
                .data(viz.dataFiltered)
                .enter().append("circle")
                    .attr("r", 3)
                    .attr("class", "dot_healed")
                    .attr("cx", function(d) { return d.total_healed !== 0 ? viz.xScale(d.date) : null; })
                    .attr("cy", function(d) { return viz.yScale(d.total_healed); });

            viz.svg.selectAll("dot")
                .data(viz.dataFiltered)
                .enter().append("circle")
                    .attr("r", 3)
                    .attr("class", "dot_dead")
                    .attr("cx", function(d) { return d.total_dead !== 0 ? viz.xScale(d.date) : null; })
                    .attr("cy", function(d) { return viz.yScale(d.total_dead); });
            };
    };
}
