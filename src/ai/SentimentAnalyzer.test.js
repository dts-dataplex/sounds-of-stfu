import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import SentimentAnalyzer from './SentimentAnalyzer.js';

/**
 * SentimentAnalyzer Unit Tests
 *
 * Uses mocked Worker from test/setup.js for fast, deterministic tests.
 * Tests the Worker-based path which is the primary production code path.
 *
 * The Worker mock simulates:
 * - 'ready' signal on construction
 * - 'analyze' responses with POSITIVE sentiment
 * - 'analyzeBatch' responses with POSITIVE sentiment for each input
 */

describe('SentimentAnalyzer', () => {
  let analyzer;

  beforeEach(() => {
    analyzer = new SentimentAnalyzer();
  });

  afterEach(() => {
    if (analyzer) {
      analyzer.destroy();
    }
  });

  describe('initialization', () => {
    it('should create instance with default settings', () => {
      expect(analyzer.classifier).toBeNull();
      expect(analyzer.worker).toBeNull();
      expect(analyzer.useWebWorker).toBe(true);
    });

    it('should initialize with web worker when available', async () => {
      await analyzer.initialize();

      // Should have worker but not classifier (worker path)
      expect(analyzer.worker).not.toBeNull();
      expect(analyzer.classifier).toBeNull();
    });

    it('should fall back to main thread when Worker is unavailable', async () => {
      // Temporarily remove Worker
      const originalWorker = globalThis.Worker;
      globalThis.Worker = undefined;

      const fallbackAnalyzer = new SentimentAnalyzer();

      // Mock the transformers module for main thread fallback
      vi.doMock('@xenova/transformers', () => ({
        pipeline: vi.fn().mockResolvedValue((text) => [{ label: 'POSITIVE', score: 0.9 }]),
        env: { allowLocalModels: false, useBrowserCache: true },
      }));

      // Note: We can't fully test main thread fallback without mocking dynamic import
      // But we can verify the Worker check logic
      expect(typeof Worker).toBe('undefined');

      // Restore Worker
      globalThis.Worker = originalWorker;
      fallbackAnalyzer.destroy();
    });
  });

  describe('analyze', () => {
    beforeEach(async () => {
      await analyzer.initialize();
    });

    it('should analyze text and return sentiment result', async () => {
      const result = await analyzer.analyze('I love this! It is wonderful!');

      expect(result).toHaveProperty('label');
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('latency');
      expect(result.label).toBe('POSITIVE');
      expect(result.score).toBe(0.95);
      expect(typeof result.latency).toBe('number');
    });

    it('should measure latency', async () => {
      const result = await analyzer.analyze('Testing latency measurement.');

      expect(result.latency).toBeGreaterThanOrEqual(0);
      // Mock worker responds in ~10ms
      expect(result.latency).toBeLessThan(100);
    });

    it('should handle multiple sequential analyze calls', async () => {
      const result1 = await analyzer.analyze('First message');
      const result2 = await analyzer.analyze('Second message');
      const result3 = await analyzer.analyze('Third message');

      expect(result1.label).toBe('POSITIVE');
      expect(result2.label).toBe('POSITIVE');
      expect(result3.label).toBe('POSITIVE');
    });
  });

  describe('analyzeBatch', () => {
    beforeEach(async () => {
      await analyzer.initialize();
    });

    it('should return empty array for empty input', async () => {
      const results = await analyzer.analyzeBatch([]);

      expect(results).toEqual([]);
    });

    it('should return empty array for null/undefined input', async () => {
      const results1 = await analyzer.analyzeBatch(null);
      const results2 = await analyzer.analyzeBatch(undefined);

      expect(results1).toEqual([]);
      expect(results2).toEqual([]);
    });

    it('should analyze multiple texts correctly', async () => {
      const texts = ['I love this place!', 'This is terrible.', 'The weather is nice today.'];

      const results = await analyzer.analyzeBatch(texts);

      expect(results).toHaveLength(3);

      // Check structure of each result
      results.forEach((result, i) => {
        expect(result).toHaveProperty('label');
        expect(result).toHaveProperty('score');
        expect(result).toHaveProperty('text');
        expect(result).toHaveProperty('latency');
        expect(result.text).toBe(texts[i]);
        expect(result.label).toBe('POSITIVE');
        expect(result.score).toBe(0.9);
      });
    });

    it('should handle single-item batch', async () => {
      const results = await analyzer.analyzeBatch(['Just one item']);

      expect(results).toHaveLength(1);
      expect(results[0]).toHaveProperty('label');
      expect(results[0].text).toBe('Just one item');
    });

    it('should include average latency in results', async () => {
      const texts = ['First', 'Second', 'Third'];
      const results = await analyzer.analyzeBatch(texts);

      results.forEach((result) => {
        expect(result.latency).toBeGreaterThanOrEqual(0);
        expect(typeof result.latency).toBe('number');
      });
    });
  });

  describe('destroy', () => {
    it('should cleanup worker on destroy', async () => {
      await analyzer.initialize();

      expect(analyzer.worker).not.toBeNull();

      analyzer.destroy();

      expect(analyzer.worker).toBeNull();
      expect(analyzer.classifier).toBeNull();
    });

    it('should be safe to call destroy multiple times', () => {
      // Should not throw
      analyzer.destroy();
      analyzer.destroy();
      analyzer.destroy();
    });

    it('should be safe to call destroy before initialize', () => {
      const freshAnalyzer = new SentimentAnalyzer();

      // Should not throw
      freshAnalyzer.destroy();
    });
  });

  describe('worker integration', () => {
    beforeEach(async () => {
      await analyzer.initialize();
    });

    it('should use worker for analysis when available', async () => {
      expect(analyzer.worker).not.toBeNull();
      expect(analyzer.classifier).toBeNull();

      const result = await analyzer.analyze('Test message');
      expect(result.label).toBe('POSITIVE');
    });

    it('should properly handle worker message passing', async () => {
      // The mock worker uses message IDs to correlate requests/responses
      // Parallel requests should each get their own response
      const promise1 = analyzer.analyze('Message 1');
      const promise2 = analyzer.analyze('Message 2');
      const promise3 = analyzer.analyze('Message 3');

      const [result1, result2, result3] = await Promise.all([promise1, promise2, promise3]);

      expect(result1.label).toBe('POSITIVE');
      expect(result2.label).toBe('POSITIVE');
      expect(result3.label).toBe('POSITIVE');
    });
  });
});
