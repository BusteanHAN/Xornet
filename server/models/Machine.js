const mongoose = require('mongoose');
const Schema = mongoose.Schema;
mongoose.connect('mongodb://localhost:27017/xornet', {useNewUrlParser: true, useUnifiedTopology: true});

const schema = new Schema({
    _id:  String, // String is shorthand for {type: String}
    machine_id:     String,
    details:        { type: Object, default: null},
}, {
    versionKey: false // You should be aware of the outcome after set to false
});

module.exports = mongoose.model('Machine', schema);