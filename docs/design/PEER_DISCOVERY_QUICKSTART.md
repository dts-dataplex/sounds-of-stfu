# Peer Discovery - Developer Quick Start

**Goal:** Implement automatic peer discovery in 8 hours
**Complexity:** Medium (WebSocket + client integration)
**Prerequisites:** Basic understanding of WebSockets and PeerJS

---

## Implementation Steps (Copy-Paste Ready)

### Step 1: Create Vite Plugin (30 minutes)

**File:** `/vite-plugin-chatsubo-signaling.js`

```javascript
import { WebSocketServer } from 'ws';

export function chatsuboSignalingPlugin() {
  let wsServer;
  const rooms = new Map(); // roomId → Set({ peerId, ws, joinedAt })

  return {
    name: 'chatsubo-signaling',
    configureServer(server) {
      wsServer = new WebSocketServer({
        server: server.httpServer,
        path: '/ws/signaling'
      });

      wsServer.on('connection', (ws) => {
        let currentRoom = null;
        let currentPeerId = null;

        ws.on('message', (data) => {
          const msg = JSON.parse(data.toString());
          if (msg.type === 'join') handleJoin(ws, msg.roomId, msg.peerId);
          if (msg.type === 'leave') handleLeave(ws, msg.roomId, msg.peerId);
        });

        ws.on('close', () => {
          if (currentRoom && currentPeerId) handleLeave(ws, currentRoom, currentPeerId);
        });

        function handleJoin(ws, roomId, peerId) {
          currentRoom = roomId;
          currentPeerId = peerId;

          if (!rooms.has(roomId)) rooms.set(roomId, new Set());
          const room = rooms.get(roomId);

          // Send current peers to new joiner
          const peerList = Array.from(room).map(p => ({ peerId: p.peerId, joinedAt: p.joinedAt }));
          ws.send(JSON.stringify({ type: 'peer_list', peers: peerList }));

          // Add to room
          room.add({ peerId, ws, joinedAt: Date.now() });

          // Broadcast to others
          broadcastToRoom(roomId, { type: 'peer_joined', peerId }, ws);
          console.log(`[Signaling] ${peerId} joined ${roomId} (${room.size} users)`);
        }

        function handleLeave(ws, roomId, peerId) {
          const room = rooms.get(roomId);
          if (!room) return;

          const peer = Array.from(room).find(p => p.peerId === peerId);
          if (peer) room.delete(peer);

          broadcastToRoom(roomId, { type: 'peer_left', peerId });
          if (room.size === 0) rooms.delete(roomId);
          console.log(`[Signaling] ${peerId} left ${roomId}`);
        }

        function broadcastToRoom(roomId, message, excludeWs = null) {
          const room = rooms.get(roomId);
          if (!room) return;
          const msgStr = JSON.stringify(message);
          room.forEach(({ ws: peerWs }) => {
            if (peerWs !== excludeWs && peerWs.readyState === 1) peerWs.send(msgStr);
          });
        }
      });

      console.log('[Signaling] WebSocket server ready on /ws/signaling');
    }
  };
}
```

**File:** `vite.config.js` (UPDATE)

```javascript
import { defineConfig } from 'vite';
import { chatsuboSignalingPlugin } from './vite-plugin-chatsubo-signaling.js';

export default defineConfig({
  plugins: [chatsuboSignalingPlugin()],
  // ... existing config ...
});
```

**Test:**
```bash
npm run dev
# Should see: "[Signaling] WebSocket server ready on /ws/signaling"
```

---

### Step 2: Create Signaling Client (30 minutes)

**File:** `src/network/SignalingClient.js` (NEW)

```javascript
export default class SignalingClient {
  constructor() {
    this.ws = null;
    this.roomId = null;
    this.peerId = null;
    this.eventHandlers = new Map();
    this.isConnected = false;
  }

  async connect(roomId, peerId) {
    return new Promise((resolve, reject) => {
      this.roomId = roomId;
      this.peerId = peerId;

      const host = window.location.hostname;
      const port = window.location.port || '5174';
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${host}:${port}/ws/signaling`;

      console.log(`[SignalingClient] Connecting to ${wsUrl}`);
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('[SignalingClient] Connected');
        this.isConnected = true;
        this.send({ type: 'join', roomId, peerId });
        resolve();
      };

      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        console.log('[SignalingClient] Received:', msg);
        this.emit(msg.type, msg);
      };

      this.ws.onerror = (error) => {
        console.error('[SignalingClient] Error:', error);
        reject(error);
      };

      this.ws.onclose = () => {
        console.log('[SignalingClient] Closed');
        this.isConnected = false;
        this.emit('disconnected');

        // Auto-reconnect
        setTimeout(() => {
          if (this.roomId && this.peerId) {
            console.log('[SignalingClient] Reconnecting...');
            this.connect(this.roomId, this.peerId);
          }
        }, 2000);
      };
    });
  }

  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  disconnect() {
    if (this.ws) {
      this.send({ type: 'leave', roomId: this.roomId, peerId: this.peerId });
      this.ws.close();
      this.ws = null;
    }
  }

  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event).add(handler);
  }

  emit(event, data) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) handlers.forEach(h => h(data));
  }
}
```

**Test:**
```javascript
// In browser console:
import SignalingClient from './src/network/SignalingClient.js';
const client = new SignalingClient();
await client.connect('test-room', 'test-peer-123');
// Should see WebSocket connection in Network tab
```

---

### Step 3: Update MeshNetworkCoordinator (30 minutes)

**File:** `src/network/MeshNetworkCoordinator.js` (UPDATE)

```javascript
import SignalingClient from './SignalingClient.js';

export default class MeshNetworkCoordinator {
  constructor() {
    this.peerManager = new PeerConnectionManager({ maxPeers: 10 });
    this.audioManager = new AudioStreamManager();
    this.signalingClient = new SignalingClient(); // ADD THIS
    this.roomId = null;
    this.peerList = new Set();
    this.eventHandlers = new Map();
    this.isInitialized = false;
  }

  async joinRoom(roomId) {
    if (this.isInitialized) throw new Error('Already joined a room');

    this.roomId = roomId;
    const peerId = await this.peerManager.initialize();
    this.peerList.add(peerId);

    try {
      await this.audioManager.getLocalAudioStream();
    } catch (e) {
      console.warn('[MeshNetworkCoordinator] Audio unavailable:', e.message);
    }

    this.setupPeerManagerHandlers();
    this.setupAudioManagerHandlers();

    // ADD: Connect to signaling
    await this.signalingClient.connect(roomId, peerId);
    this.setupSignalingHandlers();

    this.isInitialized = true;
    this.emit('roomJoined', { roomId, peerId });
    return peerId;
  }

  // ADD: Signaling event handlers
  setupSignalingHandlers() {
    this.signalingClient.on('peer_list', ({ peers }) => {
      console.log(`[MeshNetworkCoordinator] Got peer list:`, peers);
      peers.forEach(({ peerId }) => {
        if (!this.peerList.has(peerId)) {
          this.connectToPeer(peerId).catch(err => {
            console.error(`Failed to connect to ${peerId}:`, err);
          });
        }
      });
    });

    this.signalingClient.on('peer_joined', ({ peerId }) => {
      console.log(`[MeshNetworkCoordinator] Peer joined: ${peerId}`);
      this.emit('peerJoined', { peerId });
      this.connectToPeer(peerId).catch(err => {
        console.error(`Failed to connect to ${peerId}:`, err);
      });
    });

    this.signalingClient.on('peer_left', ({ peerId }) => {
      console.log(`[MeshNetworkCoordinator] Peer left: ${peerId}`);
      this.handlePeerLeaving(peerId);
    });
  }

  // ... rest of existing methods unchanged ...
}
```

---

### Step 4: Update UI (30 minutes)

**File:** `src/main.js` (UPDATE)

```javascript
// REMOVE: Manual peer connection section
// DELETE these lines:
// const peerConnectSection = getElement('peer-connect-section');
// if (peerConnectSection) peerConnectSection.style.display = 'block';
// const connectPeerButton = getElement('connect-peer-button');
// connectPeerButton.addEventListener(...)

// ADD: Automatic connection notifications
async function joinRoom() {
  // ... existing join logic ...

  await app.joinRoom(roomId);

  // ADD: Show discovery status
  addSystemMessage(`✅ Joined room: ${roomId}`);
  addSystemMessage(`🔍 Discovering peers...`);

  // ... rest of join logic ...
}

// ADD: Listen for peer connections
app.meshNetworkCoordinator.on('peerJoined', ({ peerId }) => {
  const shortId = peerId.substring(0, 12) + '...';
  addSystemMessage(`✅ New user joined: ${shortId}`);
});

app.meshNetworkCoordinator.on('peerLeft', ({ peerId }) => {
  const shortId = peerId.substring(0, 12) + '...';
  addSystemMessage(`👋 User left: ${shortId}`);
});
```

**File:** `index.html` (UPDATE)

```html
<!-- REMOVE: Manual peer connection section -->
<!-- DELETE:
<div id="peer-connect-section" style="display: none;">
  <h3>Connect to Peer</h3>
  <input id="local-peer-id" readonly />
  <input id="remote-peer-id" placeholder="Enter peer ID" />
  <button id="connect-peer-button">Connect</button>
</div>
-->

<!-- ADD: Connection status (optional) -->
<div id="connection-status">
  <span id="peer-count">0</span> users connected
</div>
```

---

### Step 5: Testing (1 hour)

#### Test 1: Localhost (Two Browsers)

```bash
# Terminal 1
npm run dev

# Browser 1 (Chrome)
http://localhost:5174
Click "Join Room"
# Should see: "Joined room (0 users)"

# Browser 2 (Firefox)
http://localhost:5174
Click "Join Room"
# Should see: "Joined room (1 user found)"
# Should see: "Connecting to peer..."

# Browser 1 should show:
# "✅ New user joined"

# Within 5 seconds, both should show:
# "✅ Connected (2 users)"
```

**Expected Console Output (Browser 2):**
```
[SignalingClient] Connecting to ws://localhost:5174/ws/signaling
[SignalingClient] Connected
[SignalingClient] Received: { type: 'peer_list', peers: [{ peerId: 'abc123...', ... }] }
[MeshNetworkCoordinator] Got peer list: [...]
[PeerConnectionManager] Connecting to peer abc123...
[PeerConnectionManager] Connected to peer abc123...
```

#### Test 2: Network (Laptop + Phone)

```bash
# Find your local IP
ipconfig getifaddr en0  # macOS
# or: hostname -I | awk '{print $1}'  # Linux

# Start Vite on network interface
npm run dev -- --host 10.0.40.44

# Laptop: http://10.0.40.44:5174
Click "Join Room"

# Phone: http://10.0.40.44:5174
Click "Join Room"
# Should auto-connect to laptop
```

#### Test 3: Server Restart

```bash
# With both browsers connected:

# Terminal: Ctrl+C (stop Vite)
# Browsers should show: "⚠️ Disconnected"

# Terminal: npm run dev (restart Vite)
# Within 10 seconds:
# Browsers should show: "✅ Reconnected"
```

---

## Debugging Checklist

### WebSocket Not Connecting

```javascript
// Browser console:
new WebSocket('ws://localhost:5174/ws/signaling')
// Should show: WebSocket {url: "ws://localhost:5174/ws/signaling", ...}
// If error: Check Vite server is running on port 5174
```

### Peer Discovery Not Working

```javascript
// Check signaling messages in Network tab (Chrome DevTools)
// Filter: WS
// Should see messages:
// → { type: 'join', roomId: '...', peerId: '...' }
// ← { type: 'peer_list', peers: [...] }
```

### P2P Connection Fails

```javascript
// Browser console:
app.meshNetworkCoordinator.peerManager.peers
// Should show: Map { 'abc123...' => PeerConnection { ... } }
// If empty: Check PeerJS cloud status
```

---

## Common Issues & Solutions

### Issue: "WebSocket connection failed"

**Cause:** Vite server not running or port blocked

**Solution:**
```bash
# Check Vite is running:
curl http://localhost:5174
# Should return HTML

# Check WebSocket endpoint:
npm install -g wscat
wscat -c ws://localhost:5174/ws/signaling
# Should connect
```

### Issue: "Connected but no audio"

**Cause:** Audio permission denied or HTTPS required

**Solution:**
```javascript
// Check audio permission:
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => console.log('Audio OK:', stream))
  .catch(err => console.error('Audio failed:', err));

// Note: localhost works, but network (10.0.40.44) may need HTTPS
```

### Issue: "Reconnect loop"

**Cause:** Server rejecting connections or room full

**Solution:**
```javascript
// Check server logs:
// Should see: "[Signaling] abc123... joined chatsubo-main (2 users)"
// If "Room is full": Implement room capacity check
```

---

## Performance Validation

### Latency Test

```javascript
// Measure WebSocket latency
const start = Date.now();
signalingClient.on('peer_list', () => {
  console.log(`Signaling latency: ${Date.now() - start}ms`);
  // Should be < 100ms
});
await signalingClient.connect('test', 'test-peer');
```

### Connection Test (5 Users)

```bash
# Open 5 browser tabs
# Each joins same room
# Expected: 10 P2P connections (full mesh)
# Formula: n*(n-1)/2 = 5*4/2 = 10
```

---

## Code Snippets

### Manual WebSocket Test (Browser Console)

```javascript
const ws = new WebSocket('ws://localhost:5174/ws/signaling');
ws.onopen = () => {
  console.log('Connected');
  ws.send(JSON.stringify({ type: 'join', roomId: 'test', peerId: 'manual-test-123' }));
};
ws.onmessage = (e) => console.log('Received:', JSON.parse(e.data));
```

### Check Room State (Server-Side Debug)

```javascript
// Add to vite-plugin-chatsubo-signaling.js:
function debugRooms() {
  console.log('=== ROOM STATE ===');
  rooms.forEach((peers, roomId) => {
    console.log(`${roomId}: ${peers.size} users`);
    peers.forEach(({ peerId }) => console.log(`  - ${peerId}`));
  });
}

// Call every 10 seconds:
setInterval(debugRooms, 10000);
```

---

## Next Steps After Implementation

1. **Remove manual connection UI** completely
2. **Add room list UI** (show all rooms + user counts)
3. **Add peer usernames** (not just IDs)
4. **Production signaling server** (dedicated Node.js app)
5. **Add authentication** (JWT tokens for room access)

---

## Related Files

- [PEER_DISCOVERY_DESIGN.md](./PEER_DISCOVERY_DESIGN.md) - Full design (47 pages)
- [PEER_DISCOVERY_FLOW.md](./PEER_DISCOVERY_FLOW.md) - Visual diagrams
- [PEER_DISCOVERY_SUMMARY.md](./PEER_DISCOVERY_SUMMARY.md) - Executive summary

---

**Status:** Implementation Ready
**Time Estimate:** 8 hours (includes testing)
**Complexity:** Medium (WebSocket + event handling)
**Dependencies:** ws package (already in package.json)

**Go Build It!** 🚀
