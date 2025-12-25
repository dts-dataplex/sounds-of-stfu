/**
 * ChatsuboApp - Main application controller
 * Integrates all modules: Scene, Network, Audio, AI
 */

import { SceneManager } from './scene/SceneManager.js';
import { MeshNetworkCoordinator } from './network/index.js';
import { chatsuboAI } from './ai/index.js';
import { calculateSpatialGain } from './audio/spatial-falloff.js';

export default class ChatsuboApp {
  constructor(canvasElement) {
    this.canvas = canvasElement;

    // Core modules
    this.sceneManager = null;
    this.networkCoordinator = null;
    this.aiModule = chatsuboAI;

    // Application state
    this.localPeerId = null;
    this.localPosition = { x: 24, y: 0, z: 18 }; // Start at center bar
    this.peerPositions = new Map(); // peerId -> {x, y, z}
    this.audioContext = null;
    this.spatialAudioNodes = new Map(); // peerId -> {source, gain, panner}
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

      // 2. Initialize AI module (lazy loaded)
      this.updateStatus('Preparing AI systems...');
      await this.aiModule.initialize();
      await this.delay(500);

      // 3. Initialize audio context (user gesture required)
      this.updateStatus('Setting up audio system...');
      await this.initializeAudio();

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

      // Join mesh network
      this.localPeerId = await this.networkCoordinator.joinRoom(roomId);

      this.updateStatus(`Connected as: ${this.localPeerId.substring(0, 8)}...`);
      console.log(`[ChatsuboApp] Joined room as: ${this.localPeerId}`);

      // Broadcast initial position
      this.broadcastPosition();
    } catch (error) {
      console.error('[ChatsuboApp] Failed to join room:', error);
      this.updateStatus(`Failed to join: ${error.message}`);
      throw error;
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
      this.updatePeerList();
    });

    // Peer disconnected
    this.networkCoordinator.on('peerLeft', ({ peerId, roomSize }) => {
      console.log(`[ChatsuboApp] Peer left: ${peerId} (room size: ${roomSize})`);
      this.removePeerAudio(peerId);
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
   * Initialize Web Audio API
   */
  async initializeAudio() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

      // Resume audio context (required after user gesture)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      console.log('[ChatsuboApp] Audio context initialized');
    }
  }

  /**
   * Set up spatial audio for a remote peer
   */
  setupSpatialAudio(peerId, stream) {
    if (!this.audioContext) {
      console.warn('[ChatsuboApp] Audio context not initialized');
      return;
    }

    // Create audio nodes
    const source = this.audioContext.createMediaStreamSource(stream);
    const gainNode = this.audioContext.createGain();
    const pannerNode = this.audioContext.createPanner();

    // Configure panner for 3D audio
    pannerNode.panningModel = 'HRTF';
    pannerNode.distanceModel = 'inverse';
    pannerNode.refDistance = 1;
    pannerNode.maxDistance = 100;
    pannerNode.rolloffFactor = 1;

    // Connect: source -> gain -> panner -> destination
    source.connect(gainNode);
    gainNode.connect(pannerNode);
    pannerNode.connect(this.audioContext.destination);

    // Store nodes for later updates
    this.spatialAudioNodes.set(peerId, {
      source,
      gain: gainNode,
      panner: pannerNode,
      stream,
    });

    // Initial position update
    this.updateSpatialAudio(peerId);

    console.log(`[ChatsuboApp] Spatial audio setup for: ${peerId}`);
  }

  /**
   * Update spatial audio based on peer position
   */
  updateSpatialAudio(peerId) {
    const nodes = this.spatialAudioNodes.get(peerId);
    if (!nodes) return;

    const peerPos = this.peerPositions.get(peerId);
    if (!peerPos) return;

    // Calculate distance
    const dx = peerPos.x - this.localPosition.x;
    const dy = peerPos.y - this.localPosition.y;
    const dz = peerPos.z - this.localPosition.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

    // Update panner position
    nodes.panner.setPosition(peerPos.x, peerPos.y, peerPos.z);

    // Calculate spatial gain using our algorithm
    const spatialGain = calculateSpatialGain(distance, 8.0); // 8.0 = typical falloff distance
    nodes.gain.gain.value = spatialGain;

    console.log(
      `[ChatsuboApp] Updated audio for ${peerId}: distance=${distance.toFixed(1)}, gain=${spatialGain.toFixed(2)}`
    );
  }

  /**
   * Remove peer's audio when they disconnect
   */
  removePeerAudio(peerId) {
    const nodes = this.spatialAudioNodes.get(peerId);
    if (nodes) {
      nodes.source.disconnect();
      nodes.gain.disconnect();
      nodes.panner.disconnect();
      this.spatialAudioNodes.delete(peerId);
      console.log(`[ChatsuboApp] Removed audio for: ${peerId}`);
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

    // Analyze sentiment
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

  /**
   * Move to a new position in the bar
   */
  moveTo(x, y, z) {
    this.localPosition = { x, y, z };
    console.log(`[ChatsuboApp] Moved to: (${x}, ${y}, ${z})`);

    // Update all spatial audio
    this.spatialAudioNodes.forEach((nodes, peerId) => {
      this.updateSpatialAudio(peerId);
    });

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
    // Stop scene
    if (this.sceneManager) {
      this.sceneManager.stop();
    }

    // Disconnect network
    if (this.networkCoordinator) {
      this.networkCoordinator.destroy();
    }

    // Close audio context
    if (this.audioContext) {
      this.audioContext.close();
    }

    // Clear state
    this.spatialAudioNodes.clear();
    this.peerPositions.clear();
    this.conversationMessages = [];

    console.log('[ChatsuboApp] Application destroyed');
  }
}
