'use client';

import React from 'react';
import Link from '@/shared/router/navigation';
import { Sparkles, MessageSquare, Zap, BookOpen, Compass } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StudentShell } from '@/components/student/StudentShell';
import {
  MasterSpeakingRoadmap,
  type SpeakingRoadmapStage,
} from '@/components/speaking/MasterSpeakingRoadmap';

export interface SpeakingOrientationBannerConfig {
  title: React.ReactNode;
  badge: string;
  description: React.ReactNode;
}

export interface SpeakingStepLayoutProps {
  /** Which of the 4 steps is currently active */
  currentStage: SpeakingRoadmapStage;
  /** Title passed to StudentShell */
  shellTitle: string;
  /** Title displayed in the top sub-header bar */
  headerTitle: React.ReactNode;
  /** Optional custom icon for the top sub-header bar */
  headerIcon?: React.ReactNode;
  /** Optional right-side actions in the top sub-header bar */
  headerActions?: React.ReactNode;
  /** Whether to show the amber orientation callout banner below the 4-step roadmap (default: true) */
  showOrientationBanner?: boolean;
  /** Custom override for the orientation callout banner */
  orientationBanner?: SpeakingOrientationBannerConfig;
  /** Optional secondary navigation slot rendered inside the max-w-6xl container above main content */
  subHeaderSlot?: React.ReactNode;
  /** Optional className for the main content container */
  contentClassName?: string;
  /** Whether to hide mobile bottom nav in StudentShell (default: true, matching Step 4) */
  hideMobileNav?: boolean;
  /** Main workspace content */
  children: React.ReactNode;
}

function getDefaultHeaderIcon(stage: SpeakingRoadmapStage): React.ReactNode {
  switch (stage) {
    case 'foundation':
      return <Zap className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />;
    case 'curriculum':
      return <BookOpen className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />;
    case 'topics':
      return <Compass className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />;
    case 'ai-tutor':
    default:
      return <MessageSquare className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />;
  }
}

function getDefaultOrientationBanner(
  stage: SpeakingRoadmapStage
): SpeakingOrientationBannerConfig {
  switch (stage) {
    case 'foundation':
      return {
        title: '💡 Hướng dẫn lộ trình cho người mới bắt đầu (A0 – A1):',
        badge: 'Bước 1 Nền Tảng',
        description: (
          <>
            Bạn đang ở{' '}
            <strong>Bước 1 (Khóa Nền Tảng A0-A1 — Xóa câm nín &amp; Dịch thầm)</strong>. Hãy đi
            tuần tự từ{' '}
            <Link
              href="/student/speaking/foundation/stage-mindset"
              className="text-amber-700 dark:text-amber-400 underline font-semibold hover:text-amber-800 dark:hover:text-amber-300"
            >
              Khởi động Tư duy (Mindset OS)
            </Link>{' '}
            → Khai thông cơ miệng (Chặng 0) → 28 Khung câu sống còn (Chặng 1) → Thế khối Lego
            &lt;1s (Chặng 2) → Nở câu 3 nhịp (Chặng 3), sau đó tiến lên{' '}
            <Link
              href="/student/speaking/curriculum"
              className="text-indigo-600 dark:text-indigo-400 underline font-semibold hover:text-indigo-700 dark:hover:text-indigo-300"
            >
              Bước 2: Lộ Trình 32 Bài Chuẩn Hóa
            </Link>
            !
          </>
        ),
      };
    case 'curriculum':
      return {
        title: '💡 Hướng dẫn học Lộ trình 32 Bài Chuẩn Hóa:',
        badge: 'Bước 2 Lộ Trình',
        description: (
          <>
            Bạn đang ở{' '}
            <strong>Bước 2 (Lộ Trình 32 Bài Chuẩn Hóa — 0 đến 6.5 IELTS)</strong> với phương pháp
            sư phạm 4 chặng khép kín mỗi bài. Nếu bạn chưa vững khẩu hình hoặc còn tâm lý sợ sai,
            hãy hoàn thành{' '}
            <Link
              href="/student/speaking/foundation"
              className="text-amber-700 dark:text-amber-400 underline font-semibold hover:text-amber-800 dark:hover:text-amber-300"
            >
              Bước 1: Khóa Nền Tảng A0-A1
            </Link>{' '}
            trước, hoặc kết hợp thực hành mở rộng từ vựng tại{' '}
            <Link
              href="/student/speaking/topics"
              className="text-indigo-600 dark:text-indigo-400 underline font-semibold hover:text-indigo-700 dark:hover:text-indigo-300"
            >
              Bước 3: Thư Viện 250+ Chủ Đề
            </Link>
            !
          </>
        ),
      };
    case 'topics':
      return {
        title: '💡 Hướng dẫn chọn chủ đề theo trình độ:',
        badge: 'Bước 3 Thực Chiến',
        description: (
          <>
            Thư viện 250+ chủ đề là <strong>Bước 3 (Thực chiến ngữ cảnh)</strong> giúp bạn mở rộng
            vốn từ. Nếu bạn là người mất gốc (A0-A1) hoặc chưa quen ghép khung câu, hãy hoàn thành{' '}
            <Link
              href="/student/speaking/foundation"
              className="text-amber-700 dark:text-amber-400 underline font-semibold hover:text-amber-800 dark:hover:text-amber-300"
            >
              Bước 1: Khóa Nền Tảng A0-A1
            </Link>{' '}
            và{' '}
            <Link
              href="/student/speaking/curriculum"
              className="text-indigo-600 dark:text-indigo-400 underline font-semibold hover:text-indigo-700 dark:hover:text-indigo-300"
            >
              Bước 2: Lộ Trình 32 Bài Chuẩn Hóa
            </Link>{' '}
            để nói tự tin mà không lo dịch thầm!
          </>
        ),
      };
    case 'ai-tutor':
    default:
      return {
        title: '💡 Hướng dẫn lộ trình cho người mới bắt đầu:',
        badge: 'Khuyên đọc',
        description: (
          <>
            Bạn đang ở <strong>Bước 4 (AI Speaking Tutor — Nâng cao)</strong> dành cho học viên
            luyện phản xạ đối đáp 1:1. Nếu bạn là người mất gốc, sợ sai, hoặc chưa nắm khung câu
            cơ bản, hãy theo đúng thứ tự sư phạm từ{' '}
            <Link
              href="/student/speaking/foundation"
              className="text-amber-700 dark:text-amber-400 underline font-semibold hover:text-amber-800 dark:hover:text-amber-300"
            >
              Bước 1: Khóa Nền Tảng A0-A1
            </Link>{' '}
            và{' '}
            <Link
              href="/student/speaking/curriculum"
              className="text-indigo-600 dark:text-indigo-400 underline font-semibold hover:text-indigo-700 dark:hover:text-indigo-300"
            >
              Bước 2: Lộ Trình 32 Bài Chuẩn Hóa
            </Link>{' '}
            để không bị ngợp và đạt hiệu quả nói trôi chảy nhanh nhất!
          </>
        ),
      };
  }
}

/**
 * SpeakingStepLayout:
 * Shared unified shell & layout across all 4 steps of the Reflex Speaking Hub
 * (Bước 1: Foundation, Bước 2: 32-Lesson Curriculum, Bước 3: 250+ Topics, Bước 4: AI Speaking Tutor).
 * Fully supports system Light & Dark themes.
 */
export const SpeakingStepLayout: React.FC<SpeakingStepLayoutProps> = ({
  currentStage,
  shellTitle,
  headerTitle,
  headerIcon,
  headerActions,
  showOrientationBanner = true,
  orientationBanner,
  subHeaderSlot,
  contentClassName,
  hideMobileNav = true,
  children,
}) => {
  const resolvedIcon = headerIcon ?? getDefaultHeaderIcon(currentStage);
  const resolvedBanner = orientationBanner ?? getDefaultOrientationBanner(currentStage);

  return (
    <StudentShell title={shellTitle} contentClassName="p-0" hideMobileNav={hideMobileNav}>
      <main className="min-h-[calc(100dvh-var(--header-h)-var(--safe-top))] bg-[#F6F7FB] dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans flex flex-col transition-colors duration-200">
        {/* Top Sub-Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 px-4 py-2.5 backdrop-blur sm:px-6 transition-colors">
          <div className="flex items-center gap-2 min-w-0">
            {resolvedIcon}
            <span className="font-bold text-slate-800 dark:text-slate-200 text-sm sm:text-base truncate">
              {headerTitle}
            </span>
          </div>
          {headerActions && <div className="flex items-center gap-2 shrink-0">{headerActions}</div>}
        </div>

        {/* Master Speaking 4-Step Progressive Roadmap */}
        <div className="border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-100/70 dark:bg-slate-950/80 px-4 py-4 sm:px-6 backdrop-blur transition-colors">
          <div className="max-w-6xl mx-auto">
            <MasterSpeakingRoadmap currentStage={currentStage} />
          </div>
        </div>

        {/* Beginner Orientation Callout Banner */}
        {showOrientationBanner && (
          <div className="max-w-6xl w-full mx-auto px-3 sm:px-6 pt-3 pb-0">
            <div className="p-3.5 rounded-xl border border-amber-300/80 dark:border-amber-500/30 bg-amber-50/90 dark:bg-amber-950/20 text-xs text-amber-900 dark:text-amber-200/90 flex items-start gap-3 shadow-sm dark:shadow-md transition-colors">
              <Sparkles className="size-4.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300 flex-wrap">
                  <span>{resolvedBanner.title}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-200/70 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 uppercase font-mono font-bold">
                    {resolvedBanner.badge}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-700 dark:text-slate-300">
                  {resolvedBanner.description}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Optional Secondary Sub-Navigation Slot (e.g., StageProgressNav in Step 1) */}
        {subHeaderSlot && (
          <div className="max-w-6xl w-full mx-auto px-3 sm:px-6 pt-3 pb-0">
            {subHeaderSlot}
          </div>
        )}

        {/* Main Workspace Container */}
        <div
          className={cn(
            'flex-1 max-w-6xl w-full mx-auto p-3 sm:p-6',
            contentClassName
          )}
        >
          {children}
        </div>
      </main>
    </StudentShell>
  );
};

export default SpeakingStepLayout;
