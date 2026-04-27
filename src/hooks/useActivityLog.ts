import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface ActivityEntry {
  id: string;
  task_id: string;
  author: string;
  action: string;
  field?: string;
  old_value?: string;
  new_value?: string;
  created_at: string;
}

interface LogActivityParams {
  taskId: string;
  author: string;
  action: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
}

interface UseActivityLogReturn {
  activities: ActivityEntry[];
  loading: boolean;
  fetchActivities: (taskId: string) => Promise<void>;
  logActivity: (params: LogActivityParams) => Promise<void>;
}

export function useActivityLog(): UseActivityLogReturn {
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchActivities = useCallback(async (taskId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('activity_log')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[useActivityLog] fetchActivities:', error);
        return;
      }
      setActivities(data ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  const logActivity = useCallback(async ({
    taskId,
    author,
    action,
    field,
    oldValue,
    newValue,
  }: LogActivityParams) => {
    const { error } = await supabase
      .from('activity_log')
      .insert({
        task_id: taskId,
        author,
        action,
        field: field ?? null,
        old_value: oldValue ?? null,
        new_value: newValue ?? null,
      });

    if (error) {
      console.error('[useActivityLog] logActivity:', error);
      return;
    }

    // Optimistic prepend — mais recente primeiro
    setActivities(prev => [{
      id: crypto.randomUUID(),
      task_id: taskId,
      author,
      action,
      field,
      old_value: oldValue,
      new_value: newValue,
      created_at: new Date().toISOString(),
    }, ...prev]);
  }, []);

  return { activities, loading, fetchActivities, logActivity };
}
