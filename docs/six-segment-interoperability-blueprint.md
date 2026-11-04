# Six-Segment Interoperability Blueprint

**Status:** Proposed consolidation baseline  
**Working branch:** `codex/six-segment-interoperability`  
**Spine repository:** `JUSCR-FreeForAll/archonfractureback`  
**Canonical repository:** `JUSCR-FreeForAll/JUSCR-FreForAll`  
**Legacy archive:** `JUSCR-FreeForAll/JusticeWithinUs`

## 1. Governing architecture

Use the six segments as the user-facing product taxonomy:

1. **Home** — application shell, identity entry, workspace routing, and global notifications.
2. **Connect** — peer communication, Nostr adapters, relay status, and two4eachofu.
3. **Learn** — JUSCR School, documentation, guides, tutorials, and knowledge graphs.
4. **Create & Play** — Five Realms, Karen Quest, Pheonix Flies, and other interactive experiences.
5. **Trust** — consent, identity verification, key protection, recovery, and Phoenix Ward.
6. **Library** — canonical schemas, JSON-LD contexts, shared assets, and semantic indexing.

The six segments are a navigation and domain boundary, not six separate backends. The JUSCR Spine API remains the shared policy and verification service. The canonical JUSCR repository owns canon and product intent; the archive remains source material until reviewed and explicitly migrated.

## 2. Repository and runtime boundaries

| Layer | Canonical home | Responsibility |
| --- | --- | --- |
| Product canon and ecosystem index | `JUSCR-FreeForAll/JUSCR-FreForAll` | Protocol definitions, curriculum, portal, commons, and mobile product intent |
| Backend spine | `JUSCR-FreeForAll/archonfractureback` | Fastify API, consent enforcement, provenance, audit, verification |
| Legacy source archive | `JUSCR-FreeForAll/JusticeWithinUs` | Historical Ouroboros/Phoenix, auction, and Reality Reclamation source material |
| Replit prototypes/deployments | Existing Replit workspace/apps | Preview and deployment surface; not the code source of truth |
| Independent licensed service | `buzz` repository / separately deployed service, pending license verification | Keep separate from the primary application until license and API boundary are reviewed |

GitHub is canonical for code and reviewed documentation. Replit is a prototype/deployment surface. Do not assume that a published URL, native mobile build, or production backend exists merely because a project name or prototype is present.

## 3. Project-to-segment map

| Project / module | Segment | Web experience | Mobile experience | Backend / data boundary | Current evidence and next action |
| --- | --- | --- | --- | --- | --- |
| JUSCR Unified Living Ecosystem / central portal | Home | Mobile-first launcher and segment navigation | Responsive web/PWA baseline; native shell is a later decision | JUSCR Spine API for identity/session policy; local UI preferences stay client-side | Intended umbrella shell; confirm canonical repo and actual Replit app before changing it |
| two4eachofu / 2foreachofu | Connect | Isolated Connect route and messaging UI | Responsive web/PWA; native packaging only after capability review | Nostr/relay adapters plus Spine audit/consent boundary | Named project in prior consolidation scope; import and runtime status need verification |
| JUSCR School / JustUsScoolCocreatingReality | Learn | Curriculum, lessons, guides, learning records | Responsive learning surface; native app not yet established | Canon curriculum + Spine provenance/consent contract | Canon repository already identifies JUSCR School as a first mobile slice; map the named project to this protocol after source review |
| Five Realms | Create & Play | Isolated game route | Responsive/PWA first; native only if device capabilities require it | Local-first game state; Spine accepts validated event/audit deltas | Listed in the supplied architecture; source repository and deployment remain to be inventoried |
| Karen Quest / karenkualitykontrol | Create & Play | Standalone prototype integrated under a namespaced route or isolated origin | No native app currently confirmed; responsive web first | Namespaced local state; Spine for consented audit events | Replit app found; prior review indicates a web prototype without a published URL/native app |
| Pheonix Flies / PhoenixflyLive | Create & Play | Existing published web experience to be linked or imported after source review | Separate native mobile companion previously identified; verify its current build and ownership | Experience-specific state isolated from shared consent/audit policy | Replit app found; preserve spelling variants as aliases until canonical product naming is decided |
| Phoenix Ward | Trust | Recovery and verification workflows | First mobile-slice candidate; mobile UX must use the same Spine contracts | Spine consent, provenance, audit, and verification | Existing ecosystem documentation names it as a first mobile slice; do not duplicate policy in clients |
| TimeAuction / All Time Contract | Connect or Home entry; domain ownership pending | Auction/contract workflow behind a dedicated route | Later mobile phase after API and consent review | Archive research is source material; move domain logic behind reviewed Spine contract | Named in prior scope and legacy archive; canonical segment is provisional |
| Buzz | Connect / external integration | Separate origin or independently deployed service | Embedded web experience only where supported | Independent service boundary; no direct shared database access | Blueprint proposes Apache 2.0; verify actual LICENSE and dependency graph before relying on that classification |
| archonfractureback | Shared backend, not a user segment | API and operational dashboard | API consumed by all authorized clients | Fastify + PostgreSQL migration path, consent and audit enforcement | Existing README describes the JUSCR Mesh spine and current in-memory demo runtime; production persistence still needs verification |

**Naming rule:** Preserve source spellings such as `Pheonix Flies`, `PhoenixflyLive`, `Phoenix Ward`, `two4eachofu`, and `2foreachofu` as aliases in the inventory. Do not silently rename repositories, routes, or deployed apps.

## 4. Client state and synchronization contract

Adopt local-first behavior for suitable client experiences:

- The client writes user-owned state locally first, using IndexedDB for structured/offline data and localStorage only for small preferences.
- Every key is namespaced as `juscr:<segment>:<module>:<key>`.
- Local state mutations append an ordered event/delta with a stable event ID, actor/session reference, schema version, and provenance.
- The client sends only the minimum event/delta required for policy validation and audit; it does not upload a full local database snapshot by default.
- The Spine validates the event against a versioned schema, enforces consent and domain policy, persists an audit record, and returns an acknowledgement.
- A returned digest is a verification receipt for the accepted event. It is not, by itself, proof that two devices have converged or that a complete distributed conflict-resolution protocol exists.
- Offline events remain queued locally and are replayed idempotently. Conflicts require explicit per-domain merge rules; never silently overwrite user data.

Suggested namespaces:

- `juscr:create:five_realms:player_inventory`
- `juscr:create:karen_quest:user_prefs`
- `juscr:connect:two4eachofu:conversation_cache`
- `juscr:trust:phoenix_ward:recovery_state`

The server remains the authority for consent, provenance, authorization, and audit policy. Clients remain the authority for private local drafts and offline state unless a user explicitly consents to synchronization.

## 5. Shared event and schema contract

Use a versioned event envelope aligned with CloudEvents concepts and JSON-LD contexts. At minimum, each accepted cross-module event must carry:

- stable event ID and event type;
- source module and segment;
- actor/session reference;
- occurrence time;
- schema version and JSON-LD context URI;
- provenance and consent reference;
- protocol and outcome;
- non-destructive lifecycle status;
- payload or minimized state delta;
- idempotency key.

The existing ecosystem contract requires `id`, `provenance`, `consent`, `protocol`, `outcome`, `status`, and `mobileSurface`. Keep those fields compatible while adding event-envelope metadata.

Use SHA-256 only over a deterministic canonical representation with a documented canonicalization method and version. Do not treat a timestamp concatenated to arbitrary JSON serialization as a stable canonical hash. The event digest must bind the event identity and accepted payload; signing and key custody require a separately reviewed Trust design.

Fastify route schemas should be precompiled where supported. Pino structured logs should record operational metadata without leaking secrets, raw private keys, or sensitive payloads. Throughput claims such as 90,000 requests/second are unverified and must not become acceptance criteria without reproducible benchmarks on the target deployment.

## 6. Deployment, routing, and licensing boundaries

- Use a single mobile-first shell with stable segment routes: `/`, `/connect/*`, `/learn/*`, `/create/*`, `/trust/*`, and `/library/*`.
- Each imported app owns a namespaced route, storage namespace, event namespace, and scoped listeners.
- Use same-origin module integration only when code ownership, dependency licensing, and runtime coupling have been reviewed.
- Use a separate origin and narrow `postMessage` contract for independently licensed or operationally isolated modules. Validate exact target origins and message schemas.
- A cross-origin iframe or Web Worker is a technical isolation mechanism, not an automatic legal safe harbor. Verify actual licenses, notices, linking model, deployment model, and counsel's interpretation before making copyleft conclusions.
- Keep secrets on server-side services. Never place private keys, signing secrets, or privileged database credentials in browser bundles.

## 7. Staged migration

### Stage 1 — foundation and inventory
- Confirm the canonical app shell and repository ownership.
- Inventory all ten workspace projects, source repositories, licenses, current deployment URLs, build systems, and mobile artifacts.
- Treat the existing Fastify Spine API and PostgreSQL migration path as the baseline backend.
- Reconcile Supabase, Redis, Solana, and Glide from the earlier Phase 1 roadmap as optional/conditional integrations; do not introduce them until a concrete requirement and data ownership decision is approved.
- Define segment route contracts, shared identity/session semantics, event envelope, and schema registry.

**Gate:** repository map and runtime inventory reviewed; no project is overwritten or merged blindly.

### Stage 2a — non-stateful content
- Integrate Learn and Library documentation, static guides, schemas, and assets.
- Establish route and content-security policies.
- Register versioned schema and JSON-LD context references.
- Confirm read-only behavior and zero unexpected storage writes.

**Gate:** no route collisions; no unexpected client-state mutations; schema references resolve.

### Stage 2b — stateful applications
- Import Five Realms, Karen Quest, Pheonix Flies, and two4eachofu one at a time.
- Namespace every storage key and route.
- Scope event listeners and isolate global state.
- Add offline queue, idempotent replay, event validation, and per-domain conflict tests.

**Gate:** storage isolation passes; audit events validate; offline replay and conflict behavior are tested.

### Stage 3 — connected trust services
- Integrate Nostr relays and peer connectivity.
- Integrate Phoenix Ward and Trust workflows.
- Verify key custody, recovery, consent revocation, and cross-origin message contracts.
- Keep TimeAuction behind a reviewed API and consent boundary until its domain contract is approved.

**Gate:** security review and cross-origin tests pass; no client duplicates server policy.

### Stage 4 — system verification
- Run end-to-end tests across all six segments.
- Verify provenance, consent, idempotency, audit traceability, offline recovery, accessibility, and mobile layouts.
- Scan dependency trees and build artifacts for license and secret leakage.
- Benchmark the actual deployment; publish measured results and limits.
- Promote modules only after review and a rollback plan.

**Gate:** documented evidence for functional, security, licensing, privacy, and deployment acceptance.

## 8. Decisions still requiring evidence

1. Confirm the exact Replit app IDs and GitHub source repositories for all ten workspace projects.
2. Verify which projects have live web deployments and which have native iOS/Android builds.
3. Inspect actual LICENSE files and transitive dependencies for every module, especially Buzz and the Spine.
4. Decide whether Supabase is needed alongside the existing PostgreSQL-backed Spine, rather than creating two competing sources of truth.
5. Decide whether Redis is required for idempotency/queues and whether Solana is in scope for the current release.
6. Define the canonical name and segment ownership for TimeAuction and the Phoenix Flies naming variants.
7. Replace any inferred static-site assumptions with direct source inspection.

## 9. Non-goals for this branch

This branch creates the reviewed architecture and migration plan. It does not merge repositories, change production deployments, migrate user data, rotate keys, publish apps, or claim that unverified mobile/backend components already exist.
