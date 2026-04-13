'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui';
import { Bell, Heart, MessageSquare, UserPlus, Zap, ArrowLeft, Loader2, CheckCheck } from 'lucide-react';
import Link from 'next/link';
import { getNotifications, markAsRead, markAllAsRead } from '@/app/actions/notifications';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationsPage() {
  const { user, loading } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    async function loadNotifications() {
      if (user) {
        const data = await getNotifications();
        setNotifications(data || []);
        setFetching(false);
      }
    }
    loadNotifications();
  }, [user]);

  const handleMarkAll = async () => {
    await markAllAsRead();
    setNotifications(notifications.map(n => ({ ...n, is_read: true })));
  };

  const getNotificationConfig = (type: string) => {
    switch (type) {
      case 'like': return { icon: Heart, color: 'text-red-500', label: 'liked your narrative' };
      case 'comment': return { icon: MessageSquare, color: 'text-blue-500', label: 'responded to your broadcast' };
      case 'reply': return { icon: MessageSquare, color: 'text-indigo-500', label: 'replied to your coordination' };
      case 'follow': return { icon: UserPlus, color: 'text-emerald-500', label: 'started following your archive' };
      case 'post': return { icon: Bell, color: 'text-black', label: 'broadcasted a new sync' };
      default: return { icon: Zap, color: 'text-amber-500', label: 'triggered a signal' };
    }
  };

  if (loading || (user && fetching)) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-zinc-400" size={32} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-6 py-20 text-center space-y-8">
        <div className="w-20 h-20 rounded-full bg-muted/10 flex items-center justify-center mx-auto text-muted-foreground">
          <Bell size={40} />
        </div>
        <h1 className="text-4xl font-black tracking-tighter uppercase">Access Denied</h1>
        <p className="text-muted-foreground">Sign in to view your synchronization signals.</p>
        <Link href="/auth/login">
          <Button className="rounded-full px-8 h-12 font-black uppercase tracking-widest text-[10px]">Sign In</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-20 animate-reveal">
      <div className="flex flex-col gap-4 mb-16">
        <Link href="/feed" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors w-fit">
          <ArrowLeft size={14} /> Back to Archive
        </Link>
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-6xl font-black tracking-tighter text-foreground uppercase">Signals</h1>
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Network Activity Log</p>
          </div>
          {notifications.some(n => !n.is_read) && (
            <Button 
              onClick={handleMarkAll}
              variant="outline" 
              className="rounded-full h-10 px-6 text-[9px] font-black uppercase tracking-widest gap-2 hover:bg-black hover:text-white transition-all"
            >
              <CheckCheck size={14} /> Mark All Read
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {notifications.length > 0 ? (
          notifications.map((n) => {
            const config = getNotificationConfig(n.type);
            const Icon = config.icon;
            
            return (
              <div 
                key={n.id} 
                onClick={() => !n.is_read && markAsRead(n.id)}
                className={`group p-6 rounded-[2rem] bg-white border border-border hover:border-foreground transition-all flex items-center gap-6 cursor-pointer hover:shadow-xl hover:shadow-foreground/5 ${!n.is_read ? 'border-l-4 border-l-black' : ''}`}
              >
                <div className={`w-12 h-12 rounded-2xl bg-muted/5 flex items-center justify-center shrink-0 border border-border group-hover:bg-foreground transition-all duration-300`}>
                  <Icon size={20} className={`${config.color} group-hover:text-background transition-colors`} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link 
                      href={n.actor?.username ? `/profile/${n.actor.username}` : '#'} 
                      className="font-black underline underline-offset-4 decoration-1 text-foreground hover:opacity-70"
                    >
                      {n.actor?.full_name || n.actor?.username || 'An Echo'}
                    </Link>
                    <span className="text-sm text-foreground">{config.label}</span>
                    {n.post && (
                      <Link 
                        href={`/post/${n.post.slug}`}
                        className="text-sm font-black text-foreground italic border-b border-border hover:border-foreground"
                      >
                        "{n.post.title}"
                      </Link>
                    )}
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1 opacity-60">
                    {formatDistanceToNow(new Date(n.created_at))} ago
                  </p>
                </div>
                
                {!n.is_read && (
                  <div className="w-2 h-2 rounded-full bg-black shrink-0" />
                )}
              </div>
            );
          })
        ) : (
          <div className="py-40 text-center border border-dashed border-border rounded-[3rem]">
            <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.4em]">The signal log is currently silent.</p>
          </div>
        )}
      </div>

      <div className="mt-20 py-10 border-t border-border/50 text-center">
        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">End of Transmission</p>
      </div>
    </div>
  );
}
