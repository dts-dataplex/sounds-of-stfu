# PeerJS Spatial Audio POC Design

**Date:** 2025-12-23
**Status:** Approved
**Timeline:** 7-12 days
**Target:** Proof-of-concept with 3-8 concurrent users

---

## Overview

This design outlines a minimal proof-of-concept to validate the core spatial audio concept for Sounds of STFU. The POC will demonstrate that distance-based volume mixing creates a natural "bar-like" experience where multiple conversations can coexist in the same virtual space.

**Key Constraints:**
- Solo developer
- 2-4 week timeline (targeting 7-12 days)
- Privacy-first: no third-party audio processing
- Open source: must be transparent and self-hostable

**Success Criteria:** 3-5 users can have natural conversations where moving closer = louder, enabling multiple simultaneous conversation groups in one "room."

---

## Tech Stack

### Core Technologies

**PeerJS** - WebRTC peer-to-peer connections
- Open source (MIT license)
- Mesh networking architecture (all connections peer-to-peer)
- Can self-host signaling server
- Audio never touches third-party servers (except signaling setup)

**Web Audio API** - Spatial audio processing
- Calculate distance between users
- Apply gain (volume) based on distance
- Mix multiple audio streams client-side

**Canvas API** - 2D visualization
- Render virtual bar space
- Click-to-move positioning
- Visual feedback (avatars, speaking indicators)

**Single HTML File** - Zero build complexity
- Embedded CSS and JavaScript
- ~300-400 lines total
- Just open in browser to run

### Why PeerJS Over Alternatives

See ADR-001 for full rationale. Summary:
- **vs Daily.co/Agora:** Privacy - audio stays peer-to-peer, no third-party processing
- **vs Raw WebRTC:** Simplicity - PeerJS abstracts connection complexity
- **vs Self-hosted Jitsi:** Scope - full platform is overkill for POC

**Trade-off:** Mesh networking limits us to 5-8 users. Acceptable for POC; SFU migration path exists if concept validates.

---

## System Architecture

### High-Level Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Browser 1  │────▶│   PeerJS    │◀────│  Browser 2  │
│  (Client)   │     │  Signaling  │     │  (Client)   │
└─────────────┘     │   Server    │     └─────────────┘
      ▲             └─────────────┘            ▲
      │                                        │
      └────────── P2P Audio Streams ──────────┘
                   P2P Data (positions)
```

### Three Core Components

**1. Connection Manager (PeerJS wrapper)**
- Handles peer discovery and connection establishment
- Maintains list of active participants
- Broadcasts position updates to all peers via data channel
- Receives audio MediaStreams from each peer
- Manages reconnection logic

**2. Spatial Audio Engine (Web Audio API)**
- Receives raw audio from each peer
- Calculates Euclidean distance: `sqrt((x1-x2)² + (y1-y2)²)`
- Applies gain based on distance: `volume = 1.0 / (1 + distance/falloffRadius)`
- Creates GainNode per peer, updates 60fps
- Mixes all adjusted streams for playback

**3. Visual Canvas (Canvas API)**
- Renders 2D bar space (simple rectangle for POC)
- Shows user avatars at their positions
- Click-to-move positioning
- Speaking indicators (pulsing circle when audio detected)
- Distance reference (optional circles showing hearing range)

### Data Flow

1. User clicks canvas → new position (x, y) calculated
2. Position broadcast to all peers via PeerJS data channel
3. Receive position updates from all peers
4. For each peer:
   - Calculate distance from local user to peer
   - Calculate volume: `volume = f(distance)`
   - Update peer's GainNode
5. Web Audio API mixes all gain-adjusted streams
6. Combined audio plays through speakers

---

## Implementation Details

### File Structure (Single File)

```html
<!DOCTYPE html>
<html>
<head>
  <title>Sounds of STFU - POC</title>
  <style>
    /* Simple CSS: canvas styling, basic UI */
  </style>
</head>
<body>
  <canvas id="bar"></canvas>
  <div id="controls">
    <input id="roomCode" placeholder="Room code">
    <button id="join">Join</button>
    <button id="mute">Mute</button>
  </div>

  <script src="https://unpkg.com/peerjs@1.5.0/dist/peerjs.min.js"></script>
  <script>
    // PeerConnection class (~100 lines)
    // SpatialAudio class (~80 lines)
    // BarCanvas class (~80 lines)
    // App coordinator (~40 lines)
  </script>
</body>
</html>
```

### Key Implementation Challenges & Solutions

**1. Room Coordination**

**Problem:** How do new users discover existing participants in a mesh network?

**Solution (Host-based):**
- First user to join creates Peer with room code as ID
- Becomes "room host" (just a convention, not privileged)
- New users connect to host first
- Host sends list of all peer IDs via data channel
- New user connects to everyone in the list
- New user sends their ID to host, host broadcasts to others

**Alternative (if host-based is unreliable):**
- Use Firebase Realtime Database just for room participant lists
- Minimal backend: just stores `{ roomCode: [peerId1, peerId2, ...] }`
- Each client updates this list on join/leave
- Still fully P2P for audio, just coordination via Firebase

**2. Audio Mixing with Web Audio API**

```javascript
class SpatialAudio {
  constructor() {
    this.audioContext = new AudioContext();
    this.peerGains = {}; // { peerId: GainNode }
  }

  addPeerStream(peerId, mediaStream) {
    const source = this.audioContext.createMediaStreamSource(mediaStream);
    const gainNode = this.audioContext.createGain();
    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    this.peerGains[peerId] = gainNode;
  }

  updateVolume(peerId, distance) {
    const gain = this.calculateGain(distance);
    this.peerGains[peerId].gain.value = gain;
  }

  calculateGain(distance) {
    const maxRange = 300; // pixels on canvas = "across the room"
    return Math.max(0, 1 - distance / maxRange); // linear falloff
  }
}
```

**3. Position Synchronization**

- Use PeerJS data channel (separate from audio)
- Send position updates when user moves
- Throttle: max 10 updates/second (avoid flooding)
- Each client maintains: `positions = { peerId: {x, y} }`
- Update positions on receive, recalculate distances, update gains

```javascript
connection.on('data', (data) => {
  if (data.type === 'position') {
    positions[data.peerId] = { x: data.x, y: data.y };
    updateAllVolumes(); // recalculate distances, update gains
  }
});
```

**4. Distance-to-Volume Formula**

**Start simple (linear):**
```javascript
volume = Math.max(0, 1 - distance / maxHearingRange)
```

**Experiment with logarithmic (more realistic):**
```javascript
volume = 1 / (1 + distance / falloffRadius)
```

**Tunable parameters:**
- `maxHearingRange`: Distance at which volume = 0 (e.g., 300px)
- `falloffRadius`: How quickly volume drops (smaller = faster falloff)

**Testing approach:** Let users adjust sliders in real-time, find what "feels right"

---

## Development Phases

### Phase 1: PeerJS Basics (Days 1-3)

**Goal:** Get two browsers exchanging audio

**Tasks:**
- Set up basic HTML page with PeerJS CDN
- Create Peer instance, get peer ID
- Second browser connects to first peer's ID
- Exchange audio MediaStreams (getUserMedia)
- Verify audio works in both directions

**Milestone:** Two people can talk (no spatial audio yet)

**Debugging focus:**
- Microphone permissions
- Audio playback issues (autoplay policy)
- Connection failures (STUN server config)

---

### Phase 2: Multi-User Mesh (Days 3-5)

**Goal:** 3-5 users all connected

**Tasks:**
- Implement room coordination (host-based or Firebase)
- Handle N connections per client (N-1 peers)
- Track all peer IDs and connection states
- Handle disconnections gracefully
- Display participant list in UI

**Milestone:** 3-5 people can join same room and talk

**Debugging focus:**
- Connection failures when scaling to 3+ users
- Reconnection logic when someone drops
- Race conditions (two people join simultaneously)

---

### Phase 3: Spatial Audio Engine (Days 5-7)

**Goal:** Movement affects volume

**Tasks:**
- Add canvas, render as simple rectangle
- Implement click-to-move (onclick → new position)
- Broadcast position updates via data channel
- Receive positions from all peers
- Calculate distances, create GainNodes
- Update gains in animation loop (requestAnimationFrame)

**Milestone:** Core spatial audio works - moving closer = louder!

**Debugging focus:**
- Audio glitches when updating gains too frequently
- Position sync delays (throttling data channel)
- Volume curve tuning (too aggressive vs too subtle)

---

### Phase 4: Polish & Test (Days 8-10)

**Goal:** Feels natural and usable

**Tasks:**
- Tune distance-to-volume curve with real users
- Add visual feedback:
  - Speaking indicators (analyze audio levels)
  - Distance circles (show hearing range)
  - Better avatars (names, colors)
- Test with friends from the bar community
- Gather structured feedback (survey/notes)
- Fix bugs discovered during real usage

**Milestone:** "It feels like a real bar" - multiple conversations work

**Feedback questions:**
- Does moving between conversations feel natural?
- Can you have a private conversation in one corner?
- Is the volume curve realistic?
- What's missing that would make this compelling?

---

### Phase 5 (Optional): Deploy (Days 11-12)

**Goal:** Easy sharing for wider testing

**Tasks:**
- Push to GitHub Pages
- Add onboarding instructions (how to join, how to move)
- Self-host PeerJS signaling server (if needed for reliability)
- Add error messages for connection failures
- Create shareable room links

**Milestone:** Anyone can try it with just a URL

---

## Known Limitations (Accept for POC)

### Technical Limitations

1. **Scalability: 5-8 users maximum**
   - Mesh networking doesn't scale
   - Each user connects to everyone: N users = N*(N-1)/2 connections
   - Beyond 8 users, bandwidth and CPU become bottlenecks
   - **Migration path:** SFU architecture (mediasoup, LiveKit, Jitsi)

2. **No persistence**
   - Refresh browser = lose connection
   - No user accounts, no saved rooms
   - No conversation history
   - **Migration path:** Add Firebase/Supabase for state

3. **Network sensitivity**
   - Users behind corporate firewalls may not connect
   - Strict NAT requires TURN servers (can add Google's free STUN)
   - Mobile browsers have WebRTC quirks
   - **Migration path:** Self-hosted TURN server, better error handling

4. **Browser only**
   - Desktop Chrome/Firefox work best
   - Safari has WebRTC limitations
   - Mobile audio mixing is challenging
   - **Migration path:** Native apps or better browser support

### Feature Limitations

5. **No moderation tools**
   - Can't kick users, mute others, implement talking stick
   - Everyone hears everyone (within distance)
   - **Migration path:** Add moderation layer in v1.1

6. **Basic visuals**
   - Simple shapes on canvas
   - No two-story bar, no themed zones
   - No heat map (yet)
   - **Migration path:** Proper UI framework, better graphics

7. **No accessibility**
   - No captions, no screen reader support
   - Audio-only experience
   - **Migration path:** Add live captions (Web Speech API)

---

## Success Criteria

### Technical Success

**Connection Reliability:**
- ✅ 3 users connect successfully >80% of attempts
- ✅ Audio quality comparable to phone call (clear, low latency)
- ✅ Reconnection works after network hiccup
- ✅ Latency <300ms (acceptable for conversation)

**Spatial Audio Accuracy:**
- ✅ Volume clearly correlates with distance
- ✅ Moving closer → louder (feels immediate)
- ✅ Two conversations can coexist without interference
- ✅ Distance curve feels natural (not too extreme)

### User Experience Success

**"It Feels Like a Real Bar":**
- ✅ Users naturally move to join conversations
- ✅ Can "overhear" distant conversations at low volume
- ✅ Moving between groups feels fluid, not jarring
- ✅ Quiet corner feels private even with activity nearby

**Solves the Discord Problem:**
- ✅ Two groups can talk simultaneously in same room
- ✅ Don't have to "switch channels" to change conversations
- ✅ Ambient awareness of overall activity

**Usability:**
- ✅ New user can join and understand it in <2 minutes
- ✅ Click to move is intuitive
- ✅ Clear who's talking, who's where

### Validation Method

1. Recruit 3-5 friends from the bar community
2. Have them use it for 30 minutes of natural conversation
3. Ask:
   - "Does this feel more like a real bar than Discord?"
   - "Could you have multiple conversations happening?"
   - "What felt wrong or awkward?"
4. If yes → validate with more users, plan v2 features
5. If no → understand why, iterate on core mechanics

---

## Future Path (Post-POC)

### If POC Succeeds

**Immediate Next Steps:**
1. Document learnings (what worked, what didn't)
2. Write ADR for scaling decisions
3. Identify critical next features from user feedback

**Scaling Options (if need >8 users):**
- **mediasoup:** Self-hosted SFU, open source, excellent performance
- **LiveKit:** Newer, good developer experience, self-hostable
- **Jitsi:** Full platform, mature, self-hosted
- All maintain privacy/self-hosting principles

**Feature Evolution:**
- Add Firebase/Supabase for persistence
- Implement heat map using activity data
- Build proper UI (React/Vue)
- Add moderation tools (talking stick, mute)
- Text chat overlay

### If POC Reveals Issues

**Possible Discoveries:**
- Spatial audio doesn't feel natural (volume curve problems)
- Mesh networking too unreliable (need SFU sooner)
- Canvas UI too limiting (need proper 3D or better 2D)
- Users don't naturally move (need different UX)

**Response:**
- Iterate on core mechanics before adding features
- Consider alternative approaches (3D audio, different positioning)
- Validate assumptions with smaller tests

---

## Risk Mitigation

### Risk: PeerJS connections unreliable

**Likelihood:** Medium
**Impact:** High (POC doesn't work)
**Mitigation:**
- Test early (Phase 1-2 focus)
- Configure STUN servers properly
- Have backup plan (use Firebase for signaling)
- Test on different networks (home, mobile hotspot)

### Risk: Spatial audio doesn't "feel right"

**Likelihood:** Medium
**Impact:** High (concept doesn't validate)
**Mitigation:**
- Make distance curve easily tunable
- Test with real users early (Phase 4)
- Experiment with multiple formulas (linear, log, inverse square)
- Get feedback from bar community specifically

### Risk: Can't finish in 7-12 days

**Likelihood:** Medium
**Impact:** Medium (delayed validation)
**Mitigation:**
- Prioritize ruthlessly (Phase 3 is MVP)
- Phase 4-5 are optional polish
- Acceptable to ship "works but rough" for initial feedback
- Can extend timeline if core concept works

### Risk: 8-user limit too restrictive

**Likelihood:** Low (POC should test with 3-5)
**Impact:** Medium (can't test real scenarios)
**Mitigation:**
- Accept limitation for POC
- Document SFU migration path
- Focus on "does spatial audio work" not "does it scale"

---

## Open Questions

1. **Distance curve:** Linear, logarithmic, or inverse square law? (Answer: Test all, let users decide)

2. **Room coordination:** Host-based or Firebase? (Answer: Try host-based first, Firebase if unreliable)

3. **Visual design:** How minimalist can we go and still be usable? (Answer: Names + circles + speaking indicator = enough for POC)

4. **Audio quality settings:** Let users adjust codec/bitrate or keep automatic? (Answer: Automatic for POC, settings in v2)

5. **TURN servers:** Use free Google STUN or set up own TURN? (Answer: Google STUN for POC, revisit if connection issues)

---

## References

- **PRODUCT_REQUIREMENTS.md:** Full feature specifications
- **BACKLOG.md:** Task breakdown (this POC addresses MVP v1.0 core features)
- **AGENTIC_DESIGN_PATTERNS.md:** For future AI features (not in POC)
- **ADR-001:** PeerJS selection and privacy-first rationale
- **PeerJS Documentation:** https://peerjs.com/docs/
- **Web Audio API:** https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API

---

**Next Steps:**
1. Review and approve this design
2. Create ADR-001 documenting PeerJS decision
3. Set up git worktree for isolated development
4. Begin Phase 1 implementation
