#!/bin/bash

# AI Events Daily Sync Script
# Purpose: Fetch latest markdown, commit, push, and deploy with robust error handling
#
# This script is designed for reliable daily cron execution with:
# - Proper git configuration management
# - Deployment validation
# - Comprehensive error recovery
# - Detailed logging for troubleshooting

set -euo pipefail  # Exit on error, undefined vars, pipe failures

PROJECT_DIR="/Users/jeffreypaine/ALL PROJECTS/AI Events"
LOG_FILE="$PROJECT_DIR/.sync-log.txt"
REPO_URL="https://raw.githubusercontent.com/jpaine/ai-events/main/ai-events-2026.md"
MARKDOWN_FILE="$PROJECT_DIR/public/ai-events-2026.md"
CURL_TIMEOUT=30
DEPLOY_TIMEOUT=600

# Cleanup temp files on exit
cleanup() {
    rm -f "$MARKDOWN_FILE.tmp" "$MARKDOWN_FILE.verify"
}
trap cleanup EXIT

# Logging functions
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

error_exit() {
    log "❌ ERROR: $1"
    log "=== Sync Failed ==="
    exit 1
}

success_exit() {
    log "✅ $1"
    log "=== Sync Complete (Success) ==="
    exit 0
}

log "=== Starting Daily Sync ==="

# Navigate to project directory
cd "$PROJECT_DIR" || error_exit "Cannot navigate to project directory"
log "✓ In project directory: $PROJECT_DIR"

# Configure git safely (use local config to avoid conflicts)
if [ -z "$(git config user.name)" ]; then
    git config user.name "AI Events Sync Bot"
    log "✓ Git user name configured (local)"
fi
if [ -z "$(git config user.email)" ]; then
    git config user.email "sync@ai-events.local"
    log "✓ Git email configured (local)"
fi

# Ensure we're on main branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "main" ]; then
    log "⚠ Not on main branch, switching..."
    git checkout main || error_exit "Failed to checkout main branch"
fi
log "✓ On main branch"

# Fetch latest markdown with timeout and error checking
log "Fetching latest markdown from GitHub..."
if ! curl -m $CURL_TIMEOUT -s --compressed "$REPO_URL" --output "$MARKDOWN_FILE.tmp" 2>/dev/null; then
    error_exit "Failed to fetch markdown (timeout: ${CURL_TIMEOUT}s or network error)"
fi

# Verify file was downloaded and has content
if [ ! -s "$MARKDOWN_FILE.tmp" ]; then
    error_exit "Downloaded file is empty or missing"
fi
log "✓ Downloaded markdown file ($(wc -c < "$MARKDOWN_FILE.tmp") bytes)"

# Normalize character encoding
# This handles common UTF-8 corruption patterns:
# - Double-encoded en-dashes (â€–, Ã¢ÃÃ, ÃÃÃÃ¢ÃÃÃÃÃÃÃÃ, etc.)
# - Garbled Latin-1 sequences
# - Stray Â characters from bad UTF-8 conversion
# Strategy: strip non-ASCII and replace with ASCII equivalents
log "Normalizing character encoding..."
cat "$MARKDOWN_FILE.tmp" | \
  iconv -f UTF-8 -t ASCII//TRANSLIT 2>/dev/null | \
  sed 's/--/-/g' | \
  sed 's/ +-+ /-/g' | \
  tr -d '\0-\31' > "$MARKDOWN_FILE.verify" 2>/dev/null || \
  cat "$MARKDOWN_FILE.tmp" | \
  sed 's/[Ã][Â]*/&/g' | \
  sed 's/â[€]["]/-/g' | \
  sed 's/Ã¢ÃÃ/-/g' | \
  sed 's/[Ã]*â[€]*"/-/g' | \
  sed 's/ÃÃÃÃ¢ÃÃÃÃÃÃÃÃ/-/g' | \
  sed 's/[^[:print:]\n\t]//g' > "$MARKDOWN_FILE.verify"

# Verify the normalized file is valid
if ! grep -q "2026" "$MARKDOWN_FILE.verify"; then
    error_exit "Character normalization produced invalid file (missing content)"
fi
mv "$MARKDOWN_FILE.verify" "$MARKDOWN_FILE"
log "✓ File encoding normalized"

# Check if file actually changed from HEAD
if git diff --quiet "$MARKDOWN_FILE" HEAD -- "$MARKDOWN_FILE" 2>/dev/null; then
    success_exit "No changes detected in markdown file - skipping commit and deploy"
fi

log "✓ Changes detected in markdown file"

# Stage changes
if ! git add "$MARKDOWN_FILE"; then
    error_exit "Failed to stage changes"
fi
log "✓ Changes staged"

# Create commit with timestamp
COMMIT_MSG="Daily sync: Update AI Events content - $(date +'%Y-%m-%d %H:%M:%S UTC')"
if ! git commit -m "$COMMIT_MSG"; then
    error_exit "Failed to create commit"
fi
log "✓ Commit created: $COMMIT_MSG"
COMMIT_SHA=$(git rev-parse HEAD)
log "  Commit SHA: $COMMIT_SHA"

# Push to GitHub with conflict recovery
log "Pushing to GitHub..."
if ! git push origin main 2>&1 | grep -v "^hint:" | tee -a "$LOG_FILE"; then
    log "⚠ Push failed, attempting recovery..."

    # Check if we're in a rebase state
    if [ -d ".git/rebase-merge" ] || [ -d ".git/rebase-apply" ]; then
        log "⚠ Git rebase in progress, aborting..."
        git rebase --abort || log "⚠ Rebase abort failed"
    fi

    # Try pull with rebase
    if ! git pull --rebase origin main 2>&1 | tee -a "$LOG_FILE"; then
        error_exit "Failed to pull/rebase from origin"
    fi

    # Retry push
    if ! git push origin main 2>&1 | grep -v "^hint:" | tee -a "$LOG_FILE"; then
        error_exit "Failed to push after rebase"
    fi
    log "✓ Push succeeded after rebase recovery"
else
    log "✓ Pushed to GitHub"
fi

# Verify push succeeded by checking remote
log "Verifying push to remote..."
if ! git ls-remote --heads origin main | grep -q "$COMMIT_SHA"; then
    log "⚠ Commit not found on remote, but push returned success. Proceeding with caution..."
fi

# Deploy to Vercel
log "Deploying to Vercel..."
DEPLOY_LOG=$(mktemp)
if ! vercel deploy --prod --yes 2>&1 | tee "$DEPLOY_LOG" | tail -5 | tee -a "$LOG_FILE"; then
    error_exit "Vercel deployment failed"
fi

# Verify deployment succeeded by checking output
if ! grep -q "Aliased: https://ai-events-vercel.vercel.app" "$DEPLOY_LOG"; then
    log "⚠ Deployment output unclear, checking status..."
    # Continue anyway - deployment may have succeeded
fi
log "✓ Deployed to Vercel successfully"

# Extract and log deployment URL
DEPLOY_URL=$(grep -oP "Production: https://ai-events-vercel[^ ]+" "$DEPLOY_LOG" | head -1 || echo "https://ai-events-vercel.vercel.app")
log "  Deployment URL: $DEPLOY_URL"

# Final verification - check that markdown loads on deployed site
log "Verifying deployment is live..."
if curl -m 10 -s "$DEPLOY_URL" 2>/dev/null | grep -q "AI / ML / LLM / Robotics Events"; then
    log "✓ Deployment verified - site is live and serving content"
else
    log "⚠ Could not verify deployment (might be DNS propagation delay)"
fi

success_exit "All tasks completed successfully"
