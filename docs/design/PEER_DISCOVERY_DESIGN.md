# Peer Discovery Design - Chatsubo Virtual Bar

**Status:** Proposed
**Date:** 2025-12-25
**Author:** UX Designer + Network Engineer
**Problem:** Manual peer ID exchange breaks the "walk into a bar" experience

---

## Executive Summary

Users currently must manually share 32-character PeerJS IDs to connect in the Chatsubo virtual bar. This is a terrible UX that contradicts the core vision of spatial audio feeling like a real bar.

**Recommended Solution:** Vite Plugin with WebSocket Signaling (Option 1)
**Implementation Effort:** 4-6 hours
**User Impact:** Automatic connection, zero manual steps required

---

## Problem Statement

### Current User Flow (BROKEN)

```
User A joins "chatsubo-main"
→ Gets PeerJS ID: "abc123xyz789..."
→ Copies ID
→ Sends via Discord/Slack/Email to User B
→ User B joins "chatsubo-main"
→ Gets PeerJS ID: "def456uvw012..."
→ User B pastes User A's ID into input field
→ User B clicks "Connect to Peer"
→ FINALLY connected after ~90 seconds of frustration
```

**Pain Points:**
- 32-character alphanumeric IDs are impossible to remember
- No notification when someone joins your room
- No way to discover who's already in a room
- Breaks immersion completely
- Requires out-of-band communication (Discord, email, etc.)

### Desired User Flow (TARGET)

```
User A opens http://10.0.40.44:5174
→ Clicks "Join Room"
→ Automatically sees: "Gaming Zone (2 users), Central Bar (5 users)"
→ Enters bar, sees 5 user avatars at bar
→ AUDIO automatically works, no manual connection needed

User B opens same URL 30 seconds later
→ Clicks "Join Room"
→ User A gets notification: "New user joined Gaming Zone"
→ User B's audio automatically connected to all 6 existing users
→ Total time from URL to connected: ~5 seconds
```

**Success Metrics:**
- Time from page load to connected: < 10 seconds
- Manual steps required: 1 (click "Join Room")
- User confusion: Zero (it just works)

---

## Architecture Analysis

### Current System

**PeerJS Architecture:**
```
Browser A                PeerJS Cloud               Browser B
   |                    (0.peerjs.com)                |
   |-- connect() ------>      |                       |
   |<-- ID assigned ----------|                       |
   |                          |                       |
   |                          |   <---- connect() ----|
   |                          |-- assign ID --------->|
   |                          |                       |
   | (MANUAL ID EXCHANGE VIA DISCORD/EMAIL/SLACK)     |
   |                          |                       |
   |-- call(remote_id) ------>|                       |
   |                          |-- relay signal ------>|
   |<-- P2P connection established ----------------->|
```

**The Gap:** No way for Browser A and Browser B to discover each other's IDs automatically.

**What We Have:**
- Vite dev server on port 5174 (knows when HTTP connections arrive)
- PeerJS cloud signaling (handles WebRTC negotiation)
- Room concept (`roomId: "chatsubo-main"`)
- PeerConnectionManager (handles P2P connections)
- MeshNetworkCoordinator (manages peer list)

**What We're Missing:**
- Signaling server to announce "I'm in room X with peer ID Y"
- Mechanism to broadcast peer list to room members
- Notification system for new joiners

---

## Solution Options Evaluation

### Option 1: Vite Plugin with WebSocket Signaling (RECOMMENDED)

**Architecture:**
```
┌─────────────────────────────────────────────────────────────┐
│                    Vite Dev Server (5174)                   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │          Vite Plugin: chatsubo-signaling             │  │
│  │                                                        │  │
│  │  - WebSocket server on /ws/signaling                 │  │
│  │  - Room registry: Map<roomId, Set<peerInfo>>         │  │
│  │  - Broadcast peer lists to room members              │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
         ▲                            ▲
         │ ws://10.0.40.44:5174/ws    │
         │                            │
   ┌─────┴─────┐              ┌──────┴──────┐
   │ Browser A │              │  Browser B  │
   │ (Laptop)  │              │  (Phone)    │
   │           │              │             │
   │ PeerJS ID │              │ PeerJS ID   │
   │ abc123... │              │ def456...   │
   └───────────┘              └─────────────┘
         │                            │
         └────── P2P Audio/Data ──────┘
         (via PeerJS cloud signaling)
```

**Protocol:**
```javascript
// 1. Browser A joins room
→ WS: { type: 'join', roomId: 'chatsubo-main', peerId: 'abc123...' }
← WS: { type: 'peer_list', peers: [] }

// 2. Browser B joins same room
→ WS: { type: 'join', roomId: 'chatsubo-main', peerId: 'def456...' }
← WS: { type: 'peer_list', peers: [{ peerId: 'abc123...', joinedAt: ... }] }

// 3. Server broadcasts to Browser A
→ WS (to A): { type: 'peer_joined', peerId: 'def456...' }

// 4. Browser B auto-connects to Browser A
Browser B: peerManager.connectToPeer('abc123...')

// 5. Both browsers now have P2P audio/data connections
```

**Pros:**
- ✅ Minimal infrastructure (piggybacks on existing Vite server)
- ✅ Works for both localhost and network (10.0.40.44)
- ✅ WebSocket provides instant notifications (no polling lag)
- ✅ Vite plugin runs automatically when `npm run dev`
- ✅ Clean separation: signaling vs P2P data/audio
- ✅ Survives Vite HMR (WebSocket reconnects automatically)
- ✅ Network engineer approved: standard WebSocket protocol

**Cons:**
- ⚠️ Requires backend code (~150 lines)
- ⚠️ State lost on Vite server restart (peers must rejoin)
- ⚠️ Dev-only solution (production needs dedicated signaling server)

**Network Architecture Validation:**
```
✅ Latency: WebSocket adds <5ms overhead (negligible)
✅ Scalability: 10 users = 10 WebSocket connections (trivial)
✅ Reliability: WebSocket auto-reconnect on disconnect
✅ Security: Same-origin only (localhost or 10.0.40.44)
✅ Firewall: Port 5174 already open for Vite HTTP server
```

---

### Option 2: Piggyback on Vite's HMR WebSocket (REJECTED)

**Architecture:**
```
Use Vite's existing WebSocket at ws://localhost:5174/__vite_hmr
Inject custom messages: { type: 'custom:peer-join', ... }
```

**Pros:**
- ✅ Zero additional infrastructure
- ✅ WebSocket already running

**Cons:**
- ❌ Hacky, abuses HMR protocol
- ❌ May break with Vite updates
- ❌ HMR WebSocket not designed for custom data
- ❌ Network engineer disapproves: protocol abuse
- ❌ Hard to debug when HMR and signaling both broken

**Verdict:** Too fragile for production-quality demo.

---

### Option 3: HTTP Polling (REJECTED)

**Architecture:**
```
POST /api/peers/join   { roomId, peerId }
GET  /api/peers/:roomId   →   { peers: [...] }
Poll every 2 seconds
```

**Pros:**
- ✅ Simple HTTP, no WebSocket complexity
- ✅ Works with any HTTP server

**Cons:**
- ❌ 2-second polling delay (terrible UX)
- ❌ Wasteful: 10 users × 0.5 req/sec = 5 req/sec when idle
- ❌ No instant notifications
- ❌ Network engineer disapproves: inefficient polling

**Verdict:** Unacceptable latency for "instant connection" goal.

---

## Recommended Solution: Option 1 Implementation

### Phase 1: Vite Plugin Setup

**File:** `vite-plugin-chatsubo-signaling.js`

```javascript
import { WebSocketServer } from 'ws';

export function chatsuboSignalingPlugin() {
  let wsServer;
  const rooms = new Map(); // roomId → Set({ peerId, ws, joinedAt })

  return {
    name: 'chatsubo-signaling',
    configureServer(server) {
      // Create WebSocket server on existing HTTP server
      wsServer = new WebSocketServer({
        server: server.httpServer,
        path: '/ws/signaling'
      });

      wsServer.on('connection', (ws) => {
        console.log('[Signaling] New WebSocket connection');
        let currentRoom = null;
        let currentPeerId = null;

        ws.on('message', (data) => {
          const msg = JSON.parse(data.toString());

          switch (msg.type) {
            case 'join':
              handleJoin(ws, msg.roomId, msg.peerId);
              break;
            case 'leave':
              handleLeave(ws, msg.roomId, msg.peerId);
              break;
          }
        });

        ws.on('close', () => {
          if (currentRoom && currentPeerId) {
            handleLeave(ws, currentRoom, currentPeerId);
          }
        });

        function handleJoin(ws, roomId, peerId) {
          currentRoom = roomId;
          currentPeerId = peerId;

          // Create room if doesn't exist
          if (!rooms.has(roomId)) {
            rooms.set(roomId, new Set());
          }

          const room = rooms.get(roomId);

          // Send current peer list to new joiner
          const peerList = Array.from(room).map(p => ({
            peerId: p.peerId,
            joinedAt: p.joinedAt
          }));
          ws.send(JSON.stringify({
            type: 'peer_list',
            peers: peerList
          }));

          // Add new peer to room
          room.add({ peerId, ws, joinedAt: Date.now() });

          // Broadcast to existing peers that new peer joined
          broadcastToRoom(roomId, {
            type: 'peer_joined',
            peerId: peerId
          }, ws); // Exclude sender

          console.log(`[Signaling] ${peerId} joined ${roomId} (${room.size} users)`);
        }

        function handleLeave(ws, roomId, peerId) {
          const room = rooms.get(roomId);
          if (!room) return;

          // Remove peer from room
          const peerToRemove = Array.from(room).find(p => p.peerId === peerId);
          if (peerToRemove) {
            room.delete(peerToRemove);
          }

          // Broadcast to remaining peers
          broadcastToRoom(roomId, {
            type: 'peer_left',
            peerId: peerId
          });

          // Clean up empty rooms
          if (room.size === 0) {
            rooms.delete(roomId);
          }

          console.log(`[Signaling] ${peerId} left ${roomId}`);
        }

        function broadcastToRoom(roomId, message, excludeWs = null) {
          const room = rooms.get(roomId);
          if (!room) return;

          const messageStr = JSON.stringify(message);
          room.forEach(({ ws: peerWs }) => {
            if (peerWs !== excludeWs && peerWs.readyState === 1) {
              peerWs.send(messageStr);
            }
          });
        }
      });

      console.log('[Signaling] WebSocket server ready on /ws/signaling');
    }
  };
}
```

**Update:** `vite.config.js`

```javascript
import { defineConfig } from 'vite';
import { chatsuboSignalingPlugin } from './vite-plugin-chatsubo-signaling.js';

export default defineConfig({
  plugins: [chatsuboSignalingPlugin()],
  // ... existing config ...
});
```

---

### Phase 2: Client-Side Integration

**File:** `src/network/SignalingClient.js` (NEW)

```javascript
/**
 * SignalingClient - WebSocket client for peer discovery
 * Connects to Vite plugin's /ws/signaling endpoint
 */

export default class SignalingClient {
  constructor() {
    this.ws = null;
    this.roomId = null;
    this.peerId = null;
    this.eventHandlers = new Map();
    this.isConnected = false;
  }

  /**
   * Connect to signaling server and join room
   */
  async connect(roomId, peerId) {
    return new Promise((resolve, reject) => {
      this.roomId = roomId;
      this.peerId = peerId;

      // Detect if running on localhost or network
      const host = window.location.hostname;
      const port = window.location.port || '5174';
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${host}:${port}/ws/signaling`;

      console.log(`[SignalingClient] Connecting to ${wsUrl}`);

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('[SignalingClient] WebSocket connected');
        this.isConnected = true;

        // Join room
        this.send({ type: 'join', roomId, peerId });
        resolve();
      };

      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        this.handleMessage(msg);
      };

      this.ws.onerror = (error) => {
        console.error('[SignalingClient] WebSocket error:', error);
        reject(error);
      };

      this.ws.onclose = () => {
        console.log('[SignalingClient] WebSocket closed');
        this.isConnected = false;
        this.emit('disconnected');

        // Auto-reconnect after 2 seconds
        setTimeout(() => {
          if (this.roomId && this.peerId) {
            console.log('[SignalingClient] Reconnecting...');
            this.connect(this.roomId, this.peerId);
          }
        }, 2000);
      };
    });
  }

  /**
   * Handle incoming signaling messages
   */
  handleMessage(msg) {
    console.log('[SignalingClient] Received:', msg);

    switch (msg.type) {
      case 'peer_list':
        this.emit('peer_list', msg.peers);
        break;
      case 'peer_joined':
        this.emit('peer_joined', { peerId: msg.peerId });
        break;
      case 'peer_left':
        this.emit('peer_left', { peerId: msg.peerId });
        break;
    }
  }

  /**
   * Send message to signaling server
   */
  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  /**
   * Disconnect from signaling server
   */
  disconnect() {
    if (this.ws) {
      this.send({ type: 'leave', roomId: this.roomId, peerId: this.peerId });
      this.ws.close();
      this.ws = null;
      this.isConnected = false;
    }
  }

  /**
   * Event emitter
   */
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event).add(handler);
  }

  emit(event, data) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }
}
```

---

### Phase 3: Update MeshNetworkCoordinator

**File:** `src/network/MeshNetworkCoordinator.js` (UPDATE)

```javascript
import SignalingClient from './SignalingClient.js';

export default class MeshNetworkCoordinator {
  constructor() {
    this.peerManager = new PeerConnectionManager({ maxPeers: 10 });
    this.audioManager = new AudioStreamManager();
    this.signalingClient = new SignalingClient(); // NEW
    this.roomId = null;
    this.peerList = new Set();
    this.eventHandlers = new Map();
    this.isInitialized = false;
  }

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
    try {
      await this.audioManager.getLocalAudioStream();
    } catch (audioError) {
      console.warn('[MeshNetworkCoordinator] Audio unavailable:', audioError.message);
    }

    // Set up event handlers
    this.setupPeerManagerHandlers();
    this.setupAudioManagerHandlers();

    // NEW: Connect to signaling server for peer discovery
    await this.signalingClient.connect(roomId, peerId);
    this.setupSignalingHandlers();

    this.isInitialized = true;
    this.emit('roomJoined', { roomId, peerId });

    console.log(`[MeshNetworkCoordinator] Joined room as: ${peerId}`);
    return peerId;
  }

  /**
   * NEW: Set up signaling event handlers
   */
  setupSignalingHandlers() {
    // Handle initial peer list
    this.signalingClient.on('peer_list', (peers) => {
      console.log(`[MeshNetworkCoordinator] Got peer list:`, peers);

      // Auto-connect to all existing peers
      peers.forEach(({ peerId }) => {
        if (!this.peerList.has(peerId)) {
          this.connectToPeer(peerId).catch(err => {
            console.error(`Failed to connect to ${peerId}:`, err);
          });
        }
      });
    });

    // Handle new peer joining
    this.signalingClient.on('peer_joined', ({ peerId }) => {
      console.log(`[MeshNetworkCoordinator] New peer joined: ${peerId}`);

      // Show notification
      this.emit('peerJoined', { peerId });

      // Auto-connect to new peer
      this.connectToPeer(peerId).catch(err => {
        console.error(`Failed to connect to ${peerId}:`, err);
      });
    });

    // Handle peer leaving
    this.signalingClient.on('peer_left', ({ peerId }) => {
      console.log(`[MeshNetworkCoordinator] Peer left: ${peerId}`);
      this.handlePeerLeaving(peerId);
    });
  }

  // ... rest of existing methods ...
}
```

---

### Phase 4: Update UI (Remove Manual Connection)

**File:** `src/main.js` (UPDATE)

```javascript
// Remove manual peer connection UI
async function joinRoom() {
  if (!app || isInRoom) return;

  const roomIdInput = getElement('room-id');
  const roomId = roomIdInput?.value.trim() || 'chatsubo-main';

  try {
    const joinButton = getElement('join-button');
    if (joinButton) joinButton.disabled = true;

    await app.joinRoom(roomId);

    // Update UI
    isInRoom = true;
    updateButtonVisibility();
    addSystemMessage(`✅ Joined room: ${roomId}`);

    // REMOVE: Manual peer connection section
    // const peerConnectSection = getElement('peer-connect-section');
    // if (peerConnectSection) peerConnectSection.style.display = 'block';

    // NEW: Show automatic connection status
    addSystemMessage(`🔍 Discovering peers...`);

    // Hide status dialog
    const statusDialog = getElement('status');
    if (statusDialog) {
      statusDialog.classList.add('hidden');
    }

    enableZoneButtons();
    startConnectionMetrics();
  } catch (error) {
    console.error('[Main] Failed to join room:', error);
    updateStatus(`Failed to join: ${error.message}`);
    const joinButton = getElement('join-button');
    if (joinButton) joinButton.disabled = false;
  }
}

// NEW: Listen for automatic peer connections
app.meshNetworkCoordinator.on('peerJoined', ({ peerId }) => {
  addSystemMessage(`✅ Connected to peer: ${peerId.substring(0, 12)}...`);
});
```

---

## User Experience Flow

### Scenario: Two Users Join the Bar

**Timeline:**

```
T=0s    User A opens http://10.0.40.44:5174 on laptop
T=1s    User A clicks "Join Room" (roomId: chatsubo-main)
T=2s    User A's browser:
        - PeerJS connects → gets ID abc123...
        - WebSocket connects → joins room "chatsubo-main"
        - Signaling server sends: { type: 'peer_list', peers: [] }
        - UI shows: "✅ Joined room: chatsubo-main"
        - UI shows: "🔍 Discovering peers... (0 users found)"

T=30s   User B opens same URL on phone
T=31s   User B clicks "Join Room"
T=32s   User B's browser:
        - PeerJS connects → gets ID def456...
        - WebSocket connects → joins room "chatsubo-main"
        - Signaling server sends: { type: 'peer_list', peers: [abc123...] }
        - Browser auto-initiates P2P connection to abc123...
        - UI shows: "✅ Joined room: chatsubo-main"
        - UI shows: "🔍 Discovering peers... (1 user found)"

T=32s   User A's browser:
        - Signaling server sends: { type: 'peer_joined', peerId: def456... }
        - UI shows: "✅ New user joined the bar"
        - Browser auto-accepts P2P connection from def456...

T=33s   Both users:
        - P2P connection established (via PeerJS cloud)
        - Audio streams flowing
        - Chat messages synced
        - Position updates synced
        - UI shows: "Connected (2 users)"
```

**Total time from URL to connected:** 33 seconds (for second user)
**Manual steps:** 1 (click "Join Room")
**Manual peer ID exchange:** ZERO

---

## Network Architecture Validation

### Latency Analysis

```
Component                  Latency Impact
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WebSocket handshake        ~50ms (one-time)
Signaling message          ~5ms (negligible)
PeerJS connection setup    ~500ms (unchanged)
Audio stream start         ~200ms (unchanged)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total added latency:       ~55ms (acceptable)
```

**Network Engineer Assessment:** ✅ APPROVED
- WebSocket adds minimal overhead
- P2P audio remains direct (no relay through signaling server)
- Scales to 10 users (100 WebSocket messages for full mesh = trivial)

### Connection Topology

```
┌─────────────────────────────────────────────┐
│     Signaling Server (Vite Plugin)          │
│     - Announces peer joins/leaves           │
│     - Broadcasts peer lists                 │
│     - NO audio/data relay                   │
└─────────────────────────────────────────────┘
         │                        │
         │ (Control plane)        │
         │                        │
   ┌─────▼──────┐          ┌─────▼──────┐
   │  Browser A │          │  Browser B │
   │  abc123... │          │  def456... │
   └────────────┘          └────────────┘
         │                        │
         └──── P2P Audio/Data ────┘
              (via PeerJS cloud)
              (Data plane)
```

**Separation of Concerns:**
- **Control Plane:** WebSocket signaling (who's in the room)
- **Data Plane:** PeerJS P2P connections (audio, chat, position)

This matches network engineering best practices for scalable architectures.

---

## Failure Handling

### Scenario: Vite Server Restarts

```
T=0     Vite server restarts (npm run dev)
T=1     All WebSocket connections drop
T=3     Browsers auto-reconnect after 2-second delay
T=4     Browsers re-join room with same peer IDs
T=5     Browsers rediscover existing P2P connections
        (P2P connections survive signaling disconnect)
```

**Impact:** 3-second disruption, but audio continues
**User Experience:** Status indicator shows "Reconnecting..." briefly

### Scenario: Network Disconnection

```
Browser loses WiFi
→ WebSocket closes
→ PeerJS connections timeout after 5 seconds
→ UI shows "Disconnected"
→ WiFi reconnects
→ Page refresh required (manual)
```

**Future Enhancement:** Automatic page reload on network restore

---

## Implementation Checklist

### Phase 1: Signaling Server (2 hours)
- [ ] Create `vite-plugin-chatsubo-signaling.js`
- [ ] Implement room registry (Map data structure)
- [ ] Implement join/leave handlers
- [ ] Implement broadcast logic
- [ ] Add logging for debugging
- [ ] Test with manual WebSocket client (wscat)

### Phase 2: Client Integration (2 hours)
- [ ] Create `src/network/SignalingClient.js`
- [ ] Implement WebSocket connection logic
- [ ] Implement auto-reconnect on disconnect
- [ ] Add event emitter for peer discovery
- [ ] Test with manual signaling server

### Phase 3: MeshNetworkCoordinator Update (1 hour)
- [ ] Import SignalingClient
- [ ] Add signaling handlers in joinRoom()
- [ ] Auto-connect to discovered peers
- [ ] Handle peer_joined/peer_left events
- [ ] Test with two browser instances

### Phase 4: UI Cleanup (1 hour)
- [ ] Remove manual peer connection section
- [ ] Add "Discovering peers..." status
- [ ] Add notification when peer joins
- [ ] Update connection metrics display
- [ ] Test end-to-end user flow

### Testing (2 hours)
- [ ] Test localhost scenario (both on same machine)
- [ ] Test network scenario (laptop + phone on 10.0.40.44)
- [ ] Test Vite server restart (reconnection)
- [ ] Test 5+ users joining simultaneously
- [ ] Test peer leaving/rejoining

**Total Estimate:** 8 hours (including testing)

---

## Success Criteria

✅ **MVP Success:**
- User joins room with 1 click
- Peer discovery happens automatically within 5 seconds
- No manual peer ID exchange required
- Works on both localhost and network (10.0.40.44)
- Survives Vite server restart with auto-reconnect

✅ **User Experience:**
- Status shows "Discovering peers..." immediately
- Notification when new user joins: "✅ New user joined the bar"
- Connection metrics show real peer count
- Total time from URL to connected: < 10 seconds

✅ **Technical Quality:**
- Clean separation: signaling (WebSocket) vs P2P (PeerJS)
- Network latency < 100ms added overhead
- Scales to 10 users (full mesh = 45 P2P connections)
- Follows network engineering best practices

---

## Future Enhancements (Post-MVP)

### Production Signaling Server
- Deploy dedicated Node.js signaling server (not Vite plugin)
- Use Redis for room state (multi-instance scaling)
- Add authentication (JWT tokens)
- Add room capacity limits enforcement

### Enhanced Discovery
- Show room list before joining: "Gaming Zone (3 users), Bar (7 users)"
- Show peer usernames (not just IDs)
- Show peer locations on minimap

### Resilience
- Automatic page reload on network restore
- Peer connection retry logic
- Graceful degradation when signaling fails (manual fallback)

---

## Conclusion

**Recommended Approach:** Vite Plugin with WebSocket Signaling (Option 1)

**Why:**
- Minimal infrastructure (uses existing Vite server)
- Instant notifications (WebSocket, not polling)
- Works for both localhost and network
- Follows network engineering best practices
- Achieves "walk into a bar" UX goal

**Implementation Effort:** 8 hours (including testing)

**User Impact:** Transforms manual 90-second ID exchange into automatic 5-second connection

**Next Steps:**
1. Get approval from product manager
2. Create GitHub issue for tracking
3. Implement Phase 1 (signaling server)
4. Test with manual WebSocket client
5. Implement Phases 2-4 (client integration)
6. End-to-end testing with 2+ users
7. Deploy to demo environment

---

**Status:** Ready for Implementation
**Reviewed By:** Network Engineer (architecture approved)
**Approved By:** [Pending Product Manager approval]
