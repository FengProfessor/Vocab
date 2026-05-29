'use client';
import { levelProgress } from '@/lib/gamification';

interface Props {
  totalXp: number;
  variant?: 'compact' | 'detailed';
  className?: string;
}

/**
 * XpBadge — hiển thị level + XP.
 * - `compact`: pill nhỏ cho header (giữ tương thích cũ).
 * - `detailed`: card có level number lớn, tên level, progress bar X / Y XP.
 */
export function XpBadge({ totalXp, variant = 'compact', className = '' }: Props) {
  const { level, name, current, next, pct, isMax } = levelProgress(totalXp);

  if (variant === 'compact') {
    return (
      <div
        className={`flex items-center gap-1.5 bg-yellow-50 border border-yellow-200 rounded-full px-3 py-1 ${className}`}
        title={`Lv.${level} ${name} — ${totalXp.toLocaleString()} XP`}
      >
        <span className="text-base leading-none">⭐</span>
        <span className="text-xs font-black text-yellow-700 tabular-nums">
          {totalXp.toLocaleString()} XP
        </span>
        <span className="text-[10px] font-black text-yellow-500 uppercase tracking-wide">
          Lv.{level}
        </span>
      </div>
    );
  }

  // detailed
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-yellow-200 bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 p-4 shadow-sm ${className}`}
    >
      <div className="flex items-center gap-4">
        {/* Level badge */}
        <div className="relative shrink-0">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-200">
            <div className="text-center leading-none">
              <div className="text-[9px] font-black uppercase tracking-widest opacity-80">Lv</div>
              <div className="text-2xl font-black tabular-nums">{level}</div>
            </div>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="truncate text-base font-black text-amber-900">{name}</span>
            <span className="shrink-0 text-[10px] font-black uppercase tracking-widest text-amber-600">
              {totalXp.toLocaleString()} XP
            </span>
          </div>

          {/* Progress bar */}
          <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-amber-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-700 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>

          <div className="mt-1 flex items-center justify-between text-[10px] font-bold text-amber-700/80 tabular-nums">
            {isMax ? (
              <span className="italic">MAX LEVEL</span>
            ) : (
              <>
                <span>{current.toLocaleString()} / {next.toLocaleString()} XP</span>
                <span>{pct}%</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
