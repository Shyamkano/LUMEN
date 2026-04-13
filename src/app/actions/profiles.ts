'use server';

import { createClient } from '@/lib/supabase/server';

export async function searchUsers(query: string) {
  const supabase = await createClient();
  
  // Sanitize query to prevent PGRST100 errors with special characters
  const safeQuery = query.replace(/[%,]/g, '');
  if (!safeQuery) return [];

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, username, avatar_url')
    .or(`username.ilike.%${safeQuery}%,full_name.ilike.%${safeQuery}%`)
    .limit(10);


  if (error) {
    console.error('Error searching users:', error);
    return [];
  }

  return data || [];
}

export async function getSearchSuggestions(query: string) {
  const supabase = await createClient();
  
  // Parallelize Search Queries
  const [
    { data: users },
    { data: posts }
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, username, avatar_url')
      .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
      .limit(5),
    supabase
      .from('posts')
      .select('id, title, slug')
      .ilike('title', `%${query}%`)
      .eq('status', 'published')
      .limit(5)
  ]);
    
  return {
    users: users || [],
    posts: posts || []
  };
}

export async function getPreferences() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('notification_settings')
    .select('*')
    .eq('user_id', user.id)
    .single();

  return data || {
    email_signals: true,
    push_signals: false,
    mentions: true,
    network_updates: true,
    high_contrast: true,
    motion_reduction: false
  };
}

export async function updatePreferences(prefs: any) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Auth required' };

  const { error } = await supabase
    .from('notification_settings')
    .upsert({
      user_id: user.id,
      ...prefs,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

  if (error) {
    console.error('Preference update failed:', error);
    return { error: error.message };
  }

  return { success: true };
}


