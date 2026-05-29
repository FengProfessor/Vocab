'use client';

interface Props {
  streak: number;
  /** ISO date string của ngày active gần nhất (YYYY-MM-DD). Cần cho variant detailed. */
  lastActiveDate?: string | null;
  variant?: 'compact' | 'detailed';
  className?: string;
}

/** Trả về mảng 7 ngày gần nhất (cũ → mới): { date, label, active } */
function buildLast7Days(streak: number, lastActiveDate: string | null | undefined) {
  const days: { date: Date; label: string; active: boolean; isToday: boolean }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Nếu không có lastActiveDate → fallback: chỉ filled n ngày cuối tương đương streak (nhưng chỉ tới hôm nay)
  const lastActive = lastActiveDate ? new Date(lastActiveDate) : null;
  if (lastActive) lastActive.setHours(0, 0, 0, 0);

  const DAY = 86_400_000;
  const dayLabels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today.getTime() - i * DAY);
    let active = false;
    if (lastActive && streak > 0) {
      // Active nếu d nằm trong khoảng [lastActive - (streak-1), lastActive]
      const start = new Date(lastActive.getTime() - (streak - 1) * DAY);
      active = d >= start && d <= lastActive;
    }
    days.push({
      date: d,
      label: dayLabels[d.getDay()],
      active,
      isToday: d.getTime() === today.getTime(),
    });
  }
  return days;
}

export function StreakCounter({
  streak,
  lastActiveDate,
  variant = 'compact',
  className = '',
}: Props) {
  const isActive = streak > 0;

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-1 ${className}`} title={`Streak: ${streak} ngày`}>
        <span
          className={`text-xl leading-none transition-all duration-300 ${
            isActive ? 'drop-shadow-[0_0_6px_rgba(251,146,60,0.8)]' : 'grayscale opacity-50'
          }`}
        >
          🔥
        </span>
        <span
          className={`text-sm font-black tabular-nums ${
            isActive ? 'text-orange-500' : 'text-muted-foreground'
          }`}
        >
          {streak}
        </span>
      </div>
    );
  }

  // detailed
  const days = buildLast7Days(streak, lastActiveDate);

  return (
    <div
      className={`rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 p-4 shadow-sm ${className}`}
    >
      <div className="flex items-center gap-4">
        <div
          className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-4xl transition-all duration-300 ${
            isActive
              ? 'bg-gradient-to-br from-orange-400 to-red-500 shadow-lg shadow-orange-200 drop-shadow-[0_0_8px_rgba(251,146,60,0.6)]'
              : 'bg-slate-100 grayscale'
          }`}
        >
          <span aria-hidden>🔥</span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-1.5">
            <span
              className={`text-3xl font-black tabular-nums transition-all duration-700 ${
                isActive ? 'text-orange-600' : 'text-slate-400'
              }`}
            >
              {streak}
            </span>
            <span
              className={`text-xs font-black uppercase tracking-widest ${
                isActive ? 'text-orange-500' : 'text-slate-400'
              }`}
            >
              ngày streak
            </span>
          </div>

          {!isActive && (
            <p className="mt-0.5 text-[11px] font-bold text-orange-600/80">
              Bắt đầu streak hôm nay!
            </p>
          )}
        </div>
      </div>

      {/* Mini calendar 7 ngày */}
      <div className="mt-3 flex items-center justify-between gap-1">
        {days.map((d, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1">
            <span
              className={`text-[9px] font-black uppercase tracking-tight ${
                d.isToday ? 'text-orange-600' : 'text-slate-400'
              }`}
            >
              {d.label}
            </span>
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] transition-all duration-500 ${
                d.active
                  ? 'bg-gradient-to-br from-orange-400 to-red-500 text-white shadow-sm'
                  : d.isToday
                  ? 'border-2 border-dashed border-orange-300 bg-white'
                  : 'bg-orange-100/60'
              }`}
              title={d.date.toLocaleDateString('vi-VN')}
            >
              {d.active ? '🔥' : ''}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
