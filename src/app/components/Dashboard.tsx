import { CheckSquare, RefreshCw, CheckCircle2, Flame, ArrowUpRight, Plus, ChevronRight, Clock } from 'lucide-react';
import { TeamAvatar } from './TeamAvatar';
import { StatusPill } from './StatusPill';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useTasksContext } from '../../lib/TasksContext';

interface DashboardProps {
  currentUser: 'Arthur' | 'Yasmim' | 'Alexandre' | 'Nikolas';
}

const memberColors: Record<string, string> = {
  Arthur: '#3b82f6',
  Yasmim: '#ec4899',
  Alexandre: '#8b5cf6',
  Nikolas: '#10b981',
};

const groupColors: Record<string, string> = {
  Operacional: '#3b82f6',
  Desenvolvimento: '#8b5cf6',
  Financeiro: '#10b981',
};

const priorityOrder = { 'Crítica': 4, 'Alta': 3, 'Média': 2, 'Baixa': 1 };

export function Dashboard({ currentUser }: DashboardProps) {
  const { tasks } = useTasksContext();

  const total = tasks.length;
  const andamento = tasks.filter(t => t.status === 'Em Andamento').length;
  const concluidas = tasks.filter(t => t.status === 'Concluído').length;
  const pendentes = tasks.filter(t => t.status === 'Pendente').length;
  const altaPrioridade = tasks.filter(t => t.priority === 'Alta' || t.priority === 'Crítica').length;
  const conclusionRate = total > 0 ? Math.round((concluidas / total) * 100) : 0;

  const recentTasks = [...tasks]
    .sort((a, b) => (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0))
    .slice(0, 6);

  const teamMembers = ['Arthur', 'Yasmim', 'Alexandre', 'Nikolas'] as const;
  const barData = teamMembers.map(member => ({
    name: member,
    total: tasks.filter(t => t.assignee === member).length,
    concluidas: tasks.filter(t => t.assignee === member && t.status === 'Concluído').length,
    color: memberColors[member],
  }));

  const groupData = Object.entries(groupColors).map(([group, color]) => ({
    name: group,
    value: tasks.filter(t => t.group === group).length,
    color,
  }));

  const myTasks = tasks
    .filter(t => t.assignee === currentUser && t.status !== 'Concluído')
    .sort((a, b) => (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0))
    .slice(0, 3);

  const stats = [
    {
      id: 'total',
      icon: CheckSquare,
      label: 'Total de Tarefas',
      value: total,
      change: `${pendentes} pendentes`,
      color: 'text-slate-600',
      iconBg: 'bg-slate-100 dark:bg-slate-800',
    },
    {
      id: 'andamento',
      icon: RefreshCw,
      label: 'Em Andamento',
      value: andamento,
      change: `${total > 0 ? Math.round((andamento / total) * 100) : 0}% do total`,
      color: 'text-blue-600',
      iconBg: 'bg-blue-50 dark:bg-blue-900/30',
    },
    {
      id: 'concluidas',
      icon: CheckCircle2,
      label: 'Concluídas',
      value: concluidas,
      change: `${conclusionRate}% de conclusão`,
      color: 'text-emerald-600',
      iconBg: 'bg-emerald-50 dark:bg-emerald-900/30',
    },
    {
      id: 'alta',
      icon: Flame,
      label: 'Alta Prioridade',
      value: altaPrioridade,
      change: tasks.filter(t => t.priority === 'Crítica').length + ' crítica(s)',
      color: 'text-rose-600',
      iconBg: 'bg-rose-50 dark:bg-rose-900/30',
    },
  ];

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="p-4 md:p-6 lg:p-8 space-y-5 pb-12 max-w-7xl mx-auto">

        {/* ── Page Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Visão Geral</p>
            <h1 className="text-2xl font-semibold text-foreground">Olá, {currentUser} 👋</h1>
          </div>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('openNewTask'))}
            className="hidden sm:inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-[#1E3A5F] text-white text-sm font-medium hover:bg-[#2A4F7C] transition-colors"
          >
            <Plus size={15} />
            Nova Tarefa
          </button>
        </div>

        {/* ── Stats Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {stats.map(s => (
            <div key={s.id} className="bg-card border border-border rounded-xl p-4 md:p-5 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.iconBg}`}>
                  <s.icon size={17} className={s.color} />
                </div>
                <ArrowUpRight size={15} className="text-muted-foreground opacity-40" />
              </div>
              <div className="text-2xl md:text-3xl font-bold text-foreground leading-none mb-1">
                {s.value}
              </div>
              <div className="text-xs font-medium text-muted-foreground mb-1">{s.label}</div>
              <div className={`text-xs font-medium ${s.color}`}>{s.change}</div>
            </div>
          ))}
        </div>

        {/* ── Middle Row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

          {/* Tarefas Recentes */}
          <div className="lg:col-span-3 bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Tarefas Recentes</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Ordenadas por prioridade</p>
              </div>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('changeView', { detail: 'schedule' }))}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Ver todas <ChevronRight size={13} />
              </button>
            </div>
            <div className="divide-y divide-border">
              {recentTasks.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <p className="text-sm text-muted-foreground">Nenhuma tarefa ainda.</p>
                  <button
                    onClick={() => window.dispatchEvent(new CustomEvent('openNewTask'))}
                    className="mt-3 text-xs text-blue-600 hover:underline"
                  >
                    Criar primeira tarefa →
                  </button>
                </div>
              ) : (
                recentTasks.map(task => (
                  <button
                    key={task.id}
                    onClick={() => window.dispatchEvent(new CustomEvent('openTaskDetail', { detail: task }))}
                    className="w-full flex items-center gap-3 px-5 py-3 hover:bg-muted/50 transition-colors text-left"
                  >
                    {/* Group color strip */}
                    <div
                      className="w-1 h-7 rounded-full shrink-0"
                      style={{ backgroundColor: groupColors[task.group] || '#94a3b8' }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{task.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">{task.group}</span>
                        {task.date !== 'Sem prazo' && (
                          <>
                            <span className="text-muted-foreground text-xs">·</span>
                            <span className={`text-xs flex items-center gap-1 ${task.date === 'Hoje' ? 'text-amber-600 font-medium' : 'text-muted-foreground'}`}>
                              <Clock size={10} />
                              {task.date}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <StatusPill status={task.status} size="sm" />
                      <TeamAvatar member={task.assignee} size="sm" />
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Tarefas por Grupo */}
          <div className="lg:col-span-2 bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">Por Grupo</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Distribuição de tarefas</p>
            </div>
            <div className="p-5 space-y-4">
              {groupData.map(g => (
                <div key={g.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-foreground">{g.name}</span>
                    <span className="text-xs text-muted-foreground font-medium">{g.value}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: total > 0 ? `${Math.round((g.value / total) * 100)}%` : '0%',
                        backgroundColor: g.color,
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {total > 0 ? Math.round((g.value / total) * 100) : 0}% do total
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Bottom Row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

          {/* Desempenho por Membro */}
          <div className="lg:col-span-3 bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">Desempenho da Equipe</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Total vs. concluídas por membro</p>
            </div>
            <div className="p-5">
              {total === 0 ? (
                <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">
                  Sem dados ainda
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={barData} barGap={4} barCategoryGap="35%">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} width={20} />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        fontSize: '12px',
                        color: 'var(--foreground)',
                      }}
                    />
                    <Bar dataKey="total" name="Total" radius={[4, 4, 0, 0]} maxBarSize={32}>
                      {barData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} fillOpacity={0.25} />
                      ))}
                    </Bar>
                    <Bar dataKey="concluidas" name="Concluídas" radius={[4, 4, 0, 0]} maxBarSize={32}>
                      {barData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Minhas Tarefas Prioritárias */}
          <div className="lg:col-span-2 bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Minhas Prioridades</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Tarefas em aberto</p>
              </div>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('changeView', { detail: 'my-tasks' }))}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Ver todas <ChevronRight size={13} />
              </button>
            </div>
            <div className="divide-y divide-border">
              {myTasks.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <CheckCircle2 size={28} className="mx-auto text-emerald-500 mb-2" />
                  <p className="text-sm font-medium text-foreground">Tudo em dia!</p>
                  <p className="text-xs text-muted-foreground mt-1">Sem tarefas abertas no momento.</p>
                </div>
              ) : (
                myTasks.map(task => {
                  const priorityColor: Record<string, string> = {
                    'Crítica': 'bg-rose-500',
                    'Alta': 'bg-orange-400',
                    'Média': 'bg-blue-400',
                    'Baixa': 'bg-slate-300',
                  };
                  return (
                    <button
                      key={task.id}
                      onClick={() => window.dispatchEvent(new CustomEvent('openTaskDetail', { detail: task }))}
                      className="w-full px-5 py-3 hover:bg-muted/50 transition-colors text-left"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${priorityColor[task.priority] || 'bg-slate-300'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{task.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <StatusPill status={task.status} size="sm" />
                            {task.date !== 'Sem prazo' && (
                              <span className={`text-xs ${task.date === 'Hoje' ? 'text-amber-600 font-medium' : 'text-muted-foreground'}`}>
                                {task.date}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
            {myTasks.length > 0 && (
              <div className="px-5 py-3 bg-muted/30 border-t border-border">
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('openNewTask'))}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Plus size={13} />
                  Adicionar tarefa
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
