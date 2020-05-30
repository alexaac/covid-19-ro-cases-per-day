import * as Helper from './Helper.js';

// LineGraph Class
export default class LineGraph {
    constructor (_parentElement, data, width, height) {
        this.parentElement = _parentElement;
        this.data = data;
        this.svg_width = width;
        this.svg_height = height;

        this.initViz();
    };
  
    initViz () {
        var viz = this;

        viz.margin = {top: 50, right: 60, bottom: 0, left: 100},
        viz.width = viz.svg_width - viz.margin.left - viz.margin.right,
        viz.group_height = viz.svg_height * 3/4,
        viz.height = viz.group_height - viz.margin.top - viz.margin.bottom;
    
        // append the g object to the svg
        viz.g = d3.select(viz.parentElement)
            .append('g')
            .attr('transform',
                'translate(' + viz.margin.left + ',' + viz.margin.top + ')');

        // Set the ranges
        viz.linePathTotal = viz.g.append('path')
            .attr('class', 'line_total');
        viz.linePathHealed = viz.g.append('path')
            .attr('class', 'line_healed');
        viz.linePathDead = viz.g.append('path')
            .attr('class', 'line_dead');
        viz.linePathActive = viz.g.append('path')
            .attr('class', 'line_active');

        viz.nodesTotal = viz.g.append('g')
            .attr('class', 'node-total');
        viz.nodesHealed = viz.g.append('g')
            .attr('class', 'node-healed');
        viz.nodesDead = viz.g.append('g')
            .attr('class', 'node-dead');
        viz.nodesActive = viz.g.append('g')
            .attr('class', 'node-active');

        // Labels
        viz.yLabel = viz.g.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', -60)
            .attr('x', -(viz.group_height / 2))
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
            viz.xAxis.transition(Helper.transition).call(viz.xAxisCall.tickFormat(Helper.multiFormat));
            viz.yAxisCall.scale(viz.yScale);
            viz.yAxis.transition(Helper.transition).call(viz.yAxisCall);

            viz.xAxis.selectAll('text').attr('font-weight', 'bold');
            viz.yAxis.selectAll('text').attr('font-weight', 'bold');

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

            viz.valueline_active = d3.line()
                .x(d => d.total_active !== 0 ? viz.xScale(d.date) : null)
                .y(d => viz.yScale(d.total_active));

            viz.linePathTotal
                // .transition(Helper.transition)
                .attr('d', viz.valueline_total(viz.dataFiltered));
            viz.linePathHealed
                // .transition(Helper.transition)
                .attr('d', viz.valueline_healed(viz.dataFiltered));
            viz.linePathDead
                // .transition(Helper.transition)
                .attr('d', viz.valueline_dead(viz.dataFiltered));
            viz.linePathActive
                // .transition(Helper.transition)
                .attr('d', viz.valueline_active(viz.dataFiltered));

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
                    // .transition(Helper.transition)
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
                    // .transition(Helper.transition)
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
                    // .transition(Helper.transition)
                        .attr('r', 3)
                        .attr('cx', d => d.total_dead !== 0 ? viz.xScale(d.date) : null)
                        .attr('cy', d => viz.yScale(d.total_dead));

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
                        .attr('r', 3)
                        .attr('cx', d => d.total_active !== 0 ? viz.xScale(d.date) : null)
                        .attr('cy', d => viz.yScale(d.total_active));

            // Set focus and tooltip on nodes on mousemove
            Helper.setFocus(viz.g, viz.xScale, viz.yScale, viz.width, viz.height, viz.dataFiltered);
        };
    };
}
