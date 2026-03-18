-- ============================================================
-- PROJ-20: In-App Feedback
-- Table: feedback
-- ============================================================

CREATE TABLE feedback (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  type       TEXT        NOT NULL CHECK (type IN ('bug', 'idea', 'praise')),
  text       TEXT        NOT NULL CHECK (char_length(text) >= 10 AND char_length(text) <= 1000),
  page_url   TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_feedback_user_id    ON feedback (user_id);
CREATE INDEX idx_feedback_type       ON feedback (type);
CREATE INDEX idx_feedback_created_at ON feedback (created_at DESC);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Users can insert their own feedback
CREATE POLICY "feedback_insert" ON feedback
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can only read their own feedback
CREATE POLICY "feedback_select" ON feedback
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- No UPDATE or DELETE — feedback is immutable once submitted
