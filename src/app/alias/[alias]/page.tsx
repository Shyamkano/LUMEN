import { notFound } from 'next/navigation';
import { PostCard } from '@/components/post/PostCard';
import { format } from 'date-fns';
import { Ghost, Box, Info } from 'lucide-react';
import { getPostsByAlias } from '@/app/actions/posts';

export default async function AliasProfilePage({ params }: { params: Promise<{ alias: string }> }) {
  const resolvedParams = await params;
  const aliasName = decodeURIComponent(resolvedParams.alias);

  const { posts, identity } = await getPostsByAlias(aliasName);

  if (!identity) {
    notFound();
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-20">
      <div className="flex flex-col lg:grid lg:grid-cols-[1fr_320px] gap-16 items-start">
        
        {/* Main Section */}
        <div className="flex-1 w-full space-y-20">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row items-center md:items-start gap-10">
            <div className="relative">
              <div className="w-32 h-32 md:w-48 md:h-48 rounded-[3rem] bg-black text-white flex items-center justify-center text-6xl font-black border-4 border-white shadow-2xl overflow-hidden">
                {identity.avatar_seed ? (
                   <img 
                    src={`https://api.dicebear.com/7.x/shapes/svg?seed=${identity.avatar_seed}`} 
                    className="w-full h-full object-cover p-4" 
                    alt={identity.alias_name} 
                  />
                ) : (
                  <Ghost size={64} />
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 bg-zinc-100 p-3 rounded-2xl border border-black/5">
                <Ghost size={20} className="text-black" />
              </div>
            </div>

            <div className="flex-1 pt-4 text-center md:text-left">
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-foreground uppercase italic">{identity.alias_name}</h1>
              <p className="text-muted-foreground mt-4 font-bold tracking-[0.2em] text-xs uppercase flex items-center justify-center md:justify-start gap-2">
                <Box size={14} /> Anonymous Identity Profile
              </p>
              
              <div className="mt-10 p-6 bg-zinc-50 rounded-3xl border border-black/[0.03] max-w-2xl">
                <p className="text-sm font-medium text-black/60 leading-relaxed italic">
                  "This identity exists only within the shadows of the LUMEN. No public name, no history, only the dialogue remains."
                </p>
              </div>
            </div>
          </div>

          <div className="h-px w-full bg-border" />

          {/* Posts list */}
          <div className="space-y-12">
            <div className="flex items-center gap-4">
              <h3 className="text-xl font-black uppercase tracking-widest text-foreground">Manifestations</h3>
              <div className="h-px flex-1 bg-border/50" />
            </div>
            {posts && posts.length > 0 ? (
              <div className="space-y-12">
                {posts.map(post => post && (
                  <PostCard key={post.id} post={{
                    ...post,
                    anonymous_identity: identity // Ensure identity is passed even if not present in post data
                  } as any} />
                ))}
              </div>
            ) : (
              <div className="py-24 text-center rounded-[3rem] border border-dashed border-border bg-muted/5">
                <p className="text-muted-foreground font-black uppercase tracking-widest text-sm">
                  This identity has not surfaced any logs yet.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="w-full sticky top-28 h-fit space-y-12 animate-reveal">
          <div className="p-8 rounded-[2.5rem] bg-black text-white shadow-2xl">
            <div className="flex items-center gap-3 mb-8">
              <Info size={16} className="text-zinc-400" />
              <h4 className="font-black text-[10px] uppercase tracking-[0.3em]">Protocol</h4>
            </div>
            <p className="text-xs font-medium leading-relaxed text-zinc-400 italic">
              Anonymous identities are isolated entities. Subscribing or following is prohibited to preserve total narrative detachment.
            </p>
            <div className="mt-8 pt-8 border-t border-white/10 flex justify-between items-end">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Total Entries</span>
              <span className="text-2xl font-black tabular-nums">{posts.length}</span>
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
}
