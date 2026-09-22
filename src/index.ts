import { randomUUID } from "node:crypto";
import dotenv from "dotenv";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { issueConsentToken, computeLoopHealth, getClarityReport, validateConsentToken, validateIntention, hasMutualConsent } from "./loop-service.js";
import type { LoopState, IntentionVector } from "./types.js";
import { hashProof, validateProofSubmission, verifyWithConfiguredVerifier, type IntentionProofSubmission, type ProofRecord } from "./zk-proof.js";
import { buildPublicSignals, verifyZkProof, type ZkProofPayload } from "./zk-verifier.js";

dotenv.config();

const app = Fastify({ logger: true });
await app.register(cors, { origin: true });

const loops = new Map<string, LoopState>();
const proofRecords = new Map<string, ProofRecord>();
const usedProofNonces = new Set<string>();

app.get("/health", async () => ({ ok: true }));

app.post("/loops", async (request, reply) => {
  const { purpose } = request.body as { purpose: string };
  if (!purpose?.trim()) return reply.code(400).send({ error: "purpose is required" });
  const id = randomUUID();
  const loop: LoopState = { id, health: "healthy", purpose, consent_ledger: [], active_intentions: [], clarity_report: "Newly created. Awaiting explicit consent and intention vectors." };
  loops.set(id, loop);
  return reply.code(201).send(loop);
});

app.get("/loops/:id", async (request, reply) => {
  const { id } = request.params as { id: string };
  const loop = loops.get(id);
  if (!loop) return reply.code(404).send({ error: "Loop not found" });
  return loop;
});

app.get("/loops/:id/clarity", async (request, reply) => {
  const { id } = request.params as { id: string };
  const loop = loops.get(id);
  if (!loop) return reply.code(404).send({ error: "Loop not found" });
  return { loop_id: loop.id, report: getClarityReport(loop), health: loop.health };
});

app.post("/loops/:id/intentions", async (request, reply) => {
  const { id } = request.params as { id: string };
  const loop = loops.get(id);
  if (!loop) return reply.code(404).send({ error: "Loop not found" });
  const intention = request.body as IntentionVector;
  const errors = validateIntention(intention);
  if (errors.length) return reply.code(400).send({ errors });
  loop.active_intentions.push(intention);
  loop.health = computeLoopHealth(loop.consent_ledger, loop.active_intentions);
  loop.clarity_report = "Intention vector accepted. Evaluating consent and clarity compliance.";
  return reply.code(201).send(intention);
});

app.post("/loops/:id/prove-intention", async (request, reply) => {
  const { id } = request.params as { id: string };
  const loop = loops.get(id);
  if (!loop) return reply.code(404).send({ error: "Loop not found" });

  const submission = request.body as IntentionProofSubmission;
  const errors = validateProofSubmission(id, loop.purpose, submission, new Date(), usedProofNonces);
  if (errors.length) return reply.code(400).send({ errors });

  const signals = submission.public_signals;
  const proofHash = hashProof(submission.proof);
  if (proofRecords.has(proofHash)) return reply.code(409).send({ error: "proof has already been submitted" });

  // Never accept a client-provided verified flag. The configured verifier is
  // fail-closed until a real circuit verifier is installed.
  const verified = await verifyWithConfiguredVerifier(submission);
  if (!verified) return reply.code(503).send({ error: "ZK verifier is not configured; proof was not accepted", proof_hash: proofHash });

  const nonceKey = `${id}:${signals.participant_id}:${signals.nonce}`;
  usedProofNonces.add(nonceKey);
  const record: ProofRecord = { proof_hash: proofHash, loop_id: id, participant_id: signals.participant_id, public_signals: signals, verified: true, verified_at: new Date().toISOString() };
  proofRecords.set(proofHash, record);
  return reply.code(201).send({ proof_hash: proofHash, verified: true, verified_at: record.verified_at });
});

app.post("/verify-proof", async (request, reply) => {
  const body = request.body as Partial<ZkProofPayload>;
  if (typeof body.proof !== "string" || !Array.isArray(body.publicSignals)) {
    return reply.code(400).send({ error: "proof and publicSignals are required" });
  }
  const valid = await verifyZkProof({ proof: body.proof, publicSignals: body.publicSignals, circuit: body.circuit ?? "intention" });
  return { valid };
});

app.get("/proofs/:proofHash", async (request, reply) => {
  const { proofHash } = request.params as { proofHash: string };
  const record = proofRecords.get(proofHash);
  if (!record) return reply.code(404).send({ error: "Proof not found" });
  return { proof_hash: record.proof_hash, loop_id: record.loop_id, participant_id: record.participant_id, public_signals: record.public_signals, verified: record.verified, verified_at: record.verified_at };
});

app.post("/loops/:id/consent", async (request, reply) => {
  const { id } = request.params as { id: string };
  const loop = loops.get(id);
  if (!loop) return reply.code(404).send({ error: "Loop not found" });
  const body = request.body as { from: string; to: string; scope: string; ttlMs?: number };
  const token = issueConsentToken(loop.id, body.from, body.to, body.scope, body.ttlMs ?? 3_600_000);
  const issues = validateConsentToken(token);
  if (issues.length) return reply.code(400).send({ errors: issues });
  const mutual = hasMutualConsent(loop.consent_ledger, body.from, body.to, body.scope);
  if (!mutual) { loop.clarity_report = "Consent is incomplete: both participants must issue valid tokens for the same scope."; loop.health = "stalled"; }
  loop.consent_ledger.push(token);
  loop.health = computeLoopHealth(loop.consent_ledger, loop.active_intentions);
  return reply.code(201).send(token);
});

app.post("/consent/:tokenId/revoke", async (request, reply) => {
  const { tokenId } = request.params as { tokenId: string };
  for (const loop of loops.values()) {
    const index = loop.consent_ledger.findIndex((token) => token.id === tokenId);
    if (index >= 0) { loop.consent_ledger[index] = { ...loop.consent_ledger[index], revoked: true }; loop.health = computeLoopHealth(loop.consent_ledger, loop.active_intentions); return { revoked: true, loop_id: loop.id }; }
  }
  return reply.code(404).send({ error: "Consent token not found" });
});

const port = Number(process.env.PORT) || 3000;
app.listen({ port, host: "0.0.0.0" }).then(() => console.log(`JUSCR Mesh API running on http://localhost:${port}`)).catch((error) => { console.error(error); process.exit(1); });

export { app, buildPublicSignals };
