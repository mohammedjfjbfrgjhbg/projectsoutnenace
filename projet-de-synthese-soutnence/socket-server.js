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
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// onlineUsers map: userId -> socketId
const onlineUsers = new Map();

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('register', (userId) => {
    socket.userId = String(userId);
    onlineUsers.set(String(userId), socket.id);
    console.log(`User ${userId} registered under socket ${socket.id}`);
    
    // Broadcast status to everyone
    io.emit('user_status', { userId: String(userId), status: 'online' });
  });

  socket.on('typing', (data) => {
    // data: { senderId, receiverId, isTyping }
    const receiverSocketId = onlineUsers.get(String(data.receiverId));
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('typing', data);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
      // Broadcast status to everyone
      io.emit('user_status', { userId: socket.userId, status: 'offline' });
    }
  });
});

// Laravel Webhook Endpoint
app.post('/broadcast', (req, res) => {
  const { event, data } = req.body;
  console.log(`Received broadcast event: ${event}`, data);

  if (event === 'message') {
    // Send to receiver
    const receiverSocketId = onlineUsers.get(String(data.receiver_id));
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('message', data);
    }
    // Also send to sender in case they have multiple windows
    const senderSocketId = onlineUsers.get(String(data.sender_id));
    if (senderSocketId && senderSocketId !== receiverSocketId) {
      io.to(senderSocketId).emit('message', data);
    }
  } else if (event === 'message_seen') {
    // data: { sender_id, receiver_id, last_seen_id }
    const senderSocketId = onlineUsers.get(String(data.sender_id));
    if (senderSocketId) {
      io.to(senderSocketId).emit('message_seen', data);
    }
  } else if (event === 'follow_request') {
    // data: { recipient_id, sender_id, sender_name, ... }
    const recipientSocketId = onlineUsers.get(String(data.recipient_id));
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('follow_request', data);
    }
  } else if (event === 'follow_accept') {
    // data: { follower_id, following_id, following_name, ... }
    const followerSocketId = onlineUsers.get(String(data.follower_id));
    if (followerSocketId) {
      io.to(followerSocketId).emit('follow_accept', data);
    }
  } else if (event === 'appointment_new') {
    // data: { recipient_id, sender_id, sender_name, ... }
    const recipientSocketId = onlineUsers.get(String(data.recipient_id));
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('appointment_new', data);
    }
  } else if (event === 'appointment_update') {
    // data: { recipient_id, sender_id, sender_name, ... }
    const recipientSocketId = onlineUsers.get(String(data.recipient_id));
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('appointment_update', data);
    }
  }

  return res.status(200).json({ success: true });
});

// Endpoint to check online status of list of users
app.post('/online-status', (req, res) => {
  const { userIds } = req.body;
  const statusMap = {};
  if (Array.isArray(userIds)) {
    userIds.forEach(id => {
      statusMap[id] = onlineUsers.has(String(id)) ? 'online' : 'offline';
    });
  }
  return res.json(statusMap);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Socket.IO Server running on port ${PORT}`);
});
