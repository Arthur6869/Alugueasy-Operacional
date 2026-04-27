import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface Notification {
  id: string;
  user_name: string;
  type: 'due_soon' | 'overdue' | 'assigned' | 'status_changed' | 'comment_added';
  title: string;
  message: string;
  task_id?: string;
  read: boolean;
  created_at: string;
}

interface CreateNotificationParams {
  userName: string;
  type: Notification['type'];
  title: string;
  message: string;
  taskId?: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const fetchNotifications = useCallback(async (userName: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_name', userName)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) { console.error('[useNotifications] fetch:', error); return; }
      setNotifications(data ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (notificationId: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);
    if (error) { console.error('[useNotifications] markAsRead:', error); return; }
    setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read: true } : n));
  }, []);

  const markAllAsRead = useCallback(async (userName: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_name', userName)
      .eq('read', false);
    if (error) { console.error('[useNotifications] markAllAsRead:', error); return; }
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const createNotification = useCallback(async ({ userName, type, title, message, taskId }: CreateNotificationParams) => {
    const { error } = await supabase
      .from('notifications')
      .insert({ user_name: userName, type, title, message, task_id: taskId ?? null });
    if (error) { console.error('[useNotifications] create:', error); return; }
    setNotifications(prev => [{
      id: crypto.randomUUID(),
      user_name: userName,
      type,
      title,
      message,
      task_id: taskId,
      read: false,
      created_at: new Date().toISOString(),
    }, ...prev]);
  }, []);

  return { notifications, unreadCount, loading, fetchNotifications, markAsRead, markAllAsRead, createNotification };
}
