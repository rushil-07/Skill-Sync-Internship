const projectModel = require('../models/project.model')
const taskModel    = require('../models/task.model')
const { refreshProjectAnalytics } = require('../services/ai.service')

// ─── GET /api/milestones/project/:projectId ───────────────────────────────────
// Get all milestones for a project — any authenticated user
async function getMilestones(req, res) {
    try {
        const project = await projectModel
            .findById(req.params.projectId)
            .select('name milestones start_date end_date status')
            .populate('milestones.linked_tasks', 'title status')

        if (!project) {
            return res.status(404).json({ message: 'Project not found' })
        }

        // Sort milestones by due_date ascending
        const sorted = [...project.milestones].sort(
            (a, b) => new Date(a.due_date) - new Date(b.due_date)
        )

        res.status(200).json({
            project: {
                _id:        project._id,
                name:       project.name,
                start_date: project.start_date,
                end_date:   project.end_date,
                status:     project.status,
            },
            milestones: sorted,
        })
    } catch (error) {
        console.error('getMilestones error:', error)
        res.status(500).json({ message: 'Server error' })
    }
}


// ─── POST /api/milestones/project/:projectId ──────────────────────────────────
// Create a milestone — PM only
// Body: { title, description, due_date, linked_tasks[] }
async function createMilestone(req, res) {
    try {
        const { title, description, due_date, linked_tasks } = req.body

        if (!title || !due_date) {
            return res.status(400).json({ message: 'title and due_date are required' })
        }

        const project = await projectModel.findById(req.params.projectId)
        if (!project) {
            return res.status(404).json({ message: 'Project not found' })
        }

        const milestone = {
            title: title.trim(),
            due_date: new Date(due_date),
        }
        if (description)           milestone.description   = description.trim()
        if (linked_tasks?.length)  milestone.linked_tasks  = linked_tasks

        project.milestones.push(milestone)
        await project.save()
        await refreshProjectAnalytics(project._id)

        const newMilestone = project.milestones[project.milestones.length - 1]

        res.status(201).json({
            message:   'Milestone created successfully',
            milestone: newMilestone,
        })
    } catch (error) {
        console.error('createMilestone error:', error)
        res.status(500).json({ message: 'Server error' })
    }
}


// ─── PUT /api/milestones/project/:projectId/:milestoneId ──────────────────────
// Update milestone — PM only
// Body: any of { title, description, due_date, linked_tasks }
async function updateMilestone(req, res) {
    try {
        const project = await projectModel.findById(req.params.projectId)
        if (!project) return res.status(404).json({ message: 'Project not found' })

        const milestone = project.milestones.id(req.params.milestoneId)
        if (!milestone) return res.status(404).json({ message: 'Milestone not found' })

        const { title, description, due_date, linked_tasks } = req.body

        if (title)          milestone.title         = title.trim()
        if (description !== undefined) milestone.description = description?.trim() || ''
        if (due_date)       milestone.due_date      = new Date(due_date)
        if (linked_tasks)   milestone.linked_tasks  = linked_tasks

        await project.save()
        await refreshProjectAnalytics(project._id)

        res.status(200).json({
            message:   'Milestone updated successfully',
            milestone,
        })
    } catch (error) {
        console.error('updateMilestone error:', error)
        res.status(500).json({ message: 'Server error' })
    }
}


// ─── DELETE /api/milestones/project/:projectId/:milestoneId ──────────────────
// Delete milestone — PM only
async function deleteMilestone(req, res) {
    try {
        const project = await projectModel.findById(req.params.projectId)
        if (!project) return res.status(404).json({ message: 'Project not found' })

        const milestone = project.milestones.id(req.params.milestoneId)
        if (!milestone) return res.status(404).json({ message: 'Milestone not found' })

        const title = milestone.title
        milestone.deleteOne()
        await project.save()
        await refreshProjectAnalytics(project._id)

        res.status(200).json({ message: `Milestone "${title}" deleted` })
    } catch (error) {
        console.error('deleteMilestone error:', error)
        res.status(500).json({ message: 'Server error' })
    }
}


// ─── PUT /api/milestones/project/:projectId/:milestoneId/complete ─────────────
// Mark a milestone as COMPLETED — PM only
async function completeMilestone(req, res) {
    try {
        const project = await projectModel.findById(req.params.projectId)
        if (!project) return res.status(404).json({ message: 'Project not found' })

        const milestone = project.milestones.id(req.params.milestoneId)
        if (!milestone) return res.status(404).json({ message: 'Milestone not found' })

        milestone.status       = 'COMPLETED'
        milestone.completed_at = new Date()
        await project.save()
        await refreshProjectAnalytics(project._id)

        res.status(200).json({
            message:   `Milestone "${milestone.title}" marked as completed`,
            milestone,
        })
    } catch (error) {
        console.error('completeMilestone error:', error)
        res.status(500).json({ message: 'Server error' })
    }
}


// ─── PUT /api/milestones/project/:projectId/:milestoneId/reopen ───────────────
// Reopen a completed/missed milestone back to PENDING — PM only
async function reopenMilestone(req, res) {
    try {
        const project = await projectModel.findById(req.params.projectId)
        if (!project) return res.status(404).json({ message: 'Project not found' })

        const milestone = project.milestones.id(req.params.milestoneId)
        if (!milestone) return res.status(404).json({ message: 'Milestone not found' })

        milestone.status       = 'PENDING'
        milestone.completed_at = null
        await project.save()
        await refreshProjectAnalytics(project._id)

        res.status(200).json({
            message:   `Milestone "${milestone.title}" reopened`,
            milestone,
        })
    } catch (error) {
        console.error('reopenMilestone error:', error)
        res.status(500).json({ message: 'Server error' })
    }
}


// ─── GET /api/milestones/upcoming ────────────────────────────────────────────
// Get upcoming milestones across ALL of the PM's projects — for PM dashboard
async function getUpcomingMilestones(req, res) {
    try {
        const now           = new Date()
        const thirtyDaysOut = new Date()
        thirtyDaysOut.setDate(thirtyDaysOut.getDate() + 30)

        const projects = await projectModel
            .find({ created_by: req.user.id })
            .select('name milestones')

        const upcoming = []

        for (const project of projects) {
            for (const m of project.milestones) {
                if (
                    m.status === 'PENDING' &&
                    new Date(m.due_date) <= thirtyDaysOut
                ) {
                    upcoming.push({
                        ...m.toObject(),
                        project_id:   project._id,
                        project_name: project.name,
                        days_left: Math.ceil((new Date(m.due_date) - now) / 86400000),
                    })
                }
            }
        }

        // Sort by due_date ascending
        upcoming.sort((a, b) => new Date(a.due_date) - new Date(b.due_date))

        res.status(200).json({ milestones: upcoming })
    } catch (error) {
        console.error('getUpcomingMilestones error:', error)
        res.status(500).json({ message: 'Server error' })
    }
}


module.exports = {
    getMilestones,
    createMilestone,
    updateMilestone,
    deleteMilestone,
    completeMilestone,
    reopenMilestone,
    getUpcomingMilestones,
}
