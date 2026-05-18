const userModel    = require('../models/user.model')
const skillModel   = require('../models/skill.model')
const jwt          = require('jsonwebtoken')
const bcrypt       = require('bcryptjs')
const crypto       = require('crypto')
const emailService = require('../services/email.service')

// --- POST /api/auth/register --------------------------------------------------
async function registerUser(req, res) {
    try {
        const {
            username, email, password,
            role = 'MEMBER', bio, profile_picture_url,
            availability_hours_per_week, current_capacity_percentage,
            skills = [],
        } = req.body

        if (!username || !email || !password) {
            return res.status(400).json({ message: 'username, email and password are required' })
        }

        const exists = await userModel.findOne({ $or: [{ username }, { email }] })
        if (exists) {
            return res.status(409).json({ message: 'User with this username or email already exists' })
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        // -- Convert skill strings to proper subdocuments -----------------------
        // RegisterPage sends skills as ["React", "Python"] - plain strings
        // We find or create each skill in the taxonomy, then build the subdoc
        const skillDocs = []
        if (Array.isArray(skills) && skills.length > 0) {
            for (const skillName of skills) {
                if (typeof skillName !== 'string' || !skillName.trim()) continue
                // Find or create in taxonomy
                let skill = await skillModel.findOne({
                    name: { $regex: `^${skillName.trim()}$`, $options: 'i' }
                })
                if (!skill) {
                    skill = await skillModel.create({
                        name:     skillName.trim(),
                        category: 'Other',
                        verified: false,
                    })
                }
                // Increment usage count
                await skillModel.findByIdAndUpdate(skill._id, { $inc: { usage_count: 1 } })
                skillDocs.push({
                    skill_id:          skill._id,
                    skill_name:        skill.name,
                    proficiency_level: 'BEGINNER',   // default on registration
                    verified:          false,
                })
            }
        }

        const payload = { username, email, password: hashedPassword, role }
        if (bio)                         payload.bio                         = bio
        if (profile_picture_url)         payload.profile_picture_url         = profile_picture_url
        if (availability_hours_per_week) payload.availability_hours_per_week = availability_hours_per_week
        if (current_capacity_percentage) payload.current_capacity_percentage = current_capacity_percentage
        if (skillDocs.length > 0)        payload.skills                      = skillDocs

        const user = await userModel.create(payload)

        const token = jwt.sign(
            { id: user._id, username: user.username, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        )

        res.cookie('token', token, {
            httpOnly: true,
            maxAge:   24 * 60 * 60 * 1000,
            sameSite: 'lax',
        })

        res.status(201).json({
            message: 'User registered successfully',
            user: { id: user._id, username: user.username, email: user.email, role: user.role },
        })
    } catch (error) {
        console.error('registerUser error:', error)
        if (error.name === 'StrictModeError') {
            return res.status(400).json({ message: `Field not allowed: ${error.message}` })
        }
        res.status(500).json({ message: 'Server error' })
    }
}


// --- POST /api/auth/login -----------------------------------------------------
async function loginUser(req, res) {
    try {
        const { username, email, password } = req.body

        if (!password || (!username && !email)) {
            return res.status(400).json({ message: 'password and username or email are required' })
        }

        const user = await userModel.findOne({ $or: [{ username }, { email }] })
        if (!user) return res.status(404).json({ message: 'Invalid username or email' })

        const isValid = await bcrypt.compare(password, user.password)
        if (!isValid) return res.status(401).json({ message: 'Invalid credentials' })

        const token = jwt.sign(
            { id: user._id, username: user.username, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        )

        res.cookie('token', token, {
            httpOnly: true,
            maxAge:   24 * 60 * 60 * 1000,
            sameSite: 'lax',
        })

        res.status(200).json({
            message: 'User logged in successfully',
            user: { id: user._id, username: user.username, email: user.email, role: user.role },
        })
    } catch (error) {
        console.error('loginUser error:', error)
        res.status(500).json({ message: 'Server error' })
    }
}


// --- POST /api/auth/logout ----------------------------------------------------
async function logoutUser(req, res) {
    res.clearCookie('token', { httpOnly: true, sameSite: 'lax' })
    res.status(200).json({ message: 'Logged out successfully' })
}


// --- POST /api/auth/forgot-password ------------------------------------------
// Body: { email }
// Generates a secure random token, saves it hashed to the user, sends reset email
async function forgotPassword(req, res) {
    try {
        const { email } = req.body
        if (!email) return res.status(400).json({ message: 'email is required' })

        const user = await userModel.findOne({ email: email.toLowerCase().trim() })

        // Always return success - don't reveal if email exists (security best practice)
        if (!user) {
            return res.status(200).json({
                message: 'If an account with that email exists, a reset link has been sent.'
            })
        }

        // Generate a secure random token
        const rawToken    = crypto.randomBytes(32).toString('hex')
        const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex')

        // Save hashed token + 30-minute expiry to user
        user.reset_token        = hashedToken
        user.reset_token_expiry = new Date(Date.now() + 30 * 60 * 1000)  // 30 minutes
        await user.save()

        // Send email with raw token (URL-safe)
        await emailService.sendPasswordResetEmail(user.email, user.username, rawToken)

        res.status(200).json({
            message: 'If an account with that email exists, a reset link has been sent.'
        })
    } catch (error) {
        console.error('forgotPassword error:', error)
        res.status(500).json({ message: 'Failed to send reset email. Please try again.' })
    }
}


// --- POST /api/auth/reset-password -------------------------------------------
// Body: { token, password }
// Validates token, hashes and saves new password, clears reset token
async function resetPassword(req, res) {
    try {
        const { token, password } = req.body

        if (!token || !password) {
            return res.status(400).json({ message: 'token and password are required' })
        }

        if (password.length < 8) {
            return res.status(400).json({ message: 'Password must be at least 8 characters' })
        }

        // Hash incoming token to compare with stored hash
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex')

        // Find user with matching token that hasn't expired
        const user = await userModel.findOne({
            reset_token:        hashedToken,
            reset_token_expiry: { $gt: new Date() },  // expiry is in the future
        })

        if (!user) {
            return res.status(400).json({
                message: 'Reset link is invalid or has expired. Please request a new one.'
            })
        }

        // Hash new password and save
        user.password           = await bcrypt.hash(password, 10)
        user.reset_token        = null
        user.reset_token_expiry = null
        await user.save()

        res.status(200).json({ message: 'Password reset successfully. You can now log in.' })
    } catch (error) {
        console.error('resetPassword error:', error)
        res.status(500).json({ message: 'Server error' })
    }
}


// --- POST /api/auth/verify-token ---------------------------------------------
// Body: { token } - checks if a reset token is still valid before showing the form
async function verifyResetToken(req, res) {
    try {
        const { token } = req.body
        if (!token) return res.status(400).json({ valid: false })

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex')
        const user = await userModel.findOne({
            reset_token:        hashedToken,
            reset_token_expiry: { $gt: new Date() },
        })

        res.status(200).json({ valid: !!user })
    } catch (error) {
        res.status(500).json({ valid: false })
    }
}


module.exports = {
    registerUser,
    loginUser,
    logoutUser,
    forgotPassword,
    resetPassword,
    verifyResetToken,
}