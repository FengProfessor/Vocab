'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { dateKeyInTimeZone } from '@/lib/gamification';
import { getAllVideoWatchProgress } from '@/lib/listening-recommendation';
import type { ListeningStats } from './types';

const emptySubscribe = () => () => {};
const EMPTY_STATS: ListeningStats = {
  completedCount: 0,
  inProgressPercent: 0,
  totalCompleted: 0,
};

function computeListeningStats(): ListeningStats {
  if (typeof window === 'undefined') {
    return EMPTY_STATS;
  }
  try {
    const allProgress = Object.values(getAllVideoWatchProgress());
    const todayKey = dateKeyInTimeZone(new Date());
    let todayCompleted = 0;
    let todayInProgress = 0;
    let totalCompleted = 0;

    for (const item of allProgress) {
      const itemDateKey = item.completedAt
        ? dateKeyInTimeZone(new Date(item.completedAt))
        : item.updatedAt
          ? dateKeyInTimeZone(new Date(item.updatedAt))
          : '';
      const isCompleted = item.completed || (item.percent ?? 0) >= 90;
      const pct = Math.round(item.percent ?? 0);

      if (isCompleted) {
        totalCompleted++;
        if (itemDateKey === todayKey) todayCompleted++;
      } else if (pct > 0 && itemDateKey === todayKey && pct > todayInProgress) {
        todayInProgress = pct;
      }
    }

    return {
      completedCount: todayCompleted,
      inProgressPercent: todayInProgress,
      totalCompleted,
    };
  } catch {
    return EMPTY_STATS;
  }
}

export function useListeningStats(): ListeningStats {
  const isHydrated = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [liveStats, setLiveStats] = useState<ListeningStats | null>(null);

  useEffect(() => {
    const syncListening = () => {
      setLiveStats(computeListeningStats());
    };
    window.addEventListener('lingo_listening_watch_updated', syncListening);
    return () => window.removeEventListener('lingo_listening_watch_updated', syncListening);
  }, []);

  if (!isHydrated) return EMPTY_STATS;
  return liveStats ?? computeListeningStats();
}
