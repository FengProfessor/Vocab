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
        className={`flex items-center gap-1.5 rounded-full border border-slate-200/90 bg-slate-50/80 px-3 py-1 dark:border-[#272C47] dark:bg-[#0D0F1E]/80 ${className}`}
        title={`Lv.${level} ${name} — ${totalXp.toLocaleString()} XP`}
      >
        <span className="text-base leading-none">⭐</span>
        <span className="text-xs font-extrabold text-slate-800 tabular-nums dark:text-[#F2F3FB]">
          {totalXp.toLocaleString()} XP
        </span>
        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wide dark:text-[#B3A8FF]">
          Lv.{level}
        </span>
      </div>
    );
  }

  // detailed
  return (
    <div
      className={`relative flex h-full flex-col justify-between overflow-hidden rounded-[18px] border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs transition-colors dark:border-[#272C47] dark:bg-[#161A2E] ${className}`}
    >
      <div className="flex items-center gap-3.5 sm:gap-4">
        {/* Level badge */}
        <div className="relative shrink-0">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-sm shadow-indigo-500/20 dark:bg-[#7B67FF]">
            <div className="text-center leading-none">
              <div className="text-[9px] font-bold uppercase tracking-widest opacity-85">Lv</div>
              <div className="mt-0.5 text-xl font-extrabold tabular-nums">{level}</div>
            </div>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="truncate text-[16px] font-extrabold text-slate-900 dark:text-[#F2F3FB]">
              {name}
            </span>
            <span className="shrink-0 text-xs font-extrabold uppercase tracking-wider text-indigo-600 tabular-nums dark:text-[#B3A8FF]">
              {totalXp.toLocaleString()} XP
            </span>
          </div>

          {/* Progress bar */}
          <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-[#20253F]">
            <div
              className="h-full rounded-full bg-indigo-600 transition-all duration-700 ease-out dark:bg-[#7B67FF]"
              style={{ width: `${pct}%` }}
            />
          </div>

          <div className="mt-1.5 flex items-center justify-between text-[11px] font-semibold text-slate-500 tabular-nums dark:text-[#A5AAC6]">
            {isMax ? (
              <span className="font-bold text-indigo-600 dark:text-[#B3A8FF]">
                Đã đạt cấp độ tối đa (MAX LEVEL)
              </span>
            ) : (
              <>
                <span>
                  {current.toLocaleString()} / {next.toLocaleString()} XP
                </span>
                <span className="font-bold text-indigo-600 dark:text-[#B3A8FF]">{pct}%</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
