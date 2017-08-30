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
console.log('');

if(!program.output_dir)
{
    console.log('Output Directory required.');
    console.log('');
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

function create_static_file(bucket, cb) {
    console.log(bucket);
    Weight.aggregate([
        {$match:{"_id": bucket}},{
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
            // if(!fs.existsSync(data_out)){
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
            // }else
            // {
            //     console.log("Skipping");
            //     cb();
            // }
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

    var tagCounts=tagCounters();

    /** Get the first day of the week from a date **/
    function weeklyHash(date){
        var curr = new Date(date); // get current date
        var first = curr.getDate() - curr.getDay(); // First day is the day of the month - the day of the week
        return new Date(curr.setDate(first)).toISOString().substr(0,10);
    }

    /** Get the first day of the month from a date **/
    function monthlyHash(date){
        var curr = new Date(date); // get current date
        return new Date(curr.setDate(1)).toISOString().substr(0,10);
    }

    /** this is for quickly counting ids/tags over days, weeks and months**/
    function tagCounter(hash){
        var tagList={};
        var fn=hash?hash:null;

        function addTag(tag, dy){
            var day=dy;
            if(fn) day=fn(dy);
            if(!tagList[day])
                tagList[day]={};
            tagList[day][tag]=1;
        }

        function getTagCount(dy){

            var day=dy;
            if(fn) day=fn(dy);
            return tagList[day]?Object.keys(tagList[day]).length:0;
        }

        function getTagCounts(){
            var sorted=[];

            for(var timeUnit in tagList)
                sorted.push(timeUnit);
            sorted.sort();

            var sortedCounts=[];
            for (var k=0; k<sorted.length; k++) {
                var u=sorted[k];
                var count=Object.keys(tagList[u]).length;
                sortedCounts.push(count);
            }

            //chronologically
            return sortedCounts;
        }

        return {
            add: addTag,
            getCount: getTagCount,
            getCounts: getTagCounts
        }
    }

    /** managing all the tag counters here **/
    function tagCounters(){

        var counters=[
            tagCounter(),
            tagCounter(weeklyHash),
            tagCounter(monthlyHash)
        ];

        var ind={
            daily : 0,
            weekly : 1,
            monthly: 2
        };

        function add(tag, day){
            counters.forEach(function(d){
                d.add(tag, day);
            })
        }

        function getCount(name, day){
            return counters[ind[name]].getCount(day);
        }

        function getCounts(name){
            return counters[ind[name]].getCounts();
        }

        return {
            add: add,
            getCount: getCount,
            getCounts: getCounts
        }
    }

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

    /** utility function for calculating the difference between two dates **/
    Date.daysBetween = function( d1, d2 ) {
        //Get 1 day in milliseconds
        var one_day=1000*60*60*24;

        var date1=new Date(d1);
        var date2=new Date(d2);
        // Convert both dates to milliseconds
        var date1_ms = date1.getTime();
        var date2_ms = date2.getTime();

        // Calculate the difference in milliseconds
        var difference_ms = date2_ms - date1_ms;

        // Convert back to days and return
        return Math.round(difference_ms/one_day);
    };

    /** convert tag id to lat lon **/
    function tagIdToLatLong(tag){
        if(tag=="110177") return "-19.66882,146.864"; //Spring Creek
        else if(tag=="110171") return "-19.66574,146.8462"; //Double Barrel
        else if(tag=="110163") return "-19.66872,146.8642"; //Junction//-19.66872,146.8642
    }

    /** convert tag id to location name **/
    function tagIdToLocationName(tag){
        if(tag=="110177") return "Spring Creek";
        else if(tag=="110171") return "Double Barrel";
        else if(tag=="110163") return "Junction";
    }

    /** convert the date from a date object to YYYY-MM-dd string **/
    function fixDate(d){
        if(d.date && d.date.toISOString().substr)
            return d.date.toISOString().substr(0,10);
        else return "";
    }

    /** compare the record against different thresholds return true if it should be filtered **/
    function checkOutlier(d){
        if(!(d.qa_flag) ||
            (d && d.qa_flag &&
            ( d.weight<300 || d.weight>650
                || d.qa_flag=="INVALID" || d.qa_flag=="OUTLIER" )) ){
            return true; //it is an outlier etc
        }
        else return false;
    }

    /** add this data point to the outliers array **/
    function addToOutliersArray(d, outlierArray, counter){
        if(d && d.datePosted && d.weight) {
            outlierArray.x.push(d.datePosted);
            outlierArray.y.push(d.weight);
            counter++;
            return counter;
        }
        return 0;
    }

    /** prepare records for dc.js **/
    function addRecord(arr, d, recordCounter, delta){
        arr.push({
            date: d.date,
            weight: d.weight,
            id: d.id,
            location: tagIdToLatLong(d.tag_id),
            locationName: tagIdToLocationName(d.tag_id),
            change: delta,
            index: recordCounter
        });
    }

    /** push record for dailyAverage **/
    function insertDailyAverage(arr, w, i, s, r){
        arr.push({
            weight: w,
            id: i,
            sum:  s,
            index: r
        });
    }

    /** this is for quick averaging over all days**/
    function addToDailyAverage(dailyAverage, recordCounter, d, weight, date){
        var dt= date? date: d.datePosted;
        var wt= weight? weight: d.weight;

        //does this day already have weight data?
        if(dailyAverage[dt]
            && dailyAverage[dt].length
            && dailyAverage[dt].length>0){
            var l=dailyAverage[dt].length;
            var sum=wt;
            if(l>=1)
                sum=wt +
                    dailyAverage[dt][l-1].sum;
            //push the sum up till now
            insertDailyAverage(dailyAverage[dt], wt,
                d.id, sum ,recordCounter);
        }
        else{
            //initialize this day
            dailyAverage[dt]=[];
            insertDailyAverage(dailyAverage[dt], wt,
                d.id, wt ,recordCounter);
        }
        return dailyAverage;
    }

    /** this is for correcting the averages when there are duplicates**/
    function correctDailyAverage(dailyAverage, dt, wt, recordCounter, d){

        var l=dailyAverage[dt].length;
        if(dailyAverage[dt] && l && l>0){
            var sum=wt;
            if(l>=2)
                sum=wt + dailyAverage[dt][ l-2].sum;
            var previous=dailyAverage[dt][l-1].index;
            dailyAverage[dt][l-1]={
                weight: wt,
                id: d.id,
                sum : sum,
                index: previous
            };
        }
        else{
            dailyAverage[dt]=[];
            insertDailyAverage(dailyAverage[dt], wt,
                d.id, wt ,recordCounter);
        }
        return dailyAverage;
    }


    function averager(){

        var averages={};

        function insert(day, tag, weight, index){
            if(!averages[day])
                averages[day]=[];

            var len=averages[day].length-1;
            var sum=0;
            if(len>=0)
                sum=averages[day][len].sum;

            sum+=weight;

            averages[day].push({
                weight: weight,
                id: tag,
                sum:  sum,
                index: index
            });
        }

        function correct(day, tag, weight, index){
            if(!averages[day] || averages[day].length<1) {
                insert(day, tag, weight, index);
                return;
            }
            var sum=weight;
            var l=averages[day].length;
            //overwrite the previous weight
            if(l>=2)
                sum=weight + averages[day][l-2].sum;
            //retain the previous index
            var previous=averages[day][l-1].index;
            averages[day][l-1]={
                weight: weight,
                id: tag,
                sum : sum,
                index: previous
            }
        }

        function getAverage(day){
            if(!averages[day] || averages[day].length<1)
                return 0;
            var l=averages[day].length;
            return averages[day][l-1].sum/l;

        }

        function getDailyAverages(){
            var sorted=[];

            for(var timeUnit in averages)
                sorted.push(timeUnit);
            sorted.sort();

            var sortedAves=[];
            for (var k=0; k<sorted.length; k++) {
                var u=sorted[k];
                var ave=getAverage(u);
                sortedAves.push(ave);
            }

            //chronologically
            return sortedAves;
        }

        function getAves(hash){
            var sorted=[];
            for(var timeUnit in averages)
                sorted.push(hash(timeUnit));
            sorted.sort();

            var sortedAves=[];

            var unit, sum, count;
            for (var k=0; k<sorted.length; k++) {
                //initialize
                unit=sorted[k];
                sum=getAverage(timeUnit);
                count=1;

                k++;
                var u=sorted[k];
                while(u && u==unit && k<sorted.length){
                    sum+=getAverage(u);
                    count++;
                    k++;
                    u=(k<sorted.length)?sorted[k]:null;
                }
                sum/=(count>0)?count:1;
                sortedAves.push(sum);


            }

            return sortedAves;
        }

        return {
            insert: insert,
            correct: correct,
            getAverage: getAverage,
            getDailyAverages: getDailyAverages,
            getAves: getAves
        };
    }


    /** correct for multiple weights collected for the same tag during one day **/
    function correctWeights(r, c, w){
        c=c-1; //points to last record
        r[c].weight=w;
        if(c>1){ //are there at least two records?
            r[c].change = w - r[c - 1].weight; // delta of the weight
            var btw=Date.daysBetween( r[c - 1].date,r[c].date);
            if(btw>1)r[c].change=r[c].change/btw; //divide by number of days in between
        }
    }

    /** add name and first reading to a weight trace for an animal **/
    function initTrace(t, c, d){
        t["name"]=d.id+' Weight';
        t.x.push(d.datePosted);
        t.y.push(d.weight);
        return c+1;
    }

    /** initialize the appearance of a trace **/
    function initTraceLayout(mode, color, type, name){
        var n=name?name:"";
        return {
            x:[],
            y:[],
            mode: mode,
            line:{
                color: color
            },
            type: type,
            name:n
        };
    }

    /** detect duplicate weights for one day **/
    function detectDuplicates(trace,traceCounter,d,i){
        var dupSum = trace.y[traceCounter - 1], index = i, count = 1;
        if (d[index].datePosted == d[index - 1].datePosted) {
            while (d[index] && d[index].datePosted == d[index - 1].datePosted
            && index < d.length && d[index]) {
                dupSum += d[index].weight;
                index++;
                count++;
            }
        }
        if(count>1) return {sum : dupSum, index: index-1, count: count};
        else return null;
    }

    /** for sorting an array based on weights **/
    function compare(a,b) {
        if(a && a.weight && b && b.weight ){
            return a.weight - b.weight;
        }
    }

    /** divide the accumulated sum by length to get average weight for a day **/
    function calculateAverageForDay(arr, targetArr, day){
        var ave=0;
        if(arr && arr[day] && arr[day][arr[day].length-1]){
            ave=arr[day][arr[day].length-1].sum/arr[day].length;
            targetArr.push(ave); //the target array now has the ave wt for day
        }
        return ave;
    }

    /** for calculating the weekly average from the daily average **/
    function addToAverage(arr, day, fn, ave){
        //fn is the weekly hash
        if(arr && arr[fn(day)] && arr[fn(day)].weights && arr[fn(day)].days){
            arr[fn(day)].weights+=ave; // sum for days in this week
            (arr[fn(day)].days)++; // days in this week which had data
        }
        else{
            arr[fn(day)]={weights: ave, days: 1}; //first day seen for this week
        }
    }

    /** sort an array and assign rank based on weight **/
    function assignRanks(arr, day, records, compare){
        arr[day].sort(compare);

        var len=arr[day].length;
        var rank=1;
        for(var i=len-1; i>=0; i-- ){

            //this links back to the records array
            //rank is used in the trends page
            records[(arr[day][i]).index].rank=rank;
            rank++;
        }
    }

    /** calculate average weight for a trace **/
    function calcAveForTrace(trace, index,count){
        if(trace[index] && count>0)
            trace[index]/=count;
        else trace[index]= NaN;
    }

    /** split weight into three bins, take average for each bin to prepare daily ave thirds **/
    function addToThirdsTraces(dailyAverage, day, thirdsTraces){
        var bin=Math.floor(dailyAverage[day].length/3);

        if(dailyAverage[day]){

            var index0=thirdsTraces[0].length;
            var index1=thirdsTraces[1].length;
            var index2=thirdsTraces[2].length;
            var count0=0,count1=0,count2=0;

            for (var i = 0; i < dailyAverage[day].length; i++){
                var wt=dailyAverage[day][i].weight;
                if (i == 0) {
                    thirdsTraces[0].push(wt);
                    count0++;
                }
                else if (i < bin){
                    thirdsTraces[0][index0] += wt;
                    count0++;
                }
                else if (i == bin ){
                    thirdsTraces[1].push(wt);
                    count1++;
                }
                else if (i < 2 * bin){
                    thirdsTraces[1][index1] += wt;
                    count1++;
                }
                else if (i == 2 * bin || bin==0){
                    thirdsTraces[2].push(wt);
                    count2++;
                }
                else if (i <  dailyAverage[day].length){
                    thirdsTraces[2][index2] += wt;
                    count2++;
                }
            }
            calcAveForTrace(thirdsTraces[0], index0, count0);
            calcAveForTrace(thirdsTraces[1], index1, count1);
            calcAveForTrace(thirdsTraces[2], index2, count2);
        }

    }

    /** group data by a certain parameter **/
    function groupByParameter(param, data){
        return groupBy(data, function(item){
            return [item[param]];
        });
    }

    /** find the latest date with valid data **/
    function findLatestDate(dataSet){
        var lastDate= (new Date()).toISOString().substr(0,10);
        var dateGroup = groupByParameter("date", dataSet);
        if(dateGroup && dateGroup.length>0){
            var count=dateGroup.length-1;
            var last= {};
            while (count >0){
                last=dateGroup[count--];
                if(last && last.length>0 && last[0]){
                    var l=last[0];
                    var d= l.date;
                    if(d && l.qa_flag && l.qa_flag=="VALID"){
                        var dt=new Date(d);
                        if(Object.prototype.toString.call(d) === "[object Date]"
                            && !(isNaN(d.getTime())))
                            return fixDate(l);
                    }
                }
            }
        }
        return lastDate;
    }

    /** return initialized record for trends page records **/
    function initRecord(d,c){
        return {
            date: d.date,
            weight: d.weight,
            id: d.id,
            location: tagIdToLatLong(d.tag_id),
            locationName: tagIdToLocationName(d.tag_id),
            index: c
        }
    }

    /** add a wt and dt to a trace **/
    function addToTrace(trace, c, dt, wt){
        trace.x.push(dt);
        trace.y.push(wt);
        c++;
        return c;
    }

    /** check if there is any data **/
    function empty(data){
        if(!data || !data.length || data.length<=0) {
            console.log("No Data Available");
            return true;
        }
        return false;
    }

    /** sort days **/
    function getSortedDays(dailyAve) {
        var sortedDays=[];
        for (var day in dailyAve){
            if (dailyAve.hasOwnProperty(day)) {
                sortedDays.push(day);
            }
        }
        return sortedDays.sort();
    }

    /** This is for calculating the daily and weekly averages **/
    function prepareAveTraces(dailyAve, weeklyAve, recs ){
        var sortedDays=getSortedDays(dailyAve);
        var days=[];
        var weights=[];
        var tr=[[],[],[]];
        for (var c=0; c<sortedDays.length; c++) {
            var day=sortedDays[c];

            if (dailyAve.hasOwnProperty(day)) {
                if(dailyAve[day] && dailyAve[day].length>0){
                    days.push(day);
                    var aveWeight=calculateAverageForDay(dailyAve,weights,day);
                    addToAverage(weeklyAve, day, weeklyHash, aveWeight);
                    assignRanks(dailyAve, day, recs, compare);
                    addToThirdsTraces(dailyAve, day, tr);
                }
            }
        }
        var daily={days: days, weights: weights};
        return {thirds: tr,  daily: daily};
    }

    function sortTracesById(traces){

        traces.sort(function(a, b){
            var keyA = a.name,
                keyB = b.name;
            return keyA.localeCompare(keyB);
        });
    }


    /** Perform analysis on the weight data **/
    function analyseData(dataSet){

        if(empty(dataSet)) return;

        var dailyAverage={};
        var weeklyAverage={};
        var tagGraphs=[];
        var alertedTags=[];
        var today2=new Date();
        var yesterday= new Date(today2-1000*60*60*24);
        today2=today2.toISOString().substring(0,10);
        yesterday=yesterday.toISOString().substring(0,10);
        var today=findLatestDate(dataSet);
        var layout = {
            title: "Daily Individual Weight Trend",
            yaxis: {title: "Weight (KG)"},
            showlegend: false
        };

        // Group the data by id
        var idGroup = groupByParameter("id", dataSet);

        var firstDay=dataSet[0].date.toISOString().substr(0,10);
        var itr = moment.utc(new Date(firstDay)).twix(new Date()).iterate("days");
        var range=[];
        while(itr.hasNext()){
            range.push((itr.next().toDate()).toISOString().substr(0,10));
        }

        var records=[];
        var recordsForToday=[];
        var recordCounter=0;
        var recordsForTodayCounter=0;

        /** Iterate over all the ids and generate the individual graph for each animal **/
        for(var j=0; j<idGroup.length; j++){

            var d=idGroup[j];

            //filter out -1 tag
            if (d && d[0] && d[0].id == '-1') {
                idGroup.splice(j, 1);
                j--;
                continue;
            }
            //trace for the weights
            var traceCounter = 0;
            var trace = initTraceLayout('lines+markers', '#66bb6a', 'scatter');

            //trace for the outliers
            var outlierTraceCounter = 0;
            var outlierTrace = initTraceLayout('markers', '#e98686', 'scatter', 'Outlier');

            //for detecting outliers
            var outlierYesterday = false;
            var outlierToday = false;
            var alerted = false;

            //fix dates, check for outliers and set up alerts
            for (var a = 0; a < d.length; a++) {
                d[a].datePosted = fixDate(d[a]);
                //filter outliers
                if (checkOutlier(d[a])) {
                    addToOutliersArray(d[a], outlierTrace, outlierTraceCounter);
                    //detect consecutive outliers
                    if (d && d.datePosted) {
                        if (d.datePosted == yesterday) outlierYesterday = true;
                        if (d.datePosted == today2) outlierToday = true;
                    }
                    d.splice(a, 1);
                    a--;
                }
            }

            //setting up the main trace here
            if(d[0]) {
                //consecutive outliers have been detected
                if (outlierToday && outlierYesterday) {
                    alertedTags.push(d[0].id);
                    alerted = true;
                }
                traceCounter = initTrace(trace, traceCounter, d[0]);
                //this is for dc.js
                addRecord(records, d[0], recordCounter, 0);
                addToDailyAverage(dailyAverage, recordCounter, d[0]);
                recordCounter++;
                //this is for main dash stats for the latest date
                if (d[0].datePosted == today) {
                    addRecord(recordsForToday, d[0], recordCounter, 0);
                    recordsForTodayCounter++;
                }

                tagCounts.add(d[0].id, d[0].datePosted);
            }

            //take average of multiple readings during one day
            for (var i = 1; i < d.length; i++) {
                var dt = d[i].datePosted,
                    wt = d[i].weight;
                //Push this initial reading into records for trends page
                var rec = initRecord(d[i], recordCounter);

                if (traceCounter > 0) {
                    var detect = detectDuplicates(trace, traceCounter, d, i);
                    if (detect) {
                        wt = detect.sum / detect.count;
                        trace.y[traceCounter - 1] = wt;

                        correctWeights(records, recordCounter, wt);
                        if (dt == today)
                            correctWeights(recordsForToday, recordsForTodayCounter, wt);
                        correctDailyAverage(dailyAverage, dt, wt, recordCounter, d[0]);

                        tagCounts.add(d[0].id, dt);
                        i = detect.index;
                        continue;
                    }
                }

                traceCounter=addToTrace(trace, traceCounter, dt, wt);
                //weight and change in weight for trends
                rec.weight = wt;
                rec.change = wt - records[recordCounter - 1].weight;
                var btwDays = Date.daysBetween(records[recordCounter - 1].date, rec.date);
                if (btwDays > 1) rec.change = rec.change / btwDays;
                records.push(rec);
                addToDailyAverage(dailyAverage, recordCounter, d[0], wt, dt);
                recordCounter++;
                //weight and change in weight for latest date
                if (dt == today){
                    recordsForToday.push(rec);
                    recordsForTodayCounter++;
                }
                tagCounts.add(d[0].id, dt);
            }

            //add the trace for this animal
            var traces = [trace, outlierTrace];

            if(d[0])
            {
                tagGraphs.push({
                    name: d[0].id,
                    traces: traces,
                    layout: layout,
                    alerted: alerted
                });
            }
        }

        sortTracesById(tagGraphs);


        var aveTraces=prepareAveTraces(dailyAverage, weeklyAverage, records);
        var thirdsTraces=aveTraces.thirds;
        var dailyTrace=aveTraces.daily;

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
                    var weeklyIdCount= tagCounts.getCount("weekly", week);
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
            x: dailyTrace.days,
            y: dailyTrace.weights,
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
            x: dailyTrace.days,
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
            x: dailyTrace.days,
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
            x: dailyTrace.days,
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
                range: [300, 650]
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
        allTags.alertedTags=alertedTags;
        allTags.records=records;
        allTags.recordsForToday=recordsForToday;

        createStaticFile(allTags);
    }


    function createStaticFile(results){

        if(results){
            var json_out = 'staticFileTest.jsonz';
            var data_out = static_dir+"/"+json_out;
            console.log(json_out);
            // if(!fs.existsSync(data_out)){

                        var buf = new Readable();
                        buf.push(JSON.stringify(results));
                        buf.push(null);
                        const out = fs.createWriteStream(data_out);
                        var stream = buf.pipe(zlib.createGzip({level:9})).pipe(out);
                        stream.on("finish", function(){
                            console.log("finish");
                            process.exit(0);
                        });

            // }else
            // {   console.log("Skipping");
            // }
        }
        else
        {
            console.log("///////////////////////////////////////");
        }
    }

    analyseData(unwrappedData);
    

});

