
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var weightSchema = new Schema({
    id: String,
    weight: Number,
    rssi: String,
    tag_id: Number,
    sequence: Number,
    receiver: Number,
    date: Date,
    ts: Number
});

// module.exports = weightSchema;
module.exports = connectionsubject.model('Weight', weightSchema);
