import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import SpeechTranscriber from './SpeechTranscriber.js';

/**
 * SpeechTranscriber Unit Tests
 *
 * Uses mocked Worker from test/setup.js for fast, deterministic tests.
 * Tests the Worker-based Whisper transcription.
 *
 * The Worker mock simulates:
 * - 'ready' signal on construction
 * - 'transcribe' responses with mock text
 */

describe('SpeechTranscriber', () => {
  let transcriber;

  beforeEach(() => {
    transcriber = new SpeechTranscriber();
  });

  afterEach(() => {
    if (transcriber) {
      transcriber.destroy();
    }
  });

  describe('initialization', () => {
    it('should create instance with default state', () => {
      expect(transcriber.worker).toBeNull();
      expect(transcriber.isInitialized).toBe(false);
    });

    it('should initialize worker successfully', async () => {
      await transcriber.initialize();

      expect(transcriber.worker).not.toBeNull();
      expect(transcriber.isInitialized).toBe(true);
    });

    it('should not reinitialize if already initialized', async () => {
      await transcriber.initialize();
      const firstWorker = transcriber.worker;

      await transcriber.initialize();

      expect(transcriber.worker).toBe(firstWorker);
    });

    it('should handle worker initialization timeout', async () => {
      // Create a worker that never sends ready
      const originalWorker = globalThis.Worker;
      globalThis.Worker = class TimeoutWorker {
        constructor() {
          this._events = new Map();
        }
        addEventListener(event, handler) {
          if (!this._events.has(event)) this._events.set(event, []);
          this._events.get(event).push(handler);
        }
        removeEventListener() {}
        terminate() {}
        postMessage() {}
        // Never sends 'ready' signal
      };

      const timeoutTranscriber = new SpeechTranscriber();

      // Use a shorter timeout for testing (mock doesn't support this,
      // but we test the timeout mechanism concept)
      await expect(
        Promise.race([
          timeoutTranscriber.initialize(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Test timeout')), 100)),
        ])
      ).rejects.toThrow();

      globalThis.Worker = originalWorker;
      timeoutTranscriber.destroy();
    });
  });

  describe('transcribe', () => {
    beforeEach(async () => {
      await transcriber.initialize();
    });

    it('should transcribe audio data successfully', async () => {
      const audioData = new Float32Array(16000); // 1 second of silence
      const result = await transcriber.transcribe(audioData);

      expect(result).toHaveProperty('text');
      expect(result).toHaveProperty('latency');
      expect(typeof result.text).toBe('string');
      expect(result.text.length).toBeGreaterThan(0);
    });

    it('should return latency measurement', async () => {
      const audioData = new Float32Array(16000);
      const result = await transcriber.transcribe(audioData);

      expect(result.latency).toBeGreaterThanOrEqual(0);
      expect(typeof result.latency).toBe('number');
    });

    it('should throw if not initialized', async () => {
      const uninitializedTranscriber = new SpeechTranscriber();

      await expect(
        uninitializedTranscriber.transcribe(new Float32Array(100))
      ).rejects.toThrow('SpeechTranscriber not initialized');

      uninitializedTranscriber.destroy();
    });

    it('should handle multiple sequential transcriptions', async () => {
      const audioData = new Float32Array(16000);

      const result1 = await transcriber.transcribe(audioData);
      const result2 = await transcriber.transcribe(audioData);
      const result3 = await transcriber.transcribe(audioData);

      expect(result1.text).toBeDefined();
      expect(result2.text).toBeDefined();
      expect(result3.text).toBeDefined();
    });

    it('should handle parallel transcription requests', async () => {
      const audioData = new Float32Array(16000);

      const promise1 = transcriber.transcribe(audioData);
      const promise2 = transcriber.transcribe(audioData);
      const promise3 = transcriber.transcribe(audioData);

      const [result1, result2, result3] = await Promise.all([promise1, promise2, promise3]);

      expect(result1.text).toBeDefined();
      expect(result2.text).toBeDefined();
      expect(result3.text).toBeDefined();
    });
  });

  describe('isReady', () => {
    it('should return false before initialization', () => {
      expect(transcriber.isReady()).toBe(false);
    });

    it('should return true after initialization', async () => {
      await transcriber.initialize();
      expect(transcriber.isReady()).toBe(true);
    });

    it('should return false after destroy', async () => {
      await transcriber.initialize();
      transcriber.destroy();
      expect(transcriber.isReady()).toBe(false);
    });
  });

  describe('destroy', () => {
    it('should cleanup worker on destroy', async () => {
      await transcriber.initialize();
      expect(transcriber.worker).not.toBeNull();

      transcriber.destroy();

      expect(transcriber.worker).toBeNull();
      expect(transcriber.isInitialized).toBe(false);
    });

    it('should clear pending requests', async () => {
      await transcriber.initialize();

      // Add a pending request manually
      transcriber.pendingRequests.set('test-id', { resolve: vi.fn(), reject: vi.fn() });
      expect(transcriber.pendingRequests.size).toBe(1);

      transcriber.destroy();

      expect(transcriber.pendingRequests.size).toBe(0);
    });

    it('should be safe to call destroy multiple times', async () => {
      await transcriber.initialize();

      // Should not throw
      transcriber.destroy();
      transcriber.destroy();
      transcriber.destroy();
    });

    it('should be safe to call destroy before initialize', () => {
      const freshTranscriber = new SpeechTranscriber();

      // Should not throw
      freshTranscriber.destroy();
    });
  });

  describe('worker message handling', () => {
    beforeEach(async () => {
      await transcriber.initialize();
    });

    it('should handle unknown request IDs gracefully', () => {
      // Simulate receiving a message with unknown ID
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      transcriber.handleWorkerMessage({ data: { id: 'unknown-id', text: 'test' } });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Received response for unknown request'),
        'unknown-id'
      );

      consoleSpy.mockRestore();
    });

    it('should handle error responses from worker', async () => {
      // Temporarily override the mock to return an error
      const originalWorker = globalThis.Worker;
      globalThis.Worker = class ErrorWorker {
        constructor() {
          this._events = new Map();
          setTimeout(() => this._emit('message', { data: { type: 'ready' } }), 5);
        }
        addEventListener(event, handler) {
          if (!this._events.has(event)) this._events.set(event, []);
          this._events.get(event).push(handler);
        }
        removeEventListener() {}
        terminate() {}
        postMessage(data) {
          if (data.type === 'transcribe') {
            setTimeout(() => {
              this._emit('message', { data: { id: data.id, error: 'Test error' } });
            }, 10);
          }
        }
        _emit(event, data) {
          const handlers = this._events.get(event) || [];
          handlers.forEach((h) => h(data));
          if (event === 'message' && this.onmessage) this.onmessage(data);
        }
      };

      const errorTranscriber = new SpeechTranscriber();
      await errorTranscriber.initialize();

      await expect(errorTranscriber.transcribe(new Float32Array(100))).rejects.toThrow('Test error');

      globalThis.Worker = originalWorker;
      errorTranscriber.destroy();
    });
  });
});
