import { createContext, useContext, useEffect, ReactNode } from 'react';
import { supabase } from './supabase';
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
  const { fetchNotifications, addFromRealtime, ...rest } = useNotifications();

  useEffect(() => {
    if (!currentUser) return;

    // Carregamento inicial
    fetchNotifications(currentUser);

    // Realtime substitui o polling — recebe novos INSERTs em tempo real
    const channel = supabase
      .channel(`notifications-${currentUser}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_name=eq.${currentUser}`,
        },
        (payload) => {
          addFromRealtime(payload.new as Notification);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentUser, fetchNotifications, addFromRealtime]);

  return (
    <NotificationsContext.Provider value={{ ...rest, fetchNotifications, currentUser }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotificationsContext(): NotificationsContextValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotificationsContext deve ser usado dentro de NotificationsProvider');
  return ctx;
}
