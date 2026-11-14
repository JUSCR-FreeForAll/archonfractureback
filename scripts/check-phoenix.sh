#!/usr/bin/env bash
set -euo pipefail
VPS_HOST="${VPS_HOST:-}"
VPS_USER="${VPS_USER:-ubuntu}"
VPS_PORT="${VPS_PORT:-22}"
VPS_SSH_KEY="${VPS_SSH_KEY:-$HOME/.ssh/id_ed25519}"
COMPOSE_DIR="${COMPOSE_DIR:-/opt/phoenix}"
CONTAINER_NAME="${CONTAINER_NAME:-eternal-vault-phoenix-local}"
COMPOSE_SERVICE="${COMPOSE_SERVICE:-phoenix-monitor}"
if [[ -z "$VPS_HOST" ]]; then echo "Set VPS_HOST." >&2; exit 2; fi
VPS_SSH_KEY="${VPS_SSH_KEY/#\~/$HOME}"
echo "Connecting to ${VPS_USER}@${VPS_HOST}:${VPS_PORT}; target: ${CONTAINER_NAME}"
ssh -p "$VPS_PORT" -i "$VPS_SSH_KEY" -o BatchMode=yes -o ServerAliveInterval=30 \
  -t "${VPS_USER}@${VPS_HOST}" bash -s -- "$COMPOSE_DIR" "$CONTAINER_NAME" "$COMPOSE_SERVICE" <<'REMOTE'
set -euo pipefail
COMPOSE_DIR="$1"; CONTAINER_NAME="$2"; COMPOSE_SERVICE="$3"
cd "$COMPOSE_DIR"
if ! docker inspect "$CONTAINER_NAME" >/dev/null 2>&1; then echo "Container not found: $CONTAINER_NAME" >&2; exit 1; fi
if [[ "$(docker inspect --format='{{.State.Running}}' "$CONTAINER_NAME")" != "true" ]]; then
  echo "Container is not running: $CONTAINER_NAME" >&2
  docker inspect --format='State={{.State.Status}} ExitCode={{.State.ExitCode}}' "$CONTAINER_NAME"
  exit 1
fi
echo "STATUS: RUNNING"
docker stats "$CONTAINER_NAME" --no-stream --format 'CPU: {{.CPUPerc}} | Memory: {{.MemUsage}} ({{.MemPerc}})'
docker inspect --format='Health={{if .State.Health}}{{.State.Health.Status}}{{else}}not-configured{{end}}' "$CONTAINER_NAME"
docker inspect --format='Restart Count: {{.RestartCount}} | Started At: {{.State.StartedAt}}' "$CONTAINER_NAME"
echo "Streaming Compose logs for $COMPOSE_SERVICE (Ctrl+C to exit)..."
docker compose logs -f --tail=50 "$COMPOSE_SERVICE"
REMOTE
