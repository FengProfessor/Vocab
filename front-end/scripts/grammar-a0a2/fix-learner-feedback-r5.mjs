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

const VI_REGEX = /[àáạảãâăèéêìíòóôơùúưỳýđ]/i;

export const FORCE_TRUE = [
  [/^Tom is happy\.?$/i, 'Đúng. Tom (chủ ngữ số ít) đi với động từ to be "is" và tính từ happy.'],
  [/^She is a player\.?$/i, 'Đúng. She (chủ ngữ số ít) đi với động từ to be "is" và danh từ chỉ người "a player".'],
  [/^He works here\.?$/i, 'Đúng. Chủ ngữ He (số ít) ở hiện tại đơn thì động từ work phải thêm -s thành works.'],
  [/^Tom was playing football\.?$/i, 'Đúng. Tom (chủ ngữ số ít) đi với "was" + V-ing ở thì quá khứ tiếp diễn.'],
  [/^They were not watching TV\.?$/i, 'Đúng. They (chủ ngữ số nhiều) đi với "were not" + V-ing ở dạng phủ định.'],
  [/^I love Tom\.?$/i, 'Đúng. I (tôi - đứng làm chủ ngữ) đứng trước động từ love, Tom (tân ngữ) đứng sau động từ.'],
  [/^Tom was happy\.?$/i, 'Đúng. Tom (chủ ngữ số ít quá khứ) đi với to be "was" và tính từ happy.'],
];

function cleanBoilerplate(s) {
  let res = String(s || '').trim();
  res = res.replace(/^Gợi ý:\s*/gi, '');
  res = res.replace(/\.?\s*Hãy đối chiếu chủ ngữ.*$/gi, '');
  res = res.replace(/\s*·\s*Ví dụ \d+:.*$/gi, '');
  res = res.replace(/minh họa cách dùng.*$/gi, '');
  res = res.replace(/đây là dạng đúng theo quy tắc bài học\.?/gi, '');
  res = res.replace(/\s*·\s*/g, ' - ');
  return res.trim();
}

function getContextualExplanation(q, ansStr, topicSlug) {
  const qLower = q.toLowerCase();
  const aLower = ansStr.toLowerCase();

  // Topic specific logic
  if (topicSlug === 'personal-pronouns') {
    if (aLower === 'me') return 'đây là tân ngữ "me" (tôi) đứng sau động từ hoặc giới từ';
    if (aLower === 'us') return 'đây là tân ngữ "us" (chúng tôi) đứng sau giới từ';
    if (aLower === 'him') return 'đây là tân ngữ "him" (anh ấy) đứng sau động từ/giới từ';
    if (aLower === 'her') return 'đây là tân ngữ "her" (cô ấy) đứng sau động từ/giới từ';
    if (aLower === 'them') return 'đây là tân ngữ "them" (họ) đứng sau động từ/giới từ';
    if (aLower === 'it') return 'dùng "It" đứng đầu câu làm chủ ngữ giả chỉ thời tiết hoặc sự vật số ít';
    if (aLower === 'i') return 'dùng chủ ngữ "I" (tôi) đứng trước động từ';
    if (aLower === 'he') return 'dùng chủ ngữ "He" (anh ấy) đứng trước động từ';
    if (aLower === 'she') return 'dùng chủ ngữ "She" (cô ấy) đứng trước động từ';
    if (aLower === 'they') return 'dùng chủ ngữ "They" (họ) đứng trước động từ';
  }

  if (topicSlug === 'verb-to-be') {
    if (aLower === 'is') return 'chủ ngữ số ít (He/She/It/tên riêng số ít) đi với động từ to be "is"';
    if (aLower === 'are') return 'chủ ngữ số nhiều (You/We/They/danh từ số nhiều) đi với động từ to be "are"';
    if (aLower === 'am') return 'chủ ngữ "I" luôn đi với động từ to be "am" ở hiện tại';
    if (aLower === 'isn\'t') return 'câu phủ định số ít của to be là "isn\'t"';
    if (aLower === 'aren\'t') return 'câu phủ định số nhiều của to be là "aren\'t"';
    if (aLower === 'i am') return 'câu trả lời ngắn khẳng định cho Are you...? là "Yes, I am"';
  }

  if (topicSlug === 'countable-uncountable') {
    if (aLower === 'some') return 'danh từ không đếm được hoặc danh từ số nhiều dùng "some" trong câu khẳng định';
    if (aLower === 'any') return 'dùng "any" trong câu phủ định hoặc câu hỏi';
    if (aLower === 'a lot of') return 'cụm "a lot of" dùng được với cả danh từ đếm được và không đếm được';
    if (aLower === 'many') return 'dùng "many" với danh từ đếm được số nhiều';
    if (aLower === 'much') return 'dùng "much" với danh từ không đếm được';
  }

  if (topicSlug === 'articles') {
    if (aLower === 'a') return 'dùng "a" trước danh từ số ít đếm được bắt đầu bằng phụ âm';
    if (aLower === 'an') return 'dùng "an" trước danh từ số ít đếm được bắt đầu bằng nguyên âm (a, e, i, o, u) hoặc âm câm';
    if (aLower.includes('the')) return 'dùng "the" khi nói về vật xác định hoặc duy nhất (như Sun, Moon, Earth)';
  }

  if (topicSlug === 'present-simple') {
    if (aLower.endsWith('es')) return 'động từ kết thúc bằng ch, sh, s, x, z, o phải thêm -es khi đi với chủ ngữ số ít';
    if (aLower.endsWith('s')) return 'với chủ ngữ số ít (He/She/It), động từ thì hiện tại đơn phải thêm -s';
    if (aLower === 'don\'t') return 'chủ ngữ số nhiều/I/You/We/They đi với "don\'t" trong câu phủ định';
    if (aLower === 'doesn\'t') return 'chủ ngữ số ít (He/She/It) đi với "doesn\'t" trong câu phủ định';
  }

  if (topicSlug === 'past-simple') {
    if (aLower === 'bought') return 'bought là dạng quá khứ bất quy tắc của động từ buy';
    if (aLower === 'left') return 'left là dạng quá khứ bất quy tắc của động từ leave';
    if (aLower === 'went') return 'went là dạng quá khứ bất quy tắc của động từ go';
    if (aLower.includes('didn\'t')) return 'trong câu phủ định quá khứ đơn, dùng didn\'t + động từ nguyên thể';
    if (aLower.endsWith('ed')) return 'thì quá khứ đơn của động từ có quy tắc được tạo bằng cách thêm -ed';
  }

  if (topicSlug === 'comparatives-superlatives') {
    if (aLower.endsWith('er')) return 'tính từ ngắn thêm đuôi -er trong câu so sánh hơn';
    if (aLower.startsWith('more')) return 'tính từ dài đi với "more" trong câu so sánh hơn';
    if (aLower.startsWith('the most')) return 'tính từ dài đi với "the most" trong câu so sánh nhất';
    if (aLower.endsWith('est')) return 'tính từ ngắn đi với đuôi -est trong câu so sánh nhất';
  }

  if (topicSlug === 'there-is-there-are') {
    if (aLower === 'there is') return 'dùng "There is" trước danh từ số ít hoặc không đếm được';
    if (aLower === 'there are') return 'dùng "There are" trước danh từ số nhiều';
  }

  if (topicSlug === 'wh-questions') {
    if (aLower === 'what') return 'dùng "What" để hỏi về cái gì / điều gì';
    if (aLower === 'where') return 'dùng "Where" để hỏi về nơi chốn / ở đâu';
    if (aLower === 'when') return 'dùng "When" để hỏi về thời gian / khi nào';
    if (aLower === 'why') return 'dùng "Why" để hỏi về lý do / tại sao';
    if (aLower === 'who') return 'dùng "Who" để hỏi về ai / người nào';
  }

  // Fallbacks by answer/pattern
  if (aLower === 'is') return 'chủ ngữ số ít đi với động từ "is"';
  if (aLower === 'are') return 'chủ ngữ số nhiều đi với động từ "are"';
  if (aLower === 'was') return 'chủ ngữ số ít quá khứ đi với động từ "was"';
  if (aLower === 'were') return 'chủ ngữ số nhiều quá khứ đi với động từ "were"';

  return 'đáp án này diễn đạt chuẩn xác cấu trúc ngữ pháp trong bài';
}

function sanitizeFb(fb) {
  let res = String(fb || '').trim();
  res = res.replace(/\s*vì\.?$/i, ' vì đây là dạng đúng chuẩn.');
  if (res.endsWith(' vì')) res += ' đáp án này đúng ngữ pháp.';
  return res;
}

function processExercise(e, topicSlug, topicLevel) {
  let item = { ...e };
  let q = String(item.q || '').trim();
  let type = String(item.type || 'mcq').toLowerCase();
  let ans = item.answer !== undefined ? item.answer : item.correct_answer;
  let ansStr = Array.isArray(ans) ? ans.join(' / ') : String(ans !== undefined ? ans : '');
  let fb = cleanBoilerplate(item.fb);

  // Check TF "is correct"
  const m = q.match(/"([^"]+)"\s+is correct/i);
  if (type === 'tf' && m) {
    const sent = m[1].trim();
    for (const [re, fbOk] of FORCE_TRUE) {
      if (re.test(sent)) {
        return { ...item, answer: true, fb: sanitizeFb(fbOk) };
      }
    }
  }

  // Handle TF exercises
  if (type === 'tf') {
    if (m) {
      const sent = m[1].trim();
      if (ans === true) {
        if (fb.startsWith('Đúng.') && VI_REGEX.test(fb) && fb.length >= 25 && !/gợi ý|bài học/i.test(fb)) {
          return { ...item, answer: true, fb: sanitizeFb(fb) };
        }
        return {
          ...item,
          answer: true,
          fb: `Đúng. Câu "${sent}" sử dụng hoàn toàn chuẩn ngữ pháp.`
        };
      } else {
        // ans === false
        if (/Me am/i.test(sent)) {
          return {
            ...item,
            answer: false,
            fb: 'Sai. "Me" không làm chủ ngữ đứng đầu câu. Câu đúng: I am a student (hoặc player).'
          };
        }
        if (/Him is/i.test(sent)) {
          return {
            ...item,
            answer: false,
            fb: 'Sai. "Him" là tân ngữ, không làm chủ ngữ. Câu đúng: He is my cousin.'
          };
        }
        if (/Her is/i.test(sent)) {
          return {
            ...item,
            answer: false,
            fb: 'Sai. "Her" không làm chủ ngữ đứng đầu câu. Câu đúng: She is her sister.'
          };
        }
        if (/between .+ and I/i.test(sent)) {
          return {
            ...item,
            answer: false,
            fb: 'Sai. Sau giới từ "between" phải dùng tân ngữ me, không dùng I. Câu đúng: between you and me.'
          };
        }
        if (/doesn't goes/i.test(sent)) {
          return {
            ...item,
            answer: false,
            fb: 'Sai. Sau "doesn\'t" phải dùng động từ nguyên thể go. Câu đúng: doesn\'t go.'
          };
        }
        if (/did went/i.test(sent)) {
          return {
            ...item,
            answer: false,
            fb: 'Sai. Sau "did" phải dùng động từ nguyên thể go. Câu đúng: did go.'
          };
        }
        if (/looking forward to meet/i.test(sent)) {
          return {
            ...item,
            answer: false,
            fb: 'Sai. Sau cụm "look forward to" phải dùng V-ing (meeting). Câu đúng: looking forward to meeting.'
          };
        }
        if (/interested on/i.test(sent)) {
          return {
            ...item,
            answer: false,
            fb: 'Sai. Dùng giới từ "in" sau interested. Câu đúng: interested in.'
          };
        }
        if (fb.startsWith('Sai.') && VI_REGEX.test(fb) && fb.length >= 25 && !/gợi ý|bài học/i.test(fb)) {
          return { ...item, answer: false, fb: sanitizeFb(fb) };
        }
        return {
          ...item,
          answer: false,
          fb: `Sai. Câu "${sent}" mắc lỗi dùng sai từ. Cần sửa lại cho khớp với quy tắc bài.`
        };
      }
    } else {
      // General TF without "is correct"
      if (ans === true) {
        if (fb.startsWith('Đúng.') && VI_REGEX.test(fb) && fb.length >= 25 && !/gợi ý|bài học/i.test(fb)) {
          return { ...item, answer: true, fb: sanitizeFb(fb) };
        }
        return {
          ...item,
          answer: true,
          fb: `Đúng. Nhận định này hoàn toàn chính xác theo kiến thức bài học.`
        };
      } else {
        if (fb.startsWith('Sai.') && VI_REGEX.test(fb) && fb.length >= 25 && !/gợi ý|bài học/i.test(fb)) {
          return { ...item, answer: false, fb: sanitizeFb(fb) };
        }
        return {
          ...item,
          answer: false,
          fb: `Sai. Nhận định này chưa đúng với quy tắc ngữ pháp trong bài.`
        };
      }
    }
  }

  // Handle ERROR exercises
  if (type === 'error') {
    if (fb.startsWith('Sai ở chỗ') && VI_REGEX.test(fb) && fb.length >= 25 && !/gợi ý|bài học/i.test(fb)) {
      return { ...item, fb: sanitizeFb(fb) };
    }
    return {
      ...item,
      fb: `Sai ở chỗ lỗi từ trong câu. Sửa thành: "${ansStr}" để đúng cấu trúc chuẩn.`
    };
  }

  // Handle MCQ & FILL exercises
  if (fb && VI_REGEX.test(fb) && fb.length >= 25 && !/gợi ý|bài học|đây là dạng đúng/i.test(fb)) {
    return { ...item, fb: sanitizeFb(fb) };
  }

  // Build high quality contextual reason in Vietnamese
  const viReason = getContextualExplanation(q, ansStr, topicSlug);
  return {
    ...item,
    fb: sanitizeFb(`Đúng là "${ansStr}" vì ${viReason}.`)
  };
}

async function main() {
  const { data: lessons, error } = await sb
    .from('grammar_lessons')
    .select('id,exercises,topic:grammar_topics(slug,level)');
  if (error) throw error;

  let totalUpdatedEx = 0;
  let updatedLessons = 0;

  for (const L of lessons || []) {
    const slug = L.topic?.slug || '';
    const level = L.topic?.level || 'beginner';
    const exercises = Array.isArray(L.exercises) ? L.exercises : [];
    let changed = false;

    const newEx = exercises.map((e) => {
      const updated = processExercise(e, slug, level);
      if (updated.fb !== e.fb || updated.answer !== e.answer) {
        changed = true;
        totalUpdatedEx++;
      }
      return updated;
    });

    if (changed) {
      updatedLessons++;
      await sb.from('grammar_lessons').update({ exercises: newEx }).eq('id', L.id);
      await sb.from('grammar_quiz_cache').delete().eq('lesson_id', L.id);
    }
  }

  console.log(`Updated ${updatedLessons} lessons, ${totalUpdatedEx} exercises.`);
}

main().catch(console.error);
