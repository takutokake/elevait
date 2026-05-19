-- ── Step 1: Add AI-intelligence columns to applications ──────────────────────
-- All columns are nullable / have defaults so existing rows are unaffected.

ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS interview_date      timestamptz,
  ADD COLUMN IF NOT EXISTS interview_type      text,
  ADD COLUMN IF NOT EXISTS action_items        jsonb        DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS ai_summary          text,
  ADD COLUMN IF NOT EXISTS ai_confidence       text,
  ADD COLUMN IF NOT EXISTS last_email_at       timestamptz,
  ADD COLUMN IF NOT EXISTS next_action_source  text         DEFAULT 'manual';

-- ── Step 2: application_email_events ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS application_email_events (
  id                        uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id            uuid        NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  user_id                   uuid        NOT NULL REFERENCES auth.users(id)   ON DELETE CASCADE,
  gmail_message_id          text        UNIQUE NOT NULL,
  gmail_thread_id           text        NOT NULL,
  received_at               timestamptz NOT NULL,
  subject                   text,
  from_address              text,
  extracted_stage           text,
  extracted_role            text,
  extracted_interview_date  timestamptz,
  extracted_interview_type  text,
  extracted_action_items    jsonb,
  ai_summary                text,
  ai_confidence             text,
  created_at                timestamptz DEFAULT now()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
-- gmail_message_id is already indexed by its UNIQUE constraint.
CREATE INDEX IF NOT EXISTS idx_app_email_events_application
  ON application_email_events (application_id);

CREATE INDEX IF NOT EXISTS idx_app_email_events_user
  ON application_email_events (user_id);

CREATE INDEX IF NOT EXISTS idx_app_email_events_received
  ON application_email_events (received_at DESC);

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE application_email_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own email events" ON application_email_events;
CREATE POLICY "Users can view own email events"
  ON application_email_events FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own email events" ON application_email_events;
CREATE POLICY "Users can insert own email events"
  ON application_email_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);
-- Note: service role bypasses RLS automatically — no extra policy needed.
