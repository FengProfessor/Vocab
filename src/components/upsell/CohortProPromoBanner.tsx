'use client';

/**
 * Thanh flash sale Pro — dashboard + /upgrade.
 * Ẩn khi hết hạn hoặc (dashboard) user đã Pro/Premium.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sparkles, X } from 'lucide-react';
import {
  COHORT_PRO_PROMO_LABEL,
  formatCountdown,
  getCohortProPromoMsLeft,
  isCohortProPromoActive,
} from '@/lib/cohort-pro-promo';

const SESSION_HIDE_KEY = 'lp:cohort_pro_promo_banner_hide';

type Props = {
  /** dashboard: có nút CTA + ẩn được; upgrade: gọn trong trang */
  variant?: 'dashboard' | 'upgrade';
  /** false = luôn hiện khi promo (trang upgrade). true = cho ẩn session */
  dismissible?: boolean;
  className?: string;
};

export function CohortProPromoBanner({
  variant = 'dashboard',
  dismissible = variant === 'dashboard',
  className = '',
}: Props) {
  const [active, setActive] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [cd, setCd] = useState(() => formatCountdown(getCohortProPromoMsLeft()));

  useEffect(() => {
    if (dismissible) {
      try {
        if (sessionStorage.getItem(SESSION_HIDE_KEY) === '1') setHidden(true);
      } catch {
        /* ignore */
      }
    }

    const tick = () => {
      const on = isCohortProPromoActive();
      setActive(on);
      setCd(formatCountdown(getCohortProPromoMsLeft()));
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [dismissible]);

  if (!active || hidden) return null;

  const isUpgrade = variant === 'upgrade';

  return (
    <div
      className={`relative z-20 border-b border-emerald-200/80 bg-gradient-to-r from-emerald-50 via-teal-50 to-amber-50 ${className}`}
      role="status"
    >
      <div
        className={`mx-auto flex items-center gap-2 px-3 py-2 sm:gap-3 sm:px-4 sm:py-2.5 ${
          isUpgrade ? 'max-w-3xl lg:max-w-5xl' : 'max-w-5xl'
        }`}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm">
          <Sparkles className="h-4 w-4" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-bold leading-snug text-emerald-950 sm:text-sm">
            Pro −38% · 49k · <span className="text-emerald-700">132k/3 tháng</span>
            <span className="hidden sm:inline"> · 235k · 372k</span>
          </p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] font-semibold text-emerald-800/80 sm:text-xs">
            <span className="tabular-nums tracking-wide text-amber-700">
              Còn {cd.label}
            </span>
            <span className="text-emerald-700/50">·</span>
            <span>{COHORT_PRO_PROMO_LABEL}</span>
          </p>
        </div>

        {isUpgrade ? (
          <span className="hidden shrink-0 rounded-full bg-emerald-600 px-3 py-1.5 text-[11px] font-black uppercase tracking-wide text-white sm:inline">
            Tự áp giá
          </span>
        ) : (
          <Link
            href="/upgrade?from=cohort_promo"
            className="shrink-0 rounded-full bg-emerald-600 px-3 py-2 text-xs font-black text-white shadow-sm hover:bg-emerald-700 sm:px-4 sm:text-sm"
          >
            Lấy giá
          </Link>
        )}

        {dismissible ? (
          <button
            type="button"
            aria-label="Ẩn banner phiên này"
            onClick={() => {
              setHidden(true);
              try {
                sessionStorage.setItem(SESSION_HIDE_KEY, '1');
              } catch {
                /* ignore */
              }
            }}
            className="shrink-0 rounded-lg p-1.5 text-emerald-900/40 hover:bg-emerald-900/5 hover:text-emerald-900/70"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
