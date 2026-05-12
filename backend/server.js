require('dotenv').config()
const http     = require('http')
const mongoose = require('mongoose')
const app      = require('./src/app')
const { initSocket } = require('./src/socket')

const PORT  = process.env.PORT      || 5000
const MONGO = process.env.MONGO_URI

if (!MONGO) {
    console.error('ERROR: MONGO_URI is not set in .env')
    process.exit(1)
}

if (!process.env.JWT_SECRET) {
    console.error('ERROR: JWT_SECRET is not set in .env')
    process.exit(1)
}

// Must use http.createServer so Socket.io can share the same port as Express
const server = http.createServer(app)

// Attach Socket.io
initSocket(server)

// Connect MongoDB then start
mongoose
    .connect(MONGO)
    .then(() => {
        console.log('MongoDB connected')
        server.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`)
            console.log(`Socket.io ready on ws://localhost:${PORT}`)
        })
    })
    .catch(err => {
        console.error('MongoDB connection failed:', err.message)
        process.exit(1)
    })