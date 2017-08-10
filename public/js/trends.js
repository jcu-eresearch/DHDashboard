
homesteadApp.controller('trendsController', function($scope, tagDataService, detailedTagDataService,$rootScope, $timeout) {

    //tagDataService.getAllTagData(renderCharts);


    var dashData=detailedTagDataService.getTagData();

    if(dashData==null){
        tagDataService.getStaticFile(renderCharts);
    }
    else {
       renderCharts(dashData);

    }

    function renderCharts(results){

        var data=results.records;
        debugger;

        var filterChart = dc.barChart("#errorbar");
        var rangeChart = dc.barChart("#range-chart");
        var table = dc.dataTable('#table');

        var dateFormat = d3.time.format.iso;

        data.forEach(function (d) {
            if(!d || d==null || d==undefined || d.date==undefined) return;
            d.dd = dateFormat.parse(d.date);
            d.day=d3.time.day(d.dd);
            d.week=d3.time.week(d.dd);
            d.month = d3.time.month(d.dd); // pre-calculate month for better performance
        });

        var ndx = crossfilter(data);
        var all = ndx.groupAll();

        var monthDimension = ndx.dimension(function (d){
            return d.month;
        });

        // var rec =({date: d[i].date, weight: d[i].weight, id: d[i].id, location: d[i].tag_id });
        //var flagDimension = ndx.dimension(function (d) {return d.qa_flag;});
        //flagDimension.filterExact("VALID");
        var weightDimension = ndx.dimension(function (d) {return d.weight;});
        var tagDimension = ndx.dimension(function (d) {return d.id;});
        tagDimension.filterFunction(function (d) {return !(d =='-1');});
        var locationDimension = ndx.dimension(function (d) {return d.location;});
        var dayDimension = ndx.dimension(function (d) {return d.day;});
        var dateDimension = ndx.dimension(function (d) {return d.date;});
        var weekDimension = ndx.dimension(function (d) {return d.week;});
        var weekTagsGroup = dayDimension.group().reduceCount(function(d) {return d.id;});
        var dayTagsGroup = dayDimension.group().reduceCount(function(d) {return d.id;});
        var monthTagsGroup = monthDimension.group().reduceCount(function(d) {return d.id;});

        $(document).ready(function (){
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
                    };
                    if (document.getElementById("end").value != "") {
                        end = document.getElementById("end").value;
                    };
                    weightDimension.filterRange([start, end]);
                    dc.redrawAll();
                    if ((ui.values[0] + 0.1 ) >= ui.values[1]) {
                        return false;
                    }
                }
            });
        });

        filterChart.width(2000).height(500)
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
            .colors(["orange"])
            .yAxis().ticks(20);

        rangeChart.width(2000) /* dc.barChart('#monthly-volume-chart', 'chartGroup'); */
            .height(40)
            .margins({top: 0, right: 50, bottom: 20, left: 50})
            .dimension(dayDimension)
            .group(dayTagsGroup)
            .centerBar(true)
            .gap(1)
            .x(d3.time.scale().domain([new Date(2016, 06, 1), new Date(2017, 05, 04)]))
            .xUnits(d3.time.days)
            .colors(["orange"])
            .yAxis().ticks(0);


       table
            .dimension(tagDimension)
            .group(function(d) {
                return d.day;
            })
            .showGroups(false)
            .size(50)
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
                }]);

        d3.select('#download')
            .on('click', function() {
                var data = tagDimension.top(Infinity);

                data = data.sort(function(a, b) {
                    return table.order()(table.sortBy()(a), table.sortBy()(b));
                });
                data = data.map(function(d) {
                    var row = {};
                    table.columns().forEach(function(c) {
                        row[table._doColumnHeaderFormat(c)] = table._doColumnValueFormat(c, d);
                    });
                    return row;
                });

                var blob = new Blob([d3.csv.format(data)], {type: "text/csv;charset=utf-8"});
                saveAs(blob, 'data.csv');
            });


        dc.renderAll();

    }


    
});