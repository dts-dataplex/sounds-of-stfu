# Agent Team Communication Workflow

**Purpose:** Coordinate specialized agents for Sounds of STFU development
**Status:** Active
**Updated:** 2025-12-24

---

## Team Structure

### Product & Architecture

- **product-manager** - Requirements, priorities, user advocacy
- **infrastructure-architect** - System design, technology decisions
- **workflow-coordinator** - Process orchestration, team sync

### Infrastructure & DevOps

- **compute-expert** - Compute resources, optimization
- **storage-expert** - Data persistence, caching
- **network-expert** - P2P topology, WebRTC optimization
- **security-expert** - Security scanning, threat modeling
- **monitoring-expert** - Observability, performance tracking
- **homelab-admin** - Local development environment

### Development

- **integration-expert** - System integration, API design
- **finops-expert** - Cost optimization, resource budgeting

---

## Coordination Patterns

### 1. Feature Development Workflow

```
User Request
    ↓
Product Manager (define requirements)
    ↓
Infrastructure Architect (approve approach)
    ↓
Workflow Coordinator (assign agents)
    ↓
Specialist Agents (implement)
    ↓
Security Expert (scan & approve)
    ↓
Product Manager (validate completion)
```

**Example: Spatial Audio Feature**

1. **PM receives request**: "Add distance-based volume falloff"
2. **PM creates GitHub Issue**: Feature request with acceptance criteria
3. **Architect reviews**: Approves wave-based formula approach
4. **Coordinator assigns**:
   - integration-expert: Audio API design
   - network-expert: PeerJS position sync
   - finops-expert: SLM model selection (ADR-005)
5. **Security scans**: gitleaks, npm audit (ADR-003)
6. **PM validates**: Against acceptance criteria

### 2. Breaking Change Review (ADR-004)

```
Agent detects breaking change
    ↓
STOP - Create breaking change issue
    ↓
Product Manager (user impact)
    ↓
Infrastructure Architect (technical feasibility)
    ↓
Both approve? → Proceed with migration plan
    ↓
Either rejects? → Propose alternative
```

**Recent example:** Commit 19d721c (reverted)

- ❌ Skipped PM review - Test mode removed without approval
- ❌ Skipped architect review - No migration plan
- ✅ Correct process: Revert → Create issue → Seek approval

### 3. Security Incident Response

```
Security Expert detects vulnerability
    ↓
Severity assessment (Critical/High/Medium/Low)
    ↓
Critical? → Hotfix branch immediately
    ↓
Infrastructure Architect (approve fix)
    ↓
Fast-track review → Merge → Post-mortem
```

### 4. Daily Standup (Async)

Each agent updates GitHub Issue with:

- ✅ Completed yesterday
- 🔄 Working on today
- ⚠️ Blockers/risks

**Workflow Coordinator** synthesizes into daily summary

---

## Communication Channels

### GitHub Issues

- **Feature requests**: `feature`, `needs-pm-approval`
- **Breaking changes**: `breaking-change`, `needs-architecture-review`
- **Bugs**: `bug`, severity label
- **Security**: `security`, `critical` if urgent

### GitHub Wiki

- **ADR registry**: All architectural decisions
- **Runbooks**: Operational procedures
- **Team guides**: Agent onboarding, best practices

### Pull Requests

- **Template**: Includes checklist for PR description
- **Required reviews**: Based on changed files
  - .claude/rules/\*.md → infrastructure-architect
  - src/audio/\* → network-expert, integration-expert
  - docs/adr/\*.md → infrastructure-architect, product-manager

### Comments

Use @mentions to route to appropriate agent:

- `@product-manager` - Requirements, priorities
- `@infrastructure-architect` - Technical decisions
- `@security-expert` - Security concerns
- `@workflow-coordinator` - Process questions

---

## Decision Authority Matrix

| Decision Type           | Primary                  | Approval Required                |
| ----------------------- | ------------------------ | -------------------------------- |
| **Feature priority**    | product-manager          | None                             |
| **Breaking changes**    | infrastructure-architect | product-manager                  |
| **Tech stack changes**  | infrastructure-architect | None                             |
| **Security exceptions** | security-expert          | infrastructure-architect         |
| **MVP scope cuts**      | product-manager          | infrastructure-architect         |
| **Dependency versions** | security-expert          | None                             |
| **ADR creation**        | infrastructure-architect | product-manager (if user-facing) |

---

## Escalation Paths

### Conflicting Requirements

**Example:** PM wants feature, Architect says infeasible

1. Workflow-coordinator facilitates discussion
2. PM clarifies user value vs implementation cost
3. Architect proposes alternatives with trade-offs
4. Joint decision on best path forward
5. Document in GitHub Issue

### Urgent Hotfix Needed

**Example:** Security vulnerability in production

1. Security-expert creates issue with `critical` label
2. Infrastructure-architect approves hotfix approach
3. Bypass normal review (document why in PR)
4. Fast-track merge to main
5. Post-mortem issue created immediately

### Agent Unavailable

**Example:** Integration-expert needed but not responding

1. Workflow-coordinator identifies blocker
2. Check if another agent can cover (compute-expert, network-expert)
3. If no coverage, escalate to infrastructure-architect
4. Architect assigns backup or adjusts timeline

---

## Agent Activation Patterns

### When to Activate Each Agent

**product-manager:**

- New feature request
- Breaking change proposal
- User feedback
- MVP scope questions

**infrastructure-architect:**

- Technology decisions
- System design
- Breaking changes
- ADR creation

**security-expert:**

- Pre-commit hooks
- Dependency updates
- Threat modeling
- Incident response

**network-expert:**

- WebRTC optimization
- PeerJS topology
- P2P connection issues
- Spatial audio sync

**finops-expert:**

- SLM model selection (ADR-005)
- Resource optimization
- Cost/benefit analysis

**integration-expert:**

- API design
- Component interfaces
- System integration

---

## Onboarding New Agents

1. **Read core docs**:
   - PRODUCT_REQUIREMENTS.md
   - BACKLOG.md
   - All .claude/rules/\*.md (ADRs)

2. **Review existing work**:
   - Recent GitHub Issues
   - Current sprint milestone
   - Open PRs

3. **Understand boundaries**:
   - What decisions you own
   - When to escalate
   - Who to coordinate with

4. **Check-in**:
   - Comment on assigned issue: "Agent activated, reviewing requirements"
   - Ask clarifying questions before starting work

---

## Example Multi-Agent Session

**Scenario:** Implement Test Mode with AI Bots

### Phase 1: Planning

```
PM: Creates #42 "Test Mode with AI Bots"
     - User story, acceptance criteria
     - MVP requirement (non-negotiable)

Architect: Reviews #42
     - Approves TTS approach
     - Recommends Web Speech API + fallback

FinOps: Evaluates SLM options (ADR-005)
     - Compares in-browser TTS models
     - Recommends Web Speech API (native, free)

PM: Approves plan → Ready for implementation
```

### Phase 2: Implementation

```
Integration: Creates feature/#42-test-mode branch
     - Implements bot state management
     - Audio type cycling logic

Network: Adds demo mode synchronization
     - Position sync via data channels
     - Audio state broadcast

Security: Pre-commit scan
     - ✅ No secrets detected
     - ✅ No vulnerabilities
     - ✅ Linting passed
```

### Phase 3: Review

```
PM: Validates against acceptance criteria
     - ✅ 1-3 bots configurable
     - ✅ 6 audio types cycle correctly
     - ✅ Click-to-move and drag work
     - ✅ Demo mode syncs across users

Architect: Code review
     - Architecture matches design
     - Performance acceptable
     - Approves merge

Workflow: Merges to main
     - Closes #42
     - Updates CHANGELOG.md
     - Posts to GitHub Wiki
```

---

## Continuous Improvement

### Retrospective Questions

- Which agent coordination worked well?
- Where did handoffs break down?
- What decisions took too long?
- How can we improve clarity?

### Process Updates

- ADRs evolve based on lessons learned
- Agent roles refined as needs change
- Communication patterns optimized
- Documented in GitHub Wiki

---

## Tools Integration

### Pre-commit Hooks (ADR-003)

- Security: gitleaks (secrets)
- Quality: prettier, eslint
- Compliance: ADR-002 branch check

### GitHub Actions

- CI/CD: npm test, npm run build
- Security: Dependency scanning
- Deployment: Automated when tests pass

### GitHub Projects

- Kanban board for sprint planning
- Columns: Backlog, In Progress, Review, Done
- Filter by label, milestone, assignee
