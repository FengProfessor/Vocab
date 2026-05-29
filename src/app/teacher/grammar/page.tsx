'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import type { GrammarLesson, GrammarTopic, GrammarExample } from '@/lib/supabase';
import {
  Brain,
  ChevronLeft,
  Plus,
  Search,
  Save,
  Trash2,
  Loader2,
  BookOpen,
  X,
  ArrowUp,
  ArrowDown,
  Sparkles,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';

// Form state for the editor pane
interface LessonFormState {
  topic_id: string;
  title: string;
  theory_vi: string;
  examples: GrammarExample[];
}

const EMPTY_FORM: LessonFormState = {
  topic_id: '',
  title: '',
  theory_vi: '',
  examples: [],
};

export default function TeacherGrammarEditorPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);

  const [topics, setTopics] = useState<GrammarTopic[]>([]);
  const [lessons, setLessons] = useState<GrammarLesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [isNewLesson, setIsNewLesson] = useState(false);
  const [form, setForm] = useState<LessonFormState>(EMPTY_FORM);

  const [search, setSearch] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // New-example draft
  const [draftEn, setDraftEn] = useState('');
  const [draftVi, setDraftVi] = useState('');
  const [draftNote, setDraftNote] = useState('');

  // AI generator dialog
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiLevel, setAiLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleAiGenerate = async () => {
    if (!aiTopic.trim()) return;
    setIsGenerating(true);
    try {
      const res = await fetch('/api/grammar/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: aiTopic.trim(), level: aiLevel }),
      }).then((r) => r.json());
      if (!res.success) throw new Error(res.error || 'AI generation failed');
      setForm((prev) => ({
        ...prev,
        title: res.data.title,
        theory_vi: res.data.theory_vi,
        examples: res.data.examples,
      }));
      setAiDialogOpen(false);
      setAiTopic('');
      toast.success('AI đã tạo bài học! Kiểm tra và lưu khi sẵn sàng.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error('AI lỗi: ' + msg);
    } finally {
      setIsGenerating(false);
    }
  };

  // ---------- Auth + initial fetch ----------
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth');
        return;
      }
      setUserId(user.id);

      try {
        const [topicsRes, lessonsRes] = await Promise.all([
          fetch('/api/grammar/topics').then((r) => r.json()),
          fetch('/api/grammar/lessons').then((r) => r.json()),
        ]);
        if (topicsRes?.success) setTopics(topicsRes.data as GrammarTopic[]);
        if (lessonsRes?.success) setLessons(lessonsRes.data as GrammarLesson[]);
      } catch (err) {
        console.error('[GrammarEditor] load error:', err);
        toast.error('Không tải được dữ liệu bài học.');
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [router]);

  // ---------- Load lesson into form when selected ----------
  const loadLessonIntoForm = useCallback(
    async (lessonId: string) => {
      // Tìm trong cache trước
      const cached = lessons.find((l) => l.id === lessonId);
      if (cached) {
        setForm({
          topic_id: cached.topic_id,
          title: cached.title,
          theory_vi: cached.theory_vi ?? '',
          examples: Array.isArray(cached.examples) ? cached.examples : [],
        });
        return;
      }
      // Fallback: fetch chi tiết
      try {
        const res = await fetch(`/api/grammar/lessons?id=${lessonId}`).then((r) => r.json());
        if (res?.success && res.data) {
          const l = res.data as GrammarLesson;
          setForm({
            topic_id: l.topic_id,
            title: l.title,
            theory_vi: l.theory_vi ?? '',
            examples: Array.isArray(l.examples) ? l.examples : [],
          });
        }
      } catch (err) {
        console.error('[GrammarEditor] fetch lesson error:', err);
      }
    },
    [lessons]
  );

  const handleSelectLesson = (lessonId: string) => {
    setIsNewLesson(false);
    setSelectedLessonId(lessonId);
    void loadLessonIntoForm(lessonId);
  };

  const handleNewLesson = () => {
    setSelectedLessonId(null);
    setIsNewLesson(true);
    setForm({
      ...EMPTY_FORM,
      topic_id: topics[0]?.id ?? '',
    });
  };

  // ---------- Filter + group ----------
  const filteredLessons = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return lessons;
    return lessons.filter((l) => l.title.toLowerCase().includes(q));
  }, [lessons, search]);

  const groupedByTopic = useMemo(() => {
    const map = new Map<string, GrammarLesson[]>();
    for (const l of filteredLessons) {
      const arr = map.get(l.topic_id) ?? [];
      arr.push(l);
      map.set(l.topic_id, arr);
    }
    return map;
  }, [filteredLessons]);

  // ---------- Example builder ----------
  const handleAddExample = () => {
    const en = draftEn.trim();
    if (!en) {
      toast.error('Câu tiếng Anh không được để trống.');
      return;
    }
    const newExample: GrammarExample = {
      en,
      vi: draftVi.trim() || undefined,
      note: draftNote.trim() || undefined,
    };
    setForm((prev) => ({ ...prev, examples: [...prev.examples, newExample] }));
    setDraftEn('');
    setDraftVi('');
    setDraftNote('');
  };

  const handleRemoveExample = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      examples: prev.examples.filter((_, i) => i !== idx),
    }));
  };

  const handleMoveExample = (idx: number, dir: -1 | 1) => {
    setForm((prev) => {
      const next = [...prev.examples];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return { ...prev, examples: next };
    });
  };

  // ---------- Save ----------
  const handleSave = async () => {
    if (!form.topic_id) {
      toast.error('Hãy chọn chủ đề.');
      return;
    }
    if (!form.title.trim()) {
      toast.error('Tiêu đề bài học không được để trống.');
      return;
    }

    setIsSaving(true);
    try {
      if (isNewLesson) {
        const res = await fetch('/api/grammar/lessons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic_id: form.topic_id,
            title: form.title.trim(),
            theory_vi: form.theory_vi,
            examples: form.examples,
            source: 'manual',
            created_by: userId,
          }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Save failed');
        const created = data.data as GrammarLesson;
        setLessons((prev) => [...prev, created]);
        setIsNewLesson(false);
        setSelectedLessonId(created.id);
        toast.success('Đã tạo bài học mới!');
      } else if (selectedLessonId) {
        const res = await fetch('/api/grammar/lessons', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: selectedLessonId,
            topic_id: form.topic_id,
            title: form.title.trim(),
            theory_vi: form.theory_vi,
            examples: form.examples,
          }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Save failed');
        const updated = data.data as GrammarLesson;
        setLessons((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
        toast.success('Đã lưu thay đổi.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[GrammarEditor] save error:', err);
      toast.error('Lưu thất bại: ' + msg);
    } finally {
      setIsSaving(false);
    }
  };

  // ---------- Delete ----------
  const handleDelete = async () => {
    if (!selectedLessonId) return;
    if (!confirm('Xoá bài học này? Hành động không thể hoàn tác.')) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/grammar/lessons?id=${selectedLessonId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Delete failed');
      setLessons((prev) => prev.filter((l) => l.id !== selectedLessonId));
      setSelectedLessonId(null);
      setForm(EMPTY_FORM);
      toast.success('Đã xoá bài học.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[GrammarEditor] delete error:', err);
      toast.error('Xoá thất bại: ' + msg);
    } finally {
      setIsDeleting(false);
    }
  };

  // ---------- Render ----------
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/40">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isEditing = isNewLesson || selectedLessonId !== null;
  const topicById = (id: string): GrammarTopic | undefined => topics.find((t) => t.id === id);

  return (
    <div className="min-h-screen bg-muted/40 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-30 h-14 border-b bg-background/80 backdrop-blur px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/teacher"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Dashboard
          </Link>
          <span className="text-muted-foreground/40">/</span>
          <div className="flex items-center gap-2 font-bold">
            <div className="bg-primary/10 p-1.5 rounded-lg">
              <Brain className="h-4 w-4 text-primary" />
            </div>
            <span>Grammar Lessons Editor</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 max-w-[1400px] mx-auto">
        {/* ---------- Left panel: lesson list ---------- */}
        <aside className="lg:col-span-1 bg-background border rounded-2xl shadow-sm flex flex-col overflow-hidden h-[calc(100vh-7rem)]">
          <div className="p-4 border-b space-y-3">
            <button
              onClick={handleNewLesson}
              className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold rounded-xl py-2.5 text-sm hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Thêm lesson mới
            </button>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm bài học..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-muted/30 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
            {topics.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-6">
                Chưa có topic nào. Hãy tạo topic trước qua DB hoặc seed script.
              </p>
            )}
            {topics.map((topic) => {
              const topicLessons = groupedByTopic.get(topic.id) ?? [];
              if (search && topicLessons.length === 0) return null;
              return (
                <div key={topic.id}>
                  <div className="flex items-center gap-2 px-2 mb-1.5">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex-1 truncate">
                      {topic.title_vi || topic.title}
                    </p>
                    <span className="text-[10px] font-mono text-muted-foreground/60">
                      {topicLessons.length}
                    </span>
                  </div>
                  {topicLessons.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground/60 italic px-2">
                      (chưa có bài học)
                    </p>
                  ) : (
                    <ul className="space-y-1">
                      {topicLessons.map((lesson) => (
                        <li key={lesson.id}>
                          <button
                            onClick={() => handleSelectLesson(lesson.id)}
                            className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all ${
                              selectedLessonId === lesson.id
                                ? 'bg-primary/10 text-primary font-semibold'
                                : 'text-foreground/80 hover:bg-muted'
                            }`}
                          >
                            <BookOpen className="h-3.5 w-3.5 shrink-0" />
                            <span className="flex-1 truncate">{lesson.title}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        {/* ---------- Right panel: editor ---------- */}
        <section className="lg:col-span-2">
          {!isEditing ? (
            <div className="bg-background border rounded-2xl p-12 text-center shadow-sm h-full flex flex-col items-center justify-center">
              <FileText className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <h3 className="font-bold text-lg mb-2">Chưa chọn bài học</h3>
              <p className="text-muted-foreground text-sm max-w-md">
                Chọn một bài học từ danh sách bên trái, hoặc bấm{' '}
                <span className="font-semibold text-primary">Thêm lesson mới</span> để bắt đầu.
              </p>
            </div>
          ) : (
            <div className="bg-background border rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  {isNewLesson ? (
                    <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
                  ) : (
                    <BookOpen className="h-4 w-4 text-primary shrink-0" />
                  )}
                  <h2 className="font-bold truncate">
                    {isNewLesson ? 'Bài học mới' : form.title || '(chưa có tiêu đề)'}
                  </h2>
                  {!isNewLesson && form.topic_id && (
                    <span className="text-[10px] font-mono uppercase bg-muted text-muted-foreground rounded-md px-1.5 py-0.5 shrink-0">
                      {topicById(form.topic_id)?.title_vi ?? topicById(form.topic_id)?.title ?? '—'}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setAiDialogOpen(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl transition-colors"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Tạo bằng AI
                  </button>
                  {!isNewLesson && selectedLessonId && (
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10 px-3 py-2 rounded-xl transition-colors disabled:opacity-50"
                    >
                      {isDeleting ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                      Xoá
                    </button>
                  )}
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
                  >
                    {isSaving ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Save className="h-3.5 w-3.5" />
                    )}
                    {isNewLesson ? 'Tạo bài học' : 'Lưu thay đổi'}
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Topic selector */}
                <div>
                  <label className="text-sm font-semibold mb-1.5 block">Chủ đề (Topic)</label>
                  <select
                    value={form.topic_id}
                    onChange={(e) => setForm((prev) => ({ ...prev, topic_id: e.target.value }))}
                    className="w-full border rounded-xl px-4 py-2.5 text-sm bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="">-- Chọn chủ đề --</option>
                    {topics.map((t) => (
                      <option key={t.id} value={t.id}>
                        [{t.level}] {t.title_vi || t.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Title */}
                <div>
                  <label className="text-sm font-semibold mb-1.5 block">Tiêu đề bài học</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="VD: Thì hiện tại đơn — Cấu trúc và cách dùng"
                    className="w-full border rounded-xl px-4 py-2.5 text-sm bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                {/* Theory editor */}
                <div>
                  <label className="text-sm font-semibold mb-1.5 block">
                    Lý thuyết (tiếng Việt)
                  </label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Hỗ trợ Markdown cơ bản: <code>**bold**</code>, <code>*italic*</code>,{' '}
                    <code>- list</code>, <code>`code`</code>.
                  </p>
                  <textarea
                    value={form.theory_vi}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, theory_vi: e.target.value }))
                    }
                    placeholder="Nhập phần lý thuyết, có thể dùng Markdown..."
                    className="w-full border rounded-xl px-4 py-3 text-sm bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono leading-relaxed resize-y"
                    style={{ minHeight: '200px' }}
                  />
                </div>

                {/* Examples builder */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-semibold block">Ví dụ minh hoạ</label>
                    <span className="text-xs text-muted-foreground">
                      {form.examples.length} ví dụ
                    </span>
                  </div>

                  {form.examples.length > 0 && (
                    <ul className="space-y-2 mb-4">
                      {form.examples.map((ex, idx) => (
                        <li
                          key={idx}
                          className="bg-muted/40 border rounded-xl px-4 py-3 flex items-start gap-3"
                        >
                          <span className="text-[10px] font-mono font-bold bg-primary/10 text-primary rounded-md px-1.5 py-0.5 shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <div className="flex-1 min-w-0 space-y-0.5">
                            <p className="text-sm font-semibold break-words">{ex.en}</p>
                            {ex.vi && (
                              <p className="text-xs text-muted-foreground break-words">{ex.vi}</p>
                            )}
                            {ex.note && (
                              <p className="text-[11px] italic text-amber-700 dark:text-amber-400 break-words">
                                Ghi chú: {ex.note}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col gap-1 shrink-0">
                            <button
                              onClick={() => handleMoveExample(idx, -1)}
                              disabled={idx === 0}
                              className="p-1 rounded-md hover:bg-background text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                              title="Lên"
                            >
                              <ArrowUp className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleMoveExample(idx, 1)}
                              disabled={idx === form.examples.length - 1}
                              className="p-1 rounded-md hover:bg-background text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                              title="Xuống"
                            >
                              <ArrowDown className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <button
                            onClick={() => handleRemoveExample(idx)}
                            className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                            title="Xoá ví dụ"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Add example form */}
                  <div className="border-2 border-dashed rounded-xl p-4 space-y-2 bg-muted/20">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                      Thêm ví dụ mới
                    </p>
                    <input
                      type="text"
                      value={draftEn}
                      onChange={(e) => setDraftEn(e.target.value)}
                      placeholder="Câu tiếng Anh (bắt buộc)"
                      className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <input
                      type="text"
                      value={draftVi}
                      onChange={(e) => setDraftVi(e.target.value)}
                      placeholder="Bản dịch tiếng Việt (không bắt buộc)"
                      className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <input
                      type="text"
                      value={draftNote}
                      onChange={(e) => setDraftNote(e.target.value)}
                      placeholder="Ghi chú/giải thích (không bắt buộc)"
                      className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <button
                      onClick={handleAddExample}
                      className="w-full inline-flex items-center justify-center gap-1.5 bg-primary/10 text-primary hover:bg-primary/20 font-semibold text-sm rounded-lg py-2 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      Thêm
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* AI Generator Dialog */}
      {aiDialogOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setAiDialogOpen(false); }}
        >
          <div className="bg-background rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                Tạo bài học bằng AI
              </h3>
              <button onClick={() => setAiDialogOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-semibold mb-1.5 block">Chủ đề</label>
                <input
                  type="text"
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') void handleAiGenerate(); }}
                  placeholder="VD: Present Perfect, Modal verbs..."
                  className="w-full border rounded-xl px-4 py-2.5 text-sm bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-sm font-semibold mb-1.5 block">Cấp độ</label>
                <select
                  value={aiLevel}
                  onChange={(e) => setAiLevel(e.target.value as typeof aiLevel)}
                  className="w-full border rounded-xl px-4 py-2.5 text-sm bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="beginner">Cơ bản (A1-A2)</option>
                  <option value="intermediate">Trung cấp (B1-B2)</option>
                  <option value="advanced">Nâng cao (C1-C2)</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setAiDialogOpen(false)}
                className="flex-1 border font-semibold py-2.5 rounded-xl text-sm hover:bg-muted transition-colors"
              >
                Huỷ
              </button>
              <button
                onClick={() => void handleAiGenerate()}
                disabled={isGenerating || !aiTopic.trim()}
                className="flex-1 bg-amber-500 text-white font-semibold py-2.5 rounded-xl text-sm hover:bg-amber-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Đang tạo...</>
                ) : (
                  <><Sparkles className="h-4 w-4" /> Tạo ngay</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
