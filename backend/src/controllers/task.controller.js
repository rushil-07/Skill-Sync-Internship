const taskModel    = require('../models/task.model')
const projectModel = require('../models/project.model')
const userModel    = require('../models/user.model')
const notifService = require('../services/notification.service')
const { suggestTaskAssignees, refreshProjectAnalytics } = require('../services/ai.service')
const imagekitService = require('../services/imagekit.service')

// --- Helper: extract @mentions from comment text ------------------------------
// Finds @username patterns and resolves them to user IDs
async function extractMentions(content) {
    const matches = content.match(/@(\w+)/g)
    if (!matches) return []
    const usernames = matches.map(m => m.slice(1))
    const users = await userModel.find({ username: { $in: usernames } }).select('_id')
    return users.map(u => u._id)
}


// =============================================================================
// TASK CRUD
// =============================================================================

// --- POST /api/tasks ----------------------------------------------------------
// Create a task - PM only
// Body: { title, description, project_id, assigned_to, priority, due_date, dependencies }
async function createTask(req, res) {
    try {
        const { title, description, project_id, assigned_to, priority, due_date, dependencies } = req.body

        if (!title || !project_id) {
            return res.status(400).json({ message: 'title and project_id are required' })
        }

        // Verify the project exists
        const project = await projectModel.findById(project_id)
        if (!project) {
            return res.status(404).json({ message: 'Project not found' })
        }

        const payload = {
            title,
            project_id,
            created_by: req.user.id,
        }

        if (description)   payload.description   = description
        if (assigned_to)   payload.assigned_to   = assigned_to
        if (priority)      payload.priority      = priority
        if (due_date)      payload.due_date      = new Date(due_date)
        if (dependencies?.length) payload.dependencies = dependencies

        const task = await taskModel.create(payload)

        // Log initial history entry
        task.logHistory(req.user.id, 'created', null, 'Task created')
        await task.save()

        let finalAssigneeId = assigned_to || null
        let autoAssigned = false

        if (!assigned_to && project.task_assignment_mode === 'AUTO_ASSIGN_TOP_MATCH') {
            const suggestionResult = await suggestTaskAssignees(task._id, { persistSuggestion: false })
            const topSuggestion = suggestionResult?.best_suggestion

            if (topSuggestion?._id) {
                task.assigned_to = topSuggestion._id
                task.ai_suggested_assignee = topSuggestion._id
                task.logHistory(req.user.id, 'assigned_to', null, topSuggestion._id)
                await task.save()
                finalAssigneeId = topSuggestion._id
                autoAssigned = true
            }
        }

        // -- Notify assignee ---------------------------------------------------
        if (finalAssigneeId && finalAssigneeId.toString() !== req.user.id) {
            await notifService.create(
                finalAssigneeId,
                'TASK_ASSIGNED',
                autoAssigned ? 'New auto-assigned task' : 'New task assigned to you',
                autoAssigned
                    ? `"${title}" was auto-assigned to you in ${project.name}`
                    : `"${title}" was assigned to you in ${project.name}`,
                `/pm/projects/${project_id}/tasks`
            )
        }

        // Populate for response
        const populated = await taskModel.findById(task._id)
            .populate('assigned_to', 'username email profile_picture_url')
            .populate('created_by', 'username')
            .populate('dependencies', 'title status')

        await refreshProjectAnalytics(project_id)

        res.status(201).json({
            message: 'Task created successfully',
            task: populated,
            auto_assigned: autoAssigned,
            assignment_mode: project.task_assignment_mode || 'MANUAL_APPROVAL',
        })
    } catch (error) {
        console.error('createTask error:', error)
        if (error.name === 'StrictModeError') {
            return res.status(400).json({ message: `Field not allowed: ${error.message}` })
        }
        res.status(500).json({ message: 'Server error' })
    }
}


// --- GET /api/tasks/project/:projectId ---------------------------------------
// Get all tasks for a project - any authenticated user
// Supports ?status=TODO&assigned_to=userId&priority=HIGH
async function getTasksByProject(req, res) {
    try {
        const query = { project_id: req.params.projectId }

        if (req.query.status)      query.status      = req.query.status
        if (req.query.assigned_to) query.assigned_to = req.query.assigned_to
        if (req.query.priority)    query.priority    = req.query.priority

        const tasks = await taskModel.find(query)
            .populate('assigned_to', 'username email profile_picture_url')
            .populate('created_by', 'username')
            .populate('dependencies', 'title status')
            .sort({ created_at: -1 })

        res.status(200).json({
            message: 'Tasks retrieved successfully',
            tasks,
            count: tasks.length,
        })
    } catch (error) {
        console.error('getTasksByProject error:', error)
        res.status(500).json({ message: 'Server error' })
    }
}


// --- GET /api/tasks/my-tasks --------------------------------------------------
// Get all tasks assigned to the logged-in user
async function getMyTasks(req, res) {
    try {
        const query = { assigned_to: req.user.id }
        if (req.query.status)   query.status   = req.query.status
        if (req.query.priority) query.priority = req.query.priority

        const tasks = await taskModel.find(query)
            .populate('project_id', 'name status')
            .populate('assigned_to', 'username profile_picture_url')
            .populate('created_by', 'username')
            .sort({ due_date: 1 })  // sort by due date ascending

        res.status(200).json({ tasks, count: tasks.length })
    } catch (error) {
        console.error('getMyTasks error:', error)
        res.status(500).json({ message: 'Server error' })
    }
}


// --- GET /api/tasks/:id -------------------------------------------------------
// Get single task with full details
async function getTaskById(req, res) {
    try {
        const task = await taskModel.findById(req.params.id)
            .populate('assigned_to',             'username email profile_picture_url')
            .populate('created_by',              'username')
            .populate('dependencies',            'title status priority')
            .populate('comments.author',         'username profile_picture_url')
            .populate('comments.mentions',       'username')
            .populate('time_entries.user',       'username')
            .populate('history.changed_by',      'username')
            .populate('subtasks')
            .populate('ai_suggested_assignee',   'username profile_picture_url')

        if (!task) return res.status(404).json({ message: 'Task not found' })

        res.status(200).json({ task })
    } catch (error) {
        console.error('getTaskById error:', error)
        res.status(500).json({ message: 'Server error' })
    }
}


// --- PUT /api/tasks/:id -------------------------------------------------------
// Update task - PM can update anything, Member can only update status
// Body: any subset of { title, description, assigned_to, status, priority, due_date, dependencies }
async function updateTask(req, res) {
    try {
        const task = await taskModel.findById(req.params.id)
        if (!task) return res.status(404).json({ message: 'Task not found' })

        const isMember = req.user.role === 'MEMBER'

        // Members can only update status
        if (isMember) {
            if (Object.keys(req.body).some(k => k !== 'status')) {
                return res.status(403).json({ message: 'Members can only update task status' })
            }
        }

        const ALLOWED = ['title', 'description', 'assigned_to', 'status', 'priority', 'due_date', 'dependencies']

        for (const field of ALLOWED) {
            if (req.body[field] !== undefined) {
                // Log history for important field changes
                if (['status', 'assigned_to', 'priority'].includes(field)) {
                    task.logHistory(req.user.id, field, task[field], req.body[field])
                }
                task[field] = field === 'due_date' ? new Date(req.body[field]) : req.body[field]
            }
        }

        await task.save()

        // -- Notifications on update -------------------------------------------
        const origAssignee = task.assigned_to
        if (req.body.assigned_to && req.body.assigned_to.toString() !== req.user.id) {
            await notifService.create(
                req.body.assigned_to,
                'TASK_ASSIGNED',
                'Task assigned to you',
                `"${task.title}" has been assigned to you`,
                `/pm/projects/${task.project_id}/tasks`
            )
        }
        if (req.body.status && origAssignee && origAssignee.toString() !== req.user.id) {
            await notifService.create(
                origAssignee,
                'STATUS_CHANGED',
                'Task status updated',
                `"${task.title}" was moved to ${req.body.status.replace('_', ' ')}`,
                `/pm/projects/${task.project_id}/tasks`
            )
        }

        const updated = await taskModel.findById(task._id)
            .populate('assigned_to', 'username email profile_picture_url')
            .populate('created_by', 'username')
            .populate('dependencies', 'title status')

        await refreshProjectAnalytics(task.project_id)

        res.status(200).json({
            message: 'Task updated successfully',
            task: updated,
        })
    } catch (error) {
        console.error('updateTask error:', error)
        res.status(500).json({ message: 'Server error' })
    }
}


// --- DELETE /api/tasks/:id ----------------------------------------------------
// Delete task - PM only
async function deleteTask(req, res) {
    try {
        const task = await taskModel.findByIdAndDelete(req.params.id)
        if (!task) return res.status(404).json({ message: 'Task not found' })
        await refreshProjectAnalytics(task.project_id)
        res.status(200).json({ message: 'Task deleted successfully' })
    } catch (error) {
        console.error('deleteTask error:', error)
        res.status(500).json({ message: 'Server error' })
    }
}


// =============================================================================
// SUBTASKS
// =============================================================================

// --- POST /api/tasks/:id/subtasks --------------------------------------------
async function addSubtask(req, res) {
    try {
        const { title } = req.body
        if (!title) return res.status(400).json({ message: 'title is required' })

        const task = await taskModel.findById(req.params.id)
        if (!task) return res.status(404).json({ message: 'Task not found' })

        task.subtasks.push({ title })
        task.logHistory(req.user.id, 'subtask_added', null, title)
        await task.save()

        res.status(201).json({
            message: 'Subtask added',
            subtask: task.subtasks[task.subtasks.length - 1],
        })
    } catch (error) {
        console.error('addSubtask error:', error)
        res.status(500).json({ message: 'Server error' })
    }
}


// --- PUT /api/tasks/:id/subtasks/:subtaskId -----------------------------------
// Toggle subtask completed
async function toggleSubtask(req, res) {
    try {
        const task = await taskModel.findById(req.params.id)
        if (!task) return res.status(404).json({ message: 'Task not found' })

        const subtask = task.subtasks.id(req.params.subtaskId)
        if (!subtask) return res.status(404).json({ message: 'Subtask not found' })

        subtask.completed    = !subtask.completed
        subtask.completed_at = subtask.completed ? new Date() : null

        await task.save()
        res.status(200).json({ message: 'Subtask updated', subtask })
    } catch (error) {
        console.error('toggleSubtask error:', error)
        res.status(500).json({ message: 'Server error' })
    }
}


// --- DELETE /api/tasks/:id/subtasks/:subtaskId --------------------------------
async function deleteSubtask(req, res) {
    try {
        const task = await taskModel.findById(req.params.id)
        if (!task) return res.status(404).json({ message: 'Task not found' })

        const subtask = task.subtasks.id(req.params.subtaskId)
        if (!subtask) return res.status(404).json({ message: 'Subtask not found' })

        subtask.deleteOne()
        await task.save()
        res.status(200).json({ message: 'Subtask deleted' })
    } catch (error) {
        console.error('deleteSubtask error:', error)
        res.status(500).json({ message: 'Server error' })
    }
}


// =============================================================================
// COMMENTS
// =============================================================================

// --- POST /api/tasks/:id/comments --------------------------------------------
// Add a comment - parses @mentions automatically
async function addComment(req, res) {
    try {
        const { content } = req.body
        if (!content?.trim()) return res.status(400).json({ message: 'content is required' })

        const task = await taskModel.findById(req.params.id)
        if (!task) return res.status(404).json({ message: 'Task not found' })

        const mentions = await extractMentions(content)

        task.comments.push({
            author:  req.user.id,
            content: content.trim(),
            mentions,
        })

        await task.save()

        // -- Notify mentioned users --------------------------------------------
        if (mentions.length > 0) {
            await notifService.createMany(
                mentions.filter(id => id.toString() !== req.user.id),
                'MENTION',
                `${req.user.username} mentioned you`,
                `In "${task.title}": ${content.slice(0, 100)}${content.length > 100 ? '...' : ''}`,
                `/pm/projects/${task.project_id}/tasks`
            )
        }

        // -- Notify task assignee (if not the commenter) -----------------------
        if (task.assigned_to && task.assigned_to.toString() !== req.user.id) {
            const alreadyMentioned = mentions.some(m => m.toString() === task.assigned_to.toString())
            if (!alreadyMentioned) {
                await notifService.create(
                    task.assigned_to,
                    'COMMENT',
                    `New comment on your task`,
                    `${req.user.username} commented on "${task.title}"`,
                    `/pm/projects/${task.project_id}/tasks`
                )
            }
        }

        // Populate the new comment for response
        const updated = await taskModel.findById(task._id)
            .populate('comments.author',   'username profile_picture_url')
            .populate('comments.mentions', 'username')

        const newComment = updated.comments[updated.comments.length - 1]

        res.status(201).json({ message: 'Comment added', comment: newComment })
    } catch (error) {
        console.error('addComment error:', error)
        res.status(500).json({ message: 'Server error' })
    }
}


// --- DELETE /api/tasks/:id/comments/:commentId -------------------------------
// Delete own comment - or PM can delete any comment
async function deleteComment(req, res) {
    try {
        const task = await taskModel.findById(req.params.id)
        if (!task) return res.status(404).json({ message: 'Task not found' })

        const comment = task.comments.id(req.params.commentId)
        if (!comment) return res.status(404).json({ message: 'Comment not found' })

        const isOwner = comment.author.toString() === req.user.id
        const isPM    = req.user.role === 'PROJECT_MANAGER' || req.user.role === 'ADMIN'

        if (!isOwner && !isPM) {
            return res.status(403).json({ message: 'You can only delete your own comments' })
        }

        comment.deleteOne()
        await task.save()
        res.status(200).json({ message: 'Comment deleted' })
    } catch (error) {
        console.error('deleteComment error:', error)
        res.status(500).json({ message: 'Server error' })
    }
}


// =============================================================================
// ATTACHMENTS
// =============================================================================

// --- POST /api/tasks/:id/attachments -----------------------------------------
// Upload a task attachment to ImageKit and store its metadata on the task
async function uploadAttachment(req, res) {
    try {
        if (!req.file) return res.status(400).json({ message: 'attachment file is required' })

        const task = await taskModel.findById(req.params.id)
        if (!task) return res.status(404).json({ message: 'Task not found' })

        const uploaded = await imagekitService.uploadFile(req.file, {
            folder: `${imagekitService.getConfig().taskAttachmentsFolder}/${task._id}`,
            tags: ['skillsync', 'task-attachment'],
        })

        task.attachments.push({
            ...uploaded,
            uploaded_by: req.user.id,
        })
        task.logHistory(req.user.id, 'attachment_added', null, uploaded.name)
        await task.save()

        res.status(201).json({
            message: 'Attachment uploaded',
            attachment: task.attachments[task.attachments.length - 1],
            task,
        })
    } catch (error) {
        console.error('uploadAttachment error:', error)
        res.status(error.statusCode || 500).json({ message: error.message || 'Server error' })
    }
}


// --- DELETE /api/tasks/:id/attachments/:attachmentId -------------------------
// Remove attachment metadata and delete the stored ImageKit file when possible
async function deleteAttachment(req, res) {
    try {
        const task = await taskModel.findById(req.params.id)
        if (!task) return res.status(404).json({ message: 'Task not found' })

        const attachment = task.attachments.id(req.params.attachmentId)
        if (!attachment) return res.status(404).json({ message: 'Attachment not found' })

        const isOwner = attachment.uploaded_by?.toString() === req.user.id
        const isPM = req.user.role === 'PROJECT_MANAGER' || req.user.role === 'ADMIN'
        if (!isOwner && !isPM) {
            return res.status(403).json({ message: 'You can only delete your own attachments' })
        }

        if (attachment.file_id) {
            await imagekitService.deleteFile(attachment.file_id)
        }

        const attachmentName = attachment.name
        attachment.deleteOne()
        task.logHistory(req.user.id, 'attachment_deleted', attachmentName, null)
        await task.save()

        res.status(200).json({
            message: 'Attachment deleted',
            task,
        })
    } catch (error) {
        console.error('deleteAttachment error:', error)
        res.status(error.statusCode || 500).json({ message: error.message || 'Server error' })
    }
}


// =============================================================================
// TIME TRACKING
// =============================================================================

// --- POST /api/tasks/:id/timer/start -----------------------------------------
async function startTimer(req, res) {
    try {
        const task = await taskModel.findById(req.params.id)
        if (!task) return res.status(404).json({ message: 'Task not found' })

        // Prevent double-starting
        if (task.active_timer?.started_at) {
            return res.status(400).json({ message: 'Timer is already running for this task' })
        }

        task.active_timer = { user: req.user.id, started_at: new Date() }
        await task.save()

        res.status(200).json({
            message: 'Timer started',
            started_at: task.active_timer.started_at,
        })
    } catch (error) {
        console.error('startTimer error:', error)
        res.status(500).json({ message: 'Server error' })
    }
}


// --- POST /api/tasks/:id/timer/stop ------------------------------------------
async function stopTimer(req, res) {
    try {
        const task = await taskModel.findById(req.params.id)
        if (!task) return res.status(404).json({ message: 'Task not found' })

        if (!task.active_timer?.started_at) {
            return res.status(400).json({ message: 'No active timer for this task' })
        }

        const end_time        = new Date()
        const start_time      = task.active_timer.started_at
        const duration_minutes = Math.ceil((end_time - start_time) / (1000 * 60))

        task.time_entries.push({
            user: task.active_timer.user,
            start_time,
            end_time,
            duration_minutes,
            note: req.body.note || '',
        })

        task.total_time_minutes += duration_minutes
        task.active_timer = { user: null, started_at: null }

        await task.save()

        res.status(200).json({
            message: 'Timer stopped',
            duration_minutes,
            total_time_minutes: task.total_time_minutes,
        })
    } catch (error) {
        console.error('stopTimer error:', error)
        res.status(500).json({ message: 'Server error' })
    }
}


// --- POST /api/tasks/:id/timer/manual ----------------------------------------
// Log a manual time entry
// Body: { duration_minutes, note, date }
async function logManualTime(req, res) {
    try {
        const { duration_minutes, note, date } = req.body

        if (!duration_minutes || duration_minutes <= 0) {
            return res.status(400).json({ message: 'duration_minutes must be a positive number' })
        }

        const task = await taskModel.findById(req.params.id)
        if (!task) return res.status(404).json({ message: 'Task not found' })

        const start_time = date ? new Date(date) : new Date()
        const end_time   = new Date(start_time.getTime() + duration_minutes * 60 * 1000)

        task.time_entries.push({
            user: req.user.id,
            start_time,
            end_time,
            duration_minutes: Number(duration_minutes),
            note: note || '',
        })

        task.total_time_minutes += Number(duration_minutes)
        await task.save()

        res.status(201).json({
            message: 'Time logged manually',
            duration_minutes: Number(duration_minutes),
            total_time_minutes: task.total_time_minutes,
        })
    } catch (error) {
        console.error('logManualTime error:', error)
        res.status(500).json({ message: 'Server error' })
    }
}


module.exports = {
    createTask,
    getTasksByProject,
    getMyTasks,
    getTaskById,
    updateTask,
    deleteTask,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    addComment,
    deleteComment,
    uploadAttachment,
    deleteAttachment,
    startTimer,
    stopTimer,
    logManualTime,
}
