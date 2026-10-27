import { UserRole } from '@/types/enums';
import type { Profile, UserGamification } from '@/features/auth/types';
import type { DotNetAuthTokensDto } from '@/features/auth/api';

export function normalizeRole(
  role?: UserRole | 'student' | 'teacher' | string,
): UserRole.Student | UserRole.Teacher {
  return String(role ?? UserRole.Student).toLowerCase() === 'teacher'
    ? UserRole.Teacher
    : UserRole.Student;
}

export function normalizePlan(plan?: string | number): 'free' | 'pro' | 'vip' {
  const raw = String(plan ?? 'free').toLowerCase();
  if (raw === 'pro' || raw === '1') return 'pro';
  if (raw === 'vip' || raw === '2') return 'vip';
  return 'free';
}

export function normalizeLegacyRole(role?: string | number): 'teacher' | 'student' | 'admin' {
  const raw = String(role ?? 'student').toLowerCase();
  if (raw === 'teacher' || raw === '1') return 'teacher';
  if (raw === 'admin' || raw === '2') return 'admin';
  return 'student';
}

export function mapAuthDtoToLegacyProfile(dto: DotNetAuthTokensDto | null | undefined): Profile {
  const plan = normalizePlan(dto?.plan);
  return {
    id: dto?.id || dto?.userId || '',
    email: dto?.email || '',
    full_name: dto?.fullName || '',
    avatar_url: dto?.avatarUrl ?? undefined,
    role: normalizeLegacyRole(dto?.role) === 'teacher' ? 'teacher' : 'student',
    created_at: dto?.createdAt || new Date().toISOString(),
    daily_goal: dto?.dailyTargetMins ?? 15,
    notification_hour: dto?.notificationHour ?? 20,
    plan: plan === 'vip' ? 'premium' : plan,
    plan_expires_at: dto?.planExpiresAt ?? null,
    province: dto?.province ?? null,
    city: dto?.city ?? null,
  };
}

export function mapAuthDtoToGamification(
  dto: DotNetAuthTokensDto | null | undefined,
  fallbackUserId = '',
): UserGamification {
  return {
    user_id: dto?.id || dto?.userId || fallbackUserId,
    total_xp: dto?.totalXp ?? 0,
    current_streak: dto?.currentStreak ?? 0,
    longest_streak: dto?.longestStreak ?? dto?.currentStreak ?? 0,
    last_active_date: dto?.lastActiveDate ?? null,
    daily_goal: dto?.dailyTargetMins ?? 15,
    today_xp: dto?.todayXp ?? 0,
    today_date: dto?.todayDate ?? null,
  };
}
