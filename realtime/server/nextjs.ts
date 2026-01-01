import { Server as IOServer } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import type { SocketConfig } from '../types';

let io: IOServer | null = null;

export function initializeSocketIO(httpServer: HTTPServer, config?: SocketConfig): IOServer {
  if (io) {
    return io;
  }

  const allowedOrigins = config?.allowedOrigins || [
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ];

  io = new IOServer(httpServer, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
      credentials: config?.corsEnabled ?? true
    },
    transports: ['websocket', 'polling']
  });

  io.on('connection', (socket) => {

    // Handle user room joining
    socket.on('join', (room: string) => {
      socket.join(room);
    });

    // Handle user room leaving
    socket.on('leave', (room: string) => {
      socket.leave(room);
    });

    socket.on('disconnect', (reason) => {
    });

    // Handle ping/pong for connection health
    socket.on('ping', () => {
      socket.emit('pong');
    });
  });

  return io;
}

export function getServerSocketIO(): IOServer | null {
  return io;
}

export function emitToUser(userId: string | number, event: string, data: any) {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
}

export function emitToAll(event: string, data: any) {
  if (io) {
    io.emit(event, data);
  }
}

export function getConnectedSockets() {
  if (!io) return [];
  return Array.from(io.sockets.sockets.keys());
}

export function getRoomSockets(room: string) {
  if (!io) return [];
  const sockets = io.sockets.adapter.rooms.get(room);
  return sockets ? Array.from(sockets) : [];
}