'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { createNotification } from './notifications';

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
  const enriched = comments.map(c => {
    const isAnon = !!c.anon_id;
    return {
      ...c,
      user_id: isAnon ? 'HIDDEN' : c.user_id, // Safety lock
      profile: isAnon ? null : (profileMap.get(c.user_id) || null),
      anonymous_identity: c.anon_id ? (anonMap.get(c.anon_id) || null) : null,
      replies: [] as any[],
    };
  });

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

export async function addComment(postId: string, content: string, parentId?: string | null, isAnonymous: boolean = false) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Authentication required for dialogue participation.' };

  let anonId = null;
  if (isAnonymous) {
    const { data: identity } = await supabase
      .from('anonymous_identities')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();
    anonId = identity?.id;
  }

  const { error } = await supabase.from('comments').insert([{
    post_id: postId,
    user_id: user.id,
    anon_id: anonId,
    content,
    parent_id: parentId || null,
  }]);

  if (error) return { error: error.message };

  // Trigger Notifications
  const { data: post } = await supabase.from('posts').select('author_id').eq('id', postId).single();
  
  if (parentId) {
    // Reply notification
    const { data: parentComment } = await supabase.from('comments').select('user_id').eq('id', parentId).single();
    if (parentComment) {
      await createNotification(parentComment.user_id, user.id, 'reply', postId);
    }
  } else if (post) {
    // Comment on post notification
    await createNotification(post.author_id, user.id, 'comment', postId);
  }

  revalidatePath('/', 'layout');
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
