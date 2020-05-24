import LineChart from './LineChart.js';

let lineChart, cases_data;

(() => {
    // https://bl.ocks.org/d3noob/a44d21b304b9f7260a284b1883232002/1b3a420bb9f51c00003974fda2497625380c7cb9
    // https://github.com/adamjanes
    
    // Get the data
    const promises = [
        d3.json("https://covid19.geo-spatial.org/api/dashboard/getDailyCaseReport")
    ];

    Promise.all(promises).then( data => {

        cases_data = data[0].data.data;

        // parse the date / time
        const parseTime = d3.timeParse("%Y-%m-%d");

        // format the data
        cases_data.forEach(function(d) {
            d.date = parseTime(d.day_case);
            d.date.toLocaleDateString('ro-RO');
            d.total_case = +d.total_case;
        });

        changeView();
    }).catch( 
        error => console.log(error)
    );

    const changeView = () => {
        // Set object for nodes by time
        lineChart = new LineChart("#chart", cases_data);

        lineChart.setupData();
    };

}).call(this);