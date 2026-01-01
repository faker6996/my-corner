"use client";

import { io, Socket } from "socket.io-client";
import type { ClientSocketConfig } from '../types';

let socket: Socket | null = null;

export function getSocket(config?: ClientSocketConfig): Socket {
  if (socket) return socket;

  const url = config?.url ||
    process.env.NEXT_PUBLIC_WS_URL ||
    process.env.WS_URL ||
    "http://localhost:4000";

  socket = io(url, {
    transports: config?.transports as any[] || ["websocket"],
    autoConnect: config?.autoConnect ?? true,
    withCredentials: config?.withCredentials ?? false
  });

  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

