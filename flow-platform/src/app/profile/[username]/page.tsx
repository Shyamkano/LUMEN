import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { PostCard } from '@/components/post/PostCard';
import { Button } from '@/components/ui';
import { MapPin, Link as LinkIcon, Calendar, Edit3 } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { FollowButton } from '@/components/social/FollowButton';
import { getFollowStats } from '@/app/actions/social';

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const resolvedParams = await params;
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
  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .eq('author_id', profile.id)
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  const isOwnProfile = currentUser?.id === profile.id;

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
                {profile.bio || `A silent observer in the flow of information.`}
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

          <div className="h-px w-full bg-border" />

          {/* Posts list */}
          <div className="space-y-12">
            <div className="flex items-center gap-4">
              <h3 className="text-xl font-black uppercase tracking-widest text-foreground">Archive</h3>
              <div className="h-px flex-1 bg-border/50" />
            </div>
            {posts && posts.length > 0 ? (
              <div className="space-y-12">
                {posts.map(post => (
                  <PostCard key={post.id} post={{ ...post, profile } as any} />
                ))}
              </div>
            ) : (
              <div className="py-24 text-center rounded-[3rem] border border-dashed border-border bg-muted/5">
                <p className="text-muted-foreground font-black uppercase tracking-widest text-sm">
                  {isOwnProfile ? "Your archive is currently empty." : "This individual has not yet contributed to the LUMEN."}
                </p>
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

