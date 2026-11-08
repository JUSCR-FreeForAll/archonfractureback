import { describe, expect, it, vi } from "vitest";
import { enqueueRealmSignal } from "../src/time-bridge.js";
import type { PoolClient } from "pg";

const baseInput = {
  participantId: "participant-1",
  consentGrantId: "grant-1",
  fromLayer: "earth-realm-2" as const,
  toLayer: "realm-3" as const,
  messageType: "state_transition" as const,
  encryptedPayload: Buffer.from("ciphertext-test"),
  idempotencyKey: "signal-1"
};

describe("consent-gated realm signal bridge", () => {
  it("queues an encrypted signal when the database confirms active destination consent", async () => {
    const client = {
      query: vi.fn().mockResolvedValue({
        rowCount: 1,
        rows: [{ id: "message-1", delivery_status: "queued" }]
      })
    } as unknown as PoolClient;

    await expect(enqueueRealmSignal(client, baseInput)).resolves.toEqual({
      id: "message-1",
      duplicate: false,
      deliveryStatus: "queued"
    });
    expect(client.query).toHaveBeenCalledOnce();
  });

  it("rejects same-layer messages", async () => {
    const client = { query: vi.fn() } as unknown as PoolClient;
    await expect(enqueueRealmSignal(client, {
      ...baseInput,
      toLayer: "earth-realm-2"
    })).rejects.toThrow("must cross between distinct model layers");
    expect(client.query).not.toHaveBeenCalled();
  });

  it("fails closed when no active consent authorizes the destination", async () => {
    const client = {
      query: vi.fn()
        .mockResolvedValueOnce({ rowCount: 0, rows: [] })
        .mockResolvedValueOnce({ rowCount: 0, rows: [] })
    } as unknown as PoolClient;

    await expect(enqueueRealmSignal(client, baseInput)).rejects.toThrow(
      "no active consent grant authorizes this destination layer"
    );
  });

  it("returns an existing signal for a same-payload idempotent retry", async () => {
    const { createHash } = await import("node:crypto");
    const payloadHash = createHash("sha256").update(baseInput.encryptedPayload).digest("hex");
    const client = {
      query: vi.fn()
        .mockResolvedValueOnce({ rowCount: 0, rows: [] })
        .mockResolvedValueOnce({
          rowCount: 1,
          rows: [{ id: "message-existing", payload_hash: payloadHash, delivery_status: "queued" }]
        })
    } as unknown as PoolClient;

    await expect(enqueueRealmSignal(client, baseInput)).resolves.toEqual({
      id: "message-existing",
      duplicate: true,
      deliveryStatus: "queued"
    });
  });
});
