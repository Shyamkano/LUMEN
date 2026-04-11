'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui';
import { FileText, Trash2, Clock, ArrowRight } from 'lucide-react';
import { getDrafts, deleteDraft } from '@/app/actions/drafts';
import { formatDistanceToNow } from 'date-fns';
import type { Draft } from '@/types';

interface DraftManagerProps {
  onLoadDraft: (draft: Draft) => void;
}

export function DraftManager({ onLoadDraft }: DraftManagerProps) {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      getDrafts().then(data => {
        setDrafts(data as Draft[]);
        setLoading(false);
      });
    }
  }, [isOpen]);

  const handleDelete = async (id: string) => {
    await deleteDraft(id);
    setDrafts(drafts.filter(d => d.id !== id));
  };

  if (!isOpen) {
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={() => setIsOpen(true)}
        type="button"
        className="gap-2"
      >
        <FileText size={14} />
        Drafts {drafts.length > 0 && `(${drafts.length})`}
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-fade-in"
      onClick={() => setIsOpen(false)}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[70vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <h2 className="text-lg font-semibold text-zinc-900">Your Drafts</h2>
          <button onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-zinc-900 text-sm">
            Close
          </button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[calc(70vh-4rem)]">
          {loading ? (
            <div className="text-center py-12 text-zinc-400 text-sm">Loading drafts...</div>
          ) : drafts.length === 0 ? (
            <div className="text-center py-12 text-zinc-400 text-sm">No drafts yet</div>
          ) : (
            <div className="space-y-2">
              {drafts.map((draft) => (
                <div
                  key={draft.id}
                  className="flex items-center gap-4 p-4 rounded-xl hover:bg-zinc-50 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900 truncate">
                      {draft.title || 'Untitled Draft'}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        draft.type === 'blog' ? 'bg-emerald-50 text-emerald-600' :
                        draft.type === 'micro' ? 'bg-violet-50 text-violet-600' :
                        draft.type === 'code' ? 'bg-orange-50 text-orange-600' :
                        'bg-sky-50 text-sky-600'
                      }`}>
                        {draft.type}
                      </span>
                      <span className="text-xs text-zinc-400 flex items-center gap-1">
                        <Clock size={10} />
                        {formatDistanceToNow(new Date(draft.last_saved_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(draft.id)}
                      className="h-8 w-8 text-zinc-400 hover:text-red-500"
                      type="button"
                    >
                      <Trash2 size={14} />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { onLoadDraft(draft); setIsOpen(false); }}
                      className="h-8 text-xs gap-1"
                      type="button"
                    >
                      Load <ArrowRight size={12} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
