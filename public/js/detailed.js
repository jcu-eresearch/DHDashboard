

homesteadApp.controller('detailedController', function($scope, tagDataService) {


    $scope.currentNavItem = 'page1';
    $scope.tagList=[];
    $scope.selectedTag;
    $scope.tagGraphs=[];
    $scope.allTags={};
    $scope.fullWidth="100";
    $scope.alerts=false;
    $scope.today=new Date();
    $scope.yesterday= new Date($scope.today-1000*60*60*24)
    $scope.today=$scope.today.toISOString().substring(0,10);
    $scope.yesterday=$scope.yesterday.toISOString().substring(0,10);
    $scope.alertedTags=[];

    var thresholdWeight=600;



    $scope.layout = {
        title: "Daily Individual Weight Trend",
        yaxis: {title: "Weight (KG)"},
        showlegend: false
    };


    $scope.init=function(){


        tagDataService.getAllTagData(render);

        function render(apiData) {


            var dataSet = apiData;

            if(!dataSet){
                console.log("No data available");
                return;
            }


            dataSet.forEach(function(d) {

                d.date_posted= moment(d.date).local().format("YYYY-MM-DD");

                d.total_weight = +d["weight"];
            });

            function groupBy( array , f ){
                var groups = {};
                array.forEach( function( o ){
                    var group = JSON.stringify( f(o) );
                    groups[group] = groups[group] || [];
                    groups[group].push( o );
                });
                return Object.keys(groups).map( function( group ){
                    return groups[group];
                })
            }

            var idGroup = groupBy(dataSet, function(item){
                return [item.id];
            });

            var dict={};

            //Individual Graphs
            for(var j=0; j<idGroup.length; j++){
                var d=idGroup[j];


                if(d[0] && d[0].id=='-1') {
                    idGroup.splice(j, 1);
                    j--;
                    continue;

                }

                var trace1Counter=0;
                var trace1={
                    x:[],
                    y:[],
                    mode: 'lines+markers',
                    line:{
                        color: '#66bb6a'//,
                        //shape: 'spline'
                    },
                    type: 'scatter'
                };

                var trace2Counter=0;
                var trace2={
                    x:[],
                    y:[],
                    mode: 'markers',
                    line:{
                        color: '#e98686'//,
                        //shape: 'spline'
                    },
                    type: 'scatter'
                };

                var tagDict={};
                //remove all weights greater than the threshold weight

                var outlierYesterday=false;
                var outlierToday=false;
                var alerted=false;

                for(var a=0; a<d.length; a++){
                    if(d[a] && d[a].qa_flag && ( d[a].total_weight>thresholdWeight || d[a].qa_flag=="INVALID" || d[a].qa_flag=="OUTLIER" ) ){

                        trace2.x.push(d[a].date_posted);
                        trace2.y.push(d[a].total_weight);
                        trace2Counter++;

                        if(d[a].date_posted==$scope.yesterday) outlierYesterday=true;
                        if(d[a].date_poster==$scope.today) outlierToday=true;

                        d.splice(a,1);
                        a--;
                    }
                }


                if(d[0]){
                    trace1["name"]='Weight';
                    trace2["name"]='Outlier';
                    trace1.x.push(d[0].date_posted);
                    trace1.y.push(d[0].total_weight);
                    trace1Counter++;
                    tagDict[d[0].date_posted]=d[0].total_weight;

                    if(outlierToday && outlierYesterday){
                    //if(true){
                        $scope.alertedTags.push(d[0].id);
                        alerted=true;
                        $scope.alerts=true;

                        $scope.$emit('alerts', $scope.alertedTags);

                    }


                }
                for(var i=1; i<d.length; i++){
                    var dt=d[i].date_posted, wt=d[i].total_weight;
                    //take average of multiple readings during one day
                    if(trace1Counter>0){
                        var dupSum = trace1.y[trace1Counter - 1], index = i, count = 1;
                        if (d[index].date_posted == d[index - 1].date_posted)
                            while (d[index] && d[index].date_posted == d[index - 1].date_posted
                            && index < d.length && d[index]) {
                                dupSum += d[index].total_weight;
                                index++;
                                count++;
                            }
                        if (count > 1) {
                            wt = dupSum / count;
                            trace1.y[trace1Counter - 1] = wt;
                            tagDict[d[index-1].date_posted] = wt;
                            i = index - 1;
                            continue;
                        }
                    }
                    trace1.x.push(dt);
                    trace1.y.push(wt);

                    trace1Counter++;
                    tagDict[dt] = wt;
                }
                //check the threshold again
                if(trace1.y && trace1.x) {
                    for (var a = 0; a < trace1.y.length; a++) {
                        if (trace1.y[a] > thresholdWeight) {
                            trace1.y.splice(a, 1);
                            trace1.x.splice(a, 1);
                        }
                    }
                }
                var traces=[trace1, trace2];
                if(d[0]) {
                    $scope.tagGraphs.push({name:d[0].id, traces: traces, layout: $scope.layout, alerted: alerted});
                    dict[d[0].id]={dict: tagDict, trace: trace1};
                    if(j==0)$scope.selectedTag=$scope.tagGraphs[j];
                }
            }

        };

    };

    $scope.init();

});