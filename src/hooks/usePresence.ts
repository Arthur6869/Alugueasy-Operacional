import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

export interface UserPresence {
  user_name: string;
  color: string;
  current_view: string;
  last_seen: string;
}

const memberColors: Record<string, string> = {
  Arthur: '#3b82f6',
  Yasmim: '#ec4899',
  Alexandre: '#8b5cf6',
  Nikolas: '#10b981',
};

export function usePresence(userName: string, currentView: string = 'board') {
  const [onlineUsers, setOnlineUsers] = useState<UserPresence[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const subscribedRef = useRef(false);

  // Monta o canal de presence uma vez por usuário
  useEffect(() => {
    if (!userName) return;

    const channel = supabase.channel('presence-global', {
      config: { presence: { key: userName } },
    });

    channelRef.current = channel;
    subscribedRef.current = false;

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<UserPresence>();
        // Cada key tem um array de presences — pega a mais recente por usuário
        const users = Object.values(state).map(presences => presences[0]).filter(Boolean);
        setOnlineUsers(users as UserPresence[]);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          subscribedRef.current = true;
          await channel.track({
            user_name: userName,
            color: memberColors[userName] ?? '#6b7280',
            current_view: currentView,
            last_seen: new Date().toISOString(),
          });
        }
      });

    return () => {
      subscribedRef.current = false;
      channel.untrack();
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  // currentView intencionalmente fora das deps — atualizado via efeito separado
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userName]);

  // Atualiza current_view sem re-subscrever no canal
  useEffect(() => {
    if (!channelRef.current || !subscribedRef.current || !userName) return;
    channelRef.current.track({
      user_name: userName,
      color: memberColors[userName] ?? '#6b7280',
      current_view: currentView,
      last_seen: new Date().toISOString(),
    });
  }, [currentView, userName]);

  return { onlineUsers };
}
