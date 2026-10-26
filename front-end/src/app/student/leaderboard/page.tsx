'use client';

import { useState, useEffect, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Trophy,
  Flame,
  BookOpen,
  Loader2,
  Crown,
  Medal,
  Sparkles,
  Target,
  Users,
} from 'lucide-react';
import { StudentShell } from '@/components/student/StudentShell';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatarInitials: string;
  xp: number;
  streak: number;
  wordsLearned: number;
  accuracy: number;
}

interface Classroom {
  id: string;
  name: string;
}

type Period = 'week' | 'month' | 'all';

function hashColor(userId: string): string {
  const colors = [
    '#6366f1',
    '#8b5cf6',
    '#ec4899',
    '#f59e0b',
    '#10b981',
    '#3b82f6',
    '#ef4444',
    '#14b8a6',
  ];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function LeaderboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedClass = searchParams.get('class') ?? '';
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>(preselectedClass);
  const [period, setPeriod] = useState<Period>('week');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [classroomName, setClassroomName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error) return;
      if (!user) {
        router.replace('/auth');
        return;
      }
      setCurrentUserId(user.id);

      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('classroom:classrooms(id, name)')
        .eq('student_id', user.id);

      const classes: Classroom[] = [];
      for (const e of enrollments ?? []) {
        const cls = e.classroom as unknown as { id: string; name: string } | null;
        if (cls) classes.push(cls);
      }
      setClassrooms(classes);
      if (classes.length > 0 && !preselectedClass) setSelectedClassId(classes[0].id);
    };
    void init();
  }, [router, preselectedClass]);

  useEffect(() => {
    if (!selectedClassId) return;
    void loadLeaderboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClassId, period]);

  const loadLeaderboard = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/classrooms/${selectedClassId}/leaderboard?period=${period}`,
        { headers: { 'X-LingoPro-Request': '1' } },
      );
      const data = (await res.json()) as {
        success: boolean;
        data?: LeaderboardEntry[];
        classroomName?: string;
      };
      if (data.success) {
        setEntries(data.data ?? []);
        setClassroomName(data.classroomName ?? '');
      }
    } catch {
      // non-fatal
    } finally {
      setIsLoading(false);
    }
  };

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);
  const podiumOrder =
    top3.length >= 3
      ? [top3[1], top3[0], top3[2]] // 2nd | 1st | 3rd
      : top3;

  const myEntry = entries.find((e) => e.userId === currentUserId);

  const periodLabels: Record<Period, string> = {
    week: 'Tuần này',
    month: 'Tháng này',
    all: 'Tất cả',
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-10">
      {/* Hero & Filter Controls */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-sm">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-amber-500/10 blur-3xl"
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200/70 dark:border-amber-800/60 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-300 mb-2">
              <Sparkles className="h-3.5 w-3.5" /> Đấu trường học thuật
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
              <Trophy className="h-7 w-7 text-amber-500 shrink-0" />
              Bảng Xếp Hạng
            </h1>
            {classroomName ? (
              <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-indigo-500" /> Lớp: <span className="font-bold text-slate-700 dark:text-slate-200">{classroomName}</span>
              </p>
            ) : (
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Đua top XP, giữ chuỗi Streak và chinh phục từ vựng cùng đồng đội.
              </p>
            )}
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {classrooms.length > 1 && (
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                aria-label="Chọn lớp học"
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {classrooms.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
            <div
              role="tablist"
              aria-label="Chu kỳ xếp hạng"
              className="inline-flex rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-800/80 p-1"
            >
              {(['week', 'month', 'all'] as Period[]).map((p) => {
                const active = period === p;
                return (
                  <button
                    key={p}
                    role="tab"
                    aria-selected={active}
                    onClick={() => setPeriod(p)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                      active
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {periodLabels[p]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* My Rank Spotlight Strip */}
        {myEntry && !isLoading && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-indigo-200/70 dark:border-indigo-800/50 bg-indigo-50/70 dark:bg-indigo-950/30 px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-xs font-black text-white shadow-sm">
                #{myEntry.rank}
              </span>
              <div>
                <p className="text-xs font-extrabold text-slate-900 dark:text-white">
                  Thứ hạng hiện tại của bạn
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                   Đã thuộc {myEntry.wordsLearned} từ · Chuỗi {myEntry.streak} ngày
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {myEntry.accuracy > 0 && (
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                    {myEntry.accuracy}%
                  </p>
                  <p className="text-[10px] font-semibold uppercase text-slate-400">Chính xác</p>
                </div>
              )}
              <div className="rounded-xl bg-white dark:bg-slate-900 border border-indigo-200/60 dark:border-indigo-800/50 px-3 py-1.5 text-right">
                <span className="text-sm font-black text-amber-600 dark:text-amber-400 tabular-nums">
                  {myEntry.xp.toLocaleString()} XP
                </span>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Main Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 py-20 gap-3">
          <Loader2 className="h-8 w-8 text-indigo-600 dark:text-indigo-400 animate-spin" />
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Đang tải bảng xếp hạng...
          </p>
        </div>
      ) : entries.length === 0 ? (
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center shadow-sm">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
            <Trophy className="h-7 w-7 text-slate-400 dark:text-slate-500" />
          </div>
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
            Chưa có dữ liệu xếp hạng
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Hãy hoàn thành bài ôn tập hoặc trò chơi đầu tiên để ghi danh lên bảng vàng!
          </p>
        </div>
      ) : (
        <>
          {/* Top 3 Olympus Podium */}
          {top3.length >= 2 && (
            <section
              aria-label="Top 3 học viên dẫn đầu"
              className="grid grid-cols-3 items-end gap-2.5 sm:gap-4 pt-2"
            >
              {podiumOrder.map((entry, podiumIdx) => {
                if (!entry) return null;
                const isFirst = entry.rank === 1;
                const isSecond = entry.rank === 2;
                const isMe = entry.userId === currentUserId;

                const badgeTone = isFirst
                  ? 'bg-gradient-to-b from-amber-400 to-amber-500 text-slate-950 border-amber-300 shadow-amber-500/20'
                  : isSecond
                    ? 'bg-gradient-to-b from-slate-300 to-slate-400 text-slate-900 border-slate-200'
                    : 'bg-gradient-to-b from-amber-700 to-amber-800 text-amber-50 border-amber-600';

                const cardTone = isFirst
                  ? 'border-amber-300/80 dark:border-amber-500/40 bg-gradient-to-b from-amber-50/90 via-white to-white dark:from-amber-950/30 dark:via-slate-900 dark:to-slate-900 shadow-md'
                  : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm';

                return (
                  <div
                    key={entry.userId}
                    className={`relative flex flex-col items-center rounded-3xl border p-3.5 sm:p-5 text-center transition-all ${cardTone} ${
                      isFirst ? ' sm:-translate-y-2 pb-6' : ''
                    } ${podiumIdx === 1 ? 'order-2' : podiumIdx === 0 ? 'order-1' : 'order-3'}`}
                  >
                    {isFirst ? (
                      <div className="mb-1.5 inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-950/80 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300">
                        <Crown className="h-3.5 w-3.5 text-amber-500" /> Quán quân
                      </div>
                    ) : (
                      <div className="mb-1.5 inline-flex items-center gap-1 text-[11px] font-extrabold text-slate-400 dark:text-slate-500">
                        <Medal className="h-3.5 w-3.5" /> Hạng #{entry.rank}
                      </div>
                    )}

                    {/* Avatar */}
                    <div className="relative mb-2.5">
                      <div
                        className={`${
                          isFirst ? 'h-16 w-16 text-lg' : 'h-12 w-12 text-sm'
                        } rounded-2xl flex items-center justify-center font-black text-white shadow-md ring-2 ${
                          isMe
                            ? 'ring-indigo-500 dark:ring-indigo-400'
                            : 'ring-white dark:ring-slate-800'
                        }`}
                        style={{ backgroundColor: hashColor(entry.userId) }}
                      >
                        {entry.avatarInitials}
                      </div>
                      <span
                        className={`-bottom-2 left-1/2 -translate-x-1/2 absolute inline-flex h-5 min-w-5 items-center justify-center rounded-full border px-1.5 text-[10px] font-black shadow-sm ${badgeTone}`}
                      >
                        #{entry.rank}
                      </span>
                    </div>

                    {/* Name */}
                    <p
                      className={`mt-1 text-xs sm:text-sm font-extrabold truncate max-w-full ${
                        isMe
                          ? 'text-indigo-600 dark:text-indigo-400'
                          : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {entry.name}
                    </p>

                    {/* XP */}
                    <p className="mt-0.5 text-xs sm:text-sm font-black text-amber-600 dark:text-amber-400 tabular-nums">
                      {entry.xp.toLocaleString()} <span className="text-[10px] font-bold">XP</span>
                    </p>

                    {/* Sub metrics */}
                    <div className="mt-2.5 flex flex-wrap items-center justify-center gap-2 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                      <span className="inline-flex items-center gap-0.5">
                        <BookOpen className="h-3 w-3 text-indigo-500" /> {entry.wordsLearned}
                      </span>
                      {entry.streak > 0 && (
                        <span className="inline-flex items-center gap-0.5 text-orange-600 dark:text-orange-400">
                          <Flame className="h-3 w-3 fill-current" /> {entry.streak}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </section>
          )}

          {/* Rank 4+ League Table */}
          {rest.length > 0 && (
            <section className="overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              <div className="border-b border-slate-100 dark:border-slate-800 px-5 py-3 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                <span>Bảng xếp hạng chi tiết</span>
                <span>Điểm kinh nghiệm (XP)</span>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {rest.map((entry) => {
                  const isMe = entry.userId === currentUserId;
                  return (
                    <div
                      key={entry.userId}
                      className={`flex items-center gap-3.5 px-4 sm:px-5 py-3.5 transition-colors ${
                        isMe
                          ? 'bg-indigo-50/70 dark:bg-indigo-950/30'
                          : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <span className="w-7 text-center text-xs font-black text-slate-400 dark:text-slate-500 tabular-nums">
                        #{entry.rank}
                      </span>
                      <div
                        className="h-10 w-10 rounded-xl flex items-center justify-center font-black text-white text-xs shrink-0 shadow-xs"
                        style={{ backgroundColor: hashColor(entry.userId) }}
                      >
                        {entry.avatarInitials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm font-bold truncate ${
                            isMe
                              ? 'text-indigo-600 dark:text-indigo-400'
                              : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          {entry.name}
                          {isMe && (
                            <span className="ml-1.5 rounded-md bg-indigo-100 dark:bg-indigo-900/60 px-1.5 py-0.5 text-[10px] font-extrabold text-indigo-700 dark:text-indigo-300">
                              Bạn
                            </span>
                          )}
                        </p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-3 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                          <span className="inline-flex items-center gap-1">
                            <BookOpen className="h-3 w-3 text-indigo-500" /> {entry.wordsLearned} từ
                          </span>
                          {entry.streak > 0 && (
                            <span className="inline-flex items-center gap-1 text-orange-600 dark:text-orange-400 font-semibold">
                              <Flame className="h-3 w-3 fill-current" /> {entry.streak} ngày
                            </span>
                          )}
                          {entry.accuracy > 0 && (
                            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                              <Target className="h-3 w-3" /> {entry.accuracy}%
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-black text-amber-600 dark:text-amber-400 tabular-nums">
                          {entry.xp.toLocaleString()}
                        </p>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          XP
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <p className="text-center text-xs text-slate-400 dark:text-slate-500">
            Điểm XP và thứ hạng được cập nhật theo thời gian thực sau mỗi bài luyện tập.
          </p>
        </>
      )}
    </div>
  );
}

export default function LeaderboardPage() {
  return (
    <StudentShell title="Bảng xếp hạng">
      <Suspense
        fallback={
          <div className="flex min-h-[60vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
          </div>
        }
      >
        <LeaderboardContent />
      </Suspense>
    </StudentShell>
  );
}
