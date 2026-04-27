CREATE TABLE IF NOT EXISTS automations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN (
    'status_changed', 'priority_changed', 'assignee_changed',
    'due_date_passed', 'task_created'
  )),
  trigger_value TEXT,
  action_type TEXT NOT NULL CHECK (action_type IN (
    'change_status', 'change_priority', 'notify_assignee',
    'move_to_group', 'create_subtask'
  )),
  action_value TEXT,
  workspace TEXT,
  run_count INTEGER DEFAULT 0,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE automations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename='automations' AND policyname='automations_all'
  ) THEN
    CREATE POLICY "automations_all" ON automations
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
