var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var weight_reading = new Schema({
    id: String,
    weight: Number,
    rssi: String,
    tag_id: Number,
    sequence: Number,
    receiver: Number,
    date: Date,
    ts: Number,
    outlier: Boolean,
    qa_flag: String,
    qa_outlier_type: String,
    qa_adjusted_value: Number

});

module.exports = {model: connectionsubject.model('WeightReading', weight_reading), schema: weight_reading};