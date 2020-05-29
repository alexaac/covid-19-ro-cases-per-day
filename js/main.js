import * as Helper from './Helper.js';
import * as Legend from './Legend.js';
import LineGraph from './LineGraph.js';
import TimeBrush from './TimeBrush.js';

let lineGraph, timeBrush, cases_data;

(() => {
    // https://bl.ocks.org/d3noob/a44d21b304b9f7260a284b1883232002/1b3a420bb9f51c00003974fda2497625380c7cb9
    // https://github.com/adamjanes
    
    // Get the data
    const promises = [
        d3.json('https://covid19.geo-spatial.org/api/dashboard/getDailyCaseReport')
    ];

    Promise.all(promises).then( data => {

        cases_data = data[0].data.data;

        // parse the date / time
        const parseTime = d3.timeParse('%Y-%m-%d');

        // format the data
        cases_data.forEach(d => {
            d.date = parseTime(d.day_case);
            d.date.toLocaleDateString('ro-RO');
            d.total_case = +d.total_case;
            d.total_healed = +d.total_healed;
            d.total_dead = +d.total_dead;
            d.total_active = d.total_case - (d.total_healed + d.total_dead);
        });

        changeView();
    }).catch( 
        error => console.log(error)
    );

    const changeView = () => {
        let width = 1200,
            height = 760;

        // append the svg object to the chart div
        let svg = d3.select('#chart')
            .append('svg')
            .attr('class', 'chart-group')
            .attr('preserveAspectRatio', 'xMinYMin meet')
            .attr('width', width)
            .attr('height', height)
            .attr('viewBox', '0 0 ' + width + ' ' + height);

        // Set object for nodes by time
        lineGraph = new LineGraph('.chart-group', cases_data, width, height);
        lineGraph.setupData();

        timeBrush = new TimeBrush('.chart-group', cases_data, lineGraph, width, height);
        timeBrush.setupData();

        Legend.drawLegend('.chart-group');

        // Start/stop the brush animation
        var flag = false;

        d3.select('#play-cases')
            .on('click', () => {
                d3.select('#play-cases').classed('hide', true);
                d3.select('#pause-cases').classed('hide', false);
                flag = true;
                Helper.animateBrush(timeBrush, flag);
            });
        d3.select('#pause-cases')
            .on('click', () => {
                d3.select('#pause-cases').classed('hide', true);
                d3.select('#play-cases').classed('hide',false);
                flag = false;
            });

    };

}).call(this);