/**
 * Verify wordbanks in code vs Supabase lessons.
 * Usage: node scripts/grammar-a0a2/verify-wordbanks-db.mjs
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import { bankStats, banksForSlug } from './wordbanks-dense.mjs';

function loadEnv() {
  const raw = fs.readFileSync('.env.local', 'utf8');
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

function countRows(banks) {
  return (banks || []).reduce((n, b) => n + (b.rows?.length || 0), 0);
}

function hasViHeader(banks) {
  for (const b of banks || []) {
    const row = b.rows?.[0];
    if (!row) continue;
    for (const k of Object.keys(row)) {
      // pure EN short keys bad
      if (/^(Rule|Case|Form|Subject|Example|Note|With)$/i.test(k)) return false;
    }
  }
  return true;
}

const env = loadEnv();
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const stats = bankStats();

const { data: topics, error: te } = await sb.from('grammar_topics').select('id,slug,level');
if (te) throw te;
const { data: lessons, error: le } = await sb
  .from('grammar_lessons')
  .select('id,topic_id,sections');
if (le) throw le;

const lessonByTopic = Object.fromEntries((lessons || []).map((l) => [l.topic_id, l]));

let ok = 0;
let fail = 0;
const report = [];

for (const t of topics || []) {
  if (t.level === 'advanced') continue;
  const codeBanks = banksForSlug(t.slug);
  const codeRows = countRows(codeBanks);
  const lesson = lessonByTopic[t.id];
  const dbBanks = lesson?.sections?.wordbanks;
  const dbRows = countRows(dbBanks);
  const viOk = hasViHeader(codeBanks || []);
  const match = codeRows > 0 && dbRows === codeRows;
  const status = !codeRows ? 'NO_CODE' : !dbRows ? 'NO_DB' : match && viOk ? 'PASS' : 'FAIL';
  if (status === 'PASS') ok++;
  else fail++;
  report.push({
    slug: t.slug,
    level: t.level,
    codeRows,
    dbRows,
    tables: codeBanks?.length || 0,
    viOk,
    status,
  });
}

report.sort((a, b) => a.level.localeCompare(b.level) || a.slug.localeCompare(b.slug));
console.log('slug | level | code | db | tables | vi | status');
for (const r of report) {
  console.log(
    `${r.status.padEnd(7)} ${String(r.codeRows).padStart(3)}/${String(r.dbRows).padStart(3)} t=${String(r.tables).padStart(2)} vi=${r.viOk ? 'Y' : 'N'}  ${r.level}  ${r.slug}`
  );
}
console.log('---');
console.log(JSON.stringify({ ok, fail, codeSlugs: Object.keys(stats).length, totalCodeRows: Object.values(stats).reduce((n, s) => n + s.rows, 0) }, null, 2));

fs.mkdirSync('tmp', { recursive: true });
fs.writeFileSync('tmp/wordbanks-verify-report.json', JSON.stringify({ ok, fail, report }, null, 2));
if (fail > 0) process.exitCode = 1;
