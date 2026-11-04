import type { FastifyInstance } from "fastify";
import { MeshEventSchema, type MeshEvent } from "../mesh/event-contract.js";

export interface MeshEventAcceptance {
  receipt: string;
  recordedAt: string;
}

export interface MeshEventDependencies {
  /**
   * Must enforce actor authorization, consent scope, schema/policy version,
   * idempotency, state-hash verification, and durable audit persistence.
   * Do not implement this with an in-memory map in production.
   */
  verifyAndPersist(event: MeshEvent): Promise<MeshEventAcceptance>;
}

export async function registerMeshRoutes(
  app: FastifyInstance,
  dependencies: MeshEventDependencies
): Promise<void> {
  app.post("/api/v1/mesh/events", async (request, reply) => {
    const parsed = MeshEventSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.code(400).send({
        error: "Invalid mesh event",
        issues: parsed.error.issues.map(({ path, message }) => ({ path, message }))
      });
    }

    try {
      const accepted = await dependencies.verifyAndPersist(parsed.data);

      // Log only identifiers and the receipt. Avoid logging raw mutations,
      // actor secrets, private state, or cryptographic key material.
      request.log.info({
        eventId: parsed.data.id,
        eventType: parsed.data.type,
        source: parsed.data.source,
        segment: parsed.data.data.segment,
        module: parsed.data.data.module,
        receipt: accepted.receipt
      }, "mesh.event.accepted");

      return reply.code(202).send({
        status: "accepted",
        eventId: parsed.data.id,
        receipt: accepted.receipt,
        recordedAt: accepted.recordedAt
      });
    } catch (error) {
      request.log.error({
        eventId: parsed.data.id,
        error: error instanceof Error ? error.message : "Unknown mesh acceptance error"
      }, "mesh.event.rejected");

      return reply.code(422).send({ error: "Mesh event could not be verified or persisted" });
    }
  });
}
