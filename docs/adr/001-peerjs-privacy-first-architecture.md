# ADR-001: PeerJS and Privacy-First Architecture for POC

**Status:** Accepted
**Date:** 2025-12-23
**Deciders:** Ann Claude (solo developer), informed by community values in STFU-steev.md
**Related Documents:** docs/plans/2025-12-23-peerjs-poc-design.md, PRODUCT_REQUIREMENTS.md

---

## Context

We need to build a proof-of-concept for spatial audio communication that validates the core concept: multiple conversations can coexist in one virtual space with distance-based volume mixing.

**Key Constraints:**
- Solo developer with 2-4 week timeline
- Community values privacy, security, and transparency
- Users are skeptical of platforms that monitor or record conversations
- Need to validate spatial audio concept before investing in infrastructure

**Decision Required:** What technology should we use for WebRTC audio infrastructure in the POC?

---

## Decision

We will use **PeerJS** for the proof-of-concept, accepting a 5-8 user limitation, rather than using managed services like Daily.co or Agora.

**Core Principles Established:**
1. **Privacy First:** Audio streams remain peer-to-peer; no third-party processing
2. **Open Source:** All core technology must be open source and auditable
3. **Self-Hostable:** Must be able to run entirely on infrastructure we control
4. **Minimal Dependencies:** Reluctance to depend on third-party services or products

---

## Options Considered

### Option 1: Managed WebRTC Services (Daily.co, Agora, Dolby.io) ❌

**Pros:**
- Fastest to POC (4-7 days)
- Handles all WebRTC complexity (NAT, TURN, reconnection)
- SFU architecture scales to 50+ users on free tier
- Professional audio quality and reliability
- Excellent debugging and monitoring tools

**Cons:**
- **PRIVACY VIOLATION:** Audio flows through third-party servers
- **SECURITY CONCERN:** Platforms could record or monitor conversations
- **TRUST ISSUE:** Community would reject this on principle
- **DEPENDENCY:** Locked into proprietary platform
- **COST:** Free tier temporary, paid plans required at scale
- **WASTED WORK:** Would need complete rebuild for production

**Why Rejected:** Fundamentally incompatible with community values. Even as "temporary" POC, it undermines trust and creates technical debt.

---

### Option 2: Raw WebRTC (No Abstraction) ❌

**Pros:**
- Maximum control and learning
- No dependencies or abstractions
- Peer-to-peer by default
- Free and open source

**Cons:**
- **TIMELINE:** 3-4 weeks minimum for solo developer (exceeds 2-4 week goal)
- **COMPLEXITY:** Signaling server, ICE candidates, SDP negotiation, connection management
- **RELIABILITY:** Debugging connection issues is time-consuming
- **DISTRACTION:** Focus shifts from spatial audio to WebRTC plumbing

**Why Rejected:** Violates YAGNI principle. We're validating spatial audio UX, not building WebRTC infrastructure. PeerJS provides same benefits with less complexity.

---

### Option 3: PeerJS (Peer-to-Peer Mesh) ✅ SELECTED

**Pros:**
- **PRIVACY:** True peer-to-peer audio - never touches third-party servers
- **OPEN SOURCE:** MIT license, auditable codebase
- **SELF-HOSTABLE:** Can self-host signaling server in production
- **SIMPLE:** Abstracts WebRTC complexity without hiding it
- **TRANSPARENT:** Community can verify audio stays private
- **LEARNING:** Understand real constraints (mesh scaling) upfront
- **NO VENDOR LOCK-IN:** Can migrate to mediasoup/LiveKit if needed

**Cons:**
- **SCALABILITY:** Mesh networking limits us to 5-8 users maximum
- **RELIABILITY:** More connection debugging than managed services
- **TIMELINE:** 7-12 days vs 4-7 days with Daily.co
- **FEATURES:** No built-in quality monitoring, automatic fallback, etc.

**Why Selected:** Aligns with core values while remaining practical. 5-8 user limit is acceptable for POC - we're validating the spatial audio concept, not building production infrastructure. Timeline impact (3-5 extra days) is worth maintaining community trust and avoiding technical debt.

---

### Option 4: Self-Hosted SFU (mediasoup, Jitsi, LiveKit) ❌

**Pros:**
- Privacy-first (self-hosted)
- Scales to 50+ users
- Open source
- Production-ready architecture

**Cons:**
- **TIMELINE:** 3-6 weeks minimum to set up, learn, deploy
- **COMPLEXITY:** Need to run servers, handle deployment, monitoring
- **OVERKILL:** Too much infrastructure for concept validation
- **DISTRACTION:** Focus shifts to DevOps instead of UX

**Why Rejected:** Right architecture for production, wrong tool for POC. Revisit after PeerJS validates the concept.

---

## Decision Rationale

### Privacy is Non-Negotiable

From STFU-steev.md:
> "Technology has advanced sufficiently that there should be a secure way to transparently utilize the technology in a way that demonstrates protection of privacy and security..."

The community this platform serves values privacy and transparency. Using Daily.co or similar services, even temporarily, would:
- Undermine trust before the project begins
- Signal that we don't take privacy seriously
- Create cognitive dissonance ("we value privacy but use surveillance-capable tools")

**Even for a POC, privacy is core to the product identity.**

### Learning Real Constraints Early

PeerJS's 5-8 user mesh limitation is a feature, not a bug, for POC:
- Forces us to understand scaling constraints upfront
- Prevents false validation (spatial audio might work differently at 50 users)
- Reveals real architectural decisions we'll face
- If mesh is insufficient, we learn NOW, not after building on it

**Better to know the truth early than discover it after launch.**

### Avoiding Technical Debt

Choosing Daily.co for speed creates guaranteed rework:
- Week 1-2: Build POC on Daily.co
- Week 3-4: Validate concept
- Week 5-8: Rebuild entire audio layer on PeerJS/SFU
- Result: 2 weeks wasted, learned nothing about production architecture

vs. PeerJS path:
- Week 1-2: Build POC on PeerJS (slower but learning)
- Week 3-4: Validate concept and architecture together
- Week 5+: Iterate or migrate to SFU with deep understanding

**5 extra days now saves 2+ weeks later.**

### Community Alignment

This community specifically values:
- Transparency over convenience
- Self-sovereignty over managed services
- Understanding over abstraction
- Privacy over features

Choosing PeerJS demonstrates these values from day one, building trust and credibility.

---

## Consequences

### Positive

1. **Trust Established:** Community knows audio stays private from day one
2. **Architectural Clarity:** Understand mesh limitations and SFU migration path
3. **No Vendor Lock-In:** Can switch providers or self-host at any time
4. **Learning Investment:** Deep understanding of WebRTC fundamentals
5. **Cost:** Free, no payment plans or rate limits to worry about

### Negative

1. **Timeline Impact:** ~5 extra days vs. managed service (7-12 days instead of 4-7)
2. **User Limit:** Only 5-8 concurrent users for POC testing
3. **Reliability Work:** More debugging connection issues than with managed service
4. **Feature Gaps:** No built-in quality monitoring, recording, analytics

### Accepted Trade-offs

**We accept:**
- Slower POC development (extra 5 days)
- More connection debugging
- 5-8 user limit for testing
- Less polished developer experience

**In exchange for:**
- Community trust and alignment with values
- No technical debt or future rework
- Understanding of real production constraints
- No vendor dependencies or costs

---

## Migration Path

### When POC Validates Concept

If spatial audio proves compelling and we need to scale beyond 8 users:

**Option A: Self-Hosted SFU (mediasoup)**
- Open source, high performance
- Full control and privacy
- Requires server infrastructure
- 2-3 week migration from PeerJS

**Option B: Self-Hosted Platform (Jitsi)**
- Complete platform, mature codebase
- Includes signaling, TURN, recording, etc.
- Heavier infrastructure requirements
- 3-4 week migration

**Option C: Managed Self-Hostable (LiveKit)**
- Modern architecture, good DX
- Can self-host or use their cloud
- Newer, smaller ecosystem
- 2-3 week migration

**All options maintain privacy-first, self-hostable principles.**

### If Mesh Proves Sufficient

If 8 users is enough for the community size:
- Self-host PeerJS signaling server
- Add TURN server for NAT traversal
- Build features on top of proven foundation
- No migration needed

---

## Monitoring This Decision

### Success Indicators

After POC completion, evaluate:
1. **Did PeerJS connections work reliably?** (>80% success rate)
2. **Was 5-8 user limit acceptable for testing?** (got meaningful feedback)
3. **Did we finish in 7-12 days?** (timeline was realistic)
4. **Did community trust the approach?** (privacy concerns addressed)

### Failure Indicators

If we observe:
1. Connection failures >50% of attempts (PeerJS too unreliable)
2. Need >8 users to validate concept (mesh insufficient)
3. Timeline exceeds 15 days (too complex for solo developer)
4. Audio quality issues (mesh bandwidth problems)

Then: Document learnings, write ADR-002 for SFU migration

---

## Related Decisions

### Future ADRs

**ADR-002 (Pending):** Tech stack for production MVP (React vs Vue, backend framework)
**ADR-003 (Pending):** Scaling architecture if mesh is insufficient (which SFU to use)
**ADR-004 (Pending):** Backend persistence layer (Firebase, Supabase, custom)

### Deferred Decisions

Not deciding now (wait for POC results):
- Exact SFU technology for scaling
- Whether to add TURN servers
- Self-hosting vs. managed hosting
- Mobile app strategy

---

## References

### Internal Documents
- **STFU-steev.md:** Original vision emphasizing privacy and security
- **PRODUCT_REQUIREMENTS.md:** User personas (Quiet Observer needs privacy guarantees)
- **BACKLOG.md:** MVP tasks this POC addresses
- **docs/plans/2025-12-23-peerjs-poc-design.md:** Full technical design

### External Resources
- **PeerJS Documentation:** https://peerjs.com/docs/
- **PeerJS GitHub:** https://github.com/peers/peerjs (MIT License)
- **WebRTC Standards:** https://www.w3.org/TR/webrtc/
- **mediasoup (future migration):** https://mediasoup.org/

### Privacy & Security
- **WebRTC Security:** https://webrtc-security.github.io/
- **P2P Communication Patterns:** https://martin.kleppmann.com/papers/p2p-encyclopedia19.pdf

---

## Revision History

- **2025-12-23:** Initial decision - PeerJS for POC, privacy-first principle established
- **Future:** Will revisit after POC if scaling or reliability issues emerge

---

## Appendix: Comparison Matrix

| Criteria | Daily.co | Raw WebRTC | PeerJS | SFU (mediasoup) |
|---|---|---|---|---|
| **Privacy** | ❌ Third-party servers | ✅ P2P | ✅ P2P | ✅ Self-hosted |
| **Open Source** | ❌ Proprietary | ✅ Spec | ✅ MIT | ✅ ISC |
| **Timeline** | ⭐⭐⭐ 4-7 days | ❌ 3-4 weeks | ⭐⭐ 7-12 days | ❌ 3-6 weeks |
| **Scalability** | ⭐⭐⭐ 50+ users | ⭐⭐⭐ Unlimited | ❌ 5-8 users | ⭐⭐⭐ 50+ users |
| **Complexity** | ⭐⭐⭐ Very simple | ❌ Very complex | ⭐⭐ Moderate | ❌ Complex |
| **Cost** | ❌ Paid plans | ✅ Free | ✅ Free | ⭐⭐ Hosting costs |
| **Community Trust** | ❌ Rejected | ✅ Trusted | ✅ Trusted | ✅ Trusted |
| **Self-Hostable** | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes |
| **Dependencies** | ❌ Vendor lock-in | ✅ None | ⭐⭐ Minimal | ⭐⭐ Moderate |

**Legend:**
- ✅ Meets requirement
- ⭐⭐⭐ Excellent
- ⭐⭐ Good
- ❌ Does not meet / Poor

**Result:** PeerJS is the only option that meets privacy requirements while remaining practical for solo developer POC timeline.
