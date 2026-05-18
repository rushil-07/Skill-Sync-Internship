const mongoose = require('mongoose')

// --- Sub-schemas --------------------------------------------------------------

// SRS 4.5 - Subtasks
const subtaskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    completed: {
        type: Boolean,
        default: false,
    },
    completed_at: {
        type: Date,
        default: null,
    },
}, { _id: true })


// SRS 4.5 - Comments (thread-based with @mentions)
const commentSchema = new mongoose.Schema({
    author: {
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
    updated_at: {
        type: Date,
        default: null,
    },
    edited: {
        type: Boolean,
        default: false,
    }
}, { _id: true })


// SRS 4.5 - Time tracking entries
const timeEntrySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true,
    },
    start_time: {
        type: Date,
        required: true,
    },
    end_time: {
        type: Date,
        default: null,   // null = timer still running
    },
    duration_minutes: {
        type: Number,
        default: 0,       // calculated when timer stops
    },
    note: {
        type: String,
        trim: true,
    }
}, { _id: true })


// SRS 4.5 - Task history (audit trail of all changes)
const historySchema = new mongoose.Schema({
    changed_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true,
    },
    field: {
        type: String,
        required: true,   // e.g. 'status', 'assigned_to', 'priority'
    },
    old_value: {
        type: mongoose.Schema.Types.Mixed,
    },
    new_value: {
        type: mongoose.Schema.Types.Mixed,
    },
    changed_at: {
        type: Date,
        default: Date.now,
    }
}, { _id: true })


// --- Main Task Schema ---------------------------------------------------------
const taskSchema = new mongoose.Schema({

    // -- Core fields (SRS 4.5) --
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },

    // Which project this task belongs to
    project_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'project',
        required: true,
    },

    // Who created this task (PM)
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true,
    },

    // Who the task is assigned to
    assigned_to: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        default: null,
    },

    // SRS 4.5 - Status: To Do -> In Progress -> In Review -> Done
    status: {
        type: String,
        enum: ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'],
        default: 'TODO',
    },

    // SRS 4.5 - Priority
    priority: {
        type: String,
        enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
        default: 'MEDIUM',
    },

    due_date: {
        type: Date,
        default: null,
    },

    // SRS 4.5 - Task Dependencies
    // Tasks that must be DONE before this task can start
    dependencies: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'task',
    }],

    // SRS 4.5 - Subtasks
    subtasks: {
        type: [subtaskSchema],
        default: [],
    },

    // SRS 4.5 - Comments (thread-based)
    comments: {
        type: [commentSchema],
        default: [],
    },

    // SRS 4.5 - Time Tracking
    time_entries: {
        type: [timeEntrySchema],
        default: [],
    },

    // Computed total minutes from all time entries
    total_time_minutes: {
        type: Number,
        default: 0,
    },

    // Is a timer currently running for this task?
    active_timer: {
        user:       { type: mongoose.Schema.Types.ObjectId, ref: 'user', default: null },
        started_at: { type: Date, default: null },
    },

    // SRS 4.5 - File Attachments (actual files stored in ImageKit)
    attachments: [{
        file_id:    { type: String },
        name:       { type: String, required: true },
        url:        { type: String, required: true },
        thumbnail_url: { type: String, default: null },
        type:       { type: String },              // mime type e.g. 'image/png', 'application/pdf'
        size_bytes: { type: Number },
        imagekit_path: { type: String },
        uploaded_by:{ type: mongoose.Schema.Types.ObjectId, ref: 'user' },
        uploaded_at:{ type: Date, default: Date.now },
    }],

    // SRS 4.5 - Task History (audit trail)
    history: {
        type: [historySchema],
        default: [],
    },

    // AI-suggested task (from 4.4.3 Dynamic Task Auto-Assignment)
    ai_suggested_assignee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        default: null,
    },

}, {
    strict: 'throw',
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    }
})


// --- Indexes ------------------------------------------------------------------
taskSchema.index({ project_id: 1 })            // fetch all tasks for a project fast
taskSchema.index({ assigned_to: 1 })           // fetch tasks assigned to a user fast
taskSchema.index({ status: 1 })
taskSchema.index({ project_id: 1, status: 1 }) // kanban board query


// --- Helper: log a history entry ----------------------------------------------
taskSchema.methods.logHistory = function (userId, field, oldValue, newValue) {
    this.history.push({
        changed_by: userId,
        field,
        old_value:  oldValue,
        new_value:  newValue,
    })
}


const taskModel = mongoose.model('task', taskSchema)

module.exports = taskModel
