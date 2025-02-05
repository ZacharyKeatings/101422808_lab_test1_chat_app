const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    from_user: { type: String, required: true }, 
    to_user: { type: String, default: null }, 
    room: { type: String, default: null }, 
    message: { type: String, required: true }, 
    date_sent: { type: Date, default: Date.now } 
});

module.exports = mongoose.model('Message', MessageSchema);
