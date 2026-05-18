const projectModel = require('../models/project.model')
const taskModel    = require('../models/task.model')
const userModel    = require('../models/user.model')
const aiService    = require('../services/ai.service')

function buildPMAlertKey(alert) {
    if (alert.type === 'OVERLOAD' && alert.user?._id) {
        return `OVERLOAD:user:${alert.user._id}`
    }
    if (alert.type === 'RISK' && alert.project?._id) {
        return `RISK:project:${alert.project._id}`
    }
    if (alert.type === 'WARNING' && alert.project?._id) {
        return `WARNING:project:${alert.project._id}:no-tasks`
    }
    if (alert.type === 'DEADLINE') {
        return 'DEADLINE:overdue-tasks'
    }
    return `${alert.type}:${alert.project?._id || alert.user?._id || alert.message}`
}

function enrichPMAlert(alert) {
    const enriched = {
        ...alert,
        alert_key: buildPMAlertKey(alert),
        action_label: 'Take Action',
        action_link: '/pm/projects',
        secondary_label: null,
        secondary_link: null,
    }

    if (alert.type === 'OVERLOAD') {
        enriched.action_label = 'Review Team'
        return enriched
    }

    if (alert.type === 'DEADLINE') {
        enriched.action_label = 'Review Tasks'
        return enriched
    }

    if (alert.project?._id) {
        enriched.action_label = 'Review Project'
        enriched.action_link = `/pm/projects/${alert.project._id}`
        enriched.secondary_label = 'View Tasks'
        enriched.secondary_link = `/pm/projects/${alert.project._id}/tasks`
    }

    return enriched
}

// --- GET /api/pm/dashboard ----------------------------------------------------
// Returns everything the PM dashboard needs in one request
async function getPMDashboard(req, res) {
    try {
        const pmId = req.user.id
        const pmUser = await userModel.findById(pmId).select('username pm_alert_responses')

        // -- 1. Projects created by this PM -----------------------------------
        const projects = await projectModel
            .find({ created_by: pmId })
            .select('name description status start_date end_date ai_success_score team_members created_at')
            .populate('team_members', 'username profile_picture_url current_capacity_percentage availability_hours_per_week')
            .sort({ created_at: -1 })
            .lean()

        if (!projects.length) {
            return res.status(200).json({
                pm_username: pmUser?.username || req.user.username || 'PM',
                stats: {
                    total_projects: 0,
                    active_projects: 0,
                    total_tasks: 0,
                    done_tasks: 0,
                    overdue_tasks: 0,
                    team_size: 0,
                },
                projects: [],
                upcoming_deadlines: [],
                alerts: [],
                team_capacity: [],
                task_status_chart: {
                    TODO: 0,
                    IN_PROGRESS: 0,
                    IN_REVIEW: 0,
                    DONE: 0,
                },
            })
        }

        const projectIds = projects.map(p => p._id)

        // -- 2. All tasks across PM's projects ---------------------------------
        const allTasks = await taskModel
            .find({ project_id: { $in: projectIds } })
            .populate('assigned_to', 'username profile_picture_url')
            .select('title status priority due_date project_id assigned_to created_at')
            .lean()

        // -- 3. Task counts per project ----------------------------------------
        const tasksByProject = {}
        for (const task of allTasks) {
            const pid = task.project_id.toString()
            if (!tasksByProject[pid]) {
                tasksByProject[pid] = { TODO: 0, IN_PROGRESS: 0, IN_REVIEW: 0, DONE: 0, total: 0 }
            }
            tasksByProject[pid][task.status] = (tasksByProject[pid][task.status] || 0) + 1
            tasksByProject[pid].total++
        }

        // -- 4. Build project summaries with progress % ------------------------
        const projectSummaries = projects.map(p => {
            const pid   = p._id.toString()
            const tData = tasksByProject[pid] || { TODO: 0, IN_PROGRESS: 0, IN_REVIEW: 0, DONE: 0, total: 0 }
            const progress = tData.total > 0
                ? Math.round((tData.DONE / tData.total) * 100)
                : 0

            // Days until deadline
            const daysLeft = p.end_date
                ? Math.ceil((new Date(p.end_date) - new Date()) / (1000 * 60 * 60 * 24))
                : null

            return {
                _id:             p._id,
                name:            p.name,
                description:     p.description,
                status:          p.status,
                start_date:      p.start_date,
                end_date:        p.end_date,
                ai_success_score: p.ai_success_score,
                team_members:    p.team_members,
                tasks:           tData,
                progress,
                days_left:       daysLeft,
            }
        })

        // -- 5. Stat cards -----------------------------------------------------
        const stats = {
            total_projects:  projects.length,
            active_projects: projects.filter(p => p.status === 'ACTIVE').length,
            total_tasks:     allTasks.length,
            done_tasks:      allTasks.filter(t => t.status === 'DONE').length,
            overdue_tasks:   allTasks.filter(t =>
                t.due_date && new Date(t.due_date) < new Date() && t.status !== 'DONE'
            ).length,
            team_size: [...new Set(
                projects.flatMap(p => p.team_members.map(m => m._id.toString()))
            )].length,
        }

        // -- 6. Upcoming deadlines (tasks due in next 7 days, not done) --------
        const sevenDaysFromNow = new Date()
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)

        const upcomingDeadlines = allTasks
            .filter(t => t.due_date && t.status !== 'DONE' && new Date(t.due_date) <= sevenDaysFromNow)
            .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
            .slice(0, 8)
            .map(t => ({
                _id:        t._id,
                title:      t.title,
                status:     t.status,
                priority:   t.priority,
                due_date:   t.due_date,
                days_left:  Math.ceil((new Date(t.due_date) - new Date()) / (1000 * 60 * 60 * 24)),
                project_id: t.project_id,
                assigned_to: t.assigned_to,
            }))

        // -- 7. AI Alerts ------------------------------------------------------
        // Generate real alerts based on actual data
        const alerts = []

        // Alert: overloaded team members (capacity >= 85%)
        const allMembers = {}
        for (const p of projects) {
            for (const m of p.team_members) {
                if (!allMembers[m._id.toString()]) allMembers[m._id.toString()] = m
            }
        }
        for (const member of Object.values(allMembers)) {
            if ((member.current_capacity_percentage || 0) >= 85) {
                alerts.push({
                    type:    'OVERLOAD',
                    message: `${member.username} is at ${member.current_capacity_percentage}% capacity`,
                    hint:    'Consider reassigning some tasks to balance workload',
                    user:    { _id: member._id, username: member.username },
                })
            }
        }

        // Alert: projects with low AI success score (< 60)
        for (const p of projects) {
            if (p.ai_success_score !== null && p.ai_success_score < 60) {
                alerts.push({
                    type:    'RISK',
                    message: `"${p.name}" has a low AI success score of ${p.ai_success_score}%`,
                    hint:    'Review team composition or adjust timeline',
                    project: { _id: p._id, name: p.name },
                })
            }
        }

        // Alert: tasks overdue
        const overdueCount = stats.overdue_tasks
        if (overdueCount > 0) {
            alerts.push({
                type:    'DEADLINE',
                message: `${overdueCount} task${overdueCount > 1 ? 's are' : ' is'} overdue across your projects`,
                hint:    'Review and reassign or update due dates',
            })
        }

        // Alert: projects active but no tasks
        for (const p of projects) {
            const tData = tasksByProject[p._id.toString()]
            if (p.status === 'ACTIVE' && (!tData || tData.total === 0)) {
                alerts.push({
                    type:    'WARNING',
                    message: `"${p.name}" is ACTIVE but has no tasks`,
                    hint:    'Add tasks to start tracking progress',
                    project: { _id: p._id, name: p.name },
                })
            }
        }

        // -- 8. Team capacity overview ------------------------------------------
        let visibleAlerts = alerts.map(enrichPMAlert)
        const currentAlertKeys = new Set(visibleAlerts.map(alert => alert.alert_key))
        const storedResponses = pmUser?.pm_alert_responses || []

        if (pmUser) {
            const activeResponses = storedResponses.filter(response => currentAlertKeys.has(response.alert_key))

            if (activeResponses.length !== storedResponses.length) {
                pmUser.pm_alert_responses = activeResponses
                await pmUser.save()
            }

            const hiddenKeys = new Set(activeResponses.map(response => response.alert_key))
            visibleAlerts = visibleAlerts.filter(alert => !hiddenKeys.has(alert.alert_key))
        }

        const teamCapacity = Object.values(allMembers).map(m => ({
            _id:                        m._id,
            username:                   m.username,
            profile_picture_url:        m.profile_picture_url,
            current_capacity_percentage: m.current_capacity_percentage || 0,
            availability_hours_per_week: m.availability_hours_per_week || 40,
        })).sort((a, b) => b.current_capacity_percentage - a.current_capacity_percentage)

        // -- 9. Tasks by status (for chart) ------------------------------------
        const taskStatusChart = {
            TODO:        allTasks.filter(t => t.status === 'TODO').length,
            IN_PROGRESS: allTasks.filter(t => t.status === 'IN_PROGRESS').length,
            IN_REVIEW:   allTasks.filter(t => t.status === 'IN_REVIEW').length,
            DONE:        allTasks.filter(t => t.status === 'DONE').length,
        }

        res.status(200).json({
            pm_username: pmUser?.username || req.user.username || 'PM',
            stats,
            projects:          projectSummaries,
            upcoming_deadlines: upcomingDeadlines,
            alerts: visibleAlerts,
            team_capacity:     teamCapacity,
            task_status_chart: taskStatusChart,
        })

    } catch (error) {
        console.error('getPMDashboard error:', error)
        res.status(500).json({ message: 'Server error loading dashboard' })
    }
}

// --- GET /api/pm/project/:projectId/dashboard ---------------------------------
// Per-project dashboard - SRS 4.7 Project Dashboard:
// Project Progress, Tasks by Status, Team Workload, AI Score, Milestones, Risk Alerts, Recent Activity
async function getProjectDashboard(req, res) {
    try {
        const { projectId } = req.params

        // -- Fetch project + tasks in parallel ---------------------------------
        const [project, tasks] = await Promise.all([
            projectModel
                .findById(projectId)
                .populate('team_members', 'username profile_picture_url current_capacity_percentage availability_hours_per_week skills')
                .populate('created_by', 'username')
                .populate('milestones.linked_tasks', 'title status'),
            taskModel
                .find({ project_id: projectId })
                .populate('assigned_to', 'username profile_picture_url')
                .populate('comments.author', 'username')
                .sort({ updated_at: -1 }),
        ])

        if (!project) return res.status(404).json({ message: 'Project not found' })

        // -- 1. Project Progress -----------------------------------------------
        const total    = tasks.length
        const done     = tasks.filter(t => t.status === 'DONE').length
        const progress = total > 0 ? Math.round((done / total) * 100) : 0

        // Timeline progress
        const now      = new Date()
        const start    = project.start_date ? new Date(project.start_date) : null
        const end      = project.end_date   ? new Date(project.end_date)   : null
        const daysLeft = end ? Math.ceil((end - now) / 86400000) : null
        const duration = start && end ? Math.ceil((end - start) / 86400000) : null
        const timelinePct = duration && daysLeft !== null
            ? Math.min(100, Math.max(0, Math.round(((duration - daysLeft) / duration) * 100)))
            : null

        // -- 2. Tasks by Status ------------------------------------------------
        const tasksByStatus = {
            TODO:        tasks.filter(t => t.status === 'TODO').length,
            IN_PROGRESS: tasks.filter(t => t.status === 'IN_PROGRESS').length,
            IN_REVIEW:   tasks.filter(t => t.status === 'IN_REVIEW').length,
            DONE:        done,
        }

        // Tasks by priority
        const tasksByPriority = {
            URGENT: tasks.filter(t => t.priority === 'URGENT').length,
            HIGH:   tasks.filter(t => t.priority === 'HIGH').length,
            MEDIUM: tasks.filter(t => t.priority === 'MEDIUM').length,
            LOW:    tasks.filter(t => t.priority === 'LOW').length,
        }

        // Overdue tasks
        const overdue = tasks.filter(t =>
            t.due_date && new Date(t.due_date) < now && t.status !== 'DONE'
        )

        // -- 3. Team Workload Distribution -------------------------------------
        const tasksByMember = {}
        for (const task of tasks) {
            if (!task.assigned_to) continue
            const uid = task.assigned_to._id.toString()
            if (!tasksByMember[uid]) {
                tasksByMember[uid] = {
                    user:          task.assigned_to,
                    total:         0,
                    done:          0,
                    in_progress:   0,
                    overdue:       0,
                    total_minutes: 0,
                }
            }
            tasksByMember[uid].total++
            if (task.status === 'DONE')        tasksByMember[uid].done++
            if (task.status === 'IN_PROGRESS') tasksByMember[uid].in_progress++
            if (task.due_date && new Date(task.due_date) < now && task.status !== 'DONE') {
                tasksByMember[uid].overdue++
            }
            tasksByMember[uid].total_minutes += task.total_time_minutes || 0
        }

        // Add capacity from team_members (even those with no tasks)
        const teamWorkload = project.team_members.map(m => {
            const uid  = m._id.toString()
            const data = tasksByMember[uid] || { total: 0, done: 0, in_progress: 0, overdue: 0, total_minutes: 0 }
            return {
                _id:                        m._id,
                username:                   m.username,
                profile_picture_url:        m.profile_picture_url,
                current_capacity_percentage: m.current_capacity_percentage || 0,
                availability_hours_per_week: m.availability_hours_per_week || 40,
                ...data,
                user: undefined,   // avoid duplication
            }
        }).sort((a, b) => b.total - a.total)

        // -- 4. Upcoming Milestones ---------------------------------------------
        const thirtyDays = new Date()
        thirtyDays.setDate(thirtyDays.getDate() + 30)

        const upcomingMilestones = [...project.milestones]
            .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
            .filter(m => m.status !== 'COMPLETED')
            .slice(0, 5)
            .map(m => ({
                ...m.toObject(),
                days_left: Math.ceil((new Date(m.due_date) - now) / 86400000),
            }))

        const completedMilestones = project.milestones.filter(m => m.status === 'COMPLETED').length
        const milestoneProgress   = project.milestones.length > 0
            ? Math.round((completedMilestones / project.milestones.length) * 100)
            : 0

        // -- 5. Risk Alerts -----------------------------------------------------
        const alerts = []

        // Overdue tasks
        if (overdue.length > 0) {
            alerts.push({
                type:    'DEADLINE',
                message: `${overdue.length} task${overdue.length > 1 ? 's are' : ' is'} overdue`,
                hint:    'Review and update due dates or reassign tasks',
                severity: 'HIGH',
            })
        }

        // Low AI success score
        if (project.ai_success_score !== null && project.ai_success_score !== undefined && project.ai_success_score < 60) {
            alerts.push({
                type:    'RISK',
                message: `AI success score is ${project.ai_success_score}% - below healthy threshold`,
                hint:    'Consider adjusting team composition or extending the timeline',
                severity: 'HIGH',
            })
        }

        // Overloaded team members (capacity >= 85%)
        for (const m of project.team_members) {
            if ((m.current_capacity_percentage || 0) >= 85) {
                alerts.push({
                    type:    'OVERLOAD',
                    message: `${m.username} is at ${m.current_capacity_percentage}% capacity`,
                    hint:    'Consider redistributing their tasks to other team members',
                    severity: 'MEDIUM',
                    user:    { _id: m._id, username: m.username },
                })
            }
        }

        // Project is ACTIVE but progress is stalled (< 10% done with > 50% timeline elapsed)
        if (project.status === 'ACTIVE' && timelinePct > 50 && progress < 10) {
            alerts.push({
                type:    'STALLED',
                message: `Project is ${Math.round(timelinePct)}% through timeline but only ${progress}% complete`,
                hint:    'Tasks may be blocked - review and unblock in-progress items',
                severity: 'HIGH',
            })
        }

        // Milestone overdue
        const overdueMilestones = project.milestones.filter(
            m => m.status === 'PENDING' && new Date(m.due_date) < now
        )
        if (overdueMilestones.length > 0) {
            alerts.push({
                type:    'MILESTONE',
                message: `${overdueMilestones.length} milestone${overdueMilestones.length > 1 ? 's are' : ' is'} past due date`,
                hint:    'Mark completed or reschedule overdue milestones',
                severity: 'MEDIUM',
            })
        }

        // No team members assigned
        if (project.team_members.length === 0) {
            alerts.push({
                type:    'WARNING',
                message: 'No team members assigned to this project',
                hint:    'Add team members to start tracking workload',
                severity: 'LOW',
            })
        }

        // -- 6. Recent Activity (from task history + comments) -----------------
        const activity = []

        for (const task of tasks.slice(0, 20)) {
            // Task history entries
            for (const h of (task.history || []).slice(0, 3)) {
                activity.push({
                    type:       'TASK_HISTORY',
                    task_id:    task._id,
                    task_title: task.title,
                    field:      h.field,
                    old_value:  h.old_value,
                    new_value:  h.new_value,
                    created_at: h.changed_at || task.updated_at,
                })
            }
            // Recent comments
            for (const c of (task.comments || []).slice(-2)) {
                activity.push({
                    type:       'COMMENT',
                    task_id:    task._id,
                    task_title: task.title,
                    author:     c.author,
                    content:    c.content?.slice(0, 80),
                    created_at: c.created_at,
                })
            }
        }

        activity.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

        // -- 7. Time tracking summary -------------------------------------------
        const totalMinutesLogged = tasks.reduce((sum, t) => sum + (t.total_time_minutes || 0), 0)

        res.status(200).json({
            project: {
                _id:             project._id,
                name:            project.name,
                description:     project.description,
                status:          project.status,
                start_date:      project.start_date,
                end_date:        project.end_date,
                ai_success_score:project.ai_success_score,
                created_by:      project.created_by,
                team_size:       project.team_members.length,
            },
            progress: {
                task_completion: progress,
                milestone_completion: milestoneProgress,
                timeline_pct:    timelinePct,
                days_left:       daysLeft,
            },
            tasks: {
                total,
                by_status:   tasksByStatus,
                by_priority: tasksByPriority,
                overdue:     overdue.length,
            },
            team_workload:       teamWorkload,
            upcoming_milestones: upcomingMilestones,
            milestone_summary: {
                total:     project.milestones.length,
                completed: completedMilestones,
                progress:  milestoneProgress,
            },
            alerts,
            recent_activity:   activity.slice(0, 15),
            total_time_logged: totalMinutesLogged,
        })

    } catch (error) {
        console.error('getProjectDashboard error:', error)
        res.status(500).json({ message: 'Server error' })
    }
}

async function respondToPMAlert(req, res) {
    try {
        const pmId = req.user.id
        const { alert_key, action, alert_type, message, project_id = null, member_id = null } = req.body

        if (!alert_key || !alert_type || !message) {
            return res.status(400).json({ message: 'alert_key, alert_type, and message are required' })
        }

        if (!['DISMISSED', 'ACTION_TAKEN'].includes(action)) {
            return res.status(400).json({ message: 'Invalid alert action' })
        }

        const pmUser = await userModel.findById(pmId)
        if (!pmUser) return res.status(404).json({ message: 'User not found' })

        const existing = pmUser.pm_alert_responses.find(response => response.alert_key === alert_key)
        const payload = {
            alert_key,
            action,
            alert_type,
            message,
            project_id,
            member_id,
            responded_at: new Date(),
        }

        if (existing) {
            existing.action = payload.action
            existing.alert_type = payload.alert_type
            existing.message = payload.message
            existing.project_id = payload.project_id
            existing.member_id = payload.member_id
            existing.responded_at = payload.responded_at
        } else {
            pmUser.pm_alert_responses.unshift(payload)
        }

        if (pmUser.pm_alert_responses.length > 100) {
            pmUser.pm_alert_responses = pmUser.pm_alert_responses.slice(0, 100)
        }

        pmUser.logActivity(
            action === 'DISMISSED' ? 'Dismissed PM alert' : 'Took action on PM alert',
            message,
            'SYSTEM',
            project_id || member_id || null
        )

        await pmUser.save()

        res.status(200).json({
            message: action === 'DISMISSED' ? 'Alert dismissed' : 'Alert action recorded',
        })
    } catch (error) {
        console.error('respondToPMAlert error:', error)
        res.status(500).json({ message: 'Server error' })
    }
}

async function getRedistributionSuggestions(req, res) {
    try {
        const result = await aiService.suggestTaskRedistributionForPM(
            req.user.id,
            req.query.userId
        )

        res.status(200).json(result)
    } catch (error) {
        console.error('getRedistributionSuggestions error:', error)
        res.status(error.statusCode || 500).json({
            message: error.message || 'Server error',
        })
    }
}

module.exports = { getPMDashboard, getProjectDashboard, respondToPMAlert, getRedistributionSuggestions }
