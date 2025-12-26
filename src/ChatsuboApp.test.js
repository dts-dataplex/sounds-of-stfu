import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock dependencies before importing ChatsuboApp
const mockSceneManager = {
  start: vi.fn(),
  stop: vi.fn(),
  updateAvatarPosition: vi.fn(),
  addAvatar: vi.fn(),
  removeAvatar: vi.fn(),
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

describe('ChatsuboApp Integration', () => {
  let app;
  let mockCanvas;

  beforeEach(() => {
    // Create mock canvas
    mockCanvas = document.createElement('canvas');
    mockCanvas.id = 'scene-canvas';
    document.body.appendChild(mockCanvas);

    app = new ChatsuboApp(mockCanvas);
  });

  afterEach(() => {
    if (app) {
      app.destroy();
    }
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize all modules', async () => {
      await app.initialize();

      expect(app.sceneManager).toBeDefined();
      expect(app.networkCoordinator).toBeDefined();
      expect(app.audioContext).toBeDefined();
    });

    it('should start scene manager', async () => {
      await app.initialize();

      expect(app.sceneManager.start).toHaveBeenCalled();
    });

    it('should initialize AI module', async () => {
      await app.initialize();

      expect(app.aiModule.initialize).toHaveBeenCalled();
    });

    it('should set up audio context', async () => {
      await app.initialize();

      expect(app.audioContext).toBeInstanceOf(AudioContext);
      expect(app.audioContext.state).toBe('running');
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

      expect(app.spatialAudioNodes.has('peer-456')).toBe(true);
      const nodes = app.spatialAudioNodes.get('peer-456');
      expect(nodes.source).toBeDefined();
      expect(nodes.gain).toBeDefined();
      expect(nodes.panner).toBeDefined();
    });

    it('should update spatial audio based on peer position', () => {
      const mockStream = new MediaStream();
      app.setupSpatialAudio('peer-456', mockStream);

      // Set peer position
      app.peerPositions.set('peer-456', { x: 10, y: 0, z: 10 });

      app.updateSpatialAudio('peer-456');

      const nodes = app.spatialAudioNodes.get('peer-456');
      expect(nodes.panner.setPosition).toHaveBeenCalledWith(10, 0, 10);
      expect(nodes.gain.gain.value).toBeGreaterThan(0);
    });

    it('should adjust gain based on distance', () => {
      const mockStream = new MediaStream();
      app.setupSpatialAudio('peer-456', mockStream);

      // Close position - high gain
      app.peerPositions.set('peer-456', { x: 24, y: 0, z: 19 });
      app.updateSpatialAudio('peer-456');
      const closeGain = app.spatialAudioNodes.get('peer-456').gain.gain.value;

      // Far position - low gain
      app.peerPositions.set('peer-456', { x: 50, y: 0, z: 50 });
      app.updateSpatialAudio('peer-456');
      const farGain = app.spatialAudioNodes.get('peer-456').gain.gain.value;

      expect(closeGain).toBeGreaterThan(farGain);
    });

    it('should remove peer audio on disconnect', () => {
      const mockStream = new MediaStream();
      app.setupSpatialAudio('peer-456', mockStream);

      expect(app.spatialAudioNodes.has('peer-456')).toBe(true);

      app.removePeerAudio('peer-456');

      expect(app.spatialAudioNodes.has('peer-456')).toBe(false);
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

    it('should analyze message sentiment', async () => {
      await app.handleChatMessage('peer-456', 'This is great!', Date.now());

      expect(app.aiModule.analyzeSentiment).toHaveBeenCalledWith('This is great!');
    });

    it('should check for heated conversations', async () => {
      await app.handleChatMessage('peer-456', 'Message 1', Date.now());

      expect(app.aiModule.isConversationHeated).toHaveBeenCalledWith(app.conversationMessages);
    });

    it('should trigger heated conversation callback', async () => {
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
      expect(app.spatialAudioNodes.size).toBe(0);
    });

    it('should close audio context', async () => {
      await app.initialize();

      const closeSpy = vi.spyOn(app.audioContext, 'close');

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
