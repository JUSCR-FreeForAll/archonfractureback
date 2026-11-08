import { createHash } from "node:crypto";
import type { PoolClient } from "pg";
import type { RealmLayer } from "./time-model.js";

export type RealmMessageType =
  | "state_transition"
  | "review_result"
  | "publication_notice"
  | "sync_signal";

export interface RealmSignalInput {
  participantId: string;
  consentGrantId: string;
  fromLayer: RealmLayer;
  toLayer: RealmLayer;
  messageType: RealmMessageType;
  encryptedPayload: Buffer;
  idempotencyKey: string;
}

export interface RealmSignalResult {
  id: string;
  duplicate: boolean;
  deliveryStatus: "queued" | "delivered" | "cancelled" | "failed";
}

/**
 * Queues a consent-gated, encrypted application event between model layers.
 * It does not contact people, agents, external services, or anything outside
 * the application. The caller must provide authenticated participant scope
 * and run this inside a transaction protected by withSecretRoomLock.
 */
export async function enqueueRealmSignal(
  client: PoolClient,
  input: RealmSignalInput
): Promise<RealmSignalResult> {
  if (input.fromLayer === input.toLayer) {
    throw new Error("realm signal must cross between distinct model layers");
  }
  if (!input.participantId || !input.consentGrantId || !input.idempotencyKey) {
    throw new Error("participant, consent grant, and idempotency key are required");
  }
  if (!Buffer.isBuffer(input.encryptedPayload) || input.encryptedPayload.length === 0) {
    throw new Error("encryptedPayload must contain ciphertext bytes");
  }

  const payloadHash = createHash("sha256").update(input.encryptedPayload).digest("hex");

  const inserted = await client.query(
    `INSERT INTO time_realm_messages
       (participant_id, consent_grant_id, from_layer, to_layer, message_type,
        payload_ciphertext, payload_hash, idempotency_key)
     SELECT $1, cg.id, $3, $4, $5, $6, $7, $8
     FROM time_consent_grants cg
     WHERE cg.id = $2
       AND cg.participant_id = $1
       AND cg.audience = $4
       AND cg.revoked_at IS NULL
       AND (cg.expires_at IS NULL OR cg.expires_at > now())
     ON CONFLICT (participant_id, idempotency_key) DO NOTHING
     RETURNING id, delivery_status`,
    [
      input.participantId,
      input.consentGrantId,
      input.fromLayer,
      input.toLayer,
      input.messageType,
      input.encryptedPayload,
      payloadHash,
      input.idempotencyKey
    ]
  );

  if (inserted.rowCount === 1) {
    return {
      id: inserted.rows[0].id as string,
      duplicate: false,
      deliveryStatus: inserted.rows[0].delivery_status as RealmSignalResult["deliveryStatus"]
    };
  }

  const existing = await client.query(
    `SELECT id, payload_hash, delivery_status
     FROM time_realm_messages
     WHERE participant_id = $1 AND idempotency_key = $2
     FOR UPDATE`,
    [input.participantId, input.idempotencyKey]
  );
  if (existing.rowCount === 1) {
    if (existing.rows[0].payload_hash !== payloadHash) {
      throw new Error("idempotency key was already used with a different payload");
    }
    return {
      id: existing.rows[0].id as string,
      duplicate: true,
      deliveryStatus: existing.rows[0].delivery_status as RealmSignalResult["deliveryStatus"]
    };
  }

  throw new Error("no active consent grant authorizes this destination layer");
}

/** Friendly project-facing name for the internal signal/outbox operation. */
export const enqueueHotflash = enqueueRealmSignal;
