'use client';

/**
 * Thư viện pixel RỘNG ~100 chỗ, người nhỏ, tên + activity.
 */
import { useMemo, useState } from 'react';
import { metaForActivity, type RoomPresenceMember } from '@/lib/room-presence';

/** ~100 ghế rải trên map (lưới bàn học) */
function buildSeats(count: number): Array<{ x: number; y: number }> {
  const seats: Array<{ x: number; y: number }> = [];
  // 10 hàng × 10 cột trong vùng bàn (tránh mép map)
  const rows = 10;
  const cols = 10;
  const x0 = 0.08;
  const x1 = 0.92;
  const y0 = 0.18;
  const y1 = 0.88;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = x0 + ((x1 - x0) * (c + 0.5)) / cols;
      const y = y0 + ((y1 - y0) * (r + 0.5)) / rows;
      // jitter nhẹ deterministic
      const jx = (((r * 13 + c * 7) % 5) - 2) * 0.004;
      const jy = (((r * 9 + c * 11) % 5) - 2) * 0.003;
      seats.push({ x: x + jx, y: y + jy });
      if (seats.length >= count) return seats;
    }
  }
  return seats;
}

const SEATS = buildSeats(100);

const PALETTE = [
  '#2dd4bf', '#f472b6', '#60a5fa', '#fbbf24', '#a78bfa',
  '#4ade80', '#fb7185', '#38bdf8', '#eab308', '#c084fc',
  '#34d399', '#f9a8d4', '#93c5fd', '#fcd34d', '#d8b4fe',
];

function colorForId(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return PALETTE[Math.abs(h) % PALETTE.length];
}

function seatIndex(userId: string, i: number): number {
  let h = i * 17;
  for (let k = 0; k < userId.length; k++) h = (h * 33 + userId.charCodeAt(k)) | 0;
  return Math.abs(h) % SEATS.length;
}

interface Props {
  members: RoomPresenceMember[];
  onlineCount: number;
  roomLabel: string;
  notReady?: boolean;
  mapSrc?: string;
  selfDisplayName?: string | null;
  selfUserId?: string | null;
}

export function PixelHubRoom({
  members,
  onlineCount,
  roomLabel,
  notReady,
  mapSrc = '/lingo-town/library-wide.jpg',
  selfDisplayName,
  selfUserId,
}: Props) {
  const [showList, setShowList] = useState(false);

  const effectiveMembers = useMemo(() => {
    const list = [...members];
    if (selfDisplayName) {
      const sid = selfUserId || 'self';
      const hasSelf = list.some((m) => m.isYou || m.userId === sid);
      if (!hasSelf) {
        list.unshift({
          userId: sid,
          displayName: selfDisplayName,
          activityKey: 'hub',
          activityLabel: 'Ở thư viện',
          lastSeenAt: new Date().toISOString(),
          online: true,
          isYou: true,
        });
      }
    }
    return list.sort((a, b) => Number(!!b.isYou) - Number(!!a.isYou)).slice(0, 100);
  }, [members, selfDisplayName, selfUserId]);

  const placed = useMemo(() => {
    const used = new Set<number>();
    return effectiveMembers.map((m, i) => {
      let si = seatIndex(m.userId, i);
      let guard = 0;
      while (used.has(si) && guard < SEATS.length) {
        si = (si + 1) % SEATS.length;
        guard += 1;
      }
      used.add(si);
      return { member: m, seat: SEATS[si], color: colorForId(m.userId) };
    });
  }, [effectiveMembers]);

  const count = Math.max(onlineCount, effectiveMembers.length);

  return (
    <div
      className="relative w-full overflow-hidden border-b-2 border-[#3d2914]"
      style={{ boxShadow: 'inset 0 0 40px #0006' }}
    >
      {notReady && (
        <div
          className="absolute top-12 left-1/2 z-30 -translate-x-1/2 max-w-md px-3 py-1.5 text-[10px] text-amber-100 border border-amber-700/50 rounded font-mono"
          style={{ background: 'rgba(30,18,10,0.9)' }}
        >
          Local mode · multi-user thật cần migration room_presence
        </div>
      )}

      {/* HUD float */}
      <div
        className="absolute top-2 left-2 right-2 z-20 flex items-center justify-between gap-2 pointer-events-none"
      >
        <div
          className="pointer-events-auto px-3 py-1.5 rounded border border-[#5c3d24] max-w-[60%]"
          style={{
            background: 'rgba(20,12,8,0.88)',
            fontFamily: 'ui-monospace, monospace',
          }}
        >
          <div className="text-[9px] uppercase tracking-widest text-amber-500/80">Thư viện</div>
          <div className="text-xs font-bold text-amber-50 truncate">{roomLabel}</div>
        </div>
        <button
          type="button"
          onClick={() => setShowList((v) => !v)}
          className="pointer-events-auto inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-emerald-800/60 bg-black/70"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-50" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
          <span className="text-amber-50 font-mono text-sm font-bold tabular-nums">{count}</span>
          <span className="text-[10px] text-amber-200/50">/100</span>
        </button>
      </div>

      {/* Wide map — full width, shorter height so room feels large */}
      <div className="relative w-full h-[min(72vh,640px)] min-h-[320px] bg-[#0c0806]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={mapSrc}
          alt="Thư viện rộng"
          className="absolute inset-0 h-full w-full object-cover"
          draggable={false}
          onError={(e) => {
            const el = e.currentTarget;
            if (!el.src.includes('library.jpg')) {
              el.src = '/lingo-town/library.jpg';
            }
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at center, transparent 30%, rgba(8,5,3,0.45) 100%)',
          }}
        />

        {placed.map(({ member, seat, color }) => {
          const meta = metaForActivity(member.activityKey);
          const isYou = member.isYou;
          return (
            <div
              key={member.userId}
              className="absolute z-10 flex flex-col items-center"
              style={{
                left: `${seat.x * 100}%`,
                top: `${seat.y * 100}%`,
                transform: 'translate(-50%, -85%)',
              }}
            >
              {/* bubble activity — chỉ khi không quá đông label, luôn hiện emoji nhỏ */}
              {(isYou || effectiveMembers.length <= 40) && (
                <div
                  className="mb-px max-w-[4.5rem] px-1 py-px text-[7px] leading-tight text-center truncate border border-black/20 shadow-sm"
                  style={{
                    background: 'rgba(255,251,235,0.92)',
                    color: '#1c1917',
                    fontFamily: 'ui-monospace, monospace',
                  }}
                  title={member.activityLabel}
                >
                  {meta.emoji}
                  {isYou || effectiveMembers.length <= 24
                    ? ` ${shortLabel(member.activityLabel || meta.label, 10)}`
                    : ''}
                </div>
              )}
              <PixelDude color={color} highlight={isYou} size={isYou ? 16 : 12} />
              <div
                className={`mt-px px-1 py-px text-[7px] font-bold max-w-[3.6rem] truncate border ${
                  isYou
                    ? 'bg-amber-400 text-amber-950 border-amber-200'
                    : 'bg-black/75 text-amber-50 border-white/10'
                }`}
                style={{ fontFamily: 'ui-monospace, monospace' }}
                title={member.displayName}
              >
                {member.displayName}
              </div>
            </div>
          );
        })}

        {effectiveMembers.length === 0 && (
          <div className="absolute inset-0 z-10 flex items-center justify-center p-4">
            <div
              className="px-4 py-3 text-center text-xs text-amber-100/90 border border-amber-800/50 rounded"
              style={{ background: 'rgba(20,12,8,0.88)', fontFamily: 'ui-monospace, monospace' }}
            >
              Đặt tên → bạn hiện trong thư viện
            </div>
          </div>
        )}
      </div>

      {showList && effectiveMembers.length > 0 && (
        <ul
          className="max-h-36 overflow-y-auto divide-y divide-amber-950/80 border-t border-[#3d2914] grid sm:grid-cols-2 lg:grid-cols-3"
          style={{ background: '#1a120c', fontFamily: 'ui-monospace, monospace' }}
        >
          {effectiveMembers.map((m) => {
            const meta = metaForActivity(m.activityKey);
            return (
              <li
                key={m.userId}
                className={`flex items-center gap-1.5 px-2 py-1 text-[10px] ${
                  m.isYou ? 'bg-amber-500/10' : ''
                }`}
              >
                <span
                  className="w-2 h-2 rounded-sm shrink-0"
                  style={{ background: colorForId(m.userId) }}
                />
                <span className="text-amber-50 font-semibold truncate flex-1 min-w-0">
                  {m.displayName}
                  {m.isYou ? ' ★' : ''}
                </span>
                <span className="text-amber-200/55 shrink-0 truncate max-w-[40%]">
                  {meta.emoji} {m.activityLabel}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function shortLabel(s: string, max = 12): string {
  return s.length <= max ? s : `${s.slice(0, max - 1)}…`;
}

function PixelDude({
  color,
  highlight,
  size = 12,
}: {
  color: string;
  highlight?: boolean;
  size?: number;
}) {
  const s = size;
  return (
    <div
      className="relative"
      style={{
        width: s,
        height: s * 1.35,
        filter: highlight
          ? 'drop-shadow(0 0 3px #fbbf24)'
          : 'drop-shadow(0 1px 0 rgba(0,0,0,0.4))',
      }}
    >
      <div
        className="absolute left-1/2 -translate-x-1/2"
        style={{
          top: 0,
          width: s * 0.45,
          height: s * 0.45,
          background: '#fde68a',
        }}
      />
      <div
        className="absolute left-1/2 -translate-x-1/2"
        style={{
          top: s * 0.42,
          width: s * 0.55,
          height: s * 0.45,
          background: color,
        }}
      />
      <div
        className="absolute bg-stone-800"
        style={{ top: s * 0.88, left: s * 0.22, width: s * 0.2, height: s * 0.35 }}
      />
      <div
        className="absolute bg-stone-800"
        style={{ top: s * 0.88, left: s * 0.58, width: s * 0.2, height: s * 0.35 }}
      />
    </div>
  );
}
