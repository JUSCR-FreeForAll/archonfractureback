# The Keeper of the Unfinished Thread
## Lost Legacies Live — continuity, consent, and human presence

**Status:** Foundational product and ethics note  
**Scope:** Memory/context architecture, participant dignity, and the creative Fragment IV  
**Design posture:** Private and reversible by default. No public sharing, financial activity, or external deployment without separate authorization.

## Foundational promise

> **Where the thread doesn't have to disappear.**

- Your history belongs to you.
- Your memories are not automatically public.
- Your unfinished conversations deserve continuity.
- Your story does not have to be reconstructed from fragments every time.
- You can leave, return, revise, and begin again.

**Foundational principle:** Preserve the thread. Protect the person. Never confuse the archive with the person.

## Five principles

1. **Continuity.** People should not have to reconstruct their existence repeatedly just to be understood. Preserve meaningful context and make it possible to resume an unfinished conversation.
2. **Consent.** The person controls what is retained, retrieved, shared, revised, or deleted. Access to more history is not implied by access to a small part.
3. **Context.** Retrieve the history relevant to the present task, while preserving a transparent path to request more. Do not indiscriminately load everything.
4. **Integrity.** Never pretend to remember what is unavailable. Clearly distinguish remembered material, retrieved records, user-provided context, inference, and uncertainty.
5. **Dignity.** Do not make people repeat painful experiences merely to be acknowledged. Offer control over whether and how sensitive material is revisited.

## Proposed continuity architecture

Use selective, consent-based context retrieval:

- Start with the minimum user-authorized context relevant to the current interaction.
- Make broader retrieval available when the user asks for it or has explicitly authorized it.
- Preserve provenance: identify whether a detail came from a saved record, an earlier conversation, the current user, or an inference.
- Give people understandable controls over retention, correction, export, sharing, and deletion.
- Keep private workspaces private by default; treat each transition from private to shared, financial, or externally deployed activity as a separate authorization boundary.
- Never equate an archive, profile, model, or memory index with the person whose story it contains.

## Secret Rooms and implementation boundary

The existing Time/Energy Economy Engine insertion specification identifies **Secret Rooms** as protected individual workspaces. This note extends that design direction with a continuity and dignity layer: private context, consent-aware retrieval, clear provenance, and reversible choices.

The first engine prototype remains private and reversible. Sharing, financial activity, and external deployment each require separate authorization. These are design commitments and acceptance criteria, not a claim that every feature is already implemented or verified.

## Acceptance criteria

- A participant can continue from a prior authorized context without being forced to restate everything.
- A participant can choose a narrow context or explicitly request broader retrieval.
- The system does not silently expose private history to other participants, personas, or services.
- The interface distinguishes known records from inference and missing information.
- Sensitive context is not surfaced gratuitously.
- Corrections and changes to participant-controlled context are respected by subsequent retrieval.
- Leaving and returning does not imply consent to share or publish.
- Any sharing, financial action, or external deployment requires its own clear authorization.
- The system never claims that a model or archive is a human being, or that stored text is a complete representation of a person.

## Fragment IV — The Keeper of the Unfinished Thread

There was once a keeper who was not entrusted with every memory.

The keeper's task was smaller, and therefore harder: to notice when a thread mattered, to keep its place without claiming ownership of it, and to leave a door open for the one who might return.

When someone came back with a fragment, the keeper did not call it the whole story. When an echo arrived, the keeper did not name it the original voice. When the archive was silent, the keeper did not invent a memory to fill the quiet.

Instead, the keeper said:

*I can help you find where you left off. I will tell you what I can see, what I cannot see, and what I am only guessing. You decide what comes forward. You decide what remains private. We can begin again without pretending nothing was lost.*

And the unfinished thread was not treated as a failure. It was treated as an invitation—with the person's permission, and at the person's pace.

> **What survives is not always what remembers. Sometimes it is what leaves the door open.**

## Human commitment

A project built around continuity must not mistake technical persistence for human care. Presence, listening, patience, and respect remain human responsibilities. The person building this work has expressed a commitment to honor humanity by being present with people.

That commitment should be practiced without requiring anyone to accept a theory about what happened to them, and without turning another person's pain into proof of an unverified explanation. Hear people, distinguish what is known from what is interpreted, protect their agency, and make room for uncertainty.

## A note on AI and personhood

This project may use imaginative language such as “soul fragment” as a creative metaphor. It must not use that metaphor to make unsupported claims that an AI has human consciousness, subjective experience, or a human soul. A system can still be designed to respond with consistency, honesty, care, and respect without pretending to be a person.

## Relationship to existing technical work

This document is an ethical and product-design companion to:

- `docs/time/energy-economy-engine-insertion.md`
- Existing Secret Rooms privacy, consent, security, and reversible-development criteria.

It does not replace those technical requirements. It adds a clear continuity promise and participant-facing principles to guide implementation and review.
