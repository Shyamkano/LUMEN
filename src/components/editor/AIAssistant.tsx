'use client';

import { useState } from 'react';
import { Button } from '@/components/ui';
import { useAI } from '@/lib/hooks/usePosts';
import {
  Sparkles, Lightbulb, Type, Hash, FileText,
  CheckCircle2, Wand2, X, ChevronDown, Zap
} from 'lucide-react';
import { extractTextFromTipTap } from '@/lib/utils';

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: Record<string, unknown> | null;
  onInsertTitle?: (title: string) => void;
  onInsertContent?: (content: string) => void;
  onAddTag?: (tag: string) => void;
}

export function AIAssistant({ isOpen, onClose, title, content, onInsertTitle, onInsertContent, onAddTag }: AIAssistantProps) {
  const [result, setResult] = useState<string>('');
  const [resultType, setResultType] = useState<string>('');
  const aiMutation = useAI();

  const textContent = extractTextFromTipTap(content);

  const runAction = async (action: string, label: string) => {
    setResultType(label);
    setResult('');
    try {
      const res = await aiMutation.mutateAsync({
        action,
        content: textContent,
        title,
      });
      if (typeof res.result === 'object') {
        setResult(JSON.stringify(res.result, null, 2));
      } else {
        setResult(res.result);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'AI request failed';
      setResult(`Error: ${message}`);
    }
  };

  const actions = [
    { action: 'generate_titles', label: 'Generate Titles', icon: Type, needsContent: true },
    { action: 'suggest_tags', label: 'Suggest Tags', icon: Hash, needsContent: true },
    { action: 'summarize', label: 'Summarize', icon: FileText, needsContent: true },
    { action: 'grammar_fix', label: 'Fix Grammar', icon: CheckCircle2, needsContent: true },
    { action: 'enhance_content', label: 'Enhance Writing', icon: Wand2, needsContent: true },
    { action: 'smart_suggestion', label: 'Continue Writing', icon: Lightbulb, needsContent: true },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md animate-reveal" onClick={onClose} />
      
      <div className="relative w-full max-w-xl bg-white rounded-[3rem] shadow-[0_64px_256px_rgba(0,0,0,0.5)] overflow-hidden animate-scale-in flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-10 py-8 border-b border-border bg-muted/5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-violet-500 rounded-2xl text-white shadow-lg shadow-violet-200">
              <Sparkles size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-2xl font-black uppercase tracking-tighter text-black leading-none">Synthesis Assistant</h3>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1 opacity-60">Archive Augmentation Protocol</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-12 h-12 flex items-center justify-center bg-zinc-100 hover:bg-black hover:text-white rounded-full transition-all"
          >
            <X size={20} strokeWidth={3} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-8">
          {/* Actions Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {actions.map((item) => {
              const Icon = item.icon;
              const disabled = item.needsContent && !textContent.trim();
              return (
                <button
                  key={item.action}
                  onClick={() => runAction(item.action, item.label)}
                  disabled={disabled || aiMutation.isPending}
                  type="button"
                  className={`flex flex-col items-center gap-3 p-6 rounded-3xl text-center transition-all duration-300 border ${
                    disabled
                      ? 'opacity-20 cursor-not-allowed grayscale'
                      : 'hover:bg-zinc-900 border-zinc-100 hover:border-zinc-900 group active:scale-95 bg-white shadow-sm hover:shadow-xl'
                  } ${aiMutation.isPending && resultType === item.label ? 'border-violet-500 ring-4 ring-violet-500/20' : ''}`}
                >
                  <div className="p-3 rounded-2xl bg-zinc-50 group-hover:bg-white group-hover:text-black transition-colors shadow-sm">
                    <Icon size={20} strokeWidth={2.5} className="text-zinc-400 group-hover:text-black" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-white transition-colors">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Result Area */}
          <div className="bg-zinc-50 rounded-[2.5rem] border border-zinc-100 overflow-hidden min-h-[200px] flex flex-col shadow-inner">
            {aiMutation.isPending ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-6 animate-pulse p-10">
                <Wand2 className="text-violet-500 animate-spin" size={32} />
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground">Synthesizing Chronicle...</p>
              </div>
            ) : result ? (
              <div className="p-8 space-y-6 animate-reveal">
                <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-violet-500">{resultType}</p>
                  <button 
                    onClick={() => setResult('')}
                    className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-black hover:underline"
                  >
                    Clear Result
                  </button>
                </div>
                
                <div className="text-sm font-medium text-zinc-700 leading-relaxed italic">
                  {(() => {
                    try {
                      const data = JSON.parse(result);
                      if (data.titles && Array.isArray(data.titles)) {
                        return (
                          <div className="grid grid-cols-1 gap-3">
                            {data.titles.map((t: string, i: number) => (
                               <button 
                                 key={i} 
                                 onClick={() => { onInsertTitle?.(t); onClose(); }} 
                                 className="text-left px-6 py-4 bg-white hover:bg-black hover:text-white rounded-2xl text-sm font-bold transition-all border border-zinc-200 shadow-sm"
                               >
                                 {t}
                               </button>
                            ))}
                          </div>
                        );
                      }
                      if (data.tags && Array.isArray(data.tags)) {
                        return (
                          <div className="flex flex-wrap gap-2">
                            {data.tags.map((t: string, i: number) => (
                               <button 
                                 key={i} 
                                 onClick={() => onAddTag?.(t)} 
                                 className="px-4 py-2 bg-white hover:bg-black hover:text-white rounded-full text-[10px] font-black uppercase tracking-widest transition-all border border-zinc-200 shadow-sm"
                               >
                                 #{t}
                               </button>
                            ))}
                          </div>
                        );
                      }
                      if (data.corrected) {
                        return (
                          <div className="space-y-4">
                            <div className="whitespace-pre-wrap">{data.corrected}</div>
                            {data.changes && Array.isArray(data.changes) && (
                              <div className="mt-4 pt-4 border-t border-zinc-100 flex flex-col gap-2">
                                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Archival Changes</span>
                                {data.changes.map((c: string, i: number) => (
                                  <div key={i} className="flex items-start gap-2 text-[10px] text-zinc-500">
                                    <span className="text-violet-500">•</span>
                                    <span>{c}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      }
                      return <div className="whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</div>;
                    } catch {
                      return <div className="whitespace-pre-wrap">{result}</div>;
                    }
                  })()}
                </div>

                {!result.startsWith('Error:') && (
                  <Button
                    onClick={() => { 
                      let finalContent = result;
                      try {
                        const data = JSON.parse(result);
                        if (data.corrected) finalContent = data.corrected;
                      } catch {}
                      onInsertContent?.(finalContent); 
                      onClose(); 
                    }}
                    className="w-full h-16 rounded-full bg-violet-600 hover:bg-violet-700 text-white font-black uppercase tracking-widest text-xs shadow-2xl shadow-violet-200 flex items-center justify-center gap-3"
                  >
                    <Zap size={18} fill="currentColor" />
                    Hydrate Selection
                  </Button>
                )}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center p-12 text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-300 italic leading-relaxed">
                  Await synthesis selection.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

