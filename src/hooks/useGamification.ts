'use client';
import { useCallback, useEffect, useState } from 'react';
import { effectiveCurrentStreak } from '@/lib/gamification';
import { supabase } from '@/lib/supabase';
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
    const { data: row } = await supabase
      .from('user_gamification')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (row) setData(normalizeGamification(row as UserGamification));
  }, [userId]);

  useEffect(() => {
    let cancelled = false;
    if (!userId) {
      // Defer setState to avoid synchronous setState-in-effect lint warning
      const t = setTimeout(() => { if (!cancelled) setLoading(false); }, 0);
      return () => { cancelled = true; clearTimeout(t); };
    }
    // Defer setLoading(true) to avoid synchronous setState-in-effect lint error
    const startTimer = setTimeout(() => { if (!cancelled) setLoading(true); }, 0);
    supabase
      .from('user_gamification')
      .select('*')
      .eq('user_id', userId)
      .single()
      .then(({ data: row }) => {
        if (cancelled) return;
        if (row) setData(normalizeGamification(row as UserGamification));
        setLoading(false);
      });
    return () => { cancelled = true; clearTimeout(startTimer); };
  }, [userId]);

  return { data, loading, refresh };
}
