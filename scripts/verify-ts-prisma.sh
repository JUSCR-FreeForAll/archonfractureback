#!/usr/bin/env bash
set -Eeuo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [[ -f pnpm-lock.yaml ]]; then
  command -v pnpm >/dev/null 2>&1 || { echo "pnpm is required by pnpm-lock.yaml." >&2; exit 1; }
elif [[ -f package-lock.json ]]; then
  command -v npm >/dev/null 2>&1 || { echo "npm is required." >&2; exit 1; }
else
  echo "No supported lockfile found." >&2; exit 1
fi

echo "=== Lost Legacies Live: TypeScript & Prisma Verification ==="
[[ -x node_modules/.bin/tsc ]] || { echo "TypeScript dependency is missing; install project dependencies first." >&2; exit 1; }
./node_modules/.bin/tsc --version
./node_modules/.bin/tsc --noEmit --rootDir .
if [[ -f prisma/schema.prisma ]]; then
  [[ -x node_modules/.bin/prisma ]] || { echo "Prisma CLI dependency is missing; install project dependencies first." >&2; exit 1; }
  [[ -d node_modules/@prisma/client ]] || { echo "@prisma/client dependency is missing; install project dependencies first." >&2; exit 1; }
  ./node_modules/.bin/prisma validate
  ./node_modules/.bin/prisma generate
else
  echo "No prisma/schema.prisma found; skipping Prisma verification."
fi
echo "All TypeScript and Prisma verifications passed."
