'use client';

import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-20 animate-fade-in">
      <div className="flex items-center gap-4 mb-12">
        <Link href="/feed" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all">
          <span className="w-8 h-[1px] bg-border" />
          Back to Archive
        </Link>
      </div>

      <header className="mb-20">
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase mb-6">
          Privacy Protocol
        </h1>
        <p className="text-xl font-medium text-muted-foreground">
          How we handle your digital shadow in the LUMEN network.
        </p>
      </header>

      <section className="prose prose-zinc prose-lg max-w-none space-y-12">
        <div>
          <h2 className="text-xs font-black uppercase tracking-[0.3em] mb-4">01. Identity Shadowing</h2>
          <p className="text-zinc-600 leading-relaxed font-body">
            LUMEN implements a strict Shadow protocol. When you participate anonymously, your real identity is decoupled from your logs. We do not store cross-protocol trackers or fingerprint your navigation within the network.
          </p>
        </div>

        <div>
           <h2 className="text-xs font-black uppercase tracking-[0.3em] mb-4">02. Data Persistence</h2>
           <p className="text-zinc-600 leading-relaxed font-body">
             Your logs and stories are archived with high fidelity. You retain total authority over your content; you can sync or destroy your logs at any time via the Control panel. No data is harvested for secondary intelligence.
           </p>
        </div>

        <div>
           <h2 className="text-xs font-black uppercase tracking-[0.3em] mb-4">03. Network Security</h2>
           <p className="text-zinc-600 leading-relaxed font-body">
             All transmissions are encrypted. We utilize Supabase as our primary archival vault, ensuring industry-standard protection for your narratives and media assets.
           </p>
        </div>

        <div>
           <h2 className="text-xs font-black uppercase tracking-[0.3em] mb-4">04. AI Integration</h2>
           <p className="text-zinc-600 leading-relaxed font-body">
             If you utilize our AI assistants, your draft content is processed in memory to generate suggestions. These fragments are not used for global model training.
           </p>
        </div>
      </section>

      <footer className="mt-32 pt-20 border-t border-border">
         <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-loose">
          LAST SYNCHRONIZED: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          <br />
          VERSION: PROTOCOL 4.2.0
         </p>
      </footer>
    </div>
  );
}
