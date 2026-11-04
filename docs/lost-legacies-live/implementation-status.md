# Seamcraft Code Seam — Implementation Status

## Committed prototype boundary

The initial browser-side storage seam is implemented in src/client/local-sovereign-store.ts.

It provides:
- six explicit product namespaces;
- validated JSON-LD context and type metadata;
- local IndexedDB record persistence;
- project and shared-identity indexes;
- an outbox entry written in the same transaction as each record;
- pending-operation listing and acknowledgement marking;
- unit tests for record validation and namespace boundaries.

## Important technical distinctions

- This adapter uses the browser-native IndexedDB API. It is not SQLite and does not prove native iOS/Android SQLite behavior.
- The outbox is durable local intent only. There is no network sync endpoint wired to it yet.
- There is no CRDT merge engine, conflict resolution protocol, event signature, or MCP server in this commit.
- The default JSON-LD context URI is a versioned identifier placeholder. Before production use, publish and test a resolvable immutable context document at that URI or configure an approved context URI.
- The shared identity field is an index key, not an authentication mechanism. Never trust a DID string supplied by a client as proof of identity.
- IndexedDB contents are subject to browser storage eviction and device compromise. Do not store highly sensitive records until encryption, retention, revocation, and threat-model requirements are reviewed.

## Next proof steps

1. Run TypeScript build and Vitest in CI.
2. Add browser integration tests with two independent database clients.
3. Define and publish the JSON-LD context.
4. Add an authenticated Fastify sync contract with tenant, consent, idempotency, and schema checks.
5. Connect the outbox to that endpoint and test retry/replay behavior.
6. Evaluate Automerge or Yjs for a specific mergeable field set.
7. Only after the sync and authorization boundary is tested, expose minimized read-only MCP tools.

This commit is a meaningful local persistence and semantic-contract seam, not a complete local-first/CRDT production platform.
