'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui';
import { toggleFollow, checkFollowing } from '@/app/actions/social';
import { useRouter } from 'next/navigation';
import { Loader2, UserPlus, UserMinus } from 'lucide-react';

interface FollowButtonProps {
  followingId: string;
  initialIsFollowing?: boolean;
  className?: string;
  showCount?: boolean;
}

export function FollowButton({ followingId, initialIsFollowing = false, className, showCount = false }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function init() {
      const isActuallyFollowing = await checkFollowing(followingId);
      setIsFollowing(isActuallyFollowing);
      setChecking(false);
    }
    init();
  }, [followingId]);

  const handleToggleFollow = async () => {
    setLoading(true);
    const result = await toggleFollow(followingId);
    
    if (result.error) {
      alert(result.error);
    } else {
      setIsFollowing(result.following ?? false);
      router.refresh();
    }
    setLoading(false);
  };

  if (checking) return <Button variant="outline" size="sm" className="rounded-full w-24 h-9 opacity-50" disabled><Loader2 size={16} className="animate-spin" /></Button>;

  return (
    <Button
      onClick={handleToggleFollow}
      disabled={loading}
      variant={isFollowing ? "outline" : "default"}
      className={`rounded-full gap-2 px-6 h-9 transition-all ${
        isFollowing 
          ? "border-zinc-200 hover:bg-zinc-50 text-zinc-600" 
          : "bg-zinc-900 hover:bg-zinc-800 text-white"
      } ${className || ""}`}
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : isFollowing ? (
        <>
          <UserMinus size={16} />
          <span>Unfollow</span>
        </>
      ) : (
        <>
          <UserPlus size={16} />
          <span>Follow</span>
        </>
      )}
    </Button>
  );
}
