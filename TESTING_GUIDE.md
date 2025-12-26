# Chatsubo Virtual Bar - Testing Guide

## Testing Avatar and Navigation Features (MVP v1.0)

Chrome is now running with remote debugging enabled at http://localhost:5176/

### What You Should See

1. **Initial State (Before Joining)**
   - Status overlay in center: "Initializing..."
   - Info panel (top left): "Chatsubo Virtual Bar" with MVP v1.0 components
   - Control panel (top right): Room ID input, "Join Room" button (enabled after initialization)
   - Zone movement panel (bottom right): 8 zone buttons (disabled until joined)
   - Chat panel (bottom left): Messages area and input (disabled until joined)
   - 3D scene canvas: Isometric view of the bar with colored zones

2. **After Clicking "Join Room"**
   - Status overlay should fade/hide
   - System message in chat: "Joined room: chatsubo-main"
   - All zone buttons become enabled
   - **NEW: Cyan-green cone avatar appears at entryway position (24, 0, 34)**
   - Connection status shows "Connected" in green
   - Peer count shows "0" (unless others are connected)

### Testing Checklist

#### ✅ Test 1: Avatar Appears at Entryway
- [ ] Click "Join Room" button
- [ ] Look at the 3D scene - you should see a **bright cyan-green cone** (#44ff88 color)
- [ ] The cone should be positioned at the **bottom center** of the scene (entryway zone)
- [ ] Cone should be pointing upward with a slight glow/emissive effect

**Expected**: Avatar cone appears at entryway coordinates (24, 0, 34)

#### ✅ Test 2: Zone Movement with Friendly Names
- [ ] Click the "🎮 Gaming" button
- [ ] Chat should show: "Moved to Gaming Zone" (NOT coordinates like "8, 7")
- [ ] Avatar cone should move to the **upper left** area of the scene
- [ ] Try other zone buttons:
  - 🍺 Bar → "Moved to Central Bar"
  - 🃏 Tables → "Moved to Card Tables"
  - 🔥 Firepit → "Moved to Firepit Debate Area"
  - 🛋️ Booth 1 → "Moved to Private Booth 1"
  - 🛋️ Booth 2 → "Moved to Private Booth 2"
  - 🎤 Stage → "Moved to Small Stage"
  - 🚪 Entryway → "Moved to Entryway"

**Expected**:
- Chat messages show zone names, not coordinates
- Avatar cone moves smoothly to each zone

#### ✅ Test 3: Arrow Key Navigation
- [ ] Make sure chat input is NOT focused (click somewhere else if needed)
- [ ] Press **Arrow Up** or **W** key
- [ ] Avatar should move **forward** (toward top of screen)
- [ ] Press **Arrow Down** or **S** key
- [ ] Avatar should move **backward** (toward bottom of screen)
- [ ] Press **Arrow Left** or **A** key
- [ ] Avatar should move **left**
- [ ] Press **Arrow Right** or **D** key
- [ ] Avatar should move **right**
- [ ] Try moving beyond boundaries - avatar should stop at floor edges (0-48ft x 0-36ft)

**Expected**:
- Arrow keys move avatar 2 units per keypress
- WASD keys work identically
- Movement is clamped to floor bounds
- Keys don't work when chat input is focused (prevents typing interference)

#### ✅ Test 4: Avatar Cleanup on Leave
- [ ] Click "Leave" button
- [ ] Avatar cone should disappear from scene
- [ ] Chat should show: "Left room"
- [ ] All zone buttons become disabled again
- [ ] Status overlay reappears

**Expected**: Clean removal of avatar when leaving room

### Zone Layout Reference

```
Floor 0 (Main Bar Area):
┌─────────────────────────────────────────────────┐
│                                                 │
│  Gaming Zone (🎮)          Card Tables (🃏)    │
│  (0,0) 16x14              (32,22) 14x12        │
│                                                 │
│                                                 │
│  Booth 1 (🛋️)  Central Bar (🍺)  Stage (🎤)    │
│  (priv, floor 1)  (16,10) 16x12  (floor 1)     │
│                                                 │
│                                                 │
│  Firepit (🔥)             Booth 2 (🛋️)         │
│  (0,22) 14x14             (priv, floor 1)      │
│                                                 │
│              Entryway (🚪)                      │
│              (20,32) 8x4                        │
└─────────────────────────────────────────────────┘
```

### Troubleshooting

**Avatar doesn't appear:**
- Check browser console for errors (F12 → Console tab)
- Verify Three.js loaded properly
- Check if scene is rendering (should see colored zones)

**Zone buttons don't work:**
- Ensure you've joined a room first
- Check that buttons are not disabled (should have border color #44ff88)

**Arrow keys don't work:**
- Make sure chat input is NOT focused (click elsewhere)
- Check browser console for preventDefault errors

**Movement seems stuck:**
- You might be at the floor boundary (0-48 x 0-36)
- Try moving in opposite direction

### Console Commands for Testing

Open browser console (F12) and try these:

```javascript
// Check if app is initialized
chatsuboApp

// Get current position
chatsuboApp.localPosition

// Check if avatar exists
chatsuboApp.localAvatar

// Manual move to specific position
chatsuboApp.moveTo(24, 0, 18)  // Move to center bar

// Check zone configuration
// (from zone module, may need to import first)
```

### Performance Metrics

Expected performance:
- **Frame rate**: 60 FPS (smooth animation)
- **Movement latency**: <50ms from keypress to avatar update
- **Zone button response**: <100ms from click to movement

### Success Criteria

All 4 MVP features should work:
- ✅ Avatar starts at entryway (cyan-green cone)
- ✅ Zone buttons show friendly zone names in chat
- ✅ Arrow keys + WASD move avatar smoothly
- ✅ Avatar cleaned up properly on leave

### Next Steps

After testing these core features, the next item to implement is:
- **Spatial audio visualization** around avatar (pending)

---

**Testing Date**: 2025-12-25
**Branch**: feature/transformers-js-integration
**Commit**: efb72b2
