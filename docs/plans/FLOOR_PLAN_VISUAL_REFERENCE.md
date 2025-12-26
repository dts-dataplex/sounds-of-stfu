# Floor Plan Visual Reference

## Sounds of STFU - Quick Reference Diagrams

**For detailed specifications, see:** `CHATSUBO_FLOOR_PLAN_SPECIFICATIONS.md`

---

## First Floor Layout (Ground Level, Z=0)

```
                NORTH (Y=0)
                     ↑
    0ft          16ft         32ft          48ft
    ├─────────────┼─────────────┼─────────────┤
  0 ┌─────────────────────────┬───────────────┐ ──
    │                         │               │
    │   GAMING ZONE           │               │
    │   ▓▓▓▓▓▓▓▓▓▓▓           │               │
    │   [Screens] [Table]     │               │
    │   Blue-white glow       │               │
    │   3-4 users             │               │
 14 ├─────────────────────────┤  CARD TABLES  │ 14ft
    │                         │  ░░░░░░░░░    │
    │                         │  [2 Tables]   │
    │      CENTRAL BAR        │  Red neon     │
    │      ████████████        │  3-4 users    │
    │   [Bartender Station]   │               │
    │   Amber backlit         │               │
    │   Green "OPEN" neon     │               │
    │   4-5 users             │               │
 22 ├─────────────────────────┴───────────────┤ 22ft
    │                                          │
    │   FIREPIT DEBATE AREA                   │
    │   ◉◉◉◉◉ [Firepit]                       │
    │   Orange flickering glow                │
    │   Circular seating (6 chairs)           │
    │   4-5 users                              │
    │   🗣️ Talking Stick Zone                 │
 36 └──────────────────────────────────────────┘ ──
    ├─────────────┼─────────────┼─────────────┤
    0ft          16ft         32ft          48ft
                     ↓
                SOUTH (Y=36)

WEST                                           EAST
(X=0)                                         (X=48)

LEGEND:
▓▓▓ = Gaming Zone (high energy, bright blue-white)
███ = Central Bar (warm amber, social hub)
░░░ = Card Tables (intimate, focused, red neon)
◉◉◉ = Firepit (orange glow, philosophy debates)

STAIRCASE: Located at (28, 10) - East side of Central Bar
```

---

## Second Floor Layout (Z=12ft, Rendered 40% Opacity)

```
                NORTH (Y=0)
                     ↑
    0ft          16ft         32ft          48ft
    ├─────────────┼─────────────┼─────────────┤
  0 ┌─────┬───────┬───────┬─────────────────┐ ──
    │     │       │       │                 │
    │ 🔒  │  🔒   │  🔒   │                 │
    │ B1  │  B2   │  B3   │                 │
    │     │       │       │                 │
  8 ├─────┴───────┴───────┤                 │ 8ft
    │                     │                 │
    │   (Open Second      │                 │
    │    Floor Area)      │                 │
    │                     │                 │
    │                     │                 │
    │        [STAIRS]     │                 │
    │        ▓▓▓▓▓▓▓      │                 │
    │        (28,10)      │                 │
 22 │                     │                 │ 22ft
    │                     │                 │
    │                     │                 │
    │                     │   SMALL STAGE   │
    │                     │   ♪♪♪♪♪♪♪♪♪    │
    │                     │   [G] [D] [M]   │
    │                     │   Purple wash   │
    │                     │   3 performers  │
 36 └─────────────────────┴─────────────────┘ ──
    ├─────────────┼─────────────┼─────────────┤
    0ft          16ft         32ft          48ft
                     ↓
                SOUTH (Y=36)

LEGEND:
🔒 B1/B2/B3 = Private Booths (6ft × 6ft each, E2E encrypted)
▓▓▓ = Staircase (metal grating, blue neon under steps)
♪♪♪ = Small Stage (spotlight when active, purple ambient)
[G] [D] [M] = Guitar, Drums, Microphone positions

PRIVACY INDICATORS:
- Booths: Prompt-based access control (natural language)
- Stage: Public when performing, private when empty
- Open areas: Semi-private (distance creates psychological privacy)
```

---

## Isometric View (How Users See It)

```
                    SECOND FLOOR (40% opacity)
                    ┌────────────────────────────┐
                   /│ 🔒  🔒  🔒          ♪♪♪   │
                  / │ B1  B2  B3         STAGE  │
                 /  └────────────────────────────┘
                /          ▓ (Stairs)
               /          /
              /          /
    FIRST FLOOR (100% opacity)
    ┌──────────────────────────────────────┐
    │ ▓▓▓▓▓▓       ████████        ░░░░░░ │
    │ GAMING       CENTRAL          CARD   │
    │  ZONE          BAR           TABLES  │
    │                                      │
    │              [STAIRS]                │
    │                                      │
    │         ◉◉◉◉◉ FIREPIT               │
    │                                      │
    └──────────────────────────────────────┘

    Camera Angle: 45° horizontal, -30° vertical (downward tilt)
    Entire bar visible on one screen (no scrolling)
```

---

## Heat Map Overlay Example

```
    ┌──────────────────────────────────────┐
    │ 🔴🔴🔴       🟢🟢🟢        🟡🟡🟡 │  <- Activity Level
    │ GAMING       CENTRAL        CARD   │
    │  ZONE          BAR         TABLES  │
    │ 85% busy     45% busy      60% busy│
    │                                    │
    │ "combo!"     "sports"      [game]  │  <- Topic Words
    │ "nice!"      "weekend"     [focus] │
    │                                    │
    │         🔵🔵🔵 FIREPIT             │
    │         35% busy                   │
    │         "consciousness"            │
    │         "AI ethics"                │
    └──────────────────────────────────────┘

    🔴 = High energy (80-100% activity)
    🟡 = Active (60-80% activity)
    🟢 = Moderate (30-60% activity)
    🔵 = Calm (0-30% activity)
    🔒 = Private (no heat map data)
```

---

## Audio Falloff Visualization

### Gaming Zone → Central Bar Movement

```
Distance:    0ft      6ft      10ft     14ft     18ft
             │        │        │        │        │
Gaming:   ████████ ██████   ███      █         ▁
  (100%)    (100%)   (60%)   (20%)    (5%)    (<5%)

Central:     ▁       █       ███    ██████  ████████
  (0%)      (<5%)    (5%)    (20%)   (60%)   (100%)

User walks: ──────────────────────────────────────>
            [Gaming Zone]  [Transition]  [Central Bar]

Audio crossfade: 2 seconds (6ft @ 3ft/sec walking speed)
Wave function: volume = 1 / (1 + (distance / falloff_distance)^2)
```

---

## Zone-Specific Atmosphere Details

### Gaming Zone (Northwest)

```
┌─────────────────┐
│ ▓▓▓  [Screen]   │  Lighting: Blue-white LED (6000K)
│      [Screen]   │  Volume: 100% @ 0-6ft → 5% @ 14ft+
│                 │  Acoustic: Bright, reflective
│  [Gaming Table] │  Ambience: Game hum (10%)
│   💺 💺 💺 💺   │  Capacity: 3-4 users
│                 │  Energy: High (fast-paced comms)
└─────────────────┘
```

### Central Bar (Center)

```
┌─────────────────┐
│  🍺 🍺 🍺       │  Lighting: Amber backlit (3000K)
│ ─────────────   │  Volume: 100% @ 0-4ft → 10% @ 12ft+
│ BARTENDER 🤖    │  Acoustic: Balanced, absorptive
│ [Green "OPEN"]  │  Ambience: Glass clinking (5%)
│  💺 💺 💺 💺    │  Capacity: 4-5 users
│                 │  Energy: Variable (social hub)
└─────────────────┘
```

### Firepit (Southwest)

```
┌─────────────────┐
│     🪑   🪑     │  Lighting: Orange firelight (1800K)
│   🪑  🔥  🪑   │  Volume: 100% @ 0-6ft → 10% @ 14ft+
│     🪑   🪑     │  Acoustic: Reflective, resonant
│                 │  Ambience: Fire crackle (12%)
│   [Circular]    │  Capacity: 4-5 users
│   [Seating]     │  Energy: Thoughtful debates
└─────────────────┘  🗣️ Talking Stick Zone
```

### Private Booth (Second Floor)

```
┌─────────┐
│ 🔒 BOOTH│  Lighting: Dim red-orange (2200K, 25%)
│         │  Volume: 100% inside, 0% outside
│  💺  💺 │  Acoustic: Deadened, insulated
│  [Table]│  Ambience: None (silent)
│         │  Capacity: 2-3 users
│ [Curtain│  Privacy: E2E encrypted, prompt-based access
└─────────┘  Access: "Only close friends can join"
```

### Small Stage (Second Floor)

```
┌────────────────┐
│  ♪ STAGE ♪     │  Lighting: Warm spotlight (3200K, 60%)
│                │  Volume: 40% broadcast to entire bar
│  [G] [D] [M]   │  Acoustic: Bright, projected
│                │  Ambience: Performance audio
│  🎸  🥁  🎤   │  Capacity: 3 performers
│                │  Privacy: Public when active
└────────────────┘  User Control: Mute/adjust enabled
```

---

## Movement Speed & Audio Transition Guide

### Walking Speed Calibration

```
Speed: 3 feet per second (virtual movement)

Examples:
- Gaming Zone → Central Bar (6ft): 2 seconds
- Central Bar → Firepit (10ft): 3.3 seconds
- First Floor → Second Floor (stairs, 14ft): 4.7 seconds
```

### Audio Crossfade Formula

```
Crossfade duration = distance / walking_speed
Crossfade type = "smooth_wave_interpolation"

Zone A volume: fade_out(time) = 1 - (time / duration)^0.5
Zone B volume: fade_in(time) = (time / duration)^0.5

Result: Natural, smooth audio transition without abrupt cuts
```

---

## Privacy Levels by Zone

### Public Zones (Full Visibility)

```
🌍 Gaming Zone
   - Heat map: ✅ Visible activity
   - Topics: ✅ Word clouds ("combo!", "nice shot!")
   - Sentiment: ✅ Aggregate only (bartender sees "high energy")
   - Content: ❌ Never stored/analyzed on server

🌍 Central Bar
   - Heat map: ✅ Visible activity
   - Topics: ✅ Word clouds ("sports", "weekend plans")
   - Sentiment: ✅ Aggregate only
   - Content: ❌ Never stored/analyzed on server

🌍 Firepit Debate Area
   - Heat map: ✅ Visible activity
   - Topics: ✅ Word clouds ("consciousness", "AI ethics")
   - Sentiment: ✅ Aggregate only
   - Content: ❌ Never stored/analyzed on server
   - Note: Public intellectual space - debates meant to be overheard
```

### Semi-Private Zones (Limited Visibility)

```
🏠 Card Tables
   - Heat map: ✅ Visible activity
   - Topics: ⚠️ Generic only ("gaming", no specific cards)
   - Sentiment: ✅ Aggregate only
   - Content: ❌ Never stored/analyzed on server
   - Note: Games in progress signal "focused, hard to interrupt"
```

### Private Zones (No Visibility)

```
🔒 Private Booths
   - Heat map: 🔒 "Occupied - Private" indicator only
   - Topics: ❌ None (zero data collection)
   - Sentiment: ❌ None (even aggregate blocked)
   - Content: ❌ E2E encrypted, never leaves user browsers
   - Access: Prompt-based control (natural language)
   - Example: "Only close friends can join, no eavesdropping"
```

---

## Escape Route Map

### From Gaming Zone (If Overwhelming)

```
Gaming Zone (overwhelming)
     │
     ├─→ Central Bar (6ft, 2 sec) ─────→ "Grabbing a drink"
     │                                    [Natural exit]
     │
     └─→ Card Tables (8ft, 3 sec) ──────→ "Joining quieter game"
                                           [Understandable exit]
```

### From Firepit (If Debate Too Heated)

```
Firepit (heated debate)
     │
     ├─→ Central Bar (10ft, 3 sec) ─────→ "Need a drink"
     │                                     [Universal excuse]
     │
     └─→ Upstairs Booth (14ft, 5 sec) ──→ "Need privacy/call"
                                           [Clear overwhelm signal]
```

### From Central Bar (If Crowded)

```
Central Bar (crowded)
     │
     ├─→ Gaming Zone (6ft, 2 sec)
     ├─→ Card Tables (8ft, 3 sec)
     ├─→ Firepit (10ft, 3 sec)
     └─→ Upstairs Booth (14ft, 5 sec)

[Maximum flexibility - central position allows escape to any zone]
```

---

## Lighting Color Palette Reference

### Cyberpunk/Chatsubo Theme

```
Gaming Zone:     #88AAFF  █████  (Blue-white LED)
                 #AA44FF  █████  (Purple accent)

Central Bar:     #FFAA44  █████  (Amber backlit)
                 #44FF88  █████  (Green neon "OPEN")

Card Tables:     #FF4444  █████  (Red neon)
                 #FFCC88  █████  (Warm incandescent)

Firepit:         #FF6622  █████  (Orange firelight)
                 #FFAA44  █████  (Warm flicker)

Booths:          #FF4422  █████  (Red-orange, very dim)

Stage:           #FFCC66  █████  (Warm spotlight)
                 #AA44FF  █████  (Purple wash)

Darkness:        #112233  █████  (Dark blue-grey ambient)
```

---

## Implementation Phase Quick Reference

### Phase 1: Core Layout (Week 1)

- [ ] Isometric camera view (static)
- [ ] First floor zones as colored rectangles
- [ ] 2-3 test avatars
- [ ] Validate coordinate system

### Phase 2: Spatial Audio (Week 2-3)

- [ ] Wave-based falloff function
- [ ] PeerJS mesh (2 users)
- [ ] Audio crossfade during movement
- [ ] Zone-specific acoustic parameters

### Phase 3: Lighting (Week 4)

- [ ] Zone-specific lighting (colored point lights)
- [ ] Darkness gradients
- [ ] Neon effects
- [ ] Isometric rendering with lighting

### Phase 4: Second Floor (Week 5)

- [ ] Second floor rendering (40% opacity)
- [ ] Staircase transition
- [ ] Booth privacy (E2E encryption)
- [ ] Prompt-based access control

### Phase 5: Heat Map (Week 6)

- [ ] Heat map overlay
- [ ] Topic word clouds
- [ ] Avatar movement (glide)
- [ ] Final polish

---

## Quick Dimension Reference Card

```
┌─────────────────────────────────────────────────┐
│ ZONE DIMENSIONS QUICK REFERENCE                 │
├─────────────────────────────────────────────────┤
│ Total Footprint:   48ft × 36ft (1,728 sq ft)   │
│ Ceiling Heights:   12ft (floor 1), 10ft (floor 2)│
│ Max Capacity:      10 concurrent users (MVP)     │
├─────────────────────────────────────────────────┤
│ Zone               Size         Capacity         │
├─────────────────────────────────────────────────┤
│ Gaming Zone        16×14ft      3-4 users       │
│ Central Bar        16×12ft      4-5 users       │
│ Card Tables        14×12ft      3-4 users       │
│ Firepit            14×14ft      4-5 users       │
│ Booth (each)       6×6ft        2-3 users       │
│ Stage              10×8ft       3 performers    │
│ Stairs             6×8ft        1 in transition │
└─────────────────────────────────────────────────┘
```

---

## Audio Falloff Formula Reference

```javascript
// Wave-based inverse square falloff
function calculateVolume(distance, falloffDistance) {
  return 1 / (1 + Math.pow(distance / falloffDistance, 2));
}

// Examples:
calculateVolume(0, 6); // = 1.00  (100% at source)
calculateVolume(6, 6); // = 0.50  (50% at falloff distance)
calculateVolume(12, 6); // = 0.20  (20% at 2x falloff)
calculateVolume(18, 6); // = 0.10  (10% at 3x falloff)

// Zone-specific falloff distances:
const FALLOFF_DISTANCES = {
  gaming: 8.0,
  central_bar: 6.0,
  card_tables: 7.0,
  firepit: 9.0,
  booths: 0.0, // Hard cutoff (no falloff, just 0 or 100%)
  stage: null, // Broadcast mode (different formula)
};
```

---

**Document Status:** ✅ Complete Visual Reference
**Last Updated:** 2025-12-24
**Companion Document:** `CHATSUBO_FLOOR_PLAN_SPECIFICATIONS.md`
