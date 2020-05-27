const locale = d3.timeFormatLocale({
    'dateTime': '%A, %e %B %Y г. %X',
    'date': '%d.%m.%Y',
    'time': '%H:%M:%S',
    'periods': ['AM', 'PM'],
    'days': ['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă', 'Duminică'],
    'shortDays': ['Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sa', 'Du'],
    'months': ['Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie', 'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'],
    'shortMonths': ['Ian', 'Feb', 'Mart', 'Apr', 'Mai', 'Iun', 'Iul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec']
});

const formatMillisecond = locale.format('.%L'),
    formatSecond = locale.format(':%S'),
    formatMinute = locale.format('%I:%M'),
    formatHour = locale.format('%I %p'),
    formatDay = locale.format('%a %d'),
    formatWeek = locale.format('%b %d'),
    formatMonth = locale.format('%B'),
    formatYear = locale.format('%Y');

// Tooltip Code
const tooltip_div = d3.select('body')
    .append('tooltip_div')
    .attr('class', 'tooltip')
    .style('opacity', 0);

const highlight = (d) => {
    tooltip_div.transition()
        .duration(200)
        .style('opacity', .9);
    tooltip_div.html(tooltipHTML(d))
        .style('left', (d3.event.pageX/1.5) + 'px')
        .style('top', (d3.event.pageY/1.5) + 'px');
    };

const tooltipHTML = (d) => {
    const ro_date = d3.timeFormat('%Y-%m-%d')(d.date);
    return '<b>Ziua ' + d.day_no + ' (' + ro_date + ')</b><br />' +
            'Cazuri confirmate noi: ' + d.new_case_no + '<br />' +
            'Cazuri confirmate total: ' + d.total_case + '<br />' +
            'Recuperări noi: ' + d.new_healed_no + '<br />' +
            'Recuperări total: ' + d.total_healed + '<br />' +
            'Decese noi: ' + d.new_dead_no + '<br />' +
            'Decese total: ' + d.total_dead + '<br />';
};

// LineGraph Class
export default class LineGraph {
    constructor (_parentElement, data) {
        this.parentElement = _parentElement;
        this.data = data;

        this.initViz();
    };
  
    initViz () {
        var viz = this;

        viz.margin = {top: 50, right: 100, bottom: 10, left: 100},
        viz.width = (d3.select(viz.parentElement).node()
            .getBoundingClientRect().width - viz.margin.left - viz.margin.right),
        viz.height = 500 - viz.margin.top - viz.margin.bottom;
    
        // append the g object to the svg
        viz.g = d3.select(viz.parentElement)
            .append('g')
            .attr('transform',
                'translate(' + viz.margin.left + ',' + viz.margin.top + ')');

        viz.t = () => d3.transition().duration(1000);

        viz.bisectDate = d3.bisector(d => d.date).left;
        
        // Set the ranges
        viz.linePathTotal = viz.g.append('path')
            .attr('class', 'line_total');
        viz.linePathHealed = viz.g.append('path')
            .attr('class', 'line_healed');
        viz.linePathDead = viz.g.append('path')
            .attr('class', 'line_dead');

        viz.nodesTotal = viz.g.append('g')
            .attr('class', 'node-total');
        viz.nodesHealed = viz.g.append('g')
            .attr('class', 'node-healed');
        viz.nodesDead = viz.g.append('g')
            .attr('class', 'node-dead');

        // Labels
        viz.yLabel = viz.g.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', -50)
            .attr('x', -170)
            .attr('font-size', '16px')
            .attr('text-anchor', 'middle')
            .text('Număr de persoane');

        // Set scales
        viz.xScale = d3.scaleTime().range([0, viz.width]);
        viz.yScale = d3.scaleLinear().range([viz.height, 0]);
    
        viz.yAxisCall = d3.axisLeft().ticks(5);
        viz.xAxisCall = d3.axisBottom().ticks(5);
    
        viz.xAxis = viz.g.append('g')
            .attr('class', 'line-chart-x')
            .attr('transform', `translate(0,${viz.height})`);
        viz.yAxis = viz.g.append('g')
            .attr('class', 'line-chart-y');

        // Title
        viz.title = viz.g.append('text')
            .attr('x', (viz.width / 2))
            .attr('y', 0 - (viz.margin.top / 4))
            .attr('text-anchor', 'middle')
            .style('font-size', '16px')
            .style('text-decoration', 'underline')
            .text('Evoluția cazurilor pe zile');

        // Legend
        const statuses = [
            { status: 'total', color: 'var(--main-confirmate)', label: 'Cazuri confirmate'},
            { status: 'healed', color: 'var(--main-recuperari)', label: 'Recuperări' },
            { status: 'dead', color: 'var(--main-decese)', label: 'Decese' }
        ];

        viz.legend = viz.g.append('g')
            .attr('transform', 'translate(130,0)');

        statuses.forEach((elem, i) => {
            const legendRow = viz.legend.append('g')
                .attr('transform', 'translate(0, ' + (i * 20) + ')');

            legendRow.append('rect')
                .attr('width', 10)
                .attr('height', 10)
                .attr('fill', elem.color);

            legendRow.append('text')
                .attr('x', -10)
                .attr('y', 10)
                .attr('text-anchor', 'end')
                .style('text-transform', 'capitalize')
                .text(elem.label);
        });

        viz.multiFormat = (date) => {
            return (d3.timeSecond(date) < date ? formatMillisecond
                : d3.timeMinute(date) < date ? formatSecond
                : d3.timeHour(date) < date ? formatMinute
                : d3.timeDay(date) < date ? formatHour
                : d3.timeMonth(date) < date ? (d3.timeWeek(date) < date ? formatDay : formatWeek)
                : d3.timeYear(date) < date ? formatMonth
                : formatYear)(date);
        };
        
        viz.setupData();
    };

    setupData (newValues) {
        var viz = this;

        viz.dataFiltered = viz.data;

        if (newValues !== undefined) {
            viz.dataFiltered = viz.data.filter(d => ((d.date >= newValues[0]) && (d.date <= newValues[1])));
        };

        viz.updateViz();
    };

    updateViz () {
        var viz = this;

        if (viz.dataFiltered !== undefined) {
            // Update scales
            viz.xScale.domain(d3.extent(viz.dataFiltered, d => d.date));
            viz.yScale.domain([0, d3.max(viz.dataFiltered, d => d.total_case)]);

            // Update axes
            viz.xAxisCall.scale(viz.xScale);
            viz.xAxis.transition(viz.t()).call(viz.xAxisCall.tickFormat(viz.multiFormat));
            viz.yAxisCall.scale(viz.yScale);
            viz.yAxis.transition(viz.t()).call(viz.yAxisCall);

            viz.xAxis.selectAll('text').attr('font-weight', 'bold');
            viz.yAxis.selectAll('text').attr('font-weight', 'bold');

            // Tooltip Code
            const focus = viz.g.append('g')
                .attr('class', 'focus')
                .style('display', 'none');

            focus.append('line')
                .attr('class', 'x-hover-line hover-line')
                .attr('y1', 0)
                .attr('y2', viz.height);

            focus.append('line')
                .attr('class', 'y-hover-line hover-line')
                .attr('x1', 0)
                .attr('x2', viz.width);

            focus.append('circle')
                .attr('r', 5.5);

            focus.append('text')
                .attr('x', 0)
                .attr('dy', '-1em');

            viz.g.append('rect')
                .attr('class', 'overlay')
                .attr('width', viz.width)
                .attr('height', viz.height)
                .on('mouseover', () => { focus.style('display', null); tooltip_div.style('display', null); })
                .on('mouseout', () => { focus.style('display', 'none'); tooltip_div.style('display', 'none'); })
                .on('mousemove', mousemove);

            function mousemove() {
                const x0 = viz.xScale.invert(d3.mouse(this)[0]),
                    i = viz.bisectDate(viz.dataFiltered, x0, 1),
                    d0 = viz.dataFiltered[i - 1],
                    d1 = viz.dataFiltered[i],
                    d = x0 - d0.date > d1.date - x0 ? d1 : d0;
                focus.attr('transform', 'translate(' + viz.xScale(d.date) + ',' + viz.yScale(d.total_case) + ')');
                // focus.select('text').html('Ziua ' + d.day_no);
                focus.select('.x-hover-line').attr('y2', viz.height - viz.yScale(d.total_case));
                focus.select('.y-hover-line').attr('x2', - viz.xScale(d.date));
                highlight(d);
            }

            // Define the lines
            viz.valueline_total = d3.line()
                .x(d => viz.xScale(d.date))
                .y( d => viz.yScale(d.total_case));

            viz.valueline_healed = d3.line()
                .x(d => d.total_healed !== 0 ? viz.xScale(d.date) : null)
                .y(d => viz.yScale(d.total_healed));

            viz.valueline_dead = d3.line()
                .x(d => d.total_dead !== 0 ? viz.xScale(d.date) : null)
                .y(d => viz.yScale(d.total_dead));

            viz.linePathTotal.transition(viz.t)
                .attr('d', viz.valueline_total(viz.dataFiltered));
            viz.linePathHealed.transition(viz.t)
                .attr('d', viz.valueline_healed(viz.dataFiltered));
            viz.linePathDead.transition(viz.t)
                .attr('d', viz.valueline_dead(viz.dataFiltered));

            // Scatterplot
            viz.circles1_update = d3.select('.node-total')
                .selectAll('circle')
                .data(viz.dataFiltered);
            viz.circles1_update.exit()
                .attr('class', 'exit')
                .remove();
            viz.circles1_enter = viz.circles1_update.enter()
                .append('circle')
                    .attr('class', 'dot_total')
                .merge(viz.circles1_update)
                    .transition(viz.t)
                        .attr('r', 3)
                        .attr('cx', d => viz.xScale(d.date))
                        .attr('cy', d => viz.yScale(d.total_case));

            viz.circles2_update = d3.select('.node-healed')
                .selectAll('circle')
                .data(viz.dataFiltered);
            viz.circles2_update.exit()
                .attr('class', 'exit')
                .remove();
            viz.circles2_enter = viz.circles2_update.enter()
                .append('circle')
                    .attr('class', 'dot_healed')
                .merge(viz.circles2_update)
                    .transition(viz.t)
                        .attr('r', 3)
                        .attr('cx', d => d.total_healed !== 0 ? viz.xScale(d.date) : null)
                        .attr('cy', d => viz.yScale(d.total_healed));

            viz.circles3_update = d3.select('.node-dead')
                .selectAll('circle')
                .data(viz.dataFiltered);
            viz.circles3_update.exit()
                .attr('class', 'exit')
                .remove();
            viz.circles3_enter = viz.circles3_update.enter()
                .append('circle')
                    .attr('class', 'dot_dead')
                .merge(viz.circles3_update)
                    .transition(viz.t)
                        .attr('r', 3)
                        .attr('cx', d => d.total_dead !== 0 ? viz.xScale(d.date) : null)
                        .attr('cy', d => viz.yScale(d.total_dead));          
        };
    };
}
