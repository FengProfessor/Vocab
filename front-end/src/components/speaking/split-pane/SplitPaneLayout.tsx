'use client';

/**
 * SplitPaneLayout Component
 * File: src/components/speaking/split-pane/SplitPaneLayout.tsx
 *
 * Technical Minimalist Two-Column Split-Pane Scaffolding for LingoPro Speaking:
 * - Desktop: Side-by-side columns with independent vertical scrolling (overflow-y-auto)
 *   and crisp 1px borders (border-border / border-slate-200 dark:border-slate-800).
 * - Configurable column ratio: '50/50' (default), '60/40', or '40/60'.
 * - Mobile: Responsive presentation supporting segmented tab switcher between 'stimulus' and 'interaction'.
 * - Full ARIA accessibility (role="region", role="tablist", role="tab", aria-selected).
 */

import React, { useState, useMemo, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Layers, Mic, Image as ImageIcon } from 'lucide-react';

export type SplitPaneRatio = '50/50' | '60/40' | '40/60';
export type MobileLayoutMode = 'tabs' | 'stacked';
export type MobileActiveTab = 'stimulus' | 'interaction';

export interface SplitPaneLayoutProps {
  /** Content rendered inside the Left Stimulus Pane */
  leftPane: ReactNode;
  /** Content rendered inside the Right Interaction Pane */
  rightPane: ReactNode;
  /** Desktop column split ratio. Defaults to '50/50' */
  ratio?: SplitPaneRatio;
  /** Alternative alias for ratio */
  splitRatio?: SplitPaneRatio;
  /** Optional top sticky header bar */
  header?: ReactNode;
  /** Optional bottom action bar or sticky footer */
  footer?: ReactNode;
  /** Custom container CSS classes */
  className?: string;
  /** Additional CSS class for left pane container */
  leftPaneClassName?: string;
  /** Additional CSS class for right pane container */
  rightPaneClassName?: string;
  /** Active mobile tab ('stimulus' | 'interaction') for controlled usage */
  mobileActiveTab?: MobileActiveTab;
  /** Callback fired when the user toggles mobile tabs */
  onMobileTabChange?: (tab: MobileActiveTab) => void;
  /** Mobile presentation mode: 'tabs' (default with tab switcher) or 'stacked' (vertical stack) */
  mobileMode?: MobileLayoutMode;
  /** Responsive breakpoint where split becomes two-column (default: 'lg') */
  mobileBreakpoint?: 'sm' | 'md' | 'lg';
}

export const SplitPaneLayout: React.FC<SplitPaneLayoutProps> = ({
  leftPane,
  rightPane,
  ratio = '50/50',
  splitRatio,
  header,
  footer,
  className = '',
  leftPaneClassName = '',
  rightPaneClassName = '',
  mobileActiveTab,
  onMobileTabChange,
  mobileMode = 'tabs',
  mobileBreakpoint = 'lg',
}) => {
  // Support both 'ratio' and 'splitRatio' alias, falling back to '50/50'
  const effectiveRatio: SplitPaneRatio = splitRatio || ratio || '50/50';

  // Internal uncontrolled state if parent does not provide controlled mobileActiveTab
  const [internalTab, setInternalTab] = useState<MobileActiveTab>('stimulus');
  const currentTab: MobileActiveTab = mobileActiveTab ?? internalTab;

  const handleTabSelect = (tab: MobileActiveTab) => {
    setInternalTab(tab);
    if (onMobileTabChange) {
      onMobileTabChange(tab);
    }
  };

  // Compute CSS grid classes based on ratio
  const gridClasses = useMemo(() => {
    switch (effectiveRatio) {
      case '60/40':
        return {
          container: 'lg:grid-cols-12',
          left: 'lg:col-span-7',
          right: 'lg:col-span-5',
        };
      case '40/60':
        return {
          container: 'lg:grid-cols-12',
          left: 'lg:col-span-5',
          right: 'lg:col-span-7',
        };
      case '50/50':
      default:
        return {
          container: 'lg:grid-cols-2',
          left: 'lg:col-span-1',
          right: 'lg:col-span-1',
        };
    }
  }, [effectiveRatio]);

  return (
    <div
      className={cn(
        'flex flex-col w-full h-full min-h-[500px] overflow-hidden bg-background text-foreground',
        'border border-border dark:border-slate-800 rounded-lg shadow-2xs',
        className
      )}
    >
      {/* 1. Optional Sticky Header */}
      {header && (
        <header className="shrink-0 border-b border-border dark:border-slate-800 bg-card/90 backdrop-blur z-20">
          {header}
        </header>
      )}

      {/* 2. Mobile Segmented Tab Switcher (Visible on < lg screens when mobileMode === 'tabs') */}
      {mobileMode === 'tabs' && (
        <div
          role="tablist"
          aria-label="Chuyển đổi khu vực đề bài và thu âm"
          className="lg:hidden shrink-0 flex items-center border-b border-border dark:border-slate-800 bg-muted/40 p-1.5 gap-1.5 select-none z-10"
        >
          <button
            type="button"
            role="tab"
            id="tab-stimulus"
            aria-controls="pane-stimulus"
            aria-selected={currentTab === 'stimulus'}
            onClick={() => handleTabSelect('stimulus')}
            className={cn(
              'flex-1 min-h-[44px] py-2 px-3 rounded-md text-xs sm:text-sm font-medium flex items-center justify-center gap-2 transition-all cursor-pointer touch-manipulation',
              currentTab === 'stimulus'
                ? 'bg-card text-foreground font-semibold shadow-2xs border border-border/80'
                : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
            )}
          >
            <ImageIcon className="h-4 w-4 text-primary shrink-0" />
            <span>Đề bài &amp; Kích thích</span>
          </button>

          <button
            type="button"
            role="tab"
            id="tab-interaction"
            aria-controls="pane-interaction"
            aria-selected={currentTab === 'interaction'}
            onClick={() => handleTabSelect('interaction')}
            className={cn(
              'flex-1 min-h-[44px] py-2 px-3 rounded-md text-xs sm:text-sm font-medium flex items-center justify-center gap-2 transition-all cursor-pointer touch-manipulation',
              currentTab === 'interaction'
                ? 'bg-card text-foreground font-semibold shadow-2xs border border-border/80'
                : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
            )}
          >
            <Mic className="h-4 w-4 text-destructive shrink-0" />
            <span>Luyện nói &amp; Ghi âm</span>
          </button>
        </div>
      )}

      {/* 3. Main Split-Pane Grid Body */}
      <div
        className={cn(
          'flex-1 flex flex-col lg:grid overflow-hidden min-h-0',
          gridClasses.container
        )}
      >
        {/* Left Pane: Visual & Audio Stimulus */}
        <section
          id="pane-stimulus"
          role="region"
          aria-label="Tài liệu và hình ảnh kích thích (Stimulus Pane)"
          aria-labelledby="tab-stimulus"
          className={cn(
            'flex flex-col overflow-hidden bg-card/30',
            'border-b lg:border-b-0 lg:border-r border-border dark:border-slate-800',
            gridClasses.left,
            // Mobile visibility logic
            mobileMode === 'tabs' && (currentTab === 'stimulus' ? 'flex flex-1' : 'hidden lg:flex'),
            mobileMode === 'stacked' && 'shrink-0 max-h-[46vh] lg:max-h-none lg:h-full',
            leftPaneClassName
          )}
        >
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-thin">
            {leftPane}
          </div>
        </section>

        {/* Right Pane: Interaction, Mic & Real-Time Transcript */}
        <section
          id="pane-interaction"
          role="region"
          aria-label="Khu vực ghi âm và bản ghi nhận diện (Interaction Pane)"
          aria-labelledby="tab-interaction"
          className={cn(
            'flex flex-col flex-1 overflow-hidden bg-background lg:h-full',
            gridClasses.right,
            // Mobile visibility logic
            mobileMode === 'tabs' && (currentTab === 'interaction' ? 'flex flex-1' : 'hidden lg:flex'),
            rightPaneClassName
          )}
        >
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-thin">
            {rightPane}
          </div>
        </section>
      </div>

      {/* 4. Optional Sticky Footer */}
      {footer && (
        <footer className="shrink-0 border-t border-border dark:border-slate-800 bg-card/90 backdrop-blur z-20">
          {footer}
        </footer>
      )}
    </div>
  );
};

export default SplitPaneLayout;
