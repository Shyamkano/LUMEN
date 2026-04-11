'use client';

import Link from 'next/link';
import { Button } from '@/components/ui';
import { FollowButton } from './FollowButton';
import { User } from 'lucide-react';

interface UserListProps {
  users: any[];
  title: string;
  emptyMessage: string;
  backUrl?: string;
}

export function UserList({ users, title, emptyMessage, backUrl = ".." }: UserListProps) {
  return (
    <div className="max-w-2xl mx-auto py-20 animate-reveal px-6">
      <div className="flex flex-col gap-4 mb-20">
        <h1 className="text-5xl font-black text-foreground tracking-tighter uppercase">{title}</h1>
        <div className="h-px w-full bg-border" />
      </div>

      {users.length > 0 ? (
        <div className="grid gap-8">
          {users.map((user) => (
            <div key={user.id} className="flex items-center justify-between group p-6 rounded-[2rem] hover:bg-muted/5 transition-all border border-transparent hover:border-border">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-muted/10 border border-border flex items-center justify-center">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl font-black">{user.full_name?.charAt(0) || user.username?.charAt(0)}</span>
                  )}
                </div>
                <div>
                  <Link href={`/profile/${user.username}`}>
                    <h3 className="text-lg font-black text-foreground group-hover:underline underline-offset-4 decoration-2">
                       {user.full_name || 'Anonymous User'}
                    </h3>
                  </Link>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">@{user.username}</p>
                </div>
              </div>
              
              <FollowButton followingId={user.id} className="rounded-full px-6 h-10 text-[10px] font-black uppercase tracking-widest" />
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center border border-dashed border-border rounded-[2.5rem] bg-muted/5">
           <p className="text-sm font-black text-muted-foreground uppercase tracking-widest">{emptyMessage}</p>
        </div>
      )}
      
      <div className="mt-20 pt-10 border-t border-border flex justify-center">
         <Link href={backUrl}>
           <Button variant="ghost" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground">
              ← Return to Identity
           </Button>
         </Link>
      </div>
    </div>
  );
}
