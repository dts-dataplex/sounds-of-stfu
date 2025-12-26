# Chatsubo Design Summary

## Sounds of STFU - Virtual Bar Layout Overview

**Date:** 2025-12-24
**Status:** Design Complete - Ready for Development
**Design Aesthetic:** Chatsubo (William Gibson's Neuromancer)

---

## At a Glance

**What is this?** A cyberpunk-inspired virtual bar where spatial audio creates natural conversation zones, allowing multiple groups to coexist without switching channels - just like a real bar.

**Inspired by:** The Chatsubo bar from William Gibson's Neuromancer - intimate, gritty, expatriate atmosphere with dim neon lighting and worn surfaces.

**Key Innovation:** Wave-based spatial audio with distance-based volume falloff creates natural conversation boundaries using lighting and darkness, all visible in a single isometric view.

---

## Design Documents

### Complete Specifications

**File:** `CHATSUBO_FLOOR_PLAN_SPECIFICATIONS.md`

- Detailed zone specifications (dimensions, coordinates, capacity)
- Acoustic parameters (falloff curves, formulas, boundary types)
- Lighting specifications (colors, intensities, visibility ranges)
- Social flow analysis (newcomer journey, movement patterns)
- Implementation-ready data structures (JSON, JavaScript examples)
- **Length:** 886 lines, comprehensive developer reference

### Visual Reference

**File:** `FLOOR_PLAN_VISUAL_REFERENCE.md`

- ASCII art floor plans (first and second floor)
- Heat map visualization examples
- Audio falloff diagrams
- Zone atmosphere details
- Quick dimension reference cards
- **Length:** 473 lines, rapid lookup guide

### Architecture Context

**File:** `2025-12-24-bar-layout-and-privacy-architecture.md`

- Technical architecture decisions (PeerJS mesh, E2E encryption)
- Privacy-first design (local SLM sentiment analysis)
- Comic strip walkthrough (12 panels showing user journey)
- Booth access control (prompt-based natural language)

---

## The Virtual Bar

### Total Capacity & Footprint

- **Footprint:** 48ft × 36ft (1,728 sq ft across two floors)
- **MVP Capacity:** 10 concurrent users (PeerJS mesh network limitation)
- **View:** Single-screen isometric 3D (no scrolling required)
- **Perspective:** 45° horizontal, 30° downward tilt, semi-transparent second floor

### Six Distinct Zones

#### First Floor (Z=0, 12ft ceilings)

**1. Gaming Zone (Northwest, 16×14ft, 3-4 users)**

- High-energy multiplayer gaming, team coordination
- Blue-white LED lighting (6000K, technical atmosphere)
- Hard audio boundary (isolated from rest of bar)
- Audio falloff: 100% @ 0-6ft → 5% @ 14ft+

**2. Central Bar (Center, 16×12ft, 4-5 users)**

- Social hub, bartender interactions, transitional space
- Amber backlit shelves, green neon "OPEN" sign (Chatsubo signature)
- Soft audio boundary (intentionally permeable)
- Audio falloff: 100% @ 0-4ft → 10% @ 12ft+

**3. Card & Gaming Tables (Southeast, 14×12ft, 3-4 users)**

- Casual gaming (cards, board games), focused small groups
- Red neon strip, focused overhead pendants (40% brightness)
- Medium audio boundary (semi-isolated for focus)
- Audio falloff: 100% @ 0-5ft → 5% @ 12ft+

**4. Firepit Debate Area (Southwest, 14×14ft, 4-5 users)**

- Deep conversations, philosophy, heated debates
- Flickering orange firelight only (1800K, most atmospheric zone)
- Soft audio boundary (ideas drift to other zones)
- Audio falloff: 100% @ 0-6ft → 10% @ 14ft+
- **Special:** Primary location for "talking stick" moderation

#### Second Floor (Z=12ft, 10ft ceilings, 40% opacity rendering)

**5. Private Booths (North side, 3 booths of 6×6ft, 2-3 users each)**

- Intimate 1-on-1 or small group conversations
- Dim red-orange lighting (2200K, 25% brightness, "coffin hotel" aesthetic)
- Hard audio boundary with E2E encryption (0% audio leakage)
- **Privacy:** Prompt-based access control using natural language
  - Example: "Only close friends can join, no eavesdropping"

**6. Small Stage (South side, 10×8ft, 3 performers)**

- Live music performances (guitar, drums, mic)
- Warm spotlight when active (3200K, 60%), purple wash when empty
- Broadcast audio mode (40% volume to entire bar)
- Users can individually mute/adjust performance volume

**Staircase Connection (East of central bar, 6×8ft)**

- Metal grating stairs (60% opacity, see-through)
- Blue neon under each step (cyberpunk accent)
- Audio mix shifts from floor 1 to floor 2 over 2 seconds

---

## Core Design Principles

### 1. Chatsubo Aesthetic (Neuromancer Inspiration)

**From Gibson's Novel:**

> "The Chatsubo was a bar for professional expatriates; you could drink there for a week and never hear two words in Japanese. Ratz was tending bar, his prosthetic arm jerking smoothly..."

**Design Elements Captured:**

- **Intimate, gritty atmosphere:** Dim neon, worn surfaces, visible cables
- **Darkness as privacy:** Shadows at 8-10ft create natural conversation boundaries
- **Bartender as anchor:** Bartender AI (our "Ratz") greets newcomers, monitors community
- **Authentic imperfection:** Scratched tables, mismatched furniture, cigarette burns (aesthetic only)
- **Technical grit:** Cables visible, metal grating stairs, prosthetic-like tech elements

### 2. Lighting-Based Depth Perception

**Philosophy:** Use lighting and darkness to create spatial boundaries, not walls.

**Visibility Ranges by Zone:**

- Gaming Zone: 12ft (bright, functional for gaming)
- Central Bar: 10ft (warm, inviting)
- Card Tables: 8ft (focused pools of light on tables)
- Firepit: 6ft (faces half-lit by firelight, bodies in shadow)
- Booths: 4ft (intimate, shadowed)
- Stage: 12ft (visible from most of second floor)

**Darkness Gradient:**

- 0-4ft from light source: Full illumination (100%)
- 4-8ft: Gradual dimming (100% → 40%)
- 8-10ft: Rapid darkness (40% → 10%)
- 10ft+: Near-total darkness (5% ambient)

### 3. Wave-Based Spatial Audio

**Formula:**

```javascript
volume = 1 / ((1 + distance / falloff_distance) ^ 2);
```

**Why Wave-Based?**

- More natural than linear multiplier (mirrors real sound propagation)
- Smooth, fluid transitions as users move
- Physics-inspired design creates intuitive experience

**Audio Crossfade During Movement:**

- Walking speed: 3 feet per second
- Crossfade duration: distance / speed
- Example: Gaming Zone → Central Bar (6ft) = 2 second smooth fade

**User Control:**

- Distance-based volume (automatic)
- Manual mixing controls (adjust individual zone volumes)
- No need to "run away" from loud conversations (social comfort priority)

### 4. Privacy vs Visibility Balance

**Public Zones (Full Visibility):**

- Gaming Zone, Central Bar, Firepit, Card Tables
- Heat map shows activity level (color-coded: blue = calm, orange = active, red = intense)
- Topic word clouds appear above zones ("combo!", "consciousness", "sports")
- Aggregate sentiment shared with bartender AI (with user consent)
- **Privacy:** Content never stored on server, only local SLM analysis

**Private Zones (No Visibility):**

- Private Booths
- Heat map shows only "🔒 Occupied - Private" indicator
- E2E encrypted audio (PeerJS direct connections)
- Prompt-based access control (natural language prompts interpreted locally)
- **Privacy:** Zero data collection, zero server visibility

### 5. Communication-First (NOT a Game World)

**What This Is:**

- Spatial audio communication platform
- Social gathering space
- Conversation-focused experience

**What This Is NOT:**

- Exploration/adventure game
- Virtual world requiring navigation
- Complex 3D environment with quests/objectives

**Design Implications:**

- One-screen view (no scrolling or map exploration)
- Minimalist avatars (geometric shapes, no walking animations)
- Focus on audio quality and mixing (visual polish secondary)
- Simple movement (point-and-click or WASD, glide animation)

---

## Social Flow & User Experience

### Newcomer Journey (First 5 Minutes)

**1. Visual Orientation (0-30 seconds)**

- Heat map overlay visible immediately
- Gaming Zone glows orange (high activity)
- Firepit glows blue (focused conversation)
- Bartender AI visible at central bar (green "OPEN" neon)
- Second floor semi-transparent above (can see booths, stage)

**2. Audio Orientation (30-60 seconds)**

- Ambient bar sounds at 20% volume (all zones mixed)
- Bartender greeting audio at 50% volume (welcoming, directional)
- User prompted: "Where would you like to start?"

**3. First Decision (1-2 minutes)**

- High energy seekers → Gaming Zone (orange heat map)
- Social butterflies → Central Bar (bartender introduces to others)
- Contemplative types → Firepit (overheard philosophy debates)
- Privacy seekers → Upstairs booths (less common for newcomers)

**4. Settling In (2-5 minutes)**

- Audio mix adjusts as user approaches chosen zone
- Spatial positioning within zone (find a "seat")
- Existing group acknowledges newcomer
- User begins participating in conversation

### Movement Patterns Between Zones

**High-Traffic Routes:**

- Gaming Zone ↔ Central Bar (6ft, 2 seconds) - Most common
- Central Bar ↔ Firepit (10ft, 3 seconds) - Common
- First Floor ↔ Upstairs Booths (14ft, 5 seconds) - Medium traffic

**Audio Transition Examples:**

Gaming Zone → Central Bar (6ft, 2 sec):

```
Gaming audio: 100% → 60% → 20% (fading out)
Bar audio:     20% → 60% → 100% (fading in)
```

Firepit → Upstairs Booth (14ft, 5 sec):

```
Firepit audio: 100% → 60% → 20% → 5% (floor change)
Booth audio:     0% →  0% →  0% → 100% (enter booth)
```

### Escape Routes from High-Energy Zones

**Design Philosophy:** Users should never feel forced into socially awkward "running away" from conversations.

**Escape Options:**

1. **Move to maximum distance** (wave falloff reduces volume naturally)
2. **Manual volume adjustment** (user mixes down that conversation)
3. **AFK mode** (mute all, visual fade - "stepping outside")
4. **Move to adjacent zone** (natural, socially acceptable exit)

**Example - Gaming Zone Overwhelming:**

- Escape Route 1: East to Central Bar (6ft, 2 sec) - "Grabbing a drink"
- Escape Route 2: South to Card Tables (8ft, 3 sec) - "Joining quieter game"

**Example - Firepit Debate Too Heated:**

- Escape Route 1: North to Central Bar (10ft, 3 sec) - "Need a drink"
- Escape Route 2: Upstairs to Booth (14ft, 5 sec) - "Need privacy/call"

---

## Technical Architecture Highlights

### PeerJS Mesh Network (MVP v1.0)

- Pure peer-to-peer audio connections (no server relay)
- Maximum privacy (audio never touches a server)
- MVP capacity: 10 concurrent users
- Connection math: N(N-1)/2 = 45 peer connections @ 10 users
- Upgrade path: Smart audio zones (v1.1), SFU relay (v2.0)

### In-Browser SLM Sentiment Analysis

- Runs locally via Transformers.js (Phi-3.5-mini model)
- User's perspective only (analyzes what they hear)
- Privacy: Never leaves user's device, never transmitted
- Output: Personal HUD (mood, toxicity, engagement level)
- Optional: User can share one-word sentiment enum with bartender

### Booth Privacy (Prompt-Based Access Control)

- Natural language prompts interpreted by local SLM
- Example: "Only close friends can join, no eavesdropping"
- Access decisions made locally, no server involvement
- E2E encrypted audio between booth participants
- Knock system for "Request to join" scenarios

---

## Implementation Roadmap

### Phase 1: Core Layout (Week 1)

- Isometric camera view (static)
- First floor zones as colored rectangles
- 2-3 test avatars
- Validate coordinate system

### Phase 2: Spatial Audio (Week 2-3)

- Wave-based falloff function
- PeerJS mesh with 2 users
- Audio crossfade during movement
- Zone-specific acoustic parameters

### Phase 3: Lighting & Atmosphere (Week 4)

- Zone-specific lighting (colored point lights)
- Darkness gradients (visibility ranges)
- Neon effects (green "OPEN", purple gaming strip)
- Isometric rendering with lighting

### Phase 4: Second Floor & Stairs (Week 5)

- Second floor rendering (40% opacity)
- Staircase transition (audio + visual)
- Booth privacy (E2E encryption, hard audio cutoff)
- Prompt-based access control (basic version)

### Phase 5: Heat Map & Polish (Week 6)

- Heat map overlay (activity visualization)
- Topic word clouds for public zones
- Avatar movement refinement (glide animation)
- Final lighting polish (Chatsubo aesthetic)

---

## Design Validation Checklist

**✅ All Requirements from User Captured:**

- Chatsubo/Neuromancer cyberpunk aesthetic
- Isometric 3D view with semi-transparent second floor
- Lighting-based depth (darkness at 8-10ft)
- Wave-based spatial audio
- Communication-first (not a game world)
- One-screen view (no scrolling)
- All zones from original vision (gaming, bar, card tables, firepit, booths, stage)

**✅ Implementation-Ready:**

- Complete zone coordinates (X, Y, Z bounding boxes)
- Acoustic parameters (falloff curves, formulas)
- Lighting specifications (colors, intensities, ranges)
- Social flow analysis (movement patterns, escape routes)
- Data structures for developers (JSON examples)

**✅ Privacy-First Architecture:**

- E2E encrypted booth audio (PeerJS direct connections)
- Local SLM sentiment analysis (never leaves browser)
- Prompt-based access control (natural language)
- Zero content storage on servers
- User control over data sharing (opt-in aggregate sentiment)

**✅ Social Comfort Design:**

- Multiple escape routes from every zone
- Distance + manual volume control (no forced "running away")
- Natural conversation boundaries (lighting, audio falloff)
- Clear privacy indicators (🔒 for booths)
- Bartender AI for newcomer onboarding

---

## Key Design Insights

### 1. Darkness as Privacy

Instead of building walls, we use lighting gradients to create psychological boundaries. Conversations 8-10ft away dissolve into darkness, creating natural privacy without hard partitions.

### 2. Wave Physics Create Natural Feel

Linear volume multipliers feel artificial. Wave-based inverse-square falloff mirrors real sound propagation, making transitions feel intuitive and natural.

### 3. One Screen = No Exploration Friction

Unlike virtual worlds that require navigation, our single-screen isometric view lets users see the entire bar at once. You orient by looking, not by wandering.

### 4. Local-First AI Preserves Privacy

Running sentiment analysis in the user's browser means zero server visibility into conversation content. Users get AI insights without sacrificing privacy.

### 5. Prompt-Based Control = Cultural Sensitivity

Natural language access prompts let users express privacy preferences in their own terms, handling nuanced cultural norms better than rigid checkboxes.

---

## Gibson's Vision Realized

**Original Neuromancer Description:**

> "At a table near the door, three Wage Police sat in their dark, turtlenecked uniforms. The man beside Case was reading a hardcopy of the latest Yomiuri, his head bobbing to a twitchy rhythm as he scanned the columns of print."

**Our Design Translation:**

- Multiple conversations coexist (Wage Police, reader, Case)
- Different energy levels (reading = quiet, police = tense)
- Spatial proximity creates natural groupings (near door, separate tables)
- Darkness and lighting define zones (firelight, screen glow, dim neon)
- Authentic, imperfect atmosphere (worn surfaces, visible tech)

**Gibson's Aesthetic Applied:**

- Dim neon lighting (green "OPEN", purple gaming strip, red booths)
- Worn surfaces (scratched tables, patched stools, graffiti on booth walls)
- Visible technology (cables everywhere, metal grating, screen glow)
- Intimate scale (gritty dive bar, not corporate megaclub)
- Darkness as feature (shadows at 8-10ft, "coffin hotel" booths)

---

## Next Steps

### For Developers

1. Read `CHATSUBO_FLOOR_PLAN_SPECIFICATIONS.md` for complete technical specs
2. Reference `FLOOR_PLAN_VISUAL_REFERENCE.md` for quick lookups
3. Review `2025-12-24-bar-layout-and-privacy-architecture.md` for architecture context
4. Begin Phase 1: Core Layout (isometric camera, zone rendering)

### For Stakeholders

- Design is complete and ready for development
- All zones specified with implementation-ready parameters
- Privacy-first architecture ensures user trust
- Chatsubo aesthetic creates unique, memorable atmosphere
- MVP capacity (10 users) validates core concept before scaling

### For Community

- User testing planned after Phase 5 completion
- Feedback sessions will validate social flow design
- Privacy controls will be refined based on user preferences
- Aggregate sentiment sharing decision deferred to post-MVP research

---

## Document References

- **Detailed Specifications:** `CHATSUBO_FLOOR_PLAN_SPECIFICATIONS.md` (886 lines)
- **Visual Reference:** `FLOOR_PLAN_VISUAL_REFERENCE.md` (473 lines)
- **Architecture Design:** `2025-12-24-bar-layout-and-privacy-architecture.md`
- **Original Vision:** `/STFU-steev.md`
- **Product Requirements:** `/PRODUCT_REQUIREMENTS.md`
- **Feature Backlog:** `/BACKLOG.md`

---

**Design Status:** ✅ Complete - Ready for Development Handoff
**Last Updated:** 2025-12-24
**Design Team:** Ann Claude, User Design Session
**Next Milestone:** Phase 1 Prototype Completion (Week 1)
