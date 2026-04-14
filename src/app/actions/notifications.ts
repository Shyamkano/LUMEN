'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export type NotificationType = 'like' | 'comment' | 'follow' | 'mention' | 'reply' | 'system' | 'post';

export async function getNotifications() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  const { data: notifications, error } = await supabase
    .from('notifications')
    .select('*, actor:profiles!actor_id(*), post:posts(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error fetching notifications:', error);
    // Return empty if table doesn't exist yet to avoid crash
    return [];
  }

  return notifications || [];
}

export async function markAsRead(notificationId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('user_id', user.id);

  revalidatePath('/notifications');
}

export async function markAllAsRead() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false);

  revalidatePath('/notifications');
}

/**
 * Internal helper to create notifications. 
 * Note: Consumed by other server actions.
 */
export async function createNotification(
  recipientId: string,
  actorId: string,
  type: NotificationType,
  postId?: string | null,
  commentId?: string | null
) {
  // Prevent notifying yourself
  if (recipientId === actorId && type !== 'system') return;

  const supabase = await createClient();
  
  // Try to insert
  try {
    const { error } = await supabase.from('notifications').insert([{
      user_id: recipientId,
      actor_id: actorId,
      type,
      post_id: postId || null,
      comment_id: commentId || null,
      is_read: false
    }]);
    
    if (error) {
      console.warn('Could not create notification (table might not exist):', error.message);
    }
  } catch (e) {
    console.warn('Notification insert failed:', e);
  }
}

export async function getUnreadCount() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false);

  if (error) return 0;
  return count || 0;
}
