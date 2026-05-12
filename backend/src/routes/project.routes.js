const express           = require('express')
const projectController = require('../controllers/project.controller')
const authMiddleware    = require('../middlewares/auth.middleware')

const authUser           = authMiddleware.authUser
const authProjectManager = authMiddleware.authProjectManager

const router = express.Router()

router.post  ('/create-project',       authProjectManager, projectController.createProject)
router.get   ('/get-projects',         authProjectManager, projectController.getProjects)
router.get   ('/get-project/:id',      projectController.getProjectById)
router.get   ('/:id/chat',             authUser,           projectController.getProjectChat)
router.post  ('/:id/chat',             authUser,           projectController.sendProjectChatMessage)
router.put   ('/update-project/:id',   authProjectManager, projectController.updateProject)
router.delete('/delete-project/:id',   authProjectManager, projectController.deleteProject)

router.get   ('/users',               authProjectManager, projectController.getUsers)
router.post  ('/:id/team',            authProjectManager, projectController.addTeamMember)
router.put   ('/:id/team-selection',  authProjectManager, projectController.setProjectTeam)
router.delete('/:id/team/:userId',    authProjectManager, projectController.removeTeamMember)

module.exports = router
