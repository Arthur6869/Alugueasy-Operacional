import { Bell, Clock, User, CheckCircle2, CheckCheck, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNotificationsContext } from '../../lib/NotificationsContext';
import { useTasksContext } from '../../lib/TasksContext';
import { Notification } from '../../hooks/useNotifications';

const typeIcon: Record<Notification['type'], React.ElementType> = {
  due_soon: Clock,
  overdue: Clock,
  assigned: User,
  status_changed: CheckCircle2,
  comment_added: MessageCircle,
};

const typeColor: Record<Notification['type'], string> = {
  due_soon: 'text-amber-500',
  overdue: 'text-red-500',
  assigned: 'text-blue-500',
  status_changed: 'text-green-500',
  comment_added: 'text-purple-500',
};

export function NotificationsPanel() {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, currentUser } =
    useNotificationsContext();
  const { tasks } = useTasksContext();

  const handleClick = async (notif: Notification) => {
    if (!notif.read) await markAsRead(notif.id);
    if (notif.task_id) {
      const task = tasks.find(t => t.id === notif.task_id);
      if (task) {
        window.dispatchEvent(new CustomEvent('openTaskDetail', { detail: task }));
      }
    }
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar bg-background">
      <div className="p-4 md:p-8 pb-12 min-h-full">
        <div className="bg-card border border-border rounded-xl shadow-sm">
          {/* Header */}
          <div className="flex items-center justify-between p-4 md:p-6 border-b border-border">
            <div>
              <h2 className="text-xl font-bold text-foreground">Notificações</h2>
              {unreadCount > 0 && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  {unreadCount} não lida{unreadCount > 1 ? 's' : ''}
                </p>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsRead(currentUser)}
                className="flex items-center gap-1.5 text-sm text-[#4A9EDB] hover:text-[#2A4F7C] transition-colors"
              >
                <CheckCheck size={16} />
                <span className="hidden sm:inline">Marcar todas como lidas</span>
                <span className="sm:hidden">Marcar lidas</span>
              </button>
            )}
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <span className="text-muted-foreground text-sm">Carregando...</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Bell size={48} className="text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground font-medium">Sem notificações</p>
              <p className="text-sm text-muted-foreground/70 mt-1">Você está em dia com tudo!</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notif) => {
                const Icon = typeIcon[notif.type] ?? Bell;
                const iconColor = typeColor[notif.type] ?? 'text-muted-foreground';

                return (
                  <button
                    key={notif.id}
                    onClick={() => handleClick(notif)}
                    className={`w-full flex items-start gap-3 px-4 md:px-6 py-4 text-left hover:bg-muted/50 transition-colors ${
                      !notif.read ? 'bg-[#4A9EDB]/5' : ''
                    }`}
                  >
                    <div className={`mt-0.5 shrink-0 ${iconColor}`}>
                      <Icon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm ${!notif.read ? 'font-semibold' : 'font-medium'} text-foreground`}>
                          {notif.title}
                        </p>
                        {!notif.read && (
                          <span className="shrink-0 w-2 h-2 rounded-full bg-[#4A9EDB] mt-1.5" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: ptBR })}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
