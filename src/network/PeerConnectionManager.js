/**
 * PeerConnectionManager - Core WebRTC peer connection handling
 * Manages peer discovery, connection lifecycle, and mesh topology
 */

import Peer from 'peerjs';

export default class PeerConnectionManager {
  constructor(config = {}) {
    this.peerId = null;
    this.peer = null;
    this.connections = new Map(); // peerId -> DataConnection
    this.maxPeers = config.maxPeers || 10;
    this.eventHandlers = new Map();

    // PeerJS configuration with public cloud server
    this.peerConfig = {
      host: '0.peerjs.com',
      port: 443,
      path: '/',
      secure: true,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      },
      ...config.peerConfig,
    };
  }

  /**
   * Initialize PeerJS connection
   */
  async initialize(peerId = null) {
    return new Promise((resolve, reject) => {
      this.peer = new Peer(peerId, this.peerConfig);

      this.peer.on('open', (id) => {
        this.peerId = id;
        console.log('[PeerConnectionManager] Connected with ID:', id);
        this.emit('ready', { peerId: id });
        resolve(id);
      });

      this.peer.on('error', (error) => {
        console.error('[PeerConnectionManager] Error:', error);
        this.emit('error', { error });
        reject(error);
      });

      this.peer.on('connection', (conn) => {
        this.handleIncomingConnection(conn);
      });

      this.peer.on('disconnected', () => {
        console.warn('[PeerConnectionManager] Disconnected from signaling server');
        this.emit('disconnected');
      });

      this.peer.on('close', () => {
        console.log('[PeerConnectionManager] Connection closed');
        this.emit('closed');
      });
    });
  }

  /**
   * Connect to a specific peer
   */
  async connectToPeer(remotePeerId) {
    if (this.connections.has(remotePeerId)) {
      console.warn(`Already connected to peer: ${remotePeerId}`);
      return this.connections.get(remotePeerId);
    }

    if (this.connections.size >= this.maxPeers) {
      throw new Error('Maximum peer connections reached');
    }

    return new Promise((resolve, reject) => {
      const conn = this.peer.connect(remotePeerId, {
        reliable: true,
        serialization: 'json',
      });

      this.setupConnectionHandlers(conn);

      conn.on('open', () => {
        this.connections.set(remotePeerId, conn);
        this.emit('peerConnected', { peerId: remotePeerId, connection: conn });
        resolve(conn);
      });

      conn.on('error', (error) => {
        console.error(`Connection error with ${remotePeerId}:`, error);
        reject(error);
      });
    });
  }

  /**
   * Handle incoming connection from remote peer
   */
  handleIncomingConnection(conn) {
    console.log('[PeerConnectionManager] Incoming connection from:', conn.peer);

    if (this.connections.size >= this.maxPeers) {
      console.warn('Maximum connections reached, rejecting:', conn.peer);
      conn.close();
      return;
    }

    this.setupConnectionHandlers(conn);

    conn.on('open', () => {
      this.connections.set(conn.peer, conn);
      this.emit('peerConnected', { peerId: conn.peer, connection: conn });
    });
  }

  /**
   * Set up event handlers for a connection
   */
  setupConnectionHandlers(conn) {
    conn.on('data', (data) => {
      this.emit('dataReceived', { peerId: conn.peer, data });
    });

    conn.on('close', () => {
      console.log('[PeerConnectionManager] Connection closed:', conn.peer);
      this.connections.delete(conn.peer);
      this.emit('peerDisconnected', { peerId: conn.peer });
    });

    conn.on('error', (error) => {
      console.error('[PeerConnectionManager] Connection error:', conn.peer, error);
      this.emit('connectionError', { peerId: conn.peer, error });
    });
  }

  /**
   * Send data to a specific peer
   */
  sendToPeer(peerId, data) {
    const conn = this.connections.get(peerId);
    if (!conn) {
      console.warn(`No connection to peer: ${peerId}`);
      return false;
    }

    try {
      conn.send(data);
      return true;
    } catch (error) {
      console.error(`Error sending to ${peerId}:`, error);
      return false;
    }
  }

  /**
   * Broadcast data to all connected peers
   */
  broadcast(data) {
    let sent = 0;
    this.connections.forEach((conn, peerId) => {
      if (this.sendToPeer(peerId, data)) {
        sent++;
      }
    });
    return sent;
  }

  /**
   * Disconnect from a specific peer
   */
  disconnectFromPeer(peerId) {
    const conn = this.connections.get(peerId);
    if (conn) {
      conn.close();
      this.connections.delete(peerId);
    }
  }

  /**
   * Get list of connected peer IDs
   */
  getConnectedPeers() {
    return Array.from(this.connections.keys());
  }

  /**
   * Get connection count
   */
  getPeerCount() {
    return this.connections.size;
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
   * Clean up and disconnect all peers
   */
  destroy() {
    this.connections.forEach((conn) => conn.close());
    this.connections.clear();

    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
  }
}
