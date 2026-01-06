import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { detectAICapability, AI_CONFIG } from './deviceCapability.js';

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
});
