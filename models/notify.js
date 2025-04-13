const mongoose = require('mongoose')

const notifySchema = new mongoose.Schema({
    user: {type: mongoose.Types.ObjectId, ref: 'User'},
    recipient: {type: mongoose.Types.ObjectId, ref: 'User'},
    screen: String,
    text: String,
    post: {type: mongoose.Types.ObjectId, ref: 'Post'},
    image: String,
    isRead: {type: Boolean, default: false}
}, {
    timestamps: true
})

module.exports = mongoose.model('notify', notifySchema)