import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface Automation {
  id: string;
  name: string;
  enabled: boolean;
  trigger_type: string;
  trigger_value?: string;
  action_type: string;
  action_value?: string;
  workspace?: string;
  run_count: number;
  created_by: string;
  created_at: string;
}

interface CreateAutomationParams {
  name: string;
  trigger_type: string;
  trigger_value?: string;
  action_type: string;
  action_value?: string;
  workspace?: string;
  created_by: string;
}

export function useAutomations() {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAutomations = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('automations')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) { console.error('[useAutomations] fetch:', error); return; }
      setAutomations(data ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  const createAutomation = useCallback(async (params: CreateAutomationParams) => {
    const { data, error } = await supabase
      .from('automations')
      .insert({
        name: params.name,
        trigger_type: params.trigger_type,
        trigger_value: params.trigger_value ?? null,
        action_type: params.action_type,
        action_value: params.action_value ?? null,
        workspace: params.workspace ?? null,
        created_by: params.created_by,
      })
      .select()
      .single();
    if (error) { console.error('[useAutomations] create:', error); return; }
    setAutomations(prev => [data, ...prev]);
  }, []);

  const toggleAutomation = useCallback(async (id: string, enabled: boolean) => {
    const { error } = await supabase
      .from('automations')
      .update({ enabled })
      .eq('id', id);
    if (error) { console.error('[useAutomations] toggle:', error); return; }
    setAutomations(prev => prev.map(a => a.id === id ? { ...a, enabled } : a));
  }, []);

  const deleteAutomation = useCallback(async (id: string) => {
    const { error } = await supabase.from('automations').delete().eq('id', id);
    if (error) { console.error('[useAutomations] delete:', error); return; }
    setAutomations(prev => prev.filter(a => a.id !== id));
  }, []);

  return { automations, loading, fetchAutomations, createAutomation, toggleAutomation, deleteAutomation };
}
