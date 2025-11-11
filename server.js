require('dotenv').config();
const WebSocket = require('ws');
const http = require('http');
const path = require('path');
const fs = require('fs');

const PORT = process.env.PORT || 10000;


const options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
};

const server = http.createServer((req, res) => {
  const filePath = path.join(__dirname, 'public', req.url === '/' ? 'index.html' : req.url);
  const extname = path.extname(filePath);

  let contentType = 'text/html';
  switch (extname) {
    case '.js':
      contentType = 'text/javascript';
      break;
    case '.css':
      contentType = 'text/css';
      break;
    case '.json':
      contentType = 'application/json';
      break;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('File not found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Server error');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

const wss = new WebSocket.Server({ server });

const rooms = new Map();

wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('Received:', data.type);

      switch (data.type) {
        case 'join-room':
          handleJoinRoom(ws, data);
          break;
        case 'offer':
        case 'answer':
        case 'ice-candidate':
          handleSignalingMessage(ws, data);
          break;
        case 'leave-room':
          handleLeaveRoom(ws, data);
          break;
        default:
          console.log('Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('Error parsing message:', error);
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    handleClientDisconnect(ws);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

function handleJoinRoom(ws, data) {
  const { roomId, userId } = data;

  if (!roomId || !userId) {
    ws.send(JSON.stringify({ type: 'error', message: 'Room ID and User ID required' }));
    return;
  }

  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Map());
  }

  const room = rooms.get(roomId);

  if (room.size >= 2) {
    ws.send(JSON.stringify({ type: 'error', message: 'Room is full' }));
    return;
  }

  ws.roomId = roomId;
  ws.userId = userId;
  room.set(userId, ws);

  ws.send(JSON.stringify({
    type: 'joined-room',
    roomId,
    userId,
    participants: Array.from(room.keys()).filter(id => id !== userId)
  }));

  room.forEach((client, clientId) => {
    if (clientId !== userId && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'user-joined',
        userId
      }));
    }
  });

  console.log(`User ${userId} joined room ${roomId}. Room size: ${room.size}`);
}

function handleSignalingMessage(ws, data) {
  const { roomId, targetUserId } = data;

  if (!roomId || !ws.roomId || ws.roomId !== roomId) {
    ws.send(JSON.stringify({ type: 'error', message: 'Invalid room' }));
    return;
  }

  const room = rooms.get(roomId);
  if (!room) {
    ws.send(JSON.stringify({ type: 'error', message: 'Room not found' }));
    return;
  }

  if (targetUserId) {
    const targetClient = room.get(targetUserId);
    if (targetClient && targetClient.readyState === WebSocket.OPEN) {
      targetClient.send(JSON.stringify({
        ...data,
        fromUserId: ws.userId
      }));
    }
  } else {
    room.forEach((client, clientId) => {
      if (clientId !== ws.userId && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          ...data,
          fromUserId: ws.userId
        }));
      }
    });
  }
}

function handleLeaveRoom(ws, data) {
  if (ws.roomId && ws.userId) {
    const room = rooms.get(ws.roomId);
    if (room) {
      room.delete(ws.userId);

      room.forEach((client, clientId) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'user-left',
            userId: ws.userId
          }));
        }
      });

      if (room.size === 0) {
        rooms.delete(ws.roomId);
      }

      console.log(`User ${ws.userId} left room ${ws.roomId}`);
    }
  }

  ws.roomId = null;
  ws.userId = null;
}

function handleClientDisconnect(ws) {
  handleLeaveRoom(ws, {});
}

if (require.main === module) {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`WebRTC signaling server running on port ${PORT}`);
    console.log(`HTTP server serving static files from ./public`);
    console.log(`Access from other devices: https://[YOUR_IP]:${PORT}`);
  });
}

module.exports = { server, wss, rooms };