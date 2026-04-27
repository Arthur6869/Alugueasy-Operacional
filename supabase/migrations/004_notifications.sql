CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'due_soon', 'overdue', 'assigned', 'status_changed', 'comment_added'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user
  ON notifications(user_name, read, created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename='notifications' AND policyname='notif_select'
  ) THEN
    CREATE POLICY "notif_select" ON notifications
      FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename='notifications' AND policyname='notif_insert'
  ) THEN
    CREATE POLICY "notif_insert" ON notifications
      FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename='notifications' AND policyname='notif_update'
  ) THEN
    CREATE POLICY "notif_update" ON notifications
      FOR UPDATE USING (true);
  END IF;
END $$;
