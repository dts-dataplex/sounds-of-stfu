/**
 * SpeechTranscriber - Manages Whisper-based speech-to-text in a Web Worker
 *
 * Uses Xenova/whisper-tiny.en for fast, local transcription.
 * All processing happens client-side for privacy.
 */

export default class SpeechTranscriber {
  constructor() {
    this.worker = null;
    this.isInitialized = false;
    this.pendingRequests = new Map();
  }

  /**
   * Initialize the transcription worker and load the Whisper model
   * @returns {Promise<void>} Resolves when model is loaded and ready
   */
  async initialize() {
    if (this.isInitialized) return;

    console.log('[SpeechTranscriber] Initializing worker...');

    this.worker = new Worker(new URL('./workers/transcription-worker.js', import.meta.url), {
      type: 'module',
    });

    // Set up message handler
    this.worker.onmessage = (e) => this.handleWorkerMessage(e);

    // Wait for ready signal with timeout
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Transcription worker initialization timed out (60s)'));
      }, 60000);

      const readyHandler = (e) => {
        if (e.data.type === 'ready') {
          clearTimeout(timeout);
          this.worker.removeEventListener('message', readyHandler);
          this.isInitialized = true;
          resolve();
        } else if (e.data.type === 'error') {
          clearTimeout(timeout);
          this.worker.removeEventListener('message', readyHandler);
          reject(new Error(e.data.error));
        }
      };

      this.worker.addEventListener('message', readyHandler);
    });

    console.log('[SpeechTranscriber] Ready');
  }

  /**
   * Handle messages from the worker
   */
  handleWorkerMessage(e) {
    const { id, text, latency, error } = e.data;

    // Skip non-response messages (ready, error during init)
    if (!id) return;

    const pending = this.pendingRequests.get(id);
    if (!pending) {
      console.warn('[SpeechTranscriber] Received response for unknown request:', id);
      return;
    }

    this.pendingRequests.delete(id);

    if (error) {
      pending.reject(new Error(error));
    } else {
      pending.resolve({ text, latency });
    }
  }

  /**
   * Transcribe audio data to text
   * @param {Float32Array} audioData - Audio samples at 16kHz
   * @returns {Promise<{text: string, latency: number}>} Transcription result
   */
  async transcribe(audioData) {
    if (!this.isInitialized) {
      throw new Error('SpeechTranscriber not initialized. Call initialize() first.');
    }

    const id = Math.random().toString(36).substring(2, 15);

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });

      this.worker.postMessage({
        type: 'transcribe',
        id,
        audio: audioData,
      });
    });
  }

  /**
   * Check if the transcriber is ready
   * @returns {boolean}
   */
  isReady() {
    return this.isInitialized;
  }

  /**
   * Clean up resources
   */
  destroy() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.isInitialized = false;
    this.pendingRequests.clear();
    console.log('[SpeechTranscriber] Destroyed');
  }
}
