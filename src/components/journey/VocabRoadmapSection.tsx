'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Volume2,
  CheckCircle2,
  Play,
  ArrowRight,
  Check,
  ChevronDown,
} from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { playWordAudio, stopWordAudio } from '@/lib/audio';
import {
  getFoundationVerbPacks,
  type FoundationVerbPack,
} from '@/lib/roadmap';
import {
  getVocabStages,
  getVocabStage,
  getVocabTopic,
  type VocabStageTopic,
  type VocabStageItem,
} from '@/lib/vocab-stages';

interface VocabRoadmapSectionProps {
  onSelectPack?: (packId: string) => void;
}

const TIER_META: Record<
  number,
  {
    name: string;
    badge: string;
    color: string;
    desc: string;
  }
> = {
  1: {
    name: 'Tầng 1 · Sinh Tồn & Nhu Cầu Cốt Lõi',
    badge: 'Căn bản nhất',
    color: 'text-emerald-700 dark:text-emerald-300',
    desc: '20 động từ sống còn để xác định danh tính, sự tồn tại, nhu cầu và chuyển động không gian.',
  },
  2: {
    name: 'Tầng 2 · Sinh Hoạt Hằng Ngày & Giao Tiếp',
    badge: 'Đời sống thực tế',
    color: 'text-sky-700 dark:text-sky-300',
    desc: '20 động từ diễn đạt các hành động thể chất thường nhật, ăn uống và hội thoại giao tiếp.',
  },
  3: {
    name: 'Tầng 3 · Tương Tác Xã Hội, Trao Nhận & Rèn Luyện',
    badge: 'Kết nối & Công việc',
    color: 'text-amber-700 dark:text-amber-300',
    desc: '20 động từ mô tả sự tương tác hai chiều (cho - nhận, giúp đỡ) và hoạt động học tập, làm việc.',
  },
  4: {
    name: 'Tầng 4 · Mua Sắm, Giao Dịch & Cảm Xúc',
    badge: 'Ý nghĩ & Cảm xúc',
    color: 'text-violet-700 dark:text-violet-300',
    desc: '20 động từ chi tiêu, quyết định, thỏa thuận và bộc lộ thế giới cảm xúc, niềm tin nội tâm.',
  },
  5: {
    name: 'Tầng 5 · Tác Động Vật Lý & Biến Đổi Trạng Thái',
    badge: 'Nâng cao A1-A2',
    color: 'text-rose-700 dark:text-rose-300',
    desc: '20 động từ tác động trực tiếp lên sự vật, duy trì trạng thái và diễn tiến kết quả.',
  },
};

const PACK_ICONS = ['🌱', '🏃', '☕', '🗣️', '🎁', '📚', '🛒', '💖', '⚡', '🚀'];

const STAGE_CONFIGS: Record<
  1 | 2 | 3,
  {
    title: string;
    titleVi: string;
    level: string;
    icon: string;
    badge: string;
    tagline: string;
  }
> = {
  1: {
    title: 'Stage 1 · Foundation Recovery',
    titleVi: 'Chặng 1 · Căn Bản Lấy Gốc',
    level: 'A0 - A1',
    icon: '🌱',
    badge: '1.000 Từ Thiết Yếu',
    tagline: '100 Động Từ Cốt Lõi + 12 Chủ Đề Đời Sống',
  },
  2: {
    title: 'Stage 2 · Conversational Expansion',
    titleVi: 'Chặng 2 · Giao Tiếp Mở Rộng',
    level: 'A2 - B1',
    icon: '🚀',
    badge: '1.000 Từ Giao Tiếp',
    tagline: '12 Chủ Đề Công Việc & Xã Hội',
  },
  3: {
    title: 'Stage 3 · Confident Mastery',
    titleVi: 'Chặng 3 · Làm Chủ Tự Tin',
    level: 'B1 - B2',
    icon: '👑',
    badge: '1.000 Từ Chuyên Sâu',
    tagline: '12 Chủ Đề Học Thuật & Kinh Doanh',
  },
};

export function VocabRoadmapSection({ onSelectPack }: VocabRoadmapSectionProps) {
  const [selectedStage, setSelectedStage] = useState<1 | 2 | 3>(1);
  const [isBedrockExpanded, setIsBedrockExpanded] = useState<boolean>(false);
  const [expandedTopicId, setExpandedTopicId] = useState<string | null>(null);
  const [playingWord, setPlayingWord] = useState<string | null>(null);

  // Load datasets
  const verbPacks = useMemo(() => getFoundationVerbPacks(), []);
  const _stagesData = useMemo(() => getVocabStages(), []);
  const currentStageData = useMemo(() => getVocabStage(selectedStage), [selectedStage]);

  // Track progress from localStorage with dynamic sync
  const [completedPacks, setCompletedPacks] = useState<Set<string>>(new Set());
  const [completedTopics, setCompletedTopics] = useState<Set<string>>(new Set());
  const [masteredWords, setMasteredWords] = useState<Set<string>>(new Set());

  const audioReqIdRef = useRef<number>(0);

  const parseStorageSet = useCallback((key: string): Set<string> => {
    try {
      if (typeof window === 'undefined') return new Set();
      const raw = localStorage.getItem(key);
      if (!raw) return new Set();
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return new Set(
          parsed
            .map((item) => String(item).toLowerCase().trim())
            .filter(Boolean)
        );
      }
      if (parsed && typeof parsed === 'object') {
        return new Set(
          Object.keys(parsed)
            .map((k) => k.toLowerCase().trim())
            .filter(Boolean)
        );
      }
      return new Set();
    } catch {
      return new Set();
    }
  }, []);

  const syncProgressFromStorage = useCallback(() => {
    setCompletedPacks(parseStorageSet('vocab_station_completed_packs'));
    setCompletedTopics(parseStorageSet('vocab_station_completed_topics'));
    setMasteredWords(parseStorageSet('vocab_station_mastered_words'));
  }, [parseStorageSet]);

  // Deep linking and URL parameter initialization (preserves stage/topic across refresh & deep links)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const sp = new URLSearchParams(window.location.search);
      const stageParam = sp.get('stage');
      const topicParam = sp.get('topic');
      const bedrockParam = sp.get('bedrock');
      const packParam = sp.get('pack');

      if (topicParam) {
        const foundTopic = getVocabTopic(topicParam);
        if (foundTopic) {
          setSelectedStage(foundTopic.stage);
          setExpandedTopicId(foundTopic.id);
          setIsBedrockExpanded(false);
        }
      } else if (stageParam === '1' || stageParam === '2' || stageParam === '3') {
        setSelectedStage(Number(stageParam) as 1 | 2 | 3);
      }

      if (bedrockParam === 'true' || bedrockParam === '1' || packParam) {
        setSelectedStage(1);
        setIsBedrockExpanded(true);
        setExpandedTopicId(null);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    syncProgressFromStorage();
    const handleStorage = (e: StorageEvent) => {
      if (!e.key || e.key.startsWith('vocab_station_')) {
        syncProgressFromStorage();
      }
    };
    const handleFocus = () => {
      syncProgressFromStorage();
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', handleFocus);
    };
  }, [syncProgressFromStorage]);

  // Cleanup audio on unmount to prevent memory leaks and orphan audio
  useEffect(() => {
    const audioRef = audioReqIdRef;
    return () => {
      audioRef.current++;
      stopWordAudio();
    };
  }, []);

  const handlePlayAudio = async (
    e: React.MouseEvent | React.KeyboardEvent,
    word: string
  ) => {
    e.stopPropagation();
    e.preventDefault();
    const reqId = ++audioReqIdRef.current;
    setPlayingWord(word);
    try {
      await playWordAudio(word, null, 1.0);
    } catch {
      // Ignore audio playback errors
    } finally {
      if (audioReqIdRef.current === reqId) {
        setPlayingWord(null);
      }
    }
  };

  // Group verb packs by tier for Stage 1 bedrock view
  const tierGroups = useMemo(() => {
    const groups: Record<number, FoundationVerbPack[]> = { 1: [], 2: [], 3: [], 4: [], 5: [] };
    verbPacks.forEach((p) => {
      if (groups[p.tier]) {
        groups[p.tier].push(p);
      }
    });
    return groups;
  }, [verbPacks]);

  // Bedrock verbs stats for Stage 1
  const bedrockLemmas = useMemo(
    () => verbPacks.flatMap((p) => p.verbs.map((v) => v.lemma.toLowerCase())),
    [verbPacks]
  );
  const bedrockMasteredCount = useMemo(
    () => bedrockLemmas.filter((w) => masteredWords.has(w)).length,
    [bedrockLemmas, masteredWords]
  );
  const bedrockProgressPct =
    bedrockLemmas.length > 0
      ? Math.min(100, Math.round((bedrockMasteredCount / bedrockLemmas.length) * 100))
      : 0;

  // Calculate progress for current stage
  const stageStats = useMemo(() => {
    const targetWords = currentStageData?.wordCount || 1000;
    let stageWordsList: string[] = [];

    if (selectedStage === 1) {
      // 100 verbs + 900 topic words
      const topicWords = (currentStageData?.topics || []).flatMap((t) =>
        t.words.map((w) => w.word.toLowerCase())
      );
      stageWordsList = [...bedrockLemmas, ...topicWords];
    } else {
      stageWordsList = (currentStageData?.topics || []).flatMap((t) =>
        t.words.map((w) => w.word.toLowerCase())
      );
    }

    const masteredInStage = stageWordsList.filter((w) => masteredWords.has(w)).length;
    const pct = Math.min(100, Math.round((masteredInStage / targetWords) * 100));

    return {
      masteredCount: masteredInStage,
      totalCount: targetWords,
      progressPct: pct,
    };
  }, [selectedStage, bedrockLemmas, currentStageData, masteredWords]);

  const handleStageSelect = (sNum: 1 | 2 | 3) => {
    setSelectedStage(sNum);
    setExpandedTopicId(null);
    setIsBedrockExpanded(false);
  };

  const handleTabKeyDown = (
    e: React.KeyboardEvent,
    currentStageNum: 1 | 2 | 3
  ) => {
    const stages: (1 | 2 | 3)[] = [1, 2, 3];
    const currentIndex = stages.indexOf(currentStageNum);
    let nextStage: 1 | 2 | 3 | null = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      nextStage = stages[(currentIndex + 1) % stages.length];
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      nextStage = stages[(currentIndex - 1 + stages.length) % stages.length];
    } else if (e.key === 'Home') {
      e.preventDefault();
      nextStage = stages[0];
    } else if (e.key === 'End') {
      e.preventDefault();
      nextStage = stages[stages.length - 1];
    }
    if (nextStage !== null) {
      handleStageSelect(nextStage);
      const tabEl = document.getElementById(`stage-tab-${nextStage}`);
      tabEl?.focus();
    }
  };

  return (
    <div className="space-y-4 pb-16 sm:pb-8" data-testid="vocab-roadmap-section">
      {/* ── R1. STAGE SWITCHER PILLS & MICRO HORIZONTAL PROGRESS ── */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-xs dark:border-slate-800 dark:bg-slate-900/90 sm:p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          {/* Stage Tabs (Pill style) */}
          <div
            role="tablist"
            aria-label="Chọn chặng lộ trình từ vựng"
            className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 overflow-x-auto no-scrollbar w-full sm:w-auto"
          >
            {([1, 2, 3] as const).map((sNum) => {
              const sc = STAGE_CONFIGS[sNum];
              const isCurrent = selectedStage === sNum;
              return (
                <button
                  key={`stage-pill-${sNum}`}
                  id={`stage-tab-${sNum}`}
                  type="button"
                  role="tab"
                  tabIndex={isCurrent ? 0 : -1}
                  aria-selected={isCurrent}
                  aria-controls="stage-tabpanel"
                  onClick={() => handleStageSelect(sNum)}
                  onKeyDown={(e) => handleTabKeyDown(e, sNum)}
                  className={`min-h-[44px] flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-lg px-2 sm:px-3 py-1.5 text-[11px] sm:text-xs font-bold transition-all shrink-0 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:focus-visible:ring-sky-400 touch-manipulation ${
                    isCurrent
                      ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  <span className="text-sm">{sc.icon}</span>
                  <span className="whitespace-nowrap">Chặng {sNum}</span>
                  <span className="text-[10px] opacity-75 font-semibold whitespace-nowrap hidden sm:inline">
                    · {sc.level}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Corner Progress Stats */}
          <div className="flex items-center justify-between sm:justify-end gap-2.5 text-xs text-slate-500 dark:text-slate-400 shrink-0">
            <span className="text-[11px] sm:text-xs">
              Đã thuộc: <strong className="font-bold text-slate-900 dark:text-white">{stageStats.masteredCount}</strong>/{stageStats.totalCount} từ
            </span>
            <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm">
              {stageStats.progressPct}%
            </span>
          </div>
        </div>

        {/* Micro Horizontal Progress Bar (~3px - 4px) */}
        <div className="mt-2.5">
          <div className="h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 transition-all duration-500 ease-out"
              style={{ width: `${stageStats.progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── R2 PART 1. 100 BEDROCK VERBS ACCORDION (STAGE 1 ONLY) ── */}
      {selectedStage === 1 && (
        <div className="rounded-2xl border border-amber-200/90 bg-white dark:border-amber-900/40 dark:bg-slate-900 overflow-hidden shadow-xs">
          {/* Collapsed Compact Row */}
          <button
            id="bedrock-accordion-toggle"
            type="button"
            onClick={() => {
              setIsBedrockExpanded((prev) => {
                const next = !prev;
                if (next) setExpandedTopicId(null);
                return next;
              });
            }}
            className="w-full min-h-[52px] p-3 sm:px-4 flex items-center justify-between gap-2.5 sm:gap-3 text-left hover:bg-amber-50/40 dark:hover:bg-amber-950/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:focus-visible:ring-amber-400 focus-visible:ring-inset touch-manipulation"
            data-testid="bedrock-accordion-toggle"
            aria-expanded={isBedrockExpanded}
            aria-controls="bedrock-accordion-content"
          >
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-base font-bold text-amber-600 dark:text-amber-400">
                ⭐
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span role="heading" aria-level={4} className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate block">
                    100 Động Từ Cốt Lõi
                    <span className="hidden sm:inline"> (Bedrock Verbs)</span>
                  </span>
                  <span className="hidden sm:inline-block rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 shrink-0">
                    5 Tầng S-V-O
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  Khung xương định hình câu · Lấy gốc sống còn
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <span className="text-[11px] sm:text-xs font-semibold text-slate-600 dark:text-slate-300">
                {bedrockMasteredCount}/100 từ
              </span>

              {/* Mini progress bar on tablet/desktop */}
              <div className="w-16 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden hidden sm:block">
                <div
                  className="h-full rounded-full bg-amber-500 transition-all duration-300"
                  style={{ width: `${Math.max(2, bedrockProgressPct)}%` }}
                />
              </div>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 w-7 sm:w-8 text-right hidden sm:inline-block">
                {bedrockProgressPct}%
              </span>

              <ChevronDown
                className={`h-4 w-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                  isBedrockExpanded ? 'rotate-180 text-amber-600 dark:text-amber-400' : ''
                }`}
              />
            </div>
          </button>

          {/* Expanded Inline Accordion */}
          {isBedrockExpanded && (
            <div
              id="bedrock-accordion-content"
              role="region"
              aria-labelledby="bedrock-accordion-toggle"
              className="border-t border-amber-100 bg-amber-50/20 p-4 sm:p-5 dark:border-amber-900/30 dark:bg-slate-900/60 space-y-4"
              data-testid="bedrock-accordion-content"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-200/50 dark:border-amber-900/30">
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  100 động từ chia làm 5 tầng (10 gói). Bạn có thể luyện tập nhanh theo từng gói hoặc làm chủ toàn bộ.
                </p>
                <Link
                  href="/practice/vocab-station?pack=starter-verb-01"
                  onClick={() => onSelectPack?.('starter-verb-01')}
                  className={cn(
                    buttonVariants({ variant: 'outline', size: 'sm' }),
                    'min-h-[44px] rounded-xl text-xs font-bold border-amber-300 text-amber-800 hover:bg-amber-100 hover:text-amber-900 dark:border-amber-800 dark:text-amber-300 dark:hover:bg-amber-950/50 dark:hover:text-amber-200 shrink-0 shadow-xs touch-manipulation'
                  )}
                >
                  <Play className="h-3.5 w-3.5 fill-current mr-1 text-amber-500" />
                  Luyện Cả 100 Động Từ →
                </Link>
              </div>

              {/* 5 Tiers */}
              <div className="space-y-3">
                {([1, 2, 3, 4, 5] as const).map((tierNum) => {
                  const tierMeta = TIER_META[tierNum];
                  const tierPacks = tierGroups[tierNum] || [];

                  return (
                    <div
                      key={`tier-${tierNum}`}
                      className="rounded-xl border border-slate-200/80 bg-white/90 p-3 sm:p-4 dark:border-slate-800 dark:bg-slate-900/90 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="rounded-md bg-amber-100 px-1.5 py-0.5 font-mono text-[10px] font-black text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                            TẦNG {tierNum}
                          </span>
                          <h5 className={`text-xs sm:text-sm font-bold ${tierMeta.color}`}>
                            {tierMeta.name}
                          </h5>
                        </div>
                        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                          {tierMeta.badge}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2">
                        {tierPacks.map((packItem, pIdx) => {
                          const packIndexGlobal = (tierNum - 1) * 2 + pIdx;
                          const packIcon = PACK_ICONS[packIndexGlobal] || '✨';
                          const isDone =
                            completedPacks.has(packItem.id) ||
                            packItem.verbs.every((v) => masteredWords.has(v.lemma.toLowerCase()));
                          const cleanTitle = packItem.title.replace(/^Tầng \d+ ·\s*/i, '');

                          return (
                            <div
                              key={packItem.id}
                              className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-2xs dark:border-slate-800 dark:bg-slate-900"
                            >
                              <div>
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-xs font-bold dark:bg-amber-500/20">
                                      {packIcon}
                                    </span>
                                    <div className="min-w-0">
                                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">
                                        Gói {packIndexGlobal + 1}/10 · 10 từ
                                      </span>
                                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate block">
                                        {cleanTitle}
                                      </span>
                                    </div>
                                  </div>
                                  {isDone ? (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 shrink-0">
                                      <CheckCircle2 className="h-3 w-3" /> Đã xong
                                    </span>
                                  ) : (
                                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400 shrink-0">
                                      10 từ
                                    </span>
                                  )}
                                </div>

                                {/* Word Chips */}
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {packItem.verbs.map((v) => {
                                    const isPlaying = playingWord === v.lemma;
                                    const isVerbLearned = masteredWords.has(v.lemma.toLowerCase());
                                    return (
                                      <button
                                        key={v.lemma}
                                        type="button"
                                        onClick={(e) => handlePlayAudio(e, v.lemma)}
                                        title={`${v.meaningVi} — ${v.pattern}`}
                                        aria-label={`Phát âm từ ${v.lemma}`}
                                        aria-busy={isPlaying}
                                        className={cn(
                                          'group/chip inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium transition-all min-h-[36px] touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:focus-visible:ring-amber-400',
                                          isPlaying
                                            ? 'border-amber-400 bg-amber-100/80 text-amber-950 dark:border-amber-700 dark:bg-amber-950/60 dark:text-amber-200 shadow-2xs'
                                            : isVerbLearned
                                            ? 'border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-100/70 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200 dark:hover:bg-emerald-900/30'
                                            : 'border-slate-200 bg-slate-50 text-slate-800 hover:border-amber-400 hover:bg-amber-50 hover:text-amber-900 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-200 dark:hover:border-amber-700/60 dark:hover:bg-amber-950/40 dark:hover:text-amber-200'
                                        )}
                                      >
                                        {isVerbLearned && (
                                          <Check className="h-2.5 w-2.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                        )}
                                        <span>{v.lemma}</span>
                                        <Volume2
                                          className={cn(
                                            'h-3 w-3 shrink-0 transition-all',
                                            isPlaying
                                              ? 'opacity-100 text-amber-600 dark:text-amber-400 animate-pulse scale-125'
                                              : 'opacity-50 group-hover/chip:opacity-100'
                                          )}
                                        />
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                                <Link
                                  href={`/practice/vocab-station?pack=${encodeURIComponent(packItem.id)}`}
                                  onClick={() => onSelectPack?.(packItem.id)}
                                  className={cn(
                                    buttonVariants({ variant: 'outline', size: 'sm' }),
                                    'w-full min-h-[44px] text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 hover:bg-amber-50 hover:text-amber-900 border-amber-200/80 dark:border-amber-900/40 dark:hover:bg-amber-950/40 dark:hover:text-amber-300 shadow-2xs touch-manipulation'
                                  )}
                                >
                                  <Play className="h-3.5 w-3.5 fill-current text-amber-600 dark:text-amber-400" />
                                  Vào Luyện Gói Này
                                </Link>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── R2 PART 2. 12 TOPICS COMPACT ACCORDION LIST ── */}
      <div
        id="stage-tabpanel"
        role="tabpanel"
        aria-labelledby={`stage-tab-${selectedStage}`}
        aria-label={`Danh sách chủ đề Chặng ${selectedStage}`}
        className="space-y-2"
      >
        <div className="flex items-center justify-between px-1 py-0.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              12 Chủ Đề Chặng {selectedStage}
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              {(currentStageData?.topics || []).length} chủ đề
            </span>
          </div>
          {(currentStageData?.topics || []).some((t) => t.id === expandedTopicId) && (
            <button
              type="button"
              onClick={() => setExpandedTopicId(null)}
              className="min-h-[44px] inline-flex items-center px-2 py-1 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded-md touch-manipulation"
            >
              Thu gọn
            </button>
          )}
        </div>

        <div className="space-y-2">
          {(currentStageData?.topics || []).map((topic: VocabStageTopic) => {
            const isExpanded = expandedTopicId === topic.id;
            const topicWordsInMastered = topic.words.filter((w) =>
              masteredWords.has(w.word.toLowerCase())
            ).length;
            const isTopicDone =
              completedTopics.has(topic.id) ||
              (topic.wordCount > 0 && topicWordsInMastered >= topic.wordCount);
            const topicProgressPct = Math.min(
              100,
              Math.round((topicWordsInMastered / topic.wordCount) * 100)
            );

            return (
              <div
                key={topic.id}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isExpanded
                    ? 'border-sky-300 bg-white ring-1 ring-sky-300/60 shadow-xs dark:border-sky-700 dark:bg-slate-900 dark:ring-sky-700/60'
                    : 'border-slate-200/90 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700'
                }`}
                data-testid={`topic-row-${topic.id}`}
              >
                {/* Compact Row Header */}
                <button
                  id={`topic-toggle-${topic.id}`}
                  type="button"
                  onClick={() => {
                    setExpandedTopicId((prev) => {
                      const next = prev === topic.id ? null : topic.id;
                      if (next) setIsBedrockExpanded(false);
                      return next;
                    });
                  }}
                  className="w-full min-h-[52px] p-3 sm:px-4 flex items-center justify-between gap-2.5 sm:gap-3 text-left transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-800/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:focus-visible:ring-sky-400 focus-visible:ring-inset touch-manipulation"
                  data-testid={`topic-toggle-${topic.id}`}
                  aria-expanded={isExpanded}
                  aria-controls={`topic-content-${topic.id}`}
                >
                  {/* Left: Icon & Title */}
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-base dark:bg-slate-800">
                      {topic.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-1.5 flex-wrap">
                        <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 shrink-0">
                          {topic.index}.
                        </span>
                        <span role="heading" aria-level={4} className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate block">
                          {topic.title}
                        </span>
                        <span className="text-xs text-slate-400 dark:text-slate-500 font-normal truncate hidden sm:inline">
                          · {topic.titleEn}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 block sm:hidden truncate">
                        {topic.titleEn}
                      </span>
                    </div>
                  </div>

                  {/* Right: Word count, Progress, Chevron */}
                  <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
                    <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium shrink-0">
                      {topic.wordCount} từ
                    </span>

                    {isTopicDone ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 shrink-0">
                        <Check className="h-3 w-3" /> Xong
                      </span>
                    ) : (
                      <div className="flex items-center gap-1 sm:gap-2">
                        {/* Mini Progress Bar */}
                        <div className="w-10 sm:w-16 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-sky-500 transition-all duration-300"
                            style={{ width: `${Math.max(2, topicProgressPct)}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300 w-6 sm:w-7 text-right hidden sm:inline-block">
                          {topicProgressPct}%
                        </span>
                      </div>
                    )}

                    <ChevronDown
                      className={`h-4 w-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                        isExpanded ? 'rotate-180 text-sky-600 dark:text-sky-400' : ''
                      }`}
                    />
                  </div>
                </button>

                {/* Expanded Inline Content */}
                {isExpanded && (
                  <div
                    id={`topic-content-${topic.id}`}
                    role="region"
                    aria-labelledby={`topic-toggle-${topic.id}`}
                    className="border-t border-slate-100 bg-slate-50/60 p-4 sm:p-5 dark:border-slate-800/80 dark:bg-slate-900/50 space-y-3.5"
                    data-testid={`topic-content-${topic.id}`}
                  >
                    {/* Short description */}
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {topic.description}
                    </p>

                    {/* Sample word chips with audio */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        <span>Từ vựng tiêu biểu (bấm để nghe):</span>
                        <span>Đã thuộc: {topicWordsInMastered}/{topic.wordCount}</span>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {topic.words.slice(0, 8).map((w: VocabStageItem) => {
                          const isWordLearned = masteredWords.has(w.word.toLowerCase());
                          const isPlaying = playingWord === w.word;
                          return (
                            <button
                              key={w.id}
                              type="button"
                              onClick={(e) => handlePlayAudio(e, w.word)}
                              title={`${w.meaningVi} · ${w.ipa}`}
                              aria-label={`Phát âm từ ${w.word}`}
                              aria-busy={isPlaying}
                              className={cn(
                                'group/chip inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-all min-h-[36px] touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:focus-visible:ring-sky-400',
                                isPlaying
                                  ? 'border-sky-400 bg-sky-100/80 text-sky-950 dark:border-sky-700 dark:bg-sky-950/70 dark:text-sky-200 shadow-2xs'
                                  : isWordLearned
                                  ? 'border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-100/70 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200 dark:hover:bg-emerald-900/30'
                                  : 'border-slate-200 bg-white text-slate-700 hover:border-sky-400 hover:bg-sky-50 hover:text-sky-900 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:border-sky-700/60 dark:hover:bg-sky-950/40 dark:hover:text-sky-200'
                              )}
                            >
                              <span className="font-semibold">{w.word}</span>
                              <span className="text-[10px] opacity-70">({w.meaningVi})</span>
                              <Volume2
                                className={cn(
                                  'h-3 w-3 shrink-0 transition-all',
                                  isPlaying
                                    ? 'opacity-100 text-sky-600 dark:text-sky-400 animate-pulse scale-125'
                                    : 'opacity-50 group-hover/chip:opacity-100'
                                )}
                              />
                            </button>
                          );
                        })}
                        {topic.wordCount > 8 && (
                          <Link
                            href={`/practice/vocab-station?topic=${encodeURIComponent(topic.id)}`}
                            className="inline-flex items-center px-2.5 py-1 text-xs font-semibold text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 hover:underline min-h-[44px] touch-manipulation"
                          >
                            +{topic.wordCount - 8} từ khác →
                          </Link>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons: Main Button & Quick Modes */}
                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <Link
                        href={`/practice/vocab-station?topic=${encodeURIComponent(topic.id)}`}
                        className={cn(
                          buttonVariants({ variant: 'chunky', size: 'sm' }),
                          'w-full min-h-[44px] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs flex-1 touch-manipulation'
                        )}
                      >
                        <Play className="h-3.5 w-3.5 fill-current" />
                        Vào Luyện Tập Chủ Đề Này
                        <ArrowRight className="h-3.5 w-3.5 ml-0.5" />
                      </Link>

                      {/* Quick Modes */}
                      <div className="grid grid-cols-3 gap-1 shrink-0">
                        <Link
                          href={`/practice/vocab-station?topic=${encodeURIComponent(topic.id)}&tab=flashcard`}
                          className="min-h-[44px] flex items-center justify-center rounded-xl bg-slate-100 px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-bold text-slate-700 hover:bg-sky-100 hover:text-sky-900 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-sky-950/40 dark:hover:text-sky-300 transition-colors text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 touch-manipulation"
                          title="Thẻ từ 2.0"
                        >
                          💡 Thẻ từ
                        </Link>
                        <Link
                          href={`/practice/vocab-station?topic=${encodeURIComponent(topic.id)}&tab=cloze`}
                          className="min-h-[44px] flex items-center justify-center rounded-xl bg-slate-100 px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-bold text-slate-700 hover:bg-sky-100 hover:text-sky-900 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-sky-950/40 dark:hover:text-sky-300 transition-colors text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 touch-manipulation"
                          title="Đục lỗ câu"
                        >
                          ✍️ Đục lỗ
                        </Link>
                        <Link
                          href={`/practice/vocab-station?topic=${encodeURIComponent(topic.id)}&tab=match`}
                          className="min-h-[44px] flex items-center justify-center rounded-xl bg-slate-100 px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-bold text-slate-700 hover:bg-sky-100 hover:text-sky-900 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-sky-950/40 dark:hover:text-sky-300 transition-colors text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 touch-manipulation"
                          title="Ghép cặp phản xạ"
                        >
                          ⚡ Phản xạ
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
