# ADR-006: GitHub Label Creation Order

**Status:** Approved
**Date:** 2025-12-26
**Team:** workflow-coordinator, product-manager

---

## Decision

Metadata such as labels on a GitHub hosted repository or PR helps sort and track effort and should be added in the correct order. For GitHub, this means that labels must be created BEFORE they can be used on issues or pull requests.

## Context

GitHub issues and PRs can be organized with labels for categorization (e.g., "security", "enhancement", "monitoring"). However, attempting to create an issue with a non-existent label will fail with an error.

## Requirements

### Label Creation Workflow

1. **Check if label exists** before using it
2. **Create label first** if it doesn't exist
3. **Then create issue/PR** with that label

### Recommended Labels for This Project

**Security:**

- `security` (color: d73a4a - red) - Security-related issues
- `vulnerability` (color: d73a4a - red) - Security vulnerabilities

**Priority:**

- `critical` (color: d73a4a - red) - Critical priority
- `high` (color: ff9800 - orange) - High priority
- `medium` (color: ffeb3b - yellow) - Medium priority
- `low` (color: 4caf50 - green) - Low priority

**Type:**

- `enhancement` (color: 84b6eb - blue) - New feature or improvement
- `bug` (color: d73a4a - red) - Bug fix
- `documentation` (color: 0075ca - blue) - Documentation
- `monitoring` (color: 0e8a16 - green) - Observability/monitoring

**Component:**

- `audio` (color: 1d76db - blue) - Audio engine
- `network` (color: 1d76db - blue) - Networking
- `frontend` (color: 1d76db - blue) - UI/UX
- `backend` (color: 1d76db - blue) - Backend/infrastructure
- `ai` (color: 1d76db - blue) - AI/ML features

## Implementation

### Using GitHub CLI

```bash
# Check if label exists
gh label list | grep "security" || gh label create "security" --color "d73a4a" --description "Security-related issues"

# Create issue with existing label
gh issue create --title "Security Hardening" --label "security,enhancement"
```

### Agent Workflow

**Before creating issue:**

```python
def create_issue_with_labels(title, labels):
    # 1. Verify all labels exist
    for label in labels:
        if not label_exists(label):
            create_label(label)

    # 2. Create issue with verified labels
    create_issue(title, labels)
```

## Enforcement

**Claude Code agents MUST:**

1. **Before creating issue/PR:**
   - Check if required labels exist using `gh label list`
   - Create missing labels using `gh label create`
   - Only then create issue/PR with labels

2. **Label creation format:**

   ```bash
   gh label create "<name>" \
     --color "<hex-color>" \
     --description "<description>"
   ```

3. **Error handling:**
   - If issue creation fails with "label not found"
   - Create the label immediately
   - Retry issue creation

## Consequences

**Benefits:**

- Issues properly categorized from creation
- Automated workflows can filter by labels
- No creation failures due to missing labels
- Consistent label taxonomy across project

**Costs:**

- Extra step before issue creation
- Need to maintain label definitions
- Color/description standardization required

## Related

- ADR-001: GitHub Workflow Integration
- GitHub Labels API: https://docs.github.com/en/rest/issues/labels

---

**Example Violation:**

```bash
# This will fail if "security" label doesn't exist
gh issue create --title "Fix vulnerability" --label "security"
# Error: could not add label: 'security' not found
```

**Correct Approach:**

```bash
# Create label first
gh label create "security" --color "d73a4a" --description "Security-related issues"

# Then create issue
gh issue create --title "Fix vulnerability" --label "security"
# Success
```
