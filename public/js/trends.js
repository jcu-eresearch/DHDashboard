
homesteadApp.controller('trendsController', function($scope, tagDataService, $rootScope, $timeout) {


    tagDataService.getAllTagData(renderCharts);


    function renderCharts(data){

        var filterChart = dc.barChart("#errorbar");
        var rangeChart = dc.barChart("#range-chart");

        var dateFormat = d3.time.format.iso;


        data.forEach(function (d) {
            debugger;
            if(!d || d==null || d==undefined || d.date==undefined) return;
            d.dd = dateFormat.parse(d.date);
            debugger;
            d.day=d3.time.day(d.dd);
            d.week=d3.time.week(d.dd);
            d.month = d3.time.month(d.dd); // pre-calculate month for better performance
        });

        var ndx = crossfilter(data);
        var all = ndx.groupAll();

        var monthDimension = ndx.dimension(function (d) {
            return d.month;
        });

        var flagDimension = ndx.dimension(function (d) {return d.qa_flag;});

        var weightDimension = ndx.dimension(function (d) {return d.weight;});

        var tagDimension = ndx.dimension(function (d) {return d.id;});

        var locationDimension = ndx.dimension(function (d) {return d.tag_id;});

        var dayDimension = ndx.dimension(function (d) {return d.day;});

        var weekDimension = ndx.dimension(function (d) {return d.week;});

        var weekTagsGroup = dayDimension.group().reduceCount(function(d) {return d.id;});

        var dayTagsGroup = dayDimension.group().reduceCount(function(d) {return d.id;});

        var monthTagsGroup = monthDimension.group().reduceCount(function(d) {return d.id;});

        flagDimension.filterExact("VALID");



        $(document).ready(function () {
            $("#valueSlider").slider({
                range: true,
                min: 300,
                max: 650,
                step: 1,
                values: [300, 650],
                slide: function (event, ui) {
                    $("#start").val(ui.values[0]);
                    $("#end").val(ui.values[1]);
                    if (document.getElementById("start").value != "") {
                        start = document.getElementById("start").value;
                    }
                    ;
                    if (document.getElementById("end").value != "") {
                        end = document.getElementById("end").value;
                    }
                    ;
                    weightDimension.filterRange([start, end]);
                    dc.redrawAll();
                    if ((ui.values[0] + 0.1 ) >= ui.values[1]) {
                        return false;
                    }
                }

            });
        });


        filterChart.width(1000).height(500)
            .dimension(weekDimension)
            .group(weekTagsGroup)
            .transitionDuration(500)
            .margins({top: 30, right: 50, bottom: 25, left: 50})
            .elasticY(true)
            .rangeChart(rangeChart)
            .x(d3.time.scale().domain([new Date(2016, 06, 1), new Date(2017, 05, 04)]))
            .centerBar(true)
            .gap(1)
            .xUnits(d3.time.days)
            .colors(["orange"])
            .yAxis().ticks(20);

        rangeChart.width(1000) /* dc.barChart('#monthly-volume-chart', 'chartGroup'); */
            .height(40)
            .margins({top: 0, right: 50, bottom: 20, left: 50})
            .dimension(weekDimension)
            .group(weekTagsGroup)
            .centerBar(true)
            .gap(1)
            .x(d3.time.scale().domain([new Date(2016, 06, 1), new Date(2017, 05, 04)]))
            .xUnits(d3.time.days)
            .colors(["orange"])
            .yAxis().ticks(0);



        dc.renderAll();
        debugger;
    }

    function renderCharts2() {

        var data = [{
            "city": "New York",
            "neighborhood": "Chinatown",
            "likes": 25
        }, {
            "city": "New York",
            "neighborhood": "Brooklyn",
            "likes": 55
        }, {
            "city": "New York",
            "neighborhood": "Queens",
            "likes": 74
        }, {
            "city": "San Francisco",
            "neighborhood": "Chinatown",
            "likes": 10
        }, {
            "city": "San Francisco",
            "neighborhood": "Downtown",
            "likes": 66
        }, {
            "city": "Seattle",
            "neighborhood": "N/A",
            "likes": 80
        }, {
            "city": "Seattle",
            "neighborhood": "Freemont",
            "likes": 55
        }];

        var filterChart = dc.barChart("#errorbar");

        var ndx = crossfilter(data),
            likesDimension = ndx.dimension(function (d) {
                return d.likes;
            }),
            cityDimension = ndx.dimension(function (d) {
                return d.city;
            }),
            cityLikesGroup = cityDimension.group().reduceSum(function (d) {
                return d.likes;
            });

        $(document).ready(function () {
            $("#valueSlider").slider({
                range: true,
                min: 0,
                max: 100,
                step: 1,
                values: [0, 100],
                slide: function (event, ui) {
                    $("#start").val(ui.values[0]);
                    $("#end").val(ui.values[1]);
                    if (document.getElementById("start").value != "") {
                        start = document.getElementById("start").value;
                    }
                    ;
                    if (document.getElementById("end").value != "") {
                        end = document.getElementById("end").value;
                    }
                    ;
                    likesDimension.filterRange([start, end]);
                    dc.redrawAll();
                    if ((ui.values[0] + 0.1 ) >= ui.values[1]) {
                        return false;
                    }
                }

            });
        });


        filterChart.width(500).height(500)
            .dimension(cityDimension)
            .group(cityLikesGroup)
            .transitionDuration(500)
            .elasticX(true)
            .elasticY(true)
            .x(d3.scale.ordinal())
            .xUnits(dc.units.ordinal)
            .colors(["orange"])
            .yAxis().ticks(5);


        dc.renderAll();
    }
    
});