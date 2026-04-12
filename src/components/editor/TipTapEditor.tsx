'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import LinkExt from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import CharacterCount from '@tiptap/extension-character-count';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import { EditorToolbar } from './EditorToolbar';
import { useCallback, useEffect, useRef } from 'react';
import Mention from '@tiptap/extension-mention';
import { mergeAttributes } from '@tiptap/core';
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
  content?: Record<string, unknown> | null;
  onChange?: (content: Record<string, unknown>) => void;
  placeholder?: string;
  maxLength?: number;
  showToolbar?: boolean;
  autoSaveKey?: string;
  className?: string;
}

export function TipTapEditor({
  content,
  onChange,
  placeholder = 'Start writing...',
  maxLength,
  showToolbar = true,
  autoSaveKey,
  className = '',
}: TipTapEditorProps) {
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tiptapExtensions = [
    StarterKit.configure({
      codeBlock: false,
    }),
    Placeholder.configure({ placeholder }),
    LinkExt.configure({ 
      openOnClick: false,
      autolink: true,
      linkOnPaste: true,
      HTMLAttributes: {
        class: 'text-foreground hover:opacity-70 underline underline-offset-4 decoration-2 font-bold transition-all',
      },
    }),
    Image.configure({
      HTMLAttributes: {
        class: 'rounded-3xl border border-border my-16 mx-auto block transition-all duration-700',
      },
    }),
    Underline,
    CodeBlockLowlight.configure({ lowlight }),
    CustomMention.configure({
      HTMLAttributes: {
        class: 'mention bg-zinc-100/50 text-foreground px-1.5 py-0.5 rounded-md font-bold border border-border/50 hover:bg-foreground hover:text-background transition-colors cursor-pointer',
      },
      suggestion: {

        items: async ({ query }) => {
          if (!query || query.length < 1) return [];
          return await searchUsers(query);
        },
        render: () => {
          let component: any;
          let popup: any;

          return {
            onStart: (props: any) => {
              component = new ReactRenderer(SuggestionList, {
                props,
                editor: props.editor,
              });

              if (!props.clientRect) return;

              popup = tippy('body', {
                getReferenceClientRect: props.clientRect,
                appendTo: () => document.body,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: 'manual',
                placement: 'bottom-start',
              });
            },

            onUpdate(props: any) {
              component?.updateProps(props);
              if (!props.clientRect) return;
              popup?.[0]?.setProps({
                getReferenceClientRect: props.clientRect,
              });
            },

            onKeyDown(props: any) {
              if (props.event.key === 'Escape') {
                popup?.[0]?.hide();
                return true;
              }
              return component?.ref?.onKeyDown?.(props) || false;
            },

            onExit() {
              if (popup && popup[0]) popup[0].destroy();
              component?.destroy();
            },
          };
        },
      },
    }),
    ...(maxLength ? [CharacterCount.configure({ limit: maxLength })] : []),
  ];

  const editor = useEditor({
    extensions: tiptapExtensions,
    content: content || undefined,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      onChange?.(json);

      if (autoSaveKey) {
        if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
        autoSaveTimer.current = setTimeout(() => {
          localStorage.setItem(`flow-draft-${autoSaveKey}`, JSON.stringify(json));
        }, 1000);
      }
    },
    editorProps: {
      attributes: {
        class: `prose prose-zinc prose-lg max-w-none focus:outline-none min-h-[500px] px-1 py-8 editor-content ${className}`,
      },
    },
  });

  // Sync content from parent ONLY on initial load — after that, editor is source of truth
  const hasInitialContentRef = useRef(false);
  useEffect(() => {
    if (!editor) return;
    if (hasInitialContentRef.current) return; // Already loaded, don't overwrite
    
    if (content) {
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
      {showToolbar && <EditorToolbar editor={editor} />}
      <EditorContent editor={editor} />
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
