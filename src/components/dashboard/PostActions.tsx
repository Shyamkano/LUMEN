'use client';

import { useState } from 'react';
import { MoreVertical, Edit3, Trash2, Loader2, Link as LinkIcon, Share } from 'lucide-react';
import { deletePost } from '@/app/actions/posts';
import { deleteDraft } from '@/app/actions/drafts';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui';

interface PostActionsProps {
  id: string;
  type: 'post' | 'draft';
  slug?: string;
}

export function PostActions({ id, type, slug }: PostActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete this ${type}? This action cannot be undone.`)) return;
    
    setIsDeleting(true);
    try {
      if (type === 'post') {
        const result = await deletePost(id);
        if (result?.error) alert(result.error);
        else router.refresh();
      } else {
        const result = await deleteDraft(id);
        if (result?.error) alert(result.error);
        else router.refresh();
      }
    } catch (err) {
      alert('An error occurred.');
    } finally {
      setIsDeleting(false);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-8 w-8 text-zinc-500 hover:text-zinc-900 bg-white/80 hover:bg-white backdrop-blur-md shadow-sm border border-zinc-100"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isDeleting}
      >
        {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <MoreVertical size={16} />}
      </Button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-10 w-48 bg-white border border-zinc-100 shadow-xl rounded-2xl p-2 z-50 animate-scale-in origin-top-right">
            
            {type === 'post' && slug && (
              <>
                <Link href={`/new?postId=${id}`} onClick={() => setIsOpen(false)}>
                  <button className="flex w-full items-center gap-2 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 rounded-xl transition-colors text-left">
                    <Edit3 size={14} /> Edit Post
                  </button>
                </Link>
                <Link href={`/post/${slug}`} onClick={() => setIsOpen(false)}>
                  <button className="flex w-full items-center gap-2 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 rounded-xl transition-colors text-left">
                    <LinkIcon size={14} /> View Post
                  </button>
                </Link>
              </>
            )}

            {type === 'draft' && (
              <Link href={`/new?draftId=${id}`} onClick={() => setIsOpen(false)}>
                  <button className="flex w-full items-center gap-2 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 rounded-xl transition-colors text-left">
                    <Edit3 size={14} /> Resume Draft
                  </button>
                </Link>
            )}

            <button 
              onClick={handleDelete}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl transition-colors text-left"
            >
              <Trash2 size={14} /> Delete {type === 'post' ? 'Post' : 'Draft'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
