/**
 * Fallback presence khi chưa có bảng room_presence (localStorage).
 * Đủ để thấy mình + tab khác cùng máy; multi-user thật cần migration.
 */
import type { RoomPresenceMember } from '@/lib/room-presence';
import { PRESENCE_ONLINE_MS } from '@/lib/room-presence';

const KEY = 'lingopro-hub-presence-v1';

interface Store {
  rooms: Record<
    string,
    Array<{
      userId: string;
      displayName: string;
      activityKey: string;
      activityLabel: string;
      lastSeenAt: number;
    }>
  >;
}

function read(): Store {
  if (typeof window === 'undefined') return { rooms: {} };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { rooms: {} };
    return JSON.parse(raw) as Store;
  } catch {
    return { rooms: {} };
  }
}

function write(s: Store): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* quota */
  }
}

export function localPresenceUpsert(opts: {
  roomId: string;
  userId: string;
  displayName: string;
  activityKey: string;
  activityLabel: string;
}): void {
  const s = read();
  const list = s.rooms[opts.roomId] ?? [];
  const now = Date.now();
  const next = list.filter((m) => m.userId !== opts.userId);
  next.push({
    userId: opts.userId,
    displayName: opts.displayName,
    activityKey: opts.activityKey,
    activityLabel: opts.activityLabel,
    lastSeenAt: now,
  });
  // prune stale
  s.rooms[opts.roomId] = next.filter((m) => now - m.lastSeenAt < PRESENCE_ONLINE_MS * 3);
  write(s);
  // multi-tab
  try {
    window.dispatchEvent(new CustomEvent('lingopro-presence-local', { detail: opts.roomId }));
  } catch {
    /* ignore */
  }
}

export function localPresenceList(
  roomId: string,
  selfId?: string | null
): RoomPresenceMember[] {
  const s = read();
  const now = Date.now();
  const list = s.rooms[roomId] ?? [];
  return list
    .filter((m) => now - m.lastSeenAt <= PRESENCE_ONLINE_MS)
    .map((m) => ({
      userId: m.userId,
      displayName: m.displayName,
      activityKey: m.activityKey,
      activityLabel: m.activityLabel,
      lastSeenAt: new Date(m.lastSeenAt).toISOString(),
      online: true,
      isYou: Boolean(selfId && m.userId === selfId),
    }))
    .sort((a, b) => (a.isYou === b.isYou ? 0 : a.isYou ? -1 : 1));
}

export function localPresenceSelfId(): string {
  if (typeof window === 'undefined') return 'local-guest';
  const k = 'lingopro-presence-self-id';
  let id = localStorage.getItem(k);
  if (!id) {
    id = `local-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(k, id);
  }
  return id;
}
