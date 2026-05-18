const express               = require('express')
const milestoneController   = require('../controllers/milestone.controller')
const { authUser, authProjectManager } = require('../middlewares/auth.middleware')

const router = express.Router()

// --- Cross-project (PM dashboard) --------------------------------------------
// GET  /api/milestones/upcoming               - upcoming milestones across all PM projects
router.get('/upcoming', authProjectManager, milestoneController.getUpcomingMilestones)

// --- Per-project CRUD ---------------------------------------------------------
// GET    /api/milestones/project/:projectId                    - list all milestones
// POST   /api/milestones/project/:projectId                    - create milestone (PM)
// PUT    /api/milestones/project/:projectId/:milestoneId       - update milestone (PM)
// DELETE /api/milestones/project/:projectId/:milestoneId       - delete milestone (PM)
// PUT    /api/milestones/project/:projectId/:milestoneId/complete - mark complete (PM)
// PUT    /api/milestones/project/:projectId/:milestoneId/reopen   - reopen (PM)

router.get   ('/project/:projectId',                           authUser,           milestoneController.getMilestones)
router.post  ('/project/:projectId',                           authProjectManager, milestoneController.createMilestone)
router.put   ('/project/:projectId/:milestoneId',              authProjectManager, milestoneController.updateMilestone)
router.delete('/project/:projectId/:milestoneId',              authProjectManager, milestoneController.deleteMilestone)
router.put   ('/project/:projectId/:milestoneId/complete',     authProjectManager, milestoneController.completeMilestone)
router.put   ('/project/:projectId/:milestoneId/reopen',       authProjectManager, milestoneController.reopenMilestone)

module.exports = router