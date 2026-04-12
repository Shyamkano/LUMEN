'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function deleteUser(userId: string, reason: string = 'Violated platform protocols.') {
  const supabase = await createClient();
  const { data: { user: admin } } = await supabase.auth.getUser();
  
  // 1. Log the action before deletion
  await supabase.from('moderation_logs').insert([{
    admin_id: admin?.id,
    target_id: userId,
    action_type: 'delete_user',
    reason
  }]);

  // 2. Perform deletion
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', userId);

  if (error) {
    console.error('Error deleting user:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/admin');
  return { success: true };
}

export async function toggleBanUser(userId: string, currentStatus: boolean, reason: string = 'Security synchronization required.') {
  const supabase = await createClient();
  const { data: { user: admin } } = await supabase.auth.getUser();
  
  const isBanning = !currentStatus;

  // 1. Perform Update
  const { error } = await supabase
    .from('profiles')
    .update({ is_banned: isBanning })
    .eq('id', userId);

  if (error) {
    console.error('Error banning user:', error);
    return { success: false, error: error.message };
  }

  // 2. Log Action
  await supabase.from('moderation_logs').insert([{
    admin_id: admin?.id,
    target_id: userId,
    action_type: isBanning ? 'ban' : 'unban',
    reason
  }]);

  revalidatePath('/admin');
  revalidatePath('/feed');
  return { success: true };
}
