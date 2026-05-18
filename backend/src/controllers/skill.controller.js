const skillModel   = require('../models/skill.model')
const userModel    = require('../models/user.model')
const projectModel = require('../models/project.model')

// =============================================================================
// SKILL TAXONOMY (Admin manages the global skill list)
// =============================================================================

// --- GET /api/skills ----------------------------------------------------------
// List all skills - supports ?category=Frontend&search=react&limit=50
async function getAllSkills(req, res) {
    try {
        const query = {}

        if (req.query.category) query.category = req.query.category
        if (req.query.verified)  query.verified  = req.query.verified === 'true'

        // Text search
        if (req.query.search) {
            query.name = { $regex: req.query.search, $options: 'i' }
        }

        const limit = Math.min(parseInt(req.query.limit) || 100, 200)

        const skills = await skillModel
            .find(query)
            .sort({ usage_count: -1, name: 1 })
            .limit(limit)

        // Group by category for the frontend
        const grouped = {}
        for (const skill of skills) {
            if (!grouped[skill.category]) grouped[skill.category] = []
            grouped[skill.category].push(skill)
        }

        res.status(200).json({ skills, grouped, total: skills.length })

    } catch (error) {
        console.error('getAllSkills error:', error)
        res.status(500).json({ message: 'Server error' })
    }
}


// --- POST /api/skills ---------------------------------------------------------
// Create a new skill in the taxonomy - Admin only
// Body: { name, category, description }
async function createSkill(req, res) {
    try {
        const { name, category, description } = req.body

        if (!name?.trim()) {
            return res.status(400).json({ message: 'name is required' })
        }

        // Check duplicate
        const exists = await skillModel.findOne({ name: { $regex: `^${name.trim()}$`, $options: 'i' } })
        if (exists) {
            return res.status(409).json({ message: `Skill "${name}" already exists in the taxonomy` })
        }

        const skill = await skillModel.create({
            name:        name.trim(),
            category:    category || 'Other',
            description: description?.trim() || '',
            verified:    true,     // Admin-created skills are verified by default
        })

        res.status(201).json({ message: 'Skill created', skill })

    } catch (error) {
        console.error('createSkill error:', error)
        res.status(500).json({ message: 'Server error' })
    }
}


// --- PUT /api/skills/:skillId -------------------------------------------------
// Update skill - Admin only
async function updateSkill(req, res) {
    try {
        const { name, category, description, verified } = req.body

        const skill = await skillModel.findById(req.params.skillId)
        if (!skill) return res.status(404).json({ message: 'Skill not found' })

        if (name)               skill.name        = name.trim()
        if (category)           skill.category    = category
        if (description !== undefined) skill.description = description?.trim()
        if (verified !== undefined)    skill.verified    = Boolean(verified)

        await skill.save()
        res.status(200).json({ message: 'Skill updated', skill })

    } catch (error) {
        console.error('updateSkill error:', error)
        res.status(500).json({ message: 'Server error' })
    }
}


// --- DELETE /api/skills/:skillId ----------------------------------------------
// Delete skill from taxonomy - Admin only
// Also removes it from any user profiles and project required_skills
async function deleteSkill(req, res) {
    try {
        const skill = await skillModel.findById(req.params.skillId)
        if (!skill) return res.status(404).json({ message: 'Skill not found' })

        // Remove from all user profiles
        await userModel.updateMany(
            { 'skills.skill_id': skill._id },
            { $pull: { skills: { skill_id: skill._id } } }
        )

        // Remove from all project required_skills
        await projectModel.updateMany(
            { 'required_skills.skill_id': skill._id },
            { $pull: { required_skills: { skill_id: skill._id } } }
        )

        await skillModel.findByIdAndDelete(skill._id)

        res.status(200).json({ message: `Skill "${skill.name}" deleted from taxonomy and all profiles` })

    } catch (error) {
        console.error('deleteSkill error:', error)
        res.status(500).json({ message: 'Server error' })
    }
}


// =============================================================================
// USER PROFILE SKILLS (replaces old profile.controller skill handlers)
// =============================================================================

// --- POST /api/skills/profile/add --------------------------------------------
// Add a skill to logged-in user's profile
// Body: { skill_name, proficiency_level } OR { skill_id, proficiency_level }
async function addSkillToProfile(req, res) {
    try {
        const { skill_id, skill_name, category, proficiency_level } = req.body

        if (!proficiency_level) {
            return res.status(400).json({ message: 'proficiency_level is required' })
        }

        const VALID = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']
        if (!VALID.includes(proficiency_level)) {
            return res.status(400).json({ message: `proficiency_level must be one of: ${VALID.join(', ')}` })
        }

        // -- Resolve the skill from taxonomy ----------------------------------
        let skill

        if (skill_id) {
            skill = await skillModel.findById(skill_id)
            if (!skill) return res.status(404).json({ message: 'Skill not found in taxonomy' })
        } else if (skill_name) {
            // Find or create in taxonomy
            skill = await skillModel.findOne({ name: { $regex: `^${skill_name.trim()}$`, $options: 'i' } })
            if (!skill) {
                skill = await skillModel.create({
                    name:     skill_name.trim(),
                    category: category || 'Other',
                    verified: false,
                })
            }
        } else {
            return res.status(400).json({ message: 'Either skill_id or skill_name is required' })
        }

        // -- Use raw MongoDB update to bypass Mongoose validation --------------
        // Existing users may have skills stored as plain strings or objects
        // without skill_id - Mongoose validation would reject save() on those.
        const mongoose = require('mongoose')
        const usersCol = userModel.db.db.collection('users')
        const userId   = new mongoose.Types.ObjectId(req.user.id)

        const userRaw = await usersCol.findOne({ _id: userId })
        if (!userRaw) return res.status(404).json({ message: 'User not found' })

        // Normalise existing skills for duplicate check
        const existingSkills = (userRaw.skills || []).map(s =>
            typeof s === 'string' ? { skill_name: s } : s
        )

        // Duplicate check
        const already = existingSkills.find(s =>
            s.skill_id?.toString() === skill._id.toString() ||
            (s.skill_name || s.name || '').toLowerCase() === skill.name.toLowerCase()
        )
        if (already) {
            return res.status(409).json({ message: `Skill "${skill.name}" is already in your profile` })
        }

        // Build the new skill entry
        const newEntry = {
            _id:              new mongoose.Types.ObjectId(),
            skill_id:         skill._id,
            skill_name:       skill.name,
            proficiency_level,
            verified:         false,
            last_used:        new Date(),
        }

        // Build activity entry
        const activityEntry = {
            _id:         new mongoose.Types.ObjectId(),
            action:      'Added skill',
            target:      `${skill.name} - ${proficiency_level}`,
            target_type: 'SKILL',
            target_id:   skill._id,
            created_at:  new Date(),
        }

        // Single atomic update - push skill + prepend activity + cap feed at 50
        await usersCol.updateOne(
            { _id: userId },
            {
                $push: {
                    skills: newEntry,
                    activity_feed: {
                        $each:     [activityEntry],
                        $position: 0,
                        $slice:    50,
                    },
                }
            }
        )

        // Increment usage count
        await skillModel.findByIdAndUpdate(skill._id, { $inc: { usage_count: 1 } })

        res.status(201).json({
            message: 'Skill added to profile',
            skill:   newEntry,             // return the entry we just created
        })

    } catch (error) {
        console.error('addSkillToProfile error:', error)
        res.status(500).json({ message: 'Server error' })
    }
}


// --- PUT /api/skills/profile/:userSkillId ------------------------------------
// Update proficiency level of a skill in user's profile
async function updateProfileSkill(req, res) {
    try {
        const { proficiency_level } = req.body
        const VALID = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']

        if (proficiency_level && !VALID.includes(proficiency_level)) {
            return res.status(400).json({ message: `proficiency_level must be one of: ${VALID.join(', ')}` })
        }

        const user = await userModel.findById(req.user.id)
        if (!user) return res.status(404).json({ message: 'User not found' })

        const skill = user.skills.id(req.params.userSkillId)
        if (!skill) return res.status(404).json({ message: 'Skill not found in your profile' })

        if (proficiency_level) {
            user.logHistory?.(req.user.id, 'skill_level', skill.proficiency_level, proficiency_level)
            skill.proficiency_level = proficiency_level
        }
        if (req.body.last_used) skill.last_used = new Date(req.body.last_used)

        user.logActivity('Updated skill', `${skill.skill_name} -> ${proficiency_level}`, 'SKILL')
        await user.save()

        res.status(200).json({ message: 'Skill updated', skill })

    } catch (error) {
        console.error('updateProfileSkill error:', error)
        res.status(500).json({ message: 'Server error' })
    }
}


// --- DELETE /api/skills/profile/:userSkillId ---------------------------------
// Remove a skill from user's profile
async function removeSkillFromProfile(req, res) {
    try {
        // First fetch to get skill name before removing
        const user = await userModel.findById(req.user.id)
        if (!user) return res.status(404).json({ message: 'User not found' })

        const skill = user.skills.id(req.params.userSkillId)
        if (!skill) return res.status(404).json({ message: 'Skill not found in your profile' })

        const skillName = skill.skill_name || skill.name || 'Unknown'
        const skillId   = skill.skill_id

        // Use $pull with findByIdAndUpdate to avoid full document validation
        // This bypasses the skill_id: required check on OTHER skills that were
        // added before the schema was updated (old skills without skill_id)
        await userModel.findByIdAndUpdate(
            req.user.id,
            {
                $pull: { skills: { _id: req.params.userSkillId } },
                $push: {
                    activity_feed: {
                        $each: [{ action: 'Removed skill', target: skillName, target_type: 'SKILL' }],
                        $position: 0,
                        $slice: 50,
                    }
                }
            },
            { new: true }
        )

        // Decrement usage count on taxonomy (only if skill_id exists)
        if (skillId) {
            await skillModel.findByIdAndUpdate(skillId, { $inc: { usage_count: -1 } })
        }

        res.status(200).json({ message: `Skill "${skillName}" removed from profile` })

    } catch (error) {
        console.error('removeSkillFromProfile error:', error)
        res.status(500).json({ message: 'Server error' })
    }
}


// =============================================================================
// PROJECT REQUIRED SKILLS
// =============================================================================

// --- POST /api/skills/project/:projectId/add ---------------------------------
// Add a required skill to a project - PM only
// Body: { skill_id, required_proficiency }
async function addRequiredSkill(req, res) {
    try {
        const { skill_id, required_proficiency } = req.body

        if (!skill_id || !required_proficiency) {
            return res.status(400).json({ message: 'skill_id and required_proficiency are required' })
        }

        const skill = await skillModel.findById(skill_id)
        if (!skill) return res.status(404).json({ message: 'Skill not found in taxonomy' })

        const project = await projectModel.findById(req.params.projectId)
        if (!project) return res.status(404).json({ message: 'Project not found' })

        // Check duplicate
        const exists = project.required_skills.find(
            s => s.skill_id.toString() === skill._id.toString()
        )
        if (exists) {
            return res.status(409).json({ message: `Skill "${skill.name}" is already required for this project` })
        }

        project.required_skills.push({
            skill_id:             skill._id,
            skill_name:           skill.name,
            required_proficiency,
        })

        await project.save()

        res.status(201).json({
            message:        'Required skill added to project',
            required_skill: project.required_skills[project.required_skills.length - 1],
        })

    } catch (error) {
        console.error('addRequiredSkill error:', error)
        res.status(500).json({ message: 'Server error' })
    }
}


// --- DELETE /api/skills/project/:projectId/:reqSkillId -----------------------
// Remove a required skill from a project - PM only
async function removeRequiredSkill(req, res) {
    try {
        const project = await projectModel.findById(req.params.projectId)
        if (!project) return res.status(404).json({ message: 'Project not found' })

        const reqSkill = project.required_skills.id(req.params.reqSkillId)
        if (!reqSkill) return res.status(404).json({ message: 'Required skill not found' })

        const name = reqSkill.skill_name
        reqSkill.deleteOne()
        await project.save()

        res.status(200).json({ message: `Skill "${name}" removed from project requirements` })

    } catch (error) {
        console.error('removeRequiredSkill error:', error)
        res.status(500).json({ message: 'Server error' })
    }
}


// =============================================================================
// SKILL GAP ANALYSIS
// =============================================================================

// --- GET /api/skills/gap/:projectId ------------------------------------------
// Compare project required skills vs team member skills
// Returns gap analysis: which skills are missing / under-proficient
async function getSkillGap(req, res) {
    try {
        const project = await projectModel
            .findById(req.params.projectId)
            .populate('team_members', 'username skills')

        if (!project) return res.status(404).json({ message: 'Project not found' })

        const PROFICIENCY_RANK = { BEGINNER: 1, INTERMEDIATE: 2, ADVANCED: 3, EXPERT: 4 }

        const gapReport = []

        for (const reqSkill of project.required_skills) {
            // Find all team members who have this skill
            const coverageMap = []

            for (const member of project.team_members) {
                const memberSkill = member.skills?.find(
                    s => s.skill_id?.toString() === reqSkill.skill_id?.toString()
                )

                if (memberSkill) {
                    const memberRank   = PROFICIENCY_RANK[memberSkill.proficiency_level] || 0
                    const requiredRank = PROFICIENCY_RANK[reqSkill.required_proficiency]  || 0
                    coverageMap.push({
                        username:          member.username,
                        proficiency_level: memberSkill.proficiency_level,
                        meets_requirement: memberRank >= requiredRank,
                        verified:          memberSkill.verified,
                    })
                }
            }

            const covered = coverageMap.some(m => m.meets_requirement)

            gapReport.push({
                skill_id:             reqSkill.skill_id,
                skill_name:           reqSkill.skill_name,
                required_proficiency: reqSkill.required_proficiency,
                covered,
                team_coverage:        coverageMap,
                gap:                  !covered,
            })
        }

        const gapCount     = gapReport.filter(r => r.gap).length
        const coveragePct  = project.required_skills.length > 0
            ? Math.round(((project.required_skills.length - gapCount) / project.required_skills.length) * 100)
            : 100

        res.status(200).json({
            project_id:   project._id,
            project_name: project.name,
            coverage_pct: coveragePct,
            gaps:         gapCount,
            total_required: project.required_skills.length,
            report:       gapReport,
        })

    } catch (error) {
        console.error('getSkillGap error:', error)
        res.status(500).json({ message: 'Server error' })
    }
}


module.exports = {
    // Taxonomy
    getAllSkills,
    createSkill,
    updateSkill,
    deleteSkill,
    // Profile skills
    addSkillToProfile,
    updateProfileSkill,
    removeSkillFromProfile,
    // Project required skills
    addRequiredSkill,
    removeRequiredSkill,
    // Skill gap
    getSkillGap,
}