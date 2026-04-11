'use client';

import Link from 'next/link';
import { Globe, Cpu, Mail, ArrowUp } from 'lucide-react';


export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-white border-t border-border py-20 md:py-32 px-6 mt-40">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-[2fr_1fr_1fr_1fr] gap-12 md:gap-20 pb-20">
          {/* Brand Column */}
          <div className="space-y-8 md:space-y-10">
            <Link href="/" className="text-3xl md:text-4xl font-black tracking-tighter uppercase">
              LUMEN
            </Link>
            <p className="text-muted-foreground text-sm font-medium leading-relaxed max-w-sm">
              An archival publishing network for radical thinkers. Synchronizing stories, code, and digital narratives in high-fidelity monochrome.
            </p>
            <div className="flex gap-6">
              <a href="https://github.com/Shyamkano" target="_blank" rel="noreferrer" title="Shyamkano on GitHub" className="text-muted-foreground hover:text-black transition-colors">
                <Cpu size={20} />
              </a>
              <a href="https://linktr.ee/shyamkano" target="_blank" rel="noreferrer" title="Shyamkano Network" className="text-muted-foreground hover:text-black transition-colors">
                <Globe size={20} />
              </a>
              <a href="mailto:kanojiyaghanshyam92@gmail.com" title="Direct Protocol Link" className="text-muted-foreground hover:text-black transition-colors">
                <Mail size={20} />
              </a>
            </div>

          </div>

          {/* Navigation */}
          <div className="space-y-6 md:space-y-8">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-black">Network</h4>
            <div className="flex flex-col gap-3 md:gap-4 text-xs font-bold text-muted-foreground">
              <Link href="/feed" className="hover:text-black transition-colors">Archive</Link>
              <Link href="/" className="hover:text-black transition-colors">Manifesto</Link>
              <Link href="/search" className="hover:text-black transition-colors">Discovery</Link>
            </div>
          </div>

          {/* Legal */}
          <div className="space-y-6 md:space-y-8">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-black">Protocol</h4>
            <div className="flex flex-col gap-3 md:gap-4 text-xs font-bold text-muted-foreground">
              <Link href="#" className="hover:text-black transition-colors">Privacy</Link>
              <Link href="#" className="hover:text-black transition-colors">Terms</Link>
              <Link href="#" className="hover:text-black transition-colors">Security</Link>
            </div>
          </div>

          {/* Action */}
          <div className="space-y-6 md:space-y-8">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-black">Control</h4>
            <button 
              onClick={scrollToTop}
              className="group flex items-center gap-3 text-xs font-black uppercase tracking-widest text-black"
            >
              Back to Start
              <div className="w-10 h-10 rounded-full border border-border flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all shadow-xl shadow-foreground/5">
                <ArrowUp size={16} />
              </div>
            </button>
          </div>
        </div>

        <div className="pt-20 border-t border-border flex flex-col md:flex-row justify-between items-center gap-8">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
            &copy; {new Date().getFullYear()} LUMEN DIGITAL NARRATIVE PLATFORM
          </p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Network Active</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
