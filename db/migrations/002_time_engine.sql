-- Lost Legacies Live / Time Engine: private-first persistence boundary.
-- Apply after db/schema.sql. No financial or chain-facing tables are created.
CREATE TABLE IF NOT EXISTS time_secret_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  origin_position TEXT NOT NULL CHECK (origin_position IN ('0_m', '0_f')),
  temporal_phase_days NUMERIC(8,3) NOT NULL DEFAULT 3,
  status TEXT NOT NULL DEFAULT 'private' CHECK (status IN ('private', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (participant_id, origin_position)
);

CREATE TABLE IF NOT EXISTS time_legacy_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  secret_room_id UUID NOT NULL REFERENCES time_secret_rooms(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  contribution_type TEXT NOT NULL CHECK (contribution_type IN ('reflection', 'skill', 'teaching', 'artifact', 'time', 'community_action')),
  -- Store client-side encrypted bytes only; never put plaintext legacy text in audit rows.
  ciphertext BYTEA NOT NULL,
  encryption_key_ref TEXT NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'invited_reviewers', 'group', 'public')),
  consent_state TEXT NOT NULL DEFAULT 'draft' CHECK (consent_state IN ('draft', 'granted', 'revoked', 'withdrawn')),
  release_gate TEXT NOT NULL DEFAULT 'local_only' CHECK (release_gate IN ('local_only', 'eligible_for_sharing', 'shared', 'withdrawn')),
  model_version TEXT NOT NULL DEFAULT '0.2.0',
  imagination_count SMALLINT CHECK (imagination_count BETWEEN 1 AND 10),
  imagination_value NUMERIC(12,6),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (
    (release_gate IN ('local_only', 'eligible_for_sharing') AND visibility = 'private')
    OR release_gate IN ('shared', 'withdrawn')
  )
);

CREATE TABLE IF NOT EXISTS time_contribution_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contribution_id UUID NOT NULL REFERENCES time_legacy_contributions(id) ON DELETE CASCADE,
  revision_number INTEGER NOT NULL CHECK (revision_number > 0),
  ciphertext BYTEA NOT NULL,
  encryption_key_ref TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (contribution_id, revision_number)
);

CREATE TABLE IF NOT EXISTS time_consent_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contribution_id UUID NOT NULL REFERENCES time_legacy_contributions(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  purpose TEXT NOT NULL,
  audience TEXT NOT NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  CHECK (length(trim(purpose)) > 0 AND length(trim(audience)) > 0)
);

CREATE TABLE IF NOT EXISTS time_engine_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  secret_room_id UUID NOT NULL REFERENCES time_secret_rooms(id) ON DELETE CASCADE,
  participant_id UUID REFERENCES participants(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('draft_created', 'draft_revised', 'review_requested', 'consent_granted', 'consent_revoked', 'published', 'withdrawn')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS time_idempotency_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  idempotency_key TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('processing', 'completed', 'failed')) DEFAULT 'processing',
  response JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT now() + interval '24 hours',
  UNIQUE (participant_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_time_rooms_participant ON time_secret_rooms(participant_id);
CREATE INDEX IF NOT EXISTS idx_time_contributions_room ON time_legacy_contributions(secret_room_id);
CREATE INDEX IF NOT EXISTS idx_time_contributions_owner ON time_legacy_contributions(participant_id);
CREATE INDEX IF NOT EXISTS idx_time_consent_active ON time_consent_grants(contribution_id, expires_at) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_time_events_room_created ON time_engine_events(secret_room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_time_idempotency_expiry ON time_idempotency_keys(expires_at);

COMMENT ON TABLE time_secret_rooms IS 'Private-by-default dual-zero workspaces; 0_m and 0_f are model labels, not sex/gender inference.';
COMMENT ON TABLE time_legacy_contributions IS 'Encrypted contribution payloads; symbolic energy is not money and is not tokenized.';

-- Internal realm/layer signal outbox ("Hotflash" bridge).
-- This is application-level routing, not inter-realm or external messaging.
CREATE TABLE IF NOT EXISTS time_realm_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  consent_grant_id UUID NOT NULL REFERENCES time_consent_grants(id) ON DELETE RESTRICT,
  from_layer TEXT NOT NULL CHECK (from_layer IN ('earth-realm-2', 'ouroboros-negative', 'realm-3', 'realm-4', 'higher-order-unmapped')),
  to_layer TEXT NOT NULL CHECK (to_layer IN ('earth-realm-2', 'ouroboros-negative', 'realm-3', 'realm-4', 'higher-order-unmapped')),
  message_type TEXT NOT NULL CHECK (message_type IN ('state_transition', 'review_result', 'publication_notice', 'sync_signal')),
  payload_ciphertext BYTEA NOT NULL,
  idempotency_key TEXT NOT NULL,
  delivery_status TEXT NOT NULL DEFAULT 'queued' CHECK (delivery_status IN ('queued', 'delivered', 'cancelled', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  delivered_at TIMESTAMPTZ,
  UNIQUE (participant_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_time_realm_messages_outbox
  ON time_realm_messages(delivery_status, created_at)
  WHERE delivery_status = 'queued';

COMMENT ON TABLE time_realm_messages IS 'Consent-gated internal event outbox for application layer transitions; not a channel to external entities.';
