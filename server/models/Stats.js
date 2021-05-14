const mongoose = require('mongoose');
const Schema = mongoose.Schema;
mongoose.connect('mongodb://localhost:27017/xornet', {useNewUrlParser: true, useUnifiedTopology: true});

const schema = new Schema({
    _id:            String,                         // The mongo object ID
    machine_id:     String,                         // The machine's ID
    timestamp:      Date,                           // When the stats are added
    ram:            { type: Object, default: null}, // The machines current ram usage
    cpu:            { type: Object, default: null}, // The machines current cpu usage
    network:        { type: Object, default: null}, // The machines current network usage
    disks:          { type: Object, default: null}, // The machines current disk capacity
    
}, {
    versionKey: false // You should be aware of the outcome after set to false
});

module.exports = mongoose.model('Stats', schema);