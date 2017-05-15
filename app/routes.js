var Weight = require('./models/WeightsSchema');
var Stations = require("./models/StationsSchema");
var Status = require("./models/StatusSchema");
var Location = require("./models/LocationSchema");
var sanitize = require('mongo-sanitize');
var moment = require("moment");
var fs = require('fs');

// console.log(fs);


var ETAG_VERSION = 1;


module.exports = function (app, enable_static, static_dir, static_path) {

    app.get('/api/weights', function (req, res) {
        Weight.find({}, {__v: 0}).sort({ts: 'asc'}).exec(function (err, weights) {
            // console.log(weights);
            res.json(weights)
        });
    });

    app.get('/api/weights/buckets', function (req, res) {

        Weight.find({}, "_id").exec(function (err, weights) {
            var r = [];
            for(var i = 0; i < weights.length; i++)
            {
                r.push(weights[i]["_id"]);
            }
            res.json(r)
        });

    });

    app.get('/api/weights/ids', function (req, res) {

        Weight.distinct("weights.id", function (error, ids) {
            if(error)
            {
                console.log(error);
                res.status(500);
                res.end();
            }
            res.json(ids)
        });

    });

    app.get('/api/weights/:bucket', function (req, res) {
        var request_etag = req.header('if-none-match');
        var bucket = sanitize(req.params['bucket']);
        console.log(request_etag);
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
                var jon_file_name = result["_id"] + "_" + result["max"] + "_" + result["count"]+".jsonz";
                var json_static_file = static_dir +"/"+ jon_file_name;
                console.log(json_static_file);
                if(fs.existsSync(json_static_file) && enable_static)
                {
                    var redirect_url = static_path+"/"+jon_file_name;
                    console.log("Sending Redirect: "+redirect_url);
                    res.writeHead(302, {
                        'Location': redirect_url,
                        //add other headers here...
                    });
                    res.end();
                }else {
                    var response_etag = 'W/"' + ETAG_VERSION + "_" + result["_id"] + "_" + result["max"] + "_" + result["count"] + '"';
                    console.log(response_etag);
                    res.setHeader("ETag", response_etag);
                    if (request_etag != response_etag) {
                        Weight.findOne({}, {_id: 0, __v: 0, "weights._id": 0})
                            .where({"_id": bucket})
                            .sort({ts: 'asc'}).exec(function (err, weights) {
                            res.json(weights)
                        });
                    } else {
                        res.status(304);
                        res.end();
                    }
                }
            }
            else
            {
                res.json([])
            }
        });
    });

    app.get('/api/weights/id/:id', function (req, res) {
        var id = sanitize(req.params['id']);
        Weight.aggregate([
            {$unwind: "$weights"},
            {$match: {"weights.id": id}},
            {$project:{
                "bucket": "$_id",
                "id": "$weights.id",
                "weight":"$weights.weight",
                "rssi":"$weights.rssi",
                "tag_id":"$weights.tag_id",
                "sequence":"$weights.sequence",
                "receiver":"$weights.receiver",
                "date":"$weights.date",
                "ts":"$weights.ts",
            }},
            {$sort: {"ts" :1}}
        ], function(error, results){
            if(error)
            {
                console.log(error);
                res.status(500);
                res.end();
            }else
            {
                res.json(results);
            }
        });
    });

    app.get('/api/weights/id/:bucket/:id', function (req, res) {
        var bucket = sanitize(req.params['bucket']);
        var id = sanitize(req.params['id']);
        Weight.aggregate([
            {$match:{"_id":bucket}},
            {$unwind: "$weights"},
            {$match: {"weights.id": id}},
            {$project:{
                "bucket": "$_id",
                "id": "$weights.id",
                "weight":"$weights.weight",
                "rssi":"$weights.rssi",
                "tag_id":"$weights.tag_id",
                "sequence":"$weights.sequence",
                "receiver":"$weights.receiver",
                "date":"$weights.date",
                "ts":"$weights.ts",
            }},
            {$sort: {"ts" :1}}
        ], function(error, results){
            if(error)
            {
                console.log(error);
                res.status(500);
                res.end();
            }else
            {
                res.json(results);
            }
        });
    });

    app.get('/api/weights/:bucket/:ts', function (req, res) {
        var bucket = sanitize(req.params['bucket']);
        var ts = sanitize(req.params['ts']);
        console.log(bucket, ts);
        Weight.aggregate([
            {$match:{"_id":bucket}},
            {
                $project: {
                    weights: {
                        $filter: {
                            input: '$weights',
                            as: 'item',
                            cond: {$gt: ['$$item.ts', parseInt(ts)]}
                        }
                    }
                }
            },
        ], function(error, result){
            if(error)
            {
                console.log(error);
                res.status(500);
                res.end();
            }else if(result && result.length >= 1)
            {
                var data = result[0]['weights'];
                data.sort(function(a, b){return a.ts - b.ts;});
                for(var i = 0; i < data.length; i++)
                {
                    delete data[i]['_id'];
                }
                res.json(data);
                // res.json(result[0]['weights'])
            }else
            {
                res.json([])
            }

        });

    });

    //Return the list of animal IDs
    app.get('/api/locations', function (req, res) {
        var animal = sanitize(req.params['animal']);
        Location.find({}, {_id:1}, function(error, data){
            if(error){
                res.status(500);
                res.end();
            }else
            {
                var result = [];
                for(var i in data)
                {
                    result.push(parseInt(data[i]['_id'].split("_")[2]));
                }
                res.json(result);
            }

        });
    });

    //Return the list of buckets for a given animal ID
    app.get('/api/locations/:animal', function (req, res) {
        var animal = sanitize(req.params['animal']);
        Location.find({_id: {$regex:"[0-9]*_[0-9]*_"+animal}}, {_id:1}, function(error, data){
            if(error){
                res.status(500);
                res.end();
            }else
            {
                var result = [];
                for(var i in data)
                {
                    result.push(data[i]['_id']);
                }
                res.json(result);

            }

        });
    });

    //Return the data for a given bucket
    app.get('/api/locations/bucket/:bucket', function (req, res) {
        var request_etag = req.header('if-none-match');
        var bucket = sanitize(req.params['bucket']);

        Location.aggregate([
            {$match:{"_id": bucket}},
            {
                $project:{ts: "$locations.ts"}
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
        ], function(error, results){
            if(results && results.length != 0)
            {
                var result = results[0];
                var response_etag = 'W/"'+ETAG_VERSION+"_"+result["_id"]+"_"+result["max"]+"_"+result["count"]+'"';
                console.log(response_etag);
                res.setHeader("ETag", response_etag);
                if(request_etag != response_etag) {
                    Location.find({}, {_id: 0, __v: 0, "locations._id":0, "locations._date":0, "locations.date":0})
                        .where({"_id": bucket})
                        .sort({ts: 'asc'}).exec(function (err, locations) {
                        locations.sort(function(a, b){return a.ts - b.ts;});
                        res.json(locations)
                    });
                }else
                {
                    res.status(304);
                    res.end();
                }
            }
            else
            {
                res.json([])
            }

        });
    });

    //Return the location data for a given animal
    app.get('/api/locations/data/:animal', function (req, res) {
        var request_etag = req.header('if-none-match');
        var animal = sanitize(req.params['animal']);

        Location.find(
            {"animal_id": animal}
        , function(error, results){
            if(error){
                res.status(500);
                res.end();
            }else
            {

                res.json(results);

            }

        });
    });

    app.get('/api/stations', function (req, res) {
        Stations.find({}, {_id: 0, __v: 0}).exec(function (err, stations) {
            // console.log(weights);
            res.json(stations);
        });
    });

    app.get('/api/status', function (req, res) {
        Status.find({}, {_id: 0, __v: 0}).exec(function (err, stations) {
            // console.log(weights);
            res.json(stations)
        });
    });

    app.get('/api/status/heartbeat', function (req, res) {
        Status.aggregate([
                {$match:{"message_type":"STATUS", "message":"PERIODIC"}},
            {$group:{"_id":"$tag_id", "last_heartbeat":{$max:"$ts"}}},
            {$project:{"_id":0, "tag_id": "$_id", "last_heartbeat":"$last_heartbeat"}}
            ], function(error, result){
                    if(error) {
                        console.log(error);
                        res.status(500);
                        res.end();
                    }else
                    {
                        var currentTime = moment();
                        for(i in result){
                            var rt = moment(result[i].last_heartbeat * 1000);
                            result[i].last_heartbeat = Math.floor((currentTime - rt)/1000);
                        }
                        res.json(result);
                        res.end();
                    }
            }
        );
    });


    app.get('/api/status/station/:station', function (req, res) {
        var station = sanitize(req.params['station']);
        Status.find({}, {_id: 0, __v: 0})
            .where({
                "tag_id": station,
                "message_type":"STATUS",
                "message":"PERIODIC"
            })
            .sort({"ts":"desc"})
            .limit(10)
            .exec(
                function (err, stations) {
                    res.json({"millis":new Date().getTime() -  (stations[0]['ts'] * 1000),
                    "station": station})
                }
            );
    });



    // frontend routes =========================================================
    app.get('/', function (req, res) {
        res.sendfile('./public/index.html');
    });

    app.get('*', function (req, res) {
        res.writeHead(302, {
            'Location': '/'
        });
        res.end();

    });
};
