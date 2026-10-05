import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..', '..');

const ROADMAP_PATH = path.join(__dirname, 'roadmap.json');
const OUT_DIR = path.join(__dirname, 'out');
const ASSETS_MANIFEST_PATH = path.join(ROOT_DIR, 'src', 'data', 'grammar-topic-assets.json');

const roadmap = JSON.parse(fs.readFileSync(ROADMAP_PATH, 'utf8'));
const manifest = JSON.parse(fs.readFileSync(ASSETS_MANIFEST_PATH, 'utf8'));

let totalTopics = 0;
let totalExercises = 0;
const defects = [];

const PROHIBITED_PHRASES = [
  'chiến thắng tuyệt đối',
  'mẹo 5s',
  'mẹo nhớ 5s',
  'ăn trọn điểm',
  'hack điểm',
  'bí kíp hack',
  'trùm ngữ pháp',
];

roadmap.forEach((topic) => {
  totalTopics++;
  const slug = topic.slug;
  const filePath = path.join(OUT_DIR, `${slug}.json`);
  if (!fs.existsSync(filePath)) {
    defects.push({ slug, severity: 'P0', type: 'missing_file', msg: 'File not found' });
    return;
  }
  const fileContent = fs.readFileSync(filePath, 'utf8');
  let data;
  try {
    data = JSON.parse(fileContent);
  } catch (e) {
    defects.push({ slug, severity: 'P0', type: 'invalid_json', msg: e.message });
    return;
  }

  // 0. Prohibited phrase check
  for (const phrase of PROHIBITED_PHRASES) {
    if (fileContent.toLowerCase().includes(phrase)) {
      defects.push({
        slug,
        severity: 'P0',
        type: 'prohibited_phrase',
        msg: `Found prohibited phrase "${phrase}"`,
      });
    }
  }

  // 1. Order / Slug check
  if (data.order !== topic.order) {
    defects.push({
      slug,
      severity: 'P1',
      type: 'metadata_order',
      msg: `Order mismatch: json=${data.order} vs roadmap=${topic.order}`,
    });
  }
  if (data.slug !== slug) {
    defects.push({
      slug,
      severity: 'P0',
      type: 'metadata_slug',
      msg: `Slug mismatch: json=${data.slug} vs roadmap=${slug}`,
    });
  }

  // 2. Sections check
  const sections = data.sections || {};
  if (!sections.definition) {
    defects.push({ slug, severity: 'P0', type: 'theory_definition', msg: 'Missing definition' });
  }
  const usage = sections.usage || [];
  const mistakes = sections.mistakes || [];
  const examples = sections.examples || [];

  // Check usage bilingual parity
  usage.forEach((u, i) => {
    if (!u.en || !u.vi) {
      defects.push({
        slug,
        severity: 'P1',
        type: 'usage_bilingual',
        msg: `Usage #${i + 1} missing en or vi`,
      });
    }
  });

  // Check examples bilingual parity
  examples.forEach((ex, i) => {
    if (!ex.en || !ex.vi) {
      defects.push({
        slug,
        severity: 'P1',
        type: 'example_bilingual',
        msg: `Example #${i + 1} missing en or vi`,
      });
    }
  });

  // Check mistakes right != wrong
  mistakes.forEach((m, i) => {
    if (!m.wrong || !m.right) {
      defects.push({
        slug,
        severity: 'P1',
        type: 'mistake_empty',
        msg: `Mistake #${i + 1} missing wrong/right`,
      });
    } else if (m.wrong.trim().toLowerCase() === m.right.trim().toLowerCase()) {
      defects.push({
        slug,
        severity: 'P0',
        type: 'mistake_identical',
        msg: `Mistake #${i + 1} wrong equals right: "${m.wrong}"`,
      });
    }
  });

  // 3. Exercises check
  const exercises = data.exercises || [];
  totalExercises += exercises.length;
  exercises.forEach((ex, i) => {
    const q = String(ex.question || ex.q || '').trim();
    const ans = ex.correct_answer !== undefined ? ex.correct_answer : ex.answer;
    const opts = (ex.options || ex.opts || []).map((o) => String(o).trim());
    const exp = String(ex.explanation || ex.fb || '').trim();

    // Check fill_blank has blank placeholder
    if (ex.type === 'fill_blank') {
      if (!q.includes('___') && !q.includes('...') && !q.includes('(_') && !q.includes('_____')) {
        defects.push({
          slug,
          severity: 'P1',
          type: 'fill_missing_blank',
          msg: `Ex #${i + 1} fill_blank missing blank placeholder: "${q}"`,
        });
      }
    }

    // Check Vietnamese in options for English-only question
    const ansStr = Array.isArray(ans) ? ans.join(' ') : String(ans);
    if ((/[À-ỹ]/.test(ansStr) || ansStr === 'Đúng' || ansStr === 'Sai') && !/[À-ỹ]/.test(q)) {
      defects.push({
        slug,
        severity: 'P1',
        type: 'vn_answer_in_en_q',
        msg: `Ex #${i + 1} Vietnamese answer in English stem: "${q}" -> ${ansStr}`,
      });
    }

    // Check answer in options
    if (opts.length > 0 && typeof ans === 'string') {
      const match = opts.some((o) => o.toLowerCase() === ans.toLowerCase());
      if (!match) {
        defects.push({
          slug,
          severity: 'P0',
          type: 'ans_not_in_options',
          msg: `Ex #${i + 1} ans "${ans}" not in opts [${opts.join(', ')}]`,
        });
      }
    }

    // Check distractor breakdowns
    const dbs = ex.distractor_breakdowns || [];
    if (dbs.length > 0) {
      const correctDb = dbs.filter((db) => db.isCorrect);
      if (correctDb.length === 0) {
        defects.push({
          slug,
          severity: 'P0',
          type: 'no_correct_distractor',
          msg: `Ex #${i + 1} no distractor marked isCorrect=true`,
        });
      } else if (correctDb.length > 1 && ex.type !== 'multiple_response') {
        defects.push({
          slug,
          severity: 'P1',
          type: 'multiple_correct_distractors',
          msg: `Ex #${i + 1} multiple distractors marked isCorrect=true: ${correctDb.map((d) => d.option).join(', ')}`,
        });
      } else if (correctDb.length === 1 && typeof ans === 'string') {
        if (correctDb[0].option.toLowerCase().trim() !== ans.toLowerCase().trim()) {
          defects.push({
            slug,
            severity: 'P0',
            type: 'distractor_answer_mismatch',
            msg: `Ex #${i + 1} correct distractor "${correctDb[0].option}" !== correct_answer "${ans}"`,
          });
        }
      }
    }

    // Check letter references in explanation (e.g. "đáp án A", "chọn B", "phương án C")
    // Do NOT use case-insensitive /i to avoid matching "lựa chọn có..." where 'c' is followed by 'ó'
    const letterMatch = exp.match(/(?:chọn|đáp án|phương án)\s+([A-D])(?![a-zA-ZÀ-ỹ0-9_])/);
    if (letterMatch && opts.length >= 2) {
      const mentionedLetter = letterMatch[1];
      const letterIndex = mentionedLetter.charCodeAt(0) - 65;
      if (letterIndex < opts.length && typeof ans === 'string') {
        const expectedOption = opts[letterIndex];
        if (expectedOption.toLowerCase().trim() !== ans.toLowerCase().trim()) {
          defects.push({
            slug,
            severity: 'P0',
            type: 'explanation_key_mismatch',
            msg: `Ex #${i + 1} explanation mentions option ${mentionedLetter} ("${expectedOption}") but correct_answer is "${ans}"`,
          });
        }
      }
    }
  });
});

console.log(`Audited ${totalTopics} topics, ${totalExercises} exercises.`);
console.log(`Total defects flagged: ${defects.length}`);
const p0Count = defects.filter((d) => d.severity === 'P0').length;
const p1Count = defects.filter((d) => d.severity === 'P1').length;
console.log(`P0: ${p0Count}, P1: ${p1Count}`);
defects.forEach((d) =>
  console.log(`[${d.severity}] ${d.slug} (${d.type}): ${d.msg}`),
);
