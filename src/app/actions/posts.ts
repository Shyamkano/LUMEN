'use server';

import { createClient } from '@/lib/supabase/server';
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

  const { data: post, error } = await supabase
    .from('posts')
    .insert([{
      title: finalTitle,
      content,
      type,
      status,
      author_id: user.id,
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


  const { error } = await supabase
    .from('posts')
    .update(updateData)
    .eq('id', postId)
    .eq('author_id', user.id);

  if (error) return { error: error.message };

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

  revalidatePath('/');
  revalidatePath('/dashboard');
  return { success: true };
}

export async function deletePost(postId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId)
    .eq('author_id', user.id);

  if (error) return { error: error.message };

  revalidatePath('/');
  revalidatePath('/dashboard');
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
  const authorIds = [...new Set(posts.filter(p => !p.is_anonymous).map(p => p.author_id))];
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

  return posts.map(post => ({
    ...post,
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
  const { data: profile } = !post.is_anonymous
    ? await supabase.from('profiles').select('*').eq('id', post.author_id).single()
    : { data: null };

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
    profile: profile || null,
    anonymous_identity: anonIdentity || null,
    code_snippets: codeSnippets || [],
    audio_metadata: audioMeta || null,
    likes_count: likesCount || 0,
    comments_count: commentsCount || 0,
  };
}

export async function getPostsByUsername(username: string) {
  const supabase = await createClient();
  const cleanUsername = username.replace('@', '');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', cleanUsername)
    .single();

  if (!profile) return { posts: [], profile: null };

  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .eq('author_id', profile.id)
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  return { posts: posts || [], profile };
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
