import { createClient } from '@/lib/supabase/server';
import { PostCard } from '@/components/post/PostCard';
import { Search as SearchIcon } from 'lucide-react';
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

  // Optimized search including tags (content.ilike is not supported on JSONB)
  const { data: posts, error } = await supabase
    .from('posts')
    .select('*')
    .eq('status', 'published')
    .or(`title.ilike.%${decodedQuery}%, tags.cs.{"${decodedQuery}"}`)
    .order('created_at', { ascending: false });


  // Manually fetch profiles since foreign key relationship is missing in Supabase schema cache
  let postsWithProfiles = [];
  if (posts && posts.length > 0) {
    const authorIds = [...new Set(posts.map(p => p.author_id))];
    const { data: profiles } = await supabase.from('profiles').select('*').in('id', authorIds);
    const profileMap = new Map((profiles || []).map(p => [p.id, p]));
    
    postsWithProfiles = posts.map(post => ({
      ...post,
      profile: profileMap.get(post.author_id) || null
    }));
  }

  return (
    <div className="max-w-screen-md mx-auto px-6 py-20 min-h-screen animate-reveal">
      <div className="space-y-4 mb-20">
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground border border-border px-4 py-1.5 rounded-full">
            Inquiry Protocol
          </span>
        </div>
        <h1 className="text-6xl font-black text-foreground tracking-tighter leading-tight">
          Analysis: "{decodedQuery}"
        </h1>
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          {posts?.length || 0} relative matches indexed
        </p>
        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-xs font-bold text-red-600 uppercase tracking-widest">
            Protocol Error: {error.message}
          </div>
        )}
      </div>

      {postsWithProfiles.length > 0 ? (
        <div className="grid gap-8">
          {postsWithProfiles.map((post) => (
            <PostCard key={post.id} post={post as any} />
          ))}
        </div>
      ) : (
        <div className="py-40 text-center border-t border-dashed border-border mt-20">
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

