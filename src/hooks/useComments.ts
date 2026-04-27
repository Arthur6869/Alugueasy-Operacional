import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Comment {
  id: string;
  task_id: string;
  author: string;
  content: string;
  created_at: string;
}

interface UseCommentsReturn {
  comments: Comment[];
  loading: boolean;
  fetchComments: (taskId: string) => Promise<void>;
  addComment: (taskId: string, author: string, content: string) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
}

export function useComments(): UseCommentsReturn {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [subscribedTaskId, setSubscribedTaskId] = useState<string | null>(null);

  // Realtime para comentários filtrado pelo task_id ativo
  useEffect(() => {
    if (!subscribedTaskId) return;

    const channel = supabase
      .channel(`comments-${subscribedTaskId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'comments', filter: `task_id=eq.${subscribedTaskId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const incoming = payload.new as Comment;
            setComments(prev =>
              prev.find(c => c.id === incoming.id) ? prev : [...prev, incoming]
            );
          }
          if (payload.eventType === 'DELETE') {
            setComments(prev => prev.filter(c => c.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [subscribedTaskId]);

  const fetchComments = useCallback(async (taskId: string) => {
    setSubscribedTaskId(taskId);
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });

      if (error) { console.error('[useComments] fetchComments:', error); return; }
      setComments(data ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  const addComment = useCallback(async (taskId: string, author: string, content: string) => {
    const { data, error } = await supabase
      .from('comments')
      .insert({ task_id: taskId, author, content })
      .select()
      .single();

    if (error) { console.error('[useComments] addComment:', error); return; }
    // Deduplicação: Realtime pode chegar antes ou junto com o retorno do insert
    setComments(prev =>
      prev.find(c => c.id === data.id) ? prev : [...prev, data]
    );
  }, []);

  const deleteComment = useCallback(async (commentId: string) => {
    const { error } = await supabase.from('comments').delete().eq('id', commentId);
    if (error) { console.error('[useComments] deleteComment:', error); return; }
    setComments(prev => prev.filter(c => c.id !== commentId));
  }, []);

  return { comments, loading, fetchComments, addComment, deleteComment };
}
