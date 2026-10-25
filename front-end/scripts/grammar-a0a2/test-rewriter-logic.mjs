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

export function cleanBoilerplate(fb) {
  let s = String(fb || '').trim();
  s = s.replace(/Gợi ý:\s*/gi, '');
  s = s.replace(/\.?\s*Hãy đối chiếu chủ ngữ.*$/gi, '');
  s = s.replace(/\s*·\s*Ví dụ \d+:.*$/gi, '');
  s = s.replace(/minh họa cách dùng.*$/gi, '');
  return s.trim();
}

export const FORCE_TRUE_PATTERNS = [
  [/^Tom is happy\.?$/i, 'Đúng. Tom là chủ ngữ số ít nên dùng to be "is" đi với tính từ happy.'],
  [/^She is a player\.?$/i, 'Đúng. She là chủ ngữ số ít đi với động từ to be "is" và danh từ "a player".'],
  [/^He works here\.?$/i, 'Đúng. Chủ ngữ He (số ít) ở thì hiện tại đơn thì động từ work phải thêm -s.'],
  [/^Tom was playing football\.?$/i, 'Đúng. Tom là chủ ngữ số ít đi với "was" + V-ing ở thì quá khứ tiếp diễn.'],
  [/^They were not watching TV\.?$/i, 'Đúng. They là chủ ngữ số nhiều đi với "were not" + V-ing ở dạng phủ định.'],
  [/^I love Tom\.?$/i, 'Đúng. I (tôi - chủ ngữ) đứng trước động từ love, Tom (tân ngữ) đứng sau động từ.'],
  [/^Tom was happy\.?$/i, 'Đúng. Tom là chủ ngữ số ít quá khứ đi với to be "was" và tính từ happy.'],
];

export function rewriteFeedback(exercise, topicSlug, topicLevel) {
  let { type, q, answer, fb, opts } = exercise;
  q = String(q || '').trim();
  fb = cleanBoilerplate(fb);
  const typeNorm = String(type || 'mcq').toLowerCase();

  // 1. Check TF "is correct" questions & FORCE_TRUE
  const tfMatch = q.match(/"([^"]+)"\s+is correct/i);
  if (typeNorm === 'tf' && tfMatch) {
    const sent = tfMatch[1].trim();
    for (const [re, fixedFb] of FORCE_TRUE_PATTERNS) {
      if (re.test(sent)) {
        return { answer: true, fb: fixedFb };
      }
    }
  }

  // 2. Standard TF feedback
  if (typeNorm === 'tf') {
    if (answer === true) {
      if (fb.startsWith('Đúng.') && fb.length >= 25 && !/gợi ý/i.test(fb)) {
        return { answer, fb };
      }
      if (tfMatch) {
        const sent = tfMatch[1];
        return { answer: true, fb: `Đúng. Câu "${sent}" sử dụng đúng cấu trúc ngữ pháp.` };
      }
      return { answer: true, fb: `Đúng. Câu này dùng đúng quy tắc ngữ pháp trong bài.` };
    } else {
      // answer === false
      if (tfMatch) {
        const sent = tfMatch[1];
        if (/Me am/i.test(sent)) {
          return { answer: false, fb: 'Sai. "Me" không làm chủ ngữ đứng đầu câu. Câu đúng: I am a student (hoặc player).' };
        }
        if (/Him is/i.test(sent)) {
          return { answer: false, fb: 'Sai. "Him" là tân ngữ, không làm chủ ngữ. Câu đúng: He is my cousin.' };
        }
        if (/Her is/i.test(sent)) {
          return { answer: false, fb: 'Sai. "Her" không làm chủ ngữ đứng đầu câu. Câu đúng: She is her sister.' };
        }
        if (/between .+ and I/i.test(sent)) {
          return { answer: false, fb: 'Sai. Sau giới từ "between" phải dùng tân ngữ me, không dùng I. Câu đúng: between you and me.' };
        }
        if (/doesn't goes/i.test(sent)) {
          return { answer: false, fb: 'Sai. Sau "doesn\'t" phải dùng động từ nguyên thể go. Câu đúng: doesn\'t go.' };
        }
        if (/did went/i.test(sent)) {
          return { answer: false, fb: 'Sai. Sau "did" phải dùng động từ nguyên thể go. Câu đúng: did go.' };
        }
        if (/looking forward to meet/i.test(sent)) {
          return { answer: false, fb: 'Sai. Sau cụm "look forward to" phải dùng V-ing (meeting). Câu đúng: looking forward to meeting.' };
        }
        if (/interested on/i.test(sent)) {
          return { answer: false, fb: 'Sai. Dùng giới từ "in" sau interested. Câu đúng: interested in.' };
        }
        return { answer: false, fb: `Sai. Câu "${sent}" dùng sai cấu trúc ngữ pháp.` };
      }
      if (fb.startsWith('Sai.') && fb.length >= 25) {
        return { answer: false, fb };
      }
      return { answer: false, fb: `Sai. Dạng đúng phải tuân theo quy tắc ngữ pháp của bài học.` };
    }
  }

  // 3. ERROR questions
  if (typeNorm === 'error') {
    const errMatch = q.match(/(?:find the error|sửa)\s*:\s*(.*)/i);
    const errText = errMatch ? errMatch[1] : q;
    if (fb.startsWith('Sai ở chỗ') && fb.length >= 25) {
      return { answer, fb };
    }
    return {
      answer,
      fb: `Sai ở câu này. Sửa thành: "${answer}". Vì cần dùng đúng dạng từ và cấu trúc ngữ pháp.`
    };
  }

  // 4. MCQ / FILL questions
  if (fb && /[àáạảãâăèéêìíòóôơùúưỳýđ]/i.test(fb) && fb.length >= 20 && !/gợi ý/i.test(fb)) {
    return { answer, fb };
  }

  // Translate / refine short EN or missing-VI fb into proper VI
  const ansStr = String(answer || '');
  return {
    answer,
    fb: `Đúng là "${ansStr}" vì đáp án này phù hợp nhất với cấu trúc ngữ pháp của bài.`
  };
}

async function test() {
  const env = loadEnv();
  const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  const { data: lessons } = await sb.from('grammar_lessons').select('exercises,topic:grammar_topics(slug,level)').limit(3);
  for (const l of lessons) {
    console.log('=== TEST TOPIC:', l.topic.slug);
    for (const e of l.exercises.slice(0, 3)) {
      const res = rewriteFeedback(e, l.topic.slug, l.topic.level);
      console.log(`Q: ${e.q}`);
      console.log(`OLD FB: ${e.fb}`);
      console.log(`NEW FB: ${res.fb}\n---`);
    }
  }
}
test().catch(console.error);
