'use client';

import { 
  TrendingUp, 
  Users, 
  GitBranch, 
  Zap,
  Globe,
  Share2
} from 'lucide-react';

interface ImpactMetric {
  label: string;
  value: string | number;
  change: string;
  icon: any;
  color: string;
}

interface ImpactScaleProps {
  totalResonance: number;
  forkCount: number;
  reachNiches: string[];
  validationDensity: number;
}

export function ImpactScale({ totalResonance, forkCount, reachNiches, validationDensity }: ImpactScaleProps) {
  const metrics: ImpactMetric[] = [
    { 
      label: 'Network Resonance', 
      value: totalResonance.toLocaleString(), 
      change: '+12% this week', 
      icon: TrendingUp, 
      color: 'text-emerald-600 bg-emerald-50' 
    },
    { 
      label: 'Genealogy Growth', 
      value: `${forkCount} Forks`, 
      change: 'Recursive lineage', 
      icon: GitBranch, 
      color: 'text-blue-600 bg-blue-50' 
    },
    { 
      label: 'Validation Density', 
      value: `${validationDensity}%`, 
      change: 'Community Certified', 
      icon: Zap, 
      color: 'text-amber-600 bg-amber-50' 
    },
    { 
      label: 'Cross-Niche Reach', 
      value: reachNiches.length > 0 ? reachNiches.length : 0, 
      change: reachNiches.length > 0 ? reachNiches.slice(0, 3).join(', ') : 'No niches detected', 
      icon: Globe, 
      color: 'text-purple-600 bg-purple-50' 
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, idx) => (
          <div key={idx} className="p-6 rounded-[2rem] border border-border bg-white hover:shadow-xl hover:shadow-black/5 transition-all group">
            <div className={`w-10 h-10 rounded-2xl ${m.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
              <m.icon size={20} />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{m.label}</p>
              <h4 className="text-2xl font-black uppercase tracking-tighter">{m.value}</h4>
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{m.change}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Resonance Visualization */}
      <div className="relative p-8 rounded-[2.5rem] bg-zinc-900 overflow-hidden min-h-[300px] flex flex-col justify-end">
        {/* Abstract Background Effect */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px]" />
        
        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 w-fit backdrop-blur-md">
            <Share2 size={12} className="text-white" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white">Impact Vector</span>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase leading-none">
              Resonance <br /> Across Mirrors
            </h3>
            <p className="text-zinc-400 text-xs font-medium max-w-md leading-relaxed uppercase tracking-tight">
              Tracking how your original thought has been mirrored and adapted by the community across the network node.
            </p>
          </div>

          <div className="flex gap-1 h-3 rounded-full bg-white/5 overflow-hidden">
             <div className="h-full bg-emerald-400" style={{ width: `${Math.max(40, 100 - (forkCount * 8))}%` }} />
             <div className="h-full bg-blue-400" style={{ width: `${Math.min(60, forkCount * 8)}%` }} />
          </div>
          
          <div className="flex gap-6">
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-[9px] font-black uppercase text-zinc-400">Seed Posts</span>
             </div>
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                <span className="text-[9px] font-black uppercase text-zinc-400">Branches</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
