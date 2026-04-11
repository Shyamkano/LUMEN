'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui';
import { Upload, Trash2, Loader2 } from 'lucide-react';

interface AudioUploaderProps {
  audioUrl: string | null;
  onUpload: (url: string, duration: number, size: number) => void;
  onRemove: () => void;
}

export function AudioUploader({ audioUrl, onUpload, onRemove }: AudioUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', 'audio-posts');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Upload failed');
      }

      const data = await res.json();

      // Get audio duration
      const audio = new Audio(data.url);
      await new Promise<void>((resolve) => {
        audio.addEventListener('loadedmetadata', () => resolve());
        audio.addEventListener('error', () => resolve());
      });

      onUpload(data.url, Math.round(audio.duration || 0), data.size);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setError(message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-zinc-700 uppercase tracking-wider">Audio</h3>

      {audioUrl ? (
        <div className="bg-gradient-to-r from-violet-50 to-sky-50 rounded-2xl p-6 border border-violet-100">
          <audio controls src={audioUrl} className="w-full mb-4" />
          <Button
            size="sm"
            variant="outline"
            onClick={onRemove}
            type="button"
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            <Trash2 size={14} /> Remove audio
          </Button>
        </div>
      ) : (
        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-zinc-200 rounded-2xl py-12 text-center cursor-pointer hover:border-violet-300 hover:bg-violet-50/30 transition-all group"
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-4 animate-pulse">
              <Loader2 size={48} className="text-foreground animate-spin" />
              <div className="space-y-1">
                <p className="text-sm font-black uppercase tracking-widest text-foreground">Extracting Signal...</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Processing High-Fidelity Audio</p>
              </div>
            </div>
          ) : (
            <>
              <Upload size={40} className="mx-auto text-muted-foreground group-hover:text-foreground transition-all duration-500 mb-4" />
              <p className="text-xs font-black uppercase tracking-widest text-foreground">
                Incorporate Audio Sync
              </p>
              <p className="text-[10px] font-bold text-muted-foreground mt-2 uppercase tracking-tight">
                FLAC, MP3, WAV • High Fidelity Preferred
              </p>
            </>
          )}

        </div>
      )}

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="audio/*"
        onChange={handleUpload}
        className="hidden"
      />
    </div>
  );
}
