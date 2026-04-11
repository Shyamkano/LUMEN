'use client';

import { useState } from 'react';
import { Button } from '@/components/ui';
import { Plus, Trash2, Wand2, ChevronDown } from 'lucide-react';
import { useAI } from '@/lib/hooks/usePosts';

const LANGUAGES = [
  'javascript', 'typescript', 'python', 'java', 'go', 'rust', 'c', 'cpp',
  'csharp', 'ruby', 'php', 'swift', 'kotlin', 'html', 'css', 'sql',
  'bash', 'json', 'yaml', 'toml', 'markdown', 'docker', 'graphql',
];

interface Snippet {
  code: string;
  language: string;
  title: string;
  ai_explanation?: string;
}

interface CodeEditorProps {
  snippets: Snippet[];
  onChange: (snippets: Snippet[]) => void;
}

export function CodeEditor({ snippets, onChange }: CodeEditorProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
  const aiMutation = useAI();

  const addSnippet = () => {
    onChange([...snippets, { code: '', language: 'javascript', title: '' }]);
    setExpandedIndex(snippets.length);
  };

  const removeSnippet = (index: number) => {
    onChange(snippets.filter((_, i) => i !== index));
    if (expandedIndex === index) setExpandedIndex(null);
  };

  const updateSnippet = (index: number, field: keyof Snippet, value: string) => {
    const updated = [...snippets];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const explainCode = async (index: number) => {
    const snippet = snippets[index];
    if (!snippet.code.trim()) return;

    try {
      const result = await aiMutation.mutateAsync({
        action: 'explain_code',
        code: snippet.code,
        language: snippet.language,
      });
      updateSnippet(index, 'ai_explanation', result.result);
    } catch { /* handle error */ }
  };

  const detectLanguage = async (index: number) => {
    const snippet = snippets[index];
    if (!snippet.code.trim()) return;

    try {
      const result = await aiMutation.mutateAsync({
        action: 'detect_language',
        code: snippet.code,
      });
      updateSnippet(index, 'language', result.result.trim().toLowerCase());
    } catch { /* handle error */ }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-700 uppercase tracking-wider">Code Snippets</h3>
        <Button size="sm" variant="outline" onClick={addSnippet} type="button">
          <Plus size={14} /> Add Snippet
        </Button>
      </div>

      {snippets.map((snippet, index) => (
        <div key={index} className="border border-zinc-200 rounded-xl overflow-hidden bg-zinc-50/50">
          {/* Header */}
          <div
            className="flex items-center gap-3 px-4 py-3 bg-white cursor-pointer hover:bg-zinc-50 transition-colors"
            onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
          >
            <ChevronDown
              size={16}
              className={`text-zinc-400 transition-transform ${expandedIndex === index ? 'rotate-0' : '-rotate-90'}`}
            />
            <input
              type="text"
              placeholder="Snippet title (optional)"
              value={snippet.title}
              onChange={(e) => updateSnippet(index, 'title', e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 text-sm bg-transparent outline-none placeholder:text-zinc-400"
            />
            <select
              value={snippet.language}
              onChange={(e) => updateSnippet(index, 'language', e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="text-xs bg-zinc-100 border-none rounded-md px-2 py-1 cursor-pointer text-zinc-600"
            >
              {LANGUAGES.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
            <Button
              size="icon"
              variant="ghost"
              onClick={(e) => { e.stopPropagation(); removeSnippet(index); }}
              className="h-7 w-7 text-zinc-400 hover:text-red-500"
              type="button"
            >
              <Trash2 size={14} />
            </Button>
          </div>

          {/* Body */}
          {expandedIndex === index && (
            <div className="border-t border-zinc-200">
              <textarea
                value={snippet.code}
                onChange={(e) => updateSnippet(index, 'code', e.target.value)}
                placeholder="Paste your code here..."
                className="w-full p-4 font-mono text-sm bg-zinc-900 text-green-400 min-h-[200px] resize-y outline-none placeholder:text-zinc-600"
                spellCheck={false}
              />
              <div className="flex items-center gap-2 p-3 bg-white border-t border-zinc-200">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => detectLanguage(index)}
                  disabled={aiMutation.isPending}
                  type="button"
                  className="text-xs"
                >
                  🔍 Detect Language
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => explainCode(index)}
                  disabled={aiMutation.isPending}
                  type="button"
                  className="text-xs"
                >
                  <Wand2 size={12} /> Explain Code
                </Button>
                {aiMutation.isPending && (
                  <span className="text-xs text-zinc-400 animate-pulse">AI thinking...</span>
                )}
              </div>
              {snippet.ai_explanation && (
                <div className="p-4 bg-blue-50 border-t border-blue-100 text-sm text-zinc-700 leading-relaxed">
                  <p className="text-xs font-semibold text-blue-600 mb-2 uppercase tracking-wider">AI Explanation</p>
                  {snippet.ai_explanation}
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      {snippets.length === 0 && (
        <div className="text-center py-12 text-zinc-400 text-sm border-2 border-dashed border-zinc-200 rounded-xl">
          No code snippets yet. Click &quot;Add Snippet&quot; to get started.
        </div>
      )}
    </div>
  );
}
