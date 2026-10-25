import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

function loadEnv() {
  const raw = fs.readFileSync(path.resolve('.env.local'), 'utf8');
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

const env = loadEnv();
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const SPOT_SLUGS = [
  // 10 Beginner
  'prepositions-time',
  'prepositions-time',
  'articles',
  'articles',
  'personal-pronouns',
  'present-simple',
  'past-simple',
  'prepositions-place',
  'countable-uncountable',
  'demonstratives',

  // 5 Advanced
  'subjunctive',
  'cleft-sentences',
  'inversion',
  'future-in-the-past',
  'modals-perfect'
];

async function spot() {
  const { data: lessons } = await sb
    .from('grammar_lessons')
    .select('exercises,topic:grammar_topics(slug,title,level)');

  const rows = [];

  for (const slug of SPOT_SLUGS) {
    const L = lessons.find(x => x.topic?.slug === slug);
    if (!L) continue;
    const exList = L.exercises || [];
    
    // Find a matching exercise
    let matchEx = null;
    if (slug === 'prepositions-time' && rows.filter(r => r.slug === 'prepositions-time').length === 0) {
      matchEx = exList.find(e => String(e.q).includes('noon'));
    } else if (slug === 'prepositions-time' && rows.filter(r => r.slug === 'prepositions-time').length === 1) {
      matchEx = exList.find(e => String(e.q).includes('Monday'));
    } else if (slug === 'articles' && rows.filter(r => r.slug === 'articles').length === 0) {
      matchEx = exList.find(e => String(e.q).includes('one-way'));
    } else if (slug === 'articles' && rows.filter(r => r.slug === 'articles').length === 1) {
      matchEx = exList.find(e => String(e.q).includes('honest'));
    } else if (slug === 'personal-pronouns') {
      matchEx = exList.find(e => String(e.answer).toLowerCase() === 'me');
    } else if (slug === 'present-simple') {
      matchEx = exList.find(e => String(e.answer).toLowerCase() === 'watches' || String(e.answer).toLowerCase() === 'plays');
    } else if (slug === 'past-simple') {
      matchEx = exList.find(e => String(e.answer).toLowerCase().includes('didn\'t') || String(e.q).includes('bought'));
    } else if (slug === 'subjunctive') {
      matchEx = exList.find(e => String(e.q).includes('insisted') || String(e.q).includes('doctor'));
    } else if (slug === 'cleft-sentences') {
      matchEx = exList.find(e => String(e.answer).toLowerCase() === 'that');
    } else {
      matchEx = exList[0];
    }

    if (!matchEx) matchEx = exList[0];

    const ans = matchEx.answer !== undefined ? matchEx.answer : matchEx.correct_answer;
    const ansStr = Array.isArray(ans) ? ans.join(' / ') : String(ans !== undefined ? ans : '');
    
    rows.push({
      slug,
      level: L.topic.level,
      q: matchEx.q.slice(0, 50),
      answer: ansStr,
      fb: matchEx.fb,
    });
  }

  console.log(JSON.stringify(rows, null, 2));
  fs.writeFileSync('tmp/r5.1-spot-rows.json', JSON.stringify(rows, null, 2));
}

spot().catch(console.error);
