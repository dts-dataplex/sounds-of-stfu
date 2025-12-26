/**
 * Standalone Signaling Server for Chatsubo
 * Runs on port 9000 (separate from Vite dev server on port 5173)
 *
 * This avoids conflicts with Vite's HMR WebSocket
 */

import { WebSocketServer } from 'ws';
import http from 'http';

const PORT = 9000;

/**
 * Room registry: Maps room IDs to sets of peer information
 * Structure: Map<roomId, Set<{peerId, ws}>>
 */
const rooms = new Map();

/**
 * WebSocket connection to peer ID mapping
 * Structure: Map<WebSocket, {peerId, roomId}>
 */
const connectionToPeer = new Map();

// Create HTTP server
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Chatsubo Signaling Server\n');
});

// Create WebSocket server
const wss = new WebSocketServer({ server });

console.log(`[Chatsubo Signaling] Starting server on port ${PORT}...`);

wss.on('connection', (ws) => {
  console.log('[Chatsubo Signaling] New WebSocket connection');

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      handleMessage(ws, message);
    } catch (error) {
      console.error('[Chatsubo Signaling] Invalid message format:', error);
      ws.send(
        JSON.stringify({
          type: 'error',
          message: 'Invalid message format',
        })
      );
    }
  });

  ws.on('close', () => {
    handleDisconnect(ws);
  });

  ws.on('error', (error) => {
    console.error('[Chatsubo Signaling] WebSocket error:', error);
    handleDisconnect(ws);
  });

  // Send welcome message
  ws.send(
    JSON.stringify({
      type: 'welcome',
      message: 'Connected to Chatsubo signaling server',
    })
  );
});

/**
 * Handle incoming WebSocket messages
 */
function handleMessage(ws, message) {
  const { type, roomId, peerId } = message;

  switch (type) {
    case 'join':
      handleJoin(ws, roomId, peerId);
      break;

    case 'leave':
      handleLeave(ws, roomId, peerId);
      break;

    case 'ping':
      ws.send(JSON.stringify({ type: 'pong' }));
      break;

    default:
      console.warn(`[Chatsubo Signaling] Unknown message type: ${type}`);
      ws.send(
        JSON.stringify({
          type: 'error',
          message: `Unknown message type: ${type}`,
        })
      );
  }
}

/**
 * Handle peer joining a room
 */
function handleJoin(ws, roomId, peerId) {
  if (!roomId || !peerId) {
    ws.send(
      JSON.stringify({
        type: 'error',
        message: 'Missing roomId or peerId',
      })
    );
    return;
  }

  console.log(`[Chatsubo Signaling] Peer ${peerId} joining room ${roomId}`);

  // Initialize room if it doesn't exist
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Set());
  }

  const room = rooms.get(roomId);

  // Check room capacity (10 user limit)
  if (room.size >= 10) {
    ws.send(
      JSON.stringify({
        type: 'room_full',
        message: 'Bar is full (10 user capacity reached)',
      })
    );
    return;
  }

  // Add peer to room
  room.add({ peerId, ws });
  connectionToPeer.set(ws, { peerId, roomId });

  console.log(`[Chatsubo Signaling] Room ${roomId} now has ${room.size} peer(s)`);

  // Send current peer list to the joining peer
  const peerList = Array.from(room).map((p) => p.peerId);
  ws.send(
    JSON.stringify({
      type: 'peer_list',
      peers: peerList,
      roomId: roomId,
    })
  );

  // Broadcast updated peer list to all peers in the room
  broadcastToRoom(
    roomId,
    {
      type: 'peer_joined',
      peerId: peerId,
      peers: peerList,
    },
    null
  );
}

/**
 * Handle peer leaving a room
 */
function handleLeave(ws, roomId, peerId) {
  if (!roomId || !peerId) {
    return;
  }

  console.log(`[Chatsubo Signaling] Peer ${peerId} leaving room ${roomId}`);

  const room = rooms.get(roomId);
  if (!room) {
    return;
  }

  // Remove peer from room
  room.forEach((peer) => {
    if (peer.peerId === peerId) {
      room.delete(peer);
    }
  });

  // Clean up room if empty
  if (room.size === 0) {
    rooms.delete(roomId);
    console.log(`[Chatsubo Signaling] Room ${roomId} deleted (empty)`);
  } else {
    // Broadcast updated peer list
    const peerList = Array.from(room).map((p) => p.peerId);
    broadcastToRoom(
      roomId,
      {
        type: 'peer_left',
        peerId: peerId,
        peers: peerList,
      },
      ws
    );
  }

  connectionToPeer.delete(ws);
}

/**
 * Handle WebSocket disconnection
 */
function handleDisconnect(ws) {
  const peerInfo = connectionToPeer.get(ws);

  if (peerInfo) {
    const { peerId, roomId } = peerInfo;
    console.log(`[Chatsubo Signaling] Peer ${peerId} disconnected from room ${roomId}`);
    handleLeave(ws, roomId, peerId);
  } else {
    console.log('[Chatsubo Signaling] Unknown peer disconnected');
  }
}

/**
 * Broadcast message to all peers in a room
 */
function broadcastToRoom(roomId, message, excludeWs) {
  const room = rooms.get(roomId);
  if (!room) {
    return;
  }

  const messageStr = JSON.stringify(message);

  room.forEach((peer) => {
    if (peer.ws !== excludeWs && peer.ws.readyState === 1) {
      peer.ws.send(messageStr);
    }
  });
}

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`[Chatsubo Signaling] Server running on port ${PORT}`);
  console.log(`[Chatsubo Signaling] WebSocket endpoint: ws://localhost:${PORT}/`);
});
