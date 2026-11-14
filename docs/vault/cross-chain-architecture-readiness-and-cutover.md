# Eternal Vault Cross-Chain Architecture: Readiness and Cutover

Status: architecture summary and verification checklist. Readiness labels below describe the supplied design claims, not an independent production audit.

## System architecture and readiness matrix

| Layer | Component | Responsibility | Evidence / current status |
|---|---|---|---|
| Event source | TimeFux Solana program, `TiMeFUXyR9nTgmiiQgx3wH2qzoyMiY5G4seySXMA9pP` | Executes `ImmortalizePatron` rituals | Program ID and instruction name are supplied project details; verify deployed program and instruction on the target cluster. |
| Real-time guardian | Phoenix Scream Monitor | Watches logs, fetches transactions, validates events, forwards verified records | Architecture described; validate implementation, RPC transport, durable deduplication, reconnect behavior, and ingestion authentication. |
| Soulbound credential | ⟲144 Token-2022 badge | Represents non-transferable patron credential | NonTransferable extension and mint-authority revocation must be independently confirmed from chain state. |
| Persistent ledger | Eternal Vault, PostgreSQL/Prisma | Stores ritual records, attestations, audit events | Schema and implementation must be checked for explicit verification state, unique constraints, append-only audit behavior, and transactional integrity. |
| Cross-chain link | Base ↔ Solana attestation | Binds a Base signer/address to a Solana patron | Verify chain ID, challenge domain, EIP-191 recovery, nonce expiry/replay protection, canonical address comparison, and binding uniqueness. |
| Patron portal | Phantom and Base dashboard | Wallet connection, signing, and vault telemetry | Confirm wallet flows and that UI status is derived from server-verified records and chain state. |
| Community layer | Discord and Telegram reward worker | Assigns patron role and sends confirmation | Design specified in `attestation-rewards-and-production-deployment.md`; not production-verified until end-to-end tests pass. |

## End-to-end event flow

1. **On-chain immortalization:** a patron invokes `ImmortalizePatron` on the TimeFux Solana program. The transaction signature and slot are the initial event identifiers.
2. **Guardian interception:** Phoenix receives a log notification over WebSocket, deduplicates the signature, fetches the complete transaction over HTTP, and independently checks the program ID, instruction, transaction result, and required event data.
3. **Verified ingestion:** Phoenix sends the verified event to the Eternal Vault ingestion API using service authentication. The API validates the event again and persists it idempotently.
4. **Credential verification:** the portal or backend checks the ⟲144 Token-2022 mint and its NonTransferable extension against on-chain account/mint data. Do not treat a UI badge as proof.
5. **Cross-chain binding:** the patron requests a single-use nonce, signs a domain-separated challenge with the Base wallet, and submits the signature with the Solana patron address. The server checks chain, signer recovery, nonce expiry, replay, and any required ownership proof.
6. **Attestation sealing:** a database transaction records the verified attestation and append-only audit event. Store canonical addresses, chain IDs, transaction references, verification time, and a cryptographic digest of a deterministic record representation.
7. **Reward dispatch:** the same transaction inserts provider reward outbox jobs for trusted, previously linked Discord/Telegram accounts. A worker grants the role and/or sends a confirmation after rechecking the attestation.
8. **Observability:** each stage emits correlated, redacted logs and durable state transitions. Retryable external notification failures do not invalidate the attestation.

## Important implementation qualifications

- A SHA-256 digest detects changes only when the canonical serialization and trusted digest storage are well-defined. It does not by itself make a database immutable. Use append-only permissions, audit controls, backups, and, where required, externally anchored hashes.
- A unique transaction-signature constraint helps prevent duplicate ingestion but does not replace verification of the actual transaction, target program, instruction, network, and success status.
- A database row's existence does not prove an attestation is verified. Require an explicit verified state and validate all relevant fields before downstream actions.
- A bearer-authenticated webhook is not a substitute for signed identity proof. Never trust caller-provided Discord/Telegram IDs as account ownership evidence.
- A Token-2022 badge is not necessarily minted merely because an event was observed. Verify mint/associated token account state and the extension data directly.
- Do not describe the system as decentralized or bridge-free as a blanket guarantee without documenting the actual trust assumptions, RPC dependencies, signer model, and off-chain verifier role.

## Development and release sequence

### Stage 1 — Devnet integration

- [ ] Confirm the TimeFux program ID, deployed cluster, IDL, instruction discriminator, account constraints, and event/log format.
- [ ] Verify Phoenix receives the expected event and fetches the transaction over the HTTP RPC endpoint (not the WebSocket URL).
- [ ] Confirm failed transactions and unrelated program logs are rejected.
- [ ] Confirm durable signature deduplication and safe reprocessing after worker restart.
- [ ] Test the Eternal Vault record API with valid, invalid, duplicate, and stale event payloads.
- [ ] Verify Prisma transaction boundaries and audit record consistency.
- [ ] Test nonce expiry, replay rejection, wrong chain, wrong signer, and Base/Solana mismatch.
- [ ] Test provider reward outbox idempotency and failure/retry behavior.

### Stage 2 — Staging deployment

- [ ] Deploy Next.js application/API to the selected host.
- [ ] Provision PostgreSQL and verify TLS, pooling, backup, restore, and migration procedure.
- [ ] Run Prisma migrations as a controlled deployment step.
- [ ] Deploy Phoenix monitor as a persistent worker with separate HTTP/WSS endpoints.
- [ ] Deploy reward worker separately or as a clearly isolated worker process.
- [ ] Configure environment-specific secrets and rotate credentials.
- [ ] Set health checks, structured logs, alerts, and operational runbooks.
- [ ] Perform a full staging ceremony from chain event through ledger, attestation, and reward delivery.

### Stage 3 — Mainnet readiness

- [ ] Complete code review and security review of wallet verification, webhook authentication, access control, and provider linking.
- [ ] Confirm monitoring, incident response, backup restoration, and key/token rotation procedures.
- [ ] Verify the exact production TimeFux program and Token-2022 mint addresses on mainnet.
- [ ] Verify NonTransferable extension state and mint/freeze authority policy from chain data.
- [ ] Confirm the mainnet database is isolated from Devnet data and all RPC/configuration values match.
- [ ] Obtain explicit release approval before enabling mainnet ingestion or minting.

## Environment configuration baseline

Use the exact variable names expected by the deployed code. This is a planning inventory, not a ready-to-paste production environment file.

| Variable | Purpose | Secret? |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection | Yes |
| `SOLANA_CLUSTER` | Devnet/mainnet selection | No |
| `HELIUS_API_KEY` | RPC provider authentication | Yes |
| `TIMEFUX_PROGRAM_ID` | Program identifier | No |
| `TIMEFUX_MINT` | Token-2022 mint identifier | No |
| `PHOENIX_MONITOR_SECRET` | Phoenix-to-API authentication | Yes |
| `VAULT_WEBHOOK_SECRET` | Optional private webhook authentication | Yes |
| `APP_BASE_URL` | Canonical application URL | No |
| `DISCORD_BOT_TOKEN` | Discord bot authentication | Yes |
| `DISCORD_GUILD_ID` | Target guild | No |
| `DISCORD_PATRON_ROLE_ID` | Patron role | No |
| `TELEGRAM_BOT_TOKEN` | Telegram bot authentication | Yes |

Generate high-entropy secrets with a cryptographically secure generator, keep them in the hosting provider's secret manager, and use distinct values per environment. Do not expose secrets through `NEXT_PUBLIC_*` variables.

## Deployment topology

- Next.js application and API routes: Vercel or another supported Next.js host.
- PostgreSQL: Supabase or Railway; use a serverless-compatible pool for runtime traffic and a direct/session connection where required for migrations.
- Phoenix monitor: persistent container/service on Railway, Render, a VM, or another long-running platform.
- Reward outbox worker: persistent worker or queue consumer with bounded retries and dead-letter handling.
- CI/CD: typecheck, lint, unit/integration tests, Prisma validation/generation, controlled migration, then deployment.

A simple monitor Dockerfile baseline (adapt to the actual package and build scripts):

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
CMD ["npm", "run", "start"]
```

Do not assume that `npx tsc` or `dist/monitor.js` matches the repository's actual build configuration without inspecting it.

## Go-live decision

Mainnet activation is a separate release decision. The architecture is ready for implementation review when the Devnet integration tests pass; it is not production-ready merely because documentation, environment variables, or deployment resources exist. Record the tested commit, test evidence, chain addresses, approvals, and rollback plan in the release record.
