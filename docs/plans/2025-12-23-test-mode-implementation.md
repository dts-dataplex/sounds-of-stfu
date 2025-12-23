# Test Mode Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add test mode with AI-controlled bots that produce audio, enabling solo evaluation of spatial audio without needing multiple devices.

**Architecture:** Extends existing POC by adding bot management (virtual peers), embedded audio sources, and data channel synchronization for multi-user demo mode. Bots integrate with existing spatial audio pipeline as virtual peers.

**Tech Stack:** Vanilla JavaScript, Web Audio API, Web Speech API, PeerJS data channels, embedded base64 audio

---

## Task 1: Add Test Mode UI Panel

**Files:**
- Modify: `/home/datawsl/sounds-of-stfu/.worktrees/poc-spatial-audio/index.html`

**Objective:** Add UI controls for test mode configuration

**Step 1: Add Test Mode button to controls**

Find the line with `<button id="muteBtn" disabled>Mute</button>` and add test mode button after it:

```html
<button id="muteBtn" disabled>Mute</button>
<button id="testModeToggle" style="margin-left: 10px;">Test Mode</button>
```

**Step 2: Add Test Mode panel HTML**

Add this panel after the instructions div (after line ~109):

```html
<div id="testModePanel" style="display:none; padding: 20px; background: #2a2a2a; border-radius: 8px; margin-bottom: 20px;">
    <h3 style="margin-top: 0;">Test Mode</h3>

    <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px;">
            Number of Bots:
            <input type="range" id="testBotCount" min="1" max="3" value="3" style="vertical-align: middle; margin-left: 10px;">
            <span id="testBotCountValue" style="font-weight: bold; margin-left: 10px;">3</span>
        </label>
    </div>

    <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px;">
            Duration:
            <select id="testDuration" style="margin-left: 10px;">
                <option value="30">30 seconds</option>
                <option value="60">1 minute</option>
                <option value="120" selected>2 minutes</option>
                <option value="300">5 minutes</option>
            </select>
        </label>
    </div>

    <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px;">
            Movement:
            <select id="testMovement" style="margin-left: 10px;">
                <option value="stationary" selected>Stationary</option>
                <option value="patterns">Patterns</option>
            </select>
        </label>
    </div>

    <div style="margin-bottom: 15px;">
        <button id="startTestBtn" style="padding: 8px 16px; font-size: 14px;">Start Test</button>
        <button id="stopTestBtn" style="display:none; margin-left: 10px; padding: 8px 16px; font-size: 14px;">Stop Test</button>
    </div>

    <div id="testTimer" style="display:none; margin-top: 10px; padding: 10px; background: #3a3a3a; border-radius: 4px; font-weight: bold; color: #4a9eff;">
        Time Remaining: <span id="testTimerValue">2:00</span>
    </div>

    <div id="testModeStatus" style="display:none; margin-top: 10px; padding: 10px; background: #3a3a3a; border-radius: 4px; font-size: 13px;">
        Test Mode Active (You are controlling)
    </div>

    <div id="demoModeStatus" style="display:none; margin-top: 10px; padding: 10px; background: #3a3a3a; border-radius: 4px; font-size: 13px;">
        Demo Mode Active (Controlled by <span id="demoHostName">UserX</span>)
    </div>
</div>
```

**Step 3: Add element references in script section**

Find the section with element references (around line 115-135) and add:

```javascript
const testModeToggle = document.getElementById('testModeToggle');
const testModePanel = document.getElementById('testModePanel');
const testBotCount = document.getElementById('testBotCount');
const testBotCountValue = document.getElementById('testBotCountValue');
const testDuration = document.getElementById('testDuration');
const testMovement = document.getElementById('testMovement');
const startTestBtn = document.getElementById('startTestBtn');
const stopTestBtn = document.getElementById('stopTestBtn');
const testTimer = document.getElementById('testTimer');
const testTimerValue = document.getElementById('testTimerValue');
const testModeStatus = document.getElementById('testModeStatus');
const demoModeStatus = document.getElementById('demoModeStatus');
const demoHostName = document.getElementById('demoHostName');
```

**Step 4: Add toggle functionality**

Add event listener for test mode toggle button (after element references):

```javascript
// Test mode panel toggle
testModeToggle.addEventListener('click', () => {
    if (testModePanel.style.display === 'none') {
        testModePanel.style.display = 'block';
    } else {
        testModePanel.style.display = 'none';
    }
});

// Bot count slider updates value display
testBotCount.addEventListener('input', () => {
    testBotCountValue.textContent = testBotCount.value;
});
```

**Step 5: Test the UI**

Manual testing steps:
1. Open `index.html` in browser
2. Click "Test Mode" button
3. Verify panel expands/collapses
4. Adjust bot count slider (1-3) and verify value updates
5. Check all dropdowns work (Duration, Movement)

**Step 6: Commit**

```bash
cd /home/datawsl/sounds-of-stfu/.worktrees/poc-spatial-audio
git add index.html
git commit -m "feat: add test mode UI panel with controls

Adds collapsible test mode panel with:
- Bot count slider (1-3)
- Duration dropdown (30s to 5min)
- Movement mode selector (stationary/patterns)
- Start/Stop buttons
- Timer display
- Status indicators for test/demo mode

Task 1: UI panel foundation"
```

---

## Task 2: Add Bot State Management

**Files:**
- Modify: `/home/datawsl/sounds-of-stfu/.worktrees/poc-spatial-audio/index.html`

**Objective:** Create data structures and state management for test bots

**Step 1: Add bot state variables**

Find the spatial audio parameters section (around line 147-149) and add bot state after it:

```javascript
// Spatial audio parameters
let maxHearingRange = 300;
let falloffCurve = 1.0;

// Test mode state
let testBots = {}; // { botId: {id, name, position, audioType, audioSource, gainNode, analyzerNode, pattern, patternPhase, patternCenter, isDragging} }
let testModeState = {
    active: false,
    hostPeerId: null,
    startTime: null,
    duration: 120,
    movementMode: 'stationary',
    numBots: 3
};
let testTimerInterval = null;

// Audio type cycle order
const AUDIO_TYPES = ['silence', 'speech', 'tts', 'ambient', 'music', 'sfx'];
```

**Step 2: Add bot creation function**

Add bot factory function after state variables:

```javascript
// Create a bot object
function createBot(botId, botNumber, position) {
    return {
        id: botId,
        name: `BOT ${botNumber} 🤖`,
        position: position,
        audioType: 'silence',
        audioSource: null,
        gainNode: null,
        analyzerNode: null,
        stream: null,
        pattern: getBotPattern(botNumber),
        patternPhase: 0,
        patternCenter: {...position},
        isDragging: false
    };
}

// Get pattern type based on bot number
function getBotPattern(botNumber) {
    const patterns = ['circle', 'figure8', 'linear'];
    return patterns[botNumber - 1] || 'circle';
}

// Get predetermined spawn position based on bot number
function getBotSpawnPosition(botNumber) {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    switch(botNumber) {
        case 1: // Near (150px from center)
            return {x: centerX + 100, y: centerY};
        case 2: // Medium (300px from center, diagonal)
            return {x: centerX + 212, y: centerY + 212};
        case 3: // Far (450px from center, bottom)
            return {x: centerX, y: centerY + 450};
        default:
            return {x: centerX, y: centerY};
    }
}
```

**Step 3: Add bot lifecycle functions**

Add spawn and cleanup functions:

```javascript
// Spawn test bots
function spawnTestBots(numBots) {
    testBots = {};

    for (let i = 1; i <= numBots; i++) {
        const botId = `bot-${i}`;
        const position = getBotSpawnPosition(i);
        const bot = createBot(botId, i, position);
        testBots[botId] = bot;

        // Initialize position in positions map
        positions[botId] = bot.position;

        console.log(`Spawned ${bot.name} at (${position.x}, ${position.y})`);
    }
}

// Remove all test bots
function removeTestBots() {
    Object.keys(testBots).forEach(botId => {
        stopBotAudio(botId);
        delete positions[botId];
        delete speakingStates[botId];
    });
    testBots = {};
    console.log('Removed all test bots');
}

// Stop audio for a specific bot
function stopBotAudio(botId) {
    const bot = testBots[botId];
    if (!bot) return;

    // Disconnect and cleanup audio nodes
    if (bot.gainNode) {
        bot.gainNode.disconnect();
        delete gainNodes[botId];
    }
    if (bot.analyzerNode) {
        bot.analyzerNode.disconnect();
        delete analyzerNodes[botId];
    }
    if (bot.audioSource) {
        if (bot.audioSource.stop) bot.audioSource.stop();
        if (bot.audioSource.disconnect) bot.audioSource.disconnect();
    }

    bot.audioSource = null;
    bot.gainNode = null;
    bot.analyzerNode = null;
    bot.audioType = 'silence';
}
```

**Step 4: Test bot state management**

Add temporary test code in browser console:

```javascript
// Test spawning
spawnTestBots(3);
console.log(testBots); // Should show 3 bots

// Test cleanup
removeTestBots();
console.log(testBots); // Should be empty
```

**Step 5: Commit**

```bash
git add index.html
git commit -m "feat: add bot state management

Implements bot data structures and lifecycle:
- createBot() factory function
- Bot spawn positions (near/medium/far)
- spawnTestBots() and removeTestBots()
- stopBotAudio() cleanup function
- Audio type cycle array

Task 2: Bot state management"
```

---

## Task 3: Implement Bot Rendering

**Files:**
- Modify: `/home/datawsl/sounds-of-stfu/.worktrees/poc-spatial-audio/index.html`

**Objective:** Render bots on canvas with labels and speaking indicators

**Step 1: Add bot rendering to draw() function**

Find the draw() function and add bot rendering after the regular user rendering:

```javascript
function draw() {
    // Clear canvas
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw hearing range circle around user
    if (myPeerId && positions[myPeerId]) {
        const myPos = positions[myPeerId];
        ctx.beginPath();
        ctx.arc(myPos.x, myPos.y, maxHearingRange, 0, Math.PI * 2);
        ctx.strokeStyle = '#4a9eff33';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    // Draw all participants (EXISTING CODE - keep as is)
    Object.keys(positions).forEach(peerId => {
        // Skip bots here, we'll render them separately
        if (testBots[peerId]) return;

        const pos = positions[peerId];
        const isMe = peerId === myPeerId;
        const isSpeaking = speakingStates[peerId];

        // ... existing user rendering code ...
    });

    // Draw test bots (NEW CODE - add after user rendering)
    Object.values(testBots).forEach(bot => {
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

        // Bot label (above)
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(bot.name, pos.x, pos.y - 28);

        // Audio type indicator (below)
        if (bot.audioType !== 'silence') {
            ctx.font = '9px sans-serif';
            ctx.fillStyle = '#aaaaaa';
            ctx.fillText(bot.audioType, pos.x, pos.y + 35);
        }
    });
}
```

**Step 2: Add click detection for bots**

Add helper function to detect bot clicks:

```javascript
// Check if click is on a bot
function getBotAtPosition(canvasX, canvasY) {
    const clickRadius = 25; // Slightly larger than bot visual radius

    for (const bot of Object.values(testBots)) {
        const dx = canvasX - bot.position.x;
        const dy = canvasY - bot.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= clickRadius) {
            return bot;
        }
    }
    return null;
}
```

**Step 3: Update canvas click handler to check for bots**

Modify existing canvas click handler to prioritize bot clicks:

```javascript
canvas.addEventListener('click', (e) => {
    if (!myPeerId) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicking on a bot
    const clickedBot = getBotAtPosition(x, y);
    if (clickedBot) {
        handleBotClick(clickedBot);
        return; // Don't move user if clicking a bot
    }

    // Regular click-to-move (existing code)
    myPosition = { x, y };
    positions[myPeerId] = myPosition;
    broadcastPosition();
    updateSpatialAudio();
    draw();
});

// Handle bot click (cycle audio or show demo mode message)
function handleBotClick(bot) {
    // Check if user is allowed to interact
    if (testModeState.active && myPeerId !== testModeState.hostPeerId) {
        // Demo mode: non-host clicked
        const hostName = participants[testModeState.hostPeerId]?.name || 'Unknown';
        updateStatus(`Demo controlled by ${hostName}`);
        return;
    }

    // Cycle to next audio type
    cycleBotAudio(bot.id);
}

// Cycle bot through audio types (placeholder for now)
function cycleBotAudio(botId) {
    const bot = testBots[botId];
    if (!bot) return;

    const currentIndex = AUDIO_TYPES.indexOf(bot.audioType);
    const nextIndex = (currentIndex + 1) % AUDIO_TYPES.length;
    bot.audioType = AUDIO_TYPES[nextIndex];

    console.log(`${bot.name} audio type: ${bot.audioType}`);
    draw(); // Redraw to show new audio type label
}
```

**Step 4: Test bot rendering**

Manual testing:
1. Open browser console
2. Run: `spawnTestBots(3)`
3. Verify 3 gray bots appear at different positions
4. Verify labels show "BOT 1 🤖", "BOT 2 🤖", "BOT 3 🤖"
5. Click each bot and verify console logs audio type cycling
6. Run: `removeTestBots()` and verify bots disappear

**Step 5: Commit**

```bash
git add index.html
git commit -m "feat: implement bot rendering on canvas

Adds visual rendering for test bots:
- Gray circles with white outline
- Bot labels (BOT X 🤖)
- Audio type indicator below bot
- Speaking indicators (pulsing rings)
- Click detection for bots
- Audio type cycling on click (UI only)

Task 3: Bot rendering"
```

---

## Task 4: Add Embedded Audio Clips

**Files:**
- Modify: `/home/datawsl/sounds-of-stfu/.worktrees/poc-spatial-audio/index.html`

**Objective:** Embed base64 audio clips for bots

**Step 1: Add placeholder audio data URLs**

Add this section after the AUDIO_TYPES constant:

```javascript
// Embedded audio clips (base64 data URLs)
// Note: These are placeholders - in real implementation, convert actual audio files to base64
const botAudioClips = {
    // Speech sample: "Testing, one, two, three" (~2 seconds)
    // Placeholder: short beep tone
    speech: 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=',

    // Ambient conversation: background chatter loop (~5 seconds)
    // Placeholder: white noise
    ambient: 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=',

    // Music loop: catchy melody (~10 seconds)
    // Placeholder: simple tone sequence
    music: 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=',

    // Sound effects: applause/laughter (~2 seconds)
    // Placeholder: short burst
    sfx: 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA='
};

// NOTE: These placeholders should be replaced with actual audio files converted to base64.
// To create real audio:
// 1. Record/find short audio clips (speech, ambient, music, sfx)
// 2. Convert to base64: `base64 -i audio.mp3` or use online converter
// 3. Replace placeholder strings above with: data:audio/mp3;base64,[base64string]
```

**Step 2: Add audio playback function**

Add function to play embedded audio:

```javascript
// Play embedded audio clip for bot
function playEmbeddedAudio(botId, audioType) {
    const bot = testBots[botId];
    if (!bot || !audioContext) return;

    // Stop current audio
    stopBotAudio(botId);

    // Get audio clip
    const audioDataURL = botAudioClips[audioType];
    if (!audioDataURL) {
        console.error(`No audio clip for type: ${audioType}`);
        return;
    }

    // Create audio element
    const audio = new Audio(audioDataURL);
    audio.loop = (audioType === 'ambient' || audioType === 'music'); // Loop ambient/music

    audio.onerror = (e) => {
        console.error(`Failed to load ${audioType} audio:`, e);
        // Skip to next audio type on error
        cycleBotAudio(botId);
    };

    // Create audio source from HTML audio element
    const audioSource = audioContext.createMediaElementSource(audio);

    // Create analyzer for speaking detection
    const analyzer = audioContext.createAnalyser();
    analyzer.fftSize = 256;
    analyzer.smoothingTimeConstant = 0.8;

    // Create gain node for spatial audio
    const gainNode = audioContext.createGain();
    gainNode.gain.value = 1.0;

    // Connect: source → analyzer → gain → destination
    audioSource.connect(analyzer);
    analyzer.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Store references
    bot.audioSource = audioSource;
    bot.gainNode = gainNode;
    bot.analyzerNode = analyzer;
    gainNodes[botId] = gainNode;
    analyzerNodes[botId] = analyzer;

    // Play audio
    audio.play().catch(err => {
        console.error(`Failed to play ${audioType}:`, err);
    });

    console.log(`Playing ${audioType} for ${bot.name}`);

    // Update spatial audio
    updateSpatialAudio();
}
```

**Step 3: Test embedded audio**

Manual testing:
1. Spawn bots: `spawnTestBots(3)`
2. Test audio: `playEmbeddedAudio('bot-1', 'speech')`
3. Verify audio plays (even if placeholder is silent/short)
4. Check console for errors
5. Test different types: `playEmbeddedAudio('bot-1', 'music')`

**Step 4: Commit**

```bash
git add index.html
git commit -m "feat: add embedded audio clip playback

Implements audio clip loading and playback:
- Base64 data URL placeholders for 4 audio types
- playEmbeddedAudio() function
- Audio element creation and routing
- Spatial audio integration (analyzer + gain nodes)
- Error handling for failed loads
- Looping for ambient/music types

Note: Placeholders need replacement with actual audio

Task 4: Embedded audio clips"
```

---

## Task 5: Implement Text-to-Speech

**Files:**
- Modify: `/home/datawsl/sounds-of-stfu/.worktrees/poc-spatial-audio/index.html`

**Objective:** Add Web Speech API text-to-speech for bots

**Step 1: Add TTS playback function**

Add TTS function after embedded audio function:

```javascript
// Play text-to-speech for bot
function playBotTTS(botId) {
    const bot = testBots[botId];
    if (!bot) return;

    // Check if Web Speech API is available
    if (!('speechSynthesis' in window)) {
        console.warn('Web Speech API not available');
        updateStatus('Text-to-speech not supported in this browser');
        // Skip TTS, cycle to next type
        cycleBotAudio(botId);
        return;
    }

    // Stop current audio
    stopBotAudio(botId);

    // Extract bot number from ID (bot-1 → 1)
    const botNumber = botId.split('-')[1];

    // Create utterance
    const utterance = new SpeechSynthesisUtterance(`Hello, I am Bot ${botNumber}`);
    utterance.rate = 0.9; // Slightly slower for clarity
    utterance.pitch = 1.0 + (parseInt(botNumber) * 0.1); // Vary pitch per bot
    utterance.volume = 1.0;

    // Note: TTS doesn't integrate with Web Audio API directly
    // It plays through system audio, not spatial audio pipeline
    // This is a known limitation of Web Speech API

    utterance.onend = () => {
        console.log(`TTS finished for ${bot.name}`);
        bot.audioType = 'silence';
        draw();
    };

    utterance.onerror = (e) => {
        console.error(`TTS error for ${bot.name}:`, e);
        cycleBotAudio(botId);
    };

    // Speak
    speechSynthesis.speak(utterance);

    console.log(`TTS started for ${bot.name}`);
}
```

**Step 2: Update cycleBotAudio to call appropriate function**

Modify cycleBotAudio to actually play audio:

```javascript
// Cycle bot through audio types
function cycleBotAudio(botId) {
    const bot = testBots[botId];
    if (!bot) return;

    const currentIndex = AUDIO_TYPES.indexOf(bot.audioType);
    const nextIndex = (currentIndex + 1) % AUDIO_TYPES.length;
    const nextType = AUDIO_TYPES[nextIndex];

    bot.audioType = nextType;

    console.log(`${bot.name} cycling to: ${nextType}`);

    // Play audio based on type
    switch(nextType) {
        case 'silence':
            stopBotAudio(botId);
            break;
        case 'speech':
            playEmbeddedAudio(botId, 'speech');
            break;
        case 'tts':
            playBotTTS(botId);
            break;
        case 'ambient':
            playEmbeddedAudio(botId, 'ambient');
            break;
        case 'music':
            playEmbeddedAudio(botId, 'music');
            break;
        case 'sfx':
            playEmbeddedAudio(botId, 'sfx');
            break;
    }

    draw(); // Update visual
}
```

**Step 3: Test text-to-speech**

Manual testing:
1. Spawn bots: `spawnTestBots(3)`
2. Set bot to TTS: `testBots['bot-1'].audioType = 'speech'` then `cycleBotAudio('bot-1')`
3. Verify TTS speaks "Hello, I am Bot 1"
4. Click bot multiple times to cycle through all types
5. Verify TTS works when reached in cycle

**Step 4: Commit**

```bash
git add index.html
git commit -m "feat: implement text-to-speech for bots

Adds Web Speech API integration:
- playBotTTS() function
- Browser capability check
- Per-bot voice variation (pitch)
- Error handling and fallback
- Integration with audio type cycling

Known limitation: TTS bypasses spatial audio

Task 5: Text-to-speech"
```

---

## Task 6: Implement Start Test Mode

**Files:**
- Modify: `/home/datawsl/sounds-of-stfu/.worktrees/poc-spatial-audio/index.html`

**Objective:** Wire up Start Test button to spawn bots and begin timer

**Step 1: Add Start Test event handler**

Add event listener for Start Test button:

```javascript
// Start Test Mode
startTestBtn.addEventListener('click', () => {
    if (!myPeerId) {
        updateStatus('Join a room first before starting test mode');
        return;
    }

    const numBots = parseInt(testBotCount.value);
    const duration = parseInt(testDuration.value);
    const movement = testMovement.value;

    console.log(`Starting test mode: ${numBots} bots, ${duration}s, ${movement} movement`);

    // Update state
    testModeState.active = true;
    testModeState.hostPeerId = myPeerId;
    testModeState.startTime = Date.now();
    testModeState.duration = duration;
    testModeState.movementMode = movement;
    testModeState.numBots = numBots;

    // Spawn bots
    spawnTestBots(numBots);

    // Update UI
    startTestBtn.style.display = 'none';
    stopTestBtn.style.display = 'inline-block';
    testTimer.style.display = 'block';

    // Show appropriate status
    const hasOtherUsers = Object.keys(participants).length > 1;
    if (hasOtherUsers) {
        // Demo mode
        demoModeStatus.style.display = 'block';
        testModeStatus.style.display = 'none';
    } else {
        // Solo test mode
        testModeStatus.style.display = 'block';
        demoModeStatus.style.display = 'none';
    }

    // Start timer
    startTestTimer(duration);

    // Broadcast test mode start to others (if any)
    broadcastTestModeStart();

    updateStatus(`Test mode started with ${numBots} bots`);
    draw();
});
```

**Step 2: Add timer function**

Add countdown timer implementation:

```javascript
// Start test mode countdown timer
function startTestTimer(durationSeconds) {
    const endTime = Date.now() + (durationSeconds * 1000);

    testTimerInterval = setInterval(() => {
        const remaining = Math.max(0, endTime - Date.now());
        const seconds = Math.floor(remaining / 1000);
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;

        testTimerValue.textContent = `${minutes}:${secs.toString().padStart(2, '0')}`;

        if (remaining <= 0) {
            clearInterval(testTimerInterval);
            testTimerInterval = null;
            endTestMode();
        }
    }, 100); // Update 10 times/second for smooth countdown
}
```

**Step 3: Add test mode end function**

Add graceful test mode ending with fade-out:

```javascript
// End test mode (timer expired)
function endTestMode() {
    console.log('Test mode timer expired, fading out...');

    // Fade out all bot audio over 2 seconds
    Object.values(testBots).forEach(bot => {
        if (bot.gainNode && bot.audioType !== 'silence') {
            const currentGain = bot.gainNode.gain.value;
            bot.gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 2);

            // After fade, stop audio and reset to silence
            setTimeout(() => {
                stopBotAudio(bot.id);
                bot.audioType = 'silence';
                draw();
            }, 2100);
        }
    });

    updateStatus('Test complete (audio fading out...)');

    // Bots remain visible but silent
    // User can click "Stop Test" to remove them
}
```

**Step 4: Add Stop Test handler**

Add manual stop functionality:

```javascript
// Stop Test Mode
stopTestBtn.addEventListener('click', () => {
    stopTestMode();
});

function stopTestMode() {
    console.log('Stopping test mode');

    // Stop timer
    if (testTimerInterval) {
        clearInterval(testTimerInterval);
        testTimerInterval = null;
    }

    // Remove all bots
    removeTestBots();

    // Update state
    testModeState.active = false;
    testModeState.hostPeerId = null;

    // Update UI
    startTestBtn.style.display = 'inline-block';
    stopTestBtn.style.display = 'none';
    testTimer.style.display = 'none';
    testModeStatus.style.display = 'none';
    demoModeStatus.style.display = 'none';

    // Broadcast stop to others
    broadcastTestModeStop();

    updateStatus('Test mode stopped');
    draw();
}
```

**Step 5: Add placeholder broadcast functions**

Add empty broadcast functions (will implement in next task):

```javascript
// Broadcast test mode start to all peers
function broadcastTestModeStart() {
    if (!currentRoom) return;

    const message = {
        type: 'test_mode',
        action: 'start',
        hostPeerId: myPeerId,
        numBots: testModeState.numBots,
        duration: testModeState.duration,
        movementMode: testModeState.movementMode,
        bots: Object.values(testBots).map(bot => ({
            id: bot.id,
            position: bot.position,
            audioType: bot.audioType,
            pattern: bot.pattern
        }))
    };

    // Broadcast to all connections
    Object.values(connections).forEach(conn => {
        if (conn.conn && conn.conn.open) {
            conn.conn.send(message);
        }
    });

    console.log('Broadcast test mode start:', message);
}

// Broadcast test mode stop
function broadcastTestModeStop() {
    if (!currentRoom) return;

    const message = {
        type: 'test_mode',
        action: 'stop',
        hostPeerId: myPeerId
    };

    Object.values(connections).forEach(conn => {
        if (conn.conn && conn.conn.open) {
            conn.conn.send(message);
        }
    });

    console.log('Broadcast test mode stop');
}
```

**Step 6: Test start/stop**

Manual testing:
1. Join a room
2. Click "Test Mode" to open panel
3. Set bots to 3, duration to 30 seconds
4. Click "Start Test"
5. Verify 3 bots spawn
6. Verify timer counts down
7. Click bots to cycle audio
8. Wait for timer to expire, verify fade-out
9. Restart test and click "Stop Test", verify immediate cleanup

**Step 7: Commit**

```bash
git add index.html
git commit -m "feat: implement start/stop test mode

Adds test mode activation and lifecycle:
- Start Test button handler
- Bot spawning on start
- Countdown timer with display
- Graceful fade-out on timer expiry
- Manual stop with immediate cleanup
- UI state management (buttons, status)
- Placeholder broadcast functions

Task 6: Start/stop test mode"
```

---

## Task 7: Implement Pattern Movement

**Files:**
- Modify: `/home/datawsl/sounds-of-stfu/.worktrees/poc-spatial-audio/index.html`

**Objective:** Add movement patterns for bots when pattern mode enabled

**Step 1: Add bot movement update function**

Add function to update bot positions based on patterns:

```javascript
// Update bot positions based on movement patterns
function updateTestBots() {
    if (!testModeState.active || testModeState.movementMode !== 'patterns') return;

    const time = Date.now() / 1000; // Convert to seconds

    Object.values(testBots).forEach(bot => {
        if (bot.isDragging) return; // Skip bots being dragged

        const center = bot.patternCenter;

        switch (bot.pattern) {
            case 'circle':
                // Circular path: radius 100px, 20 seconds per loop
                bot.position.x = center.x + 100 * Math.cos(time * Math.PI / 10);
                bot.position.y = center.y + 100 * Math.sin(time * Math.PI / 10);
                break;

            case 'figure8':
                // Figure-8 pattern (Lissajous curve)
                bot.position.x = center.x + 150 * Math.sin(time * Math.PI / 10);
                bot.position.y = center.y + 75 * Math.sin(time * Math.PI / 5);
                break;

            case 'linear':
                // Back-and-forth horizontal
                bot.position.x = center.x + 150 * Math.sin(time * Math.PI / 10);
                bot.position.y = center.y;
                break;
        }

        // Bound to canvas
        bot.position.x = Math.max(20, Math.min(canvas.width - 20, bot.position.x));
        bot.position.y = Math.max(20, Math.min(canvas.height - 20, bot.position.y));

        // Update positions map
        positions[bot.id] = bot.position;
    });

    // Update spatial audio based on new positions
    updateSpatialAudio();
}
```

**Step 2: Integrate into animation loop**

Find the animate() function and add updateTestBots() call:

```javascript
function animate() {
    handleKeyboardMovement();
    updateSpeakingStates();
    updateTestBots(); // <-- Add this line
    draw();
    requestAnimationFrame(animate);
}
```

**Step 3: Add position broadcasting for pattern movement**

Add throttled position broadcast in updateTestBots():

```javascript
// Update bot positions based on movement patterns
function updateTestBots() {
    if (!testModeState.active || testModeState.movementMode !== 'patterns') return;

    const time = Date.now() / 1000;
    let positionsChanged = false;

    Object.values(testBots).forEach(bot => {
        if (bot.isDragging) return;

        const oldX = bot.position.x;
        const oldY = bot.position.y;

        const center = bot.patternCenter;

        switch (bot.pattern) {
            case 'circle':
                bot.position.x = center.x + 100 * Math.cos(time * Math.PI / 10);
                bot.position.y = center.y + 100 * Math.sin(time * Math.PI / 10);
                break;
            case 'figure8':
                bot.position.x = center.x + 150 * Math.sin(time * Math.PI / 10);
                bot.position.y = center.y + 75 * Math.sin(time * Math.PI / 5);
                break;
            case 'linear':
                bot.position.x = center.x + 150 * Math.sin(time * Math.PI / 10);
                bot.position.y = center.y;
                break;
        }

        bot.position.x = Math.max(20, Math.min(canvas.width - 20, bot.position.x));
        bot.position.y = Math.max(20, Math.min(canvas.height - 20, bot.position.y));

        if (Math.abs(bot.position.x - oldX) > 1 || Math.abs(bot.position.y - oldY) > 1) {
            positionsChanged = true;
            positions[bot.id] = bot.position;
        }
    });

    // Broadcast position updates (throttled to ~10/second)
    if (positionsChanged && myPeerId === testModeState.hostPeerId) {
        const now = Date.now();
        if (!updateTestBots.lastBroadcast || now - updateTestBots.lastBroadcast > 100) {
            broadcastBotPositions();
            updateTestBots.lastBroadcast = now;
        }
    }

    if (positionsChanged) {
        updateSpatialAudio();
    }
}
```

**Step 4: Add bot position broadcast function**

Add broadcast function for bot positions:

```javascript
// Broadcast bot positions to all peers
function broadcastBotPositions() {
    if (!currentRoom || !testModeState.active) return;

    const message = {
        type: 'bot_positions',
        bots: Object.values(testBots).map(bot => ({
            id: bot.id,
            x: Math.round(bot.position.x),
            y: Math.round(bot.position.y)
        }))
    };

    Object.values(connections).forEach(conn => {
        if (conn.conn && conn.conn.open) {
            conn.conn.send(message);
        }
    });
}
```

**Step 5: Test pattern movement**

Manual testing:
1. Start test mode with 3 bots
2. Select "Patterns" from movement dropdown before starting
3. Observe Bot 1 moving in circle
4. Observe Bot 2 moving in figure-8
5. Observe Bot 3 moving back-and-forth
6. Verify spatial audio volume changes as bots move
7. Verify bots stay within canvas bounds

**Step 6: Commit**

```bash
git add index.html
git commit -m "feat: implement pattern movement for bots

Adds dynamic bot movement patterns:
- updateTestBots() function in animation loop
- Circle pattern (Bot 1): 100px radius, 20s period
- Figure-8 pattern (Bot 2): Lissajous curve
- Linear pattern (Bot 3): horizontal back-and-forth
- Canvas boundary clamping
- Throttled position broadcasting (10/second)
- Spatial audio updates on movement

Task 7: Pattern movement"
```

---

## Task 8: Implement Manual Drag for Bots

**Files:**
- Modify: `/home/datawsl/sounds-of-stfu/.worktrees/poc-spatial-audio/index.html`

**Objective:** Allow users to drag bots to specific positions

**Step 1: Add drag state variables**

Add drag tracking variables after testModeState:

```javascript
// Drag state
let draggedBot = null;
let dragOffset = { x: 0, y: 0 };
```

**Step 2: Add mousedown handler for drag start**

Add canvas mousedown event:

```javascript
canvas.addEventListener('mousedown', (e) => {
    if (!myPeerId) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicking on a bot
    const clickedBot = getBotAtPosition(x, y);
    if (clickedBot) {
        // Check if user can interact with bots
        if (testModeState.active && myPeerId !== testModeState.hostPeerId) {
            // Demo mode: non-host cannot drag
            const hostName = participants[testModeState.hostPeerId]?.name || 'Unknown';
            updateStatus(`Demo controlled by ${hostName}`);
            return;
        }

        // Start dragging
        draggedBot = clickedBot;
        draggedBot.isDragging = true;
        dragOffset.x = clickedBot.position.x - x;
        dragOffset.y = clickedBot.position.y - y;

        console.log(`Started dragging ${clickedBot.name}`);
        e.preventDefault();
    }
});
```

**Step 3: Add mousemove handler for dragging**

Add canvas mousemove event:

```javascript
canvas.addEventListener('mousemove', (e) => {
    if (!draggedBot) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Update bot position
    draggedBot.position.x = Math.max(20, Math.min(canvas.width - 20, x + dragOffset.x));
    draggedBot.position.y = Math.max(20, Math.min(canvas.height - 20, y + dragOffset.y));

    // Update positions map
    positions[draggedBot.id] = draggedBot.position;

    // Update spatial audio
    updateSpatialAudio();

    // Redraw
    draw();
});
```

**Step 4: Add mouseup handler for drag end**

Add canvas mouseup and mouseleave events:

```javascript
canvas.addEventListener('mouseup', (e) => {
    if (!draggedBot) return;

    console.log(`Stopped dragging ${draggedBot.name} at (${Math.round(draggedBot.position.x)}, ${Math.round(draggedBot.position.y)})`);

    // Update pattern center if in pattern mode
    if (testModeState.movementMode === 'patterns') {
        draggedBot.patternCenter = {...draggedBot.position};
    }

    // Broadcast final position
    if (myPeerId === testModeState.hostPeerId) {
        broadcastBotState(draggedBot.id);
    }

    draggedBot.isDragging = false;
    draggedBot = null;
});

canvas.addEventListener('mouseleave', (e) => {
    if (draggedBot) {
        draggedBot.isDragging = false;
        draggedBot = null;
    }
});
```

**Step 5: Add bot state broadcast function**

Add function to broadcast individual bot state:

```javascript
// Broadcast single bot state change
function broadcastBotState(botId) {
    const bot = testBots[botId];
    if (!bot || !currentRoom) return;

    const message = {
        type: 'bot_state',
        botId: botId,
        position: {
            x: Math.round(bot.position.x),
            y: Math.round(bot.position.y)
        },
        audioType: bot.audioType,
        timestamp: Date.now()
    };

    Object.values(connections).forEach(conn => {
        if (conn.conn && conn.conn.open) {
            conn.conn.send(message);
        }
    });

    console.log('Broadcast bot state:', message);
}
```

**Step 6: Update handleBotClick to broadcast audio changes**

Modify cycleBotAudio to broadcast state:

```javascript
// Cycle bot through audio types
function cycleBotAudio(botId) {
    const bot = testBots[botId];
    if (!bot) return;

    const currentIndex = AUDIO_TYPES.indexOf(bot.audioType);
    const nextIndex = (currentIndex + 1) % AUDIO_TYPES.length;
    const nextType = AUDIO_TYPES[nextIndex];

    bot.audioType = nextType;

    console.log(`${bot.name} cycling to: ${nextType}`);

    // Play audio based on type
    switch(nextType) {
        case 'silence':
            stopBotAudio(botId);
            break;
        case 'speech':
            playEmbeddedAudio(botId, 'speech');
            break;
        case 'tts':
            playBotTTS(botId);
            break;
        case 'ambient':
            playEmbeddedAudio(botId, 'ambient');
            break;
        case 'music':
            playEmbeddedAudio(botId, 'music');
            break;
        case 'sfx':
            playEmbeddedAudio(botId, 'sfx');
            break;
    }

    // Broadcast state change if host
    if (testModeState.active && myPeerId === testModeState.hostPeerId) {
        broadcastBotState(botId);
    }

    draw();
}
```

**Step 7: Test manual drag**

Manual testing:
1. Start test mode
2. Click and hold Bot 1
3. Drag to new position
4. Release and verify bot stays
5. In pattern mode: drag bot and verify pattern resumes from new center
6. Verify spatial audio updates during drag

**Step 8: Commit**

```bash
git add index.html
git commit -m "feat: implement manual drag for bots

Adds click-and-drag bot positioning:
- mousedown/mousemove/mouseup handlers
- Drag state tracking
- Canvas boundary clamping during drag
- Pattern center update on drag release
- Spatial audio real-time updates
- State broadcasting for demo mode sync

Task 8: Manual drag"
```

---

## Task 9: Implement Demo Mode Sync

**Files:**
- Modify: `/home/datawsl/sounds-of-stfu/.worktrees/poc-spatial-audio/index.html`

**Objective:** Synchronize bot state across all clients in demo mode

**Step 1: Add message handlers for bot sync**

Find handleDataMessage function and add bot-related message handlers:

```javascript
function handleDataMessage(data, fromPeer) {
    console.log('Received data:', data, 'from:', fromPeer);

    // ... existing handlers for hello, participants, new_participant, position ...

    // NEW: Handle test mode start
    if (data.type === 'test_mode' && data.action === 'start') {
        handleTestModeStart(data, fromPeer);
        return;
    }

    // NEW: Handle test mode stop
    if (data.type === 'test_mode' && data.action === 'stop') {
        handleTestModeStop(data, fromPeer);
        return;
    }

    // NEW: Handle bot state update
    if (data.type === 'bot_state') {
        handleBotStateUpdate(data);
        return;
    }

    // NEW: Handle bot positions update
    if (data.type === 'bot_positions') {
        handleBotPositionsUpdate(data);
        return;
    }
}
```

**Step 2: Implement test mode start handler**

Add handler for receiving test mode start:

```javascript
// Handle receiving test mode start from host
function handleTestModeStart(data, hostPeerId) {
    console.log('Received test mode start from', hostPeerId);

    // Update state
    testModeState.active = true;
    testModeState.hostPeerId = hostPeerId;
    testModeState.numBots = data.numBots;
    testModeState.duration = data.duration;
    testModeState.movementMode = data.movementMode;
    testModeState.startTime = Date.now();

    // Spawn bots with received state
    testBots = {};
    data.bots.forEach((botData, index) => {
        const botNumber = index + 1;
        const bot = createBot(botData.id, botNumber, botData.position);
        bot.audioType = botData.audioType;
        bot.pattern = botData.pattern;
        testBots[botData.id] = bot;
        positions[botData.id] = bot.position;
    });

    // Update UI for demo mode (non-host)
    testModePanel.style.display = 'block';
    startTestBtn.style.display = 'none';
    stopTestBtn.style.display = 'none'; // Non-host can't stop
    testTimer.style.display = 'block';
    demoModeStatus.style.display = 'block';
    testModeStatus.style.display = 'none';

    const hostName = participants[hostPeerId]?.name || 'Unknown';
    demoHostName.textContent = hostName;

    // Start timer
    startTestTimer(data.duration);

    updateStatus(`Demo mode started by ${hostName}`);
    draw();
}
```

**Step 3: Implement test mode stop handler**

Add handler for receiving test mode stop:

```javascript
// Handle receiving test mode stop from host
function handleTestModeStop(data, hostPeerId) {
    console.log('Received test mode stop from', hostPeerId);

    // Remove bots
    removeTestBots();

    // Stop timer
    if (testTimerInterval) {
        clearInterval(testTimerInterval);
        testTimerInterval = null;
    }

    // Update state
    testModeState.active = false;
    testModeState.hostPeerId = null;

    // Update UI
    testTimer.style.display = 'none';
    demoModeStatus.style.display = 'none';
    testModePanel.style.display = 'none';

    updateStatus('Demo mode ended');
    draw();
}
```

**Step 4: Implement bot state update handler**

Add handler for individual bot state changes:

```javascript
// Handle bot state update (audio type or position)
function handleBotStateUpdate(data) {
    const bot = testBots[data.botId];
    if (!bot) return;

    console.log(`Bot state update: ${data.botId} → ${data.audioType}`);

    // Update position
    if (data.position) {
        bot.position.x = data.position.x;
        bot.position.y = data.position.y;
        positions[data.botId] = bot.position;
    }

    // Update audio type if changed
    if (data.audioType && data.audioType !== bot.audioType) {
        bot.audioType = data.audioType;

        // Play corresponding audio
        switch(data.audioType) {
            case 'silence':
                stopBotAudio(data.botId);
                break;
            case 'speech':
                playEmbeddedAudio(data.botId, 'speech');
                break;
            case 'tts':
                playBotTTS(data.botId);
                break;
            case 'ambient':
                playEmbeddedAudio(data.botId, 'ambient');
                break;
            case 'music':
                playEmbeddedAudio(data.botId, 'music');
                break;
            case 'sfx':
                playEmbeddedAudio(data.botId, 'sfx');
                break;
        }
    }

    updateSpatialAudio();
    draw();
}
```

**Step 5: Implement bot positions update handler**

Add handler for bulk position updates:

```javascript
// Handle bot positions update (for pattern movement)
function handleBotPositionsUpdate(data) {
    data.bots.forEach(botData => {
        const bot = testBots[botData.id];
        if (bot && !bot.isDragging) {
            bot.position.x = botData.x;
            bot.position.y = botData.y;
            positions[botData.id] = bot.position;
        }
    });

    updateSpatialAudio();
}
```

**Step 6: Add host disconnect handling**

Modify existing peer disconnect handler to end test mode if host leaves:

Find the peer disconnect handler and add:

```javascript
peer.on('disconnected', (disconnectedPeerId) => {
    // ... existing disconnect logic ...

    // NEW: Check if test mode host disconnected
    if (testModeState.active && disconnectedPeerId === testModeState.hostPeerId) {
        console.log('Test mode host disconnected, ending test mode');

        // Stop timer
        if (testTimerInterval) {
            clearInterval(testTimerInterval);
            testTimerInterval = null;
        }

        // Remove bots
        removeTestBots();

        // Update state
        testModeState.active = false;
        testModeState.hostPeerId = null;

        // Update UI
        testTimer.style.display = 'none';
        demoModeStatus.style.display = 'none';
        testModePanel.style.display = 'none';

        updateStatus('Demo mode ended (host disconnected)');
        draw();
    }
});
```

**Step 7: Test demo mode sync**

Manual testing (requires 2 browser windows):
1. Window 1: Join room "test123"
2. Window 2: Join same room
3. Window 1: Start test mode with 3 bots
4. Window 2: Verify demo mode UI appears
5. Window 1: Click bot to cycle audio
6. Window 2: Verify bot audio changes
7. Window 1: Drag bot to new position
8. Window 2: Verify bot moves
9. Window 1: Close/refresh
10. Window 2: Verify test mode ends

**Step 8: Commit**

```bash
git add index.html
git commit -m "feat: implement demo mode synchronization

Adds multi-user bot state sync:
- handleTestModeStart(): Receive test mode from host
- handleTestModeStop(): Receive stop from host
- handleBotStateUpdate(): Sync individual bot changes
- handleBotPositionsUpdate(): Sync pattern movement
- Host disconnect detection ends demo mode
- Demo mode UI for non-host users
- Audio playback on remote clients

Task 9: Demo mode sync"
```

---

## Task 10: Update Instructions and Polish

**Files:**
- Modify: `/home/datawsl/sounds-of-stfu/.worktrees/poc-spatial-audio/index.html`

**Objective:** Update instructions to mention test mode and add final polish

**Step 1: Update instructions section**

Find the instructions div and update to mention test mode:

```html
<div id="instructions" style="padding: 20px; background: #2a2a2a; border-radius: 8px; margin-bottom: 20px;">
    <h3 style="margin-top: 0;">How to Use:</h3>
    <ol style="line-height: 1.8;">
        <li>Enter a room code (create new or join existing room)</li>
        <li>Click "Join Room" and allow microphone access</li>
        <li><strong>Use WASD or arrow keys to move, or click anywhere on the canvas</strong></li>
        <li>Get close to others to hear them clearly</li>
        <li>Move away to reduce their volume</li>
        <li>Adjust "Hearing Range" and "Falloff Curve" sliders to tune spatial audio</li>
        <li><strong>Click "Test Mode" to spawn AI bots for solo testing</strong></li>
        <li>Pulsing ring = someone is speaking</li>
    </ol>
    <p style="margin-top: 15px; padding: 10px; background: #3a3a3a; border-radius: 4px; margin-bottom: 0;">
        <strong>Tip:</strong> The light blue circle around you shows your hearing range.
        Move within that range to have a conversation. Adjust the sliders to experiment with different spatial audio settings.
        <strong>Test Mode lets you spawn bots to test audio without needing multiple people - click bots to cycle through different audio types!</strong>
    </p>
</div>
```

**Step 2: Add keyboard shortcut for test mode toggle**

Add keyboard shortcut (T key) to toggle test mode panel:

```javascript
document.addEventListener('keydown', (e) => {
    // ... existing keyboard movement code ...

    // Toggle test mode panel with 'T' key
    if (e.key.toLowerCase() === 't' && !e.ctrlKey && !e.metaKey) {
        if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'SELECT') {
            testModeToggle.click();
            e.preventDefault();
        }
    }
});
```

**Step 3: Add visual cursor indicator when hovering over bots**

Add cursor style change on hover:

```javascript
canvas.addEventListener('mousemove', (e) => {
    // ... existing drag code ...

    // If not dragging, check if hovering over bot
    if (!draggedBot) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const hoveredBot = getBotAtPosition(x, y);
        canvas.style.cursor = hoveredBot ? 'pointer' : 'default';
    }
});
```

**Step 4: Add console log summary on test mode start**

Update startTestBtn handler to log summary:

```javascript
startTestBtn.addEventListener('click', () => {
    // ... existing code ...

    console.log('=== Test Mode Started ===');
    console.log(`Bots: ${numBots}`);
    console.log(`Duration: ${duration}s`);
    console.log(`Movement: ${movement}`);
    console.log('Audio types: silence → speech → tts → ambient → music → sfx');
    console.log('Click bots to cycle audio types');
    console.log('Drag bots to reposition');
    console.log('========================');

    // ... rest of existing code ...
});
```

**Step 5: Test final polish**

Manual testing:
1. Verify instructions mention test mode
2. Press 'T' key to toggle test mode panel
3. Hover over bot and verify cursor changes to pointer
4. Start test mode and check console for summary
5. Verify all features work together

**Step 6: Commit**

```bash
git add index.html
git commit -m "feat: update instructions and add polish

Final UI improvements:
- Updated instructions to mention test mode
- Added test mode tip in instructions
- Keyboard shortcut: 'T' key toggles test mode panel
- Cursor changes to pointer when hovering over bots
- Console log summary on test mode start

Task 10: Instructions and polish"
```

---

## Task 11: Update README Documentation

**Files:**
- Modify: `/home/datawsl/sounds-of-stfu/.worktrees/poc-spatial-audio/README.md`

**Objective:** Document test mode feature in README

**Step 1: Add Test Mode section to README**

Find the "Features Implemented" section and add test mode:

```markdown
## Features Implemented

This POC successfully demonstrates:

- ✅ **Peer-to-peer audio** - WebRTC mesh networking via PeerJS for direct audio connections
- ✅ **Room-based multi-user support** - 5-8 concurrent users can join the same room
- ✅ **Distance-based volume mixing** - Spatial audio with adjustable hearing range (100-500px)
- ✅ **Flexible movement controls** - Click-to-move OR WASD/arrow keys for smooth movement
- ✅ **Visual speaking indicators** - Pulsing rings show who is talking in real-time
- ✅ **Adjustable hearing range** - Slider to control maximum hearing distance
- ✅ **Adjustable falloff curve** - Slider to tune how volume decreases with distance (0.5-3.0)
- ✅ **Mute/unmute functionality** - Toggle microphone on/off
- ✅ **Real-time status updates** - Shows nearest peer distance and volume percentage
- ✅ **Connection state indicators** - Clear visual feedback on connection status
- ✅ **Clean disconnection handling** - Graceful cleanup when users leave
- ✅ **Test Mode with AI Bots** - Spawn 1-3 bots for solo testing without multiple devices
```

**Step 2: Add Test Mode usage section**

Add new section after "How to Use":

```markdown
## Test Mode (Solo Testing)

Test mode allows you to evaluate spatial audio without needing multiple people or devices by spawning AI-controlled bots.

### Activating Test Mode

1. Join a room (or create a new one)
2. Click "Test Mode" button (or press 'T' key)
3. Configure settings:
   - **Number of Bots**: 1-3 bots
   - **Duration**: 30 seconds to 5 minutes
   - **Movement**: Stationary or Patterns
4. Click "Start Test"

### Interacting with Bots

**Bot Positions:**
- Bot 1: Near (150px from center) - tests close proximity
- Bot 2: Medium (300px diagonal) - tests mid-range
- Bot 3: Far (450px away) - tests max hearing range

**Audio Types (click bot to cycle):**
1. **Silence** - Off
2. **Speech** - Pre-recorded voice sample
3. **Text-to-Speech** - "Hello, I am Bot X"
4. **Ambient** - Background conversation sounds
5. **Music** - Looping melody
6. **Sound Effects** - Applause/laughter

**Movement Modes:**
- **Stationary**: Bots stay in fixed positions
- **Patterns**:
  - Bot 1 moves in circle
  - Bot 2 moves in figure-8
  - Bot 3 moves back-and-forth
- **Manual Drag**: Click and drag any bot to reposition

### Demo Mode (Multi-User)

When other users join while test mode is active, it automatically becomes "demo mode":
- Host controls bots (can click and drag)
- Others observe in real-time
- Bot state syncs across all clients
- Host name displayed in status

### Test Mode Completion

- Timer counts down visibly
- When time expires: bots fade out gracefully over 2-3 seconds
- Bots remain visible but silent
- Click "Stop Test" to remove bots immediately

### Use Cases

**Solo Testing:**
- Test spatial audio without multiple devices
- Verify audio quality and volume falloff
- Test network performance with multiple audio sources
- Practice movement and controls

**Demonstrations:**
- Show spatial audio to stakeholders
- Let others hear different audio types
- Demonstrate dynamic movement patterns
- Test multi-user scenarios with bots + real users
```

**Step 3: Update Known Limitations section**

Add test mode limitations:

```markdown
## Known Limitations

### Test Mode Specific

11. **No mobile test mode** - Test mode designed for desktop browsers
12. **TTS bypasses spatial audio** - Web Speech API doesn't integrate with Web Audio API
13. **Placeholder audio** - Embedded audio clips are short placeholders (need real audio)
14. **Host disconnect** - Demo mode ends if host leaves (no host migration)
```

**Step 4: Add test mode to troubleshooting**

Add test mode section to troubleshooting:

```markdown
## Troubleshooting

### Test Mode Issues

**Bots don't make sound:**
- Check browser console for audio loading errors
- Some audio types are placeholders (very short/silent)
- Click bot multiple times to cycle to different audio type
- TTS may not be supported in your browser

**Bots don't move in pattern mode:**
- Verify "Movement" is set to "Patterns" not "Stationary"
- Check browser console for JavaScript errors
- Refresh page and try again

**Demo mode not syncing:**
- Verify both users are in the same room
- Check network connection (data channel required)
- Refresh both browsers and rejoin room

**Can't interact with bots:**
- In demo mode, only host can interact with bots
- Check if you're the host (your status shows "You are controlling")
- If not host, you can only observe
```

**Step 5: Update testing checklist**

Add test mode testing items:

```markdown
## Testing Checklist

### Test Mode Testing (7 items)

- [ ] **Solo spawn**: Can spawn 1-3 bots in empty room
- [ ] **Audio cycling**: Can click bot to cycle through all 6 audio types
- [ ] **Stationary mode**: Bots stay in fixed positions
- [ ] **Pattern mode**: Bots move in predictable patterns
- [ ] **Manual drag**: Can drag bots to specific positions
- [ ] **Timer**: Countdown timer works, bots fade out at end
- [ ] **Stop button**: Can manually stop test mode and remove bots

### Demo Mode Testing (5 items)

- [ ] **Auto-switch**: Test mode becomes demo mode when others join
- [ ] **Host control**: Only host can click/drag bots
- [ ] **State sync**: Bot positions and audio sync to all users
- [ ] **Audio playback**: Non-host users hear bot audio
- [ ] **Host disconnect**: Demo ends when host leaves
```

**Step 6: Add test mode to Next Steps**

Update next steps section:

```markdown
## Next Steps / Future Improvements

### Immediate (v1.1)

1. **Replace placeholder audio** - Record/find actual audio clips for all types
2. **News anchor bot** - Dedicated bot that reads RSS feeds
3. **Per-bot movement controls** - Toggle stationary/moving for each bot
4. **Bot follow/avoid** - AI behavior patterns
5. **Host migration** - Transfer demo mode control if host leaves
...
```

**Step 7: Test documentation**

Review README:
1. Verify test mode is prominently featured
2. Check all instructions are clear
3. Verify troubleshooting covers common issues
4. Ensure testing checklist is comprehensive

**Step 8: Commit**

```bash
git add README.md
git commit -m "docs: add test mode documentation to README

Comprehensive test mode documentation:
- Added to Features Implemented list
- New Test Mode section with usage guide
- Demo mode explanation
- Bot interaction instructions
- Audio types and movement modes
- Test mode limitations
- Troubleshooting for test mode issues
- Testing checklist items (12 new tests)

Task 11: README documentation"
```

---

## Final Testing & Validation

**Comprehensive Test Scenario:**

1. **Solo Test Mode:**
   - Join room "test-solo"
   - Open test mode panel
   - Start with 3 bots, 2 minutes, stationary
   - Click each bot through all audio types
   - Verify spatial audio (move close/far)
   - Switch to pattern mode mid-test
   - Drag bots to new positions
   - Wait for timer to expire, verify fade-out

2. **Demo Mode (2 windows):**
   - Window 1: Join "test-demo"
   - Window 2: Join "test-demo"
   - Window 1: Start test mode
   - Window 2: Verify demo mode UI
   - Window 1: Click bot, drag bot
   - Window 2: Verify audio plays, position syncs
   - Window 1: Stop test
   - Window 2: Verify bots disappear

3. **Edge Cases:**
   - Start test, refresh page (cleanup?)
   - Start test, close tab (others handle host disconnect?)
   - Multiple audio types playing simultaneously
   - Rapid bot clicking (audio switching)
   - Dragging bot during pattern movement

**Final Commit:**

```bash
git add .
git commit -m "feat: test mode v1.1 complete

Complete test mode implementation with:
- Solo testing: 1-3 AI bots with 6 audio types
- Demo mode: Multi-user synchronized bot control
- Movement: Stationary, patterns, manual drag
- Audio: Embedded clips + text-to-speech
- UI: Test panel, timer, status indicators
- Sync: Data channel protocol for bot state
- Polish: Instructions, keyboard shortcuts, cursor

Estimated: 2-3 days implementation
Actual tasks: 11 tasks completed
Total additions: ~400-500 lines
Audio size: ~20-30KB embedded

Ready for user testing and feedback collection."
```

---

## Notes for Future Improvements

**Deferred to v1.2+:**
- Replace placeholder audio with real recordings
- Per-bot movement toggles
- Follow/avoid AI behavior
- News anchor bot (separate feature)
- Host migration on disconnect
- Mobile-optimized test mode
- Better TTS spatial audio integration

**Known Technical Debt:**
- TTS doesn't use spatial audio pipeline
- Placeholder audio clips need replacement
- No automated tests (manual testing only)
- Pattern movement could be smoother (higher update rate)

---

**Plan saved to:** `docs/plans/2025-12-23-test-mode-implementation.md`
