/**
 * Vite Plugin: Embedded Signaling Server
 *
 * Starts the WebSocket signaling server automatically when Vite starts.
 * This ensures external users only need to visit the URL - no additional setup.
 */

import { WebSocketServer } from 'ws';

/**
 * Room registry: Maps room IDs to sets of peer information
 */
const rooms = new Map();

/**
 * WebSocket connection to peer ID mapping
 */
const connectionToPeer = new Map();

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
      console.warn(`[Signaling] Unknown message type: ${type}`);
      ws.send(JSON.stringify({ type: 'error', message: `Unknown message type: ${type}` }));
  }
}

/**
 * Handle peer joining a room
 */
function handleJoin(ws, roomId, peerId) {
  if (!roomId || !peerId) {
    ws.send(JSON.stringify({ type: 'error', message: 'Missing roomId or peerId' }));
    return;
  }

  console.log(`[Signaling] Peer ${peerId} joining room ${roomId}`);

  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Set());
  }

  const room = rooms.get(roomId);

  if (room.size >= 10) {
    ws.send(JSON.stringify({ type: 'room_full', message: 'Bar is full (10 user capacity)' }));
    return;
  }

  room.add({ peerId, ws });
  connectionToPeer.set(ws, { peerId, roomId });

  console.log(`[Signaling] Room ${roomId} now has ${room.size} peer(s)`);

  const peerList = Array.from(room).map((p) => p.peerId);
  ws.send(JSON.stringify({ type: 'peer_list', peers: peerList, roomId }));

  broadcastToRoom(roomId, { type: 'peer_joined', peerId, peers: peerList }, null);
}

/**
 * Handle peer leaving a room
 */
function handleLeave(ws, roomId, peerId) {
  if (!roomId || !peerId) return;

  console.log(`[Signaling] Peer ${peerId} leaving room ${roomId}`);

  const room = rooms.get(roomId);
  if (!room) return;

  room.forEach((peer) => {
    if (peer.peerId === peerId) {
      room.delete(peer);
    }
  });

  if (room.size === 0) {
    rooms.delete(roomId);
    console.log(`[Signaling] Room ${roomId} deleted (empty)`);
  } else {
    const peerList = Array.from(room).map((p) => p.peerId);
    broadcastToRoom(roomId, { type: 'peer_left', peerId, peers: peerList }, ws);
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
    console.log(`[Signaling] Peer ${peerId} disconnected from room ${roomId}`);
    handleLeave(ws, roomId, peerId);
  }
}

/**
 * Broadcast message to all peers in a room
 */
function broadcastToRoom(roomId, message, excludeWs) {
  const room = rooms.get(roomId);
  if (!room) return;

  const messageStr = JSON.stringify(message);
  room.forEach((peer) => {
    if (peer.ws !== excludeWs && peer.ws.readyState === 1) {
      peer.ws.send(messageStr);
    }
  });
}

/**
 * Vite plugin that starts signaling server
 */
export default function signalingServerPlugin() {
  let wss = null;

  return {
    name: 'vite-plugin-signaling',

    configureServer(server) {
      // Create WebSocket server attached to Vite's HTTP server
      wss = new WebSocketServer({ noServer: true });

      console.log('[Signaling] WebSocket server initialized');

      wss.on('connection', (ws) => {
        console.log('[Signaling] New WebSocket connection');

        ws.on('message', (data) => {
          try {
            const message = JSON.parse(data.toString());
            handleMessage(ws, message);
          } catch (error) {
            console.error('[Signaling] Invalid message format:', error);
            ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
          }
        });

        ws.on('close', () => handleDisconnect(ws));
        ws.on('error', (error) => {
          console.error('[Signaling] WebSocket error:', error);
          handleDisconnect(ws);
        });

        ws.send(JSON.stringify({ type: 'welcome', message: 'Connected to Chatsubo signaling server' }));
      });

      // Handle upgrade requests for /signaling path
      server.httpServer.on('upgrade', (request, socket, head) => {
        const url = new URL(request.url, `http://${request.headers.host}`);

        if (url.pathname === '/signaling') {
          wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit('connection', ws, request);
          });
        }
        // Let Vite handle HMR WebSocket upgrades (no else needed - Vite handles it)
      });

      console.log('[Signaling] Server ready at /signaling');
    },

    closeBundle() {
      if (wss) {
        wss.close();
        console.log('[Signaling] WebSocket server closed');
      }
    },
  };
}
