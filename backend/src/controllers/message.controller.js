const directMessageModel = require('../models/directMessage.model')
const userModel = require('../models/user.model')
const notifService = require('../services/notification.service')
const { getIO } = require('../socket')

async function getCurrentUser(req, res) {
    const user = await userModel.findById(req.user.id).select('username profile_picture_url role')
    if (!user) {
        res.status(404).json({ message: 'User not found' })
        return null
    }
    return user
}

async function getConversations(req, res) {
    try {
        const currentUser = await getCurrentUser(req, res)
        if (!currentUser) return

        const messages = await directMessageModel
            .find({
                $or: [
                    { sender_id: req.user.id },
                    { recipient_id: req.user.id },
                ],
            })
            .populate('sender_id', 'username profile_picture_url role')
            .populate('recipient_id', 'username profile_picture_url role')
            .sort({ created_at: -1 })
            .limit(300)

        const conversationMap = new Map()

        for (const message of messages) {
            const isSender = String(message.sender_id?._id) === String(req.user.id)
            const otherUser = isSender ? message.recipient_id : message.sender_id
            if (!otherUser?._id) continue

            const key = String(otherUser._id)
            const existing = conversationMap.get(key)
            const unreadIncrement = !isSender && !message.read_at ? 1 : 0

            if (!existing) {
                conversationMap.set(key, {
                    other_user: otherUser,
                    last_message: message,
                    unread_count: unreadIncrement,
                })
                continue
            }

            existing.unread_count += unreadIncrement
        }

        res.status(200).json({
            current_user: currentUser,
            conversations: Array.from(conversationMap.values()),
        })
    } catch (error) {
        console.error('getConversations error:', error)
        res.status(500).json({ message: 'Failed to load conversations.' })
    }
}

async function getThread(req, res) {
    try {
        const otherUser = await userModel.findById(req.params.userId).select('username profile_picture_url role')
        if (!otherUser) return res.status(404).json({ message: 'User not found' })

        const query = {
            $or: [
                { sender_id: req.user.id, recipient_id: req.params.userId },
                { sender_id: req.params.userId, recipient_id: req.user.id },
            ],
        }

        const messages = await directMessageModel
            .find(query)
            .populate('sender_id', 'username profile_picture_url role')
            .populate('recipient_id', 'username profile_picture_url role')
            .sort({ created_at: 1 })
            .limit(200)

        await directMessageModel.updateMany(
            {
                sender_id: req.params.userId,
                recipient_id: req.user.id,
                read_at: null,
            },
            { read_at: new Date() }
        )

        res.status(200).json({
            other_user: otherUser,
            messages,
        })
    } catch (error) {
        console.error('getThread error:', error)
        res.status(500).json({ message: 'Failed to load messages.' })
    }
}

async function sendMessage(req, res) {
    try {
        const content = String(req.body?.content || '').trim()
        if (!content) return res.status(400).json({ message: 'Message content is required' })
        if (String(req.params.userId) === String(req.user.id)) {
            return res.status(400).json({ message: 'You cannot message yourself' })
        }

        const [sender, recipient] = await Promise.all([
            userModel.findById(req.user.id).select('username profile_picture_url role'),
            userModel.findById(req.params.userId).select('username profile_picture_url role'),
        ])

        if (!sender || !recipient) return res.status(404).json({ message: 'User not found' })

        const message = await directMessageModel.create({
            sender_id: req.user.id,
            recipient_id: req.params.userId,
            content,
        })

        const populatedMessage = await directMessageModel
            .findById(message._id)
            .populate('sender_id', 'username profile_picture_url role')
            .populate('recipient_id', 'username profile_picture_url role')

        const io = getIO()
        if (io) {
            io.to(String(req.params.userId)).emit('direct_message', populatedMessage)
        }

        await notifService.create(
            req.params.userId,
            'DIRECT_MESSAGE',
            'New direct message',
            `${sender.username} sent you a message`,
            `/messages?user=${sender._id}`
        )

        res.status(201).json({ message: populatedMessage })
    } catch (error) {
        console.error('sendMessage error:', error)
        res.status(500).json({ message: 'Failed to send message.' })
    }
}

module.exports = {
    getConversations,
    getThread,
    sendMessage,
}
