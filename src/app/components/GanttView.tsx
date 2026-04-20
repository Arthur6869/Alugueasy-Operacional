import { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Calendar, Filter } from 'lucide-react';
import { TeamAvatar } from './TeamAvatar';
import { useTasksContext } from '../../lib/TasksContext';

interface GanttTask {
  id: string;
  name: string;
  group: string;
  startDate: Date;
  endDate: Date;
  progress: number;
  assignee: 'Arthur' | 'Yasmim' | 'Alexandre' | 'Nikolas';
  color: string;
  dependencies?: string[];
}

const groupColors: Record<string, string> = {
  Desenvolvimento: '#8B5CF6',
  Operacional: '#4A9EDB',
  Financeiro: '#10B981',
};

const statusToProgress: Record<string, number> = {
  Pendente: 0,
  'Em Andamento': 50,
  Revisão: 75,
  Concluído: 100,
};

export function GanttView() {
  const { tasks } = useTasksContext();
  const [zoom, setZoom] = useState(1);
  const [hoveredTask, setHoveredTask] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const ganttTasks: GanttTask[] = tasks
    .filter((t) => !!t.due_date)
    .map((t) => {
      const endDate = new Date(t.due_date! + 'T00:00:00');
      const startDate = t.created_at
        ? new Date(t.created_at)
        : new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
      startDate.setHours(0, 0, 0, 0);
      return {
        id: t.id,
        name: t.name,
        group: t.group,
        startDate,
        endDate,
        progress: statusToProgress[t.status] ?? 0,
        assignee: t.assignee,
        color: groupColors[t.group] || '#4A9EDB',
      };
    });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (ganttTasks.length === 0) {
    return (
      <div className="h-full flex flex-col bg-background">
        <div className="bg-white border-b border-gray-200 p-4 flex items-center gap-4">
          <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
            <Calendar size={16} />
            <span>Gráfico de Gantt</span>
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <Calendar size={48} className="text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">Sem tarefas com prazo definido</p>
          <p className="text-sm text-gray-400 mt-1">Crie tarefas com prazo para visualizá-las no Gantt</p>
        </div>
      </div>
    );
  }

  // Get date range
  const minDate = new Date(Math.min(...ganttTasks.map((t) => t.startDate.getTime())));
  const maxDate = new Date(Math.max(...ganttTasks.map((t) => t.endDate.getTime())));

  // Expand range to include some padding
  minDate.setDate(minDate.getDate() - 2);
  maxDate.setDate(maxDate.getDate() + 5);

  const totalDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
  const dayWidth = 40 * zoom;

  const getDaysSinceStart = (date: Date) => {
    return Math.ceil(
      (date.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)
    );
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  const getWeekday = (date: Date) => {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return days[date.getDay()];
  };

  const isWeekend = (date: Date) => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  };

  // Generate dates array
  const dates: Date[] = [];
  for (let i = 0; i <= totalDays; i++) {
    const date = new Date(minDate);
    date.setDate(date.getDate() + i);
    dates.push(date);
  }

  // Group tasks
  const groupedTasks = ganttTasks.reduce((acc, task) => {
    if (!acc[task.group]) acc[task.group] = [];
    acc[task.group].push(task);
    return acc;
  }, {} as Record<string, GanttTask[]>);

  return (
    <div className="h-full overflow-hidden flex flex-col bg-background">
      {/* Header Controls */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => scrollRef.current?.scrollBy({ left: -200, behavior: 'smooth' })}
              className="p-2 hover:bg-gray-100 rounded-lg transition-all"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => scrollRef.current?.scrollBy({ left: 200, behavior: 'smooth' })}
              className="p-2 hover:bg-gray-100 rounded-lg transition-all"
            >
              <ChevronRight size={20} />
            </button>
            <div className="h-6 w-px bg-gray-300" />
            <button
              onClick={() => setZoom(Math.min(zoom + 0.2, 2))}
              className="p-2 hover:bg-gray-100 rounded-lg transition-all"
              title="Zoom In"
            >
              <ZoomIn size={20} />
            </button>
            <button
              onClick={() => setZoom(Math.max(zoom - 0.2, 0.5))}
              className="p-2 hover:bg-gray-100 rounded-lg transition-all"
              title="Zoom Out"
            >
              <ZoomOut size={20} />
            </button>
            <span className="text-sm text-gray-600">{Math.round(zoom * 100)}%</span>
          </div>

          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
              <Calendar size={16} />
              <span>{today.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</span>
            </button>
            <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
              <Filter size={16} />
              <span>Filtros</span>
            </button>
          </div>
        </div>
      </div>

      {/* Gantt Chart */}
      <div className="flex-1 overflow-hidden flex">
        {/* Left Panel - Task Names */}
        <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto custom-scrollbar">
          <div className="sticky top-0 bg-gray-50 border-b border-gray-200 p-4 z-10">
            <h3 className="font-medium text-[#111827]">Tarefas</h3>
          </div>

          {Object.entries(groupedTasks).map(([group, tasks]) => (
            <div key={group}>
              {/* Group Header */}
              <div
                className="px-4 py-3 bg-gray-50 border-b border-gray-200 font-medium text-sm flex items-center gap-2"
                style={{ borderLeft: `3px solid ${groupColors[group]}` }}
              >
                {group}
                <span className="text-gray-500">({tasks.length})</span>
              </div>

              {/* Tasks */}
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-all cursor-pointer"
                  onClick={() => {
                    const taskDetail = {
                      name: task.name,
                      assignee: task.assignee,
                      priority: task.progress > 75 ? 'Alta' : task.progress > 50 ? 'Média' : 'Baixa',
                      date: formatDate(task.endDate),
                      group: task.group,
                      status: task.progress === 100 ? 'Concluído' : task.progress > 50 ? 'Em Andamento' : 'Pendente',
                      tags: [task.group],
                      comments: 0,
                    };
                    window.dispatchEvent(new CustomEvent('openTaskDetail', { detail: taskDetail }));
                  }}
                  onMouseEnter={() => setHoveredTask(task.id)}
                  onMouseLeave={() => setHoveredTask(null)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#111827]">{task.name}</p>
                      <p className="text-xs text-[#6B7280] mt-1">
                        {formatDate(task.startDate)} - {formatDate(task.endDate)}
                      </p>
                    </div>
                    <TeamAvatar member={task.assignee} size="sm" />
                  </div>
                  {/* Progress Bar */}
                  <div className="mt-2 w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${task.progress}%`,
                        backgroundColor: task.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Right Panel - Timeline */}
        <div ref={scrollRef} className="flex-1 overflow-auto custom-scrollbar">
          <div style={{ minWidth: `${totalDays * dayWidth}px` }}>
            {/* Timeline Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
              <div className="flex">
                {dates.map((date, idx) => {
                  const isToday = isSameDay(date, today);
                  const weekend = isWeekend(date);

                  return (
                    <div
                      key={idx}
                      className={`border-r border-gray-200 ${
                        weekend ? 'bg-gray-50' : ''
                      } ${isToday ? 'bg-blue-50' : ''}`}
                      style={{ width: `${dayWidth}px` }}
                    >
                      <div className="p-2 text-center">
                        <div className={`text-xs ${isToday ? 'text-[#4A9EDB] font-bold' : 'text-gray-500'}`}>
                          {getWeekday(date)}
                        </div>
                        <div className={`text-sm font-medium ${isToday ? 'text-[#4A9EDB]' : 'text-[#111827]'}`}>
                          {date.getDate()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Timeline Grid */}
            <div className="relative">
              {/* Grid Lines */}
              <div className="absolute inset-0 flex">
                {dates.map((date, idx) => {
                  const isToday = isSameDay(date, today);
                  const weekend = isWeekend(date);

                  return (
                    <div
                      key={idx}
                      className={`border-r border-gray-200 ${weekend ? 'bg-gray-50' : ''}`}
                      style={{ width: `${dayWidth}px` }}
                    >
                      {isToday && (
                        <div className="absolute inset-y-0 w-0.5 bg-[#4A9EDB] opacity-50 z-20" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Task Bars */}
              {Object.entries(groupedTasks).map(([group, tasks]) => (
                <div key={group}>
                  {/* Group Spacer */}
                  <div className="h-12 border-b border-gray-200" />

                  {/* Tasks */}
                  {tasks.map((task) => {
                    const startDay = getDaysSinceStart(task.startDate);
                    const duration = Math.ceil(
                      (task.endDate.getTime() - task.startDate.getTime()) /
                        (1000 * 60 * 60 * 24)
                    );
                    const left = startDay * dayWidth;
                    const width = duration * dayWidth;

                    return (
                      <div
                        key={task.id}
                        className="relative h-16 border-b border-gray-100"
                        onMouseEnter={() => setHoveredTask(task.id)}
                        onMouseLeave={() => setHoveredTask(null)}
                      >
                        {/* Task Bar */}
                        <div
                          className={`absolute top-1/2 -translate-y-1/2 h-8 rounded-lg cursor-pointer transition-all ${
                            hoveredTask === task.id ? 'shadow-lg scale-105' : 'shadow-sm'
                          }`}
                          style={{
                            left: `${left}px`,
                            width: `${width}px`,
                            backgroundColor: task.color,
                          }}
                        >
                          {/* Progress Overlay */}
                          <div
                            className="absolute inset-0 bg-white/30 rounded-lg"
                            style={{ width: `${task.progress}%` }}
                          />

                          {/* Task Name */}
                          {width > 100 && (
                            <div className="absolute inset-0 flex items-center px-3 text-white text-xs font-medium truncate">
                              {task.name} ({task.progress}%)
                            </div>
                          )}

                          {/* Hover Tooltip */}
                          {hoveredTask === task.id && (
                            <div className="absolute top-full mt-2 left-0 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-xl z-30 whitespace-nowrap">
                              <div className="font-medium mb-1">{task.name}</div>
                              <div className="text-gray-300">
                                {formatDate(task.startDate)} - {formatDate(task.endDate)}
                              </div>
                              <div className="text-gray-300 mt-1">Progresso: {task.progress}%</div>
                              <div className="flex items-center gap-2 mt-2">
                                <TeamAvatar member={task.assignee} size="sm" />
                                <span>{task.assignee}</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Dependencies */}
                        {task.dependencies?.map((depId) => {
                          const depTask = ganttTasks.find(t => t.id === depId);
                          if (!depTask) return null;

                          const depEndDay = getDaysSinceStart(depTask.endDate);
                          const depEndX = depEndDay * dayWidth;

                          return (
                            <svg
                              key={depId}
                              className="absolute inset-0 pointer-events-none"
                              style={{ overflow: 'visible' }}
                            >
                              <line
                                x1={depEndX}
                                y1={-30}
                                x2={left}
                                y2={20}
                                stroke="#6B7280"
                                strokeWidth="2"
                                strokeDasharray="4"
                                markerEnd="url(#arrowhead)"
                              />
                              <defs>
                                <marker
                                  id="arrowhead"
                                  markerWidth="10"
                                  markerHeight="10"
                                  refX="5"
                                  refY="3"
                                  orient="auto"
                                >
                                  <polygon points="0 0, 6 3, 0 6" fill="#6B7280" />
                                </marker>
                              </defs>
                            </svg>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex items-center justify-center gap-8 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-100 border-2 border-[#4A9EDB]" />
            <span>Hoje: {formatDate(today)}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-gray-100" />
            <span>Fim de semana</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-400" style={{ clipPath: 'polygon(0 0, 100% 50%, 0 100%)' }} />
            <span>Dependência</span>
          </div>
        </div>
      </div>
    </div>
  );
}
