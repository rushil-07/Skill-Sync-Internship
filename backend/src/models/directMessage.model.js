const mongoose = require('mongoose')

const directMessageSchema = new mongoose.Schema({
    sender_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true,
    },
    recipient_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true,
    },
    content: {
        type: String,
        required: true,
        trim: true,
    },
    read_at: {
        type: Date,
        default: null,
    },
}, {
    strict: 'throw',
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})

directMessageSchema.index({ sender_id: 1, recipient_id: 1, created_at: -1 })
directMessageSchema.index({ recipient_id: 1, read_at: 1 })

const directMessageModel = mongoose.model('direct_message', directMessageSchema)

module.exports = directMessageModel
