-- Add tags column to plants table for search & filter (PROJ-16)
ALTER TABLE plants ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}' NOT NULL;

-- GIN index for efficient array queries (e.g. @> operator for tag filtering)
CREATE INDEX IF NOT EXISTS plants_tags_gin_idx ON plants USING GIN(tags);
