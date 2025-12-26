/**
 * SignalingClient - WebSocket client for peer discovery
 *
 * Manages WebSocket connection to the signaling server for automatic peer discovery.
 * Handles room joining, peer list updates, and automatic reconnection.
 *
 * Features:
 * - Automatic reconnection with exponential backoff
 * - Room-based peer discovery
 * - Event-driven architecture
 * - Graceful error handling
 */

/* global WebSocket */

export default class SignalingClient {
  constructor() {
    this.ws = null;
    this.peerId = null;
    this.roomId = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // Start with 1 second
    this.reconnectTimer = null;
    this.eventHandlers = new Map();
    this.pingInterval = null;
  }

  /**
   * Connect to the signaling server
   */
  connect() {
    return new Promise((resolve, reject) => {
      try {
        // Connect to standalone signaling server on port 9000
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const hostname = window.location.hostname;
        const wsUrl = `${protocol}//${hostname}:9000/`;

        console.log(`[SignalingClient] Connecting to ${wsUrl}`);

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('[SignalingClient] WebSocket connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.reconnectDelay = 1000; // Reset delay
          this.startPing();
          this.emit('connected');
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('[SignalingClient] Failed to parse message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('[SignalingClient] WebSocket error:', error);
          this.emit('error', { error });
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('[SignalingClient] WebSocket disconnected');
          this.isConnected = false;
          this.stopPing();
          this.emit('disconnected');
          this.attemptReconnect();
        };
      } catch (error) {
        console.error('[SignalingClient] Connection failed:', error);
        reject(error);
      }
    });
  }

  /**
   * Handle incoming messages from the server
   */
  handleMessage(message) {
    const { type } = message;

    console.log(`[SignalingClient] Received: ${type}`, message);

    switch (type) {
      case 'welcome':
        // Server acknowledged connection
        console.log(`[SignalingClient] ${message.message}`);
        break;

      case 'peer_list':
        // Initial peer list or update
        this.emit('peerList', {
          peers: message.peers.filter((p) => p !== this.peerId), // Exclude self
          roomId: message.roomId,
        });
        break;

      case 'peer_joined':
        // New peer joined the room
        this.emit('peerJoined', {
          peerId: message.peerId,
          peers: message.peers.filter((p) => p !== this.peerId),
        });
        break;

      case 'peer_left':
        // Peer left the room
        this.emit('peerLeft', {
          peerId: message.peerId,
          peers: message.peers.filter((p) => p !== this.peerId),
        });
        break;

      case 'room_full':
        // Room is at capacity
        this.emit('roomFull', { message: message.message });
        break;

      case 'pong':
        // Server responded to ping
        break;

      case 'error':
        // Server reported an error
        console.error(`[SignalingClient] Server error: ${message.message}`);
        this.emit('error', { error: new Error(message.message) });
        break;

      default:
        console.warn(`[SignalingClient] Unknown message type: ${type}`);
    }
  }

  /**
   * Join a room with the given peer ID
   */
  async joinRoom(roomId, peerId) {
    if (!this.isConnected) {
      await this.connect();
    }

    this.roomId = roomId;
    this.peerId = peerId;

    console.log(`[SignalingClient] Joining room ${roomId} as ${peerId}`);

    this.send({
      type: 'join',
      roomId: roomId,
      peerId: peerId,
    });
  }

  /**
   * Leave the current room
   */
  leaveRoom() {
    if (!this.isConnected || !this.roomId || !this.peerId) {
      return;
    }

    console.log(`[SignalingClient] Leaving room ${this.roomId}`);

    this.send({
      type: 'leave',
      roomId: this.roomId,
      peerId: this.peerId,
    });

    this.roomId = null;
    this.peerId = null;
  }

  /**
   * Send a message to the server
   */
  send(message) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('[SignalingClient] Cannot send message - not connected');
      return;
    }

    try {
      this.ws.send(JSON.stringify(message));
    } catch (error) {
      console.error('[SignalingClient] Failed to send message:', error);
    }
  }

  /**
   * Start periodic ping to keep connection alive
   */
  startPing() {
    this.stopPing(); // Clear any existing interval

    // Send ping every 30 seconds
    this.pingInterval = setInterval(() => {
      if (this.isConnected) {
        this.send({ type: 'ping' });
      }
    }, 30000);
  }

  /**
   * Stop periodic ping
   */
  stopPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[SignalingClient] Max reconnection attempts reached');
      this.emit('reconnectFailed');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 30000);

    console.log(
      `[SignalingClient] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
    );

    this.reconnectTimer = setTimeout(() => {
      this.connect()
        .then(() => {
          // If we were in a room, rejoin it
          if (this.roomId && this.peerId) {
            console.log(`[SignalingClient] Rejoining room ${this.roomId}`);
            this.joinRoom(this.roomId, this.peerId);
          }
        })
        .catch((error) => {
          console.error('[SignalingClient] Reconnection failed:', error);
        });
    }, delay);
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
   * Disconnect and clean up
   */
  disconnect() {
    console.log('[SignalingClient] Disconnecting...');

    // Clear reconnection timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    // Stop ping
    this.stopPing();

    // Leave room if in one
    this.leaveRoom();

    // Close WebSocket
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.isConnected = false;
    this.reconnectAttempts = 0;
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      roomId: this.roomId,
      peerId: this.peerId,
      reconnectAttempts: this.reconnectAttempts,
    };
  }
}
