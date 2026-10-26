'use client';
import { useCallback, useEffect, useState } from 'react';
import { AuthApi } from '@/features/auth/api';
import { effectiveCurrentStreak } from '@/lib/gamification';
import type { UserGamification } from '@/lib/supabase';

const DEFAULT: UserGamification = {
  user_id: '',
  total_xp: 0,
  current_streak: 0,
  longest_streak: 0,
  last_active_date: null,
  daily_goal: 30,
  today_xp: 0,
  today_date: null,
};

/** current_streak hiển thị = chuỗi liên tiếp còn sống (0 nếu đã gãy, không phải tổng ngày học). */
function normalizeGamification(row: UserGamification): UserGamification {
  return {
    ...row,
    current_streak: effectiveCurrentStreak(row.current_streak, row.last_active_date),
  };
}

export function useGamification(userId: string | null) {
  const [data, setData] = useState<UserGamification>(DEFAULT);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId) return;
    try {
      const row = await AuthApi.getGamification(userId);
      setData(normalizeGamification(row));
    } catch {
      // preserve existing state on transient error
    }
  }, [userId]);

  useEffect(() => {
    let cancelled = false;
    if (!userId) {
      const t = setTimeout(() => { if (!cancelled) setLoading(false); }, 0);
      return () => { cancelled = true; clearTimeout(t); };
    }
    const startTimer = setTimeout(() => { if (!cancelled) setLoading(true); }, 0);
    AuthApi.getGamification(userId)
      .then((row) => {
        if (cancelled) return;
        setData(normalizeGamification(row));
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; clearTimeout(startTimer); };
  }, [userId]);

  return { data, loading, refresh };
}
