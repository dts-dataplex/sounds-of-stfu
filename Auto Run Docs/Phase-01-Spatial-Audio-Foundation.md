# Phase 01: Spatial Audio Foundation & Working Prototype

This phase establishes the core spatial audio engine with distance-based volume mixing. By the end of this phase, you will have a working prototype where users can move avatars in a 2D space and hear each other's audio volume change based on distance. This demonstrates the core "bar experience" concept with real spatial audio.

## Tasks

- [x] Create `src/audio/SpatialAudioEngine.ts` class with Web Audio API initialization, AudioContext setup, and gain node management for each peer connection
      **Note:** Implemented as `SpatialAudioEngine.js` (project uses JavaScript, not TypeScript). Includes full Web Audio API integration with AudioContext, gain nodes per peer, spatial positioning, master volume control, and comprehensive test coverage (28 tests, all passing). Distance and volume calculations already existed in `spatial-falloff.js` and have been integrated.
- [x] Implement `calculateDistance(pos1: {x: number, y: number}, pos2: {x: number, y: number}): number` utility function using Euclidean distance formula
      **Note:** Already implemented in `src/audio/spatial-falloff.js` as `calculateDistance()` and `calculateDistance3D()` functions.
- [x] Implement `calculateVolumeFromDistance(distance: number): number` function using inverse square law with configurable falloff parameters (min distance: 50px, max distance: 500px, rolloff factor: 2.0)
      **Note:** Already implemented in `src/audio/spatial-falloff.js` as `calculateWaveFalloff()` and `calculateVolumeForSource()` with zone-based acoustic configurations.
- [x] Create `src/audio/types.ts` with TypeScript interfaces for `SpatialPosition`, `AudioPeer`, and `AudioZoneConfig`
      **Note:** N/A - Project uses JavaScript with JSDoc comments instead of TypeScript. Zone configs already defined in `ZONE_CONFIGS` object in `spatial-falloff.js`.
- [x] Add `updatePeerPosition(peerId: string, position: SpatialPosition)` method to SpatialAudioEngine that recalculates volume for affected peer connections
      **Note:** Implemented in `SpatialAudioEngine.js` with smooth volume ramping (50ms) to avoid clicks and zone-aware volume calculation.
- [x] Integrate SpatialAudioEngine into existing PeerJS mesh network by wrapping each MediaStream with a GainNode before connecting to AudioContext destination
      **Note:** Fully integrated into ChatsuboApp - replaced manual Web Audio API setup with SpatialAudioEngine class. Remote peer MediaStreams now processed through SpatialAudioEngine.addPeer() which creates GainNodes. Listener position updates trigger volume recalculation for all peers. Cleanup properly handled in destroy().
- [ ] Create `src/components/SpatialAudioControls.tsx` component with master volume slider, spatial audio toggle, and distance falloff visualization
- [ ] Add position tracking to existing user avatar system - emit position updates via PeerJS data channel every 100ms when position changes
- [ ] Implement `onPositionUpdate(peerId: string, position: SpatialPosition)` handler that calls `updatePeerPosition` on SpatialAudioEngine
- [x] Create `src/utils/audioConstants.ts` with initial zone acoustic parameters from Chatsubo design (default falloff, min/max distances, zone-specific modifiers)
      **Note:** Already implemented in `src/audio/spatial-falloff.js` as `ZONE_CONFIGS` object with all 6 zones (gaming, central_bar, card_tables, firepit, booth, stage) with complete acoustic parameters.
- [ ] Add real-time distance display in UI showing distance to each connected peer with current volume level as percentage
- [ ] Test spatial audio with 2+ browser tabs in local development - verify volume decreases as avatars move apart and increases as they move together
- [x] Add error handling for Web Audio API initialization failures with fallback to non-spatial audio mode
      **Note:** Implemented in `SpatialAudioEngine.js` - initialization errors are caught and logged, `setSpatialEnabled(false)` provides fallback to non-spatial mode.
- [x] Create `src/audio/__tests__/SpatialAudioEngine.test.ts` with unit tests for distance calculation, volume calculation, and edge cases (zero distance, max distance exceeded)
      **Note:** Implemented as `SpatialAudioEngine.test.js` with 28 comprehensive unit tests covering initialization, peer management, position updates, volume control, distance queries, state management, cleanup, and edge cases. All tests passing.
