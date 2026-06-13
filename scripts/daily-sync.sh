#!/bin/bash

# AI Events Daily Sync Script with Discord Notifications
# Purpose: Fetch latest markdown, commit, push, deploy, and notify via Discord

set -euo pipefail

PROJECT_DIR="/Users/jeffreypaine/ALL PROJECTS/AI Events"
LOG_FILE="$PROJECT_DIR/.sync-log.txt"
REPO_URL="https://raw.githubusercontent.com/jpaine/ai-events/main/ai-events-2026.md"
MARKDOWN_FILE="$PROJECT_DIR/public/ai-events-2026.md"
CURL_TIMEOUT=30

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
    
    # Post to Discord webhook if configured
    if [ -n "${DISCORD_WEBHOOK_URL:-}" ]; then
        log "📢 Posting update to Discord..."
        
        # Get the last updated date from markdown
        LAST_UPDATED=$(grep "Last updated:" "$MARKDOWN_FILE" 2>/dev/null | sed 's/.*Last updated: //' | cut -d' ' -f1 || echo "2026-06-13")
        
        # Create Discord embed message
        DISCORD_MESSAGE='{
  "content": "✨ **AI Events Updated!**",
  "embeds": [{
    "title": "🎯 AI Events 2026 - New Content Available",
    "description": "The AI Events tracker has been updated with the latest conference information.",
    "color": 5865F2,
    "fields": [
      {
        "name": "📅 Last Updated",
        "value": "'$LAST_UPDATED'",
        "inline": true
      },
      {
        "name": "🎪 Total Events",
        "value": "70+",
        "inline": true
      },
      {
        "name": "🔗 View All Events",
        "value": "[https://ai-events-vercel.vercel.app](https://ai-events-vercel.vercel.app)",
        "inline": false
      }
    ],
    "footer": {
      "text": "AI Events Tracker - Daily Sync"
    }
  }]
}'
        
        if curl -X POST "$DISCORD_WEBHOOK_URL" \
          -H 'Content-Type: application/json' \
          -d "$DISCORD_MESSAGE" 2>/dev/null; then
          log "✓ Discord notification sent successfully"
        else
          log "⚠ Failed to send Discord notification"
        fi
    fi
    
    log "=== Sync Complete (Success) ==="
    exit 0
}

log "=== Starting Daily Sync ==="

# Navigate to project directory
cd "$PROJECT_DIR" || error_exit "Cannot navigate to project directory"
log "✓ In project directory: $PROJECT_DIR"

# Configure git
if [ -z "$(git config user.name)" ]; then
    git config user.name "AI Events Sync Bot"
    log "✓ Git user name configured"
fi
if [ -z "$(git config user.email)" ]; then
    git config user.email "sync@ai-events.local"
    log "✓ Git email configured"
fi

# Ensure on main branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "main" ]; then
    git checkout main || error_exit "Failed to checkout main branch"
fi
log "✓ On main branch"

# Fetch latest markdown
log "Fetching latest markdown from GitHub..."
if ! curl -m $CURL_TIMEOUT -s --compressed "$REPO_URL" --output "$MARKDOWN_FILE.tmp" 2>/dev/null; then
    error_exit "Failed to fetch markdown"
fi

if [ ! -s "$MARKDOWN_FILE.tmp" ]; then
    error_exit "Downloaded file is empty"
fi
log "✓ Downloaded markdown file"

# Normalize character encoding
log "Normalizing character encoding..."
cat "$MARKDOWN_FILE.tmp" | \
  sed 's/[À-ÿ]*–[À-ÿ]*/–/g' | \
  sed 's/â€"/-/g' | \
  sed 's/Ã¢ÃÃ/-/g' | \
  sed 's/ÃÃÃÃ¢ÃÃÃÃÃÃÃÃ/-/g' | \
  sed 's/[[:space:]]*-[[:space:]]*/-/g' | \
  sed 's/--*/-/g' > "$MARKDOWN_FILE.verify"

if [ -f "$MARKDOWN_FILE.verify" ] && grep -q "2026" "$MARKDOWN_FILE.verify"; then
    mv "$MARKDOWN_FILE.verify" "$MARKDOWN_FILE"
    log "✓ File encoding normalized"
else
    error_exit "Character normalization failed"
fi

# Check if file changed
if git diff --quiet "$MARKDOWN_FILE" HEAD -- "$MARKDOWN_FILE" 2>/dev/null; then
    success_exit "No changes detected - skipping deploy"
fi

log "✓ Changes detected"

# Commit and push
git add "$MARKDOWN_FILE" || error_exit "Failed to stage changes"
log "✓ Changes staged"

COMMIT_MSG="Daily sync: Update AI Events content - $(date +'%Y-%m-%d %H:%M:%S UTC')"
git commit -m "$COMMIT_MSG" || error_exit "Failed to create commit"
log "✓ Commit created"

COMMIT_SHA=$(git rev-parse HEAD)

log "Pushing to GitHub..."
if ! git push origin main 2>&1 | grep -v "^hint:" | tee -a "$LOG_FILE"; then
    log "⚠ Push failed, attempting recovery..."
    if [ -d ".git/rebase-merge" ] || [ -d ".git/rebase-apply" ]; then
        git rebase --abort || log "⚠ Rebase abort failed"
    fi
    git pull --rebase origin main || error_exit "Failed to pull/rebase"
    git push origin main || error_exit "Failed to push after rebase"
fi
log "✓ Pushed to GitHub"

# Deploy to Vercel
log "Deploying to Vercel..."
DEPLOY_LOG=$(mktemp)
if ! vercel deploy --prod --yes 2>&1 | tee "$DEPLOY_LOG" | tail -5 | tee -a "$LOG_FILE"; then
    error_exit "Vercel deployment failed"
fi
log "✓ Deployed to Vercel"

# Verify deployment
if curl -m 10 -s "https://ai-events-vercel.vercel.app" 2>/dev/null | grep -q "AI / ML / LLM / Robotics Events"; then
    log "✓ Deployment verified"
fi

success_exit "All tasks completed successfully"
