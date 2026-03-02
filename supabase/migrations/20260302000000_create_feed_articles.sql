-- PROJ-6: Content Feed — feed_articles table

CREATE TABLE feed_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) <= 200),
  summary TEXT NOT NULL CHECK (char_length(summary) <= 150),
  content TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Bewässerung', 'Düngung', 'Schädlinge & Krankheiten', 'Saisonales', 'Allgemein')),
  reading_time SMALLINT NOT NULL CHECK (reading_time >= 1),
  title_hash TEXT NOT NULL UNIQUE,
  plant_context JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for common query patterns
CREATE INDEX idx_feed_articles_user ON feed_articles (user_id);
CREATE INDEX idx_feed_articles_created ON feed_articles (created_at DESC);
CREATE INDEX idx_feed_articles_user_created ON feed_articles (user_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE feed_articles ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- SELECT: authenticated users can read general articles (user_id IS NULL)
-- or their own personalized articles (user_id = auth.uid())
CREATE POLICY "feed_articles_select" ON feed_articles
  FOR SELECT USING (
    user_id IS NULL OR user_id = auth.uid()
  );

-- INSERT/UPDATE/DELETE: service role only (no user-facing mutations)
-- No policies for INSERT, UPDATE, DELETE means only service_role can perform them
-- (RLS is enabled, so default-deny applies for non-service-role connections)
