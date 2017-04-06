var Subjects = require('./models/SubjectViews');
var Weight = require('./models/WeightsSchema');
var Stations = require("./models/StationsSchema");
var Status = require("./models/StatusSchema");
var Location = require("./models/LocationSchema");
var sanitize = require('mongo-sanitize');

var ETAG_VERSION = 1;


module.exports = function (app) {

    // server routes ===========================================================
    // handle things like api calls
    // authentication routes
    // sample api route
    app.get('/api/data', function (req, res) {
        // use mongoose to get all nerds in the database
        Subjects.find({}, {
            '_id': 0,
            'school_state': 1,
            'resource_type': 1,
            'poverty_level': 1,
            'date_posted': 1,
            'total_donations': 1,
            'funding_status': 1,
            'grade_level': 1
        }, function (err, subjectDetails) {
            // if there is an error retrieving, send the error.
            // nothing after res.send(err) will execute
            if (err)
                res.send(err);
            res.json(subjectDetails); // return all nerds in JSON format
        });
    });


    app.get('/api/weights', function (req, res) {
        Weight.find({}, {_id: 0, __v: 0}).sort({ts: 'asc'}).exec(function (err, weights) {
            // console.log(weights);
            res.json(weights)
        });
    });

    app.get('/api/buckets', function (req, res) {

        Weight.find({}, "_id").exec(function (err, weights) {
            var r = [];
            for(var i = 0; i < weights.length; i++)
            {
                r.push(weights[i]["_id"]);
            }
            res.json(r)
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
                var response_etag = 'W/"'+ETAG_VERSION+"_"+result["_id"]+"_"+result["max"]+"_"+result["count"]+'"';
                console.log(response_etag);
                res.setHeader("ETag", response_etag);
                if(request_etag != response_etag) {
                    Weight.find({}, {_id: 0, __v: 0})
                        .where({"_id": bucket})
                        .sort({ts: 'asc'}).exec(function (err, weights) {
                        res.json(weights)
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
                res.status(500);
                res.end();
            }
            res.json(result[0]['weights'])
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

    //Return the data for a givel bucket
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
                        .sort({ts: 'asc'}).exec(function (err, weights) {
                        res.json(weights)
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
    app.get('*', function (req, res) {
        res.sendfile('./public/index.html');
    });
};
