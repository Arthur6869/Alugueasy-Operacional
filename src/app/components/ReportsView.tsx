import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const statusData = [
  { id: 'status-1', name: 'Pendente', value: 3 },
  { id: 'status-2', name: 'Em Andamento', value: 7 },
  { id: 'status-3', name: 'Revisão', value: 3 },
  { id: 'status-4', name: 'Concluído', value: 5 },
];

const memberData = [
  { id: 'member-1', name: 'Arthur', tarefas: 5, concluidas: 2 },
  { id: 'member-2', name: 'Yasmim', tarefas: 4, concluidas: 1 },
  { id: 'member-3', name: 'Alexandre', tarefas: 6, concluidas: 2 },
  { id: 'member-4', name: 'Nikolas', tarefas: 3, concluidas: 1 },
];

const timelineData = [
  { id: 'week-1', semana: 'Sem 1', criadas: 4, concluidas: 2 },
  { id: 'week-2', semana: 'Sem 2', criadas: 6, concluidas: 3 },
  { id: 'week-3', semana: 'Sem 3', criadas: 5, concluidas: 4 },
  { id: 'week-4', semana: 'Sem 4', criadas: 3, concluidas: 5 },
];

const COLORS = ['#9CA3AF', '#3B82F6', '#F59E0B', '#22C55E'];

export function ReportsView() {
  return (
    <div className="h-full overflow-y-auto custom-scrollbar bg-background">
      <div className="p-8 pb-12 min-h-full">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Relatórios e Análises</h1>
          <p className="text-sm text-muted-foreground">Visão geral do desempenho da equipe</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { id: 'stat-total', label: 'Total de Tarefas', value: '18', color: '#4A9EDB' },
            { id: 'stat-taxa', label: 'Taxa de Conclusão', value: '44%', color: '#22C55E' },
            { id: 'stat-media', label: 'Média por Membro', value: '4.5', color: '#F59E0B' },
            { id: 'stat-criticas', label: 'Tarefas Críticas', value: '3', color: '#EF4444' },
          ].map((stat) => (
            <div key={stat.id} className="bg-card border border-border rounded-xl p-5 shadow-sm">
              <p className="text-sm text-muted-foreground mb-2">{stat.label}</p>
              <p className="text-3xl font-bold" style={{ color: stat.color }}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Status Distribution */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-foreground mb-4">Distribuição por Status</h3>
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
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-foreground mb-4">Desempenho por Membro</h3>
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
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-foreground mb-4">Evolução Semanal</h3>
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
