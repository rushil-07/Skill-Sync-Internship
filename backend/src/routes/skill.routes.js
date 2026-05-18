const express          = require('express')
const skillController  = require('../controllers/skill.controller')
const { authUser, authAdmin, authProjectManager } = require('../middlewares/auth.middleware')

const router = express.Router()

// --- Taxonomy (Admin manages the global skill list) ---------------------------
// GET    /api/skills                   - list all skills (any user - needed for dropdowns)
// POST   /api/skills                   - create skill (Admin only)
// PUT    /api/skills/:skillId          - update skill (Admin only)
// DELETE /api/skills/:skillId          - delete skill + cascade (Admin only)

router.get   ('/',           authUser,  skillController.getAllSkills)
router.post  ('/',           authAdmin, skillController.createSkill)
router.put   ('/:skillId',   authAdmin, skillController.updateSkill)
router.delete('/:skillId',   authAdmin, skillController.deleteSkill)

// --- User Profile Skills ------------------------------------------------------
// POST   /api/skills/profile/add              - add skill to own profile
// PUT    /api/skills/profile/:userSkillId     - update proficiency
// DELETE /api/skills/profile/:userSkillId     - remove from profile

router.post  ('/profile/add',              authUser, skillController.addSkillToProfile)
router.put   ('/profile/:userSkillId',     authUser, skillController.updateProfileSkill)
router.delete('/profile/:userSkillId',     authUser, skillController.removeSkillFromProfile)

// --- Project Required Skills --------------------------------------------------
// POST   /api/skills/project/:projectId/add          - add required skill (PM)
// DELETE /api/skills/project/:projectId/:reqSkillId  - remove required skill (PM)

router.post  ('/project/:projectId/add',              authProjectManager, skillController.addRequiredSkill)
router.delete('/project/:projectId/:reqSkillId',      authProjectManager, skillController.removeRequiredSkill)

// --- Skill Gap Analysis -------------------------------------------------------
// GET    /api/skills/gap/:projectId   - compare team skills vs project requirements

router.get('/gap/:projectId', authUser, skillController.getSkillGap)

module.exports = router