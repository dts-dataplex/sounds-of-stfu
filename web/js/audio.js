// Spatial Audio Manager using Web Audio API
class SpatialAudioManager {
    constructor() {
        this.audioContext = null;
        this.listener = null;
        this.masterGain = null;
        this.pannerNodes = new Map(); // participantId -> { panner, gain, source }
        this.initialized = false;
        this.localPosition = { x: 0, y: 0 };
    }

    // Initialize audio context (must be called after user interaction)
    async initialize() {
        if (this.initialized) return true;

        try {
            // Create audio context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // Resume if suspended (browser autoplay policy)
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            // Set up listener (represents local user's ears)
            this.listener = this.audioContext.listener;

            // Set listener orientation (facing into screen)
            if (this.listener.forwardX) {
                this.listener.forwardX.setValueAtTime(0, this.audioContext.currentTime);
                this.listener.forwardY.setValueAtTime(0, this.audioContext.currentTime);
                this.listener.forwardZ.setValueAtTime(-1, this.audioContext.currentTime);
                this.listener.upX.setValueAtTime(0, this.audioContext.currentTime);
                this.listener.upY.setValueAtTime(1, this.audioContext.currentTime);
                this.listener.upZ.setValueAtTime(0, this.audioContext.currentTime);
            } else {
                // Deprecated API fallback
                this.listener.setOrientation(0, 0, -1, 0, 1, 0);
            }

            // Create master gain node
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.setValueAtTime(0.8, this.audioContext.currentTime);
            this.masterGain.connect(this.audioContext.destination);

            this.initialized = true;
            console.log('[Audio] Spatial audio initialized');
            return true;
        } catch (error) {
            console.error('[Audio] Failed to initialize:', error);
            return false;
        }
    }

    // Update local listener position
    setLocalPosition(x, y) {
        if (!this.initialized || !this.listener) return;

        this.localPosition = { x, y };

        // Convert 2D position to 3D (y becomes z, add small height)
        // Scale down for Web Audio API (uses meters)
        const scale = 0.01; // 100 pixels = 1 meter
        const posX = x * scale;
        const posY = 1.7; // Ear height ~1.7m
        const posZ = y * scale;

        if (this.listener.positionX) {
            this.listener.positionX.setValueAtTime(posX, this.audioContext.currentTime);
            this.listener.positionY.setValueAtTime(posY, this.audioContext.currentTime);
            this.listener.positionZ.setValueAtTime(posZ, this.audioContext.currentTime);
        } else {
            this.listener.setPosition(posX, posY, posZ);
        }
    }

    // Add audio track for a remote participant
    addParticipantTrack(participantId, mediaStreamTrack, position = { x: 0, y: 0 }) {
        if (!this.initialized) {
            console.warn('[Audio] Not initialized, cannot add track');
            return null;
        }

        // Remove existing track if any
        this.removeParticipantTrack(participantId);

        try {
            // Create media stream from track
            const mediaStream = new MediaStream([mediaStreamTrack]);

            // Create source from stream
            const source = this.audioContext.createMediaStreamSource(mediaStream);

            // Create panner node for spatial positioning
            const panner = this.audioContext.createPanner();
            panner.panningModel = 'HRTF'; // Head-related transfer function for realistic 3D audio
            panner.distanceModel = 'inverse';
            panner.refDistance = Config.AUDIO.REF_DISTANCE * 0.01;
            panner.maxDistance = Config.AUDIO.MAX_DISTANCE * 0.01;
            panner.rolloffFactor = Config.AUDIO.ROLLOFF_FACTOR;
            panner.coneInnerAngle = Config.AUDIO.CONE_INNER_ANGLE;
            panner.coneOuterAngle = Config.AUDIO.CONE_OUTER_ANGLE;
            panner.coneOuterGain = Config.AUDIO.CONE_OUTER_GAIN;

            // Create gain node for individual volume control
            const gain = this.audioContext.createGain();
            gain.gain.setValueAtTime(1, this.audioContext.currentTime);

            // Connect: source -> panner -> gain -> master -> destination
            source.connect(panner);
            panner.connect(gain);
            gain.connect(this.masterGain);

            // Set initial position
            this.updateParticipantPosition(participantId, position, panner);

            // Store nodes
            this.pannerNodes.set(participantId, { source, panner, gain, mediaStream });

            console.log(`[Audio] Added track for participant: ${participantId}`);
            return { source, panner, gain };
        } catch (error) {
            console.error(`[Audio] Failed to add track for ${participantId}:`, error);
            return null;
        }
    }

    // Update participant position (call when they move)
    updateParticipantPosition(participantId, position, pannerOverride = null) {
        const nodes = this.pannerNodes.get(participantId);
        const panner = pannerOverride || (nodes ? nodes.panner : null);

        if (!panner) return;

        // Convert 2D to 3D position
        const scale = 0.01;
        const posX = position.x * scale;
        const posY = 1.7; // Same ear height
        const posZ = position.y * scale;

        if (panner.positionX) {
            panner.positionX.setValueAtTime(posX, this.audioContext.currentTime);
            panner.positionY.setValueAtTime(posY, this.audioContext.currentTime);
            panner.positionZ.setValueAtTime(posZ, this.audioContext.currentTime);
        } else {
            panner.setPosition(posX, posY, posZ);
        }
    }

    // Apply zone-based acoustic multiplier
    applyZoneMultiplier(participantId, zoneId) {
        const nodes = this.pannerNodes.get(participantId);
        if (!nodes) return;

        const zone = Config.ZONES[zoneId] || Config.ZONES.main_bar;
        const multiplier = zone.acousticMultiplier;

        // Apply multiplier to gain
        nodes.gain.gain.setTargetAtTime(
            multiplier,
            this.audioContext.currentTime,
            0.1 // Smooth transition
        );
    }

    // Set individual participant volume (0-1)
    setParticipantVolume(participantId, volume) {
        const nodes = this.pannerNodes.get(participantId);
        if (!nodes) return;

        nodes.gain.gain.setTargetAtTime(
            Math.max(0, Math.min(1, volume)),
            this.audioContext.currentTime,
            0.05
        );
    }

    // Remove participant audio
    removeParticipantTrack(participantId) {
        const nodes = this.pannerNodes.get(participantId);
        if (!nodes) return;

        try {
            nodes.source.disconnect();
            nodes.panner.disconnect();
            nodes.gain.disconnect();
            this.pannerNodes.delete(participantId);
            console.log(`[Audio] Removed track for participant: ${participantId}`);
        } catch (error) {
            console.error(`[Audio] Error removing track for ${participantId}:`, error);
        }
    }

    // Set master volume (0-1)
    setMasterVolume(volume) {
        if (!this.masterGain) return;

        this.masterGain.gain.setTargetAtTime(
            Math.max(0, Math.min(1, volume)),
            this.audioContext.currentTime,
            0.05
        );
    }

    // Calculate distance between two positions
    calculateDistance(pos1, pos2) {
        const dx = pos2.x - pos1.x;
        const dy = pos2.y - pos1.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    // Get volume level for a participant based on distance
    getVolumeForDistance(distance) {
        if (distance <= Config.AUDIO.REF_DISTANCE) return 1;
        if (distance >= Config.AUDIO.MAX_DISTANCE) return 0;

        // Inverse falloff
        return Config.AUDIO.REF_DISTANCE /
            (Config.AUDIO.REF_DISTANCE + Config.AUDIO.ROLLOFF_FACTOR *
            (distance - Config.AUDIO.REF_DISTANCE));
    }

    // Clean up all audio
    destroy() {
        // Remove all participant tracks
        for (const participantId of this.pannerNodes.keys()) {
            this.removeParticipantTrack(participantId);
        }

        // Close audio context
        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close();
        }

        this.initialized = false;
        console.log('[Audio] Spatial audio destroyed');
    }
}

// Export singleton instance
const spatialAudio = new SpatialAudioManager();
