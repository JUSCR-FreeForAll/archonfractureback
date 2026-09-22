import { createHash } from "node:crypto";

export interface ZkProofPayload {
  proof: string;
  publicSignals: string[];
  circuit: "intention" | "consent";
}

/**
 * Fail-closed verifier boundary. Replace this implementation with the
 * selected Noir/Barretenberg or SP1 verifier only after its verification key,
 * circuit identifier, and public-signal bindings are configured.
 */
export async function verifyZkProof(payload: ZkProofPayload): Promise<boolean> {
  try {
    if (!payload || (payload.circuit !== "intention" && payload.circuit !== "consent")) return false;
    if (typeof payload.proof !== "string" || payload.proof.length === 0) return false;
    if (!Array.isArray(payload.publicSignals) || payload.publicSignals.length === 0) return false;
    if (Buffer.byteLength(payload.proof, "utf8") > 64 * 1024) return false;
    return false;
  } catch {
    return false;
  }
}

export function buildPublicSignals(loopPurposeCommitment: string, currentTime: number): string[] {
  return [loopPurposeCommitment, currentTime.toString()];
}

export function commitmentFromText(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}
