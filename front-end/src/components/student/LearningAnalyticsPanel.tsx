"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import {
  AlertTriangle,
  ArrowRight,
  Award,
  BarChart3,
  Brain,
  CheckCircle2,
  Flame,
  Layers,
  ShieldCheck,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";

export interface WordLevelBreakdown {
  l1: number;
  l2: number;
  l3: number;
  l4: number;
  l5: number;
  l6: number;
}

export interface WeakWordDiagnostic {
  word: string;
  meaning: string;
  level: number;
  stability: number;
}

export interface QuizAttemptPoint {
  score: number;
  max_score: number;
  completed_at: string;
  quiz_type: string;
}

export interface SkillRadarScores {
  vocabScore: number;
  grammarScore: number;
  reflexScore: number;
  readingScore: number;
  listeningScore: number;
}

export interface LearningAnalyticsPanelProps {
  stats: {
    total: number;
    due: number;
    new: number;
    learned: number;
  };
  wordBreakdown: WordLevelBreakdown;
  avgStabilityDays?: number | null;
  retentionRate?: number | null;
  skillScores?: SkillRadarScores | null;
  dailyActivity?: { date: string; count: number }[];
  weakWords?: WeakWordDiagnostic[];
  quizTrend?: QuizAttemptPoint[];
  currentStreak?: number;
  longestStreak?: number;
  totalXp?: number;
  todayXp?: number;
  dailyGoal?: number;
  grammarDue?: number;
  compact?: boolean;
}

const FSRS_LEVEL_META = [
  {
    key: "l1" as const,
    code: "L1",
    name: "Mầm non",
    interval: "1 ngày",
    barClass: "bg-slate-400 dark:bg-slate-500",
    badgeClass:
      "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/90 dark:text-slate-200 dark:border-slate-700",
  },
  {
    key: "l2" as const,
    code: "L2",
    name: "Chồi xanh",
    interval: "3 ngày",
    barClass: "bg-sky-500 dark:bg-sky-400",
    badgeClass:
      "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800/70",
  },
  {
    key: "l3" as const,
    code: "L3",
    name: "Đang nhớ",
    interval: "7 ngày",
    barClass: "bg-indigo-500 dark:bg-indigo-400",
    badgeClass:
      "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800/70",
  },
  {
    key: "l4" as const,
    code: "L4",
    name: "Vững vàng",
    interval: "14 ngày",
    barClass: "bg-violet-500 dark:bg-violet-400",
    badgeClass:
      "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-800/70",
  },
  {
    key: "l5" as const,
    code: "L5",
    name: "Thành thạo",
    interval: "30 ngày",
    barClass: "bg-emerald-500 dark:bg-emerald-400",
    badgeClass:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/70",
  },
  {
    key: "l6" as const,
    code: "L6",
    name: "Vĩnh cửu",
    interval: "90+ ngày",
    barClass: "bg-amber-500 dark:bg-amber-400",
    badgeClass:
      "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/70",
  },
];

export function LearningAnalyticsPanel({
  stats,
  wordBreakdown,
  avgStabilityDays = null,
  retentionRate = null,
  skillScores = null,
  dailyActivity = [],
  weakWords = [],
  quizTrend = [],
  currentStreak = 0,
  longestStreak = 0,
  totalXp = 0,
  todayXp = 0,
  dailyGoal = 30,
  grammarDue = 0,
  compact = false,
}: LearningAnalyticsPanelProps) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "trends" | "diagnostics"
  >("overview");

  const metrics = useMemo(() => {
    const totalWords =
      wordBreakdown.l1 +
      wordBreakdown.l2 +
      wordBreakdown.l3 +
      wordBreakdown.l4 +
      wordBreakdown.l5 +
      wordBreakdown.l6;
    const effectiveTotal = Math.max(totalWords, stats.total, 0);
    const masteredCount =
      wordBreakdown.l4 + wordBreakdown.l5 + wordBreakdown.l6;
    const consolidatingCount = wordBreakdown.l2 + wordBreakdown.l3;
    const masteryPct =
      effectiveTotal > 0
        ? Math.round((masteredCount / effectiveTotal) * 100)
        : 0;

    const weightedRetention =
      retentionRate !== null && retentionRate !== undefined
        ? Math.max(0, Math.min(100, Math.round(retentionRate)))
        : effectiveTotal > 0
          ? Math.min(
              99,
              Math.round(
                ((wordBreakdown.l1 * 62 +
                  wordBreakdown.l2 * 74 +
                  wordBreakdown.l3 * 83 +
                  wordBreakdown.l4 * 90 +
                  wordBreakdown.l5 * 95 +
                  wordBreakdown.l6 * 98) /
                  Math.max(1, totalWords || 1)) *
                  (stats.due > 20 ? 0.92 : 1)
              )
            )
          : 0;

    const validQuizzes = quizTrend.filter((q) => q.max_score > 0);
    const avgQuizPct =
      validQuizzes.length > 0
        ? Math.round(
            validQuizzes.reduce(
              (acc, q) => acc + (q.score / q.max_score) * 100,
              0
            ) / validQuizzes.length
          )
        : weightedRetention;

    const stabilityScore =
      avgStabilityDays !== null && avgStabilityDays !== undefined
        ? Number(Number(avgStabilityDays).toFixed(1))
        : effectiveTotal > 0
          ? Number(
              (
                (wordBreakdown.l1 * 1 +
                  wordBreakdown.l2 * 3 +
                  wordBreakdown.l3 * 7 +
                  wordBreakdown.l4 * 14 +
                  wordBreakdown.l5 * 30 +
                  wordBreakdown.l6 * 60) /
                Math.max(1, totalWords)
              ).toFixed(1)
            )
          : 0;

    const vocabScore =
      skillScores !== null && skillScores !== undefined
        ? Math.max(0, Math.min(100, Math.round(skillScores.vocabScore)))
        : effectiveTotal > 0
          ? Math.min(
              100,
              Math.round(
                Math.min(40, (effectiveTotal / 100) * 40) +
                  masteryPct * 0.35 +
                  weightedRetention * 0.25
              )
            )
          : 0;

    const grammarScore =
      skillScores !== null && skillScores !== undefined
        ? Math.max(0, Math.min(100, Math.round(skillScores.grammarScore)))
        : totalXp > 0
          ? Math.min(
              100,
              Math.round(
                Math.min(70, (totalXp / 50) * 1.2) + (grammarDue === 0 ? 15 : 0)
              )
            )
          : 0;

    const reflexScore =
      skillScores !== null && skillScores !== undefined
        ? Math.max(0, Math.min(100, Math.round(skillScores.reflexScore)))
        : validQuizzes.length > 0
          ? avgQuizPct
          : effectiveTotal > 0
            ? Math.min(
                100,
                Math.round(currentStreak * 5 + weightedRetention * 0.6)
              )
            : 0;

    const readingScore =
      skillScores !== null && skillScores !== undefined
        ? Math.max(0, Math.min(100, Math.round(skillScores.readingScore)))
        : Math.round(vocabScore * 0.6 + grammarScore * 0.4);

    const listeningScore =
      skillScores !== null && skillScores !== undefined
        ? Math.max(0, Math.min(100, Math.round(skillScores.listeningScore)))
        : Math.round((vocabScore * 0.55 + reflexScore * 0.45) * 0.95);

    const radarData = [
      { skill: "Từ vựng", score: vocabScore, fullMark: 100 },
      { skill: "Ngữ pháp", score: grammarScore, fullMark: 100 },
      { skill: "Phản xạ", score: reflexScore, fullMark: 100 },
      { skill: "Đọc hiểu", score: readingScore, fullMark: 100 },
      { skill: "Nghe hiểu", score: listeningScore, fullMark: 100 },
    ];

    const sortedSkills = [...radarData].sort((a, b) => b.score - a.score);
    const strongestSkill = sortedSkills[0]?.score > 0 ? sortedSkills[0] : null;
    const weakestSkills = sortedSkills.slice(-2).reverse();

    // Compute SVG polygon points for the 5-axis radar matching template.html (cx=150, cy=140, maxR=100)
    const cx = 150;
    const cy = 140;
    const maxR = 100;
    const angles = [-90, -18, 54, 126, 198].map((deg) => (deg * Math.PI) / 180);
    const radarPolygonPoints = radarData
      .map((d, i) => {
        const r = (Math.max(6, d.score) / 100) * maxR;
        const x = (cx + r * Math.cos(angles[i])).toFixed(1);
        const y = (cy + r * Math.sin(angles[i])).toFixed(1);
        return `${x},${y}`;
      })
      .join(" ");

    const trendData =
      validQuizzes.length > 0
        ? [...validQuizzes].slice(-12).map((q, idx) => {
            const d = new Date(q.completed_at);
            const label = Number.isNaN(d.getTime())
              ? `Lần ${idx + 1}`
              : `${d.getDate()}/${d.getMonth() + 1}`;
            return {
              name: label,
              accuracy: Math.round((q.score / q.max_score) * 100),
              target: 80,
            };
          })
        : dailyActivity.filter((a) => a.count > 0).length > 0
          ? dailyActivity.slice(-7).map((a) => {
              const d = new Date(a.date);
              const label = Number.isNaN(d.getTime())
                ? a.date
                : `${d.getDate()}/${d.getMonth() + 1}`;
              return {
                name: label,
                accuracy: weightedRetention,
                target: 80,
              };
            })
          : [];

    return {
      effectiveTotal,
      masteredCount,
      consolidatingCount,
      masteryPct,
      weightedRetention,
      avgQuizPct,
      stabilityScore,
      radarData,
      strongestSkill,
      weakestSkills,
      radarPolygonPoints,
      trendData,
    };
  }, [
    wordBreakdown,
    stats.total,
    stats.due,
    avgStabilityDays,
    retentionRate,
    skillScores,
    dailyActivity,
    quizTrend,
    totalXp,
    grammarDue,
    currentStreak,
  ]);

  const maxStreakRecord = Math.max(longestStreak, currentStreak, 1);
  const streakBarPct = Math.min(
    100,
    Math.max(
      currentStreak > 0 ? 8 : 0,
      Math.round((currentStreak / Math.max(25, maxStreakRecord)) * 100)
    )
  );

  return (
    <section
      id="phan-tich"
      aria-label="Phân tích dữ liệu học tập chuyên sâu"
      data-testid="learning-analytics-dashboard"
      className="rounded-[18px] border border-slate-200/90 dark:border-[#272C47] bg-white dark:bg-[#161A2E] p-4 sm:p-[22px] shadow-xs transition-colors flex flex-col gap-5"
    >
      {/* Top Header + Segmented Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-[20px] font-extrabold text-slate-900 dark:text-[#F2F3FB] tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-[#7B67FF] shrink-0" />
            <span>Phân tích dữ liệu học tập</span>
          </h2>
          <p className="text-xs sm:text-[14px] font-medium text-slate-500 dark:text-[#A5AAC6] mt-0.5">
            Đo độ bền trí nhớ, đa kỹ năng và điểm rơi ôn tập
          </p>
        </div>

        {/* Segmented Tab Pills */}
        <div
          role="tablist"
          aria-label="Phân tích dữ liệu học tập"
          className="inline-flex flex-wrap items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-[#20253F] self-start sm:self-auto"
        >
          {[
            { id: "overview" as const, label: "Trí nhớ & Kỹ năng", icon: Brain },
            { id: "trends" as const, label: "Xu hướng", icon: TrendingUp },
            {
              id: "diagnostics" as const,
              label: "Chẩn đoán",
              icon: Target,
              badge: weakWords.length > 0 ? weakWords.length : undefined,
            },
          ].map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveTab(tab.id)}
                data-testid={`analytics-tab-${tab.id}`}
                className={`inline-flex items-center gap-2 px-3.5 sm:px-4 h-9 sm:h-10 rounded-[9px] text-[13px] font-bold transition-all cursor-pointer ${
                  active
                    ? "bg-white dark:bg-[#161A2E] text-indigo-600 dark:text-[#B3A8FF] shadow-xs"
                    : "text-slate-600 dark:text-[#A5AAC6] hover:text-slate-900 dark:hover:text-[#F2F3FB]"
                }`}
              >
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span className="px-1.5 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-500 dark:bg-[#FF8FAA] text-white dark:text-[#161A2E] leading-none">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4 KPI Summary Cards (.k4) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI 1: Tỷ lệ nhớ */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-[#272C47] bg-slate-50/50 dark:bg-[#161A2E] p-4">
          <div className="flex items-center justify-between text-[13px] font-semibold text-slate-500 dark:text-[#A5AAC6]">
            <span>Tỷ lệ nhớ</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500 dark:text-[#3DD6A0] shrink-0" />
          </div>
          <div className="text-2xl sm:text-[30px] font-extrabold tabular-nums text-slate-900 dark:text-[#F2F3FB] my-1 leading-tight">
            {metrics.weightedRetention}%
          </div>
          <div className="text-[12.5px] font-bold text-emerald-600 dark:text-[#3DD6A0]">
            Mục tiêu ≥ 85%
          </div>
          <div className="mt-2.5 h-2 w-full rounded-full bg-slate-200/80 dark:bg-[#20253F] overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 dark:bg-[#3DD6A0] transition-all duration-500"
              style={{ width: `${Math.min(100, metrics.weightedRetention)}%` }}
            />
          </div>
        </div>

        {/* KPI 2: Độ bền trí nhớ */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-[#272C47] bg-slate-50/50 dark:bg-[#161A2E] p-4">
          <div className="flex items-center justify-between text-[13px] font-semibold text-slate-500 dark:text-[#A5AAC6]">
            <span>Độ bền trí nhớ</span>
            <Brain className="w-4 h-4 text-indigo-500 dark:text-[#7B67FF] shrink-0" />
          </div>
          <div className="text-2xl sm:text-[30px] font-extrabold tabular-nums text-slate-900 dark:text-[#F2F3FB] my-1 leading-tight">
            {metrics.stabilityScore} ngày
          </div>
          <div className="text-[12.5px] font-bold text-indigo-600 dark:text-[#B3A8FF]">
            Chuẩn 21 ngày
          </div>
          <div className="mt-2.5 h-2 w-full rounded-full bg-slate-200/80 dark:bg-[#20253F] overflow-hidden">
            <div
              className="h-full rounded-full bg-indigo-500 dark:bg-[#7B67FF] transition-all duration-500"
              style={{
                width: `${Math.min(100, Math.round((metrics.stabilityScore / 21) * 100))}%`,
              }}
            />
          </div>
        </div>

        {/* KPI 3: Từ vựng thành thạo */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-[#272C47] bg-slate-50/50 dark:bg-[#161A2E] p-4">
          <div className="flex items-center justify-between text-[13px] font-semibold text-slate-500 dark:text-[#A5AAC6]">
            <span>Từ vựng thành thạo</span>
            <Award className="w-4 h-4 text-violet-500 dark:text-[#B3A8FF] shrink-0" />
          </div>
          <div className="text-2xl sm:text-[30px] font-extrabold tabular-nums text-slate-900 dark:text-[#F2F3FB] my-1 leading-tight">
            {metrics.masteredCount}
            <span className="text-sm sm:text-base font-semibold text-slate-400 dark:text-[#A5AAC6]">
              {" "}
              / {metrics.effectiveTotal}
            </span>
          </div>
          <div className="text-[12.5px] font-bold text-indigo-600 dark:text-[#B3A8FF]">
            {metrics.masteryPct}% ở L4–L6
          </div>
          <div className="mt-2.5 h-2 w-full rounded-full bg-slate-200/80 dark:bg-[#20253F] overflow-hidden">
            <div
              className="h-full rounded-full bg-indigo-500 dark:bg-[#7B67FF] transition-all duration-500"
              style={{ width: `${Math.min(100, metrics.masteryPct)}%` }}
            />
          </div>
        </div>

        {/* KPI 4: Chuỗi ngày */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-[#272C47] bg-slate-50/50 dark:bg-[#161A2E] p-4">
          <div className="flex items-center justify-between text-[13px] font-semibold text-slate-500 dark:text-[#A5AAC6]">
            <span>Chuỗi ngày</span>
            <Flame className="w-4 h-4 text-amber-500 dark:text-[#FBA94C] shrink-0" />
          </div>
          <div className="text-2xl sm:text-[30px] font-extrabold tabular-nums text-slate-900 dark:text-[#F2F3FB] my-1 leading-tight">
            {currentStreak} ngày
          </div>
          <div className="text-[12.5px] font-bold text-amber-600 dark:text-[#FBA94C]">
            Kỷ lục {Math.max(longestStreak, currentStreak)} ngày
          </div>
          <div className="mt-2.5 h-2 w-full rounded-full bg-slate-200/80 dark:bg-[#20253F] overflow-hidden">
            <div
              className="h-full rounded-full bg-amber-500 dark:bg-[#FBA94C] transition-all duration-500"
              style={{
                width: `${
                  todayXp > 0
                    ? Math.min(100, Math.round((todayXp / Math.max(10, dailyGoal)) * 100))
                    : streakBarPct
                }%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* TAB 1: OVERVIEW (Insight Banner + Colored FSRS L1–L6 Pyramid + 5-Skill Radar) */}
      {activeTab === "overview" && (
        <div className="flex flex-col gap-5">
          {/* Summary Insight Strip (.ins) */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 px-4 sm:px-5 py-3.5 rounded-2xl bg-slate-50 dark:bg-[#20253F] border border-slate-200/80 dark:border-[#272C47] text-[13px] font-semibold text-slate-700 dark:text-[#F2F3FB]">
            <span className="font-bold">Tóm tắt:</span>
            {metrics.strongestSkill && (
              <span className="px-3 py-1 rounded-full text-[12.5px] font-bold bg-emerald-100/90 text-emerald-800 dark:bg-[#14352B] dark:text-[#3DD6A0]">
                Mạnh nhất: {metrics.strongestSkill.skill}{" "}
                {metrics.strongestSkill.score}
              </span>
            )}
            {metrics.weakestSkills.length > 0 && (
              <span className="px-3 py-1 rounded-full text-[12.5px] font-bold bg-rose-100/80 text-rose-700 dark:bg-[#2D1B2A] dark:text-[#FF8FAA]">
                Cần cải thiện:{" "}
                {metrics.weakestSkills
                  .map((s) => `${s.skill} ${s.score}`)
                  .join(" · ")}
              </span>
            )}
          </div>

          {/* 2-Column Grid: Memory Pyramid (Colored as requested) + Competency Radar */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left 7 cols: Tháp Trí Nhớ Spaced Repetition (L1 → L6) with Colored Badges */}
            <div className="lg:col-span-7 rounded-[18px] border border-slate-200/80 dark:border-[#272C47] p-5 bg-white dark:bg-[#161A2E] flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="text-[16px] font-bold text-slate-900 dark:text-[#F2F3FB] flex items-center gap-2">
                      <Layers className="w-4 h-4 text-indigo-600 dark:text-[#7B67FF] shrink-0" />
                      <span>Tháp Trí Nhớ Spaced Repetition (L1 → L6)</span>
                    </h3>
                    <p className="text-[13px] text-slate-500 dark:text-[#A5AAC6] mt-0.5">
                      Phân bổ từ vựng theo chu kỳ ôn tập ngắt quãng FSRS
                    </p>
                  </div>
                  {stats.due > 0 && (
                    <Link
                      href="/review"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 text-xs font-bold hover:bg-amber-100 transition-colors shrink-0"
                    >
                      <span>{stats.due} cần ôn</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>

                {/* Stacked 100% Proportion Bar */}
                {metrics.effectiveTotal > 0 && (
                  <div
                    aria-label="Biểu đồ tỷ lệ 6 cấp độ nhớ"
                    className="mb-4 flex h-3 w-full rounded-full overflow-hidden bg-slate-100 dark:bg-[#20253F] gap-0.5 p-0.5"
                  >
                    {FSRS_LEVEL_META.map((lvl) => {
                      const count = wordBreakdown[lvl.key];
                      const pct = (count / metrics.effectiveTotal) * 100;
                      if (pct <= 0) return null;
                      return (
                        <div
                          key={lvl.key}
                          style={{ width: `${Math.max(3, pct)}%` }}
                          className={`h-full first:rounded-l-full last:rounded-r-full ${lvl.barClass} transition-all duration-500`}
                          title={`${lvl.code} ${lvl.name}: ${count} từ (${Math.round(pct)}%)`}
                        />
                      );
                    })}
                  </div>
                )}

                {/* Colored L1 → L6 Rows (Matches User Reference Image) */}
                <div className="space-y-2.5 mt-2">
                  {FSRS_LEVEL_META.map((lvl) => {
                    const count = wordBreakdown[lvl.key];
                    const pct =
                      metrics.effectiveTotal > 0
                        ? Math.round((count / metrics.effectiveTotal) * 100)
                        : 0;
                    return (
                      <div
                        key={lvl.key}
                        className="grid grid-cols-[118px_1fr_76px] items-center gap-3 text-xs"
                      >
                        <span
                          className={`inline-flex items-center justify-between px-2.5 py-1.5 rounded-lg border font-bold text-[12px] ${lvl.badgeClass}`}
                        >
                          <span className="font-extrabold">{lvl.code}</span>
                          <span className="font-bold">{lvl.name}</span>
                        </span>
                        <div className="h-2.5 bg-slate-100 dark:bg-[#20253F] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${lvl.barClass} transition-all duration-500`}
                            style={{
                              width: `${count > 0 ? Math.max(5, pct) : 0}%`,
                            }}
                          />
                        </div>
                        <div className="text-right tabular-nums text-[13px]">
                          <span className="font-extrabold text-slate-900 dark:text-[#F2F3FB]">
                            {count}
                          </span>{" "}
                          <span className="text-slate-400 dark:text-[#A5AAC6] font-medium">
                            ({pct}%)
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#272C47] flex flex-wrap items-center justify-between gap-2 text-[13px] text-slate-500 dark:text-[#A5AAC6]">
                <span>
                  Đang củng cố (L2–L3):{" "}
                  <strong className="text-slate-900 dark:text-[#F2F3FB]">
                    {metrics.consolidatingCount} từ
                  </strong>
                </span>
                <span>
                  Trí nhớ dài hạn (L4–L6):{" "}
                  <strong className="text-emerald-600 dark:text-[#3DD6A0]">
                    {metrics.masteredCount} từ
                  </strong>
                </span>
              </div>
            </div>

            {/* Right 5 cols: Bản đồ năng lực (Original HTML Colors & Geometry) */}
            <div className="lg:col-span-5 rounded-[18px] border border-slate-200/80 dark:border-[#272C47] p-5 bg-white dark:bg-[#161A2E] flex flex-col justify-between">
              <div>
                <h3 className="text-[16px] font-bold text-slate-900 dark:text-[#F2F3FB] m-0">
                  Bản đồ năng lực
                </h3>
                <p className="text-[14px] font-medium text-slate-500 dark:text-[#A5AAC6] mt-0.5">
                  5 trụ cột ngôn ngữ hiện tại
                </p>
              </div>

              {/* Crisp Responsive SVG Radar Chart (Exact HTML Template Geometry & Colors) */}
              <div className="my-2 flex items-center justify-center">
                <svg
                  viewBox="0 0 300 250"
                  width="100%"
                  height="230"
                  role="img"
                  aria-label={`Biểu đồ radar: ${metrics.radarData
                    .map((d) => `${d.skill} ${d.score}`)
                    .join(", ")}`}
                  className="mx-auto block max-w-[340px]"
                >
                  {/* Grid Rings & Axes */}
                  <g
                    fill="none"
                    className="stroke-slate-200 dark:stroke-[#272C47]"
                    strokeWidth="1.2"
                  >
                    <polygon points="150,40 245,109 209,221 91,221 55,109" />
                    <polygon points="150,90 197.5,124.6 179.4,180.5 120.6,180.5 102.5,124.6" />
                    <path d="M150 140V40M150 140L245 109M150 140L209 221M150 140L91 221M150 140L55 109" />
                  </g>

                  {/* Active Competency Polygon (fill/stroke var(--pr) #7B67FF) */}
                  <polygon
                    points={metrics.radarPolygonPoints}
                    fill="#7B67FF"
                    fillOpacity="0.28"
                    stroke="#7B67FF"
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                  />

                  {/* Axis Labels (fill var(--mu) #A5AAC6) */}
                  <g
                    fontSize="11.5"
                    fontWeight="700"
                    className="fill-slate-500 dark:fill-[#A5AAC6]"
                  >
                    <text x="150" y="30" textAnchor="middle">
                      Từ vựng
                    </text>
                    <text x="254" y="108">
                      Ngữ pháp
                    </text>
                    <text x="214" y="238">
                      Phản xạ
                    </text>
                    <text x="86" y="238" textAnchor="end">
                      Đọc hiểu
                    </text>
                    <text x="46" y="108" textAnchor="end">
                      Nghe hiểu
                    </text>
                  </g>
                </svg>
              </div>

              {/* 5 Skill Score Boxes (.rd) — Original HTML Colors */}
              <div className="grid grid-cols-5 gap-2 mt-2">
                {metrics.radarData.map((item) => (
                  <div
                    key={item.skill}
                    className="rounded-[10px] bg-slate-100/90 dark:bg-[#20253F] p-2 text-center text-[12px] font-semibold text-slate-500 dark:text-[#A5AAC6]"
                  >
                    <span className="block truncate">{item.skill}</span>
                    <b className="block text-[17px] font-bold text-indigo-600 dark:text-[#B3A8FF] tabular-nums mt-0.5">
                      {item.score}
                    </b>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TRENDS (Độ chính xác qua các phiên) */}
      {activeTab === "trends" && (
        <div className="rounded-[18px] border border-slate-200/80 dark:border-[#272C47] p-5 bg-white dark:bg-[#161A2E]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-[16px] font-bold text-slate-900 dark:text-[#F2F3FB] flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600 dark:text-[#7B67FF]" />
                <span>Độ chính xác qua các phiên</span>
              </h3>
              <p className="text-[13px] text-slate-500 dark:text-[#A5AAC6] mt-0.5">
                Đường nét đứt là ngưỡng thành thạo 80%
              </p>
            </div>
            <div className="inline-flex items-center gap-4 text-[13px] font-bold">
              <span className="text-indigo-600 dark:text-[#B3A8FF]">
                ● Độ chính xác ({metrics.avgQuizPct}%)
              </span>
              <span className="text-emerald-600 dark:text-[#3DD6A0]">
                - - Chuẩn 80%
              </span>
            </div>
          </div>

          {metrics.trendData.length > 0 ? (
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={metrics.trendData}
                  margin={{ top: 10, right: 12, left: -18, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="accuracyGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7B67FF" stopOpacity={0.32} />
                      <stop offset="95%" stopColor="#7B67FF" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#94a3b8"
                    strokeOpacity={0.2}
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "#A5AAC6", fontSize: 11, fontWeight: 600 }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fill: "#A5AAC6", fontSize: 11 }}
                  />
                  <Tooltip
                    formatter={(value: unknown) => [`${value}%`, "Độ chính xác"]}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #272C47",
                      backgroundColor: "#161A2E",
                      color: "#F2F3FB",
                      fontSize: "12px",
                    }}
                  />
                  <ReferenceLine
                    y={80}
                    stroke="#3DD6A0"
                    strokeDasharray="6 5"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="accuracy"
                    stroke="#7B67FF"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#accuracyGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="py-10 px-4 text-center rounded-xl border border-dashed border-slate-200 dark:border-[#272C47] text-[13px] font-medium text-slate-500 dark:text-[#A5AAC6]">
              Chưa có dữ liệu phiên kiểm tra hoặc hoạt động học tập trên máy chủ. Hãy hoàn thành bài ôn tập hoặc kiểm tra đầu tiên để theo dõi xu hướng độ chính xác.
            </div>
          )}
        </div>
      )}

      {/* TAB 3: DIAGNOSTICS (Từ có nguy cơ quên cao nhất + Đề xuất cho hôm nay) */}
      {activeTab === "diagnostics" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Weak words list */}
          <div className="lg:col-span-7 rounded-[18px] border border-slate-200/80 dark:border-[#272C47] p-5 bg-white dark:bg-[#161A2E]">
            <div className="flex items-center justify-between gap-2 mb-3.5">
              <div>
                <h3 className="text-[16px] font-bold text-slate-900 dark:text-[#F2F3FB] flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-500 dark:text-[#FF8FAA]" />
                  <span>Từ có nguy cơ quên cao nhất</span>
                </h3>
                <p className="text-[13px] text-slate-500 dark:text-[#A5AAC6] mt-0.5">
                  Xếp theo độ bền trí nhớ thấp nhất
                </p>
              </div>
              <Link
                href="/review"
                className="inline-flex items-center gap-1.5 px-4 h-10 rounded-xl bg-rose-500 dark:bg-[#FF8FAA] text-white dark:text-[#161A2E] text-[13px] font-bold hover:opacity-90 transition-opacity shrink-0"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Luyện từ yếu</span>
              </Link>
            </div>

            {weakWords.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {weakWords.slice(0, compact ? 4 : 6).map((w) => (
                  <div
                    key={w.word}
                    className="flex items-center justify-between gap-2 px-3.5 py-3 rounded-xl border border-rose-200/70 dark:border-[#272C47] bg-rose-50/60 dark:bg-[#2D1B2A]"
                  >
                    <div className="min-w-0">
                      <div className="text-[14.5px] font-bold text-slate-900 dark:text-[#F2F3FB] truncate">
                        {w.word}
                      </div>
                      <div className="text-[12.5px] text-slate-500 dark:text-[#A5AAC6] truncate">
                        {w.meaning}
                      </div>
                    </div>
                    <span className="shrink-0 text-[12px] font-bold text-rose-600 dark:text-[#FF8FAA] whitespace-nowrap">
                      {w.stability}d · L{w.level}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50/70 dark:bg-[#14352B] border border-emerald-200/60 dark:border-[#272C47] text-emerald-800 dark:text-[#3DD6A0] text-xs font-semibold">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>
                  Tuyệt vời! Hiện tại không có từ vựng nào nằm trong vùng nguy cơ
                  quên cao.
                </span>
              </div>
            )}
          </div>

          {/* Right 5 cols: Đề xuất cho hôm nay */}
          <div className="lg:col-span-5 rounded-[18px] border border-slate-200/80 dark:border-[#272C47] p-5 bg-slate-50 dark:bg-[#20253F] flex flex-col gap-3">
            <span className="text-[12px] font-bold uppercase tracking-wider text-indigo-600 dark:text-[#B3A8FF]">
              Đề xuất cho hôm nay
            </span>
            <h3 className="text-[20px] font-extrabold text-slate-900 dark:text-[#F2F3FB] leading-snug">
              {stats.due > 0
                ? `Giải quyết dứt điểm ${stats.due} từ vựng đến hạn`
                : "Đẩy từ L1–L2 lên tầng Vững vàng (L4)"}
            </h3>
            <p className="text-[14px] text-slate-600 dark:text-[#A5AAC6] leading-relaxed">
              {stats.due > 0
                ? "Ôn đúng điểm rơi FSRS giúp nhân đôi chu kỳ nhớ tiếp theo và giữ vững tỷ lệ thuộc trên 85%."
                : "Trí nhớ từ vựng của bạn đang ổn định. Đây là lúc tốt để mở khoá bài học mới trên bản đồ lộ trình."}
            </p>
            <div className="mt-auto pt-2 flex flex-wrap gap-2.5">
              <Link
                href={stats.due > 0 ? "/review" : "/journey"}
                className="inline-flex items-center justify-center h-11 px-4.5 rounded-xl bg-indigo-600 dark:bg-[#7B67FF] text-white text-[14px] font-bold hover:opacity-95 transition-opacity"
              >
                {stats.due > 0 ? "Ôn tập ngay" : "Vào lộ trình"}
              </Link>
              <Link
                href="/practice/games"
                className="inline-flex items-center justify-center h-11 px-4.5 rounded-xl border-[1.5px] border-indigo-600 dark:border-[#7B67FF] text-indigo-600 dark:text-[#B3A8FF] text-[14px] font-bold hover:bg-indigo-50/50 dark:hover:bg-[#161A2E] transition-colors"
              >
                Luyện phản xạ
              </Link>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
