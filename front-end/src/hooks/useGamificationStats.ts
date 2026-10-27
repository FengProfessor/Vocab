import { useAuth } from '@/features/auth/AuthProvider';

/**
 * Streak and XP counters of the signed-in learner, defaulting to zero instead of invented demo values.
 */
export function useGamificationStats(): { streakDays: number; totalXp: number } {
  const { streakDays, totalXp } = useAuth();
  return {
    streakDays,
    totalXp,
  };
}
