'use client';

import { 
  GitBranch, 
  GitCommit, 
  ArrowRight, 
  ChevronRight,
  User,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

interface LineageNode {
  id: string;
  title: string;
  slug: string;
  author: {
    username: string;
    avatar_url: string;
  };
  created_at: string;
  is_current?: boolean;
}

interface LineageTreeProps {
  parent?: LineageNode | null;
  current: LineageNode;
  forks: LineageNode[];
}

export function LineageTree({ parent, current, forks }: LineageTreeProps) {
  return (
    <div className="py-20 max-w-4xl mx-auto space-y-12">
      <div className="text-center space-y-4 mb-20">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600">
          <GitBranch size={14} className="animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest">Asset Lineage Tree</span>
        </div>
        <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-none">
          The Genealogy <br />of Thought
        </h2>
      </div>

      <div className="relative">
        {/* Connection Line */}
        <div className="absolute left-[23px] top-8 bottom-8 w-0.5 bg-gradient-to-b from-border via-foreground to-border opacity-20" />

        <div className="space-y-16">
          {/* Parent Node (The Seed) */}
          {parent && (
            <div className="relative flex items-start gap-8 group">
              <div className="relative z-10 w-12 h-12 rounded-full border-2 border-border bg-white flex items-center justify-center shrink-0 group-hover:border-foreground transition-all">
                <GitCommit size={20} className="text-muted-foreground group-hover:text-foreground" />
              </div>
              <div className="pt-2 space-y-2">
                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Original Seed</span>
                <Link href={`/post/${parent.slug}`} className="block">
                  <h3 className="text-xl font-bold hover:underline underline-offset-4 decoration-2">
                    {parent.title}
                  </h3>
                </Link>
                <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">
                   <div className="flex items-center gap-1.5"><User size={12}/> @{parent.author.username}</div>
                   <div className="flex items-center gap-1.5"><Clock size={12}/> {format(new Date(parent.created_at), 'MMM d, yyyy')}</div>
                </div>
              </div>
              <ArrowRight className="absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground opacity-20" />
            </div>
          )}

          {/* Current Node */}
          <div className="relative flex items-start gap-8 group">
            <div className="relative z-10 w-12 h-12 rounded-full border-4 border-foreground bg-black flex items-center justify-center shrink-0 shadow-xl shadow-black/20">
              <GitBranch size={20} className="text-white" />
            </div>
            <div className="pt-2 p-8 rounded-[2rem] bg-zinc-50 border border-zinc-200 flex-1 space-y-3">
              <span className="text-[9px] font-black uppercase tracking-widest text-foreground">Current Asset</span>
              <h3 className="text-2xl font-black tracking-tight uppercase leading-none">
                {current.title}
              </h3>
              <div className="flex items-center gap-4 text-[10px] text-zinc-500 font-black uppercase tracking-widest">
                 <div className="flex items-center gap-1.5">@{current.author.username}</div>
                 <div className="flex items-center gap-1.5">Synchronized: {format(new Date(current.created_at), 'MMM d, yyyy')}</div>
              </div>
            </div>
          </div>

          {/* Forks (The Branches) */}
          {forks.length > 0 && (
            <div className="space-y-8 pl-12">
               <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                 Branches Adapted ({forks.length}) <ChevronRight size={12} />
               </span>
               <div className="grid grid-cols-1 gap-4">
                 {forks.map((fork) => (
                   <div key={fork.id} className="relative flex items-center gap-6 p-6 rounded-2xl border border-border bg-white hover:border-foreground transition-all group">
                     <div className="absolute -left-[45px] top-1/2 w-8 h-0.5 bg-border group-hover:bg-foreground transition-colors" />
                     <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center shrink-0">
                       {fork.author.avatar_url ? (
                         <img src={fork.author.avatar_url} className="w-full h-full rounded-full object-cover" />
                       ) : (
                         <User size={14} />
                       )}
                     </div>
                     <div className="flex-1 min-w-0">
                       <Link href={`/post/${fork.slug}`} className="block">
                         <h4 className="text-sm font-black uppercase tracking-tight truncate group-hover:underline">
                           {fork.title}
                         </h4>
                       </Link>
                       <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                         @{fork.author.username}
                       </span>
                     </div>
                   </div>
                 ))}
               </div>
            </div>
          )}

          {forks.length === 0 && (
             <div className="pl-12 opacity-40">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  The lineage ends here. Seed has no further adaptations.
                </p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
