'use client';

import { Button } from '@/components/ui';
import {
  Bold, Italic, Underline as UnderlineIcon, List, ListOrdered,
  Code, Quote, Heading1, Heading2, Heading3,
  Link as LinkIcon, Image as ImageIcon,
  Undo, Redo, Minus, Upload, Link2, X
} from 'lucide-react';
import { useState, useRef } from 'react';

interface EditorToolbarProps {
  editor: ReturnType<typeof import('@tiptap/react').useEditor> | null;
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  if (!editor) return null;

  const toggleLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    
    if (editor.isActive('link')) {
      editor.chain().focus().unsetLink().run();
      return;
    }

    const url = window.prompt('Enter URL', previousUrl);
    
    // Check if URL is present
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url, target: '_blank' }).run();
  };

  const [showImageMenu, setShowImageMenu] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addImageFromUrl = () => {
    const url = window.prompt('Enter image URL');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
    setShowImageMenu(false);
  };

  const addImageFromFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', 'post-images');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      
      editor.chain().focus().setImage({ src: data.url }).run();
    } catch (err) {
      alert('Failed to upload image');
    } finally {
      setIsUploading(false);
      setShowImageMenu(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const ToolBtn = ({
    onClick,
    active,
    children,
    title,
  }: {
    onClick: () => void;
    active?: boolean;
    children: React.ReactNode;
    title: string;
  }) => (
    <Button
      size="icon"
      variant="ghost"
      onClick={onClick}
      title={title}
      type="button"
      className={`h-8 w-8 rounded-md transition-all ${
        active
          ? 'bg-zinc-900 text-white shadow-sm'
          : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
      }`}
    >
      {children}
    </Button>
  );

  const Divider = () => <div className="w-px h-5 bg-zinc-200 mx-1" />;

  return (
    <div className="sticky top-16 z-20 flex flex-wrap items-center gap-0.5 px-3 py-2 bg-white/95 backdrop-blur-md border-b border-zinc-100 shadow-sm">
      <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold">
        <Bold size={16} />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic">
        <Italic size={16} />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline">
        <UnderlineIcon size={16} />
      </ToolBtn>

      <Divider />

      <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Heading 1">
        <Heading1 size={16} />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2">
        <Heading2 size={16} />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Heading 3">
        <Heading3 size={16} />
      </ToolBtn>

      <Divider />

      <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet List">
        <List size={16} />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Ordered List">
        <ListOrdered size={16} />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Blockquote">
        <Quote size={16} />
      </ToolBtn>

      <Divider />

      <ToolBtn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Inline Code">
        <Code size={16} />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Code Block">
        <div className="text-xs font-mono font-bold">{'{}'}</div>
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal Rule">
        <Minus size={16} />
      </ToolBtn>

      <Divider />

      <ToolBtn onClick={toggleLink} active={editor.isActive('link')} title="Toggle Link">
        <LinkIcon size={16} />
      </ToolBtn>
      <div className="relative">
        <ToolBtn onClick={() => setShowImageMenu(!showImageMenu)} title="Insert Image">
          <ImageIcon size={16} />
        </ToolBtn>
        {showImageMenu && (
          <div className="absolute top-10 left-0 bg-white border border-zinc-200 shadow-xl rounded-xl p-2 flex flex-col gap-1 w-48 z-50">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 rounded-lg text-left w-full disabled:opacity-50"
            >
              <Upload size={14} /> {isUploading ? 'Uploading...' : 'Upload File'}
            </button>
            <button
              onClick={addImageFromUrl}
              className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 rounded-lg text-left w-full"
            >
              <Link2 size={14} /> Paste Link
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={addImageFromFile} 
            />
          </div>
        )}
      </div>

      <div className="flex-1" />

      <ToolBtn onClick={() => editor.chain().focus().undo().run()} title="Undo">
        <Undo size={16} />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().redo().run()} title="Redo">
        <Redo size={16} />
      </ToolBtn>
    </div>
  );
}
