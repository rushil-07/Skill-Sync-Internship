const cookieParser = require('cookie-parser')
const express = require('express')

const authRoutes = require('./routes/auth.routes')
const projectRoutes = require('./routes/project.routes')
const profileRoutes = require('./routes/profile.routes')
const adminRoutes   = require('./routes/admin.routes')
const taskRoutes    = require('./routes/task.routes')
const pmRoutes      = require('./routes/pm.routes')
const milestoneRoutes   = require('./routes/milestone.routes')
const skillRoutes       = require('./routes/skill.routes')
const memberRoutes      = require('./routes/member.routes')
const notifRoutes         = require('./routes/notification.routes')
const aiRoutes = require('./routes/ai.routes')
const searchRoutes = require('./routes/search.routes')
const messageRoutes = require('./routes/message.routes')



const cors = require("cors")

const app = express()

app.use(express.json())
app.use(cookieParser())
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}))

app.use('/api/auth', authRoutes)
app.use('/api/project', projectRoutes)
app.use('/api/profile', profileRoutes)
app.use('/api/admin',   adminRoutes)
app.use('/api/tasks',   taskRoutes)
app.use('/api/pm',      pmRoutes)
app.use('/api/milestones',  milestoneRoutes)
app.use('/api/skills',      skillRoutes)
app.use('/api/member',      memberRoutes)
app.use('/api/notifications', notifRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/search', searchRoutes)
app.use('/api/messages', messageRoutes)



module.exports = app
