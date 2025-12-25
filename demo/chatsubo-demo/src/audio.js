// PeerJS Spatial Audio System
import Peer from 'peerjs';
import { calculateVolume } from './zones.js';

export class SpatialAudioManager {
  constructor() {
    this.peer = null;
    this.peerId = null;
    this.connections = new Map();
    this.streams = new Map();
    this.positions = new Map();
    this.myPosition = { x: 0, z: 0 };
    this.myStream = null;
    this.onPeerJoined = null;
    this.onPeerLeft = null;
    this.onPositionUpdate = null;
  }

  async initialize() {
    // Get user's microphone
    try {
      this.myStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false
      });
    } catch (err) {
      console.error('Failed to get microphone access:', err);
      throw err;
    }

    // Initialize PeerJS
    this.peer = new Peer();

    return new Promise((resolve, reject) => {
      this.peer.on('open', (id) => {
        this.peerId = id;
        console.log('My peer ID:', id);
        this.setupListeners();
        resolve(id);
      });

      this.peer.on('error', (err) => {
        console.error('PeerJS error:', err);
        reject(err);
      });
    });
  }

  setupListeners() {
    // Handle incoming calls
    this.peer.on('call', (call) => {
      console.log('Receiving call from:', call.peer);
      call.answer(this.myStream);

      call.on('stream', (remoteStream) => {
        console.log('Received stream from:', call.peer);
        this.handleRemoteStream(call.peer, remoteStream);
      });

      call.on('close', () => {
        console.log('Call closed from:', call.peer);
        this.removePeer(call.peer);
      });

      this.connections.set(call.peer, call);
    });

    // Handle incoming data connections (for position updates)
    this.peer.on('connection', (conn) => {
      this.setupDataConnection(conn);
    });
  }

  setupDataConnection(conn) {
    conn.on('open', () => {
      console.log('Data connection opened with:', conn.peer);

      // Send my current position
      conn.send({
        type: 'position',
        position: this.myPosition,
      });
    });

    conn.on('data', (data) => {
      if (data.type === 'position') {
        this.positions.set(conn.peer, data.position);
        if (this.onPositionUpdate) {
          this.onPositionUpdate(conn.peer, data.position);
        }
        this.updateAudioVolumes();
      }
    });

    conn.on('close', () => {
      console.log('Data connection closed with:', conn.peer);
    });
  }

  async connectToPeer(remotePeerId) {
    if (this.connections.has(remotePeerId)) {
      console.log('Already connected to:', remotePeerId);
      return;
    }

    console.log('Connecting to peer:', remotePeerId);

    // Establish data connection for position updates
    const dataConn = this.peer.connect(remotePeerId);
    this.setupDataConnection(dataConn);

    // Establish audio call
    const call = this.peer.call(remotePeerId, this.myStream);
    this.connections.set(remotePeerId, call);

    call.on('stream', (remoteStream) => {
      console.log('Received stream from:', remotePeerId);
      this.handleRemoteStream(remotePeerId, remoteStream);
    });

    call.on('close', () => {
      console.log('Call closed with:', remotePeerId);
      this.removePeer(remotePeerId);
    });
  }

  handleRemoteStream(peerId, stream) {
    // Create audio element for remote stream
    const audio = new Audio();
    audio.srcObject = stream;
    audio.play();

    this.streams.set(peerId, audio);

    if (this.onPeerJoined) {
      this.onPeerJoined(peerId);
    }

    // Set initial volume based on distance
    this.updateAudioVolumes();
  }

  removePeer(peerId) {
    const audio = this.streams.get(peerId);
    if (audio) {
      audio.pause();
      audio.srcObject = null;
    }

    this.streams.delete(peerId);
    this.connections.delete(peerId);
    this.positions.delete(peerId);

    if (this.onPeerLeft) {
      this.onPeerLeft(peerId);
    }
  }

  updateMyPosition(position) {
    this.myPosition = position;

    // Broadcast position to all peers
    for (const [peerId, conn] of this.connections) {
      if (conn.peerConnection && conn.peerConnection.connectionState === 'connected') {
        // Find data connection
        const dataConn = Array.from(this.peer.connections[peerId] || [])
          .find(c => c.type === 'data' && c.open);

        if (dataConn) {
          dataConn.send({
            type: 'position',
            position: this.myPosition,
          });
        }
      }
    }

    this.updateAudioVolumes();
  }

  updateAudioVolumes() {
    for (const [peerId, audio] of this.streams) {
      const peerPosition = this.positions.get(peerId);
      if (!peerPosition) continue;

      // Calculate distance
      const dx = this.myPosition.x - peerPosition.x;
      const dz = this.myPosition.z - peerPosition.z;
      const distance = Math.sqrt(dx * dx + dz * dz);

      // Wave-based falloff (using average falloff distance of 8ft)
      const volume = calculateVolume(distance, 8);

      // Apply volume
      audio.volume = Math.max(0, Math.min(1, volume));
    }
  }

  disconnect() {
    if (this.myStream) {
      this.myStream.getTracks().forEach(track => track.stop());
    }

    for (const [_, conn] of this.connections) {
      conn.close();
    }

    for (const [_, audio] of this.streams) {
      audio.pause();
      audio.srcObject = null;
    }

    if (this.peer) {
      this.peer.destroy();
    }
  }
}
