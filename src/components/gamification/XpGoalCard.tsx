'use client';
import { levelProgress } from '@/lib/gamification';
import { cn } from '@/lib/utils';

interface Props {
  totalXp: number;
  todayXp: number;
  dailyXpGoal?: number;
  todayWords: number;
  dailyWordGoal?: number;
  className?: string;
}

/**
 * XpGoalCard — mobile: cột phải cạnh heatmap (Rookie + XP + mục tiêu).
 */
export function XpGoalCard({
  totalXp,
  todayXp,
  dailyXpGoal = 30,
  todayWords,
  dailyWordGoal = 10,
  className = '',
}: Props) {
  const { level, name, current, next, pct, isMax } = levelProgress(totalXp);

  const goalPct = Math.min(100, dailyWordGoal > 0 ? Math.round((todayWords / dailyWordGoal) * 100) : 0);
  const done = goalPct >= 100;
  const remaining = Math.max(0, dailyWordGoal - todayWords);
  const ringColor = done ? '#f59e0b' : '#10b981';

  const r = 11;
  const circ = 2 * Math.PI * r;
  const dash = (goalPct / 100) * circ;

  return (
    <div
      className={cn(
        'flex h-full flex-col justify-center gap-1 rounded-xl border border-[#e9e9f0] bg-white px-2 py-1.5 shadow-[0_1px_2px_rgba(16,24,40,.04)]',
        'sm:gap-2 sm:rounded-2xl sm:p-3',
        className,
      )}
    >
      {/* Rookie + level + XP bar */}
      <div className="flex items-center gap-1.5">
        <div className="flex h-7 w-7 shrink-0 flex-col items-center justify-center rounded-md bg-gradient-to-br from-amber-400 to-amber-500 leading-none text-white shadow-sm sm:h-8 sm:w-8 sm:rounded-lg">
          <span className="text-[5px] font-extrabold opacity-85 sm:text-[6px]">LV</span>
          <span className="text-[11px] font-black sm:text-[13px]">{level}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-1">
            <span className="truncate text-[11px] font-black text-[#92400e] sm:text-xs">{name}</span>
            <span className="shrink-0 text-[9px] font-extrabold text-[#b88407] tabular-nums sm:text-[10px]">
              {isMax ? 'MAX' : `${current}/${next}`}
            </span>
          </div>
          <div className="mt-0.5 h-1 overflow-hidden rounded-full bg-[#fdf0d4] sm:h-1.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-700 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Mục tiêu hôm nay — gọn bên phải */}
      <div className="flex items-center gap-1.5 rounded-lg bg-[#f8faf9] px-1.5 py-1 sm:gap-2.5 sm:rounded-xl sm:px-2.5 sm:py-2">
        <div className="relative h-7 w-7 shrink-0 sm:h-11 sm:w-11">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 28 28">
            <circle cx="14" cy="14" r={r} fill="none" stroke="#e6f6ee" strokeWidth="3.5" />
            <circle
              cx="14"
              cy="14"
              r={r}
              fill="none"
              stroke={ringColor}
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${circ}`}
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[8px] font-black leading-none sm:text-[11px]" style={{ color: ringColor }}>
              {goalPct}%
            </span>
          </div>
        </div>
        <div className="min-w-0 flex-1 leading-tight">
          <div className="text-[8px] font-extrabold uppercase tracking-wide text-[#9aa2b1] sm:text-[10px]">
            Mục tiêu
          </div>
          <div className="text-[11px] font-black tabular-nums text-[#059669] sm:text-sm">
            {todayWords}
            <span className="text-[9px] font-bold text-[#94a3b8]">/{dailyWordGoal} từ</span>
          </div>
          <div className="text-[8px] font-bold tabular-nums text-[#aab0bd] sm:text-[10px]">
            {todayXp}/{dailyXpGoal} XP
            <span className="ml-1 font-extrabold" style={{ color: done ? '#b45309' : '#047857' }}>
              {done ? '✓' : `còn ${remaining}`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
