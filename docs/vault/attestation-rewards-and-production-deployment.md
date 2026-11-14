# Eternal Vault: Attestation Rewards and Production Deployment

Status: implementation specification; not a claim that the webhook, integrations, or production deployment have been tested.

## Objective

After a Base-to-Solana identity attestation has been independently verified and durably stored, grant the linked Discord member the **Eternal Vault Patron** role and/or send a Telegram confirmation. The reward workflow must not be able to create, alter, or upgrade an attestation. The database remains the authority for identity and verification state.

## Trust boundaries and required invariants

1. Only the server-side attestation verifier may mark an attestation verified. Never accept `verified`, a Base address, a Solana address, a Discord user ID, or a Telegram chat ID as proof merely because a browser supplied it.
2. Before any reward is issued, load the attestation by its canonical Solana patron key and verify its explicit verified status, canonical Base address, verification timestamp, and any required chain/network fields. A row's existence alone is not proof.
3. Link Discord and Telegram identities through an authenticated account-linking flow. Persist the resulting provider identity on the patron/account record. A caller must not choose an arbitrary Discord member or Telegram chat at reward time.
4. Make reward processing idempotent. A unique database key per attestation/provider/action prevents duplicate delivery attempts from creating duplicate work. External API calls are at-least-once in practice; record attempts and reconcile failures.
5. Never expose bot tokens, webhook secrets, RPC credentials, or database URLs to client bundles. Do not prefix secrets with `NEXT_PUBLIC_`.
6. Do not claim a Discord role was granted or a Telegram message was delivered unless the corresponding provider API confirms success.
7. A reward failure must not roll back a valid attestation. Persist an outbox job in the same database transaction as the verified attestation, then process it asynchronously with retries.

## Suggested data model

Adapt names to the existing Prisma schema rather than creating duplicate identity tables.

- `IdentityAttestation`: canonical `solanaPatron`, canonical `baseAddress`, `status` (for example `PENDING` / `VERIFIED` / `REVOKED`), `verifiedAt`, network/chain identifiers, and unique transaction or attestation identifiers.
- `PatronAccountLink`: patron/account relation plus nullable `discordUserId` and `telegramChatId`; provider IDs must be obtained through authenticated OAuth/bot-linking flows and have appropriate uniqueness constraints.
- `RewardOutbox`: `id`, `attestationId`, `provider`, `action`, `status`, `attempts`, `nextAttemptAt`, `lastError`, `createdAt`, `updatedAt`. Add a unique constraint on `(attestationId, provider, action)`.
- `RewardDelivery` (optional): append-only attempt/result history with provider response status and timestamps. Avoid storing bot tokens or unnecessary message contents.

## Recommended event flow

1. The attestation API validates the signed challenge, signer, nonce, expiration, replay protection, and chain/address formats.
2. In one database transaction, it writes the verified attestation and inserts outbox jobs for the providers that have already been linked and opted in.
3. A background worker claims due jobs using a safe concurrency strategy (for PostgreSQL, row locking such as `FOR UPDATE SKIP LOCKED` is appropriate).
4. Before dispatch, the worker re-reads the attestation and confirms it remains `VERIFIED`, and resolves the provider ID from the trusted account-link record.
5. It calls Discord or Telegram, records the provider response, and marks the job complete. Retry transient failures with bounded exponential backoff and jitter; dead-letter permanent failures and alert operators.
6. If an attestation is revoked, cancel pending jobs and define a separate, explicit policy for removing any previously granted Discord role. Do not silently infer revocation behavior.

Prefer invoking a shared server-side service/outbox insertion function directly from the attestation completion transaction. Do not make an HTTP request from the server to its own public `NEXT_PUBLIC_APP_URL` endpoint just to trigger the reward. If an HTTP boundary is operationally necessary, use a private authenticated endpoint with timestamped signatures, replay protection, strict payload validation, and the same idempotency key.

## Provider operations

### Discord

- Use Discord API v10 with a bot token stored as `DISCORD_BOT_TOKEN`.
- Configure `DISCORD_GUILD_ID` and `DISCORD_PATRON_ROLE_ID` server-side.
- The bot must be installed in the target guild and have the **Manage Roles** permission. Its highest role must be above the patron role in the server role hierarchy.
- Grant a role using the guild-member role endpoint with `PUT /guilds/{guild.id}/members/{user.id}/roles/{role.id}`. Treat HTTP 204 as success; log structured, redacted failure details otherwise.
- Verify the linked Discord user belongs to the intended guild before attempting the grant. Do not let the webhook payload select arbitrary guild or role IDs.
- Consider rate limits and retry-after responses. Do not retry permanent authorization, missing-member, or configuration errors indefinitely.

### Telegram

- Store `TELEGRAM_BOT_TOKEN` server-side. Use the chat ID obtained from a verified bot interaction/account-link flow, not an arbitrary browser field.
- Send through Telegram Bot API `sendMessage`. Prefer plain text unless MarkdownV2 escaping is implemented correctly; user-controlled values must be escaped or omitted.
- A successful HTTP response is not enough by itself: inspect the JSON `ok` field and record the returned message identifier.
- The user must have initiated the bot conversation before the bot can send them a private message. Handle blocked bots and invalid chat IDs as actionable delivery failures.

## Internal service contract

The reward worker should consume an internal typed job, not a public request that trusts identity fields:

```ts
type AttestationRewardJob = {
  attestationId: string;
  provider: "DISCORD" | "TELEGRAM";
  idempotencyKey: string; // unique per attestation/provider/action
};
```

At execution time, resolve all patron, chain, Base address, Discord, and Telegram details from verified database rows. Validate address formats using chain-aware parsers before comparing canonical forms. Do not use string slicing as address validation.

## If an authenticated HTTP webhook is retained

- Require a high-entropy `VAULT_WEBHOOK_SECRET` (at least 32 random bytes) and compare credentials safely; reject missing configuration at startup.
- Validate JSON with a strict schema, size limits, content type, and bounded string lengths.
- Authenticate the sender, include a timestamp and unique event ID, reject stale timestamps, and persist processed event IDs to prevent replay.
- Apply rate limits and request logging with secrets and personal data redacted.
- Re-read and verify the attestation from the database on every invocation. A correct bearer token does not make caller-supplied identity values authoritative.
- Return 401 for failed authentication, 400 for malformed input, 404/409 for missing or non-verified/mismatched attestation as appropriate, and 202 when durable work has been queued. Return 200 only for a synchronous operation that has actually completed.
- Never return raw exception messages or provider response bodies to clients. Return a correlation ID and log sanitized diagnostics server-side.

## Environment variables

Configure only those used by the deployed service:

```dotenv
DATABASE_URL=
SOLANA_CLUSTER=devnet
HELIUS_API_KEY=
TIMEFUX_PROGRAM_ID=TiMeFUXyR9nTgmiiQgx3wH2qzoyMiY5G4seySXMA9pP
PHOENIX_MONITOR_SECRET=
VAULT_WEBHOOK_SECRET=
APP_BASE_URL=https://lostlegacies.live
DISCORD_BOT_TOKEN=
DISCORD_GUILD_ID=
DISCORD_PATRON_ROLE_ID=
TELEGRAM_BOT_TOKEN=
```

Use a separate environment and distinct secrets for development, staging, and production. `APP_BASE_URL` is not secret, but it does not need a `NEXT_PUBLIC_` prefix unless browser code genuinely consumes it. Keep the Solana cluster and program/mint identifiers aligned with the actual deployment; do not switch to mainnet until the cutover gates below pass.

## Deployment topology

- **Next.js application/API:** Vercel is a suitable hosting option for the web application and request/response API routes.
- **PostgreSQL:** Supabase or Railway can host PostgreSQL. Use the connection mode recommended for the runtime (pooled URL for serverless application traffic; direct/session connection for migrations when required by the provider).
- **Phoenix monitor:** run as a persistent worker/container on Railway, Render, or another long-running host. A serverless function is not a substitute for a continuously running WebSocket listener.
- **Reward outbox worker:** run as a persistent worker or scheduled queue consumer. Keep it separate from the Phoenix chain monitor unless there is a deliberate operational reason to combine them.
- **Secrets:** configure secrets in each hosting provider's secret manager. Never commit production `.env` files.
- **Migrations:** run `prisma migrate deploy` as a controlled release step, not as an incidental side effect of every build. Generate Prisma Client during build/install as appropriate.

## Phoenix monitor container baseline

Use a supported Node.js LTS version and a reproducible lockfile. The following is a starting point; adapt paths and build scripts to the actual monitor package:

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
CMD ["npm", "run", "start"]
```

The monitor must use separate HTTP and WebSocket RPC endpoints, verify fetched transactions before ingestion, deduplicate signatures durably (not only in process memory), reconnect with bounded backoff, and expose a health/heartbeat signal. Its ingestion endpoint must authenticate the monitor and independently validate the event.

## CI, test, and production cutover gates

### Before staging

- [ ] Confirm the Prisma schema contains the required attestation status and trusted provider-link fields.
- [ ] Test invalid signatures, wrong signer, expired nonce, nonce replay, wrong chain, malformed addresses, and Base/Solana mismatch.
- [ ] Test duplicate webhook/event delivery and duplicate outbox insertion.
- [ ] Test reward dispatch when Discord/Telegram is unavailable, rate-limited, misconfigured, or returns a permanent error.
- [ ] Test concurrent workers cannot process the same pending job simultaneously.
- [ ] Test that an attestation failure creates no reward job and a reward failure does not undo a verified attestation.
- [ ] Verify secrets are absent from browser bundles, logs, source control, and error responses.
- [ ] Verify Discord role hierarchy/permissions and Telegram bot initiation requirements in a test environment.

### Before mainnet

- [ ] Complete a live Devnet end-to-end test with a real test patron, verified attestation, durable audit event, and provider delivery.
- [ ] Confirm transaction finality and independently fetched on-chain instruction/program identity.
- [ ] Review database backups, restore procedure, migration rollback plan, monitoring, alerting, and incident response.
- [ ] Rotate all credentials that may have appeared in local files, logs, screenshots, or shared messages.
- [ ] Confirm the Token-2022 NonTransferable extension and mint-authority state directly from chain data; do not infer these from application records.
- [ ] Obtain an explicit operational sign-off before changing `SOLANA_CLUSTER` to mainnet.

## Operational acceptance criteria

The feature is ready only when a verified attestation reliably creates one durable reward job per linked provider, unauthorized or replayed requests cannot trigger rewards, retries are observable, provider failures are recoverable, and audit records explain each outcome. This document is a design and implementation checklist; it does not certify that these criteria have been met.
