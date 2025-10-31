# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Betti Video Chat Prototype - A secure, peer-to-peer video chat system using WebRTC and Node.js signaling.

**Core Technologies:**
- WebRTC for peer-to-peer media exchange (audio/video)
- Node.js with WebSocket for signaling server
- STUN server configuration for NAT traversal
- Future: TURN server support, JWT authentication, E2EE with insertable streams

## Architecture

This is a WebRTC-based video chat application with the following components:

1. **Signaling Server** - Node.js WebSocket server for coordinating WebRTC connections
2. **Client Application** - Web-based frontend handling WebRTC peer connections
3. **Media Handling** - Audio/video capture and transmission via WebRTC
4. **Security Layer** - Future implementation of end-to-end encryption using insertable streams

## Development Commands

Since this is a new project, typical commands will include:

**Server Development:**
```bash
node server.js          # Run the signaling server
npm start              # Alternative server start command
npm run dev            # Development mode with auto-restart
```

**Client Development:**
```bash
# Serve client files (if using a build process)
npm run serve
# Or simply open index.html in browser for basic setup
```

**Testing:**
```bash
npm test              # Run test suite
npm run test:unit     # Unit tests
npm run test:e2e      # End-to-end WebRTC connection tests
```

## Key Implementation Notes

**WebRTC Signaling Flow:**
- Clients connect to WebSocket signaling server
- Exchange offer/answer SDP messages through server
- ICE candidates exchanged for NAT traversal
- Direct peer-to-peer connection established

**STUN/TURN Configuration:**
- STUN servers for public IP discovery
- TURN servers for relay when direct connection fails
- Configuration stored in .env file for environment variables

**Security Considerations:**
- WebRTC requires HTTPS in production
- Signaling server should validate and sanitize all messages
- Future E2EE implementation will use WebRTC insertable streams
- JWT authentication for user verification

## Future Enhancements

1. **TURN Server Integration** - Add coturn support with environment variables
2. **End-to-End Encryption** - Implement using WebRTC insertable streams
3. **Authentication** - JWT-based user authentication
4. **Secure Logging** - Structured logging without exposing sensitive data

## File Structure

```
betti-videochat/
├── public/
│   ├── index.html     # Client interface
│   ├── style.css      # UI styling
│   └── script.js      # WebRTC client logic
├── server.js          # WebSocket signaling server
├── .env               # Environment variables (STUN/TURN config)
├── .gitignore         # Git ignore file
└── README.md          # Project documentation
```