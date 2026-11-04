# Seamcraft — Local-First Interoperability MVP

**Implementation blueprint | additive to the existing JUSCR Spine**

## Objective

Prove one safe, measurable end-to-end path: a user can create and edit a selected low-risk entity offline, persist the change locally, synchronize it later, reconcile concurrent edits under explicit rules, and inspect a verifiable audit record.

This is a prototype plan, not a claim that SQLite, CRDT synchronization, or MCP has already been implemented.

## 1. Scope and exclusions

**In scope**
- One pilot entity type with non-sensitive, mergeable fields.
- Local SQLite schema and migrations.
- Durable operation outbox.
- One CRDT adapter behind a typed interface.
- Fastify sync endpoint added without replacing existing routes.
- PostgreSQL persistence using existing migration conventions.
- JSON-LD context and CloudEvents-compatible event envelope.
- Idempotency, consent checks, audit digest, and integration tests.
- Read-only MCP discovery/summary prototype after the sync path is secure.

**Out of scope**
- Replacing Fastify or PostgreSQL.
- Rewriting the separate Express/Clerk JUSCR consumer.
- Full portfolio-wide sync or automatic merging of every domain.
- Solana writes, tokenization, or financial settlement.
- Claims of SOC 2/HIPAA certification or production compliance.
- Deployment, publishing, or connecting the consumer app.

## 2. Proposed logical record shapes

### Local entity
- id: stable UUID
- tenantId: authenticated tenant scope
- entityType: allow-listed domain type
- data: validated entity payload
- schemaVersion: immutable schema version
- context: versioned JSON-LD context URI
- localRevision: local monotonic revision
- syncState: pending, synced, conflicted, rejected
- updatedAt: client display timestamp only

### Outbox operation
- operationId: stable UUID generated once
- entityId and entityType
- operationKind: create, update, tombstone
- actorId: derived from authenticated session on server; client actor hint is untrusted
- payload and schemaVersion
- context URI
- causal metadata required by chosen CRDT
- createdAt: client timestamp for diagnostics, not authority
- payloadDigest: SHA-256 of canonical serialized operation
- retryCount and lastAttemptAt

### Server audit event
- eventId and operationId
- tenantId and authenticated actorId
- entityId and entityType
- accepted/rejected/conflict outcome
- policy and consent decision references
- schema/context version
- serverReceivedAt
- payloadDigest
- previousDigest and eventDigest if a hash chain is used
- signature/keyId only after signing infrastructure is implemented

## 3. API contract sketch

**POST /sync/v1/batch**

Request: bounded array of operations. Require authenticated principal, tenant scope, stable operation IDs, supported schema/context versions, and payload-size limits.

Response per operation:
- accepted with canonical server version and event ID;
- duplicate with the original outcome;
- conflict with a safe conflict descriptor;
- rejected with a stable machine-readable reason.

The endpoint must be idempotent. A retry with the same operation ID and same digest returns the original result. Reuse of an operation ID with a different digest is rejected and audited.

**GET /sync/v1/changes?cursor=...**

Returns only changes visible to the authenticated principal and tenant, plus a new opaque cursor. Cursor validation and revocation checks are server-side.

## 4. Conflict policy

| Data class | Policy |
| --- | --- |
| User draft / annotation | CRDT merge after schema validation |
| Collaborative text | Evaluate text-capable CRDT; preserve attribution where needed |
| Profile preference | Field-level last-writer or explicit user resolution; never rely on untrusted client clock alone |
| Consent grant/revocation | Server-authoritative; revocation wins and blocks access |
| Identity, access policy, settlement | Server-authoritative; no automatic CRDT merge |
| Audit events | Append-only; corrections are new events, never mutation |

Define convergence tests for concurrent edits, offline rejoin, duplicate delivery, out-of-order delivery, and stale client state.

## 5. Phased delivery

### Sprint 0 — Discovery and baseline
- Inspect current Fastify route registration, storage abstraction, PostgreSQL migrations, consent model, and audit primitives.
- Select one low-risk pilot entity.
- Record baseline server-centric latency and cost.
- Write a threat model and data classification.
- Decide CRDT library only after a focused prototype and license review.

**Exit:** approved entity contract, baseline, and testable acceptance criteria.

### Sprint 1 — Local persistence
- Add client-side SQLite adapter and versioned migrations in the appropriate client repository only after its owner approves scope.
- Implement transactional entity write + outbox append.
- Add local recovery and migration tests.

**Exit:** offline create/edit survives app restart; no network required.

### Sprint 2 — Sync API
- Add additive Fastify routes and typed request/response schemas.
- Validate authentication, tenant scope, consent, schema version, idempotency, and payload limits.
- Persist accepted events through the existing PostgreSQL storage path.
- Add server-side replay and duplicate-delivery tests.

**Exit:** offline operations synchronize safely and retries do not duplicate state.

### Sprint 3 — CRDT reconciliation
- Implement adapter for the selected entity and selected library.
- Test concurrent edits, deterministic convergence, tombstones, stale replicas, and server-authoritative fields.
- Expose conflicts requiring human resolution.

**Exit:** independent replicas converge for the approved mergeable fields; policy fields remain protected.

### Sprint 4 — Semantic and agent seam
- Publish immutable JSON-LD context and mapping documentation.
- Emit CloudEvents-compatible audit events.
- Add read-only MCP discovery and summary tools with authenticated scope and consent filtering.
- Add adversarial tests for prompt injection, tool overreach, unauthorized entity IDs, and data exfiltration.

**Exit:** agent can discover and retrieve only the minimum authorized summary; raw database access is impossible through the tool surface.

## 6. Acceptance criteria

1. Local entity write and outbox append are atomic.
2. Offline edits survive process restart and device reconnection.
3. A batch can be safely retried without duplicate mutation.
4. Unauthorized, revoked, malformed, stale-schema, and cross-tenant operations fail closed.
5. Concurrent mergeable edits converge under documented CRDT semantics.
6. Consent, identity, and settlement fields cannot be overridden by CRDT merge.
7. Every accepted/rejected operation has a traceable audit event and payload digest.
8. Digest verification detects modified payloads; authorship is not claimed without signature verification.
9. MCP exposes only allow-listed, scoped operations and returns minimized data.
10. Tests cover duplicate, replay, out-of-order, conflict, revocation, and recovery scenarios.
11. Benchmarks report p50/p95/p99 and device/server conditions; no unmeasured performance promises.
12. Existing API routes, migrations, and ZK verification behavior continue to pass regression tests.

## 7. Suggested repository layout

Client-side work belongs in the client repository after that repository is selected and approved. The current backend can receive additive modules following its existing structure, for example:
- src/routes/sync.ts
- src/sync/contracts.ts
- src/sync/idempotency.ts
- src/sync/reconcile.ts
- src/sync/audit.ts
- db/migrations for sync operation and cursor persistence
- tests/sync for contract, authorization, idempotency, and convergence behavior

These are proposed paths, not files created by this documentation commit.

## 8. Risks and mitigations

- **CRDT overreach:** restrict merge to selected fields and entity types.
- **Revocation race:** check current server policy at sync and every protected read.
- **Client clock manipulation:** server timestamps and causal metadata; client time is diagnostic only.
- **Duplicate/replay attacks:** stable operation IDs, digest binding, authenticated scope, retention policy.
- **Context drift:** immutable context versions and explicit migrations.
- **MCP exfiltration:** allow-listed tools, minimal outputs, scoped credentials, egress review.
- **Local device compromise:** minimize local sensitive data, use platform storage protection, support revocation and session expiry.
- **Unproven economics:** benchmark before claiming infrastructure savings.

## 9. Immediate engineering sequence

1. Review the current branch diff and run existing build/test checks.
2. Map existing consent, storage, and audit abstractions before adding a sync route.
3. Choose a pilot entity and write the contract first.
4. Prototype SQLite persistence and one CRDT in isolation.
5. Add the server sync endpoint behind tests and feature gating.
6. Demonstrate offline-to-online convergence in a two-client test.
7. Add read-only MCP only after authorization and audit tests pass.
