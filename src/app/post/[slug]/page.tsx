import { getPostBySlug } from '@/app/actions/posts';
import { PostAssetMeta } from '@/components/post/PostAssetMeta';
import { checkUserLiked, checkUserBookmarked } from '@/app/actions/engagement';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import { ArchivalReader } from '@/components/post/ArchivalReader';
import { User, FileText, Code, Mic, Zap, Ghost } from 'lucide-react';
import { PostActions } from '@/components/post/PostActions';
import { PostActions as AuthorActions } from '@/components/dashboard/PostActions';
import { PostAdminActions } from '@/components/admin/PostAdminActions';
import { CommentSection } from '@/components/comments/CommentSection';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { FollowButton } from '@/components/social/FollowButton';
import { TrendingUp, BarChart } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { AudioPlayer } from '@/components/audio/AudioPlayer';
import type { Metadata } from 'next';
import { ReadingProgressBar } from '@/components/post/ReadingProgressBar';
import { ViewTracker } from '@/components/post/ViewTracker';
import { Eye } from 'lucide-react';

// Archival Rendering moved to ArchivalReader client component





interface PostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: 'Post Not Found' };

  const description = post.is_anonymous 
    ? `A ${post.type} post by an anonymous resident.` 
    : `A ${post.type} post by ${post.profile?.full_name || post.profile?.username || 'a resident'}.`;

  const ogImage = post.cover_image || 'https://lumen-archive.vercel.app/og-default.png';

  return {
    title: `${post.title} - LUMEN`,
    description: description,
    openGraph: {
      title: post.title,
      description: description,
      images: [{ url: ogImage, width: 1200, height: 630, alt: post.title }],
      type: 'article',
      siteName: 'LUMEN',
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: description,
      images: [ogImage],
    },
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: currentUserProfile } = user 
    ? await supabase.from('profiles').select('role').eq('id', user.id).single()
    : { data: null };

  const isOwnPost = user?.id === post.author_id;
  const isAdmin = currentUserProfile?.role === 'admin';

  const contentObj = typeof post.content === 'string' 
    ? JSON.parse(post.content) 
    : post.content;

  console.log('[PostPage] Retrieved post.content from DB:', post.content);
  console.log('[PostPage] Parsed contentObj:', contentObj);
  
  // Log lumenImage nodes specifically
  if (contentObj?.content) {
    contentObj.content.forEach((node: any, idx: number) => {
      if (node.type === 'lumenImage') {
        console.log(`[PostPage] lumenImage node #${idx}:`, node.attrs);
      }
    });
  }

  const isLiked = await checkUserLiked(post.id);
  const isBookmarked = await checkUserBookmarked(post.id);

  // Fetch follow status for the author
  const { checkFollowing } = await import('@/app/actions/social');
  const initialIsFollowing = (!post.is_anonymous && user) ? await checkFollowing(post.author_id) : false;

  const authorName = post.is_anonymous
    ? (post.anonymous_identity?.alias_name || 'Anonymous')
    : (post.profile?.full_name || post.profile?.username || 'Archive Resident');

  const TYPE_ICONS = { blog: FileText, micro: Zap, code: Code, audio: Mic };
  const TypeIcon = TYPE_ICONS[post.type as keyof typeof TYPE_ICONS] || FileText;

  // Fetch more from author
  const { data: moreFromAuthor } = await supabase
    .from('posts')
    .select('id, title, slug, created_at, type')
    .eq('author_id', post.author_id)
    .eq('status', 'published')
    .neq('id', post.id)
    .order('created_at', { ascending: false })
    .limit(3);


  return (
    <main className="min-h-screen bg-background text-foreground overflow-x-hidden transition-colors duration-500">
      <ReadingProgressBar />
      <ViewTracker postId={post.id} />

      {/* Sidebar-like layout for large screens */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 md:gap-16 px-4 md:px-6 py-12 md:py-20">

        <article className="max-w-screen-md mx-auto w-full animate-reveal px-2 md:px-0">
          {/* Top Metadata */}
          <div className="flex items-center justify-between gap-4 mb-8 md:mb-12">
            <div className="flex items-center gap-4">
              <Link href="/feed" className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground transition-colors">
                Home
              </Link>
              <span className="text-border">/</span>
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-foreground">
                {post.type}
              </span>
            </div>

            <div className="flex items-center gap-4">
              {isAdmin && (
                <div className="flex items-center gap-2 pr-4 border-r border-border">
                  <span className="text-[10px] font-black uppercase tracking-widest text-red-600">Admin Controls</span>
                  <PostAdminActions 
                    postId={post.id} 
                    postTitle={post.title} 
                    isPublished={post.status === 'published'} 
                  />
                </div>
              )}
              {isOwnPost && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mr-2">Management</span>
                  <Link href={`/post/${post.slug}/analytics`}>
                    <Button variant="outline" className="h-10 w-10 p-0 rounded-full border-border hover:border-foreground bg-muted/5">
                      <TrendingUp size={16} />
                    </Button>
                  </Link>
                  <AuthorActions id={post.id} type="post" slug={post.slug} />
                </div>
              )}
            </div>
          </div>


          <h1 id="post-title" className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black mb-8 md:mb-10 leading-[1.05] text-foreground tracking-tight">
            {post.title}
          </h1>


          {/* Premium Author Row */}
          <div className="flex items-center gap-6 py-10 mb-16 border-y border-border">
            {post.is_anonymous ? (
              <Link href={`/alias/${encodeURIComponent(post.anonymous_identity?.alias_name || '')}`} className="shrink-0">
                <div className="w-14 h-14 rounded-full flex items-center justify-center overflow-hidden border border-border bg-background shadow-lg shadow-foreground/5 lumen-shimmer">
                  <img 
                    src={`https://api.dicebear.com/7.x/${post.anonymous_identity?.district || 'identicon'}/svg?seed=${post.anonymous_identity?.avatar_seed || 'default'}&backgroundColor=000000`}
                    className="w-full h-full object-cover dark:invert"
                    alt=""
                  />
                </div>
              </Link>
            ) : (
              <Link href={`/profile/${post.profile?.username || ''}`} className="shrink-0 group/avatar relative">
                <div className="absolute -inset-1 bg-foreground rounded-full opacity-0 group-hover/avatar:opacity-10 transition-opacity" />
                <div className="w-14 h-14 rounded-full flex items-center justify-center overflow-hidden border border-border bg-muted/10 text-foreground hover:scale-105 transition-transform lumen-shimmer">
                  {post.profile?.avatar_url
                    ? <img src={post.profile.avatar_url} alt={authorName} className="w-full h-full object-cover" />
                    : <span className="text-xl font-black">{authorName.charAt(0).toUpperCase()}</span>
                  }
                </div>
              </Link>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-4 mb-1">
                <Link 
                  href={post.is_anonymous 
                    ? `/alias/${encodeURIComponent(post.anonymous_identity?.alias_name || '')}` 
                    : `/profile/${post.profile?.username || ''}`
                  } 
                  className="text-lg font-black text-foreground hover:underline underline-offset-4"
                >
                  {authorName}
                </Link>

                {!post.is_anonymous && !isOwnPost && post.author_id && (
                  <FollowButton 
                    followingId={post.author_id} 
                    initialIsFollowing={initialIsFollowing}
                    className="rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-widest border-border hover:border-foreground" 
                  />
                )}
              </div>

              <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                <span>{post.read_time || 5} min read</span>
                <span className="text-border">·</span>
                <span>{format(new Date(post.created_at), 'MMMM d, yyyy')}</span>
                <span className="text-border">·</span>
                <span className="flex items-center gap-1.5">
                  <Eye size={12} className="text-muted-foreground" />
                  {post.views || 0} views
                </span>
              </div>
            </div>
          </div>

          {post.cover_image && (
            <div className="mb-16 w-full aspect-video overflow-hidden rounded-[2.5rem] border border-border transition-all duration-1000">
              <img
                src={post.cover_image}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Audio Player */}
          {post.type === 'audio' && (post.audio_metadata?.audio_url || post.audio_url) && (
            <div className="mb-16">
              <AudioPlayer
                src={post.audio_metadata?.audio_url || post.audio_url || ''}
                title={post.title}
                duration={post.audio_metadata?.duration || undefined}
                transcript={post.audio_metadata?.transcript}
              />

            </div>
          )}


          {/* Main Content Area */}
          <div className="space-y-12">
            <ArchivalReader content={contentObj} />

            {/* Remix / Asset Card (Hidden for Micro/Audio, Anonymous, and if Remixing is Disabled) */}
            {(post.type === 'blog' || post.type === 'code') && post.is_forkable && !post.is_anonymous && (
              <div id="narrative-history" className="mt-20">
                <PostAssetMeta 
                  postId={post.id} 
                  slug={post.slug} 
                  healthStatus={post.health_status || 'certified'} 
                  validationScore={post.validation_score || 100}
                  isAuthor={isOwnPost}
                  isForkable={post.is_forkable ?? true}
                />
              </div>
            )}
          </div>

          {/* Code Snippets */}
          {post.code_snippets && post.code_snippets.length > 0 && (
            <div className="mt-20 pt-20 border-t border-border space-y-10">
              <h2 className="text-xs font-black text-muted-foreground uppercase tracking-[0.3em] text-center mb-12">Code Snippets</h2>
              {post.code_snippets.map((snippet: any) => (
                <div key={snippet.id} className="rounded-2xl overflow-hidden border border-border bg-card shadow-2xl shadow-foreground/5">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/5">
                    <span className="text-[10px] font-black font-mono text-foreground uppercase tracking-widest">{snippet.language}</span>
                    {snippet.title && <span className="text-xs font-bold text-muted-foreground italic">{snippet.title}</span>}
                  </div>
                  <pre className="p-8 bg-zinc-950 text-indigo-300 text-sm font-mono overflow-x-auto leading-relaxed">
                    <code>{snippet.code}</code>
                  </pre>
                </div>
              ))}
            </div>
          )}

          {/* Floating actions */}
          <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-40 animate-reveal">
            <div className="bg-background/90 backdrop-blur-xl border border-border shadow-2xl rounded-full p-1">
              <PostActions
                postId={post.id}
                initialLikes={post.likes_count || 0}
                initialComments={post.comments_count || 0}
                initialLiked={isLiked}
                initialBookmarked={isBookmarked}
              />
            </div>
          </div>

          {/* Comments Section */}
          <div id="comments" className="mt-32 pt-16 border-t border-border">
            <h3 className="text-3xl font-black mb-12 tracking-tight text-foreground">Comments</h3>
            <CommentSection postId={post.id} initialCount={post.comments_count || 0} />
          </div>
        </article>

        {/* Right Sidebar - More from Author */}
        <aside className="hidden lg:block sticky top-28 h-fit space-y-16">
          <div className="space-y-8">
            <div className="w-24 h-24 rounded-full border-2 border-border p-1">
              <div className="w-full h-full rounded-full overflow-hidden bg-muted/10 flex items-center justify-center font-black text-3xl border border-border lumen-shimmer">
                {post.is_anonymous ? (
                  <img 
                    src={`https://api.dicebear.com/7.x/${post.anonymous_identity?.district || 'identicon'}/svg?seed=${post.anonymous_identity?.avatar_seed || 'default'}&backgroundColor=000000`}
                    className="w-full h-full object-cover dark:invert"
                    alt=""
                  />
                ) : post.profile?.avatar_url ? (
                  <img src={post.profile.avatar_url} className="w-full h-full object-cover" alt="" />
                ) : (
                  <span className="text-foreground">{authorName.charAt(0).toUpperCase()}</span>
                )}
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-extrabold text-2xl text-foreground tracking-tight">{authorName}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                {post.profile?.bio || `Writing stories and posts on LUMEN.`}
              </p>
            </div>
            {!post.is_anonymous && !isOwnPost && post.author_id && (
              <FollowButton 
                followingId={post.author_id} 
                initialIsFollowing={initialIsFollowing}
                className="w-full rounded-full h-12 text-xs font-black uppercase tracking-widest" 
              />
            )}
          </div>

          {/* More from Author */}
          {moreFromAuthor && moreFromAuthor.length > 0 && (
            <div className="pt-10 border-t border-border space-y-8">
              <h5 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Related Posts</h5>
              <div className="space-y-8">
                {moreFromAuthor.map((p) => {
                  const PIcon = TYPE_ICONS[p.type as keyof typeof TYPE_ICONS] || FileText;
                  return (
                    <div key={p.id} className="group space-y-2">
                      <Link href={`/post/${p.slug}`} className="block">
                        <h6 className="text-sm font-black text-foreground group-hover:underline underline-offset-4 decoration-2 leading-tight">
                          {p.title}
                        </h6>
                      </Link>
                      <div className="flex items-center gap-2 text-[8px] font-bold text-muted-foreground uppercase tracking-widest">
                        <PIcon size={10} />
                        <span>{format(new Date(p.created_at), 'MMM d, yyyy')}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              {!post.is_anonymous && post.profile?.username && (
                <Link href={`/profile/${post.profile.username}`} className="inline-block text-[10px] font-black uppercase tracking-widest text-foreground hover:underline underline-offset-4 decoration-2">
                  View All Posts →
                </Link>
              )}
            </div>
          )}

          <div className="pt-10 border-t border-border">

            <h5 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-8">Relevant Topics</h5>
            <div className="flex flex-wrap gap-2">
              {['AI', 'Design', 'Future', 'Tech'].map(t => (
                <span key={t} className="px-4 py-2 bg-muted/5 border border-border text-[10px] font-black uppercase tracking-widest text-foreground rounded-full hover:bg-foreground hover:text-background transition-all cursor-pointer">{t}</span>
              ))}
            </div>
          </div>
        </aside>

      </div>
    </main>
  );
}

