/**
 * Roadmap V1 generator — sinh artifact lộ trình 5 cấp A0→B2 (deterministic).
 *
 * Input:
 *   - src/data/vocab/catalog-v3.json + catalog-v3.quality.json (pack từ vựng published)
 *   - src/data/pronunciation/lessons-v1.json (24 bài phát âm)
 *   - scripts/grammar-gen/roadmap.json (validate slug grammar tồn tại)
 *   - level-map.ts (nguồn sự thật gán cấp — từ NLM research)
 *
 * Output: src/data/roadmap/roadmap-v1.json
 *
 * Nguyên tắc:
 *   - Chạy 2 lần ra file GIỐNG HỆT (không timestamp, không random).
 *   - Step ID ổn định gắn với NỘI DUNG (sv-<packId>, sg-<slug>, sp-<lessonId>) →
 *     đổi cách chia unit không vỡ progress; chỉ checkpoint gắn unit (sc-<level>-<n>).
 *   - Mỗi unit: 2 pack từ vựng + 1 grammar topic + (bài phát âm rải đều) + 1 checkpoint.
 *   - Pack không lặp lại giữa các unit/cấp (dedupe toàn cục).
 *
 * Chạy (trong web-app/): npx tsx scripts/roadmap-gen/generate.ts
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  LEVELS, GRAMMAR_LEVEL_MAP, PRONUNCIATION_LEVEL_MAP, VOCAB_ROUTE_PRIORITY,
  SUBTOPIC_LEVEL_RULES, MAX_PACKS_PER_SUBTOPIC, type RoadmapLevelId,
} from './level-map';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(DIR, '..', '..');
const OUT_PATH = path.join(ROOT, 'src', 'data', 'roadmap', 'roadmap-v1.json');

const ROADMAP_VERSION = 'roadmap-v1';
const PACKS_PER_UNIT = 2;

interface RawPack { id: string; subtopicId: string; index: number; title: string; wordCount: number; words: { word: string; contentType?: string }[] }
interface RawSubtopic { id: string; topicId: string; routeId: string; title: string; contentType: string; packIds: string[] }
interface RawArtifact { catalogVersion: string; routes: { id: string; topicIds: string[] }[]; topics: { id: string; subtopicIds: string[] }[]; subtopics: RawSubtopic[]; packs: RawPack[] }
interface RawQuality { subtopics: Record<string, { publishStatus: string }> }
interface PronLesson { id: string; level: string; title: string }

export interface RoadmapStep {
  id: string;
  type: 'vocab' | 'grammar' | 'pronunciation' | 'checkpoint';
  ref: string;
  title: string;
  wordCount?: number;
}
export interface RoadmapUnit {
  id: string;
  index: number;
  title: string;
  steps: RoadmapStep[];
}
export interface RoadmapLevel {
  id: RoadmapLevelId;
  title: string;
  titleVi: string;
  description: string;
  units: RoadmapUnit[];
}

function loadJson<T>(p: string): T {
  return JSON.parse(readFileSync(p, 'utf8')) as T;
}

function main(): void {
  const artifact = loadJson<RawArtifact>(path.join(ROOT, 'src', 'data', 'vocab', 'catalog-v3.json'));
  const quality = loadJson<RawQuality>(path.join(ROOT, 'src', 'data', 'vocab', 'catalog-v3.quality.json'));
  const pron = loadJson<{ lessons: PronLesson[] }>(path.join(ROOT, 'src', 'data', 'pronunciation', 'lessons-v1.json'));
  const grammarRoadmap = loadJson<{ slug: string; title: string; title_vi: string }[]>(
    path.join(ROOT, 'scripts', 'grammar-gen', 'roadmap.json'),
  );

  const grammarBySlug = new Map(grammarRoadmap.map((g) => [g.slug, g]));
  const pronById = new Map(pron.lessons.map((l) => [l.id, l]));
  const packById = new Map(artifact.packs.map((p) => [p.id, p]));
  const subById = new Map(artifact.subtopics.map((s) => [s.id, s]));
  const topicById = new Map(artifact.topics.map((t) => [t.id, t]));

  // Validate level-map refs tồn tại
  for (const slugs of Object.values(GRAMMAR_LEVEL_MAP)) {
    for (const slug of slugs) {
      if (!grammarBySlug.has(slug)) throw new Error(`level-map: grammar slug không tồn tại: ${slug}`);
    }
  }
  for (const ids of Object.values(PRONUNCIATION_LEVEL_MAP)) {
    for (const id of ids) {
      if (!pronById.has(id)) throw new Error(`level-map: pronunciation lesson không tồn tại: ${id}`);
    }
  }

  /**
   * Pool pack theo cấp (deterministic). Vá theo teacher review 06:
   * - Lọc subtopic theo SUBTOPIC_LEVEL_RULES (allow/block regex trên title) — chống lạc cấp.
   * - Dedup subtopic trùng nội dung (title chuẩn hóa: "Jobs and Employment" ≈ "Job and Employment").
   * - Cap MAX_PACKS_PER_SUBTOPIC pack/subtopic/cấp + ROUND-ROBIN xen kẽ subtopic — chống độc canh.
   * - A0-A2 chỉ nhận pack ≥70% từ đơn; A0 dùng STARTER packs sinh tồn trước.
   */
  const usedPacks = new Set<string>();
  const usedSubtopicKeys = new Set<string>();
  const WORD_ONLY_LEVELS = new Set<RoadmapLevelId>(['A0', 'A1', 'A2']);
  // Key dedup = tập token đã bỏ stopword + số ít hóa, SORT — bắt "Employment - Jobs" ≈ "Jobs and Employment"
  const normalizeTitle = (t: string) => t.toLowerCase()
    .split(/[^a-z0-9à-ỹ]+/i)
    .filter((tok) => tok && !['and', 'the', 'of', 'a', 'an'].includes(tok))
    .map((tok) => tok.replace(/s$/, ''))
    .sort()
    .join('|');

  function packPool(level: RoadmapLevelId, count: number): RawPack[] {
    const rules = SUBTOPIC_LEVEL_RULES[level];
    // Bước 1: gom pack hợp lệ THEO TỪNG TOPIC (nhóm chủ đề lớn — "Education" IELTS
    // có 6 subtopic con, round-robin theo subtopic vẫn dồn 5 chặng Education liền)
    const byGroup: RawPack[][] = [];
    for (const routeId of VOCAB_ROUTE_PRIORITY[level]) {
      const route = artifact.routes.find((r) => r.id === routeId);
      if (!route) continue;
      for (const topicId of route.topicIds) {
        const topic = topicById.get(topicId);
        if (!topic) continue;
        const groupPacks: RawPack[] = [];
        for (const subId of topic.subtopicIds) {
          if (quality.subtopics[subId]?.publishStatus !== 'published') continue;
          const sub = subById.get(subId);
          if (!sub) continue;
          if (WORD_ONLY_LEVELS.has(level) && sub.contentType !== 'word') continue;
          if (rules.block?.test(sub.title)) continue;
          if (rules.allow && !rules.allow.test(sub.title)) continue;
          const titleKey = normalizeTitle(sub.title);
          if (usedSubtopicKeys.has(titleKey)) continue;

          const subPacks: RawPack[] = [];
          for (const packId of sub.packIds) {
            if (usedPacks.has(packId) || subPacks.length >= MAX_PACKS_PER_SUBTOPIC) continue;
            const pack = packById.get(packId);
            if (!pack) continue;
            if (WORD_ONLY_LEVELS.has(level)) {
              const singleWords = pack.words.filter((w) => (w.contentType ?? 'word') === 'word' && !w.word.includes(' ')).length;
              if (singleWords / pack.words.length < 0.7) continue;
            }
            subPacks.push(pack);
          }
          if (subPacks.length > 0) {
            groupPacks.push(...subPacks);
            usedSubtopicKeys.add(titleKey);
          }
        }
        if (groupPacks.length > 0) byGroup.push(groupPacks);
      }
    }
    // Bước 2: round-robin — mỗi vòng lấy PACKS_PER_ROUND pack/nhóm rồi chuyển nhóm kế.
    // 4 pack = 2 chặng cùng chủ đề liền nhau trước khi đảo → học viên kịp "ngấm" một
    // trường từ vựng, tránh "chợ phiên" nhảy chủ đề mỗi chặng (teacher review 06 mục #3).
    const PACKS_PER_ROUND = 4;
    const result: RawPack[] = [];
    let round = 0;
    while (result.length < count) {
      let took = 0;
      for (const subPacks of byGroup) {
        for (let k = 0; k < PACKS_PER_ROUND && result.length < count; k++) {
          const pack = subPacks[round * PACKS_PER_ROUND + k];
          if (!pack || usedPacks.has(pack.id)) continue;
          usedPacks.add(pack.id);
          result.push(pack);
          took++;
        }
        if (result.length >= count) break;
      }
      if (took === 0) break; // cạn pool
      round++;
    }
    return result;
  }

  // Starter packs sinh tồn A0 (tạo tay — catalog không có pack đủ cơ bản)
  const starter = loadJson<{ packs: { id: string; title: string; words: string[] }[] }>(
    path.join(ROOT, 'src', 'data', 'roadmap', 'starter-packs-v1.json'),
  );
  const starterAsRaw: RawPack[] = starter.packs.map((p, i) => ({
    id: p.id, subtopicId: '', index: i, title: p.title, wordCount: p.words.length,
    words: p.words.map((w) => ({ word: w, contentType: 'word' })),
  }));

  const levels: RoadmapLevel[] = LEVELS.map((levelDef) => {
    const level = levelDef.id;
    const grammarSlugs = GRAMMAR_LEVEL_MAP[level];
    const pronIds = PRONUNCIATION_LEVEL_MAP[level];
    const unitCount = grammarSlugs.length;
    // A0: ưu tiên starter packs sinh tồn trước, thiếu mới lấy từ catalog
    const need = unitCount * PACKS_PER_UNIT;
    const packs = level === 'A0'
      ? [...starterAsRaw.slice(0, need), ...packPool(level, Math.max(0, need - starterAsRaw.length))]
      : packPool(level, need);
    if (packs.length < unitCount * PACKS_PER_UNIT) {
      console.warn(`[RoadmapGen] ⚠ ${level}: chỉ gom được ${packs.length}/${unitCount * PACKS_PER_UNIT} pack`);
    }

    // Rải bài phát âm đều vào các unit: unit thứ round(i * unitCount / pronCount)
    const pronSlot = new Map<number, string>();
    pronIds.forEach((id, i) => {
      const slot = Math.min(unitCount - 1, Math.floor((i * unitCount) / pronIds.length));
      // tránh 2 bài cùng slot: đẩy về sau slot trống gần nhất
      let s = slot;
      while (pronSlot.has(s) && s < unitCount - 1) s++;
      pronSlot.set(s, id);
    });

    // Phân bổ pack đều các unit: pool thiếu → mỗi unit tối thiểu 1 pack (unit đầu ưu tiên nhận pack dư)
    const perUnitCounts: number[] = [];
    {
      const base = Math.floor(packs.length / unitCount);
      const extra = packs.length % unitCount;
      for (let i = 0; i < unitCount; i++) perUnitCounts.push(Math.min(PACKS_PER_UNIT, base + (i < extra ? 1 : 0)));
    }
    const packOffsets: number[] = [];
    perUnitCounts.reduce((acc, n, i) => { packOffsets[i] = acc; return acc + n; }, 0);

    const units: RoadmapUnit[] = grammarSlugs.map((slug, i) => {
      const grammar = grammarBySlug.get(slug)!;
      const unitId = `u-${level.toLowerCase()}-${i + 1}`;
      const unitPacks = packs.slice(packOffsets[i], packOffsets[i] + perUnitCounts[i]);

      const steps: RoadmapStep[] = [
        ...unitPacks.map<RoadmapStep>((p) => {
          // Title pack gốc chỉ là "Chặng N" — gắn tên chủ đề subtopic cho có nghĩa
          const subTitle = subById.get(p.subtopicId)?.title ?? '';
          return {
            id: `sv-${p.id}`,
            type: 'vocab',
            ref: p.id,
            title: subTitle ? `${subTitle} · ${p.title}` : p.title,
            wordCount: p.wordCount,
          };
        }),
        { id: `sg-${slug}`, type: 'grammar', ref: slug, title: grammar.title_vi },
      ];
      const pronId = pronSlot.get(i);
      if (pronId) {
        steps.push({ id: `sp-${pronId}`, type: 'pronunciation', ref: pronId, title: pronById.get(pronId)!.title });
      }
      steps.push({ id: `sc-${level.toLowerCase()}-${i + 1}`, type: 'checkpoint', ref: unitId, title: 'Checkpoint — Vượt chặng' });

      return { id: unitId, index: i + 1, title: `Chặng ${i + 1} · ${grammar.title_vi}`, steps };
    });

    return { id: level, title: levelDef.title, titleVi: levelDef.titleVi, description: levelDef.description, units };
  });

  const totalUnits = levels.reduce((n, l) => n + l.units.length, 0);
  const totalSteps = levels.reduce((n, l) => n + l.units.reduce((m, u) => m + u.steps.length, 0), 0);
  const output = {
    roadmapVersion: ROADMAP_VERSION,
    catalogVersion: artifact.catalogVersion,
    levels,
  };

  mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  writeFileSync(OUT_PATH, JSON.stringify(output, null, 2) + '\n', 'utf8');
  console.log(`[RoadmapGen] OK → ${OUT_PATH}`);
  console.log(`[RoadmapGen] ${levels.length} cấp · ${totalUnits} chặng · ${totalSteps} step · ${usedPacks.size} pack (${usedPacks.size * 15} từ)`);
  for (const l of levels) console.log(`  ${l.id}: ${l.units.length} chặng`);
}

main();
