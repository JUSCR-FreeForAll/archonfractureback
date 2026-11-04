# Lost Legacies Live — Target Architecture

**Architecture decision brief | 4 November 2026**

## 1. Executive summary

Retain the JUSCR Spine as the policy-enforcing service and introduce local-first behavior as an additive client capability. The client may accept user edits while offline, but the server remains authoritative for cross-user permissions, consent state, globally shared invariants, and accepted audit events.

The architecture is deliberately staged:

- **Track A — existing foundation:** Fastify 5 / TypeScript API, PostgreSQL persistence path, Zod contracts, JSON-LD and CloudEvents structures, consent and audit concepts, SHA-256 integrity primitives, and the existing zero-knowledge verification boundary.
- **Track B — target capabilities:** embedded SQLite on supported clients, a durable local outbox, CRDT-based synchronization, scoped MCP tool interfaces, and optional managed data or blockchain services only after a decision review.

Do not replace Fastify/PostgreSQL, restructure the service, deploy, or connect the separate JUSCR consumer application as part of this architecture document.

## 2. Logical components

| Component | Responsibility | Trust boundary |
| --- | --- | --- |
| Product clients | Web/mobile UI, local cache, local writes, offline queue | User-controlled device |
| SQLite store | Local entities, pending operations, sync cursor, local metadata | Device storage; encrypt where platform permits |
| CRDT adapter | Merge concurrent edits for explicitly mergeable fields | Deterministic merge rules; no authority over consent |
| Sync gateway | Authenticate, validate, authorize, deduplicate, reconcile, return accepted events | Fastify service |
| PostgreSQL | Durable shared state, event ledger, indexes, tenant boundaries | Server-controlled |
| Semantic registry | Versioned JSON-LD contexts and schema mappings | Reviewed, immutable versions |
| Audit verifier | Event digest and chain verification; key-based signatures where implemented | Server and independently verifiable evidence |
| MCP perimeter | Exposes allow-listed read/action tools, not arbitrary SQL | Separate scoped tool boundary |
| Optional adapters | Supabase, Solana, external identity, analytics | Separate vendor and legal/security review |

## 3. Data ownership and consistency

Use local-first for user experience, not as a blanket claim that every domain can be merged automatically.

**Good CRDT candidates:** drafts, annotations, personal preferences, collaborative text, and other fields with well-defined merge semantics.

**Server-authoritative candidates:** consent grants and revocations, identity verification, financial settlement, access-control policy, marketplace transactions, and any action with legal or safety implications. These operations require server validation and explicit conflict handling.

For each entity, define:
- stable entity ID and tenant/owner scope;
- schema version and JSON-LD context identifier;
- provenance and actor;
- consent reference and policy version;
- lifecycle status and domain protocol;
- updated-at metadata and causal/version information;
- deletion/tombstone semantics and retention policy.

A CRDT merge must never silently restore revoked consent or override a server-enforced policy. Revocation is a monotonic policy event that blocks subsequent access even if stale replicas retain old data.

## 4. Synchronization protocol

1. User action is validated locally and written transactionally to SQLite.
2. The same transaction appends an operation to a durable outbox.
3. When connected, the client sends a batch with operation IDs, entity IDs, schema versions, causal metadata, and payload digests.
4. Fastify authenticates the caller, checks tenant scope and current consent, validates the schema, and applies idempotency checks.
5. The server accepts, rejects, or flags each operation; it does not blindly trust client claims or timestamps.
6. Mergeable fields pass through the selected CRDT adapter. Server-authoritative fields pass domain-specific validation.
7. Accepted events are persisted to PostgreSQL with audit metadata; the client receives canonical state, accepted event IDs, and a new sync cursor.
8. The client applies the response transactionally and removes only acknowledged outbox entries.
9. Rejected or conflicted operations remain visible for resolution; retries are safe through stable operation IDs.

Use bounded batches, exponential backoff with jitter, per-tenant rate limits, payload-size limits, and observable dead-letter handling.

## 5. Event envelope and semantic interoperability

Every cross-product event should have a stable envelope containing:
- event ID and event type;
- subject/entity ID;
- actor and tenant;
- event time and server-received time;
- schema version and JSON-LD context URI;
- provenance and consent/policy references;
- protocol and outcome;
- payload or payload reference;
- idempotency key and causal metadata;
- digest and signature metadata when cryptographic signing is implemented.

CloudEvents can provide the event envelope conventions. JSON-LD context versions should be immutable and resolvable. Never mutate a published context in place; publish a new version and provide explicit migration mappings.

SHA-256 provides a content digest, not proof of who authored an event. Authenticity requires a signing key, key lifecycle, signature verification, and trusted actor binding. A hash chain detects tampering only when a trusted checkpoint or signature protects the chain head.

## 6. MCP security perimeter

MCP should expose purpose-built tools, not database access.

Recommended initial read-only tools:
- discover available product capabilities for the authenticated principal;
- retrieve a minimal, consent-filtered entity summary;
- retrieve provenance and audit metadata for an authorized entity;
- explain why an operation is denied without revealing protected data.

Later write tools require explicit user confirmation, idempotency, policy checks, and a complete audit event. Every tool call must bind to an authenticated principal, tenant, scope, purpose, and consent decision. Use allow-lists, strict input schemas, output minimization, rate limits, timeouts, and audit logging.

“Local MCP” reduces unnecessary data transfer only when the host, model runtime, tool transport, logs, and telemetry are all controlled. Do not claim that data never leaves the device unless the full deployment path has been verified.

## 7. Security and privacy controls

- Authentication and tenant isolation on every server request.
- Authorization and current consent checks at the point of use.
- Revocation propagated as a high-priority policy event.
- Encryption in transit; encrypted server storage and platform-backed local encryption where available.
- Key rotation, secrets management, and least-privilege service accounts.
- Schema validation, payload limits, replay protection, idempotency, and abuse controls.
- Append-only audit events with defined retention, access, export, and legal hold policies.
- Backup, restore, disaster recovery, and data portability tests.
- Threat modeling for compromised devices, malicious clients, stale replicas, insider access, supply-chain compromise, and prompt/tool injection.
- Privacy review and data minimization before enabling AI context retrieval.

SOC 2 and HIPAA are not features that can be declared by architecture alone. Determine applicability, establish controls and evidence, complete independent assessment, and obtain required agreements before making compliance claims.

## 8. Technology choices and decision gates

| Capability | Candidate | Decision gate |
| --- | --- | --- |
| Local database | SQLite | Confirm platform bindings, encryption, migrations, and browser/native support |
| CRDT | Automerge or Yjs | Prototype merge semantics, binary/text workload, persistence, licensing, and ecosystem support |
| Sync transport | HTTPS batch API initially | Measure reliability before introducing streaming or relay infrastructure |
| Server database | Existing PostgreSQL | Preserve current schema and migration discipline |
| Semantic data | JSON-LD contexts + Zod DTOs | Versioning, context governance, and validation mapping |
| Agent tools | MCP server adapter | Threat model, identity propagation, tool authorization, and data egress review |
| Managed services | Supabase only if it adds measurable value | Avoid duplicate ownership of auth, database, and policy |
| Blockchain | Solana only for a concrete public-verification requirement | Cost, privacy, key custody, reversibility, and legal review |

Avoid adopting multiple overlapping infrastructure providers before one end-to-end use case is proven.

## 9. Performance and cost claims

Do not publish sub-millisecond writes, sub-2ms verification, 70–80% client execution, or 75% cloud-cost reduction as achieved facts without a reproducible benchmark.

Measure:
- p50/p95/p99 local write and read latency by device class;
- sync success, retry, conflict, and convergence rates;
- time to recover after offline periods;
- server CPU, database load, storage, egress, and cost per active user/action;
- authorization and audit verification latency;
- battery, memory, and storage impact.

Compare the same workload against the current server-centric baseline, with documented sample sizes and test conditions.

## 10. Deployment topology

Initial prototype: client SQLite + HTTPS sync endpoint + existing Fastify service + PostgreSQL. Use one environment and a small pilot tenant set. Do not add Redis, a separate relay cluster, Supabase, or Solana until measured bottlenecks or product requirements justify them.

Production readiness requires operational dashboards, structured logs, alerting, backup/restore drills, incident response, data deletion/export procedures, and documented service-level objectives.
