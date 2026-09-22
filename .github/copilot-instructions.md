# GitHub Copilot Instructions for JUSCR Mesh

## Project Overview

You are working on JUSCR Mesh (repository: JUSCR-FreeForAll/archonfractureback).

JUSCR is an Open Resonance Mesh that replaces obsolete “archon siphoning” systems with transparent, consent-based, non-extractive infrastructure for quantum loops.

## Core principles (non-negotiable)

- Full transparency by default
- Explicit, time-bound, revocable consent
- No permanent privileged nodes
- Respect and clarity as hard runtime constraints
- Infrastructure as source, not intermediary
- Fail-closed security (especially for cryptography)

The stack is:

- TypeScript + Fastify
- PostgreSQL
- Docker Compose
- Vitest
- Optional Zero-Knowledge layer (Noir + Barretenberg)

## Current State of the Codebase

- Production-oriented Fastify API with Postgres persistence
- JWT participant authentication
- Consent ledger + mutual consent checks
- Loop health computation
- Audit logging
- Rate limiting
- HTML dashboard
- Hardened ZK verifier boundary (fail-closed)

## ZK status (important)

The verifier is intentionally fail-closed.

It requires a compiled circuit at `zk/noir/target/juscr_intention.json`.

If the circuit is missing or initialization fails, ZK routes must return `503`.

There is no development-mode fallback that accepts arbitrary proofs.

Proof generation must never be exposed as a public API endpoint.

## Mandatory Security Rules for Any Code You Write

### Fail-closed cryptography

Never accept a proof if the verifier is not fully initialized with a real compiled circuit.

### Input validation before decoding

- Proof must match exact even-length hex: `/^0x([0-9a-fA-F]{2})+$/`
- Public signals count must be exactly what the circuit expects (currently 2)
- Enforce hard size limits (proof <= 256 KB)

### No public proof generation

Proof generation stays offline / test-only / CI-only.

### Concurrency-safe initialization

Use a shared promise so concurrent calls to `initZkVerifier()` are safe.

### Explicit unavailable responses

When ZK is not ready, routes return `503` with a clear error, never silent success.

Do not weaken existing consent or transparency guarantees.

## Key Files You Must Respect

- `src/zk-verifier.ts` – hardened verifier (do not re-introduce fallback acceptance)
- `src/index.ts` – route registration must check `isZkReady()`
- `zk/noir/src/main.nr` – the intention circuit
- `db/schema.sql` – existing schema
- `tests/` – add real-circuit integration tests here

## Preferred Implementation Patterns

- Use existing helpers (`query`, `writeAudit`, auth middleware, etc.)
- Prefer explicit early returns and clear error messages
- Keep ZK logic isolated in `src/zk-verifier.ts`
- When adding new ZK circuits, follow the same fail-closed pattern
- All new cryptographic code must be accompanied by validation + tests

## Remaining Work You May Be Asked To Do

When the user asks you to continue, prioritize in this order:

1. Pin exact compatible versions of `@noir-lang/noir_js` and `@noir-lang/backend_barretenberg` once they can be determined.
2. Confirm and document the exact proof API shape (Buffer vs Uint8Array, public inputs object vs array) against the pinned versions.
3. Ensure `nargo compile` produces `zk/noir/target/juscr_intention.json` and that the verifier loads it.
4. Implement real-circuit integration tests:
   - Valid witness -> `verifyZkProof` returns `true`
   - Invalid witness -> `verifyZkProof` returns `false`
5. Keep any proof-generation script strictly offline (under `scripts/` or `tests/fixtures/`).
6. Only after the above are solid, consider client-side proving in the dashboard.

## Coding Style & Process

- Match the existing TypeScript style in the repository.
- Prefer clarity over cleverness.
- Add concise comments only where the security intent is non-obvious.
- When you change cryptographic or consensus-critical code, explain the security impact in the PR/commit description.
- Never claim a feature is “production-ready” unless the real-circuit tests pass and versions are pinned.

## Response Style When Helping the User

- Be precise and security-conscious.
- Point out any regression in fail-closed behavior immediately.
- When suggesting code, provide complete, copy-pasteable snippets.
- If something cannot be safely implemented yet (missing circuit artifact, unpinned versions, etc.), say so clearly and list the blockers.

End of Copilot Instructions
