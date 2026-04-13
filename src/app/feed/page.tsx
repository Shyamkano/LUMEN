import { getPosts, getTrendingPosts, getPopularTags } from '@/app/actions/posts';
import { FeedList } from '@/components/feed/FeedList';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { createClient } from '@/lib/supabase/server';
import type { Post } from '@/types';
import { Suspense } from 'react';
import { Loader2, PenTool, Zap, Code, Mic, TrendingUp } from 'lucide-react';


import { UserSearchWidget } from '@/components/social/UserSearchWidget';

export const dynamic = 'force-dynamic';

export default async function FeedPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch true trending posts based on engagement
  const trendingList = await getTrendingPosts();

  // Fetch dynamic topics
  const popularTags = await getPopularTags(50);
  const trendingTags = popularTags.slice(0, 7); // Show only top 7 as 'trending'
  const remainingTags = popularTags.slice(7);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 relative py-12 md:py-20 overflow-x-hidden">
      {/* Mobile Floating Action Button (FAB) */}
      {/* <Link href="/new" className="md:hidden fixed bottom-8 right-6 z-[90] w-14 h-14 bg-black text-white rounded-full flex items-center justify-center shadow-2xl shadow-black/40 border border-white/20 active:scale-90 transition-all animate-reveal">
        <PenTool size={22} strokeWidth={3} />
      </Link> */}
      {/* Background Glows for 'Shine' */}
      <div className="absolute -top-24 -left-24 w-64 md:w-96 h-64 md:h-96 bg-foreground/5 blur-[120px] rounded-full pointer-events-none animate-pulse" />
      <div className="absolute top-1/2 -right-24 w-48 md:w-64 h-48 md:h-64 bg-foreground/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10 md:gap-16 relative py-8 md:py-12">
        <div className="space-y-10 md:space-y-12">
          {/* Compressed Feed Header */}
          <header className="animate-reveal">
            <div className="flex items-center gap-4 mb-2 overflow-hidden">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground tracking-tighter leading-tight break-words">
                Dialogue <span className="italic font-light opacity-60">& Archive.</span>
              </h1>
            </div>
            <p className="text-muted-foreground font-medium tracking-tight">Exploring the latest luminous logs from the network.</p>
          </header>

          {/* Feed */}
          <section className="pb-24">
            <div className="flex items-center gap-4 mb-10">
              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground">Recent Synchronizations</h2>
              <div className="h-px flex-1 bg-border/40" />
            </div>
            <Suspense fallback={
              <div className="flex justify-center py-20">
                <Loader2 className="animate-spin text-muted-foreground" />
              </div>
            }>
              <FeedList />
            </Suspense>
          </section>

        </div>


        {/* --- SIDEBAR --- */}
        <aside className="hidden lg:block space-y-12 sticky top-28 h-fit">

          {!user && (
            <div className="p-8 rounded-[2rem] bg-card border border-border transition-all hover:shadow-2xl hover:shadow-foreground/5">
              <h3 className="text-xl font-black text-foreground mb-3 font-serif-heading italic">Join the LUMEN ✨</h3>
              <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
                Connect with a community sharing ideas across multiple formats. No noise, just signal.
              </p>
              <Link href="/auth/signup">
                <Button className="w-full rounded-full h-12">Create Account</Button>
              </Link>
            </div>
          )}

          {/* Trending Posts Widget */}
          <div className="space-y-8">
            <div className="flex items-center gap-3 px-2">
              <TrendingUp size={20} className="text-foreground" />
              <h3 className="text-lg font-black uppercase tracking-tight text-foreground">Trending</h3>
            </div>

            <div className="space-y-8">
              {trendingList.map((post: any) => (
                <div key={post.id} className="group flex flex-col gap-2 px-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-foreground text-background flex items-center justify-center text-[10px] font-black">
                      {(post.profile?.full_name || post.anonymous_identity?.alias_name || 'U').charAt(0).toUpperCase()}
                    </div>
                    {post.is_anonymous ? (
                      <Link href={`/alias/${encodeURIComponent(post.anonymous_identity?.alias_name || '')}`} className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors hover:underline">
                        {post.anonymous_identity?.alias_name || 'Anonymous'}
                      </Link>
                    ) : (
                      <Link href={`/profile/${post.profile?.username}`} className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors hover:underline">
                        {post.profile?.full_name || 'User'}
                      </Link>
                    )}
                  </div>
                  <Link href={`/post/${post.slug}`}>
                    <h4 className="text-base font-bold leading-tight text-foreground group-hover:underline underline-offset-4 decoration-2 transition-all line-clamp-2">
                      {post.title}
                    </h4>
                  </Link>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-8 border-t border-border">
            <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] mb-6">Archive Topics</h3>
            <div className="flex flex-wrap gap-2">
              {trendingTags.map(tag => (
                <Link key={tag} href={`/feed?tag=${encodeURIComponent(tag)}`} className="px-3 py-1.5 rounded-full bg-muted/5 hover:bg-foreground hover:text-background text-foreground text-[10px] font-black uppercase tracking-wider transition-all border border-border">
                  #{tag}
                </Link>
              ))}
              {remainingTags.length > 0 && (
                <button className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground hover:underline transition-all pt-2 block w-full text-left">
                  + {remainingTags.length} More Topics
                </button>
              )}
            </div>
          </div>


        </aside>
      </div>
    </div>

  );
}
