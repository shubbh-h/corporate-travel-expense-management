const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { jwt: jwtConfig, socketCorsOrigin } = require('../config/env');

let io;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: socketCorsOrigin,
      credentials: true,
    },
  });

  // Authenticate socket connections using the same JWT access token as the REST API
  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(' ')[1];

      if (!token) return next(new Error('Authentication required'));

      const decoded = jwt.verify(token, jwtConfig.secret);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    // Put each user in a private room so we can push targeted notifications,
    // e.g. io.to(userId).emit('notification', payload)
    socket.join(socket.userId);
    console.log(`[socket] User connected: ${socket.userId}`);

    socket.on('disconnect', () => {
      console.log(`[socket] User disconnected: ${socket.userId}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized. Call initSocket(server) first.');
  return io;
};

module.exports = { initSocket, getIO };
