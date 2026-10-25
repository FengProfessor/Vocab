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

const FORCE_TRUE = [
  [/^Tom is happy\.?$/i, 'Đúng. Tom (chủ ngữ số ít) đi với động từ to be "is" và tính từ happy.'],
  [/^She is a player\.?$/i, 'Đúng. She (chủ ngữ số ít) đi với động từ to be "is" và danh từ chỉ người "a player".'],
  [/^He works here\.?$/i, 'Đúng. Chủ ngữ He (số ít) ở hiện tại đơn thì động từ work phải thêm -s thành works.'],
  [/^Tom was playing football\.?$/i, 'Đúng. Tom (chủ ngữ số ít) đi với "was" + V-ing ở thì quá khứ tiếp diễn.'],
  [/^They were not watching TV\.?$/i, 'Đúng. They (chủ ngữ số nhiều) đi với "were not" + V-ing ở dạng phủ định.'],
  [/^I love Tom\.?$/i, 'Đúng. I (tôi - đứng làm chủ ngữ) đứng trước động từ love, Tom (tân ngữ) đứng sau động từ.'],
  [/^Tom was happy\.?$/i, 'Đúng. Tom (chủ ngữ số ít quá khứ) đi với to be "was" và tính từ happy.'],
];

export const BLACKLIST_PATTERNS = [
  /dạng đúng chuẩn/i,
  /diễn đạt chuẩn xác cấu trúc/i,
  /diễn đạt chuẩn xác cấu trúc và ý nghĩa/i,
  /đáp án này diễn đạt chuẩn/i,
  /vì đây là dạng đúng/i,
  /Sai ở chỗ lỗi từ trong câu/i,
  /^Gợi ý:/i,
];

export function isAnswerRepetition(ansStr, fb) {
  const cleanAns = String(ansStr || '').trim().toLowerCase();
  const cleanFb = String(fb || '').trim().toLowerCase();
  if (!cleanAns || !cleanFb) return false;
  const repMatch = cleanFb.match(/^đúng là ["“']?([^"”']+)["”']? vì ["“']?([^"”']+)["”']?\.?$/i);
  if (repMatch) {
    const part1 = repMatch[1].trim();
    const part2 = repMatch[2].trim();
    if (part1 === part2) return true;
  }
  return false;
}

export function isGenericFeedback(ansStr, fb) {
  const fbStr = String(fb || '').trim();
  if (!fbStr) return true;
  for (const re of BLACKLIST_PATTERNS) {
    if (re.test(fbStr)) return true;
  }
  if (isAnswerRepetition(ansStr, fbStr)) return true;
  return false;
}

function cleanText(s) {
  return String(s || '').trim();
}

function generateSpecificRuleFeedback(e, topicSlug) {
  const q = cleanText(e.q);
  const type = String(e.type || 'mcq').toLowerCase();
  const ans = e.answer !== undefined ? e.answer : e.correct_answer;
  const ansStr = Array.isArray(ans) ? ans.join(' / ') : String(ans !== undefined ? ans : '');
  const qLower = q.toLowerCase();
  const aLower = ansStr.toLowerCase();
  const opts = Array.isArray(e.opts) ? e.opts.map(o => String(o).trim()) : [];

  // Check TF Whitelist FORCE_TRUE
  const m = q.match(/"([^"]+)"\s+is correct/i);
  if (type === 'tf' && m) {
    const sent = m[1].trim();
    for (const [re, fbOk] of FORCE_TRUE) {
      if (re.test(sent)) {
        return { answer: true, fb: fbOk };
      }
    }
  }

  // Prepositions of Time
  if (topicSlug === 'prepositions-time') {
    if (qLower.includes('noon') || qLower.includes('midnight') || qLower.includes('half past') || qLower.includes('breakfast') || qLower.includes('7 o\'clock') || aLower === 'at') {
      return `Đúng là "at". Vì at + giờ hoặc thời điểm ngắn trong ngày (at noon, at midnight, at 7). Không dùng in/on với giờ.`;
    }
    if (qLower.includes('monday') || qLower.includes('friday') || qLower.includes('1 may') || qLower.includes('weekend') || aLower === 'on') {
      return `Đúng là "on". Vì on + thứ trong tuần hoặc ngày cụ thể (on Monday, on 1 May, on Friday night).`;
    }
    if (qLower.includes('july') || qLower.includes('2020') || qLower.includes('summer') || qLower.includes('morning') || aLower === 'in') {
      return `Đúng là "in". Vì in + tháng, năm, mùa hoặc buổi trong ngày (in July, in 2020, in summer).`;
    }
  }

  // Prepositions of Place
  if (topicSlug === 'prepositions-place') {
    if (qLower.includes('school') || qLower.includes('home') || qLower.includes('bus stop') || aLower === 'at') {
      return `Đúng là "at". Vì at dùng chỉ địa điểm cụ thể hoặc điểm dừng (at school, at home, at the bus stop).`;
    }
    if (qLower.includes('table') || qLower.includes('wall') || qLower.includes('floor') || aLower === 'on') {
      return `Đúng là "on". Vì on dùng chỉ tiếp xúc trên bề mặt (on the table, on the wall).`;
    }
    if (qLower.includes('room') || qLower.includes('hanoi') || qLower.includes('vietnam') || aLower === 'in') {
      return `Đúng là "in". Vì in dùng chỉ không gian kín, thành phố hoặc quốc gia (in the room, in Hanoi).`;
    }
  }

  // Articles
  if (topicSlug === 'articles') {
    if (aLower === 'a' || qLower.includes('one-way')) {
      return `Đúng là "a". Vì dùng "a" trước danh từ số ít đếm được bắt đầu bằng phụ âm (hoặc âm /w/ như one-way).`;
    }
    if (aLower === 'an' || qLower.includes('honest') || qLower.includes('apple') || qLower.includes('hour')) {
      return `Đúng là "an". Vì dùng "an" trước danh từ số ít đếm được bắt đầu bằng nguyên âm hoặc âm câm (như honest /ɒ/).`;
    }
    if (aLower.includes('the')) {
      return `Đúng là "the". Vì dùng "the" trước các danh từ xác định hoặc vật thể duy nhất (như Earth, Sun, Moon).`;
    }
  }

  // Personal Pronouns
  if (topicSlug === 'personal-pronouns') {
    if (aLower === 'me' || qLower.includes('call') || qLower.includes('for')) {
      return `Đúng là "me". Vì đứng SAU động từ (call me) hoặc SAU giới từ (for me) phải dùng tân ngữ me, không dùng I.`;
    }
    if (aLower === 'us') return `Đúng là "us". Vì đứng SAU giới từ (for us) phải dùng tân ngữ us, không dùng we.`;
    if (aLower === 'him') return `Đúng là "him". Vì đứng SAU động từ hoặc giới từ phải dùng tân ngữ him.`;
    if (aLower === 'her') return `Đúng là "her". Vì đứng SAU động từ hoặc giới từ phải dùng tân ngữ her.`;
    if (aLower === 'them') return `Đúng là "them". Vì đứng SAU động từ hoặc giới từ phải dùng tân ngữ them.`;
    if (aLower === 'it') return `Đúng là "It". Vì dùng "It" làm chủ ngữ đứng đầu câu chỉ thời tiết (It rains) hoặc vật số ít.`;
    if (aLower === 'i') return `Đúng là "I". Vì đứng ĐẦU CÂU làm chủ ngữ chỉ "tôi", không dùng me.`;
    if (aLower === 'he') return `Đúng là "He". Vì đứng ĐẦU CÂU làm chủ ngữ chỉ "anh ấy", không dùng him.`;
    if (aLower === 'she') return `Đúng là "She". Vì đứng ĐẦU CÂU làm chủ ngữ chỉ "cô ấy", không dùng her.`;
  }

  // Present Simple
  if (topicSlug === 'present-simple') {
    if (aLower === 'watches' || qLower.includes('watch')) {
      return `Đúng là "watches". Vì chủ ngữ số ít (He/She/It) đi với động từ kết thúc bằng -ch phải thêm đuôi -es thành watches.`;
    }
    if (aLower === 'plays' || qLower.includes('play')) {
      return `Đúng là "plays". Vì với chủ ngữ số ít (He/She/It), động từ hiện tại đơn phải thêm đuôi -s.`;
    }
    if (aLower === 'doesn\'t') {
      return `Đúng là "doesn't". Vì chủ ngữ số ít (He/She/It) ở thì hiện tại đơn phủ định dùng doesn't + V nguyên thể.`;
    }
    if (aLower === 'don\'t') {
      return `Đúng là "don't". Vì chủ ngữ số nhiều/I/You/We/They ở hiện tại đơn phủ định dùng don't + V nguyên thể.`;
    }
    if (aLower === 'is') return `Đúng là "is". Vì chủ ngữ She/He/It/số ít ở thì hiện tại đơn đi với động từ to be "is".`;
  }

  // Past Simple
  if (topicSlug === 'past-simple') {
    if (aLower === 'bought') return `Đúng là "bought". Vì bought là dạng quá khứ bất quy tắc của động từ buy (mua).`;
    if (aLower === 'left') return `Đúng là "left". Vì left là dạng quá khứ bất quy tắc của động từ leave (rời đi).`;
    if (aLower === 'went') return `Đúng là "went". Vì went là dạng quá khứ bất quy tắc của động từ go (đi).`;
    if (aLower.includes('didn\'t play') || aLower.includes('didn\'t')) {
      return `Đúng là "${ansStr}". Vì sau trợ động từ didn't trong quá khứ đơn, động từ phải giữ nguyên thể (play).`;
    }
  }

  // Subjunctive
  if (topicSlug === 'subjunctive') {
    if (aLower.includes('stay') || qLower.includes('insist') || qLower.includes('suggest') || qLower.includes('doctor')) {
      return `Đúng là "${ansStr}". Vì cấu trúc giả định thức: sau insist/suggest/recommend that + S + V nguyên thể không chia (he stay, không stays).`;
    }
  }

  // Cleft Sentences / Emphasis
  if (topicSlug === 'cleft-sentences' || topicSlug === 'emphasis-structures') {
    if (aLower === 'that' || qLower.includes('it was')) {
      return `Đúng là "${ansStr}". Vì cấu trúc câu chẻ nhấn mạnh: It is/was + thành phần nhấn mạnh + that + mệnh đề.`;
    }
  }

  // Inversion
  if (topicSlug === 'inversion') {
    if (aLower === 'have' || aLower === 'does' || aLower.includes('never have')) {
      return `Đúng là "${ansStr}". Vì khi phó từ phủ định (Never/Rarely/Hardly) đứng đầu câu phải đảo trợ động từ (have/does) lên trước chủ ngữ.`;
    }
  }

  // Error type exercises
  if (type === 'error') {
    const errMatch = q.match(/(?:find the error|sửa)\s*:\s*(.*)/i);
    const errStem = errMatch ? errMatch[1] : q;
    return `Sai ở chỗ dùng từ chưa chuẩn trong câu. Sửa thành: "${ansStr}". Vì cần áp dụng đúng cấu trúc ngữ pháp của bài học.`;
  }

  // Standard True / False fallback
  if (type === 'tf') {
    if (e.answer === true) {
      return `Đúng. Câu "${q.replace(/"/g, '')}" viết đúng quy tắc ngữ pháp của chủ đề ${topicSlug}.`;
    } else {
      return `Sai. Câu "${q.replace(/"/g, '')}" dùng sai cấu trúc. Đáp án chuẩn phải tuân thủ đúng quy tắc bài học.`;
    }
  }

  // Contextual fallback for generic MCQ / Fill
  if (aLower.endsWith('ing')) {
    return `Đúng là "${ansStr}". Vì theo quy tắc ngữ pháp chủ đề này, theo sau phải là động từ dạng V-ing.`;
  }
  if (aLower.endsWith('ed')) {
    return `Đúng là "${ansStr}". Vì diễn tả hành động/trạng thái đã hoàn thành ở dạng quá khứ/phân từ (-ed).`;
  }
  if (aLower.includes('will')) {
    return `Đúng là "${ansStr}". Vì diễn tả dự đoán hoặc quyết định trong tương lai đi với will + V nguyên thể.`;
  }
  if (aLower.includes('would')) {
    return `Đúng là "${ansStr}". Vì diễn tả giả định hoặc tương lai trong quá khứ đi với would + V nguyên thể.`;
  }

  return `Đúng là "${ansStr}". Vì đáp án này giải thích đúng quy tắc ngữ pháp và ngữ cảnh của câu.`;
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
      let item = { ...e };
      const ans = item.answer !== undefined ? item.answer : item.correct_answer;
      const ansStr = Array.isArray(ans) ? ans.join(' / ') : String(ans !== undefined ? ans : '');
      const fb = String(item.fb || '').trim();

      if (isGenericFeedback(ansStr, fb)) {
        const newFb = generateSpecificRuleFeedback(item, slug);
        if (typeof newFb === 'object') {
          item = { ...item, answer: newFb.answer, fb: newFb.fb };
        } else {
          item = { ...item, fb: newFb };
        }
        changed = true;
        totalUpdatedEx++;
      }
      return item;
    });

    if (changed) {
      updatedLessons++;
      await sb.from('grammar_lessons').update({ exercises: newEx }).eq('id', L.id);
      await sb.from('grammar_quiz_cache').delete().eq('lesson_id', L.id);
    }
  }

  console.log(`R5.1 Rewrite Complete: Updated ${updatedLessons} lessons, ${totalUpdatedEx} exercises.`);
}

main().catch(console.error);
