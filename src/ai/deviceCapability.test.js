import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { detectAICapability, detectSTTCapability, AI_CONFIG, STT_CONFIG } from './deviceCapability.js';

describe('deviceCapability', () => {
  let originalNavigator;

  beforeEach(() => {
    originalNavigator = globalThis.navigator;
  });

  afterEach(() => {
    globalThis.navigator = originalNavigator;
  });

  describe('AI_CONFIG', () => {
    it('should have minimum requirements defined', () => {
      expect(AI_CONFIG.minMemoryGB).toBe(2);
      expect(AI_CONFIG.minCPUCores).toBe(2);
    });
  });

  describe('STT_CONFIG', () => {
    it('should have higher minimum requirements than AI_CONFIG', () => {
      expect(STT_CONFIG.minMemoryGB).toBe(4);
      expect(STT_CONFIG.minCPUCores).toBe(4);
      expect(STT_CONFIG.minMemoryGB).toBeGreaterThan(AI_CONFIG.minMemoryGB);
      expect(STT_CONFIG.minCPUCores).toBeGreaterThan(AI_CONFIG.minCPUCores);
    });
  });

  describe('detectAICapability', () => {
    it('should return true for capable device', async () => {
      globalThis.navigator = {
        ...originalNavigator,
        deviceMemory: 8,
        hardwareConcurrency: 8,
      };

      const result = await detectAICapability();

      expect(result.capable).toBe(true);
      expect(result.reason).toBeNull();
    });

    it('should return false for low memory device', async () => {
      globalThis.navigator = {
        ...originalNavigator,
        deviceMemory: 1, // Below minimum of 2
        hardwareConcurrency: 8,
      };

      const result = await detectAICapability();

      expect(result.capable).toBe(false);
      expect(result.reason).toContain('memory');
    });

    it('should return false for low CPU cores device', async () => {
      globalThis.navigator = {
        ...originalNavigator,
        deviceMemory: 8,
        hardwareConcurrency: 1, // Below minimum of 2
      };

      const result = await detectAICapability();

      expect(result.capable).toBe(false);
      expect(result.reason).toContain('CPU');
    });

    it('should use defaults when navigator APIs unavailable', async () => {
      globalThis.navigator = {
        ...originalNavigator,
        deviceMemory: undefined,
        hardwareConcurrency: undefined,
      };

      const result = await detectAICapability();

      // Should assume capable when can't detect (defaults to 4GB/4 cores)
      expect(result.capable).toBe(true);
    });
  });

  describe('detectSTTCapability', () => {
    it('should return true for high-spec device', async () => {
      globalThis.navigator = {
        ...originalNavigator,
        deviceMemory: 8,
        hardwareConcurrency: 8,
      };

      const result = await detectSTTCapability();

      expect(result.capable).toBe(true);
      expect(result.reason).toBeNull();
    });

    it('should return false for device meeting AI but not STT requirements', async () => {
      globalThis.navigator = {
        ...originalNavigator,
        deviceMemory: 2, // Meets AI but not STT
        hardwareConcurrency: 2, // Meets AI but not STT
      };

      // AI should work
      const aiResult = await detectAICapability();
      expect(aiResult.capable).toBe(true);

      // STT should NOT work
      const sttResult = await detectSTTCapability();
      expect(sttResult.capable).toBe(false);
      expect(sttResult.reason).toContain('STT');
    });

    it('should return false for low memory device', async () => {
      globalThis.navigator = {
        ...originalNavigator,
        deviceMemory: 2, // Below STT minimum of 4
        hardwareConcurrency: 8,
      };

      const result = await detectSTTCapability();

      expect(result.capable).toBe(false);
      expect(result.reason).toContain('memory');
    });

    it('should return false for low CPU cores device', async () => {
      globalThis.navigator = {
        ...originalNavigator,
        deviceMemory: 8,
        hardwareConcurrency: 2, // Below STT minimum of 4
      };

      const result = await detectSTTCapability();

      expect(result.capable).toBe(false);
      expect(result.reason).toContain('CPU');
    });

    it('should use defaults when navigator APIs unavailable', async () => {
      globalThis.navigator = {
        ...originalNavigator,
        deviceMemory: undefined,
        hardwareConcurrency: undefined,
      };

      const result = await detectSTTCapability();

      // Should assume capable when can't detect (defaults to 4GB/4 cores)
      expect(result.capable).toBe(true);
    });
  });
});
