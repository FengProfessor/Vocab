'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { completeRoadmapStep, getLastRoadmapStepError } from '@/lib/roadmap-client';
import Link from 'next/link';
import { StudentShell } from '@/components/student/StudentShell';
import { LazyMarkdown } from '@/components/perf/LazyMarkdown';
import { supabase } from '@/lib/supabase';
import type { GrammarTopic, GrammarLesson, GrammarProgress } from '@/lib/supabase';
import GrammarHighlight, { type WordAnnotation } from '@/components/grammar/GrammarHighlight';
import TenseTimeline from '@/components/grammar/TenseTimeline';
import GoldenLesson from '@/components/grammar/GoldenLesson';
import { GrammarFormula } from '@/components/grammar/GrammarFormula';
import {
  ChevronLeft, ChevronDown, ChevronUp, Loader2, GraduationCap, CheckCircle2, Clock, Dumbbell, BookOpen, Volume2, History, FileDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { speak } from '@/lib/study';
import { resolveImageSrc } from '@/lib/media-url';
import {
  buildGrammarLessonPdfHtml,
  downloadGrammarPdfHtml,
  openBlankPdfWindow,
  writePdfHtmlToWindow,
  suggestGrammarPdfFileName,
} from '@/lib/grammar-lesson-pdf';

interface TopicProgressSummary {
  topicId: string;
  title: string;
  titleVi: string | null;
  level: string;
  totalLessons: number;
  /** Có progress (đã đọc/làm) — nguồn tick "đã hoàn thành". */
  learnedLessons: number;
  masteredLessons: number;
  avgMasteryScore: number;
  nextDueDate: string | null;
}

/** 5 Chặng Lộ Trình Ngữ Pháp THPT QG */
const STAGES = [
  {
    id: 1,
    name: 'CHẶNG 1: Thì & Nền Tảng Chia Động Từ',
    sub: 'Buổi 01 – 07 • Nền tảng A0–A1',
    icon: '🌱',
    grad: 'from-emerald-600 via-teal-600 to-cyan-700',
    badgeStyle: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    range: [1, 7],
  },
  {
    id: 2,
    name: 'CHẶNG 2: Cấu Trúc Biến Đổi & Viết Lại Câu',
    sub: 'Buổi 08 – 12 • Cứng cáp A2',
    icon: '⚡',
    grad: 'from-blue-600 via-indigo-600 to-violet-700',
    badgeStyle: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
    range: [8, 12],
  },
  {
    id: 3,
    name: 'CHẶNG 3: Mệnh Đề & Từ Nối Mức Độ Khá',
    sub: 'Buổi 13 – 16 • Thông thạo A2+',
    icon: '🧩',
    grad: 'from-purple-600 via-fuchsia-600 to-pink-700',
    badgeStyle: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
    range: [13, 16],
  },
  {
    id: 4,
    name: 'CHẶNG 4: Vùng Điểm 8+ & Nâng Cao THPT QG',
    sub: 'Buổi 17 – 21 • Chuyên sâu B1+',
    icon: '🎓',
    grad: 'from-amber-600 via-orange-600 to-red-700',
    badgeStyle: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
    range: [17, 21],
  },
  {
    id: 5,
    name: 'CHẶNG 5: Tổng Ôn Đề Trộn & Phản Xạ Phòng Thi',
    sub: 'Buổi 22 – 25 • Chinh phục 9+',
    icon: '🏆',
    grad: 'from-rose-600 via-pink-600 to-purple-700',
    badgeStyle: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
    range: [22, 25],
  },
] as const;

function parseTopicTitle(raw: string): { badge: string; displayTitle: string; buoiNum: number } {
  if (!raw) return { badge: 'THPT QG', displayTitle: '', buoiNum: 1 };
  const match = raw.match(/^Buổi\s+(\d+)\s*[:\-\u2013\u2014]\s*(.+)$/i);
  if (match) {
    const num = parseInt(match[1], 10);
    return {
      badge: `BUỔI ${String(num).padStart(2, '0')}`,
      displayTitle: match[2].trim(),
      buoiNum: num,
    };
  }
  return { badge: 'CHUYÊN ĐỀ', displayTitle: raw.trim(), buoiNum: 1 };
}


/** Đọc câu tiếng Anh — voice EN tường minh (tránh giọng Việt). */
function speakEnglish(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    toast.error('Trình duyệt không hỗ trợ đọc giọng nói.');
    return;
  }
  speak(text, 0.9);
}

function formatOcrTheory(text: string): string {
  if (!text) return '';

  // 1. Chuẩn hóa xuống dòng
  const normalized = text.replace(/\r\n/g, '\n');

  // 2. Phân tách dòng và gộp các câu bị bẻ xuống dòng lỗi do OCR
  const lines = normalized.split('\n');
  const resultLines: string[] = [];
  let currentLine = '';

  // Nhận diện các ký tự bắt đầu của danh sách hoặc tiêu đề chính
  const listPattern = /^(?:\*\*|\*)?(?:\d+(?:\.\d+)*[\.\)]\s+|[a-z][\.\)]\s+|\-|•|Ex:|Ví dụ:|Note:|\*\s+)/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Kiểm tra xem dòng hiện tại kết thúc bằng dấu hai chấm (báo hiệu sắp có danh sách/ví dụ)
    const currentEndsWithColon = currentLine && (
      currentLine.endsWith(':') || 
      currentLine.endsWith('** :') || 
      currentLine.endsWith('**:') ||
      currentLine.endsWith('*:')
    );

    // Dòng mới bắt đầu mục lục hoặc tiêu đề chính hoặc danh sách
    const isNewSection = listPattern.test(line) || 
                         line.startsWith('##') || 
                         line.startsWith('###') ||
                         line.startsWith('>') ||
                         currentEndsWithColon;

    if (isNewSection) {
      if (currentLine) {
        resultLines.push(currentLine);
      }
      currentLine = line;
    } else {
      if (currentLine) {
        if (currentLine.endsWith('-')) {
          // Bỏ gạch nối nối từ (ví dụ: con- \n tinue)
          currentLine = currentLine.slice(0, -1) + line;
        } else {
          currentLine += ' ' + line;
        }
      } else {
        currentLine = line;
      }
    }
  }

  if (currentLine) {
    resultLines.push(currentLine);
  }

  // 3. Định dạng markdown cho từng dòng đã gộp và xử lý lỗi ghép cặp bold/italic
  const formatted = resultLines.map(line => {
    let clean = line;

    // Ghép các cụm bold bị ngắt dòng: ví dụ "abstract** **nouns)" -> "abstract nouns)"
    clean = clean.replace(/\*\*\s+\*\*/g, ' ');
    clean = clean.replace(/\*\s+\*/g, ' ');

    // Làm nổi bật các đề mục chính bắt đầu bằng số như "1. ", "2. ", "1.1. "
    if (/^(?:\*\*)?\d+(\.\d+)*\.?\s/i.test(clean)) {
      if (!clean.startsWith('**') && !clean.startsWith('##')) {
        clean = '**' + clean.replace(/^(\d+(\.\d+)*\.?\s+)/, '$1**');
      }
    }

    // Định dạng danh sách con chữ cái "a. ", "b. " thụt dòng
    if (/^(?:\*\*)?[a-z]\.\s/i.test(clean)) {
      if (!clean.startsWith('  -')) {
        clean = '  - ' + clean;
      }
    }

    // Định dạng ví dụ "Ex: " -> bọc blockquote cho bắt mắt
    if (/^(?:\*\*)?Ex:\s*/i.test(clean)) {
      clean = '> **Ví dụ:** ' + clean.replace(/^(?:\*\*)?Ex:\s*/i, '');
    }
    
    return clean;
  }).join('\n\n');

  return formatted;
}

function GrammarLearnContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roadmapStepId = searchParams.get('roadmapStep');
  const roadmapTopicSlug = searchParams.get('topic');
  const forceReplay = searchParams.get('replay') === '1';
  const [userId, setUserId] = useState<string | null>(null);
  const [topics, setTopics] = useState<GrammarTopic[]>([]);
  const [lessonsByTopic, setLessonsByTopic] = useState<Record<string, GrammarLesson[]>>({});
  const [progressMap, setProgressMap] = useState<Record<string, GrammarProgress>>({});
  const [topicProgress, setTopicProgress] = useState<TopicProgressSummary[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);
  const [activeLesson, setActiveLesson] = useState<GrammarLesson | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const topicRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [loadingTopic, setLoadingTopic] = useState<string | null>(null);
  const [marking, setMarking] = useState(false);
  const [annotationsCache, setAnnotationsCache] = useState<Record<string, WordAnnotation[]>>({});
  const [loadingAnnotations, setLoadingAnnotations] = useState(false);
  const annotatedLessons = useRef<Set<string>>(new Set());

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

        // Lấy flat progress (lesson-level)
        const gp = await fetch('/api/grammar/progress', { headers })
          .then((r) => r.json())
          .catch(() => null);
        if (gp?.success) {
          const map: Record<string, GrammarProgress> = {};
          for (const p of gp.data as GrammarProgress[]) map[p.lesson_id] = p;
          setProgressMap(map);
        }

        // Lấy topic-level summary cho sidebar
        const tp = await fetch('/api/grammar/progress?view=topics', { headers })
          .then((r) => r.json())
          .catch(() => null);
        if (tp?.success) {
          setTopicProgress(tp.data as TopicProgressSummary[]);
        }
      }
      const t = await fetch('/api/grammar/topics').then((r) => r.json()).catch(() => null);
      if (t?.success) setTopics(t.data);
      setIsLoading(false);
    };
    init();
  }, []);

  const scrollToTopic = (topicId: string) => {
    setSidebarOpen(false);
    setExpandedTopic(topicId);
    // Load lessons nếu chưa có rồi scroll
    const el = topicRefs.current[topicId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const toggleTopic = async (topicId: string) => {
    if (expandedTopic === topicId) {
      setExpandedTopic(null);
      return;
    }
    setExpandedTopic(topicId);
    if (!lessonsByTopic[topicId]) {
      setLoadingTopic(topicId);
      const res = await fetch(`/api/grammar/lessons?topicId=${topicId}`)
        .then((r) => r.json())
        .catch(() => null);
      if (res?.success) setLessonsByTopic((prev) => ({ ...prev, [topicId]: res.data }));
      setLoadingTopic(null);
    }
  };

  // Mở từ lộ trình (?topic=<slug>): expand topic + TỰ MỞ bài đầu; nếu đã học trong kho → ghi step + về journey
  const openedFromRoadmap = useRef(false);
  useEffect(() => {
    if (isLoading || !roadmapTopicSlug || topics.length === 0 || openedFromRoadmap.current) return;
    const target = topics.find((t) => t.slug === roadmapTopicSlug);
    if (!target) return;
    openedFromRoadmap.current = true;
    void (async () => {
      setExpandedTopic(target.id);
      setLoadingTopic(target.id);
      try {
        const res = await fetch(`/api/grammar/lessons?topicId=${target.id}`)
          .then((r) => r.json())
          .catch(() => null);
        const lessons = (res?.success ? res.data : []) as GrammarLesson[];
        if (lessons.length > 0) {
          setLessonsByTopic((prev) => ({ ...prev, [target.id]: lessons }));
          // Đã học HẾT bài trong topic = tick step lộ trình (trừ replay)
          const allLearned = lessons.length > 0 && lessons.every((l) => !!progressMap[l.id]);
          if (allLearned && roadmapStepId && !forceReplay) {
            const result = await completeRoadmapStep(roadmapStepId);
            if (result) {
              toast.success(`+${result.xpAwarded} XP — chủ đề này bạn đã học trong kho, sang bước kế tiếp nhé!`);
              router.push('/journey');
              return;
            }
          }
          const firstUnlearned = lessons.find((l) => !progressMap[l.id]) ?? lessons[0];
          setActiveLesson({ ...firstUnlearned, topic: target });
        }
      } finally {
        setLoadingTopic(null);
      }
      setTimeout(() => topicRefs.current[target.id]?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, roadmapTopicSlug, topics]);

  /**
   * Đánh dấu đã đọc / ôn lại bài học.
   * Sư phạm: chỉ đọc lý thuyết KHÔNG = đã thuộc.
   * - Bài mới (chưa có progress) → accuracy 0.55 ≈ Hard → FSRS lên lịch ôn lại sớm (1-2 ngày).
   * - Bài đã từng học (đang due/learned) → accuracy 0.8 ≈ Good → khoảng cách review tăng theo FSRS.
   * Để có Good/Easy thực sự, học sinh phải làm bài tập (route /api/grammar/progress nhận accuracy thật từ quiz).
   */
  const markAsLearned = async () => {
    if (!activeLesson || !userId) {
      toast.error('Bạn cần đăng nhập để lưu tiến độ.');
      return;
    }
    setMarking(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const hasPriorProgress = !!progressMap[activeLesson.id];
      const accuracy = hasPriorProgress ? 0.8 : 0.55;
      const res = await fetch('/api/grammar/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ lessonId: activeLesson.id, accuracy }),
      });
      const data = await res.json();
      if (data.success) {
        const row = data.data as GrammarProgress;
        const nextMap = { ...progressMap, [activeLesson.id]: row };
        setProgressMap(nextMap);
        bumpTopicProgress(activeLesson, row);
        // Server đã credit step grammar → lộ trình (kể cả học ngoài journey)
        const credited = typeof data.roadmapCredited === 'number' ? data.roadmapCredited : 0;
        const topicId = activeLesson.topic_id || activeLesson.topic?.id;
        const siblingLessons = topicId ? (lessonsByTopic[topicId] ?? [activeLesson]) : [activeLesson];
        const topicAllLearned =
          siblingLessons.length > 0 && siblingLessons.every((l) => !!nextMap[l.id]);

        if (roadmapStepId && topicAllLearned) {
          // Đủ hết bài trong topic → complete + XP; credit server là backup
          const result = await completeRoadmapStep(roadmapStepId);
          if (result) {
            toast.success(`+${result.xpAwarded} XP · đã ghi chặng lộ trình.`);
            router.push('/journey');
          } else if (credited > 0) {
            toast.success('Đã đồng bộ tiến độ vào lộ trình.');
            router.push('/journey');
          } else {
            toast.error(getLastRoadmapStepError() || 'Chưa ghi được chặng lộ trình — thử lại từ Lộ trình.');
          }
        } else if (credited > 0) {
          toast.success(
            hasPriorProgress
              ? `Đã ôn lại! Lộ trình đã tick ${credited} bước ngữ pháp liên quan.`
              : `Đã học xong chủ đề! Lộ trình đã tick ${credited} bước ngữ pháp liên quan.`,
          );
          if (roadmapStepId) router.push('/journey');
        } else if (roadmapStepId && !topicAllLearned) {
          const left = siblingLessons.filter((l) => !nextMap[l.id]).length;
          toast.success(
            hasPriorProgress
              ? 'Đã ôn lại bài này.'
              : `Đã ghi nhận bài này. Còn ${left} bài trong chủ đề — học hết để hoàn thành chặng lộ trình.`,
          );
        } else {
          toast.success(
            hasPriorProgress
              ? 'Đã ôn lại bài học! Lịch ôn tiếp theo đã cập nhật.'
              : 'Đã ghi nhận bạn đọc xong. Hãy làm bài tập để củng cố!',
          );
        }
      } else {
        toast.error('Lỗi: ' + (data.error || 'không rõ'));
      }
    } finally {
      setMarking(false);
    }
  };

  useEffect(() => {
    if (!activeLesson?.examples?.length) return;
    if (annotatedLessons.current.has(activeLesson.id)) return;
    annotatedLessons.current.add(activeLesson.id);

    const topic = activeLesson.topic?.title;

    // Nạp annotations đã cache từ DB vào local cache ngay lập tức
    const cachedEntries: Record<string, WordAnnotation[]> = {};
    for (const ex of activeLesson.examples) {
      if (ex.en && ex.annotations?.length) {
        cachedEntries[ex.en] = ex.annotations;
      }
    }
    if (Object.keys(cachedEntries).length > 0) {
      setAnnotationsCache((prev) => ({ ...prev, ...cachedEntries }));
    }

    // Chỉ gọi Gemini cho các example chưa có annotations
    const uncachedExamples = activeLesson.examples.filter(
      (ex) => ex.en && !ex.annotations?.length
    );
    if (uncachedExamples.length === 0) return;

    setLoadingAnnotations(true);

    // Route annotate yêu cầu JWT → lấy session trước khi gọi batch
    supabase.auth.getSession().then(({ data: { session } }) =>
      Promise.allSettled(
        uncachedExamples.map((ex) =>
          fetch('/api/grammar/annotate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session?.access_token ?? ''}`,
            },
            body: JSON.stringify({ sentence: ex.en, topic }),
          })
            .then((r) => r.json())
            .then((res) => (res?.success ? { key: ex.en, data: res.data as WordAnnotation[] } : null))
            .catch(() => null)
        )
      )
    ).then((results) => {
      const newEntries: Record<string, WordAnnotation[]> = {};
      results.forEach((result) => {
        if (result.status === 'fulfilled' && result.value) {
          newEntries[result.value.key] = result.value.data;
        }
      });

      if (Object.keys(newEntries).length > 0) {
        setAnnotationsCache((prev) => ({ ...prev, ...newEntries }));

        // Merge annotations mới vào examples rồi persist lên DB (fire-and-forget)
        const updatedExamples = activeLesson.examples.map((ex) =>
          newEntries[ex.en] ? { ...ex, annotations: newEntries[ex.en] } : ex
        );
        setActiveLesson((prev) => prev ? { ...prev, examples: updatedExamples } : prev);

        void supabase.auth.getSession().then(({ data: { session } }) =>
          fetch('/api/grammar/lessons', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token ?? ''}` },
            body: JSON.stringify({ lessonId: activeLesson.id, examples: updatedExamples }),
          })
        ).catch(() => {
          console.warn('[Grammar] Failed to persist annotations to DB');
        });
      }

      setLoadingAnnotations(false);
    });
  }, [activeLesson?.id]);

  /** new = chưa học; learned = đã học (kể cả đang due); due = đã học + tới lịch ôn. */
  const lessonStatus = (lessonId: string): 'new' | 'learned' | 'due' => {
    const p = progressMap[lessonId];
    if (!p) return 'new';
    return new Date(p.next_review_date).getTime() <= Date.now() ? 'due' : 'learned';
  };

  /** Topic hoàn thành = đã học hết bài (không bắt mastery ≥ 80). */
  const topicDonePct = (tp: TopicProgressSummary | undefined): number => {
    if (!tp || tp.totalLessons <= 0) return 0;
    const learned = typeof tp.learnedLessons === 'number' ? tp.learnedLessons : tp.masteredLessons;
    return Math.round((learned / tp.totalLessons) * 100);
  };

  /** Cập nhật summary topic sau khi ghi progress 1 lesson (tránh phải reload). */
  const bumpTopicProgress = (lesson: GrammarLesson, row: GrammarProgress) => {
    const topicId = lesson.topic_id || lesson.topic?.id;
    if (!topicId) return;
    setTopicProgress((prev) => {
      const existing = prev.find((t) => t.topicId === topicId);
      const hadProgress = !!progressMap[lesson.id];
      const wasMastered = (() => {
        const old = progressMap[lesson.id];
        return !!old && (old.state === 'mastered' || (old.mastery_score ?? 0) >= 80);
      })();
      const nowMastered = row.state === 'mastered' || (row.mastery_score ?? 0) >= 80;
      if (!existing) {
        // Chưa có summary (edge) — để fetch lần sau; không bịa totalLessons
        return prev;
      }
      return prev.map((t) => {
        if (t.topicId !== topicId) return t;
        const learnedLessons = hadProgress
          ? (typeof t.learnedLessons === 'number' ? t.learnedLessons : t.masteredLessons)
          : (typeof t.learnedLessons === 'number' ? t.learnedLessons : t.masteredLessons) + 1;
        let masteredLessons = t.masteredLessons;
        if (!wasMastered && nowMastered) masteredLessons += 1;
        if (wasMastered && !nowMastered) masteredLessons = Math.max(0, masteredLessons - 1);
        return { ...t, learnedLessons, masteredLessons };
      });
    });
  };

  if (isLoading) {
    return (
      <main className="min-h-dvh flex items-center justify-center bg-muted/40">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </main>
    );
  }

  if (activeLesson) {
    const status = lessonStatus(activeLesson.id);
    return (
      <main className="min-h-dvh bg-muted/40 font-sans">
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur border-b h-14 flex items-center px-4 sm:px-6">
          <button
            onClick={() => setActiveLesson(null)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" /> Lộ trình
          </button>
        </header>

        <article className="max-w-2xl mx-auto p-4 sm:p-8 space-y-6">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-800">{activeLesson.title}</h1>

          {activeLesson.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={resolveImageSrc(activeLesson.image_url)}
              referrerPolicy="no-referrer"
              alt={activeLesson.title}
              loading="lazy"
              decoding="async"
              className="w-full max-h-64 object-cover rounded-2xl border"
            />
          ) : (
            // Beautiful colored level-based HSL gradient header
            <div className={`w-full min-h-32 rounded-2xl border flex flex-col justify-end p-6 text-white bg-gradient-to-br ${
              activeLesson.topic?.level === 'beginner' 
                ? 'from-emerald-500 to-teal-600 shadow-emerald-100/10' 
                : activeLesson.topic?.level === 'intermediate'
                  ? 'from-blue-500 to-indigo-600 shadow-blue-100/10'
                  : 'from-purple-500 to-pink-600 shadow-purple-100/10'
            } shadow-lg relative overflow-hidden`}>
              <div className="absolute top-0 right-0 p-8 opacity-10 font-bold text-7xl pointer-events-none select-none">
                {activeLesson.topic?.level === 'beginner' ? 'A0–A1' : activeLesson.topic?.level === 'intermediate' ? 'A2' : 'B1+'}
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-2.5 py-1 rounded-full w-max mb-1.5 backdrop-blur-sm">
                📚 Ngữ Pháp • {activeLesson.topic?.level === 'beginner' ? 'Cơ bản A0–A1' : activeLesson.topic?.level === 'intermediate' ? 'A2' : 'B1+'}
              </span>
              <p className="text-xs text-white/80 font-medium tracking-wide">
                {activeLesson.topic?.title_vi || activeLesson.topic?.title}
              </p>
            </div>
          )}

          {/* Timeline visual aid (chỉ cho bài cũ; Golden Lesson tự có timeline trong sections) */}
          {!activeLesson.sections && <TenseTimeline lessonTitle={activeLesson.title} />}

          {activeLesson.sections ? (
            <GoldenLesson sections={activeLesson.sections} exercises={activeLesson.exercises} />
          ) : (
          <div className="prose prose-slate max-w-none bg-background border rounded-3xl p-6 sm:p-8 shadow-sm">
            <LazyMarkdown
              components={{
                h2: ({ node: _node, ...props }) => (
                  <h2 className="text-xl font-extrabold text-slate-800 border-b border-slate-100 pb-2.5 mb-4 mt-6 flex items-center gap-2" {...props} />
                ),
                h3: ({ node: _node, ...props }) => (
                  <h3 className="text-lg font-extrabold text-slate-700 mb-3 mt-4" {...props} />
                ),
                blockquote: ({ node: _node, ...props }) => (
                  <blockquote className="my-4 p-4 bg-amber-50/50 border-l-4 border-amber-500 rounded-r-2xl text-amber-900 text-sm leading-relaxed" {...props} />
                ),
                table: ({ node: _node, ...props }) => (
                  <div className="overflow-x-auto my-6 rounded-2xl border border-slate-200 shadow-sm bg-white">
                    <table className="w-full text-left text-sm text-slate-600 border-collapse" {...props} />
                  </div>
                ),
                thead: ({ node: _node, ...props }) => <thead className="bg-slate-50/80 text-xs text-slate-700 uppercase font-black" {...props} />,
                th: ({ node: _node, ...props }) => <th className="px-4 py-3 border-b font-bold tracking-wider text-slate-700" {...props} />,
                td: ({ node: _node, ...props }) => <td className="px-4 py-3 border-b border-slate-100 font-medium" {...props} />,
                code: ({ node: _node, inline, className: _className, children, ...props }: {
                  node?: unknown;
                  inline?: boolean;
                  className?: string;
                  children?: React.ReactNode;
                } & React.HTMLAttributes<HTMLElement>) => {
                  const codeText = String(children).replace(/\n$/, '');
                  // Check if it's our new formula block
                  if (!inline && _className === 'language-formula') {
                    return <GrammarFormula code={codeText} />;
                  }

                  // Check if it's an inline formula: contains '+' or '→' or '=>'
                  const isFormula = (codeText.includes('+') || codeText.includes('→') || codeText.includes('=>')) && codeText.length < 80;
                  
                  if (inline) {
                    if (isFormula) {
                      return (
                        <code className="px-2.5 py-1 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 font-black font-mono text-xs inline-block mx-1.5 shadow-sm" {...props}>
                          {codeText}
                        </code>
                      );
                    }
                    return (
                      <code className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-800 font-semibold font-mono text-xs mx-0.5" {...props}>
                        {codeText}
                      </code>
                    );
                  }
                  
                  return (
                    <pre className="p-4 rounded-2xl bg-slate-900 text-slate-200 font-mono text-sm overflow-x-auto shadow-inner my-4 border border-slate-800">
                      <code {...props}>{codeText}</code>
                    </pre>
                  );
                }
              }}
            >
              {activeLesson.source === 'ai-golden'
                ? (activeLesson.theory_vi || activeLesson.theory || '*Chưa có nội dung lý thuyết.*')
                : formatOcrTheory(activeLesson.theory_vi || activeLesson.theory || '*Chưa có nội dung lý thuyết.*')}
            </LazyMarkdown>
          </div>
          )}

          {activeLesson.examples?.length > 0 && (
            <div className="bg-background border rounded-2xl p-6 shadow-sm space-y-3">
              <h3 className="font-bold flex items-center gap-2 text-primary">
                <BookOpen className="h-4 w-4" /> Ví dụ
              </h3>
              {activeLesson.examples.map((ex, i) => (
                <div key={i} className="border-l-2 border-primary/30 pl-3 group">
                  <div className="flex items-start gap-2">
                    <button
                      type="button"
                      onClick={() => speakEnglish(ex.en)}
                      aria-label={`Đọc câu ví dụ ${i + 1}`}
                      title="Nghe phát âm"
                      className="shrink-0 mt-1 h-7 w-7 flex items-center justify-center rounded-full border border-primary/30 text-primary hover:bg-primary hover:text-white transition-colors"
                    >
                      <Volume2 className="h-3.5 w-3.5" />
                    </button>
                    <div className="flex-1 min-w-0">
                  <GrammarHighlight
                    sentence={ex.en}
                    annotations={annotationsCache[ex.en] ?? []}
                    loading={loadingAnnotations && !annotationsCache[ex.en]}
                    showLegend={i === 0}
                  />
                      {ex.vi && <p className="text-sm text-muted-foreground mt-0.5">{ex.vi}</p>}
                      {ex.note && <p className="text-xs text-amber-700 italic mt-0.5">{ex.note}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-2 pt-2">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  const qs = new URLSearchParams({ lesson: activeLesson.id });
                  if (roadmapStepId) qs.set('roadmapStep', roadmapStepId);
                  router.push(`/grammar?${qs.toString()}`);
                }}
                className="flex-1 bg-primary text-white font-bold py-3 rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                <Dumbbell className="h-4 w-4" /> Làm bài tập
              </button>
              <button
                type="button"
                onClick={() => {
                  try {
                    const s = activeLesson.sections;
                    const html = buildGrammarLessonPdfHtml({
                      title: activeLesson.title,
                      titleVi: activeLesson.topic?.title_vi || activeLesson.topic?.title || activeLesson.title,
                      level: activeLesson.topic?.level,
                      slug: activeLesson.topic?.slug,
                      definition: s?.definition,
                      tips: s?.tips,
                      mistakes: s?.mistakes,
                      wordbanks: s?.wordbanks,
                      exercises: activeLesson.exercises ?? undefined,
                      exerciseCap: 0, // all exercises
                      withAnswers: true,
                      siteUrl: typeof window !== 'undefined' ? window.location.origin : undefined,
                    });
                    const base = suggestGrammarPdfFileName(
                      activeLesson.topic?.title_vi || activeLesson.title,
                      activeLesson.topic?.slug,
                    );
                    const w = openBlankPdfWindow();
                    if (w) {
                      writePdfHtmlToWindow(w, html);
                      toast.success('Đã mở handout — bấm “Lưu / In PDF”');
                    } else {
                      downloadGrammarPdfHtml(html, base.replace(/\.pdf$/i, ''));
                      toast.message('Popup bị chặn — đã tải file HTML (mở → In → PDF)');
                    }
                  } catch (e) {
                    console.error('[GrammarPDF]', e);
                    toast.error('Không tạo được PDF. Thử lại.');
                  }
                }}
                className="flex-1 border font-bold py-3 rounded-xl hover:bg-muted transition-colors flex items-center justify-center gap-2"
              >
                <FileDown className="h-4 w-4" /> Tải PDF ôn
              </button>
              <button
                onClick={markAsLearned}
                disabled={marking}
                className="flex-1 border font-bold py-3 rounded-xl hover:bg-muted transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {marking ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {status === 'new' ? 'Đã đọc xong' : 'Ôn lại xong'}
              </button>
            </div>
            {status === 'new' && (
              <p className="text-xs text-muted-foreground text-center">
                💡 PDF = handout đối chiếu offline · Bài tập trên app mới ghi tiến độ.
              </p>
            )}
          </div>
        </article>
      </main>
    );
  }

  // ─── Topics roadmap view ───
  const now = Date.now();
  const progressByTopic: Record<string, TopicProgressSummary> = Object.fromEntries(
    topicProgress.map((tp) => [tp.topicId, tp]),
  );

  /** Sidebar: list topics — % theo bài đã học (không bắt mastery ≥ 80) */
  const ProgressSidebar = () => (
    <nav className="space-y-1.5">
      {topicProgress.length === 0 && (
        <p className="text-xs text-muted-foreground px-1">Chưa có dữ liệu tiến độ.</p>
      )}
      {topicProgress.map((tp) => {
        const pct = topicDonePct(tp);
        const learned = typeof tp.learnedLessons === 'number' ? tp.learnedLessons : tp.masteredLessons;
        const isDue = tp.nextDueDate !== null && new Date(tp.nextDueDate).getTime() <= now;
        const barColor =
          pct === 100 ? 'bg-emerald-500' :
          pct > 50    ? 'bg-blue-500' :
          pct > 0     ? 'bg-amber-400' :
                        'bg-slate-200';
        return (
          <button
            key={tp.topicId}
            onClick={() => scrollToTopic(tp.topicId)}
            className="w-full text-left rounded-xl px-3 py-2.5 hover:bg-muted/60 transition-colors group"
          >
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-xs font-semibold text-slate-700 leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                {tp.titleVi || tp.title}
              </span>
              {isDue && (
                <span className="shrink-0 text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-1.5 py-0.5">
                  Due
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${barColor}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="shrink-0 text-[10px] text-muted-foreground tabular-nums">
                {learned}/{tp.totalLessons}
              </span>
            </div>
          </button>
        );
      })}
    </nav>
  );

  return (
    <main className="min-h-dvh bg-muted/40 font-sans">
      <header className="sticky top-header-safe z-30 flex h-14 items-center justify-between border-b bg-background/80 px-4 backdrop-blur sm:px-6">
        <Link
          href="/student"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" /> Dashboard
        </Link>
        <h1 className="flex items-center gap-2 font-bold text-primary text-base">
          <GraduationCap className="h-5 w-5" /> Bài giảng Ngữ pháp
        </h1>
        <div className="flex items-center gap-2">
          {/* Quick link: ôn câu sai */}
          <Link
            href="/grammar?review=1"
            className="hidden sm:flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-full px-3 py-1.5 transition-colors"
            title="Ôn các câu bạn từng làm sai trong 14 ngày qua"
          >
            <History className="h-3.5 w-3.5" /> Ôn câu sai
          </Link>
          {/* Mobile: nút mở sidebar */}
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="md:hidden flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Tiến độ chủ đề"
          >
            Tiến độ {sidebarOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>
      </header>

      <div className="flex gap-6 max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {/* ─── Desktop Sidebar ─── */}
        <aside className="hidden md:block w-60 shrink-0">
          <div className="sticky top-20 bg-background border rounded-2xl shadow-sm p-4">
            <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">
              Tiến độ chủ đề
            </h2>
            <ProgressSidebar />
          </div>
        </aside>

        {/* ─── Main content ─── */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* Mobile collapsible sidebar */}
          {sidebarOpen && (
            <div className="md:hidden bg-background border rounded-2xl shadow-sm p-4">
              <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">
                Tiến độ chủ đề
              </h2>
              <ProgressSidebar />
            </div>
          )}

          {topics.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <GraduationCap className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="font-semibold">Chưa có bài giảng ngữ pháp.</p>
            </div>
          )}

          {STAGES.map((stg) => {
            const stgTopics = topics.filter((t) => {
              const parsed = parseTopicTitle(t.title_vi || t.title);
              return parsed.buoiNum >= stg.range[0] && parsed.buoiNum <= stg.range[1];
            });
            if (stgTopics.length === 0) return null;
            // Tổng tiến độ của chặng
            const stgProg = stgTopics.reduce(
              (acc, t) => {
                const tp = progressByTopic[t.id];
                if (tp) {
                  const learned = typeof tp.learnedLessons === 'number' ? tp.learnedLessons : tp.masteredLessons;
                  acc.done += learned;
                  acc.total += tp.totalLessons;
                }
                return acc;
              },
              { done: 0, total: 0 },
            );
            return (
              <section key={stg.id} className="space-y-3 pt-3 first:pt-0">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2.5">
                    <span className={`h-10 w-10 rounded-2xl bg-gradient-to-br ${stg.grad} text-white flex items-center justify-center text-lg shadow-md shadow-slate-200/50 dark:shadow-none`}>
                      {stg.icon}
                    </span>
                    <div>
                      <h2 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm sm:text-base leading-tight">{stg.name}</h2>
                      <p className="text-[11px] text-muted-foreground font-medium tracking-wide">
                        {stg.sub} · {stgTopics.length} chủ đề
                      </p>
                    </div>
                  </div>
                  {userId && stgProg.total > 0 && (
                    <span className="text-xs font-bold text-slate-500 tabular-nums bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full border border-slate-200/60 dark:border-slate-700">
                      {stgProg.done}/{stgProg.total} bài
                    </span>
                  )}
                </div>

                {stgTopics.map((topic) => {
                  const lessons = lessonsByTopic[topic.id] || [];
                  const isOpen = expandedTopic === topic.id;
                  const tp = progressByTopic[topic.id];
                  const pct = topicDonePct(tp);
                  const learnedCount = tp
                    ? (typeof tp.learnedLessons === 'number' ? tp.learnedLessons : tp.masteredLessons)
                    : 0;
                  const isDue = tp?.nextDueDate != null && new Date(tp.nextDueDate).getTime() <= now;
                  const parsed = parseTopicTitle(topic.title_vi || topic.title);

                  return (
                    <div
                      key={topic.id}
                      ref={(el) => { topicRefs.current[topic.id] = el; }}
                      className={`bg-background border rounded-2xl shadow-sm overflow-hidden transition-all duration-200 ${
                        isOpen ? 'ring-2 ring-primary/20 border-primary/40 shadow-md' : 'hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <button
                        onClick={() => toggleTopic(topic.id)}
                        className="w-full flex items-center gap-3.5 px-4 sm:px-5 py-4 hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors text-left"
                      >
                        <span className={`shrink-0 px-2.5 py-1 rounded-xl font-mono text-[11px] font-black border transition-all ${stg.badgeStyle}`}>
                          {parsed.badge}
                        </span>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base leading-snug line-clamp-1">
                              {parsed.displayTitle}
                            </span>
                            {isDue && (
                              <span className="shrink-0 text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5 animate-pulse">
                                Cần ôn
                              </span>
                            )}
                            {pct === 100 && (
                              <span className="shrink-0 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5 flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" /> Hoàn thành
                              </span>
                            )}
                          </div>

                          {userId && tp && tp.totalLessons > 0 && (
                            <div className="flex items-center gap-2.5 mt-2">
                              <div className="flex-1 max-w-[200px] h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${pct === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-indigo-500 to-primary'}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="text-[10px] text-muted-foreground font-semibold tabular-nums">
                                {learnedCount}/{tp.totalLessons} bài
                              </span>
                            </div>
                          )}
                        </div>

                        <ChevronDown
                          className={`shrink-0 h-5 w-5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-primary' : ''}`}
                        />
                      </button>


                      {isOpen && (
                        <div className="border-t divide-y">
                          {loadingTopic === topic.id && (
                            <div className="px-5 py-4 flex items-center gap-2 text-sm text-muted-foreground">
                              <Loader2 className="h-4 w-4 animate-spin" /> Đang tải...
                            </div>
                          )}
                          {loadingTopic !== topic.id && lessons.length === 0 && (
                            <div className="px-5 py-4 text-sm text-muted-foreground">Chưa có bài học.</div>
                          )}
                          {lessons.map((lesson, idx) => {
                            const status = lessonStatus(lesson.id);
                            const done = status === 'learned' || status === 'due';
                            return (
                              <button
                                key={lesson.id}
                                onClick={() => setActiveLesson({ ...lesson, topic })}
                                className="w-full flex items-center gap-3 px-4 sm:px-5 py-3 hover:bg-primary/5 transition-colors text-left"
                              >
                                <span
                                  className={`shrink-0 h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold border transition-colors ${
                                    status === 'learned'
                                      ? 'bg-emerald-500 border-emerald-500 text-white'
                                      : status === 'due'
                                        ? 'bg-amber-500 border-amber-500 text-white'
                                        : 'bg-background border-slate-200 text-slate-500'
                                  }`}
                                >
                                  {done ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
                                </span>
                                <span className="flex-1 min-w-0 text-sm font-medium text-slate-700 truncate">{lesson.title}</span>
                                {status === 'due' && (
                                  <span className="shrink-0 text-xs text-amber-600 font-bold flex items-center gap-1">
                                    <Clock className="h-3.5 w-3.5" /> Cần ôn
                                  </span>
                                )}
                                {status === 'new' && (
                                  <span className="shrink-0 text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">Mới</span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}

export default function GrammarLearnPage() {
  return (
    <StudentShell title="Grammar" contentClassName="p-0">
      <Suspense fallback={
        <div className="min-h-[calc(100dvh-var(--header-h)-var(--safe-top))] flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-400" />
        </div>
      }>
        <GrammarLearnContent />
      </Suspense>
    </StudentShell>
  );
}
