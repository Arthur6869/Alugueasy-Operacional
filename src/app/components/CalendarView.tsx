import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useTasksContext } from '../../lib/TasksContext';

const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const daysOfWeekMobile = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const groupColors: Record<string, string> = {
  Desenvolvimento: '#8B5CF6',
  Operacional: '#4A9EDB',
  Financeiro: '#10B981',
};

const todayDate = new Date();

export function CalendarView() {
  const { tasks } = useTasksContext();
  const [currentMonth, setCurrentMonth] = useState(todayDate.getMonth());
  const [currentYear, setCurrentYear] = useState(todayDate.getFullYear());

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
  const todayDay = todayDate.getDate();
  const isCurrentMonthYear = currentMonth === todayDate.getMonth() && currentYear === todayDate.getFullYear();

  const getTasksForDay = (day: number) => {
    return tasks
      .filter((task) => {
        if (!task.due_date) return false;
        const d = new Date(task.due_date + 'T00:00:00');
        return d.getDate() === day && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .map((task) => ({
        id: task.id,
        title: task.name,
        group: task.group,
        color: groupColors[task.group] || '#4A9EDB',
        fullTask: task,
      }));
  };

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar bg-background">
      <div className="p-4 md:p-8 pb-12 min-h-full">
        {/* Calendar Header */}
        <div className="bg-card border border-border rounded-xl p-4 md:p-6 mb-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-xl md:text-2xl font-bold text-foreground">
              {months[currentMonth]} {currentYear}
            </h2>
            <div className="flex items-center gap-1 md:gap-2">
              <button
                onClick={prevMonth}
                className="flex items-center justify-center min-w-[44px] min-h-[44px] hover:bg-muted rounded-lg transition-all text-foreground"
                aria-label="Mês anterior"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() => {
                  setCurrentMonth(todayDate.getMonth());
                  setCurrentYear(todayDate.getFullYear());
                }}
                className="px-3 py-1 text-sm text-[#4A9EDB] hover:bg-[#4A9EDB]/10 rounded-lg transition-all"
              >
                Hoje
              </button>
              <button
                onClick={nextMonth}
                className="flex items-center justify-center min-w-[44px] min-h-[44px] hover:bg-muted rounded-lg transition-all text-foreground"
                aria-label="Próximo mês"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-card border border-border rounded-xl p-3 md:p-6 shadow-sm">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2 md:mb-4">
            {daysOfWeek.map((day, i) => (
              <div key={day} className="text-center font-medium text-muted-foreground text-xs md:text-sm py-2">
                <span className="hidden sm:inline">{day}</span>
                <span className="sm:hidden">{daysOfWeekMobile[i]}</span>
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1 md:gap-2">
            {/* Empty cells before first day */}
            {Array.from({ length: firstDay }).map((_, idx) => (
              <div key={`empty-${idx}`} className="h-16 sm:h-24 md:h-28" />
            ))}

            {/* Days */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const dayTasks = getTasksForDay(day);
              const isToday = isCurrentMonthYear && day === todayDay;

              return (
                <div
                  key={day}
                  className={`h-16 sm:h-24 md:h-28 border rounded-lg p-1 sm:p-2 hover:bg-muted transition-all cursor-pointer ${
                    isToday ? 'border-[#4A9EDB] border-2 bg-[#4A9EDB]/10' : 'border-border'
                  }`}
                  onClick={() => {
                    const selectedDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    window.dispatchEvent(new CustomEvent('openNewTaskWithDate', { detail: selectedDate }));
                  }}
                >
                  <div className={`text-xs sm:text-sm font-medium mb-1 ${isToday ? 'text-[#4A9EDB]' : 'text-foreground'}`}>
                    {day}
                  </div>

                  {/* Desktop: etiquetas de texto */}
                  <div className="hidden sm:block space-y-1">
                    {dayTasks.slice(0, 2).map((task) => (
                      <div
                        key={task.id}
                        className="text-xs px-2 py-1 rounded text-white truncate hover:opacity-80 transition-opacity"
                        style={{ backgroundColor: task.color }}
                        onClick={(e) => {
                          e.stopPropagation();
                          window.dispatchEvent(new CustomEvent('openTaskDetail', { detail: task.fullTask }));
                        }}
                      >
                        {task.title}
                      </div>
                    ))}
                    {dayTasks.length > 2 && (
                      <div className="text-xs text-muted-foreground px-2">+{dayTasks.length - 2} mais</div>
                    )}
                  </div>

                  {/* Mobile: pontos coloridos */}
                  {dayTasks.length > 0 && (
                    <div
                      className="sm:hidden flex items-center gap-0.5 mt-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.dispatchEvent(new CustomEvent('openTaskDetail', { detail: dayTasks[0].fullTask }));
                      }}
                    >
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: dayTasks[0].color }}
                      />
                      {dayTasks.length > 1 && (
                        <span className="text-[10px] text-muted-foreground leading-none">+{dayTasks.length - 1}</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
