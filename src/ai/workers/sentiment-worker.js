/**
 * Web Worker for Sentiment Analysis
 * Runs DistilBERT in background thread to avoid blocking UI
 */

import { pipeline, env } from '@xenova/transformers';

// Configure Transformers.js to use CDN (defaults to HuggingFace)
env.allowLocalModels = false;
env.useBrowserCache = true;

let classifier = null;

// Initialize the model when worker starts
async function initialize() {
  console.log('[SentimentWorker] Loading DistilBERT model...');
  try {
    // Load with explicit revision to ensure correct model path
    classifier = await pipeline(
      'sentiment-analysis',
      'Xenova/distilbert-base-uncased-finetuned-sst-2-english',
      { revision: 'main' }
    );
    console.log('[SentimentWorker] Model loaded successfully');

    // Send ready signal
    self.postMessage({ type: 'ready' });
  } catch (error) {
    console.error('[SentimentWorker] Failed to load model:', error);
    self.postMessage({ type: 'error', error: error.message });
  }
}

// Handle messages from main thread
self.onmessage = async (e) => {
  const { type, id, text, texts } = e.data;

  try {
    if (type === 'analyze') {
      // Single text analysis
      const result = await classifier(text);
      self.postMessage({
        id,
        result: result[0],
      });
    } else if (type === 'analyzeBatch') {
      // Batch analysis
      const results = await classifier(texts);
      self.postMessage({
        id,
        results: results.map((r) => ({ label: r.label, score: r.score })),
      });
    }
  } catch (error) {
    console.error('[SentimentWorker] Error:', error);
    self.postMessage({
      id,
      error: error.message,
    });
  }
};

// Start initialization
initialize();
