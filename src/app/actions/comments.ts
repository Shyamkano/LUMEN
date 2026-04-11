'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getComments(postId: string) {
  const supabase = await createClient();

  const { data: comments, error } = await supabase
    .from('comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error || !comments) return [];

  // Fetch profiles for non-anon comments
  const userIds = [...new Set(comments.filter(c => c.user_id).map(c => c.user_id))];
  const { data: profiles } = userIds.length > 0
    ? await supabase.from('profiles').select('*').in('id', userIds)
    : { data: [] };
  const profileMap = new Map((profiles || []).map(p => [p.id, p]));

  // Fetch anonymous identities
  const anonIds = [...new Set(comments.filter(c => c.anon_id).map(c => c.anon_id))];
  const { data: anonIdentities } = anonIds.length > 0
    ? await supabase.from('anonymous_identities').select('*').in('id', anonIds)
    : { data: [] };
  const anonMap = new Map((anonIdentities || []).map(a => [a.id, a]));

  // Build tree
  const enriched = comments.map(c => ({
    ...c,
    profile: c.user_id ? (profileMap.get(c.user_id) || null) : null,
    anonymous_identity: c.anon_id ? (anonMap.get(c.anon_id) || null) : null,
    replies: [] as typeof comments,
  }));

  const topLevel = enriched.filter(c => !c.parent_id);
  const replies = enriched.filter(c => c.parent_id);
  const commentMap = new Map(enriched.map(c => [c.id, c]));

  replies.forEach(reply => {
    const parent = commentMap.get(reply.parent_id);
    if (parent) {
      parent.replies.push(reply);
    }
  });

  return topLevel;
}

export async function addComment(postId: string, content: string, parentId?: string | null) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'You must be logged in to comment.' };

  const { error } = await supabase.from('comments').insert([{
    post_id: postId,
    user_id: user.id,
    content,
    parent_id: parentId || null,
  }]);

  if (error) return { error: error.message };

  revalidatePath('/');
  return { success: true };
}

export async function deleteComment(commentId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId)
    .eq('user_id', user.id);

  if (error) return { error: error.message };

  revalidatePath('/');
  return { success: true };
}
