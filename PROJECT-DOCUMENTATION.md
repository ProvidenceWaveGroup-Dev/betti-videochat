# Betti Video Chat - Comprehensive Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Technologies Used](#technologies-used)
4. [Features](#features)
5. [Setup and Installation](#setup-and-installation)
6. [Usage](#usage)
7. [Security Implementation](#security-implementation)
8. [File Structure](#file-structure)
9. [API Documentation](#api-documentation)
10. [Known Limitations](#known-limitations)
11. [Future Improvements](#future-improvements)
12. [Troubleshooting](#troubleshooting)

## Project Overview

Betti Video Chat is a secure, peer-to-peer video chat application built with WebRTC technology. The application enables real-time audio and video communication between two users through a browser-based interface, utilizing a Node.js signaling server for connection coordination.

### Key Objectives
- **Secure Communication**: HTTPS-enabled for camera/microphone access on remote devices
- **Peer-to-Peer**: Direct media exchange between clients (no media routing through server)
- **Low Latency**: Real-time communication with minimal delay
- **Cross-Platform**: Works on any modern web browser supporting WebRTC
- **Lightweight**: Minimal dependencies and efficient resource usage

## Architecture

### High-Level Architecture
```
┌─────────────────┐    WebSocket     ┌─────────────────┐    WebSocket     ┌─────────────────┐
│   Client A      │◄────────────────►│ Signaling Server│◄────────────────►│   Client B      │
│                 │                  │  (Node.js)      │                  │                 │
│ - WebRTC Client │                  │ - Room mgmt     │                  │ - WebRTC Client │
│ - Media capture │                  │ - Message relay │                  │ - Media capture │
│ - UI interface  │                  │ - HTTPS server  │                  │ - UI interface  │
└─────────────────┘                  └─────────────────┘                  └─────────────────┘
         │                                                                          │
         │                          WebRTC P2P Connection                          │
         └─────────────────────────────────────────────────────────────────────────┘
                                   (Audio/Video Stream)
```

### WebRTC Signaling Flow
1. **Connection**: Clients connect to WebSocket signaling server
2. **Room Join**: Users join a specific room with unique ID
3. **Offer/Answer**: SDP (Session Description Protocol) exchange for media negotiation
4. **ICE Candidates**: Network information exchange for NAT traversal
5. **P2P Establishment**: Direct peer-to-peer connection established
6. **Media Streaming**: Audio/video streams flow directly between peers

## Technologies Used

### Core Technologies
- **WebRTC**: Real-time peer-to-peer communication
- **Node.js**: Server runtime environment
- **WebSocket (ws)**: Real-time bidirectional communication
- **HTTPS/TLS**: Secure connection and media access
- **HTML5**: Modern web interface
- **CSS3**: Responsive styling
- **JavaScript (ES6+)**: Client-side logic

### Dependencies
```json
{
  "dependencies": {
    "dotenv": "^16.3.1",
    "ws": "^8.14.2"
  },
  "devDependencies": {
    "chai": "^4.3.10",
    "mocha": "^10.2.0"
  }
}
```

### Browser Requirements
- Chrome 56+
- Firefox 52+
- Safari 11+
- Edge 79+
- Support for WebRTC APIs and getUserMedia

## Features

### Core Features
- ✅ **Real-time Video Chat**: High-quality video communication
- ✅ **Audio Communication**: Crystal-clear audio streaming
- ✅ **Camera Selection**: Multiple camera device support
- ✅ **Media Controls**: Toggle audio/video on/off
- ✅ **Room-based**: Private rooms with unique IDs
- ✅ **HTTPS Security**: Secure connections for remote access
- ✅ **Responsive UI**: Works on desktop and mobile browsers
- ✅ **Connection Status**: Real-time connection monitoring
- ✅ **Error Handling**: Comprehensive error reporting and recovery

### User Interface Features
- **Device Selection**: Dropdown for camera selection
- **Media Controls**: Toggle buttons for audio/video
- **Connection Status**: Visual indicators for connection state
- **Logging System**: Real-time activity and error logs
- **Responsive Design**: Adaptive layout for different screen sizes

## Setup and Installation

### Prerequisites
- Node.js 14+ installed
- Modern web browser with WebRTC support
- Network access for STUN server communication

### Installation Steps

1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd betti-videochat
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start HTTPS Server**
   ```bash
   node server.js
   ```

4. **Access Application**
   - Local: `https://localhost:3000`
   - Remote: `https://[YOUR_IP]:3000`
   - Accept SSL certificate warning for self-signed cert

### Environment Configuration
Create `.env` file for custom configuration:
```env
PORT=3000
STUN_SERVER_1=stun:stun.l.google.com:19302
STUN_SERVER_2=stun:stun1.l.google.com:19302
```

## Usage

### Basic Usage Flow

1. **Access Application**: Open browser to HTTPS URL
2. **Grant Permissions**: Allow camera/microphone access
3. **Enter Details**:
   - Room ID (shared with other participant)
   - Your name/identifier
4. **Select Camera**: Choose preferred camera from dropdown
5. **Join Room**: Click "Join Room" button
6. **Wait for Participant**: Application shows "waiting" status
7. **Start Chatting**: When second user joins, video chat begins

### Advanced Features

- **Camera Switching**: Change camera during call via dropdown
- **Media Toggle**: Use buttons to turn audio/video on/off
- **Connection Monitoring**: Watch connection status and logs
- **Error Recovery**: Application handles disconnections gracefully

## Security Implementation

### HTTPS/TLS Security
- **Self-signed Certificate**: Generated for local development
- **Key Usage Extensions**: Proper server authentication setup
- **Remote Device Access**: HTTPS required for camera/mic permissions
- **Certificate Warnings**: Users must accept browser warnings

### WebRTC Security
- **DTLS Encryption**: All media streams encrypted end-to-end
- **SRTP**: Secure Real-time Transport Protocol for media
- **ICE/STUN**: Secure NAT traversal without media relay
- **Origin Validation**: WebSocket connections validated

### Data Privacy
- **No Media Storage**: No audio/video data stored on server
- **Minimal Logging**: Only connection events logged
- **P2P Architecture**: Media never touches server infrastructure
- **Session Isolation**: Each room completely isolated

## File Structure

```
betti-videochat/
├── server.js              # Main HTTPS signaling server
├── package.json           # Node.js dependencies and scripts
├── package-lock.json      # Dependency lock file
├── cert.pem              # SSL certificate (auto-generated)
├── key.pem               # SSL private key (auto-generated)
├── openssl.conf          # SSL certificate configuration
├── .env                  # Environment variables (optional)
├── .gitignore           # Git ignore file
├── CLAUDE.md            # Claude Code project instructions
├── PROJECT-DOCUMENTATION.md # This documentation file
├── public/              # Client-side web application
│   ├── index.html       # Main HTML interface
│   ├── script.js        # WebRTC client implementation
│   └── style.css        # UI styling
└── test/               # Test files (Mocha/Chai)
    └── server.test.js   # Server functionality tests
```

## API Documentation

### WebSocket Messages

#### Client → Server Messages

**Join Room**
```json
{
  "type": "join-room",
  "roomId": "room123",
  "userId": "user456"
}
```

**WebRTC Offer**
```json
{
  "type": "offer",
  "roomId": "room123",
  "targetUserId": "user456",
  "sdp": "v=0\r\no=..."
}
```

**WebRTC Answer**
```json
{
  "type": "answer",
  "roomId": "room123",
  "targetUserId": "user456",
  "sdp": "v=0\r\no=..."
}
```

**ICE Candidate**
```json
{
  "type": "ice-candidate",
  "roomId": "room123",
  "candidate": "candidate:...",
  "sdpMLineIndex": 0,
  "sdpMid": "0"
}
```

**Leave Room**
```json
{
  "type": "leave-room",
  "roomId": "room123",
  "userId": "user456"
}
```

#### Server → Client Messages

**Joined Room**
```json
{
  "type": "joined-room",
  "roomId": "room123",
  "userId": "user456",
  "participants": ["user789"]
}
```

**User Joined**
```json
{
  "type": "user-joined",
  "userId": "user789"
}
```

**User Left**
```json
{
  "type": "user-left",
  "userId": "user789"
}
```

**Error Message**
```json
{
  "type": "error",
  "message": "Room is full"
}
```

### HTTP Endpoints

The server serves static files from the `public/` directory:
- `GET /` → `public/index.html`
- `GET /script.js` → `public/script.js`
- `GET /style.css` → `public/style.css`

## Known Limitations

### Technical Limitations
1. **Two-User Limit**: Currently supports only 2 users per room
2. **Self-signed Certificate**: Requires manual browser acceptance
3. **STUN-only**: No TURN server for complex NAT scenarios
4. **No Authentication**: No user verification system
5. **No Persistence**: No message history or call recording

### Browser Limitations
1. **HTTPS Requirement**: Camera access blocked on HTTP for remote devices
2. **WebRTC Support**: Older browsers not supported
3. **Mobile Limitations**: Some mobile browsers have WebRTC restrictions
4. **Bandwidth**: No adaptive bitrate or quality control

### Network Limitations
1. **Symmetric NAT**: May fail with very restrictive firewalls
2. **Corporate Networks**: Some enterprise firewalls block WebRTC
3. **No Relay**: Direct connection required (no TURN fallback)

## Future Improvements

### Priority 1 (High Impact)
1. **TURN Server Integration**
   - Add coturn server support
   - Environment variable configuration
   - Fallback for restrictive networks

2. **Multi-user Support**
   - Support 3+ users in a room
   - Conference-style layout
   - Speaker detection and switching

3. **Production SSL Certificate**
   - Let's Encrypt integration
   - Automatic certificate renewal
   - Remove browser warnings

### Priority 2 (Medium Impact)
4. **User Authentication**
   - JWT-based authentication
   - User registration/login
   - Session management

5. **End-to-End Encryption**
   - WebRTC insertable streams
   - Additional encryption layer
   - Key exchange protocol

6. **Quality Controls**
   - Adaptive bitrate
   - Resolution selection
   - Network quality indicators

### Priority 3 (Nice to Have)
7. **Advanced Features**
   - Screen sharing capability
   - Text chat integration
   - Call recording (with encryption)
   - Virtual backgrounds

8. **Mobile Optimization**
   - Progressive Web App (PWA)
   - Mobile-specific UI
   - Touch gesture support

9. **Deployment Tools**
   - Docker containerization
   - Cloud deployment scripts
   - Load balancing for signaling

### Security Enhancements
10. **Enhanced Security**
    - Rate limiting for connections
    - DDoS protection
    - Input validation and sanitization
    - Audit logging

11. **Privacy Features**
    - Data retention policies
    - GDPR compliance
    - User data export/deletion
    - Privacy mode indicators

## Troubleshooting

### Common Issues

#### 1. Camera/Microphone Access Denied
**Symptoms**: "Media access denied" error
**Solutions**:
- Ensure using HTTPS (not HTTP)
- Check browser permissions settings
- Allow camera/microphone in browser
- Try different browser
- Check if other apps are using camera

#### 2. SSL Certificate Warnings
**Symptoms**: Browser shows "Not secure" or certificate warnings
**Solutions**:
- Click "Advanced" → "Proceed to [IP] (unsafe)"
- Add certificate exception in browser
- For production: use valid SSL certificate

#### 3. Connection Fails
**Symptoms**: Users can't see each other
**Solutions**:
- Check both users are in same room ID
- Verify network connectivity
- Check firewall settings
- Try different network (mobile hotspot)
- Check WebRTC support in browser

#### 4. No Video/Audio
**Symptoms**: Connected but no media streams
**Solutions**:
- Check media toggle buttons
- Verify camera/microphone permissions
- Test with different devices
- Check browser console for errors
- Restart browser

#### 5. Poor Quality/Lag
**Symptoms**: Choppy video or audio delays
**Solutions**:
- Check network bandwidth
- Close other bandwidth-heavy applications
- Try different camera resolution
- Check CPU usage
- Use wired connection instead of WiFi

### Debug Information

#### Browser Console Logs
Check browser developer tools console for:
- WebRTC connection state changes
- Media device enumeration results
- Network connectivity issues
- JavaScript errors

#### Server Logs
Monitor server console for:
- WebSocket connection events
- Room join/leave activities
- Message relay confirmations
- Error conditions

#### Network Analysis
Use browser tools to analyze:
- WebSocket connection status
- ICE candidate gathering
- STUN server connectivity
- Media stream statistics

---

*Generated with Claude Code - Last updated: November 2024*