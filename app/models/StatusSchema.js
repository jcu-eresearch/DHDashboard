
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var statusSchema = new Schema({
    message_type: String,
    type: String,
    message: String,
    value: String,
    rssi: String,
    tag_id: Number,
    sequence: Number,
    receiver: Number,
    date: Date,
    ts: Number
});

// module.exports = weightSchema;
module.exports = connectionsubject.model('Status', statusSchema);
