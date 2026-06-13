'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { GrammarExercise, GrammarTopic, GrammarLesson, GrammarLevel } from '@/lib/supabase';
import { ChevronDown, Loader2, BookOpen, Trash2, BarChart3, Sparkles, GraduationCap } from 'lucide-react';
import { toast } from 'sonner';

interface GrammarPanelProps {
  classroomId: string;
}

/**
 * Grammar exercise management panel — embedded in the unified teacher dashboard.
 * Lifts the standalone /teacher/grammar page logic into a self-contained component.
 */
export default function GrammarPanel({ classroomId }: GrammarPanelProps) {
  const [exercises, setExercises] = useState<GrammarExercise[]>([]);
  const [topics, setTopics] = useState<GrammarTopic[]>([]);
  const [lessonsByTopic, setLessonsByTopic] = useState<Record<string, GrammarLesson[]>>({});
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);
  const [loadingTopic, setLoadingTopic] = useState<string | null>(null);
  const [generatingLesson, setGeneratingLesson] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [level, setLevel] = useState<GrammarLevel>('beginner');
  const [count, setCount] = useState(5);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const authHeaders = { Authorization: `Bearer ${session?.access_token ?? ''}` };
      const [exRes, topicRes] = await Promise.all([
        fetch(`/api/grammar?classroomId=${classroomId}`, { headers: authHeaders }).then((r) => r.json()).catch(() => null),
        fetch('/api/grammar/topics').then((r) => r.json()).catch(() => null),
      ]);
      if (exRes?.success) setExercises(exRes.data);
      if (topicRes?.success) setTopics(topicRes.data);
      setIsLoading(false);
    };
    if (classroomId) loadData();
  }, [classroomId]);

  const toggleTopic = async (topicId: string) => {
    if (expandedTopic === topicId) {
      setExpandedTopic(null);
      return;
    }
    setExpandedTopic(topicId);
    if (!lessonsByTopic[topicId]) {
      setLoadingTopic(topicId);
      const res = await fetch(`/api/grammar/lessons?topicId=${topicId}`).then((r) => r.json()).catch(() => null);
      if (res?.success) setLessonsByTopic((prev) => ({ ...prev, [topicId]: res.data }));
      setLoadingTopic(null);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    const topic = customTopic.trim() || selectedTopic;
    if (!topic) {
      toast.error('Vui lòng chọn hoặc nhập chủ đề.');
      return;
    }
    setIsGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/grammar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token ?? ''}` },
        body: JSON.stringify({ classroomId, topic, level, count }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setExercises([...data.data, ...exercises]);
      toast.success(`Đã sinh ${data.count} bài tập về "${topic}"! 🎉`);
      setCustomTopic('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      toast.error(`Lỗi: ${msg}`);
    }
    setIsGenerating(false);
  };

  const handleGenerateForLesson = async (lesson: GrammarLesson) => {
    setGeneratingLesson(lesson.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/grammar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token ?? ''}` },
        body: JSON.stringify({ classroomId, topic: lesson.title, level, count, lessonId: lesson.id }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setExercises([...data.data, ...exercises]);
      toast.success(`Đã sinh ${data.count} bài tập cho bài "${lesson.title}"! 🎉`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      toast.error(`Lỗi: ${msg}`);
    }
    setGeneratingLesson(null);
  };

  const handleDelete = async (id: string) => {
    await supabase.from('grammar_exercises').delete().eq('id', id);
    setExercises(exercises.filter((e) => e.id !== id));
    toast.success('Đã xóa bài tập.');
  };

  if (isLoading)
    return (
      <div className="py-16 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );

  const groupedByTopic = exercises.reduce((acc, ex) => {
    if (!acc[ex.topic]) acc[ex.topic] = [];
    acc[ex.topic].push(ex);
    return acc;
  }, {} as Record<string, GrammarExercise[]>);

  return (
    <div className="space-y-6">
      {/* Generate form */}
      <div className="bg-background border rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-primary/10 p-2 rounded-xl">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-bold">Sinh bài tập mới</h2>
            <p className="text-xs text-muted-foreground">AI tạo bài tập ngữ pháp cho học sinh.</p>
          </div>
        </div>
        <form onSubmit={handleGenerate} className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-2">Chọn chủ đề:</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {topics.map((t) => (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => {
                    setSelectedTopic(t.title);
                    setCustomTopic('');
                  }}
                  className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                    selectedTopic === t.title && !customTopic
                      ? 'bg-primary text-white border-primary'
                      : 'border-muted-foreground/20 hover:border-primary/40 text-muted-foreground'
                  }`}
                >
                  {t.title}
                </button>
              ))}
              {topics.length === 0 && (
                <span className="text-xs text-muted-foreground italic">
                  Chưa có chủ đề — nhập chủ đề tùy ý bên dưới hoặc import bài giảng trước.
                </span>
              )}
            </div>
            <input
              type="text"
              value={customTopic}
              onChange={(e) => {
                setCustomTopic(e.target.value);
                setSelectedTopic('');
              }}
              placeholder="hoặc nhập chủ đề tùy ý..."
              className="w-full border rounded-xl px-4 py-2 text-sm bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Cấp độ</label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as GrammarLevel)}
                className="w-full border rounded-xl px-4 py-2 text-sm bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="beginner">Beginner (A1-A2)</option>
                <option value="intermediate">Intermediate (B1-B2)</option>
                <option value="advanced">Advanced (C1-C2)</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Số câu hỏi</label>
              <select
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="w-full border rounded-xl px-4 py-2 text-sm bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {[3, 5, 7, 10].map((n) => (
                  <option key={n} value={n}>{n} câu</option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={isGenerating || (!selectedTopic && !customTopic)}
            className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {isGenerating ? 'Đang sinh...' : 'Sinh bằng AI'}
          </button>
        </form>
      </div>

      {/* Bài giảng theo chủ đề — sinh bài tập gắn với lesson (1 chạm) */}
      <div className="bg-background border rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-primary" />
          <h3 className="font-bold">Bài giảng Ngữ pháp</h3>
          <span className="text-xs text-muted-foreground ml-auto">Sinh bài tập gắn trực tiếp với từng bài học</span>
        </div>
        {topics.length === 0 && (
          <div className="px-5 py-6 text-sm text-muted-foreground text-center">
            Chưa có bài giảng. Import nội dung qua <code>scripts/scrapers/run-grammar.ts</code>.
          </div>
        )}
        <div className="divide-y">
          {topics.map((topic) => {
            const lessons = lessonsByTopic[topic.id] || [];
            const isOpen = expandedTopic === topic.id;
            return (
              <div key={topic.id}>
                <button
                  onClick={() => toggleTopic(topic.id)}
                  className="w-full flex items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors"
                >
                  <span className="font-semibold text-sm">
                    {topic.title_vi || topic.title}
                    <span className="text-xs text-muted-foreground ml-2">{topic.title} · {topic.level}</span>
                  </span>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                  <div className="bg-muted/20 px-5 py-2 divide-y divide-muted">
                    {loadingTopic === topic.id && (
                      <div className="py-3 flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" /> Đang tải...
                      </div>
                    )}
                    {loadingTopic !== topic.id && lessons.length === 0 && (
                      <div className="py-3 text-sm text-muted-foreground">Chưa có bài học.</div>
                    )}
                    {lessons.map((lesson) => (
                      <div key={lesson.id} className="flex items-center gap-3 py-2.5">
                        <span className="text-sm flex-1 min-w-0 truncate">{lesson.title}</span>
                        <button
                          onClick={() => handleGenerateForLesson(lesson)}
                          disabled={generatingLesson === lesson.id}
                          className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-colors flex items-center gap-1.5 disabled:opacity-50 shrink-0"
                        >
                          {generatingLesson === lesson.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Sparkles className="h-3 w-3" />
                          )}
                          Sinh bài tập
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Exercise list by topic */}
      {Object.entries(groupedByTopic).map(([topic, exs]) => (
        <div key={topic} className="bg-background border rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <h3 className="font-bold">{topic}</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">{exs[0]?.level}</span>
              <span className="text-xs text-muted-foreground">{exs.length} câu</span>
            </div>
          </div>
          <div className="divide-y">
            {exs.map((ex, i) => (
              <div key={ex.id} className="flex items-start gap-4 px-5 py-3 hover:bg-muted/20 group transition-colors">
                <span className="text-xs font-bold text-muted-foreground mt-1 w-5 shrink-0">{i + 1}.</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm leading-relaxed">{ex.question}</p>
                  <p className="text-xs text-emerald-600 font-semibold mt-1">✓ {ex.correct_answer}</p>
                </div>
                <button
                  onClick={() => handleDelete(ex.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-muted-foreground hover:text-destructive rounded-lg"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {exercises.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p className="font-semibold">Chưa có bài tập nào.</p>
          <p className="text-sm">Sinh bài tập ngữ pháp đầu tiên ở trên.</p>
        </div>
      )}
    </div>
  );
}
