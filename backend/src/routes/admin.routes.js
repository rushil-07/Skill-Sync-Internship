const express          = require('express')
const adminController  = require('../controllers/admin.controller')
const { authAdmin }    = require('../middlewares/auth.middleware')

const router = express.Router()

// ─── Full dashboard data ──────────────────────────────────────────────────────
router.get('/dashboard',                                    authAdmin, adminController.getAdminDashboard)

// ─── Stats (used by AdminProfile) ────────────────────────────────────────────
router.get('/stats',                                        authAdmin, adminController.getAdminStats)

// ─── User management ─────────────────────────────────────────────────────────
router.put('/users/:userId/role',                           authAdmin, adminController.changeUserRole)
router.put('/users/:userId/verify-skill/:skillId',          authAdmin, adminController.verifyUserSkill)

module.exports = router