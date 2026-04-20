import { useState, useEffect, useRef } from 'react';
import { Search, Filter, ChevronDown, Plus, MoreVertical, MessageCircle, Calendar as CalendarIcon, GripVertical, X, Check, Loader2 } from 'lucide-react';
import { TeamAvatar } from './TeamAvatar';
import { StatusPill } from './StatusPill';
import { PriorityIndicator } from './PriorityIndicator';
import { useTasksContext, Task } from '../../lib/TasksContext';

type FilterType = 'assignee' | 'status' | 'date' | null;

const teamMembers = ['Arthur', 'Yasmim', 'Alexandre', 'Nikolas'] as const;
const statuses = ['Pendente', 'Em Andamento', 'Revisão', 'Concluído'] as const;
const dateOptions = ['Hoje', 'Esta semana', 'Este mês', 'Vencidas', 'Sem prazo'] as const;

const groupColors = {
  'Operacional': '#4A9EDB',
  'Desenvolvimento': '#8B5CF6',
  'Financeiro': '#10B981',
};

export function TaskTable() {
  const { tasks, loading, deleteTask, updateTask } = useTasksContext();

  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [collapsedGroups, setCollapsedGroups] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>(null);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedDateFilter, setSelectedDateFilter] = useState<string | null>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setActiveFilter(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredTasks = tasks.filter(task => {
    // Search filter
    const matchesSearch =
      task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.assignee.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    // Assignee filter
    const matchesAssignee = selectedAssignees.length === 0 || selectedAssignees.includes(task.assignee);

    // Status filter
    const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(task.status);

    // Date filter
    let matchesDate = true;
    if (selectedDateFilter) {
      if (selectedDateFilter === 'Hoje') {
        matchesDate = task.date === 'Hoje';
      } else if (selectedDateFilter === 'Esta semana') {
        matchesDate = task.date.includes('Jul') || task.date === 'Hoje';
      } else if (selectedDateFilter === 'Este mês') {
        matchesDate = true;
      } else if (selectedDateFilter === 'Vencidas') {
        matchesDate = task.date !== 'Hoje' && parseInt(task.date) < 18;
      } else if (selectedDateFilter === 'Sem prazo') {
        matchesDate = false;
      }
    }

    return matchesSearch && matchesAssignee && matchesStatus && matchesDate;
  });

  const groupedTasks = filteredTasks.reduce((acc, task) => {
    if (!acc[task.group]) acc[task.group] = [];
    acc[task.group].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  const toggleGroup = (group: string) => {
    setCollapsedGroups(prev =>
      prev.includes(group) ? prev.filter(g => g !== group) : [...prev, group]
    );
  };

  const toggleAssignee = (assignee: string) => {
    setSelectedAssignees(prev =>
      prev.includes(assignee) ? prev.filter(a => a !== assignee) : [...prev, assignee]
    );
  };

  const toggleStatus = (status: string) => {
    setSelectedStatuses(prev =>
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  const clearAllFilters = () => {
    setSelectedAssignees([]);
    setSelectedStatuses([]);
    setSelectedDateFilter(null);
    window.dispatchEvent(new CustomEvent('showToast', {
      detail: { type: 'success', message: 'Filtros limpos!' }
    }));
  };

  const hasActiveFilters = selectedAssignees.length > 0 || selectedStatuses.length > 0 || selectedDateFilter !== null;

  const handleBulkDelete = async () => {
    if (!confirm(`Deseja excluir ${selectedTasks.length} tarefa(s)?`)) return;
    await Promise.all(selectedTasks.map(id => deleteTask(id)));
    setSelectedTasks([]);
    window.dispatchEvent(new CustomEvent('showToast', { detail: { type: 'success', message: `${selectedTasks.length} tarefa(s) excluída(s)!` } }));
  };

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

  return (
    <div className="h-full overflow-y-auto custom-scrollbar bg-background">
      <div className="p-4 md:p-8 pb-20 min-h-full">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Cronograma</p>
            <h1 className="text-2xl font-semibold text-foreground">Gestão de Tarefas</h1>
          </div>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('openNewTask'))}
            className="hidden sm:inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-[#1E3A5F] text-white text-sm font-medium hover:bg-[#2A4F7C] transition-colors"
          >
            <Plus size={15} />
            Nova Tarefa
          </button>
        </div>

        {/* Toolbar */}
        <div className="bg-card border border-border rounded-xl p-3 md:p-4 mb-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-2 justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
                <input
                  type="text"
                  placeholder="Buscar tarefas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-3 py-1.5 border border-border bg-background text-foreground rounded-lg w-48 md:w-56 text-sm focus:outline-none focus:ring-2 focus:ring-[#4A9EDB] transition-all"
                />
              </div>

              {/* Assignee Filter */}
              <div className="relative" ref={activeFilter === 'assignee' ? filterRef : null}>
                <button
                  onClick={() => setActiveFilter(activeFilter === 'assignee' ? null : 'assignee')}
                  className={`flex items-center gap-1.5 h-8 px-3 border rounded-lg text-sm transition-all ${
                    selectedAssignees.length > 0
                      ? 'border-blue-300 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700'
                      : 'border-border text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <Filter size={14} />
                  <span>Responsável</span>
                  {selectedAssignees.length > 0 && (
                    <span className="bg-blue-600 text-white text-xs rounded-full px-1.5 min-w-[18px] text-center leading-[18px]">
                      {selectedAssignees.length}
                    </span>
                  )}
                  <ChevronDown size={14} />
                </button>

                {activeFilter === 'assignee' && (
                  <div className="absolute top-full mt-2 bg-card border border-border rounded-xl shadow-xl z-50 w-60 animate-in fade-in slide-in-from-top-2">
                    <div className="p-3 border-b border-border flex items-center justify-between">
                      <span className="font-medium text-sm text-foreground">Responsável</span>
                      <button onClick={() => setActiveFilter(null)} className="p-1 hover:bg-muted rounded text-muted-foreground">
                        <X size={14} />
                      </button>
                    </div>
                    <div className="p-2 max-h-64 overflow-y-auto">
                      {teamMembers.map((member) => (
                        <button
                          key={member}
                          onClick={() => toggleAssignee(member)}
                          className="w-full flex items-center gap-3 px-3 py-2 hover:bg-muted rounded-lg transition-all"
                        >
                          <div className={`w-4 h-4 border-2 rounded flex items-center justify-center shrink-0 ${
                            selectedAssignees.includes(member)
                              ? 'bg-[#1E3A5F] border-[#1E3A5F]'
                              : 'border-border'
                          }`}>
                            {selectedAssignees.includes(member) && <Check size={11} className="text-white" />}
                          </div>
                          <TeamAvatar member={member} size="sm" showName />
                        </button>
                      ))}
                    </div>
                    <div className="p-2 border-t border-border">
                      <button onClick={() => setActiveFilter(null)} className="w-full h-8 px-3 bg-[#1E3A5F] text-white rounded-lg text-sm hover:bg-[#2A4F7C]">
                        OK
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Status Filter */}
              <div className="relative" ref={activeFilter === 'status' ? filterRef : null}>
                <button
                  onClick={() => setActiveFilter(activeFilter === 'status' ? null : 'status')}
                  className={`flex items-center gap-1.5 h-8 px-3 border rounded-lg text-sm transition-all ${
                    selectedStatuses.length > 0
                      ? 'border-blue-300 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700'
                      : 'border-border text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <span>Status</span>
                  {selectedStatuses.length > 0 && (
                    <span className="bg-blue-600 text-white text-xs rounded-full px-1.5 min-w-[18px] text-center leading-[18px]">
                      {selectedStatuses.length}
                    </span>
                  )}
                  <ChevronDown size={14} />
                </button>

                {activeFilter === 'status' && (
                  <div className="absolute top-full mt-2 bg-card border border-border rounded-xl shadow-xl z-50 w-60 animate-in fade-in slide-in-from-top-2">
                    <div className="p-3 border-b border-border flex items-center justify-between">
                      <span className="font-medium text-sm text-foreground">Status</span>
                      <button onClick={() => setActiveFilter(null)} className="p-1 hover:bg-muted rounded text-muted-foreground">
                        <X size={14} />
                      </button>
                    </div>
                    <div className="p-2 max-h-64 overflow-y-auto">
                      {statuses.map((status) => (
                        <button
                          key={status}
                          onClick={() => toggleStatus(status)}
                          className="w-full flex items-center gap-3 px-3 py-2 hover:bg-muted rounded-lg transition-all"
                        >
                          <div className={`w-4 h-4 border-2 rounded flex items-center justify-center shrink-0 ${
                            selectedStatuses.includes(status)
                              ? 'bg-[#1E3A5F] border-[#1E3A5F]'
                              : 'border-border'
                          }`}>
                            {selectedStatuses.includes(status) && <Check size={11} className="text-white" />}
                          </div>
                          <StatusPill status={status as any} size="sm" />
                        </button>
                      ))}
                    </div>
                    <div className="p-2 border-t border-border">
                      <button onClick={() => setActiveFilter(null)} className="w-full h-8 px-3 bg-[#1E3A5F] text-white rounded-lg text-sm hover:bg-[#2A4F7C]">
                        OK
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Date Filter */}
              <div className="relative" ref={activeFilter === 'date' ? filterRef : null}>
                <button
                  onClick={() => setActiveFilter(activeFilter === 'date' ? null : 'date')}
                  className={`flex items-center gap-1.5 h-8 px-3 border rounded-lg text-sm transition-all ${
                    selectedDateFilter
                      ? 'border-blue-300 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700'
                      : 'border-border text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <span>Prazo</span>
                  {selectedDateFilter && (
                    <span className="bg-blue-600 text-white text-xs rounded-full px-1.5 min-w-[18px] text-center leading-[18px]">1</span>
                  )}
                  <ChevronDown size={14} />
                </button>

                {activeFilter === 'date' && (
                  <div className="absolute top-full mt-2 bg-card border border-border rounded-xl shadow-xl z-50 w-52 animate-in fade-in slide-in-from-top-2">
                    <div className="p-3 border-b border-border flex items-center justify-between">
                      <span className="font-medium text-sm text-foreground">Prazo</span>
                      <button onClick={() => setActiveFilter(null)} className="p-1 hover:bg-muted rounded text-muted-foreground">
                        <X size={14} />
                      </button>
                    </div>
                    <div className="p-2">
                      {dateOptions.map((option) => (
                        <button
                          key={option}
                          onClick={() => setSelectedDateFilter(selectedDateFilter === option ? null : option)}
                          className="w-full flex items-center gap-3 px-3 py-2 hover:bg-muted rounded-lg transition-all text-left"
                        >
                          <div className={`w-4 h-4 border-2 rounded flex items-center justify-center shrink-0 ${
                            selectedDateFilter === option
                              ? 'bg-[#1E3A5F] border-[#1E3A5F]'
                              : 'border-border'
                          }`}>
                            {selectedDateFilter === option && <Check size={11} className="text-white" />}
                          </div>
                          <span className="text-sm text-foreground">{option}</span>
                        </button>
                      ))}
                    </div>
                    <div className="p-2 border-t border-border">
                      <button onClick={() => setActiveFilter(null)} className="w-full h-8 px-3 bg-[#1E3A5F] text-white rounded-lg text-sm hover:bg-[#2A4F7C]">
                        OK
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="flex items-center gap-1 h-8 px-3 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all border border-rose-200 dark:border-rose-800"
                >
                  <X size={13} />
                  <span>Limpar</span>
                </button>
              )}
            </div>

            <button
              onClick={() => window.dispatchEvent(new CustomEvent('openNewTask'))}
              className="sm:hidden inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#1E3A5F] text-white text-sm font-medium hover:bg-[#2A4F7C] transition-colors"
            >
              <Plus size={14} />
              Nova
            </button>
          </div>
        </div>

        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="mb-4 flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">Filtros ativos:</span>
            {selectedAssignees.map((assignee) => (
              <div key={assignee} className="flex items-center gap-1.5 h-6 px-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-full text-xs text-blue-700 dark:text-blue-300">
                <span>{assignee}</span>
                <button onClick={() => toggleAssignee(assignee)} className="hover:opacity-70">
                  <X size={12} />
                </button>
              </div>
            ))}
            {selectedStatuses.map((status) => (
              <div key={status} className="flex items-center gap-1.5 h-6 px-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-full text-xs text-blue-700 dark:text-blue-300">
                <span>{status}</span>
                <button onClick={() => toggleStatus(status)} className="hover:opacity-70">
                  <X size={12} />
                </button>
              </div>
            ))}
            {selectedDateFilter && (
              <div className="flex items-center gap-1.5 h-6 px-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-full text-xs text-blue-700 dark:text-blue-300">
                <CalendarIcon size={11} />
                <span>{selectedDateFilter}</span>
                <button onClick={() => setSelectedDateFilter(null)} className="hover:opacity-70">
                  <X size={12} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Table */}
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
          {/* Column Headers */}
          <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-muted border-b border-border text-sm font-medium text-muted-foreground min-w-[640px]">
            <div className="col-span-1 flex items-center gap-2">
              <input type="checkbox" className="rounded" />
            </div>
            <div className="col-span-3">Tarefa</div>
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
              <p className="text-muted-foreground mb-4">
                {searchTerm
                  ? `Nenhum resultado para "${searchTerm}"`
                  : hasActiveFilters
                  ? 'Nenhuma tarefa corresponde aos filtros selecionados'
                  : 'Não há tarefas cadastradas'}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="px-4 py-2 bg-[#1E3A5F] text-white rounded-lg text-sm hover:opacity-90"
                >
                  Limpar filtros
                </button>
              )}
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
                    className="flex items-center gap-2 text-sm font-medium text-foreground"
                  >
                    <ChevronDown size={16} className={`transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
                    <span>📋 {group.toUpperCase()}</span>
                    <span className="text-muted-foreground">· {tasks.length} tarefas</span>
                  </button>
                  <button
                    onClick={() => window.dispatchEvent(new CustomEvent('openNewTask'))}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Plus size={13} />
                    Adicionar
                  </button>
                </div>

                {/* Task Rows */}
                {!isCollapsed && tasks.map((task) => (
                  <div
                    key={task.id}
                    className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-border hover:bg-muted/50 transition-all group min-w-[640px]"
                  >
                    <div className="col-span-1 flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={selectedTasks.includes(task.id)}
                        onChange={() => {
                          setSelectedTasks(prev =>
                            prev.includes(task.id)
                              ? prev.filter(id => id !== task.id)
                              : [...prev, task.id]
                          );
                        }}
                      />
                      <GripVertical size={16} className="text-muted-foreground opacity-0 group-hover:opacity-100" />
                    </div>
                    <div className="col-span-3 flex items-center">
                      <button
                        onClick={() => window.dispatchEvent(new CustomEvent('openTaskDetail', { detail: task }))}
                        className="text-sm text-foreground hover:text-[#4A9EDB] text-left transition-all"
                      >
                        {task.name}
                      </button>
                    </div>
                    <div className="col-span-2 flex items-center">
                      <button
                        onClick={() => alert(`Alterar responsável da tarefa`)}
                        className="hover:bg-muted rounded-lg p-1 transition-all"
                      >
                        <TeamAvatar member={task.assignee} size="sm" showName />
                      </button>
                    </div>
                    <div className="col-span-2 flex items-center">
                      <StatusPill status={task.status} />
                    </div>
                    <div className="col-span-2 flex items-center">
                      <PriorityIndicator priority={task.priority} />
                    </div>
                    <div className="col-span-1 flex items-center">
                      <button
                        onClick={() => alert('Alterar data da tarefa')}
                        className={`text-sm flex items-center gap-1 hover:bg-muted rounded px-2 py-1 transition-all ${task.date === 'Hoje' ? 'text-[#F59E0B] font-medium' : 'text-muted-foreground'}`}
                      >
                        <CalendarIcon size={14} />
                        {task.date}
                      </button>
                    </div>
                    <div className="col-span-1 flex items-center justify-between">
                      <button
                        onClick={() => alert(`Ver ${task.comments} comentário(s) da tarefa "${task.name}"`)}
                        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-[#4A9EDB] transition-all"
                      >
                        <MessageCircle size={14} />
                        <span>{task.comments}</span>
                      </button>
                      <button
                        onClick={() => alert('Opções: Editar, Duplicar, Mover, Excluir')}
                        className="opacity-0 group-hover:opacity-100 hover:bg-muted rounded p-1 transition-all"
                      >
                        <MoreVertical size={16} className="text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
          </div>{/* end overflow-x-auto */}
        </div>

        {/* Bulk Actions */}
        {selectedTasks.length > 0 && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-[#1E3A5F] text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-4 animate-in zoom-in">
            <span className="text-sm font-medium">{selectedTasks.length} tarefas selecionadas</span>
            <button
              onClick={() => alert('Mudar status das tarefas selecionadas')}
              className="px-3 py-1 bg-white/20 rounded hover:bg-white/30 text-sm transform hover:scale-105 transition-all"
            >
              Mudar Status
            </button>
            <button
              onClick={() => alert('Mover tarefas selecionadas')}
              className="px-3 py-1 bg-white/20 rounded hover:bg-white/30 text-sm transform hover:scale-105 transition-all"
            >
              Mover para
            </button>
            <button
              onClick={handleBulkDelete}
              className="px-3 py-1 bg-[#EF4444] rounded hover:opacity-90 text-sm transform hover:scale-105 transition-all"
            >
              Excluir
            </button>
            <button
              onClick={() => setSelectedTasks([])}
              className="ml-2 text-sm hover:underline"
            >
              ✕ Cancelar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
