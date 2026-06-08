#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT_DIR"

PORT="${QA_SMOKE_PORT:-1424}"
BASE_URL="http://127.0.0.1:${PORT}"
OUTPUT_DIR="$ROOT_DIR/output/playwright"
LOG_FILE="$OUTPUT_DIR/playwright-smoke-vite.log"
OPEN_LOG="$OUTPUT_DIR/playwright-smoke-open.log"
RUN_LOG="$OUTPUT_DIR/playwright-smoke-run.log"
SESSION="structra-smoke-$$"
CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
PWCLI="${PWCLI:-$CODEX_HOME/skills/playwright/scripts/playwright_cli.sh}"
BROWSER_OPENED=0

command -v npx >/dev/null 2>&1 || {
  echo "npx is required for the Playwright CLI wrapper." >&2
  exit 1
}

command -v pnpm >/dev/null 2>&1 || {
  echo "pnpm is required to run the Vite dev server." >&2
  exit 1
}

if [ ! -x "$PWCLI" ]; then
  echo "Playwright CLI wrapper not found or not executable: $PWCLI" >&2
  exit 1
fi

mkdir -p "$OUTPUT_DIR"

pnpm exec vite --host 127.0.0.1 --port "$PORT" >"$LOG_FILE" 2>&1 &
SERVER_PID=$!

cleanup() {
  if kill -0 "$SERVER_PID" >/dev/null 2>&1; then
    kill "$SERVER_PID" >/dev/null 2>&1 || true
    wait "$SERVER_PID" >/dev/null 2>&1 || true
  fi
  if [ "$BROWSER_OPENED" -eq 1 ]; then
    "$PWCLI" --session "$SESSION" close >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

for _ in $(seq 1 60); do
  if curl -fsS "$BASE_URL" >/dev/null 2>&1; then
    break
  fi
  if ! kill -0 "$SERVER_PID" >/dev/null 2>&1; then
    echo "Vite dev server exited early. See $LOG_FILE" >&2
    exit 1
  fi
  sleep 1
done

curl -fsS "$BASE_URL" >/dev/null || {
  echo "Vite dev server did not become ready at $BASE_URL. See $LOG_FILE" >&2
  exit 1
}

"$PWCLI" --session "$SESSION" open "$BASE_URL" 2>&1 | tee "$OPEN_LOG"
if grep -q "### Error" "$OPEN_LOG" >/dev/null 2>&1; then
  cat "$OPEN_LOG" >&2
  exit 1
fi
BROWSER_OPENED=1
"$PWCLI" --session "$SESSION" run-code --filename tests/smoke/playwright-smoke.js 2>&1 | tee "$RUN_LOG"
if grep -q "### Error" "$RUN_LOG" >/dev/null 2>&1; then
  cat "$RUN_LOG" >&2
  exit 1
fi
