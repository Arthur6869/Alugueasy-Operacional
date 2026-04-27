import { useState } from 'react';
import { Plus, Loader2, ChevronLeft, ChevronRight, GripVertical } from 'lucide-react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  closestCorners,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TeamAvatar } from './TeamAvatar';
import { useTasksContext, Task, TaskStatus } from '../../lib/TasksContext';

const columns: { id: TaskStatus; title: string; color: string }[] = [
  { id: 'Pendente', title: '○ Pendente', color: '#9CA3AF' },
  { id: 'Em Andamento', title: '◑ Em Andamento', color: '#3B82F6' },
  { id: 'Revisão', title: '◔ Revisão', color: '#F59E0B' },
  { id: 'Concluído', title: '● Concluído', color: '#22C55E' },
];

const groupColors = {
  Operacional: '#4A9EDB',
  Desenvolvimento: '#8B5CF6',
  Financeiro: '#10B981',
};

const priorityEmojis = {
  Baixa: '🟢',
  Média: '🔵',
  Alta: '🟠',
  Crítica: '🔴',
};

// ─── Conteúdo visual do card (sem hooks de DnD) ───────────────────────────

function CardContent({ task }: { task: Task }) {
  return (
    <>
      <div className="mb-2">
        <span
          className="text-xs px-2 py-1 rounded-full text-white font-medium"
          style={{ backgroundColor: groupColors[task.group as keyof typeof groupColors] }}
        >
          {task.group}
        </span>
      </div>
      <h4 className="text-sm font-medium text-foreground mb-3">{task.name}</h4>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TeamAvatar member={task.assignee} size="sm" />
          <span className="text-xs">
            {priorityEmojis[task.priority as keyof typeof priorityEmojis]} {task.priority}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className={task.date === 'Hoje' ? 'text-[#F59E0B] font-medium' : ''}>{task.date}</span>
          {task.comments > 0 && <span>💬 {task.comments}</span>}
        </div>
      </div>
    </>
  );
}

// ─── Card arrastável ───────────────────────────────────────────────────────

function KanbanCard({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      className="bg-card border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-all"
    >
      <div className="flex items-start gap-2">
        {/* Handle de drag */}
        <button
          className="mt-0.5 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none shrink-0"
          aria-label="Arrastar tarefa"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={14} />
        </button>

        {/* Conteúdo clicável */}
        <div
          className="flex-1 min-w-0 cursor-pointer"
          onClick={() => window.dispatchEvent(new CustomEvent('openTaskDetail', { detail: task }))}
        >
          <CardContent task={task} />
        </div>
      </div>
    </div>
  );
}

// ─── Coluna droppable ──────────────────────────────────────────────────────

interface KanbanColumnProps {
  column: { id: TaskStatus; title: string; color: string };
  columnTasks: Task[];
  isOver: boolean;
}

function KanbanColumn({ column, columnTasks, isOver }: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({ id: column.id });

  return (
    <div className="w-72 md:w-80 flex-shrink-0 flex flex-col">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-medium text-foreground flex items-center gap-2">
          {column.title}
          <span className="text-sm text-muted-foreground">({columnTasks.length})</span>
        </h3>
      </div>

      {/* Drop area */}
      <div
        ref={setNodeRef}
        className={`space-y-3 flex-1 min-h-[500px] rounded-xl p-2 -m-2 transition-all ${
          isOver ? 'ring-2 ring-[#1E3A5F]/50 bg-muted/30' : ''
        }`}
      >
        <SortableContext items={columnTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {columnTasks.map((task) => (
            <KanbanCard key={task.id} task={task} />
          ))}
        </SortableContext>

        {/* Botão adicionar */}
        <button
          onClick={() =>
            window.dispatchEvent(new CustomEvent('openNewTask', { detail: { initialStatus: column.id } }))
          }
          className="w-full py-3 border-2 border-dashed border-border rounded-xl hover:border-[#4A9EDB] hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-all flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-[#4A9EDB]"
        >
          <Plus size={16} />
          <span>Adicionar tarefa</span>
        </button>
      </div>
    </div>
  );
}

// ─── Board principal ───────────────────────────────────────────────────────

export function KanbanBoard() {
  const { tasks, loading, updateTask } = useTasksContext();
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [overColumnId, setOverColumnId] = useState<TaskStatus | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
  );

  const getColumnForItem = (id: string): TaskStatus | null => {
    const col = columns.find(c => c.id === id);
    if (col) return col.id;
    return tasks.find(t => t.id === id)?.status ?? null;
  };

  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveTask(tasks.find(t => t.id === active.id) ?? null);
  };

  const handleDragOver = ({ over }: DragOverEvent) => {
    const overId = over?.id as string | undefined;
    setOverColumnId(overId ? getColumnForItem(overId) : null);
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveTask(null);
    setOverColumnId(null);

    if (!over || active.id === over.id) return;

    const targetStatus = getColumnForItem(over.id as string);
    if (!targetStatus) return;

    const dragged = tasks.find(t => t.id === active.id);
    if (!dragged || dragged.status === targetStatus) return;

    // updateTask já faz update otimista no estado local + persiste no Supabase
    updateTask(dragged.id, { status: targetStatus });
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
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="h-full overflow-hidden bg-background flex flex-col">
        <div className="flex-1 overflow-x-auto scroll-smooth custom-scrollbar p-4 md:p-8">
          <div className="flex gap-4 pb-4 w-max min-w-full">
            {columns.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                columnTasks={tasks.filter(t => t.status === column.id)}
                isOver={overColumnId === column.id && !!activeTask}
              />
            ))}
          </div>
        </div>

        {/* Indicador de scroll mobile */}
        <div className="flex items-center justify-center gap-2 py-2 sm:hidden">
          <ChevronLeft size={14} className="text-gray-400" />
          <span className="text-xs text-gray-400">Deslize para ver mais colunas</span>
          <ChevronRight size={14} className="text-gray-400" />
        </div>
      </div>

      {/* Card fantasma seguindo o cursor */}
      <DragOverlay dropAnimation={null}>
        {activeTask ? (
          <div className="bg-card border border-border rounded-xl p-4 shadow-2xl opacity-90 w-72 md:w-80">
            <div className="flex items-start gap-2">
              <GripVertical size={14} className="mt-0.5 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <CardContent task={activeTask} />
              </div>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
