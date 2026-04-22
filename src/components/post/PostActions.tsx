'use client';

import { useState } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, Zap, Flag } from 'lucide-react';
import { Button } from '@/components/ui';
import { toggleLike, toggleBookmark } from '@/app/actions/engagement';
import ReportDialog from './ReportDialog';

interface PostActionsProps {
  postId: string;
  initialLikes: number;
  initialComments: number;
  initialLiked?: boolean;
  initialBookmarked?: boolean;
}

export function PostActions({
  postId,
  initialLikes = 0,
  initialComments = 0,
  initialLiked = false,
  initialBookmarked = false,
}: PostActionsProps) {
  const [likes, setLikes] = useState(initialLikes);
  const [liked, setLiked] = useState(initialLiked);
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [animating, setAnimating] = useState(false);
  const [showReport, setShowReport] = useState(false);

  const handleLike = async () => {
    setAnimating(true);
    setTimeout(() => setAnimating(false), 300);

    // Optimistic update
    setLiked(!liked);
    setLikes(liked ? likes - 1 : likes + 1);

    const result = await toggleLike(postId);
    if (result.error) {
      // Revert
      setLiked(liked);
      setLikes(likes);
    }
  };

  const handleBookmark = async () => {
    setBookmarked(!bookmarked);
    const result = await toggleBookmark(postId);
    if (result.error) {
      setBookmarked(bookmarked);
    }
  };

  const [shared, setShared] = useState(false);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: document.title,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  };

  const scrollToComments = () => {
    document.getElementById('comments')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="flex items-center gap-1 bg-card border border-border shadow-md rounded-full px-4 py-2 hover:shadow-lg transition-shadow duration-300">
        {/* Like */}
        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-full transition-all ${
            liked ? 'text-red-500' : 'text-muted-foreground hover:text-red-500 hover:bg-red-500/10'
          } ${animating ? 'scale-110' : 'scale-100'}`}
        >
          <Heart size={18} className={liked ? 'fill-red-500' : ''} />
          <span className="text-sm font-medium">{likes > 0 ? likes : ''}</span>
        </button>

        <div className="w-px h-5 bg-border" />

        {/* Comments */}
        <button 
          onClick={scrollToComments}
          className="flex items-center gap-1.5 px-3 py-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
        >
          <MessageCircle size={18} />
          <span className="text-sm font-medium">{initialComments > 0 ? initialComments : ''}</span>
        </button>

        <div className="w-px h-5 bg-border" />

        {/* Share */}
        <Button size="icon" variant="ghost" onClick={handleShare} className={`rounded-full h-9 w-9 transition-colors ${shared ? 'text-green-600' : 'text-muted-foreground hover:text-foreground'}`}>
          {shared ? <Zap size={18} className="fill-green-600" /> : <Share2 size={18} />}
        </Button>

        {/* Bookmark */}
        <Button
          size="icon"
          variant="ghost"
          onClick={handleBookmark}
          className={`rounded-full h-9 w-9 ${bookmarked ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <Bookmark size={18} className={bookmarked ? 'fill-foreground' : ''} />
        </Button>

        <div className="w-px h-5 bg-border" />

        {/* Report */}
        <button 
          onClick={() => setShowReport(true)}
          className="flex items-center justify-center h-9 w-9 rounded-full text-muted-foreground/60 hover:text-red-500 hover:bg-red-500/10 transition-all"
          title="Report Signal"
        >
          <Flag size={16} />
        </button>

        {showReport && (
          <ReportDialog postId={postId} onClose={() => setShowReport(false)} />
        )}
      </div>
  );
}
