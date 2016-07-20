var binstruct = require('binstruct');
var Decimal = require('decimal.js');
var mongoose = require('mongoose');
var moment = require("moment");
var Weight = require("./models/WeightsSchema");
var Status = require("./models/StatusSchema");
var Stations = require("./models/StationsSchema");

require('buffertools').extend();


Decimal.config({precision: 64, rounding: 4});
// var url = 'mongodb://localhost:27017/digitalhomestead';

function unpack(message) {
    buffer = new Buffer(message, 'hex');
    unpacker = binstruct.def({int64mode: binstruct.int64modes.lossy, littleEndian: true})
        .uint64('id', {int64mode: binstruct.int64modes.copy})
        .int32('weight')
        .wrap(buffer);
    var id = Decimal('0x' + unpacker.id.reverse().toString('hex')).toString();
    return {
        'id': id == "18446744073709551615" ? "-1" : id,
        'weight': unpacker.weight / 100
    }
}

function insert_weight(connectionsubject, message, unpacked_data) {
    var ins = Weight({
        id: unpacked_data.id,
        weight: unpacked_data.weight,
        rssi: message.rssi,
        tag_id: message.tag_id,
        sequence: message.data.sequence,
        receiver: message.receiver,
        date: moment(message.time * 1000),
        ts: message.time
    });

    ins.save(function (err, data) {
        if (err) {
            console.log(err)
        }
        else {
            console.log('Saved : ', data);
        }
    });
}

function unpack_status(status_message) {
    buffer = new Buffer(status_message, 'hex');

    if (buffer[3] == 0xFF) {
        //Error messages

        //Parse Errors
        if (buffer[2] == 0x01) {
            if (buffer[0] == 0x00) {
                return {message_type: 'ERROR', type: 'PARSE_ERROR', message: 'UNEXPECTED_NULL'}
            } else if (buffer[0] == 0x01) {
                return {message_type: 'ERROR', type: 'PARSE_ERROR', message: 'INCORRECT_INPUT_COUNT'}
            }
        }
    } else if (buffer[3] == 0xFE) {
        //Status messages

        //Heartbeats
        if (buffer[2] == 0x01) {
            if (buffer[0] == 0x00) {
                return {message_type: 'STATUS', type: 'HEARTBEAT', message: 'STARTUP'}
            } else if (buffer[0] == 0x01) {
                return {message_type: 'STATUS', type: 'HEARTBEAT', message: 'PERIODIC'}
            }
        }
    }
}

function insert_status(connectionsubject, message, unpacked_data) {
    var ins = Status({
        message_type: unpacked_data.message_type,
        type: unpacked_data.type,
        message: unpacked_data.message,
        value: unpacked_data.value,
        rssi: message.rssi,
        tag_id: message.tag_id,
        sequence: message.data.sequence,
        receiver: message.receiver,
        date: moment(message.time * 1000),
        ts: message.time
    });

    ins.save(function (err, data) {
        if (err) {
            console.log(err)
        }
        else {
            console.log('Saved : ', data);
        }
    });
}

function taggle(connectionsubject) {
    return function _taggle(message) {
        try {
            Stations.find({$or: [{tag_id: message['tag_id']}, {receiver: message['receiver']}]}, function (err, Stations) {
                if (err) {
                    console.log(err);
                } else {
                    console.log("Received Message: "+JSON.stringify(message));
                    if (Stations.length > 0) {
                        if ('data' in message) {
                            if ('user_payload' in message['data']) {
                                //Weight
                                var unpacked_data = unpack(message['data']['user_payload']);
                                insert_weight(connectionsubject, message, unpacked_data);
                            } else if ('alt_user_data' in message['data']) {
                                //Status Messages
                                var status_message = unpack_status(message['data']['alt_user_data']);
                                insert_status(connectionsubject, message, status_message);
                            }
                        }
                    }
                    else {
                        console.log("Ignoring message: " + JSON.stringify(message));
                    }
                }
            });
        } catch (ex) {
            console.log("Error processing message: ");
            console.log(message);
            console.log(ex);
        }
    }
}

function init(connectionsubject) {
    // console.log(connectionsubject);
    var pubnub = require("pubnub")({
        ssl: true,  // <- enable TLS Tunneling over TCP
        publish_key: "demo",
        subscribe_key: "sub-c-3d7ba416-92ba-11e3-b2cd-02ee2ddab7fe"
    });

    var t = taggle(connectionsubject);
    // pubnub.history({
    //     channel : 'jcu.180181',
    //     callback : function(m){
    //         for(message in m[0])
    //         {
    //             t(m[0][message]);
    //             // console.log("==========================");
    //         }
    //
    //     },
    //     count : 100000, // 100 is the default
    //     reverse : false // false is the default
    // });

    pubnub.subscribe({
        channel: "jcu.180181",
        callback: t
    });
}

module.exports = init;