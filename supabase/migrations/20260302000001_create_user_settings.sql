-- PROJ-7: Garden Dashboard — user_settings table

CREATE TABLE user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  city_name TEXT,
  latitude FLOAT8,
  longitude FLOAT8,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies: owner-only access
CREATE POLICY "user_settings_select_own" ON user_settings
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "user_settings_insert_own" ON user_settings
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_settings_update_own" ON user_settings
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "user_settings_delete_own" ON user_settings
  FOR DELETE USING (user_id = auth.uid());

-- Trigger function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on user_settings
CREATE TRIGGER set_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
