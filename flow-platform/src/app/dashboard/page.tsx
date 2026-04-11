import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { PostCard } from '@/components/post/PostCard';
import { PostActions } from '@/components/dashboard/PostActions';
import {
  FileText,
  Code,
  Mic,
  Zap,
  Ghost,
  FileEdit, // Added
  Send,     // Added
  Bookmark  // Added
} from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui';

export default async function DashboardPage() {

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Fetch Published Posts
  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .eq('author_id', user.id)
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  // Fetch Drafts
  const { data: drafts } = await supabase
    .from('drafts')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  // Fetch Bookmarks
  const { data: bookmarksData } = await supabase
    .from('bookmarks')
    .select('*, posts(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const bookmarks = (bookmarksData || [])
    .map(b => b.posts)
    .filter(Boolean);

  return (
    <div className="max-w-7xl mx-auto px-6 py-20 min-h-screen animate-reveal">
      <div className="flex flex-col gap-4 mb-20">
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground border border-border w-fit px-4 py-1.5 rounded-full">
          Control Interface
        </span>
        <h1 className="text-7xl font-black text-foreground tracking-tighter leading-tight">
          Dashboard
        </h1>
        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
          Manage your digital narratives and synchronization logs.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-20">
        <div className="space-y-24">

          {/* Drafts Section */}
          <section className="space-y-10">
            <div className="flex items-center justify-between border-b border-border pb-6">
              <div className="flex items-center gap-4">
                <FileEdit size={24} strokeWidth={2.5} />
                <h2 className="text-2xl font-bold tracking-tighter uppercase">Unfinished Logs</h2>
              </div>
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest bg-muted/10 px-3 py-1 rounded-md">
                {drafts?.length || 0} items
              </span>
            </div>

            {drafts && drafts.length > 0 ? (
              <div className="grid gap-4">
                {drafts.map(draft => (
                  <div key={draft.id} className="group p-8 rounded-[2rem] bg-white border border-border hover:border-foreground transition-all flex flex-col sm:flex-row justify-between sm:items-center gap-6 shadow-sm hover:shadow-2xl hover:shadow-foreground/5">
                    <div className="space-y-1">
                      <h3 className="text-xl font-black text-foreground tracking-tight group-hover:underline underline-offset-4 decoration-2">
                        {draft.title || 'Untitled Narrative'}
                      </h3>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        Modified {format(new Date(draft.updated_at), 'MMM d, HH:mm')}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Link href={`/new?draftId=${draft.id}`}>
                        <Button className="rounded-full px-6 h-10 text-[10px] font-black uppercase tracking-widest">
                          Resume
                        </Button>
                      </Link>
                      <PostActions id={draft.id} type="draft" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center border border-dashed border-border rounded-[2rem]">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">No active drafts in the cache.</p>
              </div>
            )}
          </section>

          {/* Published Posts Section */}
          <section className="space-y-10">
            <div className="flex items-center justify-between border-b border-border pb-6">
              <div className="flex items-center gap-4">
                <Send size={24} strokeWidth={2.5} />
                <h2 className="text-2xl font-bold tracking-tighter uppercase">Broadcasted Syncs</h2>
              </div>
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest bg-muted/10 px-3 py-1 rounded-md">
                {posts?.length || 0} items
              </span>
            </div>

            {posts && posts.length > 0 ? (
              <div className="grid grid-cols-1 gap-10">
                {posts.map(post => (
                  <div key={post.id} className="relative group">
                    <PostCard post={{ ...post, profile: { full_name: 'You' } } as any} />
                    <div className="absolute top-8 right-8 z-10 opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100">
                      <div className="bg-white/80 backdrop-blur-xl p-1 rounded-full shadow-2xl border border-border">
                        <PostActions id={post.id} type="post" slug={post.slug} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center border border-dashed border-border rounded-[2rem]">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">The broadcast history is empty.</p>
              </div>
            )}
          </section>

          {/* Bookmarks Section */}
          <section className="space-y-10">
            <div className="flex items-center justify-between border-b border-border pb-6">
              <div className="flex items-center gap-4">
                <Bookmark size={24} strokeWidth={2.5} />
                <h2 className="text-2xl font-bold tracking-tighter uppercase">Archived Signal</h2>
              </div>
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest bg-muted/10 px-3 py-1 rounded-md">
                {bookmarks.length || 0} items
              </span>
            </div>

            {bookmarks.length > 0 ? (
              <div className="grid grid-cols-1 gap-10">
                {bookmarks.map(post => (
                  <PostCard key={post.id} post={post as any} />
                ))}
              </div>
            ) : (
              <div className="py-20 text-center border border-dashed border-border rounded-[2rem]">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">No signals preserved currently.</p>
              </div>
            )}
          </section>

        </div>

        {/* Sidebar Info */}
        <aside className="space-y-12">
          <div className="sticky top-28 space-y-8">
            <div className="p-10 rounded-[3rem] bg-black text-white shadow-2xl shadow-foreground/20 space-y-10">
              <div className="space-y-2">
                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white/50">Quick Index</h3>
                <div className="h-px w-full bg-white/10" />
              </div>

              <div className="space-y-8">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Published</span>
                  <span className="text-4xl font-black tracking-tighter leading-none">{posts?.length || 0}</span>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Active Drafts</span>
                  <span className="text-4xl font-black tracking-tighter leading-none">{drafts?.length || 0}</span>
                </div>
              </div>

              <Link href="/new" className="block">
                <Button className="w-full bg-white text-black font-black uppercase tracking-widest text-[10px] h-14 rounded-full hover:bg-white/90 transition-all hover:scale-[1.02] active:scale-[0.98]">
                  Initialize New Sync
                </Button>
              </Link>
            </div>

            <div className="p-10 rounded-[3rem] border border-border space-y-6">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Resources</h3>
              <div className="grid gap-2">
                <Link href="/settings" className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/5 transition-colors group">
                  <span className="text-sm font-bold group-hover:underline">Settings</span>
                  <span className="text-border">→</span>
                </Link>
                <Link href="/profile/me" className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/5 transition-colors group">
                  <span className="text-sm font-bold group-hover:underline">Public Registry</span>
                  <span className="text-border">→</span>
                </Link>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

