'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createNotification } from './notifications';
import slugify from 'slugify';
import { v4 as uuidv4 } from 'uuid';
import { calculateReadTime } from '@/lib/utils';
import type { PostType, PostStatus } from '@/types';

/**
 * Normalizes content before saving to ensure image nodes have proper src attributes
 * This is a critical fix for the image URL serialization issue
 * Converts Server Component references to plain objects first
 */
function normalizeContentForStorage(content: any, depth = 0): any {
  if (!content || typeof content !== 'object') return content;
  
  const indent = '  '.repeat(depth);
  
  // Convert Server Component reference to plain object
  const plainContent = JSON.parse(JSON.stringify(content));
  
  console.log(`${indent}[normalizeContentForStorage] [depth=${depth}] type=${plainContent.type}, hasAttrs=${!!plainContent.attrs}`);
  
  // Normalize image nodes
  if (plainContent.type === 'lumenImage') {
    console.log(`${indent}  → Found lumenImage node!`);
    if (plainContent.attrs) {
      console.log(`${indent}  ✓ attrs exist:`, JSON.stringify(plainContent.attrs));
      // Ensure both src and url are set to the same value
      const imageUrl = plainContent.attrs.src || plainContent.attrs.url;
      if (imageUrl) {
        plainContent.attrs.src = imageUrl;
        plainContent.attrs.url = imageUrl;
        console.log(`${indent}  ✓ Image attrs preserved - src/url set`);
      }
    } else {
      console.log(`${indent}  ❌ NO ATTRS on lumenImage node!`);
    }
  }
  
  // Recursively process nested content
  if (plainContent.content && Array.isArray(plainContent.content)) {
    console.log(`${indent}  Processing ${plainContent.content.length} child nodes`);
    plainContent.content = plainContent.content.map((child: any, idx: number) => {
      console.log(`${indent}  [${idx}] Processing child...`);
      return normalizeContentForStorage(child, depth + 1);
    });
  }
  
  return plainContent;
}

export async function createPost(formData: {
  title?: string | null;
  content: Record<string, unknown> | null;
  type: PostType;
  is_anonymous?: boolean;
  status?: PostStatus;
  audio_url?: string | null;
  cover_image?: string | null;
  tags?: string[] | null;
  code_snippets?: { code: string; language: string; title?: string }[];
}) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'You must be logged in to create a post.' };
  }

  const {
    title: rawTitle, content: rawContent, type = 'blog',
    is_anonymous = false, status = 'published',
    audio_url = null, cover_image = null,
    tags = [], code_snippets = [],
  } = formData;

  console.log('[createPost] Received raw content:', JSON.stringify(rawContent, null, 2));

  // Normalize content to ensure image URLs are preserved
  const content = normalizeContentForStorage(rawContent);

  console.log('[createPost] Normalized content:', JSON.stringify(content, null, 2));

  const title = rawTitle || `Post ${Date.now()}`;

  // Generate slug
  const baseSlug = slugify(title, { lower: true, strict: true });
  const slug = `${baseSlug}-${uuidv4().slice(0, 8)}`;

  // Calculate read time
  const read_time = calculateReadTime(content);

  let anonId = null;
  if (is_anonymous) {
    try {
      // 1. Check for existing identity
      const { data: identity } = await supabase
        .from('anonymous_identities')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();
        
      if (identity) {
        anonId = identity.id;
      } else {
        // 2. First-time anonymous poster? Create their identity now.
        const { data: newIdentity, error: identError } = await supabase
          .from('anonymous_identities')
          .insert([{ 
            user_id: user.id, 
            alias_name: `Resident-${user.id.slice(0, 4)}`,
            avatar_seed: Math.random().toString(36).substring(7)
          }])
          .select('id')
          .single();
        
        if (identError) {
          console.error('Identity creation failed:', identError);
          return { error: `Anonymous Protocol Failure: ${identError.message}` };
        }
        anonId = newIdentity?.id;
      }
    } catch (e) {
      console.error('Anon identity logic error:', e);
    }
  }

  console.log('[createPost] === ABOUT TO INSERT INTO POSTS ===');
  console.log('[createPost] content.type:', content.type);
  console.log('[createPost] content nodes count:', content?.content?.length);
  
  // Check specifically for lumenImage nodes BEFORE insert
  if (content?.content) {
    content.content.forEach((node: any, idx: number) => {
      if (node.type === 'lumenImage') {
        console.log(`[createPost] Node #${idx} is lumenImage - attrs:`, node.attrs ? JSON.stringify(node.attrs) : 'MISSING!');
      }
    });
  }
  
  console.log('[createPost] About to insert, content for DB:', JSON.stringify(content, null, 2));

  const { data: post, error } = await supabase
    .from('posts')
    .insert([{
      title: title,
      content,
      type,
      status,
      author_id: user.id,
      anon_id: anonId || null,
      slug,
      is_anonymous,
      audio_url,
      cover_image,
      tags: Array.isArray(tags) ? tags : [],
      read_time,
    }])
    .select('id')
    .single();

  if (error || !post) {
    console.error('Post creation error:', error);
    return { error: error?.message || 'Failed to initialize synchronization.' };
  }
  
  console.log('[createPost] ✅ Post created with ID:', post.id);
  console.log('[createPost] Saved to DB - now fetching back to verify...');
  
  // Immediately fetch back to verify what was saved
  const { data: verifyPost } = await supabase
    .from('posts')
    .select('content')
    .eq('id', post.id)
    .single();
  
  if (verifyPost?.content) {
    console.log('[createPost] ✅ Verified in DB - content retrieved');
    console.log('[createPost] DB content.type:', verifyPost.content.type);
    console.log('[createPost] DB content nodes count:', verifyPost.content?.content?.length);
    
    // Check lumenImage nodes in verified content
    if (verifyPost.content?.content) {
      verifyPost.content.content.forEach((node: any, idx: number) => {
        if (node.type === 'lumenImage') {
          console.log(`[createPost] DB Node #${idx} is lumenImage - attrs:`, node.attrs ? JSON.stringify(node.attrs) : 'MISSING!!!');
        }
      });
    }
    
    console.log('[createPost] Full verified content:', JSON.stringify(verifyPost.content, null, 2));
  } else {
    console.error('[createPost] ❌ Could not verify - verifyPost is undefined');
  }

  // Insert audio metadata if any
  if (audio_url && type === 'audio') {
    await supabase.from('audio_metadata').insert([{
      post_id: post.id,
      audio_url,
    }]);
  }

  // Insert code snippets if any
  if (code_snippets.length > 0 && (type === 'code' || type === 'blog')) {
    const snippets = code_snippets.map(s => ({
      post_id: post.id,
      code: s.code,
      language: s.language,
      title: s.title || null,
    }));

    await supabase.from('code_snippets').insert(snippets);
  }

  // Create initial version
  await supabase.from('post_versions').insert([{
    post_id: post.id,
    content,
    title: title,
    version_num: 1,
  }]);

  // Notify followers if published
  if (status === 'published') {
    const { data: followers } = await supabase
      .from('followers')
      .select('follower_id')
      .eq('following_id', user.id);
      
    if (followers && followers.length > 0) {
      await Promise.all(followers.map(f => 
        createNotification(f.follower_id, user.id, 'post', post.id)
      ));
    }
  }

  revalidatePath('/');
  revalidatePath('/feed');
  revalidatePath('/dashboard');
  
  return { success: true, slug };
}

export async function updatePost(
  postId: string,
  formData: {
    title?: string;
    content?: Record<string, unknown> | null;
    status?: PostStatus;
    cover_image?: string | null;
    tags?: string[] | null;
    code_snippets?: { code: string; language: string; title?: string }[];
  }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Access Denied: You must be logged in to modify logs.' };

  // Get current version count
  const { count } = await supabase
    .from('post_versions')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', postId);

  const updateData: Record<string, any> = {};
  if (formData.title !== undefined) updateData.title = formData.title;
  if (formData.content !== undefined) {
    // Normalize content to ensure image URLs are preserved
    updateData.content = normalizeContentForStorage(formData.content);
    updateData.read_time = calculateReadTime(updateData.content);
  }
  if (formData.status !== undefined) updateData.status = formData.status;
  if (formData.cover_image !== undefined) updateData.cover_image = formData.cover_image;
  if (formData.tags !== undefined) updateData.tags = Array.isArray(formData.tags) ? formData.tags : [];


  // Check if user is admin
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  
  const isAdmin = profile?.role === 'admin';
  const client = isAdmin ? createAdminClient() : supabase;
  
  const query = client
    .from('posts')
    .update(updateData)
    .eq('id', postId);

  if (!isAdmin) {
    query.eq('author_id', user.id);
  }

  const { data: updatedPost, error } = await query.select('slug').single();

  if (error) {
    console.error('Update error:', error);
    return { error: `Update Protocol Failed: ${error.message}` };
  }

  // Log Moderation Action if Admin
  if (isAdmin && formData.status !== undefined) {
    // Fetch target author info for the log
    const { data: targetPost } = await client.from('posts').select('author_id').eq('id', postId).single();
    
    await client.from('moderation_logs').insert([{
      admin_id: user.id,
      post_id: postId,
      action: `status_change_${formData.status}`,
    }]);
  }

  // Create new version if content changed
  if (formData.content !== undefined) {
    await supabase.from('post_versions').insert([{
      post_id: postId,
      content: updateData.content, // Use normalized content from updateData
      title: formData.title || updateData.title || (await supabase.from('posts').select('title').eq('id', postId).single()).data?.title,
      version_num: (count || 0) + 1,
    }]);
  }

  // Update code snippets
  if (formData.code_snippets !== undefined) {
    await supabase.from('code_snippets').delete().eq('post_id', postId);
    if (formData.code_snippets.length > 0) {
      await supabase.from('code_snippets').insert(
        formData.code_snippets.map(s => ({
          post_id: postId,
          code: s.code,
          language: s.language,
          title: s.title || null,
        }))
      );
    }
  }

  revalidatePath('/', 'layout');
  revalidatePath('/feed');
  revalidatePath('/dashboard');
  if (updatedPost?.slug) {
    revalidatePath(`/post/${updatedPost.slug}`);
  }
  
  return { success: true, slug: updatedPost?.slug };
}



export async function deletePost(postId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Access Denied: You must be logged in to terminate an archive entry.' };

  // Check if user is admin
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  const isAdmin = profile?.role === 'admin';
  const client = isAdmin ? createAdminClient() : supabase;
  
  const query = client
    .from('posts')
    .delete()
    .eq('id', postId);

  if (!isAdmin) {
    query.eq('author_id', user.id);
  }

  const { error } = await query;

  if (error) {
    console.error('Delete error:', error);
    return { error: `Deletion Protocol Failed: ${error.message}` };
  }

  // Log Moderation Action if Admin
  if (isAdmin) {
    await client.from('moderation_logs').insert([{
      admin_id: user.id,
      action_type: 'DELETE_POST',
      reason: `Post ID ${postId} permanently terminated by administrator.`,
    }]);
  }

  // Force revalidation across the network
  revalidatePath('/', 'layout');
  revalidatePath('/feed');
  revalidatePath('/dashboard');
  revalidatePath('/admin');
  
  return { success: true };
}

export async function getPosts(options?: {
  type?: PostType;
  limit?: number;
  offset?: number;
}) {
  const supabase = await createClient();
  let query = supabase
    .from('posts')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  if (options?.type) {
    query = query.eq('type', options.type);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }
  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
  }

  const { data: posts, error } = await query;

  if (error || !posts) {
    console.error('Error fetching posts:', error);
    return [];
  }

  // Fetch profiles
  const authorIds = [...new Set(posts.map(p => p.author_id))];
  const { data: profiles } = authorIds.length > 0
    ? await supabase.from('profiles').select('*').in('id', authorIds)
    : { data: [] };
  const profileMap = new Map((profiles || []).map(p => [p.id, p]));

  // Fetch anonymous identities for anon posts
  const anonAuthorIds = [...new Set(posts.filter(p => p.is_anonymous).map(p => p.author_id))];
  const { data: anonIdentities } = anonAuthorIds.length > 0
    ? await supabase.from('anonymous_identities').select('*').in('user_id', anonAuthorIds)
    : { data: [] };
  const anonMap = new Map((anonIdentities || []).map(a => [a.user_id, a]));

  // Fetch likes counts
  const postIds = posts.map(p => p.id);
  const { data: likesData } = await supabase
    .from('likes')
    .select('post_id')
    .in('post_id', postIds);

  const likesCount: Record<string, number> = {};
  (likesData || []).forEach(l => {
    likesCount[l.post_id] = (likesCount[l.post_id] || 0) + 1;
  });

  // Fetch comments counts
  const { data: commentsData } = await supabase
    .from('comments')
    .select('post_id')
    .in('post_id', postIds);

  const commentsCount: Record<string, number> = {};
  (commentsData || []).forEach(c => {
    commentsCount[c.post_id] = (commentsCount[c.post_id] || 0) + 1;
  });

  return posts
    .filter(post => {
      const author = profileMap.get(post.author_id);
      return author && !author.is_banned;
    })
    .map(post => {
      const originalAuthorId = post.author_id;
      return {
        ...post,
        author_id: post.is_anonymous ? 'HIDDEN' : originalAuthorId,
        profile: post.is_anonymous ? null : (profileMap.get(originalAuthorId) || null),
        anonymous_identity: post.is_anonymous ? (anonMap.get(originalAuthorId) || null) : null,
        likes_count: likesCount[post.id] || 0,
        comments_count: commentsCount[post.id] || 0,
      };
    });
}

export async function getPostBySlug(slug: string) {
  const supabase = await createClient();
  const { data: post, error } = await supabase
    .from('posts')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !post) return null;

  // Profile
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', post.author_id).single();
  
  if (profile?.is_banned) return null; // Hide if author is banned

  // Anonymous identity
  const { data: anonIdentity } = post.is_anonymous
    ? await supabase.from('anonymous_identities').select('*').eq('user_id', post.author_id).single()
    : { data: null };

  // Code snippets
  const { data: codeSnippets } = await supabase
    .from('code_snippets')
    .select('*')
    .eq('post_id', post.id)
    .order('created_at');

  // Audio metadata
  const { data: audioMeta } = await supabase
    .from('audio_metadata')
    .select('*')
    .eq('post_id', post.id)
    .single();

  // Likes count
  const { count: likesCount } = await supabase
    .from('likes')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', post.id);

  // Comments count
  const { count: commentsCount } = await supabase
    .from('comments')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', post.id);

  console.log('[getPostBySlug] Retrieved post content from DB:', post.content);
  
  return {
    ...post,
    author_id: post.is_anonymous ? 'HIDDEN' : post.author_id,
    profile: post.is_anonymous ? null : (profile || null),
    anonymous_identity: anonIdentity || null,
    code_snippets: codeSnippets || [],
    audio_metadata: audioMeta || null,
    likes_count: likesCount || 0,
    comments_count: commentsCount || 0,
  };
}

export async function getPostsByUsername(username: string) {
  const supabase = await createClient();
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  
  // Fetch current user's role if logged in
  const { data: currentUserProfile } = currentUser 
    ? await supabase.from('profiles').select('role').eq('id', currentUser.id).single()
    : { data: null };

  const cleanUsername = username.replace('@', '');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', cleanUsername)
    .single();

  if (!profile) return { posts: [], profile: null };

  let query = supabase
    .from('posts')
    .select('*')
    .eq('author_id', profile.id)
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  // If not the owner and not an admin, hide anonymous posts
  if (currentUser?.id !== profile.id && currentUserProfile?.role !== 'admin') {
    query = query.eq('is_anonymous', false);
  }

  const { data: posts } = await query;
  if (!posts) return { posts: [], profile };

  // Parallelize metrics and identity fetching
  const postIds = posts.map(p => p.id);
  const authorIds = [profile.id]; // In this context, all posts are by the same profile owner

  const [
    { data: likesData },
    { data: commentsData },
    { data: anonIdentities },
    { data: followingData }
  ] = await Promise.all([
    supabase.from('likes').select('post_id').in('post_id', postIds),
    supabase.from('comments').select('post_id').in('post_id', postIds),
    supabase.from('anonymous_identities').select('*').in('user_id', authorIds),
    currentUser 
      ? supabase.from('followers').select('following_id').eq('follower_id', currentUser.id).in('following_id', authorIds)
      : Promise.resolve({ data: [] })
  ]);

  const followingSet = new Set((followingData || []).map(f => f.following_id));
  const likesCount: Record<string, number> = {};
  (likesData || []).forEach(l => { likesCount[l.post_id] = (likesCount[l.post_id] || 0) + 1; });

  const commentsCount: Record<string, number> = {};
  (commentsData || []).forEach(c => { commentsCount[c.post_id] = (commentsCount[c.post_id] || 0) + 1; });

  // Fetch anonymous identities if any
  const hasAnon = posts.some(p => p.is_anonymous);
  let anonMap = new Map();
  if (hasAnon) {
    const { data: identities } = await supabase
      .from('anonymous_identities')
      .select('*')
      .eq('user_id', profile.id);
    anonMap = new Map((identities || []).map(i => [i.user_id, i]));
  }

  const hydratedPosts = posts.map(post => {
    const originalAuthorId = post.author_id;
    return {
      ...post,
      author_id: post.is_anonymous ? 'HIDDEN' : originalAuthorId,
      profile: post.is_anonymous ? null : profile,
      anonymous_identity: post.is_anonymous ? (anonMap.get(originalAuthorId) || null) : null,
      likes_count: likesCount[post.id] || 0,
      comments_count: commentsCount[post.id] || 0,
      isFollowing: followingSet.has(originalAuthorId),
    };
  });

  return { posts: hydratedPosts, profile };
}
export async function getPostById(id: string) {
  const supabase = await createClient();
  const { data: post, error } = await supabase
    .from('posts')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !post) return null;

  // Code snippets
  const { data: codeSnippets } = await supabase
    .from('code_snippets')
    .select('*')
    .eq('post_id', post.id)
    .order('created_at');

  return {
    ...post,
    code_snippets: codeSnippets || [],
  };
}

export async function getPostsByAlias(aliasName: string) {
  const supabase = await createClient();
  
  // 1. Find the anonymous identity matching this alias
  const { data: identity, error: identityError } = await supabase
    .from('anonymous_identities')
    .select('*')
    .ilike('alias_name', aliasName)
    .single();

  if (identityError || !identity) {
    console.error('Error fetching identity:', identityError);
    return { posts: [], identity: null };
  }

  // 2. Fetch all published posts linked to this specific identity
  const { data: posts, error: postsError } = await supabase
    .from('posts')
    .select('*')
    .eq('anon_id', identity.id)
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  if (postsError || !posts) {
    console.error('Error fetching posts by alias:', postsError);
    return { posts: [], identity };
  }

  // Hydrate with counts
  const postIds = posts.map(p => p.id);
  const { data: likesData } = await supabase.from('likes').select('post_id').in('post_id', postIds);
  const likesCount: Record<string, number> = {};
  (likesData || []).forEach(l => { likesCount[l.post_id] = (likesCount[l.post_id] || 0) + 1; });

  const { data: commentsData } = await supabase.from('comments').select('post_id').in('post_id', postIds);
  const commentsCount: Record<string, number> = {};
  (commentsData || []).forEach(c => { commentsCount[c.post_id] = (commentsCount[c.post_id] || 0) + 1; });

  return {
    posts: posts.map(p => ({
      ...p,
      likes_count: likesCount[p.id] || 0,
      comments_count: commentsCount[p.id] || 0,
      anonymous_identity: identity 
    })),
    identity
  };
}

export async function getTrendingPosts() {
  const supabase = await createClient();
  
  // 1. Fetch recent candidate posts
  const { data: posts, error } = await supabase
    .from('posts')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error || !posts) return [];

  // 2. Fetch engagement signals
  const postIds = posts.map(p => p.id);
  const { data: likesData } = await supabase.from('likes').select('post_id').in('post_id', postIds);
  const likesCount: Record<string, number> = {};
  (likesData || []).forEach(l => { likesCount[l.post_id] = (likesCount[l.post_id] || 0) + 1; });

  // 3. Batch fetch profiles
  const authorIds = [...new Set(posts.map(p => p.author_id))];
  const { data: profiles } = await supabase.from('profiles').select('*').in('id', authorIds);
  const profileMap = new Map((profiles || []).map(p => [p.id, p]));

  // 4. Batch fetch shadow identities
  const anonAuthorIds = [...new Set(posts.filter(p => p.is_anonymous).map(p => p.author_id))];
  const { data: anonIdentities } = anonAuthorIds.length > 0
    ? await supabase.from('anonymous_identities').select('*').in('user_id', anonAuthorIds)
    : { data: [] };
  const anonMap = new Map((anonIdentities || []).map(ai => [ai.user_id, ai]));

  // 5. Synthesize and Rank
  return posts
    .map(post => {
      const isAnon = post.is_anonymous;
      const originalAuthorId = post.author_id;
      return {
        ...post,
        author_id: isAnon ? 'HIDDEN' : originalAuthorId,
        profile: isAnon ? null : (profileMap.get(originalAuthorId) || null),
        anonymous_identity: isAnon ? (anonMap.get(originalAuthorId) || null) : null,
        likes_count: likesCount[post.id] || 0,
      };
    })
    .sort((a, b) => {
      if (b.likes_count !== a.likes_count) return b.likes_count - a.likes_count;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    })
    .slice(0, 5);
}

export async function getPopularTags(limit = 15) {
  const supabase = await createClient();
  const { data: posts } = await supabase
    .from('posts')
    .select('tags')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(200);

  const tagCounts: Record<string, number> = {};
  posts?.forEach(p => {
    if (Array.isArray(p.tags)) {
      p.tags.forEach(t => {
        tagCounts[t] = (tagCounts[t] || 0) + 1;
      });
    }
  });

  // Default fallback tags if data is sparse
  const fallbackTags = [
    'Education', 'Programming', 'Self Improvement', 'Productivity', 'Research', 'Life Logs', 
    'AI', 'Coding', 'Design', 'Future', 'Tech', 'Startup', 'Health', 'Mental Health', 'Writing',
    'Science', 'Math', 'Philosophy', 'Art', 'Music', 'Economics', 'Politics', 'History',
    'Engineering', 'Biology', 'Physics', 'Space', 'Environment', 'Food', 'Travel', 'Fashion',
    'Gaming', 'Movies', 'Books', 'News', 'Culture', 'Social Media', 'Marketing', 'Business'
  ];

  const trendingTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([tag]) => tag);

  // Combine trending and fallbacks, then deduplicate
  const allTags = [...new Set([...trendingTags, ...fallbackTags])];
  
  return allTags.slice(0, limit);
}

