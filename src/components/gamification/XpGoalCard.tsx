'use client';
import { levelProgress } from '@/lib/gamification';

interface Props {
  totalXp: number;
  /** XP kiếm được hôm nay */
  todayXp: number;
  /** Mục tiêu XP/ngày (mặc định 30) */
  dailyXpGoal?: number;
  /** Số từ đã học hôm nay */
  todayWords: number;
  /** Mục tiêu từ/ngày (mặc định 10) */
  dailyWordGoal?: number;
  className?: string;
}

/**
 * XpGoalCard — card góc nhỏ gọn gộp:
 * - hàng trên: level chip + tên level + progress bar XP tổng
 * - hàng dưới: ring mục tiêu ngày (theo TỪ là chính, XP là phụ)
 * Theo design handoff dashboard redesign.
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

  // Mục tiêu ngày tính theo TỪ (chính)
  const goalPct = Math.min(100, dailyWordGoal > 0 ? Math.round((todayWords / dailyWordGoal) * 100) : 0);
  const done = goalPct >= 100;
  const remaining = Math.max(0, dailyWordGoal - todayWords);
  const ringColor = done ? '#f59e0b' : '#10b981';

  // Ring 44px
  const rSm = 18;
  const circSm = 2 * Math.PI * rSm;
  const dashSm = (goalPct / 100) * circSm;

  return (
    <div
      className={`flex flex-col justify-center gap-2 rounded-2xl border border-[#e9e9f0] bg-white p-3 shadow-[0_1px_2px_rgba(16,24,40,.04)] ${className}`}
    >
      {/* Level + XP 1 hàng */}
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 shrink-0 flex-col items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-amber-500 leading-none text-white shadow-sm">
          <span className="text-[6px] font-extrabold opacity-85">LV</span>
          <span className="text-[13px] font-black">{level}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="truncate text-xs font-black text-[#92400e]">{name}</span>
            <span className="shrink-0 text-[10px] font-extrabold text-[#b88407] tabular-nums">
              {isMax ? 'MAX' : `${current}/${next}`}
            </span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#fdf0d4]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-700 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Mục tiêu ngày — gọn */}
      <div className="flex items-center gap-2.5 rounded-xl bg-[#f8faf9] px-2.5 py-2">
        <div className="relative h-11 w-11 shrink-0">
          <svg width="44" height="44" viewBox="0 0 44 44" className="-rotate-90">
            <circle cx="22" cy="22" r={rSm} fill="none" stroke="#e6f6ee" strokeWidth="5" />
            <circle
              cx="22"
              cy="22"
              r={rSm}
              fill="none"
              stroke={ringColor}
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={`${dashSm} ${circSm}`}
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[11px] font-black leading-none" style={{ color: ringColor }}>
              {goalPct}%
            </span>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-extrabold uppercase tracking-wide text-[#9aa2b1]">
            Hôm nay
          </div>
          <div className="mt-0.5 flex flex-wrap items-baseline gap-x-2 gap-y-0">
            <span className="text-sm font-black text-[#059669] tabular-nums">
              {todayWords}/{dailyWordGoal} từ
            </span>
            <span className="text-[10px] font-bold text-[#aab0bd] tabular-nums">
              {todayXp}/{dailyXpGoal} XP
            </span>
          </div>
          <div className="mt-0.5 text-[10px] font-extrabold" style={{ color: done ? '#b45309' : '#047857' }}>
            {done ? '🎯 Đạt mục tiêu' : `Còn ${remaining} từ`}
          </div>
        </div>
      </div>
    </div>
  );
}
