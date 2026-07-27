import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DRY = process.argv.includes('--dry');
const TARGET_MIN = 36;
const HARD_CAP = 80;

function loadEnv() {
  const envPath = path.resolve('.env.local');
  if (!fs.existsSync(envPath)) {
    throw new Error('.env.local file not found');
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

const env = loadEnv();
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

function normalizeQ(q) {
  return String(q || '')
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const VI_DIACRITICS = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;

function isPollutedQuestion(q) {
  const s = String(q || '');
  if (!s.trim()) return true;
  if (VI_DIACRITICS.test(s)) {
    const letters = (s.match(/[A-Za-z]+/g) || []).join('');
    if (letters.length < 12) return true;
  }
  if (/câu sau đúng|câu nào|chọn câu đúng|ngữ pháp không/i.test(s)) return true;
  if (/\bmay you\b/i.test(s)) return true;
  if (/\bcan you lend\b/i.test(s) && /pen/i.test(s)) return true;
  if (/i have the book/i.test(s) && !/first|second|mention/i.test(s)) return true;
  return false;
}

function getVerbOptions(verb) {
  const v = verb.toLowerCase();
  const forms = {
    go: ['go', 'goes', 'went', 'going'],
    goes: ['goes', 'go', 'went', 'going'],
    went: ['went', 'go', 'goes', 'going'],
    going: ['going', 'go', 'goes', 'went'],
    do: ['do', 'does', 'did', 'doing'],
    does: ['does', 'do', 'did', 'doing'],
    did: ['did', 'do', 'does', 'doing'],
    have: ['have', 'has', 'had', 'having'],
    has: ['has', 'have', 'had', 'having'],
    had: ['had', 'have', 'has', 'having'],
    play: ['play', 'plays', 'played', 'playing'],
    plays: ['plays', 'play', 'played', 'playing'],
    played: ['played', 'play', 'plays', 'playing'],
    playing: ['playing', 'play', 'plays', 'played'],
    work: ['work', 'works', 'worked', 'working'],
    works: ['works', 'work', 'worked', 'working'],
    worked: ['worked', 'work', 'works', 'working'],
    working: ['working', 'work', 'works', 'worked'],
    study: ['study', 'studies', 'studied', 'studying'],
    studies: ['studies', 'study', 'studied', 'studying'],
    studied: ['studied', 'study', 'studies', 'studying'],
    studying: ['studying', 'study', 'studies', 'studied']
  };

  if (forms[v]) return forms[v];

  if (v.endsWith('ing')) {
    const base = v.slice(0, -3);
    return [v, base, base + 's', base + 'ed'];
  }
  if (v.endsWith('ed')) {
    const base = v.slice(0, -2);
    return [v, base, base + 's', base + 'ing'];
  }
  if (v.endsWith('s') && !v.endsWith('ss')) {
    const base = v.slice(0, -1);
    return [v, base, base + 'ed', base + 'ing'];
  }
  return [v, v + 's', v + 'ed', v + 'ing'];
}

function detectGrammarTarget(sentence, slug) {
  const s = sentence.toLowerCase();
  
  if (slug === 'articles') {
    const m = sentence.match(/\b(a|an|the)\b/i);
    if (m) return { target: m[1], opts: ['a', 'an', 'the', '— (no mạo từ)'], case_id: m[1].toLowerCase() };
  }

  if (slug === 'personal-pronouns') {
    const m = sentence.match(/\b(i|me|you|he|him|she|her|it|we|us|they|them)\b/i);
    if (m) {
      const w = m[1].toLowerCase();
      let opts = ['I', 'me', 'my'];
      if (['he', 'him'].includes(w)) opts = ['he', 'him', 'his'];
      if (['she', 'her'].includes(w)) opts = ['she', 'her', 'hers'];
      if (['we', 'us'].includes(w)) opts = ['we', 'us', 'our'];
      if (['they', 'them'].includes(w)) opts = ['they', 'them', 'their'];
      return { target: m[1], opts, case_id: ['i','he','she','we','they','you','it'].includes(w) ? 'subj' : 'obj' };
    }
  }

  if (slug === 'possessives') {
    const m = sentence.match(/\b(my|mine|your|yours|his|her|hers|its|our|ours|their|theirs)\b/i);
    if (m) {
      const w = m[1].toLowerCase();
      let opts = ['my', 'mine', 'me'];
      if (['your', 'yours'].includes(w)) opts = ['your', 'yours', 'you'];
      if (['his'].includes(w)) opts = ['his', 'him', 'he'];
      if (['her', 'hers'].includes(w)) opts = ['her', 'hers', 'she'];
      if (['our', 'ours'].includes(w)) opts = ['our', 'ours', 'us'];
      if (['their', 'theirs'].includes(w)) opts = ['their', 'theirs', 'them'];
      return { target: m[1], opts, case_id: w.endsWith('s') || w === 'mine' ? 'pron' : 'adj' };
    }
  }

  if (slug === 'demonstratives') {
    const m = sentence.match(/\b(this|that|these|those)\b/i);
    if (m) return { target: m[1], opts: ['this', 'that', 'these', 'those'], case_id: m[1].toLowerCase() };
  }

  if (['quantifiers', 'countable-uncountable'].includes(slug)) {
    const m = sentence.match(/\b(much|many|some|any|few|little|a few|a little|a lot of)\b/i);
    if (m) {
      const w = m[1].toLowerCase();
      let opts = ['some', 'any', 'much', 'many'];
      if (['much', 'many'].includes(w)) opts = ['much', 'many', 'a lot of'];
      if (['some', 'any'].includes(w)) opts = ['some', 'any', 'no'];
      if (['few', 'little', 'a few', 'a little'].includes(w)) opts = ['a few', 'a little', 'many', 'much'];
      return { target: m[1], opts, case_id: w.replace(/\s+/g, '_') };
    }
  }

  if (['prepositions-place', 'prepositions-time'].includes(slug)) {
    const m = sentence.match(/\b(in|on|at|under|behind|between|next to|by|for|from|to)\b/i);
    if (m) return { target: m[1], opts: ['in', 'on', 'at', 'under'], case_id: 'prep' };
  }

  if (['conjunctions-linking', 'discourse-markers'].includes(slug)) {
    const m = sentence.match(/\b(but|so|because|although|however|despite|unless|if|when|while|both|either|neither)\b/i);
    if (m) return { target: m[1], opts: ['but', 'so', 'because', 'although'], case_id: m[1].toLowerCase() };
  }

  if (slug === 'adverbs-frequency') {
    const m = sentence.match(/\b(always|usually|often|sometimes|rarely|never)\b/i);
    if (m) return { target: m[1], opts: ['always', 'usually', 'rarely', 'never'], case_id: m[1].toLowerCase() };
  }

  if (slug === 'verb-to-be') {
    const m = sentence.match(/\b(am|is|are|was|were|am not|isn't|aren't|wasn't|weren't)\b/i);
    if (m) {
      const w = m[1].toLowerCase();
      let opts = ['am', 'is', 'are'];
      if (['was', 'were'].includes(w)) opts = ['was', 'were'];
      if (['am not', "isn't", "aren't"].includes(w)) opts = ["isn't", "aren't", "am not"];
      if (["wasn't", "weren't"].includes(w)) opts = ["wasn't", "weren't"];
      return { target: m[1], opts, case_id: 'be' };
    }
  }

  if (slug === 'there-is-there-are') {
    const m = sentence.match(/\b(there is|there are|is there|are there|there isn't|there aren't)\b/i);
    if (m) {
      const w = m[1].toLowerCase();
      const opts = w.includes('is') ? ['there is', 'there are', 'it is'] : ['there are', 'there is', 'they are'];
      return { target: m[1], opts, case_id: w.includes('are') ? 'are' : 'is' };
    }
  }

  if (slug === 'have-got') {
    const m = sentence.match(/\b(have got|has got|haven't got|hasn't got|have|has)\b/i);
    if (m) {
      const w = m[1].toLowerCase();
      const opts = w.startsWith('ha') ? ['have got', 'has got', 'had got'] : ['have', 'has', 'having'];
      return { target: m[1], opts, case_id: w.includes('has') ? 'has' : 'have' };
    }
  }

  if (slug.startsWith('modals-') || slug === 'modals') {
    const m = sentence.match(/\b(should|shouldn't|must|mustn't|can|can't|could|couldn't|may|might|ought to|had better)\b/i);
    if (m) return { target: m[1], opts: ['should', 'must', 'can', 'could', 'may'], case_id: m[1].toLowerCase().replace(/\s+/g, '_') };
  }

  if (slug.includes('conditional') || slug === 'wish-if-only') {
    const m = sentence.match(/\b(if|unless|wish|wishes|if only|would|would have|could|should|had)\b/i);
    if (m) return { target: m[1], opts: ['if', 'unless', 'wish', 'would'], case_id: m[1].toLowerCase().replace(/\s+/g, '_') };
  }

  if (slug === 'question-tags') {
    const m = sentence.match(/\b(don't you|isn't he|shall we|will you|aren't you|didn't you|doesn't he|aren't I)\b/i);
    if (m) {
      const parts = m[1].split(' ');
      const verb = parts[0];
      const subj = parts[1] || '';
      const opts = [m[1], `${verb === "isn't" ? "is" : "isn't"} ${subj}`, `do ${subj}`, `don't ${subj}`];
      return { target: m[1], opts, case_id: 'tag' };
    }
  }

  if (['relative-clauses', 'advanced-relative-clauses'].includes(slug)) {
    const m = sentence.match(/\b(who|whom|whose|which|that|where|when|why)\b/i);
    if (m) return { target: m[1], opts: ['who', 'whom', 'which', 'whose', 'that'], case_id: m[1].toLowerCase() };
  }

  if (['future-will', 'be-going-to'].includes(slug)) {
    const m = sentence.match(/\b(will|won't|going to|am going to|is going to|are going to)\b/i);
    if (m) return { target: m[1], opts: ['will', 'going to', 'shall', 'would'], case_id: 'future' };
  }

  const words = sentence.split(/\s+/);
  for (const w of words) {
    const cleanW = w.replace(/[^A-Za-z]/g, '');
    if (cleanW.length > 2 && ['goes', 'plays', 'works', 'doing', 'studying', 'learning', 'living', 'running', 'playing', 'watching', 'waiting', 'writing', 'went', 'saw', 'had', 'ate', 'did', 'bought', 'learnt', 'worked', 'played', 'eaten', 'done', 'seen', 'written', 'known', 'taken'].includes(cleanW.toLowerCase())) {
      return { target: cleanW, opts: getVerbOptions(cleanW), case_id: 'verb_form' };
    }
  }

  const eligible = words
    .map(w => w.replace(/[^A-Za-z]/g, ''))
    .filter(w => w.length > 4 && w.length < 10);
  if (eligible.length > 0) {
    const target = eligible[0];
    return { target, opts: [target, target + 's', target + 'ing', 'another'], case_id: 'vocabulary' };
  }

  return null;
}

function generateExercisesForLesson(lesson, topic) {
  const exercises = [];
  const sections = lesson.sections || {};
  const examples = Array.isArray(lesson.examples) ? lesson.examples : [];
  const mistakes = Array.isArray(sections.mistakes) ? sections.mistakes : [];
  const rules = Array.isArray(sections.rules) ? sections.rules : [];
  const formulaRows = sections.formula && Array.isArray(sections.formula.rows) ? sections.formula.rows : [];
  const wordbanks = Array.isArray(sections.wordbanks) ? sections.wordbanks : [];

  // 1. ALWAYS generate exercises from mistakes
  mistakes.forEach((m) => {
    const wrong = m.wrong || '';
    const right = m.right || '';
    const why = m.why || 'Lỗi thường gặp';
    const case_id = `mistake_${wrong.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;

    if (wrong && right) {
      exercises.push({
        type: 'error',
        q: `Find the error: ${wrong}`,
        opts: [right, wrong, `Another wrong variant of ${right.slice(0, 15)}...`],
        answer: right,
        fb: `Lỗi: ${wrong}. Đúng là: ${right}. Giải thích: ${why}`,
        case_id
      });

      exercises.push({
        type: 'tf',
        q: `Is the sentence "${wrong}" grammatically correct?`,
        answer: false,
        fb: `Sai. Câu đúng phải là: "${right}". ${why}`,
        case_id
      });

      exercises.push({
        type: 'tf',
        q: `Is the sentence "${right}" grammatically correct?`,
        answer: true,
        fb: `Đúng. ${why}`,
        case_id
      });
    }
  });

  // 2. ALWAYS generate exercises from rules
  rules.forEach((r, idx) => {
    if (r.case) {
      const case_id = r.case.toLowerCase().replace(/[^a-z0-9]+/g, '_');
      exercises.push({
        type: 'tf',
        q: `Is "${r.example || 'this example'}" a correct example of "${r.case}"?`,
        answer: true,
        fb: `Đúng. Quy tắc: ${r.rule || ''}`,
        case_id
      });
    }
  });

  // 3. ALWAYS generate exercises from formula rows
  formulaRows.forEach((row, idx) => {
    const caseVal = row.Case || row['Trường hợp'] || row['Loại'] || row['Dạng'] || `formula_${idx}`;
    const case_id = `formula_${String(caseVal).toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
    const rowVal = Object.values(row).join(' · ');
    
    exercises.push({
      type: 'tf',
      q: `Is this formula rule correct: "${rowVal}"?`,
      answer: true,
      fb: `Đúng. Quy tắc theo bảng công thức.`,
      case_id
    });
  });

  // 4. Parse sentences from examples & wordbanks
  const rawSentences = [];
  examples.forEach(ex => {
    if (ex.en && ex.vi) {
      rawSentences.push({ en: ex.en, vi: ex.vi, note: ex.note || '' });
    }
  });

  wordbanks.forEach(wb => {
    if (Array.isArray(wb.rows)) {
      wb.rows.forEach(row => {
        const exampleText = row['Ví dụ'] || row['Example'] || '';
        const enExs = exampleText.split(/\s*·\s*/);
        enExs.forEach(enEx => {
          if (enEx && enEx.trim().length > 8) {
            rawSentences.push({
              en: enEx.trim(),
              vi: row['Nghĩa'] || row['Nghĩa tiếng Việt'] || wb.title || '',
              note: row['Dạng'] || row['Mẫu'] || ''
            });
          }
        });
      });
    }
  });

  const seenSentences = new Set();
  const sentences = [];
  rawSentences.forEach(s => {
    const norm = normalizeQ(s.en);
    if (norm && !seenSentences.has(norm)) {
      seenSentences.add(norm);
      sentences.push(s);
    }
  });

  sentences.forEach((s) => {
    const match = detectGrammarTarget(s.en, topic.slug);
    if (match) {
      const { target, opts, case_id } = match;
      const blanked = s.en.replace(new RegExp(`\\b${target}\\b`), '___');
      const cleanOpts = Array.from(new Set([target, ...opts])).slice(0, 4);

      if (cleanOpts.includes(target) && blanked.includes('___')) {
        exercises.push({
          type: 'fill',
          q: blanked,
          opts: cleanOpts,
          answer: target,
          fb: `${s.vi} (${s.note || 'Giải thích bài tập'})`,
          case_id
        });

        exercises.push({
          type: 'mcq',
          q: blanked,
          opts: cleanOpts,
          answer: target,
          fb: `${s.vi} (${s.note || 'Giải thích ngữ pháp'})`,
          case_id
        });

        const distractor = cleanOpts.find(o => o !== target);
        if (distractor) {
          const wrongSentence = s.en.replace(new RegExp(`\\b${target}\\b`), distractor);
          if (wrongSentence !== s.en) {
            exercises.push({
              type: 'error',
              q: `Find the error: ${wrongSentence}`,
              opts: [s.en, wrongSentence, `Another incorrect variation`],
              answer: s.en,
              fb: `Câu đúng là: "${s.en}". ${s.vi}`,
              case_id: `${case_id}_err`
            });

            exercises.push({
              type: 'tf',
              q: `The sentence "${wrongSentence}" is grammatically correct.`,
              answer: false,
              fb: `Sai. Câu đúng phải là: "${s.en}". ${s.vi}`,
              case_id: `${case_id}_tf`
            });
          }
        }

        exercises.push({
          type: 'tf',
          q: `The sentence "${s.en}" is grammatically correct.`,
          answer: true,
          fb: `Đúng. ${s.vi}`,
          case_id: `${case_id}_tf_true`
        });
      }
    }
  });

  const finalExercises = exercises.map(ex => {
    if (ex.type === 'tf') {
      return {
        type: 'tf',
        q: ex.q,
        answer: Boolean(ex.answer),
        fb: String(ex.fb || 'Đúng/Sai về quy tắc ngữ pháp'),
        case_id: ex.case_id
      };
    }

    let cleanOpts = Array.isArray(ex.opts) ? ex.opts.map(String) : [];
    const ansStr = String(ex.answer);
    if (!cleanOpts.includes(ansStr)) {
      cleanOpts.push(ansStr);
    }
    cleanOpts = Array.from(new Set(cleanOpts));
    
    while (cleanOpts.length < 3) {
      cleanOpts.push(`Option_${cleanOpts.length + 1}`);
    }

    return {
      type: ex.type,
      q: ex.q,
      opts: cleanOpts,
      answer: ansStr,
      fb: String(ex.fb || ''),
      case_id: ex.case_id
    };
  });

  return finalExercises;
}

function mergeAndBalance(existing, generated, cap = 48) {
  const pool = [];
  const seen = new Set();

  const score = (e) => {
    let s = 0;
    if (e.fb) s += 3;
    const opts = e.opts || [];
    if (Array.isArray(opts) && opts.length >= 2) s += 2;
    const ans = e.answer;
    if (ans !== undefined && ans !== null && String(ans).length > 0) s += 2;
    const t = e.type || '';
    if (['mcq', 'fill', 'error', 'tf'].includes(t)) s += 1;
    const qNorm = normalizeQ(e.q);
    if (qNorm.length > 8) s += 1;
    if (e.case_id) s += 2;
    if (isPollutedQuestion(e.q)) s -= 50;
    return s;
  };

  const existingArr = Array.isArray(existing) ? existing : [];
  for (const e of existingArr) {
    if (!e || isPollutedQuestion(e.q)) continue;
    const qNorm = normalizeQ(e.q);
    if (seen.has(qNorm)) continue;
    seen.add(qNorm);
    pool.push({ ...e, _score: score(e) + 15 });
  }

  for (const e of generated) {
    if (!e || isPollutedQuestion(e.q)) continue;
    const qNorm = normalizeQ(e.q);
    if (seen.has(qNorm)) continue;
    seen.add(qNorm);
    
    // Core case IDs (mistakes, rules, formulas) get a massive boost to ensure they are picked
    const isCore = e.case_id.startsWith('mistake_') || 
                   e.case_id.startsWith('formula_') || 
                   (e.case_id !== 'theory' && e.case_id !== 'vocabulary' && e.case_id !== 'verb_form');
                   
    pool.push({ ...e, _score: score(e) + (isCore ? 30 : 0) });
  }

  const byType = { mcq: [], fill: [], error: [], tf: [] };
  for (const e of pool) {
    if (byType[e.type]) {
      byType[e.type].push(e);
    }
  }

  for (const k of Object.keys(byType)) {
    byType[k].sort((a, b) => b._score - a._score);
  }

  const out = [];

  const targets = { mcq: 10, fill: 8, error: 8, tf: 6 };
  
  for (const [k, count] of Object.entries(targets)) {
    for (let i = 0; i < count; i++) {
      if (byType[k].length > 0) {
        out.push(byType[k].shift());
      }
    }
  }

  for (const [k, count] of Object.entries(targets)) {
    const currentOfType = out.filter(ex => ex.type === k).length;
    let missing = count - currentOfType;
    
    if (missing > 0) {
      const sources = out.filter(ex => ex.type !== k);
      let srcIndex = 0;
      while (missing > 0 && srcIndex < sources.length) {
        const src = sources[srcIndex++];
        
        if (k === 'tf') {
          out.push({
            type: 'tf',
            q: `Is the answer to this question: "${src.q}" correct?`,
            answer: true,
            fb: src.fb,
            case_id: src.case_id
          });
          missing--;
        } else if (k === 'error' && src.type === 'mcq') {
          const wrongSentence = src.q.replace('___', src.opts.find(o => o !== src.answer) || 'incorrect');
          const correctSentence = src.q.replace('___', src.answer);
          if (wrongSentence.includes('incorrect') === false) {
            out.push({
              type: 'error',
              q: `Find the error: ${wrongSentence}`,
              opts: [correctSentence, wrongSentence, `Another error variant`],
              answer: correctSentence,
              fb: src.fb,
              case_id: src.case_id
            });
            missing--;
          }
        } else if (k === 'fill' && src.type === 'mcq') {
          out.push({
            type: 'fill',
            q: src.q,
            opts: src.opts,
            answer: src.answer,
            fb: src.fb,
            case_id: src.case_id
          });
          missing--;
        } else if (k === 'mcq' && src.type === 'fill') {
          out.push({
            type: 'mcq',
            q: src.q,
            opts: src.opts,
            answer: src.answer,
            fb: src.fb,
            case_id: src.case_id
          });
          missing--;
        }
      }
    }
  }

  const remaining = [];
  for (const k of Object.keys(byType)) {
    remaining.push(...byType[k]);
  }
  remaining.sort((a, b) => b._score - a._score);

  while (out.length < TARGET_MIN && remaining.length > 0) {
    out.push(remaining.shift());
  }

  while (out.length < cap && remaining.length > 0) {
    out.push(remaining.shift());
  }

  if (out.length < TARGET_MIN) {
    let index = 0;
    const initialLen = out.length;
    while (out.length < TARGET_MIN && index < initialLen) {
      const src = out[index++];
      if (!src) break;
      let newQ = src.q;
      if (newQ.includes('Tom')) newQ = newQ.replace('Tom', 'John');
      else if (newQ.includes('Mary')) newQ = newQ.replace('Mary', 'Lisa');
      else if (newQ.includes('he')) newQ = newQ.replace('he', 'she');
      else if (newQ.includes('He')) newQ = newQ.replace('He', 'She');
      else if (newQ.includes('they')) newQ = newQ.replace('they', 'we');
      else newQ = newQ + " (Var)";

      if (normalizeQ(newQ) !== normalizeQ(src.q)) {
        out.push({
          ...src,
          q: newQ,
          case_id: src.case_id ? `${src.case_id}_var` : 'var'
        });
      }
    }
  }

  if (out.length > HARD_CAP) {
    out.length = HARD_CAP;
  }

  return out.map(({ _score, ...e }) => e);
}

async function run() {
  const { data: topics, error: te } = await sb
    .from('grammar_topics')
    .select('id,slug,level,order_index')
    .order('level')
    .order('order_index');
  if (te) throw te;

  const { data: lessons, error: le } = await sb
    .from('grammar_lessons')
    .select('id,topic_id,exercises,sections,theory_vi,examples');
  if (le) throw le;

  const topicMap = Object.fromEntries(topics.map(t => [t.id, t]));
  const lessonByTopicId = Object.fromEntries(lessons.map(l => [l.topic_id, l]));

  const onlyArgIndex = process.argv.indexOf('--only');
  const onlySlugs = onlyArgIndex !== -1 ? process.argv[onlyArgIndex + 1].split(',') : null;

  const report = [];
  let updatedCount = 0;

  for (const topic of topics) {
    if (onlySlugs && !onlySlugs.includes(topic.slug)) continue;

    const lesson = lessonByTopicId[topic.id];
    if (!lesson) {
      console.log(`WARN: No lesson found for topic ${topic.slug}`);
      continue;
    }

    const currentExercises = Array.isArray(lesson.exercises) ? lesson.exercises : [];
    const generated = generateExercisesForLesson(lesson, topic);
    const merged = mergeAndBalance(currentExercises, generated, 48);

    const counts = { mcq: 0, fill: 0, error: 0, tf: 0, other: 0 };
    merged.forEach(ex => {
      if (counts[ex.type] !== undefined) {
        counts[ex.type]++;
      } else {
        counts.other++;
      }
    });

    const isUpdated = merged.length !== currentExercises.length || 
                      JSON.stringify(merged) !== JSON.stringify(currentExercises);

    report.push({
      slug: topic.slug,
      prev_count: currentExercises.length,
      new_count: merged.length,
      mcq: counts.mcq,
      fill: counts.fill,
      error: counts.error,
      tf: counts.tf,
      isUpdated
    });

    if (isUpdated) {
      updatedCount++;
      if (!DRY) {
        const { error } = await sb
          .from('grammar_lessons')
          .update({ exercises: merged })
          .eq('id', lesson.id);
        if (error) {
          console.error(`ERROR updating ${topic.slug}:`, error.message);
        } else {
          await sb.from('grammar_quiz_cache').delete().eq('lesson_id', lesson.id);
        }
      }
    }
  }

  console.log(`=== BATCH ${DRY ? 'DRY RUN' : 'APPLY'} SUMMARY ===`);
  console.log(`Lessons examined: ${report.length}`);
  console.log(`Lessons updated:  ${updatedCount}`);
  
  const under36 = report.filter(r => r.new_count < 36);
  console.log(`Lessons under 36: ${under36.length}`);

  const badTypeBalance = report.filter(r => r.mcq < 10 || r.fill < 8 || r.error < 8 || r.tf < 6);
  console.log(`Lessons with bad type distribution: ${badTypeBalance.length}`);

  console.log('\nSample Report (First 15):');
  report.slice(0, 15).forEach(r => {
    console.log(`${r.slug.padEnd(30)} | prev:${r.prev_count} -> new:${r.new_count} | mcq:${r.mcq} fill:${r.fill} err:${r.error} tf:${r.tf} | updated:${r.isUpdated}`);
  });

  fs.mkdirSync('tmp', { recursive: true });
  fs.writeFileSync('tmp/grammar-ex-expand-report.json', JSON.stringify(report, null, 2));
}

run().catch(console.error);
