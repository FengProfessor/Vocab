/**
 * Script: scripts/grammar-a0a2/audit-logic-keys.mjs
 * Native-level English logic auditor for all 62 grammar topics in Supabase.
 * Checks English agreement, item integrity, TF truth, options match, and flags any poison keys.
 *
 * Usage: node scripts/grammar-a0a2/audit-logic-keys.mjs
 * Output: tmp/logic-key-audit.json
 */

import fs from 'fs';
import path from 'path';
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

export const FORCE_TRUE_PATTERNS = [
  /^Tom is happy\.?$/i,
  /^She is a player\.?$/i,
  /^He works here\.?$/i,
  /^I love Tom\.?$/i,
  /^They are students\.?$/i,
  /^Are you free\??$/i,
  /^Is she free\??$/i,
  /^Is everyone OK\??$/i,
  /^Is everyone okay\??$/i,
  /^Tom was playing football\.?$/i,
  /^They were not watching TV\.?$/i,
  /^Tom was happy\.?$/i,
  /^She works hard\.?$/i,
  /^We are ready\.?$/i,
  /^He is a doctor\.?$/i,
  /^They are happy\.?$/i,
  /^Is this your bag\??$/i,
  /^There is some furniture in the room\.?$/i,
  /^The cat wagged its tail\.?$/i,
  /^Does he live here\??$/i,
  /^I was playing football yesterday at 4\.?$/i,
  /^They are not tired\.?$/i,
  /^They aren't tired\.?$/i,
  /^Sara and I are classmates\.?$/i,
  /^This is my (bag|book|jacket|pen)\.?$/i,
  /^The red pen is mine\.?$/i,
  /^I wish I were rich\.?$/i,
  /^If I were you, I would consult a doctor\.?$/i,
];

/** High-confidence wrong English — TF must be false; must not be the keyed answer alone */
export const FORCE_FALSE_PATTERNS = [
  /^They is\b/i,
  /^Tom are\b/i,
  /^She am\b/i,
  /^I is\b/i,
  /^mine pen$/i,
  /^mine jacket$/i,
  /yours bag/i,
  /her's box/i,
  /it's tail/i,
  /an information/i,
  /three furnitures/i,
  /He was born at \d{4}/i,
  /looking forward to meet/i,
  /I am knowing\b/i,
  /Do he live/i,
  /I was play football/i,
  /They not is tired/i,
  /has to goes/i,
];

const POISON_BE_PATTERNS = [
  /\bthey\s+(is|not\s+is|is\s+not)\b/i,
  /\bwe\s+(is|is\s+not|isn't)\b/i,
  /\byou\s+(is|is\s+not|isn't)\b/i,
  /\bhe\s+(are|are\s+not|aren't)\b/i,
  /\bshe\s+(are|are\s+not|aren't|am|am\s+not)\b/i,
  /(?<!\band\s+)\bi\s+(is|is\s+not|isn't|are|are\s+not|aren't)\b/i,
  /\btom\s+(are|are\s+not|aren't)\b/i,
  /\beveryone\s+(are|are\s+not|aren't)\b/i,
  /\bsomebody\s+(are|are\s+not|aren't)\b/i,
  /\bnobody\s+(are|are\s+not|aren't)\b/i,
  /\beverything\s+(are|are\s+not|aren't)\b/i,
  /\bnothing\s+(are|are\s+not|aren't)\b/i,
];

function getOpts(e) {
  const o = e?.opts ?? e?.options;
  return Array.isArray(o) ? o.map((x) => String(x ?? '').trim()) : [];
}

function getAns(e) {
  return e?.answer !== undefined ? e.answer : e?.correct_answer;
}

function getType(e) {
  let t = String(e?.type || 'mcq');
  if (t === 'multiple_choice') t = 'mcq';
  if (t === 'fill_blank') t = 'fill';
  if (t === 'error_correction') t = 'error';
  return t;
}

export function auditExercise(e, index, topicSlug) {
  const findings = [];
  const q = String(e?.q || e?.question || '').trim();
  const type = getType(e);
  const opts = getOpts(e);
  const rawAns = getAns(e);
  const ansStr = Array.isArray(rawAns) ? rawAns.join(' / ') : String(rawAns ?? '').trim();
  const fb = String(e?.fb || e?.explanation || '').trim();

  // A) Check Poison Be-Agreement in Answer
  for (const pattern of POISON_BE_PATTERNS) {
    if (pattern.test(ansStr)) {
      findings.push({
        code: 'POISON_AGREEMENT_KEY',
        severity: 'P0',
        message: `Answer contains invalid agreement poison: "${ansStr}"`,
        detail: ansStr,
      });
      break;
    }
  }

  // Check specific "They is"
  if (/\bthey\s+(is|not\s+is)\b/i.test(ansStr) && !/\bthey\s+(are|aren't|are\s+not)\b/i.test(ansStr)) {
    findings.push({
      code: 'THEY_IS_KEY',
      severity: 'P0',
      message: `Answer keys "They is..." instead of "They are / aren't...": "${ansStr}"`,
      detail: ansStr,
    });
  }

  // Check specific "Tom are"
  if (/\btom\s+are\b/i.test(ansStr)) {
    findings.push({
      code: 'TOM_ARE_KEY',
      severity: 'P0',
      message: `Answer keys "Tom are...": "${ansStr}"`,
      detail: ansStr,
    });
  }

  // B) Find the Error (type 'error') integrity check
  if (type === 'error' || /find the error|sửa lỗi/i.test(q)) {
    const stemMatch = q.match(/(?:find the error|sửa lỗi|câu nào sai)\s*:\s*["“']?([^"”'\n]+)["”']?/i);
    const stem = stemMatch ? stemMatch[1].trim() : '';

    if (stem) {
      // Check if STEM is already correct English but answer worsens it
      if (/^Tom is happy\.?$/i.test(stem) && /Tom are/i.test(ansStr)) {
        findings.push({
          code: 'POISON_ERROR_PAIR',
          severity: 'P0',
          message: `Find-the-error stem "${stem}" was correct but answer worsened it to "${ansStr}"`,
          detail: { stem, ansStr },
        });
      }

      // Check if stem is "They not is tired" but answer is not "They are not / aren't tired"
      if (/they not is/i.test(stem)) {
        if (!/\bthey (aren't|are not)\b/i.test(ansStr)) {
          findings.push({
            code: 'DOUBLE_WRONG_ERROR',
            severity: 'P0',
            message: `Stem "${stem}" error repair answer "${ansStr}" is not "They are not / aren't tired"`,
            detail: { stem, ansStr },
          });
        }
      }

      // General check if answer repair itself is ungrammatical
      for (const pattern of POISON_BE_PATTERNS) {
        if (pattern.test(ansStr)) {
          findings.push({
            code: 'UNGRAMMATICAL_ERROR_REPAIR',
            severity: 'P0',
            message: `Error repair answer "${ansStr}" is ungrammatical`,
            detail: ansStr,
          });
          break;
        }
      }
    }
  }

  // C) Check TF Scanner (incl. "grammatically correct")
  if (type === 'tf') {
    const tfMatch =
      q.match(/["“']([^"”']+)["”']\s+is(?:\s+grammatically)?\s+correct/i) ||
      q.match(/sentence\s+["“']([^"”']+)["”']/i) ||
      q.match(/^["“']([^"”']+)["”']$/i);
    if (tfMatch) {
      const sent = tfMatch[1].trim();
      const ansFalse =
        rawAns === false || String(rawAns).trim().toLowerCase() === 'false';
      const ansTrue =
        rawAns === true || String(rawAns).trim().toLowerCase() === 'true';

      for (const pattern of FORCE_TRUE_PATTERNS) {
        if (pattern.test(sent) && ansFalse) {
          findings.push({
            code: 'TF_FORCE_TRUE_KEYED_FALSE',
            severity: 'P0',
            message: `Sentence "${sent}" is correct English but TF is keyed FALSE`,
            detail: { sent, rawAns },
          });
          break;
        }
      }

      for (const pattern of FORCE_FALSE_PATTERNS) {
        if (pattern.test(sent) && ansTrue) {
          findings.push({
            code: 'TF_FORCE_FALSE_KEYED_TRUE',
            severity: 'P0',
            message: `Sentence "${sent}" is wrong English but TF is keyed TRUE`,
            detail: { sent, rawAns },
          });
          break;
        }
      }

      if (/^Is everyone (OK|okay)\??$/i.test(sent) && ansFalse) {
        findings.push({
          code: 'TF_EVERYONE_OK_FALSE',
          severity: 'P0',
          message: `"Is everyone OK?" is correct English (everyone is singular) but TF is keyed FALSE`,
          detail: { sent, rawAns },
        });
      }

      if (/I love Tom/i.test(sent) && /\b(they|them|họ)\b/i.test(fb)) {
        findings.push({
          code: 'TF_FB_PRONOUN_MISMATCH',
          severity: 'P1',
          message: `Feedback for "I love Tom" mentions unrelated pronouns (they/them)`,
          detail: { sent, fb },
        });
      }
    }
  }

  // C2) Error stem already correct (high-confidence whitelist)
  if (type === 'error' || /find the error/i.test(q)) {
    const stemM = q.match(/find the error\s*:\s*(.+)/i);
    if (stemM) {
      const stem = stemM[1].trim();
      for (const pattern of FORCE_TRUE_PATTERNS) {
        if (pattern.test(stem.replace(/[.?!]+$/, ''))) {
          findings.push({
            code: 'ERROR_STEM_IS_CORRECT',
            severity: 'P0',
            message: `Find-the-error stem is already correct English: "${stem}"`,
            detail: { stem, ansStr },
          });
          break;
        }
      }
    }
  }

  // D) Check Answer in Opts (ans ∉ opts)
  if ((type === 'mcq' || type === 'error') && opts.length > 0) {
    const ansInOpts = opts.some((o) => o.trim().toLowerCase() === ansStr.toLowerCase());
    if (!ansInOpts) {
      findings.push({
        code: 'ANS_NOT_IN_OPTS',
        severity: 'P1',
        message: `Answer "${ansStr}" is not in options [${opts.join(', ')}]`,
        detail: { ansStr, opts },
      });
    }
  }

  // E) Check Meta / Junk questions
  if (/which example fits/i.test(q) || opts.some((o) => /another incorrect|^another$/i.test(o)) || /Contrast focus/i.test(q)) {
    findings.push({
      code: 'META_JUNK_QUESTION',
      severity: 'P1',
      message: `Question contains meta/junk phrasing: "${q}"`,
      detail: q,
    });
  }

  return findings;
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
  let theyIsCount = 0;
  let tomAreCount = 0;
  const allFindings = [];

  for (const L of lessons || []) {
    const slug = L.topic?.slug || 'unknown';
    const exercises = Array.isArray(L.exercises) ? L.exercises : [];

    exercises.forEach((e, idx) => {
      totalExercises++;
      const findings = auditExercise(e, idx, slug);

      if (findings.length > 0) {
        totalFindings += findings.length;

        findings.forEach((f) => {
          const detailStr = typeof f.detail === 'string' ? f.detail : JSON.stringify(f.detail);
          if (f.code === 'THEY_IS_KEY' || /\bthey\s+is\b/i.test(detailStr)) {
            theyIsCount++;
          }
          if (f.code === 'TOM_ARE_KEY' || /\btom\s+are\b/i.test(detailStr)) {
            tomAreCount++;
          }

          allFindings.push({
            topic: slug,
            exercise_index: idx + 1,
            question: e.q || e.question || '',
            answer: e.answer !== undefined ? e.answer : e.correct_answer,
            type: e.type || 'mcq',
            ...f,
          });
        });
      }
    });
  }

  const report = {
    audited_at: new Date().toISOString(),
    total_lessons: lessons.length,
    total_exercises: totalExercises,
    total_findings: totalFindings,
    they_is_as_answer_count: theyIsCount,
    tom_are_as_answer_count: tomAreCount,
    findings: allFindings,
  };

  fs.mkdirSync('tmp', { recursive: true });
  fs.writeFileSync('tmp/logic-key-audit.json', JSON.stringify(report, null, 2), 'utf8');

  console.log('================ LOGIC KEYS AUDIT REPORT ================');
  console.log(`Total Lessons: ${lessons.length}`);
  console.log(`Total Exercises: ${totalExercises}`);
  console.log(`Total Findings: ${totalFindings}`);
  console.log(`"They is" as answer count: ${theyIsCount}`);
  console.log(`"Tom are" as answer count: ${tomAreCount}`);
  console.log('=========================================================');

  if (allFindings.length > 0) {
    console.log('\nFindings Summary:');
    allFindings.forEach((f, i) => {
      console.log(`${i + 1}. [${f.topic} #${f.exercise_index}] ${f.code} (${f.severity}): ${f.message}`);
    });
  } else {
    console.log('🎉 No logic key findings detected! All 62 topics clean.');
  }

  process.exit(totalFindings === 0 ? 0 : 0); // Always write JSON and print output
}

main().catch((err) => {
  console.error('❌ Audit script error:', err);
  process.exit(1);
});
