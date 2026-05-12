const express = require('express')
const multer = require('multer')
const aiController = require('../controllers/ai.controller')
const { authUser, authProjectManager } = require('../middlewares/auth.middleware')

const router = express.Router()
const briefUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
})

router.get(
    '/projects/matches/me',
    authUser,
    aiController.getProjectMatches
)

router.get(
    '/projects/:projectId/skill-gap',
    authProjectManager,
    aiController.getSkillGapAnalysis
)

router.get(
    '/projects/:projectId/predictive-analytics',
    authProjectManager,
    aiController.getPredictiveAnalytics
)

router.get(
    '/projects/:projectId/team-assembly',
    authProjectManager,
    aiController.getTeamAssembly
)

router.post(
    '/tasks/:taskId/assignee-suggestions',
    authProjectManager,
    aiController.suggestTaskAssignees
)

router.post(
    '/project-brief/parse',
    authProjectManager,
    briefUpload.single('brief_file'),
    aiController.parseBrief
)


module.exports = router
