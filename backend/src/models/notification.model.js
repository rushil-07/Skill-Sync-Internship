const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    type: {
        type: String,
        enum: ['TASK_ASSIGNED', 'MENTION', 'COMMENT', 'DEADLINE', 'STATUS_CHANGED', 'PROJECT_JOINED', 'ALERT', 'PROJECT_MATCH', 'PROJECT_INTEREST', 'PROJECT_CHAT', 'DIRECT_MESSAGE']
    },
    title: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    link: {
        type: String,
        default: null,
    },
    is_read: {
        type: Boolean,
        default: false,
    },
    created_at: {
        type: Date,
        default: Date.now,
    }
}, { strict: 'throw'});

notificationSchema.index({ user_id: 1, is_read: 1})
notificationSchema.index({ user_id: 1, created_at: -1})

const notificationModel = mongoose.model('notification', notificationSchema)

module.exports = notificationModel;
