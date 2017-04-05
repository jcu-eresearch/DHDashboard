var Subjects = require('./models/SubjectViews');
var Weight = require('./models/WeightsSchema');
var Stations = require("./models/StationsSchema");
var Status = require("./models/StatusSchema");
var sanitize = require('mongo-sanitize');


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
                var response_etag = 'W/"'+result["_id"]+"_"+result["max"]+"_"+result["count"]+'"';
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


    app.get('/api/stations', function (req, res) {
        Stations.find({}, {_id: 0, __v: 0}).exec(function (err, stations) {
            // console.log(weights);
            res.json(stations)
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
