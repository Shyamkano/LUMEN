'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { searchUsers } from '@/app/actions/profiles';
import Link from 'next/link';

export function UserSearchWidget() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);

  const handleSearch = async (val: string) => {
    setQuery(val);
    if (val.length > 2) {
      const users = await searchUsers(val);
      setResults(users);
    } else {
      setResults([]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 px-2">
        <Search size={18} className="text-zinc-400" />
        <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">Find Residents</h3>
      </div>

      <div className="relative px-2">
        <input 
          type="text" 
          placeholder="Search by ID or name..." 
          className="w-full bg-zinc-50 border border-black/5 rounded-2xl px-5 py-3 text-xs font-bold outline-none focus:ring-2 ring-black/5 transition-all"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
        />

        {results.length > 0 && (
          <div className="absolute top-14 left-2 right-2 bg-white border border-black/10 rounded-2xl shadow-2xl py-2 z-50 animate-reveal">
            {results.map((u) => (
              <Link 
                key={u.id} 
                href={`/profile/${u.username}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 transition-colors"
                onClick={() => {
                  setResults([]);
                  setQuery('');
                }}
              >
                <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-black text-[10px] overflow-hidden">
                  {u.avatar_url ? (
                    <img src={u.avatar_url} className="w-full h-full object-cover" alt="" />
                  ) : (
                    (u.username || 'U').charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-black">{u.full_name || u.username}</span>
                  <span className="text-[9px] font-bold opacity-40">@{u.username}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
