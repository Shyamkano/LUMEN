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
      id, title, slug, created_at, type, status, author_id,
      profiles ( full_name, username )
    `)
    .order('created_at', { ascending: false })
    .limit(10);

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

      <div className="max-w-7xl mx-auto px-6 -mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Archive Entries" value={postCount || 0} icon={<FileText />} trend="+12% this week" />
        <StatCard title="Active Network Residents" value={userCount || 0} icon={<Users />} trend="+5% this week" />
        <StatCard title="Engagement Signals" value={commentCount || 0} icon={<MessageSquare />} trend="+24% this week" />
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-16 grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-12">
        
        {/* User Management Section */}
        <section className="space-y-8">
          <div className="flex items-center justify-between border-b border-black/5 pb-6">
            <h2 className="text-2xl font-black tracking-tight uppercase">Platform Residents ({userCount})</h2>
          </div>

          <UserAdminList users={allUsers || []} />
          
        </section>

        {/* Post Management / Moderation Queue */}
        <aside className="space-y-8">
            <div className="flex items-center justify-between border-b border-black/5 pb-6">
                <h2 className="text-xs font-black tracking-[0.3em] uppercase opacity-40 text-black">Moderation Queue</h2>
                <ShieldAlert size={16} className="text-red-500" />
            </div>

            <div className="space-y-6">
                {recentPosts?.map((p: any) => (
                   <div key={p.id} className="space-y-3">
                      <div className="flex items-center justify-between">
                         <span className="text-[10px] font-black uppercase tracking-[0.2em] text-black/30">{p.type}</span>
                         {p.status === 'draft' && <span className="bg-amber-100 text-amber-700 text-[8px] font-black uppercase px-2 py-0.5 rounded">Draft</span>}
                      </div>
                      <Link href={`/post/${p.slug}`}>
                        <h4 className="font-bold text-sm leading-tight hover:underline underline-offset-4 decoration-2 truncate text-black">{p.title}</h4>
                      </Link>
                      <div className="flex items-center justify-between pt-2">
                        <p className="text-[8px] font-black uppercase text-black/40">by @{p.profiles?.username || 'Unknown'}</p>
                        <PostAdminActions 
                          postId={p.id} 
                          postTitle={p.title} 
                          isPublished={p.status === 'published'} 
                        />
                      </div>
                      <div className="h-px w-full bg-black/[0.03]" />
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
    <div className="bg-white p-10 rounded-[3rem] border border-black/5 shadow-xl hover:scale-[1.02] transition-transform duration-500 group">
      <div className="flex items-center justify-between mb-8">
        <div className="w-12 h-12 rounded-2xl bg-zinc-50 flex items-center justify-center text-black group-hover:bg-black group-hover:text-white transition-colors">
          {icon}
        </div>
        <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">{trend}</span>
      </div>
      <div>
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-black/40 mb-2">{title}</h3>
        <p className="text-5xl font-black tracking-tighter">{value}</p>
      </div>
    </div>
  );
}
