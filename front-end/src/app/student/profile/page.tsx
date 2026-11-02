import { VocabApi } from '@/features/vocab/api';
import { authService } from '@/features/auth/session';

import { useEffect, useState } from 'react';
import Link from '@/shared/router/navigation';
import { useRouter } from '@/shared/router/navigation';
import {
  BarChart3,
  Bell,
  CheckCircle2,
  ChevronDown,
  Copy,
  Crown,
  LayoutGrid,
  Loader2,
  LogOut,
  Save,
  Settings,
} from 'lucide-react';
import { toast } from 'sonner';
import { StudentShell } from '@/components/student/StudentShell';
import { LearningAnalyticsPanel } from '@/components/student/LearningAnalyticsPanel';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { StreakCounter } from '@/components/gamification/StreakCounter';
import { XpBadge } from '@/components/gamification/XpBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useGamification } from '@/hooks/useGamification';
import { requestForToken } from '@/lib/firebase';
import { markPushDeviceRegistered } from '@/lib/push-device-state';
import {
  lastActiveFromActivity,
  resolveDisplayStreak,
  xpToLevel,
} from '@/lib/gamification';
import type { Profile } from '@/lib/supabase';
import { AuthApi } from '@/features/auth/api';
import { PROVINCES } from '@/lib/provinces';
import { useStudentContext } from '@/components/student/StudentProvider';
import {
  readLastProfileCache,
  writeDashboardProfileCache,
  readLastProfileStatsCache,
  writeProfileStatsCache,
  readLastDashboardSecondaryCache,
  readLastGamificationCache,
} from '@/lib/dashboard-snapshot-cache';
import { readLastWordSummaryCache } from '@/lib/word-summary-cache';

type StudentProfile = Profile & {
  telegram_id?: string | null;
};

interface DayActivity {
  date: string;
  count: number;
}

interface WeakWord {
  word_id?: string;
  word: string;
  translation?: string;
  meaning?: string;
  review_count?: number;
  level: number;
  stability?: number;
}

interface StatsData {
  wordStats: { total: number; levelCounts: number[]; avgStability: number; wordsDue: number };
  dailyActivity: DayActivity[];
  quizHistory: { accuracy: number; score: number; total: number; created_at: string; type?: string; date?: string }[];
  studyStreak: number;
  avgAccuracy: number;
  bestScore: number;
  weakWords: WeakWord[];
  skillScores?: {
    vocabScore?: number;
    grammarScore?: number;
    reflexScore?: number;
    readingScore?: number;
    listeningScore?: number;
  };
  retentionRate?: number;
  grammarDueCount?: number;
  gamification: { totalXp: number; streak: number; todayXp: number } | null;
}

/**
 * Normalizes both flat `mapVocabAnalyticsToStudentStats` payloads and legacy nested `StatsData`
 * objects so that `stats.wordStats.levelCounts`, `stats.dailyActivity`, `stats.weakWords`, and
 * `stats.quizHistory` are always guaranteed to be defined arrays/numbers.
 */
function normalizeStatsPayload(raw: unknown): StatsData | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const ws = (r.wordStats && typeof r.wordStats === 'object' ? r.wordStats : {}) as Record<string, unknown>;
  const wb = (r.wordBreakdown && typeof r.wordBreakdown === 'object' ? r.wordBreakdown : {}) as Record<string, unknown>;

  let levelCounts: number[] = [0, 0, 0, 0, 0, 0];
  if (Array.isArray(ws.levelCounts) && ws.levelCounts.length === 6) {
    levelCounts = ws.levelCounts.map((n) => Number(n) || 0);
  } else if (Array.isArray(r.levelCounts) && r.levelCounts.length === 6) {
    levelCounts = r.levelCounts.map((n) => Number(n) || 0);
  } else if (Object.keys(wb).length > 0) {
    levelCounts = [
      Number(wb.l1 ?? wb.level1 ?? 0),
      Number(wb.l2 ?? wb.level2 ?? 0),
      Number(wb.l3 ?? wb.level3 ?? 0),
      Number(wb.l4 ?? wb.level4 ?? 0),
      Number(wb.l5 ?? wb.level5 ?? 0),
      Number(wb.l6 ?? wb.level6 ?? 0),
    ];
  }

  const total = Number(ws.total ?? r.totalWords ?? r.total ?? levelCounts.reduce((a, b) => a + b, 0));
  const avgStability = Number(ws.avgStability ?? r.avgStability ?? r.avgStabilityDays ?? 0);
  const wordsDue = Number(ws.wordsDue ?? r.reviewDueCount ?? r.dueCount ?? r.dueForReview ?? 0);

  const dailyActivity: DayActivity[] = Array.isArray(r.dailyActivity)
    ? r.dailyActivity.map((item) => {
        const d = (item ?? {}) as Record<string, unknown>;
        return {
          date: String(d.date ?? d.day ?? ''),
          count: Number(d.count ?? d.words ?? 0),
        };
      })
    : [];

  const quizHistory = Array.isArray(r.quizHistory)
    ? r.quizHistory.map((item) => {
        const q = (item ?? {}) as Record<string, unknown>;
        const score = Number(q.score ?? 0);
        const totalQ = Number(q.total ?? q.totalQuestions ?? 10) || 10;
        return {
          accuracy: Number(q.accuracy ?? Math.round((score / totalQ) * 100)),
          score,
          total: totalQ,
          created_at: String(q.created_at ?? q.date ?? q.completedAt ?? new Date().toISOString()),
          type: String(q.type ?? q.quizType ?? 'vocabulary'),
          date: String(q.date ?? q.created_at ?? ''),
        };
      })
    : [];

  const weakWords: WeakWord[] = Array.isArray(r.weakWords)
    ? r.weakWords.map((item) => {
        const w = (item ?? {}) as Record<string, unknown>;
        return {
          word_id: String(w.word_id ?? w.id ?? w.word ?? ''),
          word: String(w.word ?? w.word_id ?? ''),
          translation: String(w.translation ?? w.meaning ?? ''),
          meaning: String(w.meaning ?? w.translation ?? ''),
          review_count: Number(w.review_count ?? w.reviewCount ?? 0),
          level: Number(w.level ?? 1),
          stability: typeof w.stability === 'number' ? w.stability : undefined,
        };
      })
    : [];

  const retentionRate =
    typeof r.retentionRate === 'number'
      ? r.retentionRate
      : typeof r.retentionRatePercent === 'number'
        ? r.retentionRatePercent
        : undefined;

  return {
    wordStats: {
      total,
      levelCounts,
      avgStability,
      wordsDue,
    },
    dailyActivity,
    quizHistory,
    studyStreak: Number(r.studyStreak ?? r.streak ?? 0),
    avgAccuracy: Number(r.avgAccuracy ?? r.accuracy ?? retentionRate ?? 0),
    bestScore: Number(r.bestScore ?? 0),
    weakWords,
    skillScores:
      r.skillScores && typeof r.skillScores === 'object'
        ? (r.skillScores as StatsData['skillScores'])
        : undefined,
    retentionRate,
    grammarDueCount: typeof r.grammarDueCount === 'number' ? r.grammarDueCount : undefined,
    gamification:
      r.gamification && typeof r.gamification === 'object'
        ? (r.gamification as StatsData['gamification'])
        : null,
  };
}

function resolveInitialStats(userId?: string | null): StatsData | null {
  const cached = normalizeStatsPayload(readLastProfileStatsCache(userId));
  if (cached) return cached;
  const wordSum = readLastWordSummaryCache();
  const sec = readLastDashboardSecondaryCache(userId);
  const gam = readLastGamificationCache();
  if (!wordSum && !sec && !gam) return null;
  return {
    wordStats: {
      total: wordSum?.total ?? 0,
      levelCounts:
        Array.isArray(wordSum?.levelCounts) && wordSum!.levelCounts!.length === 6
          ? wordSum!.levelCounts!
          : [0, 0, 0, 0, 0, 0],
      avgStability: 0,
      wordsDue: wordSum?.reviewDueCount ?? 0,
    },
    dailyActivity: (sec?.dailyActivity as unknown as DayActivity[]) ?? [],
    quizHistory: [],
    studyStreak: sec?.studyStreak ?? gam?.current_streak ?? 0,
    avgAccuracy: 0,
    bestScore: 0,
    weakWords: [],
    gamification: gam
      ? {
          totalXp: gam.total_xp ?? 0,
          streak: gam.current_streak ?? 0,
          todayXp: gam.today_xp ?? 0,
        }
      : null,
  };
}

export default function ProfilePage() {
  const studentCtx = useStudentContext();
  const initialProfile = (studentCtx?.profile ?? readLastProfileCache()) as StudentProfile | null;
  const [profile, setProfile] = useState<StudentProfile | null>(() => initialProfile);
  const [stats, setStats] = useState<StatsData | null>(() => resolveInitialStats(initialProfile?.id));
  const [isLoading, setIsLoading] = useState<boolean>(() => !initialProfile);
  const [isSaving, setIsSaving] = useState(false);
  const [isEnablingPush, setIsEnablingPush] = useState(false);
  const [isCopyingToken, setIsCopyingToken] = useState(false);
  const [tokenCopied, setTokenCopied] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [mobileSection, setMobileSection] = useState<'all' | 'analytics' | 'settings'>('all');

  const [fullName, setFullName] = useState(() => initialProfile?.full_name ?? '');
  const [dailyGoal, setDailyGoal] = useState(() => initialProfile?.daily_goal ?? 30);
  const [notificationHour, setNotificationHour] = useState(() => initialProfile?.notification_hour ?? 8);
  const [province, setProvince] = useState(() => initialProfile?.province ?? '');

  const router = useRouter();
  const { data: fallbackGamification } = useGamification(studentCtx ? null : (profile?.id ?? null));
  const gamification = studentCtx?.gamification ?? fallbackGamification;

  const displayStreak =
    typeof stats?.studyStreak === 'number'
      ? stats.studyStreak
      : resolveDisplayStreak({
          currentStreak: gamification.current_streak,
          lastActiveDate: gamification.last_active_date,
          dailyActivity: stats?.dailyActivity ?? null,
        });
  const displayLastActive =
    (stats?.dailyActivity ? lastActiveFromActivity(stats.dailyActivity) : null) ??
    gamification.last_active_date;

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { session },
          error,
        } = await authService.getSession();
        if (error) {
          setIsLoading(false);
          return;
        }
        if (!session?.user) {
          setIsLoading(false);
          router.replace('/auth');
          return;
        }

        const statsPromise = VocabApi.getStudentStats({
          headers: { 'X-LingoPro-Request': '1' },
        })
          .then((response) => response.json())
          .catch(() => null);

        const prof =
          studentCtx?.profile ??
          (await AuthApi.getLegacyProfile(session.user.id).catch(() => null));

        const statsResponse = await statsPromise;

        if (prof) {
          const nextProfile = prof as StudentProfile;
          setProfile(nextProfile);
          setFullName(nextProfile.full_name ?? '');
          setDailyGoal(nextProfile.daily_goal ?? 30);
          setNotificationHour(nextProfile.notification_hour ?? 8);
          setProvince(nextProfile.province ?? '');
          writeDashboardProfileCache(session.user.id, nextProfile);
        }

        if (statsResponse?.success && statsResponse.data) {
          const normalized = normalizeStatsPayload(statsResponse.data);
          if (normalized) {
            setStats(normalized);
            writeProfileStatsCache(session.user.id, normalized);
          }
        }
      } catch {
        // preserve cached Frame-0 state if offline
      } finally {
        setIsLoading(false);
      }
    };

    void checkAuth();
  }, [router, studentCtx?.profile]);

  const handleSave = async () => {
    if (!profile) return;
    setIsSaving(true);

    try {
      const {
        data: { session },
      } = await authService.getSession();
      if (!session?.user) throw new Error('Chưa đăng nhập');

      const res = await AuthApi.updateProfile({
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-LingoPro-Request': '1',
        },
        body: JSON.stringify({
          full_name: fullName,
          daily_goal: dailyGoal,
          notification_hour: notificationHour,
          province: province.trim() || null,
        }),
      });

      const result = (await res.json()) as {
        success: boolean;
        data?: StudentProfile;
        error?: string;
      };
      if (!res.ok || !result.success) {
        throw new Error(result.error ?? 'Lưu thất bại');
      }

      if (result.data) {
        setProfile((prev) => {
          const merged = { ...(prev ?? {}), ...result.data } as StudentProfile;
          writeDashboardProfileCache(session.user.id, merged);
          return merged;
        });
      }

      toast.success('Đã lưu.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi không xác định';
      toast.error(`Lưu thất bại: ${msg}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyExtensionToken = async () => {
    setIsCopyingToken(true);

    try {
      const {
        data: { session },
      } = await authService.getSession();
      if (!session?.user) throw new Error('Chưa đăng nhập');
      const res = await AuthApi.createExtensionToken({
        method: 'POST', headers: { 'X-LingoPro-Request': '1' },
      });
      const result = (await res.json()) as { success?: boolean; token?: string };
      if (!res.ok || !result.success || !result.token?.startsWith('lpext_')) {
        throw new Error('Không tạo được token extension. Thử lại sau.');
      }
      await navigator.clipboard.writeText(result.token);
      setTokenCopied(true);
      toast.success('Đã copy token extension.');
      window.setTimeout(() => setTokenCopied(false), 3000);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Không copy được token');
    } finally {
      setIsCopyingToken(false);
    }
  };

  const handleEnablePush = async () => {
    setIsEnablingPush(true);

    try {
      const {
        data: { session },
      } = await authService.getSession();
      if (!session?.user) throw new Error('Chưa đăng nhập');

      const fcmToken = await requestForToken();
      if (!fcmToken) throw new Error('Không lấy được mã thiết bị');

      const res = await AuthApi.fcmRegister({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-LingoPro-Request': '1',
        },
        body: JSON.stringify({ fcmToken }),
      });

      const result = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || !result.success) {
        throw new Error(result.error ?? 'Bật thông báo thất bại');
      }

      markPushDeviceRegistered();
      toast.success('Đã bật thông báo trên thiết bị này.');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Bật thông báo thất bại');
    } finally {
      setIsEnablingPush(false);
    }
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      const { error } = await authService.signOut();
      if (error) {
        toast.error(error.message);
        return;
      }
      router.replace('/auth');
    } finally {
      setIsSigningOut(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#F6F7FB] dark:bg-[#0D0F1E]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-[#7B67FF]" />
      </div>
    );
  }

  const initials =
    (profile?.full_name ?? profile?.email ?? 'U')
      .split(' ')
      .filter(Boolean)
      .map((word) => word[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'U';

  const level = xpToLevel(gamification.total_xp);
  const isPaid = Boolean(profile?.plan && profile.plan !== 'free');
  const safeLevelCounts = stats?.wordStats?.levelCounts ?? [0, 0, 0, 0, 0, 0];
  const safeTotalWords = stats?.wordStats?.total ?? 0;
  const safeWordsDue = stats?.wordStats?.wordsDue ?? 0;
  const safeAvgStability = stats?.wordStats?.avgStability ?? 0;
  const safeDailyActivity = Array.isArray(stats?.dailyActivity) ? stats.dailyActivity : [];
  const safeWeakWords = Array.isArray(stats?.weakWords) ? stats.weakWords : [];
  const safeQuizHistory = Array.isArray(stats?.quizHistory) ? stats.quizHistory : [];

  return (
    <StudentShell title="Hồ sơ & Phân tích">
      <div className="mx-auto max-w-4xl min-w-0 space-y-4 sm:space-y-5">
        {/* Header Profile Card */}
        <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 sm:gap-4 rounded-[18px] border border-slate-200/90 bg-white p-4 sm:p-[22px] shadow-xs dark:border-[#272C47] dark:bg-[#161A2E]">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="flex h-13 w-13 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-base sm:text-lg font-extrabold text-white shadow-sm shadow-indigo-500/20 dark:bg-[#7B67FF]">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-base sm:text-lg font-extrabold text-slate-900 dark:text-[#F2F3FB]">
                {profile?.full_name || 'Chưa đặt tên'}
              </h2>
              <p className="truncate text-xs font-medium text-slate-500 dark:text-[#A5AAC6]">
                {profile?.email}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <Badge
                  variant="outline"
                  className="border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-bold text-slate-700 dark:border-[#272C47] dark:bg-[#20253F] dark:text-[#F2F3FB]"
                >
                  {profile?.role === 'teacher' ? 'Giáo viên' : 'Học viên'}
                </Badge>
                <Badge className="bg-indigo-600 px-2 py-0.5 text-[11px] font-bold text-white dark:bg-[#7B67FF]">
                  Lv.{level}
                </Badge>
                {isPaid ? (
                  <Badge className="bg-emerald-600 px-2 py-0.5 text-[11px] font-bold capitalize text-white">
                    {profile?.plan}
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-bold text-slate-500 dark:border-[#272C47] dark:bg-[#20253F] dark:text-[#A5AAC6]"
                  >
                    Free
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <Link
            href="/upgrade"
            className="w-full lg:w-auto inline-flex items-center justify-between lg:justify-center gap-2 rounded-xl border-[1.5px] border-[#7B67FF] bg-indigo-50/60 px-4 py-2.5 text-xs sm:text-[13px] font-bold text-indigo-600 transition hover:bg-indigo-100/70 shrink-0 dark:bg-[#20253F] dark:text-[#B3A8FF] dark:hover:bg-[#272C47]"
          >
            <span className="inline-flex items-center gap-2">
              <Crown className="h-4 w-4 shrink-0" />
              <span>{isPaid ? 'Quản lý gói Pro' : 'Nâng cấp Pro · AI không giới hạn'}</span>
            </span>
            <span className="font-extrabold">→</span>
          </Link>
        </section>

        {/* Mobile Quick View Switcher (helps mobile users jump directly between Analytics & Account Settings) */}
        <nav
          aria-label="Chuyển nhanh khu vực hồ sơ trên di động"
          className="grid grid-cols-3 sm:hidden gap-1.5 rounded-2xl border border-slate-200/90 bg-white p-1.5 shadow-xs dark:border-[#272C47] dark:bg-[#161A2E]"
        >
          <button
            type="button"
            onClick={() => setMobileSection('all')}
            className={`inline-flex items-center justify-center gap-1.5 rounded-xl py-2 px-2 text-xs font-bold transition-all cursor-pointer ${
              mobileSection === 'all'
                ? 'bg-indigo-600 text-white shadow-xs dark:bg-[#7B67FF]'
                : 'text-slate-600 hover:text-slate-900 dark:text-[#A5AAC6] dark:hover:text-[#F2F3FB]'
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5 shrink-0" />
            <span>Tất cả</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileSection('analytics')}
            className={`inline-flex items-center justify-center gap-1.5 rounded-xl py-2 px-2 text-xs font-bold transition-all cursor-pointer ${
              mobileSection === 'analytics'
                ? 'bg-indigo-600 text-white shadow-xs dark:bg-[#7B67FF]'
                : 'text-slate-600 hover:text-slate-900 dark:text-[#A5AAC6] dark:hover:text-[#F2F3FB]'
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5 shrink-0" />
            <span>Phân tích</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileSection('settings')}
            className={`inline-flex items-center justify-center gap-1.5 rounded-xl py-2 px-2 text-xs font-bold transition-all cursor-pointer ${
              mobileSection === 'settings'
                ? 'bg-indigo-600 text-white shadow-xs dark:bg-[#7B67FF]'
                : 'text-slate-600 hover:text-slate-900 dark:text-[#A5AAC6] dark:hover:text-[#F2F3FB]'
            }`}
          >
            <Settings className="h-3.5 w-3.5 shrink-0" />
            <span>Cài đặt</span>
          </button>
        </nav>

        {/* XP + Streak (Fluid auto-fit grid so cards never crush at intermediate widths) */}
        <div
          className={`${
            mobileSection === 'settings' ? 'hidden sm:grid' : 'grid'
          } grid-cols-[repeat(auto-fit,minmax(min(100%,280px),1fr))] gap-3.5 sm:gap-4`}
        >
          <XpBadge totalXp={gamification.total_xp} variant="detailed" />
          <StreakCounter
            streak={displayStreak}
            lastActiveDate={displayLastActive}
            variant="detailed"
          />
        </div>

        {/* Learning Analytics (Unified FSRS & Multi-Skill Panel without duplicate wrapper) */}
        <div
          id="stats"
          className={mobileSection === 'settings' ? 'hidden sm:block' : 'block'}
        >
          {!stats ? (
            <section className="rounded-[18px] border border-slate-200/90 bg-white p-4 sm:p-[22px] text-xs font-medium text-slate-500 shadow-xs dark:border-[#272C47] dark:bg-[#161A2E] dark:text-[#A5AAC6]">
              Chưa tải được thống kê học tập.
            </section>
          ) : (
            <LearningAnalyticsPanel
              compact
              stats={{
                total: safeTotalWords,
                due: safeWordsDue,
                new: safeLevelCounts[0] ?? 0,
                learned: Math.max(0, safeTotalWords - (safeLevelCounts[0] ?? 0)),
              }}
              wordBreakdown={{
                l1: safeLevelCounts[0] ?? 0,
                l2: safeLevelCounts[1] ?? 0,
                l3: safeLevelCounts[2] ?? 0,
                l4: safeLevelCounts[3] ?? 0,
                l5: safeLevelCounts[4] ?? 0,
                l6: safeLevelCounts[5] ?? 0,
              }}
              avgStabilityDays={safeAvgStability}
              retentionRate={stats.retentionRate}
              grammarDue={stats.grammarDueCount}
              skillScores={
                stats.skillScores
                  ? {
                      vocabScore: Number(stats.skillScores.vocabScore ?? 0),
                      grammarScore: Number(stats.skillScores.grammarScore ?? 0),
                      reflexScore: Number(stats.skillScores.reflexScore ?? 0),
                      readingScore: Number(stats.skillScores.readingScore ?? 0),
                      listeningScore: Number(stats.skillScores.listeningScore ?? 0),
                    }
                  : undefined
              }
              dailyActivity={safeDailyActivity}
              quizTrend={
                safeQuizHistory.length > 0
                  ? safeQuizHistory.map((q) => ({
                      score: q.score,
                      max_score: q.total || 10,
                      completed_at: q.created_at || q.date || new Date().toISOString(),
                      quiz_type: q.type || 'vocabulary',
                    }))
                  : undefined
              }
              weakWords={safeWeakWords.map((w) => ({
                word: w.word || w.word_id || '',
                meaning: w.translation || w.meaning || '',
                level: w.level,
                stability:
                  typeof w.stability === 'number' && w.stability > 0
                    ? Number(w.stability.toFixed(1))
                    : Number((w.level <= 1 ? 1.0 : w.level * 1.8).toFixed(1)),
              }))}
              currentStreak={displayStreak}
              longestStreak={gamification.longest_streak}
              totalXp={gamification.total_xp}
              todayXp={gamification.today_xp}
              dailyGoal={gamification.daily_goal}
            />
          )}
        </div>

        {/* Settings & Devices wrapper (hidden on mobile only when user explicitly filters 'analytics') */}
        <div
          id="account-settings"
          className={`${
            mobileSection === 'analytics' ? 'hidden sm:block' : 'block'
          } space-y-4 sm:space-y-5`}
        >
          {/* Cài đặt Giao diện Sáng / Tối / Hệ thống */}
          <section className="space-y-3.5 rounded-[18px] border border-slate-200/90 bg-white p-4 sm:p-[22px] shadow-xs dark:border-[#272C47] dark:bg-[#161A2E]">
            <div>
              <h3 className="text-[15px] sm:text-[16px] font-bold text-slate-900 dark:text-[#F2F3FB]">
                Giao diện Hiển thị (Sáng / Tối)
              </h3>
              <p className="text-xs sm:text-[13px] font-medium text-slate-500 mt-0.5 dark:text-[#A5AAC6]">
                Tùy chỉnh chế độ màu sắc theo sở thích cá nhân hoặc đồng bộ tự động theo hệ thống thiết bị
              </p>
            </div>
            <ThemeToggle variant="cards" />
          </section>

          {/* Settings + Thiết bị (2-column grid on wide desktop) */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-5 items-start">
            {/* Cài đặt cá nhân */}
            <section className="xl:col-span-7 min-w-0 space-y-4 rounded-[18px] border border-slate-200/90 bg-white p-4 sm:p-[22px] shadow-xs dark:border-[#272C47] dark:bg-[#161A2E]">
              <div>
                <h3 className="text-[15px] sm:text-[16px] font-bold text-slate-900 dark:text-[#F2F3FB]">
                  Cài đặt tài khoản
                </h3>
                <p className="text-xs sm:text-[13px] font-medium text-slate-500 mt-0.5 dark:text-[#A5AAC6]">
                  Cập nhật thông tin hồ sơ, mục tiêu học tập và khung giờ nhắc ôn hàng ngày
                </p>
              </div>

              <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] gap-3.5">
                <div className="space-y-1.5 col-span-full">
                  <Label htmlFor="full-name" className="text-xs font-bold text-slate-700 dark:text-[#F2F3FB]">
                    Họ tên
                  </Label>
                  <Input
                    id="full-name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    maxLength={50}
                    placeholder="Nhập họ tên…"
                    className="h-11 rounded-xl border-slate-200 bg-slate-50/60 text-sm font-semibold dark:border-[#272C47] dark:bg-[#20253F] dark:text-[#F2F3FB]"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="notification-hour" className="text-xs font-bold text-slate-700 dark:text-[#F2F3FB]">
                    Giờ nhắc học
                  </Label>
                  <div className="relative">
                    <select
                      id="notification-hour"
                      value={notificationHour}
                      onChange={(e) => setNotificationHour(Number(e.target.value))}
                      className="h-11 w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-slate-50/60 pl-3.5 pr-9 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:border-[#272C47] dark:bg-[#20253F] dark:text-[#F2F3FB]"
                    >
                      {Array.from({ length: 17 }, (_, index) => index + 6).map((hour) => (
                        <option key={hour} value={hour}>
                          {String(hour).padStart(2, '0')}:00
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-[#A5AAC6]" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="province-select" className="text-xs font-bold text-slate-700 dark:text-[#F2F3FB]">
                    Tỉnh / Thành phố
                  </Label>
                  <div className="relative">
                    <select
                      id="province-select"
                      value={province}
                      onChange={(e) => setProvince(e.target.value)}
                      className="h-11 w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-slate-50/60 pl-3.5 pr-9 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:border-[#272C47] dark:bg-[#20253F] dark:text-[#F2F3FB]"
                    >
                      <option value="">-- Chưa chọn Tỉnh / Thành phố --</option>
                      {PROVINCES.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-[#A5AAC6]" />
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 rounded-xl border border-slate-200/80 bg-slate-50/60 p-3.5 dark:border-[#272C47] dark:bg-[#20253F]/60">
                <div className="flex items-center justify-between">
                  <Label htmlFor="daily-goal" className="text-xs font-bold text-slate-700 dark:text-[#F2F3FB]">
                    Mục tiêu ngày
                  </Label>
                  <span className="rounded-full bg-indigo-500/15 px-2.5 py-0.5 text-xs font-extrabold text-indigo-600 dark:bg-[#20253F] dark:text-[#B3A8FF]">
                    {dailyGoal} phút / ngày
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {[10, 15, 20, 30, 45].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setDailyGoal(preset)}
                      className={`h-8 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        dailyGoal === preset
                          ? 'bg-indigo-600 text-white dark:bg-[#7B67FF]'
                          : 'bg-white text-slate-600 border border-slate-200/80 hover:border-indigo-300 dark:bg-[#161A2E] dark:text-[#A5AAC6] dark:border-[#272C47]'
                      }`}
                    >
                      {preset}p
                    </button>
                  ))}
                </div>
                <input
                  id="daily-goal"
                  type="range"
                  min={5}
                  max={50}
                  step={5}
                  value={dailyGoal}
                  onChange={(e) => setDailyGoal(Number(e.target.value))}
                  className="w-full cursor-pointer accent-indigo-600 dark:accent-[#7B67FF]"
                />
              </div>

              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="h-11 w-full rounded-xl bg-indigo-600 text-sm font-bold text-white hover:bg-indigo-700 dark:bg-[#7B67FF] dark:hover:opacity-95"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Đang lưu…
                  </>
                ) : (
                  <>
                    <Save className="mr-1.5 h-4 w-4" /> Lưu thay đổi
                  </>
                )}
              </Button>
            </section>

            {/* Thiết bị & Tiện ích mở rộng */}
            <section className="xl:col-span-5 min-w-0 space-y-3.5 rounded-[18px] border border-slate-200/90 bg-white p-4 sm:p-[22px] shadow-xs dark:border-[#272C47] dark:bg-[#161A2E]">
              <div>
                <h3 className="text-[15px] sm:text-[16px] font-bold text-slate-900 dark:text-[#F2F3FB]">
                  Thiết bị &amp; Tiện ích
                </h3>
                <p className="text-xs sm:text-[13px] font-medium text-slate-500 mt-0.5 dark:text-[#A5AAC6]">
                  Kết nối Chrome Extension để lưu từ nhanh và bật thông báo đẩy nhắc ôn tập trên thiết bị này
                </p>
              </div>

              <div className="flex flex-col gap-2.5">
                <Button
                  type="button"
                  onClick={handleCopyExtensionToken}
                  disabled={isCopyingToken}
                  className="h-11 w-full justify-center rounded-xl bg-indigo-600 text-xs sm:text-[13px] font-bold text-white hover:bg-indigo-700 dark:bg-[#7B67FF] dark:hover:opacity-95"
                >
                  {isCopyingToken ? (
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  ) : tokenCopied ? (
                    <CheckCircle2 className="mr-1.5 h-4 w-4" />
                  ) : (
                    <Copy className="mr-1.5 h-4 w-4" />
                  )}
                  {tokenCopied ? 'Đã sao chép mã kết nối' : 'Copy token Chrome Extension'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleEnablePush}
                  disabled={isEnablingPush}
                  className="h-11 w-full justify-center rounded-xl border-[1.5px] border-[#7B67FF] bg-transparent text-xs sm:text-[13px] font-bold text-indigo-600 hover:bg-indigo-50/60 dark:text-[#B3A8FF] dark:hover:bg-[#20253F]"
                >
                  {isEnablingPush ? (
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  ) : (
                    <Bell className="mr-1.5 h-4 w-4" />
                  )}
                  Bật thông báo nhắc ôn
                </Button>
              </div>

              <p className="rounded-xl bg-slate-50 p-3 text-[11.5px] font-medium leading-relaxed text-slate-500 dark:bg-[#20253F] dark:text-[#A5AAC6]">
                Dán mã token vào tiện ích LingoPro trên trình duyệt để tra và lưu từ vựng trực tiếp khi đọc báo hoặc xem phụ đề.
              </p>

              <div className="pt-2 border-t border-slate-200/80 dark:border-[#272C47]">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className="h-11 w-full justify-center rounded-xl border-rose-200/80 bg-rose-50/50 text-xs sm:text-[13px] font-bold text-rose-600 hover:bg-rose-100/70 dark:border-[#272C47] dark:bg-[#2D1B2A]/60 dark:text-[#FF8FAA] dark:hover:bg-[#2D1B2A]"
                >
                  {isSigningOut ? (
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  ) : (
                    <LogOut className="mr-1.5 h-4 w-4" />
                  )}
                  Đăng xuất tài khoản
                </Button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </StudentShell>
  );
}
