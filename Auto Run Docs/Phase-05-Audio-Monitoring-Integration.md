# Phase 05: Audio Quality Monitoring & Observability

This phase integrates audio metrics into the existing monitoring infrastructure, adds real-time quality dashboards, and implements automated audio quality alerts.

## Tasks

- [ ] Extend AudioMetrics class to export metrics in Prometheus format for integration with existing observability stack
- [ ] Create `src/monitoring/AudioMetricsCollector.ts` to aggregate per-peer audio metrics and calculate fleet-wide statistics (avg latency, p95 latency, total bandwidth)
- [ ] Add `/metrics/audio` endpoint to signaling server exposing audio quality metrics for Prometheus scraping
- [ ] Implement audio quality scoring algorithm (0-100) based on weighted factors: latency (40%), packet loss (30%), jitter (20%), bandwidth (10%)
- [ ] Create Grafana dashboard configuration for spatial audio monitoring with panels for peer count, audio quality distribution, zone occupancy, bandwidth usage
- [ ] Add real-time audio quality alert rules - trigger warning if >20% of peers have quality score <70, critical if >50% <50
- [ ] Implement client-side audio quality reporting - send metrics to signaling server every 30 seconds via WebSocket
- [ ] Create audio diagnostics report generator that captures snapshot of all audio state (peers, positions, zones, quality metrics) for troubleshooting
- [ ] Add audio event logging - log peer connect/disconnect, zone changes, quality degradation events to structured logs
- [ ] Implement audio quality history tracking - store last 24 hours of quality metrics per peer in local IndexedDB for trend analysis
- [ ] Create audio health check endpoint that validates Web Audio API availability, microphone permissions, and speaker output
- [ ] Add user-facing audio status indicator in UI - show green checkmark if all audio quality metrics are good, yellow warning if degraded, red error if critical issues
- [ ] Implement automated audio quality report - generate daily summary of audio performance and send via monitoring alerts
- [ ] Create performance profiling tools to identify audio processing bottlenecks - measure CPU time spent in spatial audio calculations
- [ ] Add integration tests for metrics collection accuracy using simulated peer connections with controlled network conditions