/**
 * Chatsubo AI Module - Privacy-First In-Browser Intelligence
 *
 * Provides local AI processing for:
 * - Sentiment analysis (booth privacy triggers)
 * - Topic detection (heat map clustering)
 * - Future: conversation summarization
 *
 * All processing happens client-side. No external API calls.
 */

import SentimentAnalyzer from './SentimentAnalyzer.js';
import TopicDetector from './TopicDetector.js';

class ChatsuboAI {
  constructor() {
    this.sentimentAnalyzer = null;
    this.topicDetector = null;
    this.initialized = false;
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
}

// Singleton instance
export const chatsuboAI = new ChatsuboAI();
export default chatsuboAI;
