'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Decouple the heavy editorial workspace to prevent main-thread blocking
const EditorWorkspace = dynamic(
  () => import('@/components/editor/EditorWorkspace'),
  { 
    ssr: false,
    loading: () => (
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-background gap-4">
        <div className="w-12 h-12 border-4 border-foreground/10 border-t-foreground rounded-full animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Initializing Archival Loader...</p>
      </div>
    )
  }
);

export default function NewPostPage() {
  return (
    <Suspense fallback={null}>
      <EditorWorkspace />
    </Suspense>
  );
}
