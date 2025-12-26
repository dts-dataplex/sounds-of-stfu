import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock dependencies before importing ChatsuboApp
const mockSceneManager = {
  start: vi.fn(),
  stop: vi.fn(),
  updateAvatarPosition: vi.fn(),
  addAvatar: vi.fn(),
  removeAvatar: vi.fn(),
  scene: {
    add: vi.fn(),
    remove: vi.fn(),
  },
};

const mockNetworkCoordinator = {
  joinRoom: vi.fn().mockResolvedValue('peer-123'),
  leaveRoom: vi.fn(),
  connectToPeer: vi.fn(),
  broadcastPosition: vi.fn(),
  sendMessage: vi.fn(),
  toggleMicrophone: vi.fn(),
  getPeerCount: vi.fn().mockReturnValue(0),
  getPeerList: vi.fn().mockReturnValue([]),
  on: vi.fn(),
  emit: vi.fn(),
  destroy: vi.fn(),
};

vi.mock('./scene/SceneManager.js', () => ({
  SceneManager: vi.fn(function () {
    return mockSceneManager;
  }),
}));

vi.mock('./network/index.js', () => ({
  MeshNetworkCoordinator: vi.fn(function () {
    return mockNetworkCoordinator;
  }),
}));

vi.mock('./ai/index.js', () => ({
  chatsuboAI: {
    initialize: vi.fn().mockResolvedValue(),
    analyzeSentiment: vi.fn().mockResolvedValue({ label: 'POSITIVE', score: 0.9, latency: 100 }),
    isConversationHeated: vi.fn().mockResolvedValue(false),
  },
}));

import ChatsuboApp from './ChatsuboApp.js';

// Mock AudioParam methods that are not implemented in happy-dom
const mockAudioParam = (audioParam) => {
  if (audioParam && !audioParam.setValueAtTime) {
    audioParam.setValueAtTime = vi.fn().mockReturnThis();
    audioParam.linearRampToValueAtTime = vi.fn().mockReturnThis();
    audioParam.exponentialRampToValueAtTime = vi.fn().mockReturnThis();
    audioParam.setTargetAtTime = vi.fn().mockReturnThis();
  }
  return audioParam;
};

describe('ChatsuboApp Integration', () => {
  let app;
  let mockCanvas;
  let originalCreateGain;

  beforeEach(() => {
    // Create mock canvas
    mockCanvas = document.createElement('canvas');
    mockCanvas.id = 'scene-canvas';
    document.body.appendChild(mockCanvas);

    // Monkey-patch AudioContext.createGain to add missing methods
    if (typeof AudioContext !== 'undefined') {
      originalCreateGain = AudioContext.prototype.createGain;
      AudioContext.prototype.createGain = function () {
        const gainNode = originalCreateGain.call(this);
        mockAudioParam(gainNode.gain);
        // Make linearRampToValueAtTime actually update the value for testing
        gainNode.gain.linearRampToValueAtTime = vi.fn((value) => {
          gainNode.gain.value = value;
          return gainNode.gain;
        });
        return gainNode;
      };
    }

    app = new ChatsuboApp(mockCanvas);
  });

  afterEach(() => {
    if (app) {
      app.destroy();
    }
    document.body.innerHTML = '';
    vi.clearAllMocks();

    // Restore original createGain
    if (originalCreateGain && typeof AudioContext !== 'undefined') {
      AudioContext.prototype.createGain = originalCreateGain;
    }
  });

  describe('initialization', () => {
    it('should initialize all modules', async () => {
      await app.initialize();

      expect(app.sceneManager).toBeDefined();
      expect(app.networkCoordinator).toBeDefined();
      expect(app.spatialAudio).toBeDefined();
      expect(app.spatialAudio.audioContext).toBeDefined();
    });

    it('should start scene manager', async () => {
      await app.initialize();

      expect(app.sceneManager.start).toHaveBeenCalled();
    });

    it.skip('should initialize AI module (AI disabled)', async () => {
      // AI module is currently disabled due to ONNX runtime issues
      await app.initialize();

      expect(app.aiModule.initialize).toHaveBeenCalled();
    });

    it('should set up audio context', async () => {
      await app.initialize();

      expect(app.spatialAudio.audioContext).toBeInstanceOf(AudioContext);
      expect(app.spatialAudio.audioContext.state).toBe('running');
    });

    it('should call status update callback', async () => {
      const statusSpy = vi.fn();
      app.onStatusUpdate = statusSpy;

      await app.initialize();

      expect(statusSpy).toHaveBeenCalled();
      expect(statusSpy).toHaveBeenCalledWith(expect.stringContaining('Ready'));
    });
  });

  describe('room management', () => {
    beforeEach(async () => {
      await app.initialize();
    });

    it('should join room successfully', async () => {
      await app.joinRoom('test-room');

      expect(app.networkCoordinator.joinRoom).toHaveBeenCalledWith('test-room');
      expect(app.localPeerId).toBe('peer-123');
    });

    it('should broadcast initial position on join', async () => {
      await app.joinRoom('test-room');

      expect(app.networkCoordinator.broadcastPosition).toHaveBeenCalledWith(
        expect.objectContaining({
          x: expect.any(Number),
          y: expect.any(Number),
          z: expect.any(Number),
        })
      );
    });
  });

  describe('movement and position', () => {
    beforeEach(async () => {
      await app.initialize();
      await app.joinRoom('test-room');
    });

    it('should update local position', () => {
      app.moveTo(10, 0, 20);

      expect(app.localPosition).toEqual({ x: 10, y: 0, z: 20 });
    });

    it('should broadcast position update', () => {
      app.moveTo(10, 0, 20);

      expect(app.networkCoordinator.broadcastPosition).toHaveBeenCalledWith({
        x: 10,
        y: 0,
        z: 20,
      });
    });
  });

  describe('spatial audio', () => {
    beforeEach(async () => {
      await app.initialize();
      await app.joinRoom('test-room');
    });

    it('should set up spatial audio for new peer', () => {
      const mockStream = new MediaStream();

      app.setupSpatialAudio('peer-456', mockStream);

      // Check that peer was added to spatial audio engine
      expect(app.spatialAudio.peerGainNodes.has('peer-456')).toBe(true);
      expect(app.spatialAudio.peerPositions.has('peer-456')).toBe(true);
    });

    it('should update spatial audio based on peer position', () => {
      const mockStream = new MediaStream();
      app.setupSpatialAudio('peer-456', mockStream);

      // Set peer position
      app.peerPositions.set('peer-456', { x: 10, y: 0, z: 10 });

      app.updateSpatialAudio('peer-456');

      // Verify position was updated in spatial audio engine
      const updatedPosition = app.spatialAudio.peerPositions.get('peer-456');
      expect(updatedPosition).toBeDefined();
      expect(updatedPosition.x).toBe(10);
      expect(updatedPosition.z).toBe(10);
    });

    it('should adjust gain based on distance', () => {
      const mockStream = new MediaStream();
      app.setupSpatialAudio('peer-456', mockStream);

      // Very close position - high gain (distance ~5)
      const closePosition = { x: 3, y: 0, z: 4, zoneId: 'gaming' };
      app.peerPositions.set('peer-456', closePosition);
      app.spatialAudio.updatePeerPosition('peer-456', closePosition);
      const closeGain = app.spatialAudio.getPeerVolume('peer-456');

      // Far position - low gain (distance ~70.71), should hit min_volume 0.05
      const farPosition = { x: 50, y: 0, z: 50, zoneId: 'gaming' };
      app.peerPositions.set('peer-456', farPosition);
      app.spatialAudio.updatePeerPosition('peer-456', farPosition);
      const farGain = app.spatialAudio.getPeerVolume('peer-456');

      expect(closeGain).toBeGreaterThan(farGain);
    });

    it('should remove peer audio on disconnect', () => {
      const mockStream = new MediaStream();
      app.setupSpatialAudio('peer-456', mockStream);

      expect(app.spatialAudio.peerGainNodes.has('peer-456')).toBe(true);

      app.removePeerAudio('peer-456');

      expect(app.spatialAudio.peerGainNodes.has('peer-456')).toBe(false);
    });
  });

  describe('chat and AI integration', () => {
    beforeEach(async () => {
      await app.initialize();
      await app.joinRoom('test-room');
    });

    it('should handle chat message', async () => {
      await app.handleChatMessage('peer-456', 'Hello world!', Date.now());

      expect(app.conversationMessages).toHaveLength(1);
      expect(app.conversationMessages[0]).toMatchObject({
        peerId: 'peer-456',
        text: 'Hello world!',
      });
    });

    it.skip('should analyze message sentiment (AI disabled)', async () => {
      // AI module is currently disabled due to ONNX runtime issues
      // This test will be re-enabled when AI features are restored
      await app.handleChatMessage('peer-456', 'This is great!', Date.now());

      expect(app.aiModule.analyzeSentiment).toHaveBeenCalledWith('This is great!');
    });

    it.skip('should check for heated conversations (AI disabled)', async () => {
      // AI module is currently disabled due to ONNX runtime issues
      // This test will be re-enabled when AI features are restored
      await app.handleChatMessage('peer-456', 'Message 1', Date.now());

      expect(app.aiModule.isConversationHeated).toHaveBeenCalledWith(app.conversationMessages);
    });

    it.skip('should trigger heated conversation callback (AI disabled)', async () => {
      // AI module is currently disabled due to ONNX runtime issues
      // This test will be re-enabled when AI features are restored
      const heatedSpy = vi.fn();
      app.onHeatedConversation = heatedSpy;

      // Mock heated conversation
      app.aiModule.isConversationHeated.mockResolvedValue(true);

      await app.handleChatMessage('peer-456', 'Angry message!', Date.now());

      expect(heatedSpy).toHaveBeenCalled();
    });

    it('should keep only last 20 messages', async () => {
      // Add 25 messages
      for (let i = 0; i < 25; i++) {
        await app.handleChatMessage('peer-456', `Message ${i}`, Date.now());
      }

      expect(app.conversationMessages).toHaveLength(20);
      expect(app.conversationMessages[0].text).toBe('Message 5'); // First 5 dropped
    });
  });

  describe('cleanup', () => {
    it('should destroy all resources', async () => {
      await app.initialize();
      await app.joinRoom('test-room');

      app.destroy();

      expect(app.sceneManager.stop).toHaveBeenCalled();
      expect(app.networkCoordinator.destroy).toHaveBeenCalled();
      // spatialAudio is destroyed and set to null
      expect(app.spatialAudio).toBeNull();
    });

    it('should close audio context', async () => {
      await app.initialize();

      const closeSpy = vi.spyOn(app.spatialAudio.audioContext, 'close');

      app.destroy();

      expect(closeSpy).toHaveBeenCalled();
    });
  });

  describe('messaging and peer management', () => {
    beforeEach(async () => {
      await app.initialize();
      await app.joinRoom('test-room');
    });

    it('should send message via network coordinator', () => {
      app.sendMessage('Hello everyone!');

      expect(app.networkCoordinator.sendMessage).toHaveBeenCalledWith('Hello everyone!');
    });

    it('should toggle microphone', () => {
      app.toggleMicrophone();

      expect(app.networkCoordinator.toggleMicrophone).toHaveBeenCalled();
    });

    it('should return peer count', () => {
      app.networkCoordinator.getPeerCount.mockReturnValue(2);

      const count = app.getPeerCount();

      expect(count).toBe(2);
      expect(app.networkCoordinator.getPeerCount).toHaveBeenCalled();
    });

    it('should return peer list', () => {
      app.networkCoordinator.getPeerList.mockReturnValue(['peer-1', 'peer-2']);

      const peers = app.getPeerList();

      expect(peers).toHaveLength(2);
      expect(peers).toContain('peer-1');
      expect(peers).toContain('peer-2');
      expect(app.networkCoordinator.getPeerList).toHaveBeenCalled();
    });

    it('should trigger peer list update callback', () => {
      const updateSpy = vi.fn();
      app.onPeerListUpdate = updateSpy;
      app.networkCoordinator.getPeerList.mockReturnValue(['peer-1', 'peer-2']);

      app.updatePeerList();

      expect(updateSpy).toHaveBeenCalledWith(['peer-1', 'peer-2']);
      expect(app.networkCoordinator.getPeerList).toHaveBeenCalled();
    });
  });
});
