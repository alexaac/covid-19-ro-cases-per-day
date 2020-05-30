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
        let margin = {top: 50, right: 0, bottom: 0, left: 0},
            width = 900,
            height = 760;

        // append the svg object to the chart div
        let svg = d3.select('#chart')
            .append('svg')
            .attr('class', 'chart-group')
            .attr('preserveAspectRatio', 'xMinYMin meet')
            .attr('width', width)
            .attr('height', height)
            .attr('viewBox', '0 0 ' + width + ' ' + height)
            .attr('transform',`translate(${margin.left},${margin.top})`);;

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
                animateBrush();
            });
        d3.select('#pause-cases')
            .on('click', () => {
                d3.select('#pause-cases').classed('hide', true);
                d3.select('#play-cases').classed('hide',false);
                flag = false;
            });

        const sleep = (ms) => {
            return new Promise(resolve => setTimeout(resolve, ms));
        };

        async function animateBrush() {
            let brushStart = 0,
                brushEnd = 0,
                step = timeBrush.xScale.range()[1]/10;

            for (let i=10; i>0; i--) {
                brushEnd += step;

                if (flag) {
                    timeBrush.brushComponent.transition()
                            .call(timeBrush.brush.move, [brushStart,brushEnd]);

                    // brushStart = brushEnd; // let chart accumulate for now
                    await sleep(1000);
                }
            };
            if (flag) {
                d3.select('#play-cases').classed('hide', false);
                d3.select('#pause-cases').classed('hide', true);
            };
        };
    };

}).call(this);