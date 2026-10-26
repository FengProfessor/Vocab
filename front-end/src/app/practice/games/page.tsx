'use client';
import { authService } from '@/features/auth/session';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Brain,
  Gamepad2,
  Layers,
  Play,
  Shuffle,
  Sparkles,
  Trophy,
  Zap,
} from 'lucide-react';
import { StudentShell } from '@/components/student/StudentShell';
import { EnglishGameSession } from '@/components/games/EnglishGameSession';
import { authFetch } from '@/lib/auth-fetch';
import {
  GAME_MODES,
  GAME_TOPICS,
  type GameMode,
  type GameTopic,
  type GameWord,
} from '@/data/english-games';
import {
  cleanGameWords,
  parseGameRecords,
  playableWords,
  type GameResult,
} from '@/lib/english-games';

const RECORD_KEY = 'lingopro_english_game_records_v1';

const GAME_ARENA_META: Record<
  GameMode,
  {
    categoryTag: string;
    reflexAttr: number;
    memoryAttr: number;
    gradient: string;
    borderGlow: string;
    accentBadge: string;
  }
> = {
  memory: {
    categoryTag: 'TRÍ NHỚ KHÔNG GIAN',
    reflexAttr: 70,
    memoryAttr: 98,
    gradient:
      'from-violet-500/15 via-purple-500/5 to-transparent dark:from-violet-500/20 dark:via-purple-950/20',
    borderGlow: 'hover:border-violet-400 dark:hover:border-violet-500',
    accentBadge:
      'bg-violet-100 text-violet-800 border-violet-300 dark:bg-violet-950/80 dark:text-violet-300 dark:border-violet-800',
  },
  sprint: {
    categoryTag: 'TỐC ĐỘ · 60 GIÂY',
    reflexAttr: 98,
    memoryAttr: 80,
    gradient:
      'from-amber-500/15 via-orange-500/5 to-transparent dark:from-amber-500/20 dark:via-orange-950/20',
    borderGlow: 'hover:border-amber-400 dark:hover:border-amber-500',
    accentBadge:
      'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800',
  },
  scramble: {
    categoryTag: 'GIẢI MÃ CHÍNH TẢ',
    reflexAttr: 82,
    memoryAttr: 90,
    gradient:
      'from-teal-500/15 via-cyan-500/5 to-transparent dark:from-teal-500/20 dark:via-cyan-950/20',
    borderGlow: 'hover:border-teal-400 dark:hover:border-teal-500',
    accentBadge:
      'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-950/80 dark:text-teal-300 dark:border-teal-800',
  },
  detective: {
    categoryTag: 'PHÁ BẪY NGỮ PHÁP',
    reflexAttr: 88,
    memoryAttr: 94,
    gradient:
      'from-rose-500/15 via-red-500/5 to-transparent dark:from-rose-500/20 dark:via-red-950/20',
    borderGlow: 'hover:border-rose-400 dark:hover:border-rose-500',
    accentBadge:
      'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-800',
  },
  grammar: {
    categoryTag: 'CẤU TRÚC 750–900+',
    reflexAttr: 85,
    memoryAttr: 95,
    gradient:
      'from-indigo-500/15 via-blue-500/5 to-transparent dark:from-indigo-500/20 dark:via-indigo-950/20',
    borderGlow: 'hover:border-indigo-400 dark:hover:border-indigo-500',
    accentBadge:
      'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950/80 dark:text-indigo-300 dark:border-indigo-800',
  },
  sentence: {
    categoryTag: 'LẮP RÁP CÂU PHỨC',
    reflexAttr: 78,
    memoryAttr: 92,
    gradient:
      'from-emerald-500/15 via-teal-500/5 to-transparent dark:from-emerald-500/20 dark:via-teal-950/20',
    borderGlow: 'hover:border-emerald-400 dark:hover:border-emerald-500',
    accentBadge:
      'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800',
  },
};

export default function EnglishGamesPage() {
  const [source, setSource] = useState<'topic' | 'personal'>('topic');
  const [topic, setTopic] = useState<GameTopic>('daily');
  const [personalWords, setPersonalWords] = useState<GameWord[]>([]);
  const [loadingPersonal, setLoadingPersonal] = useState(true);
  const [activeMode, setActiveMode] = useState<GameMode | null>(null);
  const [records, setRecords] = useState<Partial<Record<GameMode, number>>>({});
  const [lastResult, setLastResult] = useState<
    (GameResult & { mode: GameMode }) | null
  >(null);

  useEffect(() => {
    setRecords(
      parseGameRecords(
        typeof window !== 'undefined' ? localStorage.getItem(RECORD_KEY) : null
      )
    );
    let cancelled = false;
    (async () => {
      try {
        const {
          data: { user },
        } = await authService.getUser();
        if (!user) return;
        const res = await authFetch('/api/words?limit=60&offset=0&classroomId=__personal__', {})
          .then((r) => r.json())
          .catch(() => null);
        const data = Array.isArray(res?.data) ? res.data : [];
        if (!cancelled) setPersonalWords(cleanGameWords(data));
      } finally {
        if (!cancelled) setLoadingPersonal(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const words = useMemo(() => {
    if (source === 'personal' && personalWords.length >= 6) return personalWords;
    return GAME_TOPICS[topic].words;
  }, [personalWords, source, topic]);

  const sourceLabel =
    source === 'personal' && personalWords.length >= 6
      ? `Kho từ cá nhân (${personalWords.length} từ)`
      : `${GAME_TOPICS[topic].emoji} ${GAME_TOPICS[topic].title}`;

  function handleFinish(mode: GameMode, result: GameResult) {
    setLastResult({ ...result, mode });
    setRecords((prev) => {
      const next = {
        ...prev,
        [mode]: Math.max(prev[mode] ?? 0, result.score),
      };
      try {
        localStorage.setItem(RECORD_KEY, JSON.stringify(next));
      } catch {
        // ignore storage quota
      }
      return next;
    });
  }

  const arcadeStats = useMemo(() => {
    const scores = Object.values(records).filter(
      (s): s is number => typeof s === 'number'
    );
    const totalScore = scores.reduce((a, b) => a + b, 0);
    const modesPlayed = scores.filter((s) => s > 0).length;

    let rankTitle = 'Tân Binh Đấu Trường';
    let nextRankTarget = 1000;
    let rankBadgeColor = 'from-slate-500 to-slate-700';

    if (totalScore >= 3500) {
      rankTitle = 'Đại Kiện Tướng Ngôn Ngữ';
      nextRankTarget = 5000;
      rankBadgeColor = 'from-amber-400 via-orange-500 to-rose-500';
    } else if (totalScore >= 1800) {
      rankTitle = 'Cao Thủ Phản Xạ';
      nextRankTarget = 3500;
      rankBadgeColor = 'from-indigo-500 via-violet-500 to-purple-600';
    } else if (totalScore >= 600) {
      rankTitle = 'Chiến Binh Tinh Anh';
      nextRankTarget = 1800;
      rankBadgeColor = 'from-emerald-500 to-teal-600';
    }

    const rankPct = Math.min(
      100,
      Math.round((totalScore / nextRankTarget) * 100)
    );

    return {
      totalScore,
      modesPlayed,
      rankTitle,
      nextRankTarget,
      rankBadgeColor,
      rankPct,
    };
  }, [records]);

  const handleRandomMode = () => {
    const randomIdx = Math.floor(Math.random() * GAME_MODES.length);
    setActiveMode(GAME_MODES[randomIdx].id);
  };

  return (
    <StudentShell title="Đấu Trường Trò Chơi">
      <div
        className="mx-auto max-w-5xl space-y-6 pb-12"
        data-testid="games-arena-hub"
      >
        {activeMode ? (
          <EnglishGameSession
            mode={activeMode}
            words={words}
            sourceLabel={sourceLabel}
            bestScore={records[activeMode] ?? 0}
            onBack={() => setActiveMode(null)}
            onFinish={(result) => handleFinish(activeMode, result)}
          />
        ) : (
          <>
            {/* ── ARCADE ARENA HERO BANNER ── */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-violet-950 text-white p-6 sm:p-8 shadow-xl border border-indigo-500/30">
              <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-fuchsia-500/15 blur-3xl" />

              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-3 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/25 border border-indigo-400/30 text-xs font-extrabold uppercase tracking-wider text-indigo-200">
                      <Gamepad2 className="w-3.5 h-3.5 text-amber-400" />
                      Reflex &amp; Memory Arena
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-xs font-bold text-emerald-300">
                      <Sparkles className="w-3 h-3" /> 6 Chế độ Tương tác
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                    Đấu Trường Phản Xạ &amp; Giải Mã Ngôn Ngữ
                  </h1>

                  <p className="text-indigo-100/85 text-sm sm:text-base leading-relaxed">
                    Biến việc ôn từ vựng học thuật (AWL/ETS) và cấu trúc ngữ pháp nâng cao thành phản xạ tốc độ cao. Tích lũy chuỗi{' '}
                    <strong className="text-amber-300">Combo Fever 🔥</strong>, mở khóa danh hiệu và phá kỷ lục cá nhân!
                  </p>

                  <div className="pt-1 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={handleRandomMode}
                      data-testid="arcade-random-start-btn"
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-500/25 hover:brightness-105 active:scale-95 transition-all cursor-pointer min-h-[44px]"
                    >
                      <Shuffle className="w-4 h-4 stroke-[2.5]" />
                      Khiêu Chiến Ngẫu Nhiên Ngay
                    </button>

                    <Link
                      href="/practice"
                      className="inline-flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs sm:text-sm font-bold text-white transition-colors min-h-[44px]"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Về Trung tâm Luyện tập
                    </Link>
                  </div>
                </div>

                {/* Right: Player Arcade Rank & Power Card */}
                <div className="lg:w-72 shrink-0 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${arcadeStats.rankBadgeColor} flex items-center justify-center shadow-md`}
                      >
                        <Trophy className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-200">
                          Hạng Đấu Trường
                        </div>
                        <div className="text-sm font-black text-white">
                          {arcadeStats.rankTitle}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="rounded-xl bg-black/25 px-3 py-2 border border-white/10">
                      <div className="text-[10px] text-indigo-200/80 font-semibold">
                        Tổng Điểm Kỷ Lục
                      </div>
                      <div className="text-lg font-black text-amber-300 tabular-nums">
                        {arcadeStats.totalScore}
                      </div>
                    </div>
                    <div className="rounded-xl bg-black/25 px-3 py-2 border border-white/10">
                      <div className="text-[10px] text-indigo-200/80 font-semibold">
                        Chế Độ Chinh Phục
                      </div>
                      <div className="text-lg font-black text-emerald-300 tabular-nums">
                        {arcadeStats.modesPlayed}/{GAME_MODES.length}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-bold text-indigo-200">
                      <span>Tiến trình thăng hạng</span>
                      <span className="tabular-nums">
                        {arcadeStats.totalScore}/{arcadeStats.nextRankTarget} PTS
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-black/40 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-500"
                        style={{ width: `${arcadeStats.rankPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Session Banner if available */}
            {lastResult && (
              <div className="rounded-2xl border border-emerald-300/80 dark:border-emerald-800/70 bg-emerald-50/70 dark:bg-emerald-950/30 p-3.5 px-4 flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm font-bold text-emerald-900 dark:text-emerald-200">
                <span className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>
                    Lượt vừa xong (
                    {GAME_MODES.find((m) => m.id === lastResult.mode)?.title}):{' '}
                    <strong>{lastResult.score} điểm</strong> · Chính xác{' '}
                    {lastResult.correct}/{lastResult.attempts} · Combo tối đa x
                    {lastResult.bestCombo}
                  </span>
                </span>
              </div>
            )}

            {/* ── CORPUS POWER-DECK SELECTOR ── */}
            <section className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-xs space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                    1. Chọn Bộ Nạp Từ Vựng Thi Đấu (Game Deck)
                  </h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setSource('topic')}
                    className={`rounded-xl px-3.5 py-1.5 text-xs font-extrabold transition-all cursor-pointer min-h-[36px] ${
                      source === 'topic'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    Chủ đề chuẩn ETS/IELTS
                  </button>
                  <button
                    type="button"
                    disabled={personalWords.length < 6}
                    onClick={() => setSource('personal')}
                    className={`rounded-xl px-3.5 py-1.5 text-xs font-extrabold transition-all cursor-pointer min-h-[36px] disabled:opacity-50 disabled:cursor-not-allowed ${
                      source === 'personal'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    Kho từ cá nhân ({loadingPersonal ? '…' : personalWords.length})
                  </button>
                </div>
              </div>

              {source === 'topic' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {(
                    Object.entries(GAME_TOPICS) as [
                      GameTopic,
                      (typeof GAME_TOPICS)[GameTopic],
                    ][]
                  ).map(([key, item]) => {
                    const active = topic === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setTopic(key)}
                        data-testid={`game-topic-${key}`}
                        className={`rounded-2xl border-2 p-3.5 text-left transition-all cursor-pointer min-h-[44px] ${
                          active
                            ? 'border-indigo-600 dark:border-indigo-400 bg-indigo-50/70 dark:bg-indigo-950/50 shadow-xs'
                            : 'border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-indigo-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-xl">{item.emoji}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                              active
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            {item.words.length} từ
                          </span>
                        </div>
                        <p className="text-xs font-extrabold text-slate-900 dark:text-slate-100 leading-snug">
                          {item.title}
                        </p>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  Đang dùng <b>{personalWords.length}</b> từ trong kho cá nhân của bạn cho các chế độ Ghép cặp, Phản xạ 60s và Giải mã chữ cái.
                </p>
              )}
            </section>

            {/* ── 6 CREATIVE ARCADE CABINET CARDS ── */}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {GAME_MODES.map((game) => {
                const enoughWords =
                  game.category === 'grammar' ||
                  playableWords(game.id, words).length >= 4;
                const best = records[game.id] ?? 0;
                const meta = GAME_ARENA_META[game.id];

                return (
                  <div
                    key={game.id}
                    data-testid={`game-mode-card-${game.id}`}
                    className={`group relative rounded-3xl border-2 border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs hover:shadow-xl transition-all duration-200 flex flex-col justify-between overflow-hidden ${meta.borderGlow}`}
                  >
                    <div
                      className={`pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b ${meta.gradient}`}
                    />

                    <div className="relative z-10">
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-200/80 dark:border-slate-700 shadow-sm flex items-center justify-center text-3xl group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-200">
                          {game.emoji}
                        </div>

                        <div className="flex flex-col items-end gap-1.5">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${meta.accentBadge}`}
                          >
                            {meta.categoryTag}
                          </span>

                          {best > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 text-xs font-black tabular-nums">
                              <Trophy className="w-3 h-3 text-amber-500" />
                              Kỷ lục: {best}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[11px] font-semibold">
                              Chưa mở kỷ lục
                            </span>
                          )}
                        </div>
                      </div>

                      <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
                        {game.title}
                      </h3>
                      <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                        {game.label}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                        {game.description}
                      </p>

                      {/* Mini Attribute Bars (Reflex & Brain Load) */}
                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-2 gap-3 text-[11px]">
                        <div>
                          <div className="flex items-center justify-between font-bold text-slate-500 dark:text-slate-400 mb-1">
                            <span className="flex items-center gap-1">
                              <Zap className="w-3 h-3 text-amber-500" /> Phản xạ
                            </span>
                            <span>{meta.reflexAttr}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-amber-500"
                              style={{ width: `${meta.reflexAttr}%` }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between font-bold text-slate-500 dark:text-slate-400 mb-1">
                            <span className="flex items-center gap-1">
                              <Brain className="w-3 h-3 text-indigo-500" /> Tư duy
                            </span>
                            <span>{meta.memoryAttr}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-indigo-500"
                              style={{ width: `${meta.memoryAttr}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={!enoughWords}
                      onClick={() => setActiveMode(game.id)}
                      data-testid={`start-game-${game.id}`}
                      className="relative z-10 mt-5 w-full py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] disabled:opacity-50 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-500/20 cursor-pointer min-h-[44px]"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>Vào Đấu Trường</span>
                    </button>
                  </div>
                );
              })}
            </section>
          </>
        )}
      </div>
    </StudentShell>
  );
}
