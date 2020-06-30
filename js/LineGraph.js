import * as Helper from './Helper.js';

// LineGraph Class
export default class LineGraph {
    constructor (_parentElement, data, width, height, radius) {
        this.parentElement = _parentElement;
        this.data = data;
        this.svg_width = width;
        this.svg_height = height;
        this.r = radius;

        this.initViz();
    };
  
    initViz () {
        var viz = this;

        let language = d3.select('#language').node().value;

        viz.margin = {top: 10, right: 60, bottom: 0, left: 100},
        viz.width = viz.svg_width - viz.margin.left - viz.margin.right,
        viz.group_height = viz.svg_height * 2/3,
        viz.height = viz.group_height - viz.margin.top - viz.margin.bottom;
    
        // append the g object to the svg
        viz.g = d3.select(viz.parentElement)
            .append('g')
            .attr('class', 'line-group')
            .attr('transform',
                'translate(' + viz.margin.left + ',' + viz.margin.top + ')');

        // Set the ranges
        viz.linePathTotal = viz.g.append('g')
            .attr('class', 'total');
        viz.linePathTotalDay = viz.g.append('g')
            .attr('class', 'total_per_day');
        viz.linePathHealed = viz.g.append('g')
            .attr('class', 'healed');
        viz.linePathHealedDay = viz.g.append('g')
            .attr('class', 'healed_per_day');
        viz.linePathDead = viz.g.append('g')
            .attr('class', 'dead');
        viz.linePathDeadDay = viz.g.append('g')
            .attr('class', 'dead_per_day');
        viz.linePathActive = viz.g.append('g')
            .attr('class', 'active');
        viz.linePathActiveDay = viz.g.append('g')
            .attr('class', 'active_per_day');

        viz.nodesTotal = viz.g.append('g')
            .attr('class', 'node-total');
        viz.nodesTotalDay = viz.g.append('g')
            .attr('class', 'node-total-per-day');
        viz.nodesHealed = viz.g.append('g')
            .attr('class', 'node-healed');
        viz.nodesHealedDay = viz.g.append('g')
            .attr('class', 'node-healed-per-day');
        viz.nodesDead = viz.g.append('g')
            .attr('class', 'node-dead');
        viz.nodesDeadDay = viz.g.append('g')
            .attr('class', 'node-dead-per-day');
        viz.nodesActive = viz.g.append('g')
            .attr('class', 'node-active');
        viz.nodesActiveDay = viz.g.append('g')
            .attr('class', 'node-active-per-day');

        // Labels
        viz.yLabel = viz.g.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', -60)
            .attr('x', -(viz.group_height / 2))
            .attr('font-size', '16px')
            .attr('text-anchor', 'middle')
            .text(() => { return language === 'ro'
                ? 'Număr de persoane'
                : 'People' });

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

        // // Title
        // viz.title = viz.g.append('text')
        //     .attr('x', (viz.width / 2))
        //     .attr('y', 0 - (viz.margin.top / 4))
        //     .attr('text-anchor', 'middle')
        //     .style('font-size', '16px')
        //     .style('text-decoration', 'underline')
        //     .text('Evoluția cazurilor pe zile');

        d3.select('#min-x').property('value', viz.xScale.range()[0]);
        d3.select('#max-x').property('value', viz.xScale.range()[1]);

        viz.setupData();
    };

    setupData (newValues) {
        var viz = this;

        viz.dataFiltered = viz.data;

        viz.field = d3.select("#case-select").node().value;

        if (newValues !== undefined) {
            viz.dataFiltered = viz.dataFiltered.filter(d => ((d.date >= newValues[0]) && (d.date <= newValues[1])));
        };

        viz.updateViz();
    };

    updateViz () {
        var viz = this;

        d3.select(viz.parentElement).selectAll('circle').remove();
        d3.select(viz.parentElement).select('.line-group').selectAll('path').remove();

        if (viz.dataFiltered !== undefined) {

            // Set minimum Y to lowest graphic for all
            let minY = viz.field === 'all'
                    ? d3.min(viz.dataFiltered, d => d.total_dead)
                    : d3.min(viz.dataFiltered, d => d[viz.field]),
                maxY = viz.field === 'all'
                    ? d3.max(viz.dataFiltered, d => d.total_case)
                    : d3.max(viz.dataFiltered, d => d[viz.field]);

            // Update scales
            viz.xScale.domain(d3.extent(viz.dataFiltered, d => d.date));
            viz.yScale.domain([minY, maxY]).nice();

            // Update axes
            viz.xAxisCall.scale(viz.xScale);
            viz.xAxis.transition(Helper.transition).call(viz.xAxisCall.tickFormat(Helper.multiFormat));
            viz.yAxisCall.scale(viz.yScale);
            viz.yAxis.transition(Helper.transition).call(viz.yAxisCall);

            viz.xAxis.selectAll('text').attr('font-weight', 'bold');
            viz.yAxis.selectAll('text').attr('font-weight', 'bold');

            // Define the lines
            // Scatterplot

            // Total active cases
            if (viz.field === 'total_active' || viz.field === 'all') {
                viz.valueline_active = d3.line()
                    .x(d => d.total_active !== 0 ? viz.xScale(d.date) : null)
                    .y(d => viz.yScale(d.total_active));

                viz.linePathActive = d3.select('.active').selectAll("path")
                    .data(viz.dataFiltered)
                    .enter()
                    .append("path")
                        .attr('class', 'line_active')
                        .attr("d", function(d) { return viz.valueline_active(viz.dataFiltered); });

                viz.circles4_update = d3.select('.node-active')
                    .selectAll('circle')
                    .data(viz.dataFiltered);
                viz.circles4_update.exit()
                    .attr('class', 'exit')
                    .remove();
                viz.circles4_enter = viz.circles4_update.enter()
                    .append('circle')
                        .attr('class', 'dot_active')
                    .merge(viz.circles4_update)
                        // .transition(Helper.transition)
                            .attr('r', viz.r)
                            .attr('cx', d => d.total_active !== 0 ? viz.xScale(d.date) : null)
                            .attr('cy', d => viz.yScale(d.total_active));
            };

            // Total confirmed cases
            if (viz.field === 'total_case' || viz.field === 'all') {
                viz.valueline_total = d3.line()
                    .x(d => viz.xScale(d.date))
                    .y(d => viz.yScale(d.total_case));

                viz.linePathTotal = d3.select('.total').selectAll("path")
                    .data(viz.dataFiltered)
                    .enter()
                    .append("path")
                        .attr('class', 'line_total')
                        .attr("d", function(d) { return viz.valueline_total(viz.dataFiltered); });

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
                            .attr('r', viz.r)
                            .attr('cx', d => viz.xScale(d.date))
                            .attr('cy', d => viz.yScale(d.total_case));
            };
            // New confirmed cases
            if (viz.field === 'new_case_no') {
                viz.valueline_total = d3.line()
                    .x(d => viz.xScale(d.date))
                    .y(d => viz.yScale(d.new_case_no));

                viz.linePathTotal = d3.select('.total_per_day').selectAll("lines")
                    .data(viz.dataFiltered)
                    .enter()
                    .append("path")
                        .attr('class', 'line_total_per_day')
                        .attr("d", function(d) { return viz.valueline_total(viz.dataFiltered); });

                // Scatterplot
                viz.circles1_update = d3.select('.node-total-per-day')
                    .selectAll('circle')
                    .data(viz.dataFiltered);
                viz.circles1_update.exit()
                    .attr('class', 'exit')
                    .remove();
                viz.circles1_enter = viz.circles1_update.enter()
                    .append('circle')
                        .attr('class', 'dot_total')
                    .merge(viz.circles1_update)
                            .attr('r', viz.r)
                            .attr('cx', d => viz.xScale(d.date))
                            .attr('cy', d => viz.yScale(d.new_case_no));
            };

            // Total healed cases
            if (viz.field === 'total_healed' || viz.field === 'all') {
                viz.valueline_healed = d3.line()
                    .x(d => d.total_healed !== 0 ? viz.xScale(d.date) : null)
                    .y(d => viz.yScale(d.total_healed));

                viz.linePathHealed = d3.select('.healed').selectAll("lines")
                    .data(viz.dataFiltered)
                    .enter()
                    .append("path")
                        .attr('class', 'line_healed')
                        .attr("d", function(d) { return viz.valueline_healed(viz.dataFiltered); });

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
                            .attr('r', viz.r)
                            .attr('cx', d => d.total_healed !== 0 ? viz.xScale(d.date) : null)
                            .attr('cy', d => viz.yScale(d.total_healed));
            };
            // New healed cases
            if (viz.field === 'new_healed_no') {
                viz.valueline_healed = d3.line()
                    .x(d => viz.xScale(d.date))
                    .y(d => viz.yScale(d.new_healed_no));

                viz.linePathHealed = d3.select('.healed_per_day').selectAll("lines")
                    .data(viz.dataFiltered)
                    .enter()
                    .append("path")
                        .attr('class', 'line_healed_per_day')
                        .attr("d", function(d) { return viz.valueline_healed(viz.dataFiltered); });

                viz.circles2_update = d3.select('.node-healed-per-day')
                    .selectAll('circle')
                    .data(viz.dataFiltered);
                viz.circles2_update.exit()
                    .attr('class', 'exit')
                    .remove();
                viz.circles2_enter = viz.circles2_update.enter()
                    .append('circle')
                        .attr('class', 'dot_healed')
                    .merge(viz.circles2_update)
                            .attr('r', viz.r)
                            .attr('cx', d => viz.xScale(d.date))
                            .attr('cy', d => viz.yScale(d.new_healed_no));
            };

            // Total dead cases
            if (viz.field === 'total_dead' || viz.field === 'all') {
                viz.valueline_dead = d3.line()
                    .x(d => d.total_dead !== 0 ? viz.xScale(d.date) : null)
                    .y(d => viz.yScale(d.total_dead));

                viz.linePathDead = d3.select('.dead').selectAll("lines")
                    .data(viz.dataFiltered)
                    .enter()
                    .append("path")
                        .attr('class', 'line_dead')
                        .attr("d", function(d) { return viz.valueline_dead(viz.dataFiltered); });

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
                            .attr('r', viz.r)
                            .attr('cx', d => d.total_dead !== 0 ? viz.xScale(d.date) : null)
                            .attr('cy', d => viz.yScale(d.total_dead));
            };
            // New dead cases
            if (viz.field === 'new_dead_no') {
                viz.valueline_dead = d3.line()
                    .x(d => viz.xScale(d.date))
                    .y(d => viz.yScale(d.new_dead_no));

                viz.linePathDead = d3.select('.dead_per_day').selectAll("lines")
                    .data(viz.dataFiltered)
                    .enter()
                    .append("path")
                        .attr('class', 'line_dead_per_day')
                        .attr("d", function(d) { return viz.valueline_dead(viz.dataFiltered); });

                viz.circles3_update = d3.select('.node-dead-per-day')
                    .selectAll('circle')
                    .data(viz.dataFiltered);
                viz.circles3_update.exit()
                    .attr('class', 'exit')
                    .remove();
                viz.circles3_enter = viz.circles3_update.enter()
                    .append('circle')
                        .attr('class', 'dot_dead')
                    .merge(viz.circles3_update)
                            .attr('r', viz.r)
                            .attr('cx', d => viz.xScale(d.date))
                            .attr('cy', d => viz.yScale(d.new_dead_no));
            };

            // Set focus and tooltip on nodes on mousemove
            Helper.setFocus(viz.g, viz.xScale, viz.yScale, viz.width, viz.height, viz.dataFiltered);
        };
    };
}
