'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Play,
  Award,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ShieldCheck,
  Zap,
  Layers,
  ArrowRight,
  GraduationCap,
  FileCheck,
} from 'lucide-react';
import type { TheoryModule, TheoryLesson } from '@/data/toeic/theory/types';

export interface ToeicCourseSyllabusProps {
  modules: TheoryModule[];
  completedLessonIds: Set<string>;
  activeLessonId?: string;
  onSelectLesson: (lessonId: string) => void;
  onOpenCertificate: () => void;
  className?: string;
}

export function ToeicCourseSyllabus({
  modules,
  completedLessonIds,
  activeLessonId,
  onSelectLesson,
  onOpenCertificate,
  className = '',
}: ToeicCourseSyllabusProps) {
  const allLessons = modules.flatMap((m) => m.lessons);
  const totalLessons = allLessons.length;
  const completedCount = completedLessonIds.size;
  const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
  const isAllCompleted = totalLessons > 0 && completedCount >= totalLessons;

  // Find resume lesson (active lesson or first uncompleted lesson)
  const resumeLesson =
    allLessons.find((l) => l.id === activeLessonId) ||
    allLessons.find((l) => !completedLessonIds.has(l.id)) ||
    allLessons[0];

  // Remaining time in minutes
  const remainingMinutes = allLessons
    .filter((l) => !completedLessonIds.has(l.id))
    .reduce((sum, l) => sum + (l.estimatedMinutes || 15), 0);
  const remainingHours = (remainingMinutes / 60).toFixed(1);

  // Expanded modules state
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({
    'grammar-foundation': true,
    'listening-tactics': true,
    'reading-mastery': true,
  });

  const toggleModule = (modId: string) => {
    setExpandedModules((prev) => ({
      ...prev,
      [modId]: !prev[modId],
    }));
  };

  return (
    <div className={`space-y-8 max-w-5xl mx-auto ${className}`}>
      {/* ── 1. COURSERA-STYLE COURSE HERO BANNER ── */}
      <div className="rounded-sm border-2 border-slate-900 dark:border-slate-700 bg-slate-900 text-white p-6 sm:p-8 space-y-6 shadow-md">
        <div className="space-y-3">
          {/* Badges strip */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[10px] sm:text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-xs bg-amber-500 text-slate-950">
              Format Chuẩn ETS 2026
            </span>
            <span className="font-mono text-[10px] sm:text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-xs bg-slate-800 text-slate-300 border border-slate-700">
              Chương Trình Chuyên Sâu 450–850+
            </span>
            <span className="font-mono text-[10px] sm:text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-xs bg-slate-800 text-slate-300 border border-slate-700">
              {totalLessons} Bài Học · 61 Checkpoints
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white uppercase">
            Chuyên Khảo Chiến Thuật & Toàn Diện TOEIC
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-3xl leading-relaxed">
            Hệ thống hóa toàn bộ công thức ngữ pháp Part 5 & 6, kỹ thuật nhịp điệu vàng 30s Part 1–4 và chiến thuật quản trị thời gian 55 phút Part 7. Chắt lọc từ các giáo trình kinh điển thế giới.
          </p>
        </div>

        {/* Academic Sources Box */}
        <div className="rounded-xs border border-slate-700 bg-slate-800/80 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono text-slate-300">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-amber-400 shrink-0" />
            <span>Nguồn học liệu chính khóa:</span>
            <span className="text-white font-bold">Hackers TOEIC Start · Tactics for TOEIC · Tomato TOEIC · Very Easy TOEIC</span>
          </div>
          <span className="text-emerald-400 font-bold shrink-0">100% Số Hóa Tương Tác</span>
        </div>

        {/* ── RESUME LEARNING HERO CARD ── */}
        {resumeLesson && (
          <div className="rounded-xs border border-amber-500/40 bg-amber-500/10 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-xs bg-amber-500 text-slate-950">
                  {completedLessonIds.has(resumeLesson.id) ? 'Đã học gần đây' : 'Đang học dở'}
                </span>
                <span className="font-mono text-xs text-amber-300 font-semibold">
                  Part {resumeLesson.targetPart} · {resumeLesson.id}
                </span>
              </div>

              <h3 className="font-mono text-base sm:text-lg font-bold text-white">
                {resumeLesson.title}
              </h3>

              <p className="text-xs text-slate-300">
                {resumeLesson.englishTitle} · Thời lượng: ~{resumeLesson.estimatedMinutes} phút
              </p>
            </div>

            <button
              type="button"
              onClick={() => onSelectLesson(resumeLesson.id)}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono text-xs sm:text-sm font-bold transition shadow-md cursor-pointer shrink-0"
            >
              <Play className="h-4 w-4 fill-current" />
              <span>Tiếp Tục Bài Học Này</span>
            </button>
          </div>
        )}
      </div>

      {/* ── 2. OVERALL PROGRESS & CERTIFICATE TRACKER ── */}
      <div className="rounded-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs text-slate-500">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span>TIẾN ĐỘ HOÀN THÀNH KHÓA HỌC</span>
            </div>
            <div className="font-mono text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {progressPercent}% <span className="text-xs sm:text-sm font-normal text-slate-500">({completedCount}/{totalLessons} bài học hoàn thành)</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="font-mono text-xs text-slate-500">Thời gian học ước tính còn lại:</div>
              <div className="font-mono text-sm font-bold text-slate-800 dark:text-slate-200">
                ~{remainingHours} giờ ({remainingMinutes} phút)
              </div>
            </div>

            {/* Certificate Trigger Button */}
            <button
              type="button"
              onClick={onOpenCertificate}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xs border font-mono text-xs font-bold transition cursor-pointer shadow-xs ${
                isAllCompleted
                  ? 'border-amber-400 bg-amber-500 text-slate-950 hover:bg-amber-400'
                  : 'border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Award className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span>{isAllCompleted ? 'Nhận Chứng Chỉ Tốt Nghiệp' : 'Xem Mẫu Chứng Chỉ'}</span>
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all duration-500 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* ── 3. WEEK-BY-WEEK / MODULE-BY-MODULE SYLLABUS ACCORDION ── */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-mono font-bold uppercase tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <span>Mục Lục Chương Trình Đào Tạo (Syllabus)</span>
          </h2>
          <span className="font-mono text-xs text-slate-500">3 Chặng Học Tập</span>
        </div>

        {modules.map((mod, modIdx) => {
          const isExpanded = expandedModules[mod.id] ?? true;
          const modCompletedCount = mod.lessons.filter((l) => completedLessonIds.has(l.id)).length;
          const modTotal = mod.lessons.length;
          const modPercent = Math.round((modCompletedCount / modTotal) * 100);

          return (
            <div
              key={mod.id}
              className="rounded-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs"
            >
              {/* Module Accordion Header */}
              <button
                type="button"
                onClick={() => toggleModule(mod.id)}
                className="w-full text-left p-5 sm:p-6 bg-slate-50/80 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition flex items-center justify-between gap-4 cursor-pointer"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded-xs bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                      Chặng {modIdx + 1}
                    </span>
                    <span className="font-mono text-xs font-semibold text-slate-500">
                      {mod.targetParts.map((p) => `Part ${p}`).join(', ')}
                    </span>
                  </div>

                  <h3 className="font-mono text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                    {mod.title}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1">
                    {mod.description}
                  </p>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  {/* Module completion badge */}
                  <div className="text-right font-mono">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {modCompletedCount}/{modTotal} bài
                    </div>
                    <div className="text-[10px] text-slate-500">{modPercent}%</div>
                  </div>

                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-slate-400" />
                  )}
                </div>
              </button>

              {/* Module Lessons List */}
              {isExpanded && (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {mod.lessons.map((lesson) => {
                    const isCompleted = completedLessonIds.has(lesson.id);
                    const isCurrent = lesson.id === activeLessonId;

                    return (
                      <div
                        key={lesson.id}
                        className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition ${
                          isCurrent
                            ? 'bg-amber-50/50 dark:bg-amber-950/20'
                            : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        {/* Lesson title & details */}
                        <div className="flex items-start gap-3 min-w-0">
                          {/* Completion status icon */}
                          <div className="mt-0.5 shrink-0">
                            {isCompleted ? (
                              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                            ) : isCurrent ? (
                              <span className="flex h-5 w-5 rounded-full border-2 border-amber-500 items-center justify-center">
                                <span className="h-2 w-2 rounded-full bg-amber-500" />
                              </span>
                            ) : (
                              <span className="flex h-5 w-5 rounded-full border-2 border-slate-300 dark:border-slate-700" />
                            )}
                          </div>

                          <div className="space-y-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                {lesson.id}
                              </span>
                              <span className="font-mono text-[11px] text-slate-500">
                                Part {lesson.targetPart}
                              </span>
                              <span className="font-mono text-[11px] text-slate-400 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {lesson.estimatedMinutes} phút
                              </span>
                            </div>

                            <h4 className="font-mono text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                              {lesson.title}
                            </h4>

                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {lesson.englishTitle} · {lesson.checkpoints.length} câu checkpoints
                            </p>
                          </div>
                        </div>

                        {/* Action CTA */}
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <button
                            type="button"
                            onClick={() => onSelectLesson(lesson.id)}
                            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xs font-mono text-xs font-bold transition cursor-pointer ${
                              isCurrent
                                ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-xs'
                                : isCompleted
                                ? 'border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                                : 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 shadow-xs'
                            }`}
                          >
                            <span>{isCompleted ? 'Xem lại' : isCurrent ? 'Đang học' : 'Học bài này'}</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
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
