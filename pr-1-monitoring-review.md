## Observability & Monitoring Assessment - PR #1

**Reviewer:** Monitoring Expert
**Focus Area:** Logging, metrics, alerting, and operational visibility

---

### Executive Summary

**CRITICAL GAPS IDENTIFIED**: This PR implements WebSocket signaling infrastructure without adequate observability. While basic console logging exists, there is **no structured logging, no metrics collection, and no alerting** for production readiness.

**Risk Level:** **HIGH** - Production deployment without monitoring will result in:
- Blind spots during incidents (no metrics on connection failures, room capacity, peer churn)
- Inability to diagnose user connectivity issues
- No proactive alerting before service degradation
- No capacity planning data

---

### Detailed Findings

#### 1. Signaling Server Logging (signaling-server.js)

**Current State:**
- ✅ Basic console.log statements for key events (connections, joins, disconnects)
- ✅ Error logging for invalid messages and WebSocket errors
- ✅ Room capacity tracking visible in logs

**CRITICAL GAPS:**
- ❌ **No structured logging** - Plain console.log is not queryable/parseable
- ❌ **No log levels** (DEBUG/INFO/WARN/ERROR) - Everything treated equally
- ❌ **No request IDs/correlation IDs** - Cannot trace a single user's journey through logs
- ❌ **No timestamp standardization** - Logs lack ISO-8601 timestamps for correlation
- ❌ **No metrics emission** - Cannot track trends over time

**Recommendation:**
```javascript
// Replace console.log with structured logger
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'signaling-server.log' })
  ]
});

// Example usage
logger.info('Peer joined room', {
  event: 'peer_joined',
  peerId,
  roomId,
  roomSize: room.size,
  timestamp: new Date().toISOString()
});
```

---

#### 2. Metrics Collection - **MISSING ENTIRELY**

**What MUST be tracked:**

| Metric | Purpose | Alert Threshold |
|--------|---------|-----------------|
| `active_websocket_connections` | Total open WS connections | > 100 (warn), > 200 (critical) |
| `active_rooms` | Number of active rooms | > 20 (warn) |
| `peers_per_room` | Room occupancy histogram | Track capacity trends |
| `room_full_rejections` | Rejected joins (capacity) | > 5/min (warn) |
| `websocket_errors_total` | WS error count | > 10/min (warn) |
| `message_rate` | Messages/sec processed | Baseline for capacity planning |
| `reconnection_attempts` | Client reconnect rate | > 20/min (warn) |
| `average_session_duration` | How long users stay connected | Engagement metric |

**Implementation Required:**
- Add Prometheus client library (`prom-client`)
- Expose metrics endpoint at `/metrics`
- Instrument all key operations (joins, leaves, errors, messages)

**Example:**
```javascript
import { register, Counter, Gauge, Histogram } from 'prom-client';

const activeConnections = new Gauge({
  name: 'chatsubo_active_connections',
  help: 'Number of active WebSocket connections'
});

const roomFullRejections = new Counter({
  name: 'chatsubo_room_full_rejections_total',
  help: 'Number of join attempts rejected due to capacity'
});

// On room full
roomFullRejections.inc();
```

---

#### 3. Client-Side Observability (SignalingClient.js)

**Current State:**
- ✅ Console logging for connection state changes
- ✅ Reconnection backoff logic (exponential)
- ✅ Event emission for state changes

**GAPS:**
- ❌ **No telemetry on reconnection success rate** - Cannot measure reliability
- ❌ **No connection duration tracking** - Cannot identify flaky connections
- ❌ **No latency measurement** - Cannot detect slow signaling server responses
- ❌ **No client-side error aggregation** - Errors lost in browser console

**Recommendation:**
- Add `performance.now()` timing for connection establishment
- Emit metrics to client-side telemetry (e.g., Sentry, LogRocket, or local metrics API)
- Track reconnection attempts in localStorage for debugging

---

#### 4. Error Handling & Visibility

**Server-Side:**
- ✅ Errors logged to console
- ❌ **No error rate tracking** - Cannot alert on spike in errors
- ❌ **No error categorization** (client error vs server error)
- ❌ **No stack traces in logs** - Debugging will be painful

**Client-Side:**
- ✅ Errors emitted via event handlers
- ❌ **No error reporting to server** - Server blind to client-side failures
- ❌ **No user-visible error messages** - Silent failures confuse users

**Recommendation:**
- Implement error classification (INVALID_MESSAGE, ROOM_FULL, WS_ERROR, etc.)
- Add error rate metrics
- Send critical client errors to server for aggregation

---

#### 5. Alerting - **COMPLETELY ABSENT**

**MUST HAVE before production:**

| Alert | Condition | Severity | Action |
|-------|-----------|----------|--------|
| Signaling Server Down | No heartbeat for 30s | CRITICAL | Immediate notification |
| High Error Rate | >10 errors/min | WARNING | Investigate logs |
| Room Capacity Exceeded | >5 rejections/min | WARNING | Scale or increase capacity |
| Reconnection Storm | >50 reconnects/min | CRITICAL | Possible network issue |
| WebSocket Flood | >1000 msg/sec | CRITICAL | Potential DoS attack |

**Implementation Required:**
- Prometheus Alertmanager configuration
- Alert routing to `dataplex@dataplextechnology.net`
- SMTP integration (smtp.office365.com:587)

---

#### 6. Health Check Endpoint - **MISSING**

**Current State:**
- HTTP server responds with 200 OK at root (`/`)
- No health check logic

**Recommendation:**
```javascript
server.on('request', (req, res) => {
  if (req.url === '/health') {
    const health = {
      status: 'healthy',
      uptime: process.uptime(),
      activeConnections: connectionToPeer.size,
      activeRooms: rooms.size,
      timestamp: new Date().toISOString()
    };
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(health));
  } else if (req.url === '/metrics') {
    // Prometheus metrics
    res.writeHead(200, { 'Content-Type': register.contentType });
    res.end(register.metrics());
  } else {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Chatsubo Signaling Server\n');
  }
});
```

---

#### 7. Peer Connection Tracking (MeshNetworkCoordinator.js)

**Current State:**
- ✅ Room size logging
- ✅ Peer join/leave events
- ✅ Capacity enforcement (10 user limit)

**GAPS:**
- ❌ **No connection success/failure rate** - Cannot measure mesh reliability
- ❌ **No peer connection latency** - Cannot identify slow connections
- ❌ **No churn rate tracking** (joins/leaves per minute) - Cannot detect instability

**Recommendation:**
- Emit metrics for peer connection attempts, successes, failures
- Track time-to-connect for each peer
- Monitor churn rate (high churn indicates network issues)

---

### Recommendations Summary

#### BLOCKING (Must fix before production):
1. **Add structured logging** with winston or pino (JSON format, log levels, timestamps)
2. **Implement metrics collection** with prom-client (connections, rooms, errors, message rate)
3. **Create Prometheus alerts** for critical conditions (server down, high error rate, capacity issues)
4. **Add /health and /metrics endpoints** for monitoring integration

#### HIGH PRIORITY (Should add soon):
5. **Client-side telemetry** for error tracking and latency measurement
6. **Error categorization** and rate tracking
7. **Connection duration and reconnection success metrics**

#### NICE TO HAVE (Future improvements):
8. **Distributed tracing** (OpenTelemetry) for multi-hop debugging
9. **Log aggregation** (Loki, ELK stack, or CloudWatch)
10. **Dashboards** (Grafana) for real-time visibility

---

### Suggested Monitoring Stack (Budget: Free/Open Source)

**For MVP:**
- **Structured Logging:** Winston (Node.js)
- **Metrics:** prom-client (Prometheus client)
- **Metrics Storage:** Prometheus (Docker container)
- **Alerting:** Prometheus Alertmanager
- **Dashboards:** Grafana (Docker container)
- **Log Storage:** File-based (rotate with logrotate)

**Estimated Resource Needs:**
- Prometheus: 512MB RAM, 10GB storage
- Grafana: 256MB RAM, 1GB storage
- Alertmanager: 128MB RAM, 500MB storage

Total: ~1GB RAM, 11.5GB storage (can run on single LXC container)

---

### Test Coverage Assessment

**Missing:**
- ❌ No unit tests for signaling-server.js
- ❌ No integration tests for WebSocket protocol
- ❌ No load testing (how many concurrent connections can it handle?)
- ❌ No chaos testing (what happens when signaling server goes down mid-session?)

**Recommendation:**
- Add `vitest` tests for message handling logic
- Add WebSocket client integration tests
- Document expected capacity limits (target: 100 concurrent connections, 20 rooms)

---

### Final Verdict

**APPROVE with conditions:**

This PR delivers functional peer discovery, but **production deployment requires monitoring infrastructure**. I recommend:

1. **Merge this PR** to unblock testing
2. **Immediately create follow-up issue**: "Add observability to signaling server (metrics, alerts, structured logging)"
3. **Priority: HIGH** - Do NOT deploy to production without monitoring
4. **Timeline:** Monitoring should be implemented within 1-2 weeks

**Monitoring is not optional** - It's the difference between a hobby project and production infrastructure.

---

**Next Steps:**
1. Create GitHub Issue for monitoring implementation
2. I can provide Prometheus/Grafana configuration templates
3. Consider adding monitoring setup to DevOps backlog (priority: P1)

Let me know if you need assistance designing the monitoring architecture.

---

**Generated by:** Monitoring Expert Agent
**Contact:** See homelab-admin for escalation to human operator
