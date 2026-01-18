# Sounds of STFU: Go + LiveKit Rewrite Design

**Date:** 2025-01-06
**Status:** Approved for Implementation
**Supersedes:** Previous Node.js/Vite/PeerJS implementation

---

## Executive Summary

Complete rewrite of Sounds of STFU using:
- **Go backend** for API, WebSocket, and static file serving
- **LiveKit SFU** (self-hosted) for audio routing
- **Vanilla JS + Canvas** frontend (no Node.js build tools)
- **Web Audio API PannerNode** for spatial audio processing

This design addresses fundamental failures in the previous implementation across WebRTC connections, spatial audio mixing, and AI features.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Go Backend Server                        │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ HTTP Server  │  │ WebSocket    │  │ LiveKit          │  │
│  │ Static files │  │ Position sync│  │ Token service    │  │
│  │ /api routes  │  │ Room state   │  │ Room management  │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
         │                    │                    │
         │                    │                    ▼
         │                    │         ┌──────────────────┐
         │                    │         │ LiveKit SFU      │
         │                    │         │ (Docker/self-    │
         │                    │         │  hosted)         │
         │                    │         └──────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│                   Browser Client                             │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ 2D Canvas    │  │ LiveKit JS   │  │ Spatial Audio    │  │
│  │ Renderer     │  │ Client SDK   │  │ Processor        │  │
│  │ (positions,  │  │ (CDN loaded) │  │ (Web Audio API)  │  │
│  │  zones, UI)  │  │              │  │                  │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**Data Flow:**
1. User loads page → Go serves static HTML/JS/CSS
2. JS requests LiveKit token from `/api/token`
3. JS connects to LiveKit SFU for audio
4. JS connects to Go WebSocket for position updates
5. User moves → position sent via WebSocket → broadcast to all
6. Audio streams arrive → spatial processor applies distance-based volume

---

## Technology Decisions

### Why LiveKit over PeerJS/Custom WebRTC

Based on [Discord's voice architecture](https://discord.com/blog/how-discord-handles-two-and-half-million-concurrent-voice-users-using-webrtc):

- **SFU (Selective Forwarding Unit)** - server forwards streams without mixing
- Client receives individual streams, applies spatial mixing locally
- LiveKit is written in Go, has [spatial audio support](https://github.com/livekit-examples/spatial-audio)
- Self-hostable, production-proven

### Why Vanilla JS over Node.js Build Tools

Per personal preferences:
- No Node.js dependency for solution development
- CDN-loaded libraries (LiveKit client, future Transformers.js)
- Simple HTML/CSS/JS served by Go backend
- No bundler, no transpilation, no npm

### Why Web Audio API PannerNode

[MDN Web Audio Spatialization](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Web_audio_spatialization_basics):

- Built-in distance models: `linear`, `inverse`, `exponential`
- Browser-native, GPU-optimized
- Proven in [LiveKit's spatial audio tutorial](https://blog.livekit.io/tutorial-using-webrtc-react-webaudio-to-create-spatial-audio/)

---

## MVP Scope (4 Features)

1. **Spatial audio with distance falloff** - users hear others based on virtual distance
2. **2D styled canvas with user positions** - see where everyone is, click/arrow-key to move
3. **Real-time position sync** - see others move smoothly
4. **Single-floor zone layout** - zones with acoustic multipliers

### Explicitly Deferred (Post-MVP)

- Speech-to-text captions
- Heat map visualization
- Topic word clouds
- Talking stick moderation
- Per-zone mute controls
- Text chat
- Second floor

---

## User Experience

### Identity & Persistence

```javascript
// localStorage schema
{
  "username": "steev",
  "lastRoom": "chatsubo-main",
  "preferences": {
    "masterVolume": 0.8
  }
}
```

- Username required before connecting
- Username must be unique within room (server validates)
- Preferences restored on page load for quick reconnect

### Movement Controls

- **Click-to-move**: Click anywhere, avatar animates to position
- **Arrow keys / WASD**: Direct control, continuous movement while held
- Both methods work simultaneously

### Multi-Room Support

- URL structure: `https://server.com/room/{room-name}`
- Each room isolated at server level
- Room created on-demand, destroyed when empty

### Debug Console

- Toggle with `~` key
- Commands: `/tp x y`, `/users`, `/volume 0-1`, `/zone`, `/help`
- Shows connection status, WebSocket messages, audio levels

---

## Zone Acoustic Model

Zones are NOT isolated - they apply volume multipliers on top of distance falloff:

```
Final Volume = Distance Falloff × Zone Multiplier
```

| Zone | Multiplier | Character |
|------|------------|-----------|
| Main Bar | 1.0 | Full volume, social hub |
| Gaming Corner | 0.8 | Slightly dampened |
| Card Tables | 0.85 | Moderate dampening |
| Firepit | 0.9 | Open debate area |
| Quiet Booths | 0.4 | Significantly quieter |

### Floor Layout (Single Floor)

```
┌────────────────────────────────────────────────────────────┐
│                        CHATSUBO                            │
│  ┌─────────────┐                    ┌─────────────────┐   │
│  │   GAMING    │                    │                 │   │
│  │   CORNER    │                    │    MAIN BAR     │   │
│  │   (0.8x)    │                    │     (1.0x)      │   │
│  └─────────────┘                    └─────────────────┘   │
│                                                            │
│  ┌─────────────┐                    ┌─────────────────┐   │
│  │    CARD     │                    │    FIREPIT      │   │
│  │   TABLES    │                    │    (0.9x)       │   │
│  │   (0.85x)   │                    │                 │   │
│  └─────────────┘                    └─────────────────┘   │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │                  QUIET BOOTHS (0.4x)                 │ │
│  └──────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

Zone labels rendered directly on zones (no separate navigation).

---

## Spatial Audio Implementation

### Audio Pipeline (Per Remote User)

```javascript
const audioContext = new AudioContext();

// Connect LiveKit stream to Web Audio
const sourceNode = audioContext.createMediaStreamSource(mediaStream);

// PannerNode handles spatial positioning
const panner = audioContext.createPannerNode();
panner.distanceModel = "exponential";
panner.refDistance = 100;      // 100% volume at this distance
panner.maxDistance = 500;      // Very quiet beyond this
panner.rolloffFactor = 2;      // Falloff rate
panner.coneInnerAngle = 360;   // Omnidirectional
panner.coneOuterAngle = 360;

// GainNode for zone multiplier
const zoneGain = audioContext.createGain();

// Connect chain
sourceNode.connect(panner).connect(zoneGain).connect(audioContext.destination);
```

### Position Updates

```javascript
function updatePosition(theirPosition) {
  const relative = {
    x: theirPosition.x - myPosition.x,
    z: theirPosition.y - myPosition.y  // 2D y → 3D z
  };

  // Smooth transitions (20ms)
  panner.positionX.setTargetAtTime(relative.x, audioContext.currentTime, 0.02);
  panner.positionZ.setTargetAtTime(relative.z, audioContext.currentTime, 0.02);
}
```

---

## Go Backend API

### Project Structure

```
sounds-of-stfu/
├── cmd/server/main.go
├── internal/
│   ├── api/handlers.go
│   ├── room/manager.go, state.go, broadcast.go
│   ├── livekit/tokens.go
│   └── config/config.go
├── web/
│   ├── index.html
│   ├── css/style.css
│   └── js/*.js
├── go.mod
└── Dockerfile
```

### HTTP Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/` | Serve index.html |
| GET | `/room/{roomName}` | Serve room |
| GET | `/static/*` | Serve CSS/JS |
| POST | `/api/token` | Generate LiveKit token |
| GET | `/ws/{roomName}` | WebSocket connection |

### Dependencies

```go
require (
    github.com/gorilla/mux v1.8.1
    github.com/gorilla/websocket v1.5.1
    github.com/livekit/protocol v1.9.0
    github.com/rs/cors v1.10.1
)
```

---

## WebSocket Protocol

### Message Types

```javascript
// Client → Server
{ "type": "position_update", "x": 250, "y": 180 }
{ "type": "ping" }

// Server → Client
{ "type": "room_state", "users": [...], "zones": [...] }
{ "type": "user_joined", "username": "x", "x": 0, "y": 0, "zone": "main_bar" }
{ "type": "user_moved", "username": "x", "x": 0, "y": 0, "zone": "main_bar" }
{ "type": "user_left", "username": "x" }
{ "type": "pong" }
{ "type": "error", "code": "username_taken", "message": "..." }
```

### Rate Limiting

- Server throttles position updates to max 20/second
- Client self-throttles to ~15/second during movement

---

## Frontend Structure

```
web/
├── index.html
├── css/style.css
└── js/
    ├── app.js          # Main entry, orchestration
    ├── config.js       # Zones, theme constants
    ├── state.js        # AppState object
    ├── storage.js      # localStorage wrapper
    ├── websocket.js    # Position sync
    ├── livekit.js      # Audio connection
    ├── audio.js        # Spatial processing
    ├── canvas.js       # 2D rendering
    ├── input.js        # Keyboard/mouse
    └── ui.js           # Login, debug console
```

### Visual Theme (Cyberpunk)

- Background: `#0a0a0f`
- Zone borders: `#1a4a6e` (neon blue accent: `#00d4ff`)
- User circles: `#00d4ff` (self: `#ff6b00`)
- Speaking indicator: `#00ff88` ring
- Font: monospace

---

## Deployment

### Docker Compose

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "8080:8080"
    environment:
      - LIVEKIT_URL=ws://livekit:7880
      - LIVEKIT_API_KEY=${LIVEKIT_API_KEY}
      - LIVEKIT_API_SECRET=${LIVEKIT_API_SECRET}
    depends_on:
      - livekit

  livekit:
    image: livekit/livekit-server:latest
    ports:
      - "7880:7880"
      - "7881:7881"
    command: --config /etc/livekit.yaml
    volumes:
      - ./livekit.yaml:/etc/livekit.yaml
```

---

## Implementation Phases

### Phase 1: Foundation (Est. effort: Medium)
- Go project setup with HTTP server
- Static file serving
- WebSocket room management
- Position broadcast

### Phase 2: LiveKit Integration (Est. effort: Medium)
- LiveKit server deployment (Docker)
- Token generation endpoint
- Client-side LiveKit connection

### Phase 3: Spatial Audio (Est. effort: Low-Medium)
- Web Audio API graph per user
- PannerNode configuration
- Zone multiplier application

### Phase 4: Frontend UI (Est. effort: Medium)
- Canvas rendering with cyberpunk theme
- Movement controls (click + arrow keys)
- Login screen with persistence
- Debug console

### Phase 5: Polish & Testing (Est. effort: Low)
- Multi-user testing
- Audio tuning (distances, falloff)
- Error handling
- Documentation

---

## Future Enhancements (Post-MVP)

1. **AI Features** (browser-side via Transformers.js CDN)
   - Speech-to-text captions
   - Sentiment analysis for heat maps
   - Topic detection word clouds

2. **Moderation**
   - Talking stick queue system
   - Per-zone mute controls

3. **Additional Clients**
   - Desktop app (Wails - Go + WebView)
   - Mobile responsive design

4. **Scaling**
   - Redis for multi-instance room state
   - LiveKit Cloud for managed infrastructure
