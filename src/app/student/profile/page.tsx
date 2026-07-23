'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  BarChart3,
  Bell,
  BookOpen,
  CheckCircle2,
  Copy,
  Crown,
  Flame,
  Loader2,
  Save,
  Target,
} from 'lucide-react';
import { toast } from 'sonner';
import { StudentShell } from '@/components/student/StudentShell';
import { StreakCounter } from '@/components/gamification/StreakCounter';
import { XpBadge } from '@/components/gamification/XpBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useGamification } from '@/hooks/useGamification';
import { requestForToken } from '@/lib/firebase';
import { markPushDeviceRegistered } from '@/lib/push-device-state';
import { xpToLevel } from '@/lib/gamification';
import { supabase, type Profile } from '@/lib/supabase';

type StudentProfile = Profile & {
  telegram_id?: string | null;
};

interface DayActivity {
  date: string;
  count: number;
}

interface WeakWord {
  word_id: string;
  word: string;
  translation: string;
  review_count: number;
  level: number;
}

interface StatsData {
  wordStats: { total: number; levelCounts: number[]; avgStability: number; wordsDue: number };
  dailyActivity: DayActivity[];
  quizHistory: { accuracy: number; score: number; total: number; created_at: string }[];
  studyStreak: number;
  avgAccuracy: number;
  bestScore: number;
  weakWords: WeakWord[];
  gamification: { totalXp: number; streak: number; todayXp: number } | null;
}

const LEVEL_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#8b5cf6'];
const LEVEL_LABELS = ['L1', 'L2', 'L3', 'L4', 'L5', 'L6'];

function heatColor(count: number): string {
  if (count === 0) return 'bg-slate-200';
  if (count <= 2) return 'bg-green-200';
  if (count <= 5) return 'bg-green-400';
  return 'bg-green-600';
}

function fmtDay(isoDate: string): string {
  return isoDate.slice(8) + '/' + isoDate.slice(5, 7);
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEnablingPush, setIsEnablingPush] = useState(false);
  const [isCopyingToken, setIsCopyingToken] = useState(false);
  const [tokenCopied, setTokenCopied] = useState(false);

  const [fullName, setFullName] = useState('');
  const [dailyGoal, setDailyGoal] = useState(30);
  const [notificationHour, setNotificationHour] = useState(8);

  const router = useRouter();
  const { data: gamification } = useGamification(profile?.id ?? null);

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push('/auth');
        return;
      }

      const statsPromise = fetch('/api/student/stats', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
        .then((response) => response.json())
        .catch(() => null);

      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      const statsResponse = await statsPromise;

      if (prof) {
        const nextProfile = prof as StudentProfile;
        setProfile(nextProfile);
        setFullName(nextProfile.full_name ?? '');
        setDailyGoal(nextProfile.daily_goal ?? 30);
        setNotificationHour(nextProfile.notification_hour ?? 8);
      }

      if (statsResponse?.success) {
        setStats(statsResponse.data as StatsData);
      }

      setIsLoading(false);
    };

    void checkAuth();
  }, [router]);

  const handleSave = async () => {
    if (!profile) return;
    setIsSaving(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Chưa đăng nhập');

      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          full_name: fullName,
          daily_goal: dailyGoal,
          notification_hour: notificationHour,
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
        setProfile((prev) => ({ ...(prev ?? {}), ...result.data } as StudentProfile));
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
      } = await supabase.auth.getSession();
      const jwt = session?.access_token;
      if (!jwt) throw new Error('Chưa đăng nhập');

      let token = jwt;
      let isLongLived = false;

      try {
        const res = await fetch('/api/extension-token', {
          method: 'POST',
          headers: { Authorization: `Bearer ${jwt}` },
        });
        const result = (await res.json()) as { success?: boolean; token?: string };
        if (result.success && typeof result.token === 'string') {
          token = result.token;
          isLongLived = true;
        }
      } catch {
        // Fallback access token
      }

      await navigator.clipboard.writeText(token);
      setTokenCopied(true);
      toast.success(
        isLongLived
          ? 'Đã copy token extension.'
          : 'Đã copy token tạm. Nếu 401, copy lại.',
      );
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
      } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Chưa đăng nhập');

      const fcmToken = await requestForToken();
      if (!fcmToken) throw new Error('Không lấy được mã thiết bị');

      const res = await fetch('/api/push/fcm-register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
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

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-muted/40">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const initials = (profile?.full_name ?? profile?.email ?? 'U')
    .split(' ')
    .map((word) => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const level = xpToLevel(gamification.total_xp);
  const isPaid = Boolean(profile?.plan && profile.plan !== 'free');

  const statsWeeks: DayActivity[][] = [];
  if (stats) {
    for (let index = 0; index < 30; index += 7) {
      statsWeeks.push(stats.dailyActivity.slice(index, index + 7));
    }
  }

  return (
    <StudentShell title="Hồ sơ">
      <div className="mx-auto max-w-2xl space-y-3">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-base font-black text-primary-foreground shadow">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-base font-black text-foreground">
              {profile?.full_name || 'Chưa đặt tên'}
            </h2>
            <p className="truncate text-[11px] font-medium text-muted-foreground">
              {profile?.email}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-1">
              <Badge variant="outline" className="px-1.5 py-0 text-[10px] font-bold">
                {profile?.role === 'teacher' ? 'GV' : 'HS'}
              </Badge>
              <Badge className="bg-amber-500 px-1.5 py-0 text-[10px] font-bold text-white">
                Lv {level}
              </Badge>
              {isPaid ? (
                <Badge className="bg-violet-600 px-1.5 py-0 text-[10px] font-bold capitalize text-white">
                  {profile?.plan}
                </Badge>
              ) : (
                <Badge variant="outline" className="px-1.5 py-0 text-[10px] font-bold text-muted-foreground">
                  Free
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Pro */}
        <Link
          href="/upgrade"
          className="flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50/80 px-3 py-2 transition hover:border-violet-300"
        >
          <Crown className="h-4 w-4 shrink-0 text-violet-600" />
          <span className="min-w-0 flex-1 text-xs font-bold text-violet-900">
            {isPaid ? 'Quản lý gói Pro' : 'Nâng cấp Pro · AI không giới hạn'}
          </span>
          <span className="text-xs font-black text-violet-600">→</span>
        </Link>

        {/* XP + Streak */}
        <div className="grid grid-cols-2 gap-2">
          <XpBadge totalXp={gamification.total_xp} variant="detailed" />
          <StreakCounter
            streak={gamification.current_streak}
            lastActiveDate={gamification.last_active_date}
            variant="detailed"
          />
        </div>

        {/* Stats */}
        <section id="stats" className="space-y-2.5 rounded-xl border bg-background p-3 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <h3 className="flex items-center gap-1.5 text-sm font-black">
              <BarChart3 className="h-4 w-4 text-primary" />
              Thống kê
            </h3>
            {stats && (
              <span className="text-[10px] font-semibold text-muted-foreground">30 ngày</span>
            )}
          </div>

          {!stats ? (
            <p className="text-xs text-muted-foreground">Chưa tải được thống kê.</p>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  {
                    icon: <BookOpen className="h-3.5 w-3.5 text-blue-500" />,
                    label: 'Từ',
                    value: String(stats.wordStats.total),
                  },
                  {
                    icon: <AlertCircle className="h-3.5 w-3.5 text-amber-500" />,
                    label: 'Due',
                    value: String(stats.wordStats.wordsDue),
                  },
                  {
                    icon: <Target className="h-3.5 w-3.5 text-green-500" />,
                    label: 'Quiz',
                    value: `${stats.avgAccuracy}%`,
                  },
                ].map((card) => (
                  <div
                    key={card.label}
                    className="rounded-lg border bg-muted/30 px-2 py-2 text-center"
                  >
                    <div className="mb-0.5 flex justify-center">{card.icon}</div>
                    <div className="text-base font-black tabular-nums">{card.value}</div>
                    <div className="text-[10px] font-semibold text-muted-foreground">
                      {card.label}
                    </div>
                  </div>
                ))}
              </div>

              {statsWeeks.length > 0 && (
                <div className="space-y-1.5">
                  <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                    <Flame className="h-3 w-3 text-orange-500" />
                    Hoạt động
                  </p>
                  <div className="space-y-1">
                    {statsWeeks.map((week, weekIndex) => (
                      <div key={weekIndex} className="flex gap-1">
                        {week.map((day) => (
                          <div
                            key={day.date}
                            title={`${fmtDay(day.date)}: ${day.count} từ`}
                            className={`h-4 flex-1 rounded-sm ${heatColor(day.count)}`}
                          />
                        ))}
                        {week.length < 7 &&
                          Array.from({ length: 7 - week.length }).map((_, padIndex) => (
                            <div key={`pad-${padIndex}`} className="h-4 flex-1" />
                          ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  SRS
                </p>
                {LEVEL_LABELS.map((label, index) => {
                  const count = stats.wordStats.levelCounts[index] ?? 0;
                  const pct =
                    stats.wordStats.total > 0
                      ? Math.round((count / stats.wordStats.total) * 100)
                      : 0;
                  return (
                    <div key={label} className="flex items-center gap-2">
                      <span
                        className="w-6 text-[10px] font-bold"
                        style={{ color: LEVEL_COLORS[index] }}
                      >
                        {label}
                      </span>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: LEVEL_COLORS[index],
                          }}
                        />
                      </div>
                      <span className="w-10 text-right text-[10px] tabular-nums text-muted-foreground">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>

              {stats.weakWords.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                    Từ yếu
                  </p>
                  <div className="space-y-1">
                    {stats.weakWords.slice(0, 5).map((word, index) => (
                      <div
                        key={word.word_id}
                        className="flex items-center gap-2 rounded-lg border bg-muted/20 px-2 py-1.5"
                      >
                        <span className="w-3 text-[10px] font-bold text-muted-foreground">
                          {index + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <span className="truncate text-xs font-semibold">{word.word || word.word_id}</span>
                          {word.translation && (
                            <span className="ml-1 truncate text-[10px] text-muted-foreground">
                              {word.translation}
                            </span>
                          )}
                        </div>
                        <span
                          className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold"
                          style={{
                            backgroundColor: `${LEVEL_COLORS[Math.max(0, word.level - 1)]}33`,
                            color: LEVEL_COLORS[Math.max(0, word.level - 1)],
                          }}
                        >
                          L{word.level}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </section>

        {/* Settings gộp */}
        <section className="space-y-3 rounded-xl border bg-background p-3 shadow-sm">
          <h3 className="text-sm font-black">Cài đặt</h3>

          <div className="space-y-1.5">
            <Label htmlFor="full-name" className="text-xs font-bold">
              Họ tên
            </Label>
            <Input
              id="full-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              maxLength={50}
              placeholder="Nhập họ tên…"
              className="h-9 text-sm font-semibold"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="daily-goal" className="text-xs font-bold">
                Mục tiêu ngày
              </Label>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-black text-primary">
                {dailyGoal} phút
              </span>
            </div>
            <input
              id="daily-goal"
              type="range"
              min={5}
              max={50}
              step={5}
              value={dailyGoal}
              onChange={(e) => setDailyGoal(Number(e.target.value))}
              className="w-full cursor-pointer accent-primary"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notification-hour" className="text-xs font-bold">
              Giờ nhắc
            </Label>
            <select
              id="notification-hour"
              value={notificationHour}
              onChange={(e) => setNotificationHour(Number(e.target.value))}
              className="h-9 w-full cursor-pointer appearance-none rounded-lg border bg-background px-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {Array.from({ length: 17 }, (_, index) => index + 6).map((hour) => (
                <option key={hour} value={hour}>
                  {String(hour).padStart(2, '0')}:00
                </option>
              ))}
            </select>
          </div>

          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="h-10 w-full rounded-xl text-sm font-black"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Đang lưu…
              </>
            ) : (
              <>
                <Save className="mr-1.5 h-4 w-4" /> Lưu
              </>
            )}
          </Button>
        </section>

        {/* Extension + push — gọn */}
        <section className="space-y-2 rounded-xl border bg-background p-3 shadow-sm">
          <h3 className="text-sm font-black">Thiết bị</h3>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              onClick={handleCopyExtensionToken}
              disabled={isCopyingToken}
              className="h-8 text-xs font-bold"
            >
              {isCopyingToken ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : tokenCopied ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              {tokenCopied ? 'Đã copy' : 'Copy token extension'}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleEnablePush}
              disabled={isEnablingPush}
              className="h-8 text-xs font-bold"
            >
              {isEnablingPush ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Bell className="h-3.5 w-3.5" />
              )}
              Bật thông báo
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Token dán vào Chrome extension · thông báo nhắc ôn trên máy này
          </p>
        </section>
      </div>
    </StudentShell>
  );
}
