# Phase 02: Multi-Peer Audio Optimization & Performance

This phase optimizes the spatial audio engine for handling multiple simultaneous audio streams efficiently, adds acoustic zone support from the Chatsubo design, and implements audio quality monitoring.

## Tasks

- [ ] Implement audio stream pooling in SpatialAudioEngine to reuse AudioContext nodes and reduce GC pressure during peer connect/disconnect events
- [ ] Add `setAcousticZone(peerId: string, zoneId: string)` method that applies zone-specific audio parameters (reverb, absorption, occlusion) from Chatsubo floor plan specs
- [ ] Create `src/audio/ZoneAcoustics.ts` with acoustic profiles for each Chatsubo zone (Gaming Lounge, Bar, Card Tables, Firepit, Booths, Stage) using convolver nodes for reverb
- [ ] Implement inter-zone audio occlusion - reduce volume by 60% when peers are in different zones and separated by walls (use zone boundary definitions from floor plan)
- [ ] Add `maxAudiblePeers` configuration (default: 8) to limit simultaneous audio streams and automatically mute furthest peers beyond this limit
- [ ] Implement audio mixing priority system - always hear peers in same zone at full spatial volume, reduce cross-zone peers by distance
- [ ] Create `src/audio/AudioMetrics.ts` class to track latency, jitter, packet loss per peer using WebRTC stats API
- [ ] Add `getAudioQualityMetrics(): Map<string, AudioQualityMetrics>` method to SpatialAudioEngine for monitoring dashboard integration
- [ ] Implement adaptive quality adjustment - reduce audio bitrate for peers with poor network metrics (>200ms latency or >5% packet loss)
- [ ] Add spatial audio visualization overlay showing audio range circles, zone boundaries, and muted peer indicators
- [ ] Create performance benchmark test with 10+ simulated peers measuring CPU usage, memory consumption, and audio latency
- [ ] Implement audio ducking when local user speaks - reduce other peers' volume by 20% to improve speech intelligibility
- [ ] Add keyboard shortcuts for quick audio controls (M for mute all, S for solo nearest peer, Z for zone-only audio)