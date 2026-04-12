'use client';

import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';

export const SuggestionList = forwardRef((props: any, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index: number) => {
    const item = props.items[index];
    if (item) {
      props.command({ id: item.id, label: item.username || item.full_name });
    }
  };

  const upHandler = () => {
    setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
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
    <div className="bg-white border border-black/10 rounded-2xl shadow-2xl overflow-hidden min-w-[200px] z-[100] animate-reveal">
      {props.items.length ? (
        <div className="flex flex-col py-2">
          {props.items.map((item: any, index: number) => (
            <button
              key={index}
              onClick={() => selectItem(index)}
              className={`flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                index === selectedIndex ? 'bg-zinc-100 text-black' : 'text-zinc-500 hover:bg-zinc-50'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-black text-[10px] overflow-hidden">
                {item.avatar_url ? (
                  <img src={item.avatar_url} className="w-full h-full object-cover" alt="" />
                ) : (
                  (item.username || 'U').charAt(0).toUpperCase()
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-black tracking-tight">{item.full_name || item.username}</span>
                <span className="text-[9px] font-bold opacity-40 uppercase tracking-widest">@{item.username}</span>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="px-4 py-3 text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
          No residents found.
        </div>
      )}
    </div>
  );
});

SuggestionList.displayName = 'SuggestionList';
