'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { PostType } from '@/types';

// Fetch posts client-side (for SPA-style feed)
async function fetchPosts(type?: PostType | 'discovery' | 'shadows', tag?: string) {
  const supabase = createClient();
  let query = supabase
    .from('posts')
    .select('*')
    .eq('status', 'published')
    .limit(80);

  if (tag) {
    query = query.contains('tags', [tag]);
  }

  if (type === 'shadows') {
    query = query.eq('is_anonymous', true);
  } else if (type && type !== 'discovery') {
    query = query.eq('type', type);
  }

  const { data: posts, error } = await query;
  if (error || !posts) return [];

  // If discovery or shadows, shuffle them locally
  let finalPosts = [...posts];
  if (type === 'discovery' || type === 'shadows') {
    finalPosts = finalPosts.sort(() => Math.random() - 0.5);
  } else {
    finalPosts = finalPosts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  // Fetch profiles and related data for truncated set
  const visiblePosts = finalPosts.slice(0, 50);
  const authorIds = [...new Set(visiblePosts.map(p => p.author_id))];
  
  const { data: profiles } = authorIds.length > 0
    ? await supabase.from('profiles').select('*').in('id', authorIds)
    : { data: [] };
  const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

  // Fetch anonymous identities
  const { data: anonIdentities } = await supabase.from('anonymous_identities').select('*').in('user_id', authorIds);
  const anonMap = new Map((anonIdentities || []).map((a: any) => [a.user_id, a]));

  const postIds = visiblePosts.map(p => p.id);
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

  return visiblePosts.map(post => ({
    ...post,
    profile: post.is_anonymous ? null : (profileMap.get(post.author_id) || null),
    anonymous_identity: post.is_anonymous ? (anonMap.get(post.author_id) || null) : null,
    likes_count: likesCount[post.id] || 0,
    comments_count: commentsCount[post.id] || 0,
  }));
}

export function usePosts(type?: PostType | 'discovery' | 'shadows', tag?: string) {
  return useQuery({
    queryKey: ['posts', type || 'all', tag || 'none'],
    queryFn: () => fetchPosts(type, tag),
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
