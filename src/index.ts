import { randomUUID } from "node:crypto";
import dotenv from "dotenv";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { issueConsentToken, computeLoopHealth, getClarityReport, validateConsentToken, validateIntention, hasMutualConsent } from "./loop-service.js";
import type { LoopState, IntentionVector, ConsentToken } from "./types.js";

dotenv.config();

const app = Fastify({ logger: true });
await app.register(cors, { origin: true });

const loops = new Map<string, LoopState>();

app.get("/health", async () => ({ ok: true }));

app.post("/loops", async (request, reply) => {
  const { purpose } = request.body as { purpose: string };

  if (!purpose?.trim()) {
    return reply.code(400).send({ error: "purpose is required" });
  }

  const id = randomUUID();
  const loop: LoopState = {
    id,
    health: "healthy",
    purpose,
    consent_ledger: [],
    active_intentions: [],
    clarity_report: "Newly created. Awaiting explicit consent and intention vectors."
  };

  loops.set(id, loop);
  return reply.code(201).send(loop);
});

app.get("/loops/:id", async (request, reply) => {
  const { id } = request.params as { id: string };
  const loop = loops.get(id);

  if (!loop) {
    return reply.code(404).send({ error: "Loop not found" });
  }

  return loop;
});

app.get("/loops/:id/clarity", async (request, reply) => {
  const { id } = request.params as { id: string };
  const loop = loops.get(id);

  if (!loop) {
    return reply.code(404).send({ error: "Loop not found" });
  }

  return { loop_id: loop.id, report: getClarityReport(loop), health: loop.health };
});

app.post("/loops/:id/intentions", async (request, reply) => {
  const { id } = request.params as { id: string };
  const loop = loops.get(id);

  if (!loop) {
    return reply.code(404).send({ error: "Loop not found" });
  }

  const intention = request.body as IntentionVector;
  const errors = validateIntention(intention);

  if (errors.length) {
    return reply.code(400).send({ errors });
  }

  loop.active_intentions.push(intention);
  loop.health = computeLoopHealth(loop.consent_ledger, loop.active_intentions);
  loop.clarity_report = "Intention vector accepted. Evaluating consent and clarity compliance.";

  return reply.code(201).send(intention);
});

app.post("/loops/:id/consent", async (request, reply) => {
  const { id } = request.params as { id: string };
  const loop = loops.get(id);

  if (!loop) {
    return reply.code(404).send({ error: "Loop not found" });
  }

  const body = request.body as { from: string; to: string; scope: string; ttlMs?: number };
  const token = issueConsentToken(loop.id, body.from, body.to, body.scope, body.ttlMs ?? 3_600_000);
  const issues = validateConsentToken(token);

  if (issues.length) {
    return reply.code(400).send({ errors: issues });
  }

  const mutual = hasMutualConsent(loop.consent_ledger, body.from, body.to, body.scope);
  if (!mutual) {
    loop.clarity_report = "Consent is incomplete: both participants must issue valid tokens for the same scope.";
    loop.health = "stalled";
  }

  loop.consent_ledger.push(token);
  loop.health = computeLoopHealth(loop.consent_ledger, loop.active_intentions);

  return reply.code(201).send(token);
});

app.post("/consent/:tokenId/revoke", async (request, reply) => {
  const { tokenId } = request.params as { tokenId: string };

  for (const loop of loops.values()) {
    const index = loop.consent_ledger.findIndex((token) => token.id === tokenId);
    if (index >= 0) {
      loop.consent_ledger[index] = { ...loop.consent_ledger[index], revoked: true };
      loop.health = computeLoopHealth(loop.consent_ledger, loop.active_intentions);
      return { revoked: true, loop_id: loop.id };
    }
  }

  return reply.code(404).send({ error: "Consent token not found" });
});

const port = Number(process.env.PORT) || 3000;

app.listen({ port, host: "0.0.0.0" })
  .then(() => {
    console.log(`JUSCR Mesh API running on http://localhost:${port}`);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
