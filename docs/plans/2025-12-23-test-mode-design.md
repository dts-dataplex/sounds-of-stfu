# Test Mode Design

**Date:** 2025-12-23
**Status:** Approved
**POC Version:** v1.1
**Dependencies:** Requires completed POC (v1.0) from poc/spatial-audio branch

---

## Overview

Test mode spawns AI-controlled bots that produce audio, allowing solo evaluation of spatial audio quality, network performance, and platform behavior without needing multiple people or browser windows. When other users join, test mode automatically becomes "demo mode" for collaborative showcasing.

**Key Design Principles:**

- Solo testing without multiple devices
- Interactive audio type selection (click to cycle)
- Automatic adaptation to solo vs. multi-user scenarios
- Seamless integration with existing spatial audio engine

---

## User Experience

### Solo Test Mode

**Activation:**

1. User clicks "Test Mode" button in controls area
2. Panel expands showing configuration options:
   - **Bots slider**: 1-3 bots
   - **Duration dropdown**: 30s / 1min / 2min / 5min
   - **Movement dropdown**: Stationary / Patterns
   - **Start Test button**
3. Bots spawn at predetermined positions on canvas

**Interacting with Bots:**

- Bots appear as gray circles (#888888) with "BOT 1 🤖", "BOT 2 🤖", "BOT 3 🤖" labels
- Initially silent (default state)
- **Click bot** → starts playing first audio type
- **Click again** → cycles to next audio type
- **Click through all 6 types** → returns to silence
- **Drag bot** → reposition manually (works in all movement modes)

**Audio Types (6-state cycle):**

1. **Silence** - Off state, no audio
2. **Speech sample** - Pre-recorded "Testing, one, two, three" (~2 seconds)
3. **Text-to-speech** - Web Speech API: "Hello, I am Bot 1"
4. **Ambient conversation** - Background chatter loop (~5 seconds)
5. **Music loop** - Catchy melody (~10 seconds)
6. **Sound effects** - Applause/laughter (~2 seconds)

**Test Completion:**

- Timer displays countdown: "Time: 1:32"
- When timer expires: 2-3 second fade-out on all bot audio
- Bots remain visible but return to silence
- User can click "Stop Test" anytime to end and remove bots
- Music/speech that's playing fades gracefully (doesn't wait for completion)

---

## Demo Mode (Multi-User Behavior)

**Automatic Mode Switch:**
When real users are present in the room, test mode becomes "demo mode" - a collaborative showcase of the platform's spatial audio capabilities.

**Host Control Model:**

- **Host** = User who clicked "Start Test"
- **Host privileges**:
  - Can click bots to change audio types
  - Can drag bots to reposition
  - Can stop test mode
  - Can adjust settings
- **Host UI**: "Test Mode Active (You are controlling)"

- **Other users**:
  - See and hear bots in real-time
  - Cannot interact with bots (read-only observers)
  - See: "Demo Mode Active (Controlled by [HostName])"
  - Clicking bots shows tooltip: "Demo controlled by [Host]"

**Synchronization:**

- Bot positions, audio states, and movements sync to all users
- Data channel protocol (same as peer positions)
- When host clicks bot → all users hear audio change immediately
- When host drags bot → everyone sees movement in real-time
- New joiners receive full bot state on connection

**Edge Cases:**

- **Host leaves room**: Test mode ends, bots removed for everyone
- **Non-host leaves**: Bots continue for remaining users
- **New user joins mid-test**: Bots sync to them immediately with current state
- **Host transfers**: Not supported in v1.1 (future feature)

---

## Bot Movement Patterns

### Three Movement Modes

**1. Stationary Mode (Default)**

Bots spawn at fixed positions chosen to demonstrate spatial audio falloff:

- **Bot 1**: Near position - 150px from canvas center
  - Tests close proximity audio (should be loud)
  - Position: `{x: 400 + 100, y: 300}` (slightly offset from center)

- **Bot 2**: Medium position - 300px from canvas center
  - Tests mid-range audio (moderate volume)
  - Position: `{x: 400 + 212, y: 300 + 212}` (diagonal)

- **Bot 3**: Far position - 450px from canvas center
  - Tests max hearing range (quiet or silent depending on settings)
  - Position: `{x: 400, y: 300 + 450}` (bottom edge)

Bots remain stationary unless manually dragged.

**2. Pattern Movement Mode**

Toggle via dropdown: "Movement: Patterns"

When enabled, each bot follows a distinct pattern to demonstrate dynamic spatial audio:

- **Bot 1 - Circular Path**:
  - Radius: 100px around spawn point
  - Period: 20 seconds per complete loop
  - Formula: `x = centerX + 100 * cos(time), y = centerY + 100 * sin(time)`
  - Tests gradual distance changes

- **Bot 2 - Figure-8 Pattern**:
  - Lissajous curve (frequency ratio 2:1)
  - Tests crossing paths and direction changes
  - Formula: `x = centerX + 150 * sin(time), y = centerY + 75 * sin(2 * time)`

- **Bot 3 - Back-and-Forth Horizontal**:
  - Linear motion between two points
  - Range: 300px horizontal movement
  - Tests linear approach/retreat
  - Formula: `x = centerX + 150 * sin(time), y = centerY`

**Movement Parameters:**

- Speed: ~50px/second (visible but not jarring)
- Update frequency: 10 times per second
- Position broadcasts use existing data channel protocol
- Movement bounded to canvas (bots can't move off-screen)

**3. Manual Drag Mode (Always Available)**

- **Click and hold** bot → enter drag mode
- **Move mouse** → bot follows cursor
- **Release** → bot stays at new position
- Works in both stationary and pattern modes
- **In pattern mode**: Dragging pauses pattern until release, then bot resumes pattern from new center point
- Useful for testing specific distances or demonstrating to stakeholders

---

## Technical Implementation

### Audio Generation

**Embedded Audio Sources (Base64 Data URLs):**

Small audio clips embedded directly in HTML to maintain single-file design:

```html
<script>
  const botAudioClips = {
    speech: 'data:audio/mp3;base64,//uQx...', // "Testing, one, two, three" (~2s)
    ambient: 'data:audio/mp3;base64,//uQx...', // Background chatter loop (~5s)
    music: 'data:audio/mp3;base64,//uQx...', // Catchy melody (~10s)
    sfx: 'data:audio/mp3;base64,//uQx...', // Applause/laughter (~2s)
  };
</script>
```

**Size budget**: ~20-30KB total for all embedded clips (acceptable for POC)

**Web Speech API (Text-to-Speech):**

```javascript
function playBotTTS(botId) {
  const utterance = new SpeechSynthesisUtterance(`Hello, I am Bot ${botId}`);
  utterance.rate = 0.9; // Slightly slower for clarity
  utterance.pitch = 1.0 + botId * 0.1; // Vary pitch per bot
  speechSynthesis.speak(utterance);
}
```

- Built-in browser TTS, no external dependencies
- Different phrase per bot for variety
- Check availability: `if ('speechSynthesis' in window)`

**Audio Routing into Spatial Engine:**

Bots integrate with existing Web Audio API spatial audio pipeline:

```javascript
// For embedded audio clips
const audio = new Audio(botAudioClips.music);
const audioSource = audioContext.createMediaElementSource(audio);

// For TTS (requires MediaStreamDestination)
const destination = audioContext.createMediaStreamDestination();
const ttsSource = audioContext.createMediaStreamSource(destination.stream);

// Route into spatial audio pipeline (same as real peers)
const gainNode = audioContext.createGain();
const analyzerNode = audioContext.createAnalyser();

audioSource.connect(analyzerNode);
analyzerNode.connect(gainNode);
gainNode.connect(audioContext.destination);

// Store nodes for cleanup
gainNodes[botId] = gainNode;
analyzerNodes[botId] = analyzerNode;
```

Bots treated as "virtual peers" - use same GainNode/AnalyserNode setup as real users.

### Bot State Management

**Data Structure:**

```javascript
const testBots = {
  'bot-1': {
    id: 'bot-1',
    name: 'BOT 1 🤖',
    position: { x: 500, y: 300 },
    audioType: 'silence', // Current audio state (silence/speech/tts/ambient/music/sfx)
    audioSource: null, // AudioNode reference for cleanup
    gainNode: null, // GainNode for spatial audio
    analyzerNode: null, // AnalyserNode for speaking detection
    stream: null, // MediaStream (if applicable)
    pattern: 'circle', // Movement pattern (circle/figure8/linear/none)
    patternPhase: 0, // Animation phase (radians)
    patternCenter: { x: 500, y: 300 }, // Pattern origin point
    isDragging: false, // True when user is dragging this bot
  },
  'bot-2': {
    /* ... */
  },
  'bot-3': {
    /* ... */
  },
};

// Test mode state
const testModeState = {
  active: false,
  hostPeerId: null, // Who started test mode
  startTime: null, // timestamp
  duration: 120, // seconds
  movementMode: 'stationary', // 'stationary' or 'patterns'
  numBots: 3,
};
```

**Bot Lifecycle:**

1. **Spawn**: Create bot object, initialize position, add to testBots map
2. **Render**: Draw in canvas alongside real users (gray color, BOT label)
3. **Update**: Handle movement patterns in animation loop
4. **Audio**: Create/destroy audio nodes when cycling audio types
5. **Cleanup**: Disconnect audio nodes, remove from map, remove from canvas

---

## Data Synchronization

### Data Channel Protocol

Extend existing data channel messaging to support bot state:

**Bot State Change (Host → All)**

```javascript
{
  type: 'bot_state',
  botId: 'bot-1',
  position: {x: 250, y: 300},
  audioType: 'music',          // Current audio being played
  timestamp: Date.now()
}
```

Broadcast when:

- Host clicks bot (audio type change)
- Host drags bot (position change)
- Pattern movement updates position (throttled to 10/second)

**Test Mode Start (Host → All)**

```javascript
{
  type: 'test_mode',
  action: 'start',
  hostPeerId: 'user-abc123',
  numBots: 3,
  duration: 120,
  movementMode: 'patterns',
  bots: [
    {id: 'bot-1', position: {x: 500, y: 300}, audioType: 'silence', pattern: 'circle'},
    {id: 'bot-2', position: {x: 600, y: 400}, audioType: 'silence', pattern: 'figure8'},
    {id: 'bot-3', position: {x: 400, y: 700}, audioType: 'silence', pattern: 'linear'}
  ]
}
```

**Test Mode Stop (Host → All)**

```javascript
{
  type: 'test_mode',
  action: 'stop',
  hostPeerId: 'user-abc123'
}
```

**Full State Sync (Host → New Joiner or Periodic)**

```javascript
{
  type: 'test_mode_full_state',
  active: true,
  hostPeerId: 'user-abc123',
  timeRemaining: 87,  // seconds
  bots: [ /* complete bot states */ ]
}
```

Sent:

- When new user joins mid-test
- Every 5 seconds as periodic sync (recovery from packet loss)

**Non-Host Behavior:**

- Receive bot state updates
- Render bots locally with same positions/audio
- Cannot send bot state changes
- Display "Demo Mode Active (Controlled by X)"
- If try to interact: Show tooltip "Demo controlled by [Host]"

---

## UI Integration

### Test Mode Panel

Add to controls div, initially hidden:

```html
<div
  id="testModePanel"
  style="display:none; margin-top: 15px; padding: 15px; background: #2a2a2a; border-radius: 8px;"
>
  <h4 style="margin-top: 0;">Test Mode</h4>

  <div style="margin-bottom: 10px;">
    <label>
      Number of Bots:
      <input
        type="range"
        id="testBotCount"
        min="1"
        max="3"
        value="3"
        style="vertical-align: middle;"
      />
      <span id="testBotCountValue" style="font-weight: bold;">3</span>
    </label>
  </div>

  <div style="margin-bottom: 10px;">
    <label>
      Duration:
      <select id="testDuration">
        <option value="30">30 seconds</option>
        <option value="60">1 minute</option>
        <option value="120" selected>2 minutes</option>
        <option value="300">5 minutes</option>
      </select>
    </label>
  </div>

  <div style="margin-bottom: 10px;">
    <label>
      Movement:
      <select id="testMovement">
        <option value="stationary" selected>Stationary</option>
        <option value="patterns">Patterns</option>
      </select>
    </label>
  </div>

  <div>
    <button id="startTestBtn">Start Test</button>
    <button id="stopTestBtn" style="display:none; margin-left: 10px;">Stop Test</button>
  </div>

  <div id="testTimer" style="display:none; margin-top: 10px; font-weight: bold; color: #4a9eff;">
    Time Remaining: <span id="testTimerValue">2:00</span>
  </div>

  <div
    id="testModeStatus"
    style="display:none; margin-top: 10px; padding: 8px; background: #3a3a3a; border-radius: 4px; font-size: 12px;"
  >
    Test Mode Active (You are controlling)
  </div>

  <div
    id="demoModeStatus"
    style="display:none; margin-top: 10px; padding: 8px; background: #3a3a3a; border-radius: 4px; font-size: 12px;"
  >
    Demo Mode Active (Controlled by <span id="demoHostName">UserX</span>)
  </div>
</div>
```

**Toggle Test Mode Panel:**

- Add "Test Mode" button next to mute button
- Click to expand/collapse panel
- Disabled if user is not host and test already active

### Visual Rendering

**Canvas Drawing (in draw() function):**

```javascript
// Render bots alongside real users
Object.values(testBots).forEach((bot) => {
  const pos = bot.position;
  const isSpeaking = speakingStates[bot.id];

  // Speaking indicator (pulsing ring)
  if (isSpeaking) {
    const time = Date.now();
    const pulseScale = 1.0 + 0.3 * Math.abs(Math.sin(time / 300));
    const ringRadius = 30 * pulseScale;

    ctx.beginPath();
    ctx.arc(pos.x, pos.y, ringRadius, 0, Math.PI * 2);
    ctx.strokeStyle = '#888888aa'; // Gray, semi-transparent
    ctx.lineWidth = 4;
    ctx.stroke();
  }

  // Bot circle (gray)
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, 20, 0, Math.PI * 2);
  ctx.fillStyle = '#888888';
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Bot label
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(bot.name, pos.x, pos.y - 28);

  // Audio type indicator (below bot)
  if (bot.audioType !== 'silence') {
    ctx.font = '9px sans-serif';
    ctx.fillStyle = '#aaaaaa';
    ctx.fillText(bot.audioType, pos.x, pos.y + 35);
  }
});
```

**Participant List:**

Show bots separately from real users:

```
Participants:
- You
- Alice (connected)
- Bob (connected)

Test Bots (3):
- BOT 1 🤖 (music)
- BOT 2 🤖 (speech)
- BOT 3 🤖 (silence)
```

---

## Movement Pattern Implementation

**Animation Loop Integration:**

```javascript
function updateTestBots() {
  if (!testModeState.active || testModeState.movementMode !== 'patterns') return;

  const time = Date.now() / 1000; // seconds

  Object.values(testBots).forEach((bot) => {
    if (bot.isDragging) return; // Skip bots being dragged

    const center = bot.patternCenter;

    switch (bot.pattern) {
      case 'circle':
        bot.position.x = center.x + 100 * Math.cos((time * Math.PI) / 10);
        bot.position.y = center.y + 100 * Math.sin((time * Math.PI) / 10);
        break;

      case 'figure8':
        bot.position.x = center.x + 150 * Math.sin((time * Math.PI) / 10);
        bot.position.y = center.y + 75 * Math.sin((time * Math.PI) / 5);
        break;

      case 'linear':
        bot.position.x = center.x + 150 * Math.sin((time * Math.PI) / 10);
        bot.position.y = center.y;
        break;
    }

    // Bound to canvas
    bot.position.x = Math.max(20, Math.min(canvas.width - 20, bot.position.x));
    bot.position.y = Math.max(20, Math.min(canvas.height - 20, bot.position.y));
  });

  // Broadcast position updates (throttled to 10/second)
  if (myPeerId === testModeState.hostPeerId && time % 0.1 < 0.016) {
    broadcastBotPositions();
  }

  // Update spatial audio for all bots
  updateSpatialAudio();
}

// Call in animation loop
function animate() {
  handleKeyboardMovement();
  updateSpeakingStates();
  updateTestBots(); // <-- Add this
  draw();
  requestAnimationFrame(animate);
}
```

---

## Error Handling

### Audio Loading Failures

**Embedded Audio Decode Error:**

```javascript
async function playBotAudio(botId, audioType) {
  try {
    const audio = new Audio(botAudioClips[audioType]);
    audio.onerror = (e) => {
      console.error(`Failed to load ${audioType} for ${botId}:`, e);
      // Skip to next audio type
      cycleBotAudio(botId);
    };
    await audio.play();
  } catch (err) {
    console.error(`Error playing ${audioType}:`, err);
    // Continue with silence
  }
}
```

**Web Speech API Unavailable:**

```javascript
function playBotTTS(botId) {
  if (!('speechSynthesis' in window)) {
    console.warn('Web Speech API not available');
    updateStatus('Text-to-speech not supported in this browser');
    // Skip TTS, cycle to next type
    cycleBotAudio(botId);
    return;
  }

  const utterance = new SpeechSynthesisUtterance(`Hello, I am Bot ${botId}`);
  speechSynthesis.speak(utterance);
}
```

**Fallback Strategy:**

1. Try to play requested audio type
2. If fails, log error to console
3. Skip to next audio type in cycle
4. Continue gracefully (don't break test mode)

### Synchronization Issues

**Lost Bot State Messages:**

Host sends periodic full-state sync every 5 seconds:

```javascript
setInterval(() => {
  if (testModeState.active && myPeerId === testModeState.hostPeerId) {
    broadcastFullBotState();
  }
}, 5000);
```

**Host Disconnect Mid-Demo:**

Non-host clients detect host disconnection:

```javascript
peer.on('disconnected', (peerId) => {
  if (testModeState.active && peerId === testModeState.hostPeerId) {
    // Host left, end test mode
    console.log('Test mode host disconnected, ending test mode');
    stopTestMode();
    updateStatus('Test mode ended (host disconnected)');
  }
});
```

**Non-Host Tries to Interact:**

```javascript
canvas.addEventListener('click', (e) => {
  const clickedBot = getBotAtPosition(e.clientX, e.clientY);

  if (clickedBot) {
    if (testModeState.active && myPeerId !== testModeState.hostPeerId) {
      // Show tooltip: cannot interact
      showTooltip(e.clientX, e.clientY, `Demo controlled by ${getHostName()}`);
      return;
    }

    // Host can interact
    cycleBotAudio(clickedBot.id);
  }
});
```

### Browser Compatibility

**Feature Detection:**

```javascript
function checkTestModeSupport() {
  const issues = [];

  if (!('speechSynthesis' in window)) {
    issues.push('Text-to-speech not available');
  }

  if (!audioContext) {
    issues.push('Web Audio API not initialized');
  }

  if (issues.length > 0) {
    console.warn('Test mode limitations:', issues);
    updateStatus(`Test mode: ${issues.join(', ')}`);
  }

  return issues.length === 0;
}
```

**Supported Browsers:**

- ✅ Chrome/Chromium (fully supported)
- ✅ Firefox (fully supported)
- ✅ Edge (Chromium) (fully supported)
- ⚠️ Safari (Web Speech API may have limitations)
- ❌ Mobile browsers (not optimized for test mode)

**Graceful Degradation:**

- If TTS unavailable: skip TTS audio type, use embedded clips only
- If audio decode fails: skip that audio type
- If spatial audio fails: bots still render, just no audio

---

## Timer and Fade-Out

### Timer Implementation

**Countdown Display:**

```javascript
let testTimerInterval = null;

function startTestTimer(durationSeconds) {
  const endTime = Date.now() + durationSeconds * 1000;

  testTimerInterval = setInterval(() => {
    const remaining = Math.max(0, endTime - Date.now());
    const seconds = Math.floor(remaining / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;

    document.getElementById('testTimerValue').textContent =
      `${minutes}:${secs.toString().padStart(2, '0')}`;

    if (remaining <= 0) {
      clearInterval(testTimerInterval);
      endTestMode();
    }
  }, 100); // Update 10 times/second for smooth countdown
}
```

### Graceful Fade-Out

**When Timer Expires:**

```javascript
function endTestMode() {
  console.log('Test mode timer expired, fading out...');

  // Fade out all bot audio over 2 seconds
  Object.values(testBots).forEach((bot) => {
    if (bot.gainNode && bot.audioType !== 'silence') {
      const currentGain = bot.gainNode.gain.value;
      bot.gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 2);

      // After fade, stop audio and reset to silence
      setTimeout(() => {
        stopBotAudio(bot.id);
        bot.audioType = 'silence';
      }, 2000);
    }
  });

  // Update UI
  updateStatus('Test complete (audio fading out...)');

  // Bots remain visible but silent
  // User can click "Stop Test" to remove them, or restart test
}
```

**Manual Stop (Immediate):**

```javascript
function stopTestMode() {
  // Stop timer
  if (testTimerInterval) {
    clearInterval(testTimerInterval);
  }

  // Stop all bot audio immediately
  Object.values(testBots).forEach((bot) => {
    stopBotAudio(bot.id);
  });

  // Remove bots
  testBots = {};
  testModeState.active = false;

  // Broadcast stop to other users
  if (myPeerId === testModeState.hostPeerId) {
    broadcastTestModeStop();
  }

  // Update UI
  document.getElementById('testModePanel').style.display = 'block';
  document.getElementById('stopTestBtn').style.display = 'none';
  document.getElementById('testTimer').style.display = 'none';
  updateStatus('Test mode stopped');
}
```

---

## Future Extensions (Backlog)

Items deferred from design discussion, documented for v1.2+:

### 1. Toggle Stationary/Moving Per-Bot

Currently movement is global (all bots stationary or all moving patterns). Future version:

```javascript
// Per-bot movement toggle
<button onclick="toggleBotMovement('bot-1')">Lock Position</button>
```

Allows mixing: Bot 1 stationary, Bot 2 moving, Bot 3 stationary.

### 2. Follow/Avoid Behavior

More complex AI movement:

**Follow Mode:**

- Bot maintains distance of ~100px from user
- Useful for testing close-proximity audio while moving
- Path-finding to avoid obstacles (other bots)

**Avoid Mode:**

- Bot maintains minimum distance of ~200px from user
- Runs away when user approaches
- Tests distance falloff dynamically

Implementation: Add `follow` and `avoid` to movement pattern options.

### 3. News Anchor Bot (Separate Feature)

Not part of test mode - separate feature for v1.1:

**Concept:**

- Dedicated "News Anchor" bot that spawns in a fixed location
- Fetches RSS feed or news API (e.g., NewsAPI, Reddit)
- Reads headlines aloud using Web Speech API
- Updates every 5-10 minutes with fresh news

**Implementation Approach:**

```javascript
async function fetchNewsHeadlines() {
  const response = await fetch('https://newsapi.org/v2/top-headlines?country=us&apiKey=...');
  const data = await response.json();
  return data.articles.slice(0, 5); // Top 5 headlines
}

function readNewsAloud(headlines) {
  headlines.forEach((article, index) => {
    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(`Headline ${index + 1}: ${article.title}`);
      speechSynthesis.speak(utterance);
    }, index * 10000); // 10 seconds between headlines
  });
}
```

Could be triggered by clicking a "News" button, or auto-spawn in certain rooms.

---

## Success Criteria

**Test Mode is successful if:**

1. ✅ **Solo testing works**: User can spawn 1-3 bots and test spatial audio alone
2. ✅ **Audio types functional**: All 6 audio types play correctly and cycle smoothly
3. ✅ **Movement patterns work**: Bots move in predictable patterns, test dynamic audio
4. ✅ **Demo mode syncs**: Multiple users see same bot state in real-time
5. ✅ **Network testing**: User can evaluate internet connection quality with bots
6. ✅ **Easy to use**: Non-technical users can activate and use test mode
7. ✅ **Graceful degradation**: Works even if some audio types fail

**Validation Method:**

1. Solo test: Spawn 3 bots, cycle through all audio types, verify spatial audio works
2. Multi-user test: Two users in same room, host controls bots, verify sync
3. Movement test: Enable pattern mode, verify bots move and audio updates correctly
4. Network stress: Spawn 3 bots with music, add 2 real users, check for audio glitches
5. Browser compatibility: Test in Chrome, Firefox, Edge, Safari

---

## Implementation Notes

**Development Approach:**

- Build on completed POC (v1.0) in existing worktree or new branch
- Estimated effort: 1-2 days for core test mode
- Estimated effort: +0.5 days for demo mode sync
- Estimated effort: +0.5 days for movement patterns
- Total: 2-3 days

**Testing Strategy:**

- Unit test: Each audio type loads and plays
- Integration test: Bots integrate with spatial audio engine
- Multi-user test: Demo mode synchronization
- Performance test: 3 bots + 5 real users (stress test)

**Deployment:**

- Single HTML file maintained (add ~200-300 lines)
- Embedded audio adds ~20-30KB to file size
- No external dependencies added

**Code Organization:**

- All bot logic in dedicated section of `<script>`
- Data channel handlers extend existing protocol
- UI elements added to controls div
- Canvas rendering extends existing draw() function

---

## References

**Internal Documents:**

- POC Design: `docs/plans/2025-12-23-peerjs-poc-design.md`
- POC Implementation: `docs/plans/2025-12-23-peerjs-poc-implementation.md`
- ADR-001: `docs/adr/001-peerjs-privacy-first-architecture.md`

**External Resources:**

- Web Speech API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API
- Web Audio API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
- Data URLs: https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URLs
- PeerJS Documentation: https://peerjs.com/docs/

---

## Revision History

- **2025-12-23**: Initial design - Test mode with bots, demo mode sync, movement patterns
- **Future**: Will add notes on actual implementation challenges and lessons learned
