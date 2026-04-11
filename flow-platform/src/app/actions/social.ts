'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Toggles follow status for a user.
 * Assumes a 'followers' table exists with:
 * - follower_id (UUID, references profiles.id)
 * - following_id (UUID, references profiles.id)
 */
export async function toggleFollow(followingId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'You must be logged in to follow users.' };
  if (user.id === followingId) return { error: 'You cannot follow yourself.' };

  // Check if already following
  const { data: existing } = await supabase
    .from('followers')
    .select('id')
    .eq('follower_id', user.id)
    .eq('following_id', followingId)
    .single();

  if (existing) {
    // Unfollow
    const { error } = await supabase
      .from('followers')
      .delete()
      .eq('id', existing.id);
    
    if (error) return { error: error.message };
    
    revalidatePath(`/profile/${followingId}`);
    return { following: false };
  } else {
    // Follow
    const { error } = await supabase
      .from('followers')
      .insert([{
        follower_id: user.id,
        following_id: followingId,
      }]);
    
    if (error) return { error: error.message };
    
    revalidatePath(`/profile/${followingId}`);
    return { following: true };
  }
}

export async function checkFollowing(followingId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return false;

  const { data } = await supabase
    .from('followers')
    .select('id')
    .eq('follower_id', user.id)
    .eq('following_id', followingId)
    .single();

  return !!data;
}

export async function getFollowStats(userId: string) {
  const supabase = await createClient();
  
  const { count: followersCount } = await supabase
    .from('followers')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', userId);

  const { count: followingCount } = await supabase
    .from('followers')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', userId);

  return {
    followers: followersCount || 0,
    following: followingCount || 0,
  };
}

export async function getFollowers(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('followers')
    .select('profiles!follower_id(*)')
    .eq('following_id', userId);
    
  if (error) {
    console.error('Error fetching followers:', error);
    return [];
  }
  return data?.map(d => d.profiles) || [];
}

export async function getFollowing(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('followers')
    .select('profiles!following_id(*)')
    .eq('follower_id', userId);

  if (error) {
    console.error('Error fetching following:', error);
    return [];
  }
  return data?.map(d => d.profiles) || [];
}

