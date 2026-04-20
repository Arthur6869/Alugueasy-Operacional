import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useTasksContext } from '../../lib/TasksContext';

const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
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
        title: task.name,
        group: task.group,
        color: groupColors[task.group] || '#4A9EDB',
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
      <div className="p-8 pb-12 min-h-full">
        {/* Calendar Header */}
        <div className="bg-card border border-border rounded-xl p-6 mb-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">
              {months[currentMonth]} {currentYear}
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={prevMonth}
                className="p-2 hover:bg-muted rounded-lg transition-all transform hover:scale-110 text-foreground"
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
                className="p-2 hover:bg-muted rounded-lg transition-all transform hover:scale-110 text-foreground"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {daysOfWeek.map(day => (
              <div key={day} className="text-center font-medium text-muted-foreground text-sm py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-2">
            {/* Empty cells before first day */}
            {Array.from({ length: firstDay }).map((_, idx) => (
              <div key={`empty-${idx}`} className="aspect-square" />
            ))}

            {/* Days */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const dayTasks = getTasksForDay(day);
              const isToday = isCurrentMonthYear && day === todayDay;

              return (
                <div
                  key={day}
                  className={`aspect-square border rounded-lg p-2 hover:bg-muted transition-all cursor-pointer ${
                    isToday ? 'border-[#4A9EDB] border-2 bg-[#4A9EDB]/10' : 'border-border'
                  }`}
                  onClick={() => {
                    // Format date as YYYY-MM-DD for the date input
                    const selectedDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    window.dispatchEvent(new CustomEvent('openNewTaskWithDate', { detail: selectedDate }));
                  }}
                >
                  <div className={`text-sm font-medium mb-1 ${isToday ? 'text-[#4A9EDB]' : 'text-foreground'}`}>
                    {day}
                  </div>
                  <div className="space-y-1">
                    {dayTasks.slice(0, 2).map((task, idx) => (
                      <div
                        key={idx}
                        className="text-xs px-2 py-1 rounded text-white truncate"
                        style={{ backgroundColor: task.color }}
                      >
                        {task.title}
                      </div>
                    ))}
                    {dayTasks.length > 2 && (
                      <div className="text-xs text-muted-foreground px-2">
                        +{dayTasks.length - 2} mais
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
