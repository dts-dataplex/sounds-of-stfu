/**
 * Spatial Audio Engine
 * Chatsubo Virtual Bar - Sounds of STFU
 *
 * Core spatial audio engine using Web Audio API with distance-based volume mixing.
 * Manages gain nodes for each peer connection and updates spatial audio in real-time.
 *
 * @module SpatialAudioEngine
 */

import { calculateDistance, calculateVolumeForSource } from './spatial-falloff.js';

/**
 * SpatialAudioEngine manages spatial audio for peer-to-peer voice connections.
 * Each peer gets a dedicated gain node that controls volume based on spatial position.
 */
export class SpatialAudioEngine {
  constructor(options = {}) {
    this.audioContext = null;
    this.masterGainNode = null;
    this.peerGainNodes = new Map(); // peerId -> GainNode
    this.peerPositions = new Map(); // peerId -> {x, y, z, zoneId}
    this.listenerPosition = { x: 0, y: 0, z: 0 }; // Listener is always at origin
    this.spatialEnabled = true;
    this.masterVolume = options.masterVolume || 1.0;

    // Default spatial audio configuration
    this.config = {
      minDistance: options.minDistance || 50, // px
      maxDistance: options.maxDistance || 500, // px
      rolloffFactor: options.rolloffFactor || 2.0,
      defaultZone: options.defaultZone || 'central_bar',
    };

    this.initialized = false;
  }

  /**
   * Initialize the Web Audio API context and master gain node.
   * Must be called after user interaction due to browser autoplay policies.
   *
   * @returns {Promise<boolean>} True if initialization succeeded
   */
  async initialize() {
    try {
      // Create AudioContext (suspended until user interaction)
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

      // Resume context if suspended (handles autoplay policy)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      // Create master gain node for global volume control
      this.masterGainNode = this.audioContext.createGain();
      this.masterGainNode.gain.value = this.masterVolume;
      this.masterGainNode.connect(this.audioContext.destination);

      this.initialized = true;
      console.log('[SpatialAudioEngine] Initialized successfully', {
        sampleRate: this.audioContext.sampleRate,
        state: this.audioContext.state,
      });

      return true;
    } catch (error) {
      console.error('[SpatialAudioEngine] Initialization failed:', error);
      this.initialized = false;
      return false;
    }
  }

  /**
   * Add a peer's audio stream to the spatial audio engine.
   * Creates a dedicated gain node for volume control based on position.
   *
   * @param {string} peerId - Unique identifier for the peer
   * @param {MediaStream} mediaStream - Audio stream from peer connection
   * @param {Object} initialPosition - Initial position {x, y, z, zoneId}
   * @returns {boolean} True if peer was added successfully
   */
  addPeer(peerId, mediaStream, initialPosition = { x: 0, y: 0, z: 0, zoneId: 'central_bar' }) {
    if (!this.initialized) {
      console.error('[SpatialAudioEngine] Cannot add peer - engine not initialized');
      return false;
    }

    if (this.peerGainNodes.has(peerId)) {
      console.warn('[SpatialAudioEngine] Peer already exists, updating stream:', peerId);
      this.removePeer(peerId);
    }

    try {
      // Create media source from stream
      const source = this.audioContext.createMediaStreamSource(mediaStream);

      // Create dedicated gain node for this peer
      const gainNode = this.audioContext.createGain();
      gainNode.gain.value = 1.0; // Will be updated by updatePeerPosition

      // Connect: source -> gain -> master -> destination
      source.connect(gainNode);
      gainNode.connect(this.masterGainNode);

      // Store gain node and position
      this.peerGainNodes.set(peerId, gainNode);
      this.peerPositions.set(peerId, initialPosition);

      // Calculate initial volume
      this.updatePeerPosition(peerId, initialPosition);

      console.log('[SpatialAudioEngine] Added peer:', peerId, initialPosition);
      return true;
    } catch (error) {
      console.error('[SpatialAudioEngine] Failed to add peer:', peerId, error);
      return false;
    }
  }

  /**
   * Remove a peer from the spatial audio engine.
   * Disconnects and cleans up the peer's gain node.
   *
   * @param {string} peerId - Unique identifier for the peer
   */
  removePeer(peerId) {
    const gainNode = this.peerGainNodes.get(peerId);
    if (gainNode) {
      gainNode.disconnect();
      this.peerGainNodes.delete(peerId);
      this.peerPositions.delete(peerId);
      console.log('[SpatialAudioEngine] Removed peer:', peerId);
    }
  }

  /**
   * Update a peer's position and recalculate spatial volume.
   * This is the core spatial audio function called frequently during movement.
   *
   * @param {string} peerId - Unique identifier for the peer
   * @param {Object} position - New position {x, y, z, zoneId}
   */
  updatePeerPosition(peerId, position) {
    const gainNode = this.peerGainNodes.get(peerId);
    if (!gainNode) {
      console.warn('[SpatialAudioEngine] Cannot update position - peer not found:', peerId);
      return;
    }

    // Store updated position
    this.peerPositions.set(peerId, position);

    // Skip spatial calculation if disabled
    if (!this.spatialEnabled) {
      gainNode.gain.value = this.masterVolume;
      return;
    }

    // Calculate volume based on distance and zone configuration
    const volume = calculateVolumeForSource(
      this.listenerPosition,
      position,
      position.zoneId || this.config.defaultZone,
      { use3D: true, manualVolume: 1.0 }
    );

    // Apply volume to gain node with smooth ramping (50ms) to avoid clicks
    const currentTime = this.audioContext.currentTime;
    gainNode.gain.setValueAtTime(gainNode.gain.value, currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, currentTime + 0.05);
  }

  /**
   * Update the listener's position (typically the local user).
   * Recalculates volume for all peers based on new listener position.
   *
   * @param {Object} position - New listener position {x, y, z}
   */
  updateListenerPosition(position) {
    this.listenerPosition = position;

    // Recalculate volume for all peers
    for (const [peerId, peerPos] of this.peerPositions.entries()) {
      this.updatePeerPosition(peerId, peerPos);
    }
  }

  /**
   * Set master volume (affects all peers equally).
   *
   * @param {number} volume - Volume level (0.0 to 1.0)
   */
  setMasterVolume(volume) {
    if (volume < 0 || volume > 1) {
      console.error('[SpatialAudioEngine] Invalid master volume:', volume);
      return;
    }

    this.masterVolume = volume;
    if (this.masterGainNode) {
      const currentTime = this.audioContext.currentTime;
      this.masterGainNode.gain.setValueAtTime(this.masterGainNode.gain.value, currentTime);
      this.masterGainNode.gain.linearRampToValueAtTime(volume, currentTime + 0.05);
    }
  }

  /**
   * Enable or disable spatial audio.
   * When disabled, all peers are heard at full volume.
   *
   * @param {boolean} enabled - Whether spatial audio is enabled
   */
  setSpatialEnabled(enabled) {
    this.spatialEnabled = enabled;

    // Update all peer volumes
    for (const [peerId, position] of this.peerPositions.entries()) {
      this.updatePeerPosition(peerId, position);
    }

    console.log('[SpatialAudioEngine] Spatial audio', enabled ? 'enabled' : 'disabled');
  }

  /**
   * Get current distance to a specific peer.
   *
   * @param {string} peerId - Unique identifier for the peer
   * @returns {number|null} Distance in pixels, or null if peer not found
   */
  getDistanceToPeer(peerId) {
    const peerPos = this.peerPositions.get(peerId);
    if (!peerPos) {
      return null;
    }

    return calculateDistance(this.listenerPosition, peerPos);
  }

  /**
   * Get current volume level for a specific peer.
   *
   * @param {string} peerId - Unique identifier for the peer
   * @returns {number|null} Volume level (0.0 to 1.0), or null if peer not found
   */
  getPeerVolume(peerId) {
    const gainNode = this.peerGainNodes.get(peerId);
    if (!gainNode) {
      return null;
    }

    return gainNode.gain.value;
  }

  /**
   * Get information about all connected peers.
   *
   * @returns {Array} Array of peer info objects {peerId, position, distance, volume}
   */
  getAllPeersInfo() {
    const peersInfo = [];

    for (const [peerId, position] of this.peerPositions.entries()) {
      peersInfo.push({
        peerId,
        position,
        distance: this.getDistanceToPeer(peerId),
        volume: this.getPeerVolume(peerId),
      });
    }

    return peersInfo;
  }

  /**
   * Clean up resources and disconnect all audio nodes.
   * Should be called when shutting down the application.
   */
  destroy() {
    // Disconnect all peer gain nodes
    for (const gainNode of this.peerGainNodes.values()) {
      gainNode.disconnect();
    }

    // Disconnect master gain
    if (this.masterGainNode) {
      this.masterGainNode.disconnect();
    }

    // Close audio context
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }

    // Clear all maps
    this.peerGainNodes.clear();
    this.peerPositions.clear();

    this.initialized = false;
    console.log('[SpatialAudioEngine] Destroyed');
  }

  /**
   * Check if the engine is initialized and ready.
   *
   * @returns {boolean} True if initialized
   */
  isReady() {
    return this.initialized && this.audioContext && this.audioContext.state === 'running';
  }

  /**
   * Get current state information for debugging.
   *
   * @returns {Object} State object with engine status
   */
  getState() {
    return {
      initialized: this.initialized,
      audioContextState: this.audioContext ? this.audioContext.state : 'not_created',
      spatialEnabled: this.spatialEnabled,
      masterVolume: this.masterVolume,
      peerCount: this.peerGainNodes.size,
      listenerPosition: this.listenerPosition,
    };
  }
}
