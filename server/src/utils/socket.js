import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

const connectedUsers = new Map();

export function initSocket(io) {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication error'));
    try {
      const user = jwt.verify(token, env.jwtSecret);
      socket.user = user;
      return next();
    } catch (error) {
      return next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    const { user } = socket;
    connectedUsers.set(user.id, socket);
    console.log(`🔌 User ${user.id} connected`);

    socket.on('disconnect', () => {
      connectedUsers.delete(user.id);
      console.log(`🔌 User ${user.id} disconnected`);
    });
  });
}

export function emitToUser(userId, event, payload) {
  const socket = connectedUsers.get(userId);
  if (socket) {
    socket.emit(event, payload);
  }
}

export function emitToRole(io, role, event, payload) {
  io.sockets.sockets.forEach((socket) => {
    if (socket.user?.role === role) {
      socket.emit(event, payload);
    }
  });
}
