import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

const CIRCUIT_PATH = path.join(process.cwd(), "zk/noir/target/juscr_intention.json");
const MAX_PROOF_BYTES = 256 * 1024;
const EXPECTED_PUBLIC_SIGNALS = 2;
const HEX_REGEX = /^0x([0-9a-fA-F]{2})+$/;

interface NoirVerifier {
  verifyFinalProof(input: { proof: Uint8Array; publicInputs: Record<string, string> }): Promise<boolean>;
}

let noir: NoirVerifier | null = null;
let initialized = false;
let initError: string | null = null;
let initPromise: Promise<void> | null = null;

interface NoirModule {
  Noir: new (circuit: unknown, backend: unknown) => NoirVerifier;
}

interface BackendModule {
  BarretenbergBackend: new (circuit: unknown, options: { threads: number }) => unknown;
}

/**
 * Initializes the verifier once. The import and proof shape are version-sensitive;
 * pin Noir and Barretenberg versions before enabling this in production.
 */
export async function initZkVerifier(): Promise<void> {
  if (initialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      if (!existsSync(CIRCUIT_PATH)) {
        throw new Error(`Compiled circuit not found at ${CIRCUIT_PATH}`);
      }

      const circuit = JSON.parse(readFileSync(CIRCUIT_PATH, "utf8"));
      const loadModule = new Function("specifier", "return import(specifier)") as (specifier: string) => Promise<unknown>;
      const { Noir } = await loadModule("@noir-lang/noir_js") as NoirModule;
      const { BarretenbergBackend } = await loadModule("@noir-lang/backend_barretenberg") as BackendModule;
      const backend = new BarretenbergBackend(circuit, { threads: 1 });
      noir = new Noir(circuit, backend);

      initialized = true;
      initError = null;
      console.log("[zk] Verifier initialized (fail-closed)");
    } catch (error: unknown) {
      initialized = false;
      noir = null;
      initError = error instanceof Error ? error.message : String(error);
      console.error("[zk] Initialization failed:", initError);
      throw new Error(`ZK verifier init failed: ${initError}`);
    } finally {
      initPromise = null;
    }
  })();

  return initPromise;
}

export function isZkReady(): boolean {
  return initialized && noir !== null;
}

export function getZkInitError(): string | null {
  return initError;
}

export interface ZkProofPayload {
  proof: string;
  publicSignals: string[];
}

export async function verifyZkProof(payload: ZkProofPayload): Promise<boolean> {
  if (!isZkReady() || !noir) {
    console.error("[zk] Rejected - verifier not ready:", initError);
    return false;
  }

  if (!payload || typeof payload.proof !== "string" || !Array.isArray(payload.publicSignals)) return false;
  if (payload.publicSignals.length !== EXPECTED_PUBLIC_SIGNALS) return false;
  if (!HEX_REGEX.test(payload.proof)) return false;

  const proof = Buffer.from(payload.proof.slice(2), "hex");
  if (proof.length === 0 || proof.length > MAX_PROOF_BYTES) return false;
  if (payload.publicSignals.some((signal) => typeof signal !== "string" || signal.length === 0)) return false;

  try {
    // Confirm this object shape against the exact pinned Noir/Barretenberg versions.
    return Boolean(await noir.verifyFinalProof({
      proof: new Uint8Array(proof),
      publicInputs: {
        loop_purpose_commitment: payload.publicSignals[0],
        current_time: payload.publicSignals[1],
      },
    }));
  } catch (error: unknown) {
    console.error("[zk] Verification threw:", error);
    return false;
  }
}

export function buildPublicSignals(loopPurposeCommitment: string, currentTime: number): string[] {
  return [loopPurposeCommitment, currentTime.toString()];
}

export function commitmentFromText(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}
