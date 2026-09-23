# JUSCR ecosystem integration

This repository is the **JUSCR Mesh spine**: the API, consent boundary, audit logic, and verification service. It is not the canonical home for the full JUSCR canon and it does not duplicate the legacy archive.

## Repository map

| Repository | Role | Integration boundary |
| --- | --- | --- |
| [`JUSCR-FreForAll`](https://github.com/JUSCR-FreeForAll/JUSCR-FreForAll) | Canon and ecosystem index | Protocol definitions, curriculum, portal, commons, and mobile product intent |
| [`archonfractureback`](https://github.com/JUSCR-FreeForAll/archonfractureback) | JUSCR Spine API | Consent, provenance, audit, verification, and domain enforcement |
| [`JusticeWithinUs`](https://github.com/JUSCR-FreeForAll/JusticeWithinUs) | Legacy source archive | Ouroboros/Phoenix design material, auction research, and historical source documents |

The machine-readable contract is [`ecosystem/manifest.json`](ecosystem/manifest.json). Update that manifest when a repository role, protocol, mobile surface, or delivery phase changes.

## Shared contract

Every cross-repository entity or event must carry:

- `id` — stable identifier;
- `provenance` — where the material came from and who supplied it;
- `consent` — explicit, scoped, revocable permission state;
- `protocol` — the JUSCR protocol that owns the operation;
- `outcome` — one or more of `wealth`, `home`, or `healing`;
- `status` — a non-destructive lifecycle state;
- `mobileSurface` — the client surface that may present or mutate it.

The system must never hard-delete a ledger entity. Contested, abandoned, and reactivated states are recorded transitions, not destructive replacements. Mobile clients must use the Spine API for these rules instead of implementing a second policy engine.

## First mobile slice

The first product boundary is deliberately small:

1. **Void Ledger** — consented people, relationships, provenance, and auditable state transitions.
2. **Phoenix Ward** — resilient recovery and verification workflows backed by the consent and audit boundary.
3. **JUSCR School** — curriculum and learning actions connected to the same provenance and outcome contract.

Time Auction, Reality Reclamation, and the traveling musical/quest experiences remain later delivery phases until their API contracts and consent flows are separately reviewed.

## Current implementation status

This repository already provides a Fastify TypeScript runtime, PostgreSQL migration path, dashboard prototype, consent validation, audit-oriented schema, and a fail-closed zero-knowledge verification boundary. See [`README.md`](README.md) for local development and [`zk/README.md`](zk/README.md) for verifier prerequisites.

This manifest does **not** claim that a mobile client, Replit deployment, or `ecosystem-sync` package exists. Those are follow-on deliverables and must be built from the reviewed contracts above.

## Development principles

- GitHub is canonical for code and reviewed documentation.
- Replit is a deployment/prototyping surface, not a source of truth.
- Meta is a discovery/community surface, not a persistence layer.
- Copilot may assist implementation, but every feature must map to a protocol, outcome, provenance record, and consent boundary.
- Legacy documents are imported as source material only until their ownership, schema, and runtime boundary are reviewed.
