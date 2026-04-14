'use client';

import { useQuery } from '@tanstack/react-query';
import { 
  Zap, 
  ArrowRight, 
  Plus, 
  Search,
  MessageSquare,
  Award,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui';
import Link from 'next/link';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PostRequest } from '@/types';

export default function RequestsPage() {
  const [filter, setFilter] = useState('all');
  const supabase = createClient();

  const { data: requests, isLoading, error } = useQuery<PostRequest[]>({
    queryKey: ['post-requests', filter],
    queryFn: async () => {
      let query = supabase
        .from('post_requests') // Standardized table name
        .select('*, requester:profiles!requester_id(*)')
        .order('created_at', { ascending: false });
      
      if (filter !== 'all') {
        query = query.eq('status', filter);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }
  });

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-20 animate-reveal">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-20">
        <div className="space-y-4">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground border border-border px-3 py-1 rounded-full">
            The Pull Economy
          </span>
          <h1 className="text-5xl md:text-8xl font-black tracking-tighter uppercase leading-none">
            Signals &<br />Gaps
          </h1>
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest max-w-md">
            Identify the knowledge missing in the network. Stake rewards for solutions.
          </p>
        </div>
        <div className="flex gap-4">
           <Link href="/requests/new">
             <Button className="rounded-full h-14 px-8 text-[11px] font-black uppercase tracking-widest gap-3 shadow-xl shadow-black/10">
               <Plus size={18} /> Signal a Gap
             </Button>
           </Link>
        </div>
      </div>

      <div className="flex gap-4 mb-12 overflow-x-auto pb-4 no-scrollbar">
        {['all', 'open', 'resolved'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${
              filter === f ? 'bg-black text-white border-black' : 'bg-white text-muted-foreground border-border hover:border-black'
            }`}
          >
            {f} Signals
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center p-20">
          <Loader2 className="animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {requests?.map((req) => (
            <div key={req.id} className="group p-10 rounded-[3rem] border border-border bg-white hover:border-black transition-all flex flex-col justify-between min-h-[400px] shadow-sm hover:shadow-2xl hover:shadow-black/5">
              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <div className="p-3 bg-muted/50 rounded-2xl group-hover:bg-black group-hover:text-white transition-all">
                    <Zap size={20} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest bg-muted/5 px-3 py-1 rounded-md border border-border">
                    {req.niche || 'General'}
                  </span>
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-black tracking-tighter leading-tight uppercase group-hover:underline underline-offset-4 decoration-2">
                    {req.title}
                  </h3>
                  <p className="text-xs font-medium text-muted-foreground leading-relaxed line-clamp-4">
                    {req.description}
                  </p>
                </div>
              </div>

              <div className="pt-8 border-t border-border/50 space-y-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Award size={16} className="text-amber-500" />
                    <span className="text-xl font-black tracking-tighter">{req.reward_points} pts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-[8px] font-black">
                      {req.requester?.username?.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-[10px] font-bold tracking-widest uppercase truncate max-w-[80px]">
                      @{req.requester?.username}
                    </span>
                  </div>
                </div>
                
                <Link href={`/new?resolved_request_id=${req.id}`} className="block">
                  <Button variant="outline" className="w-full h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest gap-2 group-hover:bg-black group-hover:text-white transition-all">
                    Construct Solution <ArrowRight size={14} />
                  </Button>
                </Link>
              </div>
            </div>
          ))}

          {requests?.length === 0 && (
            <div className="col-span-full py-40 border-2 border-dashed border-border rounded-[4rem] flex flex-col items-center justify-center text-center gap-4">
               <Search size={32} className="text-muted-foreground opacity-20" />
               <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em]">No gaps detected in this sector.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
