'use client';

/**
 * Lộ trình học (Learning Journey / Roadmap) — Giao diện Module Cards Hiện Đại & Đa Track.
 * - Hỗ trợ song song 2 track: CEFR (A0→B2) và THPT (Lớp 10/11/12).
 * - Module Cards tương tác cao, định hình thời gian (~45-60m chặng, ~10-15m bước).
 * - Mục tiêu đầu ra (can-do skills), xem trước nội dung (topicPreview).
 * - Đồng bộ tiến độ 2 chiều và mở khóa tuyến tính khoa học.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { authFetch } from '@/lib/auth-fetch';
import {
  fetchRoadmap,
  getExitDisclaimer,
  getExitStandard,
  type RoadmapEnrollmentView,
  type RoadmapLevelView,
  type RoadmapStepView,
  type RoadmapUnitView,
  type RoadmapTrackId,
} from '@/lib/roadmap-client';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import type { MilestonePopupPayload } from '@/components/gamification/MilestonePopup';
import {
  ArrowLeft,
  Volume2,
  Play,
  Award,
  Target,
  ChevronRight,
  Layers,
  Flame,
  Sparkles,
} from 'lucide-react';
import { playWordAudio } from '@/lib/audio';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { StudentShell } from '@/components/student/StudentShell';
import { TrackSwitcher, type TrackStats } from '@/components/journey/TrackSwitcher';
import { ModuleCard } from '@/components/journey/ModuleCard';
import { NodePreviewModal } from '@/components/journey/NodePreviewModal';
import { UnitBadgeModal } from '@/components/journey/UnitBadgeModal';
import { VocabRoadmapSection } from '@/components/journey/VocabRoadmapSection';

const MilestonePopup = dynamic(
  () => import('@/components/gamification/MilestonePopup').then((m) => m.MilestonePopup),
  { ssr: false },
);

interface PlacementQuestionView {
  id: string;
  level: string;
  kind: string;
  prompt: string;
  options: string[];
  audioWord?: string;
}

const LEVEL_COLORS: Record<string, string> = {
  A0: 'from-emerald-500 to-teal-600',
  A1: 'from-sky-500 to-blue-600',
  A2: 'from-indigo-500 to-violet-600',
  B1: 'from-amber-500 to-orange-600',
  B2: 'from-rose-500 to-pink-600',
  'lop-10': 'from-red-500 to-orange-600',
  'lop-11': 'from-red-600 to-rose-600',
  'lop-12': 'from-red-700 to-pink-600',
  'toeic-450': 'from-blue-500 to-indigo-600',
  'toeic-650': 'from-amber-500 to-yellow-600',
  'toeic-800': 'from-purple-500 to-pink-600',
};

const TRACK_STORAGE_KEY = 'roadmap_active_track';

type PlacementMode = 'pick-intro' | 'pick' | 'test' | 'thpt-grade' | 'toeic-level' | null;

export default function JourneyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [enrolledAny, setEnrolledAny] = useState(false);
  const [enrollments, setEnrollments] = useState<RoadmapEnrollmentView[]>([]);
  const [needsPlacement, setNeedsPlacement] = useState(false);
  const [tree, setTree] = useState<RoadmapLevelView[]>([]);
  const [levelId, setLevelId] = useState<string>('A0');
  const [track, setTrack] = useState<RoadmapTrackId>('cefr');
  const [busyStep, setBusyStep] = useState<string | null>(null);
  const [milestonePopup, setMilestonePopup] = useState<MilestonePopupPayload | null>(null);

  // Vocab foundation track progress from localStorage
  const [completedVocabPacks, setCompletedVocabPacks] = useState<string[]>([]);
  const [completedVocabTopics, setCompletedVocabTopics] = useState<string[]>([]);
  const [_masteredVocabWords, setMasteredVocabWords] = useState<string[]>([]);

  useEffect(() => {
    try {
      const rawCompleted = localStorage.getItem('vocab_station_completed_packs');
      if (rawCompleted) setCompletedVocabPacks(JSON.parse(rawCompleted));
      const rawTopics = localStorage.getItem('vocab_station_completed_topics');
      if (rawTopics) setCompletedVocabTopics(JSON.parse(rawTopics));
      const rawMastered = localStorage.getItem('vocab_station_mastered_words');
      if (rawMastered) setMasteredVocabWords(JSON.parse(rawMastered));
    } catch {
      /* ignore */
    }
  }, []);

  const vocabStats: TrackStats = useMemo(() => {
    const completedUnits = completedVocabPacks.length + completedVocabTopics.length;
    const totalUnits = 46; // 10 core packs + 36 topics (12 x 3 stages)
    const progressPct = Math.min(100, Math.round((completedUnits / totalUnits) * 100));
    return {
      completedUnits,
      totalUnits,
      progressPct,
      currentLevelTitle: '3.000 Từ & Động Từ Cốt Lõi',
      isEnrolled: true,
    };
  }, [completedVocabPacks, completedVocabTopics]);

  // Modals for interactive preview & celebration
  const [previewStep, setPreviewStep] = useState<RoadmapStepView | null>(null);
  const [previewUnit, setPreviewUnit] = useState<RoadmapUnitView | null>(null);
  const [badgeUnit, setBadgeUnit] = useState<RoadmapUnitView | null>(null);

  // Placement state
  const [mode, setMode] = useState<PlacementMode>(null);
  const [questions, setQuestions] = useState<PlacementQuestionView[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async (preferred?: RoadmapTrackId): Promise<void> => {
    try {
      // Priority: explicit preferred arg -> URL query param -> localStorage
      let urlTrack: RoadmapTrackId | null = null;
      if (typeof window !== 'undefined') {
        const param = new URLSearchParams(window.location.search).get('track');
        if (param === 'cefr' || param === 'thpt' || param === 'toeic' || param === 'vocab') {
          urlTrack = param as RoadmapTrackId;
        }
      }
      const stored =
        typeof window !== 'undefined'
          ? (localStorage.getItem(TRACK_STORAGE_KEY) as RoadmapTrackId | null)
          : null;
      const want = preferred ?? urlTrack ?? (stored === 'vocab' || stored === 'toeic' || stored === 'thpt' || stored === 'cefr' ? stored : undefined);

      if (want === 'vocab') {
        setTrack('vocab');
        setNeedsPlacement(false);
        setEnrolledAny(true);
        try {
          localStorage.setItem(TRACK_STORAGE_KEY, 'vocab');
        } catch {
          /* ignore */
        }
        setLoading(false);
        return;
      }

      const data = await fetchRoadmap(want);
      const list = data.enrollments ?? [];
      setEnrollments(list);
      setEnrolledAny(data.enrolled || list.length > 0);

      const activeTrack: RoadmapTrackId =
        data.track === 'thpt' || data.track === 'cefr' || data.track === 'toeic'
          ? data.track
          : want ?? 'cefr';
      setTrack(activeTrack);
      try {
        localStorage.setItem(TRACK_STORAGE_KEY, activeTrack);
      } catch {
        /* ignore */
      }

      if (data.needsPlacement || !data.tree) {
        setNeedsPlacement(true);
        setTree([]);
        setMode(
          activeTrack === 'thpt'
            ? 'thpt-grade'
            : activeTrack === 'toeic'
            ? 'toeic-level'
            : 'pick-intro',
        );
      } else {
        setNeedsPlacement(false);
        setTree(data.tree);
        setLevelId(data.levelId ?? 'A0');
        setMode(null);
        if ((data.creditedFromLibrary ?? 0) > 0) {
          toast.success(
            `Đã đồng bộ ${data.creditedFromLibrary} bước từ kho (từ vựng/ngữ pháp đã học) — lộ trình mở tiếp cho bạn.`,
          );
        }
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
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        // Allow guest exploration of vocab track or general roadmap without login block
        let urlTrack: RoadmapTrackId | null = null;
        if (typeof window !== 'undefined') {
          const param = new URLSearchParams(window.location.search).get('track');
          if (param === 'cefr' || param === 'thpt' || param === 'toeic' || param === 'vocab') {
            urlTrack = param as RoadmapTrackId;
          }
        }
        setTrack(urlTrack || 'vocab');
        setEnrolledAny(true);
        setLoading(false);
        return;
      }
      if (active) await load();
    })();
    return () => {
      active = false;
    };
  }, [load]);

  // Handle milestone popup from sessionStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      const flag = sessionStorage.getItem('roadmap_celebrate');
      if (!flag) return;
      sessionStorage.removeItem('roadmap_celebrate');
      if (flag === 'unit') {
        setMilestonePopup({ kind: 'unit', intensity: 'strong' });
        return;
      }
      if (flag === 'level' || flag.startsWith('level:')) {
        const id = flag.startsWith('level:') ? flag.slice('level:'.length) : undefined;
        setMilestonePopup({
          kind: 'roadmap_level',
          levelId: id || undefined,
          intensity: 'epic',
        });
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const switchTrack = async (next: RoadmapTrackId): Promise<void> => {
    if (next === track && !needsPlacement && (tree.length > 0 || next === 'vocab')) return;
    setLoading(true);
    setMode(null);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('track', next);
      window.history.pushState({}, '', url.toString());
    }
    if (next === 'vocab') {
      setTrack('vocab');
      try {
        localStorage.setItem(TRACK_STORAGE_KEY, 'vocab');
      } catch {
        /* ignore */
      }
      setLoading(false);
      return;
    }
    await load(next);
  };

  const startTest = async (): Promise<void> => {
    try {
      const res = await authFetch('/api/roadmap/placement');
      const json = (await res.json()) as {
        success: boolean;
        data?: { questions: PlacementQuestionView[] };
        error?: string;
      };
      if (!json.success || !json.data) throw new Error(json.error || 'Không tải được bài test');
      setQuestions(json.data.questions);
      setQIndex(0);
      setAnswers({});
      setMode('test');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Lỗi tải bài test');
    }
  };

  const submitPlacement = async (body: {
    answers?: Record<string, string>;
    selfSelect?: string;
    track?: string;
  }): Promise<void> => {
    setSubmitting(true);
    try {
      const res = await authFetch('/api/roadmap/placement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as {
        success: boolean;
        data?: { levelId: string; track?: string };
        error?: string;
      };
      if (!json.success || !json.data) throw new Error(json.error || 'Không xếp được cấp');
      const placedTrack = (
        json.data.track === 'thpt'
          ? 'thpt'
          : json.data.track === 'toeic'
          ? 'toeic'
          : 'cefr'
      ) as RoadmapTrackId;
      toast.success(
        placedTrack === 'thpt'
          ? `Bắt đầu từ lớp ${json.data.levelId.replace('lop-', '')}. Có thể học thêm CEFR/TOEIC bất cứ lúc nào.`
          : placedTrack === 'toeic'
          ? `Bắt đầu lộ trình TOEIC ${json.data.levelId.replace('toeic-', '')}+. Chúc bạn luyện thi bứt phá!`
          : `Điểm bắt đầu: cấp ${json.data.levelId}. Có thể mở thêm lộ trình THPT/TOEIC bất cứ lúc nào.`,
      );
      setMode(null);
      setLoading(true);
      await load(placedTrack);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Có lỗi kết nối');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (mode !== 'test') return;
    const q = questions[qIndex];
    if (q?.kind === 'listening' && q.audioWord) void playWordAudio(q.audioWord, null, 0.9);
  }, [mode, qIndex, questions]);

  const answerQuestion = (qid: string, choice: string): void => {
    const next = { ...answers, [qid]: choice };
    setAnswers(next);
    if (qIndex + 1 < questions.length) setQIndex(qIndex + 1);
    else void submitPlacement({ track: 'cefr', answers: next });
  };

  const openStep = async (
    step: RoadmapStepView,
    opts?: { forceReplay?: boolean },
  ): Promise<void> => {
    if (step.status === 'locked' || busyStep) return;
    setBusyStep(step.id);
    try {
      const THPT_TYPES = ['reading', 'cloze', 'arrange', 'announcement', 'leaflet', 'exam'];
      const TOEIC_PART_TYPES = ['toeic-part5', 'toeic-part6', 'toeic-part7'];

      // Close preview modal if open
      setPreviewStep(null);
      setPreviewUnit(null);

      // Step đã completed: hỏi học lại (trừ khi force)
      if (
        step.status === 'completed' &&
        !opts?.forceReplay &&
        (step.type === 'vocab' || step.type === 'grammar')
      ) {
        const replay = window.confirm(
          `「${step.title}」đã hoàn thành${step.fromLibrary ? ' (đồng bộ từ kho)' : ''}.

OK = học lại · Cancel = giữ nguyên.`,
        );
        if (!replay) return;
      }

      if (step.type === 'vocab') {
        toast.loading('Đang chuẩn bị gói từ...', { id: 'journey-open' });
        const res = await authFetch('/api/import/packages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ packId: step.ref }),
        });
        const data = (await res.json()) as {
          success?: boolean;
          classroomId?: string;
          wordIds?: string[];
          error?: string;
        };
        if (!res.ok || !data.success || !data.classroomId || !data.wordIds?.length) {
          throw new Error(
            data.error ||
              'Không mở được gói từ — gói có thể đã gỡ khỏi danh mục. Thử bước khác hoặc báo admin.',
          );
        }
        const refreshCtrl = new AbortController();
        const refreshTimer = setTimeout(() => refreshCtrl.abort(), 8000);
        try {
          await authFetch('/api/words/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ classroomId: data.classroomId, wordIds: data.wordIds }),
            signal: refreshCtrl.signal,
          });
        } catch {
          // LearnMode có fallback
        } finally {
          clearTimeout(refreshTimer);
        }
        toast.dismiss('journey-open');
        const ids = data.wordIds.map((id) => encodeURIComponent(id)).join(',');
        const replayQs = step.status === 'completed' ? '&replay=1' : '';
        router.push(
          `/flashcard?class=${encodeURIComponent(data.classroomId)}&mode=learn&ids=${ids}&roadmapStep=${step.id}${replayQs}`,
        );
      } else if (step.type === 'grammar') {
        const replayQs = step.status === 'completed' ? '&replay=1' : '';
        router.push(
          `/grammar/learn?topic=${encodeURIComponent(step.ref)}&roadmapStep=${step.id}${replayQs}`,
        );
      } else if (step.type === 'pronunciation') {
        router.push(`/pronunciation/${encodeURIComponent(step.ref)}?roadmapStep=${step.id}`);
      } else if (TOEIC_PART_TYPES.includes(step.type)) {
        const partSlug = step.type.replace('toeic-', '');
        router.push(`/toeic/${partSlug}/${encodeURIComponent(step.ref)}?roadmapStep=${step.id}`);
      } else if (step.type === 'toeic-mini-test') {
        router.push(`/toeic/exam/${encodeURIComponent(step.ref)}?roadmapStep=${step.id}`);
      } else if (THPT_TYPES.includes(step.type)) {
        router.push(`/thpt/${step.type}/${encodeURIComponent(step.ref)}?roadmapStep=${step.id}`);
      } else {
        router.push(`/journey/checkpoint/${encodeURIComponent(step.ref)}?roadmapStep=${step.id}`);
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Có lỗi kết nối', {
        id: 'journey-open',
      });
    } finally {
      setBusyStep(null);
    }
  };

  const visibleTree = useMemo(() => {
    const start = tree.filter(
      (l) => !l.units.every((u) => u.steps.every((s) => s.status === 'review')),
    );
    const review = tree.filter((l) =>
      l.units.every((u) => u.steps.every((s) => s.status === 'review')),
    );
    return { start, review };
  }, [tree]);

  const enrolledTracks = useMemo(
    () => new Set(enrollments.map((e) => e.track)),
    [enrollments],
  );
  const hasCefr = enrolledTracks.has('cefr');
  const hasThpt = enrolledTracks.has('thpt');
  const hasToeic = enrolledTracks.has('toeic');

  // Stats computation for TrackSwitcher
  const currentTrackStats: TrackStats = useMemo(() => {
    let totalUnits = 0;
    let completedUnits = 0;
    let totalSteps = 0;
    let completedSteps = 0;

    for (const level of tree) {
      for (const unit of level.units) {
        totalUnits++;
        const isDone =
          unit.steps.length > 0 && unit.steps.every((s) => s.status === 'completed');
        if (isDone) completedUnits++;
        for (const step of unit.steps) {
          totalSteps++;
          if (step.status === 'completed') completedSteps++;
        }
      }
    }

    const progressPct =
      totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
    const curLevel = tree.find((l) => l.id === levelId) || tree[0];

    return {
      completedUnits,
      totalUnits,
      progressPct,
      currentLevelTitle: curLevel ? curLevel.titleVi || curLevel.title : levelId,
      isEnrolled: true,
    };
  }, [tree, levelId]);

  const cefrEnrollment = enrollments.find((e) => e.track === 'cefr');
  const thptEnrollment = enrollments.find((e) => e.track === 'thpt');
  const toeicEnrollment = enrollments.find((e) => e.track === 'toeic');

  const cefrStats: TrackStats =
    track === 'cefr'
      ? currentTrackStats
      : {
          completedUnits: 0,
          totalUnits: 0,
          progressPct: 0,
          currentLevelTitle: cefrEnrollment ? `Cấp ${cefrEnrollment.levelId}` : undefined,
          isEnrolled: hasCefr,
        };

  const thptStats: TrackStats =
    track === 'thpt'
      ? currentTrackStats
      : {
          completedUnits: 0,
          totalUnits: 0,
          progressPct: 0,
          currentLevelTitle: thptEnrollment
            ? `Lớp ${thptEnrollment.levelId.replace('lop-', '')}`
            : undefined,
          isEnrolled: hasThpt,
        };

  const toeicStats: TrackStats =
    track === 'toeic'
      ? currentTrackStats
      : {
          completedUnits: 0,
          totalUnits: 0,
          progressPct: 0,
          currentLevelTitle: toeicEnrollment
            ? `TOEIC ${toeicEnrollment.levelId.replace('toeic-', '')}+`
            : undefined,
          isEnrolled: hasToeic,
        };

  // Next Actionable Step across entire visible tree
  let nextActionableStep: { step: RoadmapStepView; unit: RoadmapUnitView } | null = null;
  for (const level of visibleTree.start) {
    for (const unit of level.units) {
      const step = unit.steps.find((s) => s.status === 'current');
      if (step) {
        nextActionableStep = { step, unit };
        break;
      }
    }
    if (nextActionableStep) break;
  }

  // Next unit for badge modal celebration
  let nextUnitForCelebration: RoadmapUnitView | null = null;
  if (badgeUnit && tree) {
    const allUnits = tree.flatMap((l) => l.units);
    const idx = allUnits.findIndex((u) => u.id === badgeUnit.id);
    if (idx >= 0 && idx + 1 < allUnits.length) {
      nextUnitForCelebration = allUnits[idx + 1];
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground gap-3">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span>Đang nạp lộ trình học...</span>
      </div>
    );
  }

  // ── Placement UI ──
  const showPlacement = !enrolledAny || needsPlacement || mode !== null;

  if (showPlacement && mode === 'test') {
    const q = questions[qIndex];
    return (
      <div className="mx-auto max-w-xl p-6 space-y-6">
        {enrolledAny && (
          <TrackSwitcher
            currentTrack={track}
            onTrackChange={(t) => void switchTrack(t)}
            cefrStats={cefrStats}
            thptStats={thptStats}
          />
        )}
        <p className="text-sm text-muted-foreground">
          Câu {qIndex + 1}/{questions.length} · cấp {q.level}
        </p>
        <h1 className="text-xl font-bold">{q.prompt}</h1>
        {q.kind === 'listening' && q.audioWord && (
          <Button
            variant="outline"
            className="min-h-[44px]"
            onClick={() => void playWordAudio(q.audioWord!, null, 0.9)}
          >
            <Volume2 className="w-4 h-4 mr-2" /> Nghe lại
          </Button>
        )}
        <div className="grid gap-3">
          {q.options.map((opt) => (
            <Button
              key={opt}
              variant="outline"
              className="justify-start min-h-[48px] py-3 text-base"
              disabled={submitting}
              onClick={() => answerQuestion(q.id, opt)}
            >
              {opt}
            </Button>
          ))}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="min-h-[44px]"
          onClick={() => setMode('pick-intro')}
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Quay lại
        </Button>
      </div>
    );
  }

  if (showPlacement && mode === 'thpt-grade') {
    const grades = [
      {
        id: 'lop-10',
        label: 'Lớp 10 · Global Success',
        desc: '10 unit SGK: Family Life → Ecotourism · vocab catalog + ngữ pháp CEFR.',
      },
      {
        id: 'lop-11',
        label: 'Lớp 11 · Global Success',
        desc: 'Bắt đầu thẳng lớp 11 — không cần xong lớp 10 trên app.',
      },
      {
        id: 'lop-12',
        label: 'Lớp 12 · Global Success + đề 2025',
        desc: 'Bắt đầu thẳng lớp 12 — ôn unit + dạng đề tốt nghiệp.',
      },
    ];
    return (
      <div className="mx-auto max-w-xl p-6 space-y-4">
        {enrolledAny && (
          <TrackSwitcher
            currentTrack={track}
            onTrackChange={(t) => void switchTrack(t)}
            cefrStats={cefrStats}
            thptStats={thptStats}
            toeicStats={toeicStats}
          />
        )}
        <h1 className="text-2xl font-bold">Bạn học lớp mấy?</h1>
        <p className="text-muted-foreground">
          Chọn <b>đúng lớp đang học</b> — lớp 11/12 được, không bắt buộc từ lớp 10. Lớp thấp hơn
          (nếu có) mở tự do để ôn.
        </p>
        <div className="grid gap-3">
          {grades.map((g) => (
            <Card
              key={g.id}
              className="cursor-pointer hover:border-primary transition-colors touch-manipulation"
              onClick={() => !submitting && void submitPlacement({ track: 'thpt', selfSelect: g.id })}
            >
              <CardContent className="flex items-center gap-4 p-4 min-h-[56px]">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-orange-500 text-white font-bold text-sm">
                  {g.id.replace('lop-', '')}
                </span>
                <div>
                  <p className="font-semibold">{g.label}</p>
                  <p className="text-sm text-muted-foreground">{g.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {enrolledAny ? (
          <Button
            variant="ghost"
            size="sm"
            className="min-h-[44px]"
            onClick={() => void switchTrack(hasCefr ? 'cefr' : 'thpt')}
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Quay lại lộ trình
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="min-h-[44px]"
            onClick={() => setMode(null)}
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Quay lại
          </Button>
        )}
      </div>
    );
  }

  if (showPlacement && mode === 'toeic-level') {
    const toeicLevels = [
      {
        id: 'toeic-450',
        label: 'TOEIC 450+ · Nền tảng',
        desc: 'Xây vững ngữ pháp cốt lõi, từ vựng công sở, làm quen Part 5 & 6 cơ bản.',
      },
      {
        id: 'toeic-650',
        label: 'TOEIC 650+ · Bứt phá',
        desc: 'Tăng tốc Part 5, xử lý Part 6 & 7 đọc hiểu đoạn đơn và đoạn kép.',
      },
      {
        id: 'toeic-800',
        label: 'TOEIC 800+ · Chinh phục',
        desc: 'Nắm chắc các bẫy ngữ pháp nâng cao, bẫy từ vựng và câu hỏi khó Part 7.',
      },
    ];
    return (
      <div className="mx-auto max-w-xl p-6 space-y-4">
        {enrolledAny && (
          <TrackSwitcher
            currentTrack={track}
            onTrackChange={(t) => void switchTrack(t)}
            cefrStats={cefrStats}
            thptStats={thptStats}
            toeicStats={toeicStats}
          />
        )}
        <h1 className="text-2xl font-bold">Mục tiêu TOEIC của bạn?</h1>
        <p className="text-muted-foreground">
          Chọn <b>mục tiêu điểm số</b> bạn hướng tới. Các chặng luyện tập sẽ được cá nhân hóa theo cấp độ.
        </p>
        <div className="grid gap-3">
          {toeicLevels.map((l) => (
            <Card
              key={l.id}
              className="cursor-pointer hover:border-primary transition-colors touch-manipulation"
              onClick={() => !submitting && void submitPlacement({ track: 'toeic', selfSelect: l.id })}
            >
              <CardContent className="flex items-center gap-4 p-4 min-h-[56px]">
                <span
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${LEVEL_COLORS[l.id]} text-white font-bold text-xs text-center px-1`}
                >
                  {l.id.replace('toeic-', '')}+
                </span>
                <div>
                  <p className="font-semibold">{l.label}</p>
                  <p className="text-sm text-muted-foreground">{l.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {enrolledAny ? (
          <Button
            variant="ghost"
            size="sm"
            className="min-h-[44px]"
            onClick={() => void switchTrack(hasCefr ? 'cefr' : hasThpt ? 'thpt' : 'toeic')}
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Quay lại lộ trình
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="min-h-[44px]"
            onClick={() => setMode(null)}
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Quay lại
          </Button>
        )}
      </div>
    );
  }

  if (showPlacement && mode === 'pick') {
    const levels = [
      { id: 'A0', label: 'Mất gốc', desc: 'Bắt đầu từ con số 0 — chưa tự tin câu nào.' },
      { id: 'A1', label: 'Sơ cấp 1', desc: 'Biết chào hỏi, câu đơn giản về bản thân.' },
      { id: 'A2', label: 'Sơ cấp 2', desc: 'Giao tiếp tình huống quen: mua sắm, đi lại.' },
      { id: 'B1', label: 'Trung cấp', desc: 'Nói được ý kiến, kể chuyện, đọc bài trung bình.' },
      { id: 'B2', label: 'Trung cao', desc: 'Tự tin tranh luận, hướng tới học thuật/luyện thi.' },
    ];
    return (
      <div className="mx-auto max-w-xl p-6 space-y-4">
        {enrolledAny && (
          <TrackSwitcher
            currentTrack={track}
            onTrackChange={(t) => void switchTrack(t)}
            cefrStats={cefrStats}
            thptStats={thptStats}
            toeicStats={toeicStats}
          />
        )}
        <h1 className="text-2xl font-bold">Bạn đang ở đâu?</h1>
        <p className="text-muted-foreground">
          Chọn cấp mô tả đúng bạn nhất — có thể đổi sau. Lộ trình THPT vẫn mở song song.
        </p>
        <div className="grid gap-3">
          {levels.map((l) => (
            <Card
              key={l.id}
              className="cursor-pointer hover:border-primary transition-colors touch-manipulation"
              onClick={() => !submitting && void submitPlacement({ track: 'cefr', selfSelect: l.id })}
            >
              <CardContent className="flex items-center gap-4 p-4 min-h-[56px]">
                <span
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${LEVEL_COLORS[l.id]} text-white font-bold`}
                >
                  {l.id}
                </span>
                <div>
                  <p className="font-semibold">{l.label}</p>
                  <p className="text-sm text-muted-foreground">{l.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="min-h-[44px]"
          onClick={() => setMode('pick-intro')}
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Quay lại
        </Button>
      </div>
    );
  }

  if (showPlacement && mode === 'pick-intro') {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center gap-6 p-6 text-center">
        {enrolledAny && (
          <TrackSwitcher
            currentTrack={track}
            onTrackChange={(t) => void switchTrack(t)}
            cefrStats={cefrStats}
            thptStats={thptStats}
            toeicStats={toeicStats}
          />
        )}
        <div className="text-6xl">🗺️</div>
        <h1 className="text-3xl font-bold">Lộ trình CEFR</h1>
        <p className="text-muted-foreground">
          Học theo chặng nhỏ: từ vựng + ngữ pháp + phát âm. Có thể học thêm THPT song song — không mất tiến độ.
        </p>
        <div className="grid w-full gap-3">
          <Button
            variant="chunky"
            size="lg"
            className="min-h-[48px]"
            onClick={() => void startTest()}
          >
            ⚡ Kiểm tra trình độ (~4 phút · 35 câu)
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="min-h-[48px]"
            onClick={() => setMode('pick')}
          >
            Tôi tự chọn cấp
          </Button>
        </div>
        {!enrolledAny && (
          <Button
            variant="ghost"
            size="sm"
            className="min-h-[44px]"
            onClick={() => setMode(null)}
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Quay lại
          </Button>
        )}
      </div>
    );
  }

  // Chưa ghi danh track nào
  if (!enrolledAny) {
    return (
      <div
        className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center gap-6 p-6 text-center"
        data-onboarding="journey-main"
      >
        <div className="text-6xl">🧭</div>
        <h1 className="text-3xl font-bold">Chọn lộ trình bắt đầu</h1>
        <p className="text-muted-foreground">
          Hai lộ trình <b>song song</b> — chọn một để bắt đầu, mở thêm cái kia bất cứ lúc nào. Không bị khóa &quot;hoặc CEFR hoặc THPT&quot;.
        </p>
        <div className="grid w-full gap-3">
          <Card
            className="cursor-pointer hover:border-primary transition-colors text-left touch-manipulation"
            onClick={() => {
              setTrack('cefr');
              setMode('pick-intro');
            }}
          >
            <CardContent className="p-4 min-h-[64px]">
              <p className="font-bold">🌱 Lộ trình chuẩn CEFR (A0 → B2)</p>
              <p className="text-sm text-muted-foreground">
                Học tổng quát từ mất gốc đến trung cao: từ vựng + ngữ pháp + phát âm giọng thật.
              </p>
            </CardContent>
          </Card>
          <Card
            className="cursor-pointer hover:border-primary transition-colors text-left touch-manipulation"
            onClick={() => {
              setTrack('thpt');
              setMode('thpt-grade');
            }}
          >
            <CardContent className="p-4 min-h-[64px]">
              <p className="font-bold">🎓 THPT · Global Success (Lớp 10 / 11 / 12)</p>
              <p className="text-sm text-muted-foreground">
                Chọn thẳng lớp đang học (11 hay 12 được). Bám unit SGK + dạng đề 2025. CEFR vẫn mở thêm sau.
              </p>
            </CardContent>
          </Card>
        </div>
        <Link href="/student" className="text-sm text-muted-foreground underline min-h-[44px] flex items-center">
          Quay về bảng điều khiển
        </Link>
      </div>
    );
  }

  // ── MAIN JOURNEY MODULE CARDS UI ──
  return (
    <StudentShell title="Lộ trình" requireAuth={false}>
      <div className="mx-auto max-w-3xl p-4 sm:p-6 pb-28 space-y-6" data-onboarding="journey-main">
        {/* Milestone Achievement Popup */}
        <MilestonePopup
          open={!!milestonePopup}
          payload={milestonePopup}
          onClose={() => setMilestonePopup(null)}
        />

        {/* Node Preview Modal before Starting Node */}
        <NodePreviewModal
          step={previewStep}
          open={!!previewStep}
          onClose={() => {
            setPreviewStep(null);
            setPreviewUnit(null);
          }}
          onStart={(step) => void openStep(step)}
          unitTitle={previewUnit?.title}
          unitIndex={previewUnit?.index}
          isBusy={busyStep !== null}
        />

        {/* Unit Completion Badge Celebration Modal */}
        <UnitBadgeModal
          unit={badgeUnit}
          open={!!badgeUnit}
          onClose={() => setBadgeUnit(null)}
          nextUnit={nextUnitForCelebration}
          onContinueNext={(nextU) => {
            setBadgeUnit(null);
            const firstStep = nextU.steps?.[0];
            if (firstStep) {
              setPreviewStep(firstStep);
              setPreviewUnit(nextU);
            }
          }}
        />

        {/* Header Title & Nav */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
              <span>Lộ Trình Học Tập</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                {track === 'vocab'
                  ? 'Từ Vựng Cốt Lõi'
                  : track === 'thpt'
                  ? 'THPT Global Success'
                  : track === 'toeic'
                  ? 'TOEIC Reading'
                  : 'Chuẩn CEFR'}
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              {track === 'vocab'
                ? '100 Động từ sống còn · 5 Tầng Sư Phạm · Làm chủ bố cục câu (S + V + O) & 5 cách luyện tập'
                : track === 'thpt' || levelId.startsWith('lop-')
                ? `Global Success lớp ${levelId.replace('lop-', '')} · Bám sát cấu trúc đề thi tốt nghiệp 2025`
                : track === 'toeic' || levelId.startsWith('toeic-')
                ? `Luyện thi TOEIC Reading ${levelId.replace('toeic-', '')}+ · Part 5, 6, 7 bám sát cấu trúc đề thi thật`
                : `Học phần chuẩn khung tham chiếu CEFR ${levelId} · Định hình thời gian & năng lực can-do`}
            </p>
          </div>

          <Link
            href="/student"
            className={cn(
              buttonVariants({ variant: 'outline', size: 'sm' }),
              'min-h-[44px] rounded-xl flex items-center gap-1 text-xs font-semibold'
            )}
          >
            <ArrowLeft className="w-4 h-4" /> Bảng điều khiển
          </Link>
        </div>

        {/* Multi-Track Switcher */}
        <TrackSwitcher
          currentTrack={track}
          onTrackChange={(t) => void switchTrack(t)}
          vocabStats={vocabStats}
          cefrStats={cefrStats}
          thptStats={thptStats}
          toeicStats={toeicStats}
        />

        {track === 'vocab' ? (
          <VocabRoadmapSection />
        ) : (
          <>
            {/* Level change & multi-track enrollment quick actions */}
            <div className="flex flex-wrap items-center gap-2">
          {track === 'thpt' ? (
            <Button
              variant="outline"
              size="sm"
              className="min-h-[44px] rounded-xl text-xs font-semibold"
              onClick={() => setMode('thpt-grade')}
            >
              Đổi lớp (10 / 11 / 12)
            </Button>
          ) : track === 'toeic' ? (
            <Button
              variant="outline"
              size="sm"
              className="min-h-[44px] rounded-xl text-xs font-semibold"
              onClick={() => setMode('toeic-level')}
            >
              Đổi mục tiêu TOEIC (450 / 650 / 800)
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="min-h-[44px] rounded-xl text-xs font-semibold"
              onClick={() => setMode('pick-intro')}
            >
              Đổi cấp CEFR
            </Button>
          )}

          {!hasCefr && track !== 'cefr' && (
            <Button
              variant="outline"
              size="sm"
              className="min-h-[44px] rounded-xl text-xs font-semibold text-emerald-600 dark:text-emerald-400"
              onClick={() => void switchTrack('cefr')}
            >
              + Mở thêm CEFR
            </Button>
          )}

          {!hasThpt && track !== 'thpt' && (
            <Button
              variant="outline"
              size="sm"
              className="min-h-[44px] rounded-xl text-xs font-semibold text-red-600 dark:text-red-400"
              onClick={() => void switchTrack('thpt')}
            >
              + Mở thêm THPT
            </Button>
          )}

          {!hasToeic && track !== 'toeic' && (
            <Button
              variant="outline"
              size="sm"
              className="min-h-[44px] rounded-xl text-xs font-semibold text-blue-600 dark:text-blue-400"
              onClick={() => void switchTrack('toeic')}
            >
              + Mở thêm TOEIC
            </Button>
          )}
        </div>

        {/* Pedagogical info banner */}
        {track === 'thpt' || levelId.startsWith('lop-') ? (
          <div className="rounded-2xl border border-sky-200/90 bg-sky-50/80 p-3.5 text-xs text-sky-950 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-100 flex items-start gap-2.5">
            <Layers className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>Lộ trình THPT Song Hành:</strong> Mỗi Unit gồm Từ vựng SGK Global Success +
              Ngữ pháp CEFR tương ứng. Lớp thấp hơn được mở tự do để ôn tập. Bạn có thể chuyển tab{' '}
              <strong>CEFR</strong> hoặc <strong>TOEIC</strong> bất cứ lúc nào mà không mất tiến độ.
            </div>
          </div>
        ) : track === 'toeic' || levelId.startsWith('toeic-') ? (
          <div className="rounded-2xl border border-blue-200/90 bg-blue-50/80 p-3.5 text-xs text-blue-950 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-100 flex items-start gap-2.5">
            <Target className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>Luyện thi TOEIC Reading:</strong> Rèn luyện phản xạ Part 5 (Incomplete Sentences),
              Part 6 (Text Completion), Part 7 (Reading Comprehension) có giải thích chi tiết tiếng Việt và Mini Test bấm giờ.
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-amber-200/90 bg-amber-50/80 p-3.5 text-xs text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100 flex items-start gap-2.5">
            <Award className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              {getExitDisclaimer()} Bạn có thể mở thêm lộ trình <strong>THPT</strong> hoặc <strong>TOEIC</strong> song song.
            </div>
          </div>
        )}

        {/* Dedicated IPA Soundboard & Practice Studio */}
        <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4 sm:p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3 min-w-0">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
                <Volume2 className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.2 rounded-full">
                    Phiên Âm IPA
                  </span>
                  <span className="text-[11px] text-muted-foreground font-medium hidden sm:inline">
                    44 Âm Chuẩn Quốc Tế · Rachel&apos;s English
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-extrabold text-foreground tracking-tight">
                  Bảng Phiên Âm IPA Quốc Tế &amp; Studio Luyện Âm
                </h3>
                <p className="text-xs text-muted-foreground">
                  Làm chủ khẩu hình và khắc phục lỗi phát âm người Việt với video Rachel&apos;s English và studio 5 nấc luyện tập.
                </p>
              </div>
            </div>
            <Link href="/ipa" className="shrink-0">
              <Button
                className="h-10 rounded-xl font-semibold shadow-xs w-full sm:w-auto text-xs"
              >
                Học Phiên Âm IPA <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>

        {/* ── NEXT ACTIONABLE STEP HERO CARD ── */}
        {nextActionableStep && (
          <Card className="border-2 border-primary/40 bg-gradient-to-r from-primary/10 via-primary/5 to-background shadow-md overflow-hidden rounded-2xl">
            <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-primary bg-primary/15 px-2 py-0.5 rounded-full animate-pulse">
                    <Flame className="w-3 h-3 fill-current" />
                    Bước học tiếp theo
                  </span>
                  <span className="text-xs text-muted-foreground font-medium">
                    Chặng {nextActionableStep.unit.index}: {nextActionableStep.unit.title}
                  </span>
                </div>

                <p className="text-base sm:text-lg font-extrabold text-foreground tracking-tight break-words">
                  {nextActionableStep.step.title}
                </p>

                {nextActionableStep.step.topicPreview && (
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {nextActionableStep.step.topicPreview}
                  </p>
                )}
              </div>

              <Button
                type="button"
                variant="chunky"
                disabled={busyStep !== null}
                onClick={() => {
                  setPreviewStep(nextActionableStep.step);
                  setPreviewUnit(nextActionableStep.unit);
                }}
                className="min-h-[48px] px-6 text-sm font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shrink-0 touch-manipulation"
              >
                {busyStep === nextActionableStep.step.id ? (
                  'Đang mở...'
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    Học ngay
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ── MAIN MODULE CARDS LIST BY LEVEL ── */}
        <div className="space-y-8">
          {track === 'cefr' && levelId === 'A0' && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border-2 border-amber-300 bg-amber-50/90 dark:border-amber-800 dark:bg-amber-950/30 text-amber-950 dark:text-amber-100 shadow-xs">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 font-black text-xs text-amber-800 dark:text-amber-300">
                  <Sparkles className="w-3.5 h-3.5 fill-current" /> Khuyến nghị sư phạm cho người mất gốc:
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  Nên bắt đầu bằng <strong>Lộ trình 100 Động Từ Cốt Lõi</strong> để làm chủ bố cục câu (S + V + O) trước khi học ngữ pháp.
                </p>
              </div>
              <Button
                size="sm"
                variant="chunky"
                onClick={() => void switchTrack('vocab')}
                className="shrink-0 text-xs font-bold rounded-xl shadow-xs"
              >
                Mở Lộ Trình Động Từ →
              </Button>
            </div>
          )}

          {visibleTree.start.map((level) => {
            const exit = getExitStandard(level.id);
            const levelUnitsTotal = level.units.length;
            const levelUnitsDone = level.units.filter((u) =>
              u.steps.length > 0 && u.steps.every((s) => s.status === 'completed'),
            ).length;

            return (
              <section key={level.id} className="space-y-4">
                {/* Level Banner */}
                <div
                  className={`rounded-2xl bg-gradient-to-r ${LEVEL_COLORS[level.id] ?? 'from-slate-600 to-slate-700'} p-5 text-white shadow-md space-y-3`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider opacity-85">
                        {level.id.startsWith('lop-')
                          ? `Chương Trình Lớp ${level.id.replace('lop-', '')}`
                          : `Cấp Độ Chuẩn ${level.id}`}
                      </p>
                      <h2 className="text-xl sm:text-2xl font-black tracking-tight mt-0.5">
                        {level.titleVi}
                      </h2>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs opacity-85 block">Tiến độ cấp</span>
                      <span className="text-sm sm:text-base font-extrabold tabular-nums">
                        {levelUnitsDone}/{levelUnitsTotal} chặng
                      </span>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm opacity-90 leading-relaxed">
                    {level.description}
                  </p>

                  {/* Level Exit Standards (Can-Do) */}
                  {exit && (
                    <details className="rounded-xl bg-black/20 p-3 text-xs backdrop-blur-xs transition-all">
                      <summary className="cursor-pointer font-bold select-none flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Target className="w-4 h-4" />
                          Chuẩn đầu ra cấp độ (Can-Do Skills)
                        </span>
                        <span className="text-[11px] opacity-80">Chi tiết ▼</span>
                      </summary>

                      <div className="mt-2.5 pt-2 border-t border-white/10 space-y-2">
                        {exit.targetLemmas && (
                          <p className="text-xs font-semibold text-emerald-200">
                            Kho từ vựng mục tiêu: {exit.targetLemmas}
                          </p>
                        )}
                        <p className="font-bold opacity-90">Năng lực đạt được sau cấp độ:</p>
                        <ul className="space-y-1 pl-1">
                          {exit.canDo.map((line, idx) => (
                            <li key={idx} className="flex items-start gap-1.5 opacity-95">
                              <span className="text-emerald-300 font-bold">✓</span>
                              <span>{line}</span>
                            </li>
                          ))}
                        </ul>
                        {exit.notYet && exit.notYet.length > 0 && (
                          <p className="text-[11px] opacity-75 pt-1">
                            Chưa bao gồm: {exit.notYet.join(' · ')}
                          </p>
                        )}
                      </div>
                    </details>
                  )}
                </div>

                {/* Module Cards Grid / Stacking */}
                <div className="space-y-4">
                  {level.units.map((unit) => {
                    const isUnitCurrent =
                      nextActionableStep?.unit.id === unit.id ||
                      unit.steps.some((s) => s.status === 'current');

                    return (
                      <ModuleCard
                        key={unit.id}
                        unit={unit}
                        isCurrentUnit={isUnitCurrent}
                        busyStepId={busyStep}
                        onStepClick={(step, u) => {
                          setPreviewStep(step);
                          setPreviewUnit(u);
                        }}
                        onViewBadge={(u) => {
                          setBadgeUnit(u);
                        }}
                      />
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        {/* Lower levels review section (free review) */}
        {visibleTree.review.length > 0 && (
          <details className="rounded-2xl border bg-muted/20 p-4 sm:p-5">
            <summary className="cursor-pointer font-bold text-sm text-muted-foreground select-none flex items-center justify-between">
              <span>
                {track === 'thpt'
                  ? 'Lớp thấp hơn (Mở tự do để ôn tập)'
                  : 'Cấp độ thấp hơn (Mở tự do để ôn tập)'}
              </span>
              <span className="text-xs">Xem danh sách ▼</span>
            </summary>

            <div className="mt-4 space-y-3 pt-3 border-t">
              {visibleTree.review.map((level) => (
                <div key={level.id} className="text-xs text-muted-foreground space-y-1">
                  <p className="font-semibold text-foreground">
                    {level.id} — {level.titleVi} ({level.units.length} chặng)
                  </p>
                  <p>
                    Các từ vựng và ngữ pháp của cấp này đã được miễn học bắt buộc, nhưng bạn vẫn
                    có thể tra cứu và làm bài tập bất cứ lúc nào trong Thư Viện và Ngữ Pháp.
                  </p>
                </div>
              ))}
            </div>
          </details>
        )}
          </>
        )}
      </div>
    </StudentShell>
  );
}
