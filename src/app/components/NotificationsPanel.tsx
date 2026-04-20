import { TeamAvatar } from './TeamAvatar';
import { MessageCircle, UserPlus, CheckCircle2, Clock, TrendingUp } from 'lucide-react';

const notifications = [
  {
    id: '1',
    type: 'assignment',
    user: 'Yasmim' as const,
    message: 'te atribuiu em',
    task: 'Revisar contratos Q3',
    time: '2h atrás',
    unread: true,
    icon: UserPlus,
  },
  {
    id: '2',
    type: 'comment',
    user: 'Alexandre' as const,
    message: 'comentou em',
    task: 'Deploy produção',
    time: '5h atrás',
    unread: true,
    icon: MessageCircle,
  },
  {
    id: '3',
    type: 'deadline',
    user: null,
    message: 'Prazo vencendo amanhã:',
    task: 'Relatório financeiro',
    time: '1d atrás',
    unread: true,
    icon: Clock,
  },
  {
    id: '4',
    type: 'complete',
    user: 'Nikolas' as const,
    message: 'concluiu',
    task: 'Setup banco de dados',
    time: '2d atrás',
    unread: false,
    icon: CheckCircle2,
  },
  {
    id: '5',
    type: 'moved',
    user: 'Arthur' as const,
    message: 'moveu',
    task: 'Reunião cliente',
    time: '3d atrás',
    unread: false,
    icon: TrendingUp,
  },
];

export function NotificationsPanel() {
  return (
    <div className="h-full overflow-y-auto custom-scrollbar bg-background">
      <div className="p-8 pb-12 min-h-full">
        <div className="bg-white rounded-xl shadow-sm">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-[#111827]">Notificações</h2>
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('showToast', {
                  detail: { type: 'success', message: 'Todas as notificações foram marcadas como lidas' }
                }));
              }}
              className="text-sm text-[#4A9EDB] hover:underline transform hover:scale-105 transition-all"
            >
              Marcar todas como lidas
            </button>
          </div>

          {/* Notifications List */}
          <div className="divide-y divide-gray-100">
            {notifications.map(notification => {
              const Icon = notification.icon;
              return (
                <div
                  key={notification.id}
                  className={`p-5 hover:bg-gray-50 transition-all cursor-pointer ${
                    notification.unread ? 'bg-blue-50 border-l-4 border-[#4A9EDB]' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {notification.user ? (
                      <TeamAvatar member={notification.user} size="md" />
                    ) : (
                      <div className="w-8 h-8 bg-[#F59E0B] rounded-full flex items-center justify-center">
                        <Icon size={16} className="text-white" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-sm text-[#111827]">
                        {notification.user && (
                          <span className="font-medium">{notification.user} </span>
                        )}
                        <span>{notification.message} </span>
                        <span className="font-medium text-[#4A9EDB]">"{notification.task}"</span>
                      </p>
                      <p className="text-xs text-[#6B7280] mt-1">{notification.time}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={() => alert('Visualizar histórico completo de notificações')}
              className="w-full py-2 text-sm text-[#4A9EDB] hover:bg-blue-50 rounded-lg transition-all transform hover:scale-105"
            >
              Ver todas as notificações
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
