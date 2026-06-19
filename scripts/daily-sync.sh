#!/bin/bash

set -euo pipefail

PROJECT_DIR="/Users/jeffreypaine/ALL PROJECTS/AI Events"
LOG_FILE="$PROJECT_DIR/.sync-log.txt"
REPO_URL="https://raw.githubusercontent.com/jpaine/ai-events/main/ai-events-2026.md"
MARKDOWN_FILE="$PROJECT_DIR/public/ai-events-2026.md"
CURL_TIMEOUT=30
SITE_URL="https://ai-events-vercel.vercel.app"

# Load secrets (NOTIFY_SECRET, RESEND_API_KEY)
if [ -f "$PROJECT_DIR/.sync-env" ]; then
    set -a; source "$PROJECT_DIR/.sync-env"; set +a
fi

cleanup() {
    rm -f "$MARKDOWN_FILE.tmp" "$MARKDOWN_FILE.verify"
}
trap cleanup EXIT

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
        log "⚠ NOTIFY_SECRET not set — skipping email notification"
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

# Configure git
[ -z "$(git config user.name)" ]  && git config user.name "AI Events Sync Bot"
[ -z "$(git config user.email)" ] && git config user.email "sync@ai-events.local"

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
[ "$CURRENT_BRANCH" != "main" ] && git checkout main

log "Fetching latest markdown..."
if ! curl -m $CURL_TIMEOUT -s --compressed "$REPO_URL" --output "$MARKDOWN_FILE.tmp" 2>/dev/null; then
    error_exit "Failed to fetch markdown"
fi
[ ! -s "$MARKDOWN_FILE.tmp" ] && error_exit "Downloaded file is empty"

# Normalize encoding
cat "$MARKDOWN_FILE.tmp" | \
  sed 's/â€"/-/g' | \
  sed 's/–/-/g' | \
  sed 's/Â//g' > "$MARKDOWN_FILE.verify"

if [ -f "$MARKDOWN_FILE.verify" ] && grep -q "2026" "$MARKDOWN_FILE.verify"; then
    mv "$MARKDOWN_FILE.verify" "$MARKDOWN_FILE"
else
    error_exit "Encoding normalization produced invalid file"
fi

# Check for changes
if git diff --quiet "$MARKDOWN_FILE" HEAD -- "$MARKDOWN_FILE" 2>/dev/null; then
    log "No changes detected — skipping deploy"
    log "=== Sync Complete (No changes) ==="
    exit 0
fi

log "Changes detected"

# Snapshot new event rows from diff before committing
NEW_EVENTS_RAW=$(git diff "$MARKDOWN_FILE" | grep "^+|" | grep -v "^+|[-|]" | grep -v "^+| Event |" || true)

# Build JSON array of new events
NEW_EVENTS_JSON="["
FIRST=true
NEW_COUNT=0
while IFS= read -r line; do
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

# Commit and push
git add "$MARKDOWN_FILE"
git commit -m "Daily sync: Update AI Events content - $(date +'%Y-%m-%d %H:%M:%S UTC')"
log "Committed changes"

if ! git push origin main 2>&1 | grep -v "^hint:" | tee -a "$LOG_FILE"; then
    git pull --rebase origin main || error_exit "Failed to pull/rebase"
    git push origin main || error_exit "Failed to push after rebase"
fi
log "Pushed to GitHub"

# Regenerate ICS
if node scripts/generate-ics.js 2>&1 | tee -a "$LOG_FILE"; then
    git add public/ai-events-2026.ics 2>/dev/null || true
    git commit -m "Regenerate ICS calendar" 2>/dev/null || true
    git push origin main 2>/dev/null || true
fi

# Deploy
log "Deploying to Vercel..."
if ! vercel deploy --prod --yes 2>&1 | tail -5 | tee -a "$LOG_FILE"; then
    error_exit "Vercel deployment failed"
fi
log "Deployed"

# Notify subscribers if new events were added
TOTAL_EVENTS=$(grep -c "^|" "$MARKDOWN_FILE" 2>/dev/null || echo "0")
if [ "$NEW_COUNT" -gt 0 ]; then
    notify_subscribers "$NEW_EVENTS_JSON" "$TOTAL_EVENTS"
else
    log "No new events detected — skipping subscriber notification"
fi

log "=== Sync Complete ==="
