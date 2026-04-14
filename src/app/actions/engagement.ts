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
    
    // Increment daily likes in analytics
    const today = new Date().toISOString().split('T')[0];
    const { data: existing } = await supabase
      .from('post_analytics')
      .select('id, likes')
      .eq('post_id', postId)
      .eq('date', today)
      .maybeSingle();
      
    if (existing) {
      await supabase.from('post_analytics').update({ likes: (existing.likes || 0) + 1 }).eq('id', existing.id);
    } else {
      await supabase.from('post_analytics').insert([{ post_id: postId, date: today, likes: 1 }]);
    }

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

/**
 * Increments the view count for a post and updates daily analytics.
 */
export async function trackView(postId: string) {
  const supabase = await createClient();
  
  // 1. Increment total views on the post
  // We use RPC for atomic increment if available, but falling back to manual for now
  // Since we don't have the RPC defined in the DB yet, we'll try a simple update
  // Ideal: supabase.rpc('increment_views', { post_id: postId })
  
  const { data: post, error: fetchError } = await supabase
    .from('posts')
    .select('views')
    .eq('id', postId)
    .single();

  if (fetchError) return;

  await supabase
    .from('posts')
    .update({ views: (post.views || 0) + 1 })
    .eq('id', postId);

  // 2. Update daily analytics
  const today = new Date().toISOString().split('T')[0];
  
  // Try to upsert daily analytics
  // First check if exists
  const { data: existingAnalytics } = await supabase
    .from('post_analytics')
    .select('id, views')
    .eq('post_id', postId)
    .eq('date', today)
    .maybeSingle();

  if (existingAnalytics) {
    await supabase
      .from('post_analytics')
      .update({ views: (existingAnalytics.views || 0) + 1 })
      .eq('id', existingAnalytics.id);
  } else {
    await supabase
      .from('post_analytics')
      .insert([{
        post_id: postId,
        date: today,
        views: 1
      }]);
  }
}

export async function getUserAnalytics() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // 1. Get all user posts
  const { data: posts } = await supabase
    .from('posts')
    .select('id, title, views, created_at')
    .eq('author_id', user.id);

  if (!posts) return null;

  const postIds = posts.map(p => p.id);
  
  // 2. Get total likes and comments
  const [
    { count: totalLikes },
    { count: totalComments },
    { count: totalFollowers }
  ] = await Promise.all([
    supabase.from('likes').select('*', { count: 'exact', head: true }).in('post_id', postIds),
    supabase.from('comments').select('*', { count: 'exact', head: true }).in('post_id', postIds),
    supabase.from('followers').select('*', { count: 'exact', head: true }).eq('following_id', user.id)
  ]);

  // 3. Get daily analytics for the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const { data: dailyAnalytics } = await supabase
    .from('post_analytics')
    .select('*')
    .in('post_id', postIds)
    .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
    .order('date', { ascending: true });

  // Aggregate daily stats
  const aggregateDaily: Record<string, { views: number, date: string }> = {};
  dailyAnalytics?.forEach(rec => {
    if (!aggregateDaily[rec.date]) {
      aggregateDaily[rec.date] = { views: 0, date: rec.date };
    }
    aggregateDaily[rec.date].views += rec.views || 0;
  });

  const totalViews = posts.reduce((acc, p) => acc + (p.views || 0), 0);
  const totalTimeSpent = dailyAnalytics?.reduce((acc, rec) => acc + (rec.time_spent_seconds || 0), 0) || 0;

  return {
    totalViews,
    totalLikes: totalLikes || 0,
    totalComments: totalComments || 0,
    totalFollowers: totalFollowers || 0,
    totalTimeSpent,
    averageTimeSpent: totalViews > 0 ? Math.round(totalTimeSpent / totalViews) : 0,
    postsCount: posts.length,
    dailyReach: Object.values(aggregateDaily),
    topPosts: posts.sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5)
  };
}

export async function recordTimeSpent(postId: string, seconds: number) {
  const supabase = await createClient();
  const today = new Date().toISOString().split('T')[0];

  const { data: existing } = await supabase
    .from('post_analytics')
    .select('id, time_spent_seconds')
    .eq('post_id', postId)
    .eq('date', today)
    .maybeSingle();

  if (existing) {
    await supabase
      .from('post_analytics')
      .update({ time_spent_seconds: (existing.time_spent_seconds || 0) + seconds })
      .eq('id', existing.id);
  } else {
    // This shouldn't usually happen because view tracking creates the record, 
    // but we'll handle it for robustness
    await supabase
      .from('post_analytics')
      .insert([{
        post_id: postId,
        date: today,
        time_spent_seconds: seconds
      }]);
  }
}

export async function getIndividualPostAnalytics(postId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // 1. Verify ownership
  const { data: post } = await supabase
    .from('posts')
    .select('id, title, author_id, views, created_at, slug')
    .eq('id', postId)
    .single();

  if (!post || (post.author_id !== user.id)) return null;

  // 2. Fetch daily stats (last 60 days)
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  const { data: daily } = await supabase
    .from('post_analytics')
    .select('*')
    .eq('post_id', postId)
    .gte('date', sixtyDaysAgo.toISOString().split('T')[0])
    .order('date', { ascending: true });

  // 3. Aggregate totals
  const totalLikes = daily?.reduce((acc, d) => acc + (d.likes || 0), 0) || 0;
  const totalComments = daily?.reduce((acc, d) => acc + (d.comments || 0), 0) || 0;
  const totalTime = daily?.reduce((acc, d) => acc + (d.time_spent_seconds || 0), 0) || 0;

  return {
    post,
    daily: daily || [],
    totals: {
      views: post.views || 0,
      likes: totalLikes,
      comments: totalComments,
      timeSpent: totalTime,
      avgTime: (post.views || 0) > 0 ? Math.round(totalTime / post.views) : 0
    }
  };
}
