CREATE TABLE IF NOT EXISTS activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  author TEXT NOT NULL,
  action TEXT NOT NULL,
  field TEXT,
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_task_id
  ON activity_log(task_id);

ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'activity_log' AND policyname = 'activity_select'
  ) THEN
    CREATE POLICY "activity_select" ON activity_log
      FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'activity_log' AND policyname = 'activity_insert'
  ) THEN
    CREATE POLICY "activity_insert" ON activity_log
      FOR INSERT WITH CHECK (true);
  END IF;
END $$;
