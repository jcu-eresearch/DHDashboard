
homesteadApp.controller('trendsController', function($scope, tagDataService, detailedTagDataService,$rootScope, $timeout, $route) {

    //tagDataService.getAllTagData(renderCharts);


    var dashData=detailedTagDataService.getTagData();


    if(dashData==null){
        tagDataService.getStaticFile(renderCharts);
    }
    else {

        $timeout(function (){
            renderCharts2(dashData);
        });

    }


    function renderCharts(results){

        var data=results.records;

        var filterChart = dc.barChart("#errorbar");
        var rangeChart = dc.barChart("#range-chart");
        var table = dc.dataTable('#table');
        var gainOrLossChart = dc.pieChart('#gain-loss-chart');
        var quarterChart = dc.pieChart('#quarter-chart');
        var dayOfWeekChart = dc.rowChart('#day-of-week-chart');

        var dateFormat = d3.time.format("%Y-%m-%d");	//d3.time.format.iso;

        data.forEach(function (d) {

            if(!d || d==null || d==undefined || d.date==undefined) return;
            d.datePosted=d.date.substr(0,10);

            d.dd = dateFormat.parse(d.datePosted);
            d.day=d3.time.day(d.dd);
            d.week=d3.time.week(d.dd);
            d.month = d3.time.month(d.dd); // pre-calculate month for better performance
        });

        var ndx = crossfilter(data);
        $scope.ndx=ndx;
        var all = ndx.groupAll();

        var monthDimension = ndx.dimension(function (d){
            return d.month;
        });

        // var rec =({date: d[i].date, weight: d[i].weight, id: d[i].id, location: d[i].tag_id });
        //var flagDimension = ndx.dimensionfunction (d) {return d.qa_flag;});
        //flagDimension.filterExact("VALID");
        var changeDimension =ndx.dimension(function(d){return d.change});

        var gainOrLoss = ndx.dimension(function (d) {
            return d.change < 0 ? 'Loss' : 'Gain';
        });

        var gainOrLossGroup = gainOrLoss.group();

        var weightDimension = ndx.dimension(function (d) {return d.weight;});
        var rankDimension = ndx.dimension(function (d) {return d.rank;});
        var tagDimension = ndx.dimension(function (d) {return d.id;});
        tagDimension.filterFunction(function (d) {return !(d =='-1');});

        var dayDimension = ndx.dimension(function (d) {return d.day;});
        var dateDimension = ndx.dimension(function (d) {return d.date;});
        var weekDimension = ndx.dimension(function (d) {return d.week;});
        var weekTagsGroup = dayDimension.group().reduceCount(function(d) {return d.id;});
        var dayTagsGroup = dayDimension.group().reduceCount(function(d) {return d.id;});
        var monthTagsGroup = monthDimension.group().reduceCount(function(d) {return d.id;});
        var locationDimension = ndx.dimension(function(d) { return d.location; });
        var locationGroup = locationDimension.group().reduceCount(function(d) {return d.id;});

        var quarter = ndx.dimension(function (d) {
            var month = d.dd.getMonth();
            if (month <= 2) {
                return 'Q1';
            } else if (month > 2 && month <= 5) {
                return 'Q2';
            } else if (month > 5 && month <= 8) {
                return 'Q3';
            } else {
                return 'Q4';
            }
        });
        var quarterGroup = quarter.group().reduceCount(function (d) {
            return d.id;
        });

        var dayOfWeek = ndx.dimension(function (d) {
            var day = d.dd.getDay();
            var name = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            return day + '.' + name[day];
        });
        var dayOfWeekGroup = dayOfWeek.group();


        

        $scope.markerChart = dc.leafletMarkerChart("#inner-map")
            .mapOptions({scrollWheelZoom: false})
            .dimension(locationDimension)
            .group(locationGroup)
            .center([ -19.665,146.825])
            .zoom(12)
            .width(600)
            .height(400)
            .fitOnRender(true)
            .fitOnRedraw(true)
            .cluster(false);

        quarterChart /* dc.pieChart('#quarter-chart', 'chartGroup') */
            .width(180)
            .height(180)
            .radius(80)
            .innerRadius(30)
            .dimension(quarter)
            .group(quarterGroup)
            .ordinalColors([
                '#6baed6',
                '#95D7BB',
                '#D9DD81',
                '#79D1CF',
                '#c6dbef',
                '#dadaeb']);

        dayOfWeekChart /* dc.rowChart('#day-of-week-chart', 'chartGroup') */
            .width(180)
            .height(180)
            .margins({top: 0, left: 30, right: 30, bottom: 30})
            .group(dayOfWeekGroup)
            .dimension(dayOfWeek)
            .ordinalColors([
                '#3182bd',
                '#6baed6',
                '#95D7BB',
                '#D9DD81',
                '#79D1CF',
                '#c6dbef',
                '#dadaeb'])
            .label(function (d) {
                return d.key.split('.')[1];
            })
            .title(function (d) {
                return d.value;
            })
            .elasticX(true)
            .xAxis().ticks(4);

        //$(document).ready(initSliders);


        function initSliders(){
            $("#weightSlider").slider({
                range: true,
                min: 300,
                max: 650,
                step: 1,
                values: [300, 650],
                slide: function (event, ui) {
                    var start, end
                    $("#startWeight").val(ui.values[0]);
                    $("#endWeight").val(ui.values[1]);
                    if (document.getElementById("startWeight").value != "") {
                        start = document.getElementById("startWeight").value;
                    };
                    if (document.getElementById("endWeight").value != "") {
                        end = document.getElementById("endWeight").value;
                    };
                    weightDimension.filterRange([start, end]);
                    dc.redrawAll();
                    if ((ui.values[0] + 0.1 ) >= ui.values[1]) {
                        return false;
                    }
                }
            });
            $("#changeSlider").slider({
                range: true,
                min: -60,
                max: 60,
                step: 1,
                values: [-60, 60],
                slide: function (event, ui) {
                    var start, end;
                    $("#startChange").val(ui.values[0]);
                    $("#endChange").val(ui.values[1]);
                    if (document.getElementById("startChange").value != "") {
                        start = document.getElementById("startChange").value;
                    };
                    if (document.getElementById("endChange").value != "") {
                        end = document.getElementById("endChange").value;
                    };
                    changeDimension.filterRange([start, end]);
                    dc.redrawAll();
                    if ((ui.values[0] + 0.1 ) >= ui.values[1]) {
                        return false;
                    }
                }
            });

            $("#topKSlider").slider({
                range: false,
                step: 1,
                max: 100 ,
                value:100,
                min: 1,
                slide: function (event, ui) {
                    var val;
                    $("#startTopK").val(ui.value);

                    if (document.getElementById("startTopK").value != "") {
                        val = document.getElementById("startTopK").value;
                    };

                    rankDimension.filterRange([0, (parseInt(val)+1)]);
                    dc.redrawAll();
                }
            });
        }
        initSliders();

        var colorScale = d3.scale.ordinal().range(["#95D7BB", "#D9DD81", "#79D1CF", "#E67A77"]);
        gainOrLossChart
            .width(180)
            .height(180)
            .radius(80)
            .dimension(gainOrLoss)
            .group(gainOrLossGroup)
            .label(function (d) {
                if (gainOrLossChart.hasFilter() && !gainOrLossChart.hasFilter(d.key)) {
                    return d.key ;
                }
                var label = d.key;
                return label;
            })
            .renderLabel(true)

            .transitionDuration(500)
            .colors(colorScale);
            //.colorDomain([-1750, 1644])
            //.colorAccessor(function(d, i){return d.value;})

        filterChart.height(700)
            .dimension(dayDimension)
            .group(dayTagsGroup)
            .transitionDuration(500)
            .margins({top: 30, right: 50, bottom: 25, left: 50})
            .elasticY(true)
            .rangeChart(rangeChart)
            .x(d3.time.scale().domain([new Date(2016, 06, 1), new Date(2017, 05, 04)]))
            .centerBar(true)
            .gap(1)
            .xUnits(d3.time.days)
            .colors(["#95D7BB"])
            .yAxis().ticks(20);

        rangeChart /* dc.barChart('#monthly-volume-chart', 'chartGroup'); */
            .height(60)
            .margins({top: 10, right: 50, bottom: 20, left: 50})
            .dimension(dayDimension)
            .group(dayTagsGroup)
            .centerBar(true)
            .gap(1)
            .x(d3.time.scale().domain([new Date(2016, 06, 1), new Date(2017, 05, 04)]))
            .xUnits(d3.time.days)
            .colors(["#95D7BB"])
            .yAxis().ticks(0);


       table
            .dimension(tagDimension)
            .group(function(d) {
                return d.day;
            })
            .showGroups(false)
            .size(Infinity)
            .sortBy(function(d) { return +d.weight; })
            .columns(['Animal Tag',
                {
                    label: '',
                    format: function(d) {
                        return d.id;
                    }
                },
                'Weight',
                {
                    label: '',
                    format: function(d) {
                        return d.weight;
                    }
                }])
           .on('renderlet', function (table) {
               table.selectAll('.dc-table-group').classed('info', true)});



         $scope.downloadData=function(){
                var data = tagDimension.top(Infinity);



                var blob = new Blob([d3.csv.format(data)], {type: "text/csv;charset=utf-8"});
                saveAs(blob, 'data.csv');
         };


        var ofs = 0, pag = 10;
        function display() {
            d3.select('#begin')
                .text(ofs);
            d3.select('#end')
                .text(ofs+pag-1);
            d3.select('#last')
                .attr('disabled', ofs-pag<0 ? 'true' : null);
            d3.select('#next')
                .attr('disabled', ofs+pag>=ndx.size() ? 'true' : null);
            d3.select('#size').text(ndx.size());
        }
        function update() {
            table.beginSlice(ofs);
            table.endSlice(ofs+pag);
            display();
        }
        $scope.next= function() {
            ofs += pag;
            update();
            table.redraw();
        }
        $scope.last = function() {
            ofs -= pag;
            update();
            table.redraw();
        }

        update();
        dc.renderAll();

        onresize = function(){
            dc.chartRegistry.list().forEach(chart => {
                let: _bbox = chart.root().node().parentNode.getBoundingClientRect();
            chart.width(_bbox.width).render();
        });
        };

        onresize();

        window.addEventListener('resize', onresize);

    }

    function renderCharts2(results){


        dc.chartRegistry.clear();


        var data=results.records;

        var filterChart = dc.barChart("#errorbar");
        var rangeChart = dc.barChart("#range-chart");
        var table = dc.dataTable('#table');
        var gainOrLossChart = dc.pieChart('#gain-loss-chart');
        var quarterChart = dc.pieChart('#quarter-chart');
        var dayOfWeekChart = dc.rowChart('#day-of-week-chart');

        var dateFormat = d3.time.format("%Y-%m-%d");	//d3.time.format.iso;

        data.forEach(function (d) {

            if(!d || d==null || d==undefined || d.date==undefined) return;
            d.datePosted=d.date.substr(0,10);

            d.dd = dateFormat.parse(d.datePosted);
            d.day=d3.time.day(d.dd);
            d.week=d3.time.week(d.dd);
            d.month = d3.time.month(d.dd); // pre-calculate month for better performance
        });

        var ndx = crossfilter(data);
        $scope.ndx=ndx;
        var all = ndx.groupAll();

        var monthDimension = ndx.dimension(function (d){
            return d.month;
        });

        // var rec =({date: d[i].date, weight: d[i].weight, id: d[i].id, location: d[i].tag_id });
        //var flagDimension = ndx.dimensionfunction (d) {return d.qa_flag;});
        //flagDimension.filterExact("VALID");
        var changeDimension =ndx.dimension(function(d){return d.change});

        var gainOrLoss = ndx.dimension(function (d) {
            return d.change < 0 ? 'Loss' : 'Gain';
        });

        var gainOrLossGroup = gainOrLoss.group();

        var weightDimension = ndx.dimension(function (d) {return d.weight;});
        var rankDimension = ndx.dimension(function (d) {return d.rank;});
        var tagDimension = ndx.dimension(function (d) {return d.id;});
        tagDimension.filterFunction(function (d) {return !(d =='-1');});

        var dayDimension = ndx.dimension(function (d) {return d.day;});
        var dateDimension = ndx.dimension(function (d) {return d.date;});
        var weekDimension = ndx.dimension(function (d) {return d.week;});
        var weekTagsGroup = dayDimension.group().reduceCount(function(d) {return d.id;});
        var dayTagsGroup = dayDimension.group().reduceCount(function(d) {return d.id;});
        var monthTagsGroup = monthDimension.group().reduceCount(function(d) {return d.id;});
        var locationDimension = ndx.dimension(function(d) { return d.location; });
        var locationGroup = locationDimension.group().reduceCount(function(d) {return d.id;});

        var quarter = ndx.dimension(function (d) {
            var month = d.dd.getMonth();
            if (month <= 2) {
                return 'Q1';
            } else if (month > 2 && month <= 5) {
                return 'Q2';
            } else if (month > 5 && month <= 8) {
                return 'Q3';
            } else {
                return 'Q4';
            }
        });
        var quarterGroup = quarter.group().reduceCount(function (d) {
            return d.id;
        });

        var dayOfWeek = ndx.dimension(function (d) {
            var day = d.dd.getDay();
            var name = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            return day + '.' + name[day];
        });
        var dayOfWeekGroup = dayOfWeek.group();




        $scope.markerChart = dc.leafletMarkerChart("#inner-map")
            .mapOptions({scrollWheelZoom: false})
            .dimension(locationDimension)
            .group(locationGroup)
            .center([ -19.665,146.825])
            .zoom(12)
            .width(600)
            .height(400)
            .fitOnRender(true)
            .fitOnRedraw(true)
            .cluster(false);

        quarterChart /* dc.pieChart('#quarter-chart', 'chartGroup') */
            .width(180)
            .height(180)
            .radius(80)
            .innerRadius(30)
            .dimension(quarter)
            .group(quarterGroup)
            .ordinalColors([
                '#6baed6',
                '#95D7BB',
                '#D9DD81',
                '#79D1CF',
                '#c6dbef',
                '#dadaeb']);

        dayOfWeekChart /* dc.rowChart('#day-of-week-chart', 'chartGroup') */
            .width(180)
            .height(180)
            .margins({top: 0, left: 30, right: 30, bottom: 30})
            .group(dayOfWeekGroup)
            .dimension(dayOfWeek)
            .ordinalColors([
                '#3182bd',
                '#6baed6',
                '#95D7BB',
                '#D9DD81',
                '#79D1CF',
                '#c6dbef',
                '#dadaeb'])
            .label(function (d) {
                return d.key.split('.')[1];
            })
            .title(function (d) {
                return d.value;
            })
            .elasticX(true)
            .xAxis().ticks(4);

        //$(document).ready(initSliders);


        function initSliders(){
            $("#weightSlider").slider({
                range: true,
                min: 300,
                max: 650,
                step: 1,
                values: [300, 650],
                slide: function (event, ui) {
                    var start, end
                    $("#startWeight").val(ui.values[0]);
                    $("#endWeight").val(ui.values[1]);
                    if (document.getElementById("startWeight").value != "") {
                        start = document.getElementById("startWeight").value;
                    };
                    if (document.getElementById("endWeight").value != "") {
                        end = document.getElementById("endWeight").value;
                    };
                    weightDimension.filterRange([start, end]);
                    dc.redrawAll();
                    if ((ui.values[0] + 0.1 ) >= ui.values[1]) {
                        return false;
                    }
                }
            });
            $("#changeSlider").slider({
                range: true,
                min: -60,
                max: 60,
                step: 1,
                values: [-60, 60],
                slide: function (event, ui) {
                    var start, end;
                    $("#startChange").val(ui.values[0]);
                    $("#endChange").val(ui.values[1]);
                    if (document.getElementById("startChange").value != "") {
                        start = document.getElementById("startChange").value;
                    };
                    if (document.getElementById("endChange").value != "") {
                        end = document.getElementById("endChange").value;
                    };
                    changeDimension.filterRange([start, end]);
                    dc.redrawAll();
                    if ((ui.values[0] + 0.1 ) >= ui.values[1]) {
                        return false;
                    }
                }
            });

            $("#topKSlider").slider({
                range: false,
                step: 1,
                max: 100 ,
                value:100,
                min: 1,
                slide: function (event, ui) {
                    var val;
                    $("#startTopK").val(ui.value);

                    if (document.getElementById("startTopK").value != "") {
                        val = document.getElementById("startTopK").value;
                    };

                    rankDimension.filterRange([0, (parseInt(val)+1)]);
                    dc.redrawAll();
                }
            });
        }
        initSliders();

        var colorScale = d3.scale.ordinal().range(["#95D7BB", "#D9DD81", "#79D1CF", "#E67A77"]);
        gainOrLossChart
            .width(180)
            .height(180)
            .radius(80)
            .dimension(gainOrLoss)
            .group(gainOrLossGroup)
            .label(function (d) {
                if (gainOrLossChart.hasFilter() && !gainOrLossChart.hasFilter(d.key)) {
                    return d.key ;
                }
                var label = d.key;
                return label;
            })
            .renderLabel(true)

            .transitionDuration(500)
            .colors(colorScale);
        //.colorDomain([-1750, 1644])
        //.colorAccessor(function(d, i){return d.value;})

        filterChart.height(700)
            .dimension(dayDimension)
            .group(dayTagsGroup)
            .transitionDuration(500)
            .margins({top: 30, right: 50, bottom: 25, left: 50})
            .elasticY(true)
            .rangeChart(rangeChart)
            .x(d3.time.scale().domain([new Date(2016, 06, 1), new Date(2017, 05, 04)]))
            .centerBar(true)
            .gap(1)
            .xUnits(d3.time.days)
            .colors(["#95D7BB"])
            .yAxis().ticks(20);

        rangeChart /* dc.barChart('#monthly-volume-chart', 'chartGroup'); */
            .height(60)
            .margins({top: 10, right: 50, bottom: 20, left: 50})
            .dimension(dayDimension)
            .group(dayTagsGroup)
            .centerBar(true)
            .gap(1)
            .x(d3.time.scale().domain([new Date(2016, 06, 1), new Date(2017, 05, 04)]))
            .xUnits(d3.time.days)
            .colors(["#95D7BB"])
            .yAxis().ticks(0);


        table
            .dimension(tagDimension)
            .group(function(d) {
                return d.day;
            })
            .showGroups(false)
            .size(Infinity)
            .sortBy(function(d) { return +d.weight; })
            .columns(['Animal Tag',
                {
                    label: '',
                    format: function(d) {
                        return d.id;
                    }
                },
                'Weight',
                {
                    label: '',
                    format: function(d) {
                        return d.weight;
                    }
                }])
            .on('renderlet', function (table) {
                table.selectAll('.dc-table-group').classed('info', true)});



        $scope.downloadData=function(){
            var data = tagDimension.top(Infinity);



            var blob = new Blob([d3.csv.format(data)], {type: "text/csv;charset=utf-8"});
            saveAs(blob, 'data.csv');
        };


        var ofs = 0, pag = 10;
        function display() {
            d3.select('#begin')
                .text(ofs);
            d3.select('#end')
                .text(ofs+pag-1);
            d3.select('#last')
                .attr('disabled', ofs-pag<0 ? 'true' : null);
            d3.select('#next')
                .attr('disabled', ofs+pag>=ndx.size() ? 'true' : null);
            d3.select('#size').text(ndx.size());
        }
        function update() {
            table.beginSlice(ofs);
            table.endSlice(ofs+pag);
            display();
        }
        $scope.next= function() {
            ofs += pag;
            update();
            table.redraw();
        }
        $scope.last = function() {
            ofs -= pag;
            update();
            table.redraw();
        }

        update();
        dc.renderAll();

        onresize = function(){
            dc.chartRegistry.list().forEach(chart => {
                let: _bbox = chart.root().node().parentNode.getBoundingClientRect();
            chart.width(_bbox.width).render();
        });
        };

        onresize();

        window.addEventListener('resize', onresize);

    }


    
});