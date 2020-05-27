
// TimeBrush Class
export default class TimeBrush {
    constructor (_parentElement, data, lineGraph) {
        this.parentElement = _parentElement;
        this.data = data;
        this.lineGraph = lineGraph;

        this.initViz();
    };

    initViz () {
        var viz = this;

        viz.margin = {top: 10, right: 60, bottom: 10, left: 140},
        viz.width = (d3.select(viz.parentElement).node()
            .getBoundingClientRect().width - viz.margin.left - viz.margin.right),
        viz.height = 150 - viz.margin.top - viz.margin.bottom;

        // append the svg object to the chart div   
        viz.g = d3.select(viz.parentElement)
            .append('g')
            .attr('transform',
                'translate(' + viz.margin.left + ',' + (viz.lineGraph.height + viz.margin.top + 100) + ')');
        
        viz.t = () => { return d3.transition().duration(1000); }

        viz.bisectDate = d3.bisector(d => d.date).left;

        // Set scales
        viz.xScale = d3.scaleTime().range([0, viz.width]);
        viz.yScale = d3.scaleLinear().range([viz.height, 0]);

        viz.xAxisCall = d3.axisBottom().ticks(5);

        viz.xAxis = viz.g.append('g')
            .attr('class', 'line-chart-x')
            .attr('transform', `translate(0,${viz.height})`);

        // Labels
        viz.xLabel = viz.g.append('text')
            .attr('y', viz.height + 50)
            .attr('x', viz.width / 2)
            .attr('font-size', '16px')
            .attr('text-anchor', 'middle')
            .text('Perioadă de timp');

        viz.areaPath = viz.g.append('path')
            .attr('class', 'area-path');

        // Initialize brush component
        viz.brushed = () => {
            var selection = d3.event.selection || viz.xScale.range();
            var newValues = selection.map(viz.xScale.invert);
        
            viz.lineGraph.setupData(newValues);
        };
        
        viz.brush = d3.brushX()
            .handleSize(10)
            .extent([[0, 0], [viz.width, viz.height]])
            .on('brush', viz.brushed);

        // Append brush component
        viz.brushComponent = viz.g.append('g')
            .attr('class', 'brush')
            .call(viz.brush);

        viz.setupData();
    };

    setupData () {
        var viz = this;

        viz.dataFiltered = viz.data;

        viz.updateViz();
    };

    updateViz () {
        var viz = this;

        // Update scales
        viz.xScale.domain(d3.extent(viz.dataFiltered, d => d.date));
        viz.yScale.domain([0, d3.max(viz.dataFiltered, d => d.total_case)]);

        // Update axes
        viz.xAxisCall.scale(viz.xScale);
        viz.xAxis.transition(viz.t()).call(viz.xAxisCall.tickFormat(viz.lineGraph.multiFormat));

        viz.xAxis.selectAll('text').attr('font-weight', 'bold');

        viz.area = d3.area()
            .x(d => viz.xScale(d.date))
            .y0(viz.height)
            .y1(d => viz.yScale(d.total_case))

        viz.areaPath
            .data([viz.dataFiltered])
            .attr('d', viz.area);
    };
};