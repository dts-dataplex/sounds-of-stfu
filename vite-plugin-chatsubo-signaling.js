/**
 * Vite Plugin: Chatsubo Signaling Server
 *
 * Provides WebSocket-based peer discovery for the Chatsubo Virtual Bar.
 * This plugin runs a WebSocket server alongside the Vite dev server to enable
 * automatic peer discovery without manual peer ID sharing.
 *
 * Features:
 * - Room-based peer registry
 * - Automatic peer list broadcasting
 * - Connection lifecycle management
 * - Graceful error handling
 */

import { WebSocketServer } from 'ws';

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

export default function chatsuboSignaling() {
  return {
    name: 'chatsubo-signaling',

    configureServer(server) {
      // Create WebSocket server on the same HTTP server as Vite
      const wss = new WebSocketServer({
        server: server.httpServer,
        path: '/signaling',
      });

      console.log('[Chatsubo Signaling] WebSocket server initialized on /signaling');

      wss.on('connection', (ws) => {
        console.log('[Chatsubo Signaling] New WebSocket connection');

        ws.on('message', (data) => {
          try {
            const message = JSON.parse(data.toString());
            handleMessage(ws, message, wss);
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
          handleDisconnect(ws, wss);
        });

        ws.on('error', (error) => {
          console.error('[Chatsubo Signaling] WebSocket error:', error);
          handleDisconnect(ws, wss);
        });

        // Send welcome message
        ws.send(
          JSON.stringify({
            type: 'welcome',
            message: 'Connected to Chatsubo signaling server',
          })
        );
      });
    },
  };
}

/**
 * Handle incoming WebSocket messages
 */
function handleMessage(ws, message, wss) {
  const { type, roomId, peerId } = message;

  switch (type) {
    case 'join':
      handleJoin(ws, roomId, peerId, wss);
      break;

    case 'leave':
      handleLeave(ws, roomId, peerId, wss);
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
function handleJoin(ws, roomId, peerId, _wss) {
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
  ); // null = broadcast to everyone including sender
}

/**
 * Handle peer leaving a room
 */
function handleLeave(ws, roomId, peerId, _wss) {
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
    ); // Don't send to the leaving peer
  }

  connectionToPeer.delete(ws);
}

/**
 * Handle WebSocket disconnection
 */
function handleDisconnect(ws, wss) {
  const peerInfo = connectionToPeer.get(ws);

  if (peerInfo) {
    const { peerId, roomId } = peerInfo;
    console.log(`[Chatsubo Signaling] Peer ${peerId} disconnected from room ${roomId}`);
    handleLeave(ws, roomId, peerId, wss);
  } else {
    console.log('[Chatsubo Signaling] Unknown peer disconnected');
  }
}

/**
 * Broadcast message to all peers in a room
 * @param {string} roomId - Room identifier
 * @param {object} message - Message to broadcast
 * @param {WebSocket} excludeWs - WebSocket to exclude from broadcast (optional)
 */
function broadcastToRoom(roomId, message, excludeWs) {
  const room = rooms.get(roomId);
  if (!room) {
    return;
  }

  const messageStr = JSON.stringify(message);

  room.forEach((peer) => {
    if (peer.ws !== excludeWs && peer.ws.readyState === 1) {
      // 1 = OPEN
      peer.ws.send(messageStr);
    }
  });
}
