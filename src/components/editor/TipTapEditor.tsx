'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import LinkExt from '@tiptap/extension-link';
import { mergeAttributes, Node } from '@tiptap/core';
import Underline from '@tiptap/extension-underline';
import CharacterCount from '@tiptap/extension-character-count';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import { EditorToolbar } from './EditorToolbar';
import { useCallback, useEffect, useRef } from 'react';
import Mention from '@tiptap/extension-mention';
import { ReactRenderer } from '@tiptap/react';
import tippy from 'tippy.js';
import { searchUsers } from '@/app/actions/profiles';
import { SuggestionList } from './SuggestionList';

const lowlight = createLowlight(common);

// Override the node spec — must declare label in addAttributes for JSON round-trip
const CustomMention = Mention.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      id: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('data-id'),
        renderHTML: (attributes: Record<string, any>) => {
          if (!attributes.id) return {};
          return { 'data-id': attributes.id };
        },
      },
      label: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('data-label'),
        renderHTML: (attributes: Record<string, any>) => {
          if (!attributes.label) return {};
          return { 'data-label': attributes.label };
        },
      },
    };
  },
  renderHTML({ node, HTMLAttributes }) {
    const label = node.attrs.label;
    const text = (!label || label === 'null') ? '@Resident' : `@${label}`;
    
    // Use the combined attributes but enforce the mention-tag class
    const attrs = mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
      class: 'mention-tag',
    });
    
    return ['span', attrs, text];
  },
  renderText({ node }) {
    const label = node.attrs.label;
    if (!label || label === 'null') return '@Resident';
    return `@${label}`;
  },
});


interface TipTapEditorProps {
  editor?: ReturnType<typeof useEditor> | null;
  content?: Record<string, unknown> | null;
  onChange?: (content: Record<string, unknown>) => void;
  placeholder?: string;
  maxLength?: number;
  showToolbar?: boolean;
  autoSaveKey?: string;
  className?: string;
  onOpenAI?: () => void;
}

// FIXED IMAGE NODE
const PersistentImage = Node.create({
  name: 'lumenImage',
  group: 'block',
  inline: false,
  draggable: true,
  addAttributes() {
    return {
      src: { default: null, parseHTML: element => element.getAttribute('src') || element.getAttribute('url') },
      url: { default: null },
      alt: { default: null },
      title: { default: null },
    };
  },
  parseHTML() {
    return [{ tag: 'img' }];
  },
  addCommands() {
    return {
      setImage: (options: any) => ({ commands }: any) => {
        return commands.insertContent({
          type: this.name,
          attrs: options,
        });
      },
    } as any;
  },
  renderHTML({ node }) {
    const finalSrc = node.attrs.src || node.attrs.url;
    return ['div', { class: 'lumen-image-container lumen-shimmer relative my-16 group mx-auto max-w-4xl' }, 
      ['img', {
        src: finalSrc,
        class: 'rounded-[32px] border border-border block w-full shadow-2xl transition-all duration-700 h-auto hover:scale-[1.01]',
      }],
      ['div', { class: 'absolute top-6 right-6 text-[8px] font-black uppercase tracking-[0.3em] text-white/30 bg-black/20 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10 opacity-0 group-hover:opacity-100 transition-all duration-500 font-mono' }, 'LUMEN AUTHORITY']
    ];
  },
});

export function TipTapEditor({
  editor,
  content,
  onChange,
  placeholder = 'Start writing...',
  maxLength,
  showToolbar = true,
  autoSaveKey,
  className = '',
  onOpenAI,
}: TipTapEditorProps) {
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync content from parent ONLY on initial load — after that, editor is source of truth
  const hasInitialContentRef = useRef(false);

  useEffect(() => {
    if (!editor || !content || hasInitialContentRef.current) return;
    
    // Only set content if the editor is basically empty (it has one empty paragraph)
    // and we have incoming content to sync.
    const isEditorEmpty = editor.isEmpty || editor.getText().trim() === '';
    
    if (isEditorEmpty && content) {
      hasInitialContentRef.current = true;
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [editor, content]);

  const getCharCount = useCallback(() => {
    if (!editor || !maxLength) return null;
    const storage = editor.storage.characterCount;
    if (!storage) return null;
    return {
      characters: storage.characters(),
      limit: maxLength,
    };
  }, [editor, maxLength]);

  const charInfo = getCharCount();

  return (
    <div className="flex flex-col">
      {showToolbar && <EditorToolbar editor={editor} onOpenAI={onOpenAI} />}
      <div className="relative">
        <EditorContent editor={editor} />
      </div>
      {charInfo && (
        <div className={`text-xs text-right mt-2 px-4 font-mono ${
          charInfo.characters > charInfo.limit * 0.9 ? 'text-amber-600' : 'text-zinc-400'
        }`}>
          {charInfo.characters}/{charInfo.limit}
        </div>
      )}
    </div>
  );
}
