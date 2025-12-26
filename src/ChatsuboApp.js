/**
 * ChatsuboApp - Main application controller
 * Integrates all modules: Scene, Network, Audio, AI
 */

import * as THREE from 'three';
import { SceneManager } from './scene/SceneManager.js';
import { MeshNetworkCoordinator } from './network/index.js';
// import { chatsuboAI } from './ai/index.js'; // TEMPORARILY DISABLED: ONNX runtime error
import { SpatialAudioEngine } from './audio/SpatialAudioEngine.js';

export default class ChatsuboApp {
  constructor(canvasElement) {
    this.canvas = canvasElement;

    // Core modules
    this.sceneManager = null;
    this.networkCoordinator = null;
    this.aiModule = null; // chatsuboAI; // TEMPORARILY DISABLED: ONNX runtime error
    this.spatialAudio = null; // SpatialAudioEngine for spatial audio processing

    // Application state
    this.localPeerId = null;
    this.localPosition = { x: 24, y: 0, z: 34 }; // Start at entryway
    this.lastBroadcastPosition = null; // Track last broadcast position for change detection
    this.positionBroadcastInterval = null; // Timer for periodic position updates
    this.localAvatar = null; // User's own avatar mesh
    this.peerPositions = new Map(); // peerId -> {x, y, z}
    this.peerAvatars = new Map(); // peerId -> THREE.Mesh
    this.conversationMessages = [];

    // UI callbacks
    this.onStatusUpdate = null;
    this.onPeerListUpdate = null;
    this.onHeatedConversation = null;
  }

  /**
   * Initialize the complete application
   */
  async initialize() {
    this.updateStatus('Initializing Chatsubo Virtual Bar...');

    try {
      // 1. Initialize 3D scene
      this.updateStatus('Loading 3D environment...');
      this.sceneManager = new SceneManager(this.canvas);
      this.sceneManager.start();
      await this.delay(500);

      // 2. Initialize AI module (TEMPORARILY DISABLED: ONNX runtime error)
      // this.updateStatus('Preparing AI systems...');
      // try {
      //   await this.aiModule.initialize();
      //   console.log('[ChatsuboApp] AI systems ready');
      // } catch (aiError) {
      //   console.warn('[ChatsuboApp] AI initialization failed (non-critical):', aiError.message);
      //   this.updateStatus('AI systems unavailable (continuing without AI features)');
      // }
      // await this.delay(500);
      console.log('[ChatsuboApp] AI systems disabled (ONNX runtime issue)');

      // 3. Initialize spatial audio engine
      this.updateStatus('Setting up spatial audio system...');
      this.spatialAudio = new SpatialAudioEngine({
        minDistance: 50,
        maxDistance: 500,
        rolloffFactor: 2.0,
        defaultZone: 'central_bar',
      });
      try {
        await this.spatialAudio.initialize();
        console.log('[ChatsuboApp] Spatial audio engine ready');
      } catch (audioError) {
        console.warn(
          '[ChatsuboApp] Spatial audio initialization deferred (requires user gesture):',
          audioError.message
        );
        this.updateStatus('Spatial audio will activate after joining room');
      }

      // 4. Initialize network (creates peer ID)
      this.updateStatus('Connecting to P2P network...');
      this.networkCoordinator = new MeshNetworkCoordinator();
      this.setupNetworkHandlers();

      this.updateStatus('Ready! Click "Join Room" to enter the bar.');
    } catch (error) {
      console.error('[ChatsuboApp] Initialization error:', error);
      this.updateStatus(`Error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Join a room and start networking
   */
  async joinRoom(roomId = 'chatsubo-main') {
    if (!this.networkCoordinator) {
      throw new Error('Network not initialized');
    }

    try {
      this.updateStatus(`Joining room: ${roomId}...`);

      // Initialize spatial audio if not ready (user gesture happened)
      if (this.spatialAudio && !this.spatialAudio.isReady()) {
        await this.spatialAudio.initialize();
        console.log('[ChatsuboApp] Spatial audio initialized after user gesture');
      }

      // Join mesh network
      this.localPeerId = await this.networkCoordinator.joinRoom(roomId);

      this.updateStatus(`Connected as: ${this.localPeerId.substring(0, 8)}...`);
      console.log(`[ChatsuboApp] Joined room as: ${this.localPeerId}`);

      // Create local user avatar
      this.createLocalAvatar();

      // Broadcast initial position
      this.broadcastPosition();

      // Start periodic position broadcasting (every 100ms)
      this.startPeriodicPositionBroadcast();
    } catch (error) {
      console.error('[ChatsuboApp] Failed to join room:', error);
      this.updateStatus(`Failed to join: ${error.message}`);
      throw error;
    }
  }

  /**
   * Start periodic position broadcasting (every 100ms when position changes)
   */
  startPeriodicPositionBroadcast() {
    // Clear any existing interval
    if (this.positionBroadcastInterval) {
      clearInterval(this.positionBroadcastInterval);
    }

    // Broadcast position every 100ms if it has changed
    this.positionBroadcastInterval = setInterval(() => {
      if (!this.networkCoordinator || !this.localPeerId) {
        return;
      }

      // Check if position has changed since last broadcast
      const hasChanged =
        !this.lastBroadcastPosition ||
        this.lastBroadcastPosition.x !== this.localPosition.x ||
        this.lastBroadcastPosition.y !== this.localPosition.y ||
        this.lastBroadcastPosition.z !== this.localPosition.z;

      if (hasChanged) {
        this.broadcastPosition();
        // Update last broadcast position
        this.lastBroadcastPosition = { ...this.localPosition };
      }
    }, 100); // 100ms interval as specified in task

    console.log('[ChatsuboApp] Started periodic position broadcasting (100ms interval)');
  }

  /**
   * Stop periodic position broadcasting
   */
  stopPeriodicPositionBroadcast() {
    if (this.positionBroadcastInterval) {
      clearInterval(this.positionBroadcastInterval);
      this.positionBroadcastInterval = null;
      console.log('[ChatsuboApp] Stopped periodic position broadcasting');
    }
  }

  /**
   * Set up network event handlers
   */
  setupNetworkHandlers() {
    // Room joined successfully
    this.networkCoordinator.on('roomJoined', ({ roomId, _peerId }) => {
      console.log(`[ChatsuboApp] Room joined: ${roomId}`);
    });

    // New peer connected
    this.networkCoordinator.on('peerJoined', ({ peerId, roomSize }) => {
      console.log(`[ChatsuboApp] Peer joined: ${peerId} (room size: ${roomSize})`);
      this.createPeerAvatar(peerId);
      this.updatePeerList();
    });

    // Peer disconnected
    this.networkCoordinator.on('peerLeft', ({ peerId, roomSize }) => {
      console.log(`[ChatsuboApp] Peer left: ${peerId} (room size: ${roomSize})`);
      this.removePeerAudio(peerId);
      this.removePeerAvatar(peerId);
      this.peerPositions.delete(peerId);
      this.updatePeerList();
    });

    // Remote audio stream received
    this.networkCoordinator.on('remoteAudioStream', ({ peerId, stream }) => {
      console.log(`[ChatsuboApp] Remote audio from: ${peerId}`);
      this.setupSpatialAudio(peerId, stream);
    });

    // Peer position update
    this.networkCoordinator.on('peerPositionUpdate', ({ peerId, position }) => {
      this.peerPositions.set(peerId, position);
      this.updateSpatialAudio(peerId);
      this.updatePeerAvatar(peerId);
    });

    // Chat message received
    this.networkCoordinator.on('chatMessage', ({ peerId, text, timestamp }) => {
      this.handleChatMessage(peerId, text, timestamp);
    });

    // Room full error
    this.networkCoordinator.on('roomFull', ({ message }) => {
      this.updateStatus(`Room full: ${message}`);
    });

    // Microphone mute/unmute
    this.networkCoordinator.on('microphoneMuted', () => {
      console.log('[ChatsuboApp] Microphone muted');
    });

    this.networkCoordinator.on('microphoneUnmuted', () => {
      console.log('[ChatsuboApp] Microphone unmuted');
    });
  }

  /**
   * Set up spatial audio for a remote peer using SpatialAudioEngine
   */
  setupSpatialAudio(peerId, stream) {
    if (!this.spatialAudio || !this.spatialAudio.isReady()) {
      console.warn('[ChatsuboApp] Spatial audio engine not ready');
      return;
    }

    // Get peer position or default to center of bar
    const position = this.peerPositions.get(peerId) || {
      x: 24,
      y: 0,
      z: 18,
      zoneId: 'central_bar',
    };

    // Add peer to spatial audio engine (wraps MediaStream with GainNode)
    const success = this.spatialAudio.addPeer(peerId, stream, position);

    if (success) {
      console.log(`[ChatsuboApp] Spatial audio setup for: ${peerId}`);
    } else {
      console.error(`[ChatsuboApp] Failed to setup spatial audio for: ${peerId}`);
    }
  }

  /**
   * Update spatial audio based on peer position
   */
  updateSpatialAudio(peerId) {
    if (!this.spatialAudio) return;

    const peerPos = this.peerPositions.get(peerId);
    if (!peerPos) return;

    // Update peer position in spatial audio engine
    this.spatialAudio.updatePeerPosition(peerId, peerPos);

    // Log distance and volume for debugging
    const distance = this.spatialAudio.getDistanceToPeer(peerId);
    const volume = this.spatialAudio.getPeerVolume(peerId);

    if (distance !== null && volume !== null) {
      console.log(
        `[ChatsuboApp] Updated audio for ${peerId}: distance=${distance.toFixed(1)}, volume=${volume.toFixed(2)}`
      );
    }
  }

  /**
   * Remove peer's audio when they disconnect
   */
  removePeerAudio(peerId) {
    if (this.spatialAudio) {
      this.spatialAudio.removePeer(peerId);
      console.log(`[ChatsuboApp] Removed audio for: ${peerId}`);
    }
  }

  /**
   * Create visual avatar for a peer
   */
  createPeerAvatar(peerId) {
    if (!this.sceneManager) return;

    // Create a simple sphere avatar
    const geometry = new THREE.SphereGeometry(0.5, 16, 16);
    const material = new THREE.MeshPhongMaterial({
      color: this.generatePeerColor(peerId),
      emissive: this.generatePeerColor(peerId),
      emissiveIntensity: 0.3,
    });

    const avatar = new THREE.Mesh(geometry, material);

    // Set initial position (center if no position known yet)
    const position = this.peerPositions.get(peerId) || { x: 24, y: 0, z: 18 };
    avatar.position.set(position.x, position.y + 1, position.z); // +1 to raise above floor

    // Add to scene
    this.sceneManager.scene.add(avatar);
    this.peerAvatars.set(peerId, avatar);

    console.log(`[ChatsuboApp] Created avatar for: ${peerId}`);
  }

  /**
   * Update peer avatar position
   */
  updatePeerAvatar(peerId) {
    const avatar = this.peerAvatars.get(peerId);
    const position = this.peerPositions.get(peerId);

    if (avatar && position) {
      avatar.position.set(position.x, position.y + 1, position.z);
    }
  }

  /**
   * Remove peer avatar when they disconnect
   */
  removePeerAvatar(peerId) {
    const avatar = this.peerAvatars.get(peerId);
    if (avatar && this.sceneManager) {
      this.sceneManager.scene.remove(avatar);
      avatar.geometry.dispose();
      avatar.material.dispose();
      this.peerAvatars.delete(peerId);
      console.log(`[ChatsuboApp] Removed avatar for: ${peerId}`);
    }
  }

  /**
   * Generate a consistent color for a peer based on their ID
   */
  generatePeerColor(peerId) {
    // Hash the peerId to get a consistent color
    let hash = 0;
    for (let i = 0; i < peerId.length; i++) {
      hash = peerId.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Convert to HSL color (various hues, high saturation, medium lightness)
    const hue = Math.abs(hash) % 360;
    return new THREE.Color().setHSL(hue / 360, 0.8, 0.6);
  }

  /**
   * Create visual avatar for local user
   */
  createLocalAvatar() {
    if (!this.sceneManager) return;

    // Create a distinct cone shape for local user (pointing up)
    const geometry = new THREE.ConeGeometry(0.5, 1.5, 8);
    const material = new THREE.MeshPhongMaterial({
      color: 0x44ff88, // Bright cyan-green (matches theme)
      emissive: 0x44ff88,
      emissiveIntensity: 0.5,
    });

    this.localAvatar = new THREE.Mesh(geometry, material);

    // Position at current location
    this.localAvatar.position.set(
      this.localPosition.x,
      this.localPosition.y + 1.25, // Raise cone base above floor
      this.localPosition.z
    );

    // Add to scene
    this.sceneManager.scene.add(this.localAvatar);

    console.log(
      `[ChatsuboApp] Created local avatar at (${this.localPosition.x}, ${this.localPosition.z})`
    );
  }

  /**
   * Update local avatar position when user moves
   */
  updateLocalAvatar() {
    if (this.localAvatar) {
      this.localAvatar.position.set(
        this.localPosition.x,
        this.localPosition.y + 1.25,
        this.localPosition.z
      );
    }
  }

  /**
   * Remove local avatar (on disconnect)
   */
  removeLocalAvatar() {
    if (this.localAvatar && this.sceneManager) {
      this.sceneManager.scene.remove(this.localAvatar);
      this.localAvatar.geometry.dispose();
      this.localAvatar.material.dispose();
      this.localAvatar = null;
      console.log('[ChatsuboApp] Removed local avatar');
    }
  }

  /**
   * Handle chat message with sentiment analysis
   */
  async handleChatMessage(peerId, text, timestamp) {
    // Store message
    this.conversationMessages.push({ peerId, text, timestamp });

    // Keep only last 20 messages
    if (this.conversationMessages.length > 20) {
      this.conversationMessages.shift();
    }

    // Analyze sentiment (skip if AI disabled)
    if (this.aiModule) {
      try {
        const sentiment = await this.aiModule.analyzeSentiment(text);
        console.log(
          `[ChatsuboApp] Message sentiment: ${sentiment.label} (${sentiment.score.toFixed(2)})`
        );

        // Check if conversation is heated
        const isHeated = await this.aiModule.isConversationHeated(this.conversationMessages);
        if (isHeated && this.onHeatedConversation) {
          this.onHeatedConversation();
        }
      } catch (error) {
        console.error('[ChatsuboApp] Sentiment analysis error:', error);
      }
    }
  }

  /**
   * Move to a new position in the bar
   */
  moveTo(x, y, z) {
    this.localPosition = { x, y, z };
    console.log(`[ChatsuboApp] Moved to: (${x}, ${y}, ${z})`);

    // Update local avatar position
    this.updateLocalAvatar();

    // Update listener position in spatial audio engine
    if (this.spatialAudio) {
      this.spatialAudio.updateListenerPosition({ x, y, z });
    }

    // Broadcast position to peers
    this.broadcastPosition();
  }

  /**
   * Broadcast current position to all peers
   */
  broadcastPosition() {
    if (this.networkCoordinator) {
      this.networkCoordinator.broadcastPosition(this.localPosition);
    }
  }

  /**
   * Send chat message to all peers
   */
  sendMessage(text) {
    if (this.networkCoordinator) {
      this.networkCoordinator.sendMessage(text);

      // Also process our own message
      this.handleChatMessage(this.localPeerId, text, Date.now());
    }
  }

  /**
   * Toggle microphone mute
   */
  toggleMicrophone() {
    if (this.networkCoordinator) {
      const isMuted = this.networkCoordinator.toggleMicrophone();
      console.log(`[ChatsuboApp] Microphone ${isMuted ? 'muted' : 'unmuted'}`);
      return isMuted;
    }
    return false;
  }

  /**
   * Get current peer count
   */
  getPeerCount() {
    return this.networkCoordinator ? this.networkCoordinator.getPeerCount() : 0;
  }

  /**
   * Get list of all peers
   */
  getPeerList() {
    return this.networkCoordinator ? this.networkCoordinator.getPeerList() : [];
  }

  /**
   * Update peer list UI
   */
  updatePeerList() {
    if (this.onPeerListUpdate) {
      const peers = this.getPeerList();
      this.onPeerListUpdate(peers);
    }
  }

  /**
   * Update status message
   */
  updateStatus(message) {
    console.log(`[Status] ${message}`);
    if (this.onStatusUpdate) {
      this.onStatusUpdate(message);
    }
  }

  /**
   * Utility: delay for async flow
   */
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Clean up all resources
   */
  destroy() {
    // Stop periodic position broadcasting
    this.stopPeriodicPositionBroadcast();

    // Remove local avatar
    this.removeLocalAvatar();

    // Remove all peer avatars
    this.peerAvatars.forEach((avatar, peerId) => {
      this.removePeerAvatar(peerId);
    });

    // Stop scene
    if (this.sceneManager) {
      this.sceneManager.stop();
    }

    // Disconnect network
    if (this.networkCoordinator) {
      this.networkCoordinator.destroy();
    }

    // Destroy spatial audio engine
    if (this.spatialAudio) {
      this.spatialAudio.destroy();
      this.spatialAudio = null;
    }

    // Clear state
    this.peerPositions.clear();
    this.conversationMessages = [];
    this.lastBroadcastPosition = null;

    console.log('[ChatsuboApp] Application destroyed');
  }
}
