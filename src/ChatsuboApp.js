/**
 * ChatsuboApp - Main application controller
 * Integrates all modules: Scene, Network, Audio, AI
 */

import * as THREE from 'three';
import { SceneManager } from './scene/SceneManager.js';
import { MeshNetworkCoordinator } from './network/index.js';
// AI module is loaded dynamically based on device capability
import { calculateSpatialGain } from './audio/spatial-falloff.js';
import AudioChunkProcessor from './ai/AudioChunkProcessor.js';

export default class ChatsuboApp {
  constructor(canvasElement) {
    this.canvas = canvasElement;

    // Core modules
    this.sceneManager = null;
    this.networkCoordinator = null;
    this.aiModule = null;
    this.aiEnabled = false; // Set after capability detection

    // Application state
    this.localPeerId = null;
    this.localPosition = { x: 24, y: 0, z: 34 }; // Start at entryway
    this.localAvatar = null; // User's own avatar mesh
    this.localUsername = null; // User's display name
    this.localNameSprite = null; // Username label sprite
    this.peerPositions = new Map(); // peerId -> {x, y, z}
    this.peerAvatars = new Map(); // peerId -> THREE.Mesh
    this.peerNameSprites = new Map(); // peerId -> THREE.Sprite
    this.audioContext = null;
    this.spatialAudioNodes = new Map(); // peerId -> {source, gain, panner, analyser, audioData}
    this.conversationMessages = [];
    this.peerVoiceActivityIntervals = new Map(); // peerId -> intervalId

    // Audio range settings
    this.audioRange = 15; // Default hearing distance in feet
    this.rangeCircle = null; // Visual indicator of audio range

    // Audio transcription
    this.audioChunkProcessor = null;
    this.sttEnabled = false;

    // Voice activity detection for local user
    this.localAudioAnalyser = null;
    this.localAudioData = null;
    this.isSpeaking = false;
    this.voiceActivityInterval = null;
    this.speakingThreshold = 0.02; // Audio level threshold for "speaking"

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

      // 2. Check AI capability and initialize if device supports it
      this.updateStatus('Checking AI capabilities...');
      try {
        const { detectAICapability, chatsuboAI } = await import('./ai/index.js');
        const { capable, reason } = await detectAICapability();

        if (capable) {
          this.updateStatus('Preparing AI systems...');
          await chatsuboAI.initialize();
          this.aiModule = chatsuboAI;
          this.aiEnabled = true;
          console.log('[ChatsuboApp] AI systems ready');

          // Initialize STT for audio conversation analysis (progressive enhancement)
          this.initializeSTT();
        } else {
          console.log(`[ChatsuboApp] AI disabled: ${reason}`);
          this.updateStatus(`AI unavailable: ${reason}`);
        }
      } catch (aiError) {
        console.warn('[ChatsuboApp] AI initialization failed (non-critical):', aiError.message);
        this.updateStatus('AI systems unavailable (continuing without AI features)');
      }
      await this.delay(500);

      // 3. Initialize audio context (user gesture required - non-blocking)
      this.updateStatus('Setting up audio system...');
      try {
        await this.initializeAudio();
        console.log('[ChatsuboApp] Audio system ready');
      } catch (audioError) {
        console.warn(
          '[ChatsuboApp] Audio initialization deferred (requires user gesture):',
          audioError.message
        );
        this.updateStatus('Audio will activate after joining room');
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

      // Resume audio context if suspended (user gesture happened)
      if (this.audioContext && this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
        console.log('[ChatsuboApp] Audio context resumed after user gesture');
      }

      // Join mesh network
      this.localPeerId = await this.networkCoordinator.joinRoom(roomId);

      this.updateStatus(`Connected as: ${this.localPeerId.substring(0, 8)}...`);
      console.log(`[ChatsuboApp] Joined room as: ${this.localPeerId}`);

      // Create local user avatar
      this.createLocalAvatar();

      // Set up voice activity detection for local avatar highlighting
      this.setupVoiceActivityDetection();

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
   * Initialize Web Audio API
   */
  async initializeAudio() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

      // AudioContext starts suspended - will resume on user gesture (Join Room click)
      if (this.audioContext.state === 'suspended') {
        console.log('[ChatsuboApp] Audio context created (suspended until user gesture)');
      } else {
        console.log('[ChatsuboApp] Audio context initialized');
      }
    }
  }

  /**
   * Set up voice activity detection to highlight local avatar when speaking
   */
  setupVoiceActivityDetection() {
    if (!this.audioContext || !this.networkCoordinator) {
      console.warn('[ChatsuboApp] Cannot set up voice detection: audio or network not ready');
      return;
    }

    // Get local audio stream from network coordinator
    const localStream = this.networkCoordinator.audioManager?.localStream;
    if (!localStream) {
      console.warn('[ChatsuboApp] No local audio stream for voice detection');
      return;
    }

    try {
      // Create analyser node for the local audio
      this.localAudioAnalyser = this.audioContext.createAnalyser();
      this.localAudioAnalyser.fftSize = 256;
      this.localAudioAnalyser.smoothingTimeConstant = 0.5;

      // Connect local stream to analyser (not to destination - we don't want to hear ourselves)
      const source = this.audioContext.createMediaStreamSource(localStream);
      source.connect(this.localAudioAnalyser);

      // Create buffer for audio data
      this.localAudioData = new Float32Array(this.localAudioAnalyser.frequencyBinCount);

      // Start monitoring audio levels
      this.voiceActivityInterval = setInterval(() => {
        this.checkVoiceActivity();
      }, 50); // Check every 50ms for responsive feedback

      console.log('[ChatsuboApp] Voice activity detection enabled');
    } catch (error) {
      console.error('[ChatsuboApp] Failed to set up voice detection:', error);
    }
  }

  /**
   * Check current audio level and update avatar highlight
   */
  checkVoiceActivity() {
    if (!this.localAudioAnalyser || !this.localAudioData) return;

    // Get current audio level
    this.localAudioAnalyser.getFloatTimeDomainData(this.localAudioData);

    // Calculate RMS (root mean square) for audio level
    let sum = 0;
    for (let i = 0; i < this.localAudioData.length; i++) {
      sum += this.localAudioData[i] * this.localAudioData[i];
    }
    const rms = Math.sqrt(sum / this.localAudioData.length);

    // Determine if speaking based on threshold
    const wasSpeaking = this.isSpeaking;
    this.isSpeaking = rms > this.speakingThreshold;

    // Update avatar if state changed
    if (this.isSpeaking !== wasSpeaking) {
      this.highlightLocalAvatar(this.isSpeaking);
    }
  }

  /**
   * Highlight or unhighlight local avatar based on speaking state
   */
  highlightLocalAvatar(isHighlighted) {
    if (!this.localAvatar) return;

    if (isHighlighted) {
      // Brighten avatar and scale up when speaking
      this.localAvatar.material.emissiveIntensity = 1.0;
      this.localAvatar.scale.set(1.3, 1.3, 1.3);

      // Also brighten the name sprite if it exists
      if (this.localNameSprite) {
        this.localNameSprite.material.opacity = 1.0;
        this.localNameSprite.scale.set(3.6, 0.9, 1.2);
      }
    } else {
      // Return to normal when not speaking
      this.localAvatar.material.emissiveIntensity = 0.5;
      this.localAvatar.scale.set(1.0, 1.0, 1.0);

      if (this.localNameSprite) {
        this.localNameSprite.material.opacity = 0.8;
        this.localNameSprite.scale.set(3, 0.75, 1);
      }
    }
  }

  /**
   * Stop voice activity detection
   */
  stopVoiceActivityDetection() {
    if (this.voiceActivityInterval) {
      clearInterval(this.voiceActivityInterval);
      this.voiceActivityInterval = null;
    }
    this.localAudioAnalyser = null;
    this.localAudioData = null;
    this.isSpeaking = false;
  }

  /**
   * Initialize speech-to-text for audio conversation analysis
   * Loads asynchronously (non-blocking) as Whisper model is larger
   */
  async initializeSTT() {
    if (!this.aiModule || !this.aiEnabled) {
      console.log('[ChatsuboApp] STT skipped: AI not enabled');
      return;
    }

    try {
      console.log('[ChatsuboApp] Loading speech-to-text for audio analysis...');

      // Initialize the audio chunk processor
      this.audioChunkProcessor = new AudioChunkProcessor({
        sampleRate: 16000, // Whisper requirement
        chunkDuration: 5000, // 5 second chunks
        silenceThreshold: 0.01,
      });
      await this.audioChunkProcessor.initialize();

      // Set up callback for when audio chunks are ready
      this.audioChunkProcessor.onChunkReady = async (peerId, audioData) => {
        await this.handleAudioChunk(peerId, audioData);
      };

      // Initialize STT on AI module (loads Whisper model)
      await this.aiModule.initializeSTT();
      this.sttEnabled = true;

      console.log('[ChatsuboApp] Speech-to-text ready for audio conversations');
    } catch (error) {
      console.warn('[ChatsuboApp] STT initialization failed (non-critical):', error.message);
      this.sttEnabled = false;
    }
  }

  /**
   * Handle audio chunk from peer for transcription and sentiment analysis
   */
  async handleAudioChunk(peerId, audioData) {
    if (!this.sttEnabled || !this.aiModule) return;

    try {
      const result = await this.aiModule.processAudioForSentiment(peerId, audioData);

      if (result) {
        console.log(
          `[ChatsuboApp] [${peerId.substring(0, 8)}] "${result.text}" ` +
            `[${result.sentiment.label}: ${result.sentiment.score.toFixed(2)}] ` +
            `(STT: ${result.latency.stt}ms, Sentiment: ${result.latency.sentiment}ms)`
        );

        // Store transcribed message for heated conversation detection
        this.conversationMessages.push({
          peerId,
          text: result.text,
          timestamp: Date.now(),
          source: 'audio',
        });

        // Keep only last 20 messages
        if (this.conversationMessages.length > 20) {
          this.conversationMessages.shift();
        }

        // Check if conversation is heated
        const isHeated = await this.aiModule.isConversationHeated(this.conversationMessages);
        if (isHeated && this.onHeatedConversation) {
          this.onHeatedConversation();
        }
      }
    } catch (error) {
      console.error('[ChatsuboApp] Audio transcription error:', error);
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

    // Create analyser for voice activity detection
    const analyser = this.audioContext.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.5;
    const audioData = new Float32Array(analyser.frequencyBinCount);

    // Configure panner for 3D audio
    pannerNode.panningModel = 'HRTF';
    pannerNode.distanceModel = 'inverse';
    pannerNode.refDistance = 1;
    pannerNode.maxDistance = 100;
    pannerNode.rolloffFactor = 1;

    // Connect: source -> analyser -> gain -> panner -> destination
    source.connect(analyser);
    analyser.connect(gainNode);
    gainNode.connect(pannerNode);
    pannerNode.connect(this.audioContext.destination);

    // Store nodes for later updates
    this.spatialAudioNodes.set(peerId, {
      source,
      gain: gainNode,
      panner: pannerNode,
      analyser,
      audioData,
      stream,
      isSpeaking: false,
    });

    // Initial position update
    this.updateSpatialAudio(peerId);

    // Set up voice activity detection for this peer
    this.setupPeerVoiceActivityDetection(peerId);

    // Start audio chunk processing for transcription if STT is enabled
    if (this.sttEnabled && this.audioChunkProcessor) {
      this.audioChunkProcessor.startProcessing(peerId, stream);
      console.log(`[ChatsuboApp] Audio transcription started for: ${peerId}`);
    }

    console.log(`[ChatsuboApp] Spatial audio setup for: ${peerId}`);
  }

  /**
   * Set up voice activity detection for a remote peer
   */
  setupPeerVoiceActivityDetection(peerId) {
    const nodes = this.spatialAudioNodes.get(peerId);
    if (!nodes || !nodes.analyser) return;

    const intervalId = setInterval(() => {
      this.checkPeerVoiceActivity(peerId);
    }, 50);

    this.peerVoiceActivityIntervals.set(peerId, intervalId);
  }

  /**
   * Check voice activity for a remote peer and update their avatar
   */
  checkPeerVoiceActivity(peerId) {
    const nodes = this.spatialAudioNodes.get(peerId);
    if (!nodes || !nodes.analyser || !nodes.audioData) return;

    // Get current audio level
    nodes.analyser.getFloatTimeDomainData(nodes.audioData);

    // Calculate RMS
    let sum = 0;
    for (let i = 0; i < nodes.audioData.length; i++) {
      sum += nodes.audioData[i] * nodes.audioData[i];
    }
    const rms = Math.sqrt(sum / nodes.audioData.length);

    // Determine if speaking
    const wasSpeaking = nodes.isSpeaking;
    nodes.isSpeaking = rms > this.speakingThreshold;

    // Update avatar if state changed
    if (nodes.isSpeaking !== wasSpeaking) {
      this.highlightPeerAvatar(peerId, nodes.isSpeaking);
    }
  }

  /**
   * Highlight or unhighlight a peer's avatar based on speaking state
   */
  highlightPeerAvatar(peerId, isHighlighted) {
    const avatar = this.peerAvatars.get(peerId);
    if (!avatar) return;

    if (isHighlighted) {
      avatar.material.emissiveIntensity = 1.0;
      avatar.scale.set(1.3, 1.3, 1.3);
    } else {
      avatar.material.emissiveIntensity = 0.3;
      avatar.scale.set(1.0, 1.0, 1.0);
    }
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
    // Stop voice activity detection for this peer
    const intervalId = this.peerVoiceActivityIntervals.get(peerId);
    if (intervalId) {
      clearInterval(intervalId);
      this.peerVoiceActivityIntervals.delete(peerId);
    }

    // Stop audio chunk processing for transcription
    if (this.audioChunkProcessor) {
      this.audioChunkProcessor.stopProcessing(peerId);
    }

    const nodes = this.spatialAudioNodes.get(peerId);
    if (nodes) {
      nodes.source.disconnect();
      if (nodes.analyser) nodes.analyser.disconnect();
      nodes.gain.disconnect();
      nodes.panner.disconnect();
      this.spatialAudioNodes.delete(peerId);
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

    // Create username label sprite
    if (this.localUsername) {
      this.localNameSprite = this.createTextSprite(this.localUsername, 0x44ff88);
      this.localNameSprite.position.set(
        this.localPosition.x,
        this.localPosition.y + 2.5,
        this.localPosition.z
      );
      this.sceneManager.scene.add(this.localNameSprite);
    }

    // Create audio range circle
    this.createRangeCircle();

    console.log(
      `[ChatsuboApp] Created local avatar at (${this.localPosition.x}, ${this.localPosition.z})`
    );
  }

  /**
   * Create a text sprite for displaying names
   */
  createTextSprite(text, color) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 64;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = 'bold 28px Arial';
    ctx.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(3, 0.75, 1);

    return sprite;
  }

  /**
   * Create the visual audio range circle
   */
  createRangeCircle() {
    if (this.rangeCircle) {
      this.sceneManager.scene.remove(this.rangeCircle);
      this.rangeCircle.geometry.dispose();
      this.rangeCircle.material.dispose();
    }

    // Create a ring geometry for the circle
    const geometry = new THREE.RingGeometry(this.audioRange - 0.1, this.audioRange, 64);
    const material = new THREE.MeshBasicMaterial({
      color: 0x44ff88,
      opacity: 0.3,
      transparent: true,
      side: THREE.DoubleSide,
    });

    this.rangeCircle = new THREE.Mesh(geometry, material);
    this.rangeCircle.rotation.x = -Math.PI / 2; // Lay flat on ground
    this.rangeCircle.position.set(
      this.localPosition.x,
      0.05, // Just above the floor
      this.localPosition.z
    );

    this.sceneManager.scene.add(this.rangeCircle);
  }

  /**
   * Update the audio range and resize the circle
   */
  setAudioRange(range) {
    this.audioRange = range;
    if (this.rangeCircle && this.sceneManager) {
      // Recreate circle with new size
      this.createRangeCircle();
    }
    console.log(`[ChatsuboApp] Audio range set to ${range}ft`);
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
    // Update name sprite position
    if (this.localNameSprite) {
      this.localNameSprite.position.set(
        this.localPosition.x,
        this.localPosition.y + 2.5,
        this.localPosition.z
      );
    }
    // Update range circle position
    if (this.rangeCircle) {
      this.rangeCircle.position.set(
        this.localPosition.x,
        0.05,
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
    }
    // Remove name sprite
    if (this.localNameSprite && this.sceneManager) {
      this.sceneManager.scene.remove(this.localNameSprite);
      this.localNameSprite.material.map.dispose();
      this.localNameSprite.material.dispose();
      this.localNameSprite = null;
    }
    // Remove range circle
    if (this.rangeCircle && this.sceneManager) {
      this.sceneManager.scene.remove(this.rangeCircle);
      this.rangeCircle.geometry.dispose();
      this.rangeCircle.material.dispose();
      this.rangeCircle = null;
    }
    console.log('[ChatsuboApp] Removed local avatar');
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
    if (this.aiEnabled && this.aiModule) {
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
    // Stop voice activity detection
    this.stopVoiceActivityDetection();

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

    // Clean up audio chunk processor
    if (this.audioChunkProcessor) {
      this.audioChunkProcessor.destroy();
      this.audioChunkProcessor = null;
    }

    // Clean up STT
    if (this.aiModule && this.sttEnabled) {
      this.aiModule.destroySTT();
    }
    this.sttEnabled = false;

    // Close audio context
    if (this.audioContext) {
      this.audioContext.close();
    }

    // Clear all peer voice activity intervals
    this.peerVoiceActivityIntervals.forEach((intervalId) => clearInterval(intervalId));
    this.peerVoiceActivityIntervals.clear();

    // Clear state
    this.spatialAudioNodes.clear();
    this.peerPositions.clear();
    this.conversationMessages = [];

    console.log('[ChatsuboApp] Application destroyed');
  }
}
