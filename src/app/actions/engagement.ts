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
