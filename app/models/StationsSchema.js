
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var StationsSchema = new Schema({
    tag_id: Number,
    receiver: Number
});

// module.exports = weightSchema;
module.exports = connectionsubject.model('Stations', StationsSchema);
