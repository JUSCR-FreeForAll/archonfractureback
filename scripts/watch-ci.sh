#!/usr/bin/env bash
set -euo pipefail

TARGET_SHA="${1:-${GITHUB_SHA:-}}"
MAX_ATTEMPTS="${MAX_ATTEMPTS:-30}"
POLL_SECONDS="${POLL_SECONDS:-10}"

if [[ -z "$TARGET_SHA" ]]; then
  echo "Usage: $0 <commit-sha> (or set GITHUB_SHA)" >&2
  exit 2
fi
if ! [[ "$MAX_ATTEMPTS" =~ ^[1-9][0-9]*$ ]] || ! [[ "$POLL_SECONDS" =~ ^[1-9][0-9]*$ ]]; then
  echo "MAX_ATTEMPTS and POLL_SECONDS must be positive integers." >&2
  exit 2
fi

echo "🔍 Polling GitHub Actions for commit $TARGET_SHA (maximum $((MAX_ATTEMPTS * POLL_SECONDS)) seconds)..."
run_id=""
attempt=1
while [[ -z "$run_id" ]]; do
  if (( attempt > MAX_ATTEMPTS )); then
    echo "❌ Timed out waiting for a workflow run for $TARGET_SHA." >&2
    exit 1
  fi
  run_id="$(gh run list --commit "$TARGET_SHA" --json databaseId -q '.[0].databaseId // empty')"
  if [[ -z "$run_id" ]]; then
    sleep "$POLL_SECONDS"
    ((attempt += 1))
  fi
done

echo "📋 Found workflow run $run_id. Monitoring..."
attempt=1
while (( attempt <= MAX_ATTEMPTS )); do
  status="$(gh run view "$run_id" --json status -q '.status')"
  conclusion="$(gh run view "$run_id" --json conclusion -q '.conclusion // empty')"
  echo "$(date +%T) - Status: $status | Conclusion: ${conclusion:-pending}"

  if [[ "$status" == "completed" ]]; then
    if [[ "$conclusion" == "success" ]]; then
      echo "🎉 CI pipeline passed."
      exit 0
    fi
    echo "❌ CI pipeline concluded: ${conclusion:-unknown}. Fetching failed logs..." >&2
    gh run view "$run_id" --log-failed || true
    exit 1
  fi

  sleep "$POLL_SECONDS"
  ((attempt += 1))
done

echo "❌ Timed out monitoring workflow run $run_id." >&2
gh run view "$run_id" --log-failed || true
exit 1
