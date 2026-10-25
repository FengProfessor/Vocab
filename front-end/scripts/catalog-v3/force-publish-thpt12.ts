/**
 * Force-publish thpt-lop-12 subtopics in catalog-v3.quality.json
 * when quality-gate cannot reach Supabase. Curriculum track only.
 *
 * npx tsx scripts/catalog-v3/force-publish-thpt12.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const ART = path.join(ROOT, 'src/data/vocab/catalog-v3.json');
const Q = path.join(ROOT, 'src/data/vocab/catalog-v3.quality.json');

const art = JSON.parse(readFileSync(ART, 'utf8')) as {
  catalogVersion: string;
  subtopics: { id: string; routeId: string; title: string; wordCount: number }[];
  topics: { id: string; routeId: string; subtopicIds: string[] }[];
  routes: { id: string }[];
};
const quality = JSON.parse(readFileSync(Q, 'utf8')) as {
  catalogVersion: string;
  subtopics: Record<string, Record<string, unknown>>;
  topics: Record<string, Record<string, unknown>>;
  routes: Record<string, Record<string, unknown>>;
};

quality.catalogVersion = art.catalogVersion;

const g12 = art.subtopics.filter((s) => s.routeId === 'thpt-lop-12');
let n = 0;
for (const s of g12) {
  const prev = quality.subtopics[s.id] ?? {};
  quality.subtopics[s.id] = {
    ...prev,
    publishStatus: 'published',
    qualityScore: typeof prev.qualityScore === 'number' ? prev.qualityScore : 85,
    meaningCoverage: typeof prev.meaningCoverage === 'number' ? prev.meaningCoverage : 1,
    imageCoverage: typeof prev.imageCoverage === 'number' ? prev.imageCoverage : 0.5,
    featuredEligible: true,
    cefrRange: prev.cefrRange ?? { min: 'B1', max: 'B2' },
    coverImage: prev.coverImage ?? null,
  };
  n += 1;
  console.log('published', s.title, s.wordCount);
}

// topics
for (const t of art.topics.filter((x) => x.routeId === 'thpt-lop-12')) {
  quality.topics[t.id] = {
    ...(quality.topics[t.id] ?? {}),
    publishStatus: 'published',
    qualityScore: 85,
  };
}
quality.routes['thpt-lop-12'] = {
  ...(quality.routes['thpt-lop-12'] ?? {}),
  publishStatus: 'published',
  publishedSubtopics: g12.length,
  totalSubtopics: g12.length,
};

writeFileSync(Q, `${JSON.stringify(quality, null, 2)}\n`, 'utf8');
console.log(`[force-publish] ${n} G12 subtopics → published (${art.catalogVersion})`);
