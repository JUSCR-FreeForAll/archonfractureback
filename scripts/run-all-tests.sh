#!/usr/bin/env bash
set -Eeuo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

CI_MODE=false
if [[ "${CI:-}" == "true" || "${GITHUB_ACTIONS:-}" == "true" ]]; then CI_MODE=true; fi
log() { printf '\n[%s] %s\n' "$1" "$2"; }
fail_or_warn() {
  if [[ "$CI_MODE" == "true" ]]; then log ERROR "$1"; exit 1; fi
  log WARN "$1"
}

if [[ -f pnpm-lock.yaml ]]; then
  command -v pnpm >/dev/null 2>&1 || { log ERROR "pnpm-lock.yaml exists but pnpm is unavailable."; exit 1; }
  PM=pnpm
elif [[ -f package-lock.json ]]; then
  command -v npm >/dev/null 2>&1 || { log ERROR "npm is required."; exit 1; }
  PM=npm
else
  log ERROR "No pnpm-lock.yaml or package-lock.json found."; exit 1
fi

run_script() {
  log RUN "$1"
  if [[ "$PM" == "pnpm" ]]; then pnpm run "$1"; else npm run "$1"; fi
}

log INFO "Package manager: $PM"
run_script lint
run_script typecheck

if [[ -f prisma/schema.prisma ]]; then
  # Prisma is a declared project dependency; do not mutate the dependency graph
  # from a test runner. Install from the committed lockfile before invoking it.
  if [[ ! -x node_modules/.bin/prisma ]]; then
    fail_or_warn "Prisma CLI is missing. Install the declared dependencies before running tests."
  elif [[ ! -d node_modules/@prisma/client ]]; then
    fail_or_warn "@prisma/client is missing. Install the declared dependencies before running tests."
  else
    PRISMA=(./node_modules/.bin/prisma)
    if "${PRISMA[@]}" validate && "${PRISMA[@]}" generate; then
      log OK "Prisma validation and client generation passed."
    else
      fail_or_warn "Prisma validation or client generation failed."
    fi

    if [[ "${NODE_ENV:-}" == "production" ]]; then
      fail_or_warn "Refusing Prisma db push because NODE_ENV=production."
    elif [[ -n "${DATABASE_URL:-}" ]]; then
      if "${PRISMA[@]}" db push --skip-generate; then
        log OK "Prisma db push completed."
      else
        fail_or_warn "Prisma db push failed or the database is unavailable."
      fi
    else
      fail_or_warn "DATABASE_URL is not set; Prisma db push could not run."
    fi
  fi
else
  log INFO "No prisma/schema.prisma found; skipping Prisma checks."
fi

run_script test
log OK "All configured validation and test steps passed."
