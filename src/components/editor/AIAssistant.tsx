'use client';

import { useState } from 'react';
import { Button } from '@/components/ui';
import { useAI } from '@/lib/hooks/usePosts';
import {
  Sparkles, Lightbulb, Type, Hash, FileText,
  CheckCircle2, Wand2, X, ChevronDown
} from 'lucide-react';
import { extractTextFromTipTap } from '@/lib/utils';

interface AIAssistantProps {
  title: string;
  content: Record<string, unknown> | null;
  onInsertTitle?: (title: string) => void;
  onInsertContent?: (content: string) => void;
  onAddTag?: (tag: string) => void;
}

export function AIAssistant({ title, content, onInsertTitle, onInsertContent, onAddTag }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
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

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        type="button"
        className="fixed bottom-8 right-8 z-50 w-14 h-14 rounded-full bg-black text-white shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300 group"
      >
        <Sparkles size={24} strokeWidth={2.5} className="group-hover:rotate-12 transition-transform" />
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-black border-2 border-white rounded-full animate-pulse" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-8 right-8 z-50 w-[350px] bg-white rounded-[2rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] border border-border overflow-hidden animate-reveal flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-muted/5">
        <div className="flex items-center gap-3">
          <Sparkles size={18} strokeWidth={2.5} className="text-black" />
          <span className="text-xs font-black uppercase tracking-[0.2em] text-black">Dialogue Assistant</span>
        </div>
        <button 
          onClick={() => setIsOpen(false)} 
          className="hover:bg-black hover:text-white rounded-full p-2 transition-all duration-300"
        >
          <X size={16} strokeWidth={3} />
        </button>
      </div>

      {/* Actions */}
      <div className="p-4 grid grid-cols-2 gap-2 border-b border-border bg-white">
        {actions.map((item) => {
          const Icon = item.icon;
          const disabled = item.needsContent && !textContent.trim();
          return (
            <button
              key={item.action}
              onClick={() => runAction(item.action, item.label)}
              disabled={disabled || aiMutation.isPending}
              type="button"
              className={`flex flex-col items-start gap-3 p-4 rounded-2xl text-left transition-all duration-300 border border-transparent ${
                disabled
                  ? 'opacity-30 cursor-not-allowed'
                  : 'hover:bg-muted/50 hover:border-border group'
              }`}
            >
              <div className="p-2 rounded-lg bg-muted group-hover:bg-black group-hover:text-white transition-colors">
                <Icon size={16} strokeWidth={2.5} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-black">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Result Container */}
      <div className="flex-1 bg-muted/5 min-h-0 flex flex-col">
        {aiMutation.isPending ? (
          <div className="p-8 flex flex-col items-center justify-center gap-4 animate-pulse">
            <div className="w-8 h-8 border-4 border-black/10 border-t-black rounded-full animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Synthesizing...</p>
          </div>
        ) : result ? (
          <div className="p-6 space-y-4 animate-reveal">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{resultType}</p>
              <button 
                onClick={() => setResult('')}
                className="text-[10px] font-black uppercase tracking-widest text-black hover:underline"
              >
                Clear
              </button>
            </div>
            
            <div className="text-sm font-medium text-black bg-white rounded-2xl p-5 border border-border shadow-sm max-h-[300px] overflow-y-auto leading-relaxed">
              {(() => {
                try {
                  const data = JSON.parse(result);
                  if (data.titles && Array.isArray(data.titles)) {
                    return (
                      <div className="flex flex-col gap-2">
                        {data.titles.map((t: string, i: number) => (
                           <button 
                             key={i} 
                             onClick={() => onInsertTitle?.(t)} 
                             className="text-left px-4 py-3 bg-muted/30 hover:bg-black hover:text-white rounded-xl text-sm transition-all border border-border"
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
                             className="px-3 py-1.5 bg-muted/30 hover:bg-black hover:text-white rounded-full text-xs font-bold transition-all border border-border"
                           >
                             #{t}
                           </button>
                        ))}
                      </div>
                    );
                  }
                  return <div className="whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</div>;
                } catch {
                  return <div className="whitespace-pre-wrap">{result}</div>;
                }
              })()}
            </div>

            {onInsertContent && !result.startsWith('Error:') && (
              <Button
                onClick={() => onInsertContent(result)}
                className="w-full rounded-full h-12 font-black uppercase tracking-widest text-[10px]"
              >
                Insert Selection
              </Button>
            )}
          </div>
        ) : (
          <div className="p-12 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground italic leading-relaxed">
              Select an action to augment your narrative.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

