'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePosts } from '@/lib/hooks/usePosts';
import { PostCard } from '@/components/post/PostCard';
import { FeedFilter } from '@/components/feed/FeedFilter';
import type { PostType, Post } from '@/types';
import { Loader2, X } from 'lucide-react';
import Link from 'next/link';

export function FeedList() {
  const searchParams = useSearchParams();
  const tag = searchParams.get('tag') || undefined;
  
  const [activeType, setActiveType] = useState<PostType | 'discovery' | 'shadows' | undefined>(undefined);
  const { data: posts, isLoading, error } = usePosts(activeType, tag);

  return (
    <div className="space-y-8">
      <FeedFilter activeType={activeType} onChange={setActiveType} />

      {tag && (
        <div className="flex items-center justify-between bg-muted/5 border border-border px-6 py-4 rounded-2xl animate-reveal">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Filtering by Topic:</span>
            <span className="text-sm font-black text-foreground uppercase tracking-tighter">#{tag}</span>
          </div>
          <Link href="/feed" className="text-muted-foreground hover:text-foreground transition-colors group flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all">Clear Filter</span>
            <X size={16} strokeWidth={3} />
          </Link>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="text-zinc-400 animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center py-20 text-red-500 text-sm font-bold uppercase tracking-widest">
          Protocol Error: Failed to load synchronizations.
        </div>
      ) : !posts || posts.length === 0 ? (
        <div className="text-center py-40 border border-dashed border-border rounded-[3rem]">
          <p className="text-zinc-400 text-sm font-black uppercase tracking-[0.4em] italic">
            {tag 
              ? `No logs indexed under #${tag}`
              : activeType
                ? `No ${activeType} items in the current buffer.`
                : 'The archive is currently silent.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-12 max-w-2xl mx-auto">
          {(posts as Post[]).map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}


    </div>
  );
}

