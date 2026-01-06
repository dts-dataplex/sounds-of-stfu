# Transformers.js Integration Completion Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix ONNX runtime compatibility, enable optional AI features, and add comprehensive tests for the Transformers.js-based sentiment analysis system.

**Architecture:** The AI module uses @xenova/transformers for in-browser ML inference via Web Workers. Sentiment analysis runs entirely client-side using DistilBERT. The module must be optional with runtime device capability detection.

**Tech Stack:** @xenova/transformers v2.17+, onnxruntime-web, Vite, Vitest, Web Workers

---

## Current State Summary

- `@xenova/transformers` v2.17.2 installed (depends on onnxruntime-web v1.14.0)
- `SentimentAnalyzer.js` implemented with Web Worker support
- `TopicDetector.js` is a stub (future feature)
- AI is **DISABLED** in `ChatsuboApp.js` due to ONNX runtime error
- Error: `TypeError: Cannot read properties of undefined (reading 'registerBackend')`
- No unit tests exist for the AI module
- Integration tests mock the AI module and pass

## Tasks Overview

1. **Task 1:** Fix ONNX runtime compatibility with Vite
2. **Task 2:** Add unit tests for SentimentAnalyzer
3. **Task 3:** Add device capability detection
4. **Task 4:** Re-enable AI in ChatsuboApp with optional loading
5. **Task 5:** Add UI toggle for AI features
6. **Task 6:** Verify end-to-end functionality

---

### Task 1: Fix ONNX Runtime Compatibility with Vite

**Files:**
- Modify: `vite.config.js`
- Modify: `src/ai/SentimentAnalyzer.js:9-13`
- Modify: `src/ai/workers/sentiment-worker.js:6-10`

**Step 1: Update Vite config to properly handle ONNX runtime**

The ONNX runtime uses dynamic imports and WASM files that Vite's dev server doesn't handle well by default. We need to configure Vite to serve these correctly.

Edit `vite.config.js`:

```javascript
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [],
  worker: {
    format: 'es',
  },
  optimizeDeps: {
    exclude: ['@xenova/transformers'],
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          peerjs: ['peerjs'],
        },
      },
    },
  },
  // Ensure WASM files are properly served
  assetsInclude: ['**/*.wasm'],
});
```

**Step 2: Run dev server to verify ONNX runtime loads**

Run: `npm run dev`

Open browser console and check for ONNX errors. The `registerBackend` error should be gone.

Expected: No ONNX-related errors in console

**Step 3: If Step 2 fails, try dynamic import approach**

If the error persists, modify `src/ai/SentimentAnalyzer.js` to use dynamic imports:

```javascript
// Replace lines 9-13 with:
// Lazy load transformers to avoid bundler issues
let pipeline, env;

async function loadTransformers() {
  if (!pipeline) {
    const transformers = await import('@xenova/transformers');
    pipeline = transformers.pipeline;
    env = transformers.env;
    env.allowLocalModels = false;
    env.useBrowserCache = true;
  }
  return { pipeline, env };
}
```

Then update `initialize()` method to call `loadTransformers()` first.

**Step 4: Commit**

```bash
git add vite.config.js src/ai/SentimentAnalyzer.js src/ai/workers/sentiment-worker.js
git commit -m "fix: resolve ONNX runtime compatibility with Vite bundler"
```

---

### Task 2: Add Unit Tests for SentimentAnalyzer

**Files:**
- Create: `src/ai/SentimentAnalyzer.test.js`
- Modify: `test/setup.js` (add Worker mock)

**Step 1: Add Worker mock to test setup**

Edit `test/setup.js`, add after line 120:

```javascript
// Mock Web Worker for AI tests
globalThis.Worker = class Worker {
  constructor(url, options) {
    this.url = url;
    this.options = options;
    this._events = new Map();
    this._messageHandler = null;
  }

  addEventListener(event, handler) {
    if (!this._events.has(event)) {
      this._events.set(event, []);
    }
    this._events.get(event).push(handler);
  }

  removeEventListener(event, handler) {
    const handlers = this._events.get(event) || [];
    const index = handlers.indexOf(handler);
    if (index > -1) handlers.splice(index, 1);
  }

  postMessage(data) {
    // Simulate async worker response
    setTimeout(() => {
      if (data.type === 'analyze') {
        this._emit('message', {
          data: {
            id: data.id,
            result: { label: 'POSITIVE', score: 0.95 },
          },
        });
      } else if (data.type === 'analyzeBatch') {
        this._emit('message', {
          data: {
            id: data.id,
            results: data.texts.map(() => ({ label: 'POSITIVE', score: 0.9 })),
          },
        });
      }
    }, 10);
  }

  _emit(event, data) {
    const handlers = this._events.get(event) || [];
    handlers.forEach((h) => h(data));
    // Also trigger onmessage if set
    if (event === 'message' && this.onmessage) {
      this.onmessage(data);
    }
  }

  terminate() {}
};
```

**Step 2: Run test setup to verify mock works**

Run: `npm test`

Expected: Existing tests still pass

**Step 3: Create SentimentAnalyzer test file**

Create `src/ai/SentimentAnalyzer.test.js`:

```javascript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import SentimentAnalyzer from './SentimentAnalyzer.js';

// Mock @xenova/transformers
vi.mock('@xenova/transformers', () => ({
  pipeline: vi.fn().mockResolvedValue(
    vi.fn().mockResolvedValue([{ label: 'POSITIVE', score: 0.95 }])
  ),
  env: {
    allowLocalModels: false,
    useBrowserCache: true,
  },
}));

describe('SentimentAnalyzer', () => {
  let analyzer;

  beforeEach(() => {
    analyzer = new SentimentAnalyzer();
  });

  afterEach(() => {
    if (analyzer) {
      analyzer.destroy();
    }
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should create instance with default settings', () => {
      expect(analyzer.classifier).toBeNull();
      expect(analyzer.worker).toBeNull();
      expect(analyzer.useWebWorker).toBe(true);
    });

    it('should initialize with web worker when available', async () => {
      // Simulate worker ready signal
      const originalWorker = globalThis.Worker;
      globalThis.Worker = class MockWorker {
        constructor() {
          setTimeout(() => {
            if (this.onmessage) {
              this.onmessage({ data: { type: 'ready' } });
            }
          }, 10);
        }
        addEventListener() {}
        removeEventListener() {}
        postMessage() {}
        terminate() {}
      };

      await analyzer.initialize();

      expect(analyzer.worker).toBeDefined();

      globalThis.Worker = originalWorker;
    });
  });

  describe('analyze', () => {
    beforeEach(async () => {
      // Mock worker initialization
      const originalWorker = globalThis.Worker;
      globalThis.Worker = class MockWorker {
        constructor() {
          this._handlers = new Map();
          setTimeout(() => {
            if (this.onmessage) {
              this.onmessage({ data: { type: 'ready' } });
            }
          }, 10);
        }
        addEventListener(event, handler) {
          if (!this._handlers.has(event)) {
            this._handlers.set(event, []);
          }
          this._handlers.get(event).push(handler);
        }
        removeEventListener(event, handler) {
          const handlers = this._handlers.get(event) || [];
          const idx = handlers.indexOf(handler);
          if (idx > -1) handlers.splice(idx, 1);
        }
        postMessage(data) {
          setTimeout(() => {
            const result = {
              id: data.id,
              result: { label: 'NEGATIVE', score: 0.87 },
            };
            const handlers = this._handlers.get('message') || [];
            handlers.forEach((h) => h({ data: result }));
          }, 5);
        }
        terminate() {}
      };

      await analyzer.initialize();
      globalThis.Worker = originalWorker;
    });

    it('should analyze single text and return sentiment', async () => {
      const result = await analyzer.analyze('This is terrible!');

      expect(result).toHaveProperty('label');
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('latency');
      expect(typeof result.latency).toBe('number');
    });

    it('should return label as POSITIVE or NEGATIVE', async () => {
      const result = await analyzer.analyze('I love this place!');

      expect(['POSITIVE', 'NEGATIVE']).toContain(result.label);
    });

    it('should return score between 0 and 1', async () => {
      const result = await analyzer.analyze('This is okay.');

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(1);
    });
  });

  describe('analyzeBatch', () => {
    beforeEach(async () => {
      const originalWorker = globalThis.Worker;
      globalThis.Worker = class MockWorker {
        constructor() {
          this._handlers = new Map();
          setTimeout(() => {
            if (this.onmessage) {
              this.onmessage({ data: { type: 'ready' } });
            }
          }, 10);
        }
        addEventListener(event, handler) {
          if (!this._handlers.has(event)) {
            this._handlers.set(event, []);
          }
          this._handlers.get(event).push(handler);
        }
        removeEventListener(event, handler) {
          const handlers = this._handlers.get(event) || [];
          const idx = handlers.indexOf(handler);
          if (idx > -1) handlers.splice(idx, 1);
        }
        postMessage(data) {
          setTimeout(() => {
            const result = {
              id: data.id,
              results: data.texts.map((_, i) => ({
                label: i % 2 === 0 ? 'POSITIVE' : 'NEGATIVE',
                score: 0.85 + i * 0.01,
              })),
            };
            const handlers = this._handlers.get('message') || [];
            handlers.forEach((h) => h({ data: result }));
          }, 5);
        }
        terminate() {}
      };

      await analyzer.initialize();
      globalThis.Worker = originalWorker;
    });

    it('should return empty array for empty input', async () => {
      const results = await analyzer.analyzeBatch([]);

      expect(results).toEqual([]);
    });

    it('should analyze multiple texts', async () => {
      const texts = ['Great!', 'Terrible!', 'Okay'];
      const results = await analyzer.analyzeBatch(texts);

      expect(results).toHaveLength(3);
      results.forEach((result, i) => {
        expect(result).toHaveProperty('label');
        expect(result).toHaveProperty('score');
        expect(result).toHaveProperty('text');
        expect(result.text).toBe(texts[i]);
      });
    });
  });

  describe('destroy', () => {
    it('should terminate worker on destroy', async () => {
      let terminated = false;
      const originalWorker = globalThis.Worker;
      globalThis.Worker = class MockWorker {
        constructor() {
          setTimeout(() => {
            if (this.onmessage) {
              this.onmessage({ data: { type: 'ready' } });
            }
          }, 10);
        }
        addEventListener() {}
        removeEventListener() {}
        postMessage() {}
        terminate() {
          terminated = true;
        }
      };

      await analyzer.initialize();
      analyzer.destroy();

      expect(terminated).toBe(true);
      expect(analyzer.worker).toBeNull();

      globalThis.Worker = originalWorker;
    });
  });
});
```

**Step 4: Run tests to verify they pass**

Run: `npm test src/ai/SentimentAnalyzer.test.js`

Expected: All tests pass

**Step 5: Commit**

```bash
git add test/setup.js src/ai/SentimentAnalyzer.test.js
git commit -m "test: add unit tests for SentimentAnalyzer"
```

---

### Task 3: Add Device Capability Detection

**Files:**
- Create: `src/ai/deviceCapability.js`
- Create: `src/ai/deviceCapability.test.js`

**Step 1: Write failing test for device capability detection**

Create `src/ai/deviceCapability.test.js`:

```javascript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { detectAICapability, AI_CONFIG } from './deviceCapability.js';

describe('deviceCapability', () => {
  let originalNavigator;

  beforeEach(() => {
    originalNavigator = globalThis.navigator;
  });

  afterEach(() => {
    globalThis.navigator = originalNavigator;
  });

  describe('AI_CONFIG', () => {
    it('should have minimum requirements defined', () => {
      expect(AI_CONFIG.minMemoryGB).toBe(4);
      expect(AI_CONFIG.minCPUCores).toBe(4);
    });
  });

  describe('detectAICapability', () => {
    it('should return true for capable device', async () => {
      globalThis.navigator = {
        ...originalNavigator,
        deviceMemory: 8,
        hardwareConcurrency: 8,
      };

      const result = await detectAICapability();

      expect(result.capable).toBe(true);
      expect(result.reason).toBeNull();
    });

    it('should return false for low memory device', async () => {
      globalThis.navigator = {
        ...originalNavigator,
        deviceMemory: 2,
        hardwareConcurrency: 8,
      };

      const result = await detectAICapability();

      expect(result.capable).toBe(false);
      expect(result.reason).toContain('memory');
    });

    it('should return false for low CPU cores device', async () => {
      globalThis.navigator = {
        ...originalNavigator,
        deviceMemory: 8,
        hardwareConcurrency: 2,
      };

      const result = await detectAICapability();

      expect(result.capable).toBe(false);
      expect(result.reason).toContain('CPU');
    });

    it('should use defaults when navigator APIs unavailable', async () => {
      globalThis.navigator = {
        ...originalNavigator,
        deviceMemory: undefined,
        hardwareConcurrency: undefined,
      };

      const result = await detectAICapability();

      // Should assume capable when can't detect (defaults to 4GB/4 cores)
      expect(result.capable).toBe(true);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test src/ai/deviceCapability.test.js`

Expected: FAIL (module not found)

**Step 3: Implement device capability detection**

Create `src/ai/deviceCapability.js`:

```javascript
/**
 * Device Capability Detection for AI Features
 * Determines if device can run local ML inference efficiently
 */

export const AI_CONFIG = {
  minMemoryGB: 4,
  minCPUCores: 4,
  defaultMemoryGB: 4, // Assume when API unavailable
  defaultCPUCores: 4,
};

/**
 * Detect if device is capable of running AI features
 * @returns {Promise<{capable: boolean, reason: string|null, specs: object}>}
 */
export async function detectAICapability() {
  // Get device specs (with fallbacks)
  const memoryGB = navigator.deviceMemory || AI_CONFIG.defaultMemoryGB;
  const cpuCores = navigator.hardwareConcurrency || AI_CONFIG.defaultCPUCores;

  const specs = {
    memoryGB,
    cpuCores,
    memoryAPIAvailable: 'deviceMemory' in navigator,
    cpuAPIAvailable: 'hardwareConcurrency' in navigator,
  };

  // Check minimum requirements
  if (memoryGB < AI_CONFIG.minMemoryGB) {
    return {
      capable: false,
      reason: `Insufficient memory: ${memoryGB}GB (minimum: ${AI_CONFIG.minMemoryGB}GB)`,
      specs,
    };
  }

  if (cpuCores < AI_CONFIG.minCPUCores) {
    return {
      capable: false,
      reason: `Insufficient CPU cores: ${cpuCores} (minimum: ${AI_CONFIG.minCPUCores})`,
      specs,
    };
  }

  return {
    capable: true,
    reason: null,
    specs,
  };
}

/**
 * Get AI feature status for display
 * @returns {Promise<string>}
 */
export async function getAIStatusMessage() {
  const { capable, reason, specs } = await detectAICapability();

  if (capable) {
    return `AI features available (${specs.memoryGB}GB RAM, ${specs.cpuCores} cores)`;
  }

  return `AI features disabled: ${reason}`;
}
```

**Step 4: Run test to verify it passes**

Run: `npm test src/ai/deviceCapability.test.js`

Expected: All tests pass

**Step 5: Commit**

```bash
git add src/ai/deviceCapability.js src/ai/deviceCapability.test.js
git commit -m "feat: add device capability detection for AI features"
```

---

### Task 4: Re-enable AI in ChatsuboApp with Optional Loading

**Files:**
- Modify: `src/ai/index.js`
- Modify: `src/ChatsuboApp.js:9,19,50-60,407-432`
- Modify: `src/ChatsuboApp.test.js` (update mocks)

**Step 1: Update AI index to export capability detection**

Edit `src/ai/index.js`, add to imports and exports:

```javascript
// Add at line 11
import { detectAICapability, getAIStatusMessage, AI_CONFIG } from './deviceCapability.js';

// Add at end of file (before last export)
export { detectAICapability, getAIStatusMessage, AI_CONFIG };
```

**Step 2: Run tests to ensure no regression**

Run: `npm test`

Expected: All tests pass

**Step 3: Update ChatsuboApp to use optional AI loading**

Edit `src/ChatsuboApp.js`:

Replace line 9 (commented import) with:
```javascript
// AI module is loaded dynamically based on device capability
```

Add new property in constructor (after line 19):
```javascript
    this.aiEnabled = false; // Set after capability detection
```

Replace lines 50-60 (AI initialization section) with:
```javascript
      // 2. Check AI capability and initialize if device supports it
      this.updateStatus('Checking AI capabilities...');
      try {
        const { detectAICapability, chatsuboAI } = await import('./ai/index.js');
        const { capable, reason } = await detectAICapability();

        if (capable) {
          this.updateStatus('Preparing AI systems...');
          await chatsuboAI.initialize();
          this.aiModule = chatsuboAI;
          this.aiEnabled = true;
          console.log('[ChatsuboApp] AI systems ready');
        } else {
          console.log(`[ChatsuboApp] AI disabled: ${reason}`);
          this.updateStatus(`AI unavailable: ${reason}`);
        }
      } catch (aiError) {
        console.warn('[ChatsuboApp] AI initialization failed (non-critical):', aiError.message);
        this.updateStatus('AI systems unavailable (continuing without AI features)');
      }
      await this.delay(500);
```

Update `handleChatMessage` method (around line 417) to check `aiEnabled`:
```javascript
    // Analyze sentiment (skip if AI disabled)
    if (this.aiEnabled && this.aiModule) {
```

**Step 4: Update test mocks**

Edit `src/ChatsuboApp.test.js`, update the AI mock (around line 38):

```javascript
vi.mock('./ai/index.js', () => ({
  chatsuboAI: {
    initialize: vi.fn().mockResolvedValue(),
    analyzeSentiment: vi.fn().mockResolvedValue({ label: 'POSITIVE', score: 0.9, latency: 100 }),
    isConversationHeated: vi.fn().mockResolvedValue(false),
  },
  detectAICapability: vi.fn().mockResolvedValue({ capable: true, reason: null }),
  getAIStatusMessage: vi.fn().mockResolvedValue('AI features available'),
  AI_CONFIG: { minMemoryGB: 4, minCPUCores: 4 },
}));
```

**Step 5: Run tests to verify**

Run: `npm test`

Expected: All tests pass

**Step 6: Commit**

```bash
git add src/ai/index.js src/ChatsuboApp.js src/ChatsuboApp.test.js
git commit -m "feat: re-enable AI with optional loading based on device capability"
```

---

### Task 5: Add UI Toggle for AI Features

**Files:**
- Modify: `index.html` (add AI toggle in settings panel)
- Modify: `src/main.js` (handle AI toggle)

**Step 1: Add AI settings section to HTML**

Edit `index.html`, find the settings panel (search for "settings" or similar UI section) and add:

```html
<!-- AI Settings -->
<div class="settings-section" id="ai-settings">
  <h4>AI Features</h4>
  <label class="toggle-label">
    <input type="checkbox" id="ai-enabled-toggle" />
    <span>Enable AI sentiment analysis</span>
  </label>
  <p id="ai-status" class="status-text">Checking device compatibility...</p>
</div>
```

**Step 2: Add CSS for AI settings (if needed)**

If no existing styles cover this, add to the `<style>` section:

```css
#ai-settings {
  padding: 10px;
  border-top: 1px solid rgba(68, 255, 136, 0.2);
  margin-top: 10px;
}

#ai-settings h4 {
  margin: 0 0 10px 0;
  color: #44ff88;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

#ai-status {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 8px;
}
```

**Step 3: Handle AI toggle in main.js**

Edit `src/main.js`, add after app initialization:

```javascript
// AI settings handling
const aiToggle = document.getElementById('ai-enabled-toggle');
const aiStatus = document.getElementById('ai-status');

if (aiToggle && aiStatus) {
  // Update UI based on AI state
  aiToggle.checked = app.aiEnabled;
  aiToggle.disabled = !app.aiEnabled; // Disable if device can't support AI

  if (app.aiEnabled) {
    aiStatus.textContent = 'AI features active';
  } else {
    aiStatus.textContent = 'AI unavailable on this device';
  }

  // Handle toggle change (for future: runtime enable/disable)
  aiToggle.addEventListener('change', (e) => {
    if (e.target.checked && !app.aiEnabled) {
      aiStatus.textContent = 'Restart required to enable AI';
    }
  });
}
```

**Step 4: Verify UI renders correctly**

Run: `npm run dev`

Open browser, navigate to settings panel, verify:
- AI toggle is visible
- Status message displays correctly
- Toggle is disabled if AI not supported

**Step 5: Commit**

```bash
git add index.html src/main.js
git commit -m "feat: add UI toggle for AI features with status display"
```

---

### Task 6: Verify End-to-End Functionality

**Files:**
- No file changes (verification only)

**Step 1: Run full test suite**

Run: `npm test`

Expected: All tests pass

**Step 2: Run linting**

Run: `npm run lint`

Expected: No linting errors

**Step 3: Start dev server and test manually**

Run: `npm run dev`

Manual verification checklist:
- [ ] App loads without console errors
- [ ] AI status displays correctly in settings
- [ ] If AI enabled: send test messages, verify sentiment analysis runs (check console)
- [ ] If AI disabled: app still functions normally
- [ ] Network features (WebRTC) still work
- [ ] 3D scene renders correctly

**Step 4: Test in Web Worker context**

Open browser DevTools > Application > Service Workers (or similar)

Verify:
- [ ] Sentiment worker initializes without errors
- [ ] Model loads from cache on subsequent visits

**Step 5: Document any remaining issues**

If any issues found, create GitHub issues:

```bash
gh issue create --title "Issue title" --body "Description of issue found during verification"
```

**Step 6: Final commit (if any fixes needed)**

```bash
git add -A
git commit -m "fix: address issues found during E2E verification"
```

---

## Verification Criteria

After completing all tasks, verify:

1. **No ONNX errors**: `npm run dev` loads without ONNX-related console errors
2. **Tests pass**: `npm test` shows all tests passing
3. **AI is optional**: App works with AI disabled (low-end device simulation)
4. **UI reflects state**: Settings show correct AI status
5. **Performance acceptable**: Sentiment analysis completes in <500ms (console timing)

## Rollback Plan

If integration fails catastrophically:

1. Revert to AI-disabled state:
   ```bash
   git checkout HEAD~n -- src/ChatsuboApp.js
   ```

2. Keep device capability detection for future use

3. Create issue documenting blocker for future resolution

## Related Documents

- `docs/user-stories/AI-001-optional-sentiment-analysis.md` - Full requirements
- `.claude/rules/adr-005-slm-evaluation.md` - SLM evaluation framework
- `src/ai/utils/performance-metrics.js` - Benchmarking utilities
