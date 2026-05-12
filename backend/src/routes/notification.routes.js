const express                = require('express')
const notifController        = require('../controllers/notification.controller')
const { authUser }           = require('../middlewares/auth.middleware')

const router = express.Router()

// All routes require auth
router.use(authUser)

router.get   ('/',                  notifController.getNotifications)   // list
router.get   ('/preferences',       notifController.getPreferences)
router.get   ('/unread-count',      notifController.getUnreadCount)     // badge count
router.put   ('/preferences',       notifController.updatePreferences)
router.put   ('/read-all',          notifController.markAllRead)        // mark all read
router.delete('/',                  notifController.clearAll)           // clear all
router.put   ('/:id/read',          notifController.markRead)           // mark one read
router.delete('/:id',               notifController.deleteNotification) // delete one

module.exports = router
