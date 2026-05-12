const taskModel    = require('../models/task.model')
const projectModel = require('../models/project.model')
const userModel    = require('../models/user.model')
const notificationModel = require('../models/notification.model')
const notifService = require('../services/notification.service')

// ─── GET /api/member/dashboard ────────────────────────────────────────────────
// Returns everything the Member dashboard needs in one request
// SRS 4.7 Personal Dashboard:
//   My Tasks, Available Projects (skill-matched), Current Workload,
//   Skill Development Recommendations, Recent Activity, Upcoming Deadlines
async function getMemberDashboard(req, res) {
    try {
        const memberId = req.user.id

        // ── Fetch all needed data in parallel ─────────────────────────────────
        const [user, myTasks, memberProjects] = await Promise.all([
            userModel.findById(memberId).select('-password'),
            taskModel.find({ assigned_to: memberId })
                .populate('project_id', 'name status _id')
                .sort({ due_date: 1 }),
            projectModel.find({ team_members: memberId })
                .select('name status')
                .sort({ updated_at: -1 }),
        ])

        if (!user) return res.status(404).json({ message: 'User not found' })

        // ── 1. My Tasks — grouped by status ───────────────────────────────────
        const tasksByStatus = {
            TODO:        myTasks.filter(t => t.status === 'TODO'),
            IN_PROGRESS: myTasks.filter(t => t.status === 'IN_PROGRESS'),
            IN_REVIEW:   myTasks.filter(t => t.status === 'IN_REVIEW'),
            DONE:        myTasks.filter(t => t.status === 'DONE'),
        }

        const taskStats = {
            total:       myTasks.length,
            todo:        tasksByStatus.TODO.length,
            in_progress: tasksByStatus.IN_PROGRESS.length,
            in_review:   tasksByStatus.IN_REVIEW.length,
            done:        tasksByStatus.DONE.length,
            overdue:     myTasks.filter(t =>
                t.due_date && new Date(t.due_date) < new Date() && t.status !== 'DONE'
            ).length,
        }

        // ── 2. Upcoming Deadlines — tasks due in next 7 days ──────────────────
        const sevenDays = new Date()
        sevenDays.setDate(sevenDays.getDate() + 7)

        const upcomingDeadlines = myTasks
            .filter(t => t.due_date && t.status !== 'DONE' && new Date(t.due_date) <= sevenDays)
            .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
            .slice(0, 6)
            .map(t => ({
                _id:        t._id,
                title:      t.title,
                status:     t.status,
                priority:   t.priority,
                due_date:   t.due_date,
                days_left:  Math.ceil((new Date(t.due_date) - new Date()) / 86400000),
                project:    t.project_id,
            }))

        // ── 3. Skill-matched Available Projects ───────────────────────────────
        // SRS 4.4.2 — find projects whose required_skills overlap with user's skills
        const userSkillIds = user.skills.map(s => s.skill_id?.toString()).filter(Boolean)
        const userSkillNames = user.skills.map(s => s.skill_name?.toLowerCase()).filter(Boolean)

        // Get projects that are PLANNING or ACTIVE and not already joined
        const availableProjects = await projectModel
            .find({
                status: { $in: ['PLANNING', 'ACTIVE'] },
                team_members: { $ne: memberId },  // not already a member
            })
            .select('name description status required_skills ai_success_score team_members interested_members start_date end_date project_manager created_by')
            .limit(20)

        // Calculate match score for each project
        const matchedProjects = availableProjects
            .map(p => {
                const required = p.required_skills || []
                if (required.length === 0) {
                    return {
                        project: p,
                        match_score: 0,
                        matched_skills: [],
                        total_required: 0,
                        interest_expressed: (p.interested_members || []).some(i => i.user_id?.toString() === memberId.toString()),
                    }
                }

                // Count how many required skills the user has at required level or above
                const RANK = { BEGINNER: 1, INTERMEDIATE: 2, ADVANCED: 3, EXPERT: 4 }
                let matched = 0
                const matchedSkills = []

                for (const req of required) {
                    const userSkill = user.skills.find(s =>
                        s.skill_id?.toString() === req.skill_id?.toString() ||
                        s.skill_name?.toLowerCase() === req.skill_name?.toLowerCase()
                    )
                    if (userSkill) {
                        const userRank = RANK[userSkill.proficiency_level] || 0
                        const reqRank  = RANK[req.required_proficiency]    || 0
                        if (userRank >= reqRank) {
                            matched++
                            matchedSkills.push(req.skill_name)
                        }
                    }
                }

                const score = Math.round((matched / required.length) * 100)
                return {
                    project:        p,
                    match_score:    score,
                    matched_skills: matchedSkills,
                    total_required: required.length,
                    interest_expressed: (p.interested_members || []).some(i => i.user_id?.toString() === memberId.toString()),
                }
            })
            .filter(p => p.match_score > 0)          // only show projects with any match
            .sort((a, b) => b.match_score - a.match_score)
            .slice(0, 5)

        const highMatchProjects = matchedProjects.filter(p => p.match_score >= 80)
        if (highMatchProjects.length) {
            const existingLinks = new Set(
                (await notificationModel.find({
                    user_id: memberId,
                    type: 'PROJECT_MATCH',
                    link: { $in: highMatchProjects.map(p => `/pm/projects/${p.project._id}`) },
                }).select('link')).map(n => n.link)
            )

            await Promise.all(
                highMatchProjects
                    .filter(p => !existingLinks.has(`/pm/projects/${p.project._id}`))
                    .map(p =>
                        notifService.create(
                            memberId,
                            'PROJECT_MATCH',
                            'High-match project available',
                            `"${p.project.name}" matches your skills at ${p.match_score}%`,
                            `/pm/projects/${p.project._id}`
                        )
                    )
            )
        }

        // ── 4. Current Workload (hours this week) ─────────────────────────────
        // Based on tasks in progress + availability hours
        const now = new Date()
        const weekStart = new Date(now)
        weekStart.setDate(now.getDate() - now.getDay())
        weekStart.setHours(0, 0, 0, 0)

        // Sum time logged this week from time entries
        let hoursLoggedThisWeek = 0
        for (const task of myTasks) {
            for (const entry of (task.time_entries || [])) {
                if (entry.start_time && new Date(entry.start_time) >= weekStart) {
                    hoursLoggedThisWeek += (entry.duration_minutes || 0) / 60
                }
            }
        }

        const workload = {
            hours_logged_this_week:   Math.round(hoursLoggedThisWeek * 10) / 10,
            hours_available_per_week: user.availability_hours_per_week || 40,
            capacity_percentage:      user.current_capacity_percentage || 0,
            active_tasks:             tasksByStatus.IN_PROGRESS.length + tasksByStatus.IN_REVIEW.length,
        }

        // ── 5. Skill Development Recommendations (from profile) ───────────────
        const recommendations = (user.learning_recommendations || [])
            .sort((a, b) => {
                const statusOrder = { NOT_STARTED: 0, IN_PROGRESS: 1, COMPLETED: 2 }
                const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 }

                const statusDelta = (statusOrder[a.status] ?? 1) - (statusOrder[b.status] ?? 1)
                if (statusDelta !== 0) return statusDelta

                return (priorityOrder[a.priority] ?? 1) - (priorityOrder[b.priority] ?? 1)
            })
            .slice(0, 5)

        // ── 6. Recent Activity ────────────────────────────────────────────────
        const recentActivity = (user.activity_feed || []).slice(0, 10)

        // ── 7. Performance Metrics ────────────────────────────────────────────
        const metrics = user.performance_metrics || {}

        // ── 8. My Projects (unique projects from tasks) ───────────────────────
        const taskProgressByProject = {}
        for (const task of myTasks) {
            if (task.project_id) {
                const pid = task.project_id._id?.toString() || task.project_id.toString()
                if (!taskProgressByProject[pid]) {
                    taskProgressByProject[pid] = { total: 0, done: 0 }
                }
                taskProgressByProject[pid].total++
                if (task.status === 'DONE') taskProgressByProject[pid].done++
            }
        }

        const myProjects = memberProjects.map(project => {
            const pid = project._id.toString()
            const tasks = taskProgressByProject[pid] || { total: 0, done: 0 }

            return {
                _id: project._id,
                name: project.name || 'Project',
                status: project.status,
                tasks,
                progress: tasks.total > 0 ? Math.round((tasks.done / tasks.total) * 100) : 0,
            }
        })

        res.status(200).json({
            user: {
                _id:                         user._id,
                username:                    user.username,
                email:                       user.email,
                bio:                         user.bio,
                profile_picture_url:         user.profile_picture_url,
                availability_hours_per_week: user.availability_hours_per_week,
                current_capacity_percentage: user.current_capacity_percentage,
                skills:                      user.skills,
            },
            task_stats:        taskStats,
            my_tasks:          myTasks.slice(0, 20).map(t => ({
                _id:        t._id,
                title:      t.title,
                status:     t.status,
                priority:   t.priority,
                due_date:   t.due_date,
                project:    t.project_id,
                subtasks:   { total: t.subtasks?.length || 0, done: t.subtasks?.filter(s => s.completed).length || 0 },
                total_time_minutes: t.total_time_minutes || 0,
            })),
            upcoming_deadlines: upcomingDeadlines,
            matched_projects:   matchedProjects,
            workload,
            recommendations,
            recent_activity:    recentActivity,
            metrics,
            my_projects:        myProjects,
        })

    } catch (error) {
        console.error('getMemberDashboard error:', error)
        res.status(500).json({ message: 'Server error loading dashboard' })
    }
}

async function expressInterest(req, res) {
    try {
        const memberId = req.user.id
        const { projectId } = req.params

        const project = await projectModel.findById(projectId)
        if (!project) return res.status(404).json({ message: 'Project not found' })

        const alreadyOnTeam = (project.team_members || []).some(id => id.toString() === memberId.toString())
        if (alreadyOnTeam) {
            return res.status(409).json({ message: 'You are already part of this project' })
        }

        const alreadyInterested = (project.interested_members || []).some(
            entry => entry.user_id?.toString() === memberId.toString()
        )
        if (alreadyInterested) {
            return res.status(409).json({ message: 'Interest already expressed for this project' })
        }

        project.interested_members.push({ user_id: memberId, expressed_at: new Date() })
        project.updated_at = new Date()
        await project.save()

        await userModel.findByIdAndUpdate(memberId, {
            $push: {
                activity_feed: {
                    action: 'Expressed interest in project',
                    target: project.name,
                    target_type: 'PROJECT',
                    target_id: project._id,
                    created_at: new Date(),
                }
            }
        })

        const notifyTarget = project.project_manager || project.created_by
        if (notifyTarget) {
            await notifService.create(
                notifyTarget,
                'PROJECT_INTEREST',
                'New project interest',
                `${req.user.username} expressed interest in "${project.name}"`,
                `/pm/projects/${project._id}`
            )
        }

        return res.status(200).json({
            message: 'Interest expressed successfully',
            project_id: project._id,
        })
    } catch (error) {
        console.error('expressInterest error:', error)
        res.status(500).json({ message: 'Server error' })
    }
}

module.exports = { getMemberDashboard, expressInterest }
