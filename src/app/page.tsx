import Link from 'next/link';
import { Button } from '@/components/ui';
import { PenTool, Zap, Code, Ghost, Sparkles, Mic } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function LandingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Mobile detection
  const headersList = await headers();
  const userAgent = headersList.get('user-agent') || '';
  const isMobile = /mobile|android|iphone|ipad|phone/i.test(userAgent);

  // Re-enabling the redirect as per the 'old' logic
  if (isMobile || user) {
    redirect('/feed');
  }

  return (
    <div className="h-[100%] max-w-7xl mx-auto px-6 relative flex flex-col justify-center overflow-hidden">
      {/* Background Glows */}
      <div className="absolute inset-0 pointer-events-none opacity-50" style={{ background: 'var(--luminous-glow)' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[40vh] bg-foreground/[0.03] blur-[120px] rounded-full pointer-events-none" />

      <main className="relative z-10 animate-reveal flex flex-col items-start gap-4 py-8">
        <span className="text-[9px] font-black uppercase tracking-[0.5em] text-muted-foreground border border-border/50 px-3 py-1 rounded-full shadow-sm bg-background/50 backdrop-blur-sm">
          Luminous Network
        </span>

        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[5.5rem] font-black leading-[0.8] text-foreground tracking-tighter pt-2">
          CREATE.
          <br />
          <span className="italic font-light opacity-80">without limits.</span>
        </h1>

        <p className="text-base md:text-xl text-muted-foreground max-w-xl leading-tight font-medium tracking-tight mt-2">
          The premier monochrome space for radical thinkers to share their most luminous stories and posts.
        </p>

        <div className="flex flex-wrap gap-4 mt-6">
          {user ? (
            <Link href="/dashboard">
              <Button className="rounded-full px-8 h-12 text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-foreground/5 transition-all hover:scale-105 active:scale-95 bg-foreground text-background">
                Go to Dashboard
              </Button>
            </Link>
          ) : (
            <Link href="/auth/signup">
              <Button className="rounded-full px-8 h-12 text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-foreground/5 transition-all hover:scale-105 active:scale-95 bg-foreground text-background">
                Join Lumen
              </Button>
            </Link>
          )}
          <Link href="/feed">
            <Button variant="outline" className="rounded-full px-6 h-10 text-[9px] font-black uppercase tracking-[0.2em] hover:bg-foreground hover:text-background transition-all border-border shadow-sm">
              Enter Feed
            </Button>
          </Link>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-12 gap-x-8 md:gap-x-6 m-12 md:mt-8 w-full border-t border-border/50 pt-8">
          <div className="flex flex-col gap-2">
            <div className="w-10 h-10 rounded-xl bg-foreground text-background flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500">
              <PenTool size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-widest mb-0.5">Curation</h3>
              <p className="text-[10px] text-muted-foreground leading-tight max-w-[180px]">Deep writing and meticulous story posts.</p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="w-10 h-10 rounded-xl bg-foreground text-background flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500">
              <Zap size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-widest mb-0.5">Velocity</h3>
              <p className="text-[10px] text-muted-foreground leading-tight max-w-[180px]">Rapid insights and micro-posts with zero friction.</p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="w-10 h-10 rounded-xl bg-foreground text-background flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500">
              <Code size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-widest mb-0.5">Structure</h3>
              <p className="text-[10px] text-muted-foreground leading-tight max-w-[180px]">Technical documentation and project posts.</p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="w-10 h-10 rounded-xl bg-foreground text-background flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500">
              <Ghost size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-widest mb-0.5">Shadow Mode</h3>
              <p className="text-[10px] text-muted-foreground leading-tight max-w-[180px]">Anonymized editorial presence with ghost identities.</p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="w-10 h-10 rounded-xl bg-foreground text-background flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500">
              <Sparkles size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-widest mb-0.5">AI Synthesis</h3>
              <p className="text-[10px] text-muted-foreground leading-tight max-w-[180px]">Intelligent narrative logic and editing assistance.</p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="w-10 h-10 rounded-xl bg-foreground text-background flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500">
              <Mic size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-widest mb-0.5">Multi-Sync</h3>
              <p className="text-[10px] text-muted-foreground leading-tight max-w-[180px]">Monochromatic voice posts and audio stories.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
