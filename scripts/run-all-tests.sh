#!/usr/bin/env bash
set -euo pipefail

echo "🔎 Running TypeScript build..."
pnpm build

echo "🧪 Running Vitest suite..."
pnpm exec vitest run --passWithNoTests

echo "✅ Build and test suite passed."
