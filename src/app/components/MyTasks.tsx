import { CheckCircle2, Clock, Eye, Plus, Loader2, Flame } from 'lucide-react';
import { StatusPill } from './StatusPill';
import { PriorityIndicator } from './PriorityIndicator';
import { useTasksContext } from '../../lib/TasksContext';

interface MyTasksProps {
  currentUser: 'Arthur' | 'Yasmim' | 'Alexandre' | 'Nikolas';
}

const groupColors: Record<string, string> = {
  Operacional: '#3b82f6',
  Desenvolvimento: '#8b5cf6',
  Financeiro: '#10b981',
};

const priorityColor: Record<string, string> = {
  'Crítica': 'bg-rose-500',
  'Alta': 'bg-orange-400',
  'Média': 'bg-blue-400',
  'Baixa': 'bg-slate-300',
};

export function MyTasks({ currentUser }: MyTasksProps) {
  const { tasks, loading } = useTasksContext();
  const myTasks = tasks.filter(t => t.assignee === currentUser);
  const pending = myTasks.filter(t => t.status === 'Pendente' || t.status === 'Em Andamento');
  const completed = myTasks.filter(t => t.status === 'Concluído');
  const review = myTasks.filter(t => t.status === 'Revisão');
  const critical = myTasks.filter(t => t.priority === 'Crítica' || t.priority === 'Alta');

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 size={22} className="animate-spin" />
          <span className="text-sm">Carregando suas tarefas...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="p-4 md:p-6 lg:p-8 space-y-5 pb-12 max-w-5xl mx-auto">

        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Tarefas</p>
            <h1 className="text-2xl font-semibold text-foreground">Minhas Tarefas</h1>
          </div>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('openNewTask'))}
            className="hidden sm:inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-[#1E3A5F] text-white text-sm font-medium hover:bg-[#2A4F7C] transition-colors"
          >
            <Plus size={15} />
            Nova Tarefa
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
                <Clock size={17} className="text-amber-600" />
              </div>
            </div>
            <div className="text-2xl md:text-3xl font-bold text-foreground leading-none mb-1">{pending.length}</div>
            <div className="text-xs font-medium text-muted-foreground">Em Aberto</div>
          </div>

          <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
                <Eye size={17} className="text-amber-600" />
              </div>
            </div>
            <div className="text-2xl md:text-3xl font-bold text-foreground leading-none mb-1">{review.length}</div>
            <div className="text-xs font-medium text-muted-foreground">Em Revisão</div>
          </div>

          <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
                <CheckCircle2 size={17} className="text-emerald-600" />
              </div>
            </div>
            <div className="text-2xl md:text-3xl font-bold text-foreground leading-none mb-1">{completed.length}</div>
            <div className="text-xs font-medium text-muted-foreground">Concluídas</div>
          </div>

          <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-lg bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center">
                <Flame size={17} className="text-rose-600" />
              </div>
            </div>
            <div className="text-2xl md:text-3xl font-bold text-foreground leading-none mb-1">{critical.length}</div>
            <div className="text-xs font-medium text-muted-foreground">Alta Prioridade</div>
          </div>
        </div>

        {/* Tasks List */}
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Todas as Tarefas</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{myTasks.length} tarefa{myTasks.length !== 1 ? 's' : ''} atribuída{myTasks.length !== 1 ? 's' : ''} a você</p>
          </div>

          {myTasks.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <CheckCircle2 size={36} className="mx-auto text-emerald-500 mb-3" />
              <p className="text-sm font-medium text-foreground">Nenhuma tarefa atribuída</p>
              <p className="text-xs text-muted-foreground mt-1 mb-4">Você não tem tarefas no momento.</p>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('openNewTask'))}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#1E3A5F] text-white text-xs font-medium hover:bg-[#2A4F7C] transition-colors"
              >
                <Plus size={13} />
                Criar tarefa
              </button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {myTasks.map(task => (
                <button
                  key={task.id}
                  onClick={() => window.dispatchEvent(new CustomEvent('openTaskDetail', { detail: task }))}
                  className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-muted/50 transition-colors text-left"
                >
                  {/* Group color strip */}
                  <div
                    className="w-1 h-8 rounded-full shrink-0"
                    style={{ backgroundColor: groupColors[task.group] || '#94a3b8' }}
                  />
                  {/* Priority dot */}
                  <div className={`w-2 h-2 rounded-full shrink-0 ${priorityColor[task.priority] || 'bg-slate-300'}`} />

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{task.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">{task.group}</span>
                      {task.date !== 'Sem prazo' && (
                        <>
                          <span className="text-muted-foreground text-xs">·</span>
                          <span className={`text-xs ${task.date === 'Hoje' ? 'text-amber-600 font-medium' : 'text-muted-foreground'}`}>
                            {task.date}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <PriorityIndicator priority={task.priority} />
                    <StatusPill status={task.status} size="sm" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
