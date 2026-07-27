/**
 * LingoTown demo v2 — map/sprite assets + progress.
 * Zones dùng tọa độ chuẩn hóa 0–1 theo ảnh map.jpg
 */

export type ZoneId =
  | 'fountain'
  | 'grove'
  | 'pier'
  | 'board'
  | 'shop'
  | 'hall'
  | 'arena'
  | 'desk';

export interface ZoneDef {
  id: ZoneId;
  name: string;
  emoji: string;
  /** normalized rect on map image */
  x: number;
  y: number;
  w: number;
  h: number;
  blurb: string;
  accent: string;
}

export interface TownProgress {
  name: string;
  xp: number;
  coins: number;
  streak: number;
  lastCheckIn: string | null;
  questsDone: string[];
  inventory: string[];
  equipped: string;
  totalReviews: number;
  racesWon: number;
  updatedAt: number;
}

export const STORAGE_KEY = 'lingotown-demo-v2';

export const ASSETS = {
  map: '/lingo-town/map.jpg',
  hero: '/lingo-town/hero.jpg',
  ui: '/lingo-town/ui.jpg',
} as const;

/** Hotspot bám layout map pixel (fountain center, grove left, …) */
export const ZONES: ZoneDef[] = [
  {
    id: 'fountain',
    name: 'Đài điểm danh',
    emoji: '⛲',
    x: 0.38,
    y: 0.32,
    w: 0.2,
    h: 0.28,
    blurb: 'Check-in mỗi ngày · giữ streak',
    accent: '#38bdf8',
  },
  {
    id: 'grove',
    name: 'Rừng thẻ từ',
    emoji: '🃏',
    x: 0.04,
    y: 0.18,
    w: 0.28,
    h: 0.38,
    blurb: 'Ôn 5 thẻ flashcard',
    accent: '#4ade80',
  },
  {
    id: 'hall',
    name: 'Sảnh nhiệm vụ',
    emoji: '📋',
    x: 0.36,
    y: 0.02,
    w: 0.22,
    h: 0.26,
    blurb: 'Quest ngày & thưởng',
    accent: '#fb923c',
  },
  {
    id: 'board',
    name: 'Bảng xếp hạng',
    emoji: '🏆',
    x: 0.62,
    y: 0.02,
    w: 0.32,
    h: 0.28,
    blurb: 'Hall of Achievement',
    accent: '#f472b6',
  },
  {
    id: 'arena',
    name: 'Đấu trường',
    emoji: '⚔️',
    x: 0.62,
    y: 0.3,
    w: 0.32,
    h: 0.28,
    blurb: 'Race 5 câu vs bot',
    accent: '#f87171',
  },
  {
    id: 'shop',
    name: 'Tiệm quà',
    emoji: '🎁',
    x: 0.04,
    y: 0.62,
    w: 0.22,
    h: 0.32,
    blurb: 'Đổi xu lấy skin',
    accent: '#c084fc',
  },
  {
    id: 'desk',
    name: 'Góc học',
    emoji: '🏡',
    x: 0.28,
    y: 0.62,
    w: 0.18,
    h: 0.3,
    blurb: 'Đổi tên & stats',
    accent: '#a3e635',
  },
  {
    id: 'pier',
    name: 'Cầu thư viện',
    emoji: '📖',
    x: 0.58,
    y: 0.62,
    w: 0.36,
    h: 0.32,
    blurb: 'Hall chung · pair · nói · nhạc',
    accent: '#fbbf24',
  },
];

export const SHOP_ITEMS: Array<{
  id: string;
  name: string;
  cost: number;
  kind: 'skin' | 'title';
  tint: string;
}> = [
  { id: 'skin-default', name: 'Hoodie mint (mặc định)', cost: 0, kind: 'skin', tint: '#2dd4bf' },
  { id: 'skin-sunset', name: 'Aura hoàng hôn', cost: 40, kind: 'skin', tint: '#fb7185' },
  { id: 'skin-gold', name: 'Hào quang vàng', cost: 90, kind: 'skin', tint: '#fbbf24' },
  { id: 'title-farmer', name: 'Word Farmer', cost: 50, kind: 'title', tint: '#86efac' },
  { id: 'title-racer', name: 'Quiz Racer', cost: 60, kind: 'title', tint: '#fda4af' },
  { id: 'title-scholar', name: 'Town Scholar', cost: 100, kind: 'title', tint: '#c4b5fd' },
];

export const QUESTS = [
  { id: 'q-checkin', title: 'Ghé đài phun nước', desc: 'Điểm danh hôm nay', xp: 15, coins: 5 },
  { id: 'q-flash', title: 'Ôn 5 thẻ từ', desc: 'Xong flashcard ở Rừng thẻ', xp: 40, coins: 15 },
  { id: 'q-race', title: 'Vào Đấu trường', desc: 'Chơi 1 race', xp: 35, coins: 12 },
];

export const GROVE_WORDS = [
  { en: 'chore', vi: 'việc vặt' },
  { en: 'grateful', vi: 'biết ơn' },
  { en: 'household', vi: 'hộ gia đình' },
  { en: 'cooperate', vi: 'hợp tác' },
  { en: 'responsibility', vi: 'trách nhiệm' },
];

export const RACE_QUESTIONS = [
  { q: '“việc vặt” → English?', options: ['chore', 'choice', 'chair', 'charge'], a: 'chore' },
  { q: 'grateful nghĩa?', options: ['tức giận', 'biết ơn', 'mệt mỏi', 'bận rộn'], a: 'biết ơn' },
  { q: 'share = ?', options: ['chia sẻ', 'mua sắm', 'sửa chữa', 'so sánh'], a: 'chia sẻ' },
  { q: 'Gần nghĩa “recycle”?', options: ['tái chế', 'ô nhiễm', 'bỏ đi', 'đốt'], a: 'tái chế' },
  { q: 'deadline nghĩa?', options: ['hạn chót', 'bài tập', 'kỳ nghỉ', 'điểm số'], a: 'hạn chót' },
];

export function defaultProgress(): TownProgress {
  return {
    name: 'Học viên',
    xp: 0,
    coins: 25,
    streak: 0,
    lastCheckIn: null,
    questsDone: [],
    inventory: ['skin-default'],
    equipped: 'skin-default',
    totalReviews: 0,
    racesWon: 0,
    updatedAt: Date.now(),
  };
}

export function loadProgress(): TownProgress {
  if (typeof window === 'undefined') return defaultProgress();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultProgress();
    return { ...defaultProgress(), ...(JSON.parse(raw) as TownProgress) };
  } catch {
    return defaultProgress();
  }
}

export function saveProgress(p: TownProgress): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...p, updatedAt: Date.now() }));
}

export function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function yesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function levelFromXp(xp: number): { level: number; into: number; need: number } {
  let level = 1;
  let remain = xp;
  let need = 100;
  while (remain >= need && level < 99) {
    remain -= need;
    level += 1;
    need = 80 + level * 25;
  }
  return { level, into: remain, need };
}

export function activeTitle(inv: string[]): string | null {
  if (inv.includes('title-scholar')) return 'Town Scholar';
  if (inv.includes('title-racer')) return 'Quiz Racer';
  if (inv.includes('title-farmer')) return 'Word Farmer';
  return null;
}

export function skinGlow(equipped: string): string {
  const map: Record<string, string> = {
    'skin-default': 'rgba(45,212,191,0.35)',
    'skin-sunset': 'rgba(251,113,133,0.45)',
    'skin-gold': 'rgba(251,191,36,0.5)',
  };
  return map[equipped] ?? map['skin-default'];
}

export function zoneAtNorm(nx: number, ny: number): ZoneDef | null {
  for (const z of ZONES) {
    if (nx >= z.x && nx <= z.x + z.w && ny >= z.y && ny <= z.y + z.h) return z;
  }
  return null;
}

export function applyCheckIn(p: TownProgress): {
  progress: TownProgress;
  message: string;
  already: boolean;
} {
  const today = todayKey();
  if (p.lastCheckIn === today) {
    return { progress: p, message: 'Hôm nay đã điểm danh rồi!', already: true };
  }
  const streak = p.lastCheckIn === yesterdayKey() ? p.streak + 1 : 1;
  const bonus = Math.min(20, streak * 2);
  const coins = 8 + Math.floor(streak / 2);
  let progress: TownProgress = {
    ...p,
    lastCheckIn: today,
    streak,
    xp: p.xp + 25 + bonus,
    coins: p.coins + coins,
  };
  if (!progress.questsDone.includes('q-checkin')) {
    const q = QUESTS.find((x) => x.id === 'q-checkin')!;
    progress = {
      ...progress,
      questsDone: [...progress.questsDone, 'q-checkin'],
      xp: progress.xp + q.xp,
      coins: progress.coins + q.coins,
    };
  }
  return {
    progress,
    message: `Điểm danh! Streak ${streak} · +${25 + bonus} XP · +${coins} xu`,
    already: false,
  };
}

export function tryCompleteQuest(
  p: TownProgress,
  questId: string
): { progress: TownProgress; gained: boolean; msg: string } {
  if (p.questsDone.includes(questId)) {
    return { progress: p, gained: false, msg: 'Đã nhận thưởng quest này.' };
  }
  const q = QUESTS.find((x) => x.id === questId);
  if (!q) return { progress: p, gained: false, msg: 'Quest?' };
  return {
    progress: {
      ...p,
      questsDone: [...p.questsDone, questId],
      xp: p.xp + q.xp,
      coins: p.coins + q.coins,
    },
    gained: true,
    msg: `“${q.title}” · +${q.xp} XP · +${q.coins} xu`,
  };
}

export function buyItem(
  p: TownProgress,
  itemId: string
): { progress: TownProgress; ok: boolean; msg: string } {
  const item = SHOP_ITEMS.find((x) => x.id === itemId);
  if (!item) return { progress: p, ok: false, msg: 'Item?' };
  if (p.inventory.includes(itemId)) {
    if (item.kind === 'skin') {
      return { progress: { ...p, equipped: itemId }, ok: true, msg: `Đã mặc ${item.name}` };
    }
    return { progress: p, ok: false, msg: 'Đã sở hữu.' };
  }
  if (p.coins < item.cost) return { progress: p, ok: false, msg: `Thiếu xu (cần ${item.cost}).` };
  return {
    progress: {
      ...p,
      coins: p.coins - item.cost,
      inventory: [...p.inventory, itemId],
      equipped: item.kind === 'skin' ? itemId : p.equipped,
    },
    ok: true,
    msg: `Mua ${item.name}`,
  };
}

export function buildLeaderboard(p: TownProgress): Array<{
  rank: number;
  name: string;
  xp: number;
  isYou: boolean;
}> {
  const bots = [
    { name: 'Mai', xp: 420 },
    { name: 'Nam', xp: 380 },
    { name: 'Lan', xp: 310 },
    { name: 'Cô Hà', xp: 520 },
    { name: 'Tuấn', xp: 190 },
    { name: 'Huyền', xp: 260 },
  ];
  return [...bots, { name: p.name || 'Bạn', xp: p.xp, isYou: true as const }]
    .map((x) => ({ name: x.name, xp: x.xp, isYou: Boolean((x as { isYou?: boolean }).isYou) }))
    .sort((a, b) => b.xp - a.xp)
    .map((row, i) => ({ rank: i + 1, ...row }));
}
