import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { supabase } from './supabase';
import { format, isToday, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useActivityLog } from '../hooks/useActivityLog';
import { Automation } from '../hooks/useAutomations';

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
  created_at?: string;
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

const TEAM_MEMBERS = ['Arthur', 'Yasmim', 'Alexandre', 'Nikolas'];

async function createNotifDirect(
  userName: string,
  type: string,
  title: string,
  message: string,
  taskId?: string,
) {
  await supabase.from('notifications').insert({
    user_name: userName,
    type,
    title,
    message,
    task_id: taskId ?? null,
  });
  // Errors intentionally ignored — notifications are non-critical
}

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
    created_at: row.created_at,
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

  // Automações
  automations: Automation[];
  setAutomations: React.Dispatch<React.SetStateAction<Automation[]>>;
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
  const [automations, setAutomations] = useState<Automation[]>([]);

  // Ref para acessar tasks atuais dentro de useCallback sem adicionar 'tasks' como dep
  const tasksRef = useRef<Task[]>([]);
  useEffect(() => { tasksRef.current = tasks; }, [tasks]);

  // Ref para acessar automations dentro de callbacks sem adicionar como dep
  const automationsRef = useRef<Automation[]>([]);
  useEffect(() => { automationsRef.current = automations; }, [automations]);

  // Flag para verificar prazos apenas uma vez por carregamento
  const dueSoonChecked = useRef(false);

  const { logActivity } = useActivityLog();

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

  // Realtime — sincroniza mudanças feitas por outros membros sem refresh
  useEffect(() => {
    const channel = supabase
      .channel('tasks-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newTask = rowToTask(payload.new);
            setTasks(prev =>
              prev.find(t => t.id === newTask.id) ? prev : [newTask, ...prev]
            );
          }
          if (payload.eventType === 'UPDATE') {
            setTasks(prev => prev.map(t => {
              if (t.id !== payload.new.id) return t;
              const updated = rowToTask(payload.new);
              return { ...updated, comments: payload.new.comment_count ?? t.comments };
            }));
          }
          if (payload.eventType === 'DELETE') {
            setTasks(prev => prev.filter(t => t.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Verifica prazos vencendo/vencidos uma vez após o carregamento inicial
  useEffect(() => {
    if (loading || dueSoonChecked.current || tasks.length === 0) return;
    dueSoonChecked.current = true;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setDate(today.getDate() + 2);
    const dateKey = today.toISOString().split('T')[0];

    tasks
      .filter(t => t.status !== 'Concluído' && t.due_date)
      .forEach((task) => {
        const storageKey = `notif_check_${dateKey}_${task.id}`;
        if (localStorage.getItem(storageKey)) return;

        const dueDate = new Date(task.due_date! + 'T00:00:00');

        if (dueDate < today) {
          localStorage.setItem(storageKey, '1');
          createNotifDirect(task.assignee, 'overdue', 'Tarefa atrasada', `"${task.name}" está atrasada desde ${task.date}`, task.id);
        } else if (dueDate < dayAfterTomorrow) {
          localStorage.setItem(storageKey, '1');
          const isDueToday = dueDate.getTime() === today.getTime();
          createNotifDirect(task.assignee, 'due_soon', 'Prazo se aproximando', `"${task.name}" vence ${isDueToday ? 'hoje' : 'amanhã'}`, task.id);
        }
      });
  }, [loading, tasks]);

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
    // Notificar o responsável da nova tarefa
    createNotifDirect(task.assignee, 'assigned', 'Nova tarefa atribuída', `Uma nova tarefa "${task.name}" foi atribuída para você`, task.id);
    return task;
  }, []);

  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    const currentTask = tasksRef.current.find(t => t.id === id);

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

    // Registrar log de atividade para cada campo alterado
    if (!currentTask) return;
    const author = currentTask.assignee;
    const logs: Promise<void>[] = [];

    if (updates.status && updates.status !== currentTask.status) {
      logs.push(logActivity({ taskId: id, author, action: 'alterou o status', field: 'status', oldValue: currentTask.status, newValue: updates.status }));
    }
    if (updates.priority && updates.priority !== currentTask.priority) {
      logs.push(logActivity({ taskId: id, author, action: 'alterou a prioridade', field: 'prioridade', oldValue: currentTask.priority, newValue: updates.priority }));
    }
    if (updates.assignee && updates.assignee !== currentTask.assignee) {
      logs.push(logActivity({ taskId: id, author, action: 'alterou o responsável', field: 'responsável', oldValue: currentTask.assignee, newValue: updates.assignee }));
    }
    if (updates.due_date !== undefined && updates.due_date !== currentTask.due_date) {
      logs.push(logActivity({ taskId: id, author, action: 'alterou a data de entrega', field: 'prazo', oldValue: currentTask.due_date ?? 'sem prazo', newValue: updates.due_date ?? 'sem prazo' }));
    }
    if (updates.name && updates.name !== currentTask.name) {
      logs.push(logActivity({ taskId: id, author, action: 'renomeou a tarefa', field: 'título', oldValue: currentTask.name, newValue: updates.name }));
    }

    await Promise.all(logs);

    // Notificações de eventos relevantes
    const notifPromises: Promise<void>[] = [];
    if (updates.assignee && updates.assignee !== currentTask.assignee) {
      notifPromises.push(createNotifDirect(
        updates.assignee, 'assigned', 'Nova tarefa atribuída',
        `${currentTask.assignee} atribuiu "${currentTask.name}" para você`, id,
      ));
    }
    if (updates.status === 'Concluído' && updates.status !== currentTask.status) {
      TEAM_MEMBERS.forEach(member => notifPromises.push(createNotifDirect(
        member, 'status_changed', 'Tarefa concluída',
        `${currentTask.assignee} concluiu "${currentTask.name}"`, id,
      )));
    }
    if (notifPromises.length > 0) await Promise.all(notifPromises);

    // Motor de automações
    const newTask = tasksRef.current.find(t => t.id === id);
    if (newTask) await runAutomations(currentTask, newTask, automationsRef.current);
  }, [logActivity]);

  async function runAutomations(oldTask: Task, newTask: Task, autos: Automation[]) {
    for (const auto of autos.filter(a => a.enabled)) {
      let triggered = false;

      if (auto.trigger_type === 'status_changed' &&
          oldTask.status !== newTask.status &&
          newTask.status === auto.trigger_value) {
        triggered = true;
      }
      if (auto.trigger_type === 'priority_changed' &&
          oldTask.priority !== newTask.priority &&
          newTask.priority === auto.trigger_value) {
        triggered = true;
      }
      if (auto.trigger_type === 'assignee_changed' &&
          oldTask.assignee !== newTask.assignee) {
        triggered = true;
      }

      if (!triggered) continue;

      if (auto.action_type === 'change_status' && auto.action_value) {
        await supabase.from('tasks').update({ status: auto.action_value }).eq('id', newTask.id);
        setTasks(prev => prev.map(t => t.id === newTask.id ? { ...t, status: auto.action_value as TaskStatus } : t));
      }
      if (auto.action_type === 'change_priority' && auto.action_value) {
        await supabase.from('tasks').update({ priority: auto.action_value }).eq('id', newTask.id);
        setTasks(prev => prev.map(t => t.id === newTask.id ? { ...t, priority: auto.action_value as TaskPriority } : t));
      }
      if (auto.action_type === 'notify_assignee' && newTask.assignee) {
        await createNotifDirect(
          newTask.assignee, 'status_changed', 'Automação executada',
          `Regra "${auto.name}" foi ativada na tarefa "${newTask.name}"`, newTask.id,
        );
      }
      if (auto.action_type === 'create_subtask' && auto.action_value) {
        await supabase.from('subtasks').insert({ task_id: newTask.id, title: auto.action_value, completed: false });
      }

      await supabase
        .from('automations')
        .update({ run_count: auto.run_count + 1 })
        .eq('id', auto.id);
      setAutomations(prev => prev.map(a => a.id === auto.id ? { ...a, run_count: a.run_count + 1 } : a));
    }
  }

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
      automations, setAutomations,
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
