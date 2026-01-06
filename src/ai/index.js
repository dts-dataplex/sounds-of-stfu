/**
 * Chatsubo AI Module - Privacy-First In-Browser Intelligence
 *
 * Provides local AI processing for:
 * - Sentiment analysis (booth privacy triggers)
 * - Speech-to-text transcription (audio conversation analysis)
 * - Topic detection (heat map clustering)
 * - Future: conversation summarization
 *
 * All processing happens client-side. No external API calls.
 */

import SentimentAnalyzer from './SentimentAnalyzer.js';
import SpeechTranscriber from './SpeechTranscriber.js';
import TopicDetector from './TopicDetector.js';
import {
  detectAICapability,
  detectSTTCapability,
  getAIStatusMessage,
  getSTTStatusMessage,
  AI_CONFIG,
  STT_CONFIG,
} from './deviceCapability.js';

class ChatsuboAI {
  constructor() {
    this.sentimentAnalyzer = null;
    this.speechTranscriber = null;
    this.topicDetector = null;
    this.initialized = false;
    this.sttEnabled = false; // STT loads separately (larger model)
  }

  /**
   * Initialize AI models (lazy loading)
   * Call this when user first enters the bar
   */
  async initialize() {
    if (this.initialized) return;

    console.log('[ChatsuboAI] Initializing local AI models...');
    const startTime = performance.now();

    // Initialize sentiment analyzer first (primary feature)
    this.sentimentAnalyzer = new SentimentAnalyzer();
    await this.sentimentAnalyzer.initialize();

    // Topic detector can be loaded later (progressive enhancement)
    // await this.initializeTopicDetector();

    this.initialized = true;
    const loadTime = performance.now() - startTime;
    console.log(`[ChatsuboAI] Initialized in ${loadTime.toFixed(0)}ms`);
  }

  async initializeTopicDetector() {
    if (!this.topicDetector) {
      this.topicDetector = new TopicDetector();
      await this.topicDetector.initialize();
    }
  }

  /**
   * Analyze sentiment of a conversation message
   * Returns: { label: 'POSITIVE'|'NEGATIVE', score: 0.0-1.0, latency: ms }
   */
  async analyzeSentiment(text) {
    if (!this.sentimentAnalyzer) {
      throw new Error('Sentiment analyzer not initialized. Call initialize() first.');
    }
    return await this.sentimentAnalyzer.analyze(text);
  }

  /**
   * Batch analyze multiple messages efficiently
   */
  async analyzeSentimentBatch(messages) {
    if (!this.sentimentAnalyzer) {
      throw new Error('Sentiment analyzer not initialized');
    }
    return await this.sentimentAnalyzer.analyzeBatch(messages);
  }

  /**
   * Detect topics from conversation messages
   */
  async detectTopics(messages) {
    if (!this.topicDetector) {
      await this.initializeTopicDetector();
    }
    return await this.topicDetector.detectTopics(messages);
  }

  /**
   * Check if conversation is "heated" (for booth privacy prompt)
   * Returns true if recent messages show negative sentiment
   */
  isConversationHeated(recentMessages) {
    // Analyze last 5 messages
    const samples = recentMessages.slice(-5);
    if (samples.length === 0) return false;

    // Batch analyze for efficiency
    return this.analyzeSentimentBatch(samples.map((m) => m.text)).then((results) => {
      const negativeCount = results.filter((r) => r.label === 'NEGATIVE' && r.score > 0.7).length;
      return negativeCount >= 3; // 3+ negative messages = heated
    });
  }

  /**
   * Initialize speech-to-text capability (lazy loaded, larger model)
   * Call this after main initialization for progressive enhancement
   */
  async initializeSTT() {
    if (this.sttEnabled) return;

    console.log('[ChatsuboAI] Loading speech-to-text model...');
    const startTime = performance.now();

    try {
      this.speechTranscriber = new SpeechTranscriber();
      await this.speechTranscriber.initialize();
      this.sttEnabled = true;

      const loadTime = performance.now() - startTime;
      console.log(`[ChatsuboAI] STT initialized in ${loadTime.toFixed(0)}ms`);
    } catch (error) {
      console.error('[ChatsuboAI] Failed to initialize STT:', error);
      this.sttEnabled = false;
      throw error;
    }
  }

  /**
   * Transcribe audio data to text
   * @param {Float32Array} audioData - Audio samples at 16kHz
   * @returns {Promise<{text: string, latency: number}>}
   */
  async transcribeAudio(audioData) {
    if (!this.speechTranscriber || !this.sttEnabled) {
      throw new Error('Speech transcriber not initialized. Call initializeSTT() first.');
    }
    return await this.speechTranscriber.transcribe(audioData);
  }

  /**
   * Process audio for sentiment analysis (transcribe then analyze)
   * @param {string} peerId - Identifier of the peer who spoke
   * @param {Float32Array} audioData - Audio samples at 16kHz
   * @returns {Promise<{text: string, sentiment: {label: string, score: number}, latency: {stt: number, sentiment: number}}>}
   */
  async processAudioForSentiment(peerId, audioData) {
    if (!this.sttEnabled) {
      throw new Error('STT not enabled');
    }

    // Transcribe audio to text
    const transcription = await this.transcribeAudio(audioData);

    // Skip empty transcriptions
    if (!transcription.text || transcription.text.trim().length === 0) {
      return null;
    }

    // Analyze sentiment of transcribed text
    const sentiment = await this.analyzeSentiment(transcription.text);

    return {
      peerId,
      text: transcription.text,
      sentiment: {
        label: sentiment.label,
        score: sentiment.score,
      },
      latency: {
        stt: transcription.latency,
        sentiment: sentiment.latency,
      },
    };
  }

  /**
   * Check if STT is available and ready
   * @returns {boolean}
   */
  isSTTEnabled() {
    return this.sttEnabled && this.speechTranscriber?.isReady();
  }

  /**
   * Clean up STT resources
   */
  destroySTT() {
    if (this.speechTranscriber) {
      this.speechTranscriber.destroy();
      this.speechTranscriber = null;
    }
    this.sttEnabled = false;
    console.log('[ChatsuboAI] STT destroyed');
  }
}

// Singleton instance
export const chatsuboAI = new ChatsuboAI();

// Re-export capability detection
export {
  detectAICapability,
  detectSTTCapability,
  getAIStatusMessage,
  getSTTStatusMessage,
  AI_CONFIG,
  STT_CONFIG,
};

export default chatsuboAI;
