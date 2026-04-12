'use client';

import { useState } from 'react';
import { usePosts } from '@/lib/hooks/usePosts';
import { PostCard } from '@/components/post/PostCard';
import { FeedFilter } from '@/components/feed/FeedFilter';
import type { PostType, Post } from '@/types';
import { Loader2 } from 'lucide-react';

export function FeedList() {
  const [activeType, setActiveType] = useState<PostType | 'discovery' | 'shadows' | undefined>(undefined);
  const { data: posts, isLoading, error } = usePosts(activeType);

  return (
    <div className="space-y-8">
      <FeedFilter activeType={activeType} onChange={setActiveType} />

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="text-zinc-400 animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center py-20 text-red-500 text-sm">
          Failed to load posts. Please try again.
        </div>
      ) : !posts || posts.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-zinc-400 text-lg font-serif italic">
            {activeType
              ? `No ${activeType} posts yet. Be the first to create one!`
              : 'The blank page is full of possibilities...'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {(posts as Post[]).map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
