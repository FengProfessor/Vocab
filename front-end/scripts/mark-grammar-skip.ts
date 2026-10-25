/**
 * [MarkGrammar] Mark các từ là grammar term → skip-function (không cần ảnh).
 * Patterns: "real condition", "verb forms", "past simple", "if-clause"...
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const GRAMMAR_PATTERNS = [
  /\bcondition(al)?s?\b/i,
  /\bclause\b/i,
  /\bif[- ]clause\b/i,
  /\bverb\s+form/i,
  /\b(present|past|future|perfect|continuous|simple|progressive)\s+(simple|continuous|perfect|progressive|tense)/i,
  /\btense\b/i,
  /\bsentence(s)?\b/i,
  /\b(main|subordinate|relative)\s+clause/i,
  /\b(direct|indirect)\s+speech/i,
  /\barticle(s)?\b/i, // không phải news article mà mạo từ
  /\b(modal|auxiliary|helping)\s+verb/i,
  /^(any|some|every|no)\s*(one|body|thing|where)$/i,
];

const ADDITIONAL_FUNCTION = new Set([
  // Lọt qua FUNCTION_WORDS classifier cũ
  'they', 'them', 'their', 'theirs', 'themselves',
  'these', 'those', 'this', 'that',
  'when', 'where', 'why', 'how', 'who', 'whom', 'what', 'which',
  'even', 'else', 'every', 'each',
  'your', 'yours', 'yourself',
  'his', 'hers', 'mine',
]);

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(url, key);

  console.log('[MarkGrammar] tải từ missing...');
  const { data: rows } = await supabase
    .from('global_dictionary')
    .select('word')
    .or('image_source.eq.none,image_source.eq.placeholder')
    .is('image_url', null)
    .limit(2000);

  if (!rows) return;
  console.log(`[MarkGrammar] có ${rows.length} missing`);

  const toSkip: string[] = [];
  for (const r of rows) {
    const w = r.word.toLowerCase();
    if (ADDITIONAL_FUNCTION.has(w)) {
      toSkip.push(r.word);
      continue;
    }
    if (GRAMMAR_PATTERNS.some((p) => p.test(w))) {
      toSkip.push(r.word);
    }
  }

  console.log(`[MarkGrammar] mark ${toSkip.length} từ → skip-function:`);
  toSkip.forEach((w) => console.log(`  - ${w}`));

  if (toSkip.length === 0) return;

  // Update in chunks
  for (let i = 0; i < toSkip.length; i += 200) {
    const chunk = toSkip.slice(i, i + 200);
    const { error } = await supabase
      .from('global_dictionary')
      .update({ image_source: 'skip-function', image_url: null })
      .in('word', chunk);
    if (error) {
      console.error('Update error:', error.message);
      break;
    }
  }
  console.log(`\n[MarkGrammar] DONE: marked ${toSkip.length}`);
}

main();
