# Phase 03: Network Resilience & Audio Stability

This phase ensures stable audio performance under real-world network conditions, adds reconnection handling, and implements bandwidth optimization for the P2P mesh.

## Tasks

- [ ] Create `src/network/AudioNetworkMonitor.ts` to track WebRTC connection states and trigger reconnection when peer connections drop
- [ ] Implement automatic audio stream recovery when peer reconnects - restore spatial position and zone assignment from last known state
- [ ] Add `src/audio/AudioBufferManager.ts` with configurable jitter buffer (50-200ms) to smooth out network packet timing variations
- [ ] Implement adaptive bitrate control based on available bandwidth - detect congestion via WebRTC bandwidth estimation API and reduce quality gracefully
- [ ] Add connection quality indicator UI showing green/yellow/red status per peer based on latency (<100ms green, 100-200ms yellow, >200ms red)
- [ ] Create `onPeerConnectionFailed(peerId: string)` handler that attempts reconnection with exponential backoff (1s, 2s, 4s, max 16s)
- [ ] Implement graceful degradation - if spatial audio processing causes performance issues (>50ms audio latency), fall back to simpler distance calculation
- [ ] Add audio synchronization monitoring - detect if audio streams drift out of sync by >100ms and trigger re-sync
- [ ] Create `src/network/BandwidthEstimator.ts` to estimate available upload/download bandwidth and limit simultaneous audio streams accordingly
- [ ] Implement peer priority system for bandwidth allocation - prioritize same-zone peers and nearby peers over distant cross-zone peers
- [ ] Add audio codec negotiation - prefer Opus codec with appropriate bitrate for voice (24-32kbps) over default codec
- [ ] Create network diagnostics panel showing per-peer bandwidth usage, codec info, packet loss, and connection duration
- [ ] Implement automatic peer pruning when bandwidth is constrained - disconnect furthest peers first to maintain quality for nearby peers
- [ ] Add unit tests for reconnection logic, bandwidth estimation accuracy, and jitter buffer behavior under simulated packet loss