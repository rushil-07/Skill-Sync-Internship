const notificationModel = require('../models/notification.model')
const userModel = require('../models/user.model')
const { getIO } = require('../socket');


// --- create -------------------------------------------------------------------
// Central function - saves to DB and pushes via socket in one call.
// All controllers use this, never touch the model directly.
//
// userId  - ObjectId or string - who receives the notification
// type    - one of the enum values in notification.model
// title   - short heading shown in bell dropdown
// message - longer description
// link    - frontend route to navigate to on click (optional)


async function create(userId, type, title, message, link = null) {
    if (!userId) return null
    try {
        const user = await userModel.findById(userId).select('notification_preferences')
        if (!user) return null

        const prefs = user.notification_preferences?.toObject?.() || user.notification_preferences || {}
        if (prefs[type] === false) {
            return null
        }

        const notif = await notificationModel.create({
        user_id: userId,
        type,
        title,
        message,
        link
    })

    // Push real-time to user's socket room
        const io = getIO()
        if (io) {
            io.to(userId.toString()).emit('notification', notif)
        }
 
        return notif
    } catch (err) {
        // Never let notification failures crash the main request
        console.error('notificationService.create error:', err.message)
        return null
    }
}


// --- createMany --------------------------------------------------------------
// Send the same notification to multiple users (e.g. mention multiple people)
async function createMany(userIds, type, title, message, link = null) {
    const unique = [...new Set(userIds.map(id => id.toString()))].filter(Boolean)
    await Promise.all(unique.map(uid => create(uid, type, title, message, link)))
}

module.exports = { create, createMany }
