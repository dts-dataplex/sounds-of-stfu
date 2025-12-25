# Chatsubo Floor Plan Specifications
## Sounds of STFU - Virtual Bar Layout Design

**Date:** 2025-12-24
**Status:** Complete - Ready for Implementation
**Design Aesthetic:** Chatsubo (Neuromancer) - Cyberpunk expatriate bar
**View:** Isometric 3D with slight downward angle, semi-transparent second floor

---

## Executive Summary

This document provides implementation-ready specifications for the Sounds of STFU virtual bar layout, inspired by William Gibson's Chatsubo bar from Neuromancer. The design prioritizes intimate, conversation-focused zones within a single-screen isometric view, using lighting-based depth perception and wave-based spatial audio to create natural social boundaries without requiring navigation or scrolling.

**Key Design Principles:**
- **Intimacy over scale**: Gritty, close-quarters atmosphere like a real dive bar
- **Lighting as boundaries**: Darkness at 8-10ft creates natural conversation zones
- **One-screen experience**: No scrolling or exploration - see the whole bar at once
- **Communication-first**: NOT a game world - focused on spatial audio conversation
- **Cyberpunk aesthetic**: Dim neon, worn surfaces, hidden corners, expat vibe

---

## Overall Dimensions & Capacity

### Floor Plan Footprint
- **Total Width**: 48 feet (east-west)
- **Total Depth**: 36 feet (north-south)
- **First Floor Height**: 12 feet ceiling
- **Second Floor Height**: 10 feet ceiling (lower, more intimate)
- **Total Floor Area**: 1,728 sq ft (both floors)

### Capacity Constraints
- **MVP Maximum**: 10 concurrent users (PeerJS mesh limitation)
- **Distributed Capacity**: See zone specifications below
- **"Bar is Full" Threshold**: Graceful failure at 11th user

### Isometric View Configuration
- **Camera Angle**: 30-degree downward tilt from horizontal
- **Perspective**: Isometric projection (no vanishing point distortion)
- **Second Floor Rendering**: 40% opacity (semi-transparent)
- **Viewable Area**: Entire bar visible without scrolling on 1920x1080 display

---

## First Floor Layout

### Zone 1: Gaming Zone (Northwest Corner)

**Purpose**: High-energy multiplayer gaming, spectating, team coordination

**Physical Specifications:**
- **Position**: Northwest corner (0, 0) origin point
- **Dimensions**: 16ft × 14ft (224 sq ft)
- **Ceiling Height**: 12ft
- **Capacity**: 3-4 users

**Spatial Audio Configuration:**
- **Audio Boundary Type**: Hard boundary (gaming area isolated from rest of bar)
- **Falloff Distance**:
  - 0-6ft: 100% volume (full engagement)
  - 6-10ft: 60% volume (transition zone)
  - 10-14ft: 20% volume (overhearing range)
  - 14ft+: 5% volume (barely audible, filtered)
- **Acoustic Character**: Bright, reflective (fast-paced communication prioritized)
- **Background Noise**: Low hum of game audio (10% ambient)

**Lighting & Atmosphere:**
- **Primary Lighting**: Blue-white LED glow from screens (cold, technical)
- **Secondary Lighting**: Purple neon strip under gaming table
- **Light Level**: Medium-bright (70% brightness) - functional for gaming
- **Color Temperature**: 6000K (cool white) - energetic, alert
- **Visibility Range**: 12ft before darkness consumes conversation

**Furniture & Layout:**
- 1 large gaming table (8ft × 4ft) with 4 stools
- Screens/monitors facing inward (creates acoustic cup)
- Cable management visible (cyberpunk aesthetic: wires everywhere)
- Worn vinyl stools, patched with duct tape

**Social Dynamics:**
- **Entry Point**: Easy to spot from entrance (orange heat map glow)
- **Newcomer Friendliness**: Medium - gaming sessions can be intense, hard to interrupt
- **Conversation Rhythm**: Fast, punctuated, coordinated (team comms)
- **Escape Routes**: East to central bar (6ft), south to card tables (8ft)

---

### Zone 2: Central Bar (Center of First Floor)

**Purpose**: Social hub, bartender interactions, drink service, transitional space

**Physical Specifications:**
- **Position**: Center of first floor (16, 10) coordinate
- **Dimensions**: 16ft × 12ft (192 sq ft) - bar counter is 12ft long
- **Ceiling Height**: 12ft
- **Capacity**: 4-5 users

**Spatial Audio Configuration:**
- **Audio Boundary Type**: Soft boundary (intentionally permeable)
- **Falloff Distance**:
  - 0-4ft: 100% volume (intimate conversation at bar)
  - 4-8ft: 70% volume (can overhear adjacent zones)
  - 8-12ft: 30% volume (ambient awareness)
  - 12ft+: 10% volume (barely audible)
- **Acoustic Character**: Balanced, absorptive (wood bar surface dampens echo)
- **Background Noise**: Ambient bar sounds - glass clinking (5%), distant laughter

**Lighting & Atmosphere:**
- **Primary Lighting**: Amber backlit shelves behind bar (warm, inviting)
- **Secondary Lighting**: Dim overhead pendants (40% brightness)
- **Accent Lighting**: Green neon "OPEN" sign (Chatsubo signature)
- **Light Level**: Medium (50% brightness) - conversational, not blinding
- **Color Temperature**: 3000K (warm amber) - welcoming, relaxed
- **Visibility Range**: 10ft before shadows deepen

**Furniture & Layout:**
- Rectangular bar counter (12ft × 3ft) with bartender station inside
- 6 bar stools (worn leather, mismatched)
- Back bar shelving (liquor bottles, neon underglow)
- Sticky spots on bar surface (authenticity detail)

**Social Dynamics:**
- **Entry Point**: First stop for newcomers (bartender AI greets here)
- **Newcomer Friendliness**: High - bartender facilitates introductions
- **Conversation Rhythm**: Variable - casual small talk to serious one-on-ones
- **Escape Routes**: All zones accessible within 6-10ft
- **Special Role**: Bartender AI "reads the room" from this vantage point

---

### Zone 3: Card & Gaming Tables (Southeast Corner)

**Purpose**: Casual gaming (cards, board games), focused small group conversations

**Physical Specifications:**
- **Position**: Southeast corner (32, 22)
- **Dimensions**: 14ft × 12ft (168 sq ft)
- **Ceiling Height**: 12ft
- **Capacity**: 3-4 users

**Spatial Audio Configuration:**
- **Audio Boundary Type**: Medium boundary (semi-isolated for focus)
- **Falloff Distance**:
  - 0-5ft: 100% volume (table conversation)
  - 5-8ft: 50% volume (transition zone)
  - 8-12ft: 15% volume (overhearing only)
  - 12ft+: 5% volume (nearly inaudible)
- **Acoustic Character**: Intimate, damped (felt table surfaces absorb sound)
- **Background Noise**: Shuffling cards, dice rolling (8% ambient)

**Lighting & Atmosphere:**
- **Primary Lighting**: Single overhead pendant per table (focused pool of light)
- **Secondary Lighting**: Red neon strip along wall (dim, moody)
- **Light Level**: Low-medium (40% brightness) - focused on table surface
- **Color Temperature**: 2700K (warm incandescent) - intimate, focused
- **Visibility Range**: 8ft - darkness beyond the table creates privacy bubble
- **Chatsubo Detail**: Light pools like islands in darkness (Gibson's vision)

**Furniture & Layout:**
- 2 round tables (4ft diameter each) with green felt surfaces
- 4 mismatched chairs per table (wooden, vinyl, metal - eclectic)
- Card deck storage in table drawer
- Worn felt, cigarette burns (aesthetic detail, no actual smoking)

**Social Dynamics:**
- **Entry Point**: Quiet alternative to gaming zone energy
- **Newcomer Friendliness**: Medium-low - games in progress are hard to join
- **Conversation Rhythm**: Turn-based, thoughtful pauses (game-paced)
- **Escape Routes**: North to central bar (8ft), west to firepit (10ft)

---

### Zone 4: Firepit Debate Area (Southwest Corner)

**Purpose**: Deep conversations, philosophy, heated debates, talking stick zone

**Physical Specifications:**
- **Position**: Southwest corner (0, 22)
- **Dimensions**: 14ft × 14ft (196 sq ft)
- **Ceiling Height**: 12ft
- **Capacity**: 4-5 users

**Spatial Audio Configuration:**
- **Audio Boundary Type**: Soft boundary (ideas should drift to other zones)
- **Falloff Distance**:
  - 0-6ft: 100% volume (full debate engagement)
  - 6-10ft: 60% volume (overhearing encouraged - philosophical osmosis)
  - 10-14ft: 25% volume (interesting fragments drift past)
  - 14ft+: 10% volume (ambient murmur)
- **Acoustic Character**: Reflective, resonant (ideas echo, persist)
- **Background Noise**: Crackling firepit ambience (12% volume, warm crackle)

**Lighting & Atmosphere:**
- **Primary Lighting**: Flickering orange firepit glow (animated, dynamic)
- **Secondary Lighting**: None - firelight only (most atmospheric zone)
- **Light Level**: Low (30% brightness) - firelit faces, shadowed bodies
- **Color Temperature**: 1800K (warm orange-red firelight) - primal, intimate
- **Visibility Range**: 6ft - beyond that, faces dissolve into shadow
- **Chatsubo Detail**: "Faces half-lit by the glow" (Gibson aesthetic)

**Furniture & Layout:**
- Circular seating arrangement around central firepit (virtual flames)
- 6 low chairs (worn armchairs, mismatched fabric)
- Firepit center (2ft diameter, animated flame effect)
- Wood floor (dark, scuffed planks visible in firelight)

**Social Dynamics:**
- **Entry Point**: For serious conversations, escaping high energy zones
- **Newcomer Friendliness**: Variable - depends on debate intensity
- **Conversation Rhythm**: Slow, thoughtful, turn-taking (talking stick enforced here)
- **Talking Stick Zone**: Primary location for moderation feature deployment
- **Escape Routes**: North to central bar (10ft), east to card tables (10ft)
- **Privacy Level**: Low - debates meant to be overheard (public intellectual space)

---

## Second Floor Layout

### Staircase Connection

**Purpose**: Vertical transition between floors, visual focal point

**Physical Specifications:**
- **Position**: East side of central bar (28, 10)
- **Dimensions**: 6ft × 8ft footprint, 12ft vertical rise
- **Material**: Metal grating stairs (industrial, see-through)
- **Capacity**: 1 user in transition at a time

**Visual Design:**
- **Transparency**: 60% opacity - can see through to floor below
- **Lighting**: Blue neon under each step (cyberpunk accent)
- **Sound**: Metallic clanging footsteps (atmospheric audio cue)
- **Isometric View**: Stairs render as diagonal ascent, semi-transparent

**Social Dynamics:**
- **Transition Audio**: User's audio mix shifts from floor 1 to floor 2 over 2 seconds
- **Visual Cue**: Avatar fades slightly during transition (depth indication)

---

### Zone 5: Private Booths (Second Floor, North Side)

**Purpose**: Intimate conversations, 1-on-1 or small groups, privacy-first spaces

**Physical Specifications:**
- **Position**: North side of second floor (scattered along north wall)
- **Dimensions**: 3 booths, each 6ft × 6ft (36 sq ft per booth)
- **Ceiling Height**: 10ft (lower than first floor - more intimate)
- **Capacity**: 2-3 users per booth (6-9 total for all booths)

**Spatial Audio Configuration:**
- **Audio Boundary Type**: Hard boundary with prompt-based access control
- **Falloff Distance**:
  - Inside booth: 100% volume (private conversation)
  - Outside booth: 0% volume (E2E encrypted audio, no leakage)
  - Exception: User can set booth to "semi-private" for 20% leakage to floor 1
- **Acoustic Character**: Deadened, insulated (felt-lined booth walls)
- **Background Noise**: None - absolute quiet (privacy priority)

**Lighting & Atmosphere:**
- **Primary Lighting**: Single dim overhead lamp per booth (20% brightness)
- **Secondary Lighting**: Soft red neon strip along booth edge
- **Light Level**: Very low (25% brightness) - intimate, shadowed
- **Color Temperature**: 2200K (warm red-orange) - romantic/conspiratorial
- **Visibility Range**: 4ft - beyond the booth, darkness
- **Chatsubo Detail**: "Coffin hotel" aesthetic - cramped, private capsules

**Furniture & Layout:**
- Each booth: Worn vinyl bench seats (L-shaped or facing)
- Small table (2ft × 2ft) with scratched surface
- Curtain option (user can "close" booth for full visual privacy)
- Graffiti on walls (user-submitted text - v2.0 feature)

**Social Dynamics:**
- **Entry Point**: For users seeking privacy, escaping main floor energy
- **Newcomer Friendliness**: Low - booths signal "occupied, private"
- **Conversation Rhythm**: Uninterrupted, intimate (no talking stick needed)
- **Privacy Controls**: Natural language prompt defines access (see ADR)
  - Example: "Only close friends can join, no eavesdropping"
- **Escape Routes**: Stairs down to first floor (8ft from booth exit)
- **Privacy Indicator**: 🔒 icon visible on heat map when booth is occupied

---

### Zone 6: Small Stage (Second Floor, South Side)

**Purpose**: Live music performances (guitar, drums, mic), atmosphere setting

**Physical Specifications:**
- **Position**: South side of second floor, center (24, 28)
- **Dimensions**: 10ft × 8ft (80 sq ft)
- **Ceiling Height**: 10ft
- **Capacity**: 3 performers maximum (guitarist, drummer, vocalist)

**Spatial Audio Configuration:**
- **Audio Boundary Type**: Broadcast mode (special audio routing)
- **Falloff Distance**:
  - Performance mode: 40% volume to entire bar (both floors)
  - Spatial enhancement: Users closer to stage hear 60-80% volume
  - User control: Individual mute/adjust performance volume
- **Acoustic Character**: Bright, projected (music designed to fill space)
- **Background Noise**: Performance becomes background for all zones

**Lighting & Atmosphere:**
- **Primary Lighting**: Single warm spotlight (60% brightness) when active
- **Secondary Lighting**: Purple stage wash (ambient glow when inactive)
- **Light Level**: Variable - bright during performance, dim when empty
- **Color Temperature**: 3200K (warm stage light) - performance spotlight
- **Visibility Range**: 12ft - stage is visible from most of second floor
- **Chatsubo Detail**: "Solace in somber pickups and hooks" (user's vision)

**Furniture & Layout:**
- Small riser platform (8in elevation above floor)
- 3 positions marked: guitar, snare drum, microphone
- Cables visible (cyberpunk aesthetic - wires snake across floor)
- Worn wood stage floor, dark stain

**Social Dynamics:**
- **Entry Point**: For performers, occasional intimate sets
- **Newcomer Friendliness**: Low - stage is for scheduled performances
- **Performance Mode**: User activates "perform" mode, audio broadcast begins
- **Audience Interaction**: Users can "applaud" (visual reaction, no audio spam)
- **Escape Routes**: NA - performers stay on stage during set
- **Aesthetic Role**: "When the souls of the members meet the sorrows they sowed" (user quote)

---

## Social Flow Analysis

### Newcomer Journey (First 5 Minutes)

**Entry Point: The Entrance**
1. **Visual Orientation** (0-30 seconds):
   - Heat map overlay visible immediately (orange gaming zone, blue firepit)
   - Bartender AI avatar visible at central bar (green "OPEN" neon)
   - Second floor semi-transparent above - can see private booths, stage

2. **Audio Orientation** (30-60 seconds):
   - Ambient bar sounds at 20% volume (all zones mixed)
   - Bartender greeting audio at 50% volume (welcoming, directional)
   - User prompted: "Where would you like to start?"

3. **First Decision** (1-2 minutes):
   - **High energy**: Move toward gaming zone (heat map orange glow)
   - **Social**: Approach central bar (bartender introduces to others)
   - **Contemplative**: Head to firepit (blue glow, overheard philosophy)
   - **Private**: Go upstairs to booth (less common for newcomers)

4. **Settling In** (2-5 minutes):
   - Audio mix adjusts as user approaches chosen zone
   - Spatial positioning within zone (user finds "seat")
   - Conversation integration - existing group acknowledges newcomer

**Bartender AI Role in Onboarding:**
- Detects newcomer (first-time visitor flag)
- Provides brief audio tutorial: "Move closer to hear better, mix volumes here"
- Suggests starting zone based on current activity levels
- Offers to introduce newcomer to friendly regular (bot or real user)

---

### Movement Patterns Between Zones

**High-Traffic Routes:**
1. **Gaming Zone ↔ Central Bar**: Most common (6ft distance)
   - Purpose: Drink refills, quick social check-ins
   - Audio transition: Fast (1 second crossfade)

2. **Central Bar ↔ Firepit**: Common (10ft distance)
   - Purpose: Philosophical tangent from casual conversation
   - Audio transition: Medium (2 second crossfade)

3. **First Floor ↔ Upstairs Booths**: Medium traffic
   - Purpose: Seeking privacy, 1-on-1 conversation
   - Audio transition: Slow (3 second fade, floor change)

4. **Firepit ↔ Card Tables**: Low traffic
   - Purpose: Decompressing from heated debate
   - Audio transition: Medium (2 second crossfade)

**Movement Speed & Distance Calibration:**
- **Walking Speed**: 3 feet per second (virtual movement)
- **Audio Crossfade**: 1 second per 6 feet traveled (smooth transition)
- **Visual Movement**: Avatar glides (no walking animation - minimalist)

**Distance-Based Volume Formula (Wave Function):**
```
volume = 1 / (1 + (distance / falloff_distance)^2)

Where:
- distance = feet from user to sound source
- falloff_distance = zone-specific constant (6-10ft typical)
- result = 0.0 to 1.0 (multiply by base volume)
```

---

### Privacy vs Visibility Balance

**Public Zones (High Visibility):**
- Gaming Zone: Fully public, activity visible on heat map
- Central Bar: Public, bartender AI monitors aggregate sentiment
- Card Tables: Semi-public, games in progress visible
- Firepit: Public intellectual space, debates meant to be overheard

**Semi-Private Zones (Medium Visibility):**
- Second Floor General Area: Visible but distance creates psychological privacy
- Stage: Public when active, private when empty

**Private Zones (Low Visibility):**
- Booths: 🔒 indicator on heat map, content never visible
- Booth access: Prompt-based control (see ADR - natural language)
- Privacy guarantee: E2E encrypted audio, local SLM only, no server visibility

**Heat Map Privacy Design:**
- **Public zones**: Topic word clouds visible ("combo!" "nice shot!" "consciousness")
- **Private booths**: Generic label only ("🔒 private - no data")
- **User control**: Can opt-out of topic contribution to word cloud (local setting)

---

### Escape Routes from High-Energy Zones

**Scenario 1: Gaming Zone Overwhelming**
- **Escape Route 1**: East to central bar (6ft, 2 seconds)
  - Audio: Gaming 100% → 60% → 20%, Bar 20% → 60% → 100%
  - Social: "Grabbing a drink" is natural, non-confrontational exit
- **Escape Route 2**: South to card tables (8ft, 3 seconds)
  - Audio: Gaming 100% → 50% → 15%, Cards 15% → 50% → 100%
  - Social: Joining a quieter game is understandable exit

**Scenario 2: Firepit Debate Too Heated**
- **Escape Route 1**: North to central bar (10ft, 3 seconds)
  - Audio: Firepit 100% → 60% → 30% → 10%, Bar 10% → 30% → 60% → 100%
  - Social: "Need a drink" is universal escape justification
- **Escape Route 2**: Upstairs to booth (stairs 8ft + climb, 5 seconds)
  - Audio: Firepit 100% → 60% → 20% → 5% (floor change mutes debate)
  - Social: "Taking a call" or "need privacy" - clear signal of overwhelm

**Scenario 3: Central Bar Too Crowded**
- **Escape Route 1**: Any direction within 6-10ft to adjacent zones
  - User has maximum flexibility from central position
- **Escape Route 2**: Upstairs to booth (fastest privacy access)
  - Audio: Bar 100% → background ambience 20% (booth isolation)

**Design Principle: No "Running Away" Required**
- User can move to maximum spatial distance from conversation (wave falloff)
- User can manually adjust volume using mixing controls
- Combination of distance + manual control = social comfort without rudeness
- Alternative: User can "step outside" (mute all, visual fade - "AFK mode")

---

## Implementation-Ready Specifications

### Coordinate System & Positioning

**Origin Point**: Northwest corner of first floor (0, 0)
**Coordinate Units**: Feet (ft)
**Axis Convention**:
- X-axis: West to East (0 to 48)
- Y-axis: North to South (0 to 36)
- Z-axis: Floor elevation (0 = first floor, 12 = second floor)

**Zone Coordinates (Bounding Boxes):**

| Zone | X1 | Y1 | X2 | Y2 | Z (floor) |
|------|----|----|----|----|-----------|
| Gaming Zone | 0 | 0 | 16 | 14 | 0 |
| Central Bar | 16 | 10 | 32 | 22 | 0 |
| Card Tables | 32 | 22 | 46 | 34 | 0 |
| Firepit | 0 | 22 | 14 | 36 | 0 |
| Stairs | 28 | 10 | 34 | 18 | 0-12 |
| Booth 1 | 2 | 2 | 8 | 8 | 12 |
| Booth 2 | 12 | 2 | 18 | 8 | 12 |
| Booth 3 | 22 | 2 | 28 | 8 | 12 |
| Stage | 19 | 28 | 29 | 36 | 12 |

---

### Acoustic Parameters (Per Zone)

**Gaming Zone:**
```javascript
{
  zone_id: "gaming",
  falloff_function: "wave_inverse_square",
  falloff_distance: 8.0,  // feet
  max_volume: 1.0,
  min_volume: 0.05,
  acoustic_character: "bright_reflective",
  boundary_type: "hard",
  background_ambience: "game_hum_10pct"
}
```

**Central Bar:**
```javascript
{
  zone_id: "central_bar",
  falloff_function: "wave_inverse_square",
  falloff_distance: 6.0,
  max_volume: 1.0,
  min_volume: 0.10,
  acoustic_character: "balanced_absorptive",
  boundary_type: "soft",
  background_ambience: "bar_ambient_5pct"
}
```

**Card Tables:**
```javascript
{
  zone_id: "card_tables",
  falloff_function: "wave_inverse_square",
  falloff_distance: 7.0,
  max_volume: 1.0,
  min_volume: 0.05,
  acoustic_character: "intimate_damped",
  boundary_type: "medium",
  background_ambience: "cards_shuffle_8pct"
}
```

**Firepit:**
```javascript
{
  zone_id: "firepit",
  falloff_function: "wave_inverse_square",
  falloff_distance: 9.0,
  max_volume: 1.0,
  min_volume: 0.10,
  acoustic_character: "reflective_resonant",
  boundary_type: "soft",
  background_ambience: "fire_crackle_12pct"
}
```

**Private Booths:**
```javascript
{
  zone_id: "booth_1", // booth_2, booth_3
  falloff_function: "hard_cutoff",
  falloff_distance: 0.0,  // No leakage
  max_volume: 1.0,
  min_volume: 0.0,
  acoustic_character: "deadened_insulated",
  boundary_type: "encrypted_hard",
  background_ambience: "none",
  privacy_mode: true,
  access_control: "prompt_based"
}
```

**Stage (Performance Mode):**
```javascript
{
  zone_id: "stage",
  falloff_function: "broadcast_spatial_enhanced",
  falloff_distance: null,  // Broadcast to all
  base_volume: 0.40,  // 40% to entire bar
  proximity_bonus: 0.40,  // +40% if within 10ft
  max_volume: 0.80,
  min_volume: 0.40,
  acoustic_character: "bright_projected",
  boundary_type: "broadcast",
  user_control: "mute_adjust_enabled"
}
```

---

### Lighting Specifications (Per Zone)

**Lighting Data Structure:**
```javascript
{
  zone_id: "gaming",
  primary_light: {
    type: "point_light",
    color: "#88AAFF",  // Blue-white
    intensity: 0.70,
    position: [8, 7, 8],  // X, Y, Z in feet
    range: 12,  // feet
    falloff: "inverse_square"
  },
  secondary_light: {
    type: "neon_strip",
    color: "#AA44FF",  // Purple
    intensity: 0.40,
    position: [8, 7, 2],  // Under table
    range: 8,
    falloff: "linear"
  },
  ambient_color: "#223344",  // Dark blue-grey
  color_temperature: 6000,  // Kelvin
  visibility_range: 12,  // feet - darkness beyond
  atmosphere: "energetic_technical"
}
```

**Color Palette (Cyberpunk/Chatsubo Theme):**
- Gaming Zone: `#88AAFF` (blue-white), `#AA44FF` (purple accent)
- Central Bar: `#FFAA44` (amber), `#44FF88` (green neon "OPEN")
- Card Tables: `#FF4444` (red neon), `#FFCC88` (warm incandescent)
- Firepit: `#FF6622` (orange firelight), `#FFAA44` (warm flicker)
- Booths: `#FF4422` (red-orange), very low intensity
- Stage: `#FFCC66` (warm spotlight), `#AA44FF` (purple wash)

**Darkness Gradient:**
- 0-4ft from light source: Full illumination (100%)
- 4-8ft: Gradual dimming (100% → 40%)
- 8-10ft: Rapid darkness (40% → 10%)
- 10ft+: Near-total darkness (5% ambient)

---

### Visual Perspective Parameters

**Isometric Camera Configuration:**
```javascript
{
  projection_type: "isometric",
  camera_angle: {
    horizontal: 45,  // degrees (diagonal view)
    vertical: -30    // degrees (downward tilt)
  },
  camera_distance: 80,  // feet from center of bar
  field_of_view: 60,   // degrees (wide enough for full bar)
  viewport_resolution: {
    width: 1920,
    height: 1080,
    aspect_ratio: "16:9"
  },
  second_floor_opacity: 0.40,  // 40% opacity (semi-transparent)
  depth_indicators: [
    "lighting_gradients",
    "floor_opacity",
    "size_scaling_subtle"  // Minimal - isometric keeps scale consistent
  ],
  no_scroll_required: true  // Entire bar visible at once
}
```

**Rendering Layers (Back to Front):**
1. First floor background (dark floor texture)
2. First floor furniture (tables, chairs, bar)
3. First floor avatars (users)
4. First floor lighting effects (glow, neon)
5. Staircase (60% opacity)
6. Second floor background (40% opacity)
7. Second floor furniture (40% opacity)
8. Second floor avatars (40% opacity unless in booth - then 100%)
9. Second floor lighting (40% opacity, blended)
10. Heat map overlay (75% opacity, toggleable)

---

### Heat Map Visualization Parameters

**Heat Map Data Structure:**
```javascript
{
  zone_id: "gaming",
  activity_level: 0.85,  // 0.0 to 1.0 (85% = high energy)
  color_mapping: {
    0.0-0.3: "#4444FF",  // Blue (calm)
    0.3-0.6: "#44FF44",  // Green (moderate)
    0.6-0.8: "#FFAA44",  // Orange (active)
    0.8-1.0: "#FF4444"   // Red (intense)
  },
  user_count: 3,
  topic_words: ["combo", "nice shot", "push mid"],  // If public zone
  sentiment_aggregate: "high_positive_energy",  // Bartender view only
  privacy_indicator: false  // True if booth/private
}
```

**Heat Map Rendering:**
- Overlay layer at 75% opacity
- Gaussian blur radius: 8ft (soft boundaries between zones)
- Update frequency: User-configurable (on-demand, event-triggered, 2min periodic)
- Topic word clouds: Appear above zone at 60% opacity, fade after 10 seconds

---

### User Avatar Specifications

**Avatar Representation:**
- **Visual Style**: Minimalist geometric shape (circle or simple silhouette)
- **Size**: 2ft diameter (consistent across both floors)
- **Color**: User-selected accent color (default: white)
- **Opacity**: 100% on same floor as camera, 40% on second floor
- **Movement**: Glide animation (no walking legs - cyberpunk simplicity)

**Avatar States:**
- **Speaking**: Pulsing glow effect around avatar
- **Listening**: Subtle ambient glow
- **AFK**: Faded to 30% opacity, greyed out
- **In Private Booth**: 100% opacity, curtain icon if booth closed

**Spatial Audio Indicator:**
- Concentric circles emanate from speaking avatar (visualize sound waves)
- Circle radius = current audio falloff distance
- Circle opacity decreases with distance (visual volume representation)

---

## Architectural Review Checklist

### Design Constraints Validation

**✅ Chatsubo/Neuromancer Aesthetic:**
- Gritty, intimate expatriate bar atmosphere
- Dim lighting, neon accents (green "OPEN", purple/blue/red strips)
- Worn surfaces, visible cables, cyberpunk clutter
- "Coffin hotel" booths, darkness as privacy

**✅ Isometric 3D View:**
- 30-degree downward angle from horizontal
- Isometric projection (no vanishing point distortion)
- Entire bar visible on 1920x1080 without scrolling

**✅ Semi-Transparent Second Floor:**
- 40% opacity for second floor elements
- Can see through to first floor below
- Depth indicated by lighting and layering

**✅ Lighting-Based Depth:**
- Darkness at 8-10ft creates natural boundaries
- Zone-specific lighting (firepit orange, gaming blue-white)
- Visibility range per zone enforces conversation bubbles

**✅ Communication-First Design:**
- NOT a game world - no exploration mechanics
- Focused on spatial audio conversation zones
- One-screen view (no scrolling or navigation feel)

**✅ Wave-Based Spatial Audio:**
- Wave inverse-square falloff function specified
- Distance-based volume attenuation per zone
- Smooth crossfades during movement

**✅ Zones from Requirements:**
- Floor 1: Gaming zone ✅, Central bar ✅, Card tables ✅, Firepit ✅
- Floor 2: Private booths ✅, Small stage ✅

---

### Implementation Readiness

**✅ Dimensions & Coordinates:**
- All zones have bounding box coordinates (X1, Y1, X2, Y2, Z)
- Origin point defined (0, 0) at northwest corner
- Units standardized (feet)

**✅ Capacity Specifications:**
- Per-zone capacity defined (2-5 users per zone)
- Total capacity: 10 users (PeerJS mesh constraint)
- "Bar is full" graceful failure at 11th user

**✅ Audio Parameters:**
- Falloff distance per zone (6-10ft typical)
- Wave-based falloff function formula provided
- Acoustic character definitions (bright, damped, resonant, etc.)
- Background ambience types and volumes

**✅ Lighting Specifications:**
- Color codes (hex) for all lighting sources
- Intensity values (0.0 to 1.0)
- Color temperatures (Kelvin)
- Visibility ranges (darkness boundaries)

**✅ Visual Rendering:**
- Camera configuration (isometric, 45° horizontal, -30° vertical)
- Layer ordering (back to front)
- Opacity values for second floor (40%)
- Heat map visualization parameters

---

### Social Flow Validation

**✅ Newcomer Orientation:**
- Clear entry point (central bar, bartender greeting)
- Heat map provides visual navigation cues
- First 5 minutes journey documented

**✅ Movement Patterns:**
- High-traffic routes identified (gaming ↔ bar, bar ↔ firepit)
- Audio transition times specified (1-3 seconds based on distance)
- Walking speed calibrated (3 ft/sec)

**✅ Privacy vs Visibility:**
- Public zones: Heat map visible, topic word clouds
- Private zones: 🔒 indicator, E2E encrypted, no content leakage
- Prompt-based booth access control (natural language)

**✅ Escape Routes:**
- Multiple escape options from each high-energy zone
- Social comfort priority (no "running away" required)
- Distance + manual volume control combination

---

## Next Steps for Developers

### Phase 1: Prototype Core Layout (Week 1)
1. Implement isometric camera view (static for MVP)
2. Render first floor zones as colored rectangles
3. Place 2-3 test avatars in different zones
4. Validate coordinate system and bounding boxes

### Phase 2: Spatial Audio Integration (Week 2-3)
1. Implement wave-based falloff function
2. Test PeerJS mesh with 2 users in different zones
3. Validate audio crossfade during movement
4. Add zone-specific acoustic parameters

### Phase 3: Lighting & Atmosphere (Week 4)
1. Add zone-specific lighting (colored point lights)
2. Implement darkness gradients (visibility range)
3. Add neon effects (green "OPEN", purple gaming strip)
4. Test isometric rendering with lighting

### Phase 4: Second Floor & Stairs (Week 5)
1. Render second floor at 40% opacity
2. Implement staircase transition (audio + visual)
3. Add booth privacy (E2E encryption, hard audio cutoff)
4. Test prompt-based access control (basic version)

### Phase 5: Heat Map & Polish (Week 6)
1. Implement heat map overlay (activity visualization)
2. Add topic word clouds for public zones
3. Refine avatar movement (glide animation)
4. Final lighting polish (Chatsubo aesthetic)

---

## Appendix: Design Inspiration from Neuromancer

### Chatsubo Bar - Gibson's Description

> "The Chatsubo was a bar for professional expatriates; you could drink there for a week and never hear two words in Japanese. Ratz was tending bar, his prosthetic arm jerking smoothly as he filled a tray of glasses with draft Kirin. He saw Case and smiled, his teeth a webwork of East European steel and brown decay."

**Design Elements Captured:**
- **Expatriate atmosphere**: Diverse, international crowd (user diversity)
- **Intimate, worn**: Dark corners, sticky surfaces, imperfect aesthetics
- **Bartender as anchor**: Ratz = our Bartender AI (welcoming, observant)
- **Technical grit**: Prosthetic arm = visible tech (cables, neon, screens)

> "At a table near the door, three Wage Police sat in their dark, turtlenecked uniforms. The man beside Case was reading a hardcopy of the latest Yomiuri, his head bobbing to a twitchy rhythm as he scanned the columns of print."

**Design Elements Captured:**
- **Multiple conversations**: Wage Police, reader, Case - all coexisting
- **Different energy levels**: Reading (quiet) vs police (tense) vs Case (story focus)
- **Spatial proximity**: Near door, separate tables - distance creates privacy

> "The bartender's smile widened. His ugliness was the stuff of legend. In an age of affordable beauty, there was something heraldic about his lack of it."

**Design Elements Captured:**
- **Authenticity over polish**: Worn, imperfect, real (no sanitized corporate aesthetic)
- **Character in imperfection**: Scratched surfaces, mismatched furniture, graffiti

---

## Conclusion

This floor plan design provides implementation-ready specifications for the Sounds of STFU virtual bar, capturing the intimate, gritty atmosphere of Gibson's Chatsubo while prioritizing spatial audio communication. The design balances privacy (booths, E2E encryption) with community (heat map, overlapping conversations), using lighting and wave-based audio falloff to create natural social boundaries within a single-screen isometric view.

**Key Achievements:**
- ✅ Complete zone specifications (dimensions, coordinates, capacity)
- ✅ Acoustic parameters (falloff curves, boundary types, ambient sounds)
- ✅ Lighting specifications (colors, intensities, visibility ranges)
- ✅ Social flow analysis (newcomer journey, movement patterns, escape routes)
- ✅ Implementation-ready data structures (JSON examples, formulas)
- ✅ Chatsubo aesthetic captured (dim neon, worn surfaces, intimate darkness)

**Developer Handoff:** All specifications are ready for implementation. Proceed with Phase 1 (prototype core layout) and validate against these parameters.

---

**Document Status:** ✅ Complete - Ready for Implementation
**Last Updated:** 2025-12-24
**Next Review:** After Phase 1 prototype validation
