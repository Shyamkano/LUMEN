'use server';

import { createClient } from '@/lib/supabase/server';
import { createNotification } from './notifications';
import { revalidatePath } from 'next/cache';

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
  
  // 1. Increment total views on the post using the secure RPC
  // This bypasses RLS and handles atomicity
  const { error: rpcError } = await supabase.rpc('increment_post_views', { post_id_param: postId });

  if (rpcError) {
    console.warn('RPC View Increment failed, falling back:', rpcError);
    // Use an UPSERT approach for the fallback to avoid race conditions
    await supabase.rpc('increment_post_views_v2', { post_id_param: postId }); 
    // If V2 RPC not available, the existing trackView logic below still handles daily stats
  }

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
    .select('id, title, author_id, views, created_at, slug, validation_score, tags')
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

  // 3. Get Genealogy Stats (Forks)
  const { data: lineagePosts } = await supabase
    .from('posts')
    .select('id, views, validation_score')
    .or(`id.eq.${postId},parent_id.eq.${postId}`);

  const totalLineageViews = lineagePosts?.reduce((acc, p) => acc + (p.views || 0), 0) || 0;
  const forkCount = (lineagePosts?.length || 1) - 1;

  // 4. Get Total Resonance (Across the whole branch)
  const lineageIds = lineagePosts?.map(p => p.id) || [postId];
  const { count: globalLikes } = await supabase
    .from('likes')
    .select('id', { count: 'exact', head: true })
    .in('post_id', lineageIds);

  // 5. Aggregate totals
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
      avgTime: (post.views || 0) > 0 ? Math.round(totalTime / post.views) : 0,
      forkCount: forkCount,
      resonance: totalLineageViews + (globalLikes || 0),
      globalReach: totalLineageViews,
      validationDensity: post.validation_score || 100,
      niches: post.tags || []
    }
  };
}

export async function forkPost(postId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  // 1. Get original post
  const { data: originalPost } = await supabase
    .from('posts')
    .select('*')
    .eq('id', postId)
    .single();

  if (!originalPost) throw new Error('Original asset not found');
  if (originalPost.health_status === 'archived') throw new Error('This asset is archived and cannot be remixed.');

  // 2. Create entry in DRAFTS table (so editor can load it)
  const { data: draft, error } = await supabase
    .from('drafts')
    .insert([{
      user_id: user.id,
      title: `Remix: ${originalPost.title}`,
      content: originalPost.content,
      type: originalPost.type,
      tags: originalPost.tags || [],
      cover_image: originalPost.cover_image,
      parent_id: postId
    }])
    .select()
    .single();

  if (error) throw error;

  // 3. Notify original author
  await createNotification(
    originalPost.author_id,
    user.id,
    'post',
    postId // Link to original post
  );

  revalidatePath('/dashboard');
  return draft;
}

export async function validatePost(postId: string, isPositive: boolean, feedback?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  // 1. Record validation (Upsert to handle unique constraint)
  const { error } = await supabase
    .from('post_validations')
    .upsert([{
      post_id: postId,
      user_id: user.id,
      is_positive: isPositive,
      feedback
    }], { onConflict: 'post_id,user_id' });

  if (error) throw error;

  // 2. Recalculate health score
  const { data: validations } = await supabase
    .from('post_validations')
    .select('is_positive')
    .eq('post_id', postId);

  if (validations && validations.length > 0) {
    const positiveCount = validations.filter(v => v.is_positive).length;
    const totalCount = validations.length;
    const score = Math.round((positiveCount / totalCount) * 100);

    let healthStatus = 'certified';
    if (score < 40) healthStatus = 'archived';
    else if (score < 70) healthStatus = 'stale';

    await supabase
      .from('posts')
      .update({ 
        validation_score: score,
        health_status: healthStatus
      })
      .eq('id', postId);
  }

  revalidatePath(`/post/${postId}`);
  return { success: true };
}

export async function calculateLegacyScore(postId: string) {
  const supabase = await createClient();
  
  // 1. Get current post
  const { data: current } = await supabase.from('posts').select('content, parent_id').eq('id', postId).single();
  if (!current || !current.parent_id) return { originalPercentage: 100, remixerPercentage: 0 };

  // 2. Get parent post
  const { data: parent } = await supabase.from('posts').select('content').eq('id', current.parent_id).single();
  if (!parent) return { originalPercentage: 100, remixerPercentage: 0 };

  // 3. Narrative Identity Audit
  // We compare stringified JSON to detect zero-effort forks
  const parentContentStr = JSON.stringify(parent.content);
  const currentContentStr = JSON.stringify(current.content);
  
  if (parentContentStr === currentContentStr) {
    return { originalPercentage: 100, remixerPercentage: 0 };
  }

  // 4. Expansion Proportionality
  // We measure the delta in narrative density (nodes)
  const parentNodes = (parent.content as any)?.content?.length || 1;
  const currentNodes = (current.content as any)?.content?.length || 1;

  // Logic: The remixer only gains percentage for the NEW content they contribute
  // Baseline original contribution is preserved
  const addition = Math.max(0, currentNodes - parentNodes);
  const remixerPercentage = Math.min(80, Math.max(5, Math.round((addition / currentNodes) * 100)));
  const originalPercentage = 100 - remixerPercentage;

  return {
    originalPercentage,
    remixerPercentage
  };
}

export async function getNicheInsights() {
  const supabase = await createClient();
  
  // 1. Get all recent public posts (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: posts } = await supabase
    .from('posts')
    .select('id, tags, views, is_fork')
    .gte('created_at', thirtyDaysAgo.toISOString())
    .eq('status', 'published');

  if (!posts) return [];

  // 2. Aggregate by tag
  const nicheMap = new Map<string, { totalViews: number, postCount: number, forkCount: number, requestCount: number }>();

  // Fetch all open requests for mapping
  const { data: requests } = await supabase.from('post_requests').select('tags').eq('status', 'open');

  posts.forEach(post => {
    (post.tags || []).forEach((tag: string) => {
      const current = nicheMap.get(tag) || { totalViews: 0, postCount: 0, forkCount: 0, requestCount: 0 };
      nicheMap.set(tag, {
        totalViews: current.totalViews + (post.views || 0),
        postCount: current.postCount + 1,
        forkCount: current.forkCount + (post.is_fork ? 1 : 0),
        requestCount: current.requestCount
      });
    });
  });

  // Add request counts to the map
  requests?.forEach(req => {
     (req.tags || []).forEach((tag: string) => {
        const current = nicheMap.get(tag) || { totalViews: 0, postCount: 0, forkCount: 0, requestCount: 0 };
        current.requestCount += 1;
        nicheMap.set(tag, current);
     });
  });

  // 3. Calculate Intensity Score
  const results = Array.from(nicheMap.entries()).map(([tag, stats]) => {
    // Intensity = (Average Views * 0.4) + (Expansion Frequency * 0.6)
    // Scale it to 0-100
    const postCount = Math.max(1, stats.postCount);
    const avgViews = stats.totalViews / postCount;
    const expansionRatio = (stats.forkCount / postCount) * 100;
    
    // Simple normalization for a 0-100 intensity score
    const intensity = Math.min(100, Math.round((avgViews / 10) + (expansionRatio * 0.6) + (stats.requestCount * 2)));

    return {
      tag,
      totalViews: stats.totalViews,
      postCount: stats.postCount,
      requestCount: stats.requestCount,
      intensity
    };
  });

  return results.sort((a, b) => b.intensity - a.intensity).slice(0, 12);
}

export async function reportAsset(postId: string, reason: string, details?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  console.log('[SIGNAL_DIAGNOSTIC] Attempting Transmission:', { postId, reason, reporter: user?.id || 'anonymous' });

  const { error } = await supabase
    .from('reports')
    .insert([{
      post_id: postId,
      reporter_id: user?.id || null, // Allow anonymous signal transmission
      reason,
      details,
      status: 'pending'
    }]);

  if (error) {
    console.error('[SIGNAL_DIAGNOSTIC] Transmission Failed:', error);
    return { error: 'Failed to transmit report signal.' };
  }

  console.log('[SIGNAL_DIAGNOSTIC] Signal Received by Archive.');
  return { success: true };
}

export async function resolveReport(reportId: string, status: 'reviewed' | 'actioned') {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Authorization Denied.' };

  // 1. Architect Verification
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, username')
    .eq('id', user.id)
    .single();
  
  const isAuthorized = profile?.role === 'admin' || profile?.username === 'lumen';
  if (!isAuthorized) return { error: 'Insufficient Network Permissions.' };

  // 2. Resolve Signal
  const { error } = await supabase
    .from('reports')
    .update({ status })
    .eq('id', reportId);

  if (error) return { error: 'Failed to update signal status.' };

  revalidatePath('/admin');
  return { success: true };
}
