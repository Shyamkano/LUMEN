'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui';
import { getComments, addComment, deleteComment } from '@/app/actions/comments';
import { useAuth } from '@/lib/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { MessageCircle, Send, Trash2, CornerDownRight } from 'lucide-react';
import type { Comment } from '@/types';

interface CommentSectionProps {
  postId: string;
  initialCount: number;
}

export function CommentSection({ postId, initialCount }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      getComments(postId).then(data => {
        setComments(data as Comment[]);
        setLoading(false);
      });
    }
  }, [isOpen, postId]);

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    setSubmitting(true);

    const result = await addComment(postId, newComment, replyTo);
    if (!result.error) {
      setNewComment('');
      setReplyTo(null);
      // Refresh comments
      const data = await getComments(postId);
      setComments(data as Comment[]);
    }
    setSubmitting(false);
  };

  const handleDelete = async (commentId: string) => {
    await deleteComment(commentId);
    const data = await getComments(postId);
    setComments(data as Comment[]);
  };

  const CommentItem = ({ comment, depth = 0 }: { comment: Comment; depth?: number }) => {
    const authorName = comment.anonymous_identity?.alias_name
      || comment.profile?.full_name
      || 'User';

    return (
      <div className={`${depth > 0 ? 'ml-8 pl-6 border-l border-border' : ''}`}>
        <div className="py-6 group animate-reveal">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-muted/10 border border-border flex items-center justify-center text-[10px] font-black text-foreground">
              {authorName.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black text-foreground uppercase tracking-wider">{authorName}</span>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
              </span>
            </div>
          </div>
          <p className="text-sm text-foreground leading-relaxed ml-11 font-medium">{comment.content}</p>
          <div className="flex items-center gap-4 ml-11 mt-4 opacity-0 group-hover:opacity-100 transition-all">
            {user && (
              <button
                onClick={() => setReplyTo(comment.id)}
                className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
              >
                <CornerDownRight size={12} strokeWidth={3} /> Reply
              </button>
            )}
            {user?.id === comment.user_id && (
              <button
                onClick={() => handleDelete(comment.id)}
                className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-destructive flex items-center gap-1.5 transition-colors"
              >
                <Trash2 size={12} strokeWidth={3} /> Delete
              </button>
            )}
          </div>
        </div>

        {/* Nested replies */}
        {comment.replies?.map(reply => (
          <CommentItem key={reply.id} comment={reply as Comment} depth={depth + 1} />
        ))}
      </div>
    );
  };

  return (
    <div id="comments" className="mt-20 pt-16 border-t border-border">
      <div className="flex items-center justify-between mb-12">
        <h3 className="text-2xl font-black uppercase tracking-tight text-foreground">Responses</h3>
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground bg-muted/5 px-4 py-1.5 rounded-full border border-border">
          {initialCount} Contributions
        </span>
      </div>

      <div className="space-y-12 animate-fade-in">
        {/* Comment input */}
        {user ? (
          <div className="flex gap-4 items-start mb-16 p-8 rounded-[2rem] bg-card border border-border shadow-2xl shadow-foreground/5">
            <div className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-black shrink-0">
              {user.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 space-y-4">
              {replyTo && (
                <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-foreground bg-muted/10 px-4 py-2 rounded-xl border border-border">
                  <CornerDownRight size={12} strokeWidth={3} />
                  <span>Replying to participant</span>
                  <button onClick={() => setReplyTo(null)} className="ml-auto hover:scale-125 transition-transform">✕</button>
                </div>
              )}
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Join the discourse..."
                rows={4}
                className="w-full p-6 rounded-2xl border border-border text-sm font-medium focus:outline-none focus:border-foreground resize-none bg-muted/5 placeholder:text-muted-foreground/60 transition-all leading-relaxed"
              />
              <div className="flex justify-end">
                <Button
                  onClick={handleSubmit}
                  disabled={submitting || !newComment.trim()}
                  className="rounded-full h-12 px-8 font-black uppercase tracking-widest text-[10px]"
                >
                  <Send size={14} strokeWidth={3} />
                  {submitting ? 'Syncing...' : 'Dispatch'}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center rounded-[2.5rem] bg-muted/5 border border-dashed border-border mb-16">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground mb-6">Authentication required to participate</p>
            <Link href="/auth">
              <Button variant="outline" className="rounded-full px-8 h-12 font-black uppercase tracking-widest text-[10px]">
                Sign In
              </Button>
            </Link>
          </div>
        )}

        {/* Comments list */}
        {loading ? (
          <div className="flex flex-col items-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-foreground/10 border-t-foreground rounded-full animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Indexing dialogue...</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="py-32 text-center">
            <p className="text-sm font-black text-muted-foreground uppercase tracking-[0.4em] italic">
              The archive is currently silent.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map(comment => (
              <CommentItem key={comment.id} comment={comment} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

