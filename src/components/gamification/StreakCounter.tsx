'use client';

interface Props {
  streak: number;
  /** ISO date string của ngày active gần nhất (YYYY-MM-DD). Cần cho variant detailed. */
  lastActiveDate?: string | null;
  variant?: 'compact' | 'detailed' | 'calendar';
  /** Hoạt động theo ngày (YYYY-MM-DD → số từ ôn). Dùng cho variant calendar. */
  dailyCounts?: { date: string; count: number }[];
  className?: string;
}

// Bảng màu heatmap 5 mức (light → dark green) theo design handoff
const HEAT_PALETTE = ['#eef2f5', '#cde7d8', '#86d6a6', '#34b87a', '#15875a'];
const MONTH_LABELS = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
];

/** Map số từ ôn trong ngày → mức cường độ 0-4 */
function countToLevel(count: number): number {
  if (count <= 0) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  if (count <= 10) return 3;
  return 4;
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
  dailyCounts,
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

  if (variant === 'calendar') {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const todayDate = now.getDate();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const lead = new Date(year, month, 1).getDay(); // 0=CN
    const weekdays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

    // Map ngày → cường độ từ dailyCounts (real data)
    const intensityByDay: Record<number, number> = {};
    const minsByDay: Record<number, number> = {};
    for (const { date, count } of dailyCounts ?? []) {
      const d = new Date(date);
      if (d.getFullYear() === year && d.getMonth() === month) {
        intensityByDay[d.getDate()] = countToLevel(count);
        minsByDay[d.getDate()] = count;
      }
    }

    const cellBase =
      'flex items-center justify-center rounded-[5px] text-[9.5px] font-extrabold tabular-nums aspect-square';

    return (
      <div
        className={`flex items-center gap-3 rounded-[18px] border border-[#e9e9f0] bg-white p-[13px_14px] shadow-[0_1px_2px_rgba(16,24,40,.04)] ${className}`}
      >
        {/* Left block */}
        <div className="flex w-[70px] shrink-0 flex-col gap-1.5">
          <div className="flex h-[30px] w-[30px] items-center justify-center rounded-[9px] bg-gradient-to-br from-orange-400 to-orange-500 text-[15px] shadow-[0_4px_10px_rgba(249,115,22,.3)]">
            🔥
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-[21px] font-black leading-none text-orange-600">{streak}</span>
              <span className="text-[11px] font-bold text-orange-400">ngày</span>
            </div>
            <div className="mt-px text-[10px] font-extrabold uppercase tracking-wider text-orange-400">
              streak
            </div>
          </div>
          <div className="text-[10.5px] font-bold text-[#aab0bd]">{MONTH_LABELS[month]}</div>
        </div>

        {/* Right block: calendar */}
        <div className="min-w-0 flex-1">
          <div className="mb-[3px] grid grid-cols-7 gap-[3px]">
            {weekdays.map((wd) => (
              <div key={wd} className="text-center text-[8px] font-extrabold uppercase text-[#b3b8c4]">
                {wd}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-[3px]">
            {Array.from({ length: lead }).map((_, i) => (
              <div key={`lead-${i}`} className="aspect-square" />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
              const isToday = d === todayDate;
              const future = d > todayDate;
              if (future) {
                return (
                  <div
                    key={d}
                    className={`${cellBase} border border-[#eef0f3] bg-[#f8f9fb] text-[#c8cdd6]`}
                    title={`${d} ${MONTH_LABELS[month].toLowerCase()} · sắp tới`}
                  >
                    {d}
                  </div>
                );
              }
              const lvl = intensityByDay[d] ?? 0;
              const fg = lvl >= 3 ? '#ffffff' : lvl <= 1 ? '#9aa3b2' : '#0a6b4a';
              const mins = minsByDay[d] ?? 0;
              return (
                <div
                  key={d}
                  className={cellBase}
                  style={{
                    background: HEAT_PALETTE[lvl],
                    color: fg,
                    border: lvl === 0 ? '1px solid #e8ebef' : '1px solid rgba(0,0,0,.04)',
                    boxShadow: isToday ? `0 0 0 2px #fff, 0 0 0 3px ${HEAT_PALETTE[4]}` : undefined,
                  }}
                  title={`${d} ${MONTH_LABELS[month].toLowerCase()}${mins ? ` · ${mins} từ` : ' · nghỉ'}`}
                >
                  {d}
                </div>
              );
            })}
          </div>
          {/* Legend */}
          <div className="mt-[9px] flex items-center justify-end gap-1.5">
            <span className="text-[10px] font-bold text-[#b3b8c4]">Ít</span>
            <div className="flex gap-[3px]">
              {HEAT_PALETTE.map((c) => (
                <div
                  key={c}
                  className="h-3 w-3 rounded-[3px] border border-black/5"
                  style={{ background: c }}
                />
              ))}
            </div>
            <span className="text-[10px] font-bold text-[#b3b8c4]">Nhiều</span>
          </div>
        </div>
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
