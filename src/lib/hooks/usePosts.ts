'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { PostType } from '@/types';

// Fetch posts client-side (for SPA-style feed)
async function fetchPosts(type?: PostType) {
  const supabase = createClient();
  let query = supabase
    .from('posts')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(50);

  if (type) {
    query = query.eq('type', type);
  }

  const { data: posts, error } = await query;
  if (error || !posts) return [];

  // Fetch related data
  const authorIds = [...new Set(posts.filter(p => !p.is_anonymous).map(p => p.author_id))];
  const { data: profiles } = authorIds.length > 0
    ? await supabase.from('profiles').select('*').in('id', authorIds)
    : { data: [] };
  const profileMap = new Map((profiles || []).map((p: Record<string, unknown>) => [p.id, p]));

  const postIds = posts.map(p => p.id);
  const { data: likesData } = await supabase.from('likes').select('post_id').in('post_id', postIds);
  const likesCount: Record<string, number> = {};
  (likesData || []).forEach((l: { post_id: string }) => {
    likesCount[l.post_id] = (likesCount[l.post_id] || 0) + 1;
  });

  const { data: commentsData } = await supabase.from('comments').select('post_id').in('post_id', postIds);
  const commentsCount: Record<string, number> = {};
  (commentsData || []).forEach((c: { post_id: string }) => {
    commentsCount[c.post_id] = (commentsCount[c.post_id] || 0) + 1;
  });

  return posts.map(post => ({
    ...post,
    profile: post.is_anonymous ? null : (profileMap.get(post.author_id) || null),
    likes_count: likesCount[post.id] || 0,
    comments_count: commentsCount[post.id] || 0,
  }));
}

export function usePosts(type?: PostType) {
  return useQuery({
    queryKey: ['posts', type || 'all'],
    queryFn: () => fetchPosts(type),
  });
}

// Like mutation
export function useLikeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      const res = await fetch('/api/engagement', {
        method: 'POST',
        body: JSON.stringify({ action: 'toggle_like', postId }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

// AI feature hook
export function useAI() {
  return useMutation({
    mutationFn: async (params: { action: string; content?: string; code?: string; language?: string; title?: string }) => {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'AI request failed');
      }
      return res.json();
    },
  });
}
