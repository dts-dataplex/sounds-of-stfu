// Spatial Audio Manager using Web Audio API
class SpatialAudioManager {
    constructor() {
        this.audioContext = null;
        this.listener = null;
        this.masterGain = null;
        this.pannerNodes = new Map(); // participantId -> { panner, gain, source, analyser, audioLevel }
        this.initialized = false;
        this.localPosition = { x: 0, y: 0 };

        // Audio level detection
        this.analyserUpdateInterval = null;
        this.audioLevels = new Map(); // participantId -> { level, isSpeaking, lastUpdate }
        this.speakingThreshold = 0.02; // Threshold for "speaking" detection
        this.speakingCallbacks = new Set(); // Callbacks for speaking state changes

        // Zone effects
        this.zoneFilters = new Map(); // participantId -> BiquadFilterNode
        this.listenerZoneFilter = null; // Filter applied based on local user's zone
        this.currentLocalZone = null;
        this.zoneTransitionTime = 0.3; // Smooth zone transitions (seconds)

        // Proximity grouping
        this.participantPositions = new Map(); // participantId -> { x, y }
        this.conversationClusters = []; // Array of { id, participants: Set, centroid: {x, y}, zone, activity }
        this.proximityThreshold = 100; // Distance to be considered "in conversation"
        this.clusterCallbacks = new Set(); // Callbacks for cluster changes
        this.clusterUpdateInterval = null;
        this.lastClusterUpdate = 0;
        this.clusterUpdateRate = 500; // Update clusters every 500ms
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

            // Create listener zone filter (affects all incoming audio based on local user's zone)
            this.listenerZoneFilter = this.audioContext.createBiquadFilter();
            this.listenerZoneFilter.type = 'peaking'; // Start neutral
            this.listenerZoneFilter.frequency.setValueAtTime(1000, this.audioContext.currentTime);
            this.listenerZoneFilter.gain.setValueAtTime(0, this.audioContext.currentTime);
            this.listenerZoneFilter.Q.setValueAtTime(1.0, this.audioContext.currentTime);

            // Connect: masterGain -> listenerZoneFilter -> destination
            this.masterGain.connect(this.listenerZoneFilter);
            this.listenerZoneFilter.connect(this.audioContext.destination);

            this.initialized = true;
            console.log('[Audio] Spatial audio initialized with zone filter system');
            return true;
        } catch (error) {
            console.error('[Audio] Failed to initialize:', error);
            return false;
        }
    }

    // Start audio level detection for all participants
    startAudioLevelDetection() {
        if (this.analyserUpdateInterval) return;

        this.analyserUpdateInterval = setInterval(() => {
            this.updateAudioLevels();
        }, 50); // Update every 50ms for smooth visualization
    }

    // Stop audio level detection
    stopAudioLevelDetection() {
        if (this.analyserUpdateInterval) {
            clearInterval(this.analyserUpdateInterval);
            this.analyserUpdateInterval = null;
        }
    }

    // Update audio levels for all participants
    updateAudioLevels() {
        const now = Date.now();

        for (const [participantId, nodes] of this.pannerNodes) {
            if (!nodes.analyser) continue;

            const dataArray = new Uint8Array(nodes.analyser.frequencyBinCount);
            nodes.analyser.getByteFrequencyData(dataArray);

            // Calculate RMS level
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i] * dataArray[i];
            }
            const rms = Math.sqrt(sum / dataArray.length) / 255;

            // Get previous state
            const prevState = this.audioLevels.get(participantId) || { level: 0, isSpeaking: false };
            const wasSpeaking = prevState.isSpeaking;
            const isSpeaking = rms > this.speakingThreshold;

            // Update state
            this.audioLevels.set(participantId, {
                level: rms,
                isSpeaking,
                lastUpdate: now
            });

            // Notify if speaking state changed
            if (isSpeaking !== wasSpeaking) {
                this.notifySpeakingChange(participantId, isSpeaking, rms);
            }
        }
    }

    // Register callback for speaking state changes
    onSpeakingChange(callback) {
        this.speakingCallbacks.add(callback);
        return () => this.speakingCallbacks.delete(callback);
    }

    // Notify all callbacks of speaking change
    notifySpeakingChange(participantId, isSpeaking, level) {
        for (const callback of this.speakingCallbacks) {
            try {
                callback(participantId, isSpeaking, level);
            } catch (error) {
                console.error('[Audio] Speaking callback error:', error);
            }
        }
    }

    // Get audio level for a participant
    getAudioLevel(participantId) {
        const state = this.audioLevels.get(participantId);
        return state ? state.level : 0;
    }

    // Get all audio levels (for visualization)
    getAllAudioLevels() {
        const levels = {};
        for (const [participantId, state] of this.audioLevels) {
            levels[participantId] = {
                level: state.level,
                isSpeaking: state.isSpeaking
            };
        }
        return levels;
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

        // Check for zone transition
        const newZone = Config.getZoneAt(x, y);
        if (newZone.id !== this.currentLocalZone) {
            this.applyListenerZoneFilter(newZone.id);
        }
    }

    // Apply zone filter based on local listener's position
    applyListenerZoneFilter(zoneId) {
        if (!this.initialized || !this.listenerZoneFilter) return;

        const prevZone = this.currentLocalZone;
        this.currentLocalZone = zoneId;

        // Get zone filter profile from config
        const filterProfile = Config.AUDIO.ZONE_FILTERS[zoneId] || Config.AUDIO.ZONE_FILTERS.main_bar;
        const currentTime = this.audioContext.currentTime;

        console.log(`[Audio] Zone transition: ${prevZone || 'none'} -> ${zoneId}`);

        // Smoothly transition filter parameters
        this.listenerZoneFilter.type = filterProfile.type;
        this.listenerZoneFilter.frequency.setTargetAtTime(
            filterProfile.frequency,
            currentTime,
            this.zoneTransitionTime
        );
        this.listenerZoneFilter.Q.setTargetAtTime(
            filterProfile.Q,
            currentTime,
            this.zoneTransitionTime
        );

        // Only set gain for filter types that support it
        if (filterProfile.type !== 'lowpass' && filterProfile.type !== 'highpass') {
            this.listenerZoneFilter.gain.setTargetAtTime(
                filterProfile.gain,
                currentTime,
                this.zoneTransitionTime
            );
        }

        // Notify zone change callbacks if any
        this.notifyZoneChange(prevZone, zoneId);
    }

    // Zone change notification system
    notifyZoneChange(fromZone, toZone) {
        // Can be extended with callbacks like speaking state
        console.log(`[Audio] Zone acoustic change: ${fromZone} -> ${toZone}`);
    }

    // Get current zone
    getCurrentZone() {
        return this.currentLocalZone;
    }

    // ==================== PROXIMITY GROUPING ====================

    // Start proximity cluster tracking
    startProximityTracking() {
        if (this.clusterUpdateInterval) return;

        this.clusterUpdateInterval = setInterval(() => {
            this.updateProximityClusters();
        }, this.clusterUpdateRate);

        console.log('[Audio] Proximity tracking started');
    }

    // Stop proximity cluster tracking
    stopProximityTracking() {
        if (this.clusterUpdateInterval) {
            clearInterval(this.clusterUpdateInterval);
            this.clusterUpdateInterval = null;
        }
    }

    // Update participant position for proximity tracking
    trackParticipantPosition(participantId, position) {
        this.participantPositions.set(participantId, { x: position.x, y: position.y });
    }

    // Remove participant from proximity tracking
    untrackParticipant(participantId) {
        this.participantPositions.delete(participantId);
    }

    // Update conversation clusters using union-find algorithm
    updateProximityClusters() {
        const positions = Array.from(this.participantPositions.entries());
        if (positions.length === 0) {
            if (this.conversationClusters.length > 0) {
                this.conversationClusters = [];
                this.notifyClusterChange();
            }
            return;
        }

        // Build adjacency list based on proximity
        const adjacency = new Map();
        for (const [id] of positions) {
            adjacency.set(id, new Set());
        }

        // Find all pairs within proximity threshold
        for (let i = 0; i < positions.length; i++) {
            for (let j = i + 1; j < positions.length; j++) {
                const [id1, pos1] = positions[i];
                const [id2, pos2] = positions[j];
                const distance = this.calculateDistance(pos1, pos2);

                if (distance <= this.proximityThreshold) {
                    adjacency.get(id1).add(id2);
                    adjacency.get(id2).add(id1);
                }
            }
        }

        // Find connected components (clusters) using BFS
        const visited = new Set();
        const newClusters = [];
        let clusterId = 0;

        for (const [startId] of positions) {
            if (visited.has(startId)) continue;

            // BFS to find all connected participants
            const cluster = new Set();
            const queue = [startId];

            while (queue.length > 0) {
                const current = queue.shift();
                if (visited.has(current)) continue;

                visited.add(current);
                cluster.add(current);

                for (const neighbor of adjacency.get(current)) {
                    if (!visited.has(neighbor)) {
                        queue.push(neighbor);
                    }
                }
            }

            // Only create cluster if more than one participant
            if (cluster.size > 1) {
                const clusterData = this.computeClusterData(clusterId++, cluster);
                newClusters.push(clusterData);
            }
        }

        // Check if clusters changed
        if (this.clustersChanged(newClusters)) {
            this.conversationClusters = newClusters;
            this.notifyClusterChange();
        }
    }

    // Compute cluster metadata (centroid, zone, activity level)
    computeClusterData(id, participants) {
        let sumX = 0, sumY = 0;
        let totalActivity = 0;
        let speakingCount = 0;

        for (const participantId of participants) {
            const pos = this.participantPositions.get(participantId);
            if (pos) {
                sumX += pos.x;
                sumY += pos.y;
            }

            // Get audio activity level
            const audioState = this.audioLevels.get(participantId);
            if (audioState) {
                totalActivity += audioState.level;
                if (audioState.isSpeaking) speakingCount++;
            }
        }

        const centroid = {
            x: sumX / participants.size,
            y: sumY / participants.size
        };

        // Determine primary zone for cluster
        const zone = Config.getZoneAt(centroid.x, centroid.y);

        return {
            id,
            participants: new Set(participants),
            centroid,
            zone: zone.id,
            zoneName: zone.name,
            activity: totalActivity / participants.size,
            speakingCount,
            size: participants.size
        };
    }

    // Check if clusters have changed
    clustersChanged(newClusters) {
        if (newClusters.length !== this.conversationClusters.length) {
            return true;
        }

        // Compare cluster membership
        for (let i = 0; i < newClusters.length; i++) {
            const newParticipants = Array.from(newClusters[i].participants).sort();
            const oldParticipants = Array.from(this.conversationClusters[i]?.participants || []).sort();

            if (newParticipants.length !== oldParticipants.length) return true;
            for (let j = 0; j < newParticipants.length; j++) {
                if (newParticipants[j] !== oldParticipants[j]) return true;
            }
        }

        return false;
    }

    // Register callback for cluster changes
    onClusterChange(callback) {
        this.clusterCallbacks.add(callback);
        return () => this.clusterCallbacks.delete(callback);
    }

    // Notify all callbacks of cluster change
    notifyClusterChange() {
        const clusterData = this.getProximityClusters();
        for (const callback of this.clusterCallbacks) {
            try {
                callback(clusterData);
            } catch (error) {
                console.error('[Audio] Cluster callback error:', error);
            }
        }
    }

    // Get current proximity clusters (for heat map visualization)
    getProximityClusters() {
        return this.conversationClusters.map(cluster => ({
            id: cluster.id,
            participants: Array.from(cluster.participants),
            centroid: { ...cluster.centroid },
            zone: cluster.zone,
            zoneName: cluster.zoneName,
            activity: cluster.activity,
            speakingCount: cluster.speakingCount,
            size: cluster.size,
            // Heat map intensity based on activity and size
            intensity: Math.min(1, (cluster.activity * 5 + cluster.size * 0.2))
        }));
    }

    // Get cluster containing a specific participant
    getParticipantCluster(participantId) {
        for (const cluster of this.conversationClusters) {
            if (cluster.participants.has(participantId)) {
                return {
                    id: cluster.id,
                    participants: Array.from(cluster.participants),
                    centroid: cluster.centroid,
                    zone: cluster.zone,
                    size: cluster.size
                };
            }
        }
        return null;
    }

    // Check if two participants are in the same conversation cluster
    areInSameCluster(participant1, participant2) {
        for (const cluster of this.conversationClusters) {
            if (cluster.participants.has(participant1) && cluster.participants.has(participant2)) {
                return true;
            }
        }
        return false;
    }

    // ==================== END PROXIMITY GROUPING ====================

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

            // Create analyser node for audio level detection
            const analyser = this.audioContext.createAnalyser();
            analyser.fftSize = 256;
            analyser.smoothingTimeConstant = 0.8;

            // Create zone filter for this participant (affects audio based on their zone)
            const zoneFilter = this.audioContext.createBiquadFilter();
            zoneFilter.type = 'peaking'; // Start neutral
            zoneFilter.frequency.setValueAtTime(1000, this.audioContext.currentTime);
            zoneFilter.gain.setValueAtTime(0, this.audioContext.currentTime);
            zoneFilter.Q.setValueAtTime(1.0, this.audioContext.currentTime);

            // Connect: source -> analyser -> zoneFilter -> panner -> gain -> master -> destination
            source.connect(analyser);
            analyser.connect(zoneFilter);
            zoneFilter.connect(panner);
            panner.connect(gain);
            gain.connect(this.masterGain);

            // Set initial position
            this.updateParticipantPosition(participantId, position, panner);

            // Apply zone filter based on initial position
            const initialZone = Config.getZoneAt(position.x, position.y);
            this.applyParticipantZoneFilter(participantId, initialZone.id, zoneFilter);

            // Store nodes (including zone filter)
            this.pannerNodes.set(participantId, { source, panner, gain, analyser, zoneFilter, mediaStream });
            this.zoneFilters.set(participantId, { filter: zoneFilter, currentZone: initialZone.id });

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

    // Apply zone-based acoustic multiplier and filter
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

        // Apply zone filter if participant moved to a new zone
        const zoneState = this.zoneFilters.get(participantId);
        if (zoneState && zoneState.currentZone !== zoneId) {
            this.applyParticipantZoneFilter(participantId, zoneId, nodes.zoneFilter);
            zoneState.currentZone = zoneId;
        }
    }

    // Apply zone filter to a specific participant
    applyParticipantZoneFilter(participantId, zoneId, filterOverride = null) {
        const nodes = this.pannerNodes.get(participantId);
        const zoneFilter = filterOverride || (nodes ? nodes.zoneFilter : null);

        if (!zoneFilter) return;

        // Get zone filter profile from config
        const filterProfile = Config.AUDIO.ZONE_FILTERS[zoneId] || Config.AUDIO.ZONE_FILTERS.main_bar;
        const currentTime = this.audioContext.currentTime;

        // Smoothly transition filter parameters
        zoneFilter.type = filterProfile.type;
        zoneFilter.frequency.setTargetAtTime(
            filterProfile.frequency,
            currentTime,
            this.zoneTransitionTime
        );
        zoneFilter.Q.setTargetAtTime(
            filterProfile.Q,
            currentTime,
            this.zoneTransitionTime
        );

        // Only set gain for filter types that support it
        if (filterProfile.type !== 'lowpass' && filterProfile.type !== 'highpass') {
            zoneFilter.gain.setTargetAtTime(
                filterProfile.gain,
                currentTime,
                this.zoneTransitionTime
            );
        }

        console.log(`[Audio] Participant ${participantId} zone filter: ${zoneId}`);
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
            if (nodes.analyser) nodes.analyser.disconnect();
            if (nodes.zoneFilter) nodes.zoneFilter.disconnect();
            nodes.panner.disconnect();
            nodes.gain.disconnect();
            this.pannerNodes.delete(participantId);
            this.audioLevels.delete(participantId);
            this.zoneFilters.delete(participantId);

            // Remove from proximity tracking
            this.untrackParticipant(participantId);

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
        // Stop audio level detection
        this.stopAudioLevelDetection();

        // Stop proximity tracking
        this.stopProximityTracking();

        // Remove all participant tracks
        for (const participantId of this.pannerNodes.keys()) {
            this.removeParticipantTrack(participantId);
        }

        // Clear proximity data
        this.participantPositions.clear();
        this.conversationClusters = [];
        this.clusterCallbacks.clear();
        this.speakingCallbacks.clear();

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
