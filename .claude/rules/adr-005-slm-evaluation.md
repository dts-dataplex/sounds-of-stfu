# ADR-005: Local SLM Evaluation and Selection

**Status:** Approved
**Date:** 2025-12-24
**Team:** ai-engineer, mlops-engineer, security-expert

---

## Decision

When possible, identify SLM models that would be useful for a given problem domain, and develop an observable comparison of options with and without training or RAG that are able to produce reliable and accurate results with minimal or no remote calls for functionality and only retrieval of and publishing of shared or public data.

## Context

Privacy-first architecture requires processing sensitive data locally. Small Language Models (SLMs) running in-browser or on local infrastructure provide AI capabilities without cloud dependencies.

## Evaluation Framework

### 1. Problem Domain Analysis

**For each AI feature, identify:**

- Input data characteristics (text, audio, image)
- Privacy sensitivity (PII, conversations, metadata)
- Latency requirements (real-time, near-real-time, batch)
- Accuracy requirements (critical, important, nice-to-have)
- Context size needed (tokens)

### 2. SLM Candidate Selection

**Model families to evaluate:**

- **Phi-3.5-mini** (3.8B) - General reasoning, coding
- **Qwen2.5** (0.5B-7B) - Multilingual, efficiency
- **Gemma 2** (2B-9B) - Google, instruction-following
- **Llama 3.2** (1B-3B) - Meta, vision+text
- **SmolLM2** (135M-1.7B) - Ultra-efficient, on-device

**Domain-specific models:**

- **Whisper** (39M-1.5B) - Speech-to-text (already using)
- **Kokoro** - Text-to-speech (already using)
- **DistilBERT** (66M) - Sentiment analysis, classification
- **BERT-tiny** (4.4M) - Ultra-fast text embeddings

### 3. Deployment Options

**In-Browser (Transformers.js):**

```javascript
// Example: Sentiment analysis with DistilBERT
import { pipeline } from '@xenova/transformers';

const classifier = await pipeline(
  'sentiment-analysis',
  'Xenova/distilbert-base-uncased-finetuned-sst-2-english'
);

const result = await classifier('This conversation is getting heated.');
// { label: 'NEGATIVE', score: 0.87 }
```

**Local Server (Ollama/llama.cpp):**

```bash
# Run Phi-3.5-mini for conversation summaries
ollama run phi3.5:mini "Summarize this bar conversation: ..."
```

**Web Workers (Non-blocking):**

```javascript
// Heavy computation in background thread
const worker = new Worker('sentiment-worker.js');
worker.postMessage({ text: conversationText });
worker.onmessage = (e) => updateHeatmap(e.data.sentiment);
```

### 4. Observable Comparison

**Test each candidate across:**

| Metric         | Target        | Measurement                |
| -------------- | ------------- | -------------------------- |
| **Accuracy**   | >85% F1 score | Against labeled test set   |
| **Latency**    | <200ms p95    | Local benchmark suite      |
| **Memory**     | <500MB peak   | Browser DevTools profiling |
| **Model size** | <100MB ONNX   | Download size for web      |
| **Privacy**    | 100% local    | No external API calls      |

**Comparison methodology:**

```python
# Example: Sentiment analysis comparison
models = {
    "distilbert": DistilBERTSentiment(),
    "bert-tiny": BERTTinySentiment(),
    "lexicon": VaderSentiment(),  # baseline
}

results = {}
for name, model in models.items():
    metrics = evaluate_model(
        model=model,
        test_data=chatsubo_conversations,
        measure=["accuracy", "latency", "memory"]
    )
    results[name] = metrics

# Generate comparison report
generate_report(results, output="docs/slm-evaluation/sentiment-analysis.md")
```

### 5. RAG vs Fine-tuning Decision

**Use RAG (Retrieval-Augmented Generation) when:**

- Domain knowledge changes frequently
- Need to cite sources for transparency
- Model size constraints prevent knowledge embedding
- Knowledge corpus is large (>10k documents)

**Use fine-tuning when:**

- Domain vocabulary is specialized
- Need consistent output format
- Latency is critical (no retrieval overhead)
- Knowledge is stable and bounded

**Hybrid approach:**

- Fine-tune for domain vocabulary + output format
- RAG for up-to-date knowledge retrieval

## Sounds of STFU Use Cases

### Sentiment Analysis (Booth Privacy)

**Requirement:** Detect when conversation becomes "heated" for privacy prompts

**SLM Candidate:** DistilBERT (66M params)

- In-browser via Transformers.js
- <100ms latency per message
- 100% local, no API calls

**Evaluation:**

```javascript
// Test against labeled Chatsubo conversations
const testData = loadTestConversations();
const results = await evaluateSentimentModel(
  model: 'Xenova/distilbert-base-uncased-finetuned-sst-2-english',
  data: testData
);

// Expected: >85% accuracy, <200ms p95 latency
```

### Topic Detection (Heat Map)

**Requirement:** Cluster conversations by topic for heat map visualization

**SLM Candidate:** BERT-tiny (4.4M params) + K-means clustering

- Embed conversation messages
- Cluster similar embeddings
- Label clusters with representative keywords

**Evaluation:**

```python
# Compare embeddings quality
models = ["bert-tiny", "all-MiniLM-L6-v2", "e5-small"]
results = evaluate_topic_clustering(
    models=models,
    conversations=chatsubo_test_set,
    ground_truth_labels=manual_labels
)
```

### Conversation Summarization

**Requirement:** Generate summaries for newcomers joining mid-conversation

**SLM Candidate:** Phi-3.5-mini (3.8B params)

- Local Ollama server (not in-browser due to size)
- Batch processing every 5 minutes
- Output: 2-3 sentence summary

**RAG approach:**

- Retrieve last 20 messages from conversation
- Pass to Phi-3.5-mini with prompt: "Summarize this bar conversation in 2-3 sentences"
- Cache summary, update incrementally

**Evaluation:**

```bash
# Test summary quality
ollama run phi3.5:mini < test_conversations.txt > summaries.txt
# Manual review against ground truth summaries
# Measure: ROUGE-L score >0.7
```

## Privacy-First Requirements

**MUST enforce:**

- ✅ All AI processing happens client-side OR local server
- ✅ No conversation data sent to external APIs
- ✅ Model weights loaded from local cache (service worker)
- ✅ User consent before any AI processing
- ✅ Clear labeling: "AI-generated summary" vs user content

**MAY use external APIs for:**

- ✅ Public data retrieval (Wikipedia, news APIs)
- ✅ Publishing aggregated/anonymized metrics
- ✅ Model weight downloads (one-time, cached)

**MUST NOT:**

- ❌ Send conversation text to OpenAI/Anthropic/etc
- ❌ Use cloud-based sentiment/topic APIs
- ❌ Upload audio for transcription (already using local Whisper)

## Documentation Requirements

**For each SLM evaluation, create:**

`docs/slm-evaluation/<use-case>.md`:

```markdown
# SLM Evaluation: Sentiment Analysis

## Problem Domain

Detect conversation sentiment for booth privacy prompts

## Candidates Evaluated

1. DistilBERT (66M) - Winner ✅
2. BERT-tiny (4.4M)
3. VADER lexicon (baseline)

## Results

| Model      | Accuracy | Latency p95 | Memory | Size  |
| ---------- | -------- | ----------- | ------ | ----- |
| DistilBERT | 89.2%    | 145ms       | 280MB  | 67MB  |
| BERT-tiny  | 81.5%    | 68ms        | 95MB   | 16MB  |
| VADER      | 76.3%    | 8ms         | 5MB    | 500KB |

## Decision

Selected DistilBERT: Best accuracy/latency trade-off, acceptable memory.

## Implementation

- Transformers.js in web worker
- Model cached in service worker
- Batch processing (10 messages at a time)

## Privacy Verification

✅ No external API calls
✅ All processing in-browser
✅ Model loaded from local cache
```

## Consequences

**Benefits:**

- Privacy-first AI without cloud dependencies
- Transparent evaluation process
- Observable performance metrics
- User control over AI processing
- Lower operational costs (no API fees)

**Costs:**

- Upfront evaluation effort
- Model selection complexity
- Need to maintain local infrastructure (Ollama/llama.cpp)
- Browser compatibility challenges
- Model updates require re-evaluation

## Related

- ADR-001: Document evaluations in GitHub Wiki
- Privacy architecture: PeerJS P2P design (docs/adr/001)
