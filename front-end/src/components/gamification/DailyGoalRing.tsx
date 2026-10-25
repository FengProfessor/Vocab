'use client';

interface Props {
  todayXp: number;
  dailyGoal: number;
  size?: number;
  /** `compact`: chỉ ring + % nhỏ (header). `detailed`: ring lớn + label X / Y XP + status. */
  variant?: 'compact' | 'detailed';
  /** Cho phép override label (vd: "X / Y từ"). Default: "X / Y XP". */
  unitLabel?: string;
  className?: string;
}

export function DailyGoalRing({
  todayXp,
  dailyGoal,
  size = 40,
  variant = 'compact',
  unitLabel = 'XP',
  className = '',
}: Props) {
  const pct = Math.min(100, dailyGoal > 0 ? Math.round((todayXp / dailyGoal) * 100) : 0);
  const done = pct >= 100;
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  // Khi đạt goal: ring chuyển sang gradient vàng
  const ringColor = done ? '#f59e0b' : '#34d399';
  const ringBgClass = done
    ? 'text-amber-100 dark:text-amber-900/30'
    : 'text-emerald-100 dark:text-emerald-900/30';

  if (variant === 'compact') {
    return (
      <div
        className={`flex flex-col items-center gap-0.5 ${className}`}
        title={`${todayXp}/${dailyGoal} ${unitLabel} hôm nay${done ? ' — Đạt mục tiêu!' : ''}`}
      >
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="currentColor"
            className={ringBgClass}
            strokeWidth={5}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={ringColor}
            strokeWidth={5}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            className="transition-all duration-700 ease-out"
            style={done ? { filter: 'drop-shadow(0 0 4px rgba(245,158,11,0.5))' } : undefined}
          />
        </svg>
        <span
          className={`text-[9px] font-black tabular-nums leading-none ${
            done ? 'text-amber-600' : 'text-emerald-600'
          }`}
        >
          {done ? '🎯' : `${pct}%`}
        </span>
      </div>
    );
  }

  // detailed
  const detailedSize = size < 100 ? 120 : size;
  const dr = (detailedSize - 12) / 2;
  const dCirc = 2 * Math.PI * dr;
  const dDash = (pct / 100) * dCirc;

  return (
    <div
      className={`rounded-2xl border p-4 shadow-sm transition-colors duration-500 ${
        done
          ? 'border-amber-200 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50'
          : 'border-emerald-200 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50'
      } ${className}`}
    >
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <svg width={detailedSize} height={detailedSize} className="-rotate-90">
            <circle
              cx={detailedSize / 2}
              cy={detailedSize / 2}
              r={dr}
              fill="none"
              stroke="currentColor"
              className={ringBgClass}
              strokeWidth={10}
            />
            <circle
              cx={detailedSize / 2}
              cy={detailedSize / 2}
              r={dr}
              fill="none"
              stroke={ringColor}
              strokeWidth={10}
              strokeLinecap="round"
              strokeDasharray={`${dDash} ${dCirc}`}
              className="transition-all duration-700 ease-out"
              style={done ? { filter: 'drop-shadow(0 0 6px rgba(245,158,11,0.6))' } : undefined}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className={`text-2xl font-black tabular-nums leading-none ${
                done ? 'text-amber-600' : 'text-emerald-600'
              }`}
            >
              {pct}%
            </span>
            <span className="mt-0.5 text-[8px] font-black uppercase tracking-widest text-slate-400">
              mục tiêu
            </span>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            Hôm nay
          </div>
          <div className="mt-0.5 flex items-baseline gap-1.5">
            <span
              className={`text-2xl font-black tabular-nums ${
                done ? 'text-amber-600' : 'text-emerald-600'
              }`}
            >
              {todayXp.toLocaleString()}
            </span>
            <span className="text-sm font-bold text-slate-400 tabular-nums">
              / {dailyGoal.toLocaleString()} {unitLabel}
            </span>
          </div>
          <div
            className={`mt-1.5 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black ${
              done
                ? 'bg-amber-100 text-amber-700'
                : 'bg-emerald-100 text-emerald-700'
            }`}
          >
            {done ? '🎯 Đạt mục tiêu!' : `Còn ${Math.max(0, dailyGoal - todayXp)} ${unitLabel}`}
          </div>
        </div>
      </div>
    </div>
  );
}
