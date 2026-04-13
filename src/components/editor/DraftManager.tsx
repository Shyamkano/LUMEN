'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui';
import { FileText, Trash2, Clock, ArrowRight, X, Ghost } from 'lucide-react';
import { getDrafts, deleteDraft } from '@/app/actions/drafts';
import { formatDistanceToNow } from 'date-fns';
import type { Draft } from '@/types';

import { createPortal } from 'react-dom';

interface DraftManagerProps {
  onLoadDraft: (draft: Draft) => void;
}

export function DraftManager({ onLoadDraft }: DraftManagerProps) {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const modal = isOpen && mounted && createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300" onClick={() => setIsOpen(false)} />
      
      <div
        className="relative bg-white rounded-[2.5rem] shadow-[0_64px_128px_rgba(0,0,0,0.4)] w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-500"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-10 py-8 border-b border-zinc-100 bg-zinc-50/50">
          <div className="space-y-1">
            <h2 className="text-3xl font-black uppercase tracking-tighter text-zinc-900 leading-none">Archive<br/>Drafts</h2>
            <div className="h-1 w-8 bg-zinc-900 rounded-full" />
          </div>
          <button onClick={() => setIsOpen(false)} className="w-14 h-14 flex items-center justify-center rounded-full bg-white border border-zinc-100 text-zinc-400 hover:text-zinc-900 transition-all hover:rotate-90">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 md:p-10 overflow-y-auto flex-1 no-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-6">
              <div className="w-10 h-10 border-4 border-zinc-100 border-t-zinc-900 rounded-full animate-spin" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Syncing Cache...</p>
            </div>
          ) : drafts.length === 0 ? (
            <div className="py-24 text-center space-y-4">
              <Ghost className="mx-auto text-zinc-200" size={48} strokeWidth={1} />
              <p className="text-xs font-black text-zinc-300 uppercase tracking-[0.4em] italic leading-relaxed">Registry is currently<br/>silent</p>
            </div>
          ) : (
            <div className="space-y-4 pb-20">
              {drafts.map((draft) => (
                <div
                  key={draft.id}
                  className="group flex flex-col gap-6 p-8 rounded-[2rem] bg-zinc-50/50 border border-zinc-100 hover:border-zinc-900 hover:bg-white transition-all shadow-sm hover:shadow-2xl"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 border border-zinc-200 px-2 py-0.5 rounded-full">
                        {draft.type}
                      </span>
                      <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">
                        {formatDistanceToNow(new Date(draft.last_saved_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-xl font-black text-zinc-900 tracking-tight leading-tight uppercase">
                      {draft.title || 'Untitled Signal'}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => { onLoadDraft(draft); setIsOpen(false); }}
                      className="flex-1 h-12 flex items-center justify-center gap-3 rounded-full bg-zinc-900 text-white font-black uppercase tracking-widest text-[10px] shadow-xl shadow-zinc-200 hover:bg-black transition-all"
                    >
                      <ArrowRight size={14} strokeWidth={3} />
                      Resume Narrative
                    </button>
                    <button
                      onClick={() => handleDelete(draft.id)}
                      className="w-12 h-12 flex items-center justify-center rounded-full bg-white border border-zinc-100 text-zinc-400 hover:text-red-500 hover:border-red-100 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        type="button"
        className="shrink-0 px-5 py-2.5 rounded-full border border-zinc-900 bg-zinc-900 text-white text-[9px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-zinc-200 flex items-center gap-2"
      >
        <FileText size={12} strokeWidth={3} />
        Drafts ({drafts.length})
      </button>
      {modal}
    </>
  );
}
