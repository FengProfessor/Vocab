'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Flame,
  Award,
  ChevronLeft,
  Clock,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ShieldCheck,
  Layers,
  Volume2,
  MessageSquare,
  Zap,
  Target,
} from 'lucide-react';
import { StudentShell } from '@/components/student/StudentShell';
import { Button } from '@/components/ui/button';
import {
  SPEAKING_PHASE_CONFIGS,
  getCurriculumLessonsByPhase,
  allCurriculumLessons,
} from '@/data/speaking/curriculum';
import type { SpeakingPhaseId } from '@/types/speaking-curriculum';

export default function SpeakingCurriculumCatalogPage() {
  const [activePhase, setActivePhase] = useState<SpeakingPhaseId>('phase-1-beginner');

  const phaseTabs = [
    {
      id: 'phase-1-beginner' as SpeakingPhaseId,
      tierNumber: 1,
      title: 'Phase 1: Beginner',
      subtitle: 'A1 / 0-3.0 IELTS',
      accentColor: 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10',
      activeTabClass: 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30 border-emerald-500',
      icon: Sparkles,
    },
    {
      id: 'phase-2-elementary' as SpeakingPhaseId,
      tierNumber: 2,
      title: 'Phase 2: Elementary',
      subtitle: 'A2-B1 / 3.0-5.0 IELTS',
      accentColor: 'border-amber-500/50 text-amber-400 bg-amber-500/10',
      activeTabClass: 'bg-amber-600 text-white shadow-lg shadow-amber-900/30 border-amber-500',
      icon: Flame,
    },
    {
      id: 'phase-3-intermediate' as SpeakingPhaseId,
      tierNumber: 3,
      title: 'Phase 3: Intermediate',
      subtitle: 'B1-B2 / 5.0-6.5 IELTS',
      accentColor: 'border-indigo-500/50 text-indigo-400 bg-indigo-500/10',
      activeTabClass: 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/30 border-indigo-500',
      icon: Award,
    },
  ];

  const currentConfig = SPEAKING_PHASE_CONFIGS[activePhase];
  const activeLessons = getCurriculumLessonsByPhase(activePhase);

  return (
    <StudentShell title="Lộ Trình Speaking Chuẩn Hóa" contentClassName="p-0">
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        {/* Header Breadcrumbs */}
        <header className="sticky top-header-safe z-30 flex h-14 items-center justify-between border-b border-slate-800/80 bg-slate-900/90 px-4 backdrop-blur sm:px-8">
          <div className="flex items-center gap-3">
            <Link
              href="/student/speaking"
              className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="h-4 w-4" /> Speaking Hub
            </Link>
            <span className="text-slate-700">/</span>
            <span className="font-bold flex items-center gap-2 text-indigo-400 text-xs sm:text-sm">
              <BookOpen className="h-4 w-4" /> Lộ Trình 32 Bài Chuẩn Hóa
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/student/speaking/foundation">
              <Button
                variant="outline"
                size="sm"
                className="border-slate-800 bg-slate-900/80 text-xs text-slate-300 hover:bg-slate-800 hover:text-white hidden sm:inline-flex"
              >
                <Zap className="mr-1.5 h-3.5 w-3.5 text-amber-400" /> Khóa Nền Tảng A0-A1
              </Button>
            </Link>
          </div>
        </header>

        {/* Hero Section & Visual Statistics Bar */}
        <div className="relative border-b border-slate-800/70 bg-gradient-to-b from-slate-900 via-slate-900/80 to-slate-950 px-4 py-8 sm:px-8 sm:py-10">
          <div className="mx-auto max-w-6xl space-y-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-300">
                <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                <span>3-Tier Speaking Curriculum • Chuẩn Khung Quốc Tế</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
                Lộ Trình Luyện Nói Phản Xạ 32 Bài Học
              </h1>
              <p className="max-w-3xl text-sm sm:text-base text-slate-300 leading-relaxed">
                Phương pháp sư phạm 4 chặng khép kín: Ngữ âm trị lỗi người Việt → Khung câu cố định & Thế khối Lego → Hội thoại vi mô tương tác → Chấm điểm phản xạ SafeHarbor không áp lực.
              </p>
            </div>

            {/* Visual Statistics Bar */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 pt-2">
              <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3.5 sm:p-4 backdrop-blur">
                <div className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-indigo-400" />
                  <span>32</span>
                  <span className="text-xs font-medium text-slate-400">Bài học</span>
                </div>
                <p className="mt-1 text-xs text-slate-400">Toàn diện từ 0 đến 6.5 IELTS</p>
              </div>

              <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3.5 sm:p-4 backdrop-blur">
                <div className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                  <Target className="h-5 w-5 text-emerald-400" />
                  <span>3</span>
                  <span className="text-xs font-medium text-slate-400">Chặng (Phases)</span>
                </div>
                <p className="mt-1 text-xs text-slate-400">Beginner • Elementary • Intermediate</p>
              </div>

              <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3.5 sm:p-4 backdrop-blur">
                <div className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-amber-400" />
                  <span>100%</span>
                </div>
                <p className="mt-1 text-xs text-slate-400">Giải thích tiếng Việt & Trị lỗi dịch thầm</p>
              </div>

              <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3.5 sm:p-4 backdrop-blur">
                <div className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                  <Zap className="h-5 w-5 text-purple-400" />
                  <span>&lt; 1s</span>
                </div>
                <p className="mt-1 text-xs text-slate-400">Mục tiêu phản xạ SafeHarbor Voice</p>
              </div>
            </div>
          </div>
        </div>

        {/* Phase Tabs Selector */}
        <div className="mx-auto max-w-6xl w-full px-4 sm:px-8 pt-6 pb-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800/80">
            {phaseTabs.map((tab) => {
              const Icon = tab.icon;
              const isSelected = activePhase === tab.id;
              const phaseConfig = SPEAKING_PHASE_CONFIGS[tab.id];

              return (
                <button
                  key={tab.id}
                  onClick={() => setActivePhase(tab.id)}
                  className={`relative flex items-center gap-3 p-3.5 rounded-xl text-left transition-all duration-200 border ${
                    isSelected
                      ? `${tab.activeTabClass} border-transparent`
                      : 'border-transparent bg-slate-900/40 text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <div
                    className={`size-10 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-white/20 text-white' : tab.accentColor
                    }`}
                  >
                    <Icon className="size-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase tracking-wider font-bold opacity-80">
                        Chặng {tab.tierNumber}
                      </span>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-black/20">
                        {phaseConfig.totalLessons} bài
                      </span>
                    </div>
                    <div className="text-sm font-bold truncate mt-0.5">{tab.title}</div>
                    <div className="text-xs opacity-75 truncate">{tab.subtitle}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Phase Summary Banner */}
          <div className="mt-4 p-4 rounded-xl border border-slate-800/80 bg-slate-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Tổng quan Chặng hiện tại:
                </span>
                <span className="text-xs font-bold text-white px-2.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {currentConfig.badge}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300">{currentConfig.descriptionVi}</p>
            </div>
            <div className="text-xs text-slate-400 shrink-0 font-medium">
              Hiển thị <span className="text-white font-bold">{activeLessons.length}</span> bài học
            </div>
          </div>
        </div>

        {/* Lessons Grid */}
        <main className="mx-auto max-w-6xl w-full px-4 sm:px-8 py-6 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {activeLessons.map((lesson) => {
              const lessonRoute = `/student/speaking/curriculum/${lesson.phaseId}/${lesson.id}`;

              return (
                <div
                  key={lesson.id}
                  className="group relative flex flex-col justify-between rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 sm:p-6 transition-all duration-200 hover:border-indigo-500/50 hover:bg-slate-900/90 hover:shadow-xl hover:shadow-indigo-950/20"
                >
                  <div className="space-y-3">
                    {/* Top Row: Badges & Duration */}
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center text-xs font-extrabold px-2.5 py-1 rounded-md bg-slate-800 text-indigo-400 border border-slate-700">
                          Bài {String(lesson.order).padStart(2, '0')}
                        </span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                          {lesson.cefrLevel}
                        </span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
                          IELTS {lesson.targetBandIelts}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        <span>{lesson.estimatedMinutes} phút</span>
                      </div>
                    </div>

                    {/* Lesson Titles */}
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">
                        {lesson.titleVi}
                      </h3>
                      <p className="text-xs sm:text-sm font-medium text-slate-400 italic mt-0.5">
                        {lesson.titleEn}
                      </p>
                    </div>

                    {/* Summary */}
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed line-clamp-2">
                      {lesson.summaryVi}
                    </p>

                    {/* 4-Stage Feature Checklist */}
                    <div className="pt-2 border-t border-slate-800/60 grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Volume2 className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                        <span className="truncate">
                          Âm trọng tâm: <strong className="text-slate-200">{lesson.stage1Phonetics.focusSound}</strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Layers className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                        <span className="truncate">Thế khối Lego <strong className="text-slate-200">&lt;1s</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MessageSquare className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                        <span className="truncate">Hội thoại <strong className="text-slate-200">{lesson.stage3GuidedDialogue.turns.length} lượt</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate">SafeHarbor: <strong className="text-slate-200">&ge;{lesson.stage4SafeHarborEvaluation.minimumPassingScore}%</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Action Button */}
                  <div className="pt-4 mt-4 border-t border-slate-800/60 flex items-center justify-between">
                    <div className="text-[11px] text-slate-400">
                      Chuẩn phương pháp 4 chặng
                    </div>
                    <Link href={lessonRoute}>
                      <Button
                        size="sm"
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-3.5 group-hover:shadow-md group-hover:shadow-indigo-600/30 transition-all flex items-center gap-1.5"
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
        </main>
      </div>
    </StudentShell>
  );
}
