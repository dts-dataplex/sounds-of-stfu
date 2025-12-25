# ADR-003: Pre-Commit Hooks and Security Scanning

**Status:** Approved
**Date:** 2025-12-24
**Team:** security-expert, devops-engineer

---

## Decision

Ensure that pre-commit hooks are used to setup and utilize security scanning tools such as checkov, linters, gitleaks, and any others relevant to the application stack being used.

## Context

Security vulnerabilities and code quality issues should be caught before they reach the repository. Pre-commit hooks provide automated gating at the developer's workstation.

## Required Tools

### Security Scanning
- **gitleaks**: Detect hardcoded secrets, API keys, credentials
- **checkov**: Infrastructure-as-code security scanning
- **npm audit** / **pip-audit**: Dependency vulnerability scanning
- **semgrep**: Static analysis for security patterns

### Code Quality
- **eslint**: JavaScript/TypeScript linting
- **prettier**: Code formatting
- **shellcheck**: Shell script linting
- **markdownlint**: Documentation consistency

### Type Safety
- **TypeScript compiler**: Type checking for TS projects
- **mypy**: Type checking for Python projects

## Implementation

### 1. Install pre-commit Framework

```bash
# Using pip
pip install pre-commit

# Or using homebrew
brew install pre-commit
```

### 2. Configure .pre-commit-config.yaml

```yaml
repos:
  # Security: Secrets detection
  - repo: https://github.com/gitleaks/gitleaks
    rev: v8.18.1
    hooks:
      - id: gitleaks

  # Security: IaC scanning
  - repo: https://github.com/bridgecrewio/checkov
    rev: 3.1.0
    hooks:
      - id: checkov
        args: [--quiet, --framework, terraform]

  # Code quality: Formatting
  - repo: https://github.com/pre-commit/mirrors-prettier
    rev: v3.1.0
    hooks:
      - id: prettier
        types_or: [javascript, typescript, json, yaml, markdown]

  # Code quality: Linting
  - repo: https://github.com/eslint/eslint
    rev: v8.56.0
    hooks:
      - id: eslint
        files: \\.[jt]sx?$
        types: [file]

  # Security: Dependency scanning
  - repo: local
    hooks:
      - id: npm-audit
        name: npm audit
        entry: npm audit --audit-level=high
        language: system
        pass_filenames: false
```

### 3. Install Hooks

```bash
# In project root
pre-commit install

# Test hooks on all files
pre-commit run --all-files
```

## Stack-Specific Tools

### JavaScript/TypeScript + Node.js
- eslint, prettier
- npm audit
- typescript compiler (tsc --noEmit)

### Python
- black (formatting)
- flake8 (linting)
- mypy (type checking)
- pip-audit (dependencies)

### Infrastructure (Terraform/CloudFormation)
- checkov
- terraform validate
- tflint

### Shell Scripts
- shellcheck
- shfmt

## Enforcement Levels

### Blocking (MUST pass to commit)
- ❌ Secrets detected (gitleaks)
- ❌ Critical/high vulnerabilities (npm audit, checkov)
- ❌ Syntax errors (linters)
- ❌ Type errors (TypeScript, mypy)

### Warning (can commit with --no-verify)
- ⚠️ Code style issues (prettier, black)
- ⚠️ Medium/low vulnerabilities (audit)
- ⚠️ Deprecated API usage

### Info (logged but not blocking)
- ℹ️ Code complexity metrics
- ℹ️ TODO/FIXME comments
- ℹ️ Documentation coverage

## Bypass Mechanism

**Emergency bypass** (use sparingly):
```bash
git commit --no-verify -m "Emergency fix, will address security scan in follow-up"
```

**MUST:**
- Create follow-up issue immediately
- Document reason in commit message
- Fix within 24 hours

## CI/CD Integration

Same checks run in GitHub Actions to prevent bypass:

```yaml
# .github/workflows/security-scan.yml
name: Security Scan
on: [push, pull_request]
jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run pre-commit hooks
        uses: pre-commit/action@v3.0.0
```

## Consequences

**Benefits:**
- Secrets never reach repository
- Vulnerabilities caught before code review
- Consistent code style automatically enforced
- Developer feedback immediate (not in CI)

**Costs:**
- Initial setup time per developer
- Commit time slightly longer (2-10 seconds)
- False positives require .gitleaks.toml config
- Need to keep hook definitions updated

## Related

- ADR-001: GitHub Actions for CI/CD
- ADR-005: SLM evaluation includes security analysis
