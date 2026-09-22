CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Existing JUSCR schema remains below. ZK metadata intentionally excludes
-- private intention text and raw proof payloads.

CREATE TABLE IF NOT EXISTS intention_proofs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loop_id UUID NOT NULL REFERENCES loops(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES participants(id),
  proof_hash CHAR(64) NOT NULL UNIQUE,
  purpose_commitment CHAR(64) NOT NULL,
  nonce TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  public_signals JSONB NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT false,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (loop_id, participant_id, nonce)
);

CREATE INDEX IF NOT EXISTS idx_intention_proofs_loop_id ON intention_proofs(loop_id);
CREATE INDEX IF NOT EXISTS idx_intention_proofs_verified ON intention_proofs(loop_id, verified);
