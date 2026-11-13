# Deterministic Time Engine — Phase 1 Integration

**Status:** Implemented as an isolated deterministic simulation kernel on `codex/six-segment-interoperability`. This is not a staging deployment and does not activate public routes, persistence, payments, or network synchronization.

## Placement

The kernel lives under `src/deterministic-time/` and is deliberately separate from the existing Lost Legacies Live counted-imagination model (`src/time-model.ts`), PostgreSQL helpers (`src/time-engine-store.ts`), and consent-gated bridge (`src/time-bridge.ts`).

- `DeterministicTimeEngine` owns the fixed-step accumulator and monotonic bigint tick counter.
- `SpineOrchestrator` orders subsystem updates by numeric priority, then stable subsystem ID.
- `canonical.ts` canonicalizes JSON-compatible state and hashes the complete snapshot envelope with SHA-256.
- `SubsystemSnapshot` carries subsystem ID, tick ID, schema version, payload, and checksum.
- `restoreAll` validates the full snapshot set before mutation and attempts to restore backups if a subsystem restore unexpectedly fails.

## Runtime contract

Simulation subsystems receive only an immutable `TickContext` containing `tickId` and fixed `deltaMs`. Wall-clock time, render interpolation, browser state, random ambient values, network arrival order, and database state must not be read from inside deterministic subsystem updates.

Inputs that affect simulation must be represented as explicitly ordered, recorded commands in a future input-buffer layer. Do not read HTTP requests, PostgreSQL, Redis, user identity, or external APIs directly from a subsystem's `update` method.

## Snapshot contract

Snapshot payloads must be JSON-compatible values: null, booleans, strings, finite numbers, arrays, and plain objects. Undefined values, bigint values inside payloads, class instances, functions, symbols, and cycles are rejected rather than silently serialized ambiguously. The engine tick itself is stored as a decimal string in the envelope.

SHA-256 here is an integrity checksum for deterministic state comparison and corruption detection. It is not an authentication mechanism or a substitute for signed network messages, authorization, or transport security.

## Boundaries and next integration steps

1. Keep the kernel local and synthetic-data-only while subsystem contracts stabilize.
2. Add a recorded input-command buffer before implementing replay or rollback.
3. Add schema-versioned migrations for any persisted snapshots; do not store snapshots implicitly in the current Time Engine tables.
4. Connect the kernel to the Time Auction or economy only through explicit command/event adapters with idempotency and separate authorization.
5. Keep publication, participant consent, external communications, and financial transfers outside simulation ticks and behind their own release gates.
6. Add authenticated lockstep/state-sync transport only after replay determinism and threat-model tests pass.

## Verification

Run:

```bash
npm run build
npm test
```

The dedicated suite is `tests/deterministic-time.test.ts`. Repository CI results must be checked on the branch after the commit; the existence of the tests does not itself establish that they have passed.
