const express = require('express')
const profileController = require('../controllers/profile.controller')
const { authUser, authPMOrAdmin, authAdmin } = require('../middlewares/auth.middleware')

const router = express.Router()

// ─── Own Profile ──────────────────────────────────────────────────────────────
// GET    /api/profile/me              — get own full profile
// PUT    /api/profile/me              — update personal info + availability

router.get('/me',   authUser, profileController.getMyProfile)
router.put('/me',   authUser, profileController.updateMyProfile)

router.put('/:userId/role', authAdmin, profileController.changeUserRole)


// ─── Skills ───────────────────────────────────────────────────────────────────
// POST   /api/profile/skills          — add skill with proficiency level
// PUT    /api/profile/skills/:skillId — update proficiency of a skill
// DELETE /api/profile/skills/:skillId — remove skill

router.post  ('/skills',           authUser, profileController.addSkill)
router.put   ('/skills/:skillId',  authUser, profileController.updateSkill)
router.delete('/skills/:skillId',  authUser, profileController.deleteSkill)


// ─── Learning Recommendations ─────────────────────────────────────────────────
// GET    /api/profile/recommendations               — get own recommendations
// POST   /api/profile/recommendations               — add recommendation to own profile
// POST   /api/profile/:userId/recommendations       — PM/Admin: add rec to any user
// DELETE /api/profile/recommendations/:recId        — delete own recommendation

router.get   ('/recommendations',              authUser,       profileController.getRecommendations)
router.post  ('/recommendations',              authUser,       profileController.addRecommendation)
router.put   ('/recommendations/:recId',       authUser,       profileController.updateRecommendation)
router.delete('/recommendations/:recId',       authUser,       profileController.deleteRecommendation)


// ─── Activity Feed ────────────────────────────────────────────────────────────
// GET    /api/profile/activity         — get activity feed (?page=1&limit=20)

router.get('/activity', authUser, profileController.getActivityFeed)


// ─── Performance Metrics ─────────────────────────────────────────────────────
// GET    /api/profile/metrics          — get own performance metrics

router.get('/metrics', authUser, profileController.getPerformanceMetrics)


// ─── View Other User's Profile (PM / Admin only) ─────────────────────────────
// GET    /api/profile/:userId          — view any user's full profile
// POST   /api/profile/:userId/recommendations — add rec to a specific user

router.get ('/:userId',                        authPMOrAdmin, profileController.getUserProfile)
router.post('/:userId/recommendations',        authPMOrAdmin, profileController.addRecommendation)
router.put ('/:userId/recommendations/:recId', authPMOrAdmin, profileController.updateRecommendation)


module.exports = router
