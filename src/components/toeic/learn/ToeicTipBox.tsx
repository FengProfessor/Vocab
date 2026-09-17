'use client';

import React from 'react';
import { Lightbulb, Zap, BookmarkCheck, AlertCircle, Check } from 'lucide-react';
import type { TipBox } from '@/data/toeic/theory/types';

export interface ToeicTipBoxProps {
  tip: TipBox;
  className?: string;
}

export function ToeicTipBox({ tip, className = '' }: ToeicTipBoxProps) {
  const { title, type, content, keySignals } = tip;

  // Theme configuration based on tip type
  const themeConfig = {
    shortcut: {
      container: 'border-amber-300/80 bg-amber-50/70 dark:border-amber-800/70 dark:bg-amber-950/20 text-amber-950 dark:text-amber-100',
      iconColor: 'text-amber-600 dark:text-amber-400',
      badge: 'bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700',
      label: 'Mẹo 5 Giây',
      Icon: Zap,
    },
    tip: {
      container: 'border-amber-300/80 bg-amber-50/60 dark:border-amber-800/60 dark:bg-amber-950/20 text-amber-950 dark:text-amber-100',
      iconColor: 'text-amber-600 dark:text-amber-400',
      badge: 'bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 border-amber-300/70 dark:border-amber-700/60',
      label: 'Chiến Thuật',
      Icon: Lightbulb,
    },
    rule: {
      container: 'border-blue-300/80 bg-blue-50/60 dark:border-blue-800/60 dark:bg-blue-950/20 text-blue-950 dark:text-blue-100',
      iconColor: 'text-blue-600 dark:text-blue-400',
      badge: 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 border-blue-300/70 dark:border-blue-700/60',
      label: 'Quy Tắc Cốt Lõi',
      Icon: BookmarkCheck,
    },
    warning: {
      container: 'border-rose-300/80 bg-rose-50/60 dark:border-rose-800/60 dark:bg-rose-950/20 text-rose-950 dark:text-rose-100',
      iconColor: 'text-rose-600 dark:text-rose-400',
      badge: 'bg-rose-100 dark:bg-rose-900/50 text-rose-800 dark:text-rose-300 border-rose-300/70 dark:border-rose-700/60',
      label: 'Lưu Ý Đặc Biệt',
      Icon: AlertCircle,
    },
  }[type] || {
    container: 'border-amber-300/80 bg-amber-50/70 dark:border-amber-800/70 dark:bg-amber-950/20 text-amber-950 dark:text-amber-100',
    iconColor: 'text-amber-600 dark:text-amber-400',
    badge: 'bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700',
    label: 'Mẹo Làm Bài',
    Icon: Lightbulb,
  };

  const { Icon } = themeConfig;

  return (
    <aside
      aria-label={title}
      className={`rounded-sm border p-4 transition-colors ${themeConfig.container} ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0">
          <Icon className={`h-4 w-4 ${themeConfig.iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          {/* Header with Title and Badge */}
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span
              className={`inline-block font-mono text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-xs border ${themeConfig.badge}`}
            >
              {themeConfig.label}
            </span>
            <h4 className="font-mono text-xs font-bold uppercase tracking-wide">
              {title}
            </h4>
          </div>

          {/* Body Content */}
          <p className="text-xs sm:text-sm leading-relaxed opacity-95">
            {content}
          </p>

          {/* Key Signals (Dấu hiệu nhận biết nhanh) */}
          {keySignals && keySignals.length > 0 && (
            <div className="mt-3 pt-2.5 border-t border-current/15">
              <div className="font-mono text-[11px] font-semibold tracking-wider uppercase opacity-85 mb-1.5">
                Dấu hiệu nhận diện nhanh:
              </div>
              <ul className="space-y-1.5 pl-0">
                {keySignals.map((signal, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-xs sm:text-sm leading-snug"
                  >
                    <Check className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${themeConfig.iconColor}`} />
                    <span className="font-mono text-xs sm:text-[13px] bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded-xs font-medium">
                      {signal}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
