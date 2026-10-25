'use client';

import React, { useState, use, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Volume2,
  Layers,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  ArrowRight,
  BookOpen,
  HelpCircle,
  Play,
  Lightbulb,
  Award,
  Clock,
  Compass,
} from 'lucide-react';
import { StudentShell } from '@/components/student/StudentShell';
import { Button } from '@/components/ui/button';
import {
  DualSpeedAudioButton,
  SafeHarborRecorder,
} from '@/components/speaking';
import {
  getCurriculumLessonById,
  allCurriculumLessons,
  SPEAKING_PHASE_CONFIGS,
} from '@/data/speaking/curriculum';
import type {
  SpeakingCurriculumLesson,
  SpeakingPhaseId,
  PedagogicalStageId,
  LegoSlotItem,
} from '@/types/speaking-curriculum';
import type { SafeHarborResult } from '@/types/speaking-foundation';

// Helper to highlight coreKeywords inside a sentence
function renderHighlightedText(text: string, keywords?: string[]) {
  if (!keywords || keywords.length === 0 || !text) {
    return <span>{text}</span>;
  }

  const validKeywords = keywords
    .filter((k) => typeof k === 'string' && k.trim().length > 0)
    .map((k) => k.trim())
    .sort((a, b) => b.length - a.length);

  if (validKeywords.length === 0) {
    return <span>{text}</span>;
  }

  const escapedPatterns = validKeywords.map((k) =>
    k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  );
  const regex = new RegExp(`(${escapedPatterns.join('|')})`, 'gi');
  const parts = text.split(regex);

  return (
    <span>
      {parts.map((part, idx) => {
        const isMatch = validKeywords.some(
          (k) => k.toLowerCase() === part.toLowerCase()
        );
        if (isMatch) {
          return (
            <mark
              key={idx}
              className="rounded bg-indigo-500/25 px-1 py-0.5 font-bold text-indigo-300 border border-indigo-500/40 not-italic inline-block mx-0.5"
            >
              {part}
            </mark>
          );
        }
        return <React.Fragment key={idx}>{part}</React.Fragment>;
      })}
    </span>
  );
}

// Helper to assemble dynamic Lego sentence from template and slot selections
function assembleLegoSentence(
  template: string,
  slots: Record<string, string[]>,
  selectedSlots: Record<string, string>
): string {
  let result = template;
  for (const [slotKey, options] of Object.entries(slots)) {
    const chosenWord = selectedSlots[slotKey] || options[0] || '';
    result = result.replace(new RegExp(`\\{${slotKey}\\}`, 'g'), chosenWord);
  }
  return result;
}

interface PageProps {
  params: Promise<{ phaseId: string; lessonId: string }>;
}

export default function CurriculumLessonDetailPage({ params }: PageProps) {
  // Support both React 19 Promise params and direct object params
  const resolvedParams =
    typeof (params as unknown as { then?: unknown })?.then === 'function'
      ? use(params)
      : (params as unknown as { phaseId: string; lessonId: string });

  const { phaseId, lessonId } = resolvedParams;
  const router = useRouter();

  const lesson: SpeakingCurriculumLesson | undefined = useMemo(() => {
    return getCurriculumLessonById(lessonId);
  }, [lessonId]);

  // Stage state: 1, 2, 3, 4
  const [currentStageNum, setCurrentStageNum] = useState<1 | 2 | 3 | 4>(1);

  // Stage 2: Lego Slot Substitution state
  const [activeSlotGroupIndex, setActiveSlotGroupIndex] = useState<number>(0);
  const [selectedSlots, setSelectedSlots] = useState<Record<string, string>>({});

  // Stage 4: SafeHarbor Evaluation state
  const [safeHarborResult, setSafeHarborResult] = useState<SafeHarborResult | null>(null);
  const [isPassedStage4, setIsPassedStage4] = useState<boolean>(false);

  // Early return if lesson not found
  if (!lesson) {
    return (
      <StudentShell title="Không tìm thấy bài học">
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="size-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
            <AlertCircle className="size-8" />
          </div>
          <h2 className="text-xl font-bold text-white">Không tìm thấy bài học</h2>
          <p className="text-sm text-slate-400 max-w-md">
            Mã bài học <code className="text-indigo-300 bg-slate-800 px-2 py-0.5 rounded">{lessonId}</code> không tồn tại trong hệ thống hoặc đã được cập nhật.
          </p>
          <Link href="/student/speaking/curriculum">
            <Button className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium mt-2">
              <ChevronLeft className="size-4 mr-1.5" /> Trở về danh sách bài học
            </Button>
          </Link>
        </div>
      </StudentShell>
    );
  }

  // Determine neighboring lessons for smooth sequential progression
  const currentIndex = allCurriculumLessons.findIndex((l) => l.id === lesson.id);
  const prevLesson = currentIndex > 0 ? allCurriculumLessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex >= 0 && currentIndex < allCurriculumLessons.length - 1
      ? allCurriculumLessons[currentIndex + 1]
      : null;

  // Active Lego slot group in Stage 2
  const activeLegoItem: LegoSlotItem | undefined =
    lesson.stage2CorePatterns.legoSlots?.[activeSlotGroupIndex] ||
    lesson.stage2CorePatterns.legoSlots?.[0];

  const assembledSentence = activeLegoItem
    ? assembleLegoSentence(activeLegoItem.template, activeLegoItem.slots, selectedSlots)
    : '';

  const handleSlotChoice = (slotKey: string, choice: string) => {
    setSelectedSlots((prev) => ({
      ...prev,
      [slotKey]: choice,
    }));
  };

  const handleSafeHarborResult = (result: SafeHarborResult) => {
    setSafeHarborResult(result);
    const minScore = lesson.stage4SafeHarborEvaluation.minimumPassingScore;
    const passed = result.score >= minScore || result.passed;
    if (passed) {
      setIsPassedStage4(true);
    }
  };

  const stagesList = [
    {
      stageNumber: 1 as const,
      title: 'Khởi động & Ngữ âm',
      shortTitle: '1. Ngữ âm',
      icon: Volume2,
      tag: 'Phát âm chuẩn',
    },
    {
      stageNumber: 2 as const,
      title: 'Khung câu & Lego',
      shortTitle: '2. Khung Lego',
      icon: Layers,
      tag: 'Thế khối <1s',
    },
    {
      stageNumber: 3 as const,
      title: 'Hội thoại tương tác',
      shortTitle: '3. Hội thoại',
      icon: MessageSquare,
      tag: 'Đàm thoại vi mô',
    },
    {
      stageNumber: 4 as const,
      title: 'Thử thách SafeHarbor',
      shortTitle: '4. SafeHarbor',
      icon: ShieldCheck,
      tag: 'Phản xạ âm thanh',
    },
  ];

  return (
    <StudentShell title={`${lesson.titleVi} - Luyện Nói Phản Xạ`} contentClassName="p-0">
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        {/* Sticky Header Navigation */}
        <header className="sticky top-header-safe z-30 border-b border-slate-800/80 bg-slate-900/95 backdrop-blur px-4 py-3 sm:px-8">
          <div className="mx-auto max-w-6xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Breadcrumb info */}
            <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
              <Link
                href="/student/speaking"
                className="hover:text-white transition-colors flex items-center gap-1"
              >
                Speaking
              </Link>
              <span>/</span>
              <Link
                href="/student/speaking/curriculum"
                className="hover:text-white transition-colors flex items-center gap-1"
              >
                Curriculum
              </Link>
              <span>/</span>
              <span className="font-semibold text-slate-200 truncate max-w-xs sm:max-w-md">
                Bài {String(lesson.order).padStart(2, '0')}: {lesson.titleVi}
              </span>
            </div>

            {/* Badges */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                {lesson.cefrLevel}
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30">
                IELTS {lesson.targetBandIelts}
              </span>
              <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                <Clock className="size-3" /> {lesson.estimatedMinutes}m
              </span>
            </div>
          </div>

          {/* 4-Stage Step Navigation Pills */}
          <div className="mx-auto max-w-6xl mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
            {stagesList.map((step) => {
              const Icon = step.icon;
              const isActive = currentStageNum === step.stageNumber;
              const isPassed =
                step.stageNumber < currentStageNum ||
                (step.stageNumber === 4 && isPassedStage4);

              return (
                <button
                  key={step.stageNumber}
                  onClick={() => setCurrentStageNum(step.stageNumber)}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all ${
                    isActive
                      ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm shadow-indigo-950/40'
                      : isPassed
                      ? 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/60 hover:text-white'
                      : 'bg-slate-900/30 border-slate-850 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <div
                    className={`size-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                      isActive
                        ? 'bg-indigo-600 text-white'
                        : isPassed
                        ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isPassed && !isActive ? (
                      <CheckCircle2 className="size-4 text-emerald-400" />
                    ) : (
                      <Icon className="size-3.5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold truncate leading-none">
                      {step.shortTitle}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate mt-1">
                      {step.tag}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </header>

        {/* Lesson Stage Body Container */}
        <main className="mx-auto max-w-6xl w-full px-4 sm:px-8 py-6 flex-1 flex flex-col justify-between">
          <div className="space-y-6">
            {/* ── STAGE 1: Warm-up & Phonetics Drill ── */}
            {currentStageNum === 1 && (
              <section className="space-y-6 animate-in fade-in duration-300">
                {/* Stage Header Banner */}
                <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 p-5 sm:p-6 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="inline-flex items-center gap-2 rounded-lg bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-300 border border-amber-500/30">
                      <Volume2 className="size-4 text-amber-400" />
                      <span>Chặng 1: Khởi Động Khẩu Hình & Trị Lỗi Ngữ Âm</span>
                    </div>
                    <div className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-800 text-amber-300 border border-slate-700">
                      Âm Trọng Tâm: <span className="text-white text-sm ml-1 font-mono">{lesson.stage1Phonetics.focusSound}</span>
                    </div>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-black text-white">
                    {lesson.stage1Phonetics.titleVi}
                  </h2>

                  {/* Vietnamese Contrastive Tip Card */}
                  <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 text-xs sm:text-sm text-amber-200/90 leading-relaxed flex items-start gap-3">
                    <Lightbulb className="size-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-amber-300 font-bold block mb-1">
                        Mẹo Khẩu Hình Cho Người Việt (Contrastive Articulatory Tip):
                      </strong>
                      <p>{lesson.stage1Phonetics.vietnameseContrastiveTip}</p>
                    </div>
                  </div>
                </div>

                {/* Minimal Pairs Drill Section */}
                {lesson.stage1Phonetics.minimalPairs && lesson.stage1Phonetics.minimalPairs.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <Sparkles className="size-4 text-amber-400" /> Cặp Âm Tối Thiểu (Minimal Pairs Drill)
                      </h3>
                      <span className="text-xs text-slate-400">
                        Nghe đối chiếu 0.8x & 1.0x để phân biệt
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {lesson.stage1Phonetics.minimalPairs.map((pair, idx) => (
                        <div
                          key={idx}
                          className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3 hover:border-slate-700 transition-colors"
                        >
                          <div className="grid grid-cols-2 gap-3 divide-x divide-slate-800">
                            {/* Word A */}
                            <div className="space-y-1.5 pr-2">
                              <div className="flex items-baseline justify-between">
                                <span className="text-base sm:text-lg font-bold text-white">
                                  {pair.wordA}
                                </span>
                                <span className="text-xs font-mono text-amber-300">
                                  {pair.ipaA}
                                </span>
                              </div>
                              <p className="text-xs text-slate-400">{pair.meaningA}</p>
                              <div className="pt-1">
                                <DualSpeedAudioButton
                                  text={pair.wordA}
                                  audioUrl={pair.audioUrlA}
                                  size="sm"
                                />
                              </div>
                            </div>

                            {/* Word B */}
                            <div className="space-y-1.5 pl-3">
                              <div className="flex items-baseline justify-between">
                                <span className="text-base sm:text-lg font-bold text-white">
                                  {pair.wordB}
                                </span>
                                <span className="text-xs font-mono text-cyan-300">
                                  {pair.ipaB}
                                </span>
                              </div>
                              <p className="text-xs text-slate-400">{pair.meaningB}</p>
                              <div className="pt-1">
                                <DualSpeedAudioButton
                                  text={pair.wordB}
                                  audioUrl={pair.audioUrlB}
                                  size="sm"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Distinction tip */}
                          {pair.distinctionVi && (
                            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-300 italic flex items-center gap-1.5">
                              <span className="text-amber-400 not-italic font-bold">🔍 Khác biệt:</span>
                              <span>{pair.distinctionVi}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Practice Sentences Section */}
                {lesson.stage1Phonetics.practiceSentences && lesson.stage1Phonetics.practiceSentences.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Volume2 className="size-4 text-emerald-400" /> Câu Luyện Nhịp Điệu & Âm Đuôi
                    </h3>

                    <div className="space-y-3">
                      {lesson.stage1Phonetics.practiceSentences.map((s, idx) => (
                        <div
                          key={idx}
                          className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-indigo-500/40 transition-colors"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                                {s.phoneticTarget}
                              </span>
                            </div>
                            <p className="text-sm sm:text-base font-semibold text-white">
                              {s.sentence}
                            </p>
                            <p className="text-xs text-slate-400">
                              {s.vietnameseTranslation}
                            </p>
                          </div>

                          <div className="shrink-0 pt-2 sm:pt-0">
                            <DualSpeedAudioButton
                              text={s.sentence}
                              audioUrl={s.audioUrl}
                              size="sm"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* ── STAGE 2: Core Patterns & Invariant Chunks ── */}
            {currentStageNum === 2 && (
              <section className="space-y-6 animate-in fade-in duration-300">
                {/* Stage Header & Formula Box */}
                <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-r from-blue-500/10 via-slate-900 to-slate-900 p-5 sm:p-6 space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="inline-flex items-center gap-2 rounded-lg bg-blue-500/20 px-3 py-1 text-xs font-bold text-blue-300 border border-blue-500/30">
                      <Layers className="size-4 text-blue-400" />
                      <span>Chặng 2: Khung Câu Cố Định & Khối Lego (Slot Substitution)</span>
                    </div>
                    <span className="text-xs font-medium text-slate-400">
                      Tốc độ mục tiêu: &lt; 1000ms
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-black text-white">
                    {lesson.stage2CorePatterns.titleVi}
                  </h2>

                  {/* Formula Box */}
                  <div className="rounded-xl border border-blue-500/40 bg-blue-950/30 p-4 space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-300">
                      Công thức khung câu bất biến (Zero-Conjugation Frame):
                    </span>
                    <div className="text-base sm:text-xl font-mono font-extrabold text-white tracking-wide bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                      {lesson.stage2CorePatterns.formula}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pt-1">
                      💡 <strong className="text-blue-300">Quy tắc sư phạm:</strong> {lesson.stage2CorePatterns.vietnameseGrammarRule}
                    </p>
                  </div>
                </div>

                {/* Interactive Lego Slot Substitution Simulator */}
                {activeLegoItem && (
                  <div className="rounded-2xl border border-indigo-500/40 bg-slate-900/80 p-5 sm:p-6 space-y-5 shadow-lg shadow-indigo-950/20">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                        <Sparkles className="size-5 text-indigo-400" />
                        <span>Bộ Ghép Khối Lego Tương Tác (Interactive Lego Simulator)</span>
                      </h3>
                      <span className="text-xs text-slate-400">
                        Bấm vào từng khối từ để biến đổi câu tức thì
                      </span>
                    </div>

                    {/* Template Representation */}
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <span className="text-xs text-slate-400 block font-medium">Khung đế Lego:</span>
                      <div className="text-sm sm:text-base font-mono text-slate-200">
                        {activeLegoItem.template}
                      </div>
                    </div>

                    {/* Clickable Slot Options */}
                    <div className="space-y-4">
                      {Object.entries(activeLegoItem.slots).map(([slotKey, choices]) => {
                        const activeChoice = selectedSlots[slotKey] || choices[0];

                        return (
                          <div key={slotKey} className="space-y-2">
                            <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider block">
                              Khối thế [{slotKey}]:
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {choices.map((choice, cIdx) => {
                                const isSelected = activeChoice === choice;
                                return (
                                  <button
                                    key={cIdx}
                                    onClick={() => handleSlotChoice(slotKey, choice)}
                                    className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all border ${
                                      isSelected
                                        ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-900/40 scale-[1.02]'
                                        : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
                                    }`}
                                  >
                                    {choice}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Live Assembled Sentence Output Card */}
                    <div className="p-4 sm:p-5 rounded-xl border-2 border-dashed border-indigo-500/50 bg-indigo-950/20 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                          <CheckCircle2 className="size-4 text-emerald-400" />
                          Câu phản xạ hoàn chỉnh vừa lắp ghép:
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Bấm nghe chậm 0.8x & chuẩn 1.0x
                        </span>
                      </div>

                      <p className="text-base sm:text-xl font-bold text-white tracking-wide">
                        &ldquo;{assembledSentence}&rdquo;
                      </p>

                      <div className="pt-2 flex items-center justify-between flex-wrap gap-3">
                        <DualSpeedAudioButton text={assembledSentence} size="default" />
                        <span className="text-xs text-slate-400 italic">
                          Tập nhả âm cả cụm không ngập ngừng &lt;1s
                        </span>
                      </div>
                    </div>

                    {/* Curated Pre-built Examples */}
                    {activeLegoItem.examples && activeLegoItem.examples.length > 0 && (
                      <div className="pt-2 space-y-2">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                          Các ví dụ chuẩn mẫu:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {activeLegoItem.examples.map((ex, exIdx) => (
                            <div
                              key={exIdx}
                              className="p-3 rounded-lg border border-slate-800 bg-slate-900/50 flex items-center justify-between gap-2"
                            >
                              <div>
                                <p className="text-xs sm:text-sm font-semibold text-slate-200">
                                  {ex.en}
                                </p>
                                <p className="text-xs text-slate-400">{ex.vi}</p>
                              </div>
                              <div className="shrink-0">
                                <DualSpeedAudioButton
                                  text={ex.en}
                                  audioUrl={ex.audioUrl}
                                  size="sm"
                                  showLabels={false}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* High-frequency Vocab */}
                {lesson.stage2CorePatterns.highFrequencyVocab &&
                  lesson.stage2CorePatterns.highFrequencyVocab.length > 0 && (
                    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
                      <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
                        Từ vựng tần suất cao & Collocation:
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {lesson.stage2CorePatterns.highFrequencyVocab.map((vocab, vIdx) => (
                          <div
                            key={vIdx}
                            className="p-3 rounded-lg border border-slate-800 bg-slate-900/40 space-y-1"
                          >
                            <div className="flex items-baseline justify-between">
                              <span className="font-bold text-white text-sm">
                                {vocab.term}
                              </span>
                              {vocab.partOfSpeech && (
                                <span className="text-[10px] text-indigo-400 uppercase font-mono">
                                  {vocab.partOfSpeech}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-300">{vocab.meaningVi}</p>
                            {vocab.collocationHintVi && (
                              <p className="text-[11px] text-amber-300/80 italic">
                                💡 {vocab.collocationHintVi}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </section>
            )}

            {/* ── STAGE 3: Guided Dialogue Practice ── */}
            {currentStageNum === 3 && (
              <section className="space-y-6 animate-in fade-in duration-300">
                {/* Stage Header Banner */}
                <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-500/10 via-slate-900 to-slate-900 p-5 sm:p-6 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="inline-flex items-center gap-2 rounded-lg bg-indigo-500/20 px-3 py-1 text-xs font-bold text-indigo-300 border border-indigo-500/30">
                      <MessageSquare className="size-4 text-indigo-400" />
                      <span>Chặng 3: Luyện Đàm Thoại Tương Tác (Guided Dialogue)</span>
                    </div>
                    {lesson.stage3GuidedDialogue.frameworkType && (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-800 text-indigo-300 border border-slate-700 uppercase">
                        Khung: {lesson.stage3GuidedDialogue.frameworkType}
                      </span>
                    )}
                  </div>

                  <h2 className="text-xl sm:text-2xl font-black text-white">
                    {lesson.stage3GuidedDialogue.titleVi}
                  </h2>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    <strong>Bối cảnh thực tế:</strong> {lesson.stage3GuidedDialogue.contextVi}
                  </p>
                </div>

                {/* Turn-by-turn dialogue list */}
                <div className="space-y-4">
                  {lesson.stage3GuidedDialogue.turns.map((turn, tIdx) => {
                    const isLearner =
                      turn.speaker.toLowerCase().includes('b') ||
                      turn.speaker.toLowerCase().includes('learner') ||
                      turn.speaker.toLowerCase().includes('bạn');

                    return (
                      <div
                        key={tIdx}
                        className={`rounded-2xl border p-4 sm:p-5 transition-all ${
                          isLearner
                            ? 'bg-emerald-950/20 border-emerald-500/40 ml-0 sm:ml-8'
                            : 'bg-slate-900/70 border-slate-800 mr-0 sm:mr-8'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`size-6 rounded-full flex items-center justify-center text-xs font-extrabold ${
                                isLearner
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-indigo-600 text-white'
                              }`}
                            >
                              {turn.speaker.substring(0, 1).toUpperCase()}
                            </span>
                            <span
                              className={`text-xs font-bold uppercase tracking-wider ${
                                isLearner ? 'text-emerald-400' : 'text-indigo-300'
                              }`}
                            >
                              Người nói {turn.speaker} {isLearner ? '(Vai của bạn)' : '(Đối tác)'}
                            </span>
                          </div>

                          <DualSpeedAudioButton
                            text={turn.en}
                            audioUrl={turn.audioUrl}
                            size="sm"
                          />
                        </div>

                        {/* English sentence with highlighted core keywords */}
                        <div className="text-sm sm:text-base font-semibold text-white leading-relaxed">
                          {renderHighlightedText(turn.en, turn.coreKeywords)}
                        </div>

                        {/* Vietnamese translation */}
                        <div className="text-xs text-slate-400 mt-1.5 italic">
                          {turn.vi}
                        </div>

                        {/* Suggested starters or tips */}
                        {turn.suggestedStartersVi && turn.suggestedStartersVi.length > 0 && (
                          <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center gap-1.5 flex-wrap text-[11px] text-amber-300/90">
                            <Lightbulb className="size-3.5 text-amber-400 shrink-0" />
                            <span>Gợi ý mở đầu:</span>
                            {turn.suggestedStartersVi.map((hint, hIdx) => (
                              <span
                                key={hIdx}
                                className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700"
                              >
                                {hint}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* ── STAGE 4: SafeHarbor Speech Reflex Evaluation ── */}
            {currentStageNum === 4 && (
              <section className="space-y-6 animate-in fade-in duration-300">
                {/* Stage Header Banner */}
                <div className="rounded-2xl border border-emerald-500/40 bg-gradient-to-r from-emerald-500/10 via-slate-900 to-slate-900 p-5 sm:p-6 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="inline-flex items-center gap-2 rounded-lg bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-300 border border-emerald-500/30">
                      <ShieldCheck className="size-4 text-emerald-400" />
                      <span>Chặng 4: Đánh Giá Phản Xạ SafeHarbor Không Áp Lực</span>
                    </div>
                    <div className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-800 text-emerald-300 border border-slate-700">
                      Điểm Đạt Yêu Cầu: &ge; {lesson.stage4SafeHarborEvaluation.minimumPassingScore}%
                    </div>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-black text-white">
                    {lesson.stage4SafeHarborEvaluation.titleVi}
                  </h2>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {lesson.stage4SafeHarborEvaluation.instructionsVi ||
                      'Phương pháp SafeHarbor: Không phạt lỗi ngữ pháp nhỏ, tập trung ghi nhận từ khóa nội dung và sự tự tin nhả âm của bạn!'}
                  </p>
                </div>

                {/* Target Prompt Card */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6 space-y-4">
                  <div className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Đề bài phản xạ (Hãy nhả âm bằng tiếng Anh):
                    </span>
                    <div className="text-base sm:text-lg font-bold text-emerald-300 bg-slate-950 p-4 rounded-xl border border-slate-800">
                      &ldquo;{lesson.stage4SafeHarborEvaluation.promptVi}&rdquo;
                    </div>
                  </div>

                  {/* Target Sentence Reference & Audio */}
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="text-xs font-semibold text-slate-400">
                        Câu đích tham chiếu:
                      </span>
                      <DualSpeedAudioButton
                        text={lesson.stage4SafeHarborEvaluation.targetSentence}
                        audioUrl={lesson.stage4SafeHarborEvaluation.audioModelUrl}
                        size="sm"
                      />
                    </div>
                    <p className="text-sm sm:text-base font-bold text-white">
                      {lesson.stage4SafeHarborEvaluation.targetSentence}
                    </p>
                  </div>

                  {/* Core Keywords Tokens */}
                  {lesson.stage4SafeHarborEvaluation.coreKeywords && (
                    <div className="space-y-1.5">
                      <span className="text-xs text-slate-400 block font-medium">
                        Từ khóa cốt lõi cần nhả âm (Content Keywords):
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {lesson.stage4SafeHarborEvaluation.coreKeywords.map((kw, kwIdx) => (
                          <span
                            key={kwIdx}
                            className="px-2.5 py-1 rounded-md bg-indigo-500/15 text-indigo-300 text-xs font-semibold border border-indigo-500/30"
                          >
                            ✓ {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Integrated SafeHarbor Voice Recorder */}
                  <div className="pt-4 border-t border-slate-800">
                    <SafeHarborRecorder
                      targetSentence={lesson.stage4SafeHarborEvaluation.targetSentence}
                      coreKeywords={lesson.stage4SafeHarborEvaluation.coreKeywords}
                      onResult={handleSafeHarborResult}
                    />
                  </div>

                  {/* Passing Status Celebratory Banner */}
                  {isPassedStage4 && (
                    <div className="p-5 rounded-2xl border-2 border-emerald-500/50 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-emerald-950/40 text-center space-y-3 animate-in zoom-in-95 duration-300">
                      <div className="size-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
                        <Award className="size-7" />
                      </div>
                      <h3 className="text-lg sm:text-xl font-black text-white">
                        🎉 Chúc mừng! Bạn đã chinh phục bài học thành công!
                      </h3>
                      <p className="text-xs sm:text-sm text-emerald-200 max-w-md mx-auto">
                        Bạn đã đạt chuẩn phản xạ SafeHarbor với mức điểm{' '}
                        <strong className="font-extrabold text-white text-base">
                          {safeHarborResult?.score || 85}%
                        </strong>
                        . Cơ miệng của bạn đã hình thành phản xạ tự nhiên!
                      </p>

                      <div className="pt-3 flex items-center justify-center gap-3 flex-wrap">
                        {nextLesson ? (
                          <Link
                            href={`/student/speaking/curriculum/${nextLesson.phaseId}/${nextLesson.id}`}
                          >
                            <Button className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm px-5 py-2">
                              <span>Bài tiếp theo ({nextLesson.titleVi})</span>
                              <ArrowRight className="size-4 ml-1.5" />
                            </Button>
                          </Link>
                        ) : (
                          <Link href="/student/speaking/curriculum">
                            <Button className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm px-5 py-2">
                              <span>Hoàn thành Chặng! Trở về Lộ Trình</span>
                              <CheckCircle2 className="size-4 ml-1.5" />
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>

          {/* Bottom Stage Progression Bar */}
          <div className="mt-8 pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (currentStageNum > 1) {
                  setCurrentStageNum((prev) => (prev - 1) as 1 | 2 | 3 | 4);
                }
              }}
              disabled={currentStageNum === 1}
              className="border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-40 text-xs"
            >
              <ChevronLeft className="size-4 mr-1" /> Chặng trước
            </Button>

            <div className="text-xs text-slate-400 font-medium">
              Chặng <span className="text-white font-bold">{currentStageNum}</span> / 4
            </div>

            {currentStageNum < 4 ? (
              <Button
                size="sm"
                onClick={() => {
                  setCurrentStageNum((prev) => (prev + 1) as 1 | 2 | 3 | 4);
                }}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
              >
                <span>Chặng tiếp theo</span>
                <ChevronRight className="size-4 ml-1" />
              </Button>
            ) : isPassedStage4 && nextLesson ? (
              <Link
                href={`/student/speaking/curriculum/${nextLesson.phaseId}/${nextLesson.id}`}
              >
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                >
                  <span>Bài tiếp theo</span>
                  <ArrowRight className="size-4 ml-1" />
                </Button>
              </Link>
            ) : (
              <Link href="/student/speaking/curriculum">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-700 bg-slate-800 text-white text-xs hover:bg-slate-700"
                >
                  <span>Về danh sách bài</span>
                  <BookOpen className="size-3.5 ml-1.5" />
                </Button>
              </Link>
            )}
          </div>
        </main>
      </div>
    </StudentShell>
  );
}
