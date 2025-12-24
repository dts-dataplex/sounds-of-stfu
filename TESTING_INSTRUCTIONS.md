# Multi-User Room Testing Instructions

## Overview
Task 2.1 implements multi-user room coordination with host-based participant discovery. This document provides detailed testing instructions for the 3-8 user mesh network functionality.

## Test Setup
You need **3 browser windows/tabs** to properly test the multi-user functionality:
- Browser 1: Room Host
- Browser 2: Participant 1
- Browser 3: Participant 2

All browsers should access: **http://localhost:8000**

## Test Scenario 1: Basic 3-User Room

### Step 1: Create Room (Browser 1 - Host)
1. Open http://localhost:8000 in Browser 1
2. Enter room code: `test-room`
3. Click "Join Room"
4. Allow microphone access when prompted
5. **Expected Results:**
   - Status shows: "Created room as host: test-room"
   - Participants list shows: "Me"
   - Mute button is enabled

### Step 2: Join Room (Browser 2 - Participant 1)
1. Open http://localhost:8000 in Browser 2
2. Enter the SAME room code: `test-room`
3. Click "Join Room"
4. Allow microphone access when prompted
5. **Expected Results:**
   - Status shows: "Joined room: test-room"
   - Participants list shows: "Me" + Host's peer ID (first 8 chars)
   - Console shows: "Data connection opened with test-room" and "Receiving audio from test-room"
   - **Browser 1** participant list updates to show Participant 1
   - Both browsers should hear each other's audio

### Step 3: Join Room (Browser 3 - Participant 2)
1. Open http://localhost:8000 in Browser 3
2. Enter the SAME room code: `test-room`
3. Click "Join Room"
4. Allow microphone access when prompted
5. **Expected Results:**
   - Status shows: "Joined room: test-room"
   - Participants list shows: "Me" + 2 other peer IDs
   - Console shows multiple connections being established
   - **Browser 1 & 2** participant lists update to show all 3 users
   - All 3 browsers should hear each other's audio (mesh network)

## Test Scenario 2: Mute Functionality

### Test Mute (Any Browser)
1. Click the "Mute" button
2. **Expected Results:**
   - Button text changes to "Unmute"
   - Status shows: "Muted"
   - Other participants can no longer hear your audio
   - You can still hear other participants

3. Click "Unmute" button
4. **Expected Results:**
   - Button text changes back to "Mute"
   - Status shows: "Unmuted"
   - Other participants can hear your audio again

## Test Scenario 3: Participant Discovery

### Test Late Joiner
1. With all 3 browsers connected, close Browser 3
2. **Expected Results:**
   - Browser 1 & 2 participant lists remove the disconnected user
   - Console shows: "Data connection closed with [peer-id]"

3. Re-open Browser 3 and join the same room
4. **Expected Results:**
   - Browser 3 automatically discovers and connects to both existing participants
   - All participant lists update correctly
   - Mesh network is re-established

## Test Scenario 4: Multiple Rooms

### Test Room Isolation
1. Browser 1: Join room `room-a`
2. Browser 2: Join room `room-b`
3. **Expected Results:**
   - Each browser shows only themselves in participant list
   - No audio connection established between them
   - They are in isolated rooms

4. Browser 3: Join room `room-a`
5. **Expected Results:**
   - Browser 3 connects to Browser 1 only
   - Browser 2 remains isolated in room-b

## Verification Checklist

### UI Verification
- [ ] Room code input is visible and functional
- [ ] Join Room button works correctly
- [ ] Mute button is disabled until joined
- [ ] Status updates show clear messages
- [ ] Participant list displays all connected users
- [ ] Participant list updates when users join/leave

### Audio Verification
- [ ] Microphone permission is requested
- [ ] Audio streams successfully between all peers
- [ ] Mute functionality stops audio transmission
- [ ] Unmute functionality restores audio transmission
- [ ] Multiple audio streams play simultaneously (mesh)

### Network Verification (Browser Console)
- [ ] Peer IDs are generated with room code prefix
- [ ] Data connections establish successfully
- [ ] "hello" messages are sent and received
- [ ] "participants" messages distribute peer list
- [ ] "new_participant" messages broadcast new joiners
- [ ] All peers connect to all other peers (mesh topology)

### Error Handling
- [ ] Empty room code shows error message
- [ ] Microphone denial shows clear error
- [ ] Disconnection removes peer from participant list
- [ ] Reconnection re-establishes mesh network

## Known Limitations (Expected Behavior)

1. **Host Dependency**: The first person to join with a room code becomes the host. If the host leaves, new participants cannot discover each other (this is by design for this POC phase).

2. **Peer ID Display**: Participants are shown by their peer ID (first 8 characters) rather than friendly names. This will be addressed in Phase 3.

3. **No Visual Audio Indicators**: There are no visual indicators showing who is currently speaking. This will be added in Phase 3.

4. **Browser Autoplay Policies**: Some browsers may require a user interaction (click) before audio playback begins. The UI will prompt users if this is needed.

## Console Debugging

To view detailed connection logs, open the browser console (F12) and look for:

```
Data connection opened with [peer-id]
Receiving audio from [peer-id]
Received data: {type: 'hello', ...}
Received data: {type: 'participants', ...}
Connecting to peer: [peer-id]
```

## Success Criteria

Task 2.1 is successful if:
1. 3 browser windows can join the same room
2. All participants appear in each other's participant lists
3. Audio streams successfully between all 3 participants (mesh network)
4. Mute/unmute works correctly
5. Late joiners can discover and connect to existing participants
6. Participants are removed from lists when they disconnect

## Architecture Notes

### Mesh Network Topology
Every peer connects to every other peer:
- 3 users = 6 connections (2 per user)
- 4 users = 12 connections (3 per user)
- 5 users = 20 connections (4 per user)

### Connection Types
Each peer-to-peer connection consists of:
1. **Data Connection**: For signaling and participant discovery
2. **Media Connection**: For audio streaming

### Host-Based Discovery
1. First user creates room and becomes host (peer ID = room code)
2. Subsequent users connect to host first
3. Host sends participant list to new user
4. New user connects to all existing participants
5. Host broadcasts new participant to all existing users
6. Existing users connect to new participant
7. Result: Full mesh network where everyone connects to everyone

## Next Steps

After successful testing, the next task will be:
- **Task 2.2**: Add position tracking and distance-based volume (spatial audio basics)
