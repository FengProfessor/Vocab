'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { supabase } from '@/lib/supabase';
import type { GrammarTopic, GrammarLesson, GrammarProgress } from '@/lib/supabase';
import {
  ChevronLeft, ChevronDown, Loader2, GraduationCap, CheckCircle2, Clock, Dumbbell, BookOpen,
} from 'lucide-react';
import { toast } from 'sonner';

export default function GrammarLearnPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [topics, setTopics] = useState<GrammarTopic[]>([]);
  const [lessonsByTopic, setLessonsByTopic] = useState<Record<string, GrammarLesson[]>>({});
  const [progressMap, setProgressMap] = useState<Record<string, GrammarProgress>>({});
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);
  const [activeLesson, setActiveLesson] = useState<GrammarLesson | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingTopic, setLoadingTopic] = useState<string | null>(null);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const gp = await fetch(`/api/grammar/progress?userId=${user.id}`)
          .then((r) => r.json())
          .catch(() => null);
        if (gp?.success) {
          const map: Record<string, GrammarProgress> = {};
          for (const p of gp.data as GrammarProgress[]) map[p.lesson_id] = p;
          setProgressMap(map);
        }
      }
      const t = await fetch('/api/grammar/topics').then((r) => r.json()).catch(() => null);
      if (t?.success) setTopics(t.data);
      setIsLoading(false);
    };
    init();
  }, []);

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

  const markAsLearned = async () => {
    if (!activeLesson || !userId) {
      toast.error('Bạn cần đăng nhập để lưu tiến độ.');
      return;
    }
    setMarking(true);
    try {
      const res = await fetch('/api/grammar/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, lessonId: activeLesson.id, accuracy: 0.8 }),
      });
      const data = await res.json();
      if (data.success) {
        setProgressMap((prev) => ({ ...prev, [activeLesson.id]: data.data }));
        toast.success('Đã đánh dấu hoàn thành bài học! 🎉');
      } else {
        toast.error('Lỗi: ' + (data.error || 'không rõ'));
      }
    } finally {
      setMarking(false);
    }
  };

  const lessonStatus = (lessonId: string): 'new' | 'learned' | 'due' => {
    const p = progressMap[lessonId];
    if (!p) return 'new';
    return new Date(p.next_review_date).getTime() <= Date.now() ? 'due' : 'learned';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/40">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // ─── Lesson detail view ───
  if (activeLesson) {
    const status = lessonStatus(activeLesson.id);
    return (
      <div className="min-h-screen bg-muted/40 font-sans">
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

          {activeLesson.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/api/image-proxy?url=${encodeURIComponent(activeLesson.image_url)}`}
              alt={activeLesson.title}
              className="w-full max-h-64 object-cover rounded-2xl border"
            />
          )}

          <div className="prose prose-slate max-w-none bg-background border rounded-2xl p-6 shadow-sm">
            <ReactMarkdown>
              {activeLesson.theory_vi || activeLesson.theory || '*Chưa có nội dung lý thuyết.*'}
            </ReactMarkdown>
          </div>

          {activeLesson.examples?.length > 0 && (
            <div className="bg-background border rounded-2xl p-6 shadow-sm space-y-3">
              <h3 className="font-bold flex items-center gap-2 text-primary">
                <BookOpen className="h-4 w-4" /> Ví dụ
              </h3>
              {activeLesson.examples.map((ex, i) => (
                <div key={i} className="border-l-2 border-primary/30 pl-3">
                  <p className="text-sm font-semibold text-slate-800">{ex.en}</p>
                  {ex.vi && <p className="text-sm text-muted-foreground">{ex.vi}</p>}
                  {ex.note && <p className="text-xs text-amber-700 italic mt-0.5">{ex.note}</p>}
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
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
              {status === 'new' ? 'Đánh dấu đã học' : 'Ôn lại — hoàn thành'}
            </button>
          </div>
        </article>
      </div>
    );
  }

  // ─── Topics roadmap view ───
  return (
    <div className="min-h-screen bg-muted/40 font-sans">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur border-b h-14 flex items-center justify-between px-4 sm:px-6">
        <Link
          href="/student"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" /> Dashboard
        </Link>
        <div className="flex items-center gap-2 font-bold text-primary">
          <GraduationCap className="h-5 w-5" /> Bài giảng Ngữ pháp
        </div>
        <span className="w-16" />
      </header>

      <div className="max-w-2xl mx-auto p-4 sm:p-8 space-y-3">
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
            <div key={topic.id} className="bg-background border rounded-2xl shadow-sm overflow-hidden">
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
                        onClick={() => setActiveLesson(lesson)}
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
  );
}
