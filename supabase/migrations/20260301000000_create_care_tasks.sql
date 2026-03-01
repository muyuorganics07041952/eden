-- PROJ-4: Care Management — care_tasks table

CREATE TABLE care_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id UUID NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily','weekly','biweekly','monthly','three_months','six_months','yearly','custom')),
  interval_days INTEGER NOT NULL CHECK (interval_days > 0),
  next_due_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for common query patterns
CREATE INDEX idx_care_tasks_user_due ON care_tasks (user_id, next_due_date);
CREATE INDEX idx_care_tasks_plant ON care_tasks (plant_id);

-- Enable Row Level Security
ALTER TABLE care_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies: owner-only access
CREATE POLICY "care_tasks_select_own" ON care_tasks
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "care_tasks_insert_own" ON care_tasks
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "care_tasks_update_own" ON care_tasks
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "care_tasks_delete_own" ON care_tasks
  FOR DELETE USING (user_id = auth.uid());
