# Developer Quick Start Guide
## Sounds of STFU - Chatsubo Virtual Bar

**Last Updated:** 2025-12-24
**Status:** Ready for Phase 1 Development

---

## TL;DR - Start Here

You're building a **cyberpunk virtual bar with spatial audio** where multiple conversations happen simultaneously, just like a real bar. Think Neuromancer's Chatsubo meets Discord's spatial audio.

**Core Innovation:** Wave-based audio falloff + lighting-based depth perception in a single-screen isometric view.

**Read This First:** `CHATSUBO_DESIGN_SUMMARY.md` (10 min)
**Then Reference:** `CHATSUBO_FLOOR_PLAN_SPECIFICATIONS.md` (technical details)

---

## The 5-Minute Orientation

### What You're Building

A virtual bar with **6 distinct zones** across **2 floors**:

**Floor 1:**
- Gaming Zone (blue-white LED, high energy, 3-4 users)
- Central Bar (amber glow, social hub, 4-5 users)
- Card Tables (red neon, focused, 3-4 users)
- Firepit Debate Area (orange firelight, philosophy, 4-5 users)

**Floor 2:**
- Private Booths (3 booths, 2-3 users each, E2E encrypted)
- Small Stage (guitar/drums/mic, 3 performers, broadcasts to entire bar)

**Total Capacity:** 10 concurrent users (MVP, PeerJS mesh network limitation)

### View & Rendering

**Isometric 3D View:**
- Camera: 45° horizontal, 30° downward tilt
- Second floor: 40% opacity (semi-transparent, can see through to floor 1)
- One-screen view: Entire bar visible on 1920x1080 without scrolling
- NOT a game world: Minimalist, communication-first design

### Spatial Audio (The Magic)

**Wave-Based Falloff Formula:**
```javascript
volume = 1 / (1 + Math.pow(distance / falloff_distance, 2))
```

**Zone-Specific Falloff Distances:**
- Gaming Zone: 8ft
- Central Bar: 6ft
- Card Tables: 7ft
- Firepit: 9ft
- Booths: 0ft (hard cutoff, E2E encrypted)

**Audio Crossfade:**
- Walking speed: 3 ft/sec
- Crossfade time: distance / speed
- Example: Gaming → Bar (6ft) = 2 seconds smooth fade

---

## Tech Stack

### MVP v1.0 (10 Users, Pure P2P)

**WebRTC Audio:**
- PeerJS (WebRTC wrapper for peer connections)
- Opus codec (32-64 kbps per stream)
- STUN: Google's public STUN server
- TURN: Optional fallback (Cloudflare TURN or self-hosted coturn)

**In-Browser AI:**
- Transformers.js (for local sentiment analysis)
- Phi-3.5-mini (3.8B parameters, ~500MB quantized)
- Web Speech API (browser-native STT for transcription)

**Frontend:**
- Isometric rendering: Canvas 2D or WebGL (recommend Three.js for lighting)
- Heat map: Canvas 2D overlay with Gaussian blur
- UI: Minimalist (focus on audio, not visuals)

**Backend (Minimal):**
- Signaling server: PeerJS server or custom WebSocket
- Bartender AI: Aggregate sentiment only (content-blind)
- No audio relay: Pure P2P mesh (audio never touches server)

---

## File Structure Reference

```
docs/plans/
├── CHATSUBO_DESIGN_SUMMARY.md              # Start here (stakeholder overview)
├── CHATSUBO_FLOOR_PLAN_SPECIFICATIONS.md   # Complete technical specs
├── FLOOR_PLAN_VISUAL_REFERENCE.md          # ASCII diagrams, quick lookup
├── 2025-12-24-bar-layout-and-privacy-architecture.md  # Architecture decisions
└── DEVELOPER_QUICK_START.md                # This file

Key sections in SPECIFICATIONS.md:
- Zone Coordinates (Bounding Boxes) → Line 355
- Acoustic Parameters (Per Zone) → Line 375
- Lighting Specifications (Per Zone) → Line 445
- Wave Falloff Formula → Line 350
```

---

## Phase 1: Core Layout (Week 1)

### Goal
Render the bar in isometric view with 2-3 test avatars. Validate coordinate system and zone boundaries.

### Tasks

**1. Set Up Isometric Camera**
```javascript
// Three.js example
const camera = new THREE.OrthographicCamera(
  -48, 48,  // X bounds (bar width)
  36, -36,  // Y bounds (bar depth)
  1, 1000   // Near/far planes
);
camera.position.set(40, 30, 40);  // Isometric angle
camera.lookAt(24, 0, 18);  // Center of bar
```

**2. Render First Floor Zones as Colored Rectangles**
- Gaming Zone: `#88AAFF` (blue-white), position (0, 0), size (16, 14)
- Central Bar: `#FFAA44` (amber), position (16, 10), size (16, 12)
- Card Tables: `#FF4444` (red), position (32, 22), size (14, 12)
- Firepit: `#FF6622` (orange), position (0, 22), size (14, 14)

**3. Place Test Avatars**
- Avatar A: Gaming Zone (8, 7) - center of zone
- Avatar B: Central Bar (24, 16) - bartender position
- Avatar C: Firepit (7, 29) - debate participant

**4. Validate Coordinate System**
- Confirm origin (0, 0) at northwest corner
- Verify X-axis (west to east, 0 to 48)
- Verify Y-axis (north to south, 0 to 36)
- Test bounding box collision detection

### Acceptance Criteria
- [ ] Entire bar visible on 1920x1080 screen without scrolling
- [ ] All 4 zones render with correct colors and positions
- [ ] 3 test avatars visible in different zones
- [ ] Coordinate system matches specification (origin at northwest)

---

## Phase 2: Spatial Audio (Week 2-3)

### Goal
Implement PeerJS mesh network with 2 users. Validate wave-based audio falloff as users move between zones.

### Tasks

**1. Implement Wave-Based Falloff Function**
```javascript
function calculateVolume(distance, falloffDistance) {
  return 1 / (1 + Math.pow(distance / falloffDistance, 2));
}

// Zone configurations
const ZONES = {
  gaming: { falloffDistance: 8.0, color: '#88AAFF' },
  central_bar: { falloffDistance: 6.0, color: '#FFAA44' },
  card_tables: { falloffDistance: 7.0, color: '#FF4444' },
  firepit: { falloffDistance: 9.0, color: '#FF6622' }
};

// Calculate volume for each remote user
remoteUsers.forEach(user => {
  const distance = calculateDistance(localUser.position, user.position);
  const zone = getZone(user.position);
  const volume = calculateVolume(distance, ZONES[zone].falloffDistance);
  user.audioElement.volume = volume;
});
```

**2. Set Up PeerJS Mesh**
```javascript
// Client-side peer initialization
const peer = new Peer('user-' + generateUUID(), {
  host: 'peerjs-server.example.com',
  port: 443,
  path: '/myapp',
  secure: true
});

// Connect to all existing users (mesh topology)
existingUsers.forEach(userId => {
  const conn = peer.connect(userId);
  const call = peer.call(userId, localStream);
  call.on('stream', remoteStream => {
    // Apply spatial audio to remoteStream
    const audio = new Audio();
    audio.srcObject = remoteStream;
    audio.volume = 0;  // Will be set by spatial audio calculation
    audio.play();
    remoteUsers.push({ userId, audioElement: audio, position: {x: 0, y: 0} });
  });
});
```

**3. Implement Audio Crossfade During Movement**
```javascript
// User movement handler
function moveUser(targetPosition, duration) {
  const startPosition = localUser.position;
  const startTime = Date.now();

  function updatePosition() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1.0);

    // Interpolate position
    localUser.position = {
      x: startPosition.x + (targetPosition.x - startPosition.x) * progress,
      y: startPosition.y + (targetPosition.y - startPosition.y) * progress
    };

    // Recalculate volumes for all remote users
    updateSpatialAudio();

    if (progress < 1.0) {
      requestAnimationFrame(updatePosition);
    }
  }

  updatePosition();
}

// Movement example: Gaming → Central Bar
const gamingCenter = { x: 8, y: 7 };
const barCenter = { x: 24, y: 16 };
const distance = Math.hypot(barCenter.x - gamingCenter.x, barCenter.y - gamingCenter.y);
const duration = (distance / 3) * 1000;  // 3 ft/sec walking speed
moveUser(barCenter, duration);
```

**4. Test with 2 Users**
- User A stays in Gaming Zone
- User B moves from Central Bar → Firepit
- Validate audio crossfade (smooth, no pops/clicks)
- Verify volume levels match wave falloff formula

### Acceptance Criteria
- [ ] 2 users connected via PeerJS mesh
- [ ] Audio volume adjusts based on distance (wave formula)
- [ ] Smooth crossfade during movement (no audio artifacts)
- [ ] Volume levels match expected values (test at 0ft, 6ft, 12ft)

---

## Phase 3: Lighting & Atmosphere (Week 4)

### Goal
Add zone-specific lighting with neon effects. Implement darkness gradients to create conversation boundaries.

### Tasks

**1. Add Zone-Specific Point Lights**
```javascript
// Three.js lighting example
const lights = {
  gaming: new THREE.PointLight(0x88AAFF, 0.70, 12),  // Blue-white, 70%, 12ft range
  central_bar: new THREE.PointLight(0xFFAA44, 0.50, 10),  // Amber, 50%, 10ft range
  card_tables: new THREE.PointLight(0xFF4444, 0.40, 8),  // Red, 40%, 8ft range
  firepit: new THREE.PointLight(0xFF6622, 0.30, 6)  // Orange, 30%, 6ft range (firelight)
};

lights.gaming.position.set(8, 8, 7);  // Center of gaming zone, elevated
lights.central_bar.position.set(24, 8, 16);  // Above bar
lights.card_tables.position.set(39, 8, 28);  // Above tables
lights.firepit.position.set(7, 4, 29);  // Lower, firepit level

Object.values(lights).forEach(light => scene.add(light));
```

**2. Implement Darkness Gradients**
```javascript
// Visibility range per zone (from specs)
const VISIBILITY_RANGES = {
  gaming: 12,
  central_bar: 10,
  card_tables: 8,
  firepit: 6,
  booths: 4
};

// Darkness gradient shader (GLSL)
// Apply to zone boundary areas
const darknessGradient = `
  uniform float visibilityRange;
  varying float distanceFromLight;

  void main() {
    float alpha = 1.0;
    if (distanceFromLight > visibilityRange) {
      alpha = max(0.05, 1.0 - (distanceFromLight - visibilityRange) / 2.0);
    }
    gl_FragColor = vec4(0.067, 0.133, 0.2, alpha);  // #112233 dark blue-grey
  }
`;
```

**3. Add Neon Effects**
```javascript
// Green "OPEN" neon sign at central bar
const neonMaterial = new THREE.MeshBasicMaterial({
  color: 0x44FF88,
  emissive: 0x44FF88,
  emissiveIntensity: 1.0
});
const neonSign = createTextMesh("OPEN", neonMaterial);
neonSign.position.set(24, 10, 16);  // Behind bar
scene.add(neonSign);

// Add glow effect (bloom post-processing)
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  1.5,  // Strength
  0.4,  // Radius
  0.85  // Threshold
);
composer.addPass(bloomPass);
```

**4. Test Isometric Rendering with Lighting**
- Validate lighting doesn't break isometric perspective
- Ensure darkness creates natural zone boundaries
- Test neon glow visibility from all angles

### Acceptance Criteria
- [ ] Each zone has distinct colored lighting (matches spec)
- [ ] Darkness gradients visible at zone boundaries (8-10ft)
- [ ] Green "OPEN" neon sign visible and glowing
- [ ] Chatsubo aesthetic achieved (dim, moody, cyberpunk)

---

## Phase 4: Second Floor & Stairs (Week 5)

### Goal
Render second floor at 40% opacity. Implement staircase transition with audio shift. Add booth privacy (E2E encryption).

### Tasks

**1. Render Second Floor (40% Opacity)**
```javascript
// Second floor mesh
const secondFloorMaterial = new THREE.MeshBasicMaterial({
  color: 0x223344,
  opacity: 0.40,
  transparent: true
});

// Booths (3 booths on north side)
const booths = [
  { position: { x: 5, y: 5, z: 12 }, size: { x: 6, y: 6 } },  // Booth 1
  { position: { x: 15, y: 5, z: 12 }, size: { x: 6, y: 6 } },  // Booth 2
  { position: { x: 25, y: 5, z: 12 }, size: { x: 6, y: 6 } }   // Booth 3
];

booths.forEach((booth, i) => {
  const geometry = new THREE.BoxGeometry(booth.size.x, 10, booth.size.y);
  const mesh = new THREE.Mesh(geometry, secondFloorMaterial);
  mesh.position.set(booth.position.x, booth.position.z, booth.position.y);
  scene.add(mesh);
});

// Stage (south side)
const stage = new THREE.Mesh(
  new THREE.BoxGeometry(10, 10, 8),
  secondFloorMaterial
);
stage.position.set(24, 12, 32);
scene.add(stage);
```

**2. Implement Staircase Transition**
```javascript
// Staircase trigger (east of central bar)
const stairsTrigger = { x: 31, y: 14, width: 6, height: 8 };

function checkStairsTransition(userPosition) {
  if (isInBounds(userPosition, stairsTrigger)) {
    // User is on stairs - trigger floor transition
    const targetFloor = userPosition.z === 0 ? 12 : 0;
    transitionFloors(userPosition, targetFloor);
  }
}

function transitionFloors(position, targetZ) {
  const duration = 2000;  // 2 seconds
  const startZ = position.z;
  const startTime = Date.now();

  function animateTransition() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1.0);

    // Interpolate Z position
    position.z = startZ + (targetZ - startZ) * progress;

    // Fade avatar during transition
    avatarMesh.material.opacity = 1.0 - Math.abs(0.5 - progress) * 0.4;

    // Shift audio mix from floor 1 to floor 2
    updateFloorAudioMix(progress);

    if (progress < 1.0) {
      requestAnimationFrame(animateTransition);
    }
  }

  animateTransition();
}
```

**3. Add Booth Privacy (E2E Encryption)**
```javascript
// Booth audio isolation
const BOOTH_ZONES = [
  { x1: 2, y1: 2, x2: 8, y2: 8, z: 12 },   // Booth 1
  { x1: 12, y1: 2, x2: 18, y2: 8, z: 12 }, // Booth 2
  { x1: 22, y1: 2, x2: 28, y2: 8, z: 12 }  // Booth 3
];

function updateSpatialAudio() {
  remoteUsers.forEach(user => {
    const localInBooth = isInBooth(localUser.position);
    const remoteInBooth = isInBooth(user.position);

    if (localInBooth && remoteInBooth && localInBooth === remoteInBooth) {
      // Both in same booth - full volume, E2E encrypted connection
      user.audioElement.volume = 1.0;
    } else if (localInBooth || remoteInBooth) {
      // One in booth, one outside - hard cutoff (zero audio leakage)
      user.audioElement.volume = 0.0;
    } else {
      // Neither in booth - normal spatial audio
      const distance = calculateDistance(localUser.position, user.position);
      const zone = getZone(user.position);
      user.audioElement.volume = calculateVolume(distance, ZONES[zone].falloffDistance);
    }
  });
}
```

**4. Prompt-Based Access Control (Basic Version)**
```javascript
// When user enters booth, prompt for access control
function enterBooth(boothId) {
  const prompt = window.prompt(
    "Who should be able to join or listen to this conversation?\n" +
    "Examples:\n" +
    '- "Only close friends can join, no eavesdropping"\n' +
    '- "Allow bartender for emergencies, otherwise private"\n' +
    '- "Open to anyone interested in philosophy"'
  );

  // Store prompt (will be used by local SLM in v1.1)
  boothAccessControl[boothId] = {
    owner: localUser.id,
    prompt: prompt,
    allowedUsers: []  // Populated by SLM interpretation
  };
}

// Basic keyword matching for MVP (replace with SLM in v1.1)
function canJoinBooth(boothId, requestingUserId) {
  const control = boothAccessControl[boothId];
  if (!control) return true;  // No restrictions

  if (control.prompt.includes('private') && !control.allowedUsers.includes(requestingUserId)) {
    return false;
  }
  if (control.prompt.includes('close friends') && !isFriend(requestingUserId)) {
    return false;
  }
  return true;  // Default: allow
}
```

### Acceptance Criteria
- [ ] Second floor renders at 40% opacity
- [ ] Can see through to first floor below
- [ ] Staircase transition smooth (2 seconds, audio shift)
- [ ] Booths have hard audio cutoff (0% leakage)
- [ ] Basic prompt-based access control working

---

## Phase 5: Heat Map & Polish (Week 6)

### Goal
Implement heat map overlay showing conversation activity. Add topic word clouds. Refine avatar movement. Final polish.

### Tasks

**1. Implement Heat Map Overlay**
```javascript
// Canvas 2D overlay for heat map
const heatmapCanvas = document.createElement('canvas');
heatmapCanvas.width = 1920;
heatmapCanvas.height = 1080;
heatmapCanvas.style.position = 'absolute';
heatmapCanvas.style.top = '0';
heatmapCanvas.style.left = '0';
heatmapCanvas.style.opacity = '0.75';
heatmapCanvas.style.pointerEvents = 'none';
document.body.appendChild(heatmapCanvas);

const heatmapCtx = heatmapCanvas.getContext('2d');

// Activity levels per zone (0.0 to 1.0)
const zoneActivity = {
  gaming: 0.85,       // High energy
  central_bar: 0.45,  // Moderate
  card_tables: 0.60,  // Active
  firepit: 0.35       // Calm
};

// Color mapping
function getActivityColor(activity) {
  if (activity >= 0.8) return '#FF4444';  // Red (intense)
  if (activity >= 0.6) return '#FFAA44';  // Orange (active)
  if (activity >= 0.3) return '#44FF44';  // Green (moderate)
  return '#4444FF';  // Blue (calm)
}

// Render heat map
function renderHeatMap() {
  heatmapCtx.clearRect(0, 0, heatmapCanvas.width, heatmapCanvas.height);

  Object.entries(zoneActivity).forEach(([zone, activity]) => {
    const bounds = ZONE_BOUNDS[zone];
    const color = getActivityColor(activity);

    // Draw colored rectangle
    heatmapCtx.fillStyle = color;
    heatmapCtx.globalAlpha = activity * 0.3;  // Scale opacity by activity
    heatmapCtx.fillRect(
      bounds.x1 * pixelsPerFoot,
      bounds.y1 * pixelsPerFoot,
      (bounds.x2 - bounds.x1) * pixelsPerFoot,
      (bounds.y2 - bounds.y1) * pixelsPerFoot
    );

    // Apply Gaussian blur (soft boundaries)
    heatmapCtx.filter = 'blur(8px)';
  });
}

// Update heat map every 2 minutes (configurable)
setInterval(updateActivityLevels, 120000);
```

**2. Add Topic Word Clouds**
```javascript
// Topic words per zone (from local SLM analysis)
const zoneTopics = {
  gaming: ['combo!', 'nice shot!', 'push mid!'],
  central_bar: ['sports', 'weekend plans'],
  card_tables: ['gaming', 'focus'],
  firepit: ['consciousness', 'AI ethics', 'emergence']
};

// Render word clouds above zones
function renderWordClouds() {
  Object.entries(zoneTopics).forEach(([zone, words]) => {
    const bounds = ZONE_BOUNDS[zone];
    const centerX = (bounds.x1 + bounds.x2) / 2;
    const centerY = (bounds.y1 + bounds.y2) / 2;

    words.forEach((word, i) => {
      heatmapCtx.font = '16px monospace';
      heatmapCtx.fillStyle = '#FFFFFF';
      heatmapCtx.globalAlpha = 0.6;
      heatmapCtx.fillText(
        word,
        centerX * pixelsPerFoot + (i - 1) * 60,
        centerY * pixelsPerFoot - 20
      );
    });
  });
}
```

**3. Refine Avatar Movement (Glide Animation)**
```javascript
// Smooth glide animation (no walking legs)
function glideAvatar(avatar, targetPosition, duration) {
  const startPosition = { ...avatar.position };
  const startTime = Date.now();

  function animate() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1.0);

    // Easing function (smooth start/stop)
    const eased = progress < 0.5
      ? 2 * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 2) / 2;

    avatar.position.x = startPosition.x + (targetPosition.x - startPosition.x) * eased;
    avatar.position.y = startPosition.y + (targetPosition.y - startPosition.y) * eased;

    if (progress < 1.0) {
      requestAnimationFrame(animate);
    }
  }

  animate();
}
```

**4. Final Polish**
- Add speaking indicator (pulsing glow around avatar)
- Implement AFK mode (fade avatar to 30% opacity)
- Add booth curtain visual (when booth closed)
- Refine lighting (ensure Chatsubo aesthetic)

### Acceptance Criteria
- [ ] Heat map overlay visible (color-coded activity levels)
- [ ] Topic word clouds appear above public zones
- [ ] Avatar glide animation smooth (eased movement)
- [ ] Speaking indicator visible (pulsing glow)
- [ ] Final Chatsubo polish (dim neon, worn aesthetic)

---

## Common Gotchas & Solutions

### 1. PeerJS Connection Failures

**Problem:** Peers can't connect through restrictive NATs.

**Solution:**
- Add TURN server fallback (Cloudflare TURN free tier or self-hosted coturn)
- Test with symmetric NAT simulation
- Implement connection retry with exponential backoff

### 2. Audio Pops/Clicks During Crossfade

**Problem:** Abrupt volume changes cause audio artifacts.

**Solution:**
- Use Web Audio API GainNode with ramp methods
- `gainNode.gain.exponentialRampToValueAtTime(targetVolume, audioContext.currentTime + 0.1)`
- Never set `.volume` directly - always use ramping

### 3. Isometric Perspective Distortion

**Problem:** Objects look warped or wrong size at different depths.

**Solution:**
- Use orthographic camera (not perspective)
- Keep scale consistent (no size changes based on distance)
- Only use opacity/lighting for depth cues

### 4. Heat Map Performance

**Problem:** Gaussian blur slows down rendering.

**Solution:**
- Render heat map to offscreen canvas
- Update at low frequency (2 minutes default, configurable)
- Use CSS filter instead of canvas filter for better performance
- Consider WebGL for large heat maps (v1.1+)

### 5. Second Floor Visibility

**Problem:** Second floor blocks view of first floor too much.

**Solution:**
- Set opacity to 40% (as specified)
- Use depth testing to ensure proper layering
- Allow users to toggle second floor visibility (hotkey)

---

## Testing Checklist

### Audio Quality
- [ ] No pops/clicks during volume changes
- [ ] Smooth crossfades (2-3 second transitions)
- [ ] Volume levels match wave formula (test at 0ft, 6ft, 12ft)
- [ ] No audio leakage from booths (0% volume outside)

### Visual Quality
- [ ] Entire bar visible on 1920x1080 without scrolling
- [ ] Second floor at 40% opacity (can see through)
- [ ] Lighting creates natural zone boundaries
- [ ] Chatsubo aesthetic (dim neon, cyberpunk)

### Network Performance
- [ ] 10 users connected simultaneously (45 peer connections)
- [ ] Connection establishment under 5 seconds
- [ ] Audio latency under 200ms (peer-to-peer)
- [ ] Graceful failure at 11th user ("Bar is full")

### Privacy
- [ ] Booth audio never leaves participants' browsers
- [ ] Heat map shows only aggregate data (no content)
- [ ] Local SLM runs in browser (verify no server requests)
- [ ] E2E encryption active in booths (check WebRTC stats)

---

## Performance Targets

### MVP v1.0 (10 Users)

**Network:**
- Bandwidth per user: 320-640 kbps upload (10 audio streams @ 32-64 kbps)
- Connection count: 45 peer connections (N(N-1)/2 where N=10)
- Audio latency: <200ms (peer-to-peer)

**CPU:**
- Rendering: 60 FPS on mid-range GPU (Nvidia GTX 1060 or equivalent)
- Audio mixing: <10% CPU (Web Audio API)
- Local SLM: 200-500ms inference time (10-30 second intervals)

**Memory:**
- Baseline: ~100MB (app + rendering)
- Per remote user: ~5MB (audio buffers, peer connection)
- SLM model: ~500MB (Phi-3.5-mini, loaded once, cached)
- Total: ~700MB for 10-user session

**Battery (Laptop):**
- 4-6 hours on integrated graphics (local SLM impacts battery)
- 6-8 hours without SLM sentiment analysis (user can disable)

---

## Key Code Snippets

### Zone Detection
```javascript
const ZONE_BOUNDS = {
  gaming: { x1: 0, y1: 0, x2: 16, y2: 14 },
  central_bar: { x1: 16, y1: 10, x2: 32, y2: 22 },
  card_tables: { x1: 32, y1: 22, x2: 46, y2: 34 },
  firepit: { x1: 0, y1: 22, x2: 14, y2: 36 },
  booth_1: { x1: 2, y1: 2, x2: 8, y2: 8, z: 12 },
  booth_2: { x1: 12, y1: 2, x2: 18, y2: 8, z: 12 },
  booth_3: { x1: 22, y1: 2, x2: 28, y2: 8, z: 12 },
  stage: { x1: 19, y1: 28, x2: 29, y2: 36, z: 12 }
};

function getZone(position) {
  for (const [zone, bounds] of Object.entries(ZONE_BOUNDS)) {
    if (position.z && bounds.z !== position.z) continue;  // Floor mismatch
    if (position.x >= bounds.x1 && position.x <= bounds.x2 &&
        position.y >= bounds.y1 && position.y <= bounds.y2) {
      return zone;
    }
  }
  return null;  // Outside all zones
}
```

### Distance Calculation
```javascript
function calculateDistance(pos1, pos2) {
  // 2D distance (ignore Z for audio - floor separation handled separately)
  const dx = pos2.x - pos1.x;
  const dy = pos2.y - pos1.y;
  return Math.sqrt(dx * dx + dy * dy);
}
```

### Spatial Audio Update Loop
```javascript
function updateSpatialAudio() {
  remoteUsers.forEach(user => {
    // Check booth isolation first
    const localBooth = getZone(localUser.position);
    const remoteBooth = getZone(user.position);

    if (localBooth && localBooth.startsWith('booth_') &&
        remoteBooth && remoteBooth.startsWith('booth_')) {
      // Both in booths
      if (localBooth === remoteBooth) {
        user.gainNode.gain.exponentialRampToValueAtTime(1.0, audioContext.currentTime + 0.1);
      } else {
        user.gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);
      }
    } else if ((localBooth && localBooth.startsWith('booth_')) ||
               (remoteBooth && remoteBooth.startsWith('booth_'))) {
      // One in booth, one outside - hard cutoff
      user.gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);
    } else {
      // Normal spatial audio
      const distance = calculateDistance(localUser.position, user.position);
      const zone = getZone(user.position) || 'central_bar';
      const falloffDistance = ZONES[zone].falloffDistance;
      const volume = calculateVolume(distance, falloffDistance);
      user.gainNode.gain.exponentialRampToValueAtTime(volume, audioContext.currentTime + 0.1);
    }
  });
}

// Run update loop at 60 FPS
setInterval(updateSpatialAudio, 16);  // ~60 FPS
```

---

## FAQ

**Q: Why 10 users max for MVP?**
A: PeerJS mesh topology requires N(N-1)/2 connections. At 10 users, that's 45 connections (manageable). At 20 users, it's 190 connections (browser limitations). v1.1 adds smart audio zones (15-20 users), v2.0 adds SFU relay (50+ users).

**Q: Can I use a game engine (Unity, Unreal)?**
A: Not recommended. Game engines add complexity for features we don't need (physics, 3D exploration). Stick to web stack (Three.js + PeerJS + Transformers.js) for MVP.

**Q: How do I handle users with poor upload bandwidth?**
A: Detect bandwidth constraints via WebRTC stats. Auto-reduce audio quality (32 kbps instead of 64 kbps) or suggest user move to less crowded zone (fewer active connections).

**Q: What if local SLM is too slow on low-end devices?**
A: Allow users to disable sentiment analysis (settings toggle). Performance-first: spatial audio works without SLM.

**Q: How do I test with 10 users without 10 people?**
A: Create headless bot users (silent audio, random movement). Test spatial audio calculation, heat map updates, connection limits.

**Q: Should I build mobile support in MVP?**
A: No. Focus on desktop (laptop/PC) for MVP. Mobile has bandwidth/battery constraints that complicate P2P mesh. Add mobile in v1.1 after validating core concept.

---

## Next Steps

1. **Read the design docs** (start with `CHATSUBO_DESIGN_SUMMARY.md`)
2. **Set up dev environment** (Node.js, Three.js, PeerJS)
3. **Begin Phase 1** (isometric camera, zone rendering)
4. **Join weekly sync** (coordinate with team, ask questions)
5. **Track progress** (update this doc with implementation notes)

---

## Questions? Feedback?

**Design Documents:**
- `CHATSUBO_DESIGN_SUMMARY.md` - Overview
- `CHATSUBO_FLOOR_PLAN_SPECIFICATIONS.md` - Technical specs
- `FLOOR_PLAN_VISUAL_REFERENCE.md` - ASCII diagrams
- `2025-12-24-bar-layout-and-privacy-architecture.md` - Architecture decisions

**Contact:**
- Design Team: Ann Claude (helpdesk@thisisunsafe.ai)
- Repository: `/Users/dataplex/source/sounds-of-stfu`

**Good luck, and welcome to the Chatsubo!**

---

**Document Status:** ✅ Ready for Development
**Last Updated:** 2025-12-24
**Next Review:** After Phase 1 Completion
