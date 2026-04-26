CREATE TABLE IF NOT EXISTS subtasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) > 0),
  completed BOOLEAN DEFAULT false,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subtasks_task_id ON subtasks(task_id);

ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subtasks_select" ON subtasks FOR SELECT USING (true);
CREATE POLICY "subtasks_insert" ON subtasks FOR INSERT WITH CHECK (true);
CREATE POLICY "subtasks_update" ON subtasks FOR UPDATE USING (true);
CREATE POLICY "subtasks_delete" ON subtasks FOR DELETE USING (true);
