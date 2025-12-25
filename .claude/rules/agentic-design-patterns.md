# Agentic Design Patterns for Infrastructure Orchestration

**Version:** 1.0
**Last Updated:** 2025-12-24
**Status:** Active Implementation

## Overview

This document defines the agentic design patterns implemented in the site-ranch Proxmox homelab infrastructure. These patterns ensure reliable, auditable, and efficient infrastructure management through AI agent orchestration.

## Core Principles

1. **Human-in-the-Loop (HITL)**: All infrastructure changes require explicit human approval
2. **Defense in Depth**: Multiple validation layers for safety-critical operations
3. **Progressive Disclosure**: Start with supervised execution, increase autonomy as reliability is proven
4. **State Preservation**: Maintain full context across failures for efficient recovery
5. **Transparent Reasoning**: Document every decision with rationale and traceability

## Pattern Categories

### 1. Orchestration Patterns

#### 1.1 Sequential Orchestration Pattern

**Purpose:** Execute multi-step infrastructure changes in deterministic order where each step depends on the previous step's success.

**Implementation:**
```
Request → Homelab Admin → Domain Expert 1 → Domain Expert 2 → Human Approval → Execution → Verification
```

**Use Cases:**
- Storage expansion (disk validation → pool creation → VM migration → verification)
- Network reconfiguration (firewall backup → VLAN change → routing update → connectivity test)
- System updates (backup verification → package update → service restart → health check)

**Benefits:**
- Predictable execution flow
- Minimal latency and cost
- Clear failure point identification
- Simplified rollback procedures

**Current Implementation:**
- Homelab-admin agent orchestrates the sequence
- Each domain expert validates prerequisites before execution
- GitHub Issues track the complete sequence with status updates

---

#### 1.2 Parallel Orchestration Pattern

**Purpose:** Execute independent tasks simultaneously to reduce overall completion time.

**Implementation:**
```
Request → Homelab Admin → [Network Expert || Storage Expert || Security Expert] → Consolidation → Human Review
```

**Use Cases:**
- Multi-domain assessments (parallel security audit + network scan + storage health check)
- Initial system configuration (parallel user creation + VLAN setup + monitoring deployment)
- Incident investigation (parallel log collection from multiple systems)

**Benefits:**
- Reduced total execution time
- Efficient resource utilization
- Independent failure domains

**Tradeoffs:**
- Higher instantaneous resource consumption
- Requires careful dependency analysis to ensure true independence

**Current Implementation:**
- Homelab-admin identifies independent tasks during analysis phase
- Domain experts execute in parallel
- Results consolidated before human review

---

#### 1.3 Hierarchical Task Decomposition Pattern

**Purpose:** Break complex infrastructure changes into manageable sub-tasks with clear ownership.

**Implementation:**
```
Complex Request → Strategic Planning → Tactical Breakdown → Domain Assignment → Execution → Integration → Validation
```

**Use Cases:**
- Major infrastructure migrations (e.g., ZFS pool migration with multiple VMs)
- Multi-phase deployments (monitoring stack: metrics → alerting → dashboards → documentation)
- Disaster recovery exercises (backup validation → restore procedure → verification → documentation)

**Benefits:**
- Manageable complexity
- Clear ownership boundaries
- Independent progress tracking
- Simplified testing and validation

**Current Implementation:**
- Homelab-admin uses sequential thinking MCP for complex decomposition
- GitHub Issues track each sub-task independently
- Dependencies explicitly documented in issue relationships

---

### 2. Reliability Patterns

#### 2.1 Error Handling & Recovery Pattern

**Purpose:** Gracefully handle failures with transparent communication and efficient recovery.

**Core Principles:**
- **Clear Communication**: Plain language error descriptions with remediation steps
- **State Preservation**: Maintain full context to enable retry without starting over
- **Transparent Recovery**: Document what failed, why, and what changed during recovery
- **Automatic Rollback**: Revert to known-good state when safe to do so

**Implementation Checklist:**
- [ ] Pre-flight validation catches common errors before execution
- [ ] Each step includes explicit success criteria
- [ ] Failures preserve full state for analysis and retry
- [ ] Rollback procedures documented and tested
- [ ] Human notification on all failures

**Current Implementation:**
- Domain experts validate prerequisites before execution
- GitHub Issues maintain complete state across retries
- Memory MCP stores recovery context
- Homelab-admin escalates failures to human operator

---

#### 2.2 Review and Critique Pattern

**Purpose:** Add validation checkpoints before changes affect production systems.

**Implementation:**
```
Proposed Change → Domain Expert Review → Peer Review (if multi-domain) → Security Review → Human Approval → Execution
```

**Use Cases:**
- Firewall rule changes (network expert proposes → security expert reviews → human approves)
- Storage encryption changes (storage expert proposes → security expert reviews → human approves)
- VM resource allocation (compute expert proposes → finops expert reviews cost → human approves)

**Benefits:**
- Catch errors before execution
- Cross-domain expertise applied
- Security implications evaluated
- Cost impacts assessed

**Tradeoffs:**
- Additional latency per change
- Higher token consumption for review cycles

**Current Implementation:**
- Homelab-admin coordinates multi-agent review
- Security-expert proactively reviews changes with security implications
- Finops-expert reviews resource allocation changes for cost impact
- All reviews documented in GitHub Issue comments

---

#### 2.3 Loop Protection Pattern

**Purpose:** Prevent infinite loops and runaway costs in iterative workflows.

**Safeguards:**
- **Iteration Limits**: Hard cap on retry attempts (default: 3)
- **Circuit Breakers**: Automatic halt on repeated failures
- **Cost Monitors**: Alert when token consumption exceeds thresholds
- **Human Escalation**: Automatic escalation on loop detection

**Implementation:**
```python
MAX_RETRIES = 3
attempt = 0
while attempt < MAX_RETRIES:
    result = execute_task()
    if result.success:
        break
    if result.should_escalate:
        notify_human_operator()
        break
    attempt += 1
```

**Current Implementation:**
- Homelab-admin enforces retry limits
- GitHub Issues track retry attempts
- Human operator notified after 3 consecutive failures

---

### 3. Multi-Agent Coordination Patterns

#### 3.1 Domain Expert Delegation Pattern

**Purpose:** Route requests to specialized agents with deep domain knowledge.

**Agent Roster:**
- **homelab-admin**: Orchestrator and coordinator
- **network-expert**: VLANs, firewall, routing, DNS
- **storage-expert**: ZFS, backups, encryption, replication
- **compute-expert**: VMs, containers, resource allocation
- **security-expert**: Access control, secrets, compliance
- **monitoring-expert**: Metrics, alerts, dashboards
- **finops-expert**: Cost tracking, budget optimization

**Delegation Decision Tree:**
```
Request Type → Domain Classification → Expert Assignment

Examples:
- "Add firewall rule" → Network + Security review
- "Expand storage pool" → Storage + Compute (for VM impact) + Security (for encryption)
- "Deploy monitoring agent" → Compute (deployment) + Monitoring (configuration) + Security (access)
```

**Current Implementation:**
- Homelab-admin analyzes request and identifies required expertise
- Explicit delegation with clear scope and expected deliverables
- Results consolidated before human review

---

#### 3.2 Maker-Checker Pattern

**Purpose:** Separate execution from validation for high-risk operations.

**Implementation:**
```
Maker (Domain Expert) → Proposes Change → Checker (Security/Peer) → Validates → Human → Approves → Executor → Implements
```

**Use Cases:**
- Firewall rule changes (network makes, security checks, human approves)
- SSH key additions (requestor makes, security checks, human approves)
- Backup configuration changes (storage makes, security checks, human approves)

**Benefits:**
- Segregation of duties
- Reduced insider threat risk
- Compliance with audit requirements
- Additional validation layer

**Current Implementation:**
- Network-expert proposes firewall changes
- Security-expert validates security implications
- Homelab-admin coordinates approval workflow
- GitHub Issue contains full maker-checker audit trail

---

#### 3.3 Dynamic Handoff Pattern

**Purpose:** Intelligently route requests to the most appropriate expert in real-time.

**Implementation:**
```
Request → Homelab Admin Analysis → Dynamic Routing Decision → Expert Assignment → Execution
```

**Routing Logic:**
- Keywords trigger initial routing ("firewall" → network-expert, "backup" → storage-expert)
- Complexity assessment determines if multiple experts needed
- Security implications trigger automatic security-expert involvement
- Cost implications trigger automatic finops-expert review

**Current Implementation:**
- Homelab-admin performs initial classification
- Multi-domain requests trigger parallel expert assignment
- Security-expert automatically consulted for access control changes
- Finops-expert automatically consulted for resource allocation changes

---

### 4. Safety & Governance Patterns

#### 4.1 Human-in-the-Loop (HITL) Pattern

**Purpose:** Ensure human oversight for all infrastructure changes.

**Approval Tiers:**

| Risk Level | Examples | Approval Required | Execution Timing |
|------------|----------|-------------------|------------------|
| **LOW** | Monitoring config changes, non-production tweaks | Logged for audit | Can proceed after logging |
| **MEDIUM** | Production config changes, storage modifications | Explicit written approval | Wait for approval before execution |
| **HIGH** | Destructive operations, security changes, multi-node updates | Signed approval with rationale | Requires review meeting + approval |

**Implementation:**
- All changes create GitHub Issue with risk assessment
- Homelab-admin presents consolidated plan with risk tier
- Human operator provides explicit approval in GitHub Issue
- Execution only proceeds after approval documented

**Current Implementation:**
- GitHub Issues serve as approval mechanism
- Risk assessment included in every issue
- Homelab-admin waits for explicit approval comment before delegating execution
- All approvals logged in project memory

---

#### 4.2 Guardrails Pattern

**Purpose:** Enforce safety boundaries to prevent unauthorized or dangerous operations.

**Architectural Guardrails:**
- **No secret leakage**: Secrets never in git, logs, or responses
- **No direct production access**: All changes via IaC (Terraform/Ansible)
- **No unauthorized escalation**: Privilege elevation requires human approval
- **No data destruction**: Backup verification required before destructive operations

**Implementation Checks:**
```python
def validate_change_request(request):
    # Pre-execution validation
    assert backup_verified(), "Backup verification required"
    assert secrets_in_vault(), "Secrets must be in VaultWarden"
    assert human_approved(), "Human approval required"
    assert rollback_plan_exists(), "Rollback procedure required"
```

**Current Implementation:**
- Security-expert enforces secrets management guardrails
- Storage-expert verifies backups before destructive operations
- Homelab-admin validates approval before any execution
- GitHub Issues document all guardrail validations

---

#### 4.3 Progressive Trust Pattern

**Purpose:** Start with maximum supervision and gradually increase autonomy as reliability is proven.

**Trust Phases:**

| Phase | Autonomy Level | Human Oversight | Example Operations |
|-------|----------------|-----------------|-------------------|
| **Phase 0** | Suggestion only | Review all suggestions | Initial setup, learning infrastructure |
| **Phase 1** | Execution with pre-approval | Approve before execution | Standard operations (95%+ success rate) |
| **Phase 2** | Execution with post-review | Review after execution | Routine maintenance (99%+ success rate) |
| **Phase 3** | Autonomous execution | Periodic audits | Monitoring adjustments, log rotation |

**Current Status:** Phase 1 (Execution with pre-approval)

**Progression Criteria:**
- 95%+ success rate over 50 operations → Phase 1 to Phase 2
- 99%+ success rate over 200 operations → Phase 2 to Phase 3
- Any security incident → Immediate regression to Phase 0

**Current Implementation:**
- All operations in Phase 1 (human approval required)
- Success metrics tracked in GitHub Issues
- Quarterly review of trust progression
- Security incidents trigger immediate review and potential regression

---

### 5. Cognitive Patterns

#### 5.1 ReAct Pattern (Reason + Act)

**Purpose:** Adaptive problem-solving that alternates between reasoning and action based on real-time observations.

**Cycle:**
```
Observe Environment → Reason About State → Decide Next Action → Execute Action → Observe Results → [Repeat or Conclude]
```

**Use Cases:**
- Incident response (observe symptoms → reason about cause → test hypothesis → observe results → adjust)
- Performance troubleshooting (measure metrics → analyze patterns → apply optimization → measure impact → iterate)
- Configuration optimization (observe behavior → reason about bottlenecks → adjust settings → observe effect → refine)

**Benefits:**
- Adapts to unexpected situations
- Self-correcting behavior
- Reduced need for predefined playbooks

**Current Implementation:**
- Domain experts use ReAct for troubleshooting and optimization tasks
- Homelab-admin oversees iteration cycles and enforces iteration limits
- GitHub Issues document each observation-action cycle
- Human escalation triggered if no progress after 3 cycles

---

#### 5.2 Reflection Pattern

**Purpose:** Self-assessment to catch errors and iterate without constant human intervention.

**Reflection Triggers:**
- Before execution: "Does this plan achieve the stated goal?"
- After execution: "Did the result match expectations?"
- On error: "What went wrong and how should I adjust?"
- Before escalation: "Have I exhausted reasonable approaches?"

**Implementation:**
```
Proposed Action → Self-Critique → Adjustment → Final Proposal → Execution → Results Validation → Reflection
```

**Current Implementation:**
- Domain experts perform self-critique before submitting proposals
- Homelab-admin performs reflection on consolidated plans
- Security-expert reflects on security implications of all proposals
- Reflection notes documented in GitHub Issue analysis sections

---

#### 5.3 Planning Pattern

**Purpose:** Decompose complex workflows into actionable tasks with dependency tracking.

**Planning Process:**
```
1. Understand goal and constraints
2. Identify dependencies and prerequisites
3. Break into discrete tasks
4. Sequence tasks by dependencies
5. Assign tasks to appropriate experts
6. Define success criteria for each task
7. Document rollback procedure
```

**Use Cases:**
- Multi-VM migration (dependency mapping → sequencing → execution → validation)
- Disaster recovery (inventory → prioritization → restoration → verification)
- Major infrastructure changes (impact analysis → phasing → execution → monitoring)

**Current Implementation:**
- Homelab-admin uses sequential thinking MCP for complex planning
- Plans documented in GitHub Issues with task breakdowns
- Dependencies explicitly noted in issue relationships
- Success criteria defined for each task

---

### 6. Tool & Integration Patterns

#### 6.1 Tool Use Pattern

**Purpose:** Extend agent capabilities through integration with external systems and APIs.

**Available Tools:**
- **Infrastructure:** Terraform (BPG Proxmox provider), Ansible
- **Monitoring:** Proxmox API, Prometheus metrics, Grafana dashboards
- **Security:** VaultWarden API, Lynis, Trivy
- **Version Control:** GitHub CLI (gh), git
- **MCP Servers:** Memory (project context), Sequential Thinking (complex planning)

**Tool Selection Criteria:**
1. Use existing tools before requesting new ones
2. Prefer open-source solutions (budget constraint)
3. Validate tool security before integration
4. Document tool usage patterns for future reference

**Current Implementation:**
- Domain experts have access to domain-specific tools
- Tool invocations logged in GitHub Issues
- Tool results stored in project memory for future reference
- New tool requests require security review

---

## Implementation Status

| Pattern | Status | Priority | Notes |
|---------|--------|----------|-------|
| Sequential Orchestration | ✅ Implemented | Critical | Core workflow pattern |
| Parallel Orchestration | ✅ Implemented | High | Used for multi-domain assessments |
| Hierarchical Decomposition | ✅ Implemented | High | Via sequential thinking MCP |
| Error Handling & Recovery | ✅ Implemented | Critical | Core reliability pattern |
| Review and Critique | ✅ Implemented | High | Security/finops reviews |
| Loop Protection | ✅ Implemented | Critical | Hard-coded retry limits |
| Domain Expert Delegation | ✅ Implemented | Critical | Core coordination pattern |
| Maker-Checker | ✅ Implemented | High | Security-sensitive operations |
| Dynamic Handoff | ✅ Implemented | Medium | Homelab-admin routing logic |
| Human-in-the-Loop | ✅ Implemented | Critical | All changes require approval |
| Guardrails | ✅ Implemented | Critical | Secrets, backups, access control |
| Progressive Trust | 🔄 In Progress | Medium | Currently in Phase 1 |
| ReAct | ✅ Implemented | High | Troubleshooting workflows |
| Reflection | ✅ Implemented | High | Self-critique before proposals |
| Planning | ✅ Implemented | High | Sequential thinking MCP |
| Tool Use | ✅ Implemented | Critical | Terraform, Ansible, gh CLI |

## Success Metrics

Track these metrics to measure pattern effectiveness:

1. **Change Success Rate**: % of changes that complete without errors (Target: >95%)
2. **First-Time-Right Rate**: % of changes that succeed on first attempt (Target: >85%)
3. **Rollback Frequency**: Number of rollbacks per 100 changes (Target: <5)
4. **Security Incident Rate**: Security incidents per quarter (Target: 0)
5. **Human Intervention Rate**: % of operations requiring unplanned human intervention (Target: <10%)
6. **Mean Time to Recovery**: Average time to recover from failures (Target: <30min)

**Reporting Frequency:** Quarterly review with homelab-admin

## Future Enhancements

1. **Swarm Pattern**: Evaluate for highly complex, multi-path problems (Phase 5+)
2. **Automated Testing**: Integration tests for common workflows (Phase 3)
3. **Continuous Evaluation**: Automated regression testing for agent behavior (Phase 4)
4. **State Machine Pattern**: Explicit state machines for critical workflows (Phase 4)
5. **Microsoft Agent Framework**: Evaluate for automated orchestration (Phase 5+)

## References

- [Agent Factory: Agentic AI Design Patterns (Microsoft Azure)](https://azure.microsoft.com/en-us/blog/agent-factory-the-new-era-of-agentic-ai-common-use-cases-and-design-patterns/)
- [Choose a Design Pattern for Your Agentic AI System (Google Cloud)](https://docs.cloud.google.com/architecture/choose-design-pattern-agentic-ai-system)
- [Top 10 Agentic AI Design Patterns (Enterprise Guide)](https://www.aufaitux.com/blog/agentic-ai-design-patterns-enterprise-guide/)
- [20 Agentic AI Workflow Patterns That Actually Work in 2025](https://skywork.ai/blog/agentic-ai-examples-workflow-patterns-2025/)

---

**Document Owner:** Homelab Admin
**Review Cycle:** Quarterly
**Next Review:** 2026-03-24
