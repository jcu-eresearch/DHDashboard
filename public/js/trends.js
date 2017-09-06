
homesteadApp.controller('trendsController', function($scope, tagDataService, detailedTagDataService,$rootScope, $timeout) {

    var dashData=detailedTagDataService.getTagData();

    if(dashData==null)
        tagDataService.getStaticFile(renderCharts);
    else {
        $timeout(function (){
            dc.chartRegistry.clear();
            renderCharts(dashData);
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

        var monthDimension = ndx.dimension(function (d){
            return d.month;
        });

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
        var dayTagsGroup = dayDimension.group().reduceCount(function(d) {return d.id;});
        var locationDimension = ndx.dimension(function(d) { return d.location; });
        var locationGroup = locationDimension.group().reduceCount(function(d) {return d.locationName;});

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

        var quarterGroup = quarter.group().reduceCount(function (d){
            return d.id;
        });

        var dayOfWeek = ndx.dimension(function (d) {
            var day = d.dd.getDay();
            var name = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            return day + '.' + name[day];
        });

        var dayOfWeekGroup = dayOfWeek.group();

        var markerChart = dc.leafletMarkerChart("#inner-map")
            .mapOptions({scrollWheelZoom: false})
            .dimension(locationDimension)
            .group(locationGroup)
            .center([ -19.665,146.825])
            .zoom(12)
            .width(600)
            .height(400)
            .fitOnRender(true)
            .fitOnRedraw(true)
            .cluster(false)
            .popupOnHover(true);

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

        var slider = document.getElementById('weightSlider');
        noUiSlider.create(slider, {
            start: [300, 650],
            connect: false,
            step: 1,
            orientation: 'horizontal', // 'horizontal' or 'vertical'
            range: {
                'min': 300,
                'max': 650
            },
            format: wNumb({
                decimals: 0,
                encoder: function( value ){
                    return  Math.floor(value);
                }
            })
        });

        var slider1 = document.getElementById('changeSlider');
        noUiSlider.create(slider1, {
            start: [-60, 60],
            connect: false,
            step: 1,
            orientation: 'horizontal', // 'horizontal' or 'vertical'
            range: {
                'min': -60,
                'max': 60
            },
            format: wNumb({
                decimals: 0,
                encoder: function( value ){
                    return  Math.floor(value);
                }
            })
        });

        var slider2 = document.getElementById('topKSlider');
        noUiSlider.create(slider2, {
            start: [100],
            connect: false,
            step: 1,
            orientation: 'horizontal', // 'horizontal' or 'vertical'
            range: {
                'min': 1,
                'max': 100
            },
            format: wNumb({
                decimals: 0,
                encoder: function( value ){
                    return  Math.floor(value);
                }
            })
        });

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
        };
        $scope.last = function() {
            ofs -= pag;
            update();
            table.redraw();
        };

        update();
        dc.renderAll();

        var onresize = function(){
            dc.chartRegistry.list().forEach(function(chart){
                if(chart.map) return;
                var _bbox = chart.root().node().parentNode.getBoundingClientRect();
                chart.width(_bbox.width).render();

            });
        };

        onresize();

        window.addEventListener('resize', onresize);

        //dc has to be passed from this context
        slider.noUiSlider.on('update', (function(dc){
            function redraw(){
                dc.redrawAll();
            }
            return function(values){
                var start, end;
                $("#startWeight").val(values[0]);
                $("#endWeight").val(values[1]);

                if (document.getElementById("startWeight").value != "") {
                    start = document.getElementById("startWeight").value;
                };
                if (document.getElementById("endWeight").value != "") {
                    end = document.getElementById("endWeight").value;
                };
                weightDimension.filterRange([start, end]);
                redraw();
            };
        })(dc));

        slider1.noUiSlider.on('update', (function(dc){
            function redraw(){
                dc.redrawAll();
            }
            return function(values){
                var start, end;
                $("#startChange").val(values[0]);
                $("#endChange").val(values[1]);
                if (document.getElementById("startChange").value != "") {
                    start = document.getElementById("startChange").value;
                };
                if (document.getElementById("endChange").value != "") {
                    end = document.getElementById("endChange").value;
                };
                changeDimension.filterRange([start, end]);
                redraw();
            };
        })(dc));

        slider2.noUiSlider.on('update', (function(dc){
            function redraw(){
                dc.redrawAll();
            }
            return function(values){
                var val;
                $("#startTopK").val(values[0]);

                if (document.getElementById("startTopK").value != "") {
                    val = document.getElementById("startTopK").value;
                };

                rankDimension.filterRange([0, (parseInt(val)+1)]);
                redraw();
            };
        })(dc));

        //changing the color of the slider
        angular.element('.noUi-target.noUi-vertical .noUi-tooltip').css('background-color', '#95D7BB');
        angular.element('.noUi-target.noUi-horizontal .noUi-tooltip').css('background-color', '#95D7BB');
        angular.element('.noUi-horizontal .noUi-handle, .noUi-vertical .noUi-handle').css('background-color', '#95D7BB');


    }

});