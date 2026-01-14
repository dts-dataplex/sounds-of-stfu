// LiveKit Client Connection Manager
class LiveKitManager {
    constructor() {
        this.room = null;
        this.localParticipant = null;
        this.localAudioTrack = null;
        this.connected = false;
        this.connecting = false;
        this.isMuted = true;

        // Callbacks
        this.onConnectionStateChange = null;
        this.onParticipantConnected = null;
        this.onParticipantDisconnected = null;
        this.onTrackSubscribed = null;
        this.onTrackUnsubscribed = null;
        this.onError = null;

        // Reconnection state
        this.reconnectAttempts = 0;
        this.reconnectTimeout = null;
    }

    // Get LiveKit token from backend
    async getToken(roomName, username) {
        const response = await fetch(`${Config.API_BASE}/api/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roomName, username })
        });

        if (!response.ok) {
            throw new Error(`Failed to get token: ${response.statusText}`);
        }

        const data = await response.json();
        return data.token;
    }

    // Connect to LiveKit room
    async connect(roomName, username, livekitUrl = null) {
        if (this.connecting || this.connected) {
            console.warn('[LiveKit] Already connecting or connected');
            return false;
        }

        this.connecting = true;
        this.updateConnectionState('connecting');

        try {
            // Get token from backend
            const token = await this.getToken(roomName, username);

            // Determine LiveKit URL (from config or passed in)
            // For local dev, LiveKit runs on ws://localhost:7880
            const url = livekitUrl || this.getLiveKitUrl();

            // Create room instance
            this.room = new LivekitClient.Room({
                adaptiveStream: true,
                dynacast: true,
                // Audio settings for spatial audio
                audioCaptureDefaults: {
                    autoGainControl: true,
                    echoCancellation: true,
                    noiseSuppression: true
                }
            });

            // Set up event handlers
            this.setupEventHandlers();

            // Connect to room
            await this.room.connect(url, token);

            this.localParticipant = this.room.localParticipant;
            this.connected = true;
            this.connecting = false;
            this.reconnectAttempts = 0;

            this.updateConnectionState('connected');
            console.log('[LiveKit] Connected to room:', roomName);

            return true;
        } catch (error) {
            console.error('[LiveKit] Connection failed:', error);
            this.connecting = false;
            this.connected = false;
            this.updateConnectionState('disconnected');

            if (this.onError) {
                this.onError(error);
            }

            return false;
        }
    }

    // Get LiveKit server URL
    getLiveKitUrl() {
        // In production, this would come from config
        // For local Docker setup, LiveKit runs on port 7880
        const isSecure = window.location.protocol === 'https:';
        const host = window.location.hostname;

        // If running locally with Docker, LiveKit is on port 7880
        if (host === 'localhost' || host === '127.0.0.1') {
            return `ws://${host}:7880`;
        }

        // Production would use secure WebSocket
        return `${isSecure ? 'wss' : 'ws'}://${host}:7880`;
    }

    // Set up LiveKit event handlers
    setupEventHandlers() {
        if (!this.room) return;

        // Connection state changes
        this.room.on(LivekitClient.RoomEvent.ConnectionStateChanged, (state) => {
            console.log('[LiveKit] Connection state:', state);
            this.updateConnectionState(state);
        });

        // Participant connected
        this.room.on(LivekitClient.RoomEvent.ParticipantConnected, (participant) => {
            console.log('[LiveKit] Participant connected:', participant.identity);
            if (this.onParticipantConnected) {
                this.onParticipantConnected(participant);
            }
        });

        // Participant disconnected
        this.room.on(LivekitClient.RoomEvent.ParticipantDisconnected, (participant) => {
            console.log('[LiveKit] Participant disconnected:', participant.identity);
            if (this.onParticipantDisconnected) {
                this.onParticipantDisconnected(participant);
            }
        });

        // Track subscribed (remote participant's audio)
        this.room.on(LivekitClient.RoomEvent.TrackSubscribed, (track, publication, participant) => {
            console.log('[LiveKit] Track subscribed:', track.kind, 'from', participant.identity);
            if (track.kind === 'audio' && this.onTrackSubscribed) {
                this.onTrackSubscribed(track, participant);
            }
        });

        // Track unsubscribed
        this.room.on(LivekitClient.RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
            console.log('[LiveKit] Track unsubscribed:', track.kind, 'from', participant.identity);
            if (track.kind === 'audio' && this.onTrackUnsubscribed) {
                this.onTrackUnsubscribed(track, participant);
            }
        });

        // Disconnected
        this.room.on(LivekitClient.RoomEvent.Disconnected, (reason) => {
            console.log('[LiveKit] Disconnected:', reason);
            this.connected = false;
            this.updateConnectionState('disconnected');

            // Attempt reconnection if not intentional
            if (reason !== 'CLIENT_INITIATED') {
                this.scheduleReconnect();
            }
        });

        // Reconnecting
        this.room.on(LivekitClient.RoomEvent.Reconnecting, () => {
            console.log('[LiveKit] Reconnecting...');
            this.updateConnectionState('reconnecting');
        });

        // Reconnected
        this.room.on(LivekitClient.RoomEvent.Reconnected, () => {
            console.log('[LiveKit] Reconnected');
            this.connected = true;
            this.reconnectAttempts = 0;
            this.updateConnectionState('connected');
        });
    }

    // Enable microphone (start publishing audio)
    async enableMicrophone() {
        if (!this.connected || !this.localParticipant) {
            console.warn('[LiveKit] Not connected, cannot enable mic');
            return false;
        }

        try {
            // Enable microphone through LiveKit
            await this.localParticipant.setMicrophoneEnabled(true);

            // Get the local audio track using the correct SDK property
            const micPub = this.localParticipant.getTrackPublication(LivekitClient.Track.Source.Microphone);
            if (micPub && micPub.track) {
                this.localAudioTrack = micPub.track;
            }

            this.isMuted = false;
            console.log('[LiveKit] Microphone enabled');
            return true;
        } catch (error) {
            console.error('[LiveKit] Failed to enable microphone:', error);
            if (this.onError) {
                this.onError(error);
            }
            return false;
        }
    }

    // Disable microphone (stop publishing audio)
    async disableMicrophone() {
        if (!this.connected || !this.localParticipant) {
            return;
        }

        try {
            await this.localParticipant.setMicrophoneEnabled(false);
            this.localAudioTrack = null;
            this.isMuted = true;
            console.log('[LiveKit] Microphone disabled');
        } catch (error) {
            console.error('[LiveKit] Failed to disable microphone:', error);
        }
    }

    // Toggle microphone
    async toggleMicrophone() {
        if (this.isMuted) {
            return await this.enableMicrophone();
        } else {
            await this.disableMicrophone();
            return true;
        }
    }

    // Get all remote participants
    getRemoteParticipants() {
        if (!this.room) return [];
        return Array.from(this.room.remoteParticipants.values());
    }

    // Update connection state and notify
    updateConnectionState(state) {
        if (this.onConnectionStateChange) {
            this.onConnectionStateChange(state);
        }
    }

    // Schedule reconnection attempt
    scheduleReconnect() {
        if (this.reconnectAttempts >= Config.RECONNECT.MAX_ATTEMPTS) {
            console.log('[LiveKit] Max reconnect attempts reached');
            if (this.onError) {
                this.onError(new Error('Max reconnection attempts reached'));
            }
            return;
        }

        // Exponential backoff
        const delay = Math.min(
            Config.RECONNECT.BASE_DELAY * Math.pow(2, this.reconnectAttempts),
            Config.RECONNECT.MAX_DELAY
        );

        console.log(`[LiveKit] Scheduling reconnect in ${delay}ms (attempt ${this.reconnectAttempts + 1})`);

        this.reconnectTimeout = setTimeout(() => {
            this.reconnectAttempts++;
            // Note: LiveKit SDK handles reconnection automatically in most cases
            // This is for manual reconnection after complete disconnect
        }, delay);
    }

    // Disconnect from room
    async disconnect() {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }

        if (this.room) {
            try {
                await this.room.disconnect();
            } catch (error) {
                console.error('[LiveKit] Error during disconnect:', error);
            }
        }

        this.room = null;
        this.localParticipant = null;
        this.localAudioTrack = null;
        this.connected = false;
        this.connecting = false;
        this.isMuted = true;

        console.log('[LiveKit] Disconnected');
    }
}

// Export singleton instance
const livekit = new LiveKitManager();
