'use client';

import {
  Flame,
  Map as MapIcon,
  ChevronRight,
  TrendingUp,
  Activity,
  Zap
} from 'lucide-react';
import Link from 'next/link';

interface NicheMetric {
  tag: string;
  totalViews: number;
  postCount: number;
  requestCount: number;
  intensity: number; // 0-100 score
}

interface NicheHeatmapProps {
  mapData: NicheMetric[];
}

export function NicheHeatmap({ mapData }: NicheHeatmapProps) {
  // Sort by intensity
  const sortedData = [...mapData].sort((a, b) => b.intensity - a.intensity);

  return (
    <div className="space-y-10 py-10">
      <div className="flex justify-between items-end border-b border-border pb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
            <MapIcon size={14} className="text-muted-foreground" /> Intelligence Map
          </div>
          <h2 className="text-5xl md:text-6xl font-black tracking-tighter uppercase leading-none">
            Niche <br /> Heatmap
          </h2>
          <p className="text-xs font-bold text-muted-foreground tracking-tight uppercase">Visualizing collective focus across the network nodes</p>
        </div>
        <div className="hidden md:flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-zinc-100" />
            <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Cold</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Hot</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {sortedData.map((niche, idx) => {
          const isHot = niche.intensity > 70;
          return (
            <div
              key={idx}
              className={`group relative p-8 rounded-[2.5rem] border transition-all duration-500 overflow-hidden ${isHot
                  ? 'bg-orange-500 border-orange-400 text-white shadow-2xl shadow-orange-500/20 scale-[1.02]'
                  : 'bg-card border-border hover:border-foreground text-foreground'
                }`}
            >
              {/* Background Glow for Hot Niches */}
              {isHot && (
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 animate-pulse" />
              )}

              <div className="relative z-10 space-y-6">
                <div className="flex justify-between items-start">
                  <div className={`p-3 rounded-2xl ${isHot ? 'bg-white/20' : 'bg-muted/5'} transition-colors`}>
                    {isHot ? <Flame size={20} className="animate-bounce" /> : <Activity size={20} />}
                  </div>
                  <div className="text-right">
                    <p className={`text-[10px] font-black uppercase tracking-widest ${isHot ? 'text-white/70' : 'text-muted-foreground'}`}>Intensity</p>
                    <h5 className="text-lg font-black tracking-tighter tabular-nums">{niche.intensity}%</h5>
                  </div>
                </div>

                <div>
                  <h4 className="text-2xl font-black uppercase tracking-tighter leading-tight truncate">
                    #{niche.tag}
                  </h4>
                  <div className={`flex flex-col gap-1 mt-1 ${isHot ? 'text-white/70' : 'text-muted-foreground'}`}>
                    <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest">
                      <span>{niche.postCount} Assets</span>
                      <span className="opacity-30">•</span>
                      <span>{niche.totalViews.toLocaleString()} Reach</span>
                    </div>

                    {niche.requestCount > 0 && (
                      <div className={`flex items-center gap-1.5 text-[8px] font-black tracking-widest uppercase mt-1 ${isHot ? 'text-white' : 'text-emerald-600'}`}>
                        <Zap size={10} fill={isHot ? 'white' : 'currentColor'} /> {niche.requestCount} Open Opportunities
                      </div>
                    )}
                  </div>
                </div>

                <Link
                  href={`/search?q=${encodeURIComponent(niche.tag)}`}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${isHot
                      ? 'bg-white/20 border-white/20 hover:bg-white text-orange-950 font-bold'
                      : 'bg-zinc-50 border-zinc-100 hover:bg-black hover:text-white'
                    }`}
                >
                  <span className="text-[9px] font-black uppercase tracking-[0.2em]">Explore Niche</span>
                  <ChevronRight size={12} />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
