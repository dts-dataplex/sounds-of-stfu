#!/bin/bash
# Cleanup script for sounds-of-stfu repository
# Removes old Node.js/Vite/PeerJS implementation files
# Keeps the new Go + LiveKit implementation

set -e

echo "=== Sounds of STFU - Repository Cleanup Script ==="
echo ""
echo "This script will remove old Node.js/Vite/PeerJS implementation files."
echo "The new Go + LiveKit implementation in cmd/, internal/, web/ will be kept."
echo ""

# Change to repository root
cd "$(dirname "$0")/.."

echo "Working directory: $(pwd)"
echo ""

# ============================================
# FILES TO DELETE - Old Node.js Implementation
# ============================================

echo "=== Old Node.js/Vite Implementation Files ==="

# Root-level Node.js files
OLD_NODE_FILES=(
    "index.html"                           # Old root HTML (replaced by web/index.html)
    "package.json"                         # Node.js package manifest
    "vite.config.js"                       # Vite bundler config
    "vitest.config.js"                     # Vitest test config
    "eslint.config.js"                     # ESLint config for Node.js
    "signaling-server.js"                  # Old PeerJS signaling server
    "vite-plugin-chatsubo-signaling.js"    # Vite plugin for signaling
    ".markdownlint.json"                   # Markdown linter config
    ".pre-commit-config.yaml"              # Pre-commit hooks (Node.js focused)
    ".prettierrc.json"                     # Prettier config for Node.js
)

# Directories to delete completely
OLD_DIRECTORIES=(
    "src"                                  # Old source code (ChatsuboApp, network, audio, ai)
    "test"                                 # Old test setup
    "public"                               # Old public assets
    "poc"                                  # Old proof-of-concept files
    ".husky"                               # Husky git hooks for Node.js
    "awesome-claude-code-subagents"        # Unrelated repository accidentally included
)

# Old scripts
OLD_SCRIPTS=(
    "scripts/voice_mode.sh"                # Old voice mode script
)

# Old documentation (superseded by Go+LiveKit design)
OLD_DOCS=(
    "docs/plans/2025-12-23-peerjs-poc-design.md"      # Superseded by LiveKit
    "docs/plans/2025-12-23-test-mode-design.md"       # Superseded by LiveKit
    "docs/adr/001-peerjs-privacy-first-architecture.md"  # Superseded by LiveKit
)

# ============================================
# PREVIEW MODE - Show what will be deleted
# ============================================

echo ""
echo "=== Files that will be DELETED ==="
echo ""

echo "--- Node.js Root Files ---"
for file in "${OLD_NODE_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  [DELETE] $file"
    else
        echo "  [SKIP]   $file (not found)"
    fi
done

echo ""
echo "--- Old Directories ---"
for dir in "${OLD_DIRECTORIES[@]}"; do
    if [ -d "$dir" ]; then
        count=$(find "$dir" -type f | wc -l)
        echo "  [DELETE] $dir/ ($count files)"
    else
        echo "  [SKIP]   $dir/ (not found)"
    fi
done

echo ""
echo "--- Old Scripts ---"
for file in "${OLD_SCRIPTS[@]}"; do
    if [ -f "$file" ]; then
        echo "  [DELETE] $file"
    else
        echo "  [SKIP]   $file (not found)"
    fi
done

echo ""
echo "--- Old Documentation ---"
for file in "${OLD_DOCS[@]}"; do
    if [ -f "$file" ]; then
        echo "  [DELETE] $file"
    else
        echo "  [SKIP]   $file (not found)"
    fi
done

# ============================================
# FILES TO KEEP
# ============================================

echo ""
echo "=== Files that will be KEPT ==="
echo ""
echo "--- Go Backend ---"
echo "  cmd/server/main.go"
echo "  internal/ (api, config, livekit, room)"
echo "  go.mod, go.sum"
echo "  Dockerfile"
echo "  docker-compose.yml"
echo "  livekit.yaml"
echo ""
echo "--- Web Frontend ---"
echo "  web/index.html"
echo "  web/css/main.css"
echo "  web/js/ (app.js, audio.js, canvas.js, config.js, livekit.js)"
echo ""
echo "--- Documentation ---"
echo "  README.md"
echo "  CLAUDE.md"
echo "  BACKLOG.md"
echo "  PRODUCT_REQUIREMENTS.md"
echo "  STFU-steev.md"
echo "  AGENTIC_DESIGN_PATTERNS.md"
echo "  docs/plans/2025-01-06-go-livekit-rewrite-design.md"
echo "  docs/plans/2025-12-24-bar-layout-and-privacy-architecture.md"
echo "  docs/plans/2026-01-05-transformers-js-integration.md"
echo "  docs/plans/CHATSUBO_*.md"
echo "  docs/user-stories/"
echo ""
echo "--- Configuration ---"
echo "  .gitignore"
echo "  .claude/"
echo "  .github/"

# ============================================
# CONFIRMATION AND EXECUTION
# ============================================

echo ""
echo "============================================"
echo ""

if [ "$1" == "--dry-run" ]; then
    echo "DRY RUN MODE - No files will be deleted."
    echo "Run without --dry-run to actually delete files."
    exit 0
fi

if [ "$1" != "--execute" ]; then
    echo "To execute the cleanup, run:"
    echo "  ./scripts/cleanup-old-code.sh --execute"
    echo ""
    echo "To see what would be deleted without making changes:"
    echo "  ./scripts/cleanup-old-code.sh --dry-run"
    exit 0
fi

echo "EXECUTING CLEANUP..."
echo ""

# Delete Node.js root files
for file in "${OLD_NODE_FILES[@]}"; do
    if [ -f "$file" ]; then
        git rm -f "$file" 2>/dev/null || rm -f "$file"
        echo "Deleted: $file"
    fi
done

# Delete old directories
for dir in "${OLD_DIRECTORIES[@]}"; do
    if [ -d "$dir" ]; then
        git rm -rf "$dir" 2>/dev/null || rm -rf "$dir"
        echo "Deleted: $dir/"
    fi
done

# Delete old scripts
for file in "${OLD_SCRIPTS[@]}"; do
    if [ -f "$file" ]; then
        git rm -f "$file" 2>/dev/null || rm -f "$file"
        echo "Deleted: $file"
    fi
done

# Delete old docs
for file in "${OLD_DOCS[@]}"; do
    if [ -f "$file" ]; then
        git rm -f "$file" 2>/dev/null || rm -f "$file"
        echo "Deleted: $file"
    fi
done

# Clean up empty directories
echo ""
echo "Cleaning up empty directories..."
find docs -type d -empty -delete 2>/dev/null || true

echo ""
echo "=== Cleanup Complete ==="
echo ""
echo "Files remaining in repository:"
git ls-files | wc -l
echo ""
echo "Run 'git status' to see changes."
echo "Run 'git commit -m \"chore: remove old Node.js/PeerJS implementation\"' to commit."
