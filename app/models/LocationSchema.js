
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var LocationReadingSchema = Schema({
    date: Date,
    _date: String,
    ts: Number,
    lat: Number,
    long: Number
});

var LocationsSchema = Schema({
    _id: { type: String, index: true },
    animal_id: {type: Number, index: true},
    locations: [
        LocationReadingSchema
    ]
});

module.exports = connectionsubject.model('Location', LocationsSchema);