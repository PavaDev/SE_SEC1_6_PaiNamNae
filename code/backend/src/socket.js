const { Server } = require('socket.io');
const { verifyToken } = require('./utils/jwt');

let io;

/**
 * Initialize Socket.IO server
 * @param {import('http').Server} httpServer
 * @param {object} corsOptions
 */
function initSocket(httpServer, corsOptions) {
    io = new Server(httpServer, {
        cors: {
            origin: corsOptions.origin,
            credentials: true,
            methods: ['GET', 'POST'],
        },
    });

    // Middleware: verify JWT on connection
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token;
        if (!token) {
            return next(new Error('Authentication required'));
        }
        try {
            const decoded = verifyToken(token);
            socket.userId = decoded.sub;
            socket.userRole = decoded.role;
            next();
        } catch (err) {
            next(new Error('Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`🔌 Socket connected: ${socket.id} (user: ${socket.userId})`);

        // Join personal room for targeted events
        socket.join(`user:${socket.userId}`);

        // Auto-join admins room if user is ADMIN
        if (socket.userRole === 'ADMIN') {
            socket.join('admins');
        }

        // Join/leave the public trips room (for /findTrip page)
        socket.on('join-trips', () => {
            socket.join('trips');
        });

        socket.on('leave-trips', () => {
            socket.leave('trips');
        });

        socket.on('disconnect', (reason) => {
            console.log(`🔌 Socket disconnected: ${socket.id} (${reason})`);
        });
    });

    return io;
}

/**
 * Get the Socket.IO instance (call after initSocket)
 * @returns {Server}
 */
function getIO() {
    if (!io) {
        throw new Error('Socket.IO not initialized — call initSocket first');
    }
    return io;
}

module.exports = { initSocket, getIO };
