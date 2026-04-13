import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { PostCard } from '@/components/post/PostCard';
import { Button } from '@/components/ui';
import { MapPin, Link as LinkIcon, Calendar, Edit3 } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { FollowButton } from '@/components/social/FollowButton';
import { getFollowStats } from '@/app/actions/social';

export const dynamic = 'force-dynamic';

export default async function ProfilePage({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ username: string }>,
  searchParams: Promise<{ tab?: string }>
}) {
  const [resolvedParams, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const activeTab = resolvedSearchParams.tab || 'archive';
  const supabase = await createClient();
  const { data: { user: currentUser } } = await supabase.auth.getUser();

  // Decode the username because it might have a `@` if they appended it or just url encoding
  const username = decodeURIComponent(resolvedParams.username).replace('@', '');

  // Fetch the profile
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single();

  if (error || !profile) {
    notFound();
  }

  // Fetch posts by this user
  const { getPostsByUsername } = await import('@/app/actions/posts');
  const { getUserBookmarks } = await import('@/app/actions/engagement');
  
  const isOwnProfile = currentUser?.id === profile.id;
  
  // Conditionally fetch based on active tab
  let displayPosts = [];
  if (activeTab === 'collection' && isOwnProfile) {
    displayPosts = await getUserBookmarks();
  } else {
    const { posts } = await getPostsByUsername(resolvedParams.username.replace('@', ''));
    displayPosts = posts || [];
  }

  // Fetch real social stats
  const { followers, following } = await getFollowStats(profile.id);

  return (
    <div className="max-w-7xl mx-auto px-6 py-20">
      <div className="flex flex-col lg:grid lg:grid-cols-[1fr_320px] gap-16 items-start">

        {/* Main profile section */}
        <div className="flex-1 w-full space-y-20">
          {/* Header */}
          <div className="flex flex-col md:flex-row items-center md:items-start gap-10">
            <div className="relative group">
              <div className="absolute -inset-1 bg-foreground rounded-full opacity-0 group-hover:opacity-10 transition-opacity" />
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.full_name} className="w-32 h-32 md:w-48 md:h-48 rounded-full object-cover border-4 border-background shadow-2xl transition-all duration-700" />
              ) : (
                <div className="w-32 h-32 md:w-48 md:h-48 rounded-full bg-muted/10 border-2 border-border flex items-center justify-center text-6xl text-foreground font-black">
                  {profile.full_name?.charAt(0) || username.charAt(0)}
                </div>
              )}
            </div>

            <div className="flex-1 pt-4 text-center md:text-left">
              <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-6">
                <div>
                  <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-foreground uppercase">{profile.full_name || 'Anonymous'}</h1>
                  <p className="text-muted-foreground mt-2 font-bold tracking-widest text-sm uppercase">@{profile.username}</p>
                </div>
                {isOwnProfile && (
                  <Link href="/settings">
                    <Button variant="outline" className="rounded-full h-12 px-8 font-black uppercase tracking-widest text-xs">
                      Update Identity
                    </Button>
                  </Link>
                )}
              </div>

              <p className="text-foreground mt-8 max-w-2xl leading-relaxed text-lg font-medium">
                {profile.bio || `A silent observer traversing the LUMEN network.`}
              </p>

              <div className="flex flex-wrap justify-center md:justify-start gap-6 mt-8 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                {profile.website && (
                  <a href={profile.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-foreground transition-colors border-b border-border pb-1">
                    <LinkIcon size={14} /> {new URL(profile.website).hostname}
                  </a>
                )}
                <div className="flex items-center gap-2 border-b border-border pb-1">
                  <Calendar size={14} /> Joined {format(new Date(profile.created_at), 'MMMM yyyy')}
                </div>
              </div>

              {isOwnProfile && (
                <Link href="/settings" className="md:hidden inline-block mt-10 w-full">
                  <Button variant="outline" className="rounded-full h-12 w-full font-black uppercase tracking-widest text-xs">
                    Update Identity
                  </Button>
                </Link>
              )}
            </div>
          </div>

          <div className="h-px w-full bg-border/50" />

          {/* Tabs Selector */}
          <div className="flex items-center gap-8 border-b border-border/50 pb-0 shadow-[0_4px_12px_-12px_rgba(0,0,0,0.5)]">
            <Link 
              href={`/profile/${username}?tab=archive`}
              className={`pb-4 text-xs font-black uppercase tracking-[0.3em] transition-all relative ${activeTab === 'archive' ? 'text-black' : 'text-muted-foreground hover:text-black hover:opacity-70'}`}
            >
              Archive
              {activeTab === 'archive' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black animate-reveal" />}
            </Link>
            {isOwnProfile && (
              <Link 
                href={`/profile/${username}?tab=collection`}
                className={`pb-4 text-xs font-black uppercase tracking-[0.3em] transition-all relative ${activeTab === 'collection' ? 'text-black' : 'text-muted-foreground hover:text-black hover:opacity-70'}`}
              >
                Collection
                {activeTab === 'collection' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black animate-reveal" />}
              </Link>
            )}
          </div>

          {/* Posts list */}
          <div className="space-y-12">
            {displayPosts && displayPosts.length > 0 ? (
              <div className="space-y-12">
                {displayPosts.map(post => (
                  <PostCard key={post.id} post={{ ...post, profile } as any} />
                ))}
              </div>
            ) : (
              <div className="py-32 text-center rounded-[3rem] border border-dashed border-border bg-muted/5 animate-reveal">
                <p className="text-muted-foreground font-black uppercase tracking-widest text-sm">
                  {activeTab === 'collection' 
                    ? "Your collection is currently empty." 
                    : isOwnProfile ? "Your archive is currently empty." : "This individual has not yet contributed to the LUMEN."
                  }
                </p>
                {activeTab === 'collection' && (
                  <Link href="/feed">
                    <Button variant="link" className="mt-4 font-black uppercase tracking-widest text-[10px] text-foreground underline underline-offset-4">Explore Narratives</Button>
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <aside className="w-full sticky top-28 h-fit space-y-12 animate-reveal">
          <div className="p-8 rounded-[2.5rem] bg-card border border-border shadow-2xl shadow-foreground/5">
            <h4 className="font-black text-[10px] text-muted-foreground uppercase tracking-[0.3em] mb-8">Metadata</h4>
            <div className="space-y-8">
              <Link href={`/profile/${username}/followers`} className="flex justify-between items-end group">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest group-hover:text-foreground transition-colors">Followers</span>
                <span className="text-2xl font-black text-foreground tabular-nums group-hover:scale-110 transition-transform origin-right">{followers}</span>
              </Link>
              <Link href={`/profile/${username}/following`} className="flex justify-between items-end group">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest group-hover:text-foreground transition-colors">Following</span>
                <span className="text-2xl font-black text-foreground tabular-nums group-hover:scale-110 transition-transform origin-right">{following}</span>
              </Link>


              {!isOwnProfile && (
                <div className="pt-4">
                  <FollowButton followingId={profile.id} className="w-full h-12 rounded-full font-black uppercase tracking-widest text-xs" />
                </div>
              )}
            </div>
          </div>

          <div className="px-8 flex flex-col items-center md:items-start">
            <h5 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-6">Discovery</h5>
            <div className="flex flex-wrap gap-2">
              {['Philosophy', 'Systems', 'Stories'].map(t => (
                <span key={t} className="px-4 py-2 bg-muted/5 border border-border text-[10px] font-black uppercase tracking-widest text-foreground rounded-full hover:bg-foreground hover:text-background transition-all cursor-pointer">{t}</span>
              ))}
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
}

