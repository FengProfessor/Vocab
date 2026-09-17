'use client';

import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Headphones,
  FileText,
  Search,
  CheckCircle2,
  Clock,
  ChevronRight,
  X,
  Layers,
  Sparkles,
} from 'lucide-react';
import type { TheoryModule, TheoryModuleId, TheoryLesson } from '@/data/toeic/theory/types';

export interface ToeicCurriculumNavigatorProps {
  modules: TheoryModule[];
  activeLessonId: string;
  onSelectLesson: (id: string) => void;
  completedLessonIds?: Set<string>;
  isMobileOpen?: boolean;
  setIsMobileOpen?: (open: boolean) => void;
  className?: string;
}

export function ToeicCurriculumNavigator({
  modules,
  activeLessonId,
  onSelectLesson,
  completedLessonIds = new Set(),
  isMobileOpen = false,
  setIsMobileOpen,
  className = '',
}: ToeicCurriculumNavigatorProps) {
  const [selectedModuleId, setSelectedModuleId] = useState<TheoryModuleId | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Icon mapping for modules
  const getModuleIcon = (id: TheoryModuleId) => {
    switch (id) {
      case 'grammar-foundation':
        return BookOpen;
      case 'listening-tactics':
        return Headphones;
      case 'reading-mastery':
        return FileText;
      default:
        return Layers;
    }
  };

  // Flatten all lessons
  const allLessons = useMemo(() => {
    return modules.flatMap(m => m.lessons);
  }, [modules]);

  // Overall progress
  const totalLessons = allLessons.length;
  const completedCount = completedLessonIds.size;
  const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  // Filter lessons based on module tab & search query
  const filteredLessons = useMemo(() => {
    return allLessons.filter(lesson => {
      const matchModule = selectedModuleId === 'all' || lesson.moduleId === selectedModuleId;
      if (!matchModule) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase().trim();
      return (
        lesson.title.toLowerCase().includes(q) ||
        lesson.englishTitle.toLowerCase().includes(q) ||
        lesson.slug.toLowerCase().includes(q) ||
        `part ${lesson.targetPart}`.toLowerCase().includes(q)
      );
    });
  }, [allLessons, selectedModuleId, searchQuery]);

  // Helper to generate a short lesson code: G01, L01, R01
  const getLessonCode = (lesson: TheoryLesson) => {
    const prefix =
      lesson.moduleId === 'grammar-foundation'
        ? 'G'
        : lesson.moduleId === 'listening-tactics'
        ? 'L'
        : 'R';
    const num = String(lesson.order).padStart(2, '0');
    return `${prefix}${num}`;
  };

  const content = (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900">
      {/* ── Navigator Header & Progress ── */}
      <div className="p-3.5 sm:p-4 border-b border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-slate-700 dark:text-slate-300" />
            <h3 className="font-mono text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Chương Trình Lý Thuyết
            </h3>
          </div>
          {setIsMobileOpen && (
            <button
              type="button"
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden p-1 rounded-xs hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
              aria-label="Đóng danh mục"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
            <span>Tiến độ học</span>
            <span className="font-bold tabular-nums text-slate-800 dark:text-slate-200">
              {completedCount}/{totalLessons} ({progressPercent}%)
            </span>
          </div>
          <div className="h-1.5 w-full rounded-xs bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-300 rounded-xs"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Search Box */}
        <div className="relative">
          <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Tìm bài học, chủ điểm..."
            className="w-full pl-8 pr-7 py-1.5 rounded-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-slate-400 dark:focus:ring-slate-500 font-sans"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* 3-Stage Switcher Pills */}
        <div className="flex items-center gap-1 p-0.5 rounded-xs bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-[11px] font-mono">
          <button
            type="button"
            onClick={() => setSelectedModuleId('all')}
            className={`flex-1 py-1.5 px-1.5 rounded-xs font-semibold text-center transition-all cursor-pointer ${
              selectedModuleId === 'all'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Tất cả ({totalLessons})
          </button>
          {modules.map(mod => {
            const isSelected = selectedModuleId === mod.id;
            const Icon = getModuleIcon(mod.id);
            return (
              <button
                key={mod.id}
                type="button"
                onClick={() => setSelectedModuleId(mod.id)}
                title={mod.title}
                className={`flex-1 py-1.5 px-1.5 rounded-xs font-semibold text-center transition-all flex items-center justify-center gap-1 cursor-pointer truncate ${
                  isSelected
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className="h-3 w-3 shrink-0" />
                <span className="truncate">{mod.shortTitle}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Scrollable Lesson List ── */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-2.5 space-y-1">
        {filteredLessons.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
            Không tìm thấy bài học phù hợp với &quot;{searchQuery}&quot;
          </div>
        ) : (
          filteredLessons.map(lesson => {
            const isActive = lesson.id === activeLessonId;
            const isCompleted = completedLessonIds.has(lesson.id);
            const code = getLessonCode(lesson);

            return (
              <button
                key={lesson.id}
                type="button"
                onClick={() => {
                  onSelectLesson(lesson.id);
                  if (setIsMobileOpen) setIsMobileOpen(false);
                }}
                className={`w-full text-left p-2.5 rounded-xs border transition-all cursor-pointer select-none group ${
                  isActive
                    ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900 shadow-xs'
                    : 'border-transparent hover:border-slate-200 dark:hover:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-200'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {/* Lesson Code Pill */}
                  <span
                    className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-xs shrink-0 mt-0.5 tabular-nums border ${
                      isActive
                        ? 'bg-white/10 text-white border-white/20 dark:bg-slate-900/10 dark:text-slate-900 dark:border-slate-900/20'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {code}
                  </span>

                  {/* Lesson Title & Subtitle */}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold leading-snug truncate">
                      {lesson.title}
                    </div>
                    <div
                      className={`text-[11px] leading-tight truncate mt-0.5 ${
                        isActive ? 'text-slate-300 dark:text-slate-600' : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {lesson.englishTitle}
                    </div>

                    {/* Badges Footer */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2 text-[10px] font-mono">
                      <span
                        className={`px-1.5 py-0.2 rounded-xs ${
                          isActive
                            ? 'bg-white/15 text-white dark:bg-slate-900/15 dark:text-slate-900'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        Part {lesson.targetPart}
                      </span>
                      <span
                        className={`flex items-center gap-0.5 ${
                          isActive ? 'text-slate-300 dark:text-slate-600' : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        <Clock className="h-2.5 w-2.5" />
                        {lesson.estimatedMinutes}m
                      </span>
                      <span
                        className={`flex items-center gap-0.5 ${
                          isActive ? 'text-slate-300 dark:text-slate-600' : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        <Sparkles className="h-2.5 w-2.5" />
                        {lesson.checkpoints.length} Qs
                      </span>
                    </div>
                  </div>

                  {/* Completion Checkmark or Chevron */}
                  <div className="shrink-0 mt-0.5">
                    {isCompleted ? (
                      <CheckCircle2
                        className={`h-4 w-4 ${
                          isActive
                            ? 'text-emerald-300 dark:text-emerald-700'
                            : 'text-emerald-500'
                        }`}
                      />
                    ) : (
                      <ChevronRight
                        className={`h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity ${
                          isActive
                            ? 'opacity-100 text-white dark:text-slate-900'
                            : 'text-slate-400'
                        }`}
                      />
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <nav
        aria-label="Mục lục bài học lý thuyết"
        className={`hidden lg:flex flex-col rounded-sm border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden ${className}`}
      >
        {content}
      </nav>

      {/* Mobile Slide-Over Drawer */}
      {isMobileOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Mục lục bài học lý thuyết di động"
          className="fixed inset-0 z-50 flex lg:hidden"
        >
          {/* Backdrop */}
          <div
            onClick={() => setIsMobileOpen?.(false)}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in"
          />

          {/* Drawer Sheet */}
          <div className="relative z-10 w-5/6 max-w-sm h-full shadow-xl animate-in slide-in-from-left duration-200">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
