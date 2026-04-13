'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import Mention from '@tiptap/extension-mention';
import { mergeAttributes } from '@tiptap/core';
import Paragraph from '@tiptap/extension-paragraph';
import { useMemo } from 'react';

const lowlight = createLowlight(common);

const CustomImage = Image.extend({
  renderHTML({ HTMLAttributes }) {
    return ['img', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
      class: 'rounded-3xl border border-border my-16 mx-auto block transition-all duration-700 w-full shadow-2xl',
    })];
  },
});

const CustomMention = Mention.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      id: { default: null },
      label: { default: null },
    };
  },
  renderHTML({ node, HTMLAttributes }) {
    const label = node.attrs.label;
    const text = (!label || label === 'null') ? '@Resident' : `@${label}`;
    const attrs = mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
      class: 'mention-tag',
    });
    return ['a', { ...attrs, href: `/profile/${label}` }, text];
  },
});

const CustomParagraph = Paragraph.extend({
  addAttributes() {
    return {
      class: { default: null },
    };
  },
});

interface ArchivalReaderProps {
  content: any;
}

export function ArchivalReader({ content }: ArchivalReaderProps) {
  const extensions = useMemo(() => [
    StarterKit.configure({
      codeBlock: false,
      paragraph: false,
    }),
    CustomParagraph,
    Link.configure({
      openOnClick: true,
      HTMLAttributes: {
        class: 'text-foreground hover:opacity-70 underline underline-offset-4 decoration-2 font-bold transition-all',
      },
    }),
    CustomImage,
    Underline,
    CodeBlockLowlight.configure({ lowlight }),
    CustomMention.configure({
      HTMLAttributes: {
        class: 'mention-tag',
      },
    }),
  ], []);

  const editor = useEditor({
    extensions,
    content,
    editable: false,
    immediatelyRender: true,
  });

  if (!editor) return null;

  return (
    <div className="reading-content ProseMirror prose prose-zinc max-w-none 
      prose-p:text-zinc-800 prose-p:leading-[1.8] prose-p:text-base md:prose-p:text-lg
      prose-headings:font-black prose-headings:tracking-tighter
      prose-strong:text-foreground prose-strong:font-black
      prose-blockquote:border-foreground prose-blockquote:font-serif prose-blockquote:italic prose-blockquote:text-lg
      prose-pre:bg-[#0d1117] prose-pre:border prose-pre:border-border prose-pre:rounded-2xl
      prose-pre:p-0
      prose-img:rounded-3xl prose-img:border prose-img:border-border lg:prose-xl selection:bg-black selection:text-white">
      <EditorContent editor={editor} />
    </div>
  );
}
