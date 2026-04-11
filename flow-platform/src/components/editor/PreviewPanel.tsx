'use client';

import { generateHTML } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';
import LinkExt from '@tiptap/extension-link';
import ImageExt from '@tiptap/extension-image';
import UnderlineExt from '@tiptap/extension-underline';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import type { PostType } from '@/types';

const lowlight = createLowlight(common);

const extensions = [
  StarterKit.configure({ codeBlock: false }),
  LinkExt.configure({ 
    openOnClick: false,
    autolink: true,
  }),
  ImageExt,
  UnderlineExt,
  CodeBlockLowlight.configure({ lowlight }),
];

interface PreviewPanelProps {
  title: string;
  content: Record<string, unknown> | null;
  type: PostType;
  codeSnippets?: { code: string; language: string; title?: string }[];
}

export function PreviewPanel({ title, content, type, codeSnippets = [] }: PreviewPanelProps) {
  let html = '';
  try {
    if (content && content.type === 'doc') {
      html = generateHTML(content, extensions);
    }
  } catch {
    html = '<p class="text-zinc-400 italic">Preview unavailable</p>';
  }

  return (
    <div className="preview-panel bg-white rounded-2xl border border-zinc-100 overflow-hidden">
      <div className="px-6 py-4 bg-zinc-50 border-b border-zinc-100">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-amber-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
          <span className="ml-4 text-xs text-zinc-400 font-mono">Preview</span>
        </div>
      </div>

      <div className="p-8 max-h-[70vh] overflow-y-auto">
        {/* Title */}
        {title ? (
          <h1 className="text-3xl md:text-4xl font-bold font-serif mb-6 text-zinc-900 leading-tight">
            {title}
          </h1>
        ) : (
          <h1 className="text-3xl font-bold font-serif mb-6 text-zinc-300 italic">
            Untitled
          </h1>
        )}

        {/* Post type badge */}
        <div className="mb-6 flex items-center gap-2">
          <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
            type === 'blog' ? 'bg-emerald-50 text-emerald-700' :
            type === 'micro' ? 'bg-violet-50 text-violet-700' :
            type === 'code' ? 'bg-orange-50 text-orange-700' :
            'bg-sky-50 text-sky-700'
          }`}>
            {type}
          </span>
          <span className="text-xs text-zinc-400">Preview</span>
        </div>

        {/* Micro post preview */}
        {type === 'micro' && (
          <div className="text-lg leading-relaxed text-zinc-700" dangerouslySetInnerHTML={{ __html: html }} />
        )}

        {/* Blog/Code post content preview */}
        {(type === 'blog' || type === 'code') && (
          <div
            className="prose prose-zinc prose-lg max-w-none
              prose-headings:font-serif prose-headings:font-bold
              prose-blockquote:border-zinc-900 prose-blockquote:font-serif
              prose-pre:bg-zinc-900 prose-pre:text-zinc-100 prose-pre:rounded-xl
              prose-img:rounded-xl prose-img:shadow-lg"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        )}

        {/* Code snippets preview */}
        {type === 'code' && codeSnippets.length > 0 && (
          <div className="mt-8 space-y-6">
            <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">Code Snippets</h3>
            {codeSnippets.map((snippet, i) => (
              <div key={i} className="rounded-xl overflow-hidden border border-zinc-200">
                <div className="flex items-center gap-2 px-4 py-2 bg-zinc-100 border-b border-zinc-200">
                  <span className="text-xs font-mono text-zinc-500">{snippet.language}</span>
                  {snippet.title && (
                    <>
                      <span className="text-zinc-300">·</span>
                      <span className="text-xs text-zinc-600">{snippet.title}</span>
                    </>
                  )}
                </div>
                <pre className="p-4 bg-zinc-900 text-green-400 text-sm font-mono overflow-x-auto">
                  <code>{snippet.code}</code>
                </pre>
              </div>
            ))}
          </div>
        )}

        {/* Audio post preview */}
        {type === 'audio' && (
          <div className="flex items-center gap-4 p-6 bg-gradient-to-r from-violet-50 to-sky-50 rounded-2xl border border-violet-100 mt-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-sky-500 flex items-center justify-center shadow-lg">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-zinc-900">Audio Post</p>
              <p className="text-sm text-zinc-500">Audio content will appear here after upload</p>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!html && type !== 'audio' && (
          <p className="text-zinc-400 italic text-center py-12">Start writing to see a preview...</p>
        )}
      </div>
    </div>
  );
}
