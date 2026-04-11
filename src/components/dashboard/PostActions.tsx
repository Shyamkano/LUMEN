'use client';

import { useState } from 'react';
import { MoreVertical, Edit3, Trash2, Loader2, Link as LinkIcon, X, AlertTriangle } from 'lucide-react';
import { deletePost } from '@/app/actions/posts';
import { deleteDraft } from '@/app/actions/drafts';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui';

import { createPortal } from 'react-dom';

interface PostActionsProps {
  id: string;
  type: 'post' | 'draft';
  slug?: string;
}

export function PostActions({ id, type, slug }: PostActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    setShowConfirm(false);
    try {
      if (type === 'post') {
        const result = await deletePost(id);
        if (result?.error) alert(result.error);
        else router.push('/dashboard');
      } else {
        const result = await deleteDraft(id);
        if (result?.error) alert(result.error);
        else window.location.reload();
      }
    } catch (err) {
      alert('An error occurred.');
    } finally {
      setIsDeleting(false);
      setIsOpen(false);
    }
  };

  const modalContent = showConfirm && createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-500" 
        onClick={() => setShowConfirm(false)}
      />
      <div className="relative bg-white rounded-[3rem] border border-zinc-100 shadow-[0_32px_128px_rgba(0,0,0,0.3)] p-10 max-w-md w-full space-y-10 animate-in zoom-in-95 duration-300">
        <div className="flex justify-between items-start">
          <div className="w-16 h-16 rounded-[1.5rem] bg-red-50 flex items-center justify-center text-red-600">
            <AlertTriangle size={32} />
          </div>
          <button 
            onClick={() => setShowConfirm(false)}
            className="p-3 hover:bg-zinc-50 rounded-full transition-all hover:rotate-90"
          >
            <X size={24} className="text-zinc-400" />
          </button>
        </div>

        <div className="space-y-4">
          <h3 className="text-4xl font-black tracking-tighter uppercase text-zinc-900 leading-none">
            Purge<br/>Entry?
          </h3>
          <p className="text-sm text-zinc-500 font-bold leading-relaxed uppercase tracking-widest">
            Confirm termination of this signal.
          </p>
          <div className="h-px w-12 bg-red-500" />
          <p className="text-sm text-zinc-500 font-medium">
            You are about to permanently delete this {type} from the LUMEN archive. This action cannot be reversed.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <Button 
            onClick={handleDelete}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-xs h-14 rounded-full shadow-lg shadow-red-200"
          >
            Execute Deletion
          </Button>
          <Button 
            variant="ghost"
            onClick={() => setShowConfirm(false)}
            className="w-full text-zinc-400 hover:text-zinc-900 font-black uppercase tracking-widest text-[10px] h-14 rounded-full"
          >
            Abort Protocol
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );

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
              onClick={() => {
                setShowConfirm(true);
                setIsOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl transition-colors text-left"
            >
              <Trash2 size={14} /> Delete {type === 'post' ? 'Post' : 'Draft'}
            </button>
          </div>
        </>
      )}

      {modalContent}
    </div>
  );
}
