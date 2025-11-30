#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$ROOT/scripts/canton-compose.yml"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is required to launch Canton via docker-compose." >&2
  exit 1
fi

echo "Building latest DAML DAR..."
(cd "$ROOT/daml" && daml build)

echo "Starting Canton domain + JSON API..."
docker compose -f "$COMPOSE_FILE" up -d

echo "Canton is booting. Ledger API: localhost:5011, JSON API: http://localhost:7575"


