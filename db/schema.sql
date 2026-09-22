CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'participant',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL CHECK (status IN ('active', 'suspended', 'revoked'))
);

CREATE TABLE loops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purpose TEXT NOT NULL,
  health TEXT NOT NULL CHECK (health IN ('healthy', 'stalled', 'dissolving', 'auditing')),
  status TEXT NOT NULL CHECK (status IN ('active', 'archived')) DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE intention_vectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loop_id UUID NOT NULL REFERENCES loops(id) ON DELETE CASCADE,
  author UUID NOT NULL REFERENCES participants(id),
  purpose TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  signature TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'expired', 'revoked')) DEFAULT 'active'
);

CREATE TABLE consent_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loop_id UUID NOT NULL REFERENCES loops(id) ON DELETE CASCADE,
  from_participant UUID NOT NULL REFERENCES participants(id),
  to_participant UUID NOT NULL REFERENCES participants(id),
  scope TEXT NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL CHECK (status IN ('active', 'expired', 'revoked')) DEFAULT 'active'
);

CREATE TABLE loop_participants (
  loop_id UUID NOT NULL REFERENCES loops(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES participants(id),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (loop_id, participant_id)
);

CREATE TABLE scaffolds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loop_id UUID NOT NULL REFERENCES loops(id) ON DELETE CASCADE,
  builder_participant_id UUID NOT NULL REFERENCES participants(id),
  built_upon_participant_id UUID NOT NULL REFERENCES participants(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'dissolving', 'dissolved')) DEFAULT 'active',
  agency_gain_metric NUMERIC(10,4) NOT NULL DEFAULT 0
);

CREATE TABLE loop_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loop_id UUID NOT NULL REFERENCES loops(id) ON DELETE CASCADE,
  participant_id UUID REFERENCES participants(id),
  event_type TEXT NOT NULL,
  details JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE loop_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loop_id UUID NOT NULL REFERENCES loops(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_intention_vectors_loop_id ON intention_vectors(loop_id);
CREATE INDEX idx_consent_tokens_loop_id ON consent_tokens(loop_id);
CREATE INDEX idx_consent_tokens_active ON consent_tokens(loop_id, status, expires_at) WHERE revoked = false;
CREATE INDEX idx_scaffolds_loop_id ON scaffolds(loop_id);
CREATE INDEX idx_loop_audits_loop_id ON loop_audits(loop_id);
