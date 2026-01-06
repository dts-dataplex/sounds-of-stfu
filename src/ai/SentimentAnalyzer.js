/**
 * Sentiment Analyzer using DistilBERT
 * Model: Xenova/distilbert-base-uncased-finetuned-sst-2-english
 *
 * Privacy: 100% local processing, no external API calls
 * Performance: <200ms p95 latency, ~280MB memory
 */

// Lazy load transformers to avoid bundler issues with ONNX runtime
let pipeline, env;

async function loadTransformers() {
  if (!pipeline) {
    const transformers = await import('@huggingface/transformers');
    pipeline = transformers.pipeline;
    env = transformers.env;

    // Configure for browser environment
    env.allowLocalModels = false;
    env.useBrowserCache = true;
  }
  return { pipeline, env };
}

export default class SentimentAnalyzer {
  constructor() {
    this.classifier = null;
    this.worker = null;
    this.useWebWorker = true; // Use worker for non-blocking processing
  }

  async initialize() {
    const startTime = performance.now();

    if (this.useWebWorker && typeof Worker !== 'undefined') {
      // Try web worker first for background processing
      try {
        this.worker = new Worker(new URL('./workers/sentiment-worker.js', import.meta.url), {
          type: 'module',
        });

        // Wait for worker ready signal
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Worker initialization timeout after 30s'));
          }, 30000);

          this.worker.onmessage = (e) => {
            if (e.data.type === 'ready') {
              clearTimeout(timeout);
              console.log('[SentimentAnalyzer] Worker initialized');
              resolve();
            } else if (e.data.type === 'error') {
              clearTimeout(timeout);
              reject(new Error(`Worker error: ${e.data.error}`));
            }
          };

          this.worker.onerror = (error) => {
            clearTimeout(timeout);
            reject(error);
          };
        });
      } catch (workerError) {
        // Worker failed - fall back to main thread
        console.warn('[SentimentAnalyzer] Worker failed, falling back to main thread:', workerError.message);
        if (this.worker) {
          this.worker.terminate();
          this.worker = null;
        }
        await this._initializeMainThread();
      }
    } else {
      await this._initializeMainThread();
    }

    const loadTime = performance.now() - startTime;
    console.log(`[SentimentAnalyzer] Loaded in ${loadTime.toFixed(0)}ms`);
  }

  async _initializeMainThread() {
    console.log('[SentimentAnalyzer] Loading model on main thread...');
    const { pipeline: pipelineFn } = await loadTransformers();
    this.classifier = await pipelineFn(
      'sentiment-analysis',
      'Xenova/distilbert-base-uncased-finetuned-sst-2-english',
      { revision: 'main' }
    );
    console.log('[SentimentAnalyzer] Main thread initialization complete');
  }

  /**
   * Analyze sentiment of a single text
   */
  async analyze(text) {
    const startTime = performance.now();

    let result;
    if (this.worker) {
      // Use web worker
      result = await new Promise((resolve) => {
        const messageId = Math.random().toString(36);

        const handler = (e) => {
          if (e.data.id === messageId) {
            this.worker.removeEventListener('message', handler);
            resolve(e.data.result);
          }
        };

        this.worker.addEventListener('message', handler);
        this.worker.postMessage({
          type: 'analyze',
          id: messageId,
          text,
        });
      });
    } else {
      // Main thread fallback
      const output = await this.classifier(text);
      result = output[0];
    }

    const latency = performance.now() - startTime;

    return {
      label: result.label,
      score: result.score,
      latency: Math.round(latency),
    };
  }

  /**
   * Batch analyze multiple messages (more efficient)
   */
  async analyzeBatch(texts) {
    if (!Array.isArray(texts) || texts.length === 0) {
      return [];
    }

    const startTime = performance.now();

    let results;
    if (this.worker) {
      results = await new Promise((resolve) => {
        const messageId = Math.random().toString(36);

        const handler = (e) => {
          if (e.data.id === messageId) {
            this.worker.removeEventListener('message', handler);
            resolve(e.data.results);
          }
        };

        this.worker.addEventListener('message', handler);
        this.worker.postMessage({
          type: 'analyzeBatch',
          id: messageId,
          texts,
        });
      });
    } else {
      // Main thread batch processing
      const outputs = await this.classifier(texts);
      results = outputs.map((o) => ({ label: o.label, score: o.score }));
    }

    const totalLatency = performance.now() - startTime;
    const avgLatency = totalLatency / texts.length;

    console.log(
      `[SentimentAnalyzer] Batch ${texts.length} messages in ${totalLatency.toFixed(0)}ms (${avgLatency.toFixed(0)}ms avg)`
    );

    return results.map((r, i) => ({
      ...r,
      text: texts[i],
      latency: Math.round(avgLatency),
    }));
  }

  /**
   * Cleanup resources
   */
  destroy() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.classifier = null;
  }
}
