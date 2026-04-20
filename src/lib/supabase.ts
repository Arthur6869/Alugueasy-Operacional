import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || supabaseUrl.includes('SEU_PROJECT_ID')) {
  console.warn('[Supabase] VITE_SUPABASE_URL não configurada. Preencha o arquivo .env');
}

if (!supabaseAnonKey || supabaseAnonKey.includes('SEU_ANON_KEY')) {
  console.warn('[Supabase] VITE_SUPABASE_ANON_KEY não configurada. Preencha o arquivo .env');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ---------------------------------------------------------------
// Tipos das tabelas principais (espelham o banco no Supabase)
// ---------------------------------------------------------------

export type TaskStatus = 'Pendente' | 'Em Andamento' | 'Revisão' | 'Concluído';
export type TaskPriority = 'Baixa' | 'Média' | 'Alta' | 'Crítica';
export type TaskGroup = 'Operacional' | 'Desenvolvimento' | 'Financeiro';
export type TeamMember = 'Arthur' | 'Yasmim' | 'Alexandre' | 'Nikolas';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  group: TaskGroup;
  assignee: TeamMember;
  due_date?: string;
  tags?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  created_by: TeamMember;
  created_at?: string;
}

export interface Comment {
  id: string;
  task_id: string;
  author: TeamMember;
  content: string;
  created_at?: string;
}

export interface Subtask {
  id: string;
  task_id: string;
  title: string;
  completed: boolean;
  created_at?: string;
}

// ---------------------------------------------------------------
// Helpers de acesso ao banco
// ---------------------------------------------------------------

export const db = {
  tasks: {
    getAll: () => supabase.from('tasks').select('*').order('created_at', { ascending: false }),
    getById: (id: string) => supabase.from('tasks').select('*').eq('id', id).single(),
    getByGroup: (group: TaskGroup) => supabase.from('tasks').select('*').eq('group', group),
    getByAssignee: (assignee: TeamMember) => supabase.from('tasks').select('*').eq('assignee', assignee),
    create: (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) =>
      supabase.from('tasks').insert(task).select().single(),
    update: (id: string, updates: Partial<Task>) =>
      supabase.from('tasks').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single(),
    delete: (id: string) => supabase.from('tasks').delete().eq('id', id),
  },

  workspaces: {
    getAll: () => supabase.from('workspaces').select('*').order('created_at', { ascending: true }),
    create: (workspace: Omit<Workspace, 'id' | 'created_at'>) =>
      supabase.from('workspaces').insert(workspace).select().single(),
    update: (id: string, updates: Partial<Workspace>) =>
      supabase.from('workspaces').update(updates).eq('id', id).select().single(),
    delete: (id: string) => supabase.from('workspaces').delete().eq('id', id),
  },

  comments: {
    getByTask: (taskId: string) =>
      supabase.from('comments').select('*').eq('task_id', taskId).order('created_at', { ascending: true }),
    create: (comment: Omit<Comment, 'id' | 'created_at'>) =>
      supabase.from('comments').insert(comment).select().single(),
  },

  subtasks: {
    getByTask: (taskId: string) =>
      supabase.from('subtasks').select('*').eq('task_id', taskId).order('created_at', { ascending: true }),
    create: (subtask: Omit<Subtask, 'id' | 'created_at'>) =>
      supabase.from('subtasks').insert(subtask).select().single(),
    toggle: (id: string, completed: boolean) =>
      supabase.from('subtasks').update({ completed }).eq('id', id),
  },
};
