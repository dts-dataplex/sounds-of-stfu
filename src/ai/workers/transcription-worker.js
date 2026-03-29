/**
 * Web Worker for Speech-to-Text Transcription
 * Runs Whisper model in background thread to avoid blocking UI
 */

// Lazy load transformers
let pipeline;

async function loadTransformers() {
  if (!pipeline) {
    const transformers = await import('@huggingface/transformers');
    pipeline = transformers.pipeline;
  }
  return { pipeline };
}

let transcriber = null;

async function initialize() {
  console.log('[TranscriptionWorker] Loading Whisper model...');
  try {
    const { pipeline: pipelineFn } = await loadTransformers();
    // Use whisper-tiny.en for speed (39M params)
    // English-only model is faster and more accurate for English
    transcriber = await pipelineFn(
      'automatic-speech-recognition',
      'Xenova/whisper-tiny.en',
      { dtype: 'q8' } // Quantized for faster inference
    );
    console.log('[TranscriptionWorker] Model loaded successfully');
    self.postMessage({ type: 'ready' });
  } catch (error) {
    console.error('[TranscriptionWorker] Failed to load model:', error);
    self.postMessage({ type: 'error', error: error.message });
  }
}

self.onmessage = async (e) => {
  const { type, id, audio } = e.data;

  if (type === 'transcribe') {
    if (!transcriber) {
      self.postMessage({ id, error: 'Transcriber not initialized' });
      return;
    }

    try {
      const startTime = performance.now();
      const result = await transcriber(audio, {
        language: 'en',
        task: 'transcribe',
      });
      const latency = Math.round(performance.now() - startTime);

      self.postMessage({
        id,
        text: result.text.trim(),
        latency,
      });
    } catch (error) {
      console.error('[TranscriptionWorker] Transcription error:', error);
      self.postMessage({ id, error: error.message });
    }
  }
};

// Start initialization
initialize();
