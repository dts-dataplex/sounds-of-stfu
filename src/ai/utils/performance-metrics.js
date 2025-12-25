/**
 * Performance Benchmarking Utilities
 * Measures AI model performance against ADR-005 targets
 */

export class PerformanceMetrics {
  constructor() {
    this.metrics = {
      latencies: [],
      memoryUsage: [],
      modelSize: 0,
    };
  }

  startMeasurement() {
    this.startTime = performance.now();
    this.startMemory = performance.memory?.usedJSHeapSize || 0;
  }

  endMeasurement() {
    const latency = performance.now() - this.startTime;
    const memoryUsed = (performance.memory?.usedJSHeapSize || 0) - this.startMemory;

    this.metrics.latencies.push(latency);
    this.metrics.memoryUsage.push(memoryUsed);

    return { latency, memoryUsed };
  }

  /**
   * Calculate p95 latency (95th percentile)
   */
  getP95Latency() {
    if (this.metrics.latencies.length === 0) return 0;

    const sorted = [...this.metrics.latencies].sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * 0.95) - 1;
    return sorted[index];
  }

  /**
   * Get peak memory usage
   */
  getPeakMemory() {
    if (this.metrics.memoryUsage.length === 0) return 0;
    return Math.max(...this.metrics.memoryUsage);
  }

  /**
   * Generate report for ADR-005 evaluation
   */
  generateReport(modelName) {
    const avgLatency =
      this.metrics.latencies.reduce((a, b) => a + b, 0) / this.metrics.latencies.length;
    const p95Latency = this.getP95Latency();
    const peakMemory = this.getPeakMemory();

    return {
      model: modelName,
      samples: this.metrics.latencies.length,
      latency: {
        avg: Math.round(avgLatency),
        p95: Math.round(p95Latency),
        target: 200, // ms
        passes: p95Latency < 200,
      },
      memory: {
        peak: Math.round(peakMemory / 1024 / 1024), // MB
        target: 500, // MB
        passes: peakMemory < 500 * 1024 * 1024,
      },
    };
  }

  reset() {
    this.metrics = {
      latencies: [],
      memoryUsage: [],
      modelSize: 0,
    };
  }
}

// Test harness for benchmarking
export async function benchmarkSentimentAnalysis() {
  console.log('=== Sentiment Analysis Benchmark ===\n');

  // Import dynamically to test
  const { default: SentimentAnalyzer } = await import('../SentimentAnalyzer.js');
  const analyzer = new SentimentAnalyzer();
  const metrics = new PerformanceMetrics();

  console.log('Initializing model...');
  await analyzer.initialize();

  // Test sentences
  const testSentences = [
    'This conversation is amazing and insightful!',
    'I completely disagree with your terrible opinion.',
    'The weather today is quite pleasant.',
    "This is getting heated and I'm very frustrated.",
    "Let's grab a drink at the bar.",
    "I'm really angry about this situation!",
    'Fascinating discussion about AI ethics.',
    'This is absolutely ridiculous and wrong!',
    'Nice to meet everyone here tonight.',
    'I strongly oppose this terrible idea!',
  ];

  console.log(`\nAnalyzing ${testSentences.length} test sentences...\n`);

  // Warm-up run (model initialization overhead)
  await analyzer.analyze(testSentences[0]);

  // Benchmark runs
  for (const sentence of testSentences) {
    metrics.startMeasurement();
    const result = await analyzer.analyze(sentence);
    metrics.endMeasurement();

    console.log(
      `[${result.label}] ${result.score.toFixed(3)} | ${result.latency}ms | "${sentence.substring(0, 50)}..."`
    );
  }

  // Generate report
  const report = metrics.generateReport('DistilBERT');

  console.log('\n=== Performance Report ===');
  console.log(`Model: ${report.model}`);
  console.log(`Samples: ${report.samples}`);
  console.log(`\nLatency:`);
  console.log(`  Average: ${report.latency.avg}ms`);
  console.log(
    `  P95: ${report.latency.p95}ms (target: <${report.latency.target}ms) ${report.latency.passes ? '✅' : '❌'}`
  );
  console.log(`\nMemory:`);
  console.log(
    `  Peak: ${report.memory.peak}MB (target: <${report.memory.target}MB) ${report.memory.passes ? '✅' : '❌'}`
  );

  analyzer.destroy();
  return report;
}

// Run if executed directly (Node.js environment)
if (typeof process !== 'undefined' && import.meta.url === `file://${process.argv[1]}`) {
  benchmarkSentimentAnalysis();
}
