var program = require('commander');
var mongoose = require('mongoose');
var db = require('../config/db');
var moment = require("moment");
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
        }
    });
}


Weight.find({}, "_id").exec(function (err, weights) {
    var current_bucket = moment().format("YYYY_MM");
    console.log(current_bucket);
    var bucket_list = [];
    for(var i = 0; i < weights.length; i++)
    {
        if(weights[i]["_id"] != current_bucket) {
            bucket_list.push(weights[i]["_id"]);
        }
    }

    async.eachSeries(bucket_list, create_static_file, function(error){
        console.log(error);
        process.exit(0);
    })
});

