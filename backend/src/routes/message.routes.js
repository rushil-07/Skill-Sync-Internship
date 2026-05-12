const express = require('express')

const messageController = require('../controllers/message.controller')
const { authUser } = require('../middlewares/auth.middleware')

const router = express.Router()

router.use(authUser)

router.get('/conversations', messageController.getConversations)
router.get('/:userId', messageController.getThread)
router.post('/:userId', messageController.sendMessage)

module.exports = router
