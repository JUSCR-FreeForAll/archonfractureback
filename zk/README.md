# Zero-knowledge intention proof scaffold

This directory defines the boundary for an optional privacy layer. The API accepts public signals and a bounded proof string, but it fails closed until a real SP1 or Noir verifier is configured.

## Public statement

A participant can prove that an intention is unexpired and committed to a loop purpose without disclosing the intention text. Proofs must be bound to `loop_id`, `participant_id`, `purpose_commitment`, `expires_at`, and a unique `nonce`.

## Current API

`POST /loops/:id/prove-intention` accepts:

```json
{
  "proof": "<bounded opaque proof>",
  "public_signals": {
    "loop_id": "...",
    "participant_id": "...",
    "purpose_commitment": "<sha256 hex>",
    "nonce": "<unique value>",
    "expires_at": "2030-01-01T00:00:00.000Z"
  }
}
```

The endpoint never trusts a client-provided `verified` field. It returns `503` until `verifyWithConfiguredVerifier` is replaced with a generated verifier or verifier-service call. Do not treat the educational Noir/SP1 snippets as cryptographic production implementations.

## Database

Apply `db/zk-proofs.sql` after `db/schema.sql`. Only proof hashes and public signals are persisted; raw proofs and private intention text are not stored.
