/**
 * MeshNetworkCoordinator - Full mesh topology coordination
 * Manages peer discovery, connection state, and room membership
 * Enforces 10-user capacity limit
 */

import PeerConnectionManager from './PeerConnectionManager.js';
import AudioStreamManager from './AudioStreamManager.js';

export default class MeshNetworkCoordinator {
  constructor() {
    this.peerManager = new PeerConnectionManager({ maxPeers: 10 });
    this.audioManager = new AudioStreamManager();
    this.roomId = null;
    this.peerList = new Set(); // All peers in room (including self)
    this.eventHandlers = new Map();
    this.isInitialized = false;
  }

  /**
   * Join a room and establish mesh connections
   */
  async joinRoom(roomId) {
    if (this.isInitialized) {
      throw new Error('Already joined a room');
    }

    this.roomId = roomId;
    console.log(`[MeshNetworkCoordinator] Joining room: ${roomId}`);

    // Initialize peer connection
    const peerId = await this.peerManager.initialize();
    this.peerList.add(peerId);

    // Get local audio stream
    await this.audioManager.getLocalAudioStream();

    // Set up event handlers
    this.setupPeerManagerHandlers();
    this.setupAudioManagerHandlers();

    // Discover existing peers in room
    await this.discoverPeers();

    this.isInitialized = true;
    this.emit('roomJoined', { roomId, peerId });

    console.log(`[MeshNetworkCoordinator] Joined room as: ${peerId}`);
    return peerId;
  }

  /**
   * Discover and connect to existing peers in room
   * In production, this would use a signaling server to get peer list
   * For MVP, we'll use a simple broadcast/discovery mechanism
   */
  async discoverPeers() {
    // TODO: Implement signaling server integration for peer discovery
    // For now, peers must manually connect by sharing peer IDs
    console.log('[MeshNetworkCoordinator] Peer discovery (manual mode)');
  }

  /**
   * Manually connect to a peer by their ID
   */
  async connectToPeer(remotePeerId) {
    if (this.peerList.has(remotePeerId)) {
      console.warn(`Already tracking peer: ${remotePeerId}`);
      return;
    }

    if (this.isRoomFull()) {
      throw new Error('Room is full (10 user limit)');
    }

    try {
      // Establish data connection
      const _conn = await this.peerManager.connectToPeer(remotePeerId);

      // Send peer list to new peer
      this.peerManager.sendToPeer(remotePeerId, {
        type: 'peer_list',
        peers: Array.from(this.peerList),
      });

      this.peerList.add(remotePeerId);

      console.log(`[MeshNetworkCoordinator] Connected to peer: ${remotePeerId}`);
      console.log(`[MeshNetworkCoordinator] Room size: ${this.peerList.size}/10`);
    } catch (error) {
      console.error(`Failed to connect to ${remotePeerId}:`, error);
      throw error;
    }
  }

  /**
   * Handle new peer joining the mesh
   */
  handleNewPeerJoining(peerId) {
    if (this.isRoomFull()) {
      console.warn('[MeshNetworkCoordinator] Room is full, rejecting new peer');
      this.peerManager.sendToPeer(peerId, {
        type: 'room_full',
        message: 'Bar is full (10 user capacity reached)',
      });
      this.peerManager.disconnectFromPeer(peerId);
      return false;
    }

    this.peerList.add(peerId);
    this.emit('peerJoined', { peerId, roomSize: this.peerList.size });

    // Broadcast updated peer list to all
    this.broadcastPeerList();

    return true;
  }

  /**
   * Handle peer leaving the mesh
   */
  handlePeerLeaving(peerId) {
    this.peerList.delete(peerId);
    this.audioManager.removeRemoteStream(peerId);

    this.emit('peerLeft', { peerId, roomSize: this.peerList.size });

    // Notify remaining peers
    this.broadcastPeerList();

    console.log(`[MeshNetworkCoordinator] Peer left: ${peerId}`);
    console.log(`[MeshNetworkCoordinator] Room size: ${this.peerList.size}/10`);
  }

  /**
   * Broadcast peer list to all connected peers
   */
  broadcastPeerList() {
    this.peerManager.broadcast({
      type: 'peer_list',
      peers: Array.from(this.peerList),
    });
  }

  /**
   * Broadcast position update for spatial audio
   */
  broadcastPosition(position) {
    this.peerManager.broadcast({
      type: 'position_update',
      position: position,
    });
  }

  /**
   * Send chat message to all peers
   */
  sendMessage(text) {
    this.peerManager.broadcast({
      type: 'chat_message',
      text: text,
      timestamp: Date.now(),
    });
  }

  /**
   * Set up PeerConnectionManager event handlers
   */
  setupPeerManagerHandlers() {
    this.peerManager.on('peerConnected', ({ peerId }) => {
      this.handleNewPeerJoining(peerId);
    });

    this.peerManager.on('peerDisconnected', ({ peerId }) => {
      this.handlePeerLeaving(peerId);
    });

    this.peerManager.on('dataReceived', ({ peerId, data }) => {
      this.handleDataMessage(peerId, data);
    });

    this.peerManager.on('error', ({ error }) => {
      this.emit('error', { error });
    });
  }

  /**
   * Set up AudioStreamManager event handlers
   */
  setupAudioManagerHandlers() {
    this.audioManager.on('remoteStreamReceived', ({ peerId, stream }) => {
      console.log(`[MeshNetworkCoordinator] Remote audio from: ${peerId}`);
      this.emit('remoteAudioStream', { peerId, stream });
    });

    this.audioManager.on('remoteStreamRemoved', ({ peerId }) => {
      this.emit('remoteAudioRemoved', { peerId });
    });

    this.audioManager.on('localAudioMuted', () => {
      this.emit('microphoneMuted');
    });

    this.audioManager.on('localAudioUnmuted', () => {
      this.emit('microphoneUnmuted');
    });
  }

  /**
   * Handle incoming data messages
   */
  handleDataMessage(peerId, data) {
    switch (data.type) {
      case 'peer_list':
        // Update our peer list
        data.peers.forEach((peer) => {
          if (!this.peerList.has(peer)) {
            this.peerList.add(peer);
          }
        });
        this.emit('peerListUpdate', { peers: Array.from(this.peerList) });
        break;

      case 'position_update':
        this.emit('peerPositionUpdate', {
          peerId,
          position: data.position,
        });
        break;

      case 'chat_message':
        this.emit('chatMessage', {
          peerId,
          text: data.text,
          timestamp: data.timestamp,
        });
        break;

      case 'room_full':
        this.emit('roomFull', { message: data.message });
        break;

      default:
        console.warn(`Unknown message type: ${data.type}`);
    }
  }

  /**
   * Get current room size
   */
  getPeerCount() {
    return this.peerList.size;
  }

  /**
   * Check if room is at capacity
   */
  isRoomFull() {
    return this.peerList.size >= 10;
  }

  /**
   * Get list of all peers in room
   */
  getPeerList() {
    return Array.from(this.peerList);
  }

  /**
   * Toggle microphone mute
   */
  toggleMicrophone() {
    return this.audioManager.toggleMute();
  }

  /**
   * Check if microphone is muted
   */
  isMicrophoneMuted() {
    return this.audioManager.isMicMuted();
  }

  /**
   * Event handling
   */
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(handler);
  }

  emit(event, data) {
    const handlers = this.eventHandlers.get(event) || [];
    handlers.forEach((handler) => handler(data));
  }

  /**
   * Leave room and disconnect from all peers
   */
  leaveRoom() {
    console.log('[MeshNetworkCoordinator] Leaving room...');

    this.peerManager.destroy();
    this.audioManager.destroy();
    this.peerList.clear();
    this.isInitialized = false;

    this.emit('roomLeft', { roomId: this.roomId });
  }

  /**
   * Clean up all resources
   */
  destroy() {
    this.leaveRoom();
  }
}
