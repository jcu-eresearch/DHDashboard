

var mongoose = require('mongoose');
var db = require('../../config/db');

var moment = require("moment");
// var parsedJSON = require('./weights');
var locks = require('locks');
var async = require("async");
var request = require('request');


connectionsubject = mongoose.createConnection(db.urlSubjectViews);


var Weight = require("../../app/models/WeightsSchema");

var mutex = locks.createMutex();

function ins(ins_data, cb) {

        var bucket = moment(ins_data.ts * 1000).format("YYYY_MM");
        ins_data.qa = null;
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

function create_bucket(bucket, cb)
{
    var ins = Weight({
        _id: bucket,
        weights: []
    });
    ins.save(cb);
}

function ingest(parsedJSON) {

    var buckets = [];

    for (i = 0; i < parsedJSON.length; i++) {
        var bucket = moment(parsedJSON[i].ts * 1000).format("YYYY_MM");
        if (buckets.indexOf(bucket) == -1) {
            buckets.push(bucket);
        }
    }

    console.log(buckets);

    var d = {};
    var count = 0;

    async.eachSeries(buckets, create_bucket, function (err) {

        for (i = 0; i < parsedJSON.length; i++) {

            (function (i) {
                ins(parsedJSON[i], function (a, b) {
                    if (d[i] == undefined) {
                        // console.log(count, i, a,b);
                        d[i] = 0;
                    }
                    else {
                        d[i]++;
                        // console.log(count, "Repeat", i, a,b);
                    }
                    count++;
                    if (count % 100 == 0) {
                        console.log(count, i, a, b);
                    }
                    if (count >= parsedJSON.length) {
                        console.log(count, parsedJSON.length);
                    }
                    if(count == parsedJSON.length)
                    {
                        console.log("Done");
                    }

                })

            })(i);
        }
    });
}


request("https://digitalhomestead.hpc.jcu.edu.au/dashboard/api/weights", function(error, response, body){
    if (!error && response.statusCode == 200) {
        var data = JSON.parse(body);
        console.log("Data length:", data.length);
        ingest(data);
    }
});








