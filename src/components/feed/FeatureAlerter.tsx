'use client';

import { useEffect } from 'react';
import { notifyNewFeature } from '@/app/actions/notifications';
import { useQueryClient } from '@tanstack/react-query';

const FEATURES_TO_ANNOUNCE = [
  'Dark & Light Mode Switcher',
  'Premium Guided Tour',
  'Simplified Interface (Home & Notifications)'
];

export function FeatureAlerter() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const announceFeatures = async () => {
      let newlyAnnounced = false;

      for (const feature of FEATURES_TO_ANNOUNCE) {
        const key = `announced-v2-${feature.replace(/\s+/g, '-').toLowerCase()}`;
        const hasAnnounced = localStorage.getItem(key);
        
        if (!hasAnnounced) {
          try {
            await notifyNewFeature(feature);
            localStorage.setItem(key, 'true');
            newlyAnnounced = true;
            // Small delay between notifications to prevent spam
            await new Promise(r => setTimeout(r, 800));
          } catch (e) {
            console.error('Failed to notify feature:', feature, e);
          }
        }
      }

      if (newlyAnnounced) {
        // Force refresh all notification data across the app
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      }
    };

    // Check after a short delay
    const timer = setTimeout(announceFeatures, 2500);
    return () => clearTimeout(timer);
  }, [queryClient]);

  return null;
}
