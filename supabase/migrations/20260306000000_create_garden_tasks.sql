-- Create garden_tasks table for standalone tasks not tied to a specific plant
CREATE TABLE garden_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  frequency text NOT NULL CHECK (frequency IN ('once', 'daily', 'weekly', 'biweekly', 'monthly', 'three_months', 'six_months', 'yearly', 'custom')),
  interval_days integer,
  next_due_date date NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE garden_tasks ENABLE ROW LEVEL SECURITY;

-- RLS policies: users can only access their own rows
CREATE POLICY "Users can read own garden tasks"
  ON garden_tasks FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own garden tasks"
  ON garden_tasks FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own garden tasks"
  ON garden_tasks FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own garden tasks"
  ON garden_tasks FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Index for efficient filtering by user and due date
CREATE INDEX idx_garden_tasks_user_due_date
  ON garden_tasks (user_id, next_due_date);
