'use client';

import { useEffect, useRef, useSyncExternalStore } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  X,
  Zap,
  BookOpen,
  Headphones,
  FileText,
  Keyboard,
  Target,
  Layers,
  Video,
} from 'lucide-react';
import { getNetworkPolicy } from '@/lib/offline/network-policy';

function useIsDesktop(breakpoint = 768): boolean {
  return useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === 'undefined') return () => {};
      const mql = window.matchMedia(`(min-width: ${breakpoint}px)`);
      mql.addEventListener('change', onStoreChange);
      return () => mql.removeEventListener('change', onStoreChange);
    },
    () => (typeof window !== 'undefined' ? window.matchMedia(`(min-width: ${breakpoint}px)`).matches : false),
    () => false,
  );
}

export type ActionSelectionType =
  | 'review'
  | 'listening'
  | 'learn'
  | 'reading'
  | 'toeic';

interface ModalOption {
  id: string;
  icon: React.ReactNode;
  title: string;
  description?: string;
  href?: string;
  onClick?: () => void;
  badge?: string;
  badgeColor?: string;
  iconBg?: string;
}

interface ActionSelectionModalProps {
  type: ActionSelectionType | null;
  onClose: () => void;
  reviewDueCount?: number;
  newCount?: number;
  currentClassScope?: string | null;
}

export function ActionSelectionModal({
  type,
  onClose,
  reviewDueCount = 0,
  newCount = 0,
  currentClassScope,
}: ActionSelectionModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const isDesktop = useIsDesktop();
  const router = useRouter();
  const canPrefetch = getNetworkPolicy().canPrefetchRoutes;

  // Đóng khi ấn Escape & prefetch modal routes khi mở (nếu mạng cho phép)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (type) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
      if (getNetworkPolicy().canPrefetchRoutes) {
        const routesByType: Record<ActionSelectionType, string[]> = {
          review: ['/review/session'],
          listening: ['/practice/listening', '/sat-thu-toeic-listening'],
          reading: ['/practice/daily-reading', '/practice/pack-reading', '/toeic'],
          learn: ['/flashcard', '/import', '/library'],
          toeic: ['/toeic', '/toeic/learn'],
        };
        for (const r of routesByType[type] ?? []) {
          try {
            router.prefetch(r);
          } catch {
            // ignore
          }
        }
      }
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [type, onClose, router]);

  if (!type) return null;

  const withClass = (href: string) => {
    if (!currentClassScope || currentClassScope === '__personal__') return href;
    const join = href.includes('?') ? '&' : '?';
    return `${href}${join}class=${encodeURIComponent(currentClassScope)}`;
  };

  let title = '';
  let titleBadge: React.ReactNode = null;
  let subtitle = '';
  let containerLayout = 'grid grid-cols-3 gap-2.5 py-1';
  let desktopContainerLayout = 'grid grid-cols-3 gap-3.5 py-1';
  let desktopMaxWidth = 'max-w-[540px]';
  let options: ModalOption[] = [];

  switch (type) {
    case 'review':
      title = 'Ôn tập';
      titleBadge = (
        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 tabular-nums shadow-3xs">
          {reviewDueCount > 0 ? `${reviewDueCount} từ` : '0 từ'}
        </span>
      );
      subtitle = 'Hệ thống giãn cách FSRS thông minh';
      // 5 ô vuông căn đều: hàng 1 có 3 ô, hàng 2 có 2 ô căn giữa
      containerLayout = 'flex flex-wrap justify-center gap-2.5 py-1';
      desktopContainerLayout = 'grid grid-cols-3 gap-3.5 py-1';
      desktopMaxWidth = 'max-w-[560px]';
      options = [
        {
          id: 'mixed',
          icon: <Zap className="w-4 h-4 text-indigo-600" />,
          title: 'Hỗn hợp',
          description: 'Kết hợp đa dạng bài tập FSRS',
          href: withClass('/review/session?mode=mixed'),
          badge: reviewDueCount > 0 ? `${reviewDueCount} từ` : 'FSRS',
          badgeColor: 'bg-indigo-600 text-white',
          iconBg: 'bg-indigo-50/80 text-indigo-600',
        },
        {
          id: 'type',
          icon: <Keyboard className="w-4 h-4 text-amber-600" />,
          title: 'Gõ từ',
          description: 'Luyện gõ chính tả từ vựng',
          href: withClass('/review/session?mode=type'),
          badge: 'Spelling',
          badgeColor: 'bg-amber-100 text-amber-800',
          iconBg: 'bg-amber-50/80 text-amber-600',
        },
        {
          id: 'cloze',
          icon: <Layers className="w-4 h-4 text-emerald-600" />,
          title: 'Điền từ',
          description: 'Điền từ vào ngữ cảnh câu',
          href: withClass('/review/session?mode=cloze'),
          badge: 'Cloze',
          badgeColor: 'bg-emerald-100 text-emerald-800',
          iconBg: 'bg-emerald-50/80 text-emerald-600',
        },
        {
          id: 'listen',
          icon: <Headphones className="w-4 h-4 text-purple-600" />,
          title: 'Luyện nghe',
          description: 'Nghe phát âm nhận diện từ',
          href: withClass('/review/session?mode=listen'),
          badge: 'Audio',
          badgeColor: 'bg-purple-100 text-purple-800',
          iconBg: 'bg-purple-50/80 text-purple-600',
        },
        {
          id: 'mcq',
          icon: <Target className="w-4 h-4 text-sky-600" />,
          title: 'Trắc nghiệm',
          description: 'Phản xạ chọn nghĩa nhanh',
          href: withClass('/review/session?mode=mcq'),
          badge: 'MCQ',
          badgeColor: 'bg-sky-100 text-sky-800',
          iconBg: 'bg-sky-50/80 text-sky-600',
        },
      ];
      break;

    case 'listening':
      title = 'Chọn chế độ Luyện nghe';
      subtitle = 'Kho video đời sống & Part 1-4 TOEIC';
      containerLayout = 'grid grid-cols-2 gap-2.5 max-w-[210px] mx-auto w-full py-1';
      desktopContainerLayout = 'grid grid-cols-2 gap-4 w-full py-1';
      desktopMaxWidth = 'max-w-[460px]';
      options = [
        {
          id: 'video',
          icon: <Video className="w-4 h-4 text-purple-600" />,
          title: 'Video ngắn',
          description: 'Hội thoại thực tế có phụ đề song ngữ',
          href: '/practice/listening',
          badge: 'Kho video',
          badgeColor: 'bg-purple-600 text-white',
          iconBg: 'bg-purple-50/80 text-purple-600',
        },
        {
          id: 'toeic-listening',
          icon: (
            <Image
              src="/images/exams/toeic.png"
              alt="TOEIC"
              width={40}
              height={14}
              className="h-3.5 w-auto object-contain"
            />
          ),
          title: 'Part 1-4 TOEIC',
          description: 'Luyện nghe 100 đề chuẩn cấu trúc ETS',
          href: '/sat-thu-toeic-listening',
          badge: '100 đề',
          badgeColor: 'bg-indigo-600 text-white',
          iconBg: 'bg-white border border-slate-200/80',
        },
      ];
      break;

    case 'reading':
      title = 'Chọn chế độ Luyện đọc';
      subtitle = 'Bài đọc hàng ngày, theo cấp độ & Part 5-7 TOEIC';
      containerLayout = 'grid grid-cols-3 gap-2.5 py-1';
      desktopContainerLayout = 'grid grid-cols-3 gap-3.5 py-1';
      desktopMaxWidth = 'max-w-[540px]';
      options = [
        {
          id: 'daily-reading',
          icon: <FileText className="w-4 h-4 text-amber-600" />,
          title: 'Bài đọc ngày',
          description: 'Đoạn văn cá nhân hóa mỗi ngày',
          href: '/practice/daily-reading',
          badge: 'Mỗi ngày',
          badgeColor: 'bg-amber-500 text-white',
          iconBg: 'bg-amber-50/80 text-amber-600',
        },
        {
          id: 'level-reading',
          icon: <Layers className="w-4 h-4 text-sky-600" />,
          title: 'Theo cấp độ',
          description: 'Luyện đọc phân tầng CEFR A1–C2',
          href: '/practice/pack-reading',
          badge: 'A1–C2',
          badgeColor: 'bg-sky-600 text-white',
          iconBg: 'bg-sky-50/80 text-sky-600',
        },
        {
          id: 'toeic-reading',
          icon: (
            <Image
              src="/images/exams/toeic.png"
              alt="TOEIC"
              width={40}
              height={14}
              className="h-3.5 w-auto object-contain"
            />
          ),
          title: 'Part 5-7 TOEIC',
          description: 'Đọc hiểu & điền câu chuẩn TOEIC',
          href: '/toeic',
          badge: 'Reading',
          badgeColor: 'bg-indigo-600 text-white',
          iconBg: 'bg-white border border-slate-200/80',
        },
      ];
      break;

    case 'learn':
      title = 'Chọn phương thức Nạp từ';
      subtitle = 'Lựa chọn phương thức hiệu quả nhất';
      containerLayout = 'grid grid-cols-3 gap-2.5 py-1';
      desktopContainerLayout = 'grid grid-cols-3 gap-3.5 py-1';
      desktopMaxWidth = 'max-w-[540px]';
      options = [
        {
          id: 'flashcard',
          icon: <BookOpen className="w-4 h-4 text-indigo-600" />,
          title: 'Flashcard',
          description: 'Học từ mới với thẻ lật thông minh',
          href: withClass('/flashcard?mode=learn'),
          badge: newCount > 0 ? `${newCount} từ` : 'FSRS',
          badgeColor: 'bg-indigo-600 text-white',
          iconBg: 'bg-indigo-50/80 text-indigo-600',
        },
        {
          id: 'import',
          icon: <FileText className="w-4 h-4 text-emerald-600" />,
          title: 'Tự nạp từ',
          description: 'Dán danh sách, tải file hoặc quét ảnh',
          href: '/import',
          badge: 'Import',
          badgeColor: 'bg-emerald-100 text-emerald-800',
          iconBg: 'bg-emerald-50/80 text-emerald-600',
        },
        {
          id: 'library',
          icon: <Target className="w-4 h-4 text-amber-600" />,
          title: 'Thư viện từ',
          description: 'Khám phá các gói từ theo chủ đề',
          href: '/library',
          badge: 'Chuẩn',
          badgeColor: 'bg-amber-100 text-amber-800',
          iconBg: 'bg-amber-50/80 text-amber-600',
        },
      ];
      break;

    case 'toeic': {
      let toeicLessonsDone = 0;
      let toeicExamsDone = 0;
      let toeicQuestionsDone = 0;
      if (typeof window !== 'undefined') {
        try {
          const rawLessons =
            localStorage.getItem('lingo_toeic_completed_lessons') ||
            localStorage.getItem('toeic_learn_completed_lessons_v1');
          if (rawLessons) {
            const parsed = JSON.parse(rawLessons);
            if (Array.isArray(parsed)) toeicLessonsDone = parsed.length;
          }
          const uniqueExams = new Set<string>();
          const rawExams = localStorage.getItem('lingo_toeic_exam_history');
          if (rawExams) {
            const parsed = JSON.parse(rawExams);
            if (Array.isArray(parsed)) {
              for (const r of parsed) {
                const id = r?.examId || r?.testId;
                if (typeof id === 'string' && id) uniqueExams.add(id);
              }
            }
          }
          const rawPending = localStorage.getItem('lingo_pending_toeic_save');
          if (rawPending) {
            const pending = JSON.parse(rawPending);
            if (pending?.testId && Object.keys(pending?.answers || {}).length > 0) {
              uniqueExams.add(String(pending.testId));
            }
          }
          toeicExamsDone = uniqueExams.size;

          const rawQHistory = localStorage.getItem('lingo_toeic_question_history');
          if (rawQHistory) {
            const parsedQ = JSON.parse(rawQHistory);
            const records = parsedQ?.records || parsedQ;
            if (records && typeof records === 'object') {
              toeicQuestionsDone = Object.values(records).filter(
                (r: unknown) => r && typeof r === 'object' && ((r as { attemptCount?: number }).attemptCount ?? 1) > 0
              ).length;
            }
          }
        } catch {
          // ignore
        }
      }

      title = 'Luyện thi TOEIC';
      subtitle = 'Luyện đề thi chuẩn & Học từ vựng TOEIC';
      containerLayout = 'grid grid-cols-2 gap-2.5 max-w-[210px] mx-auto w-full py-1';
      desktopContainerLayout = 'grid grid-cols-2 gap-4 w-full py-1';
      desktopMaxWidth = 'max-w-[460px]';
      options = [
        {
          id: 'toeic-exam',
          icon: <Target className="w-4 h-4 text-indigo-600" />,
          title: 'Vào luyện thi',
          description: 'Làm đề Full Test hoặc luyện từng Part',
          href: '/toeic',
          badge:
            toeicExamsDone > 0
              ? `Đã thi ${toeicExamsDone}`
              : toeicQuestionsDone > 0
                ? `${toeicQuestionsDone} câu`
                : '7 Parts',
          badgeColor: 'bg-indigo-600 text-white',
          iconBg: 'bg-indigo-50/80 text-indigo-600',
        },
        {
          id: 'toeic-vocab',
          icon: <BookOpen className="w-4 h-4 text-emerald-600" />,
          title: 'Học TOEIC',
          description: 'Lộ trình từ vựng & chiến thuật làm bài',
          href: '/toeic/learn',
          badge: toeicLessonsDone > 0 ? `${toeicLessonsDone} bài xong` : 'Từ vựng',
          badgeColor: 'bg-emerald-600 text-white',
          iconBg: 'bg-emerald-50/80 text-emerald-600',
        },
      ];
      break;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GIAO DIỆN MÁY TÍNH (if isDesktop)
  // Modal rộng rãi, thẻ lớn dễ đọc kèm mô tả chi tiết cho màn hình PC/Laptop
  // ═══════════════════════════════════════════════════════════════════════════
  if (isDesktop) {
    return (
      <div
        ref={overlayRef}
        className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/45 backdrop-blur-[3px] animate-in fade-in duration-150"
        onClick={(e) => {
          if (e.target === overlayRef.current) onClose();
        }}
      >
        <div
          className={`w-full ${desktopMaxWidth} bg-white rounded-3xl border border-slate-200/90 shadow-2xl p-6 flex flex-col gap-5 animate-in zoom-in-95 duration-150`}
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          {/* Desktop Modal Header */}
          <div className="flex items-start justify-between border-b border-slate-100 pb-4 shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight text-slate-900 leading-tight">
                  {title}
                </h2>
                {titleBadge}
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1">
                {subtitle}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center shrink-0 text-sm font-bold active:scale-95 transition-all cursor-pointer"
              aria-label="Đóng"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Desktop Spacious Option Cards */}
          <div className={desktopContainerLayout}>
            {options.map((opt) => {
              const desktopCardInner = (
                <div className="group relative flex flex-col items-center justify-center w-full min-h-[120px] rounded-2xl border border-slate-200/90 bg-white hover:border-indigo-400 hover:bg-indigo-50/30 hover:shadow-md active:scale-[0.98] transition-all cursor-pointer text-center p-4">
                  {opt.badge && (
                    <span
                      className={`absolute -top-2 right-2.5 text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs whitespace-nowrap ring-2 ring-white ${
                        opt.badgeColor || 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {opt.badge}
                    </span>
                  )}
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center mb-2.5 shrink-0 transition-transform group-hover:scale-105 ${
                      opt.iconBg || 'bg-slate-100'
                    }`}
                  >
                    <div className="scale-125 flex items-center justify-center">
                      {opt.icon}
                    </div>
                  </div>
                  <span className="text-sm font-black text-slate-800 leading-snug group-hover:text-indigo-600 transition-colors">
                    {opt.title}
                  </span>
                  {opt.description && (
                    <span className="mt-1 text-[11px] font-medium text-slate-500 leading-tight line-clamp-2">
                      {opt.description}
                    </span>
                  )}
                </div>
              );

              if (opt.href) {
                return (
                  <Link
                    key={opt.id}
                    href={opt.href}
                    prefetch={canPrefetch ? undefined : false}
                    onClick={() => onClose()}
                    className="block"
                  >
                    {desktopCardInner}
                  </Link>
                );
              }

              return (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => {
                    opt.onClick?.();
                    onClose();
                  }}
                  className="block w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-2xl"
                >
                  {desktopCardInner}
                </button>
              );
            })}
          </div>

          {/* Desktop Modal Footer */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 shrink-0">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Chọn một chế độ để bắt đầu · Nhấn ESC để đóng
            </span>
            <button
              type="button"
              onClick={onClose}
              className="font-bold text-slate-500 hover:text-slate-800 active:scale-95 transition-all cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GIAO DIỆN ĐIỆN THOẠI (else — giữ nguyên 100% thiết kế mobile hiện tại)
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div
        className="w-full max-w-[330px] bg-white rounded-2xl border border-slate-200/90 shadow-2xl p-4 flex flex-col gap-3 animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 shrink-0">
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-black tracking-tight text-slate-900 leading-tight">
                {title}
              </h2>
              {titleBadge}
            </div>
            <p className="text-[10.5px] text-slate-500 font-medium mt-0.5">
              {subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center shrink-0 -mr-1 -mt-1 text-xs font-bold active:scale-95 transition-all"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dynamic 1cm Square Grid Container */}
        <div className={containerLayout}>
          {options.map((opt) => {
            const cardInner = (
              <div
                className="group relative flex flex-col items-center justify-center w-[88px] min-h-[66px] rounded-xl border border-slate-200/90 bg-white hover:border-indigo-400 hover:bg-slate-50 active:scale-95 transition-all shadow-3xs cursor-pointer text-center p-1.5"
              >
                {opt.badge && (
                  <span
                    className={`absolute -top-1.5 -right-1 text-[7px] font-black px-1.5 py-0.2 rounded-full shadow-3xs whitespace-nowrap ring-1 ring-white ${
                      opt.badgeColor || 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {opt.badge}
                  </span>
                )}
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center mb-1 shrink-0 ${
                    opt.iconBg || 'bg-slate-100'
                  }`}
                >
                  {opt.icon}
                </div>
                <span className="text-[9.5px] font-black text-slate-800 leading-tight line-clamp-2 max-w-full group-hover:text-indigo-600 transition-colors">
                  {opt.title}
                </span>
              </div>
            );

            if (opt.href) {
              return (
                <Link
                  key={opt.id}
                  href={opt.href}
                  prefetch={canPrefetch ? undefined : false}
                  onClick={() => onClose()}
                  className="block"
                >
                  {cardInner}
                </Link>
              );
            }

            return (
              <button
                type="button"
                key={opt.id}
                onClick={() => {
                  opt.onClick?.();
                  onClose();
                }}
                className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-xl"
              >
                {cardInner}
              </button>
            );
          })}
        </div>

        {/* Modal Footer / Hint */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 shrink-0">
          <span className="flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Chạm ô vuông để bắt đầu
          </span>
          <button
            type="button"
            onClick={onClose}
            className="font-bold text-slate-500 hover:text-slate-800 active:scale-95 transition-all"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
