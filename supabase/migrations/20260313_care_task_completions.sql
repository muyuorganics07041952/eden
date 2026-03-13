-- PROJ-18: Care Task Completion History
-- Stores a record every time a user completes a care task,
-- including an optional note and a snapshot of the task name.

CREATE TABLE care_task_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plant_id UUID NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
  task_id UUID REFERENCES care_tasks(id) ON DELETE SET NULL,
  task_name TEXT NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT CHECK (char_length(notes) <= 500)
);

-- Row Level Security
ALTER TABLE care_task_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own completions"
  ON care_task_completions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own completions"
  ON care_task_completions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own completions"
  ON care_task_completions FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes for performance
-- Primary query: all completions for a plant, ordered by date (newest first)
CREATE INDEX idx_care_task_completions_plant_date
  ON care_task_completions(plant_id, completed_at DESC);

-- Secondary: lookup by user for potential cross-plant views
CREATE INDEX idx_care_task_completions_user_id
  ON care_task_completions(user_id);
