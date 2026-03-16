-- ============================================================
-- PROJ-19: Community Plant Tips
-- Tables: community_tips, community_tip_likes,
--         community_tip_comments, community_tip_reports
-- ============================================================

-- 1. community_tips
CREATE TABLE community_tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  plant_name TEXT NOT NULL,
  plant_species TEXT,
  text TEXT NOT NULL CHECK (char_length(text) <= 500),
  photo_path TEXT,
  likes_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_community_tips_plant ON community_tips (plant_name, plant_species);
CREATE INDEX idx_community_tips_likes ON community_tips (likes_count DESC, created_at DESC);

ALTER TABLE community_tips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "community_tips_select" ON community_tips
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "community_tips_insert" ON community_tips
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "community_tips_delete" ON community_tips
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- 2. community_tip_likes
CREATE TABLE community_tip_likes (
  tip_id UUID NOT NULL REFERENCES community_tips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  PRIMARY KEY (tip_id, user_id)
);

CREATE INDEX idx_community_tip_likes_tip ON community_tip_likes (tip_id);

ALTER TABLE community_tip_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "community_tip_likes_select" ON community_tip_likes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "community_tip_likes_insert" ON community_tip_likes
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "community_tip_likes_delete" ON community_tip_likes
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- 3. community_tip_comments
CREATE TABLE community_tip_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tip_id UUID NOT NULL REFERENCES community_tips(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  text TEXT NOT NULL CHECK (char_length(text) <= 300),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_community_tip_comments_tip ON community_tip_comments (tip_id);

ALTER TABLE community_tip_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "community_tip_comments_select" ON community_tip_comments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "community_tip_comments_insert" ON community_tip_comments
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "community_tip_comments_delete" ON community_tip_comments
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- 4. community_tip_reports
CREATE TABLE community_tip_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tip_id UUID NOT NULL REFERENCES community_tips(id) ON DELETE CASCADE,
  reporter_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tip_id, reporter_user_id)
);

ALTER TABLE community_tip_reports ENABLE ROW LEVEL SECURITY;

-- No SELECT policy: reports are service-role only
CREATE POLICY "community_tip_reports_insert" ON community_tip_reports
  FOR INSERT TO authenticated WITH CHECK (reporter_user_id = auth.uid());

-- No DELETE policy: nobody can delete reports

-- 5. Trigger: keep likes_count in sync
CREATE OR REPLACE FUNCTION update_community_tip_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_tips
      SET likes_count = likes_count + 1
      WHERE id = NEW.tip_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_tips
      SET likes_count = GREATEST(likes_count - 1, 0)
      WHERE id = OLD.tip_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_community_tip_likes_count
  AFTER INSERT OR DELETE ON community_tip_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_community_tip_likes_count();

-- 6. Storage bucket for tip photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('community-tips', 'community-tips', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: authenticated users can upload to their own folder
CREATE POLICY "community_tips_storage_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'community-tips'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated users can read all files in the bucket
CREATE POLICY "community_tips_storage_select"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'community-tips');

-- Users can delete their own uploaded files
CREATE POLICY "community_tips_storage_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'community-tips'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
