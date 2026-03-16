-- ============================================================
-- PROJ-19: Community Plant Tips — Bug Fixes
-- BUG-10: Add author_name snapshot columns to both tables
-- BUG-3:  Make community-tips storage bucket private
-- BUG-2+4: Create RPC for safe bidirectional plant matching
-- ============================================================

-- 1. Add created_at to community_tip_likes for rate limiting (NEW-BUG-4)
ALTER TABLE community_tip_likes ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
CREATE INDEX IF NOT EXISTS idx_community_tip_likes_user_time ON community_tip_likes (user_id, created_at);

-- 2. Snapshot author name on community_tips (BUG-10)
ALTER TABLE community_tips ADD COLUMN IF NOT EXISTS author_name TEXT;

-- 2. Snapshot author name on community_tip_comments (BUG-10)
ALTER TABLE community_tip_comments ADD COLUMN IF NOT EXISTS author_name TEXT;

-- 3. Make the storage bucket private (BUG-3)
--    Signed URLs are now used via the API; direct public access is disabled.
UPDATE storage.buckets SET public = false WHERE id = 'community-tips';

-- 4. RPC: safe bidirectional ILIKE matching (BUG-2 + BUG-4)
--    Matches tips where the stored plant_name is contained in the search term
--    OR the search term is contained in the stored plant_name (bidirectional).
--    Optional species matching follows the same bidirectional logic.
CREATE OR REPLACE FUNCTION get_community_tips_for_plant(
  p_plant_name TEXT,
  p_species    TEXT DEFAULT NULL
)
RETURNS SETOF community_tips
LANGUAGE sql
SECURITY INVOKER
STABLE
AS $$
  SELECT *
  FROM community_tips
  WHERE
    plant_name ILIKE ('%' || p_plant_name || '%')
    OR p_plant_name ILIKE ('%' || plant_name || '%')
    OR (
      p_species IS NOT NULL
      AND plant_species IS NOT NULL
      AND (
        plant_species ILIKE ('%' || p_species || '%')
        OR p_species ILIKE ('%' || plant_species || '%')
      )
    )
  ORDER BY likes_count DESC, created_at DESC
  LIMIT 50;
$$;

GRANT EXECUTE ON FUNCTION get_community_tips_for_plant(TEXT, TEXT) TO authenticated;
