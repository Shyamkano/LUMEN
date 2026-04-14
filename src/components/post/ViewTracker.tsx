'use client';

import { useEffect, useRef } from 'react';
import { trackView, recordTimeSpent } from '@/app/actions/engagement';

interface ViewTrackerProps {
  postId: string;
}

export function ViewTracker({ postId }: ViewTrackerProps) {
  const trackedView = useRef(false);
  const startTime = useRef<number>(Date.now());
  const accumulatedTime = useRef<number>(0);

  useEffect(() => {
    // 1. Initial View Tracking
    if (!trackedView.current) {
      trackedView.current = true;
      const timer = setTimeout(() => {
        trackView(postId).catch(err => console.error('Failed to track view:', err));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [postId]);

  useEffect(() => {
    // 2. Time Spent Tracking
    const reportTime = () => {
      const now = Date.now();
      const elapsed = now - startTime.current;
      const sessionSeconds = Math.floor(elapsed / 1000);
      
      if (sessionSeconds >= 1) { // Record even 1 second
        startTime.current = now; // reset anchor
        recordTimeSpent(postId, sessionSeconds).catch(e => console.warn('Signal lost during transit:', e));
      }
    };

    // Periodic ping every 30 seconds
    const interval = setInterval(reportTime, 30000);

    // Handle visibility change (tab switch/minimize)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        reportTime();
      } else {
        startTime.current = Date.now(); // restart timer when visible
      }
    };

    // Final report on leave
    const handleBeforeUnload = () => {
      reportTime();
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      reportTime(); // final report cleanup
    };
  }, [postId]);

  return null;
}
