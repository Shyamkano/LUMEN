'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import slugify from 'slugify';
import { v4 as uuidv4 } from 'uuid';
import { calculateReadTime } from '@/lib/utils';
import type { PostType, PostStatus } from '@/types';

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
    title, content, type = 'blog',
    is_anonymous = false, status = 'published',
    audio_url = null, cover_image = null,
    tags = [], code_snippets = [],
  } = formData;

  const finalTitle = title || `Post ${Date.now()}`;

  // Generate slug
  const baseSlug = slugify(finalTitle, { lower: true, strict: true });
  const slug = `${baseSlug}-${uuidv4().slice(0, 8)}`;

  // Calculate read time
  const read_time = calculateReadTime(content);

  let anonId = null;
  if (is_anonymous) {
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
      
      if (identError) console.error('Identity creation failed:', identError);
      anonId = newIdentity?.id;
    }
  }

  const { data: post, error } = await supabase
    .from('posts')
    .insert([{
      title: finalTitle,
      content,
      type,
      status,
      author_id: user.id,
      anon_id: anonId,
      slug,
      is_anonymous,
      audio_url,
      cover_image,
      tags,
      read_time,
    }])
    .select('id')
    .single();

  if (error || !post) {
    return { error: error?.message || 'Failed to create post' };
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
    title: finalTitle,
    version_num: 1,
  }]);

  revalidatePath('/');
  if (status === 'published') {
    redirect(`/post/${slug}`);
  }
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
  if (!user) return { error: 'Not authenticated' };

  // Get current version count
  const { count } = await supabase
    .from('post_versions')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', postId);

  const updateData: Record<string, unknown> = {};
  if (formData.title !== undefined) updateData.title = formData.title;
  if (formData.content !== undefined) {
    updateData.content = formData.content;
    updateData.read_time = calculateReadTime(formData.content);
  }
  if (formData.status !== undefined) updateData.status = formData.status;
  if (formData.cover_image !== undefined) updateData.cover_image = formData.cover_image;
  if (formData.tags !== undefined) updateData.tags = formData.tags;


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

  const { error } = await query;

  if (error) return { error: error.message };

  // Log Moderation Action if Admin
  if (isAdmin && formData.status !== undefined) {
    // Fetch target post info for the log
    const { data: targetPost } = await client.from('posts').select('author_id').eq('id', postId).single();
    
    await client.from('moderation_logs').insert([{
      admin_id: user.id,
      target_user_id: targetPost?.author_id,
      action_type: formData.status === 'draft' ? 'HIDE_POST' : 'RESTORE_POST',
      reason: `Post status changed via global moderation shield.`,
    }]);
  }

  // Save version
  if (formData.content !== undefined || formData.title !== undefined) {
    await supabase.from('post_versions').insert([{
      post_id: postId,
      content: formData.content,
      title: formData.title,
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
  revalidatePath('/admin');
  return { success: true };
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
    .map(post => ({
      ...post,
      author_id: post.is_anonymous ? 'HIDDEN' : post.author_id,
      profile: post.is_anonymous ? null : (profileMap.get(post.author_id) || null),
      anonymous_identity: post.is_anonymous ? (anonMap.get(post.author_id) || null) : null,
      likes_count: likesCount[post.id] || 0,
      comments_count: commentsCount[post.id] || 0,
    }));
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

  // Fetch likes and comments counts for these specific posts
  const postIds = posts.map(p => p.id);
  
  const { data: likesData } = await supabase
    .from('likes')
    .select('post_id')
    .in('post_id', postIds);

  const likesCount: Record<string, number> = {};
  (likesData || []).forEach(l => {
    likesCount[l.post_id] = (likesCount[l.post_id] || 0) + 1;
  });

  const { data: commentsData } = await supabase
    .from('comments')
    .select('post_id')
    .in('post_id', postIds);

  const commentsCount: Record<string, number> = {};
  (commentsData || []).forEach(c => {
    commentsCount[c.post_id] = (commentsCount[c.post_id] || 0) + 1;
  });

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

  const hydratedPosts = posts.map(post => ({
    ...post,
    author_id: post.is_anonymous ? 'HIDDEN' : post.author_id,
    profile: post.is_anonymous ? null : profile,
    anonymous_identity: post.is_anonymous ? (anonMap.get(profile.id) || null) : null,
    likes_count: likesCount[post.id] || 0,
    comments_count: commentsCount[post.id] || 0,
  }));

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
      return {
        ...post,
        author_id: isAnon ? 'HIDDEN' : post.author_id,
        profile: isAnon ? null : (profileMap.get(post.author_id) || null),
        anonymous_identity: isAnon ? (anonMap.get(post.author_id) || null) : null,
        likes_count: likesCount[post.id] || 0,
      };
    })
    .sort((a, b) => {
      if (b.likes_count !== a.likes_count) return b.likes_count - a.likes_count;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    })
    .slice(0, 5);
}
