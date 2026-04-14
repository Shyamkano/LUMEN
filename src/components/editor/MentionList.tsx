'use client';

import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react';
import { User } from 'lucide-react';

export interface MentionListProps {
  items: any[];
  command: (item: any) => void;
}

export const MentionList = forwardRef((props: MentionListProps, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index: number) => {
    const item = props.items[index];

    if (item) {
      props.command({ id: item.id, label: item.username || item.full_name });
    }
  };

  const upHandler = () => {
    setSelectedIndex(((selectedIndex + props.items.length) - 1) % props.items.length);
  };

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % props.items.length);
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
  };

  useEffect(() => setSelectedIndex(0), [props.items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'ArrowUp') {
        upHandler();
        return true;
      }

      if (event.key === 'ArrowDown') {
        downHandler();
        return true;
      }

      if (event.key === 'Enter') {
        enterHandler();
        return true;
      }

      return false;
    },
  }));

  return (
    <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden min-w-[200px] py-2 animate-reveal-down z-[200]">
      {props.items.length
        ? props.items.map((item, index) => (
          <button
            className={`flex items-center gap-3 w-full px-4 py-2 text-left transition-colors ${
              index === selectedIndex ? 'bg-foreground text-background' : 'hover:bg-muted/50 text-foreground'
            }`}
            key={index}
            onClick={() => selectItem(index)}
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-black uppercase overflow-hidden border ${
              index === selectedIndex ? 'border-background/20' : 'border-border'
            }`}>
              {item.avatar_url ? (
                <img src={item.avatar_url} className="w-full h-full object-cover" alt="" />
              ) : (
                <User size={12} />
              )}
            </div>
            <span className="text-xs font-black uppercase tracking-widest">{item.username || item.full_name}</span>
          </button>
        ))
        : (
          <div className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">
            No residents found...
          </div>
        )
      }
    </div>
  );
});

MentionList.displayName = 'MentionList';
