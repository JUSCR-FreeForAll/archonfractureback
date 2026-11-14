# Eternal Vault — Base ↔ Solana Identity Attestation

**Status:** implementation baseline; deploy only after the checks below pass.

## Trust boundaries

- **TimeFux** is the Solana event source. Program ID: `TiMeFUXyR9nTgmiiQgx3wH2qzoyMiY5G4seySXMA9pP`.
- **Phoenix** independently verifies the finalized Solana transaction and its instruction before creating a VaultRecord.
- **Eternal Vault** stores the verified event and binds it to a Base address only after an EIP-191 signature proves control of that address.

## Phoenix ingestion contract

Phoenix must verify all of the following before calling the internal vault-ingestion operation:

1. The transaction is finalized (or the explicitly selected commitment policy is documented) and succeeded.
2. The transaction invokes the exact TimeFux program ID above.
3. The decoded instruction is `ImmortalizePatron` / `immortalize_patron`.
4. The patron public key is extracted from the decoded instruction/accounts.
5. The transaction signature and actual slot are taken from the RPC result, not supplied by an untrusted client.
6. Duplicate transaction signatures and patron bindings are rejected idempotently.

The Base attestation code in this branch deliberately requires an existing VaultRecord whose `timefuxSignature` matches the Phoenix-verified event. It does not create a record with a placeholder slot.

## Base attestation flow

1. Client requests a nonce for a syntactically valid Base address.
2. Server stores a cryptographically random, five-minute, single-use nonce.
3. Client signs the exact returned message using EIP-191.
4. Client submits address, Solana patron, signature, nonce, and TimeFux transaction signature.
5. Server reconstructs the exact message, recovers the signer, checks the Phoenix-ingested record, and atomically consumes the nonce in a serializable transaction.
6. Server stores the attestation and an audit event.

## Data model

The Prisma schema defines VaultRecord, IdentityAttestation, AttestationNonce, VaultAuditEvent, and PatronBindingHistory. Audit rows are append-only by application convention; production must additionally enforce immutability with database permissions/triggers and backups.

## Required production hardening before deployment

- Add authentication/authorization to internal Phoenix ingestion; never expose a write endpoint that trusts a browser-supplied `verified: true`.
- Restrict ingestion to a service identity or signed internal request, validate payloads, and enforce unique transaction signature and patron constraints.
- Add request rate limiting and abuse monitoring to nonce issuance and verification.
- Use HTTPS, secret management, database backups, migrations, and operational alerts.
- Validate Solana public keys and transaction signatures with the Solana SDK in the Phoenix ingestion layer.
- Consider EIP-1271 contract-wallet verification if smart-contract wallets must be supported; `ethers.verifyMessage` handles EOA EIP-191 recovery.
- Confirm the exact TimeFux instruction discriminator, account ordering, and program deployment on the target cluster.
- Do not place private legacy content or sensitive personal data on-chain.
- Do not claim immutable audit guarantees from Prisma schema alone; enforce append-only behavior at the database boundary.

## Environment

```dotenv
DATABASE_URL=postgresql://...
HELIUS_API_KEY=...
NEXT_PUBLIC_TIMEFUX_PROGRAM_ID=TiMeFUXyR9nTgmiiQgx3wH2qzoyMiY5G4seySXMA9pP
SOULBOUND_MINT=
```

Keep service credentials and signing secrets server-side. Do not prefix secrets with `NEXT_PUBLIC_`.

## Soulbound badge

For a production mint, use a multisig or hardware-controlled mint authority. Revoking mint authority is irreversible and should occur only after supply, recovery, and governance requirements are settled. Store the verified mint and associated token account on the corresponding VaultRecord after successful chain confirmation.
