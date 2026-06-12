/**
 * Catalog V3 — sinh artifact CÓ CẤU TRÚC, DETERMINISTIC từ pro3m.json + pro3m-plus.json.
 * Cấu trúc: route → topic → subtopic (= lesson nguồn) → pack (10-20 từ) → word.
 *
 * - Stable ID KHÔNG chứa catalogVersion (id chỉ phụ thuộc danh tính nguồn) → tăng version không vỡ progress.
 * - Chạy 2 lần ra file giống hệt (không phụ thuộc DB/thời gian).
 * - KHÔNG tính chất lượng ảnh ở đây (quality-gate.ts làm, đọc DB). Field publishStatus mặc định 'draft'.
 *
 * Chạy (web-app/): npx tsx scripts/catalog-v3/generate.ts
 * Xuất: src/data/vocab/catalog-v3.json
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROUTES, EXTENDED_ROUTE, ROUTE_OVERRIDES, EXTENDED_ROUTE_ID, type RouteDef } from './routes.ts';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(DIR, '../..');
const OUT_FILE = path.join(ROOT, 'src/data/vocab/catalog-v3.json');

export const CATALOG_VERSION = '2026-06-12-v3';
const MICRO_PACK_SIZE = 15;
const MIN_PACK = 10;
const MAX_PACK = 20;

type SourcePackage = 'pro3m' | 'pro3m-plus';
type ContentType = 'word' | 'phrase' | 'idiom' | 'phrasal_verb';

interface LessonInfo { words?: string[] }
type VocabJson = Record<string, LessonInfo>;

const pro3m = JSON.parse(readFileSync(path.join(ROOT, 'src/data/vocab/pro3m.json'), 'utf8')) as VocabJson;
const pro3mPlus = JSON.parse(readFileSync(path.join(ROOT, 'src/data/vocab/pro3m-plus.json'), 'utf8')) as VocabJson;
const PACKAGES: Record<SourcePackage, VocabJson> = { 'pro3m': pro3m, 'pro3m-plus': pro3mPlus };

const sha = (s: string) => createHash('sha1').update(s).digest('hex');

// ── Reuse logic làm sạch / tiêu đề (đồng bộ với /api/import/packages) ──
function cleanLessonWords(words: string[]): string[] {
  return [...new Set(words.map((w) => w.trim().toLowerCase()).filter((w) => w.length > 1 && w.length < 80))];
}
function shouldIncludeLesson(name: string): boolean {
  const n = name.trim().toLowerCase();
  return n !== 'stt' && !n.startsWith('cấp độ ') && !n.startsWith('alphabetical list');
}
function getTopicTitle(name: string): string {
  return name
    .replace(/^(topic|theme|unit)\s+\d+\s*:\s*/i, '')
    .replace(/enviroment/gi, 'Environment').replace(/bussiness/gi, 'Business').replace(/socical/gi, 'Social')
    .replace(/global warning/gi, 'Global Warming').replace(/alternantives/gi, 'Alternatives')
    .replace(/apearance/gi, 'Appearance').replace(/consevation/gi, 'Conservation').replace(/\bcant\b/gi, "can't")
    .trim();
}

function detectLessonContentType(name: string): ContentType | null {
  const n = name.toLowerCase();
  if (n.includes('phrasal verb')) return 'phrasal_verb';
  if (n.startsWith('expression with') || n.includes('yourself')) return 'idiom';
  return null;
}
function wordContentType(word: string, lessonType: ContentType | null): ContentType {
  if (lessonType) return lessonType;
  return word.includes(' ') ? 'phrase' : 'word';
}

// ── Map subtopic → route + topic ──
function matchesAny(haystack: string, needles: string[]): boolean {
  return needles.some((n) => haystack.includes(n));
}
function resolveRoute(rawName: string): RouteDef {
  const n = rawName.trim().toLowerCase();
  const overrideId = ROUTE_OVERRIDES[n];
  if (overrideId) return ROUTES.find((r) => r.id === overrideId) ?? EXTENDED_ROUTE;
  for (const route of ROUTES) if (matchesAny(n, route.match)) return route;
  return EXTENDED_ROUTE;
}
function resolveTopic(route: RouteDef, rawName: string): string {
  const n = rawName.trim().toLowerCase();
  for (const t of route.topics) if (t.match.length && matchesAny(n, t.match)) return t.key;
  return route.topics[0].key;
}

function makePacks(words: string[]): string[][] {
  if (words.length === 0) return [];
  let packCount = Math.ceil(words.length / MICRO_PACK_SIZE);
  while (packCount > 1 && Math.floor(words.length / packCount) < MIN_PACK) packCount--;
  const base = Math.floor(words.length / packCount);
  const larger = words.length % packCount;
  const out: string[][] = [];
  let start = 0;
  for (let i = 0; i < packCount; i++) {
    const size = base + (i < larger ? 1 : 0);
    out.push(words.slice(start, start + size));
    start += size;
  }
  return out;
}

// ── Output shapes ──
interface PackArt { id: string; subtopicId: string; index: number; title: string; wordCount: number; words: { word: string; contentType: ContentType }[] }
interface SubtopicArt {
  id: string; topicId: string; routeId: string; title: string; sourcePackage: SourcePackage; sourceName: string;
  contentType: ContentType; wordCount: number; packIds: string[]; previewWords: string[];
  cefrRange: { min: string; max: string } | null; coverImage: string | null;
  attribution: string; qualityScore: number; publishStatus: 'published' | 'draft' | 'quarantine';
}
interface TopicArt { id: string; routeId: string; key: string; title: string; subtopicIds: string[]; qualityScore: number; publishStatus: 'published' | 'draft' }
interface RouteArt { id: string; title: string; icon: string; coverImage: string; description: string; featured: boolean; topicIds: string[] }

function main() {
  const allRoutes = [...ROUTES, EXTENDED_ROUTE];
  const routeById = new Map(allRoutes.map((r) => [r.id, r]));

  // 1) Gom lesson hợp lệ → subtopic thô; dedup theo title (giữ wordCount cao nhất).
  interface Raw { pkg: SourcePackage; name: string; title: string; words: string[]; route: RouteDef; topicKey: string }
  const byTitle = new Map<string, Raw>();
  for (const pkg of ['pro3m', 'pro3m-plus'] as const) {
    const data = PACKAGES[pkg];
    for (const name of Object.keys(data)) {
      if (!shouldIncludeLesson(name)) continue;
      const words = cleanLessonWords(data[name].words ?? []);
      if (words.length < MIN_PACK || words.length > 200) continue;
      const title = getTopicTitle(name);
      const route = resolveRoute(name);
      const raw: Raw = { pkg, name, title, words, route, topicKey: resolveTopic(route, name) };
      const key = title.toLowerCase();
      const cur = byTitle.get(key);
      if (!cur || words.length > cur.words.length) byTitle.set(key, raw);
    }
  }

  const subtopics: SubtopicArt[] = [];
  const packs: PackArt[] = [];
  // topicKey duy nhất = `${routeId}:${topicKey}`
  const topicMap = new Map<string, TopicArt>();

  for (const raw of byTitle.values()) {
    const subtopicId = `st-${sha(`${raw.pkg}::${raw.name}`).slice(0, 12)}`;
    const lessonType = detectLessonContentType(raw.name);
    const topicUid = `${raw.route.id}:${raw.topicKey}`;
    const topicId = `tp-${sha(topicUid).slice(0, 10)}`;

    if (!topicMap.has(topicUid)) {
      const tdef = raw.route.topics.find((t) => t.key === raw.topicKey)!;
      topicMap.set(topicUid, { id: topicId, routeId: raw.route.id, key: raw.topicKey, title: tdef.title, subtopicIds: [], qualityScore: 0, publishStatus: 'draft' });
    }
    topicMap.get(topicUid)!.subtopicIds.push(subtopicId);

    const packWordGroups = makePacks(raw.words);
    const packIds: string[] = [];
    packWordGroups.forEach((group, index) => {
      const packId = `${subtopicId}-p${index}`;
      packIds.push(packId);
      packs.push({
        id: packId, subtopicId, index, title: `Chặng ${index + 1}`, wordCount: group.length,
        words: group.map((w) => ({ word: w, contentType: wordContentType(w, lessonType) })),
      });
    });

    subtopics.push({
      id: subtopicId, topicId, routeId: raw.route.id, title: raw.title,
      sourcePackage: raw.pkg, sourceName: raw.name,
      contentType: lessonType ?? 'word', wordCount: raw.words.length, packIds,
      previewWords: raw.words.slice(0, 5), cefrRange: null, coverImage: null,
      attribution: 'Bộ từ vựng nội bộ pro3m (biên soạn nội bộ).',
      qualityScore: 0, publishStatus: 'draft',
    });
  }

  // 2) Topics: sort subtopic theo title; sort topic theo thứ tự định nghĩa trong route.
  const subById = new Map(subtopics.map((s) => [s.id, s]));
  const topics = [...topicMap.values()];
  for (const t of topics) t.subtopicIds.sort((a, b) => (subById.get(a)!.title).localeCompare(subById.get(b)!.title, 'vi'));

  // 3) Routes: gắn topicIds theo thứ tự topic định nghĩa.
  const routesArt: RouteArt[] = allRoutes.map((r) => {
    const topicIds = r.topics
      .map((td) => topicMap.get(`${r.id}:${td.key}`)?.id)
      .filter((id): id is string => Boolean(id));
    return { id: r.id, title: r.title, icon: r.icon, coverImage: r.coverImage, description: r.description, featured: r.id !== EXTENDED_ROUTE_ID, topicIds };
  });

  // 4) Sort ổn định cho output.
  subtopics.sort((a, b) => a.id.localeCompare(b.id));
  packs.sort((a, b) => a.id.localeCompare(b.id));
  topics.sort((a, b) => a.id.localeCompare(b.id));

  const artifact = {
    catalogVersion: CATALOG_VERSION,
    generatedFrom: ['pro3m', 'pro3m-plus'],
    microPackSize: MICRO_PACK_SIZE,
    counts: { routes: routesArt.length, topics: topics.length, subtopics: subtopics.length, packs: packs.length, words: subtopics.reduce((s, x) => s + x.wordCount, 0) },
    routes: routesArt,
    topics,
    subtopics,
    packs,
  };

  writeFileSync(OUT_FILE, JSON.stringify(artifact, null, 2) + '\n', 'utf8');
  console.log(`[catalog-v3] routes=${routesArt.length} topics=${topics.length} subtopics=${subtopics.length} packs=${packs.length} words=${artifact.counts.words}`);
  // cảnh báo pack ngoài [10,20]
  const bad = packs.filter((p) => p.wordCount < MIN_PACK || p.wordCount > MAX_PACK);
  if (bad.length) console.log(`  ⚠ ${bad.length} pack ngoài [${MIN_PACK},${MAX_PACK}]: ${bad.slice(0, 5).map((p) => `${p.id}=${p.wordCount}`).join(', ')}`);
  // phân bố route
  for (const r of routesArt) {
    const subs = subtopics.filter((s) => s.routeId === r.id).length;
    console.log(`  ${r.featured ? '★' : ' '} ${r.id}: ${r.topicIds.length} topic · ${subs} subtopic`);
  }
}

main();
