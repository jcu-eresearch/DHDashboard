
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

var weightSchema = new Schema({
    _id: { type: String, index: true },
    // bucket: String,
    weights: [
        weight_reading
    ]

});

// module.exports = weightSchema;
module.exports = connectionsubject.model('Weight', weightSchema);
