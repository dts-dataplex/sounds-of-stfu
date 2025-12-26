import { describe, it, expect } from 'vitest';
import {
  calculateWaveFalloff,
  calculateSpatialGain,
  calculateDistance,
  calculateDistance3D,
  calculateVolumeForSource,
  calculateCrossfadeDuration,
  sampleFalloffCurve,
} from './spatial-falloff.js';

describe('spatial-falloff', () => {
  describe('calculateWaveFalloff', () => {
    it('should return 1.0 at zero distance', () => {
      const gain = calculateWaveFalloff(0, 8.0);
      expect(gain).toBe(1.0);
    });

    it('should return 0.5 at falloff distance', () => {
      const gain = calculateWaveFalloff(8.0, 8.0);
      expect(gain).toBeCloseTo(0.5, 2);
    });

    it('should decrease with increasing distance', () => {
      const gain1 = calculateWaveFalloff(5, 8.0);
      const gain2 = calculateWaveFalloff(10, 8.0);
      const gain3 = calculateWaveFalloff(20, 8.0);

      expect(gain1).toBeGreaterThan(gain2);
      expect(gain2).toBeGreaterThan(gain3);
    });

    it('should never return negative gain', () => {
      const gain = calculateWaveFalloff(1000, 8.0);
      expect(gain).toBeGreaterThanOrEqual(0);
    });

    it('should be close to zero at very large distances', () => {
      const gain = calculateWaveFalloff(100, 8.0);
      expect(gain).toBeLessThan(0.1);
    });

    it('should respect different falloff distances', () => {
      // Smaller falloff distance = faster attenuation
      const gainSmallFalloff = calculateWaveFalloff(10, 5.0);
      const gainLargeFalloff = calculateWaveFalloff(10, 15.0);

      expect(gainSmallFalloff).toBeLessThan(gainLargeFalloff);
    });

    it('should throw error for negative distance', () => {
      expect(() => calculateWaveFalloff(-5, 8.0)).toThrow('Distance cannot be negative');
    });
  });

  describe('calculateSpatialGain (alias)', () => {
    it('should be identical to calculateWaveFalloff', () => {
      const distance = 10;
      const falloffDist = 8.0;

      const gain1 = calculateWaveFalloff(distance, falloffDist);
      const gain2 = calculateSpatialGain(distance, falloffDist);

      expect(gain1).toBe(gain2);
    });
  });

  describe('calculateDistance', () => {
    it('should calculate 2D Euclidean distance', () => {
      const pos1 = { x: 0, y: 0 };
      const pos2 = { x: 3, y: 4 };
      const distance = calculateDistance(pos1, pos2);
      expect(distance).toBe(5);
    });

    it('should return 0 for same position', () => {
      const pos = { x: 10, y: 20 };
      expect(calculateDistance(pos, pos)).toBe(0);
    });
  });

  describe('calculateDistance3D', () => {
    it('should calculate 3D Euclidean distance', () => {
      const pos1 = { x: 0, y: 0, z: 0 };
      const pos2 = { x: 2, y: 2, z: 1 };
      const distance = calculateDistance3D(pos1, pos2);
      expect(distance).toBe(3);
    });

    it('should return 0 for same position', () => {
      const pos = { x: 10, y: 20, z: 5 };
      expect(calculateDistance3D(pos, pos)).toBe(0);
    });
  });

  describe('calculateVolumeForSource', () => {
    it('should calculate volume for gaming zone', () => {
      const listener = { x: 0, y: 0 };
      const source = { x: 5, y: 0 };
      const volume = calculateVolumeForSource(listener, source, 'gaming');
      expect(volume).toBeGreaterThan(0);
      expect(volume).toBeLessThanOrEqual(1.0);
    });

    it('should apply hard cutoff for booth zone', () => {
      const listener = { x: 0, y: 0 };
      const insideBooth = { x: 0, y: 0 };
      const outsideBooth = { x: 5, y: 0 };

      const insideVolume = calculateVolumeForSource(listener, insideBooth, 'booth');
      const outsideVolume = calculateVolumeForSource(listener, outsideBooth, 'booth');

      expect(insideVolume).toBe(1.0);
      expect(outsideVolume).toBe(0.0);
    });

    it('should apply broadcast enhanced for stage zone', () => {
      const listener = { x: 0, y: 0 };
      const closeStage = { x: 5, y: 0 };
      const farStage = { x: 20, y: 0 };

      const closeVolume = calculateVolumeForSource(listener, closeStage, 'stage');
      const farVolume = calculateVolumeForSource(listener, farStage, 'stage');

      expect(closeVolume).toBeGreaterThan(farVolume);
      expect(farVolume).toBeGreaterThanOrEqual(0.4); // Base volume
    });

    it('should throw error for unknown zone', () => {
      const listener = { x: 0, y: 0 };
      const source = { x: 5, y: 0 };
      expect(() => calculateVolumeForSource(listener, source, 'invalid_zone')).toThrow(
        'Unknown zone'
      );
    });
  });

  describe('calculateCrossfadeDuration', () => {
    it('should calculate crossfade duration based on distance', () => {
      const duration = calculateCrossfadeDuration(6); // 6 feet
      expect(duration).toBe(2); // 6 feet / 3 feet per second
    });

    it('should return 0 for no movement', () => {
      expect(calculateCrossfadeDuration(0)).toBe(0);
    });
  });

  describe('sampleFalloffCurve', () => {
    it('should sample falloff curve at multiple distances', () => {
      const samples = sampleFalloffCurve('gaming', [0, 4, 8, 16]);
      expect(samples).toHaveLength(4);
      expect(samples[0].distance).toBe(0);
      expect(samples[0].volume).toBe(1.0);
    });

    it('should throw error for unknown zone', () => {
      expect(() => sampleFalloffCurve('invalid_zone', [0, 5, 10])).toThrow('Unknown zone');
    });
  });
});
