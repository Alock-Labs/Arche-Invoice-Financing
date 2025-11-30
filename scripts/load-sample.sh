#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DAR="$ROOT/daml/.daml/dist/arche-invoice-financing-0.1.0.dar"
LEDGER_HOST="${LEDGER_HOST:-localhost}"
LEDGER_PORT="${LEDGER_PORT:-5011}"

if [ ! -f "$DAR" ]; then
  echo "DAR not found, building..."
  (cd "$ROOT/daml" && daml build)
fi

daml script \
  --dar "$DAR" \
  --script-name Arche.Tests:initialize \
  --ledger-host "$LEDGER_HOST" \
  --ledger-port "$LEDGER_PORT"

echo "Sample receivable issued."


