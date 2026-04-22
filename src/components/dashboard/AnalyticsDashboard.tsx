'use client';

import { useQuery } from '@tanstack/react-query';
import { getUserAnalytics } from '@/app/actions/engagement';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  MessageSquare, 
  Heart, 
  Eye,
  ArrowUpRight,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';

export function AnalyticsDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics', 'overall-dashboard'],
    queryFn: () => getUserAnalytics(),
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-12 animate-reveal">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Reach */}
        <div className="p-8 rounded-[2rem] bg-foreground text-background space-y-4 shadow-xl shadow-foreground/10">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-background/10 rounded-xl">
              <Eye size={18} />
            </div>
            <ArrowUpRight size={18} className="text-background/40" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-background/50">Total Reach</p>
            <h3 className="text-4xl font-black tracking-tighter">{data.totalViews.toLocaleString()}</h3>
          </div>
        </div>

        {/* Engagement */}
        <div className="p-8 rounded-[2rem] bg-card border border-border space-y-4">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-muted/50 rounded-xl">
              <Heart size={18} />
            </div>
            <span className="text-[10px] font-black text-green-600">+12%</span>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Appreciation</p>
            <h3 className="text-4xl font-black tracking-tighter">{data.totalLikes.toLocaleString()}</h3>
          </div>
        </div>

        {/* Dialogue */}
        <div className="p-8 rounded-[2rem] bg-card border border-border space-y-4">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-muted/50 rounded-xl">
              <MessageSquare size={18} />
            </div>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Dialogues</p>
            <h3 className="text-4xl font-black tracking-tighter">{data.totalComments.toLocaleString()}</h3>
          </div>
        </div>

        {/* Attention */}
        <div className="p-8 rounded-[2rem] bg-card border border-border space-y-4">
          <div className="flex justify-between items-start">
            <div className={`p-2 bg-muted/50 rounded-xl`}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Avg Attention</p>
            <h3 className="text-4xl font-black tracking-tighter">
              {data.averageTimeSpent > 60 
                ? `${Math.floor(data.averageTimeSpent / 60)}m ${data.averageTimeSpent % 60}s` 
                : `${data.averageTimeSpent}s`}
            </h3>
          </div>
        </div>
      </div>

      {/* Daily Growth Chart (Simple CSS/SVG) */}
      <div className="p-10 rounded-[3rem] border border-border bg-card space-y-10">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h4 className="text-xl font-black tracking-tight uppercase">Reach Growth</h4>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">30-Day Synchronization Activity</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-foreground" />
            <span className="text-[9px] font-black uppercase tracking-widest text-foreground">Views</span>
          </div>
        </div>

        <div className="h-[200px] w-full flex items-end gap-1 px-2">
          {data.dailyReach.length > 0 ? (
            data.dailyReach.map((day: any, i: number) => {
              const maxViews = Math.max(...data.dailyReach.map((d: any) => d.views), 1);
              const height = (day.views / maxViews) * 100;
              return (
                <div key={day.date} className="flex-1 group relative">
                  <div 
                    className="w-full bg-muted/20 hover:bg-foreground transition-all rounded-t-sm" 
                    style={{ height: `${Math.max(height, 5)}%` }}
                  />
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block bg-foreground text-background text-[8px] font-black px-2 py-1 rounded-md whitespace-nowrap z-10 shadow-xl">
                    {day.views} views ({format(new Date(day.date), 'MMM d')})
                  </div>
                </div>
              );
            })
          ) : (
            <div className="w-full h-full flex items-center justify-center border border-dashed border-border rounded-2xl">
              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Insufficient data for visualization</p>
            </div>
          )}
        </div>
        
        <div className="flex justify-between px-2 pt-4 border-t border-border/50 text-[8px] font-black text-muted-foreground uppercase tracking-widest">
           <span>{data.dailyReach[0] ? format(new Date(data.dailyReach[0].date), 'MMM d') : '-'}</span>
           <span>Last 30 Days</span>
           <span>Today</span>
        </div>
      </div>

      {/* Top Posts Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h4 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-3">
            <TrendingUp size={14} /> High-Impact Narratives
          </h4>
          <div className="space-y-4">
            {data.topPosts.map((post: any, i: number) => (
              <div key={post.id} className="flex justify-between items-center p-6 rounded-3xl border border-border bg-card hover:border-foreground transition-all group">
                <div className="flex items-center gap-6">
                  <span className="text-xl font-black text-muted-foreground/30 tabular-nums">0{i+1}</span>
                  <div>
                    <h5 className="font-black text-foreground group-hover:underline underline-offset-4">{post.title}</h5>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.1em] mt-1">Broadcasted {format(new Date(post.created_at), 'MMM yyyy')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black tracking-tight tabular-nums">{post.views || 0}</span>
                  <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Total Reach</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-10 rounded-[3rem] bg-muted/5 border border-border h-fit space-y-8">
           <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
             <BarChart3 size={14} /> Intelligence
           </h4>
           <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                  <span>Reach per Sync</span>
                  <span>{Math.round(data.totalViews / data.postsCount) || 0}</span>
                </div>
                <div className="h-1 w-full bg-muted/30 rounded-full overflow-hidden">
                  <div className="h-full bg-foreground w-[65%]" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                  <span>Engagement Rate</span>
                  <span>{(((data.totalLikes + data.totalComments) / (data.totalViews || 1)) * 100).toFixed(1)}%</span>
                </div>
                <div className="h-1 w-full bg-muted/30 rounded-full overflow-hidden">
                  <div className="h-full bg-foreground w-[42%]" />
                </div>
              </div>
           </div>
           
           <div className="p-6 rounded-2xl bg-card border border-border">
              <p className="text-[10px] font-medium leading-relaxed italic text-muted-foreground">
                "Reach is the volume of your signal; Engagement is the depth of its resonance."
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}
