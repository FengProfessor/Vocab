'use client';

import { useEffect, useRef } from 'react';
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
          listening: ['/practice/listening', '/toeic'],
          reading: ['/practice/reading-library', '/toeic'],
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
  let gridLayout = 'grid grid-cols-3 gap-2.5 py-1 md:gap-3.5';
  let modalMaxWidth = 'md:max-w-[540px]';
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
      // 5 ô vuông căn đều trên mobile (3 + 2), lưới 3 cột trên desktop
      gridLayout = 'flex flex-wrap justify-center gap-2.5 py-1 md:grid md:grid-cols-3 md:gap-3.5';
      modalMaxWidth = 'md:max-w-[560px]';
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
      gridLayout = 'grid grid-cols-2 gap-2.5 max-w-[210px] mx-auto w-full py-1 md:max-w-none md:gap-4';
      modalMaxWidth = 'md:max-w-[460px]';
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
          href: '/toeic',
          badge: '100 đề',
          badgeColor: 'bg-indigo-600 text-white',
          iconBg: 'bg-white border border-slate-200/80',
        },
      ];
      break;

    case 'reading':
      title = 'Chọn chế độ Luyện đọc';
      subtitle = 'Thư viện 619 bài đọc A1–C2 & Part 5-7 TOEIC';
      gridLayout = 'grid grid-cols-2 gap-2.5 max-w-[210px] mx-auto w-full py-1 md:max-w-none md:gap-4';
      modalMaxWidth = 'md:max-w-[460px]';
      options = [
        {
          id: 'level-reading',
          icon: <Layers className="w-4 h-4 text-emerald-600" />,
          title: 'Thư viện bài đọc',
          description: 'Kho 619 bài A1–C2, 15 chủ đề có bản dịch & quiz',
          href: '/practice/reading-library',
          badge: '619 bài',
          badgeColor: 'bg-emerald-600 text-white',
          iconBg: 'bg-emerald-50/80 text-emerald-600',
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
      gridLayout = 'grid grid-cols-3 gap-2.5 py-1 md:gap-3.5';
      modalMaxWidth = 'md:max-w-[540px]';
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
      gridLayout = 'grid grid-cols-2 gap-2.5 max-w-[210px] mx-auto w-full py-1 md:max-w-none md:gap-4';
      modalMaxWidth = 'md:max-w-[460px]';
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

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-black/40 md:bg-black/45 backdrop-blur-[2px] md:backdrop-blur-[3px] animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div
        className={`w-full max-w-[330px] ${modalMaxWidth} bg-white rounded-2xl md:rounded-3xl border border-slate-200/90 shadow-2xl p-4 md:p-6 flex flex-col gap-3 md:gap-5 animate-in zoom-in-95 duration-150`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {/* Modal Header */}
        <div className="flex items-center md:items-start justify-between border-b border-slate-100 pb-2.5 md:pb-4 shrink-0">
          <div>
            <div className="flex items-center gap-1.5 md:gap-2">
              <h2 className="text-sm md:text-lg font-black tracking-tight text-slate-900 leading-tight">
                {title}
              </h2>
              {titleBadge}
            </div>
            <p className="text-[10.5px] md:text-xs text-slate-500 font-medium mt-0.5 md:mt-1">
              {subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center shrink-0 -mr-1 -mt-1 md:mr-0 md:mt-0 text-xs md:text-sm font-bold active:scale-95 transition-all cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Unified Responsive Option Grid */}
        <div className={gridLayout}>
          {options.map((opt) => {
            const cardInner = (
              <div className="group relative flex flex-col items-center justify-center w-[88px] md:w-full min-h-[66px] md:min-h-[120px] rounded-xl md:rounded-2xl border border-slate-200/90 bg-white hover:border-indigo-400 hover:bg-slate-50 md:hover:bg-indigo-50/30 md:hover:shadow-md active:scale-95 md:active:scale-[0.98] transition-all shadow-3xs md:shadow-none cursor-pointer text-center p-1.5 md:p-4">
                {opt.badge && (
                  <span
                    className={`absolute -top-1.5 -right-1 md:-top-2 md:right-2.5 text-[7px] md:text-[10px] font-black px-1.5 md:px-2 py-0.2 md:py-0.5 rounded-full shadow-3xs md:shadow-xs whitespace-nowrap ring-1 md:ring-2 ring-white ${
                      opt.badgeColor || 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {opt.badge}
                  </span>
                )}
                <div
                  className={`w-7 h-7 md:w-11 md:h-11 rounded-lg md:rounded-xl flex items-center justify-center mb-1 md:mb-2.5 shrink-0 md:transition-transform md:group-hover:scale-105 ${
                    opt.iconBg || 'bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-center md:scale-125">
                    {opt.icon}
                  </div>
                </div>
                <span className="text-[9.5px] md:text-sm font-black text-slate-800 leading-tight md:leading-snug line-clamp-2 md:line-clamp-none max-w-full group-hover:text-indigo-600 transition-colors">
                  {opt.title}
                </span>
                {opt.description && (
                  <span className="hidden md:block mt-1 text-[11px] font-medium text-slate-500 leading-tight line-clamp-2">
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
                className="block w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-xl md:rounded-2xl"
              >
                {cardInner}
              </button>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="pt-2 md:pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] md:text-xs text-slate-400 shrink-0">
          <span className="flex items-center gap-1 md:hidden">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Chạm ô vuông để bắt đầu
          </span>
          <span className="hidden md:flex items-center gap-1.5 font-medium">
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
