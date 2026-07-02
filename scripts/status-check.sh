#!/bin/bash
# Bi-daily health check: email jeffrey.paine@gmail.com a status report.

PROJECT_DIR="/Users/jeffreypaine/ALL PROJECTS/AI Events"
SITE_URL="https://ai-events-vercel.vercel.app"
TO_EMAIL="jeffrey.paine@gmail.com"
LOG_FILE="$PROJECT_DIR/.sync-log.txt"

# Load nvm (needed for nothing here, but keep consistent with daily-sync.sh)
# Load secrets (RESEND_API_KEY, NOTIFY_SECRET)
if [ -f "$PROJECT_DIR/.sync-env" ]; then
    set -a; source "$PROJECT_DIR/.sync-env"; set +a
fi

if [ -z "${RESEND_API_KEY:-}" ]; then
    echo "[status-check] ERROR: RESEND_API_KEY not set — cannot send email" >&2
    exit 1
fi

# 1. Site HTTP status
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -m 15 "$SITE_URL" 2>/dev/null || echo "000")

# 2. Recent sync log (last 60 lines, deduped since each line appears twice)
RECENT_LOG=$(tail -80 "$LOG_FILE" 2>/dev/null | awk '!seen[$0]++' | tail -30)

# Last sync result line
LAST_SYNC_LINE=$(echo "$RECENT_LOG" | grep -E "=== Sync (Complete|Failed)" | tail -1 || echo "unknown")
LAST_SYNC_TIME=$(echo "$RECENT_LOG" | grep "=== " | tail -1 | grep -oE '\[.*?\]' | tr -d '[]' || echo "unknown")

# Errors in recent log
ERROR_LINES=$(echo "$RECENT_LOG" | grep "ERROR:" | sed 's/.*ERROR:/ERROR:/')

# 3. Last 5 git commits
GIT_LOG=$(git -C "$PROJECT_DIR" log --oneline -5 2>/dev/null || echo "git unavailable")

# 4. Determine overall status
OVERALL="OK"
if [ "$HTTP_STATUS" != "200" ] || echo "$LAST_SYNC_LINE" | grep -q "Failed"; then
    OVERALL="BLOCKED"
fi

TODAY=$(date '+%Y-%m-%d')

# 5. Build and send email via Python (handles JSON encoding cleanly)
python3 - <<PYEOF
import urllib.request, json, os, sys

api_key = os.environ.get('RESEND_API_KEY', '')
http_status = "$HTTP_STATUS"
overall = "$OVERALL"
today = "$TODAY"
last_sync_line = """$LAST_SYNC_LINE"""
last_sync_time = """$LAST_SYNC_TIME"""
error_lines = """$ERROR_LINES"""
git_log = """$GIT_LOG"""
site_url = "$SITE_URL"
to_email = "$TO_EMAIL"

status_color = "#3fb950" if overall == "OK" else "#f85149"
http_color = "#3fb950" if http_status == "200" else "#f85149"
sync_color = "#f85149" if "Failed" in last_sync_line else "#3fb950"

errors_html = ""
if error_lines.strip():
    items = "".join(f"<li style='margin:4px 0'>{line.strip()}</li>" for line in error_lines.strip().splitlines() if line.strip())
    errors_html = f"""
    <div style="margin:16px 0;padding:12px 16px;background:#2d1b1b;border-left:3px solid #f85149;border-radius:4px">
      <strong style="color:#f85149">Errors in recent sync log:</strong>
      <ul style="margin:8px 0 0;padding-left:20px;color:#ffa198">{items}</ul>
    </div>"""

action_html = ""
if overall == "BLOCKED":
    action_html = """
    <div style="margin:16px 0;padding:12px 16px;background:#1c1a0d;border-left:3px solid #d29922;border-radius:4px;color:#e3b341">
      <strong>Action needed:</strong> Check the sync log at .sync-log.txt and re-run
      <code style="background:#0d1117;padding:2px 6px;border-radius:3px">bash scripts/daily-sync.sh</code> manually to diagnose.
    </div>"""

html = f"""<div style="background:#0d1117;color:#f0f6fc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:580px;margin:0 auto;padding:32px;border-radius:8px">
  <div style="display:flex;align-items:center;gap:10px;margin-bottom:24px">
    <div style="width:10px;height:10px;border-radius:50%;background:{status_color}"></div>
    <h2 style="margin:0;font-size:20px;color:{status_color}">{"✅ All systems OK" if overall == "OK" else "❌ Issues detected"} &mdash; {today}</h2>
  </div>

  <table style="width:100%;border-collapse:collapse;font-size:14px">
    <tr>
      <td style="color:#8b949e;padding:10px 0;border-bottom:1px solid #21262d;width:140px">Site</td>
      <td style="padding:10px 0;border-bottom:1px solid #21262d">
        <a href="{site_url}" style="color:#58a6ff;text-decoration:none">{site_url.replace("https://","")}</a>
        &nbsp;<span style="color:{http_color}">HTTP {http_status} {"✓" if http_status == "200" else "✗"}</span>
      </td>
    </tr>
    <tr>
      <td style="color:#8b949e;padding:10px 0;border-bottom:1px solid #21262d">Last sync</td>
      <td style="padding:10px 0;border-bottom:1px solid #21262d;color:{sync_color}">{last_sync_line.strip() or "No sync record found"}</td>
    </tr>
    <tr>
      <td style="color:#8b949e;padding:10px 0">Recent commits</td>
      <td style="padding:10px 0">
        <pre style="margin:0;background:#161b22;padding:10px;border-radius:6px;font-size:12px;color:#79c0ff;white-space:pre-wrap">{git_log}</pre>
      </td>
    </tr>
  </table>

  {errors_html}
  {action_html}

  <p style="color:#30363d;font-size:12px;margin:24px 0 0">AI Events bi-daily health check &bull; {today}</p>
</div>"""

subject = f"AI Events {'✅ OK' if overall == 'OK' else '❌ BLOCKED'} — {today}"

payload = json.dumps({
    "from": "onboarding@resend.dev",
    "to": to_email,
    "subject": subject,
    "html": html
})

# Write payload to a temp file to avoid shell escaping issues
import tempfile, subprocess
with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
    f.write(payload)
    tmpfile = f.name

result = subprocess.run(
    ["curl", "-s", "-X", "POST", "https://api.resend.com/emails",
     "-H", f"Authorization: Bearer {api_key}",
     "-H", "Content-Type: application/json",
     "-d", f"@{tmpfile}"],
    capture_output=True, text=True
)
import os; os.unlink(tmpfile)

if result.returncode != 0 or '"id"' not in result.stdout:
    print(f"[status-check] Resend error: {result.stdout} {result.stderr}", file=sys.stderr)
    sys.exit(1)
print(f"[status-check] Email sent: {result.stdout.strip()}")
PYEOF
