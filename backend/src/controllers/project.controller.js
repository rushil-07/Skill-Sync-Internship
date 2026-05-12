const projectModel = require('../models/project.model')
const userModel    = require('../models/user.model')
const notifService = require('../services/notification.service')
const { applyAutomaticSkillUpdates } = require('../services/projectCompletion.service')
const { refreshProjectAnalytics } = require('../services/ai.service')

async function extractMentions(content) {
    const matches = content.match(/@(\w+)/g)
    if (!matches) return []
    const usernames = matches.map(match => match.slice(1))
    const users = await userModel.find({ username: { $in: usernames } }).select('_id')
    return users.map(user => user._id)
}

function canAccessProjectChat(project, user) {
    const userId = user?.id?.toString?.() || user?._id?.toString?.()
    if (!userId) return false
    if (user?.role === 'ADMIN') return true
    if (project.created_by?.toString() === userId) return true
    if (project.project_manager?.toString() === userId) return true
    return (project.team_members || []).some(memberId => memberId.toString() === userId)
}

// ─── POST /api/project/create-project ────────────────────────────────────────
const createProject = async (req, res) => {
    try {
        const { name, description, status, task_assignment_mode, start_date, end_date, budget } = req.body

        if (!name) return res.status(400).json({ message: 'name is required' })

        const payload = { name, created_by: req.user.id }
        if (description) payload.description = description
        if (status)      payload.status      = status
        if (task_assignment_mode) payload.task_assignment_mode = task_assignment_mode
        if (start_date)  payload.start_date  = new Date(start_date)
        if (end_date)    payload.end_date    = new Date(end_date)
        if (budget)      payload.budget      = Number(budget)

        const project = await projectModel.create(payload)
        await refreshProjectAnalytics(project._id)

        res.status(201).json({
            message: 'Project created successfully',
            project,
        })
    } catch (error) {
        console.error('createProject error:', error)
        if (error.name === 'StrictModeError') {
            return res.status(400).json({ message: `Field not allowed: ${error.message}` })
        }
        res.status(500).json({ message: 'Server error' })
    }
}


// ─── GET /api/project/get-projects ───────────────────────────────────────────
const getProjects = async (req, res) => {
    try {
        const projects = await projectModel
            .find({ created_by: req.user.id })
            .select('name description status budget ai_success_score end_date created_at team_members')
            .sort({ created_at: -1 })
            .lean()

        const normalizedProjects = projects.map(project => ({
            ...project,
            created_by: { username: req.user.username || 'You' },
        }))

        res.status(200).json({ message: 'Projects retrieved successfully', projects: normalizedProjects })
    } catch (error) {
        console.error('getProjects error:', error)
        res.status(500).json({ message: 'Server error' })
    }
}


// ─── GET /api/project/get-project/:id ────────────────────────────────────────
const getProjectById = async (req, res) => {
    try {
        const project = await projectModel
            .findById(req.params.id)
            .populate('team_members', 'username email profile_picture_url current_capacity_percentage availability_hours_per_week skills')
            .populate('created_by', 'username')
            .populate('project_manager', 'username')

        if (!project) return res.status(404).json({ error: 'Project not found' })

        res.status(200).json({ message: 'Project retrieved successfully', project })
    } catch (error) {
        console.error('getProjectById error:', error)
        res.status(500).json({ error: error.message })
    }
}


// ─── PUT /api/project/update-project/:id ─────────────────────────────────────
const updateProject = async (req, res) => {
    try {
        const ALLOWED = ['name', 'description', 'status', 'task_assignment_mode', 'start_date', 'end_date', 'budget', 'ai_success_score']
        const payload = {}
        for (const key of ALLOWED) {
            if (req.body[key] !== undefined) payload[key] = req.body[key]
        }
        payload.updated_at = new Date()

        const existingProject = await projectModel.findById(req.params.id)
        if (!existingProject) return res.status(404).json({ error: 'Project not found' })

        const wasCompleted = existingProject.status === 'COMPLETED'

        const project = await projectModel.findByIdAndUpdate(
            req.params.id,
            { $set: payload },
            { new: true, runValidators: true }
        ).populate('team_members', 'username email profile_picture_url current_capacity_percentage')

        const isNowCompleted = project.status === 'COMPLETED'

        if (!wasCompleted && isNowCompleted) {
            await applyAutomaticSkillUpdates(project._id)
        }

        await refreshProjectAnalytics(project._id)

        const refreshedProject = await projectModel
            .findById(project._id)
            .populate('team_members', 'username email profile_picture_url current_capacity_percentage')

        res.status(200).json(refreshedProject)
    } catch (error) {
        console.error('updateProject error:', error)
        res.status(400).json({ error: error.message })
    }
}


// ─── DELETE /api/project/delete-project/:id ──────────────────────────────────
const deleteProject = async (req, res) => {
    try {
        const project = await projectModel.findByIdAndDelete(req.params.id)
        if (!project) return res.status(404).json({ error: 'Project not found' })
        res.status(200).json({ message: 'Project deleted successfully' })
    } catch (error) {
        console.error('deleteProject error:', error)
        res.status(500).json({ error: error.message })
    }
}


// ═════════════════════════════════════════════════════════════════════════════
// TEAM MEMBER MANAGEMENT
// ═════════════════════════════════════════════════════════════════════════════

// ─── GET /api/project/users ───────────────────────────────────────────────────
// Get all MEMBER-role users — used to populate the "Add Member" picker
// Returns username, email, capacity, skills count
const getUsers = async (req, res) => {
    try {
        const users = await userModel
            .find({ role: { $in: ['MEMBER', 'PROJECT_MANAGER'] } })
            .select('username email profile_picture_url current_capacity_percentage availability_hours_per_week skills role')
            .sort({ username: 1 })

        res.status(200).json({ users })
    } catch (error) {
        console.error('getUsers error:', error)
        res.status(500).json({ message: 'Server error' })
    }
}


// ─── POST /api/project/:id/team ───────────────────────────────────────────────
// Add a member to a project
// Body: { userId }
const addTeamMember = async (req, res) => {
    try {
        const { userId } = req.body
        if (!userId) return res.status(400).json({ message: 'userId is required' })

        const [project, user] = await Promise.all([
            projectModel.findById(req.params.id),
            userModel.findById(userId).select('username email profile_picture_url current_capacity_percentage availability_hours_per_week skills'),
        ])

        if (!project) return res.status(404).json({ message: 'Project not found' })
        if (!user)    return res.status(404).json({ message: 'User not found' })

        // Check already a member
        const alreadyMember = project.team_members.some(
            m => m.toString() === userId.toString()
        )
        if (alreadyMember) {
            return res.status(409).json({ message: `${user.username} is already in this project` })
        }

        project.team_members.push(userId)
        await project.save()

        // Add to user's project_history
        await userModel.findByIdAndUpdate(userId, {
            $push: {
                project_history: {
                    project_id:      project._id,
                    role_in_project: 'Team Member',
                    status:          'ONGOING',
                    joined_at:       new Date(),
                }
            }
        })

        // ── Notify the added member ───────────────────────────────────────────
        await notifService.create(
            userId,
            'PROJECT_JOINED',
            'You were added to a project',
            `${req.user.username} added you to "${project.name}"`,
            `/pm/projects/${project._id}/tasks`
        )

        await refreshProjectAnalytics(project._id)

        res.status(201).json({
            message: `${user.username} added to project`,
            member:  user,
        })
    } catch (error) {
        console.error('addTeamMember error:', error)
        res.status(500).json({ message: 'Server error' })
    }
}


// ─── DELETE /api/project/:id/team/:userId ─────────────────────────────────────
// Remove a member from a project
const removeTeamMember = async (req, res) => {
    try {
        const { id, userId } = req.params

        const project = await projectModel.findById(id)
        if (!project) return res.status(404).json({ message: 'Project not found' })

        const wasMember = project.team_members.some(
            m => m.toString() === userId.toString()
        )
        if (!wasMember) {
            return res.status(404).json({ message: 'User is not a member of this project' })
        }

        // Pull from team_members array
        project.team_members = project.team_members.filter(
            m => m.toString() !== userId.toString()
        )
        await project.save()

        // Update project_history status to COMPLETED
        await userModel.findOneAndUpdate(
            { _id: userId, 'project_history.project_id': id },
            { $set: { 'project_history.$.status': 'COMPLETED', 'project_history.$.completed_at': new Date() } }
        )

        await refreshProjectAnalytics(project._id)

        res.status(200).json({ message: 'Member removed from project' })
    } catch (error) {
        console.error('removeTeamMember error:', error)
        res.status(500).json({ message: 'Server error' })
    }
}

// ─── PUT /api/project/:id/team-selection ──────────────────────────────────────
// Replace current team with selected AI team
// Body: { memberIds: string[] }
const setProjectTeam = async (req, res) => {
    try {
        const { id } = req.params
        const { memberIds } = req.body

        if (!Array.isArray(memberIds)) {
            return res.status(400).json({ message: 'memberIds must be an array' })
        }

        const uniqueIds = [...new Set(memberIds.map(String))]

        const [project, users] = await Promise.all([
            projectModel.findById(id),
            userModel.find({ _id: { $in: uniqueIds } })
                .select('username email profile_picture_url current_capacity_percentage availability_hours_per_week skills')
        ])

        if (!project) return res.status(404).json({ message: 'Project not found' })

        if (users.length !== uniqueIds.length) {
            return res.status(400).json({ message: 'One or more selected users were not found' })
        }

        const prevMemberIds = (project.team_members || []).map(m => m.toString())
        const nextMemberIds = uniqueIds

        const addedIds = nextMemberIds.filter(uid => !prevMemberIds.includes(uid))
        const removedIds = prevMemberIds.filter(uid => !nextMemberIds.includes(uid))

        project.team_members = nextMemberIds
        project.updated_at = new Date()
        await project.save()

        if (addedIds.length) {
            await Promise.all(
                addedIds.map(userId =>
                    userModel.findByIdAndUpdate(userId, {
                        $push: {
                            project_history: {
                                project_id: project._id,
                                role_in_project: 'Team Member',
                                status: 'ONGOING',
                                joined_at: new Date(),
                            }
                        }
                    })
                )
            )

            await Promise.all(
                addedIds.map(userId =>
                    notifService.create(
                        userId,
                        'PROJECT_JOINED',
                        'You were added to a project',
                        `${req.user.username} added you to "${project.name}"`,
                        `/pm/projects/${project._id}/tasks`
                    )
                )
            )
        }

        if (removedIds.length) {
            await Promise.all(
                removedIds.map(userId =>
                    userModel.findOneAndUpdate(
                        { _id: userId, 'project_history.project_id': id },
                        {
                            $set: {
                                'project_history.$.status': 'COMPLETED',
                                'project_history.$.completed_at': new Date(),
                            }
                        }
                    )
                )
            )
        }

        await refreshProjectAnalytics(project._id)

        const updatedProject = await projectModel
            .findById(id)
            .populate('team_members', 'username email profile_picture_url current_capacity_percentage availability_hours_per_week skills')
            .populate('created_by', 'username')
            .populate('project_manager', 'username')

        res.status(200).json({
            message: 'Project team updated successfully',
            project: updatedProject,
        })
    } catch (error) {
        console.error('setProjectTeam error:', error)
        res.status(500).json({ message: 'Server error' })
    }
}

const getProjectChat = async (req, res) => {
    try {
        const project = await projectModel
            .findById(req.params.id)
            .populate('chat_messages.sender', 'username profile_picture_url role')
            .populate('chat_messages.mentions', 'username')

        if (!project) return res.status(404).json({ message: 'Project not found' })
        if (!canAccessProjectChat(project, req.user)) {
            return res.status(403).json({ message: 'Access denied' })
        }

        res.status(200).json({
            messages: project.chat_messages || [],
        })
    } catch (error) {
        console.error('getProjectChat error:', error)
        res.status(500).json({ message: 'Server error' })
    }
}

const sendProjectChatMessage = async (req, res) => {
    try {
        const { content } = req.body
        if (!content?.trim()) {
            return res.status(400).json({ message: 'content is required' })
        }

        const project = await projectModel.findById(req.params.id)
        if (!project) return res.status(404).json({ message: 'Project not found' })
        if (!canAccessProjectChat(project, req.user)) {
            return res.status(403).json({ message: 'Access denied' })
        }

        const mentions = await extractMentions(content)
        const message = {
            sender: req.user.id,
            content: content.trim(),
            mentions,
        }

        project.chat_messages.push(message)
        project.updated_at = new Date()
        await project.save()

        const updatedProject = await projectModel
            .findById(req.params.id)
            .populate('chat_messages.sender', 'username profile_picture_url role')
            .populate('chat_messages.mentions', 'username')

        const newMessage = updatedProject.chat_messages[updatedProject.chat_messages.length - 1]
        const userId = req.user.id.toString()
        const recipients = [
            ...new Set([
                ...((project.team_members || []).map(memberId => memberId.toString())),
                project.created_by?.toString?.(),
                project.project_manager?.toString?.(),
                ...mentions.map(id => id.toString()),
            ].filter(Boolean)),
        ].filter(id => id !== userId)

        if (recipients.length) {
            await notifService.createMany(
                recipients,
                'PROJECT_CHAT',
                `New message in ${project.name}`,
                `${req.user.username} posted in the project chat`,
                `/pm/projects/${project._id}`
            )
        }

        res.status(201).json({
            message: 'Chat message sent',
            chat_message: newMessage,
        })
    } catch (error) {
        console.error('sendProjectChatMessage error:', error)
        res.status(500).json({ message: 'Server error' })
    }
}


module.exports = {
    createProject,
    getProjects,
    getProjectById,
    updateProject,
    deleteProject,
    getUsers,
    addTeamMember,
    removeTeamMember,
    setProjectTeam,
    getProjectChat,
    sendProjectChatMessage,
}
