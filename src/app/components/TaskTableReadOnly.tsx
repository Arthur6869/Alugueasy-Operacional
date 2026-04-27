import { useState } from 'react';
import { Search, ChevronDown, MessageCircle, Calendar as CalendarIcon, Eye, Loader2 } from 'lucide-react';
import { TeamAvatar } from './TeamAvatar';
import { StatusPill } from './StatusPill';
import { PriorityIndicator } from './PriorityIndicator';
import { useTasksContext, TaskGroup } from '../../lib/TasksContext';

const groupColors = {
  'Operacional': '#4A9EDB',
  'Desenvolvimento': '#8B5CF6',
  'Financeiro': '#10B981',
};

interface TaskTableReadOnlyProps {
  filterGroup?: TaskGroup;
}

export function TaskTableReadOnly({ filterGroup }: TaskTableReadOnlyProps) {
  const { tasks, loading } = useTasksContext();
  const [collapsedGroups, setCollapsedGroups] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTasks = tasks.filter(task => {
    const matchesGroup = !filterGroup || task.group === filterGroup;
    const matchesSearch =
      task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.assignee.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesGroup && matchesSearch;
  });

  const groupedTasks = filteredTasks.reduce((acc, task) => {
    if (!acc[task.group]) acc[task.group] = [];
    acc[task.group].push(task);
    return acc;
  }, {} as Record<string, typeof tasks>);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 size={24} className="animate-spin" />
          <span>Carregando tarefas...</span>
        </div>
      </div>
    );
  }

  const toggleGroup = (group: string) => {
    setCollapsedGroups(prev =>
      prev.includes(group) ? prev.filter(g => g !== group) : [...prev, group]
    );
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar bg-background">
      <div className="p-8 pb-20 min-h-full">
        {/* Page Header */}
        <div className="mb-6">
          <p className="text-sm text-muted-foreground mb-1">EasyTask / Visualização</p>
          <h1 className="text-2xl font-bold text-foreground">Tarefas do Grupo</h1>
          <p className="text-sm text-muted-foreground mt-1">Modo somente leitura - Use "Cronograma" para editar</p>
        </div>

        {/* Toolbar - Only Search */}
        <div className="bg-card border border-border rounded-xl p-4 mb-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input
                  type="text"
                  placeholder="Buscar tarefas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-border bg-background text-foreground rounded-lg w-60 focus:outline-none focus:ring-2 focus:ring-[#4A9EDB] transition-all"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Eye size={16} />
              <span>Somente visualização</span>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
          {/* Column Headers */}
          <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-muted border-b border-border text-sm font-medium text-muted-foreground min-w-[580px]">
            <div className="col-span-4">Tarefa</div>
            <div className="col-span-2">Responsável</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Prioridade</div>
            <div className="col-span-1">Prazo</div>
            <div className="col-span-1">Notas</div>
          </div>

          {/* Empty State */}
          {filteredTasks.length === 0 && (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-bold text-foreground mb-2">
                Nenhuma tarefa encontrada
              </h3>
              <p className="text-muted-foreground">
                {searchTerm ? `Nenhum resultado para "${searchTerm}"` : 'Não há tarefas cadastradas'}
              </p>
            </div>
          )}

          {/* Task Groups */}
          {Object.entries(groupedTasks).map(([group, tasks]) => {
            const isCollapsed = collapsedGroups.includes(group);
            const groupColor = groupColors[group as keyof typeof groupColors];

            return (
              <div key={group}>
                {/* Group Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-muted border-b border-border relative">
                  <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: groupColor }} />
                  <button
                    onClick={() => toggleGroup(group)}
                    className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-[#4A9EDB] transition-all"
                  >
                    <ChevronDown size={16} className={`transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
                    <span>📋 {group.toUpperCase()}</span>
                    <span className="text-muted-foreground">· {tasks.length} tarefas</span>
                  </button>
                </div>

                {/* Task Rows */}
                {!isCollapsed && tasks.map((task) => (
                  <div
                    key={task.id}
                    className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-border hover:bg-muted/50 transition-all min-w-[580px]"
                  >
                    <div className="col-span-4 flex items-center">
                      <button
                        onClick={() => window.dispatchEvent(new CustomEvent('openTaskDetail', { detail: task }))}
                        className="text-sm text-foreground hover:text-[#4A9EDB] text-left transition-all"
                      >
                        {task.name}
                      </button>
                    </div>
                    <div className="col-span-2 flex items-center">
                      <TeamAvatar member={task.assignee} size="sm" showName />
                    </div>
                    <div className="col-span-2 flex items-center">
                      <StatusPill status={task.status} />
                    </div>
                    <div className="col-span-2 flex items-center">
                      <PriorityIndicator priority={task.priority} />
                    </div>
                    <div className="col-span-1 flex items-center">
                      <span className={`text-sm flex items-center gap-1 ${task.date === 'Hoje' ? 'text-[#F59E0B] font-medium' : 'text-muted-foreground'}`}>
                        <CalendarIcon size={14} />
                        {task.date}
                      </span>
                    </div>
                    <div className="col-span-1 flex items-center">
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MessageCircle size={14} />
                        <span>{task.comments}</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
          </div>{/* end overflow-x-auto */}
        </div>

        {/* Info Footer */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>💡 Para editar tarefas, adicionar ou gerenciar, acesse <strong>Cronograma</strong> no menu lateral</p>
        </div>
      </div>
    </div>
  );
}
