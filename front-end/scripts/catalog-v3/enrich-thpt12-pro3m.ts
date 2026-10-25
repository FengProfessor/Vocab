/**
 * Enrich Grade 12 Global Success units in pro3m.json — SAFE mode:
 * - Only fill EMPTY units (0 words) that are NOT exam-vocab source lessons
 * - Never expand units listed in exam-vocab sourceNames (breaks generate validate)
 *
 * Empty G12 units currently: Green Movement, Mass Media, Choosing A Career
 *
 * Chạy: npx tsx scripts/catalog-v3/enrich-thpt12-pro3m.ts
 * Sau: npx tsx scripts/catalog-v3/generate.ts && npx tsx scripts/catalog-v3/quality-gate.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(DIR, '../..');
const PRO3M = path.join(ROOT, 'src/data/vocab/pro3m.json');
const EXAM = path.join(ROOT, 'src/data/vocab/exam-vocab.json');

const TARGET = 60;

const FILL: Record<string, string[]> = {
  'Unit 3: The Green Movement': [
    'Topic 2: Enviroment and Climate Change',
    'Topic 24: Consevation',
  ],
  'Unit 4: The Mass Media': [
    'Topic 10: The Mass Media',
    'Topic 6: Sports and Entertainment',
  ],
  'Unit 9: Choosing A Career': [
    'Topic 4: Jobs and Employment',
    'Topic 12: Work',
    'Topic 18: Success And Failure',
  ],
};

const SEEDS: Record<string, string[]> = {
  'Unit 3: The Green Movement': [
    'recycle', 'reuse', 'reduce', 'sustainable', 'eco-friendly', 'carbon footprint',
    'renewable', 'solar', 'organic', 'pollution', 'emission', 'climate change',
    'conservation', 'biodiversity', 'green energy', 'waste', 'compost', 'deforestation',
    'environmentalist', 'campaign', 'awareness', 'habitat', 'preserve', 'plastic',
    'greenhouse', 'fossil fuel', 'electric vehicle', 'zero waste', 'upcycle', 'activism',
    'protest', 'petition', 'carbon dioxide', 'ozone', 'landfill', 'biodegradable',
    'hybrid', 'clean energy', 'environmental', 'ecosystem',
  ],
  'Unit 4: The Mass Media': [
    'broadcast', 'headline', 'journalist', 'editor', 'tabloid', 'broadsheet',
    'audience', 'viewer', 'listener', 'podcast', 'streaming', 'social media',
    'influencer', 'viral', 'censorship', 'bias', 'fake news', 'source',
    'coverage', 'interview', 'report', 'column', 'advertisement', 'commercial',
    'press', 'media outlet', 'freedom of speech', 'public opinion', 'documentary',
    'channel', 'subscriber', 'clickbait', 'content creator', 'platform', 'trending',
    'reputation', 'privacy', 'mass communication', 'digital media', 'broadcasting',
  ],
  'Unit 9: Choosing A Career': [
    'career path', 'vocation', 'profession', 'occupation', 'internship', 'apprentice',
    'resume', 'cover letter', 'job fair', 'recruitment', 'interview',
    'salary', 'wage', 'benefit', 'promotion', 'ambition', 'qualification',
    'skill set', 'soft skill', 'hard skill', 'networking', 'mentor', 'portfolio',
    'freelance', 'entrepreneur', 'self-employed', 'job market', 'vacancy', 'applicant',
    'shortlist', 'offer', 'resign', 'retire', 'work-life balance', 'remote work',
    'career ladder', 'specialist', 'generalist', 'training',
  ],
};

function cleanWord(w: string): string {
  return w.trim().replace(/\s+/g, ' ').toLowerCase();
}

function isUsable(w: string): boolean {
  if (w.length < 2 || w.length > 60) return false;
  if (/^\d+$/.test(w)) return false;
  return /^[a-z][a-z0-9' -]*$/i.test(w);
}

function main(): void {
  const data = JSON.parse(readFileSync(PRO3M, 'utf8')) as Record<string, { words?: string[] }>;
  const exam = JSON.parse(readFileSync(EXAM, 'utf8')) as {
    subtopics: { sourceNames?: string[] }[];
  };
  const locked = new Set<string>();
  for (const s of exam.subtopics ?? []) {
    for (const n of s.sourceNames ?? []) locked.add(n);
  }

  for (const [unit, pools] of Object.entries(FILL)) {
    if (locked.has(unit)) {
      console.warn(`[EnrichG12] skip locked exam source: ${unit}`);
      continue;
    }
    const existing = data[unit]?.words ?? [];
    if (existing.length > 0) {
      console.log(`[EnrichG12] skip non-empty: ${unit} (${existing.length})`);
      continue;
    }

    const seen = new Set<string>();
    const out: string[] = [];
    const push = (raw: string) => {
      const w = cleanWord(raw);
      if (!isUsable(w) || seen.has(w)) return;
      seen.add(w);
      out.push(w);
    };
    for (const key of pools) {
      for (const w of data[key]?.words ?? []) push(w);
    }
    for (const w of SEEDS[unit] ?? []) push(w);

    const singles = out.filter((w) => !w.includes(' '));
    const multi = out.filter((w) => w.includes(' '));
    const final = [...singles, ...multi].slice(0, TARGET);
    data[unit] = { words: final };
    console.log(`[EnrichG12] ${unit}: 0 → ${final.length}`);
  }

  writeFileSync(PRO3M, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  console.log('[EnrichG12] wrote', PRO3M);
}

main();
