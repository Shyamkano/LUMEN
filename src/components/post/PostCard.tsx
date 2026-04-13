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
  const excerpt = createExcerpt(post.content as Record<string, unknown>, 140); // Slightly shorter excerpt

  const authorName = post.is_anonymous
    ? (post.anonymous_identity?.alias_name || 'Anonymous')
    : (post.profile?.full_name || 'Author');

  const authorInitial = authorName.charAt(0).toUpperCase();

  return (
    <Link href={`/post/${post.slug}`} className="block group h-full">
      <article className="relative h-full flex flex-col p-6 rounded-3xl border border-border bg-card/50 backdrop-blur-sm hover:border-foreground/30 hover:bg-card hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6)] transition-all duration-500 group-hover:-translate-y-1">

        {/* Author row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black border border-border overflow-hidden ${
              post.is_anonymous
                ? 'bg-foreground text-background'
                : 'bg-muted/10 text-foreground'
            }`}>
              {post.is_anonymous ? (
                <img 
                  src={`https://api.dicebear.com/7.x/${post.anonymous_identity?.district || 'identicon'}/svg?seed=${post.anonymous_identity?.avatar_seed || 'default'}&backgroundColor=000000`} 
                  alt="" 
                  className="w-full h-full object-cover invert" 
                />
              ) : (
                post.profile?.avatar_url
                  ? <img src={post.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  : authorInitial
              )}
            </div>
            <div className="flex flex-col z-10 relative">
              <div className="flex items-center gap-1.5">
                <span 
                  className="text-[11px] font-black text-foreground hover:underline cursor-pointer transition-colors max-w-[80px] truncate"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (post.is_anonymous && post.anonymous_identity?.alias_name) {
                      router.push(`/alias/${encodeURIComponent(post.anonymous_identity.alias_name)}`);
                    } else if (!post.is_anonymous && post.profile?.username) {
                      router.push(`/profile/${post.profile.username}`);
                    }
                  }}
                >
                  {authorName}
                </span>
                {post.is_anonymous && (
                  <User size={10} className="text-muted-foreground opacity-50" />
                )}
              </div>
              <span className="text-[8px] uppercase tracking-widest text-muted-foreground font-bold">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </span>
            </div>
          </div>

          {!post.is_anonymous && post.profile?.id && (
            <div className="z-10 relative" onClick={(e) => e.stopPropagation()}>
              <FollowButton followingId={post.profile.id} showCount={false} className="h-7 px-3 text-[9px] font-black uppercase tracking-widest rounded-full border-border hover:bg-foreground hover:text-background" />
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="flex-1 space-y-3 min-w-0">
          {post.cover_image && (
            <div className="w-full aspect-[16/9] overflow-hidden rounded-2xl border border-border mb-4 transition-all duration-500 group-hover:scale-[1.01]">
              <img 
                src={post.cover_image} 
                alt={post.title} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
              />
            </div>
          )}

          {!(post.type === 'micro' && post.title.startsWith('Post ')) && (
            <h2 className="text-xl font-black text-foreground leading-[1.2] tracking-tight group-hover:underline underline-offset-2 decoration-1 line-clamp-2">
              {post.title}
            </h2>
          )}

          {excerpt && (
            <p className="text-muted-foreground text-xs leading-relaxed line-clamp-3 font-medium opacity-80">
              {excerpt}
            </p>
          )}

          {/* Tags display */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {post.tags.slice(0, 3).map(tag => (
                <span key={tag} className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/50 border border-border/40 px-1.5 py-0.5 rounded-md">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/30">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-muted-foreground">
              <TypeIcon size={12} strokeWidth={3} />
              {config.label}
            </span>
          </div>

          <div className="flex items-center gap-4 text-muted-foreground/60">
            <span className="flex items-center gap-1 text-[10px] font-black">
              <Heart size={14} className="group-hover:text-red-500 transition-colors" />
              {post.likes_count || 0}
            </span>
            <span className="flex items-center gap-1 text-[10px] font-black">
              <MessageCircle size={14} className="group-hover:text-blue-500 transition-colors" />
              {post.comments_count || 0}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}


