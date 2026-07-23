/**
 * Pass: fix TF wrong keys + learner-friendly Vietnamese feedback.
 * Run after AG mass-generate which often mismatches fb/answer.
 *
 *   node scripts/grammar-a0a2/fix-learner-feedback.mjs
 */
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

const FORCE_TRUE = [
  [/^Tom is happy\.?$/i, 'Đúng. Tom (số ít) + is + tính từ. Câu chuẩn.'],
  [/^She is a player\.?$/i, 'Đúng. She + is + a + nghề/danh từ. Câu chuẩn.'],
  [/^He works here\.?$/i, 'Đúng. He/She/It + động từ thêm -s (works). Câu hiện tại đơn chuẩn.'],
  [/^Tom was playing football\.?$/i, 'Đúng. Tom + was + V-ing. Quá khứ tiếp diễn đúng.'],
  [/^They were not watching TV\.?$/i, 'Đúng. They + were + not + V-ing. Phủ định đúng.'],
  [/^I love Tom\.?$/i, 'Đúng. I (người làm) + love + Tom (người được nhắc). Câu chuẩn.'],
  [/^Tom was happy\.?$/i, 'Đúng. Tom + was + tính từ.'],
];

function improveWrongTf(sent, oldFb) {
  const s = sent.trim();
  const map = [
    [/Me am a /i, 'I am a …', 'Me không làm chủ ngữ. Dùng I + am.'],
    [/Him is /i, 'He is …', 'Him là tân ngữ. Chủ ngữ dùng He.'],
    [/Her is /i, 'She is …', 'Her là tân ngữ. Chủ ngữ dùng She.'],
    [/doesn't goes/i, "doesn't go", "Sau doesn't dùng nguyên thể (go)."],
    [/did went/i, 'did go', 'Sau did dùng nguyên thể (go).'],
    [/between .+ and I/i, 'between … and me', 'Sau between dùng me, không I.'],
    [/looking forward to meet /i, 'looking forward to meeting', 'to + V-ing.'],
    [/interested on/i, 'interested in', 'interested + in.'],
    [/It was in \w+ where/i, 'It was in … that …', 'Câu chẻ nơi chốn: dùng that.'],
  ];
  for (const [re, right, why] of map) {
    if (re.test(s)) return `Sai. Cách đúng: ${right}. ${why}`;
  }
  const old = String(oldFb || '').trim();
  if (old && !/[àáạảãâăèéêìíòóôơùúưỳýđ]/i.test(old)) {
    return `Sai. ${old} — So với công thức trong bài.`;
  }
  if (/^Sai/.test(old)) return old;
  if (old) return `Sai. ${old}`;
  return 'Sai. Câu chưa đúng quy tắc bài.';
}

const env = loadEnv();
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const { data: all } = await sb
  .from('grammar_lessons')
  .select('id,exercises,topic:grammar_topics(slug,level)');

let changedLessons = 0;
let fixCount = 0;

for (const L of all || []) {
  let changed = false;
  const ex = (L.exercises || []).map((e) => {
    let item = { ...e };
    const q = String(item.q || '');
    const m = q.match(/"([^"]+)"\s+is correct/i);
    if (item.type === 'tf' && m) {
      const sent = m[1].trim();
      for (const [re, fbOk] of FORCE_TRUE) {
        if (re.test(sent) && item.answer === false) {
          item = { ...item, answer: true, fb: fbOk };
          changed = true;
          fixCount++;
          break;
        }
      }
      if (item.answer === false) {
        const newFb = improveWrongTf(sent, item.fb);
        if (newFb !== item.fb) {
          item = { ...item, fb: newFb };
          changed = true;
          fixCount++;
        }
      }
    }
    if (
      L.topic?.level === 'beginner' &&
      item.fb &&
      !/[àáạảãâăèéêìíòóôơùúưỳýđ]/i.test(item.fb)
    ) {
      item = {
        ...item,
        fb: `Gợi ý: ${item.fb}. Hãy đối chiếu chủ ngữ và dạng động từ trong bài.`,
      };
      changed = true;
      fixCount++;
    }
    if (/minh họa cách dùng và vị trí cấu trúc/i.test(String(item.fb || ''))) {
      item = {
        ...item,
        fb: String(item.fb)
          .replace(/\s*·\s*Ví dụ \d+:\s*minh họa cách dùng và vị trí cấu trúc trong câu\.?/gi, '')
          .trim(),
      };
      changed = true;
      fixCount++;
    }
    return item;
  });
  if (changed) {
    changedLessons++;
    await sb.from('grammar_lessons').update({ exercises: ex }).eq('id', L.id);
    await sb.from('grammar_quiz_cache').delete().eq('lesson_id', L.id);
  }
}

// Personal pronouns: super-simple VI block
const { data: topic } = await sb
  .from('grammar_topics')
  .select('id')
  .eq('slug', 'personal-pronouns')
  .single();
const { data: Lpp } = await sb
  .from('grammar_lessons')
  .select('id,exercises')
  .eq('topic_id', topic.id)
  .single();
const mapQ = [
  [
    /"I love Tom\." is correct/i,
    true,
    'Đúng.\n• I = tôi (người làm, đứng trước động từ)\n• love = yêu\n• Tom = tên người (đứng sau động từ)\nCâu này viết đúng.',
  ],
  [
    /"Me am a player\." is correct/i,
    false,
    "Sai.\n• Me không đứng đầu câu làm 'tôi'.\n• Phải dùng I + am.\nCâu đúng: I am a player.",
  ],
  [
    /"Between Everyone and I" is correct/i,
    false,
    'Sai.\n• Sau between (= giữa) không dùng I.\n• Phải dùng me.\nCâu đúng: Between everyone and me…',
  ],
  [
    /"Her is her sister\." is correct/i,
    false,
    'Sai.\n• Her không đứng đầu làm chủ ngữ.\n• Phải dùng She.\nCâu đúng: She is her sister.',
  ],
  [
    /"Him is my cousin\." is correct/i,
    false,
    'Sai.\n• Him không đứng đầu câu.\n• Phải dùng He.\nCâu đúng: He is my cousin.',
  ],
  [
    /"Them" can be the subject/i,
    false,
    'Sai.\n• Them = họ (khi đứng sau động từ).\n• Đứng đầu câu dùng They.\nVí dụ: They love music. / I love them.',
  ],
  [
    /After a preposition we use object pronouns/i,
    true,
    'Đúng.\nSau for / with / to / from / between… dùng: me, him, her, us, them.\nVí dụ: for me, with us, between you and me.',
  ],
  [
    /Object pronouns go before the verb as subjects/i,
    false,
    'Sai.\nme/him/her/us/them không đứng trước động từ để làm "ai làm".\nChúng đứng SAU động từ hoặc SAU giới từ.\nVí dụ: Help me. / Look at them.',
  ],
  [
    /"She" is an object pronoun/i,
    false,
    "Sai.\n• She = cô ấy (đứng đầu câu).\n• Sau động từ dùng her.\nVí dụ: She sees me. / I see her.",
  ],
  [
    /"I" and "me" are interchangeable/i,
    false,
    'Sai.\n• I = tôi (trước động từ): I work.\n• me = tôi (sau động từ): Help me.\nKhông đổi lung tung.',
  ],
];
const ex2 = (Lpp.exercises || []).map((e) => {
  const q = String(e.q || '');
  for (const [re, ans, fb] of mapQ) {
    if (re.test(q)) return { ...e, type: 'tf', answer: ans, fb };
  }
  return e;
});
await sb.from('grammar_lessons').update({ exercises: ex2 }).eq('id', Lpp.id);
await sb.from('grammar_quiz_cache').delete().eq('lesson_id', Lpp.id);

console.log(JSON.stringify({ changedLessons, fixCount, personalPronouns: 'rewritten' }, null, 2));
fs.mkdirSync('tmp', { recursive: true });
fs.writeFileSync(
  'tmp/learner-fb-fix-summary.json',
  JSON.stringify({ changedLessons, fixCount, at: new Date().toISOString() }, null, 2),
);
