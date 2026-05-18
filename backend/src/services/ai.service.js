const projectModel = require('../models/project.model')
const taskModel = require('../models/task.model')
const userModel = require('../models/user.model')
const skillModel = require('../models/skill.model')

const PROFICIENCY_RANK = {
    NONE: 0,
    BEGINNER: 1,
    INTERMEDIATE: 2,
    ADVANCED: 3,
    EXPERT: 4,
}

function normalizeText(value) {
    return String(value || '').trim().toLowerCase()
}

function getRank(level) {
    return PROFICIENCY_RANK[level] || 0
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max)
}

function average(values) {
    if (!values.length) return 0
    return values.reduce((sum, value) => sum + value, 0) / values.length
}

function skillKey(skill) {
    const id = skill?.skill_id?.toString?.()
    if (id) return `id:${id}`
    return `name:${normalizeText(skill?.skill_name || skill?.name)}`
}

function userSkillMap(user) {
    const map = new Map()
    for (const skill of user?.skills || []) {
        map.set(skillKey(skill), skill)
    }
    return map
}

function sameSkill(requiredSkill, memberSkill) {
    const requiredId = requiredSkill?.skill_id?.toString?.()
    const memberId = memberSkill?.skill_id?.toString?.()

    if (requiredId && memberId) {
        return requiredId === memberId
    }

    return normalizeText(requiredSkill?.skill_name) === normalizeText(memberSkill?.skill_name)
}

function findMatchingMemberSkill(requiredSkill, memberSkills = []) {
    return memberSkills.find(skill => sameSkill(requiredSkill, skill)) || null
}

function coverageForUser(requiredSkill, skillMap) {
    const exact = skillMap.get(skillKey(requiredSkill))
    if (!exact) return null

    const requiredRank = getRank(requiredSkill.required_proficiency)
    const userRank = getRank(exact.proficiency_level)

    return {
        skill: exact,
        met: userRank >= requiredRank,
        required_rank: requiredRank,
        user_rank: userRank,
    }
}

function inferCategory(skillName, taxonomy = []) {
    const exact = taxonomy.find(skill => normalizeText(skill.name) === normalizeText(skillName))
    return exact?.category || 'Other'
}

function buildCourseSuggestion(skillName, category, targetLevel) {
    const normalizedSkill = normalizeText(skillName)
    const encodedSkill = encodeURIComponent(skillName)
    const providerQuery = encodeURIComponent(`${skillName} ${targetLevel}`)

    if (/react|javascript|html|css|frontend/.test(normalizedSkill)) {
        return {
            provider: 'Frontend Masters',
            course_name: `${skillName} Path (${targetLevel})`,
            course_url: `https://frontendmasters.com/courses/?q=${providerQuery}`,
        }
    }

    if (/node|express|api|backend/.test(normalizedSkill)) {
        return {
            provider: 'Udemy',
            course_name: `${skillName} for Backend Development`,
            course_url: `https://www.udemy.com/courses/search/?q=${providerQuery}`,
        }
    }

    if (/mongodb|sql|database|postgres/.test(normalizedSkill)) {
        return {
            provider: 'Coursera',
            course_name: `${skillName} Database Fundamentals`,
            course_url: `https://www.coursera.org/search?query=${providerQuery}`,
        }
    }

    if (/docker|kubernetes|aws|azure|cloud|devops/.test(normalizedSkill)) {
        return {
            provider: 'Microsoft Learn',
            course_name: `${skillName} Cloud Learning Path`,
            course_url: `https://learn.microsoft.com/en-us/search/?terms=${providerQuery}`,
        }
    }

    if (category === 'Data & AI' || /python|machine learning|ai|data/.test(normalizedSkill)) {
        return {
            provider: 'Coursera',
            course_name: `${skillName} for ${targetLevel} level`,
            course_url: `https://www.coursera.org/search?query=${providerQuery}`,
        }
    }

    return {
        provider: 'LinkedIn Learning',
        course_name: `${skillName} for ${targetLevel} level`,
        course_url: `https://www.linkedin.com/learning/search?keywords=${encodedSkill}`,
    }
}

function buildRecommendationPriority(reqSkill, hasUnderProficientMembers) {
    const requiredRank = getRank(reqSkill.required_proficiency)

    if (!hasUnderProficientMembers) {
        return requiredRank >= 3 ? 'HIGH' : 'MEDIUM'
    }

    return requiredRank >= 3 ? 'HIGH' : 'MEDIUM'
}

function scoreFromCapacity(user) {
    const capacity = Number(user?.current_capacity_percentage || 0)
    return clamp(100 - capacity, 0, 100)
}

function scoreFromPerformance(user) {
    const metrics = user?.performance_metrics || {}
    const onTime = Number(metrics.on_time_delivery_rate || 0)
    const collaboration = Number(metrics.collaboration_score || 0)

    if (!onTime && !collaboration) return 50
    return Math.round((onTime * 0.6) + (collaboration * 0.4))
}

function openTaskCounts(tasks) {
    const counts = {}

    for (const task of tasks) {
        if (!task?.assigned_to || task.status === 'DONE') continue
        const userId = task.assigned_to.toString()
        counts[userId] = (counts[userId] || 0) + 1
    }

    return counts
}

function scoreFromOpenTaskCount(userId, counts) {
    const count = counts[userId?.toString?.()] || 0
    return clamp(100 - (count * 12), 20, 100)
}

function calculateSkillCoverage(project, teamMembers) {
    const requiredSkills = project.required_skills || []
    if (!requiredSkills.length) return 100

    let coveredCount = 0

    for (const reqSkill of requiredSkills) {
        let covered = false

        for (const member of teamMembers || []) {
            const memberSkill = findMatchingMemberSkill(reqSkill, member.skills || [])
            if (!memberSkill) continue

            const memberRank = getRank(memberSkill.proficiency_level)
            const requiredRank = getRank(reqSkill.required_proficiency)

            if (memberRank >= requiredRank) {
                covered = true
                break
            }
        }

        if (covered) coveredCount++
    }

    return Math.round((coveredCount / requiredSkills.length) * 100)
}

function calculateTimelineHealth(project, tasks) {
    if (!project.start_date || !project.end_date) return 60

    const start = new Date(project.start_date)
    const end = new Date(project.end_date)
    const now = new Date()

    const totalDurationMs = end - start
    if (totalDurationMs <= 0) return 30

    const elapsedPct = clamp(((now - start) / totalDurationMs) * 100, 0, 100)
    const completionPct = tasks.length
        ? (tasks.filter(task => task.status === 'DONE').length / tasks.length) * 100
        : 0

    const delta = completionPct - elapsedPct
    return clamp(Math.round(65 + delta), 0, 100)
}

function calculateMilestoneHealth(project) {
    const milestones = project.milestones || []
    if (!milestones.length) return 60

    const completed = milestones.filter(m => m.status === 'COMPLETED').length
    return Math.round((completed / milestones.length) * 100)
}

const ANALYTICS_HISTORY_LIMIT = 20
const ANALYTICS_SNAPSHOT_INTERVAL_MS = 6 * 60 * 60 * 1000

function analyticsFactorsEqual(a = {}, b = {}) {
    const keys = [
        'completion_rate',
        'overdue_rate',
        'average_capacity_pct',
        'capacity_health',
        'skill_coverage_pct',
        'timeline_health',
        'milestone_health',
        'staffing_score',
    ]

    return keys.every(key => Number(a[key] || 0) === Number(b[key] || 0))
}

function calculateVolatility(scores = []) {
    if (scores.length < 2) return 0

    let totalDelta = 0
    for (let i = 1; i < scores.length; i++) {
        totalDelta += Math.abs(scores[i] - scores[i - 1])
    }

    return Math.round(totalDelta / (scores.length - 1))
}

function buildAnalyticsSnapshotPayload(analytics, capturedAt = new Date()) {
    return {
        captured_at: capturedAt,
        success_score: analytics.success_score,
        raw_success_score: analytics.raw_success_score,
        history_adjustment: analytics.learning_adjustment || 0,
        factors: analytics.factors,
    }
}

function shouldStoreAnalyticsSnapshot(lastSnapshot, nextSnapshot) {
    if (!lastSnapshot) return true

    const lastCapturedAt = new Date(lastSnapshot.captured_at || 0).getTime()
    const ageMs = Date.now() - lastCapturedAt

    const sameScore =
        Number(lastSnapshot.success_score) === Number(nextSnapshot.success_score) &&
        Number(lastSnapshot.raw_success_score) === Number(nextSnapshot.raw_success_score) &&
        Number(lastSnapshot.history_adjustment || 0) === Number(nextSnapshot.history_adjustment || 0)

    return ageMs >= ANALYTICS_SNAPSHOT_INTERVAL_MS ||
        !sameScore ||
        !analyticsFactorsEqual(lastSnapshot.factors, nextSnapshot.factors)
}

function buildHistorySummary(history = [], currentScore = null) {
    const recent = history.slice(-8)
    const scores = recent.map(item => Number(item.success_score || 0))
    const lastStoredScore = scores.length ? scores[scores.length - 1] : null
    const scoreChange = lastStoredScore == null || currentScore == null
        ? 0
        : Math.round(currentScore - lastStoredScore)

    return {
        snapshots: recent.map(item => ({
            captured_at: item.captured_at,
            success_score: item.success_score,
            raw_success_score: item.raw_success_score,
            history_adjustment: item.history_adjustment || 0,
        })),
        history_points: recent.length,
        average_recent_score: recent.length ? Math.round(average(scores)) : currentScore,
        last_stored_score: lastStoredScore,
        score_change: scoreChange,
        volatility: calculateVolatility(scores),
        direction:
            scoreChange >= 4 ? 'IMPROVING'
                : scoreChange <= -4 ? 'DECLINING'
                    : recent.length >= 2 ? 'STABLE' : 'NEW',
    }
}

function deriveLearningSignals(history = [], factors, rawSuccessScore) {
    const recent = history.slice(-5)
    if (!recent.length) {
        return {
            adjustment: 0,
            insights: ['Trend learning starts after the first analytics snapshot is captured.'],
            trend: buildHistorySummary(history, rawSuccessScore),
        }
    }

    const previousScores = recent.map(item => Number(item.success_score || 0))
    const previousCompletion = average(recent.map(item => Number(item.factors?.completion_rate || 0)))
    const previousOverdue = average(recent.map(item => Number(item.factors?.overdue_rate || 0)))
    const previousTimeline = average(recent.map(item => Number(item.factors?.timeline_health || 0)))
    const lastScore = previousScores[previousScores.length - 1]
    const volatility = calculateVolatility(previousScores)
    const scoreDelta = Math.round(rawSuccessScore - lastScore)

    let adjustment = 0
    const insights = []

    if (scoreDelta >= 6) {
        adjustment += 3
        insights.push('Recent analytics show the project is improving compared with the last recorded checkpoint.')
    } else if (scoreDelta <= -6) {
        adjustment -= 3
        insights.push('Recent analytics show the project is slipping versus the last checkpoint.')
    }

    if (Number(factors.overdue_rate || 0) <= previousOverdue - 8) {
        adjustment += 2
        insights.push('Overdue work has reduced meaningfully over time, improving delivery confidence.')
    } else if (Number(factors.overdue_rate || 0) >= previousOverdue + 8) {
        adjustment -= 2
        insights.push('Overdue work is rising compared with recent history, which increases schedule risk.')
    }

    if (Number(factors.timeline_health || 0) >= previousTimeline + 10) {
        adjustment += 1
        insights.push('Timeline health is trending upward compared with earlier snapshots.')
    } else if (Number(factors.timeline_health || 0) <= previousTimeline - 10) {
        adjustment -= 1
        insights.push('Timeline health is weaker than earlier snapshots and needs attention.')
    }

    if (Number(factors.completion_rate || 0) >= previousCompletion + 10) {
        adjustment += 1
    }

    if (volatility <= 5 && recent.length >= 3) {
        adjustment += 1
        insights.push('Project performance has stayed stable across multiple checkpoints.')
    } else if (volatility >= 15 && recent.length >= 3) {
        adjustment -= 1
        insights.push('Project performance has been volatile across recent checkpoints.')
    }

    if (!insights.length) {
        insights.push('Recent checkpoints are broadly stable, so the learned adjustment stayed neutral.')
    }

    const boundedAdjustment = clamp(adjustment, -6, 6)
    const trend = buildHistorySummary(history, clamp(rawSuccessScore + boundedAdjustment, 0, 100))

    return {
        adjustment: boundedAdjustment,
        insights,
        trend,
    }
}

function relevantRequiredSkills(task, project) {
    const requiredSkills = project.required_skills || []
    const text = normalizeText(`${task.title} ${task.description || ''}`)

    const matched = requiredSkills.filter(skill =>
        text.includes(normalizeText(skill.skill_name))
    )

    return matched.length ? matched : requiredSkills
}

function sharedProjectCount(candidate, selectedUsers) {
    if (!selectedUsers.length) return 0

    const candidateProjects = new Set(
        (candidate?.project_history || [])
            .map(entry => entry?.project_id?.toString?.())
            .filter(Boolean)
    )

    let overlap = 0

    for (const user of selectedUsers) {
        const userProjects = new Set(
            (user?.project_history || [])
                .map(entry => entry?.project_id?.toString?.())
                .filter(Boolean)
        )

        for (const projectId of userProjects) {
            if (candidateProjects.has(projectId)) {
                overlap++
                break
            }
        }
    }

    return overlap
}

function estimateTeamSize(project, taskCount) {
    const skillCount = Math.max((project.required_skills || []).length, 1)
    const taskSignal = Math.max(Math.ceil((taskCount || 0) / 5), 1)
    return clamp(Math.max(skillCount, taskSignal), 2, 6)
}

function teamCoverage(project, users) {
    const requiredSkills = project.required_skills || []
    if (!requiredSkills.length) {
        return { coverage_pct: 100, covered: [], missing: [] }
    }

    const covered = []
    const missing = []

    for (const reqSkill of requiredSkills) {
        let met = false

        for (const user of users) {
            const coverage = coverageForUser(reqSkill, userSkillMap(user))
            if (coverage?.met) {
                covered.push(reqSkill.skill_name)
                met = true
                break
            }
        }

        if (!met) missing.push(reqSkill.skill_name)
    }

    return {
        coverage_pct: Math.round((covered.length / requiredSkills.length) * 100),
        covered,
        missing,
    }
}

function candidateScore(candidate, project, counts, selectedUsers, weights) {
    const map = userSkillMap(candidate)
    const requiredSkills = project.required_skills || []

    let skillHits = 0
    for (const reqSkill of requiredSkills) {
        const coverage = coverageForUser(reqSkill, map)
        if (coverage?.met) skillHits++
    }

    const skillCoverageScore = requiredSkills.length
        ? Math.round((skillHits / requiredSkills.length) * 100)
        : 50

    const capacityScore = scoreFromCapacity(candidate)
    const workloadScore = scoreFromOpenTaskCount(candidate._id, counts)
    const performanceScore = scoreFromPerformance(candidate)
    const collaborationScore = clamp(
        (sharedProjectCount(candidate, selectedUsers) * 25) + 30,
        30,
        100
    )

    return Math.round(
        (skillCoverageScore * weights.skill) +
        (capacityScore * weights.capacity) +
        (workloadScore * weights.workload) +
        (performanceScore * weights.performance) +
        (collaborationScore * weights.collaboration)
    )
}

function uncoveredSkillBoost(candidate, uncovered) {
    const map = userSkillMap(candidate)
    let boost = 0

    for (const reqSkill of uncovered) {
        const coverage = coverageForUser(reqSkill, map)
        if (coverage?.met) boost++
    }

    return boost
}

function buildRecommendation(project, candidates, tasks, strategyMeta) {
    const taskCounts = openTaskCounts(tasks)
    const selected = []
    const uncovered = [...(project.required_skills || [])]
    const teamSize = estimateTeamSize(project, tasks.length)

    while (selected.length < teamSize) {
        let bestCandidate = null
        let bestScore = -1

        for (const candidate of candidates) {
            if (selected.some(user => user._id.toString() === candidate._id.toString())) continue

            const baseScore = candidateScore(
                candidate,
                project,
                taskCounts,
                selected,
                strategyMeta.weights
            )

            const boost = uncoveredSkillBoost(candidate, uncovered) * 18
            const finalScore = baseScore + boost

            if (finalScore > bestScore) {
                bestScore = finalScore
                bestCandidate = candidate
            }
        }

        if (!bestCandidate) break

        selected.push(bestCandidate)

        for (let i = uncovered.length - 1; i >= 0; i--) {
            const coverage = coverageForUser(uncovered[i], userSkillMap(bestCandidate))
            if (coverage?.met) uncovered.splice(i, 1)
        }

        if (!uncovered.length && selected.length >= Math.min(teamSize, 3)) break
    }

    const coverage = teamCoverage(project, selected)
    const avgCapacity = Math.round(
        average(selected.map(user => Number(user.current_capacity_percentage || 0)))
    )
    const avgPerformance = Math.round(
        average(selected.map(scoreFromPerformance))
    )

    return {
        strategy: strategyMeta.name,
        title: strategyMeta.title,
        justification: strategyMeta.justification,
        team_size: selected.length,
        coverage_pct: coverage.coverage_pct,
        average_capacity_pct: avgCapacity,
        average_performance_score: avgPerformance,
        covered_skills: coverage.covered,
        missing_skills: coverage.missing,
        suggested_team: selected.map(user => ({
            _id: user._id,
            username: user.username,
            role: user.role,
            profile_picture_url: user.profile_picture_url,
            current_capacity_percentage: user.current_capacity_percentage || 0,
            availability_hours_per_week: user.availability_hours_per_week || 40,
            performance_score: scoreFromPerformance(user),
        })),
        score: Math.round(
            (coverage.coverage_pct * 0.55) +
            ((100 - avgCapacity) * 0.20) +
            (avgPerformance * 0.25)
        ),
    }
}

async function getSkillGapAnalysis(projectId) {
    const project = await projectModel
        .findById(projectId)
        .populate('team_members', 'username role skills current_capacity_percentage availability_hours_per_week')

    if (!project) {
        const error = new Error('Project not found')
        error.statusCode = 404
        throw error
    }

    const taxonomy = await skillModel.find().select('name category')
    const requiredSkills = project.required_skills || []
    const report = []

    for (const reqSkill of requiredSkills) {
        const eligibleMembers = []
        const underProficientMembers = []
        const recommendations = []
        const category = inferCategory(reqSkill.skill_name, taxonomy)
        const priority = buildRecommendationPriority(reqSkill, false)

        for (const member of project.team_members || []) {
            const memberSkill = findMatchingMemberSkill(reqSkill, member.skills || [])
            if (!memberSkill) continue

            const memberRank = getRank(memberSkill.proficiency_level)
            const requiredRank = getRank(reqSkill.required_proficiency)
            const meetsRequirement = memberRank >= requiredRank

            const baseEntry = {
                user_id: member._id,
                username: member.username,
                proficiency_level: memberSkill.proficiency_level,
                verified: memberSkill.verified,
                current_capacity_percentage: member.current_capacity_percentage || 0,
                meets_requirement: meetsRequirement,
            }

            if (meetsRequirement) {
                eligibleMembers.push(baseEntry)
            } else {
                underProficientMembers.push(baseEntry)

                const course = buildCourseSuggestion(
                    reqSkill.skill_name,
                    category,
                    reqSkill.required_proficiency
                )

                recommendations.push({
                    type: 'UPSKILL_MEMBER',
                    user_id: member._id,
                    username: member.username,
                    skill_name: reqSkill.skill_name,
                    current_level: memberSkill.proficiency_level,
                    target_level: reqSkill.required_proficiency,
                    reason: `${member.username} has the skill but is below the required proficiency.`,
                    priority: buildRecommendationPriority(reqSkill, true),
                    ...course,
                })
            }
        }

        if (eligibleMembers.length === 0 && underProficientMembers.length === 0) {
            const course = buildCourseSuggestion(
                reqSkill.skill_name,
                category,
                reqSkill.required_proficiency
            )
            recommendations.push({
                type: 'ADD_TEAM_MEMBER',
                skill_name: reqSkill.skill_name,
                target_level: reqSkill.required_proficiency,
                reason: `No current team member covers ${reqSkill.skill_name} at the required level.`,
                priority,
                ...course,
            })
        }

        let status = 'MISSING'
        if (eligibleMembers.length > 0) status = 'COVERED'
        else if (underProficientMembers.length > 0) status = 'UNDER_COVERED'

        report.push({
            skill_id: reqSkill.skill_id,
            skill_name: reqSkill.skill_name,
            required_proficiency: reqSkill.required_proficiency,
            category,
            priority,
            status,
            covered: eligibleMembers.length > 0,
            eligible_members: eligibleMembers,
            under_proficient_members: underProficientMembers,
            recommendations,
        })
    }

    const coveredCount = report.filter(item => item.covered).length
    const missingCount = report.filter(item => !item.covered).length
    const coveragePct = requiredSkills.length > 0
        ? Math.round((coveredCount / requiredSkills.length) * 100)
        : 100

    return {
        project_id: project._id,
        project_name: project.name,
        total_required_skills: requiredSkills.length,
        covered_count: coveredCount,
        missing_count: missingCount,
        coverage_pct: coveragePct,
        report,
    }
}

async function getProjectMatchesForUser(userId) {
    const user = await userModel.findById(userId).select(
        'username email role skills current_capacity_percentage availability_hours_per_week'
    )

    if (!user) {
        const error = new Error('User not found')
        error.statusCode = 404
        throw error
    }

    const projects = await projectModel.find({
        status: { $in: ['PLANNING', 'ACTIVE'] },
        team_members: { $ne: userId },
    }).select(
        'name description status required_skills ai_success_score team_members start_date end_date budget'
    )

    const matches = projects.map(project => {
        const requiredSkills = project.required_skills || []

        if (!requiredSkills.length) {
            return {
                project_id: project._id,
                project_name: project.name,
                description: project.description,
                status: project.status,
                match_score: 0,
                matched_skills: [],
                under_proficient_skills: [],
                missing_skills: [],
                ai_success_score: project.ai_success_score,
                team_size: project.team_members?.length || 0,
                start_date: project.start_date,
                end_date: project.end_date,
                budget: project.budget ?? null,
            }
        }

        const matchedSkills = []
        const underProficientSkills = []
        const missingSkills = []

        for (const reqSkill of requiredSkills) {
            const memberSkill = findMatchingMemberSkill(reqSkill, user.skills || [])

            if (!memberSkill) {
                missingSkills.push({
                    skill_name: reqSkill.skill_name,
                    required_proficiency: reqSkill.required_proficiency,
                })
                continue
            }

            const memberRank = getRank(memberSkill.proficiency_level)
            const requiredRank = getRank(reqSkill.required_proficiency)

            if (memberRank >= requiredRank) {
                matchedSkills.push({
                    skill_name: reqSkill.skill_name,
                    required_proficiency: reqSkill.required_proficiency,
                    user_proficiency: memberSkill.proficiency_level,
                })
            } else {
                underProficientSkills.push({
                    skill_name: reqSkill.skill_name,
                    required_proficiency: reqSkill.required_proficiency,
                    user_proficiency: memberSkill.proficiency_level,
                })
            }
        }

        const weightedCovered = matchedSkills.length + (underProficientSkills.length * 0.5)
        const matchScore = Math.round((weightedCovered / requiredSkills.length) * 100)

        return {
            project_id: project._id,
            project_name: project.name,
            description: project.description,
            status: project.status,
            match_score: matchScore,
            matched_skills: matchedSkills,
            under_proficient_skills: underProficientSkills,
            missing_skills: missingSkills,
            ai_success_score: project.ai_success_score,
            team_size: project.team_members?.length || 0,
            start_date: project.start_date,
            end_date: project.end_date,
            budget: project.budget ?? null,
        }
    })
        .filter(project => project.match_score > 0)
        .sort((a, b) => b.match_score - a.match_score)

    return {
        user_id: user._id,
        username: user.username,
        total_matches: matches.length,
        matches,
    }
}

async function calculatePredictiveAnalytics(projectId) {
    const project = await projectModel
        .findById(projectId)
        .populate('team_members', 'username role skills current_capacity_percentage availability_hours_per_week performance_metrics')

    if (!project) {
        const error = new Error('Project not found')
        error.statusCode = 404
        throw error
    }

    const tasks = await taskModel.find({ project_id: projectId }).select(
        'status due_date assigned_to total_time_minutes'
    )

    const totalTasks = tasks.length
    const doneTasks = tasks.filter(task => task.status === 'DONE').length
    const completionRate = totalTasks > 0
        ? Math.round((doneTasks / totalTasks) * 100)
        : 0

    const overdueTasks = tasks.filter(task =>
        task.due_date &&
        new Date(task.due_date) < new Date() &&
        task.status !== 'DONE'
    ).length

    const overdueRate = totalTasks > 0
        ? Math.round((overdueTasks / totalTasks) * 100)
        : 0

    const members = project.team_members || []
    const avgCapacity = members.length > 0
        ? Math.round(average(members.map(m => Number(m.current_capacity_percentage || 0))))
        : 0

    const capacityHealth = clamp(100 - Math.max(avgCapacity - 60, 0) * 1.6, 0, 100)
    const skillCoverage = calculateSkillCoverage(project, members)
    const timelineHealth = calculateTimelineHealth(project, tasks)
    const milestoneHealth = calculateMilestoneHealth(project)
    const staffingScore = members.length > 0
        ? clamp(members.length * 22, 35, 100)
        : 10

    const rawSuccessScore = clamp(Math.round(
        (completionRate * 0.24) +
        (skillCoverage * 0.23) +
        (capacityHealth * 0.16) +
        (timelineHealth * 0.18) +
        (milestoneHealth * 0.09) +
        (staffingScore * 0.10) -
        (overdueRate * 0.18)
    ), 0, 100)

    const factors = {
        completion_rate: completionRate,
        overdue_rate: overdueRate,
        average_capacity_pct: avgCapacity,
        capacity_health: Math.round(capacityHealth),
        skill_coverage_pct: skillCoverage,
        timeline_health: Math.round(timelineHealth),
        milestone_health: milestoneHealth,
        staffing_score: staffingScore,
    }

    const learning = deriveLearningSignals(project.analytics_history || [], factors, rawSuccessScore)
    const successScore = clamp(rawSuccessScore + learning.adjustment, 0, 100)

    const alerts = []

    if (skillCoverage < 70) {
        alerts.push({
            type: 'SKILL_GAP',
            severity: 'HIGH',
            message: 'Current team does not cover enough of the required skills.',
        })
    }

    if (avgCapacity >= 85) {
        alerts.push({
            type: 'OVERLOAD',
            severity: 'MEDIUM',
            message: 'Average team capacity is high, which raises delivery risk.',
        })
    }

    if (overdueRate >= 20) {
        alerts.push({
            type: 'DEADLINES',
            severity: 'HIGH',
            message: 'A significant share of project tasks is overdue.',
        })
    }

    if (timelineHealth < 50) {
        alerts.push({
            type: 'SCHEDULE',
            severity: 'HIGH',
            message: 'Task completion is lagging behind the project timeline.',
        })
    }

    const suggestedAdjustments = []

    if (skillCoverage < 70) {
        suggestedAdjustments.push('Add or upskill team members for uncovered required skills.')
    }

    if (avgCapacity >= 85) {
        suggestedAdjustments.push('Reassign work from overloaded members or extend the timeline.')
    }

    if (overdueRate >= 20) {
        suggestedAdjustments.push('Review overdue tasks and unblock or redistribute critical work.')
    }

    if (learning.adjustment < 0) {
        suggestedAdjustments.push('Recent historical trend has weakened. Review project trajectory and intervene early.')
    } else if (learning.adjustment > 0) {
        suggestedAdjustments.push('Recent historical trend is improving. Keep the current execution pattern consistent.')
    }

    return {
        project_id: project._id,
        project_name: project.name,
        success_score: successScore,
        raw_success_score: rawSuccessScore,
        learning_adjustment: learning.adjustment,
        trend: learning.trend,
        learning_insights: learning.insights,
        factors,
        alerts,
        suggested_adjustments: suggestedAdjustments,
    }
}

async function recalculateAndPersistProjectSuccessScore(projectId) {
    const analytics = await calculatePredictiveAnalytics(projectId)
    const project = await projectModel.findById(projectId).select('analytics_history')
    const snapshot = buildAnalyticsSnapshotPayload(analytics)

    const nextHistory = [...(project?.analytics_history || [])]
    const lastSnapshot = nextHistory.length ? nextHistory[nextHistory.length - 1] : null

    if (shouldStoreAnalyticsSnapshot(lastSnapshot, snapshot)) {
        nextHistory.push(snapshot)
    }

    const trimmedHistory = nextHistory.slice(-ANALYTICS_HISTORY_LIMIT)

    await projectModel.findByIdAndUpdate(projectId, {
        $set: {
            ai_success_score: analytics.success_score,
            analytics_history: trimmedHistory,
            updated_at: new Date(),
        },
    })

    analytics.trend = buildHistorySummary(trimmedHistory, analytics.success_score)

    return analytics
}

async function refreshProjectAnalytics(projectId) {
    if (!projectId) return null

    try {
        return await recalculateAndPersistProjectSuccessScore(projectId)
    } catch (error) {
        console.error('refreshProjectAnalytics error:', error)
        return null
    }
}

async function suggestTaskAssignees(taskId, options = {}) {
    const { persistSuggestion = true } = options

    const task = await taskModel.findById(taskId)
    if (!task) {
        const error = new Error('Task not found')
        error.statusCode = 404
        throw error
    }

    const project = await projectModel.findById(task.project_id)
    if (!project) {
        const error = new Error('Project not found')
        error.statusCode = 404
        throw error
    }

    const [members, projectTasks] = await Promise.all([
        userModel.find({
            _id: { $in: project.team_members },
        }).select('username role skills current_capacity_percentage availability_hours_per_week performance_metrics profile_picture_url'),
        taskModel.find({ project_id: project._id }).select('assigned_to status'),
    ])

    const openCounts = openTaskCounts(projectTasks)
    const requiredSkills = relevantRequiredSkills(task, project)

    const suggestions = members.map(member => {
        let skillHits = 0

        for (const reqSkill of requiredSkills) {
            const memberSkill = findMatchingMemberSkill(reqSkill, member.skills || [])
            if (!memberSkill) continue

            const memberRank = getRank(memberSkill.proficiency_level)
            const requiredRank = getRank(reqSkill.required_proficiency)

            if (memberRank >= requiredRank) {
                skillHits++
            }
        }

        const skillScore = requiredSkills.length > 0
            ? Math.round((skillHits / requiredSkills.length) * 100)
            : 55

        const capacityScore = scoreFromCapacity(member)
        const workloadScore = scoreFromOpenTaskCount(member._id, openCounts)
        const performanceScore = scoreFromPerformance(member)

        const finalScore = Math.round(
            (skillScore * 0.45) +
            (capacityScore * 0.20) +
            (workloadScore * 0.20) +
            (performanceScore * 0.15)
        )

        const reasons = []
        if (skillHits > 0) reasons.push(`${skillHits} relevant skill match${skillHits > 1 ? 'es' : ''}`)
        reasons.push(`${member.current_capacity_percentage || 0}% current capacity`)
        reasons.push(`${openCounts[member._id.toString()] || 0} active task(s)`)

        return {
            _id: member._id,
            username: member.username,
            profile_picture_url: member.profile_picture_url,
            current_capacity_percentage: member.current_capacity_percentage || 0,
            availability_hours_per_week: member.availability_hours_per_week || 40,
            score: finalScore,
            reasons,
        }
    }).sort((a, b) => b.score - a.score)

    const bestSuggestion = suggestions[0] || null

    if (persistSuggestion) {
        task.ai_suggested_assignee = bestSuggestion?._id || null
        await task.save()
    }

    return {
        task_id: task._id,
        task_title: task.title,
        project_id: project._id,
        best_suggestion: bestSuggestion,
        suggestions: suggestions.slice(0, 3),
    }
}

async function suggestTaskRedistributionForPM(pmId, overloadedUserId) {
    if (!overloadedUserId) {
        const error = new Error('userId is required')
        error.statusCode = 400
        throw error
    }

    const projects = await projectModel
        .find({ created_by: pmId })
        .populate(
            'team_members',
            'username role skills current_capacity_percentage availability_hours_per_week performance_metrics profile_picture_url'
        )

    if (!projects.length) {
        return {
            overloaded_member: null,
            task_moves: [],
        }
    }

    const projectIds = projects.map(project => project._id)
    const projectMap = new Map(projects.map(project => [project._id.toString(), project]))

    const allTasks = await taskModel.find({
        project_id: { $in: projectIds },
        status: { $in: ['TODO', 'IN_PROGRESS', 'IN_REVIEW'] },
    }).select('title description status priority due_date project_id assigned_to created_at')

    const openCounts = openTaskCounts(allTasks)

    let overloadedMember = null
    for (const project of projects) {
        const match = (project.team_members || []).find(member =>
            member._id.toString() === overloadedUserId.toString()
        )
        if (match) {
            overloadedMember = match
            break
        }
    }

    if (!overloadedMember) {
        const error = new Error('Member not found in your project teams')
        error.statusCode = 404
        throw error
    }

    const memberTasks = allTasks
        .filter(task => task.assigned_to?.toString() === overloadedUserId.toString())
        .sort((a, b) => {
            const statusOrder = { TODO: 0, IN_PROGRESS: 1, IN_REVIEW: 2 }
            const priorityOrder = { LOW: 0, MEDIUM: 1, HIGH: 2, URGENT: 3 }

            const statusDelta = statusOrder[a.status] - statusOrder[b.status]
            if (statusDelta !== 0) return statusDelta

            const priorityDelta = priorityOrder[a.priority] - priorityOrder[b.priority]
            if (priorityDelta !== 0) return priorityDelta

            const aDue = a.due_date ? new Date(a.due_date).getTime() : Number.MAX_SAFE_INTEGER
            const bDue = b.due_date ? new Date(b.due_date).getTime() : Number.MAX_SAFE_INTEGER
            return bDue - aDue
        })

    const taskMoves = []

    for (const task of memberTasks) {
        const project = projectMap.get(task.project_id.toString())
        if (!project) continue

        const requiredSkills = relevantRequiredSkills(task, project)
        const candidates = (project.team_members || []).filter(member =>
            member._id.toString() !== overloadedUserId.toString()
        )

        const rankedCandidates = candidates.map(member => {
            let skillHits = 0

            for (const reqSkill of requiredSkills) {
                const memberSkill = findMatchingMemberSkill(reqSkill, member.skills || [])
                if (!memberSkill) continue

                const memberRank = getRank(memberSkill.proficiency_level)
                const requiredRank = getRank(reqSkill.required_proficiency)

                if (memberRank >= requiredRank) {
                    skillHits++
                }
            }

            const skillScore = requiredSkills.length > 0
                ? Math.round((skillHits / requiredSkills.length) * 100)
                : 55

            const capacityScore = scoreFromCapacity(member)
            const workloadScore = scoreFromOpenTaskCount(member._id, openCounts)
            const performanceScore = scoreFromPerformance(member)

            const finalScore = Math.round(
                (skillScore * 0.45) +
                (capacityScore * 0.20) +
                (workloadScore * 0.20) +
                (performanceScore * 0.15)
            )

            const reasons = []
            if (skillHits > 0) reasons.push(`${skillHits} relevant skill match${skillHits > 1 ? 'es' : ''}`)
            reasons.push(`${member.current_capacity_percentage || 0}% current capacity`)
            reasons.push(`${openCounts[member._id.toString()] || 0} active task(s)`)

            return {
                _id: member._id,
                username: member.username,
                profile_picture_url: member.profile_picture_url,
                current_capacity_percentage: member.current_capacity_percentage || 0,
                availability_hours_per_week: member.availability_hours_per_week || 40,
                score: finalScore,
                reasons,
            }
        }).sort((a, b) => b.score - a.score)

        const bestSuggestion = rankedCandidates[0]
        if (!bestSuggestion) continue

        taskMoves.push({
            task: {
                _id: task._id,
                title: task.title,
                status: task.status,
                priority: task.priority,
                due_date: task.due_date,
            },
            project: {
                _id: project._id,
                name: project.name,
            },
            current_assignee: {
                _id: overloadedMember._id,
                username: overloadedMember.username,
                current_capacity_percentage: overloadedMember.current_capacity_percentage || 0,
            },
            suggested_assignee: bestSuggestion,
        })

        if (taskMoves.length >= 3) break
    }

    return {
        overloaded_member: {
            _id: overloadedMember._id,
            username: overloadedMember.username,
            current_capacity_percentage: overloadedMember.current_capacity_percentage || 0,
        },
        task_moves: taskMoves,
    }
}

async function getTeamAssemblyRecommendations(projectId) {
    const [project, users, tasks] = await Promise.all([
        projectModel.findById(projectId),
        userModel.find({
            role: { $in: ['MEMBER', 'PROJECT_MANAGER'] },
        }).select('username email role skills current_capacity_percentage availability_hours_per_week performance_metrics profile_picture_url project_history'),
        taskModel.find({ project_id: projectId }).select('assigned_to status'),
    ])

    if (!project) {
        const error = new Error('Project not found')
        error.statusCode = 404
        throw error
    }

    const candidates = users.filter(user =>
        user._id.toString() !== project.created_by?.toString?.()
    )

    const strategies = [
        {
            name: 'balanced',
            title: 'Balanced Team',
            justification: 'Optimizes skill coverage, workload balance, and delivery consistency.',
            weights: {
                skill: 0.36,
                capacity: 0.18,
                workload: 0.16,
                performance: 0.18,
                collaboration: 0.12,
            },
        },
        {
            name: 'skill_first',
            title: 'Skill-First Team',
            justification: 'Prioritizes maximum skill coverage for complex or specialist projects.',
            weights: {
                skill: 0.48,
                capacity: 0.14,
                workload: 0.10,
                performance: 0.18,
                collaboration: 0.10,
            },
        },
        {
            name: 'availability_first',
            title: 'Availability-First Team',
            justification: 'Prefers lower-load contributors to reduce execution risk and rebalance capacity.',
            weights: {
                skill: 0.26,
                capacity: 0.24,
                workload: 0.22,
                performance: 0.14,
                collaboration: 0.14,
            },
        },
    ]

    const recommendations = strategies
        .map(strategy => buildRecommendation(project, candidates, tasks, strategy))
        .sort((a, b) => b.score - a.score)

    return {
        project_id: project._id,
        project_name: project.name,
        required_skill_count: (project.required_skills || []).length,
        recommendations,
    }
}

function extractBudget(text) {
    const match = text.match(/(?:rs\.?|inr|\$|usd)?\s?(\d[\d,]{2,})/i)
    if (!match) return null

    const parsed = Number(match[1].replace(/,/g, ''))
    return Number.isFinite(parsed) ? parsed : null
}

function extractDuration(text) {
    const match = text.match(/(\d+)\s*(day|week|month)s?/i)
    if (!match) return null

    const value = Number(match[1])
    const unit = match[2].toLowerCase()
    const days = unit === 'month' ? value * 30 : unit === 'week' ? value * 7 : value

    return { value, unit, days }
}

function buildFieldConfidence({ available, score, source, note }) {
    return {
        available,
        score,
        level: score >= 85 ? 'HIGH' : score >= 60 ? 'MEDIUM' : 'LOW',
        source,
        note,
    }
}

function matchTaxonomySkillByName(skillName, taxonomy = []) {
    const normalizedSkillName = normalizeText(skillName)
    if (!normalizedSkillName) return null

    const exact = taxonomy.find(skill => normalizeText(skill.name) === normalizedSkillName)
    if (exact) return exact

    return taxonomy.find(skill => {
        const taxonomyName = normalizeText(skill.name)
        return normalizedSkillName.includes(taxonomyName) || taxonomyName.includes(normalizedSkillName)
    }) || null
}

function normalizeGeminiList(values) {
    if (!Array.isArray(values)) return []

    return values
        .map(value => String(value || '').trim())
        .filter(Boolean)
}

function parseJsonFromGeminiResponse(payload) {
    const text =
        payload?.candidates?.[0]?.content?.parts?.find(part => typeof part?.text === 'string')?.text ||
        payload?.text ||
        ''

    if (!text) {
        const error = new Error('Gemini returned an empty response')
        error.statusCode = 502
        throw error
    }

    const cleaned = text
        .trim()
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim()

    return JSON.parse(cleaned)
}

async function parseProjectBriefWithGemini(briefText, providedName = '') {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return null

    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
    const prompt = [
        'Extract a project brief into structured JSON.',
        'Use only facts supported by the brief text.',
        'If a field is unclear or missing, return null or an empty array instead of guessing.',
        'Keep the description concise and professional.',
        'Milestones should be actionable and short.',
        providedName.trim()
            ? `Preferred project name: ${providedName.trim()}`
            : 'No preferred project name was provided.',
        '',
        'Brief text:',
        briefText,
    ].join('\n')

    const schema = {
        type: 'object',
        additionalProperties: false,
        required: [
            'name',
            'description',
            'budget',
            'suggested_team_size',
            'estimated_duration_days',
            'required_skills',
            'deliverables',
            'milestones',
            'confidence',
        ],
        properties: {
            name: { type: ['string', 'null'], description: 'Best project title extracted from the brief.' },
            description: { type: ['string', 'null'], description: 'A concise 2-4 sentence project summary.' },
            budget: { type: ['number', 'null'], description: 'Budget amount as a plain number if mentioned.' },
            suggested_team_size: { type: ['integer', 'null'], minimum: 1, maximum: 20, description: 'Recommended team size.' },
            estimated_duration_days: { type: ['integer', 'null'], minimum: 1, maximum: 3650, description: 'Estimated total project duration in days.' },
            required_skills: {
                type: 'array',
                description: 'Skills explicitly needed for the project.',
                items: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['skill_name', 'required_proficiency', 'category_hint'],
                    properties: {
                        skill_name: { type: 'string', description: 'Skill name from the brief.' },
                        required_proficiency: {
                            type: 'string',
                            enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'],
                            description: 'Estimated proficiency needed for that skill.',
                        },
                        category_hint: { type: ['string', 'null'], description: 'Optional broad category such as Frontend, Backend, Data, DevOps.' },
                    },
                },
            },
            deliverables: {
                type: 'array',
                items: { type: 'string' },
                description: 'Main deliverables or outputs of the project.',
            },
            milestones: {
                type: 'array',
                items: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['title', 'description'],
                    properties: {
                        title: { type: 'string' },
                        description: { type: 'string' },
                    },
                },
                description: 'Suggested project milestones.',
            },
            confidence: {
                type: 'object',
                additionalProperties: false,
                required: ['overall_score', 'notes'],
                properties: {
                    overall_score: { type: ['integer', 'null'], minimum: 0, maximum: 100 },
                    notes: {
                        type: 'array',
                        items: { type: 'string' },
                    },
                },
            },
        },
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                responseMimeType: 'application/json',
                responseJsonSchema: schema,
                temperature: 0.2,
            },
        }),
    })

    if (!response.ok) {
        const errorText = await response.text()
        const error = new Error(`Gemini request failed: ${response.status} ${errorText}`)
        error.statusCode = response.status
        throw error
    }

    return parseJsonFromGeminiResponse(await response.json())
}

async function parseProjectBriefHeuristic(briefText, providedName = '', taxonomyInput = null) {
    const text = String(briefText || '').trim()

    if (!text) {
        const error = new Error('brief_text is required')
        error.statusCode = 400
        throw error
    }

    const taxonomy = taxonomyInput || await skillModel.find().select('name category')
    const normalized = normalizeText(text)

    const matchedSkills = taxonomy
        .filter(skill =>
            normalizeText(skill.name) &&
            normalized.includes(normalizeText(skill.name))
        )
        .slice(0, 10)

    const duration = extractDuration(text)
    const budget = extractBudget(text)

    const sentences = text
        .split(/[\.\n\r]+/)
        .map(sentence => sentence.trim())
        .filter(Boolean)

    const deliverables = sentences
        .filter(sentence =>
            /(build|develop|deliver|create|implement|launch|design|deploy|dashboard|api|module)/i.test(sentence)
        )
        .slice(0, 5)

    const name =
        providedName.trim() ||
        sentences[0]?.slice(0, 80) ||
        'AI Parsed Project'

    const description = sentences
        .slice(0, 3)
        .join('. ')
        .slice(0, 300)

    const milestoneTitles = deliverables.length
        ? deliverables.map((item, index) => `Milestone ${index + 1}: ${item.slice(0, 60)}`)
        : [
            'Milestone 1: Discovery and planning',
            'Milestone 2: Core implementation',
            'Milestone 3: Validation and launch prep',
        ]

    const suggestedTeamSize = clamp(
        Math.max(
            matchedSkills.length,
            duration?.days ? Math.ceil(duration.days / 14) : 2
        ),
        2,
        7
    )

    const field_confidence = {
        name: buildFieldConfidence({
            available: !!name,
            score: providedName.trim() ? 95 : sentences[0] ? 72 : 30,
            source: providedName.trim() ? 'provided_name' : sentences[0] ? 'first_sentence' : 'fallback',
            note: providedName.trim()
                ? 'Used the project name you provided.'
                : sentences[0]
                    ? 'Derived the name from the opening sentence of the brief.'
                    : 'Used a generic fallback name because the brief did not provide one clearly.',
        }),
        description: buildFieldConfidence({
            available: !!description,
            score: sentences.length >= 2 ? 84 : sentences.length === 1 ? 62 : 28,
            source: 'brief_summary',
            note: sentences.length >= 2
                ? 'Summarized the first few brief sentences into a project description.'
                : 'Description confidence is lower because the brief had limited detail.',
        }),
        budget: buildFieldConfidence({
            available: budget !== null,
            score: budget !== null ? 92 : 22,
            source: budget !== null ? 'currency_pattern' : 'not_detected',
            note: budget !== null
                ? 'Detected a likely budget amount from the uploaded brief.'
                : 'No budget figure was found in the brief.',
        }),
        estimated_duration_days: buildFieldConfidence({
            available: !!duration?.days,
            score: duration?.days ? 90 : 24,
            source: duration?.days ? 'duration_pattern' : 'not_detected',
            note: duration?.days
                ? `Detected a timeline of about ${duration.value} ${duration.unit}${duration.value > 1 ? 's' : ''}.`
                : 'No explicit duration was found in the brief.',
        }),
        required_skills: buildFieldConfidence({
            available: matchedSkills.length > 0,
            score: matchedSkills.length >= 4 ? 90 : matchedSkills.length >= 2 ? 75 : matchedSkills.length === 1 ? 58 : 20,
            source: matchedSkills.length ? 'skill_taxonomy_match' : 'not_detected',
            note: matchedSkills.length
                ? `Matched ${matchedSkills.length} skills against the platform taxonomy.`
                : 'No known skills were confidently matched from the brief text.',
        }),
        milestones: buildFieldConfidence({
            available: milestoneTitles.length > 0,
            score: deliverables.length >= 3 ? 82 : deliverables.length > 0 ? 68 : 52,
            source: deliverables.length ? 'deliverable_sentences' : 'fallback_template',
            note: deliverables.length
                ? 'Milestones were generated from action-oriented deliverables in the brief.'
                : 'Milestones use a fallback delivery template because the brief was less structured.',
        }),
        suggested_team_size: buildFieldConfidence({
            available: true,
            score: matchedSkills.length > 0 || duration?.days ? 70 : 45,
            source: matchedSkills.length && duration?.days ? 'skills_and_duration' : matchedSkills.length ? 'skills_only' : duration?.days ? 'duration_only' : 'fallback',
            note: 'Estimated from the number of matched skills and the expected duration.',
        }),
    }

    const extraction_review = Object.entries(field_confidence).map(([field, cfg]) => ({
        field,
        ...cfg,
    }))

    const overall_confidence = Math.round(
        average(
            Object.values(field_confidence)
                .filter(item => item.available)
                .map(item => item.score)
        ) || 0
    )

    return {
        parsed_project: {
            name,
            description,
            budget,
            suggested_team_size: suggestedTeamSize,
            estimated_duration_days: duration?.days || null,
            required_skills: matchedSkills.map(skill => ({
                skill_id: skill._id,
                skill_name: skill.name,
                required_proficiency: 'INTERMEDIATE',
                category: skill.category,
            })),
            deliverables,
            milestones: milestoneTitles.map(title => ({
                title,
                description: title.replace(/^Milestone \d+:\s*/, ''),
            })),
        },
        confidence: {
            overall_score: overall_confidence,
            overall_level: overall_confidence >= 85 ? 'HIGH' : overall_confidence >= 60 ? 'MEDIUM' : 'LOW',
            field_confidence,
            extraction_review,
        },
        extraction_notes: [
            matchedSkills.length
                ? `Matched ${matchedSkills.length} skill(s) from the skill taxonomy.`
                : 'No taxonomy skills were matched in the brief text.',
            duration
                ? `Detected an estimated duration of ${duration.value} ${duration.unit}${duration.value > 1 ? 's' : ''}.`
                : 'No explicit duration was detected.',
            budget
                ? `Detected a likely budget value of ${budget}.`
                : 'No explicit budget was detected.',
        ],
        parser_engine: 'heuristic',
    }
}

async function parseProjectBrief(briefText, providedName = '') {
    const text = String(briefText || '').trim()

    if (!text) {
        const error = new Error('brief_text is required')
        error.statusCode = 400
        throw error
    }

    const taxonomy = await skillModel.find().select('name category')
    const heuristicResult = await parseProjectBriefHeuristic(text, providedName, taxonomy)

    let geminiResult = null
    try {
        geminiResult = await parseProjectBriefWithGemini(text, providedName)
    } catch (error) {
        console.error('parseProjectBriefWithGemini fallback:', error.message || error)
    }

    if (!geminiResult) {
        return heuristicResult
    }

    const extractedSkills = Array.isArray(geminiResult.required_skills) ? geminiResult.required_skills : []
    const matchedSkills = []
    const seenSkillKeys = new Set()

    for (const skill of extractedSkills) {
        const matched = matchTaxonomySkillByName(skill?.skill_name, taxonomy)
        if (!matched) continue

        const key = matched._id.toString()
        if (seenSkillKeys.has(key)) continue
        seenSkillKeys.add(key)

        matchedSkills.push({
            skill_id: matched._id,
            skill_name: matched.name,
            required_proficiency: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'].includes(skill?.required_proficiency)
                ? skill.required_proficiency
                : 'INTERMEDIATE',
            category: matched.category,
        })
    }

    const heuristicProject = heuristicResult.parsed_project
    const explicitBudget = extractBudget(text)
    const explicitDuration = extractDuration(text)
    const aiName = String(geminiResult.name || '').trim()
    const aiDescription = String(geminiResult.description || '').trim()
    const aiBudget = Number.isFinite(Number(geminiResult.budget)) ? Number(geminiResult.budget) : null
    const aiDuration = Number.isFinite(Number(geminiResult.estimated_duration_days))
        ? clamp(Number(geminiResult.estimated_duration_days), 1, 3650)
        : null
    const aiTeamSize = Number.isFinite(Number(geminiResult.suggested_team_size))
        ? clamp(Number(geminiResult.suggested_team_size), 1, 20)
        : null
    const finalBudget = explicitBudget !== null ? explicitBudget : null
    const finalDurationDays = explicitDuration?.days || null
    const finalTeamSize = aiTeamSize !== null ? aiTeamSize : heuristicProject.suggested_team_size

    const deliverables = normalizeGeminiList(geminiResult.deliverables)
    const milestones = Array.isArray(geminiResult.milestones)
        ? geminiResult.milestones
            .map((milestone, index) => {
                const title = String(milestone?.title || '').trim()
                const description = String(milestone?.description || '').trim()
                if (!title && !description) return null

                return {
                    title: title || `Milestone ${index + 1}`,
                    description: description || title || `Milestone ${index + 1}`,
                }
            })
            .filter(Boolean)
        : []

    const field_confidence = {
        name: buildFieldConfidence({
            available: !!aiName || !!heuristicProject.name,
            score: aiName ? 90 : heuristicResult.confidence.field_confidence.name.score,
            source: aiName ? 'gemini_structured_output' : heuristicResult.confidence.field_confidence.name.source,
            note: aiName
                ? 'Gemini extracted the project title from the brief.'
                : heuristicResult.confidence.field_confidence.name.note,
        }),
        description: buildFieldConfidence({
            available: !!aiDescription || !!heuristicProject.description,
            score: aiDescription ? 88 : heuristicResult.confidence.field_confidence.description.score,
            source: aiDescription ? 'gemini_structured_output' : heuristicResult.confidence.field_confidence.description.source,
            note: aiDescription
                ? 'Gemini generated the project summary from the brief.'
                : heuristicResult.confidence.field_confidence.description.note,
        }),
        budget: buildFieldConfidence({
            available: finalBudget !== null,
            score: finalBudget !== null ? 90 : 22,
            source: finalBudget !== null ? 'explicit_brief_value' : 'not_detected',
            note: finalBudget !== null
                ? 'The brief explicitly includes a budget value.'
                : 'No explicit budget was found in the brief, so this field was left blank.',
        }),
        estimated_duration_days: buildFieldConfidence({
            available: finalDurationDays !== null,
            score: finalDurationDays !== null ? 88 : 24,
            source: finalDurationDays !== null ? 'explicit_brief_value' : 'not_detected',
            note: finalDurationDays !== null
                ? 'The brief explicitly includes a delivery timeline.'
                : 'No explicit duration was found in the brief, so this field was left blank.',
        }),
        required_skills: buildFieldConfidence({
            available: matchedSkills.length > 0 || heuristicProject.required_skills.length > 0,
            score: matchedSkills.length >= 3 ? 90 : matchedSkills.length > 0 ? 78 : heuristicResult.confidence.field_confidence.required_skills.score,
            source: matchedSkills.length ? 'gemini_plus_skill_taxonomy' : heuristicResult.confidence.field_confidence.required_skills.source,
            note: matchedSkills.length
                ? `Gemini extracted skills and ${matchedSkills.length} matched the platform taxonomy.`
                : heuristicResult.confidence.field_confidence.required_skills.note,
        }),
        milestones: buildFieldConfidence({
            available: milestones.length > 0 || heuristicProject.milestones.length > 0,
            score: milestones.length >= 3 ? 86 : milestones.length > 0 ? 72 : heuristicResult.confidence.field_confidence.milestones.score,
            source: milestones.length ? 'gemini_structured_output' : heuristicResult.confidence.field_confidence.milestones.source,
            note: milestones.length
                ? 'Gemini proposed milestone steps based on the brief.'
                : heuristicResult.confidence.field_confidence.milestones.note,
        }),
        suggested_team_size: buildFieldConfidence({
            available: finalTeamSize !== null,
            score: aiTeamSize !== null ? (finalDurationDays !== null || matchedSkills.length >= 2 ? 74 : 62) : heuristicResult.confidence.field_confidence.suggested_team_size.score,
            source: aiTeamSize !== null ? 'scope_estimate' : heuristicResult.confidence.field_confidence.suggested_team_size.source,
            note: aiTeamSize !== null
                ? 'Suggested team size is an estimate based on project scope and extracted skills.'
                : heuristicResult.confidence.field_confidence.suggested_team_size.note,
        }),
    }

    const extraction_review = Object.entries(field_confidence).map(([field, cfg]) => ({
        field,
        ...cfg,
    }))

    const availableScores = Object.values(field_confidence)
        .filter(item => item.available)
        .map(item => item.score)

    const modelConfidence = Number.isFinite(Number(geminiResult.confidence?.overall_score))
        ? clamp(Number(geminiResult.confidence.overall_score), 0, 100)
        : null

    const overallConfidence = modelConfidence !== null
        ? Math.round((modelConfidence + Math.round(average(availableScores) || 0)) / 2)
        : Math.round(average(availableScores) || 0)

    return {
        parsed_project: {
            name: aiName || heuristicProject.name,
            description: aiDescription || heuristicProject.description,
            budget: finalBudget,
            suggested_team_size: finalTeamSize,
            estimated_duration_days: finalDurationDays,
            required_skills: matchedSkills.length ? matchedSkills : heuristicProject.required_skills,
            deliverables: deliverables.length ? deliverables : heuristicProject.deliverables,
            milestones: milestones.length ? milestones : heuristicProject.milestones,
        },
        confidence: {
            overall_score: overallConfidence,
            overall_level: overallConfidence >= 85 ? 'HIGH' : overallConfidence >= 60 ? 'MEDIUM' : 'LOW',
            field_confidence,
            extraction_review,
        },
        extraction_notes: [
            'Parsed with Gemini structured output and validated against the local skill taxonomy.',
            finalBudget !== null
                ? `Detected an explicit budget value of ${finalBudget}.`
                : 'No explicit budget value was detected.',
            finalDurationDays !== null
                ? `Detected an explicit estimated duration of ${finalDurationDays} day(s).`
                : 'No explicit estimated duration was detected.',
            matchedSkills.length
                ? `Matched ${matchedSkills.length} extracted skill(s) to the platform taxonomy.`
                : 'Gemini extracted skills, but none matched the current taxonomy exactly.',
        ],
        parser_engine: 'gemini',
    }
}


module.exports = {
    getSkillGapAnalysis,
    getProjectMatchesForUser,
    calculatePredictiveAnalytics,
    recalculateAndPersistProjectSuccessScore,
    refreshProjectAnalytics,
    suggestTaskAssignees,
    suggestTaskRedistributionForPM,
    getTeamAssemblyRecommendations,
    parseProjectBrief,
    __test__: {
        normalizeText,
        getRank,
        clamp,
        average,
        buildCourseSuggestion,
        buildRecommendationPriority,
        parseJsonFromGeminiResponse,
    },
}

