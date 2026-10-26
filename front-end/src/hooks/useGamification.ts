'use client';
import { useCallback } from 'react';
import { useGamificationQuery } from '@/features/auth/queries';
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
  const { data: rawData, isLoading, refetch } = useGamificationQuery(userId);
  const data = rawData ? normalizeGamification(rawData) : DEFAULT;

  const refresh = useCallback(async () => {
    if (!userId) return;
    await refetch();
  }, [userId, refetch]);

  return { data, loading: Boolean(userId) && isLoading, refresh };
}
