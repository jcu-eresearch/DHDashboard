

var mongoose = require('mongoose');
var db = require('../config/db');
var program = require('commander');

connectionsubject = mongoose.createConnection(db.urlSubjectViews);

var Stations = require("../app/models/StationsSchema");

// var station = Stations({tag_id: 110177});

program
    .version('0.0.1')
    .description("Add and remove allowed station and receivers to Digital Homestead Database")
    .usage('[options]')
    .option('-s, --station [station]', 'Add Station')
    .option('-r, --reciever [reciever]', 'Add Reciever')
    .option('-S, --remove-station [station]', 'Remove Station')
    .option('-R, --remove-reciever [reciever]', 'Remove Reciever')
    .parse(process.argv);

if (!process.argv.slice(2).length) {
    program.outputHelp();
    process.exit(1);
}

var ins = {};

if (program.station){
    ins['tag_id'] = program.station;
}

if (program.reciever)
{
    ins['receiver'] = program.reciever;
}

var station = Stations(ins);

station.save(function (err, data) {
    if (err) {
        console.log(err)
    }
    else {
        console.log('Saved : ', data);
    }
    process.exit(0);
});

console.log(ins);


