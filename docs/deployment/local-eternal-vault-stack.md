# Local Eternal Vault + Phoenix development stack

## Files added

- `docker-compose.override.yaml`: PostgreSQL, Next.js `vault-api`, and `phoenix-monitor`.
- `prisma/seed.ts`: destructive development-only fixtures.
- `scripts/mint-soulbound-badge.ts`: guarded Token-2022 mint helper.
- `scripts/check-phoenix.sh`: SSH container diagnostics and log tail.

## Start locally

Confirm compatible root `Dockerfile`, `monitor/Dockerfile`, and base Compose configuration exist. Put `HELIUS_API_KEY` in an untracked root `.env` file, then run:

```bash
docker compose up --build -d
docker compose ps
docker compose logs -f
npx prisma db push
```

Seed only a disposable local database with `npx prisma db seed`. Stop with `docker compose down`; `docker compose down -v` deletes the database volume and its contents.

## Safety

- This is local development configuration, not production deployment configuration. Default credentials/secrets are placeholders; do not reuse them in production or expose PostgreSQL publicly.
- The seed refuses to run with `NODE_ENV=production`, but deletes existing vault records, attestations, nonces, and audit events before inserting fixtures.
- Seeded addresses, transaction signatures, mint values, token accounts, and EIP-191 signature are synthetic placeholders, not valid on-chain evidence. Never use them to authorize roles, attestations, or mints.
- Compose startup does not prove API readiness, migration success, or Solana subscription correctness.

## Token-2022 mint helper

Set `HELIUS_RPC_URL` (optional), `NEXT_PUBLIC_SOULBOUND_MINT`, and `MINT_AUTHORITY_SECRET`. Run:

```bash
npx tsx scripts/mint-soulbound-badge.ts <PATRON_WALLET_PUBKEY>
```

The configured mint must already be a zero-decimal Token-2022 mint with the NonTransferable extension, and the signer must be its mint authority. The helper checks those conditions, derives the recipient ATA, refuses a duplicate mint when the ATA already holds tokens, then submits one unit. It does not create or retrofit the mint. Use Devnet first and keep authority secrets out of source control.

## Remote diagnostics

```bash
chmod +x scripts/check-phoenix.sh
VPS_HOST=your-vps.example VPS_USER=deploy VPS_SSH_KEY=~/.ssh/id_ed25519 COMPOSE_DIR=/opt/phoenix ./scripts/check-phoenix.sh
```

Defaults expect container `eternal-vault-phoenix-local` and Compose service `phoenix-monitor`. Override `CONTAINER_NAME` and `COMPOSE_SERVICE` for a different VPS naming convention. The script reports running state, CPU/memory, Docker health when configured, restart count, and start time, then follows Compose service logs.

## Validation outstanding

- Confirm Dockerfiles and base Compose configuration exist and build.
- Verify Vault API database connectivity and Prisma schema compatibility.
- Verify monitor-to-API networking and matching authentication secrets.
- Verify Helius Devnet subscription and independent Solana transaction validation.
- Verify the badge mint extension, decimals, and authority.
- Confirm development fixtures cannot enter production workflows.

This commit adds source files and instructions only. It does not run Docker, Prisma migrations, Devnet transactions, or a VPS health check.
