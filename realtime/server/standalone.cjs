// Simple Socket.IO gateway with a minimal REST /emit endpoint
// Run: node realtime/server/standalone.cjs

const http = require('http');
const { Server } = require('socket.io');

const PORT = process.env.WS_PORT ? parseInt(process.env.WS_PORT, 10) : 4000;
const API_KEY = process.env.WS_API_KEY || '';
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');

const server = http.createServer(async (req, res) => {
  // Minimal CORS for REST endpoint
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/emit') {
    try {
      const auth = req.headers['authorization'] || '';
      const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
      if (API_KEY && token !== API_KEY) {
        res.statusCode = 401; res.end(JSON.stringify({ ok: false, error: 'Unauthorized' })); return;
      }
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const body = JSON.parse(Buffer.concat(chunks).toString() || '{}');
      const { event, room, payload } = body || {};
      if (!event) { res.statusCode = 400; res.end(JSON.stringify({ ok: false, error: 'Missing event' })); return; }

      if (room) {
        io.to(room).emit(event, payload || {});
      } else {
        io.emit(event, payload || {});
      }
      res.statusCode = 200; res.end(JSON.stringify({ ok: true }));
    } catch (e) {
      res.statusCode = 500; res.end(JSON.stringify({ ok: false, error: e.message }));
    }
    return;
  }

  res.statusCode = 200; res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ ok: true, message: 'Socket.IO gateway running' }));
});

const io = new Server(server, {
  cors: { origin: ALLOWED_ORIGINS, methods: ['GET', 'POST'] },
});

io.on('connection', (socket) => {
  socket.on('join', (room) => {
    if (typeof room === 'string' && room) {
      socket.join(room);
    }
  });
  socket.on('leave', (room) => {
    if (typeof room === 'string' && room) {
      socket.leave(room);
    }
  });
});

server.listen(PORT, () => {
  console.log(`[realtime] Socket.IO gateway listening on :${PORT}`);
});

