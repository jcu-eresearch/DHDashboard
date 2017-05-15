

var mongoose = require('mongoose');
var db = require('../../config/db');

var moment = require("moment");
// var parsedJSON = require('./weights');
var locks = require('locks');
var async = require("async");
var request = require('request');


connectionsubject = mongoose.createConnection(db.urlSubjectViews);


var Weight = require("../../app/models/WeightsSchema");
var WeightReading = require("../../app/models/WeightReadingSchema").model;

function ins(ins_data, cb) {

        var bucket = moment(ins_data.ts * 1000).format("YYYY_MM");
        ins_data.qa_flag = null;
        Weight.update(
            {"_id": bucket},
            {
                "$push": {
                    "weights":{
                        "$each":[ins_data],
                        // "$sort": {"$ts": 1}
                    }
                }
            },
            cb
        );
}

function create_bucket(bucket)
{
    var ins = Weight({
        _id: bucket,
        weights: []
    });
    // ins.save(cb);
    return ins;
}

function save_bucket(data, cb)
{
    data.save(cb);
}

function ingest(parsedJSON) {

    parsedJSON.sort(function(a,b){
        return a.ts - b.ts;
    });

    var buckets = {};

    for (i = 0; i < parsedJSON.length; i++) {
        var bucket = moment(parsedJSON[i].ts * 1000).format("YYYY_MM");
        var ins_data = parsedJSON[i];
        ins_data.qa_flag = null;
        if(buckets[bucket] == undefined)
        {
            buckets[bucket] = create_bucket(bucket);
        }
        buckets[bucket].weights.push(WeightReading(ins_data));
    }


    var bk = [];
    for(var i in buckets)
    {
        buckets[i].weights.sort(function(a,b){
            return a.ts - b.ts;
        });

        bk.push(buckets[i]);

    }

    async.eachSeries(buckets, save_bucket, function (err) {
        console.log("Done");
        process.exit(0);
    });

}


request("https://digitalhomestead.hpc.jcu.edu.au/dashboard/api/weights", function(error, response, body){
    if (!error && response.statusCode == 200) {
        var data = JSON.parse(body);
        console.log("Data length:", data.length);
        ingest(data);
    }
});








