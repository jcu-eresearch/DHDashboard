homesteadApp.controller('dashController', function($scope, tagDataService) {

    $scope.currentNavItem = 'page1';
    $scope.tagList=[];
    $scope.selectedTag;
    $scope.tagGraphs=[];
    $scope.allTags={};

    var thresholdWeight=500;

    $scope.initMap=function() {
        var map
        map = new google.maps.Map(document.getElementById('map'), {
            center: {lat: -19.66574, lng: 146.8462},
            mapTypeId: 'hybrid',
            zoom:9
        });

        //map.data.loadGeoJson('data/paddocks.json');

        var marker1 = new google.maps.Marker({
            position: {lat: -19.66882, lng: 146.864},
            map: map,
            title: "Spring Creek"
        });
        var marker2 = new google.maps.Marker({
            position: {lat: -19.657496, lng: 146.835306},
            map: map,
            title: "Digital Homestead"
        });
        var marker3 = new google.maps.Marker({
            position: {lat: -19.66574, lng: 146.8462},
            map: map,
            title: "Double Barrel"
        });
        var marker4 = new google.maps.Marker({
            position: {lat: -19.66872, lng: 146.8642},
            map: map,
            text: "Junction"
        });
    }

    $scope.layout = {
        title: "Daily Individual Weight Trend",
        yaxis: {title: "Weight (KG)"},
        showlegend: false
    };

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
    };

    $scope.init=function(){

        tagDataService.getAllTagData(render);

        function render(apiData) {

            $scope.initMap();

            var dataSet = apiData;

            if(!dataSet){
                console.log("No data available");
                return;
            }

            dataSet.forEach(function(d) {
                d.date_posted  = d.date.substring(0, d.date.length - 14);
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
                        color: '#66bb6a',
                        shape: 'spline'
                    },
                    type: 'scatter'
                };
                var tagDict={};
                //remove all weights greater than the threshold weight

                for(var a=0; a<d.length; a++){
                    if(d[a] && d[a].total_weight>thresholdWeight  ){
                        d.splice(a,1);
                        a--;
                    }
                }
                if(d[0]){
                    trace1["name"]=d[0].id+' weight';
                    trace1.x.push(d[0].date_posted);
                    trace1.y.push(d[0].total_weight);
                    trace1Counter++;
                    tagDict[d[0].date_posted]=d[0].total_weight;
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
                var traces=[trace1];
                if(d[0]) {
                    $scope.tagGraphs.push({name:d[0].id, traces: traces, layout: $scope.layout});
                    dict[d[0].id]={dict: tagDict, trace: trace1};
                    if(j==0)$scope.selectedTag=$scope.tagGraphs[j];
                }
            }

            //sorting the tags
            $scope.tagGraphs.sort(function(a, b){
                var keyA = a.name,
                    keyB = b.name;
                return keyA.localeCompare(keyB);
            });

            //Tags with 2 weights
            var relevantTags={};
            for(var j=0; j<idGroup.length; j++){
                var d=idGroup[j];
                if(d && d.length>0 && d[0].id!="-1") {//change from 0 to 1 for multiple weights
                    relevantTags[d[0].id]=true;
                }
            }

            var dateGroup = groupBy(dataSet, function(item){
                return [item.date_posted];
            });

            var tagDateGroup=[];
            dateGroup.forEach(function(d) {
                tagDateGroup.push(groupBy(d, function(item){
                    return [item.id];
                }));
            });

            var days=[];
            var relevantWeights=[];
            var tagDetails=[];
            var herdTrendDays={relevant: {}};


            //Herd Graph
            tagDateGroup.forEach(function(d) {
                if(d[0][0]) {
                    days.push(d[0][0].date_posted);
                    herdTrendDays.relevant[d[0][0].date_posted]=false;
                }
                else return;

                var sumWeightTrend=0;
                var countTrend=0;
                var tagNamesForDay={};

                if(d[0][0].date_posted)
                    tagNamesForDay[d[0][0].date_posted]=[];

                d.forEach(function(e) {//e is the tag

                    if(e[0]) {
                        if(relevantTags[e[0].id]){

                            var currTag=dict[e[0].id];
                            var diff;
                            //var last;
                            if(currTag.trace.x)
                                for(var z=0; z<currTag.trace.x.length; z++){
                                    if(currTag.trace.x[z]==e[0].date_posted /*&& z>0*/ ){

                                        //last=currTag.dict[currTag.trace.x[z]];//change to z-1
                                        diff=currTag.dict[currTag.trace.x[z]];

                                        /*var oneDay = 24*60*60*1000;
                                         var firstDate = new Date(currTag.trace.x[z]);
                                         var secondDate = new Date(currTag.trace.x[z-1]);
                                         var diffDays =
                                         Math.round(Math.abs((firstDate.getTime() - secondDate.getTime())/(oneDay)));
                                         diff=diff-last;
                                         if(diffDays>1)
                                         diff=diff/diffDays;
                                         */

                                        sumWeightTrend+=diff;
                                        herdTrendDays.relevant[d[0][0].date_posted]=true;
                                        tagNamesForDay[d[0][0].date_posted].push({
                                            date: d[0][0].date_posted,
                                            tag: e[0].id,
                                            change: diff
                                        });
                                        countTrend++;
                                    }
                                }
                        }
                    }
                });

                if(countTrend>0) {
                    sumWeightTrend = sumWeightTrend/countTrend;
                    tagDetails.push(tagNamesForDay);
                    relevantWeights.push(sumWeightTrend);
                }
                if(!herdTrendDays.relevant[d[0][0].date_posted]){
                    if(days[days.length-1] && days[days.length-1]==d[0][0].date_posted)
                        days.splice(days.length-1, 1);
                }
            });

            var total_weights = {
                x: days,
                y: relevantWeights,
                mode: 'lines+markers',
                name: "Ave Wt",
                line:{
                    color: '#66bb6a',
                    shape: 'spline'
                },
                type: 'scatter'
            };

            var layout = {
                title: "Daily Herd Weight Trend",
                yaxis: {title: "Weight (KG)"},
                showlegend: false
            };

            tagDateGroup.forEach(function(d){
                if(d[0] && d[0][0]){

                    $scope.averageMultipleWeightsAndFilter(d);
                }
            });



            tagDateGroup.forEach(function(d){
                if(d[0] && d[0][0]){

                    d.sort(function(a, b){
                        var keyA = a[0].weight,
                            keyB = b[0].weight;
                        if(keyA < keyB) return -1;
                        if(keyA > keyB) return 1;
                        return 0;
                    });
                }
            });

            $scope.thirdsTraces=[[],[],[]];
            $scope.binningByWeight(tagDateGroup, 3, $scope.thirdsTraces);

            var lowerThird = {
                x: days,
                y: $scope.thirdsTraces[0],
                mode: 'lines+markers',
                name: "Ave: Lower 1/3",
                line:{
                    color: 'rgba(255, 65, 54, 0.2)',
                    shape: 'spline'
                },
                fill: "tonexty",
                fillcolor: "rgba(255, 65, 54, 0.1)",
                type: 'scatter'
            };

            var middleThird = {
                x: days,
                y: $scope.thirdsTraces[1],
                mode: 'lines+markers',
                name: "Ave: Middle 1/3",
                line:{
                    color: 'rgba(44, 160, 101, 0.5)',
                    shape: 'spline'
                },
                fill: "tonexty",
                fillcolor: "rgba(44, 160, 101, 0.4)",
                type: 'scatter'
            };

            var upperThird = {
                x: days,
                y: $scope.thirdsTraces[2],
                mode: 'lines+markers',
                name: "Ave: Upper 1/3",
                fill: "tonexty",
                fillcolor: "rgba(93, 164, 214, 0.3)",
                line:{
                    color: 'rgba(93, 164, 214, 0.5)',
                    shape: 'spline'
                },
                type: 'scatter'
            };

            var thirdsLayout = {
                title: "Daily Herd Weight Average: Thirds",
                yaxis: {
                    title: "Weight (KG)",
                    range: [300, 500]
                },
                showlegend: true,
                legend: {"orientation": "h"}
            };

            var data = [total_weights, lowerThird, middleThird, upperThird];

            $scope.allTags.traces=[total_weights];
            $scope.allTags.layout=layout;

            $scope.allTags.thirdsTraces=[lowerThird, middleThird, upperThird];
            $scope.allTags.thirdsLayout=thirdsLayout;


            $scope.weeks=[];
            $scope.prepareWeeklyData(dateGroup, $scope.weeks);

            $scope.weeklyTrace= $scope.prepareWeeklyTrace($scope.weeks, $scope.weeklyTrace);

            debugger;




        };

    };



    $scope.init();

   

    $scope.binningByWeight= function(data, groups, traces){
        data.forEach(function(d){
            if(d[0] && d[0][0] && d.length>0){

                var bin=Math.floor(d.length/groups);

                if(traces && traces.length>2) {

                    var index0=traces[0].length;
                    var index1=traces[1].length;
                    var index2=traces[2].length;

                    var count0=0;
                    var count1=0;
                    var count2=0;

                    for (var i = 0; i < d.length; i++) {
                        if (i == 0) {traces[0].push(d[i][0].weight); count0++;}
                        else if (i < bin) {traces[0][index0] += d[i][0].weight; count0++;}
                        else if (i == bin ) {traces[1].push(d[i][0].weight); count1++;}
                        else if (i < 2 * bin) {traces[1][index1] += d[i][0].weight; count1++;}
                        else if (i == 2 * bin || bin==0) {traces[2].push(d[i][0].weight); count2++;}
                        else if (i < d.length) {traces[2][index2] += d[i][0].weight; count2++;}
                    }

                    if(traces[0][index0] && count0>0) traces[0][index0]/=count0; else traces[0][index0]=NaN;
                    if(traces[1][index1] && count1>0) traces[1][index1]/=count1; else traces[1][index1]=NaN;
                    if(traces[2][index2] && count2>0) traces[2][index2]/=count2; else traces[2][index2]=NaN;
                }
            }
        });
    }

    $scope.averageMultipleWeightsAndFilter= function(data){


        if(data &&  data.length>0){
            data.forEach(function(e){
                if(e && e.length>0){

                    var sum=0;
                    var count=0;
                    var average=0;
                    for(var i=0; i<e.length; i++){
                        if(e[i].weight<=thresholdWeight){
                            sum+=e[i].weight;
                            count++;
                        }
                    }

                    if(count>0){
                        average=sum/count;
                    }
                    else{
                        //no data for this tag so remove this tag
                        average=-1;
                    }

                    e[0].weight=average; //total_weight is still the old one?
                    e.splice(1, e.length-1);
                }
            });

            for(var j=0; j< data.length; j++){
                if(data[j] && data[j].length && data[j].length>0){
                    if(data[j][0].weight==-1 || data[j][0].id=='-1'){
                        data.splice(j,1);
                        j--;
                    }
                }
            }

        }
    }

    $scope.prepareWeeklyData=function(days, weeks){

        var millis=1000*60*60*24*7;
        var currentDate=new Date();
        
        if(days && days.length>0 && weeks) {

            for (var i =days.length-1; i>=0; i--){

                //get the day from the first element

                var currentWeek={};
                
                if(currentDate && !isNaN(currentDate.getTime()))
                    currentWeek={
                        start: new Date(currentDate.getTime()-millis),
                        aveWt:0,
                        count: 0,
                        data: [],
                        idGroups: []
                    }

                
                var compareDate=null;
                if(days[i]  && days[i][0])
                    compareDate= new Date(days[i][0].date);
                

                while( days[i]  && days[i][0] && compareDate && currentDate && !isNaN(compareDate.getTime()) && !isNaN(currentDate.getTime())
                    && compareDate.getTime()>= (currentDate.getTime()-millis) && i>=0){
                    
                    currentWeek.data=currentWeek.data.concat(days[i]);
                    i--;
                    if(days[i]  && days[i][0])
                        compareDate= new Date(days[i][0].date);
                }


                currentWeek.idGroups = groupBy(currentWeek.data, function(item){
                    return [item.id];
                });


                debugger;
                var weeklyAve=0; var weeklyCount=0;
                if(currentWeek.idGroups) {
                    for (var y = 0; y < currentWeek.idGroups.length; y++) {
                        var tag=currentWeek.idGroups[y];
                        if(tag && tag[0] && tag[0].id=='-1'){
                            currentWeek.idGroups.splice(y,1);
                            y--;
                            continue;
                        }
                        var tagAve=0; var tagCount=0;
                        tag.forEach(function (t) {
                            if(t && t.weight<=thresholdWeight){
                                tagAve+=t.weight; tagCount++;
                            }
                        });
                        if(tagCount>0)
                            tagAve/=tagCount;

                        if(tagAve>0){
                            weeklyAve+=tagAve;
                            weeklyCount++;
                        }

                    }
                    if(weeklyCount>0)
                        weeklyAve/=weeklyCount;
                }

                debugger;
                currentWeek.aveWt=weeklyAve;
                currentWeek.count=weeklyCount


                weeks.push(currentWeek);

                if(currentDate && !isNaN(currentDate.getTime()))
                    currentDate=new Date(currentDate.getTime()-millis);

                i++;
                // compare with currentDate

            }
        }
    };

    $scope.prepareWeeklyTrace=function(weeks, trace){

        var x=[];
        var y=[];
        var z=[];
        var text=[];
        var color=[];
        var opacity=[];

        if(weeks && weeks.length>0)
        {
            for(var i=0; i< weeks.length; i++) {
                if(weeks[i]) {
                    debugger;

                    if(weeks[i].aveWt<=0) continue;

                    var weekStart=weeks[i].start.toISOString();

                    x.push(weeks[i].aveWt);
                    y.push(weekStart.substring(0, (weekStart.length - 14)));
                    z.push(weeks[i].count);
                    text.push('count: ' + weeks[i].count);

                    //rgba(93, 164, 214, 0.5) blue
                    // gba(255, 65, 54, 0.1) red pink
                    if(x.length==1){
                        color.push('rgba(93, 164, 214)');
                        opacity.push(0.5);
                    }
                    else if(x.length>1 && x[x.length-1]<x[x.length-2]){
                        color.push('rgba(255, 65, 54)');
                        opacity.push(0.1);
                    }
                    else{
                        color.push('rgba(93, 164, 214)');
                        opacity.push(0.5);
                    }
                }
            }
        }

        var bubble = {
            x: y,
            y: x,
            text: text,

            mode: 'markers',
            marker: {
                size: z
            }
        };

        var bubbleLayout = {
            title: "Weekly Herd Weight Average",
            yaxis: {
                title: "Weight (KG)"
            }
        };

        trace={
            traces: [bubble],
            layout: bubbleLayout
        };

        return trace;


    }

});