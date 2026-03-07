-- Add seasonal scheduling columns to garden_tasks and care_tasks
-- Both fields must be either both NULL or both NOT NULL

-- Garden tasks
ALTER TABLE garden_tasks
  ADD COLUMN active_month_start INTEGER CHECK (active_month_start BETWEEN 1 AND 12),
  ADD COLUMN active_month_end INTEGER CHECK (active_month_end BETWEEN 1 AND 12);

ALTER TABLE garden_tasks
  ADD CONSTRAINT garden_tasks_season_both_or_neither
  CHECK (
    (active_month_start IS NULL AND active_month_end IS NULL)
    OR (active_month_start IS NOT NULL AND active_month_end IS NOT NULL)
  );

-- Care tasks
ALTER TABLE care_tasks
  ADD COLUMN active_month_start INTEGER CHECK (active_month_start BETWEEN 1 AND 12),
  ADD COLUMN active_month_end INTEGER CHECK (active_month_end BETWEEN 1 AND 12);

ALTER TABLE care_tasks
  ADD CONSTRAINT care_tasks_season_both_or_neither
  CHECK (
    (active_month_start IS NULL AND active_month_end IS NULL)
    OR (active_month_start IS NOT NULL AND active_month_end IS NOT NULL)
  );
