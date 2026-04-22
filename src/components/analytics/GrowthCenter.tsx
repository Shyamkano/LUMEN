'use client';

import { useQuery } from '@tanstack/react-query';
import { getUserAnalytics, getIndividualPostAnalytics } from '@/app/actions/engagement';
import { 
  TrendingUp, 
  Eye, 
  Heart, 
  MessageSquare, 
  Clock, 
  Loader2, 
  ArrowLeft,
  Calendar,
  Zap,
  ChevronRight
} from 'lucide-react';
import { format, subDays, startOfDay } from 'date-fns';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { ImpactScale } from './ImpactScale';

interface GrowthCenterProps {
  postId?: string;
  isOverall?: boolean;
}

export function GrowthCenter({ postId, isOverall }: GrowthCenterProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['analytics', postId || 'overall'],
    queryFn: () => (isOverall ? getUserAnalytics() : getIndividualPostAnalytics(postId!)) as Promise<any>,
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="animate-spin text-foreground" size={40} />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Gathering Data...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-20 text-center">
        <p className="text-red-500 font-black uppercase tracking-widest text-xs">Loading Error</p>
        <p className="text-muted-foreground text-[10px] mt-2 tracking-widest uppercase">Failed to retrieve growth data.</p>
      </div>
    );
  }

  const totals = isOverall ? {
    views: data.totalViews,
    likes: data.totalLikes,
    comments: data.totalComments,
    timeSpent: data.totalTimeSpent,
    avgTime: data.averageTimeSpent
  } : data.totals;

  const daily = isOverall ? data.dailyReach : data.daily;
  const post = !isOverall ? data.post : null;

  return (
    <div className="space-y-16 animate-reveal">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 pb-10 border-b border-border">
        <div className="space-y-4">
          <Link href={postId ? `/post/${post?.slug}` : '/dashboard'} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={14} /> {postId ? 'Back to Story' : 'Back to Dashboard'}
          </Link>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-none">
            {isOverall ? 'Total Reach' : 'Story Growth'}
          </h1>
          {!isOverall && (
            <p className="text-xl font-bold text-muted-foreground">
              Analysing: <span className="text-foreground">"{post?.title}"</span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-3 bg-muted/20 px-6 py-3 rounded-full border border-border">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest">Live Data Active</span>
        </div>
      </div>

      {/* Metric Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Reach', value: totals.views, icon: Eye, color: 'text-black' },
          { label: 'Likes', value: totals.likes, icon: Heart, color: 'text-rose-500' },
          { label: 'Comments', value: totals.comments, icon: MessageSquare, color: 'text-blue-500' },
          { 
            label: 'Avg Attention', 
            value: totals.avgTime > 60 ? `${Math.floor(totals.avgTime / 60)}m ${totals.avgTime % 60}s` : `${totals.avgTime}s`, 
            icon: Clock, 
            color: 'text-emerald-500' 
          },
        ].map((m, i) => (
          <div key={i} className="group p-10 rounded-[3rem] bg-card border border-border hover:border-foreground transition-all flex flex-col justify-between h-56 shadow-sm hover:shadow-2xl hover:shadow-foreground/5">
            <div className={`p-4 rounded-3xl bg-muted/5 group-hover:bg-foreground transition-all w-fit border border-border`}>
              <m.icon size={20} className={`${m.color} group-hover:text-white transition-colors`} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">{m.label}</p>
              <h3 className="text-5xl font-black tracking-tighter tabular-nums">{m.value.toLocaleString()}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Main Growth Graph */}
      <div className="p-10 md:p-16 rounded-[4rem] border border-border bg-card space-y-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <h2 className="text-2xl md:text-3xl font-black tracking-tighter uppercase flex items-center gap-4">
              <TrendingUp size={28} /> Growth Trajectory
            </h2>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Reach mapped over time</p>
          </div>
          <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-foreground" />
              <span>Reach</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-muted/30" />
              <span>Idle</span>
            </div>
          </div>
        </div>

        <div className="h-[300px] md:h-[400px] w-full flex items-end gap-0.5 md:gap-2 px-1">
          {daily.length > 0 ? (
            // Only show last 30 days on mobile, all on desktop
            daily.slice(typeof window !== 'undefined' && window.innerWidth < 768 ? -30 : -60).map((day: any, i: number) => {
              const maxViews = Math.max(...daily.map((d: any) => d.views || 0), 1);
              const height = ((day.views || 0) / maxViews) * 100;
              return (
                <div key={i} className="flex-1 group relative h-full flex flex-col justify-end">
                  <div 
                    className="w-full bg-muted/10 hover:bg-foreground transition-all rounded-t-xl md:rounded-t-2xl min-h-[4px]" 
                    style={{ height: `${Math.max(height, 2)}%` }}
                  >
                    <div className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 hidden group-hover:block z-20">
                      <div className="bg-foreground text-background p-4 rounded-2xl shadow-2xl space-y-2 min-w-[140px]">
                        <p className="text-[9px] font-black uppercase tracking-widest text-white/50 border-b border-white/10 pb-2">{format(new Date(day.date), 'MMMM d, yyyy')}</p>
                        <div className="space-y-1 pt-1">
                          <div className="flex justify-between text-xs font-black">
                            <span>Reach:</span>
                            <span className="text-white">{day.views || 0}</span>
                          </div>
                          <div className="flex justify-between text-xs font-black">
                            <span>Likes:</span>
                            <span className="text-rose-400">{day.likes || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="w-full h-full flex items-center justify-center border-2 border-dashed border-border rounded-[3rem]">
              <div className="text-center space-y-4">
                 <Zap size={32} className="mx-auto text-muted-foreground opacity-20" />
                 <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Initial Sync data pending accumulation...</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between pt-8 border-t border-border/50 text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">
           <span>60 Days Ago</span>
           <span className="opacity-40">Time Period</span>
           <span>Today</span>
        </div>
      </div>

      {/* Secondary Metrics */}
      {!isOverall && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="p-10 rounded-[3rem] bg-muted/5 border border-border space-y-8">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] flex items-center gap-2">
              <MessageSquare size={16} /> Engagement Stats
            </h3>
            <div className="space-y-6">
               <div className="flex justify-between items-end border-b border-border pb-4">
                 <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Likes</span>
                 <span className="text-3xl font-black tracking-tighter">{totals.likes}</span>
               </div>
               <div className="flex justify-between items-end border-b border-border pb-4">
                 <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Comments</span>
                 <span className="text-3xl font-black tracking-tighter">{totals.comments}</span>
               </div>
               <div className="flex justify-between items-end border-b border-border pb-4">
                 <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Total Time Read</span>
                 <span className="text-3xl font-black tracking-tighter">
                   {totals.timeSpent > 3600 
                     ? `${Math.floor(totals.timeSpent/3600)}h ${Math.floor((totals.timeSpent%3600)/60)}m` 
                     : `${Math.floor(totals.timeSpent/60)}m ${totals.timeSpent%60}s`
                   }
                  </span>
               </div>
            </div>
          </div>

          <div className="p-10 rounded-[3rem] bg-[#0c0c0e] text-white space-y-8 shadow-2xl shadow-black/40">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white/50 flex items-center gap-2">
              <Zap size={16} /> Quick Analytics
            </h3>
            <div className="space-y-8">
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                  <span>Viral Velocity</span>
                  <span>{Math.min(100, Math.round((totals.views / 1000) * 100))}%</span>
                </div>
                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-white" style={{ width: `${Math.min(100, (totals.views / 1000) * 100)}%` }} />
                </div>
              </div>
              <div className="space-y-2">
                 <p className="text-[10px] font-medium leading-relaxed italic text-white/40">
                   "Your data shows how your story is growing in the community."
                 </p>
              </div>
              <Link href="/dashboard" className="block">
                <Button className="w-full bg-white text-black font-black uppercase tracking-widest text-[10px] h-14 rounded-2xl hover:bg-zinc-100">
                  Global Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Impact Scale (Collective Analytics) */}
      {!isOverall && totals && (
        <div className="space-y-8 pt-16 border-t border-border">
          <div className="flex items-center gap-4">
            <h2 className="text-3xl font-black tracking-tighter uppercase">Overall Impact</h2>
            <div className="h-px flex-1 bg-border" />
          </div>
          <ImpactScale 
            totalResonance={totals.resonance || 0}
            forkCount={totals.forkCount || 0}
            validationDensity={totals.validationDensity || 100}
            reachNiches={totals.niches || []}
          />
        </div>
      )}
    </div>
  );
}
