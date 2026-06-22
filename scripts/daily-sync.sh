#!/bin/bash

# Daily sync: deploy any local changes, notify subscribers of new events.
# Does NOT fetch from upstream — we maintain our own curated copy.

set -euo pipefail

PROJECT_DIR="/Users/jeffreypaine/ALL PROJECTS/AI Events"
LOG_FILE="$PROJECT_DIR/.sync-log.txt"
MARKDOWN_FILE="$PROJECT_DIR/public/ai-events-2026.md"
SITE_URL="https://ai-events-vercel.vercel.app"

# Load secrets (NOTIFY_SECRET)
if [ -f "$PROJECT_DIR/.sync-env" ]; then
    set -a; source "$PROJECT_DIR/.sync-env"; set +a
fi

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

error_exit() {
    log "ERROR: $1"
    log "=== Sync Failed ==="
    exit 1
}

notify_subscribers() {
    local new_events_json="$1"
    local total="$2"
    if [ -z "${NOTIFY_SECRET:-}" ]; then
        log "NOTIFY_SECRET not set — skipping email notification"
        return
    fi
    log "Notifying email subscribers..."
    local payload="{\"secret\":\"$NOTIFY_SECRET\",\"newEvents\":$new_events_json,\"totalEvents\":$total}"
    local result
    result=$(curl -m 30 -s -X POST "$SITE_URL/api/notify" \
        -H "Content-Type: application/json" \
        -d "$payload" 2>/dev/null || echo '{"error":"curl failed"}')
    log "Notify response: $result"
}

log "=== Starting Daily Sync ==="

cd "$PROJECT_DIR" || error_exit "Cannot navigate to project directory"

[ -z "$(git config user.name)" ]  && git config user.name "AI Events Sync Bot"
[ -z "$(git config user.email)" ] && git config user.email "sync@ai-events.local"

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
[ "$CURRENT_BRANCH" != "main" ] && git checkout main

# Check for any uncommitted local changes (manual edits, curation, etc.)
if git diff --quiet HEAD 2>/dev/null && git diff --cached --quiet HEAD 2>/dev/null; then
    log "No local changes — nothing to deploy"
    log "=== Sync Complete (No changes) ==="
    exit 0
fi

log "Local changes detected — preparing deploy"

# Snapshot new event rows from diff
NEW_EVENTS_RAW=$(git diff "$MARKDOWN_FILE" | grep "^+|" | grep -v "^+|[-|]" | grep -v "^+| Event |" || true)

NEW_EVENTS_JSON="["
FIRST=true
NEW_COUNT=0
while IFS= read -r line; do
    [ -z "$line" ] && continue
    NAME=$(echo "$line"  | cut -d'|' -f2 | sed 's/^ *//;s/ *$//')
    DATES=$(echo "$line" | cut -d'|' -f3 | sed 's/^ *//;s/ *$//')
    LOC=$(echo "$line"   | cut -d'|' -f4 | sed 's/^ *//;s/ *$//')
    [ -z "$NAME" ] || [ "$NAME" = "Event" ] && continue
    NAME_ESC=$(echo "$NAME"  | sed 's/"/\\"/g')
    DATES_ESC=$(echo "$DATES" | sed 's/"/\\"/g')
    LOC_ESC=$(echo "$LOC"    | sed 's/"/\\"/g')
    [ "$FIRST" = false ] && NEW_EVENTS_JSON="$NEW_EVENTS_JSON,"
    NEW_EVENTS_JSON="$NEW_EVENTS_JSON{\"name\":\"$NAME_ESC\",\"dates\":\"$DATES_ESC\",\"location\":\"$LOC_ESC\"}"
    FIRST=false
    NEW_COUNT=$((NEW_COUNT + 1))
done <<< "$NEW_EVENTS_RAW"
NEW_EVENTS_JSON="$NEW_EVENTS_JSON]"

# Commit all staged/unstaged changes
git add -A
git commit -m "Daily sync: curated update - $(date +'%Y-%m-%d %H:%M:%S UTC')"
log "Committed"

if ! git push origin main 2>&1 | grep -v "^hint:" | tee -a "$LOG_FILE"; then
    git pull --rebase origin main || error_exit "Failed to pull/rebase"
    git push origin main || error_exit "Failed to push after rebase"
fi
log "Pushed"

# Regenerate ICS
if node scripts/generate-ics.js 2>&1 | tee -a "$LOG_FILE"; then
    git add public/ai-events-2026.ics
    git commit -m "Regenerate ICS calendar" 2>/dev/null || true
    git push origin main 2>/dev/null || true
fi

# Deploy
log "Deploying to Vercel..."
if ! vercel deploy --prod --yes 2>&1 | tail -5 | tee -a "$LOG_FILE"; then
    error_exit "Vercel deployment failed"
fi
log "Deployed"

# Notify subscribers if new events were found
TOTAL_EVENTS=$(grep -c "^|" "$MARKDOWN_FILE" 2>/dev/null || echo "0")
if [ "$NEW_COUNT" -gt 0 ]; then
    notify_subscribers "$NEW_EVENTS_JSON" "$TOTAL_EVENTS"
else
    log "No new events detected — skipping subscriber notification"
fi

log "=== Sync Complete ==="
