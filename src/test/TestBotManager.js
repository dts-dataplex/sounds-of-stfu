/**
 * TestBotManager - Manages simulated bot conversations for testing
 *
 * Creates 3 groups of 3 bots each in different zones with varying
 * sentiment levels to demonstrate spatial audio and sentiment analysis.
 * Bots speak using text-to-speech with spatial audio based on distance.
 */

/* global SpeechSynthesisUtterance */

import * as THREE from 'three';

// Conversation scripts for each group
const CONVERSATIONS = {
  // Group 1: Gaming Zone - Excited/Positive conversation
  gaming: {
    zone: 'Gaming Zone',
    basePosition: { x: 8, y: 0, z: 7 },
    bots: [
      { name: 'Alex', color: 0x4488ff, offset: { x: 0, y: 0, z: 0 } },
      { name: 'Jordan', color: 0x44ff88, offset: { x: 2, y: 0, z: 1 } },
      { name: 'Casey', color: 0xff8844, offset: { x: 1, y: 0, z: 2 } },
    ],
    messages: [
      { speaker: 'Alex', text: "This new game is absolutely incredible! The graphics are stunning!", delay: 0 },
      { speaker: 'Jordan', text: "I know right? I've been playing for hours and I can't stop!", delay: 4000 },
      { speaker: 'Casey', text: "The multiplayer mode is so much fun with friends!", delay: 8000 },
      { speaker: 'Alex', text: "We should definitely team up later, it would be amazing!", delay: 12000 },
      { speaker: 'Jordan', text: "Yes! I love how smooth the controls feel. Best game this year!", delay: 16000 },
      { speaker: 'Casey', text: "The soundtrack is phenomenal too. I've been listening to it all week!", delay: 20000 },
      { speaker: 'Alex', text: "Have you tried the new expansion? It's even better than the base game!", delay: 25000 },
      { speaker: 'Jordan', text: "Not yet but I'm so excited to try it! Everyone says it's fantastic!", delay: 29000 },
      { speaker: 'Casey', text: "The story mode made me so happy. What a wonderful experience!", delay: 33000 },
      { speaker: 'Alex', text: "I can't wait for the next update. The developers are amazing!", delay: 38000 },
      { speaker: 'Jordan', text: "They really listen to the community. Such a great team!", delay: 42000 },
      { speaker: 'Casey', text: "This is the most fun I've had gaming in years!", delay: 46000 },
      { speaker: 'Alex', text: "Let's play another round! I'm having such a great time!", delay: 51000 },
      { speaker: 'Jordan', text: "Absolutely! This is the best gaming session ever!", delay: 55000 },
      { speaker: 'Casey', text: "I love hanging out with you all. Gaming nights are the best!", delay: 59000 },
      { speaker: 'Alex', text: "We should do this more often. So much fun!", delay: 64000 },
      { speaker: 'Jordan', text: "Agreed! Nothing beats good games with good friends!", delay: 68000 },
      { speaker: 'Casey', text: "Here's to many more amazing gaming sessions!", delay: 72000 },
      { speaker: 'Alex', text: "The community around this game is so positive and welcoming!", delay: 77000 },
      { speaker: 'Jordan', text: "That's what makes it special. Everyone is so friendly!", delay: 81000 },
      { speaker: 'Casey', text: "I'm grateful we found this game. It brought us together!", delay: 85000 },
      { speaker: 'Alex', text: "Best purchase I ever made. Worth every penny!", delay: 90000 },
      { speaker: 'Jordan', text: "Same here! I'd recommend it to anyone!", delay: 94000 },
      { speaker: 'Casey', text: "Let's keep playing! The night is still young!", delay: 98000 },
      { speaker: 'Alex', text: "I never want this to end. Pure joy!", delay: 103000 },
      { speaker: 'Jordan', text: "This is what gaming is all about!", delay: 107000 },
      { speaker: 'Casey', text: "Cheers to the best gaming crew ever!", delay: 111000 },
      { speaker: 'Alex', text: "You all are the best! Love this group!", delay: 116000 },
      { speaker: 'Jordan', text: "Feeling so happy right now!", delay: 120000 },
    ],
  },

  // Group 2: Firepit - Heated/Negative debate
  firepit: {
    zone: 'Firepit Debate',
    basePosition: { x: 24, y: 0, z: 32 },
    bots: [
      { name: 'Morgan', color: 0xff4444, offset: { x: 0, y: 0, z: 0 } },
      { name: 'Taylor', color: 0xaa44ff, offset: { x: 2, y: 0, z: 1 } },
      { name: 'Riley', color: 0xffaa44, offset: { x: 1, y: 0, z: -2 } },
    ],
    messages: [
      { speaker: 'Morgan', text: "That's completely wrong and you know it! Stop spreading lies!", delay: 0 },
      { speaker: 'Taylor', text: "You're being ridiculous! Your argument makes no sense at all!", delay: 4000 },
      { speaker: 'Riley', text: "Both of you are being incredibly ignorant right now!", delay: 8000 },
      { speaker: 'Morgan', text: "I can't believe how stupid this conversation has become!", delay: 12000 },
      { speaker: 'Taylor', text: "You're the one making it worse! Just admit you're wrong!", delay: 16000 },
      { speaker: 'Riley', text: "This is the worst debate I've ever been part of!", delay: 20000 },
      { speaker: 'Morgan', text: "I'm so angry right now! You never listen to reason!", delay: 25000 },
      { speaker: 'Taylor', text: "Your facts are completely made up! Do some research!", delay: 29000 },
      { speaker: 'Riley', text: "I hate when people argue without evidence! So frustrating!", delay: 33000 },
      { speaker: 'Morgan', text: "This is exactly why nothing ever gets done around here!", delay: 38000 },
      { speaker: 'Taylor', text: "You're being deliberately obtuse! It's infuriating!", delay: 42000 },
      { speaker: 'Riley', text: "I can't stand this anymore! Everyone is being terrible!", delay: 46000 },
      { speaker: 'Morgan', text: "Your opinion is garbage and everyone knows it!", delay: 51000 },
      { speaker: 'Taylor', text: "That's incredibly offensive! How dare you say that!", delay: 55000 },
      { speaker: 'Riley', text: "This whole thing is a disaster! What a waste of time!", delay: 59000 },
      { speaker: 'Morgan', text: "I've never been more disappointed in people!", delay: 64000 },
      { speaker: 'Taylor', text: "The feeling is mutual! You're impossible to talk to!", delay: 68000 },
      { speaker: 'Riley', text: "Everyone here is being unreasonable and stubborn!", delay: 72000 },
      { speaker: 'Morgan', text: "I regret even starting this conversation! Total waste!", delay: 77000 },
      { speaker: 'Taylor', text: "You started it with your terrible take! Own it!", delay: 81000 },
      { speaker: 'Riley', text: "I'm furious! This is the worst discussion ever!", delay: 85000 },
      { speaker: 'Morgan', text: "Nothing you say makes any sense! It's maddening!", delay: 90000 },
      { speaker: 'Taylor', text: "You're twisting everything I say! So dishonest!", delay: 94000 },
      { speaker: 'Riley', text: "I hate this! Everyone is acting like a fool!", delay: 98000 },
      { speaker: 'Morgan', text: "This is absolutely pathetic! Grow up!", delay: 103000 },
      { speaker: 'Taylor', text: "You're the childish one here! Unbelievable!", delay: 107000 },
      { speaker: 'Riley', text: "I've had enough of this nonsense! So annoying!", delay: 111000 },
      { speaker: 'Morgan', text: "Worst. Conversation. Ever. I'm done!", delay: 116000 },
      { speaker: 'Taylor', text: "Good! Nobody wants to hear more of your garbage!", delay: 120000 },
    ],
  },

  // Group 3: Central Bar - Neutral casual conversation
  bar: {
    zone: 'Central Bar',
    basePosition: { x: 24, y: 0, z: 18 },
    bots: [
      { name: 'Sam', color: 0x888888, offset: { x: 0, y: 0, z: 0 } },
      { name: 'Drew', color: 0xaaaaaa, offset: { x: 2, y: 0, z: 0 } },
      { name: 'Quinn', color: 0x666666, offset: { x: 1, y: 0, z: 2 } },
    ],
    messages: [
      { speaker: 'Sam', text: "So I went to the store yesterday to pick up some groceries.", delay: 0 },
      { speaker: 'Drew', text: "Oh yeah? What did you get? I need to go shopping too.", delay: 4000 },
      { speaker: 'Quinn', text: "I usually go on Sundays. The crowds are smaller then.", delay: 8000 },
      { speaker: 'Sam', text: "Just the usual stuff. Milk, bread, some vegetables.", delay: 12000 },
      { speaker: 'Drew', text: "I should make a list. I always forget something.", delay: 16000 },
      { speaker: 'Quinn', text: "Lists help. I use an app on my phone for that.", delay: 20000 },
      { speaker: 'Sam', text: "The weather has been pretty mild lately.", delay: 25000 },
      { speaker: 'Drew', text: "Yeah, not too hot, not too cold. Pretty average.", delay: 29000 },
      { speaker: 'Quinn', text: "Good weather for walking. I took a stroll earlier.", delay: 33000 },
      { speaker: 'Sam', text: "I've been meaning to exercise more. Maybe I'll start.", delay: 38000 },
      { speaker: 'Drew', text: "Walking is good. Low impact and easy to do.", delay: 42000 },
      { speaker: 'Quinn', text: "I walk about thirty minutes a day. It's fine.", delay: 46000 },
      { speaker: 'Sam', text: "Did anyone watch the news today? Anything interesting?", delay: 51000 },
      { speaker: 'Drew', text: "Not really. Same stuff as usual. Nothing major.", delay: 55000 },
      { speaker: 'Quinn', text: "I mostly read articles online. Standard news.", delay: 59000 },
      { speaker: 'Sam', text: "Work has been pretty routine this week.", delay: 64000 },
      { speaker: 'Drew', text: "Same here. Meetings, emails, the usual tasks.", delay: 68000 },
      { speaker: 'Quinn', text: "I finished a project yesterday. On to the next one.", delay: 72000 },
      { speaker: 'Sam', text: "This bar has decent drinks. Nothing special though.", delay: 77000 },
      { speaker: 'Drew', text: "It's alright. Convenient location at least.", delay: 81000 },
      { speaker: 'Quinn', text: "The music is okay. Not my favorite but not bad.", delay: 85000 },
      { speaker: 'Sam', text: "I might order some food later. Menu looks standard.", delay: 90000 },
      { speaker: 'Drew', text: "The fries are decent here. Had them last time.", delay: 94000 },
      { speaker: 'Quinn', text: "I'm not that hungry. Maybe just another drink.", delay: 98000 },
      { speaker: 'Sam', text: "Traffic was normal on the way here. No delays.", delay: 103000 },
      { speaker: 'Drew', text: "I took the bus. It was on time, which is fine.", delay: 107000 },
      { speaker: 'Quinn', text: "I live nearby so I walked. About fifteen minutes.", delay: 111000 },
      { speaker: 'Sam', text: "Well, this has been a pretty average evening.", delay: 116000 },
      { speaker: 'Drew', text: "Yeah, nothing too exciting. But that's okay.", delay: 120000 },
    ],
  },
};

export default class TestBotManager {
  constructor(sceneManager, aiModule) {
    this.sceneManager = sceneManager;
    this.aiModule = aiModule;
    this.botGroups = new Map(); // groupId -> { bots: [], meshes: [], sentiment: null }
    this.messageTimers = [];
    this.isRunning = false;
    this.sentimentLabels = new Map(); // groupId -> THREE.Sprite
    this.onMessageCallback = null;

    // TTS settings
    this.speechSynth = window.speechSynthesis;
    this.voices = [];
    this.voiceMap = new Map(); // botName -> voice
    this.getUserPosition = null; // Callback to get user position
    this.speechQueue = []; // Queue for sequential speech
    this.isSpeaking = false;

    // Audio range (distance within which conversations are heard)
    this.audioRange = 15; // Default 15ft

    // Load available voices
    this.loadVoices();
  }

  /**
   * Set the audio range (hearing distance)
   */
  setAudioRange(range) {
    this.audioRange = range;
    console.log(`[TestBotManager] Audio range set to ${range}ft`);
  }

  /**
   * Load available TTS voices
   */
  loadVoices() {
    const setVoices = () => {
      this.voices = this.speechSynth.getVoices();
      // Assign different voices to bots for variety
      const englishVoices = this.voices.filter(
        (v) => v.lang.startsWith('en') && !v.name.includes('Google')
      );
      if (englishVoices.length > 0) {
        // Assign voices to bot names
        const botNames = ['Alex', 'Jordan', 'Casey', 'Sam', 'Morgan', 'Taylor', 'Drew', 'Quinn', 'Riley'];
        botNames.forEach((name, i) => {
          this.voiceMap.set(name, englishVoices[i % englishVoices.length]);
        });
      }
      console.log(`[TestBotManager] Loaded ${this.voices.length} TTS voices`);
    };

    if (this.speechSynth.getVoices().length > 0) {
      setVoices();
    } else {
      this.speechSynth.onvoiceschanged = setVoices;
    }
  }

  /**
   * Set callback to get user's current position
   */
  setUserPositionCallback(callback) {
    this.getUserPosition = callback;
  }

  /**
   * Start test mode with all bot groups
   */
  async start() {
    if (this.isRunning) return;
    this.isRunning = true;

    console.log('[TestBotManager] Starting test mode with 3 bot groups...');

    // Create all bot groups
    for (const [groupId, config] of Object.entries(CONVERSATIONS)) {
      await this.createBotGroup(groupId, config);
    }

    // Start conversations
    this.startConversations();

    console.log('[TestBotManager] Test mode active');
  }

  /**
   * Create a group of bots in the scene
   */
  async createBotGroup(groupId, config) {
    const group = {
      config,
      bots: [],
      meshes: [],
      sentiment: { label: 'NEUTRAL', score: 0.5 },
      recentMessages: [],
    };

    // Create bot avatars
    for (const bot of config.bots) {
      const position = {
        x: config.basePosition.x + bot.offset.x,
        y: config.basePosition.y + bot.offset.y,
        z: config.basePosition.z + bot.offset.z,
      };

      // Create sphere avatar
      const geometry = new THREE.SphereGeometry(0.5, 16, 16);
      const material = new THREE.MeshPhongMaterial({
        color: bot.color,
        emissive: bot.color,
        emissiveIntensity: 0.3,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(position.x, position.y + 1, position.z);

      // Add name label
      const nameSprite = this.createTextSprite(bot.name, bot.color);
      nameSprite.position.set(position.x, position.y + 2, position.z);

      this.sceneManager.scene.add(mesh);
      this.sceneManager.scene.add(nameSprite);

      group.bots.push({ ...bot, position, nameSprite });
      group.meshes.push(mesh);
    }

    // Create sentiment indicator for the group
    const sentimentSprite = this.createSentimentSprite('NEUTRAL', 0.5);
    const centerX = config.basePosition.x + 1;
    const centerZ = config.basePosition.z;
    sentimentSprite.position.set(centerX, 4, centerZ);
    this.sceneManager.scene.add(sentimentSprite);
    this.sentimentLabels.set(groupId, sentimentSprite);

    this.botGroups.set(groupId, group);
  }

  /**
   * Create a text sprite for bot names
   */
  createTextSprite(text, color) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 64;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = 'bold 32px Arial';
    ctx.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(2, 0.5, 1);

    return sprite;
  }

  /**
   * Create sentiment indicator sprite
   */
  createSentimentSprite(label, score) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 512;
    canvas.height = 128;

    this.drawSentimentCanvas(ctx, canvas.width, canvas.height, label, score);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(6, 1.5, 1);
    sprite.userData = { canvas, ctx, texture };

    return sprite;
  }

  /**
   * Draw sentiment indicator on canvas
   */
  drawSentimentCanvas(ctx, width, height, label, score) {
    ctx.clearRect(0, 0, width, height);

    // Background
    let bgColor;
    if (label === 'NEGATIVE') {
      bgColor = `rgba(255, 68, 68, ${0.5 + score * 0.3})`;
    } else if (label === 'POSITIVE') {
      bgColor = `rgba(68, 255, 136, ${0.5 + score * 0.3})`;
    } else {
      bgColor = 'rgba(128, 128, 128, 0.6)';
    }

    ctx.fillStyle = bgColor;
    ctx.roundRect(10, 10, width - 20, height - 20, 20);
    ctx.fill();

    // Border
    ctx.strokeStyle = label === 'NEGATIVE' ? '#ff4444' : label === 'POSITIVE' ? '#44ff88' : '#888888';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Emoji
    const emoji = label === 'NEGATIVE' ? '🔥' : label === 'POSITIVE' ? '😊' : '😐';
    ctx.font = '48px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, 30, height / 2);

    // Label text
    ctx.font = 'bold 36px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(`${label} (${(score * 100).toFixed(0)}%)`, width / 2 + 20, height / 2);
  }

  /**
   * Update sentiment display for a group
   */
  updateSentimentDisplay(groupId, label, score) {
    const sprite = this.sentimentLabels.get(groupId);
    if (!sprite || !sprite.userData) return;

    const { ctx, texture } = sprite.userData;
    const canvas = sprite.userData.canvas;

    this.drawSentimentCanvas(ctx, canvas.width, canvas.height, label, score);
    texture.needsUpdate = true;
  }

  /**
   * Start all conversations with timed messages
   */
  startConversations() {
    for (const [groupId, config] of Object.entries(CONVERSATIONS)) {
      this.startGroupConversation(groupId, config);
    }
  }

  /**
   * Start conversation for a specific group
   */
  startGroupConversation(groupId, config) {
    const group = this.botGroups.get(groupId);
    if (!group) return;

    // Schedule all messages
    for (const message of config.messages) {
      const timer = setTimeout(async () => {
        await this.deliverMessage(groupId, message);
      }, message.delay);

      this.messageTimers.push(timer);
    }

    // Loop conversation after it ends
    const totalDuration = config.messages[config.messages.length - 1].delay + 5000;
    const loopTimer = setTimeout(() => {
      if (this.isRunning) {
        this.startGroupConversation(groupId, config);
      }
    }, totalDuration);

    this.messageTimers.push(loopTimer);
  }

  /**
   * Deliver a message and analyze sentiment
   */
  async deliverMessage(groupId, message) {
    if (!this.isRunning) return;

    const group = this.botGroups.get(groupId);
    if (!group) return;

    // Find the bot's position
    const bot = group.bots.find((b) => b.name === message.speaker);
    const botPosition = bot ? bot.position : group.config.basePosition;

    console.log(`[${group.config.zone}] ${message.speaker}: "${message.text}"`);

    // Callback for external handling (e.g., display in chat)
    if (this.onMessageCallback) {
      this.onMessageCallback(message.speaker, message.text, group.config.zone);
    }

    // Speak the message with spatial audio
    this.speakWithSpatialAudio(message.speaker, message.text, botPosition);

    // Store message for heated detection
    group.recentMessages.push({
      peerId: `bot-${message.speaker}`,
      text: message.text,
      timestamp: Date.now(),
    });

    // Keep only last 10 messages
    if (group.recentMessages.length > 10) {
      group.recentMessages.shift();
    }

    // Analyze sentiment if AI is available
    if (this.aiModule) {
      try {
        const result = await this.aiModule.analyzeSentiment(message.text);
        group.sentiment = { label: result.label, score: result.score };

        // Update visual indicator
        this.updateSentimentDisplay(groupId, result.label, result.score);

        console.log(`[${group.config.zone}] Sentiment: ${result.label} (${(result.score * 100).toFixed(0)}%)`);
      } catch (error) {
        console.error('[TestBotManager] Sentiment analysis error:', error);
      }
    }
  }

  /**
   * Speak text using TTS with spatial audio based on distance
   */
  speakWithSpatialAudio(speaker, text, botPosition) {
    if (!this.speechSynth) return;

    // Calculate spatial gain based on user position
    let volume = 1.0;
    let distance = 0;
    if (this.getUserPosition) {
      const userPos = this.getUserPosition();
      if (userPos) {
        // Calculate distance
        const dx = botPosition.x - userPos.x;
        const dz = botPosition.z - userPos.z;
        distance = Math.sqrt(dx * dx + dz * dz);

        // Check if outside audio range - no audio if outside circle
        if (distance > this.audioRange) {
          console.log(`[TTS] ${speaker} outside audio range (distance: ${distance.toFixed(1)}ft, range: ${this.audioRange}ft)`);
          return; // Don't speak if outside audio range
        }

        // Calculate volume based on distance within range
        // Closer = louder, farther = quieter (linear falloff)
        volume = 1.0 - (distance / this.audioRange);
        volume = Math.max(0.1, volume); // Minimum 10% volume when within range
      }
    }

    const utterance = new SpeechSynthesisUtterance(text);

    // Assign voice based on speaker name
    const voice = this.voiceMap.get(speaker);
    if (voice) {
      utterance.voice = voice;
    }

    // Set volume based on spatial distance
    utterance.volume = Math.min(1.0, volume * 1.5); // Boost slightly for audibility
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    // Vary pitch slightly based on speaker name hash for variety
    const nameHash = speaker.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    utterance.pitch = 0.9 + (nameHash % 20) / 100; // 0.9 to 1.1

    // Light up avatar when speaking
    utterance.onstart = () => {
      this.highlightSpeaker(speaker, true);
    };

    // Dim avatar when done speaking
    utterance.onend = () => {
      this.highlightSpeaker(speaker, false);
    };

    // Also handle errors/interruptions
    utterance.onerror = () => {
      this.highlightSpeaker(speaker, false);
    };

    console.log(`[TTS] ${speaker} speaking (volume: ${(utterance.volume * 100).toFixed(0)}%)`);

    this.speechSynth.speak(utterance);
  }

  /**
   * Highlight or dim a speaker's avatar
   */
  highlightSpeaker(speakerName, isHighlighted) {
    // Find the bot across all groups
    for (const [_groupId, group] of this.botGroups) {
      const botIndex = group.bots.findIndex((b) => b.name === speakerName);
      if (botIndex !== -1) {
        const mesh = group.meshes[botIndex];
        if (mesh && mesh.material) {
          if (isHighlighted) {
            // Bright glow when speaking
            mesh.material.emissiveIntensity = 1.0;
            mesh.scale.set(1.3, 1.3, 1.3); // Slightly larger
          } else {
            // Normal state
            mesh.material.emissiveIntensity = 0.3;
            mesh.scale.set(1.0, 1.0, 1.0);
          }
        }
        break;
      }
    }
  }

  /**
   * Get all bot positions for spatial audio simulation
   */
  getBotPositions() {
    const positions = [];
    for (const [groupId, group] of this.botGroups) {
      for (const bot of group.bots) {
        positions.push({
          groupId,
          botName: bot.name,
          position: bot.position,
          sentiment: group.sentiment,
        });
      }
    }
    return positions;
  }

  /**
   * Get group sentiment by ID
   */
  getGroupSentiment(groupId) {
    const group = this.botGroups.get(groupId);
    return group ? group.sentiment : null;
  }

  /**
   * Stop test mode and clean up
   */
  stop() {
    if (!this.isRunning) return;
    this.isRunning = false;

    console.log('[TestBotManager] Stopping test mode...');

    // Cancel any pending speech
    if (this.speechSynth) {
      this.speechSynth.cancel();
    }

    // Clear all timers
    for (const timer of this.messageTimers) {
      clearTimeout(timer);
    }
    this.messageTimers = [];

    // Remove all bot meshes and sprites
    for (const [_groupId, group] of this.botGroups) {
      for (const mesh of group.meshes) {
        this.sceneManager.scene.remove(mesh);
        mesh.geometry.dispose();
        mesh.material.dispose();
      }
      for (const bot of group.bots) {
        if (bot.nameSprite) {
          this.sceneManager.scene.remove(bot.nameSprite);
          bot.nameSprite.material.map.dispose();
          bot.nameSprite.material.dispose();
        }
      }
    }

    // Remove sentiment labels
    for (const [_groupId, sprite] of this.sentimentLabels) {
      this.sceneManager.scene.remove(sprite);
      sprite.material.map.dispose();
      sprite.material.dispose();
    }

    this.botGroups.clear();
    this.sentimentLabels.clear();

    console.log('[TestBotManager] Test mode stopped');
  }
}
