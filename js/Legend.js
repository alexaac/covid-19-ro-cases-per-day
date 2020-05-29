// Legend
const statuses = [
    { status: 'total', color: 'var(--main-confirmate)', label: 'Cazuri confirmate'},
    { status: 'active', color: 'var(--main-active)', label: 'Active' },
    { status: 'healed', color: 'var(--main-recuperari)', label: 'Recuperări' },
    { status: 'dead', color: 'var(--main-decese)', label: 'Decese' }
];

export const drawLegend = (parentElement) => {
    let legend = d3.select(parentElement).append('g')
        .attr('transform', 'translate(260,250)');

    statuses.forEach((elem, i) => {
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
