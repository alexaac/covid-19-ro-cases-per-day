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

export const multiFormat = (date) => {
    return (d3.timeSecond(date) < date ? formatMillisecond
        : d3.timeMinute(date) < date ? formatSecond
        : d3.timeHour(date) < date ? formatMinute
        : d3.timeDay(date) < date ? formatHour
        : d3.timeMonth(date) < date ? (d3.timeWeek(date) < date ? formatDay : formatWeek)
        : d3.timeYear(date) < date ? formatMonth
        : formatYear)(date);
};

// Tooltip Code
export const setFocus = (parentElement, xScale, yScale, width, height, dataFiltered) => {
    let focus = parentElement.append('g')
        .attr('class', 'focus')
        .style('display', 'none');

    focus.append('line')
        .attr('class', 'x-hover-line hover-line')
        .attr('y1', 0)
        .attr('y2', height);

    focus.append('line')
        .attr('class', 'y-hover-line hover-line')
        .attr('x1', 0)
        .attr('x2', width);

    focus.append('circle')
        .attr('r', 5.5);

    focus.append('text')
        .attr('x', 0)
        .attr('dy', '-1em');

    parentElement.append('rect')
        .attr('class', 'overlay')
        .attr('width', width)
        .attr('height', height)
        .on('mouseover', () => { focus.style('display', null); tooltip_div.style('display', null); })
        .on('mouseout', () => { focus.style('display', 'none'); tooltip_div.style('display', 'none'); })
        .on('mousemove', mousemove);

    let bisectDate = d3.bisector(d => d.date).left;

    function mousemove() {
        const x0 = xScale.invert(d3.mouse(this)[0]),
            i = bisectDate(dataFiltered, x0, 1),
            d0 = dataFiltered[i - 1],
            d1 = dataFiltered[i],
            d = x0 - d0.date > d1.date - x0 ? d1 : d0;
        focus.attr('transform', 'translate(' + xScale(d.date) + ',' + yScale(d.total_case) + ')');
        focus.select('.x-hover-line').attr('y2', height - yScale(d.total_case));
        focus.select('.y-hover-line').attr('x2', - xScale(d.date));
        highlight(d);
    }
}

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
            'Cazuri active total: ' + d.total_active + '<br />' +
            'Cazuri confirmate noi: ' + d.new_case_no + '<br />' +
            'Cazuri confirmate total: ' + d.total_case + '<br />' +
            'Recuperări noi: ' + d.new_healed_no + '<br />' +
            'Recuperări total: ' + d.total_healed + '<br />' +
            'Decese noi: ' + d.new_dead_no + '<br />' +
            'Decese total: ' + d.total_dead + '<br />';
};

export const transition = () => d3.transition().duration(1000);