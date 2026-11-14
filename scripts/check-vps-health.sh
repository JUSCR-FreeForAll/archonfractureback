#!/usr/bin/env bash
# Check Docker Compose container state and an application health endpoint.
set -Eeuo pipefail

usage() {
  cat <<'USAGE'
Usage: check-vps-health.sh [deploy_directory] [compose_file]

Environment:
  DEPLOY_DIR    Compose project directory (default: current directory)
  COMPOSE_FILE  Compose file path, relative to DEPLOY_DIR unless absolute
  APP_URL       Health endpoint (default: http://localhost:3000/api/health)
  CURL_TIMEOUT HTTP request timeout in seconds (default: 10)
USAGE
}

DEPLOY_DIR="${1:-${DEPLOY_DIR:-.}}"
COMPOSE_FILE="${2:-${COMPOSE_FILE:-docker-compose.yml}}"
APP_URL="${APP_URL:-http://localhost:3000/api/health}"
CURL_TIMEOUT="${CURL_TIMEOUT:-10}"

fail() {
  echo "UNHEALTHY: $*" >&2
  exit 1
}

if [[ ! -d "$DEPLOY_DIR" ]]; then
  fail "Deployment directory does not exist: $DEPLOY_DIR"
fi
DEPLOY_DIR="$(cd "$DEPLOY_DIR" && pwd -P)"
if [[ ! "$CURL_TIMEOUT" =~ ^[0-9]+$ ]] || (( CURL_TIMEOUT < 1 )); then
  fail "CURL_TIMEOUT must be a positive integer."
fi
if [[ "$COMPOSE_FILE" = /* ]]; then
  COMPOSE_PATH="$COMPOSE_FILE"
else
  COMPOSE_PATH="$DEPLOY_DIR/$COMPOSE_FILE"
fi
[[ -f "$COMPOSE_PATH" ]] || fail "Compose file not found: $COMPOSE_PATH"

command -v docker >/dev/null 2>&1 || fail "Docker is not installed or not on PATH."
docker compose version >/dev/null 2>&1 || fail "Docker Compose v2 plugin is unavailable."

echo "Checking Compose project in $DEPLOY_DIR ..."
cd "$DEPLOY_DIR"

if ! docker compose -f "$COMPOSE_PATH" config --quiet; then
  fail "Compose configuration is invalid."
fi

if ! CONTAINER_IDS="$(docker compose -f "$COMPOSE_PATH" ps --all -q)"; then
  fail "Unable to query Compose containers."
fi
[[ -n "$CONTAINER_IDS" ]] || fail "No containers found for this Compose project."

failed=0
while IFS= read -r container_id; do
  [[ -n "$container_id" ]] || continue
  if ! details="$(docker inspect --format '{{.Name}} state={{.State.Status}} health={{if .State.Health}}{{.State.Health.Status}}{{else}}not-configured{{end}}' "$container_id" 2>&1)"; then
    echo "ERROR: Unable to inspect container $container_id: $details" >&2
    failed=1
    continue
  fi

  echo "$details"
  state="$(docker inspect --format '{{.State.Status}}' "$container_id")"
  health_state="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}not-configured{{end}}' "$container_id")"

  if [[ "$state" != "running" ]]; then
    echo "ERROR: Container is not running: $container_id" >&2
    failed=1
  elif [[ "$health_state" == "unhealthy" || "$health_state" == "starting" ]]; then
    echo "ERROR: Container health is $health_state: $container_id" >&2
    failed=1
  fi
done <<< "$CONTAINER_IDS"

(( failed == 0 )) || fail "One or more Compose containers are not healthy."

echo "Checking application endpoint: $APP_URL"
if command -v curl >/dev/null 2>&1; then
  http_code="$(curl --silent --show-error --location --max-time "$CURL_TIMEOUT" --output /dev/null --write-out '%{http_code}' "$APP_URL")" \
    || fail "Health endpoint request failed."
elif command -v wget >/dev/null 2>&1; then
  wget --quiet --timeout="$CURL_TIMEOUT" --tries=1 --spider "$APP_URL" \
    || fail "Health endpoint request failed (wget)."
  http_code="200-or-redirect"
else
  fail "Neither curl nor wget is installed; cannot check APP_URL."
fi

if [[ "$http_code" != "200" && "$http_code" != "200-or-redirect" ]]; then
  fail "Health endpoint returned HTTP $http_code (expected 200)."
fi

echo "SUCCESS: all Compose containers are running and the application health check passed."
