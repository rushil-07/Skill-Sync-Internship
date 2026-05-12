const userModel = require('../models/user.model')

function normalizeRecommendationProgress(status, progressPct) {
    const normalizedStatus = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'].includes(status)
        ? status
        : 'NOT_STARTED'

    let normalizedProgress = Number(progressPct)
    if (Number.isNaN(normalizedProgress)) {
        normalizedProgress = normalizedStatus === 'COMPLETED' ? 100 : normalizedStatus === 'IN_PROGRESS' ? 25 : 0
    }

    normalizedProgress = Math.max(0, Math.min(100, normalizedProgress))

    if (normalizedStatus === 'COMPLETED') normalizedProgress = 100
    if (normalizedStatus === 'NOT_STARTED' && normalizedProgress > 0) {
        return { status: 'IN_PROGRESS', progress_pct: normalizedProgress }
    }

    if (normalizedStatus === 'IN_PROGRESS' && normalizedProgress === 0) normalizedProgress = 25

    return {
        status: normalizedStatus,
        progress_pct: normalizedProgress,
    }
}

// ─── GET /api/profile/me ──────────────────────────────────────────────────────
// Returns the full profile of the currently logged-in user
// SRS 4.2: personal info, skills, availability, project history, metrics, recommendations, activity
async function getMyProfile(req, res) {
    try {
        const user = await userModel
            .findById(req.user.id)
            .select('-password')                          // never send password
            .populate('project_history.project_id', 'name status start_date end_date')

        if (!user) {
            return res.status(404).json({ message: 'User not found' })
        }

        res.status(200).json({ user })

    } catch (error) {
        console.error('getMyProfile error:', error)
        res.status(500).json({ message: 'Server error while fetching profile' })
    }
}


// ─── PUT /api/profile/me ──────────────────────────────────────────────────────
// Update personal information + availability
// Allowed fields: bio, profile_picture_url, availability_hours_per_week, current_capacity_percentage
async function updateMyProfile(req, res) {
    try {
        const ALLOWED_FIELDS = [
            'bio',
            'profile_picture_url',
            'availability_hours_per_week',
            'current_capacity_percentage',
        ]

        // Only pick allowed fields — reject anything else (model is strict: throw)
        const updates = {}
        for (const field of ALLOWED_FIELDS) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field]
            }
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ message: 'No valid fields provided to update' })
        }

        const user = await userModel.findByIdAndUpdate(
            req.user.id,
            { $set: updates },
            { new: true, runValidators: true, select: '-password' }
        )

        if (!user) {
            return res.status(404).json({ message: 'User not found' })
        }

        // Log activity
        user.logActivity('Updated profile', 'Personal information', 'SYSTEM')
        await user.save()

        res.status(200).json({
            message: 'Profile updated successfully',
            user,
        })

    } catch (error) {
        console.error('updateMyProfile error:', error)
        if (error.name === 'StrictModeError') {
            return res.status(400).json({ message: `Field not allowed: ${error.message}` })
        }
        res.status(500).json({ message: 'Server error while updating profile' })
    }
}


// ─── POST /api/profile/skills ─────────────────────────────────────────────────
// Add a new skill with proficiency level
// Body: { name, proficiency_level }
async function addSkill(req, res) {
    try {
        const { name, proficiency_level } = req.body

        if (!name || !proficiency_level) {
            return res.status(400).json({ message: 'skill name and proficiency_level are required' })
        }

        const VALID_LEVELS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']
        if (!VALID_LEVELS.includes(proficiency_level)) {
            return res.status(400).json({
                message: `proficiency_level must be one of: ${VALID_LEVELS.join(', ')}`
            })
        }

        const user = await userModel.findById(req.user.id)
        if (!user) return res.status(404).json({ message: 'User not found' })

        // Check if skill already exists
        const exists = user.skills.find(
            s => s.name.toLowerCase() === name.toLowerCase()
        )
        if (exists) {
            return res.status(409).json({ message: `Skill "${name}" already exists in your profile` })
        }

        user.skills.push({
            name: name.trim(),
            proficiency_level,
            verified: false,
            last_used: new Date(),
        })

        user.logActivity('Added skill', `${name} — ${proficiency_level}`, 'SKILL')
        await user.save()

        res.status(201).json({
            message: 'Skill added successfully',
            skill: user.skills[user.skills.length - 1],
        })

    } catch (error) {
        console.error('addSkill error:', error)
        res.status(500).json({ message: 'Server error while adding skill' })
    }
}


// ─── PUT /api/profile/skills/:skillId ────────────────────────────────────────
// Update proficiency level of an existing skill
// Body: { proficiency_level, last_used? }
async function updateSkill(req, res) {
    try {
        const { skillId } = req.params
        const { proficiency_level, last_used } = req.body

        const VALID_LEVELS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']
        if (proficiency_level && !VALID_LEVELS.includes(proficiency_level)) {
            return res.status(400).json({
                message: `proficiency_level must be one of: ${VALID_LEVELS.join(', ')}`
            })
        }

        const user = await userModel.findById(req.user.id)
        if (!user) return res.status(404).json({ message: 'User not found' })

        const skill = user.skills.id(skillId)
        if (!skill) return res.status(404).json({ message: 'Skill not found in your profile' })

        if (proficiency_level) skill.proficiency_level = proficiency_level
        if (last_used)         skill.last_used = new Date(last_used)

        user.logActivity('Updated skill', `${skill.name} → ${proficiency_level}`, 'SKILL')
        await user.save()

        res.status(200).json({
            message: 'Skill updated successfully',
            skill,
        })

    } catch (error) {
        console.error('updateSkill error:', error)
        res.status(500).json({ message: 'Server error while updating skill' })
    }
}


// ─── DELETE /api/profile/skills/:skillId ─────────────────────────────────────
// Remove a skill from the profile
async function deleteSkill(req, res) {
    try {
        const { skillId } = req.params

        const user = await userModel.findById(req.user.id)
        if (!user) return res.status(404).json({ message: 'User not found' })

        const skill = user.skills.id(skillId)
        if (!skill) return res.status(404).json({ message: 'Skill not found in your profile' })

        const skillName = skill.name

        // Mongoose subdocument remove
        skill.deleteOne()

        user.logActivity('Removed skill', skillName, 'SKILL')
        await user.save()

        res.status(200).json({ message: `Skill "${skillName}" removed successfully` })

    } catch (error) {
        console.error('deleteSkill error:', error)
        res.status(500).json({ message: 'Server error while deleting skill' })
    }
}


// ─── GET /api/profile/recommendations ────────────────────────────────────────
// Get all learning recommendations for the logged-in user
async function getRecommendations(req, res) {
    try {
        const user = await userModel
            .findById(req.user.id)
            .select('learning_recommendations')

        if (!user) return res.status(404).json({ message: 'User not found' })

        res.status(200).json({
            recommendations: user.learning_recommendations,
        })

    } catch (error) {
        console.error('getRecommendations error:', error)
        res.status(500).json({ message: 'Server error' })
    }
}


// ─── POST /api/profile/recommendations ───────────────────────────────────────
// Add a learning recommendation (called by AI engine or PM/Admin)
// Body: { skill_name, current_level, target_level, reason, course_name, course_url, priority }
async function addRecommendation(req, res) {
    try {
        const {
            skill_name,
            current_level,
            target_level,
            reason,
            course_name,
            course_url,
            priority,
            status,
            progress_pct,
            progress_note,
        } = req.body

        if (!skill_name || !target_level) {
            return res.status(400).json({ message: 'skill_name and target_level are required' })
        }

        // Allow adding to own profile (MEMBER) OR to any user by PM/ADMIN
        // The target user id comes from param if PM/Admin, else own id
        const targetUserId = req.params.userId || req.user.id

        // If targeting another user, must be PM or Admin
        if (req.params.userId && !['PROJECT_MANAGER', 'ADMIN'].includes(req.user.role)) {
            return res.status(403).json({ message: 'Only Project Managers and Admins can add recommendations to other users.' })
        }

        const user = await userModel.findById(targetUserId)
        if (!user) return res.status(404).json({ message: 'User not found' })

        const progress = normalizeRecommendationProgress(status, progress_pct)

        user.learning_recommendations.push({
            skill_name,
            current_level:  current_level || 'NONE',
            target_level,
            reason,
            course_name,
            course_url,
            priority: priority || 'MEDIUM',
            status: progress.status,
            progress_pct: progress.progress_pct,
            last_updated_at: new Date(),
            progress_log: [{
                status: progress.status,
                progress_pct: progress.progress_pct,
                note: progress_note || 'Recommendation created',
                updated_at: new Date(),
            }],
        })

        user.logActivity('Received recommendation', `Learn ${skill_name} — ${target_level}`, 'SKILL')
        await user.save()

        res.status(201).json({
            message: 'Recommendation added successfully',
            recommendation: user.learning_recommendations[user.learning_recommendations.length - 1],
        })

    } catch (error) {
        console.error('addRecommendation error:', error)
        res.status(500).json({ message: 'Server error while adding recommendation' })
    }
}


// ─── DELETE /api/profile/recommendations/:recId ───────────────────────────────
// Remove a learning recommendation
async function deleteRecommendation(req, res) {
    try {
        const { recId } = req.params

        const user = await userModel.findById(req.user.id)
        if (!user) return res.status(404).json({ message: 'User not found' })

        const rec = user.learning_recommendations.id(recId)
        if (!rec) return res.status(404).json({ message: 'Recommendation not found' })

        rec.deleteOne()
        await user.save()

        res.status(200).json({ message: 'Recommendation removed successfully' })

    } catch (error) {
        console.error('deleteRecommendation error:', error)
        res.status(500).json({ message: 'Server error while deleting recommendation' })
    }
}


// ─── GET /api/profile/activity ────────────────────────────────────────────────
// Get activity feed — supports pagination via ?page=1&limit=20
async function getActivityFeed(req, res) {
    try {
        const page  = parseInt(req.query.page)  || 1
        const limit = parseInt(req.query.limit) || 20

        const user = await userModel
            .findById(req.user.id)
            .select('activity_feed')

        if (!user) return res.status(404).json({ message: 'User not found' })

        const total      = user.activity_feed.length
        const paginated  = user.activity_feed.slice((page - 1) * limit, page * limit)

        res.status(200).json({
            activity:    paginated,
            total,
            page,
            total_pages: Math.ceil(total / limit),
        })

    } catch (error) {
        console.error('getActivityFeed error:', error)
        res.status(500).json({ message: 'Server error' })
    }
}


// ─── GET /api/profile/metrics ─────────────────────────────────────────────────
// Get performance metrics of the logged-in user
async function getPerformanceMetrics(req, res) {
    try {
        const user = await userModel
            .findById(req.user.id)
            .select('performance_metrics username')

        if (!user) return res.status(404).json({ message: 'User not found' })

        res.status(200).json({ metrics: user.performance_metrics })

    } catch (error) {
        console.error('getPerformanceMetrics error:', error)
        res.status(500).json({ message: 'Server error' })
    }
}


// ─── GET /api/profile/:userId ─────────────────────────────────────────────────
// View another user's profile — PM and Admin only
// Returns full profile excluding password
async function getUserProfile(req, res) {
    try {
        const user = await userModel
            .findById(req.params.userId)
            .select('-password')
            .populate('project_history.project_id', 'name status')

        if (!user) return res.status(404).json({ message: 'User not found' })

        res.status(200).json({ user })

    } catch (error) {
        console.error('getUserProfile error:', error)
        res.status(500).json({ message: 'Server error while fetching user profile' })
    }
}

// profile.controller.js
async function changeUserRole(req, res) {
    try {
        const { role } = req.body
        const VALID_ROLES = ['MEMBER', 'PROJECT_MANAGER', 'ADMIN']
        if (!VALID_ROLES.includes(role)) {
            return res.status(400).json({ message: 'Invalid role' })
        }
        const user = await userModel.findByIdAndUpdate(
            req.params.userId,
            { $set: { role } },
            { new: true, select: '-password' }
        )
        if (!user) return res.status(404).json({ message: 'User not found' })
        res.status(200).json({ message: `Role updated to ${role}`, user })
    } catch (error) {
        res.status(500).json({ message: 'Server error' })
    }
}

async function updateRecommendation(req, res) {
    try {
        const { recId } = req.params
        const targetUserId = req.params.userId || req.user.id

        if (req.params.userId && !['PROJECT_MANAGER', 'ADMIN'].includes(req.user.role)) {
            return res.status(403).json({ message: 'Only Project Managers and Admins can update recommendations for other users.' })
        }

        const user = await userModel.findById(targetUserId)
        if (!user) return res.status(404).json({ message: 'User not found' })

        const rec = user.learning_recommendations.id(recId)
        if (!rec) return res.status(404).json({ message: 'Recommendation not found' })

        const allowedFields = ['current_level', 'target_level', 'reason', 'course_name', 'course_url', 'priority']
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                rec[field] = req.body[field]
            }
        }

        const progress = normalizeRecommendationProgress(
            req.body.status !== undefined ? req.body.status : rec.status,
            req.body.progress_pct !== undefined ? req.body.progress_pct : rec.progress_pct
        )

        rec.status = progress.status
        rec.progress_pct = progress.progress_pct
        rec.last_updated_at = new Date()

        if (req.body.status !== undefined || req.body.progress_pct !== undefined || req.body.progress_note) {
            rec.progress_log.push({
                status: rec.status,
                progress_pct: rec.progress_pct,
                note: req.body.progress_note || '',
                updated_at: new Date(),
            })
        }

        user.logActivity(
            'Updated learning progress',
            `${rec.skill_name} — ${rec.progress_pct}%`,
            'SKILL'
        )
        await user.save()

        res.status(200).json({
            message: 'Recommendation updated successfully',
            recommendation: rec,
        })
    } catch (error) {
        console.error('updateRecommendation error:', error)
        res.status(500).json({ message: 'Server error while updating recommendation' })
    }
}

module.exports = {
    getMyProfile,
    updateMyProfile,
    addSkill,
    updateSkill,
    deleteSkill,
    getRecommendations,
    addRecommendation,
    updateRecommendation,
    deleteRecommendation,
    getActivityFeed,
    getPerformanceMetrics,
    getUserProfile,
    changeUserRole,
}
