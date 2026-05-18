let io = null

const initSocket = (httpServer) => {
    const { Server } = require('socket.io')
    
    io = new Server(httpServer, {
        cors: { 
            origin: process.env.CLIENT_URL || 'http://localhost:5173', 
            credentials: true
        }
    })

    io.on('connection', (socket) => {
        // Client emits 'join' with their userId right after connecting
        socket.on('join', (userId) => {
            if (userId) {
                socket.join(userId.toString())
            }
        })
        socket.on('disconnect', () => {})
    })

    console.log('Socket.io initialized');
    return io
}

// Called from notification.service.js to emit to a specific user
const getIO = () => {
    if (!io) {
        // Not initialized yet - return null silently
        // Notifications are still saved to DB even without socket
        return null
    }
    return io
}

module.exports = { initSocket, getIO }

