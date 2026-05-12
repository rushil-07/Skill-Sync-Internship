const userModel    = require('../models/user.model')
const projectModel = require('../models/project.model')
const taskModel    = require('../models/task.model')
const skillModel   = require('../models/skill.model')

// ─── GET /api/admin/stats ─────────────────────────────────────────────────────
// Returns org-wide user counts — shown on admin's own profile stats row
async function getAdminStats(req, res) {
    try {
        const [total, members, pms, admins] = await Promise.all([
            userModel.countDocuments(),
            userModel.countDocuments({ role: 'MEMBER' }),
            userModel.countDocuments({ role: 'PROJECT_MANAGER' }),
            userModel.countDocuments({ role: 'ADMIN' }),
        ])

        res.status(200).json({
            total_users:       total,
            total_members:     members,
            total_pms:         pms,
            total_admins:      admins,
        })
    } catch (error) {
        console.error('getAdminStats error:', error)
        res.status(500).json({ message: 'Server error fetching stats' })
    }
}


// ─── PUT /api/admin/users/:userId/role ────────────────────────────────────────
// Change the role of any user — Admin only
// Body: { role: 'MEMBER' | 'PROJECT_MANAGER' | 'ADMIN' }
async function changeUserRole(req, res) {
    try {
        const { role } = req.body
        const VALID_ROLES = ['MEMBER', 'PROJECT_MANAGER', 'ADMIN']

        if (!role || !VALID_ROLES.includes(role)) {
            return res.status(400).json({
                message: `role must be one of: ${VALID_ROLES.join(', ')}`
            })
        }

        // Prevent admin from demoting themselves
        if (req.params.userId === req.user.id) {
            return res.status(400).json({
                message: 'You cannot change your own role.'
            })
        }

        const user = await userModel.findByIdAndUpdate(
            req.params.userId,
            { $set: { role } },
            { new: true, runValidators: true, select: '-password' }
        )

        if (!user) {
            return res.status(404).json({ message: 'User not found' })
        }

        res.status(200).json({
            message: `Role updated to ${role}`,
            user: {
                id:       user._id,
                username: user.username,
                email:    user.email,
                role:     user.role,
            }
        })
    } catch (error) {
        console.error('changeUserRole error:', error)
        res.status(500).json({ message: 'Server error changing role' })
    }
}


// ─── PUT /api/admin/users/:userId/verify-skill/:skillId ──────────────────────
// Toggle verified flag on any user's skill — Admin only
async function verifyUserSkill(req, res) {
    try {
        const { userId, skillId } = req.params

        const user = await userModel.findById(userId)
        if (!user) return res.status(404).json({ message: 'User not found' })

        const skill = user.skills.id(skillId)
        if (!skill) return res.status(404).json({ message: 'Skill not found' })

        // Toggle
        skill.verified = !skill.verified

        user.logActivity(
            skill.verified ? 'Skill verified by Admin' : 'Skill unverified by Admin',
            skill.name,
            'SKILL',
            skill._id
        )

        await user.save()

        res.status(200).json({
            message: `Skill "${skill.name}" ${skill.verified ? 'verified' : 'unverified'}`,
            skill,
        })
    } catch (error) {
        console.error('verifyUserSkill error:', error)
        res.status(500).json({ message: 'Server error verifying skill' })
    }
}


// ─── GET /api/admin/dashboard ─────────────────────────────────────────────────
// Returns everything the Admin dashboard needs in one request
// SRS: Total Users/Projects/Tasks, Skill Matrix, Capacity, Success Rates,
//      Resource Utilization, Org-wide Skill Gap, Activity Logs


async function getAdminDashboard(req, res) {
    try {

        // ── 1. Fetch all base data in parallel ────────────────────────────────
        const [users, projects, tasks, skills] = await Promise.all([
            userModel.find().select('-password').sort({ created_at: -1 }),
            projectModel.find().populate('created_by', 'username').sort({ created_at: -1 }),
            taskModel.find().select('status priority assigned_to project_id due_date created_at'),
            skillModel.find().select('name category usage_count verified'),
        ])

        // ── 2. Stat cards ─────────────────────────────────────────────────────
        const stats = {
            total_users:    users.length,
            total_members:  users.filter(u => u.role === 'MEMBER').length,
            total_pms:      users.filter(u => u.role === 'PROJECT_MANAGER').length,
            total_admins:   users.filter(u => u.role === 'ADMIN').length,
            total_projects: projects.length,
            active_projects:projects.filter(p => p.status === 'ACTIVE').length,
            total_tasks:    tasks.length,
            done_tasks:     tasks.filter(t => t.status === 'DONE').length,
            overdue_tasks:  tasks.filter(t =>
                t.due_date && new Date(t.due_date) < new Date() && t.status !== 'DONE'
            ).length,
            total_skills:   skills.length,
        }

        // ── 3. Organizational Capacity Overview ───────────────────────────────
        // All users with their capacity %, sorted by load desc
        const capacity = users.map(u => ({
            _id:                        u._id,
            username:                   u.username,
            role:                       u.role,
            email:                      u.email,
            profile_picture_url:        u.profile_picture_url,
            current_capacity_percentage: u.current_capacity_percentage || 0,
            availability_hours_per_week: u.availability_hours_per_week || 40,
            skills_count:               u.skills?.length || 0,
        })).sort((a, b) => b.current_capacity_percentage - a.current_capacity_percentage)

        const capacity_summary = {
            overloaded: capacity.filter(u => u.current_capacity_percentage >= 85).length,
            busy:       capacity.filter(u => u.current_capacity_percentage >= 65 && u.current_capacity_percentage < 85).length,
            available:  capacity.filter(u => u.current_capacity_percentage < 65).length,
            avg_capacity: capacity.length > 0
                ? Math.round(capacity.reduce((s, u) => s + u.current_capacity_percentage, 0) / capacity.length)
                : 0,
        }

        // ── 4. Project Success Rates ──────────────────────────────────────────
        const project_stats = {
            PLANNING:  projects.filter(p => p.status === 'PLANNING').length,
            ACTIVE:    projects.filter(p => p.status === 'ACTIVE').length,
            COMPLETED: projects.filter(p => p.status === 'COMPLETED').length,
            ON_HOLD:   projects.filter(p => p.status === 'ON_HOLD').length,
        }

        const success_rate = projects.length > 0
            ? Math.round((project_stats.COMPLETED / projects.length) * 100)
            : 0

        // Average AI success score across active projects
        const scored = projects.filter(p => p.ai_success_score !== null && p.ai_success_score !== undefined)
        const avg_ai_score = scored.length > 0
            ? Math.round(scored.reduce((s, p) => s + p.ai_success_score, 0) / scored.length)
            : null

        // ── 5. Resource Utilization Metrics ──────────────────────────────────
        const task_by_status = {
            TODO:        tasks.filter(t => t.status === 'TODO').length,
            IN_PROGRESS: tasks.filter(t => t.status === 'IN_PROGRESS').length,
            IN_REVIEW:   tasks.filter(t => t.status === 'IN_REVIEW').length,
            DONE:        tasks.filter(t => t.status === 'DONE').length,
        }

        const task_completion_rate = tasks.length > 0
            ? Math.round((task_by_status.DONE / tasks.length) * 100)
            : 0

        // Tasks per user (workload distribution)
        const tasks_per_user = {}
        for (const task of tasks) {
            if (task.assigned_to) {
                const uid = task.assigned_to.toString()
                tasks_per_user[uid] = (tasks_per_user[uid] || 0) + 1
            }
        }

        const workload_dist = users
            .filter(u => u.role === 'MEMBER')
            .map(u => ({
                _id:        u._id,
                username:   u.username,
                task_count: tasks_per_user[u._id.toString()] || 0,
                capacity:   u.current_capacity_percentage || 0,
            }))
            .sort((a, b) => b.task_count - a.task_count)
            .slice(0, 10)

        // ── 6. Skill Matrix (org-wide) ────────────────────────────────────────
        // Count how many users have each skill + proficiency breakdown
        const skill_matrix = {}
        for (const user of users) {
            for (const s of (user.skills || [])) {
                const key = s.skill_name || s.name || 'Unknown'
                if (!skill_matrix[key]) {
                    skill_matrix[key] = { name: key, total: 0, BEGINNER: 0, INTERMEDIATE: 0, ADVANCED: 0, EXPERT: 0 }
                }
                skill_matrix[key].total++
                skill_matrix[key][s.proficiency_level] = (skill_matrix[key][s.proficiency_level] || 0) + 1
            }
        }

        const skill_matrix_sorted = Object.values(skill_matrix)
            .sort((a, b) => b.total - a.total)
            .slice(0, 15) // top 15 skills

        // ── 7. Org-wide Skill Gap ─────────────────────────────────────────────
        // Which skills are required most across projects but least available
        const required_skill_counts = {}
        for (const project of projects) {
            for (const rs of (project.required_skills || [])) {
                const key = rs.skill_name || 'Unknown'
                if (!required_skill_counts[key]) required_skill_counts[key] = 0
                required_skill_counts[key]++
            }
        }

        // Cross-reference with how many users have each skill
        const org_skill_gap = Object.entries(required_skill_counts)
            .map(([name, demand]) => {
                const supply = skill_matrix[name]?.total || 0
                return { name, demand, supply, gap: Math.max(0, demand - supply) }
            })
            .sort((a, b) => b.gap - a.gap)
            .slice(0, 10)

        // ── 8. User Activity Logs ─────────────────────────────────────────────
        // Latest activities across all users, flattened and sorted by date
        const activity_logs = []
        for (const user of users) {
            for (const a of (user.activity_feed || []).slice(0, 5)) {
                activity_logs.push({
                    ...a.toObject?.() || a,
                    user_id:   user._id,
                    username:  user.username,
                    user_role: user.role,
                })
            }
        }
        activity_logs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

        // ── 9. User table (for user management panel) ─────────────────────────
        const user_table = users.map(u => ({
            _id:             u._id,
            username:        u.username,
            email:           u.email,
            role:            u.role,
            skills_count:    u.skills?.length || 0,
            capacity:        u.current_capacity_percentage || 0,
            created_at:      u.created_at,
            profile_picture_url: u.profile_picture_url,
        }))

        // ── 10. Recent projects ───────────────────────────────────────────────
        const recent_projects = projects.slice(0, 8).map(p => ({
            _id:             p._id,
            name:            p.name,
            status:          p.status,
            ai_success_score:p.ai_success_score,
            team_size:       p.team_members?.length || 0,
            created_by:      p.created_by?.username || '—',
            created_at:      p.created_at,
        }))

        res.status(200).json({
            stats,
            capacity,
            capacity_summary,
            project_stats,
            success_rate,
            avg_ai_score,
            task_by_status,
            task_completion_rate,
            workload_dist,
            skill_matrix:   skill_matrix_sorted,
            org_skill_gap,
            activity_logs:  activity_logs.slice(0, 30),
            user_table,
            recent_projects,
        })

    } catch (error) {
        console.error('getAdminDashboard error:', error)
        res.status(500).json({ message: 'Server error loading admin dashboard' })
    }
}

module.exports = {
    getAdminStats,
    changeUserRole,
    verifyUserSkill,
    getAdminDashboard,
}