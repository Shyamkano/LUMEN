'use client';

import { generateHTML } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import Mention from '@tiptap/extension-mention';
import { mergeAttributes } from '@tiptap/core';
import Paragraph from '@tiptap/extension-paragraph';
import { useMemo } from 'react';
import { PersistentImage } from '@/lib/editor/persistent-image';

const lowlight = createLowlight(common);

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

function fixContentNodes(content: any) {
  if (!content || typeof content !== 'object') return content;
  
  // Convert old 'image' nodes to 'lumenImage'
  if (content.type === 'image') {
    content.type = 'lumenImage';
  }

  if (content.type === 'lumenImage' && content.attrs) {
    content.attrs.src = content.attrs.src || content.attrs.url;
  }
  
  if (content.content && Array.isArray(content.content)) {
    content.content.forEach(fixContentNodes);
  }
  return content;
}

export function ArchivalReader({ content }: ArchivalReaderProps) {
  // Internal metadata synchronization

  const extensions = useMemo(() => [
    StarterKit.configure({
      codeBlock: false,
      paragraph: false,
      link: false,
      underline: false,
      ...({ image: false } as any), // CRITICAL: Disable built-in image to use PersistentImage
    }),
    CustomParagraph,
    Link.configure({
      openOnClick: true,
      autolink: true,
      HTMLAttributes: {
        class: 'text-foreground hover:opacity-70 underline underline-offset-4 decoration-2 font-black transition-all cursor-pointer',
        target: '_blank',
        rel: 'noopener noreferrer',
      },
    }),
    PersistentImage,
    Underline,
    CodeBlockLowlight.configure({ lowlight }),
    CustomMention.configure({
      HTMLAttributes: {
        class: 'mention-tag font-black text-foreground hover:bg-foreground hover:text-background px-1.5 py-0.5 rounded-md border border-border/50 transition-all duration-300',
      },
    }),
  ], []);

  const htmlContent = useMemo(() => {
    try {
      if (!content) return '';
      
      // Deep clone and normalize
      let doc = JSON.parse(JSON.stringify(content));
      doc = fixContentNodes(doc);
      
      // Fix for data that isn't wrapped in a 'doc'
      if (typeof doc === 'object' && doc.type !== 'doc') {
        doc = {
          type: 'doc',
          content: Array.isArray(doc) ? doc : [doc]
        };
      }
      
      // Producing high-fidelity HTML
      return generateHTML(doc, extensions);
    } catch (err) {
      console.error('Archival Reader Error:', err);
      return '';
    }
  }, [content, extensions]);

  return (
    <div className="reading-content article-resonance prose prose-zinc dark:prose-invert max-w-none 
      prose-p:text-foreground/90 prose-p:leading-[1.8] prose-p:text-base md:prose-p:text-lg
      prose-headings:font-black prose-headings:tracking-tighter prose-headings:text-foreground
      prose-a:pointer-events-auto prose-a:relative prose-a:z-10
      prose-a:decoration-foreground/30 hover:prose-a:decoration-foreground
      prose-strong:text-foreground prose-strong:font-black
      prose-blockquote:border-foreground prose-blockquote:font-serif prose-blockquote:italic prose-blockquote:text-lg
      prose-pre:bg-card prose-pre:border prose-pre:border-border prose-pre:rounded-2xl
      prose-pre:p-0
      prose-img:rounded-3xl prose-img:border prose-img:border-border lg:prose-xl selection:bg-foreground selection:text-background"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}
