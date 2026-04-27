-- Social Media Queue: Posts warten auf Genehmigung
CREATE TABLE social_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL CHECK (platform IN ('reddit', 'pinterest')),
  type TEXT NOT NULL CHECK (type IN ('comment', 'pin')),

  -- Quelle (Reddit-Post worauf geantwortet wird)
  source_url TEXT,
  source_title TEXT,
  source_body TEXT,

  -- Generierter Inhalt
  generated_content TEXT NOT NULL,
  image_url TEXT, -- für Pinterest Pins

  -- Subreddit oder Pinterest Board
  target TEXT, -- z.B. "r/pflanzenbestimmung" oder "Pflanzenpflege"

  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'posted')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  posted_at TIMESTAMPTZ,
  posted_url TEXT -- Link zum veröffentlichten Post
);

-- Social Media History: alle veröffentlichten Posts
CREATE TABLE social_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL,
  type TEXT NOT NULL,
  target TEXT,
  content TEXT NOT NULL,
  image_url TEXT,
  source_url TEXT,
  posted_url TEXT,
  posted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX social_queue_status_idx ON social_queue (status, created_at DESC);
CREATE INDEX social_queue_platform_idx ON social_queue (platform);
CREATE INDEX social_history_platform_idx ON social_history (platform, posted_at DESC);

-- RLS: nur Service Role kann schreiben (Agent), Admin liest via Service Role
ALTER TABLE social_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_history ENABLE ROW LEVEL SECURITY;

-- Keine öffentlichen Policies — ausschließlich via Service Role Key zugänglich
