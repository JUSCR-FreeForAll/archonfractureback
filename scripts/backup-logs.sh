#!/usr/bin/env bash
# Archive Phoenix logs and upload the archive to S3.
set -Eeuo pipefail
umask 077

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
LOG_DIR="${LOG_DIR:-$ROOT_DIR/logs}"
BACKUP_DIR="${BACKUP_DIR:-$ROOT_DIR/backups}"
S3_BUCKET="${S3_BUCKET:-}"
S3_PREFIX="${S3_PREFIX:-phoenix/log-archives}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
WEBHOOK_URL="${WEBHOOK_URL:-}"

notify() {
  local message="$1"
  [[ -n "$WEBHOOK_URL" ]] || return 0
  if command -v curl >/dev/null 2>&1; then
    curl --silent --show-error --fail --max-time 10 \
      -H 'Content-Type: application/json' \
      --data "$(MESSAGE="$message" python3 -c 'import json,os; print(json.dumps({"text":os.environ["MESSAGE"]}))')" \
      "$WEBHOOK_URL" >/dev/null || echo "WARNING: webhook notification failed." >&2
  else
    echo "WARNING: curl unavailable; cannot send webhook notification." >&2
  fi
}

on_error() {
  local exit_code=$?
  trap - ERR
  notify "Phoenix log backup FAILED on $(hostname) at $(date -u +%FT%TZ). Review backup logs."
  echo "ERROR: backup failed (exit $exit_code)." >&2
  exit "$exit_code"
}
trap on_error ERR

die() { echo "ERROR: $*" >&2; notify "Phoenix log backup FAILED on $(hostname) at $(date -u +%FT%TZ). Review backup configuration."; exit 1; }
[[ -d "$LOG_DIR" ]] || die "Log directory does not exist: $LOG_DIR"
[[ -n "$S3_BUCKET" ]] || die "Set S3_BUCKET to the destination bucket."
[[ "$RETENTION_DAYS" =~ ^[0-9]+$ ]] && (( RETENTION_DAYS >= 1 )) || die "RETENTION_DAYS must be a positive integer."
command -v tar >/dev/null 2>&1 || die "tar is required."
command -v aws >/dev/null 2>&1 || die "AWS CLI is required."
command -v python3 >/dev/null 2>&1 || die "python3 is required for safe webhook JSON encoding."

mkdir -p "$BACKUP_DIR"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
archive="$BACKUP_DIR/phoenix-logs-$timestamp.tar.gz"

echo "Checking AWS identity and credentials..."
aws sts get-caller-identity >/dev/null

echo "Creating log archive from $LOG_DIR ..."
tar -czf "$archive" -C "$(dirname "$LOG_DIR")" "$(basename "$LOG_DIR")"
[[ -s "$archive" ]] || die "Archive was not created or is empty."

destination="s3://$S3_BUCKET"
[[ -n "$S3_PREFIX" ]] && destination="$destination/${S3_PREFIX#/}"
echo "Uploading archive to $destination/ ..."
aws s3 cp "$archive" "$destination/$(basename "$archive")" --sse AES256

echo "Removing local backup archives older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -maxdepth 1 -type f -name 'phoenix-logs-*.tar.gz' -mtime "+$RETENTION_DAYS" -delete

echo "SUCCESS: Phoenix logs archived and uploaded to S3."
