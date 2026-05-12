const mongoose = require('mongoose')

const projectModel = require('../models/project.model')
const taskModel = require('../models/task.model')
const userModel = require('../models/user.model')

function escapeRegex(value = '') {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

async function getVisibleProjectIdsForUser(user) {
    if (user.role === 'ADMIN') {
        const adminProjects = await projectModel.find({}, '_id').lean()
        return adminProjects.map(project => project._id)
    }

    if (user.role === 'PROJECT_MANAGER') {
        const pmProjects = await projectModel.find({ created_by: user.id }, '_id').lean()
        return pmProjects.map(project => project._id)
    }

    const memberProjects = await projectModel.find({
        $or: [
            { team_members: user.id },
            { project_manager: user.id },
        ],
    }, '_id').lean()

    return memberProjects.map(project => project._id)
}

function normalizeType(type = 'all') {
    return ['all', 'projects', 'tasks', 'users'].includes(type) ? type : 'all'
}

async function globalSearch(req, res) {
    try {
        const q = String(req.query.q || '').trim()
        const type = normalizeType(String(req.query.type || 'all').trim().toLowerCase())
        const status = String(req.query.status || '').trim().toUpperCase()

        if (!q) {
            return res.status(200).json({
                query: '',
                type,
                status: '',
                counts: { projects: 0, tasks: 0, users: 0, total: 0 },
                results: { projects: [], tasks: [], users: [] },
            })
        }

        const regex = new RegExp(escapeRegex(q), 'i')
        const visibleProjectIds = await getVisibleProjectIdsForUser(req.user)
        const visibleProjectObjectIds = visibleProjectIds.map(id => new mongoose.Types.ObjectId(id))

        const results = {
            projects: [],
            tasks: [],
            users: [],
        }

        if (type === 'all' || type === 'projects') {
            const projectQuery = {
                _id: { $in: visibleProjectObjectIds },
                $or: [
                    { name: regex },
                    { description: regex },
                    { 'required_skills.skill_name': regex },
                ],
            }

            if (status) projectQuery.status = status

            results.projects = await projectModel
                .find(projectQuery)
                .populate('project_manager', 'username')
                .populate('team_members', 'username')
                .select('name description status required_skills project_manager team_members ai_success_score created_at')
                .sort({ updated_at: -1, created_at: -1 })
                .limit(12)
        }

        if (type === 'all' || type === 'tasks') {
            const taskQuery = {
                project_id: { $in: visibleProjectObjectIds },
                $or: [
                    { title: regex },
                    { description: regex },
                ],
            }

            if (status) taskQuery.status = status

            results.tasks = await taskModel
                .find(taskQuery)
                .populate('project_id', 'name')
                .populate('assigned_to', 'username')
                .select('title description status priority due_date assigned_to project_id created_at')
                .sort({ updated_at: -1, created_at: -1 })
                .limit(12)
        }

        if (type === 'all' || type === 'users') {
            const baseUserQuery = {
                $or: [
                    { username: regex },
                    { email: regex },
                    { bio: regex },
                    { 'skills.skill_name': regex },
                ],
            }

            if (req.user.role === 'ADMIN') {
                results.users = await userModel
                    .find(baseUserQuery)
                    .select('username email role bio skills current_capacity_percentage profile_picture_url')
                    .sort({ username: 1 })
                    .limit(12)
            } else {
                const visibleProjects = await projectModel.find(
                    { _id: { $in: visibleProjectObjectIds } },
                    'project_manager team_members'
                ).lean()

                const visibleUserIds = new Set([String(req.user.id)])
                for (const project of visibleProjects) {
                    if (project.project_manager) visibleUserIds.add(String(project.project_manager))
                    for (const memberId of project.team_members || []) {
                        visibleUserIds.add(String(memberId))
                    }
                }

                results.users = await userModel
                    .find({
                        _id: { $in: Array.from(visibleUserIds).map(id => new mongoose.Types.ObjectId(id)) },
                        ...baseUserQuery,
                    })
                    .select('username email role bio skills current_capacity_percentage profile_picture_url')
                    .sort({ username: 1 })
                    .limit(12)
            }
        }

        const counts = {
            projects: results.projects.length,
            tasks: results.tasks.length,
            users: results.users.length,
        }
        counts.total = counts.projects + counts.tasks + counts.users

        res.status(200).json({
            query: q,
            type,
            status,
            counts,
            results,
        })
    } catch (error) {
        console.error('globalSearch error:', error)
        res.status(500).json({ message: 'Failed to search workspace content.' })
    }
}

module.exports = {
    globalSearch,
}
