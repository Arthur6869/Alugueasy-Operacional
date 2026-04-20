import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from './supabase';
import { format, isToday, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ---------------------------------------------------------------
// Tipos UI (o que os componentes esperam)
// ---------------------------------------------------------------

export type TaskStatus = 'Pendente' | 'Em Andamento' | 'Revisão' | 'Concluído';
export type TaskPriority = 'Baixa' | 'Média' | 'Alta' | 'Crítica';
export type TaskGroup = 'Operacional' | 'Desenvolvimento' | 'Financeiro';
export type TeamMember = 'Arthur' | 'Yasmim' | 'Alexandre' | 'Nikolas';

export interface Task {
  id: string;
  name: string;
  assignee: TeamMember;
  status: TaskStatus;
  priority: TaskPriority;
  date: string;
  due_date?: string;
  tags: string[];
  comments: number;
  group: TaskGroup;
  description?: string;
}

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  created_by?: TeamMember;
}

export interface NewTaskPayload {
  title: string;
  description?: string;
  group: TaskGroup;
  assignee: TeamMember;
  status: TaskStatus;
  priority: TaskPriority;
  due_date?: string;
  tags?: string[];
}

// ---------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------

function formatDisplayDate(isoDate?: string): string {
  if (!isoDate) return 'Sem prazo';
  try {
    const d = parseISO(isoDate);
    if (isToday(d)) return 'Hoje';
    return format(d, 'dd MMM', { locale: ptBR });
  } catch {
    return isoDate;
  }
}

function rowToTask(row: any): Task {
  return {
    id: row.id,
    name: row.title,
    assignee: row.assignee,
    status: row.status,
    priority: row.priority,
    group: row.group,
    date: formatDisplayDate(row.due_date),
    due_date: row.due_date,
    tags: row.tags ?? [],
    comments: row.comment_count ?? 0,
    description: row.description,
  };
}

function rowToWorkspace(row: any): Workspace {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    icon: row.icon,
    color: row.color,
    created_by: row.created_by,
  };
}

// ---------------------------------------------------------------
// Contexto
// ---------------------------------------------------------------

interface TasksContextValue {
  tasks: Task[];
  workspaces: Workspace[];
  loading: boolean;
  error: string | null;

  // Tarefas
  addTask: (payload: NewTaskPayload) => Promise<Task | null>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  refreshTasks: () => Promise<void>;

  // Workspaces
  addWorkspace: (w: Omit<Workspace, 'id'> & { created_by: TeamMember }) => Promise<Workspace | null>;
  updateWorkspace: (id: string, updates: Partial<Workspace>) => Promise<void>;
  deleteWorkspace: (id: string) => Promise<void>;
}

const TasksContext = createContext<TasksContextValue | null>(null);

// ---------------------------------------------------------------
// Provider
// ---------------------------------------------------------------

export function TasksProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [{ data: taskRows, error: tErr }, { data: wsRows, error: wErr }] = await Promise.all([
        supabase.from('tasks').select('*').order('created_at', { ascending: false }),
        supabase.from('workspaces').select('*').order('created_at', { ascending: true }),
      ]);

      if (tErr) throw tErr;
      if (wErr) throw wErr;

      setTasks((taskRows ?? []).map(rowToTask));
      setWorkspaces((wsRows ?? []).map(rowToWorkspace));
    } catch (e: any) {
      setError(e?.message ?? 'Erro ao carregar dados');
      console.error('[TasksContext] fetchAll error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // --- Tarefas ---

  const addTask = useCallback(async (payload: NewTaskPayload): Promise<Task | null> => {
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        title: payload.title,
        description: payload.description,
        status: payload.status,
        priority: payload.priority,
        group: payload.group,
        assignee: payload.assignee,
        due_date: payload.due_date,
        tags: payload.tags ?? [],
      })
      .select()
      .single();

    if (error) { console.error('[TasksContext] addTask:', error); return null; }

    const task = rowToTask(data);
    setTasks(prev => [task, ...prev]);
    return task;
  }, []);

  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    const dbUpdates: any = { updated_at: new Date().toISOString() };
    if (updates.name !== undefined) dbUpdates.title = updates.name;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
    if (updates.assignee !== undefined) dbUpdates.assignee = updates.assignee;
    if (updates.group !== undefined) dbUpdates.group = updates.group;
    if (updates.due_date !== undefined) dbUpdates.due_date = updates.due_date;
    if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
    if (updates.description !== undefined) dbUpdates.description = updates.description;

    const { error } = await supabase.from('tasks').update(dbUpdates).eq('id', id);
    if (error) { console.error('[TasksContext] updateTask:', error); return; }

    setTasks(prev => prev.map(t =>
      t.id === id
        ? { ...t, ...updates, date: updates.due_date ? formatDisplayDate(updates.due_date) : t.date }
        : t
    ));
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) { console.error('[TasksContext] deleteTask:', error); return; }
    setTasks(prev => prev.filter(t => t.id !== id));
  }, []);

  const refreshTasks = useCallback(() => fetchAll(), [fetchAll]);

  // --- Workspaces ---

  const addWorkspace = useCallback(async (w: Omit<Workspace, 'id'> & { created_by: TeamMember }): Promise<Workspace | null> => {
    const { data, error } = await supabase
      .from('workspaces')
      .insert({ name: w.name, description: w.description, icon: w.icon, color: w.color, created_by: w.created_by })
      .select()
      .single();

    if (error) { console.error('[TasksContext] addWorkspace:', error); return null; }

    const workspace = rowToWorkspace(data);
    setWorkspaces(prev => [...prev, workspace]);
    return workspace;
  }, []);

  const updateWorkspace = useCallback(async (id: string, updates: Partial<Workspace>) => {
    const { error } = await supabase.from('workspaces').update(updates).eq('id', id);
    if (error) { console.error('[TasksContext] updateWorkspace:', error); return; }
    setWorkspaces(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w));
  }, []);

  const deleteWorkspace = useCallback(async (id: string) => {
    const { error } = await supabase.from('workspaces').delete().eq('id', id);
    if (error) { console.error('[TasksContext] deleteWorkspace:', error); return; }
    setWorkspaces(prev => prev.filter(w => w.id !== id));
  }, []);

  return (
    <TasksContext.Provider value={{
      tasks, workspaces, loading, error,
      addTask, updateTask, deleteTask, refreshTasks,
      addWorkspace, updateWorkspace, deleteWorkspace,
    }}>
      {children}
    </TasksContext.Provider>
  );
}

// ---------------------------------------------------------------
// Hook
// ---------------------------------------------------------------

export function useTasksContext(): TasksContextValue {
  const ctx = useContext(TasksContext);
  if (!ctx) throw new Error('useTasksContext deve ser usado dentro de TasksProvider');
  return ctx;
}
