'use client';

import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEsc);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 font-sans">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      
      {/* Container */}
      <div className="bg-background rounded-[2.5rem] w-full max-w-md relative z-10 shadow-2xl border border-border animate-reveal overflow-hidden">
        <div className="px-8 pt-8 flex items-center justify-between">
          <h3 className="text-xl font-black uppercase tracking-tight">{title}</h3>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-full transition-all"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-8">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
