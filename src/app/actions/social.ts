'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { createNotification } from './notifications';

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
    
    // Trigger notification
    await createNotification(followingId, user.id, 'follow');

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
  
  // 1. Get IDs of people following this user
  const { data: followerRelations, error } = await supabase
    .from('followers')
    .select('follower_id')
    .eq('following_id', userId);
    
  if (error || !followerRelations) {
    console.error('Error fetching follower IDs:', error);
    return [];
  }

  const followerIds = followerRelations.map(r => r.follower_id);
  if (followerIds.length === 0) return [];

  // 2. Fetch the profiles for those IDs
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .in('id', followerIds);

  if (profileError) {
    console.error('Error fetching profiles for followers:', profileError);
    return [];
  }

  return profiles || [];
}

export async function getFollowing(userId: string) {
  const supabase = await createClient();
  
  // 1. Get IDs of people this user is following
  const { data: followingRelations, error } = await supabase
    .from('followers')
    .select('following_id')
    .eq('follower_id', userId);

  if (error || !followingRelations) {
    console.error('Error fetching following IDs:', error);
    return [];
  }

  const followingIds = followingRelations.map(r => r.following_id);
  if (followingIds.length === 0) return [];

  // 2. Fetch the profiles for those IDs
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .in('id', followingIds);

  if (profileError) {
    console.error('Error fetching profiles for following:', profileError);
    return [];
  }

  return profiles || [];
}

