const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log(' Client connected:', socket.id);

  socket.on('join', (userId) => {
    socket.join(`user-${userId}`);
    console.log(` Socket ${socket.id} → user-${userId}`);
  });

  socket.on('join-channel', (channel) => {
    socket.join(channel);
    console.log(`Socket ${socket.id} → channel "${channel}"`);
  });

  socket.on('disconnect', () => {
    console.log(' Client disconnected:', socket.id);
  });
});

app.post('/notify', (req, res) => {
  const { userId, title, message, link } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'userId required' });
  }

  io.to(`user-${userId}`).emit('notification', { title, message, link });
  console.log(`Notification → user-${userId}:`, title);

  res.json({ ok: true });
});

app.post('/notify-many', (req, res) => {
  const { userIds, title, message, link } = req.body;

  if (!Array.isArray(userIds)) {
    return res.status(400).json({ error: 'userIds array required' });
  }

  userIds.forEach((userId) => {
    io.to(`user-${userId}`).emit('notification', { title, message, link });
  });

  console.log(` Notification → ${userIds.length} users:`, title);
  res.json({ ok: true, count: userIds.length });
});

app.post('/broadcast', (req, res) => {
  const { channel, event, data } = req.body;

  if (!channel || !event) {
    return res.status(400).json({ error: 'channel and event required' });
  }

  io.to(channel).emit(event, data || {});
  console.log(` Broadcast [${channel}] ${event}:`, data);

  res.json({ ok: true });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(` WebSocket server running on http://localhost:${PORT}`);
  console.log(`   Endpoints:`);
  console.log(`   - POST /notify        → notify a user`);
  console.log(`   - POST /notify-many   → notify more users`);
  console.log(`   - POST /broadcast     → narrate in channel`);
});

