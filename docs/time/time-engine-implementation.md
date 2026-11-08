# Time Engine implementation notes

**Status:** First bounded implementation slice; not production authorization or deployment.

## Implemented contracts

- `src/time-model.ts` preserves the supplied ten-count sequence exactly:
  `(0, -0.5, -1, 0.5, 0, 1, 1, 2, 3, 5)`.
- Counts 1–3 (the `-1` pivot and positions to its left) use radix 3.
- Counts 4–10 use their own counted number as radix. Thus the count itself renders as `10` in its own radix; the imagination value remains a separate coordinate.
- The five model coordinates are: counted number, imagination value, radix, symbolic realm layer, and temporal phase offset.
- The supplied three-day offset is a configurable parameter, not a physical-time claim.
- Values 3 and 5 are marked `higher-order-unmapped`; no Realm 5/6 mapping is invented.
- The ratio is represented as the exact comparison pair `leftConstant : (count × imaginationValue)`. The left constant is configurable. No energy unit, price, or causal interpretation is inferred.

## Stack milestones

| Count | Value | Radix | Model note |
|---:|---:|---:|---|
| 7 | 1 | 7 | First higher-count stack point; count encodes as `10` |
| 8 | 2 | 8 | Realm 4 value; count encodes as `10` |
| 9 | 3 | 9 | Higher-order layer intentionally unmapped |
| 10 | 5 | 10 | Higher-order layer intentionally unmapped |

Counts beyond 10 are rejected until a recurrence rule is specified. The sequence resembles a Fibonacci tail at 1, 1, 2, 3, 5, but the earlier values (0, -0.5, -1, 0.5, 0) do not establish a unique recurrence.

## Atomic storage and privacy

- `db/migrations/002_time_engine.sql` adds private Secret Rooms, encrypted contribution payloads, revisions, consent grants, minimal audit metadata, and idempotency records.
- `src/time-engine-store.ts` provides a PostgreSQL transaction-scoped advisory lock and idempotency-key claim helper.
- Ciphertext is stored as BYTEA; plaintext narrative content must not be written to audit metadata.
- The DB constraints keep local-only/eligible contributions private. Shared state requires a separate explicit consent workflow.
- The storage helper assumes caller authorization. It is not an authentication layer.

## Secret Room UI and cross-layer communication

The Secret Room is a local draft surface with optional +1/2 and -1/2 review lenses. Those lenses are prompts, not autonomous agents or diagnostic authorities. A cross-layer message is an application event/outbox record with explicit source, destination, consent scope, and delivery status; it is not communication between independently existing realms. No public post, external contact, token issuance, payment, or blockchain transaction is triggered by local drafting.

## Not yet enabled

The existing Fastify server does not yet have a verified participant-authentication middleware for this module. Therefore this slice deliberately does not expose public contribution routes or wire writes to the API. Before route activation, add authenticated participant identity, authorization tests, encryption-key lifecycle, consent grant/revoke endpoints, and a security review. This is safer than exposing a draft endpoint with caller-supplied participant IDs.
