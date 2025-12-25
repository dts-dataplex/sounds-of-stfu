# User Story: AI-001 - Optional Sentiment Analysis

**Status:** Proposed
**Priority:** Medium
**Complexity:** 7/10
**Created:** 2025-12-25

## Story

As a **Chatsubo Virtual Bar user**, I would like to **have sentiment analysis automatically detect heated conversations and suggest moving to a private booth**, so that **sensitive discussions can happen in appropriate privacy settings without manual intervention**.

## Context

The Chatsubo design includes AI-powered features to enhance the social experience while maintaining privacy-first principles. Sentiment analysis runs locally in-browser using Transformers.js and DistilBERT to detect when conversations become heated or sensitive, triggering privacy prompts.

## Current Status

- ❌ **Blocked**: ONNX runtime compatibility issues with Vite 6.4.1
- ⚠️ **Temporarily Disabled**: AI module import commented out (commit 8c0f808)
- ✅ **Architecture Complete**: SentimentAnalyzer class with Web Worker implementation
- ✅ **Model Selected**: DistilBERT (66M params) via @xenova/transformers v2.17.0

## Performance Evaluation Criteria

Before enabling AI features in production, the following performance metrics must be verified on target platforms:

### Minimum Requirements

| Metric                    | Target                                | Rationale                              |
| ------------------------- | ------------------------------------- | -------------------------------------- |
| **Model Load Time**       | <5 seconds p95                        | User tolerance for initial load        |
| **Inference Latency**     | <200ms p95                            | Real-time conversation analysis        |
| **Memory Usage**          | <500MB peak                           | Browser stability on mid-range devices |
| **Model Size**            | <100MB download                       | Reasonable on mobile networks          |
| **Browser Compatibility** | Chrome 90+, Firefox 88+, Safari 14.1+ | Modern browser support                 |
| **Device Performance**    | 4GB+ RAM, modern GPU preferred        | Target minimum specs                   |

### Platform Testing Matrix

Test on the following representative platforms:

1. **Desktop - High-End**
   - MacBook Pro M1 (16GB RAM)
   - Windows Desktop (32GB RAM, RTX 3060)
   - Expected: All metrics well within targets

2. **Desktop - Mid-Range**
   - MacBook Air Intel (8GB RAM)
   - Windows Laptop (8GB RAM, integrated GPU)
   - Expected: Marginal performance, may need optimization

3. **Mobile - High-End**
   - iPhone 13 Pro, Pixel 6 Pro
   - Expected: Works but battery impact concerning

4. **Mobile - Mid-Range**
   - iPhone SE (2020), Pixel 4a
   - Expected: May not meet latency targets

5. **Mobile - Low-End**
   - iPhone 8, Android budget device
   - Expected: Likely fails memory constraints

### Decision Criteria

- **Enable by Default**: If metrics pass on all desktop platforms and high-end mobile
- **Enable with Device Detection**: If metrics pass on desktop and high-end mobile only
- **Disable by Default**: If metrics fail on >50% of tested platforms
- **Alternative Solution**: Consider cloud-based API if local processing fails

## Demonstrable Outcomes

When AI sentiment analysis is successfully implemented:

### Functional Outcomes

1. **Automatic Detection**: System detects conversation sentiment without user action
   - Verification: Send 10 test messages with varying sentiment, verify correct classification
   - Success: >85% accuracy on test conversations

2. **Privacy Prompts**: When conversation becomes heated, suggest booth relocation
   - Verification: Simulate heated conversation, verify privacy prompt appears
   - Success: Prompt appears within 5 seconds of sentiment threshold crossing

3. **Graceful Degradation**: System continues functioning if AI unavailable
   - Verification: Disable AI, verify app still loads and core features work
   - Success: No JavaScript errors, audio + networking functional

4. **Performance Transparency**: Users can see AI processing status
   - Verification: Check UI shows "AI analyzing..." or "AI unavailable" states
   - Success: Clear visual indicator of AI status

### Technical Outcomes

1. **ONNX Runtime Compatibility**: Resolve Vite bundling issues
   - Verification: `npm run dev` loads without console errors
   - Success: No `registerBackend` TypeError

2. **Memory Efficiency**: Model runs in Web Worker without blocking UI
   - Verification: Chrome DevTools memory profiling during inference
   - Success: <500MB peak memory usage

3. **Latency Benchmarks**: Sentiment analysis completes in <200ms
   - Verification: Console timing logs for 100 message analyses
   - Success: p95 latency <200ms

4. **Optional Architecture**: AI can be disabled via runtime flag
   - Verification: Set `enableAI: false` in config, verify app works
   - Success: No AI code loaded when disabled

## Acceptance Criteria

- [ ] ONNX runtime compatibility resolved (Vite bundling works)
- [ ] Performance benchmarks pass on desktop platforms (see matrix above)
- [ ] AI module architecture allows runtime enable/disable
- [ ] Sentiment analysis achieves >85% accuracy on test dataset
- [ ] Privacy prompts trigger correctly when conversation becomes heated
- [ ] App functions completely when AI disabled (graceful degradation)
- [ ] Memory usage stays <500MB peak during inference
- [ ] Model loads in <5 seconds on target platforms
- [ ] Inference latency <200ms p95 on desktop

## Implementation Approach

### Phase 1: Fix ONNX Runtime (Week 1)

**Options to Investigate:**

1. Upgrade onnxruntime-web to latest version (currently 1.14.0 → 1.20.0+)
2. Switch from Vite to different bundler (webpack, rollup)
3. Use dynamic imports for ONNX to avoid bundler processing
4. Alternative: Use TensorFlow.js instead of ONNX runtime

**Recommended**: Try option 1 (upgrade onnxruntime-web) first, fallback to option 3.

### Phase 2: Performance Benchmarking (Week 2)

1. Create automated benchmark suite
2. Test on platform matrix (see above)
3. Generate performance report
4. Decide: enable by default, device detection, or disable

### Phase 3: Optional Architecture (Week 3)

1. Implement runtime feature detection:

   ```javascript
   const AI_CONFIG = {
     enabled: detectAICapability(),
     minMemory: 4096, // 4GB minimum
     minCPUCores: 4,
     requiresGPU: false,
   };

   async function detectAICapability() {
     const memory = navigator.deviceMemory || 4; // GB
     const cpuCores = navigator.hardwareConcurrency || 4;
     return memory >= AI_CONFIG.minMemory && cpuCores >= AI_CONFIG.minCPUCores;
   }
   ```

2. Lazy-load AI module only when enabled:

   ```javascript
   if (AI_CONFIG.enabled) {
     const { chatsuboAI } = await import('./ai/index.js');
     this.aiModule = chatsuboAI;
     await this.aiModule.initialize();
   }
   ```

3. Add user preference toggle in UI:
   ```javascript
   <label>
     <input type="checkbox" id="enable-ai" checked={AI_CONFIG.enabled} />
     Enable AI features (sentiment analysis, conversation detection)
   </label>
   ```

### Phase 4: Production Testing (Week 4)

1. Deploy to test environment
2. Real-world user testing with variety of devices
3. Monitor performance metrics
4. Adjust based on feedback

## Dependencies

- **Blocking**: ONNX runtime compatibility fix
- **Related**: ADR-005 (SLM Evaluation and Selection)
- **Related**: Privacy architecture (booth privacy prompts)

## Risks and Mitigations

| Risk                                 | Probability | Impact | Mitigation                                       |
| ------------------------------------ | ----------- | ------ | ------------------------------------------------ |
| ONNX incompatibility persists        | Medium      | High   | Fallback to TensorFlow.js or cloud API           |
| Performance too slow on mobile       | High        | Medium | Disable on low-end devices, desktop-only feature |
| Model accuracy insufficient          | Low         | Medium | Fine-tune model on Chatsubo conversation dataset |
| Memory constraints on mobile         | High        | High   | Implement aggressive device detection            |
| User privacy concerns about local AI | Low         | Low    | Transparent communication, opt-out available     |

## Notes

- User feedback (2025-12-25): "make the AI subsystem optional and. At a use case or story for later basing that on performance evaluation of the platform on which the application is running."
- Current blocker: `TypeError: Cannot read properties of undefined (reading 'registerBackend')` at onnxruntime-web/dist/ort-web.min.js
- Alternative considered: Server-side sentiment analysis (rejected due to privacy-first architecture)

## Related Documents

- `CLAUDE.md` - Project overview and AI design guidance
- `AGENTIC_DESIGN_PATTERNS.md` - Agentic AI patterns for implementation
- `docs/plans/2025-12-24-bar-layout-and-privacy-architecture.md` - Booth privacy design
- `.claude/rules/adr-005-slm-evaluation.md` - SLM evaluation framework
- `src/ai/SentimentAnalyzer.js` - Current implementation (disabled)
- `src/ai/workers/sentiment-worker.js` - Web Worker implementation

## Success Metrics

- [ ] Zero console errors on app load
- [ ] Sentiment analysis functional on 80%+ of test platforms
- [ ] <5 second model load time on desktop
- [ ] <200ms inference latency on desktop
- [ ] User can toggle AI on/off in settings
- [ ] App fully functional with AI disabled
