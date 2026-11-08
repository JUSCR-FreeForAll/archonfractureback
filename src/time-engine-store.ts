import type { Pool, PoolClient } from "pg";

/**
 * Executes a Secret Room mutation under a PostgreSQL transaction-scoped
 * advisory lock. The lock is released automatically on COMMIT/ROLLBACK.
 *
 * Callers must still authorize the participant before entering this helper.
 * The participant/workspace key is namespaced to avoid cross-module collisions.
 */
export async function withSecretRoomLock<T>(
  pool: Pool,
  workspaceId: string,
  operation: (client: PoolClient) => Promise<T>
): Promise<T> {
  if (!workspaceId.trim()) throw new Error("workspaceId is required");

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "SELECT pg_advisory_xact_lock(hashtextextended($1, 0))",
      [`juscr:secret-room:${workspaceId}`]
    );
    const result = await operation(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Idempotency helper. The unique constraint in the migration is the final
 * concurrency guard; this function must run inside withSecretRoomLock or
 * another transaction and must not be used as an authorization substitute.
 */
export async function claimIdempotencyKey(
  client: PoolClient,
  participantId: string,
  idempotencyKey: string,
  requestHash: string
): Promise<"claimed" | "duplicate" | "conflict"> {
  const inserted = await client.query(
    `INSERT INTO time_idempotency_keys
       (participant_id, idempotency_key, request_hash, status)
     VALUES ($1, $2, $3, 'processing')
     ON CONFLICT (participant_id, idempotency_key) DO NOTHING
     RETURNING id`,
    [participantId, idempotencyKey, requestHash]
  );
  if (inserted.rowCount === 1) return "claimed";

  const existing = await client.query(
    `SELECT request_hash FROM time_idempotency_keys
     WHERE participant_id = $1 AND idempotency_key = $2 FOR UPDATE`,
    [participantId, idempotencyKey]
  );
  return existing.rows[0]?.request_hash === requestHash ? "duplicate" : "conflict";
}
