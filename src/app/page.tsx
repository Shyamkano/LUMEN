import Link from 'next/link';
import { Button } from '@/components/ui';
import { PenTool, Zap, Code } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

export default async function LandingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="h-[calc(100vh-80px)] max-w-7xl mx-auto px-6 relative flex flex-col justify-center overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[40vh] bg-foreground/[0.02] blur-[100px] rounded-full pointer-events-none" />
      
      <main className="relative z-10 animate-reveal flex flex-col items-start gap-4 py-4">
        <span className="text-[9px] font-black uppercase tracking-[0.5em] text-muted-foreground border border-border px-3 py-1 rounded-full shadow-sm">
          Luminous Network
        </span>

        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[5.5rem] font-black leading-[0.8] text-foreground tracking-tighter">
          CREATE.
          <br />
          <span className="italic font-light opacity-80">without limits.</span>
        </h1>

        <p className="text-base md:text-xl text-muted-foreground max-w-xl leading-tight font-medium tracking-tight mt-2">
          The premier monochrome space for radical thinkers to share their most luminous archive and logs.
        </p>

        <div className="flex flex-wrap gap-4 mt-6">
          {user ? (
            <Link href="/dashboard">
              <Button className="rounded-full px-8 h-12 text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-foreground/5 transition-all hover:scale-105 active:scale-95">
                Go to Dashboard
              </Button>
            </Link>
          ) : (
            <Link href="/auth/signup">
              <Button className="rounded-full px-8 h-12 text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-foreground/5 transition-all hover:scale-105 active:scale-95">
                Join Lumen
              </Button>
            </Link>
          )}
          <Link href="/feed">
            <Button variant="outline" className="rounded-full px-6 h-10 text-[9px] font-black uppercase tracking-[0.2em] hover:bg-black hover:text-white transition-all">
              Enter Feed
            </Button>
          </Link>
        </div>

        {/* Feature grid - Responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 md:gap-6 mt-12 md:mt-8 w-full border-t border-border/50 pt-8">
          <div className="flex flex-col gap-2">
            <div className="w-8 h-8 rounded-lg bg-foreground text-background flex items-center justify-center shadow-md">
              <PenTool size={16} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-widest mb-0.5">Curation</h3>
              <p className="text-[10px] text-muted-foreground leading-tight max-w-[180px]">Deep writing and meticulous archive logs.</p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="w-8 h-8 rounded-lg bg-foreground text-background flex items-center justify-center shadow-md">
              <Zap size={16} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-widest mb-0.5">Velocity</h3>
              <p className="text-[10px] text-muted-foreground leading-tight max-w-[180px]">Rapid insights and micro-logs with zero friction.</p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="w-8 h-8 rounded-lg bg-foreground text-background flex items-center justify-center shadow-md">
              <Code size={16} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-widest mb-0.5">Structure</h3>
              <p className="text-[10px] text-muted-foreground leading-tight max-w-[180px]">Technical documentation and project logs.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}


