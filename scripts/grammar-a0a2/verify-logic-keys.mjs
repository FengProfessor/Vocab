/**
 * Script: scripts/grammar-a0a2/verify-logic-keys.mjs
 * Gate verification wrapper for audit-logic-keys.mjs.
 * Exits with code 0 on PASS (0 findings), or code 1 on FAIL (>0 findings).
 *
 * Usage: node scripts/grammar-a0a2/verify-logic-keys.mjs
 */

import fs from 'fs';
import path from 'path';
import { auditExercise } from './audit-logic-keys.mjs';
import { createClient } from '@supabase/supabase-js';

function loadEnv() {
  const envPath = path.resolve('.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('.env.local not found');
    process.exit(1);
  }
  const raw = fs.readFileSync(envPath, 'utf8');
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    if (!line || line.startsWith('#')) continue;
    const i = line.indexOf('=');
    if (i < 0) continue;
    let v = line.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    )
      v = v.slice(1, -1);
    env[line.slice(0, i).trim()] = v;
  }
  return env;
}

async function main() {
  const env = loadEnv();
  const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  const { data: lessons, error } = await sb
    .from('grammar_lessons')
    .select('id, exercises, topic:grammar_topics(slug, level, title_vi)');

  if (error) {
    console.error('❌ Error fetching lessons:', error);
    process.exit(1);
  }

  let totalExercises = 0;
  let totalFindings = 0;

  for (const L of lessons || []) {
    const slug = L.topic?.slug || 'unknown';
    const exercises = Array.isArray(L.exercises) ? L.exercises : [];

    exercises.forEach((e, idx) => {
      totalExercises++;
      const findings = auditExercise(e, idx, slug);
      if (findings.length > 0) {
        totalFindings += findings.length;
      }
    });
  }

  console.log('================ LOGIC KEYS VERIFICATION GATE ================');
  console.log(`Total Lessons Audited: ${lessons.length}`);
  console.log(`Total Exercises Audited: ${totalExercises}`);
  console.log(`Logic Findings Count: ${totalFindings} (must be 0)`);
  console.log('=============================================================');

  if (totalFindings === 0) {
    console.log('STATUS: PASS');
    process.exit(0);
  } else {
    console.log('STATUS: FAIL');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('❌ Error during verify-logic-keys:', err);
  process.exit(1);
});
