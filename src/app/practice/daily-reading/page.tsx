'use client';

/**
 * /practice/daily-reading — Bài luyện đọc hàng ngày
 *
 * Just-In-Time / On-Demand flow with AI generator & Starter packs
 * Optimized for mobile touch, dark mode, inflection-tolerant lookup, and smooth cloze rendering.
 */

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Check,
  ChevronLeft,
  Loader2,
  Plus,
  Sparkles,
  BookMarked,
  Calendar,
  CheckCircle2,
  XCircle,
  Volume2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { authFetch } from '@/lib/auth-fetch';
import { StudentShell } from '@/components/student/StudentShell';
import {
  findMatchingSourceWord,
  type WordItem,
} from '@/lib/daily-reading-morphology';

// ── Types ──
interface PassageQuestion {
  q: string;
  options: string[];
  answer: string;
  explain: string;
}

interface ClozeBlank {
  id: number;
  answer: string;
  options: string[];
}

interface DailyExercise {
  id: string;
  classroomId: string | null;
  classroomName: string;
  isPersonal?: boolean;
  exerciseDate: string;
  sourceDate: string;
  title: string;
  passage: string;
  passagePlain: string;
  translation?: string;
  level: string;
  questions: PassageQuestion[];
  cloze: { text: string; blanks: ClozeBlank[] };
  sourceWords: WordItem[];
  usedWords: string[];
  coverage: number;
  bonusWords: WordItem[];
  generatedAt: string;
  completion: {
    mcqScore: number;
    mcqTotal: number;
    clozeScore: number;
    clozeTotal: number;
    completedAt: string;
  } | null;
}

interface StarterPackItem {
  id: string;
  title: string;
  level: string;
  wordCount: number;
  previewWords?: string[];
}

type Tab = 'passage' | 'cloze' | 'vocab';

// ── Speech Synthesis Helper ──
function speakEnglishWord(word: string, e?: React.MouseEvent) {
  if (e) e.stopPropagation();
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(word);
    u.lang = 'en-US';
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
  }
}

// ── Passage Word Component with Viewport-Safe Tooltip ──
function PassageWord({
  target,
  match,
  isActive,
  onToggle,
}: {
  target: string;
  match: { word: string; translation: string; pos?: string } | null;
  isActive: boolean;
  onToggle: () => void;
}) {
  const tooltipRef = useRef<HTMLSpanElement>(null);
  const [horizontalOffset, setHorizontalOffset] = useState<number>(0);
  const [placement, setPlacement] = useState<'top' | 'bottom'>('top');

  useLayoutEffect(() => {
    if (isActive && tooltipRef.current) {
      const rect = tooltipRef.current.getBoundingClientRect();
      const padding = 12;
      const vpWidth = window.innerWidth;
      let shift = 0;

      if (rect.left < padding) {
        shift = padding - rect.left;
      } else if (rect.right > vpWidth - padding) {
        shift = (vpWidth - padding) - rect.right;
      }
      setHorizontalOffset(shift);

      // If word is too close to top of viewport, flip tooltip downward
      if (rect.top < 65) {
        setPlacement('bottom');
      } else {
        setPlacement('top');
      }
    } else {
      setHorizontalOffset(0);
      setPlacement('top');
    }
  }, [isActive]);

  const trans = match?.translation;
  const isLemmaDifferent = Boolean(match && match.word.toLowerCase() !== target.toLowerCase().trim());
  const pronunciationWord = match?.word || target;

  return (
    <span className="relative inline-block mx-0.5">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        title={trans ? `${target}${isLemmaDifferent ? ` (${match?.word})` : ''}: ${trans}` : target}
        className={`font-bold px-1.5 py-0.5 rounded transition-colors text-left inline-flex items-center gap-0.5 ${
          isActive
            ? 'bg-indigo-600 text-white dark:bg-indigo-500 shadow-xs'
            : 'text-indigo-700 bg-indigo-50/90 hover:bg-indigo-100 hover:text-indigo-900 dark:text-indigo-300 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60'
        }`}
      >
        <span>{target}</span>
      </button>

      {/* Floating Tooltip / Popover (Responsive, bounds-safe & viewport clip-proof) */}
      {isActive && (
        <span
          ref={tooltipRef}
          onClick={(e) => e.stopPropagation()}
          style={{
            transform: `translateX(calc(-50% + ${horizontalOffset}px))`,
          }}
          className={`absolute left-1/2 w-max max-w-[calc(100vw-24px)] sm:max-w-xs px-3.5 py-2.5 text-xs text-white bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-md rounded-xl shadow-2xl z-40 pointer-events-auto border border-slate-700/60 flex flex-col items-center gap-1 text-center animate-in fade-in zoom-in-95 duration-150 ${
            placement === 'bottom' ? 'top-full mt-2' : 'bottom-full mb-2'
          }`}
        >
          <div className="flex items-center gap-1.5 font-bold text-indigo-300">
            <span>{target}</span>
            {isLemmaDifferent && (
              <span className="text-[10px] text-slate-400 font-normal">
                ({match?.word}{match?.pos ? ` · ${match.pos}` : ''})
              </span>
            )}
            <button
              type="button"
              onClick={(e) => speakEnglishWord(pronunciationWord, e)}
              className="p-1 rounded hover:bg-slate-700/60 text-slate-300 hover:text-white"
              title="Phát âm"
            >
              <Volume2 className="h-3.5 w-3.5 text-indigo-400" />
            </button>
          </div>

          {trans ? (
            <span className="text-slate-100 font-medium leading-snug">{trans}</span>
          ) : (
            <div className="flex flex-col items-center gap-1 mt-0.5">
              <span className="text-slate-400 text-[11px] italic">Từ vựng theo ngữ cảnh bài đọc</span>
              <Link
                href={`/dictionary?q=${encodeURIComponent(target)}`}
                className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-indigo-400 hover:text-indigo-300 underline"
              >
                Tra trong Từ điển
              </Link>
            </div>
          )}

          {/* Pointer Arrow adjusted to match original word position */}
          <span
            style={{
              transform: `translateX(calc(-50% - ${horizontalOffset}px))`,
            }}
            className={`absolute left-1/2 border-4 border-transparent ${
              placement === 'bottom'
                ? 'bottom-full -mb-1 border-b-slate-900/95 dark:border-b-slate-800/95'
                : 'top-full -mt-1 border-t-slate-900/95 dark:border-t-slate-800/95'
            }`}
          />
        </span>
      )}
    </span>
  );
}

// ── Passage Renderer ──
export function renderFormattedPassage(
  text: string,
  sourceWords: WordItem[] = [],
  bonusWords: WordItem[] = [],
  activeWordIndex: number | null,
  setActiveWordIndex: (idx: number | null) => void,
): ReactNode {
  if (!text) return null;
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  let wordCounter = 0;

  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const target = part.slice(2, -2);
      const currentIdx = wordCounter++;
      const match = findMatchingSourceWord(target, sourceWords, bonusWords);
      const isActive = activeWordIndex === currentIdx;

      return (
        <PassageWord
          key={i}
          target={target}
          match={match}
          isActive={isActive}
          onToggle={() => setActiveWordIndex(isActive ? null : currentIdx)}
        />
      );
    }
    return part;
  });
}

// ── Cloze Renderer (Layout-Shift Proof & Inline) ──
function renderClozeText(
  text: string,
  blanks: ClozeBlank[],
  answers: Record<number, string>,
  onPick: (id: number, value: string) => void,
  revealed: boolean,
): ReactNode[] {
  const nodes: ReactNode[] = [];
  const re = /\{\{(\d+)\}\}/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = re.exec(text)) !== null) {
    if (match.index > last) {
      nodes.push(<span key={key++}>{text.slice(last, match.index)}</span>);
    }
    const id = Number(match[1]);
    const blank = blanks.find((b) => b.id === id) ?? blanks[id];
    const selected = answers[id] ?? '';
    const correct = blank?.answer?.toLowerCase() === selected.toLowerCase();

    nodes.push(
      <span
        key={key++}
        className="inline-block mx-1 my-0.5 align-baseline"
      >
        <span
          className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold transition-all ${
            revealed
              ? correct
                ? 'border-emerald-500 bg-emerald-50 text-emerald-900 dark:border-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-200'
                : 'border-rose-400 bg-rose-50 text-rose-900 dark:border-rose-700 dark:bg-rose-950/60 dark:text-rose-200'
              : selected
                ? 'border-indigo-400 bg-indigo-50/80 text-indigo-900 dark:border-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-200 shadow-2xs'
                : 'border-slate-300 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 shadow-2xs'
          }`}
        >
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">({id + 1})</span>
          <select
            className="bg-transparent text-current text-xs font-bold focus:outline-none cursor-pointer pr-1"
            value={selected}
            onChange={(e) => onPick(id, e.target.value)}
            disabled={revealed}
            aria-label={`Điền từ vị trí ${id + 1}`}
          >
            <option value="" className="bg-white dark:bg-slate-900 text-slate-500">
              — chọn từ —
            </option>
            {Array.from(new Set((blank?.options ?? []).map((o) => o.trim()))).map((opt) => (
              <option key={opt} value={opt} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">
                {opt}
              </option>
            ))}
          </select>
          {revealed && (
            correct ? (
              <span className="text-emerald-600 dark:text-emerald-400 text-xs font-bold">✓</span>
            ) : (
              <span className="text-rose-600 dark:text-rose-400 text-xs font-bold">✗</span>
            )
          )}
        </span>
        {revealed && !correct && blank && (
          <span className="ml-1 inline-block text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-300 dark:border-emerald-800">
            ✓ {blank.answer}
          </span>
        )}
      </span>,
    );
    last = match.index + match[0].length;
  }
  if (last < text.length) {
    nodes.push(<span key={key++}>{text.slice(last)}</span>);
  }
  return nodes;
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + 'T00:00:00+07:00');
    return d.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' });
  } catch {
    return dateStr;
  }
}

// ── Component ──
export default function DailyReadingPage() {
  const [exercises, setExercises] = useState<DailyExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIdx, setSelectedIdx] = useState(0);

  const [tab, setTab] = useState<Tab>('passage');
  const [showTranslation, setShowTranslation] = useState(false);
  const [activeWordIndex, setActiveWordIndex] = useState<number | null>(null);

  // Metadata from GET
  const [canGenerateToday, setCanGenerateToday] = useState(false);
  const [hasUncompleted, setHasUncompleted] = useState(false);
  const [uncompletedExerciseId, setUncompletedExerciseId] = useState<string | null>(null);

  // On-demand generation states
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingStep, setGeneratingStep] = useState<string | null>(null);
  const [generatingPackId, setGeneratingPackId] = useState<string | null>(null);
  const [starterPacks, setStarterPacks] = useState<StarterPackItem[]>([]);
  const [insufficientWordsNotice, setInsufficientWordsNotice] = useState<string | null>(null);

  // MCQ state
  const [qAnswers, setQAnswers] = useState<Record<number, string>>({});
  const [qRevealed, setQRevealed] = useState(false);

  // Cloze state
  const [clozeAnswers, setClozeAnswers] = useState<Record<number, string>>({});
  const [clozeRevealed, setClozeRevealed] = useState(false);
  const [showWordBank, setShowWordBank] = useState(true);

  // Save word state
  const [savedWords, setSavedWords] = useState<Set<string>>(() => new Set());
  const [savingWord, setSavingWord] = useState<string | null>(null);

  // Fetch exercises function
  const reloadExercises = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch('/api/practice/daily-reading?recent=7');
      const json = await res.json();
      if (json.success && Array.isArray(json.exercises)) {
        setExercises(json.exercises);
        setCanGenerateToday(Boolean(json.canGenerateToday));
        setHasUncompleted(Boolean(json.hasUncompleted));
        setUncompletedExerciseId(json.uncompletedExerciseId || null);
        if (json.uncompletedExerciseId) {
          const idx = json.exercises.findIndex((e: DailyExercise) => e.id === json.uncompletedExerciseId);
          if (idx !== -1) setSelectedIdx(idx);
        }
      } else {
        setError(json.error || 'Không tải được bài tập');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi kết nối');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await authFetch('/api/practice/daily-reading?recent=7');
        const json = await res.json();
        if (!cancelled) {
          if (json.success && Array.isArray(json.exercises)) {
            setExercises(json.exercises);
            setCanGenerateToday(Boolean(json.canGenerateToday));
            setHasUncompleted(Boolean(json.hasUncompleted));
            setUncompletedExerciseId(json.uncompletedExerciseId || null);
            if (json.uncompletedExerciseId) {
              const idx = json.exercises.findIndex((e: DailyExercise) => e.id === json.uncompletedExerciseId);
              if (idx !== -1) setSelectedIdx(idx);
            }
          } else {
            setError(json.error || 'Không tải được bài tập');
          }
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Lỗi kết nối');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const exercise = exercises[selectedIdx] ?? null;

  // Handle switching exercises
  const handleSelectExercise = (idx: number) => {
    if (idx === selectedIdx) return;
    setSelectedIdx(idx);
    setQAnswers({});
    setQRevealed(false);
    setClozeAnswers({});
    setClozeRevealed(false);
    setShowWordBank(true);
    setShowTranslation(false);
    setActiveWordIndex(null);
    setTab('passage');
  };

  // MCQ score
  const qScore = useMemo(() => {
    if (!exercise || !qRevealed) return null;
    let ok = 0;
    exercise.questions.forEach((q, i) => {
      if ((qAnswers[i] || '').trim() === q.answer.trim()) ok++;
    });
    return { ok, total: exercise.questions.length };
  }, [exercise, qAnswers, qRevealed]);

  // Identify blanks that actually appear in the cloze text
  const textBlankIds = useMemo(() => {
    if (!exercise?.cloze?.text) return [];
    const matches = Array.from(exercise.cloze.text.matchAll(/\{\{(\d+)\}\}/g));
    const ids = new Set<number>();
    for (const m of matches) {
      const id = Number(m[1]);
      if (exercise.cloze.blanks.some((b) => b.id === id) || exercise.cloze.blanks[id]) {
        ids.add(id);
      }
    }
    return Array.from(ids);
  }, [exercise]);

  // Cloze score
  const clozeScore = useMemo(() => {
    if (!exercise || !clozeRevealed) return null;
    let ok = 0;
    const targetIds = textBlankIds.length > 0 ? textBlankIds : exercise.cloze.blanks.map((b) => b.id);
    targetIds.forEach((id) => {
      const blank = exercise.cloze.blanks.find((b) => b.id === id) ?? exercise.cloze.blanks[id];
      if (blank && (clozeAnswers[id] || '').toLowerCase() === blank.answer.toLowerCase()) {
        ok++;
      }
    });
    return { ok, total: targetIds.length };
  }, [exercise, clozeAnswers, clozeRevealed, textBlankIds]);

  // Derived word bank for Cloze
  const wordBank = useMemo(() => {
    if (!exercise) return [];
    const words = new Set<string>();
    exercise.cloze.blanks.forEach((b) => words.add(b.answer));
    return Array.from(words).sort();
  }, [exercise]);

  // Cloze submission readiness
  const canSubmitCloze = useMemo(() => {
    if (!exercise) return false;
    const targetIds = textBlankIds.length > 0 ? textBlankIds : exercise.cloze.blanks.map((b) => b.id);
    if (targetIds.length === 0) return false;
    return targetIds.every((id) => Boolean((clozeAnswers[id] || '').trim()));
  }, [exercise, textBlankIds, clozeAnswers]);

  // Submit completion
  const submitCompletion = useCallback(
    async (mcqScoreVal: number, mcqTotalVal: number, clozeScoreVal: number, clozeTotalVal: number) => {
      if (!exercise) return;
      try {
        await authFetch('/api/practice/daily-reading', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            exerciseId: exercise.id,
            mcqScore: mcqScoreVal,
            mcqTotal: mcqTotalVal,
            clozeScore: clozeScoreVal,
            clozeTotal: clozeTotalVal,
          }),
        });

        setExercises((prev) => {
          const updated = prev.map((e) =>
            e.id === exercise.id
              ? {
                  ...e,
                  completion: {
                    mcqScore: mcqScoreVal,
                    mcqTotal: mcqTotalVal,
                    clozeScore: clozeScoreVal,
                    clozeTotal: clozeTotalVal,
                    completedAt: new Date().toISOString(),
                  },
                }
              : e,
          );
          const remainingUncompleted = updated.find((e) => !e.completion?.completedAt);
          setHasUncompleted(Boolean(remainingUncompleted));
          setUncompletedExerciseId(remainingUncompleted?.id || null);
          return updated;
        });
      } catch {
        // Non-critical
      }
    },
    [exercise],
  );

  const handleGradeMcq = useCallback(() => {
    setQRevealed(true);
    if (!exercise) return;
    let ok = 0;
    exercise.questions.forEach((q, i) => {
      if ((qAnswers[i] || '').trim() === q.answer.trim()) ok++;
    });
    const finalMcqScore = ok;
    const finalMcqTotal = exercise.questions.length;
    const finalClozeScore = clozeScore?.ok ?? exercise.completion?.clozeScore ?? 0;
    const targetClozeTotal =
      textBlankIds.length > 0 ? textBlankIds.length : exercise.cloze.blanks.length;
    const finalClozeTotal =
      clozeScore?.total ?? exercise.completion?.clozeTotal ?? targetClozeTotal;
    void submitCompletion(finalMcqScore, finalMcqTotal, finalClozeScore, finalClozeTotal);
  }, [exercise, qAnswers, clozeScore, textBlankIds, submitCompletion]);

  const handleGradeCloze = useCallback(() => {
    setClozeRevealed(true);
    if (!exercise) return;
    let ok = 0;
    const targetIds =
      textBlankIds.length > 0 ? textBlankIds : exercise.cloze.blanks.map((b) => b.id);
    targetIds.forEach((id) => {
      const blank = exercise.cloze.blanks.find((b) => b.id === id) ?? exercise.cloze.blanks[id];
      if (blank && (clozeAnswers[id] || '').toLowerCase() === blank.answer.toLowerCase()) {
        ok++;
      }
    });
    const finalClozeScore = ok;
    const finalClozeTotal = targetIds.length;
    const finalMcqScore = qScore?.ok ?? exercise.completion?.mcqScore ?? 0;
    const finalMcqTotal = exercise.completion?.mcqTotal ?? exercise.questions.length;
    void submitCompletion(finalMcqScore, finalMcqTotal, finalClozeScore, finalClozeTotal);
  }, [exercise, clozeAnswers, qScore, textBlankIds, submitCompletion]);

  // Save bonus word
  const saveWord = useCallback(
    async (w: WordItem) => {
      if (!exercise || savedWords.has(w.word)) return;
      setSavingWord(w.word);
      try {
        const res = await authFetch('/api/practice/daily-reading/save-word', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            word: w.word,
            translation: w.translation,
            pos: w.pos,
            classroomId: exercise.classroomId || undefined,
            exerciseId: exercise.id,
          }),
        });
        const json = await res.json();
        if (json.success) {
          setSavedWords((prev) => new Set(prev).add(w.word));
        }
      } catch {
        // Ignore
      } finally {
        setSavingWord(null);
      }
    },
    [exercise, savedWords],
  );

  // On-demand generation handler
  const handleGenerateOnDemand = async (packId?: string) => {
    setIsGenerating(true);
    setGeneratingPackId(packId || null);
    setGeneratingStep('Đang phân tích vốn từ vựng...');
    setError(null);
    setInsufficientWordsNotice(null);

    try {
      setTimeout(() => setGeneratingStep('AI đang viết bài đọc & câu hỏi...'), 1200);

      const res = await authFetch('/api/practice/daily-reading/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(packId ? { packId } : {}),
      });

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || 'Không thể tạo bài đọc lúc này');
      }

      if (json.eligible === false && json.reason === 'insufficient_words') {
        setInsufficientWordsNotice(json.message);
        if (Array.isArray(json.starterPacks)) {
          setStarterPacks(json.starterPacks);
        }
        return;
      }

      if (json.exercise) {
        setExercises((prev) => {
          const filtered = prev.filter((e) => e.id !== json.exercise.id);
          return [json.exercise, ...filtered];
        });
        setSelectedIdx(0);
        setQAnswers({});
        setQRevealed(false);
        setClozeAnswers({});
        setClozeRevealed(false);
        setCanGenerateToday(false);

        if (json.uncompleted) {
          setHasUncompleted(true);
          setUncompletedExerciseId(json.exercise.id);
        } else {
          setHasUncompleted(false);
          setUncompletedExerciseId(null);
        }

        setTab('passage');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi tạo bài đọc');
    } finally {
      setIsGenerating(false);
      setGeneratingStep(null);
      setGeneratingPackId(null);
    }
  };

  return (
    <StudentShell title="Bài đọc hàng ngày">
      <div
        className="mx-auto max-w-5xl space-y-3 px-3 py-3 pb-24 sm:px-4"
        onClick={() => setActiveWordIndex(null)}
      >
        {/* Header */}
        <div className="flex items-center gap-2">
          <Link
            href="/practice"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors shadow-2xs"
            aria-label="Về Sử dụng từ"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100">
                Bài đọc hàng ngày
              </h1>
              <span className="inline-flex items-center gap-0.5 rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300">
                <Sparkles className="h-2.5 w-2.5" /> AI Personalized
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Luyện đọc thực chiến dựa trên từ vựng cá nhân hóa
            </p>
          </div>
          <BookOpen className="h-5 w-5 shrink-0 text-indigo-600 dark:text-indigo-400" />
        </div>

        {/* Loading / Error */}
        {loading && (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500 dark:text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin text-indigo-600 dark:text-indigo-400" />
            <span>Đang tải bài tập…</span>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200 flex items-center justify-between gap-2">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => void reloadExercises()}
              className="text-[11px] font-bold underline hover:opacity-80 shrink-0"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Uncompleted exercise banner alert */}
        {!loading && exercise && !exercise.completion?.completedAt && (
          <div className="rounded-xl border border-amber-300/80 bg-amber-50/90 dark:border-amber-800/80 dark:bg-amber-950/40 p-3 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200 shadow-2xs">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold">Bài đọc đang học ({formatDate(exercise.exerciseDate)}): </span>
              <span>
                Hãy hoàn thành bài đọc này trước khi tạo bài mới để ghi nhận tiến độ học tập nhé!
              </span>
            </div>
          </div>
        )}

        {!loading && hasUncompleted && uncompletedExerciseId && exercise && exercise.id !== uncompletedExerciseId && (
          <div className="rounded-xl border border-amber-300/80 bg-amber-50/90 dark:border-amber-800/80 dark:bg-amber-950/40 p-3 flex items-center justify-between gap-2.5 text-xs text-amber-900 dark:text-amber-200 shadow-2xs">
            <div className="flex items-center gap-2 min-w-0">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span className="truncate">Bạn có 1 bài đọc trước đó chưa hoàn thành.</span>
            </div>
            <button
              type="button"
              onClick={() => {
                const idx = exercises.findIndex((e) => e.id === uncompletedExerciseId);
                if (idx !== -1) setSelectedIdx(idx);
              }}
              className="font-bold text-indigo-600 dark:text-indigo-400 underline hover:opacity-80 shrink-0 cursor-pointer"
            >
              Làm ngay
            </button>
          </div>
        )}

        {/* Can generate today banner when viewing past exercises */}
        {!loading && exercises.length > 0 && canGenerateToday && (
          <div className="rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50 to-white dark:border-indigo-900/60 dark:from-indigo-950/40 dark:to-slate-900 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 shrink-0">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                  Hôm nay bạn chưa có bài đọc mới!
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Tạo bài đọc mới tức thì từ từ vựng và lịch ôn tập hôm nay của bạn.
                </p>
              </div>
            </div>
            <button
              type="button"
              disabled={isGenerating}
              onClick={() => handleGenerateOnDemand()}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 shrink-0"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>{generatingStep || 'Đang tạo bài...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Tạo bài đọc hôm nay</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Empty State: No exercises available at all */}
        {!loading && !error && exercises.length === 0 && (
          <div className="mx-auto max-w-2xl rounded-2xl border border-indigo-100 bg-gradient-to-b from-indigo-50/60 via-white to-indigo-50/20 dark:border-slate-800 dark:from-slate-900 dark:via-slate-900/90 dark:to-indigo-950/30 p-6 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 dark:bg-indigo-900/60 dark:text-indigo-300 ring-4 ring-indigo-50 dark:ring-indigo-950/60">
              <BookMarked className="h-7 w-7" />
            </div>
            <h2 className="mt-3 text-base sm:text-lg font-black text-slate-900 dark:text-slate-100">
              Chưa có bài đọc hôm nay
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              Hệ thống tự động phân tích từ vựng và tạo bài đọc riêng cho bạn, hoặc bạn có thể tạo ngay bây giờ với AI:
            </p>

            {/* Actionable button: Tạo bài đọc hôm nay với AI */}
            <div className="mt-5">
              <button
                type="button"
                disabled={isGenerating}
                onClick={() => handleGenerateOnDemand()}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{generatingStep || 'Đang tạo bài đọc với AI...'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>⚡ Tạo bài đọc hôm nay với AI</span>
                  </>
                )}
              </button>
            </div>

            {/* Insufficient words notice */}
            {insufficientWordsNotice && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-left max-w-md mx-auto text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
                <div className="flex items-center gap-1.5 font-bold mb-1">
                  <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <span>Cần thêm từ vựng để tạo bài cá nhân hóa</span>
                </div>
                <p className="text-[11px] leading-relaxed">{insufficientWordsNotice}</p>
              </div>
            )}

            {/* Starter Packs */}
            {starterPacks.length > 0 && (
              <div className="mt-6 border-t border-slate-200/80 dark:border-slate-800 pt-5 text-left">
                <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800 dark:text-slate-200 mb-3">
                  <Layers className="h-4 w-4 text-indigo-500" />
                  <span>Chọn gói bài đọc khởi động có sẵn:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {starterPacks.map((pack) => (
                    <div
                      key={pack.id}
                      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 flex flex-col justify-between hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors shadow-2xs"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <span className="rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:text-indigo-300">
                            {pack.level}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {pack.wordCount} từ
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                          {pack.title}
                        </h4>
                        {pack.previewWords && (
                          <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2">
                            Từ mẫu: {pack.previewWords.join(', ')}...
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        disabled={isGenerating}
                        onClick={() => handleGenerateOnDemand(pack.id)}
                        className="mt-3 w-full inline-flex items-center justify-center gap-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800/80 px-2.5 py-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300 transition-colors disabled:opacity-50"
                      >
                        {isGenerating && generatingPackId === pack.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <ArrowRight className="h-3.5 w-3.5" />
                        )}
                        <span>Luyện đọc gói này</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick links */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <Link
                href="/dictionary"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> Tra & lưu từ mới
              </Link>
              <Link
                href="/review"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Ôn tập SRS
              </Link>
              <Link
                href="/flashcard"
                className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50/70 dark:border-amber-800/80 dark:bg-amber-950/40 px-3.5 py-2 text-xs font-bold text-amber-900 dark:text-amber-200 hover:bg-amber-100/70 dark:hover:bg-amber-900/50 transition-colors"
              >
                Học flashcard
              </Link>
            </div>
          </div>
        )}

        {/* Exercise selector (if multiple) */}
        {exercises.length > 1 && (
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {exercises.map((ex, idx) => {
              const isUnread = !ex.completion?.completedAt;
              const isSelected = idx === selectedIdx;

              return (
                <button
                  key={ex.id}
                  type="button"
                  onClick={() => handleSelectExercise(idx)}
                  className={`shrink-0 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs ${
                    isSelected
                      ? 'border-indigo-400 bg-indigo-50 text-indigo-800 dark:border-indigo-600 dark:bg-indigo-950/70 dark:text-indigo-200'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-slate-700'
                  }`}
                >
                  <Calendar className="h-3.5 w-3.5 opacity-70" />
                  <span>{formatDate(ex.exerciseDate)}</span>
                  {isUnread ? (
                    <span className="h-2 w-2 rounded-full bg-amber-500 ring-2 ring-amber-200 dark:ring-amber-900" title="Chưa hoàn thành" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Exercise content */}
        {exercise && (
          <>
            {/* Title card */}
            <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/90 via-white to-slate-50 p-4 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:via-slate-900/90 dark:to-indigo-950/30">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 leading-snug">
                    {exercise.title}
                  </h2>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 font-bold dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      {exercise.level}
                    </span>
                    {exercise.isPersonal && (
                      <span className="inline-flex items-center gap-0.5 rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 font-bold text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300">
                        <Sparkles className="h-2.5 w-2.5" /> Cá nhân hóa
                      </span>
                    )}
                    <span>{exercise.classroomName}</span>
                    <span>·</span>
                    <span>{exercise.sourceWords.length} từ</span>
                    <span>·</span>
                    <span>{(exercise.coverage * 100).toFixed(0)}% coverage</span>
                    {exercise.bonusWords.length > 0 && (
                      <>
                        <span>·</span>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">
                          +{exercise.bonusWords.length} từ mới
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {exercise.completion?.completedAt ? (
                  <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Đã hoàn thành
                  </span>
                ) : (
                  <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800 dark:bg-amber-950/70 dark:text-amber-300">
                    Đang học
                  </span>
                )}
              </div>
            </div>

            {/* Completed Exercise Result Banner */}
            {exercise.completion?.completedAt && (
              <div className="rounded-xl border border-emerald-300/80 bg-gradient-to-r from-emerald-50 via-white to-emerald-50/40 dark:border-emerald-800/80 dark:from-emerald-950/40 dark:via-slate-900 dark:to-emerald-950/20 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 shrink-0">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <span>Kết quả luyện tập</span>
                      <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                        ({new Date(exercise.completion.completedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })})
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-3 mt-0.5">
                      <span>
                        Trắc nghiệm: <strong className="text-emerald-700 dark:text-emerald-400 font-bold">{exercise.completion.mcqScore}/{exercise.completion.mcqTotal}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Điền từ: <strong className="text-emerald-700 dark:text-emerald-400 font-bold">{exercise.completion.clozeScore}/{exercise.completion.clozeTotal}</strong>
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setQRevealed(true);
                      setClozeRevealed(true);
                    }}
                    className="rounded-lg border border-emerald-300 bg-white dark:border-emerald-800 dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/40 transition-colors shadow-2xs"
                  >
                    Xem đáp án & giải thích
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setQAnswers({});
                      setQRevealed(false);
                      setClozeAnswers({});
                      setClozeRevealed(false);
                    }}
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition-colors shadow-2xs"
                  >
                    Luyện lại
                  </button>
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="flex rounded-xl border border-slate-200 bg-slate-100/80 dark:border-slate-800 dark:bg-slate-900 p-1">
              {([
                { id: 'passage' as Tab, label: 'Đọc bài', icon: BookOpen },
                { id: 'cloze' as Tab, label: 'Điền từ', icon: BookMarked },
                { id: 'vocab' as Tab, label: 'Từ vựng', icon: Volume2 },
              ]).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setTab(t.id);
                    setActiveWordIndex(null);
                  }}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-all ${
                    tab === t.id
                      ? 'bg-white text-indigo-700 shadow-xs dark:bg-slate-800 dark:text-indigo-300'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  <t.icon className="h-3.5 w-3.5" />
                  <span>{t.label}</span>
                </button>
              ))}
            </div>

            {/* Tab: Passage + MCQ */}
            {tab === 'passage' && (
              <div className="flex flex-col lg:grid lg:grid-cols-3 lg:gap-6 lg:space-y-0 space-y-4">
                {/* Passage (Left 2/3) */}
                <div className="lg:col-span-2">
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:sticky lg:top-4">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                      <span>💡 Bấm vào từ in đậm để tra nghĩa và nghe phát âm</span>
                    </div>

                    <div className="whitespace-pre-line text-sm sm:text-base leading-[2] text-slate-800 dark:text-slate-200 selection:bg-indigo-100 dark:selection:bg-indigo-900">
                      {renderFormattedPassage(
                        exercise.passage || exercise.passagePlain,
                        exercise.sourceWords,
                        exercise.bonusWords,
                        activeWordIndex,
                        setActiveWordIndex,
                      )}
                    </div>

                    {/* Translation Toggle */}
                    {exercise.translation && (
                      <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-4">
                        <button
                          type="button"
                          onClick={() => setShowTranslation(!showTranslation)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 dark:hover:bg-indigo-900/60 transition-colors shadow-2xs"
                        >
                          <BookOpen className="h-3.5 w-3.5" />
                          <span>{showTranslation ? 'Ẩn bản dịch tiếng Việt' : '📖 Xem bản dịch tiếng Việt'}</span>
                        </button>

                        {showTranslation && (
                          <div className="mt-3 rounded-xl bg-slate-50 p-4 border border-slate-200/80 dark:bg-slate-800/60 dark:border-slate-700 shadow-2xs">
                            <div className="flex items-center gap-1.5 mb-2 text-xs font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider">
                              <Sparkles className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                              <span>Bản dịch tiếng Việt tham khảo:</span>
                            </div>
                            <p className="whitespace-pre-line text-xs sm:text-sm leading-[1.9] text-slate-700 dark:text-slate-300">
                              {exercise.translation}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* MCQ (Right 1/3) */}
                <div className="lg:col-span-1 space-y-3">
                  <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 pb-2">
                    Câu hỏi trắc nghiệm ({exercise.questions.length})
                  </h3>

                  {exercise.questions.map((q, qi) => {
                    const picked = qAnswers[qi] ?? '';
                    const isCorrect = picked.trim() === q.answer.trim();

                    return (
                      <div
                        key={qi}
                        className={`rounded-xl border p-3.5 transition-colors ${
                          qRevealed
                            ? isCorrect
                              ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/30'
                              : 'border-rose-200 bg-rose-50/50 dark:border-rose-800 dark:bg-rose-950/30'
                            : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
                        }`}
                      >
                        <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
                          {qi + 1}. {q.q}
                        </p>
                        <div className="mt-2.5 space-y-1.5">
                          {q.options.map((opt) => {
                            const selected = picked === opt;
                            const isAnswer = opt.trim() === q.answer.trim();
                            let cls =
                              'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700/60';
                            if (qRevealed) {
                              if (isAnswer)
                                cls =
                                  'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold dark:border-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-200';
                              else if (selected)
                                cls =
                                  'border-rose-400 bg-rose-50 text-rose-900 dark:border-rose-700 dark:bg-rose-950/60 dark:text-rose-200';
                              else
                                cls =
                                  'border-slate-100 bg-slate-50 text-slate-400 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-500';
                            } else if (selected) {
                              cls =
                                'border-indigo-500 bg-indigo-50 text-indigo-900 font-bold dark:border-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-200';
                            }

                            return (
                              <button
                                key={opt}
                                type="button"
                                disabled={qRevealed}
                                onClick={() =>
                                  setQAnswers((prev) => ({ ...prev, [qi]: opt }))
                                }
                                className={`block w-full rounded-xl border px-3 py-2 text-left text-xs transition-colors min-h-[42px] ${cls}`}
                              >
                                {qRevealed && isAnswer && (
                                  <CheckCircle2 className="mr-1.5 inline h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                                )}
                                {qRevealed && selected && !isAnswer && (
                                  <XCircle className="mr-1.5 inline h-3.5 w-3.5 text-rose-500 dark:text-rose-400" />
                                )}
                                {opt}
                              </button>
                            );
                          })}
                        </div>

                        {qRevealed && q.explain && (
                          <p className="mt-2.5 rounded-lg bg-slate-100 px-3 py-2 text-[11px] text-slate-700 dark:bg-slate-800 dark:text-slate-300 leading-relaxed">
                            💡 {q.explain}
                          </p>
                        )}
                      </div>
                    );
                  })}

                  {/* Submit / Score */}
                  {!qRevealed ? (
                    <button
                      type="button"
                      onClick={handleGradeMcq}
                      disabled={Object.keys(qAnswers).length < exercise.questions.length}
                      className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-40 transition-colors shadow-sm"
                    >
                      Chấm điểm phần đọc ({Object.keys(qAnswers).length}/{exercise.questions.length})
                    </button>
                  ) : (
                    qScore && (
                      <div
                        className={`rounded-2xl border p-4 text-center ${
                          qScore.ok === qScore.total
                            ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200'
                            : qScore.ok >= qScore.total / 2
                              ? 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200'
                              : 'border-rose-200 bg-rose-50 dark:border-rose-800 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200'
                        }`}
                      >
                        <p className="text-xl font-black">
                          {qScore.ok}/{qScore.total}
                        </p>
                        <p className="text-xs font-semibold mt-1">
                          {qScore.ok === qScore.total
                            ? '🎉 Xuất sắc! Bạn nắm trọn ý bài đọc!'
                            : qScore.ok >= qScore.total / 2
                              ? '👏 Khá tốt! Đọc kỹ giải thích để nhớ từ lâu hơn.'
                              : '💪 Cần xem lại bài đọc và từ vựng nhé!'}
                        </p>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Tab: Cloze */}
            {tab === 'cloze' && (
              <div className="space-y-3">
                {/* Word Bank */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <button
                    type="button"
                    onClick={() => setShowWordBank(!showWordBank)}
                    className="flex w-full items-center justify-between text-left"
                  >
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                      <span>Kho từ cần điền ({wordBank.length})</span>
                    </span>
                    {showWordBank ? (
                      <ChevronUp className="h-4 w-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    )}
                  </button>
                  {showWordBank && (
                    <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                      {wordBank.map((w) => {
                        const usedCount = Object.values(clozeAnswers).filter(
                          (a) => a.toLowerCase() === w.toLowerCase(),
                        ).length;
                        const targetBlankCount = exercise.cloze.blanks.filter(
                          (b) => b.answer.toLowerCase() === w.toLowerCase(),
                        ).length;
                        const isFullyUsed = usedCount >= targetBlankCount;

                        return (
                          <span
                            key={w}
                            className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                              isFullyUsed
                                ? 'bg-slate-100 text-slate-400 line-through dark:bg-slate-800 dark:text-slate-500'
                                : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                            }`}
                          >
                            {w}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Cloze Passage text */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <p className="whitespace-pre-line text-sm sm:text-base leading-[2.2] text-slate-800 dark:text-slate-200">
                    {renderClozeText(
                      exercise.cloze.text,
                      exercise.cloze.blanks,
                      clozeAnswers,
                      (id, val) => setClozeAnswers((prev) => ({ ...prev, [id]: val })),
                      clozeRevealed,
                    )}
                  </p>
                </div>

                {!clozeRevealed ? (
                  <button
                    type="button"
                    onClick={handleGradeCloze}
                    disabled={!canSubmitCloze}
                    className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-40 transition-colors shadow-sm"
                  >
                    Chấm điểm bài điền từ
                  </button>
                ) : (
                  clozeScore && (
                    <div
                      className={`rounded-2xl border p-4 text-center ${
                        clozeScore.ok === clozeScore.total
                          ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200'
                          : clozeScore.ok >= clozeScore.total / 2
                            ? 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200'
                            : 'border-rose-200 bg-rose-50 dark:border-rose-800 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200'
                      }`}
                    >
                      <p className="text-xl font-black">
                        {clozeScore.ok}/{clozeScore.total}
                      </p>
                      <p className="text-xs font-semibold mt-1">
                        {clozeScore.ok === clozeScore.total
                          ? '🎉 Hoàn hảo! Bạn điền đúng 100% từ vựng!'
                          : clozeScore.ok >= clozeScore.total / 2
                            ? '👏 Tốt lắm! Quan sát các đáp án đúng để ghi nhớ ngữ cảnh.'
                            : '💪 Thử đọc lại bài đọc để nắm rõ vị trí các từ nhé!'}
                      </p>
                    </div>
                  )
                )}
              </div>
            )}

            {/* Tab: Vocabulary */}
            {tab === 'vocab' && (
              <div className="space-y-4">
                {/* Source words */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <h3 className="mb-3 text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <BookOpen className="h-4 w-4 text-indigo-500" />
                    <span>Từ vựng trọng tâm trong bài ({exercise.sourceWords.length})</span>
                  </h3>
                  <div className="space-y-2">
                    {exercise.sourceWords.map((w) => {
                      const isUsed = exercise.usedWords.some(
                        (u) => u.trim().toLowerCase() === w.word.trim().toLowerCase(),
                      );
                      return (
                        <div
                          key={w.word}
                          className={`flex items-center gap-2.5 rounded-xl border p-3 transition-colors ${
                            isUsed
                              ? 'border-emerald-100 bg-emerald-50/50 dark:border-emerald-900/40 dark:bg-emerald-950/20'
                              : 'border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/40'
                          }`}
                        >
                          {isUsed && (
                            <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                                {w.word}
                              </span>
                              {w.pos && (
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                                  ({w.pos})
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={(e) => speakEnglishWord(w.word, e)}
                                className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                                title="Phát âm"
                              >
                                <Volume2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <span className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 block">
                              {w.translation}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Bonus words */}
                {exercise.bonusWords.length > 0 && (
                  <div className="rounded-2xl border border-indigo-100 bg-indigo-50/30 p-4 shadow-sm dark:border-indigo-900/50 dark:bg-indigo-950/20">
                    <h3 className="mb-1 flex items-center gap-1.5 text-xs font-black text-indigo-900 dark:text-indigo-200">
                      <Sparkles className="h-4 w-4 text-indigo-500" />
                      <span>Từ mới mở rộng trong bài ({exercise.bonusWords.length})</span>
                    </h3>
                    <p className="mb-3 text-[11px] text-indigo-600 dark:text-indigo-400">
                      Những từ vựng tự nhiên xuất hiện trong bài đọc — bấm Lưu để thêm vào sổ từ của bạn!
                    </p>
                    <div className="space-y-2">
                      {exercise.bonusWords.map((w) => {
                        const isSaved = savedWords.has(w.word);
                        const isSaving = savingWord === w.word;
                        return (
                          <div
                            key={w.word}
                            className={`flex items-center gap-2.5 rounded-xl border p-3 transition-colors ${
                              isSaved
                                ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40'
                                : 'border-indigo-100 bg-white dark:border-slate-800 dark:bg-slate-900'
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                                  {w.word}
                                </span>
                                {w.pos && (
                                  <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                    ({w.pos})
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={(e) => speakEnglishWord(w.word, e)}
                                  className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                                  title="Phát âm"
                                >
                                  <Volume2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                                {w.translation}
                              </p>
                              {w.definition_en && (
                                <p className="text-[10px] text-slate-400 italic mt-0.5">
                                  {w.definition_en}
                                </p>
                              )}
                            </div>
                            <button
                              type="button"
                              disabled={isSaved || isSaving}
                              onClick={() => saveWord(w)}
                              className={`shrink-0 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all shadow-2xs ${
                                isSaved
                                  ? 'border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-200'
                                  : 'border-indigo-300 bg-indigo-600 text-white hover:bg-indigo-700 dark:border-indigo-600'
                              }`}
                            >
                              {isSaving ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : isSaved ? (
                                <>
                                  <Check className="mr-1 inline h-3.5 w-3.5" /> Đã lưu
                                </>
                              ) : (
                                <>
                                  <Plus className="mr-1 inline h-3.5 w-3.5" /> Lưu từ
                                </>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </StudentShell>
  );
}
