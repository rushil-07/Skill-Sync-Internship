const mongoose = require('mongoose')

// --- SRS 6.2 - Skills Table ---------------------------------------------------
// Central skill taxonomy - managed by Admin
// All user skills and project required_skills reference this collection

const skillSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,       // "React", "Python", "Project Management" - globally unique
        trim: true,
    },
    category: {
        type: String,
        enum: [
            'Frontend',
            'Backend',
            'Mobile',
            'DevOps',
            'Data & AI',
            'Design',
            'Management',
            'Soft Skills',
            'QA & Testing',
            'Other',
        ],
        default: 'Other',
    },
    description: {
        type: String,
        trim: true,
    },
    verified: {
        type: Boolean,
        default: false,     // Admin can mark skills as "official" taxonomy entries
    },
    usage_count: {
        type: Number,
        default: 0,         // how many users have this skill - updated on add/remove
    },
}, {
    strict: 'throw',
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    }
})

// Indexes for fast search
skillSchema.index({ name: 'text' })           // full-text search
skillSchema.index({ category: 1 })
skillSchema.index({ verified: 1 })
skillSchema.index({ usage_count: -1 })        // sort by popularity

const skillModel = mongoose.model('skill', skillSchema)

module.exports = skillModel