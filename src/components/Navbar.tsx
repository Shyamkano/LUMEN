'use client';

import Link from 'next/link';
import { Button } from '@/components/ui';
import { logout } from '@/app/auth/actions';
import { PenTool, User, LogOut, ChevronDown, Settings, Search, Layers, Bookmark, FileText, Bell, Menu, X as CloseIcon, Zap } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { getSearchSuggestions } from '@/app/actions/profiles';
import { getUnreadCount } from '@/app/actions/notifications';
import { useQuery } from '@tanstack/react-query';
import { ThemeToggle } from './ThemeToggle';

export default function Navbar({ user }: { user: SupabaseUser | null }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [suggestions, setSuggestions] = useState<{ users: any[], posts: any[] }>({ users: [], posts: [] });
  const [searchQuery, setSearchQuery] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  
  const { data: unreadCount } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => getUnreadCount(),
    enabled: !!user,
    refetchInterval: 30000,
  });

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
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setShowMobileSearch(false);
      setMobileMenuOpen(false);
    }
  };
  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-[100] bg-background/80 backdrop-blur-md border-b border-border h-16 md:h-20 flex items-center px-3 md:px-6 transition-all duration-300">
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center gap-2 md:gap-8">

          {/* Left: Logo & Hamburger */}
          <div className="flex items-center gap-2 md:gap-10">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl hover:bg-muted/50 transition-colors"
            >
              <Menu size={18} />
            </button>

            <Link
              href="/feed"
              className="text-lg md:text-2xl font-black tracking-tighter text-foreground hover:opacity-70 transition-all uppercase shrink-0"
            >
              LUMEN <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse ml-1 inline-block" />
            </Link>

            <nav className="hidden lg:flex items-center gap-8">
              {/* Desktop menu items */}
              <Link href="/" className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground hover:text-black transition-all">About</Link>
              {user && <Link href="/dashboard" className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground hover:text-black transition-all">Dashboard</Link>}
            </nav>
          </div>

          {/* Center: Global Search (Adaptive) */}
          <div ref={searchRef} className={`flex-1 max-w-3xl relative flex items-center justify-center transition-all duration-300 ${showMobileSearch ? 'absolute inset-x-0 bg-background px-4 h-full z-10' : 'relative'}`}>
            <form onSubmit={handleSearch} className={`${showMobileSearch ? 'w-full' : 'hidden md:block'} relative`}>
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onBlur={() => !searchQuery && setShowMobileSearch(false)}
                onFocus={() => searchQuery.length > 1 && setSearchOpen(true)}
                placeholder="Search..."
                className="w-full bg-muted/30 border border-border rounded-xl h-9 md:h-10 pl-11 pr-4 text-xs font-medium focus:outline-none focus:border-black transition-all text-black placeholder:text-muted-foreground/60 shadow-sm"
              />
              {showMobileSearch && (
                <button type="button" onClick={() => setShowMobileSearch(false)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground">
                  <CloseIcon size={14} />
                </button>
              )}
            </form>

            {/* Suggestions Dropdown (Shared) */}
            {searchOpen && (
              <div className="absolute top-12 left-0 right-0 bg-background border border-border rounded-2xl shadow-2xl overflow-hidden py-4 animate-reveal max-h-[80vh] overflow-y-auto">
                {suggestions.users.length === 0 && suggestions.posts.length === 0 ? (
                  <div className="px-6 py-8 text-center text-muted-foreground">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">Searching the Archive...</p>
                  </div>
                ) : (
                  <>
                    {suggestions.users.length > 0 && (
                      <div className="mb-4">
                        <p className="px-6 text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-2">Residents</p>
                        {suggestions.users.map(u => (
                          <Link key={u.id} href={`/profile/${u.username}`} onClick={() => { setSearchOpen(false); setShowMobileSearch(false); }} className="flex items-center gap-3 px-6 py-2 hover:bg-muted/50 transition-colors group">
                            <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-[10px] font-black overflow-hidden">{u.avatar_url ? <img src={u.avatar_url} className="w-full h-full object-cover" alt="" /> : (u.username || 'A').charAt(0).toUpperCase()}</div>
                            <span className="text-sm font-bold text-foreground group-hover:underline truncate">{u.full_name || u.username}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                    {suggestions.posts.length > 0 && (
                      <div>
                        <p className="px-6 text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-2">Narratives</p>
                        {suggestions.posts.map(p => (
                          <Link key={p.id} href={`/post/${p.slug}`} onClick={() => { setSearchOpen(false); setShowMobileSearch(false); }} className="flex items-center gap-3 px-6 py-2 hover:bg-muted/50 transition-colors group">
                            <FileText size={16} className="text-muted-foreground shrink-0" />
                            <span className="text-sm font-bold text-foreground group-hover:underline truncate">{p.title}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Right: Notifications & Profile */}
          <div className="flex items-center gap-1 md:gap-6 shrink-0">
            <button
              onClick={() => setShowMobileSearch(true)}
              className={`md:hidden p-2 rounded-xl hover:bg-muted/50 transition-colors ${showMobileSearch ? 'hidden' : 'block'}`}
            >
              <Search size={18} />
            </button>

            {user && (
              <>
                <ThemeToggle />
                <Link href="/notifications" className="relative p-2 rounded-xl hover:bg-muted/50 transition-all text-foreground">
                  <Bell size={18} strokeWidth={2.5} />
                  {unreadCount && unreadCount > 0 ? (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[8px] font-black rounded-full border border-white flex items-center justify-center animate-reveal">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  ) : (
                    <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-black/10 rounded-full border border-white" />
                  )}
                </Link>

                <Link href="/new">
                  <Button className="rounded-full px-6 h-10 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 bg-foreground text-background hover:opacity-90 transition-all shadow-lg shadow-foreground/5">
                    <PenTool size={14} /> Write
                  </Button>
                </Link>

                <div className="relative hidden lg:block" ref={menuRef}>
                  <button onClick={() => setMenuOpen(!menuOpen)} className="p-1 rounded-full hover:bg-muted/50 transition-all">
                    <div className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center text-[10px] font-black uppercase">{user.email?.charAt(0)}</div>
                  </button>
                  {/* ... desktop dropdown ... */}
                  {menuOpen && (
                    <div className="absolute right-0 top-12 w-64 bg-background rounded-[2rem] shadow-2xl border border-border py-2 animate-reveal-down overflow-hidden">
                      <div className="px-6 py-4 border-b border-border/50 mb-2">
                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-1">Identity</p>
                        <p className="text-xs font-black text-black truncate">{user.email}</p>
                      </div>
                      <div className="py-2 px-2 space-y-0.5">
                        <Link href="/profile/me" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-black hover:bg-muted/50 rounded-xl transition-all">
                          <User size={16} /> Profile
                        </Link>
                        <Link href="/profile/me?tab=collection" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-black hover:bg-muted/50 rounded-xl transition-all">
                          <Bookmark size={16} /> Collection
                        </Link>
                        <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-black hover:bg-muted/50 rounded-xl transition-all">
                          <Layers size={16} /> Dashboard
                        </Link>
                        <Link href="/settings" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-black hover:bg-muted/50 rounded-xl transition-all">
                          <Settings size={16} /> Settings
                        </Link>
                        <Link href="https://shyam-typeform.typeform.com/to/questions" target="_blank" className="flex items-center gap-3 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-amber-600 hover:bg-amber-50 rounded-xl transition-all">
                          <Zap size={16} /> Network Feedback
                        </Link>
                      </div>
                      <div className="border-t border-border/50 mt-2 pt-2 px-2 pb-2">
                        <button onClick={() => logout()} className="flex items-center gap-3 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-red-600 hover:bg-red-50 w-full text-left rounded-xl transition-all">
                          <LogOut size={16} /> Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
            {!user && (
              <Link href="/auth/login">
                <Button className="rounded-full px-5 h-9 text-[9px] font-black uppercase tracking-widest">Join</Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 z-[1000] lg:hidden transition-all duration-500 ${mobileMenuOpen ? 'visible opacity-100' : 'invisible opacity-0'}`}
      >
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
          onClick={() => setMobileMenuOpen(false)}
        />
        <div
          className={`absolute top-0 left-0 bottom-0 w-[85%] max-w-[320px] bg-background border-r border-border p-6 flex flex-col transition-transform duration-500 ease-expo ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          <div className="flex justify-between items-center mb-10">
            <span className="text-xl font-black tracking-tighter uppercase">LUMEN</span>
            <button onClick={() => setMobileMenuOpen(false)} className="p-2 -mr-2 bg-muted/30 rounded-full">
              <CloseIcon size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-8">
            <nav className="space-y-6">
              <Link href="/feed" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-4 text-sm font-black uppercase tracking-widest text-muted-foreground hover:text-black">
                <Layers size={18} /> Archive
              </Link>
              <Link href="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-4 text-sm font-black uppercase tracking-widest text-muted-foreground hover:text-black">
                <Zap size={18} /> About
              </Link>
              {user && (
                <Link href="/new" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-4 text-sm font-black uppercase tracking-widest text-black">
                  <PenTool size={18} className="text-black" strokeWidth={3} /> Write Narrative
                </Link>
              )}
              {user && (
                <div className="pt-4 space-y-6 border-t border-border/50">
                  <Link href="/profile/me" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-4 text-sm font-black uppercase tracking-widest text-muted-foreground hover:text-black transition-all">
                    <User size={18} /> Profile
                  </Link>
                  <Link href="/profile/me?tab=collection" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-4 text-sm font-black uppercase tracking-widest text-muted-foreground hover:text-black transition-all">
                    <Bookmark size={18} /> Collection
                  </Link>
                  <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-4 text-sm font-black uppercase tracking-widest text-muted-foreground hover:text-black transition-all">
                    <Layers size={18} /> Dashboard
                  </Link>
                  <Link href="/notifications" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-4 text-sm font-black uppercase tracking-widest text-muted-foreground hover:text-black transition-all">
                    <Bell size={18} /> Signals
                  </Link>
                  <Link href="/settings" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-4 text-sm font-black uppercase tracking-widest text-muted-foreground hover:text-black transition-all">
                    <Settings size={18} /> Protocol
                  </Link>
                  <Link href="https://shyam-typeform.typeform.com/to/questions" target="_blank" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-4 text-sm font-black uppercase tracking-widest text-amber-600">
                    <Zap size={18} /> Transmission Feedback
                  </Link>
                </div>
              )}
            </nav>
          </div>

          {user && (
            <div className="pt-6 border-t border-border">
              <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="w-full py-3 h-12 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2">
                <LogOut size={16} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
