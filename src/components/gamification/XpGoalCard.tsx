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

  // Ring 56px, r=24, stroke 7
  const r = 24;
  const circ = 2 * Math.PI * r;
  const dash = (goalPct / 100) * circ;
  const ringColor = done ? '#f59e0b' : '#10b981';

  return (
    <div
      className={`flex flex-col justify-center gap-3 rounded-[18px] border border-[#e9e9f0] bg-white p-[15px_16px] shadow-[0_1px_2px_rgba(16,24,40,.04)] ${className}`}
    >
      {/* Hàng trên: level + XP bar */}
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-[10px] bg-gradient-to-br from-amber-400 to-amber-500 leading-none text-white shadow-[0_3px_8px_rgba(245,158,11,.32)]">
          <span className="text-[7px] font-extrabold tracking-wide opacity-85">LV</span>
          <span className="text-[15px] font-black">{level}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-black text-[#92400e]">{name}</span>
            <span className="text-[10.5px] font-extrabold text-[#b88407] tabular-nums">
              {isMax ? 'MAX' : `${current}/${next} XP`}
            </span>
          </div>
          <div className="mt-1.5 h-[7px] overflow-hidden rounded-full bg-[#fdf0d4]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-700 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      <div className="h-px bg-[#f1f1f5]" />

      {/* Hàng dưới: ring mục tiêu ngày */}
      <div className="flex items-center gap-3">
        <div className="relative h-14 w-14 shrink-0">
          <svg width="56" height="56" viewBox="0 0 56 56" className="-rotate-90">
            <circle cx="28" cy="28" r={r} fill="none" stroke="#e6f6ee" strokeWidth="7" />
            <circle
              cx="28"
              cy="28"
              r={r}
              fill="none"
              stroke={ringColor}
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${circ}`}
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[13px] font-black leading-none" style={{ color: ringColor }}>
              {goalPct}%
            </span>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-extrabold uppercase tracking-wide text-[#9aa2b1]">
            Mục tiêu hôm nay
          </div>
          <div className="mt-0.5 flex items-baseline gap-[3px]">
            <span className="text-[18px] font-black text-[#059669]">{todayWords}</span>
            <span className="text-[11px] font-bold text-[#aab0bd]">/ {dailyWordGoal} từ</span>
          </div>
          <div className="mt-px text-[10.5px] font-bold text-[#aab0bd] tabular-nums">
            {todayXp} / {dailyXpGoal} XP
          </div>
          <div
            className="mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold"
            style={{
              background: done ? '#fef3c7' : '#d1fae5',
              color: done ? '#b45309' : '#047857',
            }}
          >
            {done ? '🎯 Đạt mục tiêu!' : `Còn ${remaining} từ`}
          </div>
        </div>
      </div>
    </div>
  );
}
