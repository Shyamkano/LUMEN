'use client';

import Link from 'next/link';
import { Button } from '@/components/ui';
import { logout } from '@/app/auth/actions';
import { PenTool, User, LogOut, ChevronDown, Settings, Search, Layers, Bookmark, FileText } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { getSearchSuggestions } from '@/app/actions/profiles';

export default function Navbar({ user }: { user: SupabaseUser | null }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<{ users: any[], posts: any[] }>({ users: [], posts: [] });
  const [searchQuery, setSearchQuery] = useState('');
  
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();


  // Suggestions logic
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.length > 1) {
        const results = await getSearchSuggestions(searchQuery);
        setSuggestions(results);
        setSearchOpen(true);
      } else {
        setSuggestions({ users: [], posts: [] });
        setSearchOpen(false);
      }
    };

    const timer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
    }
  };


  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-border h-20 flex items-center px-6 transition-none">
      <div className="max-w-7xl mx-auto w-full flex justify-between items-center gap-8">
        <div className="flex items-center gap-10">
          <Link
            href="/"
            className="text-2xl sm:text-3xl font-black tracking-tighter text-black hover:opacity-70 transition-all uppercase shrink-0"
          >
            LUMEN
          </Link>
          <Link
            href="/"
            className="hidden lg:block text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground hover:text-black transition-all"
          >
            About
          </Link>
          <Link
            href="/feed"
            className="hidden sm:block text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground hover:text-black transition-all"
          >
            Explore
          </Link>
          {user && (
            <Link
              href="/dashboard"
              className="hidden md:block text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground hover:text-black transition-all"
            >
              Dashboard
            </Link>
          )}

        </div>


        {/* Global Search */}
        <div ref={searchRef} className="hidden md:flex flex-1 max-w-2xl relative">
          <form onSubmit={handleSearch} className="w-full relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.length > 1 && setSearchOpen(true)}
              placeholder="Search narratives, residents, tags..."
              className="w-full bg-muted/50 border border-border rounded-xl h-11 pl-12 pr-4 text-sm font-medium focus:outline-none focus:border-black transition-all text-black placeholder:text-muted-foreground/60 shadow-sm"
            />
          </form>

          {/* Suggestions Dropdown */}
          {searchOpen && (suggestions.users.length > 0 || suggestions.posts.length > 0) && (
            <div className="absolute top-14 left-0 right-0 bg-white border border-border rounded-2xl shadow-2xl overflow-hidden py-4 animate-reveal">
              {suggestions.users.length > 0 && (
                <div className="mb-4">
                  <p className="px-6 text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-2">Residents</p>
                  {suggestions.users.map(u => (
                    <Link 
                      key={u.id} 
                      href={`/profile/${u.username}`}
                      onClick={() => setSearchOpen(false)}
                      className="flex items-center gap-3 px-6 py-2 hover:bg-muted/50 transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-[10px] font-black overflow-hidden">
                        {u.avatar_url ? <img src={u.avatar_url} className="w-full h-full object-cover" alt="" /> : u.username.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-bold text-foreground group-hover:underline">{u.full_name || u.username}</span>
                      <span className="text-[10px] font-bold text-muted-foreground opacity-50 uppercase tracking-widest">@{u.username}</span>
                    </Link>
                  ))}
                </div>
              )}
              {suggestions.posts.length > 0 && (
                <div>
                  <p className="px-6 text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-2">Narratives</p>
                  {suggestions.posts.map(p => (
                    <Link 
                      key={p.id} 
                      href={`/post/${p.slug}`}
                      onClick={() => setSearchOpen(false)}
                      className="flex items-center gap-3 px-6 py-2 hover:bg-muted/50 transition-colors group"
                    >
                      <FileText size={16} className="text-muted-foreground shrink-0" />
                      <span className="text-sm font-bold text-foreground group-hover:underline truncate">{p.title}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>



        <div className="flex items-center gap-6">
          {user ? (
            <div className="flex items-center gap-6">
              <Link
                href="/new"
                className="hidden sm:flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] px-6 h-10 rounded-full border border-border hover:bg-black hover:text-white transition-all"
              >
                <PenTool size={14} strokeWidth={3} />
                Write
              </Link>

              {/* User menu */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 p-1 rounded-full hover:bg-muted/50 transition-all border border-transparent hover:border-border"
                >
                  <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center text-xs font-black shadow-lg">
                    {user.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <ChevronDown size={14} strokeWidth={3} className={`text-black transition-transform duration-300 ${menuOpen ? 'rotate-180' : ''}`} />
                </button>

                {menuOpen && (
                  <div className="absolute right-0 top-14 w-64 bg-white rounded-[2rem] shadow-2xl border border-border py-2 animate-reveal overflow-hidden">
                    <div className="px-6 py-4 border-b border-border mb-2">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-1">Identity</p>
                      <p className="text-sm font-black text-black truncate">{user.email}</p>
                    </div>
                    <div className="py-2 px-2 space-y-1">
                      <Link
                        href="/profile/me"
                        className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-muted-foreground hover:text-black hover:bg-muted/50 rounded-xl transition-all"
                        onClick={() => setMenuOpen(false)}
                      >
                        <User size={18} /> Profile
                      </Link>
                      <Link
                        href="/dashboard"
                        className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-muted-foreground hover:text-black hover:bg-muted/50 rounded-xl transition-all"
                        onClick={() => setMenuOpen(false)}
                      >
                        <Layers size={18} /> Dashboard
                      </Link>

                      <Link
                        href="/dashboard#collections"
                        className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-muted-foreground hover:text-black hover:bg-muted/50 rounded-xl transition-all"
                        onClick={() => setMenuOpen(false)}
                      >
                        <Bookmark size={18} /> Collections
                      </Link>

                      <Link
                        href="/settings"
                        className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-muted-foreground hover:text-black hover:bg-muted/50 rounded-xl transition-all"
                        onClick={() => setMenuOpen(false)}
                      >
                        <Settings size={18} /> Settings
                      </Link>
                    </div>
                    <div className="border-t border-border mt-2 pt-2 px-2">
                      <button
                        onClick={() => logout()}
                        className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 w-full text-left rounded-xl transition-all"
                      >
                        <LogOut size={18} /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link href="/auth/login" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-black transition-colors px-4">
                Sign In
              </Link>
              <Link href="/auth/login">

                <Button className="rounded-full px-8 h-11 text-[10px] font-black uppercase tracking-widest">
                  Join Lumen
                </Button>

              </Link>
            </div>
          )}
        </div>
      </div>
    </header>


  );
}
