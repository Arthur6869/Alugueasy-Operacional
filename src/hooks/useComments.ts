import { useState, useCallback } from 'react';
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

  const fetchComments = useCallback(async (taskId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('[useComments] fetchComments:', error);
        return;
      }
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

    if (error) {
      console.error('[useComments] addComment:', error);
      return;
    }
    setComments(prev => [...prev, data]);
  }, []);

  const deleteComment = useCallback(async (commentId: string) => {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (error) {
      console.error('[useComments] deleteComment:', error);
      return;
    }
    setComments(prev => prev.filter(c => c.id !== commentId));
  }, []);

  return { comments, loading, fetchComments, addComment, deleteComment };
}
