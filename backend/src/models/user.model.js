const mongoose = require('mongoose')

// --- Sub-schemas --------------------------------------------------------------

// SRS 6.3 - UserSkills (embedded as subdoc, references Skill collection)
const userSkillSchema = new mongoose.Schema({
    skill_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'skill',
        required: false,   // not required - existing skills added before taxonomy existed won't have this
    },
    // Denormalized for performance - avoids populate on every profile load
    skill_name: {
        type: String,
        required: true,
        trim: true,
    },
    proficiency_level: {
        type: String,
        enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'],
        required: true,
    },
    verified: {
        type: Boolean,
        default: false,
    },
    last_used: {
        type: Date,
        default: null,
    },
}, { _id: true })


const recommendationProgressLogSchema = new mongoose.Schema({
    status: {
        type: String,
        enum: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'],
        default: 'NOT_STARTED',
    },
    progress_pct: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
    },
    note: {
        type: String,
        trim: true,
        default: '',
    },
    updated_at: {
        type: Date,
        default: Date.now,
    },
}, { _id: true })

// Learning Recommendations
const learningRecommendationSchema = new mongoose.Schema({
    skill_name:    { type: String, required: true },
    current_level: { type: String, enum: ['NONE', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED'], default: 'NONE' },
    target_level:  { type: String, enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'], required: true },
    reason:        { type: String },
    course_name:   { type: String },
    course_url:    { type: String },
    priority:      { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'MEDIUM' },
    status:        { type: String, enum: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'], default: 'NOT_STARTED' },
    progress_pct:  { type: Number, min: 0, max: 100, default: 0 },
    last_updated_at:{ type: Date, default: Date.now },
    progress_log:  { type: [recommendationProgressLogSchema], default: [] },
    created_at:    { type: Date, default: Date.now },
}, { _id: true })


// Activity Feed
const activitySchema = new mongoose.Schema({
    action:      { type: String, required: true },
    target:      { type: String, required: true },
    target_type: { type: String, enum: ['TASK', 'PROJECT', 'SKILL', 'COMMENT', 'SYSTEM'], default: 'SYSTEM' },
    target_id:   { type: mongoose.Schema.Types.ObjectId, default: null },
    created_at:  { type: Date, default: Date.now },
}, { _id: true })

const pmAlertResponseSchema = new mongoose.Schema({
    alert_key: {
        type: String,
        required: true,
        trim: true,
    },
    action: {
        type: String,
        enum: ['DISMISSED', 'ACTION_TAKEN'],
        required: true,
    },
    alert_type: {
        type: String,
        required: true,
        trim: true,
    },
    message: {
        type: String,
        required: true,
        trim: true,
    },
    project_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'project',
        default: null,
    },
    member_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        default: null,
    },
    responded_at: {
        type: Date,
        default: Date.now,
    },
}, { _id: true })


// Performance Metrics
const performanceMetricsSchema = new mongoose.Schema({
    on_time_delivery_rate: { type: Number, min: 0, max: 100, default: 0 },
    collaboration_score:   { type: Number, min: 0, max: 100, default: 0 },
    tasks_completed:       { type: Number, default: 0 },
    tasks_overdue:         { type: Number, default: 0 },
    last_calculated:       { type: Date, default: Date.now },
}, { _id: false })

const notificationPreferencesSchema = new mongoose.Schema({
    TASK_ASSIGNED:    { type: Boolean, default: true },
    MENTION:          { type: Boolean, default: true },
    COMMENT:          { type: Boolean, default: true },
    DEADLINE:         { type: Boolean, default: true },
    STATUS_CHANGED:   { type: Boolean, default: true },
    PROJECT_JOINED:   { type: Boolean, default: true },
    ALERT:            { type: Boolean, default: true },
    PROJECT_MATCH:    { type: Boolean, default: true },
    PROJECT_INTEREST: { type: Boolean, default: true },
    PROJECT_CHAT:     { type: Boolean, default: true },
}, { _id: false })


// --- Main User Schema ---------------------------------------------------------
const userSchema = new mongoose.Schema({

    // -- Personal Info --
    username: { type: String, required: true, unique: true, trim: true },
    email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: {
        type: String,
        enum: ['ADMIN', 'PROJECT_MANAGER', 'MEMBER'],
        default: 'MEMBER',
    },
    bio:                 { type: String, trim: true },
    profile_picture_url: { type: String },

    // -- Availability --
    availability_hours_per_week:  { type: Number, default: 40, min: 0, max: 80 },
    current_capacity_percentage:  { type: Number, min: 0, max: 100, default: 0 },

    // -- Skills - now references Skill collection ------------------------------
    // Each entry links to a canonical skill in the skills collection
    // skill_name is denormalized so profiles load fast without populating
    skills: {
        type: [userSkillSchema],
        default: [],
    },

    // -- Project History --
    project_history: [{
        project_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'project' },
        role_in_project: { type: String },
        status:          { type: String, enum: ['ONGOING', 'COMPLETED'], default: 'ONGOING' },
        joined_at:       { type: Date, default: Date.now },
        completed_at:    { type: Date, default: null },
    }],

    // -- Performance Metrics --
    performance_metrics: { type: performanceMetricsSchema, default: () => ({}) },

    // -- Learning Recommendations --
    learning_recommendations: { type: [learningRecommendationSchema], default: [] },

    // -- Activity Feed --
    activity_feed: { type: [activitySchema], default: [] },
    pm_alert_responses: { type: [pmAlertResponseSchema], default: [] },
    notification_preferences: { type: notificationPreferencesSchema, default: () => ({}) },

    // -- Password Reset --------------------------------------------------------
    reset_token:        { type: String, default: null },
    reset_token_expiry: { type: Date,   default: null },

}, {
    strict: 'throw',
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
})

// Indexes
userSchema.index({ role: 1 })

// Helper: log activity
userSchema.methods.logActivity = function (action, target, target_type = 'SYSTEM', target_id = null) {
    this.activity_feed.unshift({ action, target, target_type, target_id })
    if (this.activity_feed.length > 50) this.activity_feed = this.activity_feed.slice(0, 50)
}

const userModel = mongoose.model('user', userSchema)
module.exports = userModel
