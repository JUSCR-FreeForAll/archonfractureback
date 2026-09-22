import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { initZkVerifier, verifyZkProof } from "../src/zk-verifier.js";

const CIRCUIT_PATH = path.join(process.cwd(), "zk/noir/target/juscr_intention.json");
const hasCircuitArtifact = existsSync(CIRCUIT_PATH);

interface CircuitRuntime {
  Noir: new (circuit: unknown, backend?: unknown) => {
    execute(inputs: Record<string, string | number>): Promise<{ witness: unknown }>;
  };
  BarretenbergBackend: new (circuit: unknown, options?: { threads: number }) => {
    generateProof(witness: unknown): Promise<{ proof: Uint8Array; publicInputs: unknown }>;
  };
}

const loadModule = new Function("specifier", "return import(specifier)") as (specifier: string) => Promise<unknown>;

function asHex(value: Uint8Array): string {
  return `0x${Buffer.from(value).toString("hex")}`;
}

function publicSignalsFrom(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (value && typeof value === "object") {
    const inputs = value as Record<string, unknown>;
    const commitment = inputs.loop_purpose_commitment;
    const currentTime = inputs.current_time;
    if (commitment !== undefined && currentTime !== undefined) {
      return [String(commitment), String(currentTime)];
    }
  }
  throw new Error("Unsupported Noir publicInputs shape; confirm the pinned API and update this test");
}

describe.skipIf(!hasCircuitArtifact)("Noir intention circuit", () => {
  let runtime: CircuitRuntime;
  let circuit: unknown;

  beforeAll(async () => {
    if (!hasCircuitArtifact) return;

    try {
      circuit = JSON.parse(readFileSync(CIRCUIT_PATH, "utf8"));
      const noirModule = await loadModule("@noir-lang/noir_js") as { Noir: CircuitRuntime["Noir"] };
      const backendModule = await loadModule("@noir-lang/backend_barretenberg") as { BarretenbergBackend: CircuitRuntime["BarretenbergBackend"] };
      runtime = { Noir: noirModule.Noir, BarretenbergBackend: backendModule.BarretenbergBackend };
      await initZkVerifier();
    } catch (error: unknown) {
      const detail = error instanceof Error ? error.message : String(error);
      throw new Error(`ZK integration prerequisites are unavailable: ${detail}`);
    }
  });

  async function prove(inputs: Record<string, string | number>) {
    const backend = new runtime.BarretenbergBackend(circuit, { threads: 1 });
    const noir = new runtime.Noir(circuit, backend);
    const { witness } = await noir.execute(inputs);
    const result = await backend.generateProof(witness);
    return {
      proof: asHex(result.proof),
      publicSignals: publicSignalsFrom(result.publicInputs),
    };
  }

  it("verifies a proof generated from a valid witness", async () => {
    const payload = await prove({
      intention_hash: "1",
      expires: 2,
      loop_purpose_commitment: "1",
      current_time: 1,
    });

    await expect(verifyZkProof(payload)).resolves.toBe(true);
  });

  it("rejects a proof when its public witness binding is invalid", async () => {
    const payload = await prove({
      intention_hash: "1",
      expires: 2,
      loop_purpose_commitment: "1",
      current_time: 1,
    });
    const invalidPayload = {
      ...payload,
      publicSignals: [payload.publicSignals[0], "2"],
    };

    await expect(verifyZkProof(invalidPayload)).resolves.toBe(false);
  });
});
