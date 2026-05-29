'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { levelProgress } from '@/lib/gamification';
import {
  ChevronLeft, Loader2, BarChart3, Flame, Target, Trophy,
  BookOpen, AlertCircle, Zap, Star,
} from 'lucide-react';

interface DayActivity { date: string; count: number; }
interface QuizEntry { accuracy: number; score: number; total: number; created_at: string; }
interface WeakWord {
  word_id: string;
  word: string;
  translation: string;
  stability: number;
  difficulty: number;
  review_count: number;
  next_review_date: string;
  level: number;
}
interface GamificationInfo { totalXp: number; streak: number; todayXp: number; }

interface StatsData {
  wordStats: { total: number; levelCounts: number[]; avgStability: number; wordsDue: number };
  dailyActivity: DayActivity[];
  quizHistory: QuizEntry[];
  studyStreak: number;
  avgAccuracy: number;
  bestScore: number;
  weakWords: WeakWord[];
  gamification: GamificationInfo | null;
}

const LEVEL_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#8b5cf6'];
const LEVEL_LABELS = ['Lv1', 'Lv2', 'Lv3', 'Lv4', 'Lv5', 'Lv6'];

/** Heatmap color theo count */
function heatColor(count: number): string {
  if (count === 0) return 'bg-slate-800';
  if (count <= 2) return 'bg-green-900';
  if (count <= 5) return 'bg-green-700';
  return 'bg-green-500';
}

/** Format ngày dạng dd/MM */
function fmtDay(isoDate: string): string {
  return isoDate.slice(8) + '/' + isoDate.slice(5, 7);
}

export default function StudentStatsPage() {
  const router = useRouter();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/auth'); return; }
      const res = await fetch('/api/student/stats', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      }).then((r) => r.json()).catch(() => null);
      if (res?.success) setStats(res.data);
      setIsLoading(false);
    };
    load();
  }, [router]);

  if (isLoading) return (
    <main className="min-h-screen flex items-center justify-center bg-slate-900">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </main>
  );

  if (!stats) return (
    <main className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-400">
      Không tải được dữ liệu.
    </main>
  );

  const { wordStats, dailyActivity, quizHistory, studyStreak, avgAccuracy, bestScore, weakWords, gamification } = stats;

  // XP progress
  const xpInfo = gamification ? levelProgress(gamification.totalXp) : null;

  // Heatmap — chia 30 ngày thành 5 tuần (hàng), mỗi tuần 6 ngày (đơn giản)
  // Thực ra 30 ô xếp thành grid 5 cột x 6 hàng
  const weeks: DayActivity[][] = [];
  for (let i = 0; i < 30; i += 7) {
    weeks.push(dailyActivity.slice(i, i + 7));
  }

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 font-sans">
      <header className="sticky top-0 z-30 h-14 border-b border-slate-700 bg-slate-900/90 backdrop-blur flex items-center px-4 sm:px-6 gap-3">
        <Link
          href="/student"
          className="flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="h-4 w-4" /> Dashboard
        </Link>
        <span className="text-slate-600">/</span>
        <span className="font-bold flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          Thống kê học tập
        </span>
      </header>

      <div className="max-w-3xl mx-auto p-4 sm:p-8 space-y-6">

        {/* Overview cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              icon: <BookOpen className="h-5 w-5 text-blue-400" />,
              label: 'Tổng từ',
              value: wordStats.total,
              sub: null,
            },
            {
              icon: <AlertCircle className="h-5 w-5 text-amber-400" />,
              label: 'Due hôm nay',
              value: wordStats.wordsDue,
              sub: wordStats.wordsDue > 0 ? 'cần ôn' : 'đã ôn xong',
            },
            {
              icon: <Flame className="h-5 w-5 text-orange-500" />,
              label: 'Streak',
              value: `${studyStreak} ngày`,
              sub: null,
            },
            {
              icon: <Target className="h-5 w-5 text-green-400" />,
              label: 'Accuracy TB',
              value: `${avgAccuracy}%`,
              sub: `Best: ${bestScore}%`,
            },
          ].map((c) => (
            <div key={c.label} className="bg-slate-800 border border-slate-700 rounded-2xl p-4 shadow-sm text-center">
              <div className="flex justify-center mb-1">{c.icon}</div>
              <div className="text-2xl font-black">{c.value}</div>
              <div className="text-xs text-slate-400">{c.label}</div>
              {c.sub && <div className="text-xs text-slate-500 mt-0.5">{c.sub}</div>}
            </div>
          ))}
        </div>

        {/* XP Progress bar */}
        {xpInfo && (
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-400" />
                Cấp độ — Lv{xpInfo.level} {xpInfo.name}
              </h3>
              <span className="text-xs text-slate-400">
                {gamification!.totalXp} XP
                {gamification!.todayXp > 0 && (
                  <span className="ml-1 text-yellow-400">+{gamification!.todayXp} hôm nay</span>
                )}
              </span>
            </div>
            {!xpInfo.isMax ? (
              <>
                <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-500 to-amber-400 rounded-full transition-all duration-700"
                    style={{ width: `${xpInfo.pct}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1 text-xs text-slate-500">
                  <span>{xpInfo.current} XP</span>
                  <span>{xpInfo.next} XP đến Lv{xpInfo.level + 1}</span>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 text-amber-400 text-sm">
                <Trophy className="h-4 w-4" /> Cấp độ tối đa — Legend!
              </div>
            )}
          </div>
        )}

        {/* 30-day heatmap calendar */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 shadow-sm">
          <h3 className="font-bold mb-4 text-sm flex items-center gap-2">
            <Flame className="h-4 w-4 text-orange-400" />
            Hoạt động 30 ngày
          </h3>
          {/* Grid tuần: mỗi hàng = 1 tuần (7 ngày) */}
          <div className="space-y-1.5">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex gap-1.5">
                {week.map((day) => (
                  <div
                    key={day.date}
                    title={`${fmtDay(day.date)}: ${day.count} từ`}
                    className={`flex-1 h-7 rounded-sm ${heatColor(day.count)} transition-colors cursor-default`}
                  />
                ))}
                {/* Pad nếu tuần cuối ít hơn 7 ngày */}
                {week.length < 7 &&
                  Array.from({ length: 7 - week.length }).map((_, pi) => (
                    <div key={`pad-${pi}`} className="flex-1 h-7" />
                  ))
                }
              </div>
            ))}
          </div>
          {/* Legend */}
          <div className="flex items-center gap-2 mt-3 text-xs text-slate-500">
            <span>Ít</span>
            {['bg-slate-800', 'bg-green-900', 'bg-green-700', 'bg-green-500'].map((c) => (
              <div key={c} className={`w-4 h-4 rounded-sm ${c}`} />
            ))}
            <span>Nhiều</span>
          </div>
        </div>

        {/* SRS level distribution */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 shadow-sm">
          <h3 className="font-bold mb-4 text-sm flex items-center gap-2">
            <Star className="h-4 w-4 text-cyan-400" />
            Phân bổ cấp độ SRS
          </h3>
          <div className="space-y-2.5">
            {LEVEL_LABELS.map((label, i) => {
              const count = wordStats.levelCounts[i] ?? 0;
              const pct = wordStats.total > 0 ? Math.round((count / wordStats.total) * 100) : 0;
              return (
                <div key={label} className="flex items-center gap-3">
                  <span className="text-xs font-bold w-8" style={{ color: LEVEL_COLORS[i] }}>{label}</span>
                  <div className="flex-1 bg-slate-700 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, backgroundColor: LEVEL_COLORS[i] }}
                    />
                  </div>
                  <span className="text-xs text-slate-400 w-16 text-right">{count} ({pct}%)</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top 5 từ yếu nhất */}
        {weakWords.length > 0 && (
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 shadow-sm">
            <h3 className="font-bold mb-4 text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-400" />
              Top từ yếu nhất (cần ôn gấp)
            </h3>
            <div className="space-y-2">
              {weakWords.map((w, i) => (
                <div key={w.word_id} className="flex items-center gap-3 bg-slate-700/50 rounded-xl p-3">
                  <span className="text-xs font-bold text-slate-500 w-5">{i + 1}.</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{w.word || w.word_id}</div>
                    {w.translation && (
                      <div className="text-xs text-slate-400 truncate">{w.translation}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-bold"
                      style={{ backgroundColor: LEVEL_COLORS[Math.max(0, w.level - 1)] + '33', color: LEVEL_COLORS[Math.max(0, w.level - 1)] }}
                    >
                      Lv{w.level}
                    </span>
                    <span className="text-xs text-slate-500">{w.review_count} lần</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quiz accuracy trend */}
        {quizHistory.length > 0 && (
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 shadow-sm">
            <h3 className="font-bold mb-4 text-sm flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-400" />
              Accuracy 10 quiz gần nhất
            </h3>
            <div className="relative h-20">
              <svg
                viewBox={`0 0 ${quizHistory.length * 30} 64`}
                className="w-full h-full overflow-visible"
              >
                <polyline
                  points={quizHistory.map((q, i) => `${i * 30 + 15},${64 - (q.accuracy / 100) * 56}`).join(' ')}
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                {quizHistory.map((q, i) => (
                  <circle key={i} cx={i * 30 + 15} cy={64 - (q.accuracy / 100) * 56} r="4" fill="#22c55e">
                    <title>{q.accuracy}% — {new Date(q.created_at).toLocaleDateString('vi')}</title>
                  </circle>
                ))}
              </svg>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
