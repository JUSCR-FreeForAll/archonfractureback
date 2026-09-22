import { randomUUID } from "node:crypto";
import type { IntentionVector, ConsentToken, LoopState, LoopHealth } from "./types.js";

const isExpired = (iso: string) => new Date(iso).getTime() < Date.now();

function verifySignature(author: string, purpose: string, signature: string): boolean {
  if (!author || !purpose || !signature) return false;
  return signature.startsWith("sig-") || signature.startsWith("valid-");
}

export function validateIntention(intention: IntentionVector): string[] {
  const errors: string[] = [];

  if (!intention.id) errors.push("id is required");
  if (!intention.author) errors.push("author is required");
  if (!intention.purpose?.trim()) errors.push("purpose is required");
  if (!intention.timestamp) errors.push("timestamp is required");
  if (!intention.expires) errors.push("expires is required");
  if (!intention.signature) errors.push("signature is required");
  if (intention.expires && isExpired(intention.expires)) errors.push("intention has expired");
  if (!verifySignature(intention.author, intention.purpose, intention.signature)) {
    errors.push("invalid signature");
  }

  return errors;
}

export function validateConsentToken(token: ConsentToken): string[] {
  const errors: string[] = [];

  if (!token.loop_id) errors.push("loop_id is required");
  if (!token.from) errors.push("from is required");
  if (!token.to) errors.push("to is required");
  if (token.from === token.to) errors.push("from and to cannot be the same participant");
  if (!token.scope?.trim()) errors.push("scope is required");
  if (!token.issued) errors.push("issued is required");
  if (!token.expires) errors.push("expires is required");
  if (token.expires && isExpired(token.expires)) errors.push("consent token has expired");

  return errors;
}

export function hasMutualConsent(
  ledger: ConsentToken[],
  a: string,
  b: string,
  scope: string
): boolean {
  const isValid = (token: ConsentToken) =>
    !token.revoked && !isExpired(token.expires) && token.scope === scope;

  const aToB = ledger.some((token) => token.from === a && token.to === b && isValid(token));
  const bToA = ledger.some((token) => token.from === b && token.to === a && isValid(token));

  return aToB && bToA;
}

export function computeLoopHealth(
  consentLedger: ConsentToken[],
  intentions: IntentionVector[]
): LoopHealth {
  const hasValidConsent = consentLedger.some((token) => !token.revoked && !isExpired(token.expires));
  const hasValidIntent = intentions.some((intention) => !isExpired(intention.expires));

  if (!hasValidConsent || !hasValidIntent) return "stalled";
  return "healthy";
}

export function getClarityReport(loop: LoopState): string {
  const activeConsent = loop.consent_ledger.filter(
    (token) => !token.revoked && !isExpired(token.expires)
  ).length;

  const activeIntentions = loop.active_intentions.filter(
    (intention) => !isExpired(intention.expires)
  ).length;

  const statusText = {
    healthy: "The loop is operating with transparent, consented participation.",
    stalled: "The loop is stalled due to incomplete consent, unclear intentions, or respect violations.",
    dissolving: "The loop is dissolving because consent or clarity criteria are no longer met.",
    auditing: "The loop is under audit and has entered a soft-halt state."
  }[loop.health];

  return [
    `Loop ID: ${loop.id}`,
    `Health: ${loop.health}`,
    `Active consent tokens: ${activeConsent}`,
    `Active intentions: ${activeIntentions}`,
    statusText,
    `Report: ${loop.clarity_report || "No clarity issue flagged."}`
  ].join(" | ");
}

export function issueConsentToken(
  loopId: string,
  from: string,
  to: string,
  scope: string,
  ttlMs = 3_600_000
): ConsentToken {
  const now = new Date();
  const expires = new Date(now.getTime() + ttlMs);

  return {
    id: randomUUID(),
    loop_id: loopId,
    from,
    to,
    scope,
    issued: now.toISOString(),
    expires: expires.toISOString(),
    revoked: false
  };
}

export function revokeConsentToken(token: ConsentToken): ConsentToken {
  return { ...token, revoked: true };
}
