# JUSCR Mesh

Open Resonance Mesh and Consent-Ledger runtime for the JUSCR specification.

## What is included

- Formal protocol specification
- OpenAPI contract
- Relational schema for loops, intentions, consent, scaffolds, and audits
- Hardened TypeScript runtime with consent validation and loop health logic
- Fastify API server
- Dashboard prototype wired for `/loops` and `/loops/:id/clarity`
- Docker Compose setup for PostgreSQL + API
- Unit tests
- Governance and threat-model documentation
- Cross-repository ecosystem manifest and integration boundary

## Ecosystem role

This repository is the **JUSCR Spine API and verification service**. It owns runtime consent enforcement, provenance-aware audit behavior, and verification boundaries. It does not replace the canon repository or absorb the legacy archive.

See [`ECOSYSTEM.md`](ECOSYSTEM.md) and [`ecosystem/manifest.json`](ecosystem/manifest.json) for the repository map, shared contract, and staged mobile boundary.

## Quick start

```bash
npm install
cp .env.example .env
npm run dev
```

Then open the dashboard at `dashboard/index.html` or hit the API at `http://localhost:3000`.

## Docker

```bash
docker compose up --build
```

## Scripts

- `npm run dev` — run API in dev mode
- `npm run build` — compile TypeScript
- `npm run start` — run compiled production bundle
- `npm test` — run Vitest suite

## Security notes

- All consent tokens are time-bound and revocable.
- All intention vectors are validated for format and expiry.
- Mutual consent is enforced before a resource path may be treated as valid.
- The server uses in-memory storage for the demo runtime; swap with PostgreSQL-backed persistence for production.


## Lost Legacies Live Time Engine (bounded prototype)

- `src/time-model.ts` — versioned 1–10 counted-imagination / radix model.
- `src/time-engine-store.ts` — PostgreSQL transaction lock and idempotency helpers.
- `src/time-bridge.ts` — consent-gated encrypted internal layer-signal outbox.
- `db/migrations/002_time_engine.sql` — private-first Secret Room and Time Engine tables.
- `dashboard/secret-room.html` — local-only UI prototype; test drafts are held in tab memory and exported, not persisted or transmitted.
- `docs/time/time-engine-implementation.md` — model interpretation, boundaries, and activation gates.

Apply `db/schema.sql` before `db/migrations/002_time_engine.sql`. The new module is not exposed through public API routes until authenticated participant identity and encryption-key management are implemented and reviewed.
