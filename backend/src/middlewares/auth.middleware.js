const jwt = require('jsonwebtoken')

function verifyToken(req) {
    const token = req.cookies?.token
    if (!token) return null
    try {
        return jwt.verify(token, process.env.JWT_SECRET)
    } catch {
        return null
    }
}

async function authUser(req, res, next) {
    const decoded = verifyToken(req)
    if (!decoded) return res.status(401).json({ message: 'Unauthorized' })
    req.user = decoded
    next()
}

async function authProjectManager(req, res, next) {
    const decoded = verifyToken(req)
    if (!decoded) return res.status(401).json({ message: 'Unauthorized' })
    if (decoded.role !== 'PROJECT_MANAGER' && decoded.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Access denied' })
    }
    req.user = decoded
    next()
}

async function authAdmin(req, res, next) {
    const decoded = verifyToken(req)
    if (!decoded) return res.status(401).json({ message: 'Unauthorized' })
    if (decoded.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Access denied' })
    }
    req.user = decoded
    next()
}

const authPMOrAdmin = authProjectManager

module.exports = { authUser, authProjectManager, authAdmin, authPMOrAdmin }