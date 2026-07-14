'use client';

/**
 * Lộ trình học 5 cấp A0→B2 — path map kiểu Duolingo.
 * - Chưa ghi danh: chọn điểm bắt đầu (test 2 phút HOẶC tự chọn cấp).
 * - Đã ghi danh: chuỗi chặng tuần tự; step khóa tới khi xong step trước.
 * - Xong chặng (checkpoint pass ở trang khác) → sessionStorage flag → confetti ở đây.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { authFetch } from '@/lib/auth-fetch';
import { fetchRoadmap, type RoadmapLevelView, type RoadmapStepView } from '@/lib/roadmap-client';
import { getExitDisclaimer, getExitStandard } from '@/lib/roadmap';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Celebration } from '@/components/gamification/Celebration';
import { ArrowLeft, BookOpen, CheckCircle2, Flag, GraduationCap, Headphones, Lock, Sparkles, Star, Volume2 } from 'lucide-react';
import { playWordAudio } from '@/lib/audio';
import Link from 'next/link';
import { StudentShell } from '@/components/student/StudentShell';

interface PlacementQuestionView { id: string; level: string; kind: string; prompt: string; options: string[]; audioWord?: string }

const LEVEL_COLORS: Record<string, string> = {
  A0: 'from-emerald-500 to-teal-500',
  A1: 'from-sky-500 to-blue-500',
  A2: 'from-indigo-500 to-violet-500',
  B1: 'from-amber-500 to-orange-500',
  B2: 'from-rose-500 to-pink-500',
  'lop-10': 'from-red-400 to-orange-500',
  'lop-11': 'from-red-500 to-rose-500',
  'lop-12': 'from-red-600 to-pink-600',
};

const STEP_ICON: Record<string, typeof Sparkles> = {
  vocab: Sparkles,
  grammar: GraduationCap,
  pronunciation: Headphones,
  checkpoint: Flag,
  reading: BookOpen,
  cloze: BookOpen,
  arrange: BookOpen,
  announcement: BookOpen,
  leaflet: BookOpen,
  exam: Flag,
};

const STEP_LABEL: Record<string, string> = {
  vocab: 'Từ vựng',
  grammar: 'Ngữ pháp',
  pronunciation: 'Phát âm',
  checkpoint: 'Checkpoint',
  reading: 'Đọc hiểu',
  cloze: 'Cloze',
  arrange: 'Sắp xếp',
  announcement: 'Thông báo',
  leaflet: 'Tờ rơi',
  exam: 'Đề mini',
};

export default function JourneyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [enrolled, setEnrolled] = useState(false);
  const [tree, setTree] = useState<RoadmapLevelView[]>([]);
  const [levelId, setLevelId] = useState<string>('A0');
  const [track, setTrack] = useState<'cefr' | 'thpt'>('cefr');
  const [busyStep, setBusyStep] = useState<string | null>(null);
  const [celebrate, setCelebrate] = useState<string | null>(null);

  // Placement state — 'track' = màn chọn CEFR/THPT đầu tiên
  const [mode, setMode] = useState<'track' | 'pick-intro' | 'pick' | 'test' | 'thpt-grade' | null>('track');
  const [questions, setQuestions] = useState<PlacementQuestionView[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async (): Promise<void> => {
    try {
      const data = await fetchRoadmap();
      setEnrolled(data.enrolled);
      if (data.enrolled && data.tree) {
        setTree(data.tree);
        setLevelId(data.levelId ?? 'A0');
        setTrack(data.track === 'thpt' ? 'thpt' : 'cefr');
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Không tải được lộ trình');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { router.push('/auth'); return; }
      if (active) await load();
    })();
    return () => { active = false; };
  }, [router, load]);

  // Confetti khi vừa vượt chặng/lên cấp ở trang khác (đọc flag async để tránh setState sync trong effect)
  useEffect(() => {
    const timer = setTimeout(() => {
      const flag = sessionStorage.getItem('roadmap_celebrate');
      if (flag) {
        sessionStorage.removeItem('roadmap_celebrate');
        setCelebrate(flag);
        toast.success(flag === 'level' ? '🏆 Lên cấp! Cả một chặng đường — tự hào lắm đó!' : '🎉 Vượt chặng! Chặng mới đã mở.');
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const startTest = async (): Promise<void> => {
    try {
      const res = await authFetch('/api/roadmap/placement');
      const json = await res.json() as { success: boolean; data?: { questions: PlacementQuestionView[] }; error?: string };
      if (!json.success || !json.data) throw new Error(json.error || 'Không tải được bài test');
      setQuestions(json.data.questions);
      setQIndex(0);
      setAnswers({});
      setMode('test');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Lỗi tải bài test');
    }
  };

  const submitPlacement = async (body: { answers?: Record<string, string>; selfSelect?: string; track?: string }): Promise<void> => {
    setSubmitting(true);
    try {
      const res = await authFetch('/api/roadmap/placement', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const json = await res.json() as { success: boolean; data?: { levelId: string }; error?: string };
      if (!json.success || !json.data) throw new Error(json.error || 'Không xếp được cấp');
      toast.success(`Điểm bắt đầu của bạn: cấp ${json.data.levelId}. Bắt đầu thôi!`);
      setMode(null);
      setLoading(true);
      await load();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Có lỗi kết nối');
    } finally {
      setSubmitting(false);
    }
  };

  // Tự phát audio khi vào câu nghe trong placement
  useEffect(() => {
    if (mode !== 'test') return;
    const q = questions[qIndex];
    if (q?.kind === 'listening' && q.audioWord) void playWordAudio(q.audioWord, null, 0.9);
  }, [mode, qIndex, questions]);

  const answerQuestion = (qid: string, choice: string): void => {
    const next = { ...answers, [qid]: choice };
    setAnswers(next);
    if (qIndex + 1 < questions.length) setQIndex(qIndex + 1);
    else void submitPlacement({ answers: next });
  };

  const openStep = async (step: RoadmapStepView): Promise<void> => {
    if (step.status === 'locked' || busyStep) return;
    setBusyStep(step.id);
    try {
      const THPT_TYPES = ['reading', 'cloze', 'arrange', 'announcement', 'leaflet', 'exam'];
      if (step.type === 'vocab') {
        toast.loading('Đang chuẩn bị gói từ...', { id: 'journey-open' });
        const res = await authFetch('/api/import/packages', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ packId: step.ref }),
        });
        const data = await res.json() as { success?: boolean; classroomId?: string; wordIds?: string[]; error?: string };
        if (!res.ok || !data.success || !data.classroomId || !data.wordIds?.length) {
          throw new Error(data.error || 'Không mở được gói từ — gói có thể đã gỡ khỏi danh mục. Thử bước khác hoặc báo admin.');
        }
        // Enrich trước khi mở phiên (tránh phiên rỗng vì translation ⏳) — best-effort, timeout 8s
        const refreshCtrl = new AbortController();
        const refreshTimer = setTimeout(() => refreshCtrl.abort(), 8000);
        try {
          await authFetch('/api/words/refresh', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ classroomId: data.classroomId, wordIds: data.wordIds }),
            signal: refreshCtrl.signal,
          });
        } catch {
          // Vẫn mở phiên — LearnMode có fallback load theo ids
        } finally {
          clearTimeout(refreshTimer);
        }
        toast.dismiss('journey-open');
        const ids = data.wordIds.map((id) => encodeURIComponent(id)).join(',');
        router.push(`/flashcard?class=${encodeURIComponent(data.classroomId)}&mode=learn&ids=${ids}&roadmapStep=${step.id}`);
      } else if (step.type === 'grammar') {
        router.push(`/grammar/learn?topic=${encodeURIComponent(step.ref)}&roadmapStep=${step.id}`);
      } else if (step.type === 'pronunciation') {
        router.push(`/pronunciation/${encodeURIComponent(step.ref)}?roadmapStep=${step.id}`);
      } else if (THPT_TYPES.includes(step.type)) {
        router.push(`/thpt/${step.type}/${encodeURIComponent(step.ref)}?roadmapStep=${step.id}`);
      } else {
        router.push(`/journey/checkpoint/${encodeURIComponent(step.ref)}?roadmapStep=${step.id}`);
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Có lỗi kết nối', { id: 'journey-open' });
    } finally {
      setBusyStep(null);
    }
  };

  const visibleTree = useMemo(() => {
    // Cấp bắt đầu lên đầu; cấp thấp hơn (review) xếp cuối, thu gọn
    const start = tree.filter((l) => !l.units.every((u) => u.steps.every((s) => s.status === 'review')));
    const review = tree.filter((l) => l.units.every((u) => u.steps.every((s) => s.status === 'review')));
    return { start, review };
  }, [tree]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Đang tải lộ trình...</div>;
  }

  // ── Chưa ghi danh: chọn điểm bắt đầu ──
  if (!enrolled) {
    if (mode === 'test') {
      const q = questions[qIndex];
      return (
        <div className="mx-auto max-w-xl p-6 space-y-6">
          <p className="text-sm text-muted-foreground">Câu {qIndex + 1}/{questions.length} · cấp {q.level}</p>
          <h1 className="text-xl font-bold">{q.prompt}</h1>
          {q.kind === 'listening' && q.audioWord && (
            <Button variant="outline" onClick={() => void playWordAudio(q.audioWord!, null, 0.9)}>
              <Volume2 className="w-4 h-4 mr-2" /> Nghe lại
            </Button>
          )}
          <div className="grid gap-3">
            {q.options.map((opt) => (
              <Button key={opt} variant="outline" className="justify-start h-auto py-3 text-base" disabled={submitting}
                onClick={() => answerQuestion(q.id, opt)}>
                {opt}
              </Button>
            ))}
          </div>
          <Button variant="ghost" size="sm" onClick={() => setMode('pick-intro')}><ArrowLeft className="w-4 h-4 mr-1" /> Quay lại</Button>
        </div>
      );
    }
    if (mode === 'thpt-grade') {
      const grades = [
        { id: 'lop-10', label: 'Grade 10 · Global Success', desc: '10 SGK units: Family Life → Ecotourism · catalog vocab + CEFR grammar.' },
        { id: 'lop-11', label: 'Grade 11 · Global Success', desc: '10 catalog units · participle, cleft, exam skills.' },
        { id: 'lop-12', label: 'Grade 12 · Global Success + exam 2025', desc: '7 catalog units + 2025 exam-format skills.' },
      ];
      return (
        <div className="mx-auto max-w-xl p-6 space-y-4">
          <h1 className="text-2xl font-bold">Bạn học lớp mấy?</h1>
          <p className="text-muted-foreground">
            Hybrid: <b>thứ tự unit theo SGK</b>, bài ngữ pháp = kho CEFR (cùng app). Chưa thay thế lộ trình A0–B2 đầy đủ.
          </p>
          <div className="grid gap-3">
            {grades.map((g) => (
              <Card key={g.id} className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => !submitting && void submitPlacement({ track: 'thpt', selfSelect: g.id })}>
                <CardContent className="flex items-center gap-4 p-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-orange-500 text-white font-bold text-sm">{g.id.replace('lop-', '')}</span>
                  <div>
                    <p className="font-semibold">{g.label}</p>
                    <p className="text-sm text-muted-foreground">{g.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Button variant="ghost" size="sm" onClick={() => setMode('track')}><ArrowLeft className="w-4 h-4 mr-1" /> Quay lại</Button>
        </div>
      );
    }
    if (mode === 'pick') {
      const levels = [
        { id: 'A0', label: 'Mất gốc', desc: 'Bắt đầu từ con số 0 — chưa tự tin câu nào.' },
        { id: 'A1', label: 'Sơ cấp 1', desc: 'Biết chào hỏi, câu đơn giản về bản thân.' },
        { id: 'A2', label: 'Sơ cấp 2', desc: 'Giao tiếp tình huống quen: mua sắm, đi lại.' },
        { id: 'B1', label: 'Trung cấp', desc: 'Nói được ý kiến, kể chuyện, đọc bài trung bình.' },
        { id: 'B2', label: 'Trung cao', desc: 'Tự tin tranh luận, hướng tới học thuật/luyện thi.' },
      ];
      return (
        <div className="mx-auto max-w-xl p-6 space-y-4">
          <h1 className="text-2xl font-bold">Bạn đang ở đâu?</h1>
          <p className="text-muted-foreground">Chọn cấp mô tả đúng bạn nhất — có thể đổi sau bất cứ lúc nào.</p>
          <div className="grid gap-3">
            {levels.map((l) => (
              <Card key={l.id} className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => !submitting && void submitPlacement({ selfSelect: l.id })}>
                <CardContent className="flex items-center gap-4 p-4">
                  <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${LEVEL_COLORS[l.id]} text-white font-bold`}>{l.id}</span>
                  <div>
                    <p className="font-semibold">{l.label}</p>
                    <p className="text-sm text-muted-foreground">{l.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Button variant="ghost" size="sm" onClick={() => setMode('track')}><ArrowLeft className="w-4 h-4 mr-1" /> Quay lại</Button>
        </div>
      );
    }
    if (mode === 'pick-intro') {
      return (
        <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center gap-6 p-6 text-center">
          <div className="text-6xl">🗺️</div>
          <h1 className="text-3xl font-bold">Lộ trình học của bạn</h1>
          <p className="text-muted-foreground">Học theo từng chặng nhỏ: từ vựng + ngữ pháp + phát âm đi cùng nhau, mở khóa dần từ dễ đến khó. Trước tiên, mình cần biết bạn nên bắt đầu từ đâu.</p>
          <div className="grid w-full gap-3">
            <Button variant="chunky" size="lg" onClick={() => void startTest()}>⚡ Kiểm tra trình độ (~4 phút · 35 câu)</Button>
            <Button variant="outline" size="lg" onClick={() => setMode('pick')}>Tôi tự chọn cấp</Button>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setMode('track')}><ArrowLeft className="w-4 h-4 mr-1" /> Quay lại</Button>
        </div>
      );
    }
    // mode === 'track' (mặc định): chọn loại lộ trình
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center gap-6 p-6 text-center">
        <div className="text-6xl">🧭</div>
        <h1 className="text-3xl font-bold">Bạn muốn học theo hướng nào?</h1>
        <p className="text-muted-foreground">Chọn lộ trình phù hợp mục tiêu — có thể đổi sau.</p>
        <div className="grid w-full gap-3">
          <Card className="cursor-pointer hover:border-primary transition-colors text-left" onClick={() => setMode('pick-intro')}>
            <CardContent className="p-4">
              <p className="font-bold">🌱 Lộ trình chuẩn CEFR (A0 → B2)</p>
              <p className="text-sm text-muted-foreground">Học tổng quát từ mất gốc đến trung cao: từ vựng + ngữ pháp + phát âm giọng thật.</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:border-primary transition-colors text-left" onClick={() => setMode('thpt-grade')}>
            <CardContent className="p-4">
              <p className="font-bold">🎓 THPT · Global Success (Lớp 10 → 12)</p>
              <p className="text-sm text-muted-foreground">
                Bám đúng unit SGK (từ vựng trong kho) · ngữ pháp sâu theo bài CEFR · rải dạng đề tốt nghiệp 2025.
                Nền tảng đầy đủ A0–B2 vẫn học song song ở lộ trình CEFR.
              </p>
            </CardContent>
          </Card>
        </div>
        <Link href="/student" className="text-sm text-muted-foreground underline">Quay về bảng điều khiển</Link>
      </div>
    );
  }

  // ── Path map ──
  return (
    <StudentShell title="Lộ trình">
      <div className="mx-auto max-w-2xl p-4 pb-24 space-y-8">
      <Celebration trigger={Boolean(celebrate)} triggerKey={celebrate ?? undefined} intensity={celebrate === 'level' ? 'epic' : 'light'} />
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Lộ trình của bạn</h1>
          <p className="text-sm text-muted-foreground">
            {track === 'thpt' || levelId.startsWith('lop-')
              ? `Global Success lớp ${levelId.replace('lop-', '')} · vocab SGK + ngữ pháp CEFR · dạng đề 2025`
              : `Core ${levelId} · scaffold có chủ đích, chưa phải chứng chỉ CEFR`}
            {' · '}xong chặng mở chặng
          </p>
        </div>
        <Link href="/student"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" /> Dashboard</Button></Link>
      </div>

      {track === 'thpt' || levelId.startsWith('lop-') ? (
        <p className="rounded-xl border border-sky-200/80 bg-sky-50/80 px-3 py-2 text-xs text-sky-950 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-100">
          <b>Hybrid THPT:</b> mỗi Unit = từ vựng Global Success (kho catalog) + bài ngữ pháp CEFR (cùng FSRS với track A0–B2).
          Muốn nền tảng đủ 5 cấp CEFR → đổi sang lộ trình CEFR (chọn lại điểm bắt đầu).
        </p>
      ) : (
        <p className="rounded-xl border border-amber-200/80 bg-amber-50/80 px-3 py-2 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
          {getExitDisclaimer()}
        </p>
      )}

      {(() => {
        const current = tree.flatMap((l) => l.units.flatMap((u) => u.steps)).find((s) => s.status === 'current');
        if (!current) return null;
        return (
          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">Bước đang mở</p>
                <p className="font-bold">{STEP_LABEL[current.type] ?? current.type}: {current.title}</p>
              </div>
              <Button variant="chunky" disabled={busyStep !== null} onClick={() => void openStep(current)}>
                {busyStep === current.id ? 'Đang mở...' : 'Học ngay →'}
              </Button>
            </CardContent>
          </Card>
        );
      })()}

      {visibleTree.start.map((level) => {
        const exit = !level.id.startsWith('lop-') ? getExitStandard(level.id) : null;
        return (
        <section key={level.id} className="space-y-4">
          <div className={`rounded-2xl bg-gradient-to-r ${LEVEL_COLORS[level.id] ?? 'from-slate-500 to-slate-600'} p-4 text-white`}>
            <p className="text-sm/none opacity-80">{level.id.startsWith('lop-') ? `Lớp ${level.id.replace('lop-', '')}` : `Core ${level.id}`}</p>
            <h2 className="text-xl font-bold">{level.titleVi}</h2>
            <p className="text-sm opacity-90">{level.description}</p>
            {exit && (
              <details className="mt-2 rounded-lg bg-black/15 p-2 text-sm">
                <summary className="cursor-pointer font-semibold">Bạn sẽ làm được gì? (can-do)</summary>
                <ul className="mt-2 list-disc space-y-1 pl-5 opacity-95">
                  {exit.canDo.map((line) => <li key={line}>{line}</li>)}
                </ul>
                <p className="mt-2 text-xs opacity-80">Chưa gồm: {exit.notYet.join(' · ')}</p>
              </details>
            )}
          </div>
          <div className="space-y-3">
            {level.units.map((unit) => {
              const done = unit.steps.every((s) => s.status === 'completed');
              const hasCurrent = unit.steps.some((s) => s.status === 'current');
              const locked = !done && !hasCurrent && unit.steps.every((s) => s.status === 'locked');
              return (
                <Card key={unit.id} className={locked ? 'opacity-50' : done ? 'border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20' : 'border-primary/40'}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{unit.title}</p>
                      {done ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : locked ? <Lock className="w-4 h-4 text-muted-foreground" /> : <Star className="w-5 h-5 text-amber-400" />}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {unit.steps.map((step) => {
                        const Icon = STEP_ICON[step.type] ?? BookOpen;
                        const isLocked = step.status === 'locked';
                        const isDone = step.status === 'completed';
                        return (
                          <button key={step.id} disabled={isLocked || busyStep !== null}
                            onClick={() => void openStep(step)}
                            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                              isDone ? 'border-emerald-300 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                              : isLocked ? 'border-border text-muted-foreground cursor-not-allowed'
                              : 'border-primary bg-primary/10 text-primary font-medium hover:bg-primary/20'
                            }`}
                            title={`${STEP_LABEL[step.type]}: ${step.title}`}>
                            {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : isLocked ? <Lock className="w-3 h-3" /> : <Icon className="w-3.5 h-3.5" />}
                            <span className="max-w-[160px] truncate">{step.title}</span>
                          </button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
        );
      })}

      {visibleTree.review.length > 0 && (
        <details className="rounded-xl border p-4">
          <summary className="cursor-pointer font-semibold text-muted-foreground">Cấp thấp hơn (ôn tự do)</summary>
          <div className="mt-3 space-y-2">
            {visibleTree.review.map((level) => (
              <div key={level.id} className="text-sm text-muted-foreground">
                <span className="font-medium">{level.id} — {level.titleVi}</span>: {level.units.length} chặng, mở tự do trong tab Thư viện/Grammar.
              </div>
            ))}
          </div>
        </details>
      )}
      </div>
    </StudentShell>
  );
}
