# ADR-001: GitHub Workflow Integration

**Status:** Approved
**Date:** 2025-12-24
**Team:** workflow-coordinator, product-manager

---

## Decision

Use the GitHub repository and enabled functions such as Issues, Wiki, Pages, and Actions to track, review, iterate on, and complete requests.

## Context

Projects need transparent tracking of features, bugs, decisions, and progress. GitHub provides integrated tools that work with the codebase to maintain this transparency.

## Requirements

### Issues

- **Feature requests**: Create issue before starting work
- **Bug reports**: Document reproduction steps, expected vs actual behavior
- **Task tracking**: Link commits to issues using keywords (closes #123, fixes #456)
- **Labels**: Use consistent labels (feature, bug, documentation, etc.)
- **Milestones**: Group issues by release version or sprint

### Wiki

- **Architecture decisions**: Maintain ADR registry in wiki
- **Agent team coordination**: Document agent roles and workflows
- **Onboarding**: Getting started guide for new contributors
- **Runbooks**: Operational procedures and troubleshooting

### Pages

- **Documentation site**: Public-facing project documentation
- **API reference**: Auto-generated from code comments
- **Design system**: UI/UX patterns and components

### Actions

- **CI/CD pipeline**: Automated testing and deployment
- **Pre-commit hooks**: Enforce code quality and security (see ADR-003)
- **Issue automation**: Auto-label, auto-assign based on patterns
- **Release automation**: Version bumping, changelog generation

## Enforcement

**Before starting work:**

1. Create GitHub Issue describing the work
2. Get issue number (e.g., #42)
3. Create feature branch: `feature/#42-brief-description`
4. Reference issue in commits: `feat: implement X (#42)`
5. Close issue when PR merges

**For ADRs:**

1. Create ADR document in `docs/adr/`
2. Add to wiki ADR registry
3. Implement as `.claude/rules/*.md` for AI agent enforcement

## Consequences

**Benefits:**

- Transparent work tracking visible to all team members
- Historical context for decisions preserved in issues
- Automated workflows reduce manual overhead
- Wiki serves as living documentation

**Costs:**

- Initial setup time for templates and automation
- Discipline required to maintain issue tracking
- Need to keep wiki synchronized with code changes

## Related

- ADR-002: Feature branching strategy
- ADR-003: Pre-commit hooks and security scanning
