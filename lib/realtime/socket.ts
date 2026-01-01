"use client";

import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (socket) return socket;
  const url = process.env.NEXT_PUBLIC_WS_URL || process.env.WS_URL || "http://localhost:4000";
  socket = io(url, { transports: ["websocket"], autoConnect: true, withCredentials: false });
  return socket;
}

