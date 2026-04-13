'use client';

import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui';

interface ImageUploaderProps {
  imageUrl: string | null;
  onUpload: (url: string) => void;
  onRemove: () => void;
  label?: string;
}

export function ImageUploader({ imageUrl, onUpload, onRemove, label = 'Add Cover Image' }: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      onUpload(data.url);
    } catch (error: any) {
      alert(`Failed to upload image: ${error.message}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full mb-6">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />

      {imageUrl ? (
        <div className="relative w-full h-64 md:h-80 rounded-2xl overflow-hidden group border border-zinc-200">
          <img src={imageUrl} alt="Cover" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
            <Button
              variant="destructive"
              onClick={onRemove}
              className="gap-2"
              type="button"
            >
              <X size={16} /> Remove Cover
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="w-full flex flex-col items-center justify-center gap-3 py-10 px-4 border-2 border-dashed border-zinc-200 rounded-2xl text-zinc-500 hover:border-zinc-400 hover:bg-zinc-50 transition-all disabled:opacity-50"
        >
          {isUploading ? (
            <>
              <Loader2 size={24} className="animate-spin text-zinc-400" />
              <span className="text-sm font-medium">Uploading cover image...</span>
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400">
                <ImageIcon size={24} />
              </div>
              <span className="text-sm font-medium">{label}</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
