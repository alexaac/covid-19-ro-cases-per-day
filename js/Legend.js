// Legend
const statuses = (language) => {
    return [
        { status: 'active', color: 'var(--main-active)', label: () => { return language === 'ro' ? 'Cazuri active' : 'Active cases'} },
        { status: 'total', color: 'var(--main-confirmate)', label: () => { return language === 'ro' ? 'Confirmate' : 'Confirmed'} },
        { status: 'healed', color: 'var(--main-recuperari)', label: () => { return language === 'ro' ? 'Recuperări' : 'Recovered' }},
        { status: 'dead', color: 'var(--main-decese)', label: () => { return language === 'ro' ? 'Decese' : 'Deceased' }}
    ]
};

export const drawLegend = (parentElement) => {
    let legend = d3.select(parentElement).append('g')
        .attr('transform', 'translate(220,10)');

    let language = d3.select('#language').node().value;

    statuses(language).forEach((elem, i) => {
        const legendRow = legend.append('g')
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
}
