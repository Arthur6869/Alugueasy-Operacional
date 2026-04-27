import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Download } from 'lucide-react';
import { useTasksContext } from '../../lib/TasksContext';
import { exportToCSV, exportToExcel } from '../../lib/exportData';

const COLORS = ['#9CA3AF', '#3B82F6', '#F59E0B', '#22C55E'];

export function ReportsView() {
  const { tasks } = useTasksContext();
  const [exporting, setExporting] = useState(false);

  const statusCounts = tasks.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusData = [
    { id: 'status-1', name: 'Pendente', value: statusCounts['Pendente'] || 0 },
    { id: 'status-2', name: 'Em Andamento', value: statusCounts['Em Andamento'] || 0 },
    { id: 'status-3', name: 'Revisão', value: statusCounts['Revisão'] || 0 },
    { id: 'status-4', name: 'Concluído', value: statusCounts['Concluído'] || 0 },
  ];

  const memberData = ['Arthur', 'Yasmim', 'Alexandre', 'Nikolas'].map((member, i) => {
    const memberTasks = tasks.filter((t) => t.assignee === member);
    return {
      id: `member-${i + 1}`,
      name: member,
      tarefas: memberTasks.length,
      concluidas: memberTasks.filter((t) => t.status === 'Concluído').length,
    };
  });

  const now = new Date();
  const timelineData = Array.from({ length: 4 }, (_, i) => {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - (3 - i) * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    const weekTasks = tasks.filter((t) => {
      if (!t.due_date) return false;
      const d = new Date(t.due_date);
      return d >= weekStart && d < weekEnd;
    });
    return {
      id: `week-${i + 1}`,
      semana: `Sem ${i + 1}`,
      criadas: weekTasks.length,
      concluidas: weekTasks.filter((t) => t.status === 'Concluído').length,
    };
  });

  const total = tasks.length;
  const concluidas = tasks.filter((t) => t.status === 'Concluído').length;
  const taxa = total > 0 ? Math.round((concluidas / total) * 100) : 0;
  const criticas = tasks.filter((t) => t.priority === 'Crítica').length;
  const mediaPorMembro = total > 0 ? (total / 4).toFixed(1) : '0';

  return (
    <div className="h-full overflow-y-auto custom-scrollbar bg-background">
      <div className="p-4 md:p-8 pb-12 min-h-full">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">Relatórios e Análises</h1>
            <p className="text-sm text-muted-foreground">Visão geral do desempenho da equipe</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              disabled={exporting}
              onClick={async () => {
                setExporting(true);
                try { exportToCSV(tasks, `relatorio_alugueasy_${new Date().toISOString().split('T')[0]}.csv`); }
                finally { setExporting(false); }
              }}
              className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-lg hover:bg-muted/50 text-sm font-medium transition-all disabled:opacity-50"
              title="Exportar CSV"
            >
              {exporting
                ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                : <Download size={14} />}
              <span className="hidden sm:inline">CSV</span>
            </button>
            <button
              disabled={exporting}
              onClick={async () => {
                setExporting(true);
                try { exportToExcel(tasks, `relatorio_alugueasy_${new Date().toISOString().split('T')[0]}.xlsx`); }
                finally { setExporting(false); }
              }}
              className="flex items-center gap-1.5 px-3 py-2 border border-[#10B981] text-[#10B981] rounded-lg hover:bg-[#10B981]/10 text-sm font-medium transition-all disabled:opacity-50"
              title="Exportar Excel"
            >
              {exporting
                ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                : <Download size={14} />}
              <span className="hidden sm:inline">Excel</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
          {[
            { id: 'stat-total', label: 'Total de Tarefas', value: String(total), color: '#4A9EDB' },
            { id: 'stat-taxa', label: 'Taxa de Conclusão', value: `${taxa}%`, color: '#22C55E' },
            { id: 'stat-media', label: 'Média por Membro', value: mediaPorMembro, color: '#F59E0B' },
            { id: 'stat-criticas', label: 'Tarefas Críticas', value: String(criticas), color: '#EF4444' },
          ].map((stat) => (
            <div key={stat.id} className="bg-card border border-border rounded-xl p-4 md:p-5 shadow-sm">
              <p className="text-xs md:text-sm text-muted-foreground mb-2">{stat.label}</p>
              <p className="text-xl md:text-3xl font-bold" style={{ color: stat.color }}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6">
          {/* Status Distribution */}
          <div className="bg-card border border-border rounded-xl p-4 md:p-6 shadow-sm">
            <h3 className="text-base md:text-lg font-bold text-foreground mb-4">Distribuição por Status</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry) => (
                    <Cell key={entry.id} fill={COLORS[statusData.indexOf(entry) % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Member Performance */}
          <div className="bg-card border border-border rounded-xl p-4 md:p-6 shadow-sm">
            <h3 className="text-base md:text-lg font-bold text-foreground mb-4">Desempenho por Membro</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={memberData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar key="bar-tarefas" dataKey="tarefas" fill="#4A9EDB" name="Total" />
                <Bar key="bar-concluidas" dataKey="concluidas" fill="#22C55E" name="Concluídas" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Timeline Chart */}
        <div className="bg-card border border-border rounded-xl p-4 md:p-6 shadow-sm">
          <h3 className="text-base md:text-lg font-bold text-foreground mb-4">Evolução Semanal</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="semana" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line key="line-criadas" type="monotone" dataKey="criadas" stroke="#4A9EDB" strokeWidth={2} name="Criadas" />
              <Line key="line-concluidas" type="monotone" dataKey="concluidas" stroke="#22C55E" strokeWidth={2} name="Concluídas" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
