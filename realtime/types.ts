export interface SocketRoom {
  userId: string | number;
  room: string;
}

export interface SocketEvent {
  event: string;
  room?: string;
  payload?: any;
}

export interface EmitEventRequest {
  event: string;
  room?: string;
  payload?: any;
}

export interface EmitEventResponse {
  ok: boolean;
  error?: string;
}

export interface FallbackJobEvent {
  jobId: number;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  result_url?: string;
  error?: string;
}

export interface VideoJobEvent {
  jobId: string;
  taskId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  mode: 'client' | 'server';
  timestamp: number;
}

export interface SocketConfig {
  port?: number;
  apiKey?: string;
  allowedOrigins?: string[];
  corsEnabled?: boolean;
}

export interface ClientSocketConfig {
  url?: string;
  autoConnect?: boolean;
  withCredentials?: boolean;
  transports?: string[];
}