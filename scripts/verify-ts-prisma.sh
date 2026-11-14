#!/usr/bin/env bash
set -Eeuo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [[ -f pnpm-lock.yaml ]]; then
  command -v pnpm >/dev/null 2>&1 || { echo "pnpm is required by pnpm-lock.yaml." >&2; exit 1; }
  EXEC=(pnpm exec)
elif [[ -f package-lock.json ]]; then
  command -v npm >/dev/null 2>&1 || { echo "npm is required." >&2; exit 1; }
  EXEC=(npm exec --)
else
  echo "No supported lockfile found." >&2; exit 1
fi

echo "=== Lost Legacies Live: TypeScript & Prisma Verification ==="
"${EXEC[@]}" tsc --version
"${EXEC[@]}" tsc --noEmit --rootDir .
if [[ -f prisma/schema.prisma ]]; then
  "${EXEC[@]}" prisma validate
  "${EXEC[@]}" prisma generate
else
  echo "No prisma/schema.prisma found; skipping Prisma verification."
fi
echo "All TypeScript and Prisma verifications passed."
