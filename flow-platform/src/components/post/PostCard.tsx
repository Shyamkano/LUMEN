'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageCircle, Code, Mic, FileText, Zap, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createExcerpt } from '@/lib/utils';
import type { Post } from '@/types';

const TYPE_CONFIG = {
  blog: { icon: FileText, label: 'Journal', color: 'bg-foreground text-background border-foreground' },
  micro: { icon: Zap, label: 'Moment', color: 'bg-muted/10 text-foreground border-border' },
  code: { icon: Code, label: 'Logic', color: 'bg-muted/10 text-foreground border-border' },
  audio: { icon: Mic, label: 'Voice', color: 'bg-muted/10 text-foreground border-border' },
};

import { FollowButton } from '@/components/social/FollowButton';

export function PostCard({ post }: { post: Post }) {
  const router = useRouter();

  const config = TYPE_CONFIG[post.type] || TYPE_CONFIG.blog;
  const TypeIcon = config.icon;
  const excerpt = createExcerpt(post.content as Record<string, unknown>, 180);

  const authorName = post.is_anonymous
    ? (post.anonymous_identity?.alias_name || 'Anonymous')
    : (post.profile?.full_name || 'Author');

  const authorInitial = authorName.charAt(0).toUpperCase();

  return (
    <Link href={`/post/${post.slug}`} className="block group">
      <article className="relative p-8 md:p-10 rounded-[2.5rem] border border-border bg-card/50 backdrop-blur-sm hover:border-foreground/30 hover:bg-card hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)] transition-all duration-700 group-hover:-translate-y-1">

        {/* Author row */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-black border border-border ${
              post.is_anonymous
                ? 'bg-foreground text-background'
                : 'bg-muted/10 text-foreground'
            }`}>
              {post.is_anonymous ? '?' : (
                post.profile?.avatar_url
                  ? <img src={post.profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                  : authorInitial
              )}
            </div>
            <div className="flex flex-col z-10 relative">
              <span 
                className={`text-sm font-bold text-foreground ${!post.is_anonymous && post.profile?.username ? 'hover:underline cursor-pointer transition-colors' : ''}`}
                onClick={(e) => {
                  if (!post.is_anonymous && post.profile?.username) {
                    e.preventDefault();
                    e.stopPropagation();
                    router.push(`/profile/${post.profile.username}`);
                  }
                }}
              >
                {authorName}
              </span>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </span>
            </div>
          </div>

          {!post.is_anonymous && post.profile?.id && (
            <div className="z-10 relative" onClick={(e) => e.stopPropagation()}>
              <FollowButton followingId={post.profile.id} showCount={false} className="py-1.5 px-4 text-[10px] font-black uppercase tracking-widest rounded-full border-border hover:bg-foreground hover:text-background" />
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1 space-y-4 min-w-0">
            {!(post.type === 'micro' && post.title.startsWith('Post ')) && (
              <h2 className="text-2xl md:text-3xl font-black text-foreground leading-[1.1] tracking-tighter group-hover:underline underline-offset-4 decoration-1">
                {post.title}
              </h2>
            )}

            {(post.type === 'blog' || post.type === 'code' || post.type === 'audio') && excerpt && (
              <p className="text-muted-foreground text-base leading-relaxed line-clamp-3 font-medium">
                {excerpt}
              </p>
            )}

            {post.type === 'micro' && excerpt && (
              <p className="text-foreground text-xl font-medium leading-relaxed tracking-tight line-clamp-4 italic border-l-2 border-border pl-4">
                {excerpt}
              </p>
            )}
          </div>

          {post.cover_image && (
            <div className="w-full md:w-40 lg:w-48 aspect-[4/3] md:aspect-square overflow-hidden rounded-2xl border border-border flex-shrink-0 transition-all duration-700 group-hover:scale-[1.02]">
              <img 
                src={post.cover_image} 
                alt={post.title} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
              />
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-border/50">
          <div className="flex items-center gap-4">
            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border ${config.color} transition-colors`}>
              <TypeIcon size={12} strokeWidth={3} />
              {config.label}
            </span>
            {post.read_time && post.type === 'blog' && (
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{post.read_time} min read</span>
            )}
          </div>

          <div className="flex items-center gap-5 text-muted-foreground">
            <span className="flex items-center gap-1.5 text-xs font-bold hover:text-foreground transition-colors">
              <Heart size={16} />
              {post.likes_count || 0}
            </span>
            <span className="flex items-center gap-1.5 text-xs font-bold hover:text-foreground transition-colors">
              <MessageCircle size={16} />
              {post.comments_count || 0}
            </span>
          </div>
        </div>
      </article>
    </Link>

  );
}
