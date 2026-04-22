'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui';
import { Bell, Heart, MessageSquare, UserPlus, Zap, ArrowLeft, Loader2, CheckCheck } from 'lucide-react';
import Link from 'next/link';
import { getNotifications, markAsRead, markAllAsRead } from '@/app/actions/notifications';
import { formatDistanceToNow } from 'date-fns';
import { useState, useEffect } from 'react';

export default function NotificationsPage() {
  const { user, loading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: notifications = [], isLoading: fetching } = useQuery({
    queryKey: ['notifications', 'list'],
    queryFn: () => getNotifications(),
    enabled: !!user && mounted,
    refetchInterval: 30000,
  });

  const queryClient = useQueryClient();

  const handleMarkAll = async () => {
    await markAllAsRead();
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  const handleMarkItem = async (id: string) => {
    await markAsRead(id);
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  const getNotificationConfig = (type: string) => {
    switch (type) {
      case 'like': return { icon: Heart, color: 'text-red-500', label: 'liked your post' };
      case 'comment': return { icon: MessageSquare, color: 'text-blue-500', label: 'commented on your post' };
      case 'reply': return { icon: MessageSquare, color: 'text-indigo-500', label: 'replied to your comment' };
      case 'follow': return { icon: UserPlus, color: 'text-emerald-500', label: 'started following you' };
      case 'post': return { icon: Bell, color: 'text-foreground', label: 'posted a new story' };
      default: return { icon: Zap, color: 'text-amber-500', label: 'notified you' };
    }
  };

  if (!mounted || loading || (user && fetching)) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-muted-foreground" size={32} />
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
        <p className="text-muted-foreground">Sign in to view your notifications.</p>
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
          <ArrowLeft size={14} /> Back to Home
        </Link>
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-6xl font-black tracking-tighter text-foreground uppercase leading-none">Notifications</h1>
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mt-2">Stay updated with your community</p>
          </div>
          {notifications.some(n => !n.is_read) && (
            <Button 
              onClick={handleMarkAll}
              variant="outline" 
              className="rounded-full h-10 px-6 text-[9px] font-black uppercase tracking-widest gap-2 hover:bg-foreground hover:text-background transition-all"
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
                onClick={() => !n.is_read && handleMarkItem(n.id)}
                className={`group p-6 rounded-[2rem] bg-card border border-border hover:border-foreground transition-all flex items-center gap-6 cursor-pointer hover:shadow-xl hover:shadow-foreground/5 ${!n.is_read ? 'border-l-4 border-l-foreground' : ''}`}
              >
                <div className={`w-12 h-12 rounded-2xl bg-muted/5 flex items-center justify-center shrink-0 border border-border group-hover:bg-foreground transition-all duration-300`}>
                  <Icon size={20} className={`${config.color} group-hover:text-background transition-colors`} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {n.type !== 'system' && (
                      <Link 
                        href={n.actor?.username ? `/profile/${n.actor.username}` : '#'} 
                        className="font-black underline underline-offset-4 decoration-1 text-foreground hover:opacity-70"
                      >
                        {n.actor?.full_name || n.actor?.username || 'A User'}
                      </Link>
                    )}
                    <span className="text-sm text-foreground">
                      {n.content || config.label}
                    </span>
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
                  <div className="w-2 h-2 rounded-full bg-foreground shrink-0" />
                )}
              </div>
            );
          })
        ) : (
          <div className="py-40 text-center border border-dashed border-border rounded-[3rem] bg-card/30">
            <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.4em]">The notification log is currently silent.</p>
          </div>
        )}
      </div>

      <div className="mt-20 py-10 border-t border-border/50 text-center">
        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">You're all caught up</p>
      </div>
    </div>
  );
}
