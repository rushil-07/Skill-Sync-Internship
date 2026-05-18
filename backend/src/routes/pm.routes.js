const express      = require('express')
const pmController = require('../controllers/pm.controller')
const { authProjectManager } = require('../middlewares/auth.middleware')

const router = express.Router()

// GET /api/pm/dashboard - full PM dashboard data in one request
router.get('/dashboard',                       authProjectManager, pmController.getPMDashboard)
router.get('/project/:projectId/dashboard',    authProjectManager, pmController.getProjectDashboard)
router.get('/alerts/redistribution-suggestions', authProjectManager, pmController.getRedistributionSuggestions)
router.post('/alerts/respond',                 authProjectManager, pmController.respondToPMAlert)

module.exports = router
