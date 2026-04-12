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
  
  // 1. Search Users
  const { data: users } = await supabase
    .from('profiles')
    .select('id, full_name, username, avatar_url')
    .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
    .limit(5);

  // 2. Search Posts (Titles)
  const { data: posts } = await supabase
    .from('posts')
    .select('id, title, slug')
    .ilike('title', `%${query}%`)
    .eq('status', 'published')
    .limit(5);
    
  return {
    users: users || [],
    posts: posts || []
  };
}

