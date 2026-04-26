import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface Subtask {
  id: string;
  task_id: string;
  title: string;
  completed: boolean;
  position: number;
  created_at: string;
}

interface UseSubtasksReturn {
  subtasks: Subtask[];
  loading: boolean;
  fetchSubtasks: (taskId: string) => Promise<void>;
  addSubtask: (taskId: string, title: string) => Promise<void>;
  toggleSubtask: (subtaskId: string, completed: boolean) => Promise<void>;
  deleteSubtask: (subtaskId: string) => Promise<void>;
}

export function useSubtasks(): UseSubtasksReturn {
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSubtasks = useCallback(async (taskId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('subtasks')
        .select('*')
        .eq('task_id', taskId)
        .order('position', { ascending: true });

      if (error) {
        console.error('[useSubtasks] fetchSubtasks:', error);
        return;
      }
      setSubtasks(data ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  const addSubtask = useCallback(async (taskId: string, title: string) => {
    const position = subtasks.length;
    const { data, error } = await supabase
      .from('subtasks')
      .insert({ task_id: taskId, title, completed: false, position })
      .select()
      .single();

    if (error) {
      console.error('[useSubtasks] addSubtask:', error);
      return;
    }
    setSubtasks(prev => [...prev, data]);
  }, [subtasks.length]);

  const toggleSubtask = useCallback(async (subtaskId: string, completed: boolean) => {
    const { error } = await supabase
      .from('subtasks')
      .update({ completed, updated_at: new Date().toISOString() })
      .eq('id', subtaskId);

    if (error) {
      console.error('[useSubtasks] toggleSubtask:', error);
      return;
    }
    setSubtasks(prev =>
      prev.map(s => s.id === subtaskId ? { ...s, completed } : s)
    );
  }, []);

  const deleteSubtask = useCallback(async (subtaskId: string) => {
    const { error } = await supabase
      .from('subtasks')
      .delete()
      .eq('id', subtaskId);

    if (error) {
      console.error('[useSubtasks] deleteSubtask:', error);
      return;
    }
    setSubtasks(prev => prev.filter(s => s.id !== subtaskId));
  }, []);

  return { subtasks, loading, fetchSubtasks, addSubtask, toggleSubtask, deleteSubtask };
}
