import { createHash } from "node:crypto";

export interface IntentionProofSignals {
  loop_id: string;
  participant_id: string;
  purpose_commitment: string;
  nonce: string;
  expires_at: string;
}

export interface IntentionProofSubmission {
  proof: string;
  public_signals: IntentionProofSignals;
}

export interface ProofRecord {
  proof_hash: string;
  loop_id: string;
  participant_id: string;
  public_signals: IntentionProofSignals;
  verified: boolean;
  verified_at?: string;
}

export const MAX_PROOF_BYTES = 64 * 1024;

export function purposeCommitment(purpose: string): string {
  return createHash("sha256").update(purpose, "utf8").digest("hex");
}

export function hashProof(proof: string): string {
  return createHash("sha256").update(proof, "utf8").digest("hex");
}

export function validateProofSubmission(
  loopId: string,
  loopPurpose: string,
  submission: IntentionProofSubmission,
  now = new Date(),
  seenNonces: ReadonlySet<string> = new Set()
): string[] {
  const errors: string[] = [];
  const { proof, public_signals: signals } = submission ?? {};

  if (typeof proof !== "string" || proof.length === 0) errors.push("proof is required");
  else if (Buffer.byteLength(proof, "utf8") > MAX_PROOF_BYTES) errors.push("proof exceeds maximum size");

  if (!signals || typeof signals !== "object") {
    errors.push("public_signals are required");
    return errors;
  }

  if (signals.loop_id !== loopId) errors.push("proof loop_id does not match route loop");
  if (!signals.participant_id?.trim()) errors.push("participant_id is required");
  if (!signals.nonce?.trim()) errors.push("nonce is required");
  if (signals.nonce && seenNonces.has(`${loopId}:${signals.participant_id}:${signals.nonce}`)) {
    errors.push("proof nonce has already been used");
  }

  if (signals.purpose_commitment !== purposeCommitment(loopPurpose)) {
    errors.push("purpose commitment does not match loop purpose");
  }

  const expiresAt = Date.parse(signals.expires_at);
  if (!signals.expires_at || Number.isNaN(expiresAt)) errors.push("expires_at must be an ISO timestamp");
  else if (expiresAt <= now.getTime()) errors.push("intention proof has expired");

  return errors;
}

/**
 * Placeholder boundary for a real SP1/Noir verifier.
 * A submission must never be marked valid until this is replaced by a
 * configured verifier service or generated verifier key.
 */
export async function verifyWithConfiguredVerifier(_submission: IntentionProofSubmission): Promise<boolean> {
  return false;
}
