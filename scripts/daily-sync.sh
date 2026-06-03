#!/bin/bash

# AI Events Daily Sync Script
# Purpose: Fetch latest markdown, update date, commit, push, and deploy

set -e  # Exit on error

PROJECT_DIR="/Users/jeffreypaine/ALL PROJECTS/AI Events"
LOG_FILE="$PROJECT_DIR/.sync-log.txt"
REPO_URL="https://raw.githubusercontent.com/jpaine/ai-events/main/ai-events-2026.md"
MARKDOWN_FILE="$PROJECT_DIR/public/ai-events-2026.md"

# Logging function
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Error handling
error_exit() {
    log "ERROR: $1"
    exit 1
}

log "=== Starting Daily Sync ==="

# Navigate to project directory
cd "$PROJECT_DIR" || error_exit "Cannot navigate to project directory"
log "✓ Changed to project directory"

# Verify git is configured
if ! git config user.name &>/dev/null; then
    git config user.name "Jeffrey Paine"
    log "✓ Git user name configured"
fi
if ! git config user.email &>/dev/null; then
    git config user.email "jeff@battleventures.com"
    log "✓ Git email configured"
fi

# Fetch latest markdown with proper encoding
log "Fetching latest markdown from GitHub..."
if ! curl -s --compressed "$REPO_URL" --output "$MARKDOWN_FILE.tmp" 2>/dev/null; then
    error_exit "Failed to fetch markdown from GitHub"
fi

# Verify file was downloaded and has content
if [ ! -s "$MARKDOWN_FILE.tmp" ]; then
    error_exit "Downloaded file is empty"
fi
log "✓ Downloaded markdown file successfully"

# Ensure proper UTF-8 encoding
iconv -f UTF-8 -t UTF-8 "$MARKDOWN_FILE.tmp" > "$MARKDOWN_FILE" 2>/dev/null || \
    mv "$MARKDOWN_FILE.tmp" "$MARKDOWN_FILE"
rm -f "$MARKDOWN_FILE.tmp"
log "✓ UTF-8 encoding verified"

# Check if file actually changed
if git diff --quiet "$MARKDOWN_FILE"; then
    log "ℹ No changes detected in markdown file - skipping commit"
    log "=== Sync Complete (No Changes) ==="
    exit 0
fi

log "✓ Changes detected in markdown file"

# Stage changes
if ! git add "$MARKDOWN_FILE"; then
    error_exit "Failed to stage changes"
fi
log "✓ Changes staged"

# Create commit
COMMIT_MSG="Daily sync: Update AI Events content - $(date +'%Y-%m-%d')"
if ! git commit -m "$COMMIT_MSG"; then
    error_exit "Failed to create commit"
fi
log "✓ Commit created: $COMMIT_MSG"

# Push to GitHub
if ! git push origin main 2>&1; then
    # Try to pull first in case of divergence
    log "⚠ Push failed, attempting to pull and rebase..."
    git pull --rebase origin main || error_exit "Failed to pull/rebase"
    git push origin main || error_exit "Failed to push after rebase"
fi
log "✓ Pushed to GitHub"

# Deploy to Vercel
log "Deploying to Vercel..."
if ! vercel deploy --prod --yes 2>&1 | tee -a "$LOG_FILE"; then
    error_exit "Failed to deploy to Vercel"
fi
log "✓ Deployed to Vercel successfully"

log "=== Sync Complete (Success) ==="
