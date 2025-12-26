# Phase 06: Audio Security & Privacy Hardening

This phase implements end-to-end encryption for audio streams, adds privacy controls, and ensures secure credential management for audio features according to project security requirements.

## Tasks

- [ ] Verify PeerJS connections use DTLS-SRTP for WebRTC media encryption - add automated test to confirm encryption is active on all audio streams
- [ ] Implement audio stream encryption key rotation - rotate DTLS keys every 24 hours without dropping connections
- [ ] Add privacy mode toggle in SpatialAudioControls - when enabled, user's position is hidden from other peers and audio is muted
- [ ] Create zone privacy settings - booth zones have "private" flag that prevents audio from leaving the zone (perfect occlusion)
- [ ] Implement audio watermarking for debugging - add imperceptible identifier to audio stream to trace issues without compromising privacy
- [ ] Add rate limiting to position updates - prevent position spam attacks by limiting updates to 10 per second per peer
- [ ] Create audio permission manager - request microphone access with clear privacy policy explanation before enabling spatial audio
- [ ] Implement secure signaling for audio negotiation - ensure SDP offers/answers are transmitted over encrypted WebSocket with authentication
- [ ] Add audio stream verification - validate that received audio streams match expected peer IDs to prevent stream injection attacks
- [ ] Create audit logging for sensitive audio operations - log when audio is muted/unmuted, zones changed, privacy mode toggled
- [ ] Implement client-side audio filtering - allow users to block specific peers' audio at spatial audio engine level
- [ ] Add configurable audio retention policy - audio never stored on server, processed only in-memory on client
- [ ] Create security scanning for audio dependencies - run npm audit on Web Audio API wrapper libraries and PeerJS
- [ ] Implement secure credential management for future server-side audio features - use VaultWarden integration pattern from security-expert ADRs
- [ ] Add privacy-preserving analytics - collect aggregate audio metrics without storing individual user data or positions
- [ ] Create security documentation for audio architecture - document encryption protocols, privacy guarantees, and threat model