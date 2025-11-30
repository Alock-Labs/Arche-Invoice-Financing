#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LEDGER_HOST="${LEDGER_HOST:-localhost}"
LEDGER_PORT="${LEDGER_PORT:-5011}"
LEDGER_ID="${LEDGER_ID:-arche-ledger}"
ENV_FILE="$ROOT/ui/.env.local"

declare -A PARTIES=(
  ["Supplier_A"]="supplier"
  ["Buyer_B"]="buyer"
  ["Financier_F"]="financier"
  ["Custodian_C"]="custodian"
)

if ! command -v daml >/dev/null 2>&1; then
  echo "daml CLI is required" >&2
  exit 1
fi

echo "Allocating parties on $LEDGER_HOST:$LEDGER_PORT..."
for party in "${!PARTIES[@]}"; do
  set +e
  daml ledger allocate-parties --host "$LEDGER_HOST" --port "$LEDGER_PORT" --party "$party" >/dev/null 2>&1
  set -e
done

generate_token() {
  local party="$1"
  python3 - "$party" "$LEDGER_ID" <<'PY'
import base64
import json
import sys

def b64(component):
    return base64.urlsafe_b64encode(json.dumps(component).encode()).decode().rstrip("=")

party = sys.argv[1]
ledger_id = sys.argv[2]
header = {"alg": "none", "typ": "JWT"}
payload = {
    "https://daml.com/ledger-api": {
        "ledgerId": ledger_id,
        "applicationId": "ArcheUI",
        "actAs": [party]
    }
}
print(f"{b64(header)}.{b64(payload)}.")
PY
}

echo "Writing credentials to $ENV_FILE"
cat >"$ENV_FILE" <<EOF
VITE_JSON_API_BASE_URL=http://localhost:7575
VITE_DAML_PACKAGE_ID=<replace-with-dar-package-id>

EOF

for party in "${!PARTIES[@]}"; do
  role="${PARTIES[$party]}"
  token="$(generate_token "$party")"
  {
    echo "VITE_${role^^}_PARTY=$party"
    echo "VITE_${role^^}_JWT=$token"
    echo
  } >>"$ENV_FILE"
done

echo "Done. Update VITE_DAML_PACKAGE_ID after running 'daml build'."


