'use client';

import { generateHTML } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import Mention from '@tiptap/extension-mention';
import { mergeAttributes, Node } from '@tiptap/core';
import Paragraph from '@tiptap/extension-paragraph';
import { useMemo } from 'react';

const lowlight = createLowlight(common);

// THE CORRECTED IMAGE NODE
const PersistentImage = Node.create({
  name: 'lumenImage',
  group: 'block',
  inline: false,
  draggable: true,
  addAttributes() {
    return {
      // We must whitelist every possible key Supabase or Tiptap might use
      src: { 
        default: null,
      },
      url: { 
        default: null,
      },
      alt: { default: '' },
      title: { default: '' },
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
      ['div', { class: 'absolute top-6 right-6 text-[8px] font-black uppercase tracking-[0.3em] text-white/30 bg-black/20 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10 opacity-0 group-hover:opacity-100 transition-all duration-500' }, 'LUMEN AUTHORITY']
    ];
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
  const extensions = useMemo(() => [
    StarterKit.configure({
      codeBlock: false,
      paragraph: false,
      ...({ image: false } as any), // CRITICAL: Disable built-in image to use PersistentImage
    }),
    CustomParagraph,
    Link.configure({
      openOnClick: true,
      HTMLAttributes: {
        class: 'text-foreground hover:opacity-70 underline underline-offset-4 decoration-2 font-bold transition-all',
      },
    }),
    PersistentImage,
    Underline,
    CodeBlockLowlight.configure({ lowlight }),
    CustomMention.configure({
      HTMLAttributes: {
        class: 'mention-tag',
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
      
      return generateHTML(doc, extensions);
    } catch (err) {
      console.error('Archival Reader Error:', err);
      return '';
    }
  }, [content, extensions]);

  return (
    <div className="reading-content ProseMirror prose prose-zinc max-w-none 
      prose-p:text-zinc-800 prose-p:leading-[1.8] prose-p:text-base md:prose-p:text-lg
      prose-headings:font-black prose-headings:tracking-tighter
      prose-strong:text-foreground prose-strong:font-black
      prose-blockquote:border-foreground prose-blockquote:font-serif prose-blockquote:italic prose-blockquote:text-lg
      prose-pre:bg-[#0d1117] prose-pre:border prose-pre:border-border prose-pre:rounded-2xl
      prose-pre:p-0
      prose-img:rounded-3xl prose-img:border prose-img:border-border lg:prose-xl selection:bg-black selection:text-white"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}
