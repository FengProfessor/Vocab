import { useAuthStore } from '@/stores/useAuthStore';

/**
 * Streak and XP counters of the signed-in learner, defaulting to zero instead of invented demo values.
 */
export function useGamificationStats(): { streakDays: number; totalXp: number } {
  const user = useAuthStore((state) => state.user);
  return {
    streakDays: user?.streakDays ?? 0,
    totalXp: user?.totalXp ?? 0,
  };
}
