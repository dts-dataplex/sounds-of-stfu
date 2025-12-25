# ADR-004: Approval for Breaking Changes

**Status:** Approved
**Date:** 2025-12-24
**Team:** infrastructure-architect, product-manager

---

## Decision

If there is a requirement that forces a change to existing functionality, always seek approval to change and possibly break the existing functionality, so that the architect can determine the best option for the situation.

## Context

Breaking changes can invalidate existing work, user expectations, or integration points. Architectural review prevents unintended regressions and ensures migrations are planned.

## What Constitutes a Breaking Change?

### API/Interface Changes
- Removing or renaming public methods/functions
- Changing function signatures (parameters, return types)
- Modifying data structures used across boundaries
- Changing REST API endpoints or payloads

### Behavior Changes
- Altering default configuration values
- Modifying business logic assumptions
- Changing error handling semantics
- Removing or disabling existing features

### Data/Schema Changes
- Database schema modifications
- File format changes
- Configuration file structure updates
- Message queue payload changes

### Dependency Changes
- Major version bumps with breaking changes
- Removing or replacing core libraries
- Changing runtime requirements (Node version, Python version)

## Approval Process

### 1. Identify Breaking Change

**Before starting work:**
```markdown
# In GitHub Issue
## Breaking Change Assessment

**Current functionality:**
- Test mode with AI bots (TTS, 6 audio types, movement patterns)
- Synchronized across users
- Click-to-cycle audio, drag-to-reposition

**Proposed change:**
- New Three.js + Vite demo with manual PeerJS connections
- No AI bots, no test mode

**Breaking:**
✅ YES - Removes test mode functionality completely

**Impact:**
- Solo testing no longer possible without multiple devices
- TTS bot conversations gone
- Pattern movement and demo mode synchronization removed

**Seeking approval from:** @infrastructure-architect @product-manager
```

### 2. Propose Migration Path

**Include in issue:**
- How existing functionality will be preserved OR
- Why removal is justified AND what replaces it OR
- Detailed migration steps for users

**Options:**
- A) **Parallel implementation**: Keep old + new, deprecate old later
- B) **Feature flag**: Toggle between implementations
- C) **Migration tool**: Automated conversion from old to new
- D) **Complete replacement**: Justified removal with superior alternative

### 3. Architect Review

**Infrastructure-architect evaluates:**
- Is breaking change necessary?
- Are there non-breaking alternatives?
- What's the migration complexity?
- What's the rollback plan?

**Product-manager evaluates:**
- User impact assessment
- Feature parity with existing
- Timeline for migration
- Communication plan

### 4. Approval or Alternative

**If approved:**
- Document in ADR with migration plan
- Create feature flag or parallel branch
- Update tests to cover both old and new
- Plan deprecation timeline

**If rejected:**
- Propose non-breaking alternative
- Implement as additive feature
- Use adapter pattern to maintain compatibility

## Enforcement for AI Agents

**Claude Code agents MUST:**

```python
def before_implementing_feature(feature_spec):
    # 1. Check if modifies existing functionality
    existing_features = analyze_codebase()
    breaking_changes = detect_breaking_changes(feature_spec, existing_features)

    if breaking_changes:
        # 2. STOP - Do not implement
        issue = create_github_issue(
            title=f"Breaking change requires approval: {feature_spec.title}",
            labels=["breaking-change", "needs-architecture-review"],
            body=generate_breaking_change_assessment(breaking_changes)
        )

        # 3. Ask user for approval
        response = ask_user(
            f"This change breaks existing functionality. "
            f"Created issue #{issue.number} for review. "
            f"Options:\n"
            f"A) Wait for architect approval\n"
            f"B) Propose non-breaking alternative\n"
            f"C) Implement as feature flag\n"
            f"Which approach?"
        )

        return await_approval(issue.number) if response == "A" else alternative_approach()

    # 4. If no breaking changes, proceed
    return implement_feature(feature_spec)
```

## Red Flags - STOP and Seek Approval

**Immediate red flags:**
- "This will replace the existing..."
- "The old way won't work anymore..."
- "We need to remove X to add Y..."
- "This changes how users currently..."
- "The API will now return different..."

**When you think these thoughts, STOP:**
- "It's simpler to start from scratch"
- "The old code was technical debt anyway"
- "Users can just update their code"
- "This is obviously better"
- "It's a minor breaking change"

## Exceptions

**Emergency security fixes:**
- Can break to fix critical vulnerability
- MUST document in security advisory
- MUST provide patch within 24 hours

**Experimental features (flagged):**
- Can change freely if behind feature flag
- MUST be clearly marked as experimental
- MUST not affect default behavior

## Consequences

**Benefits:**
- Prevents unintended regressions
- Forces consideration of migration paths
- Architectural review improves quality
- User expectations managed proactively

**Costs:**
- Approval process adds time
- May require additional implementation work
- Need architect availability for reviews
- Discipline required to follow process

## Recent Violation Example

**Commit 19d721c** (Reverted in 6675f6c):
- ❌ Built new demo on main (violates ADR-002)
- ❌ Replaced test mode without approval (violates ADR-004)
- ❌ No migration path provided
- ❌ No issue created for breaking change

**Correct process would have been:**
1. Create issue: "Proposal: Replace test mode with Three.js demo"
2. Document what breaks (AI bots, TTS, synchronization)
3. Propose migration (keep both, feature flag, or replacement)
4. Seek approval from architect + product manager
5. Implement on feature branch after approval

## Related

- ADR-001: Use GitHub Issues for approval tracking
- ADR-002: Feature branches for isolated changes
