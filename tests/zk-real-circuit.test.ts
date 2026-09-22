import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
import { verifyZkProof, type ZkProofPayload } from "../src/zk-verifier.js";

interface RealCircuitHarness {
  generateValidProof(): Promise<ZkProofPayload>;
  generateInvalidProof(): Promise<ZkProofPayload>;
}

const artifactPath = resolve("zk/noir/target/juscr_intention.json");
const harnessPath = resolve(
  process.env.ZK_REAL_CIRCUIT_HARNESS ?? "tests/zk-real-circuit-harness.ts"
);
const enabled = process.env.RUN_ZK_INTEGRATION === "1";

async function loadHarness(): Promise<RealCircuitHarness> {
  if (!existsSync(harnessPath)) {
    throw new Error(
      `Missing real-circuit harness at ${harnessPath}. Add it after pinning Noir/Barretenberg versions.`
    );
  }

  const module = (await import(pathToFileURL(harnessPath).href)) as Partial<RealCircuitHarness>;
  if (typeof module.generateValidProof !== "function" || typeof module.generateInvalidProof !== "function") {
    throw new Error(
      "The real-circuit harness must export generateValidProof() and generateInvalidProof()."
    );
  }

  return module as RealCircuitHarness;
}

describe("real Noir intention circuit", () => {
  const prerequisiteMessage = !existsSync(artifactPath)
    ? "requires zk/noir/target/juscr_intention.json; run nargo compile"
    : !enabled
      ? "set RUN_ZK_INTEGRATION=1 to run the real-circuit test"
      : "";
  const skippedTestSuffix = prerequisiteMessage ? ` (skipped: ${prerequisiteMessage})` : "";

  it.skipIf(Boolean(prerequisiteMessage))(`verifies a valid generated proof${skippedTestSuffix}`, async () => {
    const harness = await loadHarness();
    const proof = await harness.generateValidProof();

    await expect(verifyZkProof(proof)).resolves.toBe(true);
  });

  it.skipIf(Boolean(prerequisiteMessage))(
    `rejects a proof generated from an invalid witness${skippedTestSuffix}`,
    async () => {
    const harness = await loadHarness();
    const proof = await harness.generateInvalidProof();

    await expect(verifyZkProof(proof)).resolves.toBe(false);
    }
  );
});