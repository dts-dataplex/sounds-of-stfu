/**
 * AudioChunkProcessor - Captures and processes audio streams for transcription
 *
 * Captures audio from peer MediaStreams, chunks it into segments,
 * and provides Float32Array data suitable for Whisper transcription.
 */

export default class AudioChunkProcessor {
  /**
   * @param {Object} options
   * @param {number} options.sampleRate - Target sample rate (default: 16000 for Whisper)
   * @param {number} options.chunkDuration - Duration of each chunk in ms (default: 5000)
   * @param {number} options.silenceThreshold - Threshold below which audio is considered silence (default: 0.01)
   */
  constructor(options = {}) {
    this.sampleRate = options.sampleRate || 16000;
    this.chunkDuration = options.chunkDuration || 5000;
    this.silenceThreshold = options.silenceThreshold || 0.01;

    this.audioContext = null;
    this.processors = new Map(); // peerId -> processor state
    this.onChunkReady = null; // callback(peerId, audioData)
    this.isInitialized = false;
  }

  /**
   * Initialize the audio processing context
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      this.audioContext = new AudioContext({ sampleRate: this.sampleRate });
      this.isInitialized = true;
      console.log('[AudioChunkProcessor] Initialized with sample rate:', this.sampleRate);
    } catch (error) {
      console.error('[AudioChunkProcessor] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Start processing audio from a peer's media stream
   * @param {string} peerId - Unique identifier for the peer
   * @param {MediaStream} stream - The audio stream to process
   */
  startProcessing(peerId, stream) {
    if (!this.isInitialized) {
      console.warn('[AudioChunkProcessor] Not initialized, call initialize() first');
      return;
    }

    if (this.processors.has(peerId)) {
      console.warn('[AudioChunkProcessor] Already processing peer:', peerId);
      return;
    }

    try {
      const source = this.audioContext.createMediaStreamSource(stream);
      const analyser = this.audioContext.createAnalyser();
      analyser.fftSize = 2048;

      source.connect(analyser);

      const bufferLength = analyser.fftSize;
      const chunks = [];
      let lastChunkTime = Date.now();

      // Sample audio periodically
      const collectSample = () => {
        if (!this.processors.has(peerId)) return;

        const dataArray = new Float32Array(bufferLength);
        analyser.getFloatTimeDomainData(dataArray);
        chunks.push(dataArray);

        // Check if we have enough audio for a chunk
        if (Date.now() - lastChunkTime >= this.chunkDuration) {
          const audioData = this.mergeChunks(chunks);
          chunks.length = 0;
          lastChunkTime = Date.now();

          // Only emit if audio contains actual speech (not just silence)
          if (this.containsSpeech(audioData)) {
            if (this.onChunkReady) {
              this.onChunkReady(peerId, audioData);
            }
          }
        }
      };

      // Sample every 100ms
      const intervalId = setInterval(collectSample, 100);

      this.processors.set(peerId, {
        source,
        analyser,
        intervalId,
        chunks,
      });

      console.log('[AudioChunkProcessor] Started processing peer:', peerId);
    } catch (error) {
      console.error('[AudioChunkProcessor] Failed to start processing peer:', peerId, error);
    }
  }

  /**
   * Stop processing audio for a specific peer
   * @param {string} peerId
   */
  stopProcessing(peerId) {
    const processor = this.processors.get(peerId);
    if (!processor) return;

    clearInterval(processor.intervalId);
    processor.source.disconnect();
    this.processors.delete(peerId);

    console.log('[AudioChunkProcessor] Stopped processing peer:', peerId);
  }

  /**
   * Merge multiple audio chunks into a single Float32Array
   * @param {Float32Array[]} chunks
   * @returns {Float32Array}
   */
  mergeChunks(chunks) {
    if (chunks.length === 0) return new Float32Array(0);

    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const merged = new Float32Array(totalLength);

    let offset = 0;
    for (const chunk of chunks) {
      merged.set(chunk, offset);
      offset += chunk.length;
    }

    return merged;
  }

  /**
   * Check if audio data contains speech (above silence threshold)
   * @param {Float32Array} audioData
   * @returns {boolean}
   */
  containsSpeech(audioData) {
    if (audioData.length === 0) return false;

    // Calculate RMS (Root Mean Square) energy
    let sumSquares = 0;
    for (let i = 0; i < audioData.length; i++) {
      sumSquares += audioData[i] * audioData[i];
    }
    const rms = Math.sqrt(sumSquares / audioData.length);

    return rms > this.silenceThreshold;
  }

  /**
   * Get the number of active audio streams being processed
   * @returns {number}
   */
  getActiveCount() {
    return this.processors.size;
  }

  /**
   * Check if a peer is being processed
   * @param {string} peerId
   * @returns {boolean}
   */
  isProcessing(peerId) {
    return this.processors.has(peerId);
  }

  /**
   * Clean up all resources
   */
  destroy() {
    for (const peerId of this.processors.keys()) {
      this.stopProcessing(peerId);
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }

    this.audioContext = null;
    this.isInitialized = false;

    console.log('[AudioChunkProcessor] Destroyed');
  }
}
