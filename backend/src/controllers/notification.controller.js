const notificationModel = require('../models/notification.model')
const userModel = require('../models/user.model')

const DEFAULT_PREFERENCES = {
    TASK_ASSIGNED: true,
    MENTION: true,
    COMMENT: true,
    DEADLINE: true,
    STATUS_CHANGED: true,
    PROJECT_JOINED: true,
    ALERT: true,
    PROJECT_MATCH: true,
    PROJECT_INTEREST: true,
    PROJECT_CHAT: true,
}

// --- GET /api/notifications ---------------------------------------------------
// Get notifications for logged-in user
// ?unread=true   -> only unread
// ?limit=20      -> how many (default 30, max 100)
async function getNotifications(req, res) {
    try {
        const query = { user_id: req.user.id }
        if (req.query.unread === 'true') query.is_read = false

        const limit = Math.min(parseInt(req.query.limit) || 30, 100)

        const [notifications, unread_count] = await Promise.all([
            notificationModel
                .find(query)
                .sort({ created_at: -1 })
                .limit(limit),
            notificationModel.countDocuments({ user_id: req.user.id, is_read: false }),
        ])

        res.status(200).json({ notifications, unread_count })
    } catch (err) {
        console.error('getNotifications error:', err)
        res.status(500).json({ message: 'Server error' })
    }
}


// --- GET /api/notifications/unread-count -------------------------------------
// Just the number - called on page load to populate bell badge
async function getUnreadCount(req, res) {
    try {
        const count = await notificationModel.countDocuments({
            user_id: req.user.id,
            is_read: false,
        })
        res.status(200).json({ count })
    } catch (err) {
        console.error('getUnreadCount error:', err)
        res.status(500).json({ message: 'Server error' })
    }
}


// --- PUT /api/notifications/:id/read -----------------------------------------
// Mark one notification as read
async function markRead(req, res) {
    try {
        const notif = await notificationModel.findOneAndUpdate(
            { _id: req.params.id, user_id: req.user.id },
            { is_read: true },
            { new: true }
        )
        if (!notif) return res.status(404).json({ message: 'Notification not found' })
        res.status(200).json({ notification: notif })
    } catch (err) {
        console.error('markRead error:', err)
        res.status(500).json({ message: 'Server error' })
    }
}


// --- PUT /api/notifications/read-all -----------------------------------------
// Mark all of the user's notifications as read
async function markAllRead(req, res) {
    try {
        await notificationModel.updateMany(
            { user_id: req.user.id, is_read: false },
            { is_read: true }
        )
        res.status(200).json({ message: 'All notifications marked as read' })
    } catch (err) {
        console.error('markAllRead error:', err)
        res.status(500).json({ message: 'Server error' })
    }
}


// --- DELETE /api/notifications/:id -------------------------------------------
// Delete a single notification (own only)
async function deleteNotification(req, res) {
    try {
        const notif = await notificationModel.findOneAndDelete({
            _id:     req.params.id,
            user_id: req.user.id,
        })
        if (!notif) return res.status(404).json({ message: 'Notification not found' })
        res.status(200).json({ message: 'Notification deleted' })
    } catch (err) {
        console.error('deleteNotification error:', err)
        res.status(500).json({ message: 'Server error' })
    }
}


// --- DELETE /api/notifications -----------------------------------------------
// Clear all notifications for the user
async function clearAll(req, res) {
    try {
        await notificationModel.deleteMany({ user_id: req.user.id })
        res.status(200).json({ message: 'All notifications cleared' })
    } catch (err) {
        console.error('clearAll error:', err)
        res.status(500).json({ message: 'Server error' })
    }
}

async function getPreferences(req, res) {
    try {
        const user = await userModel.findById(req.user.id).select('notification_preferences')
        if (!user) return res.status(404).json({ message: 'User not found' })

        res.status(200).json({
            preferences: {
                ...DEFAULT_PREFERENCES,
                ...(user.notification_preferences?.toObject?.() || user.notification_preferences || {}),
            },
        })
    } catch (err) {
        console.error('getPreferences error:', err)
        res.status(500).json({ message: 'Server error' })
    }
}

async function updatePreferences(req, res) {
    try {
        const incoming = req.body?.preferences
        if (!incoming || typeof incoming !== 'object') {
            return res.status(400).json({ message: 'preferences object is required' })
        }

        const nextPreferences = { ...DEFAULT_PREFERENCES }
        for (const key of Object.keys(DEFAULT_PREFERENCES)) {
            if (typeof incoming[key] === 'boolean') {
                nextPreferences[key] = incoming[key]
            }
        }

        const user = await userModel.findByIdAndUpdate(
            req.user.id,
            { notification_preferences: nextPreferences },
            { new: true }
        ).select('notification_preferences')

        if (!user) return res.status(404).json({ message: 'User not found' })

        res.status(200).json({
            message: 'Notification preferences updated',
            preferences: user.notification_preferences,
        })
    } catch (err) {
        console.error('updatePreferences error:', err)
        res.status(500).json({ message: 'Server error' })
    }
}


module.exports = {
    getNotifications,
    getUnreadCount,
    markRead,
    markAllRead,
    deleteNotification,
    clearAll,
    getPreferences,
    updatePreferences,
}
