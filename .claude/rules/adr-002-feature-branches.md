# ADR-002: Feature Branch Strategy

**Status:** Approved
**Date:** 2025-12-24
**Team:** infrastructure-architect, workflow-coordinator

---

## Decision

Always capture new brainstorming to delivery in feature branches to avoid breaking the main production build.

## Context

Direct commits to main branch risk breaking production functionality and make it difficult to review, test, and rollback changes. Feature branches provide isolation and safety.

## Branch Naming Convention

```
feature/#<issue-number>-<brief-description>
bugfix/#<issue-number>-<brief-description>
hotfix/#<issue-number>-<brief-description>
docs/#<issue-number>-<brief-description>
```

**Examples:**
- `feature/#42-spatial-audio-engine`
- `bugfix/#108-peer-connection-timeout`
- `docs/#23-api-reference`

## Workflow

### 1. Create Issue First
```bash
# GitHub Issue #42: Implement spatial audio engine
```

### 2. Create Feature Branch
```bash
git checkout -b feature/#42-spatial-audio-engine
```

### 3. Iterative Development
```bash
# Make changes, commit frequently
git add src/audio/spatial-engine.js
git commit -m "feat: add distance-based volume calculation (#42)"

# Push to remote for backup and collaboration
git push -u origin feature/#42-spatial-audio-engine
```

### 4. Pull Request Review
```bash
# Create PR on GitHub
# Request review from appropriate agent team
# Address feedback
# Ensure CI/CD passes (ADR-003)
```

### 5. Merge to Main
```bash
# After approval, merge via PR
# GitHub closes linked issue automatically
# Delete feature branch after merge
```

## Protection Rules

**Main branch protections:**
- ❌ No direct commits to main
- ✅ Require pull request review
- ✅ Require status checks to pass (CI/CD)
- ✅ Require up-to-date branch before merge
- ✅ Require signed commits (security)

## Exceptions

**Emergency hotfixes:**
- Still use `hotfix/#<issue>-<description>` branch
- Fast-track review process
- Document reason in PR description
- Follow up with post-mortem issue

## Enforcement

**Claude Code agents:**
- MUST check for feature branch before starting work
- MUST refuse to commit directly to main
- MUST create issue before creating branch
- MUST link commits to issues

**Detection:**
```bash
# In .claude/rules enforcement
if git branch --show-current == "main" && about_to_commit:
    raise Error("Direct main commits violate ADR-002. Create feature branch.")
```

## Consequences

**Benefits:**
- Production main branch always stable
- Changes reviewable in isolation
- Easy rollback if issues discovered
- Clear audit trail via PRs
- Parallel development without conflicts

**Costs:**
- Slightly longer workflow (create branch, PR, review)
- Discipline required to follow process
- Need GitHub branch protections configured

## Related

- ADR-001: GitHub Issues for tracking
- ADR-004: Approval before breaking changes
