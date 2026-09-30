'use client';
import { authFetch } from '@/lib/auth-fetch';


import { useState, useEffect, useRef, Suspense, type ReactNode } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import type { GrammarExercise } from '@/lib/supabase';
import {
  Brain,
  ChevronLeft,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Loader2,
  RotateCcw,
  Home,
  Volume2,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import { toast } from 'sonner';
import { track } from '@/lib/analytics';
import { speak } from '@/lib/study';
import {
  sanitizeDrillExercises,
  isGrammarAnswerCorrect,
} from '@/lib/grammar-exercises';
import { completeRoadmapStep } from '@/lib/roadmap-client';
import { getTopicBySlug } from '@/lib/grammar-roadmap-data';
import CategorizationPractice from '@/components/grammar/CategorizationPractice';
import PedagogicalFeedbackPanel from '@/components/grammar/PedagogicalFeedbackPanel';
import FormattedText from '@/components/grammar/FormattedText';

const GRAMMAR_PRACTICE_STATE_VER = 'v3';

function grammarStateKey(
  userId: string,
  kind: 'review' | 'topic' | 'lesson' | 'class',
  id?: string | null
): string {
  if (kind === 'review') return `lingopro_grammar_practice_${GRAMMAR_PRACTICE_STATE_VER}_${userId}_review`;
  if (kind === 'topic') return `lingopro_grammar_practice_${GRAMMAR_PRACTICE_STATE_VER}_${userId}_topic_${id}`;
  if (kind === 'lesson') return `lingopro_grammar_practice_${GRAMMAR_PRACTICE_STATE_VER}_${userId}_lesson_${id}`;
  return `lingopro_grammar_practice_${GRAMMAR_PRACTICE_STATE_VER}_${userId}_class_${id}`;
}

function hasVietnameseDiacritics(s: string): boolean {
  return /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(s);
}

function extractEnglishForSpeech(raw: string): string | null {
  if (!raw?.trim()) return null;

  const cleaned = raw
    .replace(/^find\s+the\s+error:\s*/i, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/_{2,}/g, 'blank')
    .trim();

  const looksEnglish = (s: string): boolean => {
    const t = s.trim();
    if (!t || hasVietnameseDiacritics(t)) return false;
    const words = t.match(/[A-Za-z]+(?:'[A-Za-z]+)?/g) ?? [];
    if (words.length === 0) return false;
    const real = words.filter((w) => w.length >= 2);
    if (real.length === 0) return false;
    if (real.length === 1) return real[0].length >= 4;
    return true;
  };

  const normalizeSpeak = (s: string) =>
    s
      .replace(/^[\s"'“”‘’`→:\-–—]+|[\s"'“”‘’`]+$/g, '')
      .replace(/\s+/g, ' ')
      .trim();

  const quoted = [...cleaned.matchAll(/["'“”‘’`]([^"'“”‘’`]{2,})["'“”‘’`]/g)]
    .map((m) => normalizeSpeak(m[1]))
    .filter((q) => looksEnglish(q));
  if (quoted.length > 0) return quoted.join('. ');

  if (cleaned.includes('→')) {
    const after = normalizeSpeak(cleaned.split('→').slice(1).join(' '));
    if (looksEnglish(after)) return after;
  }

  const segments = cleaned.split(/[:：]\s*/);
  if (segments.length > 1) {
    const enSegs = segments
      .slice(1)
      .map((s) => normalizeSpeak(s))
      .filter((s) => looksEnglish(s));
    if (enSegs.length > 0) return enSegs.join('. ');
  }

  if (!hasVietnameseDiacritics(cleaned) && looksEnglish(cleaned)) {
    return normalizeSpeak(cleaned);
  }

  return null;
}

function speakEnglish(text: string) {
  if (typeof window === 'undefined') return;
  const en = extractEnglishForSpeech(text);
  if (!en) return;
  speak(en, 0.9);
}

function renderRichText(text: string): ReactNode[] {
  const raw = String(text ?? '');
  if (!raw.trim()) {
    return [
      <span key="empty" className="text-muted-foreground font-medium font-mono text-sm">
        (Chọn phương án phù hợp nhất)
      </span>,
    ];
  }

  // Normalize blanks like [blank], (...), ____
  const normalized = raw
    .replace(/(^|\n)\s*[*•]\s+/g, '$1• ')
    .replace(/\[blank\]/gi, '___')
    .replace(/\(\.\.\.\)/g, '___');

  const nodes: ReactNode[] = [];
  // Tokenize bold-italic (***...***), bold (**...**), italic (*...*), code (`...`), or blank (___)
  const tokens = normalized.split(/(\*{3}[^*\n]+?\*{3}|\*{2}[^*\n]+?\*{2}|\*[^*\n]+?\*|`[^`\n]+?`|_{3,})/g);

  tokens.forEach((token, i) => {
    if (!token) return;

    // Blank line
    if (/^_{3,}$/.test(token)) {
      nodes.push(
        <span
          key={`bl-${i}`}
          className="inline-block min-w-[3.5rem] px-2 mx-1 border-b-2 border-dashed border-primary align-baseline"
          aria-label="Chỗ trống cần điền"
        />
      );
      return;
    }

    // Bold + Italic: ***text***
    if (token.startsWith('***') && token.endsWith('***') && token.length >= 6) {
      nodes.push(
        <strong key={`bi-${i}`} className="text-primary font-bold italic">
          {token.slice(3, -3).replace(/\*/g, '').trim()}
        </strong>
      );
      return;
    }

    // Bold: **text**
    if (token.startsWith('**') && token.endsWith('**') && token.length >= 4) {
      nodes.push(
        <strong key={`b-${i}`} className="text-primary font-bold">
          {token.slice(2, -2).replace(/\*/g, '').trim()}
        </strong>
      );
      return;
    }

    // Italic: *text*
    if (token.startsWith('*') && token.endsWith('*') && token.length >= 2) {
      nodes.push(
        <em key={`it-${i}`} className="italic text-foreground/90 font-medium">
          {token.slice(1, -1).replace(/\*/g, '').trim()}
        </em>
      );
      return;
    }

    // Code: `code`
    if (token.startsWith('`') && token.endsWith('`') && token.length >= 2) {
      nodes.push(
        <code key={`cd-${i}`} className="font-mono text-xs px-1.5 py-0.5 bg-muted/60 border border-border/60 rounded-none">
          {token.slice(1, -1)}
        </code>
      );
      return;
    }

    // Plain text: strip all stray unmatched asterisks
    const cleanText = token.replace(/\*+/g, '');
    if (cleanText) {
      nodes.push(<span key={`t-${i}`}>{cleanText}</span>);
    }
  });

  return nodes;
}

function ErrorCorrectionSentence({
  sentence,
  options,
  selected,
  correctAnswer,
  onSelect,
}: {
  sentence: string;
  options: string[];
  selected: string | null;
  correctAnswer: string;
  onSelect: (token: string) => void;
}) {
  const cleanSentence = sentence
    .replace(/\*+/g, '')
    .replace(/^(find|identify|spot|correct|tìm|sửa)\s+(the\s+)?(incorrect\s+word\/phrase|error|lỗi\s+sai\s+trong\s+câu|lỗi\s+trong\s+câu)[^:]*:\s*/i, '')
    .trim();

  if (!options || options.length === 0 || !cleanSentence) {
    return (
      <div className="text-base sm:text-lg font-medium text-foreground leading-relaxed">
        <FormattedText text={sentence} />
      </div>
    );
  }

  const escapedOptions = [...options]
    .map((opt) => opt.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'))
    .sort((a, b) => b.length - a.length);
  const regex = new RegExp(`\\b(${escapedOptions.join('|')})\\b`, 'gi');
  const parts = cleanSentence.split(regex);
  const hasMatchedTokens = parts.some((p) =>
    options.find((opt) => opt.toLowerCase() === p.trim().toLowerCase())
  );

  if (!hasMatchedTokens) {
    return (
      <div className="text-base sm:text-lg font-medium text-foreground leading-relaxed">
        <FormattedText text={sentence} />
      </div>
    );
  }

  return (
    <p className="text-base sm:text-lg font-medium text-foreground leading-loose">
      {parts.map((part, i) => {
        const trimmed = part.trim();
        const matchedOption = options.find((opt) => opt.toLowerCase() === trimmed.toLowerCase());

        if (!matchedOption) {
          return <span key={i}>{part}</span>;
        }

        const isCorrect = isGrammarAnswerCorrect(matchedOption, correctAnswer, options);
        const isSel =
          !!selected &&
          (isGrammarAnswerCorrect(selected, matchedOption, options) ||
            selected.toLowerCase() === matchedOption.toLowerCase());

        let cn = 'inline-block mx-0.5 px-2.5 py-1 border transition-colors rounded-none font-mono text-sm sm:text-base min-h-[36px] ';
        if (selected) {
          if (isCorrect) cn += 'bg-emerald-500/10 border-emerald-500 text-emerald-800 dark:text-emerald-300 font-semibold ';
          else if (isSel) cn += 'bg-rose-500/10 border-rose-500 text-rose-800 dark:text-rose-300 line-through ';
          else cn += 'opacity-40 border-transparent ';
        } else {
          cn += 'border-dashed border-border hover:bg-muted hover:border-foreground cursor-pointer ';
        }

        return (
          <button
            key={i}
            className={cn}
            disabled={!!selected}
            onClick={() => onSelect(matchedOption)}
            type="button"
          >
            {part}
          </button>
        );
      })}
    </p>
  );
}

function PracticeProgressBar({ current, total }: { current: number; total: number }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5 text-xs font-mono text-muted-foreground">
        <span>
          CÂU {current} / {total}
        </span>
        <span className="font-bold text-foreground">{pct}%</span>
      </div>
      <div className="h-1.5 bg-muted w-full border border-border/40 rounded-none overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300 rounded-none"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function PracticeScoreCard({
  correct,
  total,
  topicSlug,
  onRetry,
}: {
  correct: number;
  total: number;
  topicSlug: string | null;
  onRetry: () => void;
}) {
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  const isPass = accuracy >= 80;

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center p-6 bg-background">
      <div className="border border-border p-8 w-full max-w-md bg-card rounded-none shadow-none flex flex-col gap-6">
        <div className="border-b border-border pb-4">
          <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-1">
            Kết quả luyện tập ngữ pháp
          </div>
          <h1 className="text-2xl font-serif font-bold text-foreground">
            {isPass ? 'Đạt chuẩn yêu cầu' : 'Cần ôn luyện thêm'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isPass
              ? 'Bạn đã hoàn thành xuất sắc phiên luyện tập này với độ chính xác cao.'
              : 'Hãy xem lại các câu sai để củng cố bản chất cấu trúc ngữ pháp.'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 border border-border p-4 bg-muted/20">
          <div>
            <div className="text-xs font-mono text-muted-foreground uppercase">Độ chính xác</div>
            <div className="text-3xl font-mono font-bold mt-1 text-foreground">{accuracy}%</div>
          </div>
          <div>
            <div className="text-xs font-mono text-muted-foreground uppercase">Số câu đúng</div>
            <div className="text-3xl font-mono font-bold mt-1 text-emerald-600 dark:text-emerald-400">
              {correct} / {total}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <button
            onClick={onRetry}
            className="w-full bg-primary text-primary-foreground py-2.5 px-4 font-mono text-xs uppercase tracking-wider font-semibold rounded-none border border-primary hover:bg-primary/90 flex items-center justify-center gap-2"
          >
            <RotateCcw className="h-4 w-4" /> Làm lại bài tập
          </button>
          {topicSlug && (
            <Link href={`/grammar?topic=${encodeURIComponent(topicSlug)}`} className="w-full">
              <button className="w-full border border-border py-2.5 px-4 font-mono text-xs uppercase tracking-wider font-semibold rounded-none hover:bg-muted text-foreground flex items-center justify-center gap-2">
                <BookOpen className="h-4 w-4" /> Học lại lý thuyết
              </button>
            </Link>
          )}
          <Link href="/grammar" className="w-full">
            <button className="w-full border border-border py-2.5 px-4 font-mono text-xs uppercase tracking-wider font-semibold rounded-none hover:bg-muted text-foreground flex items-center justify-center gap-2">
              <Home className="h-4 w-4" /> Về lộ trình ngữ pháp
            </button>
          </Link>
        </div>
      </div>
    </main>
  );
}

function PracticeHubContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Query parameters
  const topicSlug = searchParams.get('topic');
  const classroomId = searchParams.get('classroomId') || searchParams.get('class');
  const lessonId = searchParams.get('lessonId') || searchParams.get('lesson');
  const isReviewMode =
    searchParams.get('mode') === 'review' ||
    searchParams.get('reviewMode') === '1' ||
    searchParams.get('reviewMode') === 'true' ||
    searchParams.get('review') === '1' ||
    searchParams.get('review') === 'true';
  const roadmapStepId = searchParams.get('roadmapStep');

  // Topic metadata if available
  const topicMeta = topicSlug ? getTopicBySlug(topicSlug) : null;

  // Session state
  const [exercises, setExercises] = useState<GrammarExercise[]>([]);
  const [current, setCurrent] = useState<GrammarExercise | null>(null);
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [showExplanation, setShowExplanation] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [score, setScore] = useState({ correct: 0, wrong: 0 });
  const [done, setDone] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());
  const [userId, setUserId] = useState<string | null>(null);
  const [emptyMessage, setEmptyMessage] = useState<string | null>(null);

  const rawExercises = useRef<GrammarExercise[]>([]);
  const answering = useRef(false);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      setEmptyMessage(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) setUserId(user.id);

      // Mode 1: Spaced Review (14-day error queue)
      if (isReviewMode) {
        if (!user) {
          toast.error('Cần đăng nhập để ôn tập các câu đã sai.');
          setIsLoading(false);
          setEmptyMessage('Vui lòng đăng nhập để mở hàng đợi ôn tập ngắt quãng.');
          return;
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();
        const res = await fetch('/api/grammar/review?days=14', {
          headers: session?.user ? { 'X-LingoPro-Request': '1' } : {},
        });
        const data = await res.json();

        if (data.success && data.data?.length > 0) {
          const cleaned = sanitizeDrillExercises(data.data as GrammarExercise[]);
          rawExercises.current = cleaned;

          // Restore saved progress if any
          const savedKey = grammarStateKey(user.id, 'review');
          const saved = localStorage.getItem(savedKey);
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              if (parsed?.exercises?.length > 0) {
                const restored = sanitizeDrillExercises(parsed.exercises as GrammarExercise[]);
                const qi = Math.min(parsed.qIndex ?? 0, restored.length - 1);
                setExercises(restored);
                setCurrent(restored[qi]);
                setQIndex(qi);
                setSelected(parsed.selected);
                setTypedAnswer(parsed.typedAnswer || '');
                setShowExplanation(parsed.showExplanation || false);
                setScore(parsed.score);
                setDone(parsed.done || false);
                setStartTime(parsed.startTime || Date.now());
                answering.current = false;
                toast.success('Đã khôi phục tiến trình ôn câu sai.');
                setIsLoading(false);
                return;
              }
            } catch (e) {
              console.error('Failed to parse saved state:', e);
            }
          }

          startSession(cleaned);
        } else {
          setEmptyMessage('Tuyệt vời! Bạn không có câu hỏi nào cần ôn lại trong 14 ngày qua.');
        }
        setIsLoading(false);
        return;
      }

      // Mode 2: Topic Slug (?topic=...)
      if (topicSlug) {
        try {
          const res = await authFetch(`/api/grammar?topic=${encodeURIComponent(topicSlug)}`);
          const data = await res.json();
          if (data.success && data.data?.length > 0) {
            const cleaned = sanitizeDrillExercises(data.data as GrammarExercise[]);
            rawExercises.current = cleaned;

            if (user) {
              const savedKey = grammarStateKey(user.id, 'topic', topicSlug);
              const saved = localStorage.getItem(savedKey);
              if (saved) {
                try {
                  const parsed = JSON.parse(saved);
                  if (parsed?.exercises?.length > 0) {
                    const restored = sanitizeDrillExercises(parsed.exercises as GrammarExercise[]);
                    const qi = Math.min(parsed.qIndex ?? 0, restored.length - 1);
                    setExercises(restored);
                    setCurrent(restored[qi]);
                    setQIndex(qi);
                    setSelected(parsed.selected);
                    setTypedAnswer(parsed.typedAnswer || '');
                    setShowExplanation(parsed.showExplanation || false);
                    setScore(parsed.score);
                    setDone(parsed.done || false);
                    setStartTime(parsed.startTime || Date.now());
                    answering.current = false;
                    toast.success('Đã khôi phục tiến trình làm bài.');
                    setIsLoading(false);
                    return;
                  }
                } catch (e) {
                  console.error('Failed to parse saved state:', e);
                }
              }
            }

            startSession(cleaned);
          } else {
            setEmptyMessage(`Chưa có câu hỏi luyện tập cho chủ điểm "${topicMeta?.title || topicSlug}".`);
          }
        } catch (err) {
          console.error('Failed to load topic exercises:', err);
          setEmptyMessage('Lỗi khi tải dữ liệu bài tập.');
        }
        setIsLoading(false);
        return;
      }

      // Mode 3: Classroom / Lesson ID
      if (classroomId || lessonId) {
        const params = new URLSearchParams();
        if (classroomId) params.set('classroomId', classroomId);
        if (lessonId) params.set('lessonId', lessonId);
        const res = await fetch(`/api/grammar?${params.toString()}`, {
          headers: { 'X-LingoPro-Request': '1' },
        });
        const data = await res.json();

        if (data.success && data.data?.length > 0) {
          const cleaned = sanitizeDrillExercises(data.data as GrammarExercise[]);
          rawExercises.current = cleaned;

          if (user) {
            const savedKey = lessonId
              ? grammarStateKey(user.id, 'lesson', lessonId)
              : grammarStateKey(user.id, 'class', classroomId);
            const saved = localStorage.getItem(savedKey);
            if (saved) {
              try {
                const parsed = JSON.parse(saved);
                if (parsed?.exercises?.length > 0) {
                  const restored = sanitizeDrillExercises(parsed.exercises as GrammarExercise[]);
                  const qi = Math.min(parsed.qIndex ?? 0, restored.length - 1);
                  setExercises(restored);
                  setCurrent(restored[qi]);
                  setQIndex(qi);
                  setSelected(parsed.selected);
                  setTypedAnswer(parsed.typedAnswer || '');
                  setShowExplanation(parsed.showExplanation || false);
                  setScore(parsed.score);
                  setDone(parsed.done || false);
                  setStartTime(parsed.startTime || Date.now());
                  answering.current = false;
                  toast.success('Đã khôi phục tiến trình bài tập.');
                  setIsLoading(false);
                  return;
                }
              } catch (e) {
                console.error('Failed to parse saved state:', e);
              }
            }
          }

          startSession(cleaned);
        } else {
          setEmptyMessage('Chưa có bài tập cho lớp học hoặc bài học này.');
        }
        setIsLoading(false);
        return;
      }

      // Fallback: No parameters provided -> Direct to roadmap
      setIsLoading(false);
      setEmptyMessage('Vui lòng chọn một chủ điểm ngữ pháp từ lộ trình để bắt đầu luyện tập.');
    };

    init();
  }, [topicSlug, classroomId, lessonId, isReviewMode]);

  // Save session state to localStorage
  useEffect(() => {
    if (isLoading || !userId || exercises.length === 0 || done) return;

    let key = '';
    if (isReviewMode) {
      key = grammarStateKey(userId, 'review');
    } else if (topicSlug) {
      key = grammarStateKey(userId, 'topic', topicSlug);
    } else if (lessonId) {
      key = grammarStateKey(userId, 'lesson', lessonId);
    } else if (classroomId) {
      key = grammarStateKey(userId, 'class', classroomId);
    }

    if (key) {
      const stateToSave = {
        exercises,
        qIndex,
        selected,
        typedAnswer,
        showExplanation,
        score,
        done,
        startTime,
      };
      localStorage.setItem(key, JSON.stringify(stateToSave));
    }
  }, [
    exercises,
    qIndex,
    selected,
    typedAnswer,
    showExplanation,
    score,
    done,
    startTime,
    userId,
    isLoading,
    isReviewMode,
    topicSlug,
    lessonId,
    classroomId,
  ]);

  const startSession = (source: GrammarExercise[]) => {
    const cleaned = sanitizeDrillExercises(source);
    const shuffled = [...cleaned].sort(() => Math.random() - 0.5);
    setExercises(shuffled);
    setCurrent(shuffled[0]);
    setQIndex(0);
    setSelected(null);
    setTypedAnswer('');
    setShowExplanation(false);
    setScore({ correct: 0, wrong: 0 });
    setDone(false);
    setStartTime(Date.now());
    answering.current = false;
  };

  const handleRetry = () => {
    if (userId) {
      let key = '';
      if (isReviewMode) key = grammarStateKey(userId, 'review');
      else if (topicSlug) key = grammarStateKey(userId, 'topic', topicSlug);
      else if (lessonId) key = grammarStateKey(userId, 'lesson', lessonId);
      else if (classroomId) key = grammarStateKey(userId, 'class', classroomId);
      if (key) localStorage.removeItem(key);
    }
    startSession(rawExercises.current);
  };

  const handleRetryCurrentQuestion = () => {
    if (!current) return;
    setScore((prev) => ({
      ...prev,
      wrong: Math.max(0, prev.wrong - 1),
    }));
    setSelected(null);
    setTypedAnswer('');
    setShowExplanation(false);
    answering.current = false;
  };

  const handleSelectOption = (opt: string) => {
    if (!current || selected || answering.current) return;
    answering.current = true;
    setSelected(opt);

    const isCorrect = isGrammarAnswerCorrect(opt, current.correct_answer, current.options);
    const newScore = {
      correct: score.correct + (isCorrect ? 1 : 0),
      wrong: score.wrong + (isCorrect ? 0 : 1),
    };
    setScore(newScore);
    setShowExplanation(true);
  };

  const handleFillSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!current || selected || !typedAnswer.trim() || answering.current) return;
    handleSelectOption(typedAnswer.trim());
  };

  const handleNext = async () => {
    if (qIndex + 1 < exercises.length) {
      const nextIndex = qIndex + 1;
      setQIndex(nextIndex);
      setCurrent(exercises[nextIndex]);
      setSelected(null);
      setTypedAnswer('');
      setShowExplanation(false);
      answering.current = false;
    } else {
      setDone(true);
      answering.current = false;

      track('grammar_quiz_completed', {
        correct: score.correct,
        total: exercises.length,
        accuracy: exercises.length > 0 ? Math.round((score.correct / exercises.length) * 100) : 0,
        mode: topicSlug ? 'topic' : isReviewMode ? 'review' : 'classroom',
      });

      // Clear cached state
      if (userId) {
        let key = '';
        if (isReviewMode) key = grammarStateKey(userId, 'review');
        else if (topicSlug) key = grammarStateKey(userId, 'topic', topicSlug);
        else if (lessonId) key = grammarStateKey(userId, 'lesson', lessonId);
        else if (classroomId) key = grammarStateKey(userId, 'class', classroomId);
        if (key) localStorage.removeItem(key);
      }

      // Complete roadmap step if linked from journey
      if (roadmapStepId) {
        try {
          await completeRoadmapStep(roadmapStepId);
          toast.success('Đã cập nhật tiến trình chặng học!');
        } catch (err) {
          console.error('Failed to complete roadmap step:', err);
        }
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInputActive =
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') &&
        !(target as HTMLInputElement).disabled;

      if (isInputActive) return;

      // 1. Enter key: advance question if an option has been chosen
      if (e.key === 'Enter') {
        if (!selected || done) return;
        e.preventDefault();
        handleNext();
        return;
      }

      // 2. Letter (A-D) or Number (1-4) keys: quick option selection for multiple choice
      if (
        !selected &&
        !done &&
        current &&
        current.type !== 'fill_blank' &&
        current.type !== 'categorization' &&
        current.options &&
        current.options.length > 0
      ) {
        const key = e.key.toUpperCase();
        let optIndex = -1;
        if (['A', 'B', 'C', 'D'].includes(key)) {
          optIndex = key.charCodeAt(0) - 65;
        } else if (['1', '2', '3', '4'].includes(key)) {
          optIndex = parseInt(key, 10) - 1;
        }

        if (optIndex >= 0 && optIndex < current.options.length) {
          e.preventDefault();
          handleSelectOption(current.options[optIndex]);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selected, done, qIndex, exercises.length, current]);

  // Loading State
  if (isLoading) {
    return (
      <main className="min-h-dvh flex flex-col items-center justify-center p-6 bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
            Đang tải dữ liệu bài tập...
          </span>
        </div>
      </main>
    );
  }

  // Empty or Missing State
  if (emptyMessage || !current || exercises.length === 0) {
    return (
      <main className="min-h-dvh flex flex-col items-center justify-center p-6 bg-background">
        <div className="border border-border p-8 w-full max-w-md bg-card rounded-none shadow-none flex flex-col items-center text-center gap-4">
          <Brain className="h-10 w-10 text-muted-foreground/40" />
          <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            {isReviewMode ? 'Hàng đợi ôn tập' : 'Thông báo bài tập'}
          </div>
          <p className="text-sm text-foreground font-medium max-w-xs">{emptyMessage}</p>
          <div className="flex gap-2 w-full pt-2">
            <Link href="/grammar" className="w-full">
              <button className="w-full bg-primary text-primary-foreground py-2.5 px-4 font-mono text-xs uppercase tracking-wider font-semibold rounded-none border border-primary hover:bg-primary/90 flex items-center justify-center gap-2">
                <Home className="h-4 w-4" /> Về lộ trình ngữ pháp
              </button>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Done State
  if (done) {
    return (
      <PracticeScoreCard
        correct={score.correct}
        total={exercises.length}
        topicSlug={topicSlug}
        onRetry={handleRetry}
      />
    );
  }

  const isCurrentCorrect = selected
    ? isGrammarAnswerCorrect(selected, current.correct_answer, current.options)
    : false;

  const headerTitle = isReviewMode
    ? 'Ôn tập câu sai (14 ngày)'
    : topicMeta
    ? `${topicMeta.order < 10 ? '0' : ''}${topicMeta.order}. ${topicMeta.title}`
    : current.topic || 'Luyện tập ngữ pháp';

  return (
    <main className="min-h-dvh flex flex-col bg-background text-foreground">
      {/* Top Header */}
      <header className="border-b border-border bg-card px-4 py-3 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Link href="/grammar">
              <button className="p-1.5 border border-border rounded-none hover:bg-muted text-muted-foreground hover:text-foreground">
                <ChevronLeft className="h-4 w-4" />
              </button>
            </Link>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                {topicMeta?.stageLabel || (isReviewMode ? 'Spaced Review' : 'Practice Hub')}
              </div>
              <h1 className="text-sm font-semibold font-serif text-foreground truncate max-w-[220px] sm:max-w-md">
                {headerTitle}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => speakEnglish(current.question)}
              className="p-1.5 border border-border rounded-none hover:bg-muted text-muted-foreground hover:text-foreground"
              title="Nghe câu tiếng Anh"
            >
              <Volume2 className="h-4 w-4" />
            </button>
            <div className="font-mono text-xs font-semibold px-2 py-1 border border-border bg-muted/30">
              <span className="text-emerald-600 dark:text-emerald-400">{score.correct}</span>
              <span className="text-muted-foreground mx-1">/</span>
              <span className="text-red-600 dark:text-red-400">{score.wrong}</span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="max-w-3xl mx-auto mt-2">
          <PracticeProgressBar current={qIndex + 1} total={exercises.length} />
        </div>
      </header>

      {/* Main Question Container */}
      <div className="flex-1 max-w-3xl w-full mx-auto p-4 sm:p-6 flex flex-col justify-between">
        <div className="flex flex-col gap-6">
          {/* Question Box (hidden for categorization as CategorizationPractice has its own dedicated header) */}
          {current.type !== 'categorization' && (
            <div className="border border-border p-6 bg-card rounded-none">
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-xs uppercase px-2 py-0.5 border border-border text-muted-foreground">
                  {current.type === 'fill_blank'
                    ? 'Điền khuyết'
                    : current.type === 'error_correction'
                    ? 'Tìm lỗi sai'
                    : 'Trắc nghiệm'}
                </span>
                {current.level && (
                  <span className="font-mono text-xs uppercase text-muted-foreground">
                    Cấp độ: {current.level}
                  </span>
                )}
              </div>

              {/* Error correction or text prompt */}
              {current.type === 'error_correction' && current.options && current.options.length > 0 ? (
                <ErrorCorrectionSentence
                  sentence={current.question}
                  options={current.options}
                  selected={selected}
                  correctAnswer={String(current.correct_answer)}
                  onSelect={handleSelectOption}
                />
              ) : (
                <div className="text-lg font-serif font-medium leading-relaxed">
                  {renderRichText(current.question)}
                </div>
              )}
            </div>
          )}

          {/* Options / Input Form / Categorization */}
          {current.type === 'categorization' && current.categories && current.categories.length > 0 ? (
            <CategorizationPractice
              exercise={{
                id: current.id,
                question: current.question,
                type: 'categorization',
                categories: current.categories,
                explanation: current.explanation || '',
                correct_answer: current.correct_answer || '',
                difficulty: 'medium',
              }}
              nextButtonLabel={qIndex + 1 === exercises.length ? 'Xem kết quả' : 'Câu tiếp theo'}
              onNextQuestion={handleNext}
              onRetry={handleRetryCurrentQuestion}
              onComplete={(correctCount, totalCount) => {
                if (selected) return;
                const isAllCorrect = correctCount === totalCount && totalCount > 0;
                setSelected(isAllCorrect ? 'correct' : 'incorrect');
                setScore((prev) => ({
                  correct: prev.correct + (isAllCorrect ? 1 : 0),
                  wrong: prev.wrong + (isAllCorrect ? 0 : 1),
                }));
                setShowExplanation(true);
              }}
            />
          ) : current.type === 'fill_blank' ? (
            <form onSubmit={handleFillSubmit} className="flex flex-col gap-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={typedAnswer}
                  onChange={(e) => setTypedAnswer(e.target.value)}
                  disabled={!!selected}
                  placeholder="Nhập câu trả lời của bạn..."
                  className="flex-1 border border-border bg-card px-4 py-3 rounded-none font-mono text-sm focus:outline-none focus:border-foreground"
                />
                <button
                  type="submit"
                  disabled={!!selected || !typedAnswer.trim()}
                  className="bg-primary text-primary-foreground px-6 py-3 font-mono text-xs uppercase tracking-wider font-semibold rounded-none border border-primary hover:bg-primary/90 disabled:opacity-40"
                >
                  Xác nhận
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 gap-2.5">
              {current.options?.map((opt, idx) => {
                const isCorrect = isGrammarAnswerCorrect(opt, current.correct_answer, current.options);
                const isSelected = selected === opt;

                let optClass =
                  'w-full text-left p-4 border rounded-none transition-colors flex items-start justify-between gap-4 font-mono text-sm ';

                if (selected) {
                  if (isCorrect) {
                    optClass += 'bg-emerald-500/10 border-emerald-500 text-emerald-800 dark:text-emerald-300 font-semibold';
                  } else if (isSelected) {
                    optClass += 'bg-red-500/10 border-red-500 text-red-800 dark:text-red-300';
                  } else {
                    optClass += 'border-border/60 text-muted-foreground opacity-50';
                  }
                } else {
                  optClass += 'border-border bg-card hover:bg-muted/70 hover:border-foreground';
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(opt)}
                    disabled={!!selected}
                    className={optClass}
                    type="button"
                  >
                    <div className="flex items-start gap-3 flex-1 text-left">
                      <span className="text-xs text-muted-foreground uppercase pt-0.5 shrink-0 font-bold">
                        {String.fromCharCode(65 + idx)}.
                      </span>
                      <span className="flex-1 text-left leading-relaxed">
                        <FormattedText text={opt} />
                      </span>
                    </div>
                    {selected && isCorrect && (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    )}
                    {selected && isSelected && !isCorrect && (
                      <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Pedagogical Feedback Panel (for MCQ, Fill-in-blank, Error correction) */}
          {showExplanation && current.type !== 'categorization' && (
            <PedagogicalFeedbackPanel
              isCorrect={isCurrentCorrect}
              selectedOption={selected || ''}
              correctAnswer={String(current.correct_answer)}
              explanation={current.explanation}
              distractorBreakdowns={current.distractor_breakdowns}
              nextButtonLabel={qIndex + 1 === exercises.length ? 'Xem kết quả' : 'Câu tiếp theo'}
              onNextQuestion={handleNext}
              onRetry={!isCurrentCorrect ? handleRetryCurrentQuestion : undefined}
            />
          )}
        </div>

        {/* Footer Next Button (fallback if feedback panel is hidden and not categorization) */}
        {selected && !showExplanation && current.type !== 'categorization' && (
          <div className="mt-8 pt-4 border-t border-border flex justify-end">
            <button
              onClick={handleNext}
              className="bg-primary text-primary-foreground py-3 px-8 font-mono text-xs uppercase tracking-wider font-semibold rounded-none border border-primary hover:bg-primary/90 flex items-center gap-2"
            >
              <span>{qIndex + 1 === exercises.length ? 'Xem kết quả' : 'Câu tiếp theo'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

export default function GrammarPracticePage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-dvh flex flex-col items-center justify-center p-6 bg-background">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
              Khởi tạo phòng luyện tập ngữ pháp...
            </span>
          </div>
        </main>
      }
    >
      <PracticeHubContent />
    </Suspense>
  );
}
