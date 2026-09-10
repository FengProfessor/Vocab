'use client';

/**
 * Trạm Luyện Từ Vựng Đa Năng (Vocab Practice Station)
 * Dành riêng cho học sinh mất gốc / biết ít:
 * - 100 Động từ Cốt lõi (5 Tầng Sư Phạm) xác định bố cục câu & dịch thuật.
 * - 5 Chế độ luyện tập đa giác quan thay vì chỉ flashcard:
 *   1) Flashcard 2.0 (Phát âm + Mẫu câu chuẩn S-V-O + Collocation)
 *   2) Đục lỗ câu (Sentence Cloze với 4 lựa chọn & giải thích)
 *   3) Đoạn văn ngữ cảnh (Story Reading & Thử thách đục lỗ câu chuyện)
 *   4) Bố cục câu (Sentence Builder S-V-O xếp từ)
 *   5) Ghép cặp phản xạ (Speed Match)
 * - Tự động đồng bộ tiến độ Lộ trình (completeRoadmapStep) khi có ?roadmapStep=...
 */

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Flame,
  Layers,
  Lightbulb,
  RotateCcw,
  Shuffle,
  Snail,
  Sparkles,
  Trophy,
  Volume2,
  X,
  Zap,
} from 'lucide-react';
import { StudentShell } from '@/components/student/StudentShell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Celebration } from '@/components/gamification/Celebration';
import { playWordAudio } from '@/lib/audio';
import {
  getFoundationVerbPacks,
  getFoundationVerbPack,
  resolveFoundationVerbPack,
  type FoundationVerbPack,
  type FoundationVerbItem,
} from '@/lib/roadmap';
import { completeRoadmapStep } from '@/lib/roadmap-client';
import {
  getVocabTopic,
  getAllVocabTopics,
  type VocabStageTopic,
  type VocabStageItem,
} from '@/lib/vocab-stages';

type PracticeTab = 'flashcard' | 'cloze' | 'story' | 'builder' | 'match';

export default function VocabStationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-sm text-muted-foreground">Đang tải Trạm Luyện Từ Vựng...</p>
        </div>
      }
    >
      <VocabStationContent />
    </Suspense>
  );
}

function VocabStationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const packParam = searchParams.get('pack');
  const topicParam = searchParams.get('topic');
  const roadmapStep = searchParams.get('roadmapStep');
  const tabParam = searchParams.get('tab') as PracticeTab | null;
  const validTabs: PracticeTab[] = ['flashcard', 'cloze', 'story', 'builder', 'match'];

  const allPacks = useMemo(() => getFoundationVerbPacks(), []);
  const allTopics = useMemo(() => getAllVocabTopics(), []);
  const activeTopic = useMemo(() => (topicParam ? getVocabTopic(topicParam) : null), [topicParam]);
  const isTopicMode = !!activeTopic;

  const initialPack = useMemo(() => resolveFoundationVerbPack(packParam), [packParam]);
  const [currentPackId, setCurrentPackId] = useState<string>(initialPack.id);
  const [activeTab, setActiveTab] = useState<PracticeTab>(
    tabParam && validTabs.includes(tabParam) ? tabParam : 'flashcard'
  );

  // Sync tab if query param changes or if in topic mode
  useEffect(() => {
    if (isTopicMode && (tabParam === 'story' || tabParam === 'builder')) {
      setActiveTab('flashcard');
    } else if (tabParam && validTabs.includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam, isTopicMode]);

  // Sync currentPackId whenever packParam changes
  useEffect(() => {
    if (packParam) {
      const resolved = resolveFoundationVerbPack(packParam);
      if (resolved.id !== currentPackId) {
        setCurrentPackId(resolved.id);
      }
    }
  }, [packParam, currentPackId]);

  const pack: FoundationVerbPack = useMemo(() => {
    return getFoundationVerbPack(currentPackId) || allPacks[0];
  }, [currentPackId, allPacks]);

  // Unified items list (adapting topic words or foundation verbs)
  const activeWords = useMemo(() => {
    if (isTopicMode && activeTopic) {
      return activeTopic.words.map((w) => ({
        id: w.id,
        lemma: w.word,
        ipa: w.ipa,
        pos: w.pos,
        meaningVi: w.meaningVi,
        pattern: w.pos ? `Từ loại: ${w.pos.toUpperCase()}` : '',
        collocation: w.collocation || '',
        example: w.example,
        exampleVi: w.exampleVi,
        cloze: w.cloze,
        sentenceScramble: undefined as
          | { tokens: string[]; answer: string[]; meaningVi: string }
          | undefined,
      }));
    }
    return pack.verbs;
  }, [isTopicMode, activeTopic, pack]);

  const handlePackChange = (newPackId: string) => {
    setCurrentPackId(newPackId);
    const params = new URLSearchParams(searchParams.toString());
    params.delete('topic');
    params.set('pack', newPackId);
    router.replace(`/practice/vocab-station?${params.toString()}`, { scroll: false });
  };

  const handleTopicChange = (newTopicId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('pack');
    params.set('topic', newTopicId);
    router.replace(`/practice/vocab-station?${params.toString()}`, { scroll: false });
  };

  // Flashcard State
  const [cardIdx, setCardIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [masteredWords, setMasteredWords] = useState<Set<string>>(new Set());

  // Load mastered words from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem('vocab_station_mastered_words');
      if (raw) setMasteredWords(new Set(JSON.parse(raw)));
    } catch {
      /* ignore */
    }
  }, []);

  const addMasteredWord = useCallback((word: string) => {
    setMasteredWords((prev) => {
      const next = new Set(prev);
      next.add(word.toLowerCase());
      try {
        localStorage.setItem('vocab_station_mastered_words', JSON.stringify(Array.from(next)));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  // Cloze State
  const [clozeIdx, setClozeIdx] = useState(0);
  const [clozeSelected, setClozeSelected] = useState<string | null>(null);
  const [clozeSubmitted, setClozeSubmitted] = useState(false);
  const [clozeScore, setClozeScore] = useState(0);

  // Story State
  const [showStoryVi, setShowStoryVi] = useState(false);
  const [storyClozeMode, setStoryClozeMode] = useState(false);
  const [storyUserAnswers, setStoryUserAnswers] = useState<Record<number, string>>({});
  const [storyRevealed, setStoryRevealed] = useState(false);
  const [activeWordTooltip, setActiveWordTooltip] = useState<FoundationVerbItem | null>(null);

  // Sentence Builder State
  const [builderIdx, setBuilderIdx] = useState(0);
  const [selectedTokens, setSelectedTokens] = useState<string[]>([]);
  const [builderChecked, setBuilderChecked] = useState(false);
  const [builderIsCorrect, setBuilderIsCorrect] = useState(false);
  const [builderScore, setBuilderScore] = useState(0);

  // Match Game State
  const [matchCards, setMatchCards] = useState<
    Array<{ id: string; text: string; type: 'en' | 'vi'; pairId: string; matched: boolean }>
  >([]);
  const [selectedCard, setSelectedCard] = useState<{
    id: string;
    type: 'en' | 'vi';
    pairId: string;
  } | null>(null);
  const [matchStreak, setMatchStreak] = useState(0);
  const [matchSuccessCount, setMatchSuccessCount] = useState(0);

  // Celebration & Roadmap Progress
  const [celebration, setCelebration] = useState(false);
  const [stepCompleted, setStepCompleted] = useState(false);

  // Sync with pack or topic change
  useEffect(() => {
    setCardIdx(0);
    setFlipped(false);
    setClozeIdx(0);
    setClozeSelected(null);
    setClozeSubmitted(false);
    setClozeScore(0);
    setShowStoryVi(false);
    setStoryClozeMode(false);
    setStoryUserAnswers({});
    setStoryRevealed(false);
    setActiveWordTooltip(null);
    setBuilderIdx(0);
    setSelectedTokens([]);
    setBuilderChecked(false);
    setBuilderIsCorrect(false);
    setBuilderScore(0);
  }, [currentPackId, topicParam]);

  // Audio helper
  const handlePlayAudio = (text: string, rate: number = 1.0) => {
    void playWordAudio(text, null, rate);
  };

  // Complete roadmap step helper
  const triggerRoadmapCompletion = useCallback(async () => {
    try {
      if (isTopicMode && activeTopic) {
        const raw = localStorage.getItem('vocab_station_completed_topics');
        const list: string[] = raw ? JSON.parse(raw) : [];
        if (!list.includes(activeTopic.id)) {
          list.push(activeTopic.id);
          localStorage.setItem('vocab_station_completed_topics', JSON.stringify(list));
        }
      } else if (pack) {
        const raw = localStorage.getItem('vocab_station_completed_packs');
        const list: string[] = raw ? JSON.parse(raw) : [];
        if (!list.includes(pack.id)) {
          list.push(pack.id);
          localStorage.setItem('vocab_station_completed_packs', JSON.stringify(list));
        }
      }
    } catch {
      /* ignore */
    }

    if (roadmapStep && !stepCompleted) {
      try {
        const res = await completeRoadmapStep(roadmapStep);
        if (res) {
          setStepCompleted(true);
          toast.success(`Chúc mừng! +${res.xpAwarded} XP đã được ghi nhận vào lộ trình.`);
        }
      } catch {
        // Fallback
      }
    }
  }, [isTopicMode, activeTopic, pack, roadmapStep, stepCompleted]);

  // Initialize match cards using activeWords
  const initMatchGame = useCallback(() => {
    if (!activeWords?.length) return;
    const cards: Array<{
      id: string;
      text: string;
      type: 'en' | 'vi';
      pairId: string;
      matched: boolean;
    }> = [];
    // Randomly select 6 items across all words
    const shuffled = [...activeWords].sort(() => 0.5 - Math.random()).slice(0, 6);
    const ts = Date.now();
    shuffled.forEach((v, i) => {
      cards.push({ id: `en-${i}-${ts}`, text: v.lemma, type: 'en', pairId: v.lemma, matched: false });
      cards.push({
        id: `vi-${i}-${ts}`,
        text: v.meaningVi,
        type: 'vi',
        pairId: v.lemma,
        matched: false,
      });
    });
    // Fisher-Yates shuffle
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }
    setMatchCards(cards);
    setSelectedCard(null);
    setMatchStreak(0);
    setMatchSuccessCount(0);
  }, [activeWords]);

  useEffect(() => {
    if (activeTab === 'match') {
      initMatchGame();
    }
  }, [activeTab, initMatchGame]);

  // Current verb/word for Flashcard
  const currentVerb = activeWords[cardIdx] || activeWords[0];

  // Shuffle tokens for current Sentence Builder item (guaranteed scrambled)
  const currentScramble = activeWords[builderIdx]?.sentenceScramble;
  const availableTokens = useMemo(() => {
    if (!currentScramble?.tokens?.length) return [];
    const arr = [...currentScramble.tokens];
    // Fisher-Yates shuffle
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    // If accidentally in exact answer order and length >= 3, swap first two tokens
    if (
      arr.length >= 3 &&
      arr.join(' ').toLowerCase() === currentScramble.answer.join(' ').toLowerCase()
    ) {
      [arr[0], arr[1]] = [arr[1], arr[0]];
    }
    return arr;
  }, [currentScramble]);

  const [poolTokens, setPoolTokens] = useState<string[]>([]);
  useEffect(() => {
    setPoolTokens(availableTokens);
    setSelectedTokens([]);
    setBuilderChecked(false);
    setBuilderIsCorrect(false);
  }, [availableTokens]);

  return (
    <StudentShell title="Trạm Luyện Từ Vựng" requireAuth={false}>
      <Celebration trigger={celebration} intensity="epic" />

      <div className="mx-auto max-w-4xl space-y-6 px-3 py-6 pb-28 sm:px-6">
        {/* Top Header & Breadcrumb */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Link
              href={isTopicMode ? `/journey?track=vocab&stage=${activeTopic?.stage || 1}` : (roadmapStep ? '/journey' : '/practice')}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                  <Sparkles className="h-3 w-3" />
                  {isTopicMode ? `Chặng ${activeTopic?.stage} · ${activeTopic?.badge}` : 'Mất Gốc · A0-A1'}
                </span>
                {roadmapStep && (
                  <span className="rounded-md bg-sky-500/10 px-2 py-0.5 text-xs font-semibold text-sky-600 dark:text-sky-400">
                    Gắn Lộ Trình
                  </span>
                )}
              </div>
              <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                {isTopicMode
                  ? `${activeTopic?.icon} ${activeTopic?.title} · ${activeTopic?.titleEn}`
                  : '100 Động Từ Cốt Lõi & Luyện Ngữ Cảnh'}
              </h1>
            </div>
          </div>

          {/* Selector Dropdown: Topic Selector or Pack Selector */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {isTopicMode ? 'Chủ Đề:' : 'Chọn Gói:'}
            </label>
            {isTopicMode ? (
              <select
                value={activeTopic?.id}
                onChange={(e) => handleTopicChange(e.target.value)}
                aria-label="Chọn Chủ Đề Từ Vựng"
                className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-800 shadow-xs focus:ring-2 focus:ring-sky-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 max-w-[220px] truncate"
              >
                {[1, 2, 3].map((sNum) => (
                  <optgroup key={`stage-grp-${sNum}`} label={`Chặng ${sNum}`}>
                    {allTopics
                      .filter((t) => t.stage === sNum)
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.icon} {t.title} ({t.wordCount} từ)
                        </option>
                      ))}
                  </optgroup>
                ))}
              </select>
            ) : (
              <select
                value={currentPackId}
                onChange={(e) => handlePackChange(e.target.value)}
                aria-label="Chọn Gói Từ Vựng"
                className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-800 shadow-xs focus:ring-2 focus:ring-amber-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
              >
                {allPacks.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({p.verbs.length} từ)
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Overview Card */}
        <Card className={`${isTopicMode ? 'border-sky-200/70 bg-gradient-to-br from-sky-50/60 via-blue-50/30 to-sky-50/20 dark:border-sky-900/40 dark:from-sky-950/20 dark:to-slate-900' : 'border-amber-200/70 bg-gradient-to-br from-amber-50/60 via-orange-50/30 to-amber-50/20 dark:border-amber-900/40 dark:from-amber-950/20 dark:to-slate-900'}`}>
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`${isTopicMode ? 'border-sky-400 font-bold text-sky-700 dark:text-sky-300' : 'border-amber-400 font-bold text-amber-700 dark:text-amber-300'}`}>
                    {isTopicMode ? `Chủ đề ${activeTopic?.index} / 12` : `Tầng ${pack.tier}`}
                  </Badge>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    {isTopicMode ? `${activeTopic?.icon} ${activeTopic?.title}` : pack.title}
                  </h2>
                </div>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 sm:text-sm">
                  {isTopicMode ? activeTopic?.description : pack.description}
                </p>
              </div>

              {/* Progress Chip */}
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-xs font-medium text-slate-700 shadow-xs dark:border-slate-800 dark:bg-slate-900/90 dark:text-slate-200">
                <Trophy className="h-4 w-4 text-amber-500" />
                <span>Đã thuộc:</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  {activeWords.filter(w => masteredWords.has(w.lemma.toLowerCase())).length} / {activeWords.length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mode Navigation Tabs */}
        <div className="flex overflow-x-auto rounded-2xl border border-slate-200 bg-slate-100/80 p-1 dark:border-slate-800 dark:bg-slate-900">
          <button
            onClick={() => setActiveTab('flashcard')}
            className={`flex flex-1 min-w-[120px] items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold transition-all sm:text-sm ${
              activeTab === 'flashcard'
                ? 'bg-white text-amber-600 shadow-xs dark:bg-slate-800 dark:text-amber-400'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Lightbulb className="h-4 w-4 shrink-0" />
            <span>1. Thẻ Từ 2.0</span>
          </button>

          <button
            onClick={() => setActiveTab('cloze')}
            className={`flex flex-1 min-w-[120px] items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold transition-all sm:text-sm ${
              activeTab === 'cloze'
                ? 'bg-white text-blue-600 shadow-xs dark:bg-slate-800 dark:text-blue-400'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>2. Đục Lỗ Câu</span>
          </button>

          {!isTopicMode && (
            <>
              <button
                onClick={() => setActiveTab('story')}
                className={`flex flex-1 min-w-[120px] items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold transition-all sm:text-sm ${
                  activeTab === 'story'
                    ? 'bg-white text-teal-600 shadow-xs dark:bg-slate-800 dark:text-teal-400'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <BookOpen className="h-4 w-4 shrink-0" />
                <span>3. Đoạn Văn</span>
              </button>

              <button
                onClick={() => setActiveTab('builder')}
                className={`flex flex-1 min-w-[120px] items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold transition-all sm:text-sm ${
                  activeTab === 'builder'
                    ? 'bg-white text-indigo-600 shadow-xs dark:bg-slate-800 dark:text-indigo-400'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <Layers className="h-4 w-4 shrink-0" />
                <span>4. Bố Cục S-V-O</span>
              </button>
            </>
          )}

          <button
            onClick={() => setActiveTab('match')}
            className={`flex flex-1 min-w-[120px] items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold transition-all sm:text-sm ${
              activeTab === 'match'
                ? 'bg-white text-rose-600 shadow-xs dark:bg-slate-800 dark:text-rose-400'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Zap className="h-4 w-4 shrink-0" />
            <span>{isTopicMode ? '3. Phản Xạ Nhanh' : '5. Phản Xạ Nhanh'}</span>
          </button>
        </div>

        {/* ──────────────────────────────────────────────────────────── */}
        {/* TAB 1: FLASHCARD 2.0 (LÀM QUEN & BỐ CỤC CÂU)               */}
        {/* ──────────────────────────────────────────────────────────── */}
        {activeTab === 'flashcard' && currentVerb && (
          <div className="space-y-4">
            {/* Step Counter */}
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
              <span>
                Từ {cardIdx + 1} / {activeWords.length}
              </span>
              <span className="text-amber-600 dark:text-amber-400">
                Chạm vào thẻ để lật xem giải nghĩa & ví dụ
              </span>
            </div>

            {/* Interactive Card */}
            <div
              onClick={() => setFlipped(!flipped)}
              className="group relative min-h-[300px] cursor-pointer select-none rounded-3xl border-2 border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-amber-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 sm:p-8"
            >
              {!flipped ? (
                // MẶT TRƯỚC: Từ vựng, IPA, Phát âm & Cấu trúc câu
                <div className="flex flex-col items-center justify-center space-y-4 text-center">
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black uppercase text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                    Động từ cốt lõi
                  </span>

                  <h3 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white sm:text-5xl">
                    {currentVerb.lemma}
                  </h3>

                  <div className="flex items-center gap-2 text-base font-semibold text-slate-500 dark:text-slate-400">
                    <span>{currentVerb.ipa}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlayAudio(currentVerb.lemma);
                      }}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-700 transition hover:scale-110 active:scale-95 dark:bg-amber-900/50 dark:text-amber-300"
                      title="Phát âm chuẩn"
                    >
                      <Volume2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlayAudio(currentVerb.lemma, 0.75);
                      }}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:scale-110 active:scale-95 dark:bg-slate-800 dark:text-slate-300"
                      title="Phát âm chậm 0.75x"
                    >
                      <Snail className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Highlight Mẫu Câu Chuẩn */}
                  <div className="mt-4 w-full rounded-2xl border border-amber-200 bg-amber-50/80 p-3.5 text-left dark:border-amber-900/50 dark:bg-amber-950/30">
                    <span className="text-[11px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
                      🎯 Mẫu câu đi kèm (Sentence Pattern):
                    </span>
                    <p className="mt-1 font-mono text-sm font-bold text-slate-900 dark:text-white">
                      {currentVerb.pattern}
                    </p>
                  </div>

                  <p className="pt-2 text-xs font-medium text-slate-400">
                    (Chạm vào bất cứ đâu để xem nghĩa tiếng Việt & ví dụ)
                  </p>
                </div>
              ) : (
                // MẶT SAU: Nghĩa tiếng Việt, Collocation & Câu ví dụ song ngữ
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center justify-between border-b pb-3 dark:border-slate-800">
                    <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                      {currentVerb.lemma} {currentVerb.ipa}
                    </span>
                    <span className="text-xs font-medium text-slate-400">Chạm để lật lại</span>
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-slate-400">Nghĩa tiếng Việt:</span>
                    <p className="text-2xl font-black text-slate-900 dark:text-white">
                      {currentVerb.meaningVi}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      Cụm hay gặp (Collocation):
                    </span>
                    <p className="mt-0.5 text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {currentVerb.collocation}
                    </p>
                  </div>

                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                        Ví dụ thực tế:
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayAudio(currentVerb.example);
                        }}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline dark:text-emerald-400"
                      >
                        <Volume2 className="h-3.5 w-3.5" /> Nghe câu
                      </button>
                    </div>
                    <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
                      {currentVerb.example}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
                      {currentVerb.exampleVi}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Controls */}
            <div className="flex items-center justify-between gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setCardIdx((prev) => Math.max(0, prev - 1));
                  setFlipped(false);
                }}
                disabled={cardIdx === 0}
                className="rounded-xl border-slate-200 dark:border-slate-800"
              >
                <ChevronLeft className="mr-1 h-4 w-4" /> Từ trước
              </Button>

              <Button
                onClick={() => {
                  addMasteredWord(currentVerb.lemma);
                  if (cardIdx + 1 < activeWords.length) {
                    setCardIdx((prev) => prev + 1);
                    setFlipped(false);
                  } else {
                    toast.success(`Bạn đã xem hết ${activeWords.length} từ trong gói! Hãy thử làm bài đục lỗ.`);
                    setCelebration(true);
                    triggerRoadmapCompletion();
                  }
                }}
                className="rounded-xl bg-amber-600 font-bold text-white hover:bg-amber-700"
              >
                <Check className="mr-1 h-4 w-4" />
                {cardIdx + 1 < activeWords.length ? 'Đã nhớ · Tiếp theo' : 'Hoàn thành xem thẻ'}
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  setCardIdx((prev) => Math.min(activeWords.length - 1, prev + 1));
                  setFlipped(false);
                }}
                disabled={cardIdx === activeWords.length - 1}
                className="rounded-xl border-slate-200 dark:border-slate-800"
              >
                Tiếp <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>

            {/* Prompt to move to mode 2 */}
            {(cardIdx === activeWords.length - 1 || masteredWords.size >= activeWords.length) && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-blue-200 bg-blue-50/80 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
                <div>
                  <p className="text-xs font-bold text-blue-900 dark:text-blue-200">
                    💡 Sẵn sàng kiểm tra trí nhớ ngữ cảnh?
                  </p>
                  <p className="text-[11px] text-blue-700 dark:text-blue-300">
                    Áp dụng ngay các động từ vừa học vào bài tập đục lỗ câu với phản hồi tức thì.
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => setActiveTab('cloze')}
                  className="rounded-xl bg-blue-600 px-4 text-xs font-bold text-white hover:bg-blue-700"
                >
                  2. Sang Đục Lỗ Câu →
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ──────────────────────────────────────────────────────────── */}
        {/* TAB 2: ĐỤC LỖ CÂU (SENTENCE CLOZE & EXPLANATION)            */}
        {/* ──────────────────────────────────────────────────────────── */}
        {activeTab === 'cloze' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
              <span>
                Câu {clozeIdx + 1} / {activeWords.length}
              </span>
              <span className="text-blue-600 dark:text-blue-400">
                Đúng: {clozeScore} / {activeWords.length}
              </span>
            </div>

            {/* Cloze Card */}
            {activeWords[clozeIdx]?.cloze && (
              <Card className="border-2 border-blue-100 bg-white dark:border-slate-800 dark:bg-slate-900">
                <CardContent className="space-y-6 p-6 sm:p-8">
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                      Chọn đáp án thích hợp điền vào chỗ trống:
                    </span>
                    <p className="text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">
                      {activeWords[clozeIdx].cloze.sentence}
                    </p>
                  </div>

                  {/* 4 Options */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {activeWords[clozeIdx].cloze.options.map((opt) => {
                      const isSelected = clozeSelected === opt;
                      const isCorrect = opt === activeWords[clozeIdx].cloze.answer;

                      let btnStyle =
                        'border-slate-200 hover:border-blue-400 dark:border-slate-700';
                      if (clozeSubmitted) {
                        if (isCorrect) {
                          btnStyle =
                            'border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200';
                        } else if (isSelected && !isCorrect) {
                          btnStyle =
                            'border-rose-500 bg-rose-50 text-rose-900 dark:bg-rose-950/40 dark:text-rose-200';
                        }
                      } else if (isSelected) {
                        btnStyle = 'border-blue-500 bg-blue-50/50 text-blue-900';
                      }

                      return (
                        <button
                          key={opt}
                          disabled={clozeSubmitted}
                          onClick={() => setClozeSelected(opt)}
                          className={`flex items-center justify-between rounded-2xl border-2 p-4 text-left font-bold transition-all ${btnStyle}`}
                        >
                          <span className="text-base">{opt}</span>
                          {clozeSubmitted && isCorrect && (
                            <Check className="h-5 w-5 text-emerald-600" />
                          )}
                          {clozeSubmitted && isSelected && !isCorrect && (
                            <X className="h-5 w-5 text-rose-600" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Explanation box after submit */}
                  {clozeSubmitted && (
                    <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 dark:border-blue-900/40 dark:bg-blue-950/30">
                      <div className="flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                          Giải thích ngữ cảnh:
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-800 dark:text-slate-200">
                        {activeWords[clozeIdx].cloze.explain}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-3 pt-2">
                    {!clozeSubmitted ? (
                      <Button
                        onClick={() => {
                          if (!clozeSelected) {
                            toast.error('Vui lòng chọn một đáp án');
                            return;
                          }
                          setClozeSubmitted(true);
                          const isCorrect =
                            clozeSelected === activeWords[clozeIdx].cloze.answer;
                          if (isCorrect) {
                            setClozeScore((s) => s + 1);
                            toast.success('Chính xác!');
                            handlePlayAudio(
                              activeWords[clozeIdx].cloze.sentence.replace(
                                '_____',
                                activeWords[clozeIdx].cloze.answer
                              )
                            );
                          } else {
                            toast.error('Chưa chính xác, hãy đọc kỹ lời giải thích nhé.');
                          }
                        }}
                        className="rounded-xl bg-blue-600 px-6 font-bold text-white hover:bg-blue-700"
                      >
                        Kiểm tra
                      </Button>
                    ) : (
                      <Button
                        onClick={() => {
                          if (clozeIdx + 1 < activeWords.length) {
                            setClozeIdx((i) => i + 1);
                            setClozeSelected(null);
                            setClozeSubmitted(false);
                          } else {
                            setCelebration(true);
                            triggerRoadmapCompletion();
                            toast.success(
                              `Hoàn thành! Bạn trả lời đúng ${clozeScore}/${activeWords.length} câu.`
                            );
                          }
                        }}
                        className="rounded-xl bg-blue-600 px-6 font-bold text-white hover:bg-blue-700"
                      >
                        {clozeIdx + 1 < activeWords.length ? (
                          <>
                            Câu kế tiếp <ArrowRight className="ml-1 h-4 w-4" />
                          </>
                        ) : (
                          'Hoàn thành bài đục lỗ'
                        )}
                      </Button>
                    )}
                  </div>

                  {/* Transition card when finishing cloze */}
                  {clozeIdx === activeWords.length - 1 && clozeSubmitted && (
                    isTopicMode ? (
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50/80 p-4 dark:border-rose-900/40 dark:bg-rose-950/20">
                        <div>
                          <p className="text-xs font-bold text-rose-900 dark:text-rose-200">
                            ⚡ Bước tiếp theo: Đấu trường Phản xạ nhanh
                          </p>
                          <p className="text-[11px] text-rose-700 dark:text-rose-300">
                            Ghép siêu tốc từ tiếng Anh với nghĩa tiếng Việt để củng cố phản xạ tức thì.
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => setActiveTab('match')}
                          className="rounded-xl bg-rose-600 px-4 text-xs font-bold text-white hover:bg-rose-700"
                        >
                          3. Phản Xạ Nhanh →
                        </Button>
                      </div>
                    ) : (
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-teal-200 bg-teal-50/80 p-4 dark:border-teal-900/40 dark:bg-teal-950/20">
                        <div>
                          <p className="text-xs font-bold text-teal-900 dark:text-teal-200">
                            📖 Bước tiếp theo: Đọc đoạn văn tự nhiên
                          </p>
                          <p className="text-[11px] text-teal-700 dark:text-teal-300">
                            Xem cách 10 động từ này kết hợp với nhau trong một câu chuyện ngắn hoàn chỉnh.
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => setActiveTab('story')}
                          className="rounded-xl bg-teal-600 px-4 text-xs font-bold text-white hover:bg-teal-700"
                        >
                          3. Đọc Đoạn Văn →
                        </Button>
                      </div>
                    )
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* ──────────────────────────────────────────────────────────── */}
        {/* TAB 3: ĐOẠN VĂN NGỮ CẢNH (STORY READING & CLOZE)             */}
        {/* ──────────────────────────────────────────────────────────── */}
        {activeTab === 'story' && pack.story && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {pack.story.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Đoạn văn tự nhiên kết nối 10 động từ cốt lõi của bài học
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowStoryVi(!showStoryVi)}
                  className="rounded-xl text-xs"
                >
                  {showStoryVi ? (
                    <>
                      <EyeOff className="mr-1 h-3.5 w-3.5" /> Ẩn dịch
                    </>
                  ) : (
                    <>
                      <Eye className="mr-1 h-3.5 w-3.5" /> Hiện dịch song ngữ
                    </>
                  )}
                </Button>

                <Button
                  size="sm"
                  onClick={() => {
                    setStoryClozeMode(!storyClozeMode);
                    setStoryRevealed(false);
                    setStoryUserAnswers({});
                  }}
                  className={`rounded-xl text-xs font-bold ${
                    storyClozeMode
                      ? 'bg-amber-600 text-white hover:bg-amber-700'
                      : 'bg-teal-600 text-white hover:bg-teal-700'
                  }`}
                >
                  {storyClozeMode ? 'Đọc lại đoạn văn' : 'Thử thách đục lỗ story'}
                </Button>
              </div>
            </div>

            {/* Story Card */}
            <Card className="border-teal-200/70 bg-gradient-to-br from-white to-teal-50/20 dark:border-slate-800 dark:bg-slate-900">
              <CardContent className="space-y-6 p-6 sm:p-8">
                {!storyClozeMode ? (
                  // CHẾ ĐỘ ĐỌC HIỂU TỰ NHIÊN
                  <div className="space-y-4">
                    <p className="text-lg leading-relaxed text-slate-800 dark:text-slate-200">
                      {pack.story.passage.split(/(\*\*[^*]+\*\*)/g).map((chunk, i) => {
                        const m = chunk.match(/^\*\*([^*]+)\*\*$/);
                        if (m) {
                          const word = m[1];
                          const verbData = pack.verbs.find(
                            (v) =>
                              v.lemma.toLowerCase() === word.toLowerCase() ||
                              word.toLowerCase().startsWith(v.lemma.toLowerCase().slice(0, 3))
                          );
                          return (
                            <button
                              key={i}
                              type="button"
                              onClick={() => {
                                handlePlayAudio(word);
                                if (verbData) setActiveWordTooltip(verbData);
                              }}
                              className="mx-0.5 inline-flex items-center rounded-md bg-amber-200/90 px-1.5 py-0.5 font-black text-amber-950 transition hover:bg-amber-300 hover:scale-105 active:scale-95 dark:bg-amber-500/30 dark:text-amber-200"
                            >
                              {word}
                            </button>
                          );
                        }
                        return <span key={i}>{chunk}</span>;
                      })}
                    </p>

                    <div className="flex items-center gap-2 pt-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handlePlayAudio(pack.story.passage.replace(/\*\*/g, ''))}
                        className="rounded-xl text-xs font-bold text-teal-700 dark:text-teal-300"
                      >
                        <Volume2 className="mr-1.5 h-4 w-4" /> Nghe toàn bộ đoạn văn
                      </Button>
                      <span className="text-xs text-slate-400">
                        (Bấm vào bất kỳ từ vàng nào để nghe và xem giải nghĩa nhanh)
                      </span>
                    </div>

                    {/* Word Quick Tooltip */}
                    {activeWordTooltip && (
                      <div className="rounded-xl border border-amber-300 bg-amber-50/90 p-3 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                        <div className="flex items-center justify-between font-bold">
                          <span>
                            {activeWordTooltip.lemma} {activeWordTooltip.ipa} —{' '}
                            {activeWordTooltip.meaningVi}
                          </span>
                          <button
                            type="button"
                            onClick={() => setActiveWordTooltip(null)}
                            className="text-slate-400 hover:text-slate-600"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <p className="mt-1 font-mono text-[11px] text-amber-800 dark:text-amber-300">
                          {activeWordTooltip.pattern}
                        </p>
                      </div>
                    )}

                    {/* Dual translation */}
                    {showStoryVi && (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm leading-relaxed text-slate-700 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-300">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                          Bản dịch tiếng Việt:
                        </span>
                        <p className="mt-1">{pack.story.passageVi}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  // CHẾ ĐỘ THỬ THÁCH ĐỤC LỖ CÂU CHUYỆN (STORY CLOZE)
                  <div className="space-y-6">
                    <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 text-xs font-semibold text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
                      Thử thách: Đọc đoạn văn và chọn từ thích hợp cho từng ô trống phía dưới. Các lựa chọn của bạn sẽ lập tức xuất hiện trong đoạn văn.
                    </div>

                    {/* Đoạn văn hiển thị trực tiếp các ô trống */}
                    <div className="rounded-2xl border border-teal-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                      <div className="mb-3 flex items-center justify-between text-xs font-bold text-teal-700 dark:text-teal-400">
                        <span>Đoạn văn thử thách ({pack.story.title}):</span>
                        {storyRevealed && (
                          <button
                            type="button"
                            onClick={() => handlePlayAudio(pack.story.passage.replace(/\*\*/g, ''))}
                            className="inline-flex items-center gap-1 text-xs font-bold text-teal-600 hover:underline"
                          >
                            <Volume2 className="h-3.5 w-3.5" /> Nghe toàn bộ đoạn văn
                          </button>
                        )}
                      </div>

                      <p className="text-base sm:text-lg leading-loose text-slate-800 dark:text-slate-200">
                        {pack.story.cloze.text.split(/(\{\{\d+\}\})/g).map((chunk, idx) => {
                          const m = chunk.match(/^\{\{(\d+)\}\}$/);
                          if (m) {
                            const blankId = parseInt(m[1], 10);
                            const blankDef = pack.story.cloze.blanks.find((b) => b.id === blankId);
                            const userChoice = storyUserAnswers[blankId];
                            const isAnswer = blankDef?.answer;
                            const isCorrect = userChoice === isAnswer;

                            let chipStyle =
                              'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200';
                            let displayLabel = userChoice
                              ? `(${blankId + 1}) ${userChoice}`
                              : `[ Ô ${blankId + 1}: _____ ]`;

                            if (storyRevealed) {
                              if (isCorrect) {
                                chipStyle =
                                  'border-emerald-500 bg-emerald-100 text-emerald-900 font-bold dark:bg-emerald-950/60 dark:text-emerald-200';
                                displayLabel = `(${blankId + 1}) ${userChoice} ✓`;
                              } else {
                                chipStyle =
                                  'border-rose-500 bg-rose-100 text-rose-900 font-bold dark:bg-rose-950/60 dark:text-rose-200';
                                displayLabel = `(${blankId + 1}) ${userChoice || 'trống'} ✗ (Đ/á: ${isAnswer})`;
                              }
                            } else if (userChoice) {
                              chipStyle =
                                'border-teal-500 bg-teal-50 text-teal-900 font-bold dark:border-teal-700 dark:bg-teal-950/40 dark:text-teal-200';
                            }

                            return (
                              <span
                                key={`blank-token-${blankId}`}
                                className={`mx-1 inline-flex items-center rounded-lg border-2 px-2.5 py-0.5 text-xs sm:text-sm font-bold shadow-xs transition-all ${chipStyle}`}
                              >
                                {displayLabel}
                              </span>
                            );
                          }
                          return <span key={idx}>{chunk}</span>;
                        })}
                      </p>
                    </div>

                    {/* Danh sách lựa chọn cho từng ô trống */}
                    <div className="space-y-4 text-base leading-loose text-slate-800 dark:text-slate-200">
                      {pack.story.cloze.blanks.map((b) => (
                        <div
                          key={b.id}
                          className="flex flex-col gap-2 rounded-xl border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-800/30 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            Chỗ trống [{b.id + 1}]:
                          </span>

                          <div className="flex flex-wrap gap-2">
                            {b.options.map((opt) => {
                              const isPicked = storyUserAnswers[b.id] === opt;
                              const isAnswer = b.answer === opt;

                              let chipStyle =
                                'border-slate-200 bg-white hover:border-teal-400 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200';
                              if (storyRevealed) {
                                if (isAnswer) {
                                  chipStyle =
                                    'border-emerald-500 bg-emerald-100 text-emerald-900 font-bold';
                                } else if (isPicked && !isAnswer) {
                                  chipStyle =
                                    'border-rose-500 bg-rose-100 text-rose-900 font-bold';
                                }
                              } else if (isPicked) {
                                chipStyle =
                                  'border-teal-600 bg-teal-50 text-teal-800 font-bold shadow-xs';
                              }

                              return (
                                <button
                                  key={opt}
                                  type="button"
                                  disabled={storyRevealed}
                                  onClick={() =>
                                    setStoryUserAnswers((prev) => ({ ...prev, [b.id]: opt }))
                                  }
                                  className={`rounded-lg border px-3 py-1.5 text-xs transition-all ${chipStyle}`}
                                >
                                  {opt}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      {storyRevealed && (
                        <Button
                          size="sm"
                          onClick={() => setActiveTab('builder')}
                          className="rounded-xl bg-indigo-600 px-4 text-xs font-bold text-white hover:bg-indigo-700"
                        >
                          4. Sang Bố Cục S-V-O →
                        </Button>
                      )}

                      {!storyRevealed ? (
                        <Button
                          onClick={() => {
                            if (
                              Object.keys(storyUserAnswers).length <
                              pack.story.cloze.blanks.length
                            ) {
                              toast.error('Bạn chưa điền hết các chỗ trống!');
                              return;
                            }
                            const total = pack.story.cloze.blanks.length;
                            const correct = pack.story.cloze.blanks.filter(
                              (b) => storyUserAnswers[b.id] === b.answer
                            ).length;
                            setStoryRevealed(true);
                            setCelebration(true);
                            triggerRoadmapCompletion();
                            toast.success(`Đã nộp bài! Bạn làm đúng ${correct}/${total} ô trống.`);
                          }}
                          className="ml-auto rounded-xl bg-teal-600 font-bold text-white hover:bg-teal-700"
                        >
                          Kiểm tra đoạn văn
                        </Button>
                      ) : (
                        <Button
                          onClick={() => {
                            setStoryClozeMode(false);
                            setStoryRevealed(false);
                            setStoryUserAnswers({});
                          }}
                          className="ml-auto rounded-xl bg-teal-600 font-bold text-white hover:bg-teal-700"
                        >
                          Quay lại đọc hiểu
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ──────────────────────────────────────────────────────────── */}
        {/* TAB 4: BỐ CỤC CÂU S-V-O (SENTENCE BUILDER)                  */}
        {/* ──────────────────────────────────────────────────────────── */}
        {activeTab === 'builder' && currentScramble && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
              <span>
                Câu {builderIdx + 1} / {pack.verbs.length}
              </span>
              <span className="text-indigo-600 dark:text-indigo-400">
                Đúng: {builderScore} / {pack.verbs.length}
              </span>
            </div>

            <Card className="border-2 border-indigo-100 bg-white dark:border-slate-800 dark:bg-slate-900">
              <CardContent className="space-y-6 p-6 sm:p-8">
                <div>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    Sắp xếp các khối từ để tạo thành câu chuẩn:
                  </span>
                  <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                    &quot;{currentScramble.meaningVi}&quot;
                  </p>
                </div>

                {/* Drop/Selected Slot Area */}
                <div className="min-h-[64px] flex flex-wrap items-center gap-2 rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/40 p-4 dark:border-indigo-900/40 dark:bg-indigo-950/20">
                  {selectedTokens.length === 0 ? (
                    <span className="text-xs text-slate-400">
                      Chạm vào các từ bên dưới để đưa vào câu theo đúng trật tự...
                    </span>
                  ) : (
                    selectedTokens.map((token, i) => (
                      <button
                        key={`${token}-${i}`}
                        type="button"
                        disabled={builderChecked}
                        onClick={() => {
                          setSelectedTokens((prev) => prev.filter((_, idx) => idx !== i));
                          setPoolTokens((prev) => [...prev, token]);
                        }}
                        className="rounded-xl border border-indigo-300 bg-white px-3 py-1.5 text-sm font-bold text-indigo-900 shadow-xs transition hover:bg-rose-50 hover:text-rose-700 dark:border-indigo-800 dark:bg-slate-800 dark:text-indigo-200"
                        title="Bấm để gỡ từ này"
                      >
                        {token}
                      </button>
                    ))
                  )}
                </div>

                {/* Available Pool Chips */}
                <div>
                  <span className="text-xs font-semibold text-slate-400">
                    Kho từ vựng (chạm để chọn):
                  </span>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {poolTokens.map((token, i) => (
                      <button
                        key={`${token}-${i}`}
                        type="button"
                        disabled={builderChecked}
                        onClick={() => {
                          setSelectedTokens((prev) => [...prev, token]);
                          setPoolTokens((prev) => prev.filter((_, idx) => idx !== i));
                        }}
                        className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm font-bold text-slate-800 shadow-xs transition hover:border-indigo-400 hover:bg-white active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      >
                        {token}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Result Feedback */}
                {builderChecked && (
                  <div
                    className={`rounded-2xl border p-4 ${
                      builderIsCorrect
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200'
                        : 'border-rose-200 bg-rose-50 text-rose-900 dark:bg-rose-950/40 dark:text-rose-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold">
                      {builderIsCorrect ? (
                        <>
                          <Check className="h-5 w-5 text-emerald-600" />
                          <span>Chính xác tuyệt đối!</span>
                        </>
                      ) : (
                        <>
                          <X className="h-5 w-5 text-rose-600" />
                          <span>Chưa đúng trật tự câu.</span>
                        </>
                      )}
                    </div>
                    <p className="mt-1 text-sm font-semibold">
                      Đáp án chuẩn:{' '}
                      <span className="font-bold underline">
                        {currentScramble.answer.join(' ')}
                      </span>
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setPoolTokens(availableTokens);
                      setSelectedTokens([]);
                      setBuilderChecked(false);
                      setBuilderIsCorrect(false);
                    }}
                    className="rounded-xl border-slate-200 dark:border-slate-800"
                  >
                    <RotateCcw className="mr-1 h-3.5 w-3.5" /> Xếp lại
                  </Button>

                  {!builderChecked ? (
                    <Button
                      onClick={() => {
                        if (selectedTokens.length === 0) {
                          toast.error('Vui lòng chọn từ để ghép câu');
                          return;
                        }
                        const isMatch =
                          selectedTokens.join(' ').trim().toLowerCase() ===
                          currentScramble.answer.join(' ').trim().toLowerCase();
                        setBuilderChecked(true);
                        setBuilderIsCorrect(isMatch);
                        if (isMatch) {
                          setBuilderScore((s) => s + 1);
                          toast.success('Rất tốt!');
                          handlePlayAudio(currentScramble.answer.join(' '));
                        } else {
                          toast.error('Chưa đúng, hãy xem đáp án chuẩn nhé!');
                        }
                      }}
                      className="rounded-xl bg-indigo-600 px-6 font-bold text-white hover:bg-indigo-700"
                    >
                      Kiểm tra câu
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2">
                      {!builderIsCorrect && (
                        <Button
                          variant="outline"
                          onClick={() => {
                            setPoolTokens(availableTokens);
                            setSelectedTokens([]);
                            setBuilderChecked(false);
                            setBuilderIsCorrect(false);
                          }}
                          className="rounded-xl border-indigo-200 text-xs font-bold text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-300"
                        >
                          <RotateCcw className="mr-1 h-3.5 w-3.5" /> Thử lại câu này
                        </Button>
                      )}
                      <Button
                        onClick={() => {
                          if (builderIdx + 1 < pack.verbs.length) {
                            setBuilderIdx((i) => i + 1);
                          } else {
                            setCelebration(true);
                            triggerRoadmapCompletion();
                            toast.success(
                              `Hoàn thành! Bạn đã xếp đúng ${builderScore}/${pack.verbs.length} câu.`
                            );
                          }
                        }}
                        className="rounded-xl bg-indigo-600 px-6 font-bold text-white hover:bg-indigo-700"
                      >
                        {builderIdx + 1 < pack.verbs.length ? (
                          <>
                            Câu kế tiếp <ArrowRight className="ml-1 h-4 w-4" />
                          </>
                        ) : (
                          'Hoàn thành xếp câu'
                        )}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Transition card when finishing sentence builder */}
                {builderIdx === pack.verbs.length - 1 && builderChecked && (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50/80 p-4 dark:border-rose-900/40 dark:bg-rose-950/20">
                    <div>
                      <p className="text-xs font-bold text-rose-900 dark:text-rose-200">
                        ⚡ Bước cuối: Đấu trường Phản xạ nhanh
                      </p>
                      <p className="text-[11px] text-rose-700 dark:text-rose-300">
                        Ghép siêu tốc từ tiếng Anh với nghĩa tiếng Việt để tạo chuỗi streak ăn mừng!
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => setActiveTab('match')}
                      className="rounded-xl bg-rose-600 px-4 text-xs font-bold text-white hover:bg-rose-700"
                    >
                      5. Phản Xạ Nhanh →
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ──────────────────────────────────────────────────────────── */}
        {/* TAB 5: GHÉP CẶP PHẢN XẠ NHANH (SPEED MATCH)                 */}
        {/* ──────────────────────────────────────────────────────────── */}
        {activeTab === 'match' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <Flame className="h-4 w-4" /> Streak: {matchStreak}
              </span>
              <span className="text-rose-600 dark:text-rose-400">
                Đã ghép: {matchSuccessCount} / 6 cặp
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {matchCards.map((card) => {
                const isSelected = selectedCard?.id === card.id;

                let cardStyle =
                  'border-slate-200 bg-white hover:border-rose-400 text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100';
                if (card.matched) {
                  cardStyle =
                    'border-emerald-300 bg-emerald-50 text-emerald-700 opacity-40 pointer-events-none dark:bg-emerald-950/20';
                } else if (isSelected) {
                  cardStyle =
                    'border-rose-500 bg-rose-50 text-rose-900 ring-2 ring-rose-400 dark:bg-rose-950/40 dark:text-rose-200';
                }

                return (
                  <button
                    key={card.id}
                    type="button"
                    disabled={card.matched}
                    onClick={() => {
                      if (card.matched) return;

                      // If first card picked
                      if (!selectedCard) {
                        setSelectedCard({ id: card.id, type: card.type, pairId: card.pairId });
                        if (card.type === 'en') handlePlayAudio(card.text);
                        return;
                      }

                      // Same card clicked again -> deselect
                      if (selectedCard.id === card.id) {
                        setSelectedCard(null);
                        return;
                      }

                      // Check if match
                      if (
                        selectedCard.pairId === card.pairId &&
                        selectedCard.type !== card.type
                      ) {
                        // MATCH!
                        setMatchCards((prev) =>
                          prev.map((c) =>
                            c.pairId === card.pairId ? { ...c, matched: true } : c
                          )
                        );
                        setSelectedCard(null);
                        setMatchStreak((s) => s + 1);
                        handlePlayAudio(card.pairId);
                        setMatchSuccessCount((c) => {
                          const nextCount = c + 1;
                          if (nextCount >= 6) {
                            setCelebration(true);
                            triggerRoadmapCompletion();
                            toast.success('Xuất sắc! Bạn đã ghép thành công tất cả các cặp từ.');
                          }
                          return nextCount;
                        });
                        toast.success('Ghép đúng! +10 XP');
                      } else {
                        // WRONG
                        setSelectedCard(null);
                        setMatchStreak(0);
                        toast.error('Chưa đúng cặp từ, thử lại nhé!');
                      }
                    }}
                    className={`flex min-h-[90px] items-center justify-center rounded-2xl border-2 p-4 text-center font-bold shadow-xs transition-all active:scale-95 ${cardStyle}`}
                  >
                    <span className="text-sm sm:text-base">{card.text}</span>
                  </button>
                );
              })}
            </div>

            {/* Victory banner when all 6 pairs matched */}
            {matchSuccessCount >= 6 && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/30">
                <div>
                  <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                    🎉 Chiến thắng phản xạ! Bạn đã ghép đúng toàn bộ cặp từ.
                  </p>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                    Hãy chơi tiếp một ván mới để luyện thêm các từ khác trong gói 10 từ này.
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={initMatchGame}
                  className="rounded-xl bg-emerald-600 px-4 text-xs font-bold text-white hover:bg-emerald-700"
                >
                  <Shuffle className="mr-1.5 h-3.5 w-3.5" /> Chơi ván mới (Từ khác)
                </Button>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button
                variant="outline"
                onClick={initMatchGame}
                className="rounded-xl border-slate-200 text-xs dark:border-slate-800"
              >
                <Shuffle className="mr-1.5 h-3.5 w-3.5" /> Chơi lại ván mới
              </Button>
            </div>
          </div>
        )}
      </div>
    </StudentShell>
  );
}
