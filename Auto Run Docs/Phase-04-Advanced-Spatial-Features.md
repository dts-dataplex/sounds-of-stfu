# Phase 04: Advanced Spatial Audio Features

This phase adds sophisticated spatial audio features including stereo panning, head-related transfer functions (HRTF), directional audio, and acoustic simulation for realistic bar atmosphere.

## Tasks

- [ ] Implement stereo panning in SpatialAudioEngine using PannerNode with azimuth calculation based on relative peer positions (peers to left pan left, peers to right pan right)
- [ ] Add HRTF support by loading Web Audio API HRTF dataset and applying to PannerNode for more realistic 3D audio positioning
- [ ] Create `src/audio/DirectionalAudio.ts` to implement directional hearing - peers facing each other hear each other louder than peers facing away
- [ ] Add `setListenerOrientation(azimuth: number)` method to rotate the virtual listener's direction, affecting panning and directionality
- [ ] Implement acoustic ray tracing for simple occlusion - trace line between peers and check for wall intersections using Chatsubo floor plan geometry
- [ ] Create `src/audio/AmbientSoundscape.ts` to add background bar ambiance (crowd murmur, glass clinking, music) that varies by zone
- [ ] Add zone-specific ambient loops - gaming zone has arcade sounds, bar has background music, firepit has crackling fire
- [ ] Implement crowd simulation audio that scales with number of peers in a zone - more peers = louder ambient crowd noise
- [ ] Create proximity-based audio blending - smoothly crossfade between zones as user moves between zone boundaries
- [ ] Add audio focus mode - press F to focus on one peer, applying directional boost and suppressing others by 50%
- [ ] Implement "whisper mode" for booth zones - reduce audio range to 100px max distance for private conversations
- [ ] Create stage zone special mode - amplify stage speaker audio to reach entire floor with 30% volume floor (always audible even at max distance)
- [ ] Add audio recording capability to capture spatial audio mix as it sounds to local user for debugging and demo purposes
- [ ] Create visual audio debugger overlay showing gain levels, pan positions, zone assignments, and active audio nodes per peer