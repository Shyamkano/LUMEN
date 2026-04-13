'use client';

import { Button } from '@/components/ui';
import {
  Bold, Italic, Underline as UnderlineIcon, List, ListOrdered,
  Code, Quote, Heading1, Heading2, Heading3,
  Link as LinkIcon, Image as ImageIcon,
  Undo, Redo, Minus, Upload, Link2, X, Sparkles, Wand2, Type, Zap
} from 'lucide-react';
import { useState, useRef } from 'react';

interface EditorToolbarProps {
  editor: ReturnType<typeof import('@tiptap/react').useEditor> | null;
  onOpenAI?: () => void;
}

export function EditorToolbar({ editor, onOpenAI }: EditorToolbarProps) {
  if (!editor) return null;

  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkText, setLinkText] = useState('');
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageCredit, setImageCredit] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLinkSubmit = () => {
    if (linkUrl) {
      if (linkText) {
        editor.chain().focus().insertContent(`<a href="${linkUrl}" target="_blank">${linkText}</a>`).run();
      } else {
        editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl, target: '_blank' }).run();
      }
    } else {
      editor.chain().focus().unsetLink().run();
    }
    setShowLinkModal(false);
    setLinkUrl('');
    setLinkText('');
  };

  const handleImageSubmit = () => {
    if (imageUrl) {
      (editor.chain().focus() as any).setImage({ src: imageUrl }).run();
      if (imageCredit) {
        editor.chain().focus().insertContent({
          type: 'paragraph',
          attrs: { class: 'archive-credit' },
          content: [{ type: 'text', text: `Archival Credit: ${imageCredit}` }]
        }).run();
      }
    }
    setShowImageModal(false);
    setImageUrl('');
    setImageCredit('');
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

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Upload failed');
      }
      const data = await res.json();
      (editor.chain().focus() as any).setImage({ src: data.url }).run();
      setShowImageModal(false);
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setIsUploading(false);
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
      className={`h-11 w-11 md:h-10 md:w-10 rounded-xl transition-colors duration-200 ${
        active
          ? 'bg-zinc-900 text-white shadow-lg shadow-zinc-200'
          : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
      }`}
    >
      {children}
    </Button>
  );

  const Divider = () => <div className="w-px h-5 bg-zinc-200 mx-1" />;

  const insertionModal = (showLinkModal || showImageModal) && (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <div 
        className="fixed inset-0 bg-black/95 backdrop-blur-2xl animate-reveal" 
        onClick={() => { setShowLinkModal(false); setShowImageModal(false); }} 
      />
      <div className="relative bg-white rounded-[3rem] shadow-[0_64px_256px_rgba(0,0,0,0.5)] p-8 md:p-14 w-full max-w-xl space-y-10 animate-scale-in flex flex-col max-h-[90vh] overflow-hidden">
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-zinc-400">
            {showLinkModal && <Link2 size={24} />}
            {showImageModal && <ImageIcon size={24} />}
            <h3 className="text-3xl font-black uppercase tracking-tighter text-zinc-900 leading-none">
              {showLinkModal ? 'Designation' : 'Imagery'}
            </h3>
          </div>
          <div className="h-1.5 w-16 bg-zinc-900 rounded-full" />
        </div>

        <div className="space-y-8 flex-1 overflow-y-auto no-scrollbar py-2">
          <div className="space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Resource URL</label>
              <input 
                autoFocus
                value={showLinkModal ? linkUrl : imageUrl}
                onChange={(e) => showLinkModal ? setLinkUrl(e.target.value) : setImageUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-8 py-5 rounded-full border border-zinc-100 bg-zinc-50 text-sm font-medium focus:outline-none focus:border-zinc-900 transition-all font-mono"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">
                {showLinkModal ? 'Designated Name' : 'Archival Credit'}
              </label>
              <input 
                value={showLinkModal ? linkText : imageCredit}
                onChange={(e) => showLinkModal ? setLinkText(e.target.value) : setImageCredit(e.target.value)}
                placeholder={showLinkModal ? "Display text..." : "Unsplash / Artist Name..."}
                className="w-full px-8 py-5 rounded-full border border-zinc-100 bg-zinc-50 text-sm font-medium focus:outline-none focus:border-zinc-900 transition-all italic"
              />
            </div>

            {showImageModal && (
              <div className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="h-px flex-1 bg-zinc-100" />
                  <span className="text-[9px] font-black text-zinc-300 uppercase tracking-widest">Local Cache</span>
                  <div className="h-px flex-1 bg-zinc-100" />
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-full h-20 flex items-center justify-center gap-4 rounded-[2rem] border-2 border-dashed border-zinc-200 text-zinc-400 hover:border-zinc-900 hover:text-zinc-900 transition-all text-xs font-black uppercase tracking-widest disabled:opacity-50 group"
                >
                  <div className="w-12 h-12 rounded-full bg-zinc-50 group-hover:bg-zinc-900 group-hover:text-white flex items-center justify-center transition-all">
                    <Upload size={18} />
                  </div>
                  {isUploading ? 'Uploading...' : 'Access Filesystem'}
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={addImageFromFile} />
              </div>
            )}
          </div>
        </div>

        {!isUploading && (
          <div className="flex flex-col gap-4 pt-4 border-t border-zinc-50">
            <Button 
              type="button"
              onClick={showLinkModal ? handleLinkSubmit : handleImageSubmit}
              className="w-full h-16 rounded-full bg-zinc-900 text-white font-black uppercase tracking-widest text-xs shadow-2xl shadow-zinc-200"
            >
              Execute Sync
            </Button>
            <Button 
              type="button"
              variant="ghost" 
              onClick={() => { setShowLinkModal(false); setShowImageModal(false); }}
              className="w-full h-12 rounded-full text-zinc-400 font-black uppercase tracking-widest text-[9px]"
            >
              Abort Protocol
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <div className="md:sticky md:top-32 md:z-50 md:bg-white/95 md:backdrop-blur-md md:border-b md:border-border md:shadow-md md:px-2 md:py-2 md:mb-4 flex items-center gap-1 overflow-x-auto no-scrollbar flex-nowrap md:flex-wrap fixed bottom-0 left-0 right-0 z-[100] bg-white border-t p-3 shadow-[0_-8px_48px_rgba(0,0,0,0.1)] pb-safe md:w-full">
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

        <ToolBtn 
          onClick={() => {
            const previousUrl = editor.getAttributes('link').href;
            setLinkUrl(previousUrl || '');
            setShowLinkModal(true);
          }} 
          active={editor.isActive('link')} 
          title="Toggle Link"
        >
          <LinkIcon size={16} />
        </ToolBtn>
        
        <ToolBtn onClick={() => setShowImageModal(true)} title="Insert Image">
          <ImageIcon size={16} />
        </ToolBtn>

        <ToolBtn onClick={onOpenAI || (() => {})} title="AI Synthesis">
          <Sparkles size={16} className="text-violet-500" />
        </ToolBtn>

        <div className="flex-1" />

        <ToolBtn onClick={() => editor.chain().focus().undo().run()} title="Undo">
          <Undo size={16} />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().redo().run()} title="Redo">
          <Redo size={16} />
        </ToolBtn>
      </div>
      {insertionModal}
    </>
  );
}
