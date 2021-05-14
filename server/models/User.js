const mongoose = require('mongoose');
const Schema = mongoose.Schema;
mongoose.connect('mongodb://localhost:27017/xornet', {useNewUrlParser: true, useUnifiedTopology: true});

const schema = new Schema({
    _id:            String,                         // The mongo object ID
    uuid:           String,                         // The user's ID
    username:       String,                         // Username of the user
    password:       String,                         // Encrypted password of the user
    pfp:            String,                         // Link to the pfp of the user
    machines:       { type: Array, default: null }  // The array that contains the UUID's of the machines the user has
}, {
    versionKey: false // You should be aware of the outcome after set to false
});

module.exports = mongoose.model('User', schema);