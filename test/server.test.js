const { expect } = require('chai');
const WebSocket = require('ws');
const http = require('http');

describe('WebRTC Signaling Server', () => {
  let server, wss, port;

  before((done) => {
    process.env.PORT = 0; // Use random available port
    const serverModule = require('../server.js');
    server = serverModule.server;
    wss = serverModule.wss;

    server.listen(() => {
      port = server.address().port;
      done();
    });
  });

  after((done) => {
    server.close(done);
  });

  describe('HTTP Server', () => {
    it('should respond to GET /', (done) => {
      const options = {
        hostname: 'localhost',
        port: port,
        path: '/',
        method: 'GET'
      };

      const req = http.request(options, (res) => {
        expect(res.statusCode).to.equal(404); // Expected since public/index.html doesn't exist yet
        done();
      });

      req.on('error', done);
      req.end();
    });
  });

  describe('WebSocket Server', () => {
    let ws1, ws2;

    afterEach(() => {
      if (ws1 && ws1.readyState === WebSocket.OPEN) {
        ws1.close();
      }
      if (ws2 && ws2.readyState === WebSocket.OPEN) {
        ws2.close();
      }
    });

    it('should accept WebSocket connections', (done) => {
      ws1 = new WebSocket(`ws://localhost:${port}`);

      ws1.on('open', () => {
        expect(ws1.readyState).to.equal(WebSocket.OPEN);
        done();
      });

      ws1.on('error', done);
    });

    it('should handle join-room messages', (done) => {
      ws1 = new WebSocket(`ws://localhost:${port}`);

      ws1.on('open', () => {
        ws1.send(JSON.stringify({
          type: 'join-room',
          roomId: 'test-room',
          userId: 'user1'
        }));
      });

      ws1.on('message', (data) => {
        const message = JSON.parse(data);
        if (message.type === 'joined-room') {
          expect(message.roomId).to.equal('test-room');
          expect(message.userId).to.equal('user1');
          expect(message.participants).to.be.an('array');
          done();
        }
      });

      ws1.on('error', done);
    });

    it('should notify other users when someone joins a room', (done) => {
      let messagesReceived = 0;

      ws1 = new WebSocket(`ws://localhost:${port}`);
      ws2 = new WebSocket(`ws://localhost:${port}`);

      ws1.on('open', () => {
        ws1.send(JSON.stringify({
          type: 'join-room',
          roomId: 'test-room',
          userId: 'user1'
        }));
      });

      ws1.on('message', (data) => {
        const message = JSON.parse(data);
        if (message.type === 'joined-room') {
          messagesReceived++;

          // After user1 joins, have user2 join
          ws2.send(JSON.stringify({
            type: 'join-room',
            roomId: 'test-room',
            userId: 'user2'
          }));
        } else if (message.type === 'user-joined' && message.userId === 'user2') {
          messagesReceived++;
          if (messagesReceived === 3) done(); // user1 joined, user2 joined, user1 notified
        }
      });

      ws2.on('open', () => {
        // Wait for ws1 to join first
      });

      ws2.on('message', (data) => {
        const message = JSON.parse(data);
        if (message.type === 'joined-room') {
          messagesReceived++;
          if (messagesReceived === 3) done();
        }
      });

      ws1.on('error', done);
      ws2.on('error', done);
    });

    it('should reject joining full rooms', (done) => {
      let ws3;

      ws1 = new WebSocket(`ws://localhost:${port}`);
      ws2 = new WebSocket(`ws://localhost:${port}`);

      Promise.all([
        new Promise(resolve => ws1.on('open', resolve)),
        new Promise(resolve => ws2.on('open', resolve))
      ]).then(() => {
        // Fill the room with 2 users
        ws1.send(JSON.stringify({
          type: 'join-room',
          roomId: 'full-room',
          userId: 'user1'
        }));

        ws2.send(JSON.stringify({
          type: 'join-room',
          roomId: 'full-room',
          userId: 'user2'
        }));

        // Try to add a third user
        setTimeout(() => {
          ws3 = new WebSocket(`ws://localhost:${port}`);

          ws3.on('open', () => {
            ws3.send(JSON.stringify({
              type: 'join-room',
              roomId: 'full-room',
              userId: 'user3'
            }));
          });

          ws3.on('message', (data) => {
            const message = JSON.parse(data);
            if (message.type === 'error' && message.message === 'Room is full') {
              ws3.close();
              done();
            }
          });

          ws3.on('error', done);
        }, 100);
      });
    });

    it('should handle signaling messages between users', (done) => {
      ws1 = new WebSocket(`ws://localhost:${port}`);
      ws2 = new WebSocket(`ws://localhost:${port}`);

      Promise.all([
        new Promise(resolve => ws1.on('open', resolve)),
        new Promise(resolve => ws2.on('open', resolve))
      ]).then(() => {
        // Both users join the same room
        ws1.send(JSON.stringify({
          type: 'join-room',
          roomId: 'signal-room',
          userId: 'user1'
        }));

        ws2.send(JSON.stringify({
          type: 'join-room',
          roomId: 'signal-room',
          userId: 'user2'
        }));

        // After both joined, send a signaling message
        setTimeout(() => {
          ws1.send(JSON.stringify({
            type: 'offer',
            roomId: 'signal-room',
            sdp: 'fake-offer-sdp',
            targetUserId: 'user2'
          }));
        }, 100);
      });

      ws2.on('message', (data) => {
        const message = JSON.parse(data);
        if (message.type === 'offer' && message.fromUserId === 'user1') {
          expect(message.sdp).to.equal('fake-offer-sdp');
          done();
        }
      });

      ws1.on('error', done);
      ws2.on('error', done);
    });

    it('should handle invalid JSON messages gracefully', (done) => {
      ws1 = new WebSocket(`ws://localhost:${port}`);

      ws1.on('open', () => {
        ws1.send('invalid json');
      });

      ws1.on('message', (data) => {
        const message = JSON.parse(data);
        if (message.type === 'error' && message.message === 'Invalid message format') {
          done();
        }
      });

      ws1.on('error', done);
    });
  });
});