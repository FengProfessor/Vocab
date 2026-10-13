'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
import { toast } from 'sonner';

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

  // Đóng khi ấn Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (type) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [type, onClose]);

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
      options = [
        {
          id: 'mixed',
          icon: <Zap className="w-4 h-4 text-indigo-600" />,
          title: 'Hỗn hợp',
          href: withClass('/review/session?mode=mixed'),
          badge: reviewDueCount > 0 ? `${reviewDueCount} từ` : 'FSRS',
          badgeColor: 'bg-indigo-600 text-white',
          iconBg: 'bg-indigo-50/80 text-indigo-600',
        },
        {
          id: 'type',
          icon: <Keyboard className="w-4 h-4 text-amber-600" />,
          title: 'Gõ từ',
          href: withClass('/review/session?mode=type'),
          badge: 'Spelling',
          badgeColor: 'bg-amber-100 text-amber-800',
          iconBg: 'bg-amber-50/80 text-amber-600',
        },
        {
          id: 'cloze',
          icon: <Layers className="w-4 h-4 text-emerald-600" />,
          title: 'Điền từ',
          href: withClass('/review/session?mode=cloze'),
          badge: 'Cloze',
          badgeColor: 'bg-emerald-100 text-emerald-800',
          iconBg: 'bg-emerald-50/80 text-emerald-600',
        },
        {
          id: 'listen',
          icon: <Headphones className="w-4 h-4 text-purple-600" />,
          title: 'Luyện nghe',
          href: withClass('/review/session?mode=listen'),
          badge: 'Audio',
          badgeColor: 'bg-purple-100 text-purple-800',
          iconBg: 'bg-purple-50/80 text-purple-600',
        },
        {
          id: 'mcq',
          icon: <Target className="w-4 h-4 text-sky-600" />,
          title: 'Trắc nghiệm',
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
      options = [
        {
          id: 'video',
          icon: <Video className="w-4 h-4 text-purple-600" />,
          title: 'Video ngắn',
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
      options = [
        {
          id: 'daily-reading',
          icon: <FileText className="w-4 h-4 text-amber-600" />,
          title: 'Bài đọc ngày',
          href: '/practice/daily-reading',
          badge: 'Mỗi ngày',
          badgeColor: 'bg-amber-500 text-white',
          iconBg: 'bg-amber-50/80 text-amber-600',
        },
        {
          id: 'level-reading',
          icon: <Layers className="w-4 h-4 text-sky-600" />,
          title: 'Theo cấp độ',
          onClick: () =>
            toast.info('Tính năng Tổng hợp bài đọc theo cấp độ (A1 - C2) sắp ra mắt!'),
          badge: 'Sắp có',
          badgeColor: 'bg-slate-500 text-white',
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
      options = [
        {
          id: 'flashcard',
          icon: <BookOpen className="w-4 h-4 text-indigo-600" />,
          title: 'Flashcard',
          href: '/flashcard?mode=learn',
          badge: newCount > 0 ? `${newCount} từ` : 'FSRS',
          badgeColor: 'bg-indigo-600 text-white',
          iconBg: 'bg-indigo-50/80 text-indigo-600',
        },
        {
          id: 'import',
          icon: <FileText className="w-4 h-4 text-emerald-600" />,
          title: 'Tự nạp từ',
          href: '/import',
          badge: 'Import',
          badgeColor: 'bg-emerald-100 text-emerald-800',
          iconBg: 'bg-emerald-50/80 text-emerald-600',
        },
        {
          id: 'library',
          icon: <Target className="w-4 h-4 text-amber-600" />,
          title: 'Thư viện từ',
          href: '/library',
          badge: 'Chuẩn',
          badgeColor: 'bg-amber-100 text-amber-800',
          iconBg: 'bg-amber-50/80 text-amber-600',
        },
      ];
      break;

    case 'toeic':
      title = 'Luyện thi TOEIC';
      subtitle = 'Luyện đề thi chuẩn & Học từ vựng TOEIC';
      containerLayout = 'grid grid-cols-2 gap-2.5 max-w-[210px] mx-auto w-full py-1';
      options = [
        {
          id: 'toeic-exam',
          icon: <Target className="w-4 h-4 text-indigo-600" />,
          title: 'Vào luyện thi',
          href: '/toeic',
          badge: '7 Parts',
          badgeColor: 'bg-indigo-600 text-white',
          iconBg: 'bg-indigo-50/80 text-indigo-600',
        },
        {
          id: 'toeic-vocab',
          icon: <BookOpen className="w-4 h-4 text-emerald-600" />,
          title: 'Học TOEIC',
          href: '/library',
          badge: 'Từ vựng',
          badgeColor: 'bg-emerald-600 text-white',
          iconBg: 'bg-emerald-50/80 text-emerald-600',
        },
      ];
      break;
  }

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
                  onClick={() => onClose()}
                  className="block"
                >
                  {cardInner}
                </Link>
              );
            }

            return (
              <div
                key={opt.id}
                onClick={() => {
                  opt.onClick?.();
                  onClose();
                }}
              >
                {cardInner}
              </div>
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
