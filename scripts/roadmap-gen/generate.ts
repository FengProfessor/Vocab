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
import { LEVELS, GRAMMAR_LEVEL_MAP, PRONUNCIATION_LEVEL_MAP, VOCAB_ROUTE_PRIORITY, type RoadmapLevelId } from './level-map';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(DIR, '..', '..');
const OUT_PATH = path.join(ROOT, 'src', 'data', 'roadmap', 'roadmap-v1.json');

const ROADMAP_VERSION = 'roadmap-v1';
const PACKS_PER_UNIT = 2;

interface RawPack { id: string; subtopicId: string; index: number; title: string; wordCount: number; words: { word: string }[] }
interface RawSubtopic { id: string; topicId: string; routeId: string; title: string; packIds: string[] }
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

  /** Pool pack theo cấp: duyệt route ưu tiên → topic → subtopic published → pack, thứ tự artifact (deterministic). */
  const usedPacks = new Set<string>();
  function packPool(level: RoadmapLevelId, count: number): RawPack[] {
    const result: RawPack[] = [];
    for (const routeId of VOCAB_ROUTE_PRIORITY[level]) {
      const route = artifact.routes.find((r) => r.id === routeId);
      if (!route) continue;
      for (const topicId of route.topicIds) {
        const topic = topicById.get(topicId);
        if (!topic) continue;
        for (const subId of topic.subtopicIds) {
          if (quality.subtopics[subId]?.publishStatus !== 'published') continue;
          const sub = subById.get(subId);
          if (!sub) continue;
          for (const packId of sub.packIds) {
            if (usedPacks.has(packId)) continue;
            const pack = packById.get(packId);
            if (!pack) continue;
            usedPacks.add(packId);
            result.push(pack);
            if (result.length >= count) return result;
          }
        }
      }
    }
    return result; // có thể ít hơn count nếu cạn pool — generator báo warning bên dưới
  }

  const levels: RoadmapLevel[] = LEVELS.map((levelDef) => {
    const level = levelDef.id;
    const grammarSlugs = GRAMMAR_LEVEL_MAP[level];
    const pronIds = PRONUNCIATION_LEVEL_MAP[level];
    const unitCount = grammarSlugs.length;
    const packs = packPool(level, unitCount * PACKS_PER_UNIT);
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

    const units: RoadmapUnit[] = grammarSlugs.map((slug, i) => {
      const grammar = grammarBySlug.get(slug)!;
      const unitId = `u-${level.toLowerCase()}-${i + 1}`;
      const unitPacks = packs.slice(i * PACKS_PER_UNIT, (i + 1) * PACKS_PER_UNIT);

      const steps: RoadmapStep[] = [
        ...unitPacks.map<RoadmapStep>((p) => ({
          id: `sv-${p.id}`,
          type: 'vocab',
          ref: p.id,
          title: p.title,
          wordCount: p.wordCount,
        })),
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
