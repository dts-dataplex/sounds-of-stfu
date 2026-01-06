// Main Application - Chatsubo Spatial Audio Chat
class ChatsuboApp {
    constructor() {
        // State
        this.username = null;
        this.roomName = null;
        this.ws = null;
        this.wsConnected = false;
        this.wsReconnectAttempts = 0;

        // Components
        this.canvas = null;

        // Position update throttling
        this.lastPositionUpdate = 0;
        this.pendingPositionUpdate = null;

        // DOM elements
        this.elements = {};

        // Bind methods
        this.handleLogin = this.handleLogin.bind(this);
        this.handleLeave = this.handleLeave.bind(this);
        this.handleMicToggle = this.handleMicToggle.bind(this);
        this.handleVolumeChange = this.handleVolumeChange.bind(this);
    }

    // Initialize application
    async init() {
        console.log('[App] Initializing Chatsubo...');

        // Cache DOM elements
        this.cacheElements();

        // Set up event listeners
        this.setupEventListeners();

        // Initialize canvas renderer
        this.canvas = new CanvasRenderer('room-canvas');
        this.canvas.onPositionChange = (pos) => this.handlePositionChange(pos);

        console.log('[App] Initialization complete');
    }

    // Cache DOM elements
    cacheElements() {
        this.elements = {
            // Screens
            loginScreen: document.getElementById('login-screen'),
            roomScreen: document.getElementById('room-screen'),
            loadingOverlay: document.getElementById('loading-overlay'),
            loadingText: document.getElementById('loading-text'),

            // Login
            loginForm: document.getElementById('login-form'),
            usernameInput: document.getElementById('username-input'),
            roomInput: document.getElementById('room-input'),
            loginError: document.getElementById('login-error'),

            // Header
            roomNameDisplay: document.getElementById('room-name'),
            zoneIndicator: document.getElementById('zone-indicator'),
            userCount: document.getElementById('user-count'),
            leaveBtn: document.getElementById('leave-btn'),

            // Audio controls
            micToggle: document.getElementById('mic-toggle'),
            masterVolume: document.getElementById('master-volume'),

            // Status bar
            connectionStatus: document.querySelector('#connection-status .status-dot'),
            connectionText: document.getElementById('connection-text'),
            audioIndicator: document.getElementById('audio-indicator'),
            positionText: document.getElementById('position-text'),

            // Loading steps
            loadingSteps: document.getElementById('loading-steps'),
            loadingStepAudio: document.querySelector('.loading-step[data-step="audio"]'),
            loadingStepRoom: document.querySelector('.loading-step[data-step="room"]'),
            loadingStepLivekit: document.querySelector('.loading-step[data-step="livekit"]'),

            // Reconnect indicator
            reconnectIndicator: null // Will be created dynamically
        };
    }

    // Set up event listeners
    setupEventListeners() {
        // Login form
        this.elements.loginForm.addEventListener('submit', this.handleLogin);

        // Leave button
        this.elements.leaveBtn.addEventListener('click', this.handleLeave);

        // Mic toggle
        this.elements.micToggle.addEventListener('click', this.handleMicToggle);

        // Volume slider
        this.elements.masterVolume.addEventListener('input', this.handleVolumeChange);

        // LiveKit callbacks
        livekit.onConnectionStateChange = (state) => this.handleLiveKitState(state);
        livekit.onParticipantConnected = (p) => this.handleParticipantConnected(p);
        livekit.onParticipantDisconnected = (p) => this.handleParticipantDisconnected(p);
        livekit.onTrackSubscribed = (track, participant) => this.handleTrackSubscribed(track, participant);
        livekit.onTrackUnsubscribed = (track, participant) => this.handleTrackUnsubscribed(track, participant);
        livekit.onError = (error) => this.handleError(error);
    }

    // Handle login form submission
    async handleLogin(e) {
        e.preventDefault();

        this.username = this.elements.usernameInput.value.trim();
        this.roomName = this.elements.roomInput.value.trim();

        if (!this.username || !this.roomName) {
            this.showLoginError('Please enter both username and room name');
            return;
        }

        // Show loading and reset steps
        this.showLoading('Initializing...');
        this.resetLoadingSteps();

        try {
            // Step 1: Initialize audio context (requires user interaction)
            this.updateLoadingStep('audio', 'active');
            this.showLoading('Initializing audio system...');
            await spatialAudio.initialize();
            this.updateLoadingStep('audio', 'completed');

            // Step 2: Connect to WebSocket for position sync
            this.updateLoadingStep('room', 'active');
            this.showLoading('Connecting to room...');
            await this.connectWebSocket();
            this.updateLoadingStep('room', 'completed');

            // Step 3: Connect to LiveKit for audio
            this.updateLoadingStep('livekit', 'active');
            this.showLoading('Setting up voice...');
            const livekitConnected = await livekit.connect(this.roomName, this.username);

            if (!livekitConnected) {
                console.warn('[App] LiveKit connection failed, continuing without audio');
                this.updateLoadingStep('livekit', 'failed');
            } else {
                this.updateLoadingStep('livekit', 'completed');
            }

            // Initialize canvas
            this.canvas.initialize();
            this.canvas.setLocalUser(this.username, { x: 400, y: 300 });

            // Start audio level detection for speaking indicators
            spatialAudio.startAudioLevelDetection();

            // Start proximity tracking for conversation clusters
            spatialAudio.startProximityTracking();

            // Register for speaking state changes
            spatialAudio.onSpeakingChange((participantId, isSpeaking, level) => {
                this.canvas.setSpeakingState(participantId, isSpeaking, level);
            });

            // Register for cluster changes (for heat map visualization)
            spatialAudio.onClusterChange((clusters) => {
                this.canvas.setConversationClusters(clusters);
            });

            // Track local user position
            spatialAudio.trackParticipantPosition(this.username, { x: 400, y: 300 });

            // Update UI
            this.elements.roomNameDisplay.textContent = this.roomName;
            this.showRoomScreen();

            // Send initial position
            this.sendPositionUpdate({ x: 400, y: 300 });

        } catch (error) {
            console.error('[App] Login failed:', error);

            // Mark appropriate step as failed based on error context
            const errorMsg = error.message || '';
            if (errorMsg.includes('audio') || errorMsg.includes('Audio')) {
                this.updateLoadingStep('audio', 'failed');
            } else if (errorMsg.includes('WebSocket') || errorMsg.includes('room')) {
                this.updateLoadingStep('room', 'failed');
            } else if (errorMsg.includes('LiveKit') || errorMsg.includes('voice')) {
                this.updateLoadingStep('livekit', 'failed');
            }

            this.showLoginError(error.message || 'Connection failed');
            this.hideLoading();
        }
    }

    // Connect to WebSocket server
    connectWebSocket() {
        return new Promise((resolve, reject) => {
            const wsUrl = `${Config.WS_BASE}/ws/${this.roomName}?username=${encodeURIComponent(this.username)}`;

            console.log('[App] Connecting to WebSocket:', wsUrl);
            this.ws = new WebSocket(wsUrl);

            const timeout = setTimeout(() => {
                this.ws.close();
                reject(new Error('WebSocket connection timeout'));
            }, 10000);

            this.ws.onopen = () => {
                clearTimeout(timeout);
                this.wsConnected = true;
                this.wsReconnectAttempts = 0;
                this.updateConnectionUI('connected');
                console.log('[App] WebSocket connected');
                resolve();
            };

            this.ws.onclose = (event) => {
                clearTimeout(timeout);
                this.wsConnected = false;
                this.updateConnectionUI('disconnected');
                console.log('[App] WebSocket closed:', event.code, event.reason);

                // Attempt reconnection if not intentional
                if (this.roomName && event.code !== 1000) {
                    this.scheduleWebSocketReconnect();
                }
            };

            this.ws.onerror = (error) => {
                clearTimeout(timeout);
                console.error('[App] WebSocket error:', error);
                reject(new Error('WebSocket connection failed'));
            };

            this.ws.onmessage = (event) => {
                this.handleWebSocketMessage(event.data);
            };
        });
    }

    // Handle incoming WebSocket messages
    handleWebSocketMessage(data) {
        try {
            const message = JSON.parse(data);

            switch (message.type) {
                case Config.MSG_TYPES.ROOM_STATE:
                    this.handleRoomState(message);
                    break;

                case Config.MSG_TYPES.USER_JOINED:
                    this.handleUserJoined(message);
                    break;

                case Config.MSG_TYPES.USER_MOVED:
                    this.handleUserMoved(message);
                    break;

                case Config.MSG_TYPES.USER_LEFT:
                    this.handleUserLeft(message);
                    break;

                case Config.MSG_TYPES.PONG:
                    // Heartbeat response, ignore
                    break;

                case Config.MSG_TYPES.ERROR:
                    console.error('[App] Server error:', message.message);
                    break;

                default:
                    console.warn('[App] Unknown message type:', message.type);
            }
        } catch (error) {
            console.error('[App] Failed to parse message:', error);
        }
    }

    // Handle room state (initial sync)
    handleRoomState(message) {
        console.log('[App] Room state received:', message.users?.length, 'users');

        if (message.users) {
            for (const user of message.users) {
                if (user.username !== this.username) {
                    this.canvas.updateUser(user.username, user.position, user.zone);

                    // Track for proximity clustering
                    spatialAudio.trackParticipantPosition(user.username, user.position);
                }
            }
            this.updateUserCount();
        }

        if (message.zones) {
            console.log('[App] Zone info:', message.zones);
        }
    }

    // Handle user joined
    handleUserJoined(message) {
        console.log('[App] User joined:', message.username);

        if (message.username !== this.username) {
            this.canvas.updateUser(message.username, message.position, message.zone);

            // Track for proximity clustering
            spatialAudio.trackParticipantPosition(message.username, message.position);

            this.updateUserCount();
        }
    }

    // Handle user moved
    handleUserMoved(message) {
        if (message.username !== this.username) {
            this.canvas.updateUser(message.username, message.position, message.zone);

            // Update spatial audio position
            spatialAudio.updateParticipantPosition(message.username, message.position);

            // Update proximity tracking
            spatialAudio.trackParticipantPosition(message.username, message.position);

            if (message.zone) {
                spatialAudio.applyZoneMultiplier(message.username, message.zone);
            }
        }
    }

    // Handle user left
    handleUserLeft(message) {
        console.log('[App] User left:', message.username);
        this.canvas.removeUser(message.username);
        spatialAudio.removeParticipantTrack(message.username);
        this.updateUserCount();
    }

    // Handle position change from canvas
    handlePositionChange(position) {
        // Update local audio listener position
        spatialAudio.setLocalPosition(position.x, position.y);

        // Update local user position for proximity tracking
        if (this.username) {
            spatialAudio.trackParticipantPosition(this.username, position);
        }

        // Update zone indicator
        const zone = Config.getZoneAt(position.x, position.y);
        this.elements.zoneIndicator.textContent = zone.name;

        // Update position display
        this.elements.positionText.textContent = `Position: (${Math.round(position.x)}, ${Math.round(position.y)})`;

        // Throttle position updates
        const now = Date.now();
        if (now - this.lastPositionUpdate >= Config.POSITION_UPDATE_INTERVAL) {
            this.sendPositionUpdate(position);
            this.lastPositionUpdate = now;
        } else {
            // Schedule update
            if (this.pendingPositionUpdate) {
                clearTimeout(this.pendingPositionUpdate);
            }
            this.pendingPositionUpdate = setTimeout(() => {
                this.sendPositionUpdate(position);
                this.lastPositionUpdate = Date.now();
            }, Config.POSITION_UPDATE_INTERVAL);
        }
    }

    // Send position update to server
    sendPositionUpdate(position) {
        if (!this.wsConnected || !this.ws) return;

        this.ws.send(JSON.stringify({
            type: Config.MSG_TYPES.POSITION_UPDATE,
            x: position.x,
            y: position.y
        }));
    }

    // Handle LiveKit connection state change
    handleLiveKitState(state) {
        console.log('[App] LiveKit state:', state);

        switch (state) {
            case 'connected':
                this.elements.audioIndicator.textContent = 'Audio: Ready';
                break;
            case 'reconnecting':
                this.elements.audioIndicator.textContent = 'Audio: Reconnecting...';
                break;
            case 'disconnected':
                this.elements.audioIndicator.textContent = 'Audio: Disconnected';
                break;
        }
    }

    // Handle LiveKit participant connected
    handleParticipantConnected(participant) {
        console.log('[App] LiveKit participant connected:', participant.identity);
    }

    // Handle LiveKit participant disconnected
    handleParticipantDisconnected(participant) {
        console.log('[App] LiveKit participant disconnected:', participant.identity);
        spatialAudio.removeParticipantTrack(participant.identity);
    }

    // Handle track subscribed (remote audio)
    handleTrackSubscribed(track, participant) {
        console.log('[App] Track subscribed from:', participant.identity);

        // Get MediaStreamTrack from LiveKit track
        const mediaStreamTrack = track.mediaStreamTrack;

        if (mediaStreamTrack) {
            // Get user position from canvas
            const user = this.canvas.users.get(participant.identity);
            const position = user ? user.position : { x: 400, y: 300 };

            // Add to spatial audio
            spatialAudio.addParticipantTrack(participant.identity, mediaStreamTrack, position);

            // Apply zone multiplier
            const zone = Config.getZoneAt(position.x, position.y);
            spatialAudio.applyZoneMultiplier(participant.identity, zone.id);
        }
    }

    // Handle track unsubscribed
    handleTrackUnsubscribed(track, participant) {
        console.log('[App] Track unsubscribed from:', participant.identity);
        spatialAudio.removeParticipantTrack(participant.identity);
    }

    // Handle mic toggle
    async handleMicToggle() {
        const success = await livekit.toggleMicrophone();

        if (success) {
            const isMuted = livekit.isMuted;
            this.elements.micToggle.classList.toggle('muted', isMuted);
            this.elements.micToggle.setAttribute('aria-pressed', isMuted ? 'true' : 'false');
            this.elements.micToggle.setAttribute('aria-label', isMuted ? 'Unmute microphone' : 'Mute microphone');
            this.elements.audioIndicator.textContent = isMuted ? 'Audio: Muted' : 'Audio: Live';
        }
    }

    // Handle volume change
    handleVolumeChange() {
        const volumeValue = this.elements.masterVolume.value;
        const volume = volumeValue / 100;
        spatialAudio.setMasterVolume(volume);

        // Update ARIA attributes for accessibility
        this.elements.masterVolume.setAttribute('aria-valuenow', volumeValue);
        this.elements.masterVolume.setAttribute('aria-valuetext', `${volumeValue} percent volume`);
    }

    // Handle leave
    async handleLeave() {
        await this.disconnect();
        this.showLoginScreen();
    }

    // Disconnect from room
    async disconnect() {
        // Close WebSocket
        if (this.ws) {
            this.ws.close(1000, 'User left');
            this.ws = null;
        }
        this.wsConnected = false;

        // Disconnect LiveKit
        await livekit.disconnect();

        // Clean up audio
        spatialAudio.destroy();

        // Clear canvas
        this.canvas.clearUsers();

        // Reset state
        this.username = null;
        this.roomName = null;
    }

    // Schedule WebSocket reconnection
    scheduleWebSocketReconnect() {
        if (this.wsReconnectAttempts >= Config.RECONNECT.MAX_ATTEMPTS) {
            console.log('[App] Max WebSocket reconnect attempts reached');
            this.hideReconnectIndicator();
            this.handleError(new Error('Lost connection to server'));
            return;
        }

        const delay = Math.min(
            Config.RECONNECT.BASE_DELAY * Math.pow(2, this.wsReconnectAttempts),
            Config.RECONNECT.MAX_DELAY
        );

        console.log(`[App] Scheduling WebSocket reconnect in ${delay}ms`);
        this.updateConnectionUI('connecting');

        // Show reconnect indicator with attempt count
        this.showReconnectIndicator(this.wsReconnectAttempts + 1, Config.RECONNECT.MAX_ATTEMPTS);

        setTimeout(async () => {
            this.wsReconnectAttempts++;
            try {
                await this.connectWebSocket();
                // Success - hide indicator
                this.hideReconnectIndicator();
            } catch (error) {
                console.error('[App] WebSocket reconnect failed:', error);
                this.scheduleWebSocketReconnect();
            }
        }, delay);
    }

    // Handle errors
    handleError(error) {
        console.error('[App] Error:', error);
        // Could show error toast/notification here
    }

    // UI Helpers

    showLoading(text) {
        this.elements.loadingText.textContent = text;
        this.elements.loadingOverlay.classList.remove('hidden');
    }

    hideLoading() {
        this.elements.loadingOverlay.classList.add('hidden');
    }

    showLoginError(message) {
        this.elements.loginError.textContent = message;
        this.elements.loginError.classList.remove('hidden');
    }

    hideLoginError() {
        this.elements.loginError.classList.add('hidden');
    }

    showLoginScreen() {
        this.elements.loginScreen.classList.remove('hidden');
        this.elements.roomScreen.classList.add('hidden');
        this.hideLoading();
        this.hideLoginError();
    }

    showRoomScreen() {
        this.elements.loginScreen.classList.add('hidden');
        this.elements.roomScreen.classList.remove('hidden');
        this.hideLoading();
    }

    updateConnectionUI(state) {
        const dot = this.elements.connectionStatus;
        const text = this.elements.connectionText;

        dot.classList.remove('connected', 'connecting', 'disconnected');

        switch (state) {
            case 'connected':
                dot.classList.add('connected');
                text.textContent = 'Connected';
                break;
            case 'connecting':
                dot.classList.add('connecting');
                text.textContent = 'Connecting...';
                break;
            default:
                dot.classList.add('disconnected');
                text.textContent = 'Disconnected';
        }
    }

    updateUserCount() {
        const count = this.canvas.users.size;
        this.elements.userCount.textContent = `${count} user${count !== 1 ? 's' : ''}`;
    }

    // Loading step management
    updateLoadingStep(stepName, status) {
        const stepElement = {
            'audio': this.elements.loadingStepAudio,
            'room': this.elements.loadingStepRoom,
            'livekit': this.elements.loadingStepLivekit
        }[stepName];

        if (!stepElement) return;

        // Remove all state classes
        stepElement.classList.remove('active', 'completed', 'failed');

        // Update icon and add new state class
        const iconElement = stepElement.querySelector('.step-icon');
        const stepText = stepElement.querySelector('.step-text').textContent;

        switch (status) {
            case 'active':
                stepElement.classList.add('active');
                iconElement.textContent = '◯';
                stepElement.setAttribute('aria-label', `${stepText}: In progress`);
                stepElement.setAttribute('aria-busy', 'true');
                break;
            case 'completed':
                stepElement.classList.add('completed');
                iconElement.textContent = ''; // CSS ::before will show ✓
                stepElement.setAttribute('aria-label', `${stepText}: Completed`);
                stepElement.removeAttribute('aria-busy');
                break;
            case 'failed':
                stepElement.classList.add('failed');
                iconElement.textContent = ''; // CSS ::before will show ✗
                stepElement.setAttribute('aria-label', `${stepText}: Failed`);
                stepElement.removeAttribute('aria-busy');
                break;
            default:
                iconElement.textContent = '◯';
                stepElement.setAttribute('aria-label', `${stepText}: Pending`);
                stepElement.removeAttribute('aria-busy');
        }
    }

    resetLoadingSteps() {
        ['audio', 'room', 'livekit'].forEach(step => {
            this.updateLoadingStep(step, 'pending');
        });
    }

    // Reconnect indicator management
    createReconnectIndicator() {
        if (this.elements.reconnectIndicator) return;

        const indicator = document.createElement('div');
        indicator.className = 'reconnect-indicator';
        indicator.innerHTML = `
            <div class="reconnect-spinner"></div>
            <span class="reconnect-text">Reconnecting...</span>
        `;
        document.getElementById('app').appendChild(indicator);
        this.elements.reconnectIndicator = indicator;
    }

    showReconnectIndicator(attempt, maxAttempts) {
        this.createReconnectIndicator();
        const text = this.elements.reconnectIndicator.querySelector('.reconnect-text');
        text.textContent = `Reconnecting... (${attempt}/${maxAttempts})`;
        this.elements.reconnectIndicator.classList.add('visible');

        // Also update connection status styling
        const statusContainer = document.getElementById('connection-status');
        statusContainer.classList.add('reconnecting');
    }

    hideReconnectIndicator() {
        if (this.elements.reconnectIndicator) {
            this.elements.reconnectIndicator.classList.remove('visible');
        }

        const statusContainer = document.getElementById('connection-status');
        statusContainer.classList.remove('reconnecting');
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new ChatsuboApp();
    app.init();

    // Expose for debugging
    window.chatsuboApp = app;
});
