const express            = require('express')
const memberController   = require('../controllers/member.controller')
const { authUser }       = require('../middlewares/auth.middleware')

const router = express.Router()

// GET /api/member/dashboard — full member dashboard in one request
router.get('/dashboard', authUser, memberController.getMemberDashboard)
router.post('/projects/:projectId/interest', authUser, memberController.expressInterest)

module.exports = router
