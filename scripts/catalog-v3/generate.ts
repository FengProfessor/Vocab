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
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ROUTES, EXTENDED_ROUTE, CURRICULUM_ROUTES, EXAM_ROUTES, FOUNDATION_ROUTES, DICT_VAULT_ROUTE,
  GRADE_SET_ROUTE, ROUTE_OVERRIDES, EXTENDED_ROUTE_ID, type RouteDef, type RouteGroup,
} from './routes.ts';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(DIR, '../..');
const OUT_FILE = path.join(ROOT, 'src/data/vocab/catalog-v3.json');

export const CATALOG_VERSION = '2026-07-15-v5';
const MICRO_PACK_SIZE = 15;
const MIN_PACK = 10;
const MAX_PACK = 20;

type SourcePackage =
  | 'pro3m' | 'pro3m-plus' | 'exam-toeic' | 'exam-ielts'
  | 'list-oxford' | 'list-awl' | 'list-ielts' | 'list-toeic' | 'list-academic' | 'list-phrasal' | 'list-exam'
  | 'dict-ready';
type ContentType = 'word' | 'phrase' | 'idiom' | 'phrasal_verb';

interface LessonInfo { words?: string[] }
type VocabJson = Record<string, LessonInfo>;

const pro3m = JSON.parse(readFileSync(path.join(ROOT, 'src/data/vocab/pro3m.json'), 'utf8')) as VocabJson;
const pro3mPlus = JSON.parse(readFileSync(path.join(ROOT, 'src/data/vocab/pro3m-plus.json'), 'utf8')) as VocabJson;
const PACKAGES: Record<'pro3m' | 'pro3m-plus', VocabJson> = { 'pro3m': pro3m, 'pro3m-plus': pro3mPlus };

interface ExamSubtopicSource {
  sourcePackage: 'exam-toeic' | 'exam-ielts';
  sourceKey: string;
  routeId: string;
  topicKey: string;
  title: string;
  sourceNames: string[];
  attribution: string;
  words: string[];
}
interface ExamManifest { schemaVersion: number; generatedFrom: string[]; subtopics: ExamSubtopicSource[] }
const examManifest = JSON.parse(readFileSync(path.join(ROOT, 'src/data/vocab/exam-vocab.json'), 'utf8')) as ExamManifest;

interface ExtraSubtopicSource {
  sourcePackage: SourcePackage;
  sourceKey: string;
  routeId: string;
  topicKey: string;
  title: string;
  attribution: string;
  words: string[];
}
interface ExtraManifest {
  schemaVersion: number;
  generatedFrom: string[];
  subtopics: ExtraSubtopicSource[];
}
const EXTRA_FILE = path.join(ROOT, 'src/data/vocab/extra-vocab.json');
const extraManifest: ExtraManifest = existsSync(EXTRA_FILE)
  ? JSON.parse(readFileSync(EXTRA_FILE, 'utf8')) as ExtraManifest
  : { schemaVersion: 1, generatedFrom: [], subtopics: [] };

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

function validateExamManifest(routeById: Map<string, RouteDef>): void {
  if (examManifest.schemaVersion !== 2) throw new Error(`exam-vocab schemaVersion không hỗ trợ: ${examManifest.schemaVersion}`);
  const sourceKeys = new Set<string>();
  const topicWords = new Map<string, { expected: Set<string>; actual: Set<string>; sourceNames: string }>();
  for (const source of examManifest.subtopics) {
    if (sourceKeys.has(source.sourceKey)) throw new Error(`exam-vocab trùng sourceKey: ${source.sourceKey}`);
    sourceKeys.add(source.sourceKey);
    const route = routeById.get(source.routeId);
    if (!route || route.group !== 'exam') throw new Error(`exam-vocab routeId không hợp lệ: ${source.routeId}`);
    if ((source.routeId === 'toeic' && source.sourcePackage !== 'exam-toeic') || (source.routeId === 'ielts' && source.sourcePackage !== 'exam-ielts')) {
      throw new Error(`exam-vocab sourcePackage không khớp route: ${source.sourceKey}`);
    }
    if (!route.topics.some((topic) => topic.key === source.topicKey)) throw new Error(`exam-vocab topicKey không hợp lệ: ${source.routeId}/${source.topicKey}`);
    if (!Array.isArray(source.sourceNames) || source.sourceNames.length === 0) throw new Error(`exam-vocab thiếu sourceNames: ${source.sourceKey}`);
    const missingSources = source.sourceNames.filter((name) => !pro3m[name]);
    if (missingSources.length > 0) throw new Error(`exam-vocab thiếu lesson nguồn: ${source.sourceKey} -> ${missingSources.join(', ')}`);
    if (!source.attribution.trim()) throw new Error(`exam-vocab thiếu attribution: ${source.sourceKey}`);
    const cleanedWords = cleanLessonWords(source.words);
    if (cleanedWords.length !== source.words.length) throw new Error(`exam-vocab chứa từ trùng/rỗng/không hợp lệ: ${source.sourceKey}`);
    if (cleanedWords.length < 30 || cleanedWords.length > 90) throw new Error(`exam-vocab số từ ngoài 30-90: ${source.sourceKey}=${cleanedWords.length}`);

    const topicKey = `${source.routeId}:${source.topicKey}`;
    const expected = new Set(cleanLessonWords(source.sourceNames.flatMap((name) => pro3m[name].words ?? [])));
    const sourceNames = JSON.stringify(source.sourceNames);
    const aggregate = topicWords.get(topicKey) ?? { expected, actual: new Set<string>(), sourceNames };
    if (aggregate.sourceNames !== sourceNames) throw new Error(`exam-vocab sourceNames không nhất quán: ${topicKey}`);
    for (const word of cleanedWords) {
      if (!expected.has(word)) throw new Error(`exam-vocab có từ ngoài lesson nguồn: ${source.sourceKey} -> ${word}`);
      if (aggregate.actual.has(word)) throw new Error(`exam-vocab trùng từ giữa các chặng: ${topicKey} -> ${word}`);
      aggregate.actual.add(word);
    }
    topicWords.set(topicKey, aggregate);
  }
  for (const [topicKey, aggregate] of topicWords) {
    const missing = [...aggregate.expected].filter((word) => !aggregate.actual.has(word));
    if (missing.length > 0) throw new Error(`exam-vocab thiếu từ từ lesson nguồn: ${topicKey} -> ${missing.slice(0, 10).join(', ')}`);
  }
}

function validateExtraManifest(routeById: Map<string, RouteDef>): void {
  if (!extraManifest.subtopics.length) {
    console.warn('[catalog-v3] extra-vocab.json trống hoặc thiếu — bỏ qua list/dict packs');
    return;
  }
  if (extraManifest.schemaVersion !== 1) {
    throw new Error(`extra-vocab schemaVersion không hỗ trợ: ${extraManifest.schemaVersion}`);
  }
  const keys = new Set<string>();
  for (const source of extraManifest.subtopics) {
    if (keys.has(source.sourceKey)) throw new Error(`extra-vocab trùng sourceKey: ${source.sourceKey}`);
    keys.add(source.sourceKey);
    const route = routeById.get(source.routeId);
    if (!route) throw new Error(`extra-vocab routeId không hợp lệ: ${source.routeId}`);
    if (!route.topics.some((t) => t.key === source.topicKey)) {
      throw new Error(`extra-vocab topicKey không hợp lệ: ${source.routeId}/${source.topicKey}`);
    }
    const cleaned = cleanLessonWords(source.words);
    if (cleaned.length < source.words.length) {
      console.warn(`[catalog-v3] extra ${source.sourceKey}: drop ${source.words.length - cleaned.length} invalid/dup words`);
    }
    if (cleaned.length < MIN_PACK) {
      throw new Error(`extra-vocab quá ít từ: ${source.sourceKey}=${cleaned.length}`);
    }
    if (!source.attribution.trim()) throw new Error(`extra-vocab thiếu attribution: ${source.sourceKey}`);
    // Ghi đè words đã clean để pack deterministic
    source.words = cleaned;
  }
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
interface RouteArt { id: string; title: string; icon: string; coverImage: string; description: string; group: RouteGroup; featured: boolean; topicIds: string[] }

function main() {
  const allRoutes = [...FOUNDATION_ROUTES, ...CURRICULUM_ROUTES, ...EXAM_ROUTES, ...ROUTES, EXTENDED_ROUTE, DICT_VAULT_ROUTE];
  const routeById = new Map(allRoutes.map((r) => [r.id, r]));
  validateExamManifest(routeById);
  validateExtraManifest(routeById);

  // 0) Phát hiện lớp của các Unit (Global Success) bằng Unit-number reset (chỉ pro3m, theo thứ tự nguồn).
  //    Set 1 = Lớp 10, set 2 = Lớp 11, set 3 = Lớp 12. Set 4 giữ ở các route cũ để không mất progress.
  const unitGrade = new Map<string, number>();
  let lastNum = 0, gradeSet = 0;
  for (const name of Object.keys(pro3m)) {
    const m = name.trim().match(/^unit\s+(\d+)\s*:/i);
    if (!m) continue;
    const num = Number(m[1]);
    if (lastNum === 0 || num <= lastNum) gradeSet++;
    lastNum = num;
    unitGrade.set(name, gradeSet);
  }

  // 1) Gom lesson hợp lệ. Unit (lớp 1-3) → track THPT (KHÔNG dedup). Còn lại → 7 route, dedup theo title.
  interface Raw { pkg: SourcePackage; name: string; title: string; words: string[]; routeId: string; topicKey: string; attribution: string }
  const curriculumRaws: Raw[] = [];
  const byTitle = new Map<string, Raw>();
  for (const pkg of ['pro3m', 'pro3m-plus'] as const) {
    const data = PACKAGES[pkg];
    for (const name of Object.keys(data)) {
      if (!shouldIncludeLesson(name)) continue;
      const words = cleanLessonWords(data[name].words ?? []);
      if (words.length < MIN_PACK || words.length > 200) continue;
      const title = getTopicTitle(name);

      const grade = pkg === 'pro3m' ? unitGrade.get(name) : undefined;
      if (grade !== undefined) {
        const routeId = GRADE_SET_ROUTE[grade];
        if (routeId) {
          const unitNum = Number(name.match(/unit\s+(\d+)/i)?.[1] ?? 0);
          curriculumRaws.push({ pkg, name, title, words, routeId, topicKey: unitNum <= 5 ? 'hk1' : 'hk2', attribution: 'Bộ từ vựng nội bộ pro3m (biên soạn nội bộ).' });
          continue;
        }
      }

      const route = resolveRoute(name);
      const raw: Raw = { pkg, name, title, words, routeId: route.id, topicKey: resolveTopic(route, name), attribution: 'Bộ từ vựng nội bộ pro3m (biên soạn nội bộ).' };
      const key = title.toLowerCase();
      const cur = byTitle.get(key);
      if (!cur || words.length > cur.words.length) byTitle.set(key, raw);
    }
  }
  const examRaws: Raw[] = examManifest.subtopics.map((source) => ({
    pkg: source.sourcePackage,
    name: source.sourceKey,
    title: source.title,
    words: cleanLessonWords(source.words),
    routeId: source.routeId,
    topicKey: source.topicKey,
    attribution: source.attribution,
  }));
  const extraRaws: Raw[] = extraManifest.subtopics.map((source) => ({
    pkg: source.sourcePackage,
    name: source.sourceKey,
    title: source.title,
    words: cleanLessonWords(source.words),
    routeId: source.routeId,
    topicKey: source.topicKey,
    attribution: source.attribution,
  }));
  const allRaws: Raw[] = [...curriculumRaws, ...examRaws, ...byTitle.values(), ...extraRaws];

  const subtopics: SubtopicArt[] = [];
  const packs: PackArt[] = [];
  // topicKey duy nhất = `${routeId}:${topicKey}`
  const topicMap = new Map<string, TopicArt>();

  for (const raw of allRaws) {
    const subtopicId = `st-${sha(`${raw.pkg}::${raw.name}`).slice(0, 12)}`;
    const lessonType = detectLessonContentType(raw.name);
    const topicUid = `${raw.routeId}:${raw.topicKey}`;
    const topicId = `tp-${sha(topicUid).slice(0, 10)}`;

    if (!topicMap.has(topicUid)) {
      const tdef = routeById.get(raw.routeId)?.topics.find((t) => t.key === raw.topicKey);
      if (!tdef) throw new Error(`Không tìm thấy route/topic: ${raw.routeId}/${raw.topicKey}`);
      topicMap.set(topicUid, { id: topicId, routeId: raw.routeId, key: raw.topicKey, title: tdef.title, subtopicIds: [], qualityScore: 0, publishStatus: 'draft' });
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
      id: subtopicId, topicId, routeId: raw.routeId, title: raw.title,
      sourcePackage: raw.pkg, sourceName: raw.name,
      contentType: lessonType ?? 'word', wordCount: raw.words.length, packIds,
      previewWords: raw.words.slice(0, 5), cefrRange: null, coverImage: null,
      attribution: raw.attribution,
      qualityScore: 0, publishStatus: 'draft',
    });
  }

  // 2) Curriculum/exam giữ thứ tự nguồn; route khám phá sort theo title.
  const subById = new Map(subtopics.map((s) => [s.id, s]));
  const topics = [...topicMap.values()];
  for (const t of topics) {
    const group = routeById.get(t.routeId)?.group ?? (t.routeId === EXTENDED_ROUTE_ID ? 'extended' : 'communication');
    if (group === 'communication' || group === 'extended') {
      t.subtopicIds.sort((a, b) => (subById.get(a)!.title).localeCompare(subById.get(b)!.title, 'vi'));
    }
  }

  // 3) Routes: gắn topicIds theo thứ tự topic định nghĩa.
  const routesArt: RouteArt[] = allRoutes.map((r) => {
    const topicIds = r.topics
      .map((td) => topicMap.get(`${r.id}:${td.key}`)?.id)
      .filter((id): id is string => Boolean(id));
    const group: RouteGroup = r.group ?? (r.id === EXTENDED_ROUTE_ID ? 'extended' : 'communication');
    return { id: r.id, title: r.title, icon: r.icon, coverImage: r.coverImage, description: r.description, group, featured: r.id !== EXTENDED_ROUTE_ID, topicIds };
  });

  // 4) Sort ổn định cho output.
  subtopics.sort((a, b) => a.id.localeCompare(b.id));
  packs.sort((a, b) => a.id.localeCompare(b.id));
  topics.sort((a, b) => a.id.localeCompare(b.id));

  const artifact = {
    catalogVersion: CATALOG_VERSION,
    generatedFrom: [
      'pro3m', 'pro3m-plus', 'src/data/vocab/exam-vocab.json', ...examManifest.generatedFrom,
      'src/data/vocab/extra-vocab.json', ...extraManifest.generatedFrom,
    ],
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
