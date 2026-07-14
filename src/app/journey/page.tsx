'use client';

/**
 * Lß╗Ö tr├¼nh hß╗ìc 5 cß║Ñp A0ΓåÆB2 ΓÇö path map kiß╗âu Duolingo.
 * - Ch╞░a ghi danh: chß╗ìn ─æiß╗âm bß║»t ─æß║ºu (test 2 ph├║t HOß║╢C tß╗▒ chß╗ìn cß║Ñp).
 * - ─É├ú ghi danh: chuß╗ùi chß║╖ng tuß║ºn tß╗▒; step kh├│a tß╗¢i khi xong step tr╞░ß╗¢c.
 * - Xong chß║╖ng (checkpoint pass ß╗ƒ trang kh├íc) ΓåÆ sessionStorage flag ΓåÆ confetti ß╗ƒ ─æ├óy.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { authFetch } from '@/lib/auth-fetch';
import { fetchRoadmap, type RoadmapLevelView, type RoadmapStepView } from '@/lib/roadmap-client';
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
  vocab: 'Tß╗½ vß╗▒ng',
  grammar: 'Ngß╗» ph├íp',
  pronunciation: 'Ph├ít ├óm',
  checkpoint: 'Checkpoint',
  reading: '─Éß╗ìc hiß╗âu',
  cloze: 'Cloze',
  arrange: 'Sß║»p xß║┐p',
  announcement: 'Th├┤ng b├ío',
  leaflet: 'Tß╗¥ r╞íi',
  exam: '─Éß╗ü mini',
};

export default function JourneyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [enrolled, setEnrolled] = useState(false);
  const [tree, setTree] = useState<RoadmapLevelView[]>([]);
  const [levelId, setLevelId] = useState<string>('A0');
  const [busyStep, setBusyStep] = useState<string | null>(null);
  const [celebrate, setCelebrate] = useState<string | null>(null);

  // Placement state ΓÇö 'track' = m├án chß╗ìn CEFR/THPT ─æß║ºu ti├¬n
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
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Kh├┤ng tß║úi ─æ╞░ß╗úc lß╗Ö tr├¼nh');
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

  // Confetti khi vß╗½a v╞░ß╗út chß║╖ng/l├¬n cß║Ñp ß╗ƒ trang kh├íc (─æß╗ìc flag async ─æß╗â tr├ính setState sync trong effect)
  useEffect(() => {
    const timer = setTimeout(() => {
      const flag = sessionStorage.getItem('roadmap_celebrate');
      if (flag) {
        sessionStorage.removeItem('roadmap_celebrate');
        setCelebrate(flag);
        toast.success(flag === 'level' ? '≡ƒÅå L├¬n cß║Ñp! Cß║ú mß╗Öt chß║╖ng ─æ╞░ß╗¥ng ΓÇö tß╗▒ h├áo lß║»m ─æ├│!' : '≡ƒÄë V╞░ß╗út chß║╖ng! Chß║╖ng mß╗¢i ─æ├ú mß╗ƒ.');
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const startTest = async (): Promise<void> => {
    try {
      const res = await authFetch('/api/roadmap/placement');
      const json = await res.json() as { success: boolean; data?: { questions: PlacementQuestionView[] }; error?: string };
      if (!json.success || !json.data) throw new Error(json.error || 'Kh├┤ng tß║úi ─æ╞░ß╗úc b├ái test');
      setQuestions(json.data.questions);
      setQIndex(0);
      setAnswers({});
      setMode('test');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Lß╗ùi tß║úi b├ái test');
    }
  };

  const submitPlacement = async (body: { answers?: Record<string, string>; selfSelect?: string; track?: string }): Promise<void> => {
    setSubmitting(true);
    try {
      const res = await authFetch('/api/roadmap/placement', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const json = await res.json() as { success: boolean; data?: { levelId: string }; error?: string };
      if (!json.success || !json.data) throw new Error(json.error || 'Kh├┤ng xß║┐p ─æ╞░ß╗úc cß║Ñp');
      toast.success(`─Éiß╗âm bß║»t ─æß║ºu cß╗ºa bß║ín: cß║Ñp ${json.data.levelId}. Bß║»t ─æß║ºu th├┤i!`);
      setMode(null);
      setLoading(true);
      await load();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'C├│ lß╗ùi kß║┐t nß╗æi');
    } finally {
      setSubmitting(false);
    }
  };

  // Tß╗▒ ph├ít audio khi v├áo c├óu nghe trong placement
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
        toast.loading('─Éang chuß║⌐n bß╗ï g├│i tß╗½...', { id: 'journey-open' });
        const res = await authFetch('/api/import/packages', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ packId: step.ref }),
        });
        const data = await res.json() as { success?: boolean; classroomId?: string; wordIds?: string[]; error?: string };
        if (!res.ok || !data.success || !data.classroomId || !data.wordIds?.length) {
          throw new Error(data.error || 'Kh├┤ng mß╗ƒ ─æ╞░ß╗úc g├│i tß╗½');
        }
        // Enrich tr╞░ß╗¢c khi mß╗ƒ phi├¬n (tr├ính phi├¬n rß╗ùng) ΓÇö best-effort
        await authFetch('/api/words/refresh', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ classroomId: data.classroomId, wordIds: data.wordIds }),
        }).catch(() => null);
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
      toast.error(error instanceof Error ? error.message : 'C├│ lß╗ùi kß║┐t nß╗æi', { id: 'journey-open' });
    } finally {
      setBusyStep(null);
    }
  };

  const visibleTree = useMemo(() => {
    // Cß║Ñp bß║»t ─æß║ºu l├¬n ─æß║ºu; cß║Ñp thß║Ñp h╞ín (review) xß║┐p cuß╗æi, thu gß╗ìn
    const start = tree.filter((l) => !l.units.every((u) => u.steps.every((s) => s.status === 'review')));
    const review = tree.filter((l) => l.units.every((u) => u.steps.every((s) => s.status === 'review')));
    return { start, review };
  }, [tree]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">─Éang tß║úi lß╗Ö tr├¼nh...</div>;
  }

  // ΓöÇΓöÇ Ch╞░a ghi danh: chß╗ìn ─æiß╗âm bß║»t ─æß║ºu ΓöÇΓöÇ
  if (!enrolled) {
    if (mode === 'test') {
      const q = questions[qIndex];
      return (
        <div className="mx-auto max-w-xl p-6 space-y-6">
          <p className="text-sm text-muted-foreground">C├óu {qIndex + 1}/{questions.length} ┬╖ cß║Ñp {q.level}</p>
          <h1 className="text-xl font-bold">{q.prompt}</h1>
          {q.kind === 'listening' && q.audioWord && (
            <Button variant="outline" onClick={() => void playWordAudio(q.audioWord!, null, 0.9)}>
              <Volume2 className="w-4 h-4 mr-2" /> Nghe lß║íi
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
          <Button variant="ghost" size="sm" onClick={() => setMode('pick-intro')}><ArrowLeft className="w-4 h-4 mr-1" /> Quay lß║íi</Button>
        </div>
      );
    }
    if (mode === 'thpt-grade') {
      const grades = [
        { id: 'lop-10', label: 'Lß╗¢p 10', desc: 'Nß╗ün tß║úng: th├¼ c╞í bß║ún, bß╗ï ─æß╗Öng, ─æß╗ìc th├┤ng b├ío/b├ái ngß║»n.' },
        { id: 'lop-11', label: 'Lß╗¢p 11', desc: 'N├óng cao: th├¼ ho├án th├ánh, mß╗çnh ─æß╗ü quan hß╗ç, sß║»p xß║┐p ─æoß║ín/tß╗¥ r╞íi.' },
        { id: 'lop-12', label: 'Lß╗¢p 12 (Luyß╗çn thi)', desc: '─Éß╗º 6 dß║íng ─æß╗ü tß╗æt nghiß╗çp 2025 + ─æß╗ü mini tß╗òng hß╗úp.' },
      ];
      return (
        <div className="mx-auto max-w-xl p-6 space-y-4">
          <h1 className="text-2xl font-bold">Bß║ín hß╗ìc lß╗¢p mß║Ñy?</h1>
          <p className="text-muted-foreground">Lß╗Ö tr├¼nh luyß╗çn thi THPT theo ─æ├║ng ch╞░╞íng tr├¼nh + format ─æß╗ü 2025.</p>
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
          <Button variant="ghost" size="sm" onClick={() => setMode('track')}><ArrowLeft className="w-4 h-4 mr-1" /> Quay lß║íi</Button>
        </div>
      );
    }
    if (mode === 'pick') {
      const levels = [
        { id: 'A0', label: 'Mß║Ñt gß╗æc', desc: 'Bß║»t ─æß║ºu tß╗½ con sß╗æ 0 ΓÇö ch╞░a tß╗▒ tin c├óu n├áo.' },
        { id: 'A1', label: 'S╞í cß║Ñp 1', desc: 'Biß║┐t ch├áo hß╗Åi, c├óu ─æ╞ín giß║ún vß╗ü bß║ún th├ón.' },
        { id: 'A2', label: 'S╞í cß║Ñp 2', desc: 'Giao tiß║┐p t├¼nh huß╗æng quen: mua sß║»m, ─æi lß║íi.' },
        { id: 'B1', label: 'Trung cß║Ñp', desc: 'N├│i ─æ╞░ß╗úc ├╜ kiß║┐n, kß╗â chuyß╗çn, ─æß╗ìc b├ái trung b├¼nh.' },
        { id: 'B2', label: 'Trung cao', desc: 'Tß╗▒ tin tranh luß║¡n, h╞░ß╗¢ng tß╗¢i hß╗ìc thuß║¡t/luyß╗çn thi.' },
      ];
      return (
        <div className="mx-auto max-w-xl p-6 space-y-4">
          <h1 className="text-2xl font-bold">Bß║ín ─æang ß╗ƒ ─æ├óu?</h1>
          <p className="text-muted-foreground">Chß╗ìn cß║Ñp m├┤ tß║ú ─æ├║ng bß║ín nhß║Ñt ΓÇö c├│ thß╗â ─æß╗òi sau bß║Ñt cß╗⌐ l├║c n├áo.</p>
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
          <Button variant="ghost" size="sm" onClick={() => setMode('track')}><ArrowLeft className="w-4 h-4 mr-1" /> Quay lß║íi</Button>
        </div>
      );
    }
    if (mode === 'pick-intro') {
      return (
        <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center gap-6 p-6 text-center">
          <div className="text-6xl">≡ƒù║∩╕Å</div>
          <h1 className="text-3xl font-bold">Lß╗Ö tr├¼nh hß╗ìc cß╗ºa bß║ín</h1>
          <p className="text-muted-foreground">Hß╗ìc theo tß╗½ng chß║╖ng nhß╗Å: tß╗½ vß╗▒ng + ngß╗» ph├íp + ph├ít ├óm ─æi c├╣ng nhau, mß╗ƒ kh├│a dß║ºn tß╗½ dß╗à ─æß║┐n kh├│. Tr╞░ß╗¢c ti├¬n, m├¼nh cß║ºn biß║┐t bß║ín n├¬n bß║»t ─æß║ºu tß╗½ ─æ├óu.</p>
          <div className="grid w-full gap-3">
            <Button variant="chunky" size="lg" onClick={() => void startTest()}>ΓÜí Kiß╗âm tra tr├¼nh ─æß╗Ö (2 ph├║t)</Button>
            <Button variant="outline" size="lg" onClick={() => setMode('pick')}>T├┤i tß╗▒ chß╗ìn cß║Ñp</Button>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setMode('track')}><ArrowLeft className="w-4 h-4 mr-1" /> Quay lß║íi</Button>
        </div>
      );
    }
    // mode === 'track' (mß║╖c ─æß╗ïnh): chß╗ìn loß║íi lß╗Ö tr├¼nh
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center gap-6 p-6 text-center">
        <div className="text-6xl">≡ƒº¡</div>
        <h1 className="text-3xl font-bold">Bß║ín muß╗æn hß╗ìc theo h╞░ß╗¢ng n├áo?</h1>
        <p className="text-muted-foreground">Chß╗ìn lß╗Ö tr├¼nh ph├╣ hß╗úp mß╗Ñc ti├¬u ΓÇö c├│ thß╗â ─æß╗òi sau.</p>
        <div className="grid w-full gap-3">
          <Card className="cursor-pointer hover:border-primary transition-colors text-left" onClick={() => setMode('pick-intro')}>
            <CardContent className="p-4">
              <p className="font-bold">≡ƒî▒ Lß╗Ö tr├¼nh chuß║⌐n CEFR (A0 ΓåÆ B2)</p>
              <p className="text-sm text-muted-foreground">Hß╗ìc tß╗òng qu├ít tß╗½ mß║Ñt gß╗æc ─æß║┐n trung cao: tß╗½ vß╗▒ng + ngß╗» ph├íp + ph├ít ├óm giß╗ìng thß║¡t.</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:border-primary transition-colors text-left" onClick={() => setMode('thpt-grade')}>
            <CardContent className="p-4">
              <p className="font-bold">≡ƒÄô Luyß╗çn thi THPT (Lß╗¢p 10 ΓåÆ 12)</p>
              <p className="text-sm text-muted-foreground">B├ím ch╞░╞íng tr├¼nh + ─æß╗º 6 dß║íng ─æß╗ü tß╗æt nghiß╗çp 2025: ─æß╗ìc th├┤ng b├ío/tß╗¥ r╞íi, sß║»p xß║┐p ─æoß║ín, cloze, ─æß╗ìc hiß╗âu, ─æß╗ü mini.</p>
            </CardContent>
          </Card>
        </div>
        <Link href="/student" className="text-sm text-muted-foreground underline">Quay vß╗ü bß║úng ─æiß╗üu khiß╗ân</Link>
      </div>
    );
  }

  // ΓöÇΓöÇ Path map ΓöÇΓöÇ
  return (
    <StudentShell title="Lß╗Ö tr├¼nh">
      <div className="mx-auto max-w-2xl p-4 pb-24 space-y-8">
      <Celebration trigger={Boolean(celebrate)} triggerKey={celebrate ?? undefined} intensity={celebrate === 'level' ? 'epic' : 'light'} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Lß╗Ö tr├¼nh cß╗ºa bß║ín</h1>
          <p className="text-sm text-muted-foreground">{levelId.startsWith('lop-') ? `Luyß╗çn thi lß╗¢p ${levelId.replace('lop-', '')}` : `Bß║»t ─æß║ºu tß╗½ cß║Ñp ${levelId}`} ┬╖ xong chß║╖ng n├áo mß╗ƒ chß║╖ng ─æ├│</p>
        </div>
        <Link href="/student"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" /> Dashboard</Button></Link>
      </div>

      {visibleTree.start.map((level) => (
        <section key={level.id} className="space-y-4">
          <div className={`rounded-2xl bg-gradient-to-r ${LEVEL_COLORS[level.id] ?? 'from-slate-500 to-slate-600'} p-4 text-white`}>
            <p className="text-sm/none opacity-80">{level.id.startsWith('lop-') ? `Lß╗¢p ${level.id.replace('lop-', '')}` : `Cß║Ñp ${level.id}`}</p>
            <h2 className="text-xl font-bold">{level.titleVi}</h2>
            <p className="text-sm opacity-90">{level.description}</p>
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
      ))}

      {visibleTree.review.length > 0 && (
        <details className="rounded-xl border p-4">
          <summary className="cursor-pointer font-semibold text-muted-foreground">Cß║Ñp thß║Ñp h╞ín (├┤n tß╗▒ do)</summary>
          <div className="mt-3 space-y-2">
            {visibleTree.review.map((level) => (
              <div key={level.id} className="text-sm text-muted-foreground">
                <span className="font-medium">{level.id} ΓÇö {level.titleVi}</span>: {level.units.length} chß║╖ng, mß╗ƒ tß╗▒ do trong tab Th╞░ viß╗çn/Grammar.
              </div>
            ))}
          </div>
        </details>
      )}
      </div>
    </StudentShell>
  );
}
