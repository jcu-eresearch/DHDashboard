var program = require('commander');
var mongoose = require('mongoose');
var db = require('../config/db');
var moment = require("moment");
var twix = require("twix");
var async = require("async");
var fs = require('fs');
const zlib = require('zlib');
var Readable = require('stream').Readable;


program
    .version('0.0.1')
    .description("Generate the DigitalHomestead's static compressed data files.")
    .usage('[options]')
    .option('-o, --output_dir [output_dir]', 'The Directory to write the data files to.')
    .parse(process.argv);

console.log(program.output_dir);

if (!process.argv.slice(2).length) {
    program.outputHelp();
    process.exit(1);
}

connectionsubject = mongoose.createConnection(db.urlSubjectViews);

var Weight = require("../app/models/WeightsSchema");

// console.log(process.env);

var static_dir = program.output_dir;


console.log("Output Directory: "+static_dir);
if(!fs.existsSync(static_dir)){
    console.log("Creating Directory: "+static_dir);
    fs.mkdirSync(static_dir);
}
static_dir=fs.realpathSync(static_dir);

function create_static_file(bucket, cb)
{
    console.log(bucket);
    Weight.aggregate([
        {$match:{"_id": bucket}},
        {
            $project:{ts: "$weights.ts"}
        },
        {
            $unwind : '$ts'
        },
        {
            $group: {
                _id: '$_id',
                max: {$max: '$ts'},
                count: {$sum: 1}
            }
        }
    ], function(err, results){

        console.log(results);
        if(results && results.length != 0)
        {
            var result = results[0];
            var json_out = result["_id"]+"_"+result["max"]+"_"+result["count"]+'.jsonz';
            var data_out = static_dir+"/"+json_out;
            console.log(json_out);
            if(!fs.existsSync(data_out)){
                Weight.findOne({"id":{"$ne": -1}}, {_id: 0, __v: 0, "weights._id":0})
                    .where({"_id": bucket})
                    .exec(function (err, weights) {
                        if(err)
                        {
                            cb(err);
                        }
                        weights.weights.sort(function(a,b){return a.ts - b.ts});
                        var buf = new Readable();
                        buf.push(JSON.stringify(weights));
                        buf.push(null);
                        const out = fs.createWriteStream(data_out);
                        var stream = buf.pipe(zlib.createGzip({level:9})).pipe(out);
                        stream.on("finish", function(err){
                            cb();
                        });
                    });
            }else
            {
                console.log("Skipping");
                cb();
            }
        }
        else
        {
            console.log("///////////////////////////////////////");
            cb();
        }
    });
}


Weight.find({}).exec(function (err, weights){


    var unwrappedData=[];
    if(weights && weights.length>0){
        weights.forEach(function(w){
            if(w && w.weights && w.weights.length>0){
                unwrappedData=unwrappedData.concat(w.weights);
            }
        });
    }


    var dailyIds={};
    var weeklyIds={};


    /** utility function for grouping data by different fields **/
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

    function weeklyHash(date){
        var curr = new Date(date); // get current date
        var first = curr.getDate() - curr.getDay(); // First day is the day of the month - the day of the week
        return new Date(curr.setDate(first)).toISOString().substr(0,10);
    }

    /** Perform analysis on the weight data**/
    function analyseData(dataSet){

        var dict={};
        var tagDict={};
        var relevantTags={};
        var dailyAverage={};
        var weeklyAverage={};
        var tagGraphs=[];

        var layout = {
            title: "Daily Individual Weight Trend",
            yaxis: {title: "Weight (KG)"},
            showlegend: false
        };


        if(!dataSet){
            console.log("No data available");
            return;
        }
        // Group the data by id
        var idGroup = groupBy(dataSet, function(item){
            return [item.id];
        });


        var firstDay=dataSet[0].date.toISOString().substr(0,10);
        var itr = moment.utc(new Date(firstDay)).twix(new Date()).iterate("days");
        var range=[];

        while(itr.hasNext()){
            range.push((itr.next().toDate()).toISOString().substr(0,10));
        }

        /** Iterate over all the ids and generate the individual graph for each animal **/
        for(var j=0; j<idGroup.length; j++){

            var d=idGroup[j];
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
            //remove all weights greater than the threshold weight
            for(var a=0; a<d.length; a++){
                // fix the date
                if(d[a].date && d[a].date.toISOString().substr)
                    d[a].datePosted=d[a].date.toISOString().substr(0,10); //moment(d[a].date).local().format("YYYY-MM-DD");
                // filter out weights
                if(d[a] && d[a].qa_flag && ( d[a].weight>600 || d[a].qa_flag=="INVALID" || d[a].qa_flag=="OUTLIER" ) ){
                    d.splice(a,1);
                    a--;
                }
            }

            if(d[0] && d[0].id=='-1') {
                idGroup.splice(j, 1);
                j--;
                continue;
            }

            if(d[0]){
                trace1["name"]=d[0].id+' Weight';
                trace1.x.push(d[0].datePosted);
                trace1.y.push(d[0].weight);
                trace1Counter++;
                tagDict[d[0].datePosted]=d[0].weight;
                if(dailyAverage[d[0].datePosted] && dailyAverage[d[0].datePosted].length && dailyAverage[d[0].datePosted].length>0){
                    var sum=d[0].weight;
                    if(dailyAverage[d[0].datePosted].length>=1)
                        sum=d[0].weight + dailyAverage[d[0].datePosted][ dailyAverage[d[0].datePosted].length-1].sum;
                    dailyAverage[d[0].datePosted].push({weight: d[0].weight, id: d[0].id, sum : sum});
                }
                else{
                    dailyAverage[d[0].datePosted]=[];
                    dailyAverage[d[0].datePosted].push({weight: d[0].weight, id: d[0].id, sum:  d[0].weight});
                }
                if(dailyIds[d[0].datePosted]){
                    dailyIds[d[0].datePosted][d[0].id]=1;
                }
                else {
                    dailyIds[d[0].datePosted]={};
                    dailyIds[d[0].datePosted][d[0].id]=1;
                }
                if(weeklyIds[weeklyHash(d[0].datePosted)]){
                    weeklyIds[weeklyHash(d[0].datePosted)][d[0].id]=1;
                }
                else {
                    weeklyIds[weeklyHash(d[0].datePosted)]={};
                    weeklyIds[weeklyHash(d[0].datePosted)][d[0].id]=1;
                }
            }

            //take average of multiple readings during one day
            for(var i=1; i<d.length; i++){
                var dt=d[i].datePosted, wt=d[i].weight;
                if(trace1Counter>0){
                    var dupSum = trace1.y[trace1Counter - 1], index = i, count = 1;
                    if (d[index].datePosted == d[index - 1].datePosted)
                        while (d[index] && d[index].datePosted == d[index - 1].datePosted
                        && index < d.length && d[index]) {
                            dupSum += d[index].weight;
                            index++;
                            count++;
                        }
                    if (count > 1) {
                        wt = dupSum / count;
                        trace1.y[trace1Counter - 1] = wt;
                        tagDict[d[index-1].datePosted] = wt;
                        if(dailyAverage[dt] && dailyAverage[dt].length && dailyAverage[dt].length>0){
                            var sum=wt;
                            if(dailyAverage[dt].length>=2)
                                sum=wt + dailyAverage[dt][ dailyAverage[dt].length-2].sum;
                            dailyAverage[dt][dailyAverage[dt].length-1]={weight: wt, id: d[0].id, sum : sum};
                        }
                        else{
                            dailyAverage[dt]=[];
                            dailyAverage[dt].push({weight: wt, id: d[0].id, sum: wt});
                        }
                        if(dailyIds[dt]){
                            dailyIds[dt][d[0].id]=1;
                        }
                        else {
                            dailyIds[dt]={};
                            dailyIds[dt][d[0].id]=1;
                        }
                        if(weeklyIds[weeklyHash(dt)]){
                            weeklyIds[weeklyHash(dt)][d[0].id]=1;
                        }
                        else {
                            weeklyIds[weeklyHash(dt)]={};
                            weeklyIds[weeklyHash(dt)][d[0].id]=1;
                        }
                        i = index - 1;
                        continue;
                    }
                }

                trace1.x.push(dt);
                trace1.y.push(wt);
                if(dailyIds[dt]){
                    dailyIds[dt][d[0].id]=1;
                }
                else {
                    dailyIds[dt]={};
                    dailyIds[dt][d[0].id]=1;
                }
                if(weeklyIds[weeklyHash(dt)]){
                    weeklyIds[weeklyHash(dt)][d[0].id]=1;
                }
                else {
                    weeklyIds[weeklyHash(dt)]={};
                    weeklyIds[weeklyHash(dt)][d[0].id]=1;
                }
                if(dailyAverage[dt] && dailyAverage[dt].length && dailyAverage[dt].length>=0){
                    var sum=wt;
                    if(dailyAverage[dt].length>=1)
                        sum=wt + dailyAverage[dt][ dailyAverage[dt].length-1].sum;
                    dailyAverage[dt].push({weight: wt, id: d[0].id, sum: sum})
                }
                else{
                    dailyAverage[dt]=[];
                    dailyAverage[dt].push({weight: wt, id: d[0].id, sum: wt});
                }
                trace1Counter++;
                tagDict[dt] = wt;
            }
            var traces=[trace1];
            if(d[0]) {
                tagGraphs.push({name:d[0].id, traces: traces, layout: layout});
                dict[d[0].id]={dict: tagDict, trace: trace1};
                if(j==0)selectedTag=tagGraphs[j];
            }
            if(d && d.length>0 ) {//change from 0 to 1 for multiple weights
                relevantTags[d[0].id]=true;
            }
        }

        function compare(a,b) {
            if(a && a.weight && b && b.weight ){
                return a.weight - b.weight;
            }
        }

        var sortedDays=[];
        for (var day in dailyAverage){
            if (dailyAverage.hasOwnProperty(day)) {
                sortedDays.push(day);
            }
        }
        sortedDays.sort();

        /** This is for the daily and weekly average graphs**/
        var dailyAverageDays=[];
        var dailyAverageWeights=[];
        var thirdsTraces=[[],[],[]];
        for (var counter=0; counter<sortedDays.length; counter++) {

            var day=sortedDays[counter];
            if (dailyAverage.hasOwnProperty(day)) {
                if(dailyAverage[day] && dailyAverage[day].length>0){
                    dailyAverageDays.push(day);
                    if(dailyAverage[day][dailyAverage[day].length-1]) {
                        var aveWeight = dailyAverage[day][dailyAverage[day].length - 1].sum / dailyAverage[day].length;
                        dailyAverageWeights.push(aveWeight);

                        if(weeklyAverage[weeklyHash(day)] && weeklyAverage[weeklyHash(day)].weights ){
                            weeklyAverage[weeklyHash(day)].weights=weeklyAverage[weeklyHash(day)].weights+aveWeight;
                            (weeklyAverage[weeklyHash(day)].days)++;
                        }
                        else{
                            weeklyAverage[weeklyHash(day)]={weights: aveWeight, days: 1};
                        }
                    }
                    //also sort while iterating
                    dailyAverage[day].sort(compare);

                    //Prepare thirds graphs
                    var bin=Math.floor(dailyAverage[day].length/3);
                    if(dailyAverage[day]) {
                        var index0=thirdsTraces[0].length;
                        var index1=thirdsTraces[1].length;
                        var index2=thirdsTraces[2].length;
                        var count0=0;
                        var count1=0;
                        var count2=0;
                        for (var i = 0; i < dailyAverage[day].length; i++) {
                            if (i == 0) {thirdsTraces[0].push(dailyAverage[day][i].weight); count0++;}
                            else if (i < bin) {thirdsTraces[0][index0] += dailyAverage[day][i].weight; count0++;}
                            else if (i == bin ) {thirdsTraces[1].push(dailyAverage[day][i].weight); count1++;}
                            else if (i < 2 * bin) {thirdsTraces[1][index1] += dailyAverage[day][i].weight; count1++;}
                            else if (i == 2 * bin || bin==0) {thirdsTraces[2].push(dailyAverage[day][i].weight); count2++;}
                            else if (i < d.length) {thirdsTraces[2][index2] += dailyAverage[day][i].weight; count2++;}
                        }
                        if(thirdsTraces[0][index0] && count0>0) thirdsTraces[0][index0]/=count0; else thirdsTraces[0][index0]=NaN;
                        if(thirdsTraces[1][index1] && count1>0) thirdsTraces[1][index1]/=count1; else thirdsTraces[1][index1]=NaN;
                        if(thirdsTraces[2][index2] && count2>0) thirdsTraces[2][index2]/=count2; else thirdsTraces[2][index2]=NaN;
                    }
                }
            }
        }

        var sortedWeeks=[];
        for (var aWeek in weeklyAverage) {
            sortedWeeks.push(aWeek);
        }

        sortedWeeks.sort();
        var sortedWeekWeights=[];
        var sortedWeekCounts=[];
        var text=[];

        for (var k=0; k<sortedWeeks.length; k++) {
            var week=sortedWeeks[k];
            if (weeklyAverage.hasOwnProperty(week) && weeklyAverage[week].days && weeklyAverage[week].days>0) {
                if(weeklyAverage[week]){
                    weeklyAverage[week].weights/=weeklyAverage[week].days;
                    sortedWeekWeights.push(weeklyAverage[week].weights);
                    var weeklyIdCount=Object.keys(weeklyIds[week]).length;
                    sortedWeekCounts.push(weeklyIdCount);
                    text.push('count: ' + weeklyIdCount);
                }
            }
        }

        var bubble = {
            x: sortedWeeks,
            y: sortedWeekWeights,
            text: text,
            mode: 'markers',
            marker: {
                size: sortedWeekCounts
            }
        };
        var bubbleLayout = {
            title: "Weekly Herd Weight Average",
            yaxis: {
                title: "Weight (KG)"
            }
        };


        var totalWeights = {
            x: dailyAverageDays,
            y: dailyAverageWeights,
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

        var thirdsTraces=thirdsTraces;

        var lowerThird = {
            x: dailyAverageDays,
            y: thirdsTraces[0],
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
            x: dailyAverageDays,
            y: thirdsTraces[1],
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
            x: dailyAverageDays,
            y: thirdsTraces[2],
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
                range: [300, 600]
            },
            showlegend: true,
            legend: {"orientation": "h"}
        };



        var allTags={};

        allTags.traces=[totalWeights];
        allTags.layout=layout;
        allTags.thirdsTraces=[lowerThird, middleThird, upperThird];
        allTags.thirdsLayout=thirdsLayout;

        allTags.weeklyTrace={
            traces: [bubble],
            layout: bubbleLayout
        };

        allTags.tagGraphs=tagGraphs;

        createStaticFile(allTags);


    }


    function createStaticFile(results){

        if(results){
            var json_out = 'staticFileTest.jsonz';
            var data_out = static_dir+"/"+json_out;
            console.log(json_out);
            if(!fs.existsSync(data_out)){

                        var buf = new Readable();
                        buf.push(JSON.stringify(results));
                        buf.push(null);
                        const out = fs.createWriteStream(data_out);
                        var stream = buf.pipe(zlib.createGzip({level:9})).pipe(out);
                        stream.on("finish", function(){
                            console.log("finish");
                        });

            }else
            {   console.log("Skipping");
            }
        }
        else
        {
            console.log("///////////////////////////////////////");
        }
    }

    analyseData(unwrappedData);
    

});

