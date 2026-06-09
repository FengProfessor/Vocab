'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { supabase } from '@/lib/supabase';
import type { GrammarTopic, GrammarLesson, GrammarProgress } from '@/lib/supabase';
import GrammarHighlight, { type WordAnnotation } from '@/components/grammar/GrammarHighlight';
import {
  ChevronLeft, ChevronDown, ChevronUp, Loader2, GraduationCap, CheckCircle2, Clock, Dumbbell, BookOpen, Volume2, History,
} from 'lucide-react';
import { toast } from 'sonner';

interface TopicProgressSummary {
  topicId: string;
  title: string;
  titleVi: string | null;
  level: string;
  totalLessons: number;
  masteredLessons: number;
  avgMasteryScore: number;
  nextDueDate: string | null;
}

/**
 * Đọc câu tiếng Anh bằng Web Speech API (free, native).
 * Tự cancel utterance đang chạy nếu user click liên tiếp.
 */
function speakEnglish(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    toast.error('Trình duyệt không hỗ trợ đọc giọng nói.');
    return;
  }
  const synth = window.speechSynthesis;
  synth.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'en-US';
  utter.rate = 0.9;
  utter.pitch = 1;
  synth.speak(utter);
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

export default function GrammarLearnPage() {
  const router = useRouter();
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
        setProgressMap((prev) => ({ ...prev, [activeLesson.id]: data.data }));
        toast.success(
          hasPriorProgress
            ? 'Đã ôn lại bài học! Lịch ôn tiếp theo đã cập nhật.'
            : 'Đã ghi nhận bạn đọc xong. Hãy làm bài tập để củng cố!',
        );
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

    Promise.allSettled(
      uncachedExamples.map((ex) =>
        fetch('/api/grammar/annotate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sentence: ex.en, topic }),
        })
          .then((r) => r.json())
          .then((res) => (res?.success ? { key: ex.en, data: res.data as WordAnnotation[] } : null))
          .catch(() => null)
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

        void fetch('/api/grammar/lessons', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lessonId: activeLesson.id, examples: updatedExamples }),
        }).catch(() => {
          console.warn('[Grammar] Failed to persist annotations to DB');
        });
      }

      setLoadingAnnotations(false);
    });
  }, [activeLesson?.id]);

  const lessonStatus = (lessonId: string): 'new' | 'learned' | 'due' => {
    const p = progressMap[lessonId];
    if (!p) return 'new';
    return new Date(p.next_review_date).getTime() <= Date.now() ? 'due' : 'learned';
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
              src={`/api/image-proxy?url=${encodeURIComponent(activeLesson.image_url)}`}
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
                {activeLesson.topic?.level === 'beginner' ? 'A1-A2' : activeLesson.topic?.level === 'intermediate' ? 'B1-B2' : 'C1-C2'}
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-2.5 py-1 rounded-full w-max mb-1.5 backdrop-blur-sm">
                📚 Ngữ Pháp • {activeLesson.topic?.level === 'beginner' ? 'Cơ bản' : activeLesson.topic?.level === 'intermediate' ? 'Trung cấp' : 'Nâng cao'}
              </span>
              <p className="text-xs text-white/80 font-medium tracking-wide">
                {activeLesson.topic?.title_vi || activeLesson.topic?.title}
              </p>
            </div>
          )}

          <div className="prose prose-slate max-w-none bg-background border rounded-2xl p-6 shadow-sm">
            <ReactMarkdown>
              {formatOcrTheory(activeLesson.theory_vi || activeLesson.theory || '*Chưa có nội dung lý thuyết.*')}
            </ReactMarkdown>
          </div>

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
                onClick={() => router.push(`/grammar?lesson=${activeLesson.id}`)}
                className="flex-1 bg-primary text-white font-bold py-3 rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                <Dumbbell className="h-4 w-4" /> Làm bài tập
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
                💡 Chỉ đọc lý thuyết thôi chưa đủ — làm bài tập để chứng minh bạn đã nắm vững.
              </p>
            )}
          </div>
        </article>
      </main>
    );
  }

  // ─── Topics roadmap view ───
  const now = Date.now();

  /** Sidebar: list topics với progress bar */
  const ProgressSidebar = () => (
    <nav className="space-y-1.5">
      {topicProgress.length === 0 && (
        <p className="text-xs text-muted-foreground px-1">Chưa có dữ liệu tiến độ.</p>
      )}
      {topicProgress.map((tp) => {
        const pct = tp.totalLessons > 0 ? Math.round((tp.masteredLessons / tp.totalLessons) * 100) : 0;
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
                {tp.masteredLessons}/{tp.totalLessons}
              </span>
            </div>
          </button>
        );
      })}
    </nav>
  );

  return (
    <main className="min-h-dvh bg-muted/40 font-sans">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur border-b h-14 flex items-center justify-between px-4 sm:px-6">
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

          {topics.map((topic) => {
            const lessons = lessonsByTopic[topic.id] || [];
            const isOpen = expandedTopic === topic.id;
            return (
              <div
                key={topic.id}
                ref={(el) => { topicRefs.current[topic.id] = el; }}
                className="bg-background border rounded-2xl shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => toggleTopic(topic.id)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="text-left">
                    <div className="font-bold text-slate-800">{topic.title_vi || topic.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {topic.title} · {topic.level}
                      {typeof topic.lessonCount === 'number' ? ` · ${topic.lessonCount} bài` : ''}
                    </div>
                  </div>
                  <ChevronDown
                    className={`h-5 w-5 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`}
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
                    {lessons.map((lesson) => {
                      const status = lessonStatus(lesson.id);
                      return (
                        <button
                          key={lesson.id}
                          onClick={() => setActiveLesson({ ...lesson, topic })}
                          className="w-full flex items-center justify-between px-5 py-3 hover:bg-primary/5 transition-colors text-left"
                        >
                          <span className="text-sm font-medium text-slate-700">{lesson.title}</span>
                          {status === 'learned' && (
                            <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Đã học
                            </span>
                          )}
                          {status === 'due' && (
                            <span className="text-xs text-amber-600 font-bold flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" /> Cần ôn
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
