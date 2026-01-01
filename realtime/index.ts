// Server exports
export {
  initializeSocketIO,
  getServerSocketIO,
  emitToUser,
  emitToAll,
  getConnectedSockets,
  getRoomSockets
} from './server/nextjs';

// Client exports
export {
  getSocket,
  disconnectSocket
} from './client/socket';


// Types exports
export type {
  SocketRoom,
  SocketEvent,
  EmitEventRequest,
  EmitEventResponse,
  SocketConfig,
  ClientSocketConfig
} from './types';

// Re-export for backward compatibility
export { initializeSocketIO as initServerSocket } from './server/nextjs';
export { getSocket as getClientSocket } from './client/socket';