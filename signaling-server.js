/**
 * Standalone Signaling Server for Chatsubo
 * Runs on port 9000 (separate from Vite dev server on port 5173)
 *
 * This avoids conflicts with Vite's HMR WebSocket
 */

import { WebSocketServer } from 'ws';
import http from 'http';
import winston from 'winston';
import { Counter, Gauge, register } from 'prom-client';

const PORT = 9000;

// Winston structured logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()],
});

// Prometheus metrics
const connectionsGauge = new Gauge({
  name: 'chatsubo_active_connections',
  help: 'Number of active WebSocket connections',
});

const roomsGauge = new Gauge({
  name: 'chatsubo_active_rooms',
  help: 'Number of active chat rooms',
});

const messagesCounter = new Counter({
  name: 'chatsubo_messages_total',
  help: 'Total number of messages processed',
  labelNames: ['type'],
});

const peerJoinsCounter = new Counter({
  name: 'chatsubo_peer_joins_total',
  help: 'Total number of peer joins',
});

const peerLeavesCounter = new Counter({
  name: 'chatsubo_peer_leaves_total',
  help: 'Total number of peer leaves',
});

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

// Create HTTP server with health and metrics endpoints
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    // Health check endpoint
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: 'healthy',
        uptime: process.uptime(),
        connections: connectionToPeer.size,
        rooms: rooms.size,
        timestamp: new Date().toISOString(),
      })
    );
  } else if (req.url === '/metrics') {
    // Prometheus metrics endpoint
    res.writeHead(200, { 'Content-Type': register.contentType });
    register.metrics().then((metrics) => {
      res.end(metrics);
    });
  } else {
    // Default response
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Chatsubo Signaling Server\n');
  }
});

// Create WebSocket server
const wss = new WebSocketServer({ server });

logger.info('Starting signaling server', { port: PORT });

wss.on('connection', (ws) => {
  connectionsGauge.inc();
  logger.info('New WebSocket connection', {
    activeConnections: connectionToPeer.size + 1,
  });

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      messagesCounter.inc({ type: message.type || 'unknown' });
      handleMessage(ws, message);
    } catch (error) {
      logger.error('Invalid message format', {
        error: error.message,
        data: data.toString().substring(0, 100),
      });
      messagesCounter.inc({ type: 'error' });
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
    logger.error('WebSocket error', {
      error: error.message,
      stack: error.stack,
    });
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
      logger.warn('Unknown message type', { type, roomId, peerId });
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

  logger.info('Peer joining room', { peerId, roomId });

  // Initialize room if it doesn't exist
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Set());
    roomsGauge.inc();
  }

  const room = rooms.get(roomId);

  // Check room capacity (10 user limit)
  if (room.size >= 10) {
    logger.warn('Room at capacity, rejecting peer', { roomId, peerId });
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
  peerJoinsCounter.inc();

  logger.info('Peer joined room', {
    peerId,
    roomId,
    roomSize: room.size,
    totalRooms: rooms.size,
  });

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

  logger.info('Peer leaving room', { peerId, roomId });

  const room = rooms.get(roomId);
  if (!room) {
    return;
  }

  // Remove peer from room
  room.forEach((peer) => {
    if (peer.peerId === peerId) {
      room.delete(peer);
      peerLeavesCounter.inc();
    }
  });

  // Clean up room if empty
  if (room.size === 0) {
    rooms.delete(roomId);
    roomsGauge.dec();
    logger.info('Room deleted (empty)', { roomId });
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

  connectionsGauge.dec();

  if (peerInfo) {
    const { peerId, roomId } = peerInfo;
    logger.info('Peer disconnected', {
      peerId,
      roomId,
      activeConnections: connectionToPeer.size - 1,
    });
    handleLeave(ws, roomId, peerId);
  } else {
    logger.warn('Unknown peer disconnected', {
      activeConnections: connectionToPeer.size - 1,
    });
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
  logger.info('Signaling server started', {
    port: PORT,
    websocketEndpoint: `ws://localhost:${PORT}/`,
    healthEndpoint: `http://localhost:${PORT}/health`,
    metricsEndpoint: `http://localhost:${PORT}/metrics`,
  });
});
