#!/usr/bin/env bash
# Compare Didaxis suite runtime: stored session vs per-test UI login.
# Usage: ./scripts/benchmark-auth.sh
# Optional: TRACE=on ./scripts/benchmark-auth.sh tests/ds2-*.spec.ts

set -euo pipefail
cd "$(dirname "$0")/.."

TARGET="${*:-tests/ds*.spec.ts}"
TRACE="${TRACE:-off}"

echo "=== Playwright auth benchmark ==="
echo "Target: $TARGET"
echo "Trace:  $TRACE"
echo ""

run_suite() {
  local label="$1"
  local per_test_login="$2"
  echo "--- $label ---"
  local start end elapsed
  start=$(date +%s)
  PER_TEST_LOGIN="$per_test_login" npx playwright test \
    --project=chromium \
    --trace="$TRACE" \
    --reporter=line \
    $TARGET || true
  end=$(date +%s)
  elapsed=$((end - start))
  echo "Wall time: ${elapsed}s"
  echo ""
  echo "$elapsed"
}

STORED=$(run_suite "Stored session (setup + storageState)" "" | tail -1)
PER_TEST=$(run_suite "Per-test UI login (PER_TEST_LOGIN=1)" "1" | tail -1)

if [[ "$STORED" =~ ^[0-9]+$ && "$PER_TEST" =~ ^[0-9]+$ && "$PER_TEST" -gt 0 ]]; then
  saved=$((PER_TEST - STORED))
  pct=$((saved * 100 / PER_TEST))
  echo "=== Summary (chromium) ==="
  echo "Stored session:  ${STORED}s"
  echo "Per-test login:  ${PER_TEST}s"
  echo "Time saved:      ${saved}s (~${pct}% faster)"
  if command -v bc >/dev/null 2>&1 && [[ "$STORED" -gt 0 ]]; then
    factor=$(echo "scale=2; $PER_TEST / $STORED" | bc)
    echo "Speedup factor:  ${factor}x"
  fi
fi
