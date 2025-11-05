class VideoChatClient {
    constructor() {
        this.ws = null;
        this.peerConnection = null;
        this.localStream = null;
        this.remoteStream = null;
        this.roomId = null;
        this.userId = null;
        this.isAudioEnabled = true;
        this.isVideoEnabled = true;
        this.selectedCameraId = null;

        this.stunServers = [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
        ];

        this.initializeElements();
        this.setupEventListeners();
        this.loadCameraDevices();
        this.logMessage('Application initialized', 'info');
    }

    initializeElements() {
        this.elements = {
            setupSection: document.getElementById('setup-section'),
            statusSection: document.getElementById('status-section'),
            mediaControls: document.getElementById('media-controls'),
            videoContainer: document.getElementById('video-container'),
            messagesSection: document.getElementById('messages-section'),

            roomIdInput: document.getElementById('roomId'),
            userIdInput: document.getElementById('userId'),
            cameraSelect: document.getElementById('cameraSelect'),
            refreshCamerasBtn: document.getElementById('refreshCamerasBtn'),
            joinBtn: document.getElementById('joinBtn'),
            leaveBtn: document.getElementById('leaveBtn'),

            connectionStatus: document.getElementById('connection-status'),
            roomInfo: document.getElementById('room-info'),

            toggleVideoBtn: document.getElementById('toggleVideoBtn'),
            toggleAudioBtn: document.getElementById('toggleAudioBtn'),

            localVideo: document.getElementById('localVideo'),
            remoteVideo: document.getElementById('remoteVideo'),

            messages: document.getElementById('messages'),
            clearLogsBtn: document.getElementById('clearLogsBtn')
        };
    }

    setupEventListeners() {
        this.elements.joinBtn.addEventListener('click', () => this.joinRoom());
        this.elements.leaveBtn.addEventListener('click', () => this.leaveRoom());
        this.elements.refreshCamerasBtn.addEventListener('click', () => this.loadCameraDevices());
        this.elements.cameraSelect.addEventListener('change', (e) => {
            this.selectedCameraId = e.target.value;
            this.logMessage(`Selected camera: ${e.target.options[e.target.selectedIndex].text}`, 'info');
        });
        this.elements.toggleVideoBtn.addEventListener('click', () => this.toggleVideo());
        this.elements.toggleAudioBtn.addEventListener('click', () => this.toggleAudio());
        this.elements.clearLogsBtn.addEventListener('click', () => this.clearLogs());

        this.elements.roomIdInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.joinRoom();
        });

        this.elements.userIdInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.joinRoom();
        });
    }

    async loadCameraDevices() {
        try {
            // Request permission first
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            stream.getTracks().forEach(track => track.stop());

            // Now enumerate devices
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');

            this.elements.cameraSelect.innerHTML = '';

            if (videoDevices.length === 0) {
                this.elements.cameraSelect.innerHTML = '<option value="">No cameras found</option>';
                this.logMessage('No video devices found', 'error');
                return;
            }

            videoDevices.forEach((device, index) => {
                const option = document.createElement('option');
                option.value = device.deviceId;
                option.textContent = device.label || `Camera ${index + 1}`;
                this.elements.cameraSelect.appendChild(option);

                // Select the first device by default if none selected
                if (index === 0 && !this.selectedCameraId) {
                    this.selectedCameraId = device.deviceId;
                    option.selected = true;
                }
            });

            this.logMessage(`Found ${videoDevices.length} camera(s)`, 'success');

            // Log camera details for debugging
            videoDevices.forEach((device, index) => {
                this.logMessage(`Camera ${index + 1}: ${device.label || 'Unknown'} (${device.deviceId.substring(0, 8)}...)`, 'info');
            });

        } catch (error) {
            this.logMessage(`Error loading cameras: ${error.message}`, 'error');
            this.elements.cameraSelect.innerHTML = '<option value="">Camera access denied</option>';
        }
    }

    async joinRoom() {
        const roomId = this.elements.roomIdInput.value.trim();
        const userId = this.elements.userIdInput.value.trim();

        if (!roomId || !userId) {
            this.logMessage('Please enter both Room ID and Name', 'error');
            return;
        }

        this.roomId = roomId;
        this.userId = userId;

        try {
            this.updateConnectionStatus('connecting');
            await this.initializeMedia();
            await this.connectWebSocket();
            this.sendMessage({
                type: 'join-room',
                roomId: this.roomId,
                userId: this.userId
            });
        } catch (error) {
            this.logMessage(`Failed to join room: ${error.message}`, 'error');
            this.updateConnectionStatus('disconnected');
        }
    }

    async initializeMedia() {
        try {
            // Try full audio/video first
            let constraints = {
                audio: true,
                video: this.selectedCameraId ?
                    { deviceId: { exact: this.selectedCameraId } } :
                    true
            };

            this.logMessage('Requesting camera and microphone access...', 'info');
            this.localStream = await navigator.mediaDevices.getUserMedia(constraints);

            this.elements.localVideo.srcObject = this.localStream;

            // Log which media is being used
            const videoTrack = this.localStream.getVideoTracks()[0];
            const audioTrack = this.localStream.getAudioTracks()[0];

            if (videoTrack) {
                this.logMessage(`✅ Camera: ${videoTrack.label}`, 'success');
            }
            if (audioTrack) {
                this.logMessage(`✅ Microphone: ${audioTrack.label}`, 'success');
            }

            this.logMessage('✅ Media access granted', 'success');
            this.showVideoContainer();

        } catch (error) {
            this.logMessage(`❌ Media access error: ${error.name} - ${error.message}`, 'error');

            // Try fallback options
            await this.tryMediaFallbacks(error);
        }
    }

    async tryMediaFallbacks(originalError) {
        this.logMessage('🔄 Trying fallback options...', 'info');

        // Fallback 1: Try video only
        try {
            this.logMessage('Trying video only...', 'info');
            this.localStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: false
            });

            this.elements.localVideo.srcObject = this.localStream;
            this.logMessage('✅ Video-only mode enabled', 'success');
            this.logMessage('⚠️ Microphone not available', 'error');
            this.showVideoContainer();
            return;
        } catch (videoError) {
            this.logMessage(`❌ Video-only failed: ${videoError.message}`, 'error');
        }

        // Fallback 2: Try audio only
        try {
            this.logMessage('Trying audio only...', 'info');
            this.localStream = await navigator.mediaDevices.getUserMedia({
                video: false,
                audio: true
            });

            this.logMessage('✅ Audio-only mode enabled', 'success');
            this.logMessage('⚠️ Camera not available', 'error');
            this.showVideoContainer();
            return;
        } catch (audioError) {
            this.logMessage(`❌ Audio-only failed: ${audioError.message}`, 'error');
        }

        // All fallbacks failed
        this.logMessage('❌ All media options failed', 'error');
        this.showMediaErrorHelp(originalError);
        throw new Error(`Media access denied: ${originalError.message}`);
    }

    showMediaErrorHelp(error) {
        const errorType = error.name;
        let helpMessage = '';

        switch (errorType) {
            case 'NotAllowedError':
                helpMessage = `
                📱 Permission denied! Please:
                • Click the camera/microphone icon in your browser's address bar
                • Select "Allow" for camera and microphone
                • Refresh the page and try again
                `;
                break;
            case 'NotFoundError':
                helpMessage = `
                📹 No camera/microphone found! Please:
                • Check if your device has a camera/microphone
                • Make sure no other app is using them
                • Try refreshing the page
                `;
                break;
            case 'NotSupportedError':
                helpMessage = `
                🌐 Browser not supported! Please:
                • Use Chrome, Firefox, Safari, or Edge
                • Make sure you're using HTTPS (for mobile devices)
                • Update your browser to the latest version
                `;
                break;
            case 'OverconstrainedError':
                helpMessage = `
                ⚙️ Camera settings issue! Please:
                • Try selecting a different camera from the dropdown
                • Click "Refresh" to reload camera list
                • Try again with default settings
                `;
                break;
            default:
                helpMessage = `
                ❓ Unknown error! Please:
                • Check browser permissions for camera/microphone
                • Make sure you're using a secure connection (HTTPS)
                • Try a different browser
                `;
        }

        this.logMessage(helpMessage, 'error');
    }

    async connectWebSocket() {
        return new Promise((resolve, reject) => {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${protocol}//${window.location.host}`;

            this.ws = new WebSocket(wsUrl);

            this.ws.onopen = () => {
                this.logMessage('WebSocket connected', 'success');
                resolve();
            };

            this.ws.onmessage = (event) => {
                this.handleWebSocketMessage(JSON.parse(event.data));
            };

            this.ws.onclose = () => {
                this.logMessage('WebSocket disconnected', 'error');
                this.updateConnectionStatus('disconnected');
            };

            this.ws.onerror = (error) => {
                this.logMessage(`WebSocket error: ${error}`, 'error');
                reject(new Error('WebSocket connection failed'));
            };
        });
    }

    handleWebSocketMessage(message) {
        this.logMessage(`Received: ${message.type}`, 'info');

        switch (message.type) {
            case 'joined-room':
                this.handleJoinedRoom(message);
                break;
            case 'user-joined':
                this.handleUserJoined(message);
                break;
            case 'user-left':
                this.handleUserLeft(message);
                break;
            case 'offer':
                this.handleOffer(message);
                break;
            case 'answer':
                this.handleAnswer(message);
                break;
            case 'ice-candidate':
                this.handleIceCandidate(message);
                break;
            case 'error':
                this.logMessage(`Server error: ${message.message}`, 'error');
                break;
            default:
                this.logMessage(`Unknown message type: ${message.type}`, 'error');
        }
    }

    handleJoinedRoom(message) {
        this.updateConnectionStatus('connected');
        this.elements.roomInfo.textContent = `Room: ${message.roomId}`;
        this.showConnectedUI();
        this.logMessage(`Joined room ${message.roomId}`, 'success');

        if (message.participants.length > 0) {
            this.logMessage(`Other users in room: ${message.participants.join(', ')}`, 'info');
        }
    }

    async handleUserJoined(message) {
        this.logMessage(`User ${message.userId} joined`, 'success');
        await this.createPeerConnection();
        const offer = await this.peerConnection.createOffer();
        await this.peerConnection.setLocalDescription(offer);

        this.sendMessage({
            type: 'offer',
            roomId: this.roomId,
            targetUserId: message.userId,
            sdp: offer.sdp
        });
    }

    handleUserLeft(message) {
        this.logMessage(`User ${message.userId} left`, 'info');
        this.closePeerConnection();
    }

    async handleOffer(message) {
        this.logMessage(`Received offer from ${message.fromUserId}`, 'info');
        await this.createPeerConnection();

        await this.peerConnection.setRemoteDescription({
            type: 'offer',
            sdp: message.sdp
        });

        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);

        this.sendMessage({
            type: 'answer',
            roomId: this.roomId,
            targetUserId: message.fromUserId,
            sdp: answer.sdp
        });
    }

    async handleAnswer(message) {
        this.logMessage(`Received answer from ${message.fromUserId}`, 'info');
        await this.peerConnection.setRemoteDescription({
            type: 'answer',
            sdp: message.sdp
        });
    }

    async handleIceCandidate(message) {
        if (this.peerConnection && message.candidate) {
            await this.peerConnection.addIceCandidate({
                candidate: message.candidate,
                sdpMLineIndex: message.sdpMLineIndex,
                sdpMid: message.sdpMid
            });
        }
    }

    async createPeerConnection() {
        this.peerConnection = new RTCPeerConnection({
            iceServers: this.stunServers
        });

        this.localStream.getTracks().forEach(track => {
            this.peerConnection.addTrack(track, this.localStream);
        });

        this.peerConnection.ontrack = (event) => {
            this.remoteStream = event.streams[0];
            this.elements.remoteVideo.srcObject = this.remoteStream;
            this.logMessage('Remote stream connected', 'success');
        };

        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                this.sendMessage({
                    type: 'ice-candidate',
                    roomId: this.roomId,
                    candidate: event.candidate.candidate,
                    sdpMLineIndex: event.candidate.sdpMLineIndex,
                    sdpMid: event.candidate.sdpMid
                });
            }
        };

        this.peerConnection.onconnectionstatechange = () => {
            this.logMessage(`Connection state: ${this.peerConnection.connectionState}`, 'info');
        };

        this.logMessage('Peer connection created', 'info');
    }

    closePeerConnection() {
        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
            this.remoteStream = null;
            this.elements.remoteVideo.srcObject = null;
            this.logMessage('Peer connection closed', 'info');
        }
    }

    sendMessage(message) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        }
    }

    leaveRoom() {
        if (this.roomId && this.userId) {
            this.sendMessage({
                type: 'leave-room',
                roomId: this.roomId,
                userId: this.userId
            });
        }

        this.cleanup();
        this.showDisconnectedUI();
        this.updateConnectionStatus('disconnected');
        this.logMessage('Left room', 'info');
    }

    cleanup() {
        this.closePeerConnection();

        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
            this.localStream = null;
        }

        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }

        this.elements.localVideo.srcObject = null;
        this.elements.remoteVideo.srcObject = null;

        this.roomId = null;
        this.userId = null;
    }

    toggleVideo() {
        if (this.localStream) {
            const videoTrack = this.localStream.getVideoTracks()[0];
            if (videoTrack) {
                this.isVideoEnabled = !this.isVideoEnabled;
                videoTrack.enabled = this.isVideoEnabled;

                const btn = this.elements.toggleVideoBtn;
                btn.textContent = `📹 Video: ${this.isVideoEnabled ? 'ON' : 'OFF'}`;
                btn.classList.toggle('disabled', !this.isVideoEnabled);

                this.logMessage(`Video ${this.isVideoEnabled ? 'enabled' : 'disabled'}`, 'info');
            }
        }
    }

    toggleAudio() {
        if (this.localStream) {
            const audioTrack = this.localStream.getAudioTracks()[0];
            if (audioTrack) {
                this.isAudioEnabled = !this.isAudioEnabled;
                audioTrack.enabled = this.isAudioEnabled;

                const btn = this.elements.toggleAudioBtn;
                btn.textContent = `🎤 Audio: ${this.isAudioEnabled ? 'ON' : 'OFF'}`;
                btn.classList.toggle('disabled', !this.isAudioEnabled);

                this.logMessage(`Audio ${this.isAudioEnabled ? 'enabled' : 'disabled'}`, 'info');
            }
        }
    }

    updateConnectionStatus(status) {
        const statusEl = this.elements.connectionStatus;
        statusEl.textContent = status.charAt(0).toUpperCase() + status.slice(1);
        statusEl.className = `status ${status}`;
    }

    showConnectedUI() {
        this.elements.setupSection.classList.add('hidden');
        this.elements.statusSection.classList.remove('hidden');
        this.elements.mediaControls.classList.remove('hidden');
    }

    showDisconnectedUI() {
        this.elements.setupSection.classList.remove('hidden');
        this.elements.statusSection.classList.add('hidden');
        this.elements.mediaControls.classList.add('hidden');
        this.elements.videoContainer.classList.add('hidden');
        this.elements.roomInfo.textContent = '';
    }

    showVideoContainer() {
        this.elements.videoContainer.classList.remove('hidden');
    }

    logMessage(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const messageEl = document.createElement('div');
        messageEl.className = `message ${type}`;
        messageEl.innerHTML = `
            <span class="timestamp">${timestamp}</span>
            <span class="content">${message}</span>
        `;

        this.elements.messages.appendChild(messageEl);
        this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
    }

    clearLogs() {
        this.elements.messages.innerHTML = '';
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.videoChatClient = new VideoChatClient();
});