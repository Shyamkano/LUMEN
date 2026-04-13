'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { createNotification } from './notifications';

export async function toggleLike(postId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'You must be logged in to like posts.' };

  // Check existing
  const { data: existing } = await supabase
    .from('likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', user.id)
    .single();

  if (existing) {
    // Unlike
    await supabase.from('likes').delete().eq('id', existing.id);
    revalidatePath('/');
    return { liked: false };
  } else {
    // Like
    const { error } = await supabase.from('likes').insert([{
      post_id: postId,
      user_id: user.id,
    }]);
    if (error) return { error: error.message };

    // Trigger notification
    const { data: post } = await supabase.from('posts').select('author_id').eq('id', postId).single();
    if (post) {
      await createNotification(post.author_id, user.id, 'like', postId);
    }

    revalidatePath('/');
    return { liked: true };
  }
}

export async function checkUserLiked(postId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from('likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', user.id)
    .single();

  return !!data;
}

export async function toggleBookmark(postId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'You must be logged in to bookmark posts.' };

  const { data: existing } = await supabase
    .from('bookmarks')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', user.id)
    .single();

  if (existing) {
    await supabase.from('bookmarks').delete().eq('id', existing.id);
    return { bookmarked: false };
  } else {
    const { error } = await supabase.from('bookmarks').insert([{
      post_id: postId,
      user_id: user.id,
    }]);
    if (error) return { error: error.message };
    return { bookmarked: true };
  }
}

export async function checkUserBookmarked(postId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from('bookmarks')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', user.id)
    .single();

  return !!data;
}

export async function getUserBookmarks() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: bookmarks, error } = await supabase
    .from('bookmarks')
    .select('*, post:posts(*)')
    .eq('user_id', user.id);

  if (error || !bookmarks) {
    console.error('Error fetching bookmarks:', error);
    return [];
  }

  const rawPosts = bookmarks.map(b => b.post).filter(Boolean);
  if (rawPosts.length === 0) return [];

  const postIds = rawPosts.map(p => p.id);
  const authorIds = [...new Set(rawPosts.map(p => p.author_id))];

  // Parallelize metrics and identity fetching
  const [
    { data: profiles },
    { data: anonIdentities },
    { data: likesData },
    { data: commentsData },
    { data: followingData }
  ] = await Promise.all([
    supabase.from('profiles').select('*').in('id', authorIds),
    supabase.from('anonymous_identities').select('*').in('user_id', authorIds),
    supabase.from('likes').select('post_id').in('post_id', postIds),
    supabase.from('comments').select('post_id').in('post_id', postIds),
    supabase.from('followers').select('following_id').eq('follower_id', user.id).in('following_id', authorIds)
  ]);

  const followingSet = new Set((followingData || []).map(f => f.following_id));
  const profileMap = new Map((profiles || []).map(p => [p.id, p]));
  const anonMap = new Map((anonIdentities || []).map(a => [a.user_id, a]));
  
  const likesCount: Record<string, number> = {};
  (likesData || []).forEach(l => { likesCount[l.post_id] = (likesCount[l.post_id] || 0) + 1; });
  const commentsCount: Record<string, number> = {};
  (commentsData || []).forEach(c => { commentsCount[c.post_id] = (commentsCount[c.post_id] || 0) + 1; });

  return rawPosts.map(post => ({
    ...post,
    profile: profileMap.get(post.author_id) || null,
    anonymous_identity: post.is_anonymous ? (anonMap.get(post.author_id) || null) : null,
    likes_count: likesCount[post.id] || 0,
    comments_count: commentsCount[post.id] || 0,
    isFollowing: followingSet.has(post.author_id),
  }));
}
