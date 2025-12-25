# Chatsubo Spatial Audio Demo

A working demonstration of the Sounds of STFU platform, showing:
- **Spatial audio**: PeerJS peer-to-peer audio with distance-based volume falloff
- **Cyberpunk aesthetic**: Isometric Three.js scene with neon-lit zones
- **Click-to-move**: Move your avatar by clicking anywhere in the scene
- **Wave-based falloff**: Audio volume uses `volume = 1 / (1 + (distance/8)^2)`

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## Testing Spatial Audio

To test the spatial audio features, you need **2 or more browser windows**:

### Step 1: Open First Browser
1. Open http://localhost:5173
2. Allow microphone access when prompted
3. Copy your Peer ID from the UI (top right panel)

### Step 2: Open Second Browser
1. Open http://localhost:5173 in a new window/tab (or different browser)
2. Allow microphone access
3. Paste the first browser's Peer ID into the "Connect" field
4. Click "Connect"

### Step 3: Test Spatial Audio
- Click anywhere in the scene to move your avatar
- Watch the volume percentage change based on distance
- Move closer (volume increases) or farther (volume decreases)
- Try moving between zones:
  - **Gaming Zone** (blue, top-left)
  - **Central Bar** (amber, center)
  - **Card Tables** (red, bottom-right)
  - **Firepit Debate** (orange, bottom-left)

## Features

- **Real-time audio**: Hear each other's voices with distance-based volume
- **Visual feedback**: See connected peers' avatars and distances
- **Zone detection**: UI shows which zone you're currently in
- **Peer list**: See all connected peers with distance and volume levels
- **Cyberpunk UI**: Green monospace terminal aesthetic with neon glow

## Architecture

- **PeerJS**: P2P WebRTC connections (no server relay for audio)
- **Three.js**: 3D rendering with isometric camera
- **Wave falloff**: `calculateVolume(distance, 8)` implements acoustic physics
- **Privacy-first**: All audio processing happens in-browser

## Troubleshooting

**Microphone not working?**
- Check browser permissions (allow microphone access)
- Try HTTPS or localhost only (WebRTC requirement)

**Can't connect to peer?**
- Both browsers must be running the demo
- Copy/paste peer ID exactly
- Check browser console for errors

**No audio?**
- Ensure both peers allowed microphone access
- Check system audio isn't muted
- Try moving avatars closer together

## Next Steps

This demo implements MVP v1.0 spatial audio. Future enhancements:
- Heat map visualization (v1.1)
- Booth privacy with access control (v2.0)
- Topic detection and conversation summaries (v2.0)
- Talking stick moderation (v2.0)
