import { createClient } from '@/lib/supabase/server';
import { PostCard } from '@/components/post/PostCard';
import { Search as SearchIcon, User } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui';

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q: string }>;
}) {
  const { q: query } = await searchParams;
  const decodedQuery = decodeURIComponent(query || '');

  const supabase = await createClient();

  // Sanitized query for array matching
  const queryArray = decodedQuery.split(/\s+/).filter(Boolean);

  // 1. Search for Posts
  let postsQuery = supabase
    .from('posts')
    .select('*')
    .eq('status', 'published');

  if (decodedQuery) {
    if (queryArray.length > 0) {
      // Create a complex OR filter:
      // Title matches query OR tags overlap with query words
      postsQuery = postsQuery.or(`title.ilike.%${decodedQuery}%, tags.ov.{${queryArray.join(',')}}`);
    } else {
      postsQuery = postsQuery.ilike('title', `%${decodedQuery}%`);
    }
  }

  const { data: posts, error: postError } = await postsQuery.order('created_at', { ascending: false });

  // 2. Search for Users (Residents)
  let profileQuery = supabase.from('profiles').select('*').limit(5);
  if (decodedQuery) {
    profileQuery = profileQuery.or(`username.ilike.%${decodedQuery}%,full_name.ilike.%${decodedQuery}%`);
  }
  const { data: profiles, error: profileError } = await profileQuery;


  // Manually hydrate posts with profiles
  let postsWithProfiles = [];
  if (posts && posts.length > 0) {
    const authorIds = [...new Set(posts.map(p => p.author_id))];
    const { data: postAuthorProfiles } = await supabase.from('profiles').select('*').in('id', authorIds);
    const profileMap = new Map((postAuthorProfiles || []).map(p => [p.id, p]));
    
    postsWithProfiles = posts.map(post => ({
      ...post,
      profile: profileMap.get(post.author_id) || null
    }));
  }

  const hasResults = postsWithProfiles.length > 0 || (profiles && profiles.length > 0);

  return (
    <div className="max-w-screen-xl mx-auto px-6 py-20 min-h-screen animate-reveal">
      <div className="max-w-screen-md mx-auto space-y-4 mb-20">
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground border border-border px-4 py-1.5 rounded-full">
            Inquiry Protocol
          </span>
        </div>
        <h1 className="text-7xl font-black text-foreground tracking-tighter leading-tight">
          Analysis: "{decodedQuery}"
        </h1>
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          {(posts?.length || 0) + (profiles?.length || 0)} relative matches indexed
        </p>
        {(postError || profileError) && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-xs font-bold text-red-600 uppercase tracking-widest">
            Protocol Error: {postError?.message || profileError?.message}
          </div>
        )}
      </div>

      {hasResults ? (
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-20">
          
          {/* Residents Sidebar */}
          <aside className="space-y-10">
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <User size={18} className="text-muted-foreground" />
              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground">Residents</h2>
            </div>
            
            {profiles && profiles.length > 0 ? (
              <div className="grid gap-4">
                {profiles.map((u) => (
                  <Link 
                    key={u.id} 
                    href={`/profile/${u.username}`}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border hover:border-foreground transition-all group"
                  >
                    <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-black text-xs overflow-hidden shrink-0">
                      {u.avatar_url ? (
                        <img src={u.avatar_url} className="w-full h-full object-cover" alt="" />
                      ) : (
                        (u.username || 'U').charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-black text-foreground truncate">{u.full_name || u.username}</span>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-60 truncate">@{u.username}</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest italic">No matching identities found.</p>
            )}
          </aside>

          {/* Posts Main Section */}
          <section className="space-y-10">
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <SearchIcon size={18} className="text-muted-foreground" />
              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground">Narrative Archive</h2>
            </div>

            {postsWithProfiles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {postsWithProfiles.map((post) => (
                  <PostCard key={post.id} post={post as any} />
                ))}
              </div>
            ) : (
              <div className="py-20 text-center border border-dashed border-border rounded-[2rem]">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">No narratives matched this query.</p>
              </div>
            )}
          </section>
        </div>
      ) : (
        <div className="py-40 text-center border-t border-dashed border-border mt-20 max-w-screen-md mx-auto">
          <p className="text-sm font-black text-muted-foreground uppercase tracking-[0.4em] italic mb-8">
            The archive holds no record of this query.
          </p>
          <Link href="/feed">
            <Button variant="outline" className="rounded-full px-10 h-12 font-black uppercase tracking-widest text-[10px]">
              Return to Feed
            </Button>
          </Link>
        </div>
      )}
    </div>

  );
}


