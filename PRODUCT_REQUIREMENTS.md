# Product Requirements Document
## Sounds of STFU - Spatial Social Audio Platform

**Version:** 0.1
**Date:** 2025-12-23
**Status:** Draft

---

## 1. Executive Summary

Sounds of STFU is a spatial audio communication platform that recreates the natural social dynamics of a physical bar or gathering space in digital form. Unlike existing platforms (Discord, Zoom, etc.) that compartmentalize conversations into separate rooms, this platform allows multiple conversations to coexist in shared virtual space with audio that naturally fades based on proximity.

### Vision Statement
Enable digital social experiences that mirror the richness of physical spaces, where users can naturally move between conversations, overhear interesting discussions, and create organic social connections without artificial barriers.

---

## 2. Problem Statement

### Current Pain Points
1. **Forced Compartmentalization**: Discord/Slack force users into discrete channels, requiring conscious decisions to join/leave conversations
2. **Loss of Ambient Awareness**: Cannot sense the energy/mood of other groups happening simultaneously
3. **Social Friction**: Moving between conversations feels disruptive and rude
4. **Missing Spatial Context**: No way to "sit in the back corner for a quiet chat" while still feeling connected to the larger group
5. **Poor Moderation Tools**: All-or-nothing muting doesn't support nuanced conversation management

### User Impact
- Socially isolated individuals miss opportunities for organic connection
- Communities fragment into silos rather than forming cohesive social spaces
- Vulnerable users must choose between isolation and overwhelming group participation
- Rich, multi-layered social experiences are reduced to linear, single-channel interactions

---

## 3. User Personas

### 3.1 The Regular (Primary)
- **Profile**: Frequent participant who values the community atmosphere
- **Goals**: Maintain awareness of community activity, move fluidly between conversations
- **Pain Points**: Misses interesting discussions happening in other channels, feels disconnected when in private rooms

### 3.2 The Gamer
- **Profile**: Plays multiplayer games with teammates while in voice chat
- **Goals**: Coordinate with team without disturbing others, hear celebrations without drowning out callouts
- **Pain Points**: Game audio + voice chat management is clunky, can't cheer without disrupting serious conversations

### 3.3 The Deep Thinker
- **Profile**: Seeks meaningful philosophical/intellectual discussions
- **Goals**: Have focused conversations while still sensing the ambient energy of the bar
- **Pain Points**: Needs quiet space but doesn't want complete isolation from community

### 3.4 The Social Butterfly
- **Profile**: Moves between different groups, connecting people and topics
- **Goals**: Monitor multiple conversations, seamlessly transition between groups
- **Pain Points**: Current platforms make rapid context-switching awkward and obvious

### 3.5 The Moderator/Bartender
- **Profile**: Community manager who sets the tone and manages conflicts
- **Goals**: Monitor overall vibe, intervene when needed, create welcoming atmosphere
- **Pain Points**: Can't sense emerging tensions across multiple channels, intervention feels heavy-handed

### 3.6 The Quiet Observer
- **Profile**: Lurker who enjoys presence without active participation
- **Goals**: Feel part of the community, learn by listening, participate when comfortable
- **Pain Points**: Binary join/leave makes passive observation feel awkward

---

## 4. Core Features

### 4.1 Spatial Audio Engine (P0 - Critical)
**Description**: Audio volume and clarity based on virtual distance between users

**Requirements**:
- Users have positions in 2D virtual space
- Audio volume decreases with distance (configurable falloff curve)
- Support for 50+ simultaneous speakers with low latency (<150ms)
- Occlusion/directional audio for enhanced realism (future)

**Success Criteria**:
- Users can intuitively identify which conversations are "near" vs "far"
- Natural conversation flow without technical audio issues
- Seamless transitions as users move through space

---

### 4.2 Visual Heat Map (P0 - Critical)
**Description**: Real-time visualization of conversation activity across the space

**Requirements**:
- Color-coded areas showing conversation intensity
- Update in near real-time (<2s delay)
- Visual indication of conversation topics (word clouds)
- User-controllable overlay (can be toggled on/off)

**Success Criteria**:
- Users can identify active conversation areas at a glance
- Newcomers can find groups discussing topics of interest
- Word clouds accurately represent ongoing discussion themes

---

### 4.3 Movement & Positioning (P0 - Critical)
**Description**: Users can move their position in the virtual space

**Requirements**:
- Simple click/drag or WASD movement controls
- Smooth position updates to other users (no teleporting)
- Persistence of position when reconnecting (within session)
- "Warp to" functionality for quick navigation

**Success Criteria**:
- Movement feels natural and responsive
- No audio glitches during movement
- Users can easily navigate to desired conversation areas

---

### 4.4 Audio Mixing Controls (P0 - Critical)
**Description**: Per-group or per-area audio level controls

**Requirements**:
- Three modes per group: Off, Overheard (20% volume), Audible (100% volume)
- Visual indicators showing current audio settings
- Quick toggle keyboard shortcuts
- "Focus mode" that mutes everything except current conversation

**Success Criteria**:
- Users can manage multiple conversations without cognitive overload
- Quick adjustment without disrupting their own conversation
- Clear feedback on current audio configuration

---

### 4.5 Talking Stick Moderation (P1 - Important)
**Description**: Token-based speaking queue for managing heated discussions

**Requirements**:
- Moderators can "throw" talking stick to a group
- Only holder can speak (or limited number of holders)
- Automatic rotation with cooldown period
- Visual indicator of who has the stick and queue order
- Emergency override for moderators

**Success Criteria**:
- Reduces talking over each other in debates
- Feels natural, not overly restrictive
- Moderators can de-escalate conflicts smoothly

---

### 4.6 Virtual Environment (P1 - Important)
**Description**: 2D representation of the "bar" with themed zones

**Requirements**:
- Two-story layout with distinct areas:
  - Gaming zone (first floor)
  - Central bar (first floor)
  - Card/game tables (first floor)
  - Firepit/debate area (first floor)
  - Private booths (second floor)
  - Small stage for musicians (second floor)
- Semantic meaning to areas (affects default audio settings, visuals)
- Customizable layouts for different community themes

**Success Criteria**:
- Users intuitively understand space navigation
- Areas have distinct character that enhances experience
- Layout supports natural social flow

---

### 4.7 Presence Indicators (P1 - Important)
**Description**: Visual representation of who is where

**Requirements**:
- Avatar or icon for each user
- Status indicators (speaking, listening, AFK, gaming, etc.)
- Profile hover cards with user info
- Group clustering visualization

**Success Criteria**:
- Easy to identify friends and interesting people
- Clear indication of user engagement level
- Doesn't clutter the interface

---

### 4.8 Conversation History/Replay (P2 - Nice to Have)
**Description**: Ability to review missed conversations

**Requirements**:
- Opt-in recording of conversations
- Playback with original spatial audio
- Transcript generation
- Privacy controls (who can record/access)

**Success Criteria**:
- Users can catch up on missed discussions
- Privacy concerns adequately addressed
- Storage/bandwidth requirements manageable

---

## 5. MVP Scope

### Must Have (MVP v1.0)
1. Spatial audio engine with basic distance-based volume
2. Simple 2D visual representation of space
3. User movement (click to move)
4. Heat map showing conversation activity
5. Basic audio mixing controls (mute specific areas)
6. Single-room layout (the main bar floor)
7. Text chat overlay for accessibility
8. 10-20 concurrent user capacity

### Should Have (v1.1)
9. Talking stick moderation tool
10. Word cloud topic visualization
11. Two-story layout with distinct zones
12. Enhanced movement controls (WASD, teleport)
13. 50+ concurrent user capacity
14. Custom user avatars/profiles

### Could Have (v2.0+)
15. Conversation history/replay
16. Directional/occluded audio
17. Multiple themed environments
18. Mobile app support
19. Integration with existing platforms (Discord bot)
20. AI-powered conversation summaries
21. Breakout rooms with seamless transitions
22. Virtual "objects" (jukebox, dartboard, etc.)

---

## 6. Technical Requirements

### 6.1 Performance
- Audio latency: <150ms end-to-end
- Visual updates: 30 FPS minimum
- Movement latency: <100ms
- Support 50+ concurrent users (MVP: 20)
- 99.9% uptime for core services

### 6.2 Security & Privacy
- End-to-end encryption for audio streams
- User data privacy compliance (GDPR, CCPA)
- Opt-in recording/logging
- Secure authentication
- Abuse prevention and moderation tools

### 6.3 Compatibility
- Web-based (Chrome, Firefox, Safari, Edge)
- Desktop apps (Windows, macOS, Linux) - future
- Mobile responsive design (MVP: desktop only)
- Accessibility: screen reader support, keyboard navigation, visual captions

### 6.4 Scalability
- Horizontal scaling for increased load
- Geographic distribution for low latency
- Efficient audio codec (Opus recommended)
- CDN for static assets

---

## 7. User Stories

### Epic 1: Spatial Audio Experience
- **US-101**: As a user, I can hear other users' voices at volumes that decrease with distance, so that I can naturally focus on nearby conversations
- **US-102**: As a user, I can move my position in the virtual space, so that I can join different conversation groups
- **US-103**: As a user, I can see a visual representation of where others are positioned, so that I can navigate to interesting groups

### Epic 2: Conversation Discovery
- **US-201**: As a user, I can view a heat map of conversation activity, so that I can find active discussions
- **US-202**: As a user, I can see word clouds of conversation topics, so that I can identify discussions of interest without interrupting
- **US-203**: As a newcomer, I can quickly identify where my friends are located, so that I can join them easily

### Epic 3: Audio Control & Management
- **US-301**: As a user, I can adjust the volume of different conversation groups independently, so that I can manage audio complexity
- **US-302**: As a gamer, I can set my group to "active" and others to "overheard", so that I can coordinate gameplay without missing bar celebrations
- **US-303**: As a user, I can mute distant conversations entirely, so that I can focus on my current discussion

### Epic 4: Moderation & Community Management
- **US-401**: As a moderator, I can activate talking stick mode for a group, so that I can manage heated debates constructively
- **US-402**: As a moderator, I can view an overview of all active conversations, so that I can monitor community health
- **US-403**: As a moderator, I can move disruptive users to a quiet area, so that I can handle conflicts without banning

### Epic 5: Social Comfort & Accessibility
- **US-501**: As an observer, I can position myself at the edge of conversations, so that I can listen without pressure to participate
- **US-502**: As a hearing-impaired user, I can view live captions of conversations I'm near, so that I can participate fully
- **US-503**: As a user seeking quiet conversation, I can move to the second-floor booths, so that I have privacy while staying connected to the community

---

## 8. Success Metrics

### Primary KPIs
1. **User Engagement**: Average session duration >45 minutes
2. **Conversation Diversity**: Users participate in 3+ different conversation groups per session
3. **Retention**: 60% of users return within 7 days
4. **Friction Reduction**: <10 seconds to join a new conversation (vs. Discord channel switching)

### Secondary Metrics
5. **Technical Performance**: <150ms audio latency for 95% of users
6. **User Satisfaction**: NPS score >40
7. **Social Health**: <5% of sessions require moderator intervention
8. **Accessibility**: 20% of users utilize audio mixing features actively

### Qualitative Goals
- Users report feeling "more connected" than on traditional platforms
- Lurkers report comfort in passive participation
- Moderators report easier community management
- Users describe the experience as "natural" or "like a real bar"

---

## 9. Open Questions & Risks

### Open Questions
1. What's the ideal audio falloff curve for natural conversation distance?
2. Should we build on existing platforms (Discord bot) or standalone?
3. How do we handle users with poor network connections?
4. What's the right balance between realism and usability?
5. How do we prevent abuse of spatial positioning (stalking, harassment)?

### Risks
1. **Technical**: Spatial audio at scale is technically complex and may have unforeseen challenges
2. **Adoption**: Users may prefer familiar Discord-style channels despite limitations
3. **Moderation**: Open spatial audio may create new moderation challenges
4. **Privacy**: Users may be uncomfortable with position tracking and conversation monitoring
5. **Accessibility**: Spatial audio concepts may be difficult for screen reader users

---

## 10. Next Steps

1. **Validate MVP scope** with potential users and stakeholders
2. **Technical spike**: Research spatial audio libraries (Web Audio API, Janus, Agora, Dolby.io)
3. **Architecture definition**: System design, data flow, technology stack
4. **Prototype**: Build minimal proof-of-concept with 2-3 users
5. **User testing**: Validate core spatial audio concept before full build
6. **Backlog refinement**: Break user stories into development tasks

---

## Appendix A: References

- Original design document: `STFU-steev.md`
- Spatial audio research: TBD
- Competitive analysis: TBD
- Technical architecture: TBD
