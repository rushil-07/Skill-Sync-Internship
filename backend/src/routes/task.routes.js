const express        = require('express')
const multer         = require('multer')
const taskController = require('../controllers/task.controller')
const { authUser, authProjectManager } = require('../middlewares/auth.middleware')

const router = express.Router()
const attachmentUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 25 * 1024 * 1024 },
})

// --- Task CRUD ----------------------------------------------------------------
// POST   /api/tasks                          - create task (PM only)
// GET    /api/tasks/my-tasks                 - get my assigned tasks (any user)
// GET    /api/tasks/project/:projectId       - get all tasks in a project (any user)
// GET    /api/tasks/:id                      - get single task with full details
// PUT    /api/tasks/:id                      - update task (PM = any field, Member = status only)
// DELETE /api/tasks/:id                      - delete task (PM only)

router.post('/',                        authProjectManager, taskController.createTask)
router.get('/my-tasks',                 authUser,           taskController.getMyTasks)
router.get('/project/:projectId',       authUser,           taskController.getTasksByProject)
router.get('/:id',                      authUser,           taskController.getTaskById)
router.put('/:id',                      authUser,           taskController.updateTask)
router.delete('/:id',                   authProjectManager, taskController.deleteTask)

// --- Subtasks ----------------------------------------------------------------
// POST   /api/tasks/:id/subtasks             - add subtask (PM only)
// PUT    /api/tasks/:id/subtasks/:subtaskId  - toggle subtask complete (any user)
// DELETE /api/tasks/:id/subtasks/:subtaskId  - delete subtask (PM only)

router.post  ('/:id/subtasks',                    authProjectManager, taskController.addSubtask)
router.put   ('/:id/subtasks/:subtaskId',          authUser,           taskController.toggleSubtask)
router.delete('/:id/subtasks/:subtaskId',          authProjectManager, taskController.deleteSubtask)

// --- Comments ----------------------------------------------------------------
// POST   /api/tasks/:id/comments             - add comment (any user)
// DELETE /api/tasks/:id/comments/:commentId  - delete comment (own or PM/Admin)

router.post  ('/:id/comments',                    authUser, taskController.addComment)
router.delete('/:id/comments/:commentId',          authUser, taskController.deleteComment)

// --- Attachments -------------------------------------------------------------
// POST   /api/tasks/:id/attachments                 - upload attachment to ImageKit
// DELETE /api/tasks/:id/attachments/:attachmentId   - delete attachment

router.post  ('/:id/attachments',               authUser, attachmentUpload.single('attachment'), taskController.uploadAttachment)
router.delete('/:id/attachments/:attachmentId',  authUser, taskController.deleteAttachment)

// --- Time Tracking -----------------------------------------------------------
// POST   /api/tasks/:id/timer/start          - start timer (any user)
// POST   /api/tasks/:id/timer/stop           - stop timer (any user)
// POST   /api/tasks/:id/timer/manual         - log manual time entry (any user)

router.post('/:id/timer/start',   authUser, taskController.startTimer)
router.post('/:id/timer/stop',    authUser, taskController.stopTimer)
router.post('/:id/timer/manual',  authUser, taskController.logManualTime)

module.exports = router
