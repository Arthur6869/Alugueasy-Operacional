import { useState } from 'react';
import { Plus, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { TeamAvatar } from './TeamAvatar';
import { useTasksContext, TaskStatus } from '../../lib/TasksContext';

const columns: { id: TaskStatus; title: string; color: string }[] = [
  { id: 'Pendente', title: '○ Pendente', color: '#9CA3AF' },
  { id: 'Em Andamento', title: '◑ Em Andamento', color: '#3B82F6' },
  { id: 'Revisão', title: '◔ Revisão', color: '#F59E0B' },
  { id: 'Concluído', title: '● Concluído', color: '#22C55E' },
];

const groupColors = {
  'Operacional': '#4A9EDB',
  'Desenvolvimento': '#8B5CF6',
  'Financeiro': '#10B981',
};

const priorityEmojis = {
  'Baixa': '🟢',
  'Média': '🔵',
  'Alta': '🟠',
  'Crítica': '🔴',
};

export function KanbanBoard() {
  const { tasks, loading } = useTasksContext();
  const [showAddCard, setShowAddCard] = useState<TaskStatus | null>(null);
  const [newCardTitle, setNewCardTitle] = useState('');

  const handleAddCard = (status: TaskStatus) => {
    if (newCardTitle.trim()) {
      window.dispatchEvent(new CustomEvent('openNewTask', { detail: { initialStatus: status } }));
      setNewCardTitle('');
      setShowAddCard(null);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 size={24} className="animate-spin" />
          <span>Carregando board...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-hidden bg-background flex flex-col">
      <div className="flex-1 overflow-x-auto scroll-smooth custom-scrollbar p-4 md:p-8">
        <div className="flex gap-4 pb-4 w-max min-w-full">
          {columns.map((column) => {
            const columnTasks = tasks.filter(t => t.status === column.id);
            return (
            <div key={column.id} className="w-72 md:w-80 flex-shrink-0 flex flex-col">
              {/* Column Header */}
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-medium text-foreground flex items-center gap-2">
                  {column.title}
                  <span className="text-sm text-muted-foreground">({columnTasks.length})</span>
                </h3>
              </div>

              {/* Cards */}
              <div className="space-y-3 flex-1 min-h-[500px]">
                {columnTasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-card border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer transform hover:scale-105"
                    onClick={() => window.dispatchEvent(new CustomEvent('openTaskDetail', { detail: task }))}
                  >
                    {/* Group Tag */}
                    <div className="mb-2">
                      <span
                        className="text-xs px-2 py-1 rounded-full text-white font-medium"
                        style={{ backgroundColor: groupColors[task.group as keyof typeof groupColors] }}
                      >
                        {task.group}
                      </span>
                    </div>

                    {/* Title */}
                    <h4 className="text-sm font-medium text-foreground mb-3">{task.name}</h4>

                    {/* Footer */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TeamAvatar member={task.assignee} size="sm" />
                        <span className="text-xs">
                          {priorityEmojis[task.priority as keyof typeof priorityEmojis]} {task.priority}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className={task.date === 'Hoje' ? 'text-[#F59E0B] font-medium' : ''}>
                          {task.date}
                        </span>
                        {task.comments > 0 && <span>💬 {task.comments}</span>}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add Card Button */}
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('openNewTask', { detail: { initialStatus: column.id } }))}
                  className="w-full py-3 border-2 border-dashed border-border rounded-xl hover:border-[#4A9EDB] hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-all flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-[#4A9EDB]"
                >
                  <Plus size={16} />
                  <span>Adicionar tarefa</span>
                </button>
              </div>
            </div>
            );
          })}
        </div>
      </div>

      {/* Indicador de scroll — visível apenas no mobile */}
      <div className="flex items-center justify-center gap-2 py-2 sm:hidden">
        <ChevronLeft size={14} className="text-gray-400" />
        <span className="text-xs text-gray-400">Deslize para ver mais colunas</span>
        <ChevronRight size={14} className="text-gray-400" />
      </div>
    </div>
  );
}
