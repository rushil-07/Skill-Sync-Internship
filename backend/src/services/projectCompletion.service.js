const projectModel = require('../models/project.model')
const taskModel = require('../models/task.model')
const userModel = require('../models/user.model')
const skillModel = require('../models/skill.model')

const LEVELS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']

function getLevelIndex(level) {
    const idx = LEVELS.indexOf(level)
    return idx >= 0 ? idx : 0
}

function getPromotedLevel(currentLevel, capLevel) {
    const currentIndex = getLevelIndex(currentLevel)
    const capIndex = getLevelIndex(capLevel || 'EXPERT')
    const nextIndex = Math.min(currentIndex + 1, capIndex)
    return LEVELS[nextIndex]
}

async function markProjectHistoryCompleted(projectId, participantIds) {
    await Promise.all(
        participantIds.map(userId =>
            userModel.findOneAndUpdate(
                { _id: userId, 'project_history.project_id': projectId, 'project_history.status': 'ONGOING' },
                {
                    $set: {
                        'project_history.$.status': 'COMPLETED',
                        'project_history.$.completed_at': new Date(),
                    },
                }
            )
        )
    )
}

async function applyAutomaticSkillUpdates(projectId) {
    const project = await projectModel.findById(projectId).lean()
    if (!project) return

    const requiredSkills = project.required_skills || []
    const participantIds = [
        ...new Set([
            ...((project.team_members || []).map(id => id.toString())),
            project.project_manager?.toString?.(),
            project.created_by?.toString?.(),
        ].filter(Boolean)),
    ]

    if (!participantIds.length) return

    await markProjectHistoryCompleted(projectId, participantIds)

    if (!requiredSkills.length) return

    const tasks = await taskModel
        .find({ project_id: projectId, status: 'DONE', assigned_to: { $ne: null } })
        .select('assigned_to')
        .lean()

    const completedTaskCounts = new Map()
    for (const task of tasks) {
        const key = task.assigned_to?.toString?.()
        if (!key) continue
        completedTaskCounts.set(key, (completedTaskCounts.get(key) || 0) + 1)
    }

    for (const userId of participantIds) {
        const completedTasks = completedTaskCounts.get(userId) || 0
        if (completedTasks === 0) continue

        const user = await userModel.findById(userId)
        if (!user) continue

        let changed = false

        for (const requiredSkill of requiredSkills) {
            if (!requiredSkill?.skill_name) continue

            const existingSkill = user.skills.find(skill =>
                (requiredSkill.skill_id && skill.skill_id && skill.skill_id.toString() === requiredSkill.skill_id.toString()) ||
                String(skill.skill_name || '').toLowerCase() === String(requiredSkill.skill_name || '').toLowerCase()
            )

            if (existingSkill) {
                const nextLevel = getPromotedLevel(existingSkill.proficiency_level, requiredSkill.required_proficiency)
                if (nextLevel !== existingSkill.proficiency_level) {
                    existingSkill.proficiency_level = nextLevel
                    user.logActivity('Skill auto-updated', `${requiredSkill.skill_name} -> ${nextLevel}`, 'SKILL')
                    changed = true
                }
                existingSkill.last_used = new Date()
                changed = true
                continue
            }

            user.skills.push({
                skill_id: requiredSkill.skill_id || undefined,
                skill_name: requiredSkill.skill_name,
                proficiency_level: 'BEGINNER',
                verified: false,
                last_used: new Date(),
            })

            if (requiredSkill.skill_id) {
                await skillModel.findByIdAndUpdate(requiredSkill.skill_id, { $inc: { usage_count: 1 } }).catch(() => null)
            }

            user.logActivity('Skill auto-added from completed project', requiredSkill.skill_name, 'SKILL')
            changed = true
        }

        if (changed) {
            await user.save()
        }
    }
}

module.exports = {
    applyAutomaticSkillUpdates,
}
