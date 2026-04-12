'use client';

import { useState } from 'react';
import type { PostType } from '@/types';
import { FileText, Zap, Code, Mic, Layers, EyeOff } from 'lucide-react';

const FILTERS = [
  { type: undefined, label: 'Latest', icon: Layers },
  { type: 'discovery' as const, label: 'Discover', icon: Zap },
  { type: 'shadows' as const, label: 'Shadows', icon: EyeOff },
  { type: 'blog' as PostType, label: 'Blogs', icon: FileText },
  { type: 'micro' as PostType, label: 'Micro', icon: Zap },
  { type: 'code' as PostType, label: 'Code', icon: Code },
  { type: 'audio' as PostType, label: 'Audio', icon: Mic },
];

interface FeedFilterProps {
  activeType?: PostType | 'discovery' | 'shadows';
  onChange: (type?: PostType | 'discovery' | 'shadows') => void;
}

export function FeedFilter({ activeType, onChange }: FeedFilterProps) {
  return (
    <div className="flex items-center gap-1 p-1 bg-zinc-50 rounded-2xl border border-zinc-100">
      {FILTERS.map((filter) => {
        const Icon = filter.icon;
        const active = activeType === filter.type;
        return (
          <button
            key={filter.label}
            onClick={() => onChange(filter.type)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              active
                ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200'
                : 'text-zinc-500 hover:text-zinc-700 hover:bg-white/50'
            }`}
          >
            <Icon size={16} />
            <span className="hidden sm:inline">{filter.label}</span>
          </button>
        );
      })}
    </div>
  );
}
