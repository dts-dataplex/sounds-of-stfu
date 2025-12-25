# Bar Layout & Privacy-First Architecture Design
## Sounds of STFU - Spatial Audio Platform

**Date:** 2025-12-24
**Status:** Draft - In Progress
**Contributors:** Ann Claude, User Design Session

---

## Overview

This document captures the design for two critical aspects of the Sounds of STFU platform:

1. **Virtual Bar Layout**: A comic strip walkthrough showing how users experience spatial audio interactions
2. **Privacy-First Architecture**: PeerJS-based P2P system with in-browser SLM sentiment analysis

---

## Part 1: Comic Strip Walkthrough - User Experience

### Purpose
Illustrate the spatial audio experience through a 12-15 panel comic strip showing a user's journey through the virtual bar, demonstrating key interactions and features.

### Comic Strip Panels

#### **Panels 1-4: Bar Entry & Discovery**

**Panel 1: "The Entrance"**
- **Visual**: Alex enters the Sounds of STFU virtual bar. Bird's-eye 2D view of two-story layout.
- **Heat Map Overlay**:
  - Orange glow near gaming zone (high energy)
  - Soft blue around firepit debate area (focused conversation)
  - Purple in upstairs booths (intimate)
- **Speech bubble**: "Whoa, the heat map shows where everyone is... gaming zone is LIT!"
- **Purpose**: Introduce heat map navigation and spatial awareness

**Panel 2: "Approaching the Gaming Zone"**
- **Visual**: Alex's avatar moving toward gaming zone on floor 1
- **Audio Fade-In**: Volume gradually increases as distance decreases
- **Word Cloud**: Appears above zone showing "combo!" "nice shot!" "push mid!"
- **Audio Meter Display**: Gaming Zone 60%, Other conversations 10%
- **Thought bubble**: "I can hear them getting louder as I get closer..."
- **Purpose**: Demonstrate spatial audio distance-based volume

**Panel 3: "Overhearing the Firepit"**
- **Visual**: Alex now IN gaming zone (audio at 100%)
- **Mixing Controls**: Alex adjusts settings, sets Firepit to "Overheard" (20%)
- **Split Audio Visualization**:
  - Gaming audio: Full waveform (active conversation)
  - Firepit audio: Faint waveform with words drifting: "...consciousness..." "...emergence..."
- **Speech bubble**: "I want to hear my team, but I'm curious about that philosophy debate..."
- **Purpose**: Show audio mixing controls and multi-conversation awareness

**Panel 4: "Reading the Room"**
- **Visual**: Heat map detail view expanded
- **Information Display**:
  - Gaming zone: 6 people, topic "multiplayer FPS"
  - Firepit: 4 people, topic "AI consciousness"
  - Upstairs booth #2: 2 people, topic [🔒 private - no data]
  - Central bar: 3 people, topic "sports/weekend plans"
- **Purpose**: Demonstrate conversation discovery and privacy indicators

#### **Panels 5-8: Movement & Spatial Audio Dynamics**

**Panel 5: "Joining the Conversation"**
- **Visual**: Dotted path line from gaming zone to firepit
- **Audio Transition Visualization**:
  - Gaming audio: 100% → 60% → 20% (fading out)
  - Firepit audio: 20% → 60% → 100% (fading in)
  - Visual effect like DJ mixer crossfade
- **Speech bubble**: "The audio transitions feel so natural - like actually walking across a real room!"
- **Purpose**: Show smooth spatial audio transitions during movement

**Panel 6: "Finding a Seat at the Firepit"**
- **Visual**: Alex arrives at firepit with 4 other people
- **Spatial Audio Layout**:
  - Person A (across): Clear, centered audio
  - Person B (right): Slightly right-panned
  - Person C (far side): Slightly quieter
  - Person D (left): Slightly left-panned
- **Sentiment HUD** (only Alex sees): "🟢 Engaged discussion, low tension"
- **Dialogue**: Person A: "But if consciousness emerges from complexity, where's the threshold?"
- **Purpose**: Demonstrate spatial positioning and local SLM sentiment analysis

**Panel 7: "Going Upstairs - Private Booth"**
- **Visual**: Alex clicks stairs icon, avatar transitions to floor 2, enters Booth #3
- **Environment Change**: Slightly dimmed lighting, background conversations drop to 5%
- **Alex invites friend Sam to booth**
- **Privacy Indicator**: "🔒 Booth mode - conversations not analyzed for word cloud"
- **Dialogue**: Sam: "Finally, we can actually hear each other think..."
- **Purpose**: Show second-floor navigation and private conversation spaces

**Panel 8: "The Stage - Live Music"**
- **Visual**: Pan to second-floor stage, Digi (guitarist) setting up
- **Performance Mode**: Special indicator active
- **Audio Broadcast**: Digi's music at 40% volume to entire bar, spatially enhanced
- **Heat Map**: Musical notes icon appears at stage location
- **User Control**: Option to "mute performance" for conversation focus
- **Purpose**: Demonstrate broadcast/performance features and user control

#### **Panels 9-12: Moderation & Privacy Features**

**Panel 9: "The Heated Debate - Talking Stick Deployed"**
- **Visual**: Back at firepit, philosophical discussion getting intense
- **Word Cloud**: Warning colors indicating tension
- **Moderator Action**: Bartender avatar clicks group → "Deploy Talking Stick"
- **Visual Indicator**: Glowing staff icon above firepit group
- **Speaking Queue**:
  - Person A (has stick, 2min remaining)
  - Person B (in queue)
  - Person C (in queue)
  - Person D (in queue)
- **Dialogue**: Person A: "Okay, let me finish my point without interruption..."
- **Purpose**: Show moderation tools and talking stick feature

**Panel 10: "The Snoop - Privacy Protection"**
- **Split Panel Design**:

  **LEFT SIDE - External Attacker (Sneaky Steve):**
  - Visual: Packet sniffer tool showing encrypted WebRTC streams
  - Text overlay: "??? Encrypted P2P audio - can't decrypt"
  - Steve (frustrated): "All I see is noise!"

  **RIGHT SIDE - Inside Booth (Alex & Sam):**
  - Conversation continues normally, unaware of attack attempt
  - Privacy indicator: "🔒 E2E Encrypted - PeerJS Direct Connection"
  - Caption: "All audio goes peer-to-peer, never through a server that could eavesdrop"

- **Purpose**: Demonstrate end-to-end encryption and privacy from external threats

**Panel 11: "SLM Sentiment Analysis - The Acoustic Earmuffs"**
- **Visual**: Close-up of Alex's HUD (only they can see)
- **Local SLM Processing Firepit Conversation**:

  **Sentiment Dashboard:**
  - Overall mood: 🟡 Moderate (was heated, calming down)
  - Toxicity: Low
  - Your engagement: High
  - Suggestion: "Consider taking a break - conversation intensity high for 45min"

- **Visual Metaphor**: Cartoon "earmuffs" icon next to SLM badge
- **SLM Badge**: "Phi-3.5-mini - Running locally"
- **Caption**: "The SLM runs IN YOUR BROWSER - your sentiment analysis never leaves your device"
- **Purpose**: Show local privacy-preserving sentiment analysis

**Panel 12: "The Bartender's AI Assistant"**
- **Visual**: Bartender dashboard (moderator view only)
- **Dashboard Display**:
  - Heat map showing tension levels across zones (no specific content)
  - Alert: "⚠️ Firepit conversation: elevated intensity, talking stick active"
  - Sentiment trend (aggregate only):
    - "Gaming zone: high positive energy"
    - "Central bar: relaxed"
    - "Stage: appreciative"
- **Dialogue**: Bartender: "I can see WHERE tensions are rising, but I can't spy on WHAT people are saying - privacy by design."
- **AI Suggestion**: "Consider playing calming background music near firepit"
- **Purpose**: Show community-level moderation without privacy invasion

#### **Future Panel (To-Do)**

**Panel 0: "The Bartender Greets a Newcomer"**
- **Visual**: Bartender AI sees Alex walk in
- **Emotional Recognition**: Alex's avatar has uncertain color/aura (not familiar with current crowd)
- **Bartender Response**: Welcoming gesture, perhaps suggests starting areas based on Alex's comfort level
- **Purpose**: Demonstrate AI-assisted onboarding and emotional awareness (v2.0 feature)

---

## Part 2: Privacy-First Architecture Design

### Core Design Principles

1. **Privacy by Default**: User audio and conversation content never stored on servers
2. **Local Processing**: All sentiment analysis runs in-browser on user's device
3. **Minimal Data Sharing**: Only aggregate, anonymized sentiment shared with moderators (with user consent)
4. **Transparent Technology**: Users can see what's running locally vs. what's shared

### Architecture Decision: Pure PeerJS Mesh (MVP v1.0)

#### Selected Approach
**Pure PeerJS Mesh Network** - Direct peer-to-peer connections with no server relay for audio.

#### Rationale
- **Maximum Privacy**: Audio streams never touch a server that could intercept/store them
- **Simplicity**: Fastest path to validating core spatial audio concept
- **Philosophy Alignment**: "A community is a group of two people sharing an experience"
- **Clear Upgrade Path**: Smart zoning and SFU relay can be added in v1.1 for scaling

#### Technical Constraints
- **User Capacity**: 10 concurrent users maximum for MVP
- **Connection Math**: With N users, total connections = N(N-1)/2
  - 10 users = 45 peer connections (manageable for modern browsers)
  - Beyond 10 users = "Bar is full" graceful failure message
- **Network Requirements**: Each user needs sufficient upload bandwidth for N-1 audio streams

#### Upgrade Path to v1.1 (Documented but Not Implemented in MVP)
- **Smart Audio Zones**: Only maintain active WebRTC connections to users within hearing range
- **Signaling-Only Connections**: Low-bandwidth connections to distant users for presence/positioning
- **Estimated Capacity**: 15-20 users with zoning optimization
- **v1.1+ with SFU**: 50+ users with Selective Forwarding Unit relay (audio still encrypted end-to-end)

### WebRTC Technology Stack

#### Core Technologies
- **PeerJS**: High-level WebRTC wrapper for simplified peer connections
- **WebRTC**: Browser-native peer-to-peer audio streaming
- **STUN Server**: Public STUN servers for NAT traversal (e.g., Google's stun:stun.l.google.com:19302)
- **TURN Server**: Optional fallback for restrictive NAT environments (consider Cloudflare TURN or self-hosted coturn)

#### Audio Configuration
- **Codec**: Opus (WebRTC default, excellent quality at low bitrates)
- **Bitrate**: 32-64 kbps per audio stream (optimize for speech)
- **Sample Rate**: 48 kHz (Opus standard)
- **Channels**: Mono (stereo not needed for voice)

### In-Browser SLM Sentiment Analysis

#### Architecture: Two-Tier Sentiment Model

**Tier 1: User's Local SLM (Privacy-First)**
- **Location**: Runs entirely in user's browser via Transformers.js
- **Frequency**: Smart intervals (10-30 seconds, increases if conversation shifts detected)
- **Input**: Local audio transcription via Web Speech API (browser-native STT)
- **Processes**: User's perspective on conversations they're hearing
- **Access**: Full transcription and context (because it's the user's own browser)
- **Output**: Personal HUD showing sentiment insights
  - Overall mood (calm/engaged/tense)
  - Toxicity level
  - User's engagement level
  - Suggestions ("You've been in a heated debate for 45min, consider a break")
- **Privacy**: Never leaves the user's device, never transmitted

**Tier 2: Bartender's Aggregate AI (Community Pulse)**
- **Location**: Server-side aggregation (content-blind)
- **Data Received**: Users voluntarily share ONLY: "my current sentiment: calm/engaged/tense" (one-word enum, no context)
- **Visibility**: Aggregate statistics per zone
  - Example: "Firepit zone has 3 'tense' users out of 4 total"
  - Example: "Gaming zone: high positive energy"
- **Cannot See**: Conversation content, transcriptions, specific words, topics
- **Moderator Actions**: Throw talking stick, suggest music, send calming messages
- **Privacy Guarantee**: Zero content visibility, only sentiment patterns

#### SLM Model Selection & Performance

**Candidate Models (via Transformers.js):**

| Model | Parameters | Quantized Size | Inference Time | Notes |
|-------|------------|----------------|----------------|-------|
| Phi-3.5-mini | 3.8B | ~500MB | 200-500ms | Recommended for sentiment analysis, good accuracy |
| Llama-3.2-1B | 1B | ~800MB | 100-300ms | Faster inference, slightly lower accuracy |

**Initial Recommendation**: **Phi-3.5-mini** for MVP
- Better sentiment accuracy for nuanced conversation analysis
- Acceptable latency for 10-30 second intervals
- Model downloads once, cached for subsequent sessions

**Future Optimization (v1.1)**: Allow user selection between models based on their device capabilities

#### Sentiment Analysis Pipeline

```
[User's Browser]
1. Microphone input → Web Audio API
2. Spatial audio mixing (other users' streams combined based on distance)
3. Mixed audio → Web Speech API (STT) → Transcription
4. Transcription → Transformers.js (Phi-3.5-mini) → Sentiment analysis
5. Sentiment output → User's HUD (local display only)
6. (Optional) One-word sentiment enum → Bartender aggregate (if user consented)
```

**Performance Considerations**:
- **CPU Usage**: Moderate during analysis intervals (10-30 sec), minimal between intervals
- **Memory**: ~500MB for model (loaded once, persists in browser)
- **Battery Impact**: Smart intervals minimize drain compared to continuous processing
- **Privacy Trade-off**: Local processing costs CPU/battery, but guarantees zero server visibility

### Privacy Controls & User Consent

#### Open Question (Needs User Decision)
**Should users be able to opt-out of sharing aggregate sentiment with the bartender?**

**Option A: Required Sharing**
- Aggregate sentiment sharing required for community moderation features
- Bartender can effectively monitor community health
- Con: Privacy purists may object to any data sharing

**Option B: Optional Sharing**
- Users can opt-out of sharing even aggregate sentiment
- Maximum privacy control
- Con: Bartender has blind spots, reduced moderation effectiveness
- Con: May create two-tier community (sharers vs. non-sharers)

**Decision**: **Defer to Post-MVP User Research**
- Launch MVP without aggregate sentiment sharing requirement
- Survey communities after they've experienced the platform
- Make data-driven decision based on actual user preferences and community health outcomes
- Rationale: Cannot make informed consent/data-sharing decisions without user experience data

### Booth Privacy & Access Control System

#### Architecture: Prompt-Based Natural Language Access Control

When users enter a private booth (second-floor booths, designated private zones), they define privacy preferences via natural language prompt rather than rigid permission settings.

**User Workflow**:
1. User(s) enter private booth
2. System prompts: "Who should be able to join or listen to this conversation?"
3. User provides natural language prompt, examples:
   - "Only close friends can join, no eavesdropping"
   - "Allow bartender for emergencies, otherwise completely private"
   - "Open to anyone interested in philosophy discussions"
   - "Private for the next 30 minutes, then anyone can join"
   - "Friends and friends-of-friends welcome, strangers need to knock"

**Local Agentic Processing**:
- **Model**: Same Transformers.js + Phi-3.5-mini infrastructure used for sentiment analysis
- **Processing**: Entirely local, runs in user's browser
- **Function**: Parse natural language prompt into access rules
- **Output**: Access control policy enforced client-side

**Access Enforcement**:
- When another user attempts to join booth:
  1. Their client sends join request with user metadata (friend status, profile, etc.)
  2. Booth owner's local agent evaluates request against natural language policy
  3. Policy decision returned: Allow / Deny / Request Knock (ask for explicit permission)
- Audio routing:
  - Approved users: Full audio connection established
  - Denied users: No audio connection, booth appears "occupied - private"
  - Knock requests: Owner receives notification, can approve/deny in real-time

**Privacy Guarantees**:
- Booth privacy prompts never leave the owner's device
- Access decisions made locally, no server involvement
- Even bartender AI cannot override privacy settings (unless explicitly permitted in prompt)
- Conversation content remains E2E encrypted between booth participants

**Example Access Control Logic** (conceptual):

```javascript
// Local agent parses prompt: "Only close friends can join"
const accessPolicy = {
  allowedRelationships: ['close_friend'],
  allowBartender: false,
  knockEnabled: false
};

// When user Alice requests to join
function evaluateAccess(requester, policy) {
  if (policy.allowedRelationships.includes(requester.relationship)) {
    return 'ALLOW';
  }
  if (policy.knockEnabled) {
    return 'KNOCK'; // Owner receives notification
  }
  return 'DENY';
}
```

**Advanced Features (v2.0)**:
- Time-based privacy: "Private for 30 minutes, then open"
- Topic-based access: "Anyone interested in quantum physics can join"
- Dynamic renegotiation: "If conversation gets heated, make it private"
- Multi-party consent: All booth members must agree to new joiners

**Design Benefits**:
- **User-Friendly**: Natural language is more intuitive than permission checkboxes
- **Flexible**: Handles nuanced, context-aware privacy preferences
- **Privacy-Preserving**: All processing local, no server surveillance
- **Culturally Sensitive**: Users can express privacy norms in their own terms
- **Scalable**: Leverages existing SLM infrastructure, no new dependencies

---

## Part 3: Visual Bar Layout (Detailed Floor Plans)

### Status: NOT YET DESIGNED

This section will include:
- 2D floor plan with dimensions and zone specifications
- First floor layout (gaming zone, central bar, card tables, firepit debate area)
- Second floor layout (private booths, small stage, connection to first floor)
- Traffic flow patterns and social dynamics
- Acoustic zone definitions for spatial audio

**Next Steps**:
- Complete technical architecture questions
- Create detailed floor plans with measurements
- Define zone boundaries and audio characteristics
- Map conversation flow patterns

---

## Part 4: Technical Architecture (Continued)

### Status: DESIGN DECISIONS COMPLETE

**Resolved Design Decisions**:

#### 1. Aggregate Sentiment Sharing
**Decision**: Defer to post-MVP user research
- Launch MVP without requiring aggregate sentiment sharing
- Survey communities after experiencing the platform
- Make data-driven decision based on actual user preferences and community outcomes
- **Rationale**: Cannot make informed consent/data-sharing decisions without real user experience data

#### 2. Audio Falloff Curve
**Decision**: Wave-based falloff function (not linear multiplier)
- Implement wave function for distance-based volume attenuation
- Provides more nuanced, fluid audio processing
- Better represents real-world sound propagation physics
- **Benefits**: More natural spatial audio experience, smoother transitions
- **Technical Note**: Explore sinusoidal or exponential decay curves during implementation

#### 3. Movement & Volume Control Design
**Decision**: Distance + Manual Volume (needs UX vetting before implementation)
- **Problem**: Users shouldn't feel forced to "run away" from suddenly loud conversations (appears rude)
- **Proposed Solution**:
  - User can move to maximum distance from conversation (reduces base gain via wave falloff)
  - User can then manually adjust volume using wave-based control
  - Combination of spatial distance + manual mixing provides control without social awkwardness
- **Caution**: This UX pattern is untested and may have unforeseen usability issues
- **Required**: Vet this design during prototype phase, consider alternative approaches
- **Other Considerations**: May be impacted by group dynamics, cultural norms, accessibility needs

#### 4. Heat Map Update Frequency
**Decision**: User-configurable with multiple modes (algorithmic preference decision)
- **Three Update Modes**:
  1. **On-Demand**: User requests updates (rate-limited to X requests per Y time to prevent abuse)
  2. **Event-Triggered**: Updates triggered by spatial cues (e.g., moving between gaming zone and football zone)
  3. **Periodic Default**: Updates every 2 minutes automatically
- **Key Insight**: Heat map update frequency is an algorithmic/preference decision that varies by individual
- **User Control**: Like sentiment analysis, heat map clustering measurement may vary based on individual worldviews, values, and experiences
- **Design Principle**: Give users control over algorithmic decisions that affect their experience
- **Architecture Review**: Needs careful consideration during implementation - what other algorithmic preferences should be user-configurable?

#### 5. Booth Privacy & Access Control
**Decision**: Prompt-based access control via local agentic models
- **When entering private booth**: Party is asked to provide a natural language prompt
- **Prompt Purpose**: Defines who (if anyone) can interrupt or listen in
  - Example: "Only close friends can join, no eavesdropping"
  - Example: "Allow bartender for emergencies, otherwise private"
  - Example: "Open to anyone interested in philosophy discussions"
- **Processing**: Local agentic models (SLM-based) interpret the prompt and enforce access rules
- **Privacy-Preserving**: Access control runs locally, no server involvement
- **Flexibility**: Natural language allows nuanced, context-aware privacy preferences
- **Implementation**: Can leverage same Transformers.js + Phi-3.5-mini infrastructure used for sentiment

**Next Session Goals**:
- Design detailed floor plans with zone specifications
- Create data flow diagrams for P2P mesh architecture
- Define API contracts between components
- Prototype wave-based audio falloff curves
- Design booth privacy prompt UI/UX

---

## Appendix A: Key Insights from Design Session

### User Requirements Captured

1. **Comic Strip Format**: 12-15 panels showing user journey, more effective than static diagrams
2. **Privacy as Core Value**: Local SLM processing, E2E encryption, minimal server visibility
3. **Start Simple**: Pure P2P mesh for 10 users, not premature optimization for scaling
4. **Community Definition**: "A community is a group of two people sharing an experience"
5. **Bartender Metaphor**: AI moderator sees patterns/vibes, not content
6. **Acoustic Earmuffs**: Visual metaphor for privacy-preserving SLM analysis

### Design Philosophy

- **YAGNI**: Avoid audio zones, SFU complexity in MVP - prove core concept first
- **Privacy by Design**: Default to local processing, make data sharing opt-in and transparent
- **Natural Interactions**: Spatial audio should feel like walking through a real bar
- **Moderator Empowerment**: Give tools to manage community without surveillance
- **User Agency Over Algorithms**: Algorithmic decisions (heat map updates, sentiment analysis frequency, clustering methods) should be user-configurable, not imposed
- **Research-Driven Consent**: Defer privacy/data-sharing decisions until users can make informed choices based on actual experience
- **Physics-Inspired Design**: Use wave-based audio falloff for more natural, fluid spatial audio that mirrors real sound propagation
- **Social Comfort Priority**: Users should never feel forced into rude behaviors (like "running away" from conversations) by technical limitations
- **Local-First AI**: Agentic features (sentiment analysis, privacy access control) run locally via Transformers.js to preserve privacy

---

## Next Steps

1. **Resume Design Session**:
   - Answer outstanding architecture questions
   - Complete technical architecture section
   - Design detailed floor plans

2. **Create Visual Assets**:
   - Commission or create comic strip panels (illustration)
   - Design heat map visualization mockups
   - Create UI wireframes for HUD, controls, and dashboards

3. **Technical Validation**:
   - Prototype PeerJS mesh with 2-3 users
   - Test Transformers.js sentiment models for performance
   - Validate Web Speech API accuracy for conversation transcription

4. **Documentation**:
   - System architecture diagram
   - Data flow diagrams
   - API contracts
   - Privacy policy draft

---

## Document Status

**Current State**: Architecture design complete, ready for implementation planning
**Completion**: ~75% complete (comic strip ✅, architecture ✅, floor plans pending)
**Next Session**: Create detailed floor plans and data flow diagrams
**Last Updated**: 2025-12-24

### Completed Sections
- ✅ 12-panel comic strip walkthrough (complete narrative)
- ✅ Privacy-first P2P architecture (PeerJS mesh + E2E encryption)
- ✅ Two-tier sentiment model (local SLM + aggregate bartender)
- ✅ All 5 critical design decisions resolved
- ✅ Booth privacy with prompt-based access control

### Pending Sections
- ⏳ Detailed floor plans with dimensions
- ⏳ Data flow diagrams
- ⏳ API contracts and component interfaces
- ⏳ Wave-based audio falloff curve specifications

---

## References

- Original Design Document: `/STFU-steev.md`
- Product Requirements: `/PRODUCT_REQUIREMENTS.md`
- Feature Backlog: `/BACKLOG.md`
- Agentic Design Patterns: `/AGENTIC_DESIGN_PATTERNS.md`
