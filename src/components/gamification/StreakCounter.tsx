'use client';

interface Props {
  streak: number;
  lastActiveDate?: string | null;
  variant?: 'compact' | 'detailed' | 'calendar';
  dailyCounts?: { date: string; count: number }[];
  className?: string;
}

const HEAT_PALETTE = ['#eef2f5', '#cde7d8', '#86d6a6', '#34b87a', '#15875a'];
const MONTH_LABELS = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
];

function toLocalDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseLocalDateKey(key: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

function countToLevel(count: number): number {
  if (count <= 0) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  if (count <= 10) return 3;
  return 4;
}

function buildLast7Days(streak: number, lastActiveDate: string | null | undefined) {
  const days: { date: Date; label: string; active: boolean; isToday: boolean }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lastActive = lastActiveDate ? parseLocalDateKey(lastActiveDate.slice(0, 10)) : null;
  if (lastActive) lastActive.setHours(0, 0, 0, 0);
  const DAY = 86_400_000;
  const dayLabels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today.getTime() - i * DAY);
    let active = false;
    if (lastActive && streak > 0) {
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
        <span className={`text-xl leading-none ${isActive ? '' : 'grayscale opacity-50'}`}>🔥</span>
        <span className={`text-sm font-black tabular-nums ${isActive ? 'text-orange-500' : 'text-muted-foreground'}`}>
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
    const lead = new Date(year, month, 1).getDay();
    const weekdays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

    const intensityByDay: Record<number, number> = {};
    const minsByDay: Record<number, number> = {};
    for (const { date, count } of dailyCounts ?? []) {
      const d = parseLocalDateKey(date.slice(0, 10));
      if (!d) continue;
      if (d.getFullYear() === year && d.getMonth() === month) {
        intensityByDay[d.getDate()] = countToLevel(count);
        minsByDay[d.getDate()] = count;
      }
    }

    const activeDays = Object.values(minsByDay).filter((c) => c > 0).length;
    const totalReviews = Object.values(minsByDay).reduce((s, c) => s + c, 0);

    // Mobile: heatmap siêu gọn; desktop giữ đọc được
    const cellBase =
      'flex items-center justify-center rounded-[3px] font-extrabold tabular-nums aspect-square text-[7px] sm:text-[9.5px] min-h-[16px] sm:min-h-0';

    return (
      <div
        className={`flex flex-col gap-1 rounded-xl border border-[#e9e9f0] bg-white p-2 shadow-[0_1px_2px_rgba(16,24,40,.04)] sm:flex-row sm:items-stretch sm:gap-3 sm:rounded-[18px] sm:p-[13px_14px] ${className}`}
      >
        {/* Header siêu gọn mobile */}
        <div className="flex shrink-0 items-center gap-1.5 sm:w-[70px] sm:flex-col sm:items-start sm:gap-1.5">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-orange-400 to-orange-500 text-[11px] shadow-sm sm:h-[30px] sm:w-[30px] sm:rounded-[9px] sm:text-[15px]">
            🔥
          </div>
          <div className="min-w-0 flex-1 sm:flex-none">
            <div className="flex items-baseline gap-0.5">
              <span className="text-sm font-black leading-none text-orange-600 sm:text-[21px]">{streak}</span>
              <span className="text-[9px] font-bold text-orange-400 sm:text-[11px]">ngày</span>
            </div>
            <div className="text-[9px] font-extrabold text-[#94a3b8] sm:mt-0.5 sm:text-[10px] sm:uppercase sm:tracking-wider sm:text-orange-400">
              <span className="sm:hidden">{MONTH_LABELS[month]} · {activeDays}d</span>
              <span className="hidden sm:inline">streak</span>
            </div>
            <div className="hidden text-[10.5px] font-bold text-[#aab0bd] sm:block">{MONTH_LABELS[month]}</div>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1 hidden items-center justify-between sm:mb-[3px] sm:flex">
            <span className="text-[11px] font-extrabold text-[#0f172a]">Bảng hoạt động hàng tháng</span>
            <span className="text-[10px] font-bold text-[#aab0bd]">
              {activeDays} ngày · {totalReviews} lượt
            </span>
          </div>

          <div className="mb-px grid grid-cols-7 gap-px sm:mb-[3px] sm:gap-[3px]">
            {weekdays.map((wd) => (
              <div key={wd} className="text-center text-[6px] font-extrabold uppercase text-[#b3b8c4] sm:text-[8px]">
                {wd}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-px sm:gap-[3px]">
            {Array.from({ length: lead }).map((_, i) => (
              <div key={`lead-${i}`} className="aspect-square min-h-[16px] sm:min-h-0" />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
              const isToday = d === todayDate;
              const future = d > todayDate;
              if (future) {
                return (
                  <div
                    key={d}
                    className={`${cellBase} border border-[#eef0f3] bg-[#f8f9fb] text-[#c8cdd6]`}
                    title={`${d} · sắp tới`}
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
                    boxShadow: isToday ? `0 0 0 1px #fff, 0 0 0 2px ${HEAT_PALETTE[4]}` : undefined,
                  }}
                  title={`${d}${mins ? ` · ${mins} từ` : ' · nghỉ'}`}
                >
                  {d}
                </div>
              );
            })}
          </div>

          {/* Legend: ẩn mobile để gọn */}
          <div className="mt-[9px] hidden items-center justify-end gap-1.5 sm:flex">
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

  const days = buildLast7Days(streak, lastActiveDate);

  return (
    <div
      className={`rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 p-4 shadow-sm ${className}`}
    >
      <div className="flex items-center gap-4">
        <div
          className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-4xl ${
            isActive
              ? 'bg-gradient-to-br from-orange-400 to-red-500 shadow-lg shadow-orange-200'
              : 'bg-slate-100 grayscale'
          }`}
        >
          🔥
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-1.5">
            <span className={`text-3xl font-black tabular-nums ${isActive ? 'text-orange-600' : 'text-slate-400'}`}>
              {streak}
            </span>
            <span className={`text-xs font-black uppercase tracking-widest ${isActive ? 'text-orange-500' : 'text-slate-400'}`}>
              ngày streak
            </span>
          </div>
          {!isActive && (
            <p className="mt-0.5 text-[11px] font-bold text-orange-600/80">Bắt đầu streak hôm nay!</p>
          )}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-1">
        {days.map((d, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1">
            <span className={`text-[9px] font-black uppercase ${d.isToday ? 'text-orange-600' : 'text-slate-400'}`}>
              {d.label}
            </span>
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
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

export { toLocalDateKey };
