/**
 * @vitest-environment node
 */
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import SentimentAnalyzer from './SentimentAnalyzer.js';

/**
 * SentimentAnalyzer Unit Tests
 *
 * These tests use the REAL @xenova/transformers pipeline, not mocks.
 * First run will download the DistilBERT model (~67MB), subsequent runs use cache.
 *
 * We test the main-thread fallback path (when Worker is undefined) because:
 * 1. It uses the actual transformer pipeline
 * 2. The Worker just wraps the same logic in a background thread
 * 3. Testing real model behavior is more valuable than testing Worker message passing
 *
 * Note: Uses Node environment (not happy-dom) to allow real HTTP for model download.
 */

describe('SentimentAnalyzer', () => {
  // Store original Worker to restore after tests
  const originalWorker = globalThis.Worker;

  beforeAll(() => {
    // Disable Worker to force main-thread fallback path
    // This tests the real sentiment analysis logic
    // SentimentAnalyzer auto-detects Node.js and configures filesystem cache
    globalThis.Worker = undefined;
  });

  afterAll(() => {
    // Restore Worker
    globalThis.Worker = originalWorker;
  });

  describe('initialization', () => {
    it('should create instance with default settings', () => {
      const analyzer = new SentimentAnalyzer();

      expect(analyzer.classifier).toBeNull();
      expect(analyzer.worker).toBeNull();
      expect(analyzer.useWebWorker).toBe(true);

      analyzer.destroy();
    });

    it('should fall back to main thread when Worker is unavailable', async () => {
      const analyzer = new SentimentAnalyzer();

      await analyzer.initialize();

      // Should have classifier but no worker (main thread fallback)
      expect(analyzer.classifier).not.toBeNull();
      expect(analyzer.worker).toBeNull();

      analyzer.destroy();
    }, 60000); // Allow up to 60s for model download on first run
  });

  describe('analyze', () => {
    let analyzer;

    beforeAll(async () => {
      analyzer = new SentimentAnalyzer();
      await analyzer.initialize();
    }, 60000);

    afterAll(() => {
      if (analyzer) {
        analyzer.destroy();
      }
    });

    it('should analyze positive text correctly', async () => {
      const result = await analyzer.analyze('I love this! It is absolutely wonderful and amazing!');

      expect(result).toHaveProperty('label');
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('latency');
      expect(result.label).toBe('POSITIVE');
      expect(result.score).toBeGreaterThan(0.8);
      expect(typeof result.latency).toBe('number');
    });

    it('should analyze negative text correctly', async () => {
      const result = await analyzer.analyze('This is terrible! I hate it so much!');

      expect(result.label).toBe('NEGATIVE');
      expect(result.score).toBeGreaterThan(0.8);
    });

    it('should return score between 0 and 1', async () => {
      const result = await analyzer.analyze('This is a neutral statement about the weather.');

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(1);
    });

    it('should measure latency', async () => {
      const result = await analyzer.analyze('Testing latency measurement.');

      expect(result.latency).toBeGreaterThanOrEqual(0);
      expect(result.latency).toBeLessThan(5000); // Should be under 5 seconds
    });
  });

  describe('analyzeBatch', () => {
    let analyzer;

    beforeAll(async () => {
      analyzer = new SentimentAnalyzer();
      await analyzer.initialize();
    }, 60000);

    afterAll(() => {
      if (analyzer) {
        analyzer.destroy();
      }
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
      const texts = [
        'I love this place!',
        'This is terrible.',
        'The weather is nice today.',
      ];

      const results = await analyzer.analyzeBatch(texts);

      expect(results).toHaveLength(3);

      // Check structure of each result
      results.forEach((result, i) => {
        expect(result).toHaveProperty('label');
        expect(result).toHaveProperty('score');
        expect(result).toHaveProperty('text');
        expect(result).toHaveProperty('latency');
        expect(result.text).toBe(texts[i]);
        expect(['POSITIVE', 'NEGATIVE']).toContain(result.label);
      });

      // First should be positive
      expect(results[0].label).toBe('POSITIVE');
      // Second should be negative
      expect(results[1].label).toBe('NEGATIVE');
    });

    it('should handle single-item batch', async () => {
      const results = await analyzer.analyzeBatch(['Just one item']);

      expect(results).toHaveLength(1);
      expect(results[0]).toHaveProperty('label');
      expect(results[0].text).toBe('Just one item');
    });
  });

  describe('destroy', () => {
    it('should cleanup classifier on destroy', async () => {
      const analyzer = new SentimentAnalyzer();
      await analyzer.initialize();

      expect(analyzer.classifier).not.toBeNull();

      analyzer.destroy();

      expect(analyzer.classifier).toBeNull();
      expect(analyzer.worker).toBeNull();
    }, 60000);

    it('should be safe to call destroy multiple times', () => {
      const analyzer = new SentimentAnalyzer();

      // Should not throw
      analyzer.destroy();
      analyzer.destroy();
      analyzer.destroy();
    });
  });

  describe('performance', () => {
    let analyzer;

    beforeAll(async () => {
      analyzer = new SentimentAnalyzer();
      await analyzer.initialize();
    }, 60000);

    afterAll(() => {
      if (analyzer) {
        analyzer.destroy();
      }
    });

    it('should meet latency target (<200ms) after warmup', async () => {
      // Warmup call
      await analyzer.analyze('Warmup call to load model into memory.');

      // Measure actual latency
      const result = await analyzer.analyze('Testing performance target.');

      // Target: <200ms p95 latency (per ADR-005)
      // Allow some slack for CI environments
      expect(result.latency).toBeLessThan(500);
    });

    it('should process batch more efficiently than sequential', async () => {
      const texts = [
        'First message',
        'Second message',
        'Third message',
        'Fourth message',
        'Fifth message',
      ];

      // Batch processing
      const batchStart = performance.now();
      const batchResults = await analyzer.analyzeBatch(texts);
      const batchTime = performance.now() - batchStart;

      // Sequential processing
      const seqStart = performance.now();
      for (const text of texts) {
        await analyzer.analyze(text);
      }
      const seqTime = performance.now() - seqStart;

      expect(batchResults).toHaveLength(5);
      // Batch should be faster or similar (not significantly slower)
      // Allow 20% overhead for batch setup
      expect(batchTime).toBeLessThan(seqTime * 1.2);
    });
  });
});
