'use client';

import { deletePost, updatePost } from '@/app/actions/posts';
import { useState } from 'react';
import { Trash2, EyeOff, Eye } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui';

export function PostAdminActions({ postId, postTitle, isPublished = true }: { postId: string, postTitle: string, isPublished?: boolean }) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isHideConfirmOpen, setIsHideConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isHiding, setIsHiding] = useState(false);

  const handleToggleHide = async () => {
    setIsHiding(true);
    const res = await updatePost(postId, { status: isPublished ? 'draft' : 'published' });
    if (res.success) {
      window.location.href = '/dashboard'; // Safe evacuation to dashboard
    } else {
      alert(`Moderation Error: ${res.error}`);
    }
    setIsHiding(false);
    setIsHideConfirmOpen(false);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    const res = await deletePost(postId);
    if (res.success) {
      window.location.href = '/feed'; // Safe evacuation to feed
    } else {
      alert(`Deletion Error: ${res.error}`);
    }
    setIsDeleting(false);
    setIsConfirmOpen(false);
  };

  return (
    <div className="flex items-center gap-3">
      <button 
        onClick={() => setIsHideConfirmOpen(true)}
        className="text-[8px] font-black uppercase text-black/40 hover:text-black hover:underline decoration-2 flex items-center gap-1 transition-colors"
      >
        {isPublished ? (
          <><EyeOff size={8} /> Hide Entry</>
        ) : (
          <><Eye size={8} /> Restore</>
        )}
      </button>

      <button 
        onClick={() => setIsConfirmOpen(true)}
        className="text-[8px] font-black uppercase text-red-500 hover:underline decoration-2 flex items-center gap-1"
      >
        Terminate <Trash2 size={8} />
      </button>

      {/* Hide/Restore Modal */}
      <Modal 
        isOpen={isHideConfirmOpen} 
        onClose={() => setIsHideConfirmOpen(false)} 
        title="Status Archive Sync"
      >
        <div className="space-y-6">
          <p className="text-sm font-medium text-black/60 leading-relaxed">
            {isPublished 
              ? <>Are you sure you want to <span className="font-black text-black">Hide</span> this entry? It will be removed from all public feeds and returned to the author's drafts.</>
              : <>Restore this entry to the <span className="font-black text-black">Public Archive</span>? It will become visible on all feeds instantly.</>
            }
          </p>
          <div className="flex flex-col gap-3">
            <Button 
              onClick={handleToggleHide}
              className="w-full bg-black hover:bg-black/80 text-white h-12 rounded-2xl font-black uppercase tracking-widest text-[10px]"
              disabled={isHiding}
            >
              {isHiding ? 'Syncing...' : isPublished ? 'Confirm Hide' : 'Confirm Restore'}
            </Button>
            <button 
              onClick={() => setIsHideConfirmOpen(false)}
              className="w-full h-12 text-[10px] font-black uppercase tracking-[0.2em] hover:underline"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Terminate Modal */}
      <Modal 
        isOpen={isConfirmOpen} 
        onClose={() => setIsConfirmOpen(false)} 
        title="Sanitize Network"
      >
        <div className="space-y-6">
          <p className="text-sm font-medium text-black/60 leading-relaxed">
            Permanently remove <span className="font-black text-black">"{postTitle}"</span> from the public archive? This action is <span className="text-red-600 font-black">irreversible</span>.
          </p>
          <div className="flex flex-col gap-3">
            <Button 
              onClick={handleDelete}
              className="w-full bg-red-600 hover:bg-red-700 text-white h-12 rounded-2xl font-black uppercase tracking-widest text-[10px]"
              disabled={isDeleting}
            >
              {isDeleting ? 'Sanitizing...' : 'Confirm Termination'}
            </Button>
            <button 
              onClick={() => setIsConfirmOpen(false)}
              className="w-full h-12 text-[10px] font-black uppercase tracking-[0.2em] hover:underline"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
