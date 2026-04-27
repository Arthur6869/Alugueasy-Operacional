import { createContext, useContext, useEffect, ReactNode } from 'react';
import { useNotifications, Notification } from '../hooks/useNotifications';

interface NotificationsContextValue {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  currentUser: string;
  fetchNotifications: (userName: string) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: (userName: string) => Promise<void>;
  createNotification: (params: {
    userName: string;
    type: Notification['type'];
    title: string;
    message: string;
    taskId?: string;
  }) => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function NotificationsProvider({ currentUser, children }: { currentUser: string; children: ReactNode }) {
  const hook = useNotifications();

  useEffect(() => {
    if (!currentUser) return;
    hook.fetchNotifications(currentUser);
    const interval = setInterval(() => hook.fetchNotifications(currentUser), 120_000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  return (
    <NotificationsContext.Provider value={{ ...hook, currentUser }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotificationsContext(): NotificationsContextValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotificationsContext deve ser usado dentro de NotificationsProvider');
  return ctx;
}
