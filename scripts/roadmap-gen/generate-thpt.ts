/**
 * Sinh roadmap-thpt-v1.json bám Global Success trong catalog-v3.
 * Vocab = packId published; Grammar = slug CEFR (cùng DB lesson).
 *
 * Chạy: npx tsx scripts/roadmap-gen/generate-thpt.ts
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { THPT_GRADES } from './thpt-level-map.ts';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(DIR, '..', '..');
const OUT = path.join(ROOT, 'src', 'data', 'roadmap', 'roadmap-thpt-v1.json');

interface RawPack { id: string; subtopicId: string; wordCount: number; title: string }
interface RawSub { id: string; title: string; routeId: string; packIds: string[]; wordCount: number }
interface RawArtifact {
  catalogVersion: string;
  routes: { id: string }[];
  subtopics: RawSub[];
  packs: RawPack[];
}
interface GrammarRow { slug: string; title: string; title_vi: string }

function loadJson<T>(p: string): T {
  return JSON.parse(readFileSync(p, 'utf8')) as T;
}

function normalize(t: string): string {
  return t.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function main(): void {
  const catalog = loadJson<RawArtifact>(path.join(ROOT, 'src', 'data', 'vocab', 'catalog-v3.json'));
  const quality = loadJson<{ subtopics: Record<string, { publishStatus: string }> }>(
    path.join(ROOT, 'src', 'data', 'vocab', 'catalog-v3.quality.json'),
  );
  const grammarRoadmap = loadJson<GrammarRow[]>(path.join(ROOT, 'scripts', 'grammar-gen', 'roadmap.json'));
  const grammarBySlug = new Map(grammarRoadmap.map((g) => [g.slug, g]));
  const packById = new Map(catalog.packs.map((p) => [p.id, p]));

  // Index subtopics by route + normalized title
  const subsByRoute = new Map<string, RawSub[]>();
  for (const s of catalog.subtopics) {
    const list = subsByRoute.get(s.routeId) ?? [];
    list.push(s);
    subsByRoute.set(s.routeId, list);
  }

  function findSub(routeId: string, unitTitle: string): RawSub | null {
    const list = subsByRoute.get(routeId) ?? [];
    const target = normalize(unitTitle);
    // exact (normalize bỏ hoa/thường & dấu câu)
    const exact = list.find((s) => normalize(s.title) === target);
    if (exact) return exact;
    // catalog title starts with / equals ignoring British -ization
    const soft = target.replace(/isation/g, 'ization').replace(/zation/g, 'sation');
    const softHit = list.find((s) => {
      const n = normalize(s.title);
      return n === soft || n === target || n.replace(/isation/g, 'ization') === target.replace(/isation/g, 'ization');
    });
    if (softHit) return softHit;
    // contains either way
    const contains = list.find((s) => {
      const n = normalize(s.title);
      return n.includes(target) || target.includes(n);
    });
    return contains ?? null;
  }

  const levels = THPT_GRADES.map((grade) => {
    const gradeNum = grade.id.replace('lop-', '');
    const units = grade.units.map((def, i) => {
      const unitId = `u-thpt${gradeNum}-${i + 1}`;
      const sub = findSub(grade.routeId, def.unitTitle);
      if (!sub) {
        console.warn(`[THPT] ⚠ Không khớp catalog: ${grade.id} / ${def.unitTitle}`);
      }
      const steps: {
        id: string; type: string; ref: string; title: string; wordCount?: number;
      }[] = [];

      // Vocab packs (published only) — id gắn unit để progress ổn định khi pack tái dùng
      if (sub) {
        const packIds = sub.packIds.filter((pid) => {
          const p = packById.get(pid);
          return p && quality.subtopics[sub.id]?.publishStatus === 'published';
        });
        packIds.forEach((pid, k) => {
          const p = packById.get(pid)!;
          // UI labels stay English (SGK unit name)
          steps.push({
            id: `sv-${unitId}-${pid}`,
            type: 'vocab',
            ref: pid,
            title: packIds.length > 1 ? `${def.unitTitle} · Part ${k + 1}` : def.unitTitle,
            wordCount: p.wordCount,
          });
        });
      }

      // Grammar → CEFR slug (ref = slug; title English from grammar roadmap)
      for (const slug of def.grammar) {
        const g = grammarBySlug.get(slug);
        if (!g) {
          console.warn(`[THPT] ⚠ Grammar slug không có: ${slug}`);
          continue;
        }
        steps.push({
          id: `sg-${unitId}-${slug}`,
          type: 'grammar',
          ref: slug,
          title: g.title || slug,
        });
      }

      // Skills / exam formats
      for (const sk of def.skills ?? []) {
        const prefix = sk.type === 'exam' ? 'sx' : 'sr';
        steps.push({
          id: `${prefix}-${unitId}-${sk.ref}`,
          type: sk.type,
          ref: sk.ref,
          title: sk.title,
        });
      }

      return {
        id: unitId,
        index: i + 1,
        // English only — keep SGK unit title as-is
        title: `Unit ${i + 1} · ${def.unitTitle}`,
        steps,
      };
    });

    return {
      id: grade.id,
      title: grade.title,
      // titleVi kept for shell badges but English preferred for level banner
      titleVi: grade.titleVi,
      description: grade.description,
      units,
    };
  });

  // Guard: step id unique toàn track
  const seen = new Set<string>();
  const dups: string[] = [];
  for (const lv of levels) {
    for (const u of lv.units) {
      for (const s of u.steps) {
        if (seen.has(s.id)) dups.push(s.id);
        seen.add(s.id);
      }
    }
  }
  if (dups.length) throw new Error(`[THPTGen] step id trùng: ${dups.slice(0, 10).join(', ')}`);

  const output = {
    roadmapVersion: 'roadmap-thpt-v3-gs',
    track: 'thpt',
    catalogVersion: catalog.catalogVersion,
    source: 'Global Success SGK via catalog-v3 routes thpt-lop-10/11/12',
    hybridNote:
      'Vocab = pack catalog SGK. Grammar ref = slug CEFR (cùng grammar_lessons). Step id unique theo unit. Đề 2025 = skill. Đủ A0–B2: track CEFR song song.',
    levels,
  };

  mkdirSync(path.dirname(OUT), { recursive: true });
  writeFileSync(OUT, `${JSON.stringify(output, null, 2)}\n`, 'utf8');

  let steps = 0;
  let words = 0;
  for (const lv of levels) {
    for (const u of lv.units) {
      for (const s of u.steps) {
        steps += 1;
        if (s.type === 'vocab') words += s.wordCount ?? 0;
      }
    }
    console.log(`  ${lv.id}: ${lv.units.length} unit · ${lv.units.reduce((a, u) => a + u.steps.length, 0)} step`);
  }
  console.log(`[THPTGen] OK → ${OUT}`);
  console.log(`[THPTGen] ${levels.length} lớp · ${steps} step · ~${words} từ SGK`);
}

main();
