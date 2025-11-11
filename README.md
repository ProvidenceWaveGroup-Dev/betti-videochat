# Betti Video Chat

A secure, peer-to-peer video chat application built with WebRTC and Node.js signaling.

## Features

- **Peer-to-peer video calling** using WebRTC
- **Real-time signaling** via WebSocket
- **Room-based communication** (up to 2 users per room)
- **Media controls** (toggle audio/video)
- **STUN server integration** for NAT traversal
- **Responsive web interface**
- **Connection logging** and status monitoring

## Quick Start

### Prerequisites

- Node.js (v14 or higher)
- Modern web browser with WebRTC support

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd betti-videochat
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

4. Open your browser and navigate to:
```
http://localhost:3000
```

## Usage

### Starting a Video Call

1. **Enter Room Details:**
   - Room ID: A unique identifier for your video call room
   - Your Name: Display name for the session

2. **Join Room:**
   - Click "Join Room" to connect
   - Allow camera and microphone access when prompted

3. **Share Room ID:**
   - Share the Room ID with the person you want to call
   - They should enter the same Room ID and join

4. **Video Call:**
   - Once both users are connected, video call will start automatically
   - Use media controls to toggle audio/video

### Media Controls

- **Video Toggle:** Turn your camera on/off
- **Audio Toggle:** Mute/unmute your microphone
- **Leave Room:** End the call and disconnect

## Development

### Project Structure

```
betti-videochat/
├── public/
│   ├── index.html     # Client interface
│   ├── style.css      # UI styling
│   └── script.js      # WebRTC client logic
├── test/
│   └── server.test.js # Server test suite
├── server.js          # WebSocket signaling server
├── .env               # Environment variables
├── .gitignore         # Git ignore file
└── package.json       # Dependencies and scripts
```

### Running Tests

```bash
# Run all tests
npm test

# Watch mode for development
npm run test:watch
```

### Development Commands

```bash
# Start development server
npm run dev

# Start production server
npm start

# Run tests
npm test
```

## Configuration

### Environment Variables

Create a `.env` file to customize configuration:

```env
# Server Configuration
PORT=3000

# STUN Server Configuration
STUN_SERVER_1=stun:stun.l.google.com:19302
STUN_SERVER_2=stun:stun1.l.google.com:19302

# Development Settings
NODE_ENV=development
```

### STUN/TURN Servers

The application uses Google's public STUN servers by default. For production deployment, consider using dedicated STUN/TURN servers for better reliability.

## WebRTC Signaling Flow

1. **Client Connection:** Users connect to WebSocket signaling server
2. **Room Joining:** Users join a room with unique Room ID
3. **Offer/Answer Exchange:** WebRTC offers and answers exchanged via signaling server
4. **ICE Candidate Exchange:** Network connectivity information shared
5. **Peer Connection:** Direct peer-to-peer connection established
6. **Media Streaming:** Audio/video streams directly between peers

## Browser Compatibility

- Chrome 60+
- Firefox 60+
- Safari 11+
- Edge 79+

**Note:** HTTPS is required for WebRTC in production environments.

## Security Considerations

- WebRTC provides end-to-end media encryption by default
- Signaling server validates and sanitizes all messages
- No media data passes through the server (peer-to-peer only)
- Room IDs should be treated as private/shared secrets

## Troubleshooting

### Common Issues

**Camera/Microphone Not Working:**
- Ensure browser permissions are granted
- Check if other applications are using the devices
- Try refreshing the page and granting permissions again

**Connection Failed:**
- Check if both users are in the same room
- Verify network connectivity
- Corporate firewalls may block WebRTC traffic

**Video Not Showing:**
- Ensure both users have cameras enabled
- Check browser console for errors
- Try different browsers

### Debug Logs

The application includes a connection log panel that shows:
- WebSocket connection status
- Room join/leave events
- WebRTC connection states
- Error messages

## Future Enhancements

- [ ] TURN server support for corporate networks
- [ ] JWT authentication
- [ ] End-to-end encryption with insertable streams
- [ ] Multi-user rooms (more than 2 participants)
- [ ] Screen sharing capabilities
- [ ] Recording functionality

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

MIT License - see LICENSE file for details.