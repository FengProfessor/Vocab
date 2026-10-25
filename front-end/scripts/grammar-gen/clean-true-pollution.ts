/**
 * Gỡ pollution THẬT (high precision) — không đụng FP (passive "It is said", subjunctive "It is essential that").
 *   npx tsx scripts/grammar-gen/clean-true-pollution.ts --dry
 *   npx tsx scripts/grammar-gen/clean-true-pollution.ts --apply
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const DRY = !process.argv.includes('--apply');
const LOG = '[TruePollution]';

type Ex = {
  type?: string;
  q?: string;
  question?: string;
  [k: string]: unknown;
};

function loadEnv(): void {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!m || process.env[m[1]]) continue;
    let v = m[2];
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    )
      v = v.slice(1, -1);
    process.env[m[1]] = v;
  }
}

const getQ = (e: Ex) => String(e.question ?? e.q ?? '').trim();

/** Rule: nếu match VÀ slug không nằm allow → drop */
type Rule = { id: string; re: RegExp; allow: string[] };

const RULES: Rule[] = [
  // Conditionals wrongly in future-will / non-conditional lessons
  {
    id: 'mixed-cond-if-had',
    re: /\bif (I|he|she|they|we|you).*\bhad\b.+\bwould\b/i,
    allow: [
      'mixed-conditionals',
      'second-conditional',
      'third-conditional',
      'conditionals-0-1',
      'wish-if-only',
    ],
  },
  {
    id: 'second-cond-if-were',
    re: /\bif (I|he|she|they).*\b(were|was)\b.+\bwould\b/i,
    allow: [
      'second-conditional',
      'mixed-conditionals',
      'conditionals-0-1',
      'wish-if-only',
      'subjunctive',
    ],
  },
  {
    id: 'cond-find-error-if',
    re: /^find the error:\s*if\b/i,
    allow: [
      'mixed-conditionals',
      'second-conditional',
      'third-conditional',
      'conditionals-0-1',
      'wish-if-only',
    ],
  },
  {
    id: 'cond-fill-if-we',
    re: /^fill in the blank:\s*if we ___ \(take\)/i,
    allow: [
      'mixed-conditionals',
      'second-conditional',
      'third-conditional',
      'conditionals-0-1',
    ],
  },
  // Wish / if only outside wish+subjunctive
  {
    id: 'wish-if-only',
    re: /\b(if only|i wish i)\b/i,
    allow: ['wish-if-only', 'subjunctive'],
  },
  // Gerund/infinitive stock outside gerunds lesson
  {
    id: 'gerund-avoided-admitted',
    re: /he avoided ___|admitted to steal|looking forward to ___|denied to take|couldn'?t help ___|do you mind ___|it is worth to try|he stopped ___ a coffee/i,
    allow: ['gerunds-infinitives'],
  },
  {
    id: 'gerund-stock-old',
    re: /they managed ___ the project|she promised ___ \(call\)|finished to write the report|don'?t forget ___ \(turn\)|he seems ___ tired today/i,
    allow: ['gerunds-infinitives'],
  },
  // There is/are form drills outside that lesson
  {
    id: 'there-is-form',
    re: /choose the correct form:\s*there\s+___|there\s+___\s+(a cat|many students|some water)\b/i,
    allow: ['there-is-there-are'],
  },
  // Pure plural quiz outside plural-nouns
  {
    id: 'plural-of',
    re: /^what is the plural of\b|^choose the correct plural noun:/i,
    allow: ['plural-nouns', 'countable-uncountable'],
  },
];

function dropReason(slug: string, q: string): string | null {
  for (const r of RULES) {
    if (!r.re.test(q)) continue;
    if (!r.allow.includes(slug)) return r.id;
  }
  return null;
}

async function main(): Promise<void> {
  loadEnv();
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

  const { data: topics, error: te } = await client
    .from('grammar_topics')
    .select('id, slug');
  if (te) throw te;
  const { data: lessons, error: le } = await client
    .from('grammar_lessons')
    .select('id, topic_id, exercises');
  if (le) throw le;

  const slugById = new Map((topics ?? []).map((t) => [t.id, t.slug]));
  let totalDrop = 0;

  for (const lesson of lessons ?? []) {
    const slug = slugById.get(lesson.topic_id) ?? '?';
    const xr = (Array.isArray(lesson.exercises) ? lesson.exercises : []) as Ex[];
    const kept: Ex[] = [];
    const dropped: string[] = [];

    for (let i = 0; i < xr.length; i++) {
      const e = xr[i];
      const q = getQ(e);
      const reason = dropReason(slug, q);
      if (reason) {
        dropped.push(`#${i} [${reason}] ${q.slice(0, 90)}`);
        continue;
      }
      kept.push(e);
    }

    if (!dropped.length) continue;
    totalDrop += dropped.length;
    console.log(
      `${LOG} ${slug}: ${xr.length} → ${kept.length} (drop ${dropped.length})`,
    );
    dropped.slice(0, 12).forEach((d) => console.log('  -', d));
    if (dropped.length > 12) console.log(`  ... +${dropped.length - 12}`);

    if (!DRY) {
      const { error } = await client
        .from('grammar_lessons')
        .update({ exercises: kept })
        .eq('id', lesson.id);
      if (error) throw new Error(`${slug}: ${error.message}`);
      await client.from('grammar_quiz_cache').delete().eq('lesson_id', lesson.id);
      console.log(`${LOG} UPDATED ${slug}`);
    }
  }

  console.log(`${LOG} done dry=${DRY} totalDrop=${totalDrop}`);
}

main().catch((e) => {
  console.error(LOG, e);
  process.exit(1);
});
