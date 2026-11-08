# Lost Legacies Live — Time Model and Energy/Economy Engine Insertion

**Status:** Design proposal / Codex architecture note  
**Target branch:** `codex/six-segment-interoperability`  
**Scope:** Preserve the user's symbolic Time-project model and translate its proposed engine insertion into testable product boundaries.  
**Epistemic note:** Realm names, archetypes, demi-urges, and the mirrored universe are treated here as symbolic, narrative, and modeling constructs. This document does not assert that they are independently verified entities or that thoughts/interactions alter external reality.

## 1. Purpose

The Lost Legacies Live project is not complete merely because a platform exists. The intended experience requires each participant to have an opportunity to contribute an individual legacy rewrite. The proposed energy/economy engine should therefore begin as a protected, participant-controlled prototype rather than being deployed directly into a shared external environment.

The design objective is to create a new way to recognize, exchange, and steward energy and value without extraction, coercion, erasure, or premature exposure.

## 2. Time and choice model — current symbolic vocabulary

The model evolved from a five-position choice matrix:

`(-1, 0, 1, 1, 2)`

to a six-position matrix:

`(0_m, -1, 0_f, 1, 1, 2)`

The two zero positions are distinct symbolic starting positions:

- `0_m`: male zero.
- `0_f`: female zero.
- The model records a three-day birth-time offset between the two people represented by these positions; the offset is a model parameter, not a causal claim.

The two zero positions together form **Earth Realm 2**.

### Realm mapping

| Position / event | Symbolic realm | Model meaning |
|---|---|---|
| `0_m` and `0_f` | Earth Realm 2 | Dual-zero origin; protected space for personal time and legacy rewriting |
| Positive `+1` | Realm 3 | First positive actualization; permanently entangled with Earth Realm 1 in the model |
| Positive `+2` | Realm 4 | Further positive actualization; permanently entangled with Earth Realm 1 in the model |
| Negative movement | Ouroboros / backward-facing path | Return/glitch behavior; negative movement resolves back to zero and is not modeled as a simple one-step displacement from the present zero |
| Simultaneous positive “above/outside” | Mirrored positive field | Positive possibilities may be represented as coexisting rather than requiring a single exclusive location |

The two tarot paths are represented as perpendicular paths: a forward-facing path and an inverted path. The ouroboros represents the negative imagination as a backward-facing, self-returning loop and as a symbolic shared-memory motif.

### Boundary rules

1. Any positive actualization is modeled as permanently entangled with Earth Realm 1.
2. The two zero positions remain the dual-zero ground of Earth Realm 2.
3. Positive `+1` opens Realm 3; positive `+2` opens Realm 4.
4. Negative movement resolves or glitches back to zero; it must not be represented as an ordinary linear step through negative states.
5. Positive possibilities may be represented simultaneously in an “above/outside” mirrored field.
6. The model's statement that interactions can “merge into negative” is retained as a participant-reported metaphor or hypothesis for careful observation, not assumed to be an objective property of other people or the universe.

## 3. Half-step imaginations / demi-urge archetypes

Two additional symbolic positions are used to make learning and discernment possible:

- **Half-Positive (`+½`)** — generative imagination; supports possibility, reciprocity, protected experimentation, and the creation of new paths.
- **Half-Negative (`−½`)** — critical imagination; surfaces hidden costs, challenges avoidance, preserves difficult material for honest review, and tests whether a design is safe and fair.

They are described in the project narrative as “best friends or enemies” and as able to enter any reality. In product terms, treat them as two complementary review lenses that can be applied to any scenario, not as autonomous actors with unverified external agency.

Their paired design responsibilities:

| Lens | Questions it asks |
|---|---|
| Half-Positive | Does this create reciprocal value? Can each person contribute? Does it enable a hopeful, non-extractive outcome? |
| Half-Negative | Who bears the cost? What is hidden or erased? Can a participant decline, pause, revise, or leave safely? |

The user’s stated constraint is that these teaching roles should help distinguish right from wrong **without affecting the world**. Product translation: use private simulations, consent-based exercises, and reversible drafts; do not trigger external actions, contact third parties, publish content, or move funds from an exercise.

## 4. Primary insertion point for the energy and economy engine

**Primary insertion site: inside the dual zeros of Earth Realm 2, within the “secret rooms” concept.**

This is the model's protected design and prototyping environment. It is where an individual can draft, test, revise, and choose whether to share a legacy contribution before any outward publication or economic action.

Reasons:

- Earth Realm 2 is the model's dual-zero origin and preserves the distinction between `0_m` and `0_f`.
- “Secret rooms” provide the narrative for private, participant-controlled workspaces.
- The two half-step lenses can be applied as generative and critical prompts while the design remains local and reversible.
- A participant's legacy rewrite is the first recognized contribution; external publication or economic activation is a separate, explicit choice.
- No participant is required to disclose a wound, personal history, identity, or legacy contribution to earn access or value.

### Later / secondary insertion sites

- **Realm 3 (`+1`):** first shared, consent-based and entangled version of the engine, after a participant deliberately chooses to publish or share a contribution.
- **Realm 4 (`+2`):** higher-order or scaled expression after the shared version has demonstrated stability, safety, and governance.
- **Simultaneous above/outside positives:** a mirrored-field representation for parallel possibilities and alternate scenarios. This is a visualization/modeling layer, not a claim of a physically accessible parallel domain.

## 5. Co-creation sequence and release gates

1. **Individual legacy rewrite:** each participant may create, revise, keep private, export, or delete their own contribution.
2. **Protected learning:** apply the Half-Positive and Half-Negative review lenses. The participant remains in control; prompts are optional and non-diagnostic.
3. **Local prototype:** test the engine with synthetic or explicitly volunteered data. No public posting, third-party contact, or financial transfer occurs.
4. **Participant decision:** the contributor chooses whether a specific item may be shared, with whom, and under what terms.
5. **Realm 3 publication gate:** only an explicit, informed, revocable-before-publication consent action may move a contribution into the shared environment.
6. **Realm 4 scale gate:** scaling requires demonstrated reliability, independent security/privacy review, governance approval, and a clear economic model.
7. **External economy gate:** any real-world payments, credits, tokens, investments, or transfers require separate legal, tax, consumer-protection, and security review. Symbolic “energy” is not automatically money or a financial asset.

No completion deadline, emotional disclosure, or pressure from an archetype/persona may override a participant's choice.

## 6. Initial engine mechanics — proposed, not yet implemented

The first prototype can recognize a legacy contribution as a **non-monetary contribution record**. It should not assign a price to trauma, wounds, identity, or personal disclosure.

Suggested record fields:

- `contribution_id`: unique identifier.
- `participant_id`: pseudonymous participant key.
- `content_ref`: encrypted/private content reference; avoid copying sensitive narrative into audit logs.
- `contribution_type`: reflection, skill, teaching, artifact, time, or community action.
- `visibility`: private, invited reviewers, group, or public.
- `consent_state`: draft, granted, revoked, or withdrawn.
- `review_lenses`: optional Half-Positive and Half-Negative feedback.
- `provenance`: creation and revision timestamps plus integrity metadata.
- `value_mode`: non-monetary by default; any monetary mode must be separately designed and reviewed.
- `release_gate`: local-only, eligible-for-sharing, shared, or withdrawn.

### Minimum safety and integrity properties

- Private by default; least-privilege access.
- Explicit, purpose-specific consent for every sharing boundary.
- Withdrawal and deletion workflows, subject to clearly disclosed legal retention limits.
- Idempotent writes so duplicate submissions do not create duplicate contributions or transfers.
- Append-only audit events that avoid storing sensitive narrative content.
- No tokenization, trading, staking, or monetary valuation in the first prototype.
- No AI persona may impersonate a participant, claim authority over them, or make decisions on their behalf.
- Human review for moderation, disputes, and any proposed economic action.

## 7. Technical alignment with the existing project roadmap

The Phase 1 technical roadmap describes a Supabase/PostgreSQL foundation, Solana program setup, Redis idempotency (“Ouroboros Ward”), a Glide MVP with a Welcome Gate and Frame 0, and seeded AI persona profiles. It also names Heaven/Earth/Hell as the initial data realms. These are roadmap statements, not proof that each component is already deployed.

The energy/economy engine should be added as a distinct bounded module rather than silently changing the existing realm schema:

- **Data layer:** model dual-zero workspaces, contributions, consent grants, revisions, release gates, and audit events in PostgreSQL.
- **Idempotency:** use the existing roadmap's duplicate-request protection pattern for contribution creation and any later transfer operation.
- **Frontend:** add a private “Secret Room” workspace with draft/revise/export/share controls and clear consent language.
- **AI layer:** expose the two half-step archetypes as optional review modes with transparent prompts and no autonomous external actions.
- **Solana:** defer on-chain value movement until the off-chain prototype, governance, threat model, and compliance review are complete. Do not put private legacy content or sensitive personal data on-chain.
- **Integration:** preserve independent project boundaries and treat the engine as a reusable module with an explicit API and versioned schema.

## 8. Acceptance criteria for the first prototype

- A participant can create and revise a private legacy contribution without publishing it.
- A participant can use either, both, or neither review lens.
- The participant can see exactly what data is stored and who can access it.
- Sharing is off by default and requires an explicit action.
- A participant can revoke future access and request deletion through a documented workflow.
- Duplicate requests are safely idempotent.
- Tests demonstrate that private contributions cannot be retrieved by unauthorized users.
- No external message, public post, payment, token issuance, or blockchain transaction is triggered by a private exercise.
- The product clearly distinguishes symbolic model states from actual application events and real-world outcomes.

## 9. Design principle

The cleanest insertion is not “the outer world first.” It is a private, consent-led workspace in which each person can author their own legacy contribution, learn through generative and critical reflection, and decide whether anything should move outward.

The engine should recognize contribution without extracting it, support healing without demanding disclosure, and create shared value only where participants have knowingly chosen to participate.

---

**Source note:** This document formalizes the user's supplied conversation and aligns the implementation boundaries with the uploaded *Phase 1 Hybrid Build – Technical Roadmap*. The roadmap's Heaven/Earth/Hell labels and the Time project's Earth Realms 1–4 are related conceptual vocabularies but are not assumed to be identical database entities without an explicit schema decision.
