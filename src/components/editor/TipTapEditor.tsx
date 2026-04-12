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
import { ReactRenderer } from '@tiptap/react';
import tippy from 'tippy.js';
import { searchUsers } from '@/app/actions/profiles';
import { SuggestionList } from './SuggestionList';

const lowlight = createLowlight(common);

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

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        // @ts-ignore - explicitly trying to disable if present in this modified StarterKit
        link: false,
        // @ts-ignore
        underline: false,
      }),
      Placeholder.configure({ placeholder }),
      LinkExt.configure({ 
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
      }),
      Image,
      Underline,
      CodeBlockLowlight.configure({ lowlight }),
      Mention.configure({
        HTMLAttributes: {
          class: 'mention bg-zinc-100 text-black px-1.5 py-0.5 rounded-md font-bold decoration-none border border-black/5',
        },
        suggestion: {
          items: async ({ query }) => {
            if (!query || query.length < 1) return []; // Turbo Search: Don't search for nothing
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

                if (!props.clientRect) {
                  return;
                }

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
                if (!component) return;
                component.updateProps(props);

                if (!props.clientRect) {
                  return;
                }

                popup?.[0]?.setProps({
                  getReferenceClientRect: props.clientRect,
                });
              },

              onKeyDown(props: any) {
                if (props.event.key === 'Escape') {
                  popup?.[0]?.hide();
                  return true;
                }
                // Hardened Guard
                return component?.ref?.onKeyDown?.(props) || false;
              },

              onExit() {
                popup?.[0]?.destroy();
                component?.destroy();
              },
            };
          },
        },
      }),
      ...(maxLength ? [CharacterCount.configure({ limit: maxLength })] : []),
    ],
    content: content || undefined,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      onChange?.(json);

      // Auto-save to localStorage
      if (autoSaveKey) {
        if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
        autoSaveTimer.current = setTimeout(() => {
          localStorage.setItem(`flow-draft-${autoSaveKey}`, JSON.stringify(json));
        }, 1000);
      }
    },
    editorProps: {
      attributes: {
        class: `prose prose-zinc prose-lg max-w-none focus:outline-none min-h-[300px] px-1 py-4 editor-content ${className}`,
      },
    },
  });

  // Sync internal editor content with prop changes (e.g. loading from DB)
  useEffect(() => {
    if (editor && content) {
      const currentContent = editor.getJSON();
      if (JSON.stringify(currentContent) !== JSON.stringify(content)) {
        editor.commands.setContent(content, { emitUpdate: false });
      }
    } else if (editor && content === null) {
      // Explicitly clear if content is null
      editor.commands.setContent('', { emitUpdate: false });
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
