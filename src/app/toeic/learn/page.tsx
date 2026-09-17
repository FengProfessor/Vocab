'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  BookOpen,
  FileText,
  Layers,
  Sparkles,
  Menu,
  Play,
  CheckCircle2,
  HelpCircle,
  Clock,
  ShieldCheck,
  Award,
  ListOrdered,
  MonitorPlay,
} from 'lucide-react';
import {
  getAllModules,
  getAllLessons,
  getLessonById,
  getLessonBySlug,
  getAdjacentLessons,
  getCurriculumStats,
} from '@/data/toeic/theory';
import type { TheoryLesson } from '@/data/toeic/theory/types';
import {
  ToeicCurriculumNavigator,
  ToeicLessonViewer,
  ToeicCourseSyllabus,
  ToeicCertificateModal,
} from '@/components/toeic/learn';

type ViewMode = 'classroom' | 'syllabus';

function ToeicLearnContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const modules = useMemo(() => getAllModules(), []);
  const allLessons = useMemo(() => getAllLessons(), []);
  const stats = useMemo(() => getCurriculumStats(), []);

  // Determine view mode from URL (?view=syllabus or ?view=classroom)
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const vParam = searchParams.get('view');
    if (vParam === 'syllabus') return 'syllabus';
    return 'classroom';
  });

  // Determine initial lesson from search params (?lesson=id or ?slug=slug)
  const initialLesson = useMemo(() => {
    const lessonParam = searchParams.get('lesson');
    const slugParam = searchParams.get('slug');

    if (lessonParam) {
      const found = getLessonById(lessonParam);
      if (found) return found;
    }
    if (slugParam) {
      const found = getLessonBySlug(slugParam);
      if (found) return found;
    }
    return allLessons[0] || null;
  }, [searchParams, allLessons]);

  const [activeLessonId, setActiveLessonId] = useState<string>(
    initialLesson?.id || allLessons[0]?.id || ''
  );
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(new Set());
  const [isHydrated, setIsHydrated] = useState<boolean>(false);
  const [isCertModalOpen, setIsCertModalOpen] = useState<boolean>(false);

  // Hydrate completed lessons safely from localStorage
  useEffect(() => {
    setIsHydrated(true);
    try {
      const saved = localStorage.getItem('lingo_toeic_completed_lessons');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setCompletedLessonIds(new Set(parsed));
        }
      }
    } catch {
      // Ignore localStorage read errors
    }
  }, []);

  // Sync state when URL params change
  useEffect(() => {
    const vParam = searchParams.get('view');
    if (vParam === 'syllabus' && viewMode !== 'syllabus') {
      setViewMode('syllabus');
    } else if (vParam === 'classroom' && viewMode !== 'classroom') {
      setViewMode('classroom');
    }

    const lessonParam = searchParams.get('lesson');
    const slugParam = searchParams.get('slug');
    if (lessonParam) {
      const found = getLessonById(lessonParam);
      if (found && found.id !== activeLessonId) {
        setActiveLessonId(found.id);
      }
    } else if (slugParam) {
      const found = getLessonBySlug(slugParam);
      if (found && found.id !== activeLessonId) {
        setActiveLessonId(found.id);
      }
    }
  }, [searchParams, activeLessonId, viewMode]);

  // Current active lesson object
  const currentLesson: TheoryLesson | undefined = useMemo(() => {
    return getLessonById(activeLessonId) || allLessons[0];
  }, [activeLessonId, allLessons]);

  // Get adjacent lessons for next/prev navigation
  const { prevLesson, nextLesson } = useMemo(() => {
    return currentLesson ? getAdjacentLessons(currentLesson.id) : { prevLesson: undefined, nextLesson: undefined };
  }, [currentLesson]);

  // Handle lesson selection & switch to classroom mode
  const handleSelectLesson = (lessonId: string) => {
    setActiveLessonId(lessonId);
    setViewMode('classroom');
    setIsMobileDrawerOpen(false);

    // Smooth scroll to top of lesson content
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    const lesson = getLessonById(lessonId);
    if (lesson) {
      // Clean query parameter update without full page reload
      const url = new URL(window.location.href);
      url.searchParams.set('lesson', lesson.id);
      url.searchParams.delete('slug');
      url.searchParams.delete('view');
      window.history.replaceState({}, '', url.toString());

      // Update dynamic document title
      document.title = `${lesson.title} — Cẩm Nang Lý Thuyết & Chiến Thuật TOEIC | LingoPro`;
    }
  };

  // Toggle view mode
  const handleSwitchViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      const url = new URL(window.location.href);
      if (mode === 'syllabus') {
        url.searchParams.set('view', 'syllabus');
        document.title = `Giáo Trình & Tiến Độ TOEIC — Khóa Học Toàn Diện | LingoPro`;
      } else {
        url.searchParams.delete('view');
        if (currentLesson) {
          url.searchParams.set('lesson', currentLesson.id);
          document.title = `${currentLesson.title} — Cẩm Nang Lý Thuyết & Chiến Thuật TOEIC | LingoPro`;
        }
      }
      window.history.replaceState({}, '', url.toString());
    }
  };

  // Handle checkpoint completion (auto-mark lesson complete if all done)
  const handleCheckpointComplete = (checkpointId: string) => {
    if (!currentLesson) return;
    try {
      const quizStorage = localStorage.getItem(`lingo_toeic_theory_quiz_${currentLesson.id}`);
      if (quizStorage) {
        const answers = JSON.parse(quizStorage);
        if (
          typeof answers === 'object' &&
          answers !== null &&
          Object.keys(answers).length >= currentLesson.checkpoints.length
        ) {
          // All checkpoints answered, mark lesson completed
          setCompletedLessonIds(prev => {
            const next = new Set(prev);
            next.add(currentLesson.id);
            try {
              localStorage.setItem('lingo_toeic_completed_lessons', JSON.stringify(Array.from(next)));
            } catch {
              // Ignore write error
            }
            return next;
          });
        }
      }
    } catch {
      // Ignore json parse error
    }
  };

  // Toggle mark lesson as complete manually
  const handleToggleCompleteLesson = () => {
    if (!currentLesson) return;
    setCompletedLessonIds(prev => {
      const next = new Set(prev);
      if (next.has(currentLesson.id)) {
        next.delete(currentLesson.id);
      } else {
        next.add(currentLesson.id);
      }
      try {
        localStorage.setItem('lingo_toeic_completed_lessons', JSON.stringify(Array.from(next)));
      } catch {
        // Ignore write error
      }
      return next;
    });
  };

  // Update dynamic document title on mount & lesson change
  useEffect(() => {
    if (viewMode === 'syllabus') {
      document.title = `Giáo Trình & Tiến Độ TOEIC — Khóa Học Toàn Diện | LingoPro`;
    } else if (currentLesson) {
      document.title = `${currentLesson.title} — Cẩm Nang Lý Thuyết & Chiến Thuật TOEIC | LingoPro`;
    }
  }, [currentLesson, viewMode]);

  if (!currentLesson) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 text-center font-mono text-sm text-slate-500">
        Đang tải chương trình học lý thuyết TOEIC...
      </div>
    );
  }

  const isCurrentLessonCompleted = isHydrated && completedLessonIds.has(currentLesson.id);
  const completedCount = completedLessonIds.size;
  const isCourseMastered = completedCount >= stats.totalLessons;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased font-sans flex flex-col justify-between">
      {/* ── 1. HIGH-AUTHORITY TECHNICAL HEADER ── */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-30 shadow-2xs">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Breadcrumb & Subsystem Title */}
            <div>
              <div className="flex items-center gap-2 font-mono text-xs text-slate-500 dark:text-slate-400">
                <Link href="/" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                  LingoPro
                </Link>
                <span>/</span>
                <Link href="/toeic" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                  Khảo Thí TOEIC
                </Link>
                <span>/</span>
                <button
                  type="button"
                  onClick={() => handleSwitchViewMode('syllabus')}
                  className="text-slate-800 dark:text-slate-200 font-semibold hover:underline cursor-pointer"
                >
                  Lý Thuyết & Chiến Thuật
                </button>
                {viewMode === 'classroom' && (
                  <>
                    <span>/</span>
                    <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">
                      {currentLesson.id}
                    </span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-3 mt-1">
                <h1 className="text-base sm:text-lg font-black tracking-tight uppercase text-slate-900 dark:text-white flex items-center gap-2">
                  <BookOpen className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400" />
                  <span>Chuyên Khóa Lý Thuyết & Chiến Thuật TOEIC</span>
                </h1>
                <span className="hidden sm:inline-block font-mono text-[10px] font-bold px-2 py-0.5 rounded-xs bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                  [{completedCount}/{stats.totalLessons} Bài Hoàn Thành]
                </span>
              </div>
            </div>

            {/* Top View Mode Switcher & Quick Actions */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Classroom vs Syllabus Toggle */}
              <div className="inline-flex rounded-xs border border-slate-300 dark:border-slate-700 p-0.5 bg-slate-100 dark:bg-slate-800 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => handleSwitchViewMode('classroom')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-xs transition cursor-pointer font-bold ${
                    viewMode === 'classroom'
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="Chế độ lớp học chuyên sâu từng bài"
                >
                  <MonitorPlay className="h-3.5 w-3.5" />
                  <span>Lớp Học</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSwitchViewMode('syllabus')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-xs transition cursor-pointer font-bold ${
                    viewMode === 'syllabus'
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="Chế độ xem tổng quan giáo trình theo tuần"
                >
                  <ListOrdered className="h-3.5 w-3.5" />
                  <span>Giáo Trình</span>
                </button>
              </div>

              {/* Certificate button */}
              <button
                type="button"
                onClick={() => setIsCertModalOpen(true)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-xs border font-mono text-xs font-semibold transition cursor-pointer ${
                  isCourseMastered
                    ? 'border-amber-400 bg-amber-500 text-slate-950 font-bold hover:bg-amber-400'
                    : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
                title="Xem chứng chỉ tốt nghiệp khóa học"
              >
                <Award className="h-3.5 w-3.5 text-amber-500" />
                <span className="hidden sm:inline">Chứng Chỉ</span>
              </button>

              {/* In Classroom mode: Mark complete button */}
              {viewMode === 'classroom' && (
                <button
                  type="button"
                  onClick={handleToggleCompleteLesson}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xs border text-xs font-mono font-semibold transition-all cursor-pointer select-none ${
                    isCurrentLessonCompleted
                      ? 'border-emerald-400 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                      : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600'
                  }`}
                  title="Đánh dấu bài học này là đã học xong"
                >
                  <CheckCircle2
                    className={`h-3.5 w-3.5 ${
                      isCurrentLessonCompleted
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-400'
                    }`}
                  />
                  <span>{isCurrentLessonCompleted ? 'Đã xong' : 'Đánh dấu đã học'}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── SEGMENTED NAVIGATION TAB STRIP (Full Test / Part Practice / Learn) ── */}
        <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 p-1.5 sm:p-2">
          <div className="mx-auto max-w-7xl">
            <div
              role="tablist"
              aria-label="Điều hướng phân hệ TOEIC"
              className="flex p-0.5 rounded-sm bg-slate-200/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 gap-1 text-xs font-mono"
            >
              {/* Tab 1: Đề Thi Full Test */}
              <Link
                href="/toeic?tab=full_test"
                className="flex-1 py-1.5 px-2 rounded-xs font-semibold flex items-center justify-center gap-1.5 transition text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50"
              >
                <FileText className="h-3.5 w-3.5 shrink-0" />
                <span className="font-bold truncate">Đề Full Test</span>
                <span className="hidden sm:inline text-[10px] opacity-75">(120 Phút)</span>
              </Link>

              {/* Tab 2: Luyện Từng Part */}
              <Link
                href="/toeic?tab=practice_parts"
                className="flex-1 py-1.5 px-2 rounded-xs font-semibold flex items-center justify-center gap-1.5 transition text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50"
              >
                <Layers className="h-3.5 w-3.5 shrink-0" />
                <span className="font-bold truncate">Luyện Từng Part</span>
                <span className="hidden sm:inline text-[10px] opacity-75">(Part 1–7)</span>
              </Link>

              {/* Tab 3: Cẩm Nang Lý Thuyết (ACTIVE) */}
              <Link
                href="/toeic/learn"
                className="flex-1 py-1.5 px-2 rounded-xs font-semibold flex items-center justify-center gap-1.5 transition bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs font-bold"
              >
                <BookOpen className="h-3.5 w-3.5 shrink-0 text-amber-400 dark:text-amber-600" />
                <span className="font-bold truncate">Lý Thuyết & Chiến Thuật</span>
                <span className="text-[10px] font-mono px-1 py-0.2 rounded-xs bg-white/20 dark:bg-slate-900/20 text-white dark:text-slate-900 font-bold shrink-0">
                  [{stats.totalLessons}]
                </span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ── 2. MAIN BODY: CLASSROOM VS SYLLABUS VIEW ── */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 flex-1 w-full">
        {viewMode === 'syllabus' ? (
          /* ── SYLLABUS DASHBOARD VIEW ── */
          <ToeicCourseSyllabus
            modules={modules}
            completedLessonIds={completedLessonIds}
            activeLessonId={currentLesson.id}
            onSelectLesson={handleSelectLesson}
            onOpenCertificate={() => setIsCertModalOpen(true)}
          />
        ) : (
          /* ── 2-COLUMN CLASSROOM LESSON WORKSPACE ── */
          <div className="flex items-start gap-8">
            {/* Left Column: Persistent Desktop Navigator */}
            <aside className="hidden lg:block w-80 shrink-0 sticky top-28 max-h-[calc(100vh-8.5rem)]">
              <ToeicCurriculumNavigator
                modules={modules}
                activeLessonId={currentLesson.id}
                onSelectLesson={handleSelectLesson}
                completedLessonIds={completedLessonIds}
                className="h-[calc(100vh-8.5rem)]"
              />
            </aside>

            {/* Right Column: Interactive Lesson Workspace (5 Tabs) */}
            <div className="flex-1 min-w-0">
              <ToeicLessonViewer
                lesson={currentLesson}
                onCheckpointComplete={handleCheckpointComplete}
                prevLesson={prevLesson}
                nextLesson={nextLesson}
                onSelectLesson={handleSelectLesson}
              />
            </div>
          </div>
        )}
      </main>

      {/* ── 3. MOBILE STICKY BOTTOM CONTROL BAR (In Classroom Mode) ── */}
      {viewMode === 'classroom' && (
        <div className="lg:hidden sticky bottom-0 z-40 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs p-2.5 shadow-lg">
          <div className="flex items-center justify-between gap-2 max-w-md mx-auto">
            {/* Drawer Toggle */}
            <button
              type="button"
              onClick={() => setIsMobileDrawerOpen(true)}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
            >
              <Menu className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              <span>Mục Lục ({stats.totalLessons})</span>
            </button>

            {/* Instant Practice CTA */}
            <Link
              href={
                currentLesson.bridgeToPractice?.practiceUrl ||
                `/toeic/exam/bank?part=${currentLesson.targetPart}&limit=${currentLesson.bridgeToPractice?.recommendedQuestionCount||15}&mode=practice&filterMode=unseen`
              }
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xs bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-mono text-xs font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition shadow-xs"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span className="truncate">{currentLesson.bridgeToPractice?.ctaText || `Luyện Part ${currentLesson.targetPart}`}</span>
            </Link>
          </div>
        </div>
      )}

      {/* ── 4. MOBILE DRAWER OVERLAY ── */}
      {viewMode === 'classroom' && (
        <ToeicCurriculumNavigator
          modules={modules}
          activeLessonId={currentLesson.id}
          onSelectLesson={handleSelectLesson}
          completedLessonIds={completedLessonIds}
          isMobileOpen={isMobileDrawerOpen}
          setIsMobileOpen={setIsMobileDrawerOpen}
        />
      )}

      {/* ── 5. CERTIFICATE OF COMPLETION MODAL ── */}
      <ToeicCertificateModal
        isOpen={isCertModalOpen}
        onClose={() => setIsCertModalOpen(false)}
        totalLessonsCompleted={completedCount}
        totalCheckpointsPassed={stats.totalCheckpoints}
      />
    </div>
  );
}

function ToeicLearnLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8 flex items-center justify-center">
      <div className="max-w-md w-full p-6 rounded-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center space-y-3 shadow-xs">
        <div className="flex justify-center">
          <BookOpen className="h-8 w-8 text-amber-600 animate-pulse" />
        </div>
        <div className="font-mono text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          Đang tải giáo trình lý thuyết TOEIC...
        </div>
        <div className="text-xs text-slate-500">
          Khởi tạo hệ thống bài học và bộ câu hỏi checkpoint
        </div>
      </div>
    </div>
  );
}

export default function ToeicLearnPage() {
  return (
    <Suspense fallback={<ToeicLearnLoadingSkeleton />}>
      <ToeicLearnContent />
    </Suspense>
  );
}
