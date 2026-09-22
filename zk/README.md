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
