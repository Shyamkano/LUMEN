import { Node, mergeAttributes } from '@tiptap/core';

/**
 * UNIFIED IMAGE NODE - Source of truth for all image handling
 * Used by: TipTapEditor, PreviewPanel, ArchivalReader, EditorWorkspace
 * Ensures consistent behavior across editor, preview, and published views
 */
export const PersistentImage = Node.create({
  name: 'lumenImage',
  group: 'block',
  inline: false,
  draggable: true,
  content: '',  // 🔑 CRITICAL: Block node cannot contain content

  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: (element) => {
          // Handle both direct img tags and img tags nested in divs
          const img = element.tagName === 'IMG' 
            ? element 
            : element.querySelector('img');
          return img?.getAttribute('src') || img?.getAttribute('url') || element.getAttribute('src') || null;
        },
        renderHTML: (attributes) => {
          if (!attributes.src) return {};
          return { src: attributes.src };
        },
      },
      url: {
        default: null,
        parseHTML: (element) => {
          const img = element.tagName === 'IMG' 
            ? element 
            : element.querySelector('img');
          return img?.getAttribute('url') || img?.getAttribute('src') || element.getAttribute('url') || null;
        },
        renderHTML: (attributes) => {
          if (!attributes.url) return {};
          return { url: attributes.url };
        },
      },
      alt: {
        default: '',
        parseHTML: (element) => {
          const img = element.tagName === 'IMG' 
            ? element 
            : element.querySelector('img');
          return img?.getAttribute('alt') || element.getAttribute('alt') || '';
        },
        renderHTML: (attributes) => {
          if (!attributes.alt) return {};
          return { alt: attributes.alt };
        },
      },
      title: {
        default: '',
        parseHTML: (element) => {
          const img = element.tagName === 'IMG' 
            ? element 
            : element.querySelector('img');
          return img?.getAttribute('title') || element.getAttribute('title') || '';
        },
        renderHTML: (attributes) => {
          if (!attributes.title) return {};
          return { title: attributes.title };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'img',
        // Extract all attributes from the img tag
        getAttrs: (element: HTMLElement) => {
          console.log('[PersistentImage.parseHTML] Checking img element:', element.tagName, element.getAttribute('src')?.slice(0, 50));
          if (element.tagName !== 'IMG') {
            console.log('[PersistentImage.parseHTML] Not an IMG tag, returning false');
            return false;
          }
          const attrs = {
            src: element.getAttribute('src'),
            url: element.getAttribute('url') || element.getAttribute('src'),
            alt: element.getAttribute('alt') || '',
            title: element.getAttribute('title') || '',
          };
          console.log('[PersistentImage.parseHTML] ✓ Extracted attrs from img tag:', attrs.src?.slice(0, 50));
          return attrs;
        },
      },
      {
        tag: 'div[class*="lumen-image-container"]',
        // Extract attributes from the nested img tag inside the div
        getAttrs: (element: HTMLElement) => {
          console.log('[PersistentImage.parseHTML] Checking div.lumen-image-container');
          const img = element.querySelector('img') as HTMLImageElement;
          if (!img) {
            console.warn('[PersistentImage.parseHTML] ❌ No img tag found inside div');
            return false;
          }
          const attrs = {
            src: img.getAttribute('src'),
            url: img.getAttribute('url') || img.getAttribute('src'),
            alt: img.getAttribute('alt') || '',
            title: img.getAttribute('title') || '',
          };
          console.log('[PersistentImage.parseHTML] ✓ Extracted attrs from div.lumen-image-container:', attrs.src?.slice(0, 50));
          return attrs;
        },
      },
    ];
  },

  renderHTML({ node }) {
    const finalSrc = node.attrs.src || node.attrs.url;
    if (!finalSrc) {
      console.warn('[PersistentImage] No src or url found in node attrs:', node.attrs);
    }
    return [
      'div',
      { class: 'lumen-image-container relative my-16 group mx-auto max-w-4xl' },
      [
        'img',
        mergeAttributes(
          {
            src: finalSrc || '',
            alt: node.attrs.alt || '',
            title: node.attrs.title || '',
            class: 'rounded-[32px] border border-border block w-full shadow-2xl transition-all duration-700 h-auto hover:scale-[1.01]',
          }
        ),
      ],
      [
        'div',
        {
          class:
            'absolute top-6 right-6 text-[8px] font-black uppercase tracking-[0.3em] text-white/30 bg-black/20 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10 opacity-0 group-hover:opacity-100 transition-all duration-500 font-mono',
        },
        'LUMEN AUTHORITY',
      ],
    ];
  },

  addCommands() {
    return {
      setImage:
        (options: any) =>
        ({ commands }: any) => {
          const finalAttrs = {
            src: options.src || options.url || null,
            url: options.url || options.src || null,
            alt: options.alt || '',
            title: options.title || '',
          };
          console.log('[PersistentImage] setImage command - Final attrs to set:', finalAttrs);
          const result = commands.insertContent({
            type: this.name,
            attrs: finalAttrs,
          });
          console.log('[PersistentImage] setImage command result:', result);
          return result;
        },
    } as any;
  },

  addKeyboardShortcuts() {
    return {
      // Prevent deletion of the image node
      Backspace: ({ editor }) => {
        const { $anchor } = editor.state.selection;
        const node = $anchor.parent;
        
        if (node.type.name === this.name) {
          console.log('[PersistentImage] Preventing deletion of image node on Backspace');
          return true; // Prevent default behavior
        }
        return false;
      },
      Delete: ({ editor }) => {
        const { $anchor } = editor.state.selection;
        const node = $anchor.parent;
        
        if (node.type.name === this.name) {
          console.log('[PersistentImage] Preventing deletion of image node on Delete');
          return true;
        }
        return false;
      },
    };
  },
});
