/**
 * SpatialAudioEngine Tests
 * Chatsubo Virtual Bar - Sounds of STFU
 *
 * Unit tests for spatial audio engine with mocked Web Audio API.
 */

/* global global */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SpatialAudioEngine } from './SpatialAudioEngine.js';

// Mock Web Audio API
class MockAudioContext {
  constructor() {
    this.state = 'running';
    this.sampleRate = 48000;
    this.currentTime = 0;
    this.destination = {};
    this.resume = vi.fn().mockResolvedValue();
    this.close = vi.fn().mockResolvedValue();
    this.createGain = vi.fn(() => ({
      gain: {
        value: 1.0,
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
      disconnect: vi.fn(),
    }));
    this.createMediaStreamSource = vi.fn(() => ({
      connect: vi.fn(),
    }));
  }
}

// Mock window.AudioContext
global.AudioContext = MockAudioContext;

// Mock MediaStream
const mockMediaStream = () => ({
  id: 'mock-stream-id',
  active: true,
  getTracks: vi.fn(() => []),
});

describe('SpatialAudioEngine', () => {
  let engine;

  beforeEach(() => {
    vi.clearAllMocks();
    engine = new SpatialAudioEngine({
      minDistance: 50,
      maxDistance: 500,
      rolloffFactor: 2.0,
      masterVolume: 1.0,
    });
  });

  describe('initialization', () => {
    it('should create engine with default config', () => {
      expect(engine).toBeDefined();
      expect(engine.initialized).toBe(false);
      expect(engine.spatialEnabled).toBe(true);
      expect(engine.masterVolume).toBe(1.0);
    });

    it('should initialize Web Audio API successfully', async () => {
      const success = await engine.initialize();

      expect(success).toBe(true);
      expect(engine.initialized).toBe(true);
      expect(engine.audioContext).toBeDefined();
      expect(engine.audioContext).toBeInstanceOf(MockAudioContext);
      expect(engine.masterGainNode).toBeDefined();
    });

    it('should resume suspended audio context', async () => {
      class SuspendedAudioContext extends MockAudioContext {
        constructor() {
          super();
          this.state = 'suspended';
        }
      }

      global.AudioContext = SuspendedAudioContext;

      engine = new SpatialAudioEngine();
      await engine.initialize();

      expect(engine.audioContext.resume).toHaveBeenCalled();

      // Restore original mock
      global.AudioContext = MockAudioContext;
    });

    it('should handle initialization errors gracefully', async () => {
      class ErrorAudioContext {
        constructor() {
          throw new Error('AudioContext not supported');
        }
      }

      global.AudioContext = ErrorAudioContext;

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation();
      engine = new SpatialAudioEngine();
      const success = await engine.initialize();

      expect(success).toBe(false);
      expect(engine.initialized).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();

      // Restore original mock
      global.AudioContext = MockAudioContext;
    });

    it('should report ready state correctly', async () => {
      expect(engine.isReady()).toBe(false);

      await engine.initialize();
      expect(engine.isReady()).toBe(true);
    });
  });

  describe('peer management', () => {
    beforeEach(async () => {
      await engine.initialize();
    });

    it('should add peer with initial position', () => {
      const mediaStream = mockMediaStream();
      const position = { x: 100, y: 100, z: 0, zoneId: 'gaming' };

      const success = engine.addPeer('peer1', mediaStream, position);

      expect(success).toBe(true);
      expect(engine.peerGainNodes.has('peer1')).toBe(true);
      expect(engine.peerPositions.get('peer1')).toEqual(position);
    });

    it('should fail to add peer if not initialized', () => {
      engine.initialized = false;
      const mediaStream = mockMediaStream();

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation();
      const success = engine.addPeer('peer1', mediaStream);

      expect(success).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('should remove existing peer when adding duplicate', () => {
      const mediaStream1 = mockMediaStream();
      const mediaStream2 = mockMediaStream();

      engine.addPeer('peer1', mediaStream1, { x: 0, y: 0, z: 0, zoneId: 'central_bar' });
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation();

      engine.addPeer('peer1', mediaStream2, { x: 100, y: 100, z: 0, zoneId: 'gaming' });

      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(engine.peerGainNodes.size).toBe(1);

      consoleWarnSpy.mockRestore();
    });

    it('should remove peer successfully', () => {
      const mediaStream = mockMediaStream();
      engine.addPeer('peer1', mediaStream);

      engine.removePeer('peer1');

      expect(engine.peerGainNodes.has('peer1')).toBe(false);
      expect(engine.peerPositions.has('peer1')).toBe(false);
    });

    it('should handle removing non-existent peer gracefully', () => {
      engine.removePeer('non-existent-peer');
      // Should not throw error
      expect(engine.peerGainNodes.size).toBe(0);
    });

    it('should get all peers info', () => {
      const mediaStream1 = mockMediaStream();
      const mediaStream2 = mockMediaStream();

      engine.addPeer('peer1', mediaStream1, { x: 100, y: 0, z: 0, zoneId: 'central_bar' });
      engine.addPeer('peer2', mediaStream2, { x: 0, y: 100, z: 0, zoneId: 'gaming' });

      const peersInfo = engine.getAllPeersInfo();

      expect(peersInfo).toHaveLength(2);
      expect(peersInfo[0]).toHaveProperty('peerId');
      expect(peersInfo[0]).toHaveProperty('position');
      expect(peersInfo[0]).toHaveProperty('distance');
      expect(peersInfo[0]).toHaveProperty('volume');
    });
  });

  describe('position updates', () => {
    beforeEach(async () => {
      await engine.initialize();
      const mediaStream = mockMediaStream();
      engine.addPeer('peer1', mediaStream, { x: 100, y: 100, z: 0, zoneId: 'central_bar' });
    });

    it('should update peer position', () => {
      const newPosition = { x: 200, y: 200, z: 0, zoneId: 'gaming' };

      engine.updatePeerPosition('peer1', newPosition);

      expect(engine.peerPositions.get('peer1')).toEqual(newPosition);
    });

    it('should warn when updating non-existent peer', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation();

      engine.updatePeerPosition('non-existent', { x: 0, y: 0, z: 0, zoneId: 'central_bar' });

      expect(consoleWarnSpy).toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });

    it('should update listener position and recalculate all peer volumes', () => {
      const mediaStream2 = mockMediaStream();
      engine.addPeer('peer2', mediaStream2, { x: 200, y: 200, z: 0, zoneId: 'firepit' });

      const initialPeerCount = engine.peerGainNodes.size;
      engine.updateListenerPosition({ x: 50, y: 50, z: 0 });

      expect(engine.listenerPosition).toEqual({ x: 50, y: 50, z: 0 });
      expect(engine.peerGainNodes.size).toBe(initialPeerCount); // All peers still present
    });

    it('should use full volume when spatial audio disabled', () => {
      engine.setSpatialEnabled(false);

      const gainNode = engine.peerGainNodes.get('peer1');
      expect(gainNode.gain.value).toBe(engine.masterVolume);
    });
  });

  describe('volume control', () => {
    beforeEach(async () => {
      await engine.initialize();
    });

    it('should set master volume', () => {
      engine.setMasterVolume(0.5);

      expect(engine.masterVolume).toBe(0.5);
      expect(engine.masterGainNode.gain.linearRampToValueAtTime).toHaveBeenCalledWith(
        0.5,
        expect.any(Number)
      );
    });

    it('should reject invalid master volume', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation();

      engine.setMasterVolume(1.5); // Too high
      expect(engine.masterVolume).toBe(1.0); // Should not change

      engine.setMasterVolume(-0.1); // Negative
      expect(engine.masterVolume).toBe(1.0); // Should not change

      expect(consoleErrorSpy).toHaveBeenCalledTimes(2);
      consoleErrorSpy.mockRestore();
    });

    it('should toggle spatial audio', () => {
      expect(engine.spatialEnabled).toBe(true);

      engine.setSpatialEnabled(false);
      expect(engine.spatialEnabled).toBe(false);

      engine.setSpatialEnabled(true);
      expect(engine.spatialEnabled).toBe(true);
    });
  });

  describe('distance and volume queries', () => {
    beforeEach(async () => {
      await engine.initialize();
      const mediaStream = mockMediaStream();
      engine.addPeer('peer1', mediaStream, { x: 300, y: 400, z: 0, zoneId: 'gaming' });
    });

    it('should calculate distance to peer correctly', () => {
      // Distance from origin (0,0) to (300, 400) = 500
      const distance = engine.getDistanceToPeer('peer1');
      expect(distance).toBe(500);
    });

    it('should return null for non-existent peer distance', () => {
      const distance = engine.getDistanceToPeer('non-existent');
      expect(distance).toBeNull();
    });

    it('should get peer volume', () => {
      const volume = engine.getPeerVolume('peer1');
      expect(volume).toBeDefined();
      expect(typeof volume).toBe('number');
    });

    it('should return null for non-existent peer volume', () => {
      const volume = engine.getPeerVolume('non-existent');
      expect(volume).toBeNull();
    });
  });

  describe('state management', () => {
    it('should return current state', async () => {
      const initialState = engine.getState();

      expect(initialState.initialized).toBe(false);
      expect(initialState.peerCount).toBe(0);

      await engine.initialize();
      const mediaStream = mockMediaStream();
      engine.addPeer('peer1', mediaStream);

      const updatedState = engine.getState();
      expect(updatedState.initialized).toBe(true);
      expect(updatedState.peerCount).toBe(1);
      expect(updatedState.spatialEnabled).toBe(true);
    });
  });

  describe('cleanup', () => {
    beforeEach(async () => {
      await engine.initialize();
      const mediaStream1 = mockMediaStream();
      const mediaStream2 = mockMediaStream();
      engine.addPeer('peer1', mediaStream1);
      engine.addPeer('peer2', mediaStream2);
    });

    it('should destroy engine and clean up resources', () => {
      expect(engine.peerGainNodes.size).toBe(2);

      engine.destroy();

      expect(engine.peerGainNodes.size).toBe(0);
      expect(engine.peerPositions.size).toBe(0);
      expect(engine.initialized).toBe(false);
      expect(engine.audioContext.close).toHaveBeenCalled();
    });

    it('should disconnect all gain nodes on destroy', () => {
      const gainNodes = Array.from(engine.peerGainNodes.values());

      engine.destroy();

      gainNodes.forEach((node) => {
        expect(node.disconnect).toHaveBeenCalled();
      });
    });
  });

  describe('edge cases', () => {
    beforeEach(async () => {
      await engine.initialize();
    });

    it('should handle zero distance (same position)', () => {
      const mediaStream = mockMediaStream();
      engine.addPeer('peer1', mediaStream, { x: 0, y: 0, z: 0, zoneId: 'central_bar' });

      const distance = engine.getDistanceToPeer('peer1');
      expect(distance).toBe(0);
    });

    it('should handle very large distance', () => {
      const mediaStream = mockMediaStream();
      engine.addPeer('peer1', mediaStream, { x: 10000, y: 10000, z: 0, zoneId: 'gaming' });

      const distance = engine.getDistanceToPeer('peer1');
      expect(distance).toBeGreaterThan(1000);
    });

    it('should handle rapid position updates', () => {
      const mediaStream = mockMediaStream();
      engine.addPeer('peer1', mediaStream, { x: 0, y: 0, z: 0, zoneId: 'central_bar' });

      // Simulate rapid movement
      for (let i = 0; i < 100; i++) {
        engine.updatePeerPosition('peer1', { x: i, y: i, z: 0, zoneId: 'central_bar' });
      }

      expect(engine.peerPositions.get('peer1')).toEqual({
        x: 99,
        y: 99,
        z: 0,
        zoneId: 'central_bar',
      });
    });
  });
});
