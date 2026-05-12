const mongoose = require('mongoose')

// ─── Milestone sub-schema ─────────────────────────────────────────────────────
const milestoneSchema = new mongoose.Schema({
    title:       { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    due_date:    { type: Date, required: true },
    status:      { type: String, enum: ['PENDING', 'COMPLETED', 'MISSED'], default: 'PENDING' },
    completed_at: { type: Date, default: null },
    linked_tasks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'task' }],
    created_at:   { type: Date, default: Date.now },
}, { _id: true })


// ─── Required Skill sub-schema ────────────────────────────────────────────────
// SRS 4.3 — "Required Skills: Array of skills with required proficiency levels"
const requiredSkillSchema = new mongoose.Schema({
    skill_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'skill', required: true },
    skill_name: { type: String, required: true, trim: true },     // denormalized for fast display
    required_proficiency: {
        type: String,
        enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'],
        default: 'INTERMEDIATE',
    },
}, { _id: true })

const interestedMemberSchema = new mongoose.Schema({
    user_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    expressed_at: { type: Date, default: Date.now },
}, { _id: false })

const projectChatMessageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true,
    },
    content: {
        type: String,
        required: true,
        trim: true,
    },
    mentions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
    }],
    created_at: {
        type: Date,
        default: Date.now,
    },
}, { _id: true })

const analyticsSnapshotSchema = new mongoose.Schema({
    captured_at: { type: Date, default: Date.now },
    success_score: { type: Number, min: 0, max: 100, required: true },
    raw_success_score: { type: Number, min: 0, max: 100, required: true },
    history_adjustment: { type: Number, default: 0 },
    factors: {
        completion_rate: { type: Number, min: 0, max: 100, default: 0 },
        overdue_rate: { type: Number, min: 0, max: 100, default: 0 },
        average_capacity_pct: { type: Number, min: 0, max: 100, default: 0 },
        capacity_health: { type: Number, min: 0, max: 100, default: 0 },
        skill_coverage_pct: { type: Number, min: 0, max: 100, default: 0 },
        timeline_health: { type: Number, min: 0, max: 100, default: 0 },
        milestone_health: { type: Number, min: 0, max: 100, default: 0 },
        staffing_score: { type: Number, min: 0, max: 100, default: 0 },
    },
}, { _id: true })


// ─── Main Project Schema ──────────────────────────────────────────────────────
const projectSchema = new mongoose.Schema({
    name:        { type: String, required: true },
    description: { type: String },
    status:      { type: String, enum: ['PLANNING', 'ACTIVE', 'COMPLETED', 'ON_HOLD'], default: 'PLANNING' },
    task_assignment_mode: {
        type: String,
        enum: ['MANUAL_APPROVAL', 'AUTO_ASSIGN_TOP_MATCH'],
        default: 'MANUAL_APPROVAL',
    },
    start_date:  { type: Date },
    end_date:    { type: Date },
    budget:      { type: Number },
    created_by:  { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
    ai_success_score: { type: Number, min: 0, max: 100, default: null },

    // ── FIXED: was [ObjectId], now [{skill_id, skill_name, required_proficiency}] ──
    required_skills: { type: [requiredSkillSchema], default: [] },

    project_manager: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
    team_members:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'user' }],
    interested_members: { type: [interestedMemberSchema], default: [] },
    chat_messages:   { type: [projectChatMessageSchema], default: [] },
    analytics_history: { type: [analyticsSnapshotSchema], default: [] },
    milestones:      { type: [milestoneSchema], default: [] },
    created_at:      { type: Date, default: Date.now },
    updated_at:      { type: Date, default: Date.now },
}, { strict: 'throw' })

const projectModel = mongoose.model('project', projectSchema)
module.exports = projectModel
