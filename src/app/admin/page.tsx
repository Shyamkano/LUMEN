import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { 
  Users, 
  FileText, 
  MessageSquare, 
  ShieldAlert, 
  Activity, 
  TrendingUp,
  Search,
  MoreHorizontal,
  Mail,
  ShieldCheck
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { UserAdminList } from '@/components/admin/UserAdminList';
import { PostAdminActions } from '@/components/admin/PostAdminActions';
import { ModerationReports } from '@/components/admin/ModerationReports';
import { getNicheInsights } from '@/app/actions/engagement';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  // Security Check: Verify Admin Role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    notFound(); // Hide the existence of the admin page from normal users
  }

  // Fetch Platform Stats
  const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
  const { count: postCount } = await supabase.from('posts').select('*', { count: 'exact', head: true });
  const { count: commentCount } = await supabase.from('comments').select('*', { count: 'exact', head: true });
  const { count: requestCount } = await supabase.from('post_requests').select('*', { count: 'exact', head: true });

  // Graph Data: Signups for the last 14 days
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
  
  const { data: signupTrend } = await supabase
    .from('profiles')
    .select('created_at')
    .gte('created_at', fourteenDaysAgo.toISOString())
    .order('created_at', { ascending: true });

  const trendData = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    const dateStr = d.toISOString().split('T')[0];
    const count = signupTrend?.filter(s => s.created_at?.startsWith(dateStr)).length || 0;
    return count;
  });

  // Calculate Signup Trend (%)
  const recentSignups = trendData.slice(-7).reduce((a, b) => a + b, 0);
  const previousSignups = trendData.slice(0, 7).reduce((a, b) => a + b, 0);
  const signupTrendPct = previousSignups > 0 ? Math.round(((recentSignups - previousSignups) / previousSignups) * 100) : recentSignups * 100;

  // ALL Residents with Real Emails (Privileged Admin Action)
  const { createAdminClient } = await import('@/lib/supabase/admin');
  const adminClient = createAdminClient();
  
  const { data: { users: authUsers } } = await adminClient.auth.admin.listUsers();
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  const allUsers = profiles?.map(p => {
    const authUser = authUsers.find(u => u.id === p.id);
    return {
      ...p,
      email: authUser?.email || 'No email'
    };
  });

  // Recent Posts
  const { data: recentPosts } = await supabase
    .from('posts')
    .select(`
      id, title, slug, created_at, type, status, author_id, validation_score, health_status,
      profiles ( full_name, username )
    `)
    .order('created_at', { ascending: false })
    .limit(10);

  // Fetch Live Niche Intelligence
  const nicheIntelligence = await getNicheInsights();

  // Fetch Pending Reports with explicit hints
  const { data: reports, error: reportsError } = await supabase
    .from('reports')
    .select('id, reason, details, created_at, post_id, post:posts!post_id(title, slug), reporter:profiles!reporter_id(username)')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (reportsError) {
    console.error('[ADMIN_DIAGNOSTIC] Signals Fetch Error:', JSON.stringify(reportsError, null, 2));
  }
  console.log(`[ADMIN_DIAGNOSTIC] Open Signals Detected: ${reports?.length || 0}`);

  return (
    <div className="min-h-screen bg-[#fafafa] text-black pb-20">
      {/* Top Header */}
      <div className="bg-black text-white py-20 px-6 border-b border-white/10 shadow-2xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
                <ShieldCheck size={20} className="text-black" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Command & Control</p>
            </div>
            <h1 className="text-7xl font-black tracking-tighter leading-none text-white">LUMEN Admin</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl px-8 py-4 flex flex-col items-center border-dashed font-mono">
              <span className="text-[8px] font-black uppercase tracking-widest text-white/30 mb-1">Network Status</span>
              <span className="text-sm font-black text-green-400 uppercase tracking-widest flex items-center gap-2">
                Active <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-10 grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Archive Assets" value={postCount || 0} icon={<FileText />} trend="Live Archive" />
        <StatCard title="Total Residents" value={userCount || 0} icon={<Users />} trend={`${signupTrendPct > 0 ? '+' : ''}${signupTrendPct}% this week`} />
        <StatCard title="Signal Gaps" value={requestCount || 0} icon={<TrendingUp />} trend="Pull Economy active" />
        <StatCard title="Total Resonance" value={commentCount || 0} icon={<MessageSquare />} trend="Network Growth" />
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-16 grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-12">
        
        {/* User Management Section */}
        <section className="space-y-8">
          <div className="flex items-center justify-between border-b border-black/5 pb-6">
            <h2 className="text-2xl font-black tracking-tight uppercase">Platform Residents ({userCount})</h2>
          </div>

          <UserAdminList users={allUsers || []} />
          
          <div className="pt-12 border-t border-black/5">
            <div className="flex items-center justify-between mb-8">
               <h2 className="text-2xl font-black tracking-tight uppercase">Community Action Feed</h2>
               <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${reports?.length ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-40">{reports?.length || 0} Open Signals</span>
               </div>
            </div>
            
            <ModerationReports initialReports={reports || []} />
          </div>

          <div className="pt-12 border-t border-border">
            <h2 className="text-2xl font-black tracking-tight uppercase mb-8">Signal Map Intelligence</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {nicheIntelligence.map((niche) => (
                <div key={niche.tag} className="p-6 rounded-[2rem] bg-foreground text-background space-y-2 group hover:scale-[1.02] transition-transform">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 group-hover:opacity-100 transition-opacity whitespace-nowrap overflow-hidden text-ellipsis">{niche.tag}</p>
                  <p className="text-2xl font-black">{niche.intensity}% Intensity</p>
                  <div className="w-full h-1 bg-background/20 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${niche.intensity > 70 ? 'bg-red-500' : 'bg-emerald-400'}`} 
                      style={{ width: `${niche.intensity}%` }} 
                    />
                  </div>
                  <p className="text-[8px] font-bold text-background/30 uppercase tracking-widest">{niche.totalViews} Network Engagements</p>
                </div>
              ))}
              {nicheIntelligence.length === 0 && (
                <p className="text-xs font-black uppercase text-muted-foreground italic col-span-4 py-12 text-center border-2 border-dashed border-border rounded-[2rem]">Waiting for network signals...</p>
              )}
            </div>
          </div>
          
        </section>

        {/* Post Management / Moderation Queue */}
        <aside className="space-y-8">
            <div className="flex items-center justify-between border-b border-black/5 pb-6">
                <h2 className="text-xs font-black tracking-[0.3em] uppercase opacity-40 text-black">Moderation Queue</h2>
                <ShieldAlert size={16} className="text-red-500" />
            </div>

            <div className="space-y-6">
                {recentPosts?.map((p: any) => (
                    <div key={p.id} className="space-y-3 p-4 rounded-2xl hover:bg-muted/50 transition-all group/post">
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-2">
                           <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">{p.type}</span>
                           <div className={`h-1 w-1 rounded-full ${p.validation_score > 70 ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                           <span className="text-[8px] font-black text-foreground">{p.validation_score}% Health</span>
                         </div>
                         {p.status === 'draft' && <span className="bg-amber-100 text-amber-700 text-[8px] font-black uppercase px-2 py-0.5 rounded">Draft</span>}
                      </div>
                      <Link href={`/post/${p.slug}`}>
                        <h4 className="font-bold text-sm leading-tight hover:underline underline-offset-4 decoration-2 truncate text-foreground">{p.title}</h4>
                      </Link>
                      <div className="flex items-center justify-between pt-2">
                        <p className="text-[8px] font-black uppercase text-muted-foreground">by @{p.profiles?.username || 'Unknown'}</p>
                        <PostAdminActions 
                          postId={p.id} 
                          postTitle={p.title} 
                          isPublished={p.status === 'published'} 
                        />
                      </div>
                      <div className="h-px w-full bg-border/30" />
                   </div>
                ))}
            </div>
            
            <div className="p-8 rounded-[2.5rem] bg-zinc-100 border border-black/5 space-y-4">
                <div className="flex items-center gap-2">
                    <TrendingUp size={16} className="text-black" />
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-black">Network Growth</h5>
                </div>
                <div className="h-20 flex items-end gap-1 px-1">
                    {trendData.map((val, i) => (
                        <div 
                          key={i} 
                          className="flex-1 bg-black rounded-t-sm transition-all duration-700" 
                          style={{ height: `${Math.max(val * 20, 5)}%` }} 
                        />
                    ))}
                </div>
                <p className="text-[9px] font-bold text-black/40 uppercase tracking-widest text-center">Residents last 14 days</p>
            </div>
        </aside>

      </div>
    </div>
  );
}

function StatCard({ title, value, icon, trend }: { title: string, value: number | string, icon: React.ReactNode, trend: string }) {
  return (
    <div className="bg-card p-10 rounded-[3rem] border border-border shadow-xl hover:scale-[1.02] transition-transform duration-500 group">
      <div className="flex items-center justify-between mb-8">
        <div className="w-12 h-12 rounded-2xl bg-muted/5 flex items-center justify-center text-foreground group-hover:bg-foreground group-hover:text-background transition-colors">
          {icon}
        </div>
        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{trend}</span>
      </div>
      <div>
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground mb-2">{title}</h3>
        <p className="text-5xl font-black tracking-tighter text-foreground">{value}</p>
      </div>
    </div>
  );
}
