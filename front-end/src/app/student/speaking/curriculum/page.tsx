'use client';

import React, { useState, useMemo } from 'react';
import Link from '@/shared/router/navigation';
import {
  Sparkles,
  Flame,
  Award,
  Clock,
  ArrowRight,
  BookOpen,
  ShieldCheck,
  Layers,
  Volume2,
  MessageSquare,
  Zap,
  Target,
  Filter,
  Compass,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  SPEAKING_PHASE_CONFIGS,
  getCurriculumLessonsByPhase,
  allCurriculumLessons,
} from '@/data/speaking/curriculum';
import type { SpeakingPhaseId } from '@/types/speaking-curriculum';
import { SpeakingStepLayout } from '@/components/speaking/SpeakingStepLayout';

export default function SpeakingCurriculumCatalogPage() {
  const [activePhase, setActivePhase] = useState<SpeakingPhaseId>('phase-1-beginner');

  const phaseTabs = [
    {
      id: 'phase-1-beginner' as SpeakingPhaseId,
      tierNumber: 1,
      title: 'Phase 1: Beginner',
      subtitle: 'A1 / 0-3.0 IELTS',
      accentColor: 'border-emerald-500/50 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10',
      activeTabClass: 'bg-indigo-600 text-white border-indigo-500',
      icon: Sparkles,
    },
    {
      id: 'phase-2-elementary' as SpeakingPhaseId,
      tierNumber: 2,
      title: 'Phase 2: Elementary',
      subtitle: 'A2-B1 / 3.0-5.0 IELTS',
      accentColor: 'border-amber-500/50 text-amber-600 dark:text-amber-400 bg-amber-500/10',
      activeTabClass: 'bg-indigo-600 text-white border-indigo-500',
      icon: Flame,
    },
    {
      id: 'phase-3-intermediate' as SpeakingPhaseId,
      tierNumber: 3,
      title: 'Phase 3: Intermediate',
      subtitle: 'B1-B2 / 5.0-6.5 IELTS',
      accentColor: 'border-indigo-500/50 text-indigo-600 dark:text-indigo-400 bg-indigo-500/10',
      activeTabClass: 'bg-indigo-600 text-white border-indigo-500',
      icon: Award,
    },
  ];

  const currentConfig = SPEAKING_PHASE_CONFIGS[activePhase];
  const activeLessons = useMemo(
    () => getCurriculumLessonsByPhase(activePhase),
    [activePhase]
  );

  const [selectedLessonId, setSelectedLessonId] = useState<string>(
    () => allCurriculumLessons[0]?.id || ''
  );

  const selectedLesson = useMemo(() => {
    return (
      activeLessons.find((l) => l.id === selectedLessonId) ||
      activeLessons[0] ||
      allCurriculumLessons[0]
    );
  }, [activeLessons, selectedLessonId]);

  const handlePhaseSelect = (phaseId: SpeakingPhaseId) => {
    setActivePhase(phaseId);
    const phaseLessons = getCurriculumLessonsByPhase(phaseId);
    if (phaseLessons[0]) {
      setSelectedLessonId(phaseLessons[0].id);
    }
  };

  return (
    <SpeakingStepLayout
      currentStage="curriculum"
      shellTitle="Lộ Trình Speaking Chuẩn Hóa"
      headerTitle="Lộ Trình Luyện Nói Phản Xạ 32 Bài Học"
      headerIcon={<BookOpen className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />}
      headerActions={
        <>
          <Link href="/student/speaking/foundation">
            <Button
              variant="outline"
              size="sm"
              className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white h-8 px-2.5"
            >
              <Zap className="mr-1.5 h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">Bước 1: Nền Tảng A0-A1</span>
              <span className="sm:hidden">Bước 1</span>
            </Button>
          </Link>
          <Link href="/student/speaking/topics">
            <Button
              variant="outline"
              size="sm"
              className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white h-8 px-2.5"
            >
              <Compass className="mr-1.5 h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              <span className="hidden sm:inline">Bước 3: 250+ Chủ Đề</span>
              <span className="sm:hidden">Bước 3</span>
            </Button>
          </Link>
        </>
      }
      contentClassName="flex flex-col md:flex-row gap-4 sm:gap-6"
    >
      {/* Left Main Panel: Curriculum Studio Workspace */}
      <div className="flex-1 flex flex-col bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/60 rounded-2xl shadow-sm dark:shadow-none overflow-hidden">
        {/* Active Phase Header Bar */}
        <div className="px-4 py-2.5 bg-slate-50/90 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <BookOpen className="size-4 text-indigo-600 dark:text-indigo-400" />
            <h1 className="font-semibold text-slate-800 dark:text-slate-200 text-xs sm:text-sm">
              Lộ Trình Luyện Nói Phản Xạ 32 Bài Học
            </h1>
            <span className="text-[10px] text-indigo-700 dark:text-indigo-400 font-mono font-bold px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 rounded border border-indigo-200 dark:border-indigo-800/50">
              {currentConfig.badge}
            </span>
          </div>
          <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="text-slate-500">Đang hiển thị:</span>
            <span className="px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 text-[10px]">
              {activeLessons.length} bài học ({currentConfig.titleVi})
            </span>
          </div>
        </div>

        {/* Context & Pedagogical Formula Banner */}
        <div className="px-4 py-3 bg-indigo-50/40 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800/60 text-xs space-y-2">
          <div className="flex items-center justify-between gap-2 flex-wrap text-[11px]">
            <div className="flex items-center gap-1.5 text-indigo-700 dark:text-indigo-300 font-medium">
              <span className="size-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
              <span>Chặng hiện tại:</span>
              <strong className="text-slate-900 dark:text-white">{currentConfig.titleVi}</strong>
              <span className="text-slate-500 dark:text-slate-400">({currentConfig.badge})</span>
            </div>
            <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800/80 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700/50">
              Phương pháp 4 chặng khép kín
            </span>
          </div>

          <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">
            <strong className="text-amber-700 dark:text-amber-400/90">Mục tiêu chặng:</strong>{' '}
            {currentConfig.descriptionVi}
          </p>

          <div className="pt-1 flex flex-wrap items-center gap-1.5 text-[10px]">
            <span className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
              Chu trình mỗi bài:
            </span>
            <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60">
              ✓ 1. Ngữ âm trị lỗi người Việt
            </span>
            <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60">
              ✓ 2. Khung câu &amp; Thế khối Lego
            </span>
            <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60">
              ✓ 3. Hội thoại vi mô tương tác
            </span>
            <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60">
              ✓ 4. Phản xạ SafeHarbor
            </span>
          </div>
        </div>

        {/* Lessons Grid Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {activeLessons.map((lesson) => {
              const lessonRoute = `/student/speaking/curriculum/${lesson.phaseId}/${lesson.id}`;
              const isSelected = selectedLesson?.id === lesson.id;

              return (
                <div
                  key={lesson.id}
                  onClick={() => setSelectedLessonId(lesson.id)}
                  className={`group cursor-pointer relative flex flex-col justify-between rounded-2xl border p-4 sm:p-5 transition-all duration-200 ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50/40 dark:bg-slate-900/90 shadow-sm dark:shadow-lg dark:shadow-indigo-950/30'
                      : 'border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/60 hover:border-indigo-500/50 hover:bg-slate-50 dark:hover:bg-slate-900/90'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Top Row: Badges & Duration */}
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center text-xs font-extrabold px-2.5 py-0.5 rounded-md bg-indigo-50 dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-slate-700">
                          Bài {String(lesson.order).padStart(2, '0')}
                        </span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/20">
                          {lesson.cefrLevel}
                        </span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-500/20">
                          IELTS {lesson.targetBandIelts}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                        <Clock className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                        <span>{lesson.estimatedMinutes} phút</span>
                      </div>
                    </div>

                    {/* Lesson Titles */}
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                        {lesson.titleVi}
                      </h3>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 italic mt-0.5">
                        {lesson.titleEn}
                      </p>
                    </div>

                    {/* Summary */}
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                      {lesson.summaryVi}
                    </p>

                    {/* 4-Stage Feature Checklist */}
                    <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800/60 grid grid-cols-2 gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Volume2 className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span className="truncate">
                          Âm:{' '}
                          <strong className="text-slate-800 dark:text-slate-200">
                            {lesson.stage1Phonetics.focusSound}
                          </strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Layers className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                        <span className="truncate">
                          Thế khối Lego{' '}
                          <strong className="text-slate-800 dark:text-slate-200">&lt;1s</strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MessageSquare className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                        <span className="truncate">
                          Hội thoại{' '}
                          <strong className="text-slate-800 dark:text-slate-200">
                            {lesson.stage3GuidedDialogue.turns.length} lượt
                          </strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span className="truncate">
                          SafeHarbor:{' '}
                          <strong className="text-slate-800 dark:text-slate-200">
                            &ge;{lesson.stage4SafeHarborEvaluation.minimumPassingScore}%
                          </strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Action Button */}
                  <div className="pt-3.5 mt-3.5 border-t border-slate-200/80 dark:border-slate-800/60 flex items-center justify-between">
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Chuẩn phương pháp 4 chặng
                    </div>
                    <Link href={lessonRoute}>
                      <Button
                        size="sm"
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs h-8 px-3 transition-all flex items-center gap-1.5"
                      >
                        <span>Bắt đầu học</span>
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Action Bar */}
        {selectedLesson && (
          <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/30 flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs text-slate-600 dark:text-slate-400 truncate max-w-md">
              Đang chọn:{' '}
              <strong className="text-slate-900 dark:text-slate-200">
                Bài {String(selectedLesson.order).padStart(2, '0')} — {selectedLesson.titleVi}
              </strong>
            </div>
            <Link
              href={`/student/speaking/curriculum/${selectedLesson.phaseId}/${selectedLesson.id}`}
            >
              <Button
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold gap-1.5"
              >
                <span>Vào học bài này ngay</span>
                <ArrowRight className="size-3.5" />
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Right Sidebar: Phase Filter & Lesson Selector */}
      <div className="w-full md:w-80 shrink-0 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-600 dark:text-slate-400 px-1 uppercase tracking-wider flex items-center gap-1.5">
            <Filter className="size-3.5" /> Danh sách bài học ({activeLessons.length}/32)
          </h3>
          <span className="text-[10px] font-mono text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/50 px-1.5 py-0.5 rounded">
            3-Tier Curriculum
          </span>
        </div>

        {/* Phase Filter Pills */}
        <div className="flex flex-col gap-1.5 text-[11px]">
          {phaseTabs.map((tab) => {
            const Icon = tab.icon;
            const isSelected = activePhase === tab.id;
            const phaseConfig = SPEAKING_PHASE_CONFIGS[tab.id];

            return (
              <button
                key={tab.id}
                onClick={() => handlePhaseSelect(tab.id)}
                className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm dark:shadow-md dark:shadow-indigo-950/50'
                    : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Icon className="size-3.5 shrink-0" />
                  <div className="truncate">
                    <div className="font-bold text-xs truncate">{tab.title}</div>
                    <div className="text-[10px] opacity-80 truncate">{tab.subtitle}</div>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0 ${
                    isSelected
                      ? 'bg-black/25 text-white'
                      : 'bg-slate-100 dark:bg-black/25 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {phaseConfig.totalLessons} bài
                </span>
              </button>
            );
          })}
        </div>

        {/* Scrollable Lesson Selector List */}
        <div className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-y-auto max-h-[150px] md:max-h-[calc(100vh-22rem)] pr-1 scrollbar-thin">
          {activeLessons.map((lesson) => {
            const isActive = selectedLesson?.id === lesson.id;
            return (
              <button
                key={lesson.id}
                onClick={() => setSelectedLessonId(lesson.id)}
                className={`flex-1 md:flex-none text-left p-3 rounded-xl border transition-all text-xs shrink-0 w-64 md:w-full ${
                  isActive
                    ? 'bg-indigo-50/90 dark:bg-indigo-600/15 border-indigo-500 text-slate-900 dark:text-white shadow-sm dark:shadow-md dark:shadow-indigo-950/50'
                    : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <div className="font-bold truncate flex items-center gap-1.5">
                    <span className="text-indigo-600 dark:text-indigo-400 font-mono">
                      #{String(lesson.order).padStart(2, '0')}
                    </span>
                    <span className="truncate">{lesson.titleVi}</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/50 shrink-0">
                    {lesson.cefrLevel}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 italic">
                  {lesson.titleEn}
                </div>
              </button>
            );
          })}
        </div>

        {/* Visual Statistics Bar (Compact 2x2 Grid in Sidebar) */}
        <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/50 text-xs">
          <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/70">
            <div className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>32</span>
              <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                Bài học
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">0 đến 6.5 IELTS</p>
          </div>

          <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/70">
            <div className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>3</span>
              <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                Chặng
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Chuẩn Quốc Tế</p>
          </div>

          <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/70">
            <div className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              <span>100%</span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              Trị lỗi dịch thầm
            </p>
          </div>

          <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/70">
            <div className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
              <span>&lt; 1s</span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              SafeHarbor Voice
            </p>
          </div>
        </div>
      </div>
    </SpeakingStepLayout>
  );
}
