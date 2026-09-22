import { describe, expect, it } from "vitest";
import { purposeCommitment, validateProofSubmission } from "../src/zk-proof.js";

const base = (expires_at = "2030-01-01T00:00:00.000Z") => ({
  proof: "opaque-proof",
  public_signals: {
    loop_id: "loop-1",
    participant_id: "participant-1",
    purpose_commitment: purposeCommitment("build trust"),
    nonce: "nonce-1",
    expires_at
  }
});

describe("intention proof validation", () => {
  it("accepts matching, unexpired public signals", () => {
    expect(validateProofSubmission("loop-1", "build trust", base(), new Date("2029-01-01"))).toEqual([]);
  });

  it("rejects an expired intention proof", () => {
    expect(validateProofSubmission("loop-1", "build trust", base("2020-01-01T00:00:00.000Z"), new Date("2029-01-01"))).toContain("intention proof has expired");
  });

  it("rejects a commitment for another loop purpose", () => {
    expect(validateProofSubmission("loop-1", "different purpose", base(), new Date("2029-01-01"))).toContain("purpose commitment does not match loop purpose");
  });

  it("rejects replayed nonces", () => {
    const seen = new Set(["loop-1:participant-1:nonce-1"]);
    expect(validateProofSubmission("loop-1", "build trust", base(), new Date("2029-01-01"), seen)).toContain("proof nonce has already been used");
  });
});
