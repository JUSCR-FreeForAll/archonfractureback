# JUSCR zero-knowledge circuits

## Intention proof (Noir)

The Noir scaffold proves that a private intention hash matches the public loop-purpose commitment and that its expiry is later than the public current time. It does not yet verify an Ed25519 signature; that must be added before production use.

```bash
cd zk/noir
nargo compile
nargo execute
# Optional, depending on the installed Noir toolchain:
nargo codegen-verifier
```

Generated artifacts are written beneath `target/`. Do not commit private witnesses. Copy only reviewed verification artifacts into `zk/circuits/` when a verifier has been selected.

## API boundary

`POST /loops/:id/prove-intention` validates bindings, expiry, size, and replay protection, then calls the verifier boundary. The current verifier is deliberately fail-closed and returns `503` until a real Noir/Barretenberg, SP1, or dedicated verifier service is configured.

The API never trusts a client-provided `verified` flag, stores raw proof payloads, or logs private intention text.

At startup, the API requires `zk/noir/target/juscr_intention.json` and the pinned Noir/Barretenberg runtime packages before enabling verification. Initialization is concurrency-safe and records its failure reason. Both proof endpoints return an explicit `503` with that reason while the verifier is unavailable. Before production use, confirm the exact `verifyFinalProof` proof/public-input shape for the pinned package versions and add a real-circuit integration test covering valid and invalid witnesses.

The guarded Vitest integration scaffold is `tests/zk-circuit.integration.test.ts`. It is skipped when the compiled artifact is absent, and fails with an explicit prerequisite/API-shape error when the artifact exists but the pinned runtime is unavailable. Run it with `vitest run tests/zk-circuit.integration.test.ts` after installing the exact runtime versions and compiling the circuit.
