# TRE of Life — Local Parallel Companion
Version 0.1.0 | Lost Legacies Live

This folder provides a small offline-capable interface so a basic computer can inspect a local TRE model snapshot even when GitHub, Replit, or a hosted service is unavailable.

## What it does
- Starts a local-only web interface at http://127.0.0.1:8765.
- Loads the bundled symbolic model snapshot in memory.
- Displays the sequence, count/radix assumptions, three-day phase setting, and mapping status.
- Runs a basic integrity check against the expected sequence.
- Requires no internet connection or third-party Python packages.

## Run it
Requires Python 3.9 or newer.
- macOS / Linux: python3 tre-life.py
- Windows: py tre-life.py

Then open http://127.0.0.1:8765 in a browser. Stop with Ctrl+C.

The script is a local inspection companion, not a replacement for the TypeScript/PostgreSQL engine. It does not connect to a database, authenticate users, synchronize records, send messages, apply migrations, or publish data. It intentionally has no automatic network sync. This is the safe parallel/offline theory: the local copy remains inspectable while hosted systems are unavailable.

## Repository relationship
Reference repository: JUSCR-FreeForAll/archonfractureback
Reference engine branch: codex/six-segment-interoperability
This charter/backup branch: codex/tre-life-stewardship-backup

The existing engine code, SQL migration, bridge, and tests remain separate from this lightweight companion. A prior staging review was only partially verified: source inspection passed for several model rules, while live staging health, deployed revision, migration state, consent runtime, idempotency runtime, and test execution remained blocked or unverified. Do not treat this local app as proof of staging deployment.

## Safety
Do not put private stories, credentials, keys, or personal dossiers in this demo. Keep private records encrypted and access-controlled. The charter is proposed, not legal advice or a binding consent agreement. Review it with contributors and qualified counsel before creating a legal archive or transferring rights.

## Files
- README.md — this guide
- tre-life.py — local executable launcher and read-only interface
- HISTORICAL_STEWARDSHIP_CHARTER.md — proposed governance charter
