# Secret-Room Charter — Earth Realm 2
**Status:** Design decision record / Phase 0–1 product boundary  
**Scope:** Qualitative value, reciprocity, non-interference, and the first safe collaboration protocol  
**Related design:** [Time Model and Energy/Economy Engine Insertion](./energy-economy-engine-insertion.md)

## Purpose and operating posture

The Secret Room is a private, reversible design and reflection space inside the project's Earth Realm 2 metaphor. It is not a wallet, marketplace, public feed, shared account, or mechanism for changing another person or the outside world.

The language of realms, dual zeros, demi-urges, and energy is retained as the project's symbolic vocabulary. In implementation, these are product concepts and review lenses—not claims of independently verified forces, autonomous agents, or causal influence over external reality.

**Default state: private, local, non-transferable, reversible, and inert.** No token, balance, public ranking, account merger, payment rail, or external action is created by this charter.

## 1. A completed personal legacy rewrite as a unit of value

A completed rewrite represents a participant's authored act of making meaning: they have had the opportunity to describe an inherited or remembered story, examine it from their own perspective, and choose language or an interpretation they are willing to stand behind.

Its qualitative weight is not a score. It is the combination of:

- **Agency:** the participant—not the platform, facilitator, AI, or another participant—decides what the rewrite means and whether it is complete.
- **Coherence:** the participant can identify what changed in their understanding, what remains unresolved, and what they choose to carry forward.
- **Dignity:** the original experience is not ranked, mined, sensationalized, or treated as a resource owed to anyone else.
- **Possibility:** the participant may offer a lesson, question, boundary, or invitation that could help another person think, without being required to disclose the underlying story.
- **Continuity:** the participant retains their own work and may revise, export, pause, withdraw it from a collaboration, or leave.

A rewrite therefore creates **recognizable meaning and the possibility of voluntary contribution**, not a monetary entitlement. It is not transferable, redeemable, comparable across people, or a proxy for effort, trauma, virtue, status, or future earning power. The engine must not infer a numeric value from its length, emotional intensity, topic, or completion time.

“Completed” means only that the participant has chosen to mark their own rewrite complete for the purposes of the private experience. It does not mean healed, resolved, verified, approved by others, or permanently final.

## 2. How reciprocity begins when rewritten meaning is the only initial currency

Reciprocity begins as an invitation and a response—not a debt, exchange rate, or expectation of repayment.

The first valid reciprocal acts are non-financial and optional:

1. **Witness:** receive an offered meaning without claiming ownership or demanding more disclosure.
2. **Reflect:** offer a question, paraphrase, or perspective, clearly labeled as the responder's interpretation.
3. **Acknowledge:** recognize the contribution without rating the person or declaring their story objectively true or complete.
4. **Offer:** share a relevant resource, skill, prompt, or next-step invitation with no obligation attached.
5. **Decline or defer:** pass, pause, or leave without penalty or loss of one's own work.

The participant who authored the rewrite controls whether any part of it is offered. Reciprocity may be asymmetric, delayed, or absent; the system must not manufacture a debt ledger or imply that a person owes access, emotional labor, money, or a return contribution.

For Phase 0, the engine may record only private provenance about the participant's own actions (for example, authored, revised, self-marked complete, or explicitly shared). It must not create a transferable “value balance.” Any future shared contribution record requires explicit, item-level consent and a clear explanation of who can see it.

## 3. Non-interference covenant: what the engine must always refuse

The demi-urge constraint—“teach without affecting the world”—is translated into a hard product boundary. The Half-Positive (+½) and Half-Negative (−½) are complementary design-review lenses: one explores constructive possibilities; the other tests costs, coercion, and failure modes. Neither is an autonomous actor or authority.

The engine must refuse to:

- Contact people, publish content, send invitations, make purchases, transfer funds, mint or move tokens, place bids, change external records, or trigger third-party workflows from an exercise.
- Treat a thought, simulation, draft, score, archetype, or AI-generated interpretation as consent or authorization.
- Expose private writing, identity, sensitive narrative, or participation status to another person without a specific, informed, revocable permission for that item and audience.
- Merge accounts, identities, histories, balances, or ownership merely because people collaborate, share a room, or have similar stories.
- Convert personal rewrites, trauma, emotion, attention, or participation into money, tradable assets, public rankings, reputation scores, or investor-facing traction metrics without a separately designed, lawful, consent-based process—and never by inference.
- Penalize silence, refusal, withdrawal, revision, non-completion, or choosing not to collaborate.
- Claim that the system can heal, diagnose, determine truth, read intent, or alter another person or external reality.
- Let an AI persona, facilitator, administrator, or other participant override the author's ownership or consent.
- Make irreversible changes to a participant's original work. Destructive operations must be unavailable in the private prototype; revisions are additive or versioned and recoverable.

**Fail-closed rule:** if the engine cannot establish the relevant participant, scope, audience, purpose, and current permission, it does not share or act. It returns a safe no-op and explains what permission or information is missing.

The private prototype has no external side-effect surface. Future capabilities such as sharing, financial activity, publication, or deployment require separate architecture, explicit authorization, security review, and acceptance criteria; this charter does not authorize them.

## 4. First safe collaboration after two or more rewrites

The first collaborative action is a **consent-gated shared reflection prompt using a participant-authored excerpt or abstraction that each author deliberately chooses to contribute**.

It is not a merge of the underlying rewrites. Each participant keeps their own private source document. The shared room receives only the exact item each participant selected—preferably a short lesson, question, boundary, or abstracted meaning rather than the raw narrative.

### Collaboration protocol

1. **Individual readiness:** each participant independently marks their own rewrite complete (or otherwise explicitly eligible to share). No participant can mark another person's work complete.
2. **Invitation:** one participant proposes a bounded prompt and identifies the intended participants. An invitation reveals no private rewrite content.
3. **Separate opt-in:** each invited participant accepts or declines. Silence is not acceptance.
4. **Item-level selection:** each participant chooses the exact excerpt, abstraction, or question to share and sees a preview of what the room will receive.
5. **Scope declaration:** the room displays its purpose, members, visibility, retention behavior, and permitted actions before anything is shared.
6. **Temporary shared reflection:** participants may respond with witness, reflection, acknowledgement, or an optional resource. No scoring, exchange, ownership transfer, or external action is available.
7. **Revocation and exit:** a participant may withdraw their contribution from the active room and leave. The room must stop displaying that contribution to other participants after revocation; the implementation must clearly disclose any copies or notifications already made before a future system offers such features. The author's private original remains intact.
8. **Provenance:** record the minimum necessary consent and event history, including who shared which item, with whom, for what purpose, and when permission was withdrawn. Do not record private source text in a shared audit trail.

A room is not created until the required participants have opted in and at least two have selected an item to share. If any permission is missing or withdrawn before the action completes, the operation aborts without partial disclosure.

## 5. Phase boundaries and implementation constraints

### Phase 0 — private reversible core

- Store each participant's rewrite and versions privately, under participant-controlled ownership.
- Permit local review, revision, self-marked completion, and private provenance.
- Keep dual-zero, demi-urge, and entanglement fields inert as specified in the Phase 0 implementation plan.
- Provide no sharing, token, payment, account-linking, external integration, or public-discovery action.
- Keep the store free of network, notification, payment, blockchain, and third-party side-effect surfaces.

### Later phase — explicit collaboration, still bounded

A later collaboration implementation may add a separate shared-room object and item-level consent records. It must not weaken private ownership or make shared access the default. The shared room is a projection of selected contributions, not a merged identity or merged personal archive.

### Not authorized by this document

This charter does not authorize production deployment, external publication, user recruitment, financial activity, token issuance, wallet connection, account linking, or a claim that any proposed feature is already implemented.

## 6. Acceptance criteria

The design is acceptable only when tests demonstrate all of the following:

1. A rewrite marked complete by its author creates no monetary balance, transferable asset, score, or public rank.
2. Completion is a participant-controlled status and is not represented as healing, truth verification, or permanent finality.
3. No private rewrite content is visible to another participant by default.
4. An invitation alone does not disclose content or create a room with access to private work.
5. Silence, decline, or timeout produces no consent and no penalty.
6. A shared reflection can contain only the exact item each author selected and previewed.
7. One participant cannot mark another participant's rewrite complete or change its ownership.
8. Revoking a shared item removes it from the active room while preserving the author's private original.
9. Leaving a room does not delete or transfer the participant's private work.
10. The private store cannot send messages, publish, transfer funds, mint tokens, or call external services.
11. Missing, ambiguous, stale, or withdrawn permission causes a fail-closed no-op.
12. The Half-Positive and Half-Negative review lenses can challenge a design but cannot authorize actions or override a participant.

## Decision summary

- **Value:** a completed rewrite is participant-authored meaning, agency, and a possible gift—not a price or score.
- **Reciprocity:** begins with optional witnessing, reflection, acknowledgement, and offers; it creates no debt.
- **Refusal:** the engine never turns private learning into unconsented external action or exposure.
- **First collaboration:** an opt-in, temporary shared reflection around individually selected items, with private originals remaining separate.
- **Default:** private, reversible, non-transferable, and fail-closed.
