#!/usr/bin/env bash
set -euo pipefail

echo "=================================================="
echo "🛫 Lost Legacies Live: Local Pre-Flight Check"
echo "=================================================="

has_errors=0

echo -n "🔍 Checking Docker daemon... "
if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
  echo "RUNNING"
else
  echo "STOPPED or UNAVAILABLE"
  echo "   ↳ Start Docker Desktop or the local Docker service."
  has_errors=1
fi

echo -n "🔍 Checking pnpm... "
if command -v pnpm >/dev/null 2>&1; then
  echo "INSTALLED ($(pnpm --version))"
else
  echo "MISSING"
  echo "   ↳ Enable Corepack or install pnpm."
  has_errors=1
fi

echo -n "🔍 Checking .env file... "
if [[ -f ".env" ]]; then
  echo "FOUND"
else
  echo "WARNING (missing .env)"
fi

database_url_present=0
if [[ -n "${DATABASE_URL:-}" ]]; then
  database_url_present=1
elif [[ -f ".env" ]] && grep -Eq '^[[:space:]]*(export[[:space:]]+)?DATABASE_URL[[:space:]]*=' .env; then
  database_url_present=1
fi

echo -n "🔍 Checking DATABASE_URL... "
if (( database_url_present )); then
  echo "PRESENT (value not displayed)"
else
  echo "MISSING"
  echo "   ↳ Export DATABASE_URL or define it in .env."
  has_errors=1
fi

echo "=================================================="
if (( has_errors == 0 )); then
  echo "🎉 All pre-flight checks passed."
  exit 0
fi

echo "💥 Pre-flight check failed. Resolve the issues above."
exit 1
