/**
 * scripts/remediate-grammar-content.ts
 *
 * Automated, surgical database remediation script for Supabase table `grammar_lessons`.
 * Remediates all 54+ cataloged exercise defects, LaTeX theory glitches, missing explanations,
 * corrupted stems, and off-topic questions across LingoPro 25-Buổi Grammar Curriculum.
 *
 * Usage:
 *   npx tsx scripts/remediate-grammar-content.ts [--dry | --apply]
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { createClient } from '@supabase/supabase-js';

interface ExerciseItem {
  id?: string;
  type: string;
  question?: string;
  q?: string;
  options?: string[];
  opts?: string[];
  correct_answer?: string;
  answer?: string;
  explanation?: string;
  fb?: string;
  difficulty?: number;
  [key: string]: unknown;
}

interface GrammarLessonRow {
  id: string;
  topic_id: string;
  title: string;
  order_index: number;
  theory_vi: string | null;
  theory: string | null;
  sections: Record<string, unknown> | null;
  examples: unknown[] | null;
  exercises: ExerciseItem[] | null;
}

function loadEnv(): Record<string, string> {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return {};
  const raw = fs.readFileSync(envPath, 'utf8');
  const env: Record<string, string> = {};
  for (const line of raw.split(/\r?\n/)) {
    if (!line || line.startsWith('#')) continue;
    const i = line.indexOf('=');
    if (i < 0) continue;
    const k = line.slice(0, i).trim();
    let v = line.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    env[k] = v;
  }
  return env;
}

const env = loadEnv();
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('[FATAL] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const sb = createClient(supabaseUrl, supabaseKey);

function cleanAns(s: string | undefined): string {
  return (s || '')
    .toLowerCase()
    .trim()
    .replace(/[’`]/g, "'")
    .replace(/\s+/g, ' ');
}

// 25 Authentic Tag Question Drills for Buổi 6 (Replacing off-topic #16-60)
const B06_TAG_QUESTION_DRILLS: ExerciseItem[] = [
  {
    id: 'b06-drill-4-1',
    type: 'fill_blank',
    options: [],
    question: "Let's take a break and get some coffee, ______?",
    correct_answer: 'shall we',
    explanation: "Cấu trúc rủ rê, đề nghị bắt đầu bằng 'Let's' luôn có câu hỏi đuôi là 'shall we?'.",
    difficulty: 1
  },
  {
    id: 'b06-drill-4-2',
    type: 'fill_blank',
    options: [],
    question: "Let us use your computer for a few minutes, ______?",
    correct_answer: 'will you',
    explanation: "'Let us' mang nghĩa xin phép (cho phép chúng tôi làm gì) có câu hỏi đuôi là 'will you?'.",
    difficulty: 2
  },
  {
    id: 'b06-drill-4-3',
    type: 'fill_blank',
    options: [],
    question: "Close the door behind you, ______?",
    correct_answer: 'will you',
    explanation: "Câu mệnh lệnh khẳng định yêu cầu hoặc nhờ vả có câu hỏi đuôi thông dụng nhất là 'will you?'.",
    difficulty: 1
  },
  {
    id: 'b06-drill-4-4',
    type: 'fill_blank',
    options: [],
    question: "Don't forget to lock the gate before leaving, ______?",
    correct_answer: 'will you',
    explanation: "Câu mệnh lệnh phủ định bắt đầu bằng 'Don't + V' luôn có câu hỏi đuôi là 'will you?'.",
    difficulty: 1
  },
  {
    id: 'b06-drill-4-5',
    type: 'fill_blank',
    options: [],
    question: "Take a seat and make yourself comfortable, ______?",
    correct_answer: "won't you",
    explanation: "Câu mệnh lệnh mang tính chất mời mọc lịch sự (invitation) thường dùng câu hỏi đuôi 'won't you?'.",
    difficulty: 2
  },
  {
    id: 'b06-drill-4-6',
    type: 'fill_blank',
    options: [],
    question: "Nobody came to the meeting on time, ______?",
    correct_answer: 'did they',
    explanation: "'Nobody' mang nghĩa phủ định và đại diện cho người (đại từ 'they') → câu hỏi đuôi ở dạng khẳng định: did they?",
    difficulty: 2
  },
  {
    id: 'b06-drill-4-7',
    type: 'fill_blank',
    options: [],
    question: "Nothing went wrong during our experiment, ______?",
    correct_answer: 'did it',
    explanation: "'Nothing' mang nghĩa phủ định và đại diện cho vật (đại từ 'it') → câu hỏi đuôi ở dạng khẳng định: did it?",
    difficulty: 2
  },
  {
    id: 'b06-drill-4-8',
    type: 'fill_blank',
    options: [],
    question: "Everyone was excited about the road trip, ______?",
    correct_answer: "weren't they",
    explanation: "'Everyone' đi với động từ số ít ở mệnh đề chính nhưng câu hỏi đuôi quy về đại từ 'they' → weren't they?",
    difficulty: 2
  },
  {
    id: 'b06-drill-4-9',
    type: 'fill_blank',
    options: [],
    question: "Everything is ready for the conference, ______?",
    correct_answer: "isn't it",
    explanation: "'Everything' là đại từ bất định chỉ vật, quy về đại từ 'it' ở câu hỏi đuôi → isn't it?",
    difficulty: 1
  },
  {
    id: 'b06-drill-4-10',
    type: 'fill_blank',
    options: [],
    question: "She seldom eats fast food because of her health, ______?",
    correct_answer: 'does she',
    explanation: "'Seldom' mang nghĩa bán phủ định (hiếm khi) → mệnh đề chính là phủ định, câu hỏi đuôi ở dạng khẳng định: does she?",
    difficulty: 2
  },
  {
    id: 'b06-drill-4-11',
    type: 'fill_blank',
    options: [],
    question: "They rarely watch television on weekdays, ______?",
    correct_answer: 'do they',
    explanation: "'Rarely' mang nghĩa bán phủ định → mệnh đề chính xem như phủ định, câu hỏi đuôi ở khẳng định: do they?",
    difficulty: 2
  },
  {
    id: 'b06-drill-4-12',
    type: 'fill_blank',
    options: [],
    question: "He could hardly speak after running five kilometers, ______?",
    correct_answer: 'could he',
    explanation: "'Hardly' mang nghĩa bán phủ định (hầu như không), trợ động từ khuyết thiếu 'could' → câu hỏi đuôi khẳng định: could he?",
    difficulty: 2
  },
  {
    id: 'b06-drill-4-13',
    type: 'fill_blank',
    options: [],
    question: "You have never traveled abroad before, ______?",
    correct_answer: 'have you',
    explanation: "'Never' làm cho mệnh đề chính mang nghĩa phủ định → câu hỏi đuôi dùng khẳng định: have you?",
    difficulty: 1
  },
  {
    id: 'b06-drill-4-14',
    type: 'fill_blank',
    options: [],
    question: "Students must wear their school uniforms on Mondays, ______?",
    correct_answer: "mustn't they",
    explanation: "'Must' diễn tả bổn phận, sự cần thiết ở khẳng định → câu hỏi đuôi dùng 'mustn't they?'.",
    difficulty: 2
  },
  {
    id: 'b06-drill-4-15',
    type: 'fill_blank',
    options: [],
    question: "You must not park your vehicle in front of the gate, ______?",
    correct_answer: 'must you',
    explanation: "'Must not' mang nghĩa cấm đoán (phủ định) → câu hỏi đuôi dùng khẳng định 'must you?'.",
    difficulty: 2
  },
  {
    id: 'b06-drill-4-16',
    type: 'fill_blank',
    options: [],
    question: "She looks very tired; she must be exhausted after the long flight, ______?",
    correct_answer: "isn't she",
    explanation: "'Must be' phỏng đoán ở hiện tại → câu hỏi đuôi chia theo động từ to be theo sau: isn't she?",
    difficulty: 2
  },
  {
    id: 'b06-drill-4-17',
    type: 'fill_blank',
    options: [],
    question: "The ground is wet. It must have rained last night, ______?",
    correct_answer: "hasn't it",
    explanation: "'Must have + V3' phỏng đoán một sự việc đã xảy ra trong quá khứ → câu hỏi đuôi chia theo trợ động từ 'have/has': hasn't it?",
    difficulty: 3
  },
  {
    id: 'b06-drill-4-18',
    type: 'fill_blank',
    options: [],
    question: "I think that Linh will win the English speaking contest, ______?",
    correct_answer: "won't she",
    explanation: "Cấu trúc 'I think + S + V', câu hỏi đuôi chia theo mệnh đề phụ (Linh will win → won't she?).",
    difficulty: 2
  },
  {
    id: 'b06-drill-4-19',
    type: 'fill_blank',
    options: [],
    question: "I don't think the manager will agree to our new proposal, ______?",
    correct_answer: 'will he',
    explanation: "Cấu trúc 'I don't think + S + V', hiện tượng chuyển dịch phủ định làm cho mệnh đề phụ mang nghĩa phủ định → đuôi khẳng định: will he?",
    difficulty: 3
  },
  {
    id: 'b06-drill-4-20',
    type: 'fill_blank',
    options: [],
    question: "Lan thinks that living in a big city is convenient, ______?",
    correct_answer: "doesn't she",
    explanation: "Khi chủ ngữ không phải ngôi thứ nhất ('Lan thinks'), câu hỏi đuôi chia theo mệnh đề chính của người nói: doesn't she?",
    difficulty: 2
  },
  {
    id: 'b06-drill-4-21',
    type: 'fill_blank',
    options: [],
    question: "You had better see a dentist about your toothache, ______?",
    correct_answer: "hadn't you",
    explanation: "Cấu trúc 'had better' (viết tắt là 'd better) có câu hỏi đuôi dùng trợ động từ 'had': hadn't you?",
    difficulty: 2
  },
  {
    id: 'b06-drill-4-22',
    type: 'fill_blank',
    options: [],
    question: "You would rather stay home tonight than go out in the rain, ______?",
    correct_answer: "wouldn't you",
    explanation: "Cấu trúc 'would rather' (viết tắt 'd rather) có câu hỏi đuôi dùng trợ động từ 'would': wouldn't you?",
    difficulty: 2
  },
  {
    id: 'b06-drill-4-23',
    type: 'fill_blank',
    options: [],
    question: "Your grandfather used to be a high school teacher, ______?",
    correct_answer: "didn't he",
    explanation: "'Used to' diễn tả thói quen trong quá khứ → câu hỏi đuôi mượn trợ động từ quá khứ 'didn't': didn't he?",
    difficulty: 2
  },
  {
    id: 'b06-drill-4-24',
    type: 'fill_blank',
    options: [],
    question: "There has been no significant improvement in the patient's condition, ______?",
    correct_answer: 'has there',
    explanation: "Chủ ngữ giả 'There', kết hợp từ phủ định 'no' → câu hỏi đuôi khẳng định giữ nguyên 'there': has there?",
    difficulty: 2
  },
  {
    id: 'b06-drill-4-25',
    type: 'fill_blank',
    options: [],
    question: "I wish to accompany you on the next business trip, ______?",
    correct_answer: 'may I',
    explanation: "Khi câu bắt đầu bằng 'I wish' bày tỏ mong muốn lịch sự, câu hỏi đuôi theo quy tắc chuẩn luôn là 'may I?'.",
    difficulty: 3
  }
];

function remediateLesson(lesson: GrammarLessonRow): {
  exercises: ExerciseItem[];
  theory_vi: string | null;
  theory: string | null;
  modified: boolean;
} {
  let modified = false;
  let theory_vi = lesson.theory_vi;
  let theory = lesson.theory;
  const exercises: ExerciseItem[] = JSON.parse(JSON.stringify(lesson.exercises || []));
  const b = lesson.order_index;

  // --- 1. BUỔI 1: S–V–O ---
  if (b === 1) {
    if (theory_vi) {
      const prevTheory = theory_vi;
      theory_vi = theory_vi
        .replace(/\$S_\{?ít\}?\$/g, 'S (số ít)')
        .replace(/\$S_\{?nhiều\}?\$/g, 'S (số nhiều)');
      if (theory_vi !== prevTheory) modified = true;
    }
    if (theory) {
      const prevTheory = theory;
      theory = theory
        .replace(/\$S_\{?ít\}?\$/g, 'S (số ít)')
        .replace(/\$S_\{?nhiều\}?\$/g, 'S (số nhiều)');
      if (theory !== prevTheory) modified = true;
    }

    // Q#15: Cat A (convert to fill_blank)
    if (exercises[14]) {
      exercises[14] = {
        ...exercises[14],
        type: 'fill_blank',
        options: [],
        question: 'Ten years ______ (seem) like a long time to wait.',
        correct_answer: 'seems',
        explanation: 'Cụm từ chỉ thời gian (ten years) được xem như một chỉnh thể thống nhất (danh từ số ít) → động từ chia số ít: seems.'
      };
      modified = true;
    }

    // Q#37: Cat G (fix duplicate option D)
    if (exercises[36]) {
      exercises[36] = {
        ...exercises[36],
        options: ['A. make', 'B. makes', 'C. are making', 'D. is making'],
        correct_answer: 'makes',
        explanation: 'The news (danh từ không đếm được) làm chủ ngữ → động từ chia số ít ở thì Hiện tại đơn: makes.'
      };
      modified = true;
    }

    // Q#41-45: Cat C (reconstruct clean error identification questions)
    if (exercises[40]) {
      exercises[40] = {
        ...exercises[40],
        type: 'multiple_choice',
        question: "Find the underlined part that needs correction:\nMy brother (A) doesn't (B) likes (C) fresh milk (D) every morning.",
        options: ["A. doesn't", 'B. likes', 'C. fresh milk', 'D. every morning'],
        correct_answer: 'B. likes',
        explanation: "Đã mượn trợ động từ phủ định 'doesn't' thì động từ chính theo sau phải ở dạng nguyên mẫu không chia: likes → like."
      };
      modified = true;
    }

    if (exercises[41]) {
      exercises[41] = {
        ...exercises[41],
        type: 'multiple_choice',
        question: 'Find the underlined part that needs correction:\nThe rich (A) is (B) often expected to help (C) poor (D) people in society.',
        options: ['A. is', 'B. often expected', 'C. poor', 'D. people'],
        correct_answer: 'A. is',
        explanation: "'The rich' (The + tính từ) chỉ một tập hợp người trong xã hội → đóng vai trò là chủ ngữ số nhiều, động từ phải chia 'are' thay vì 'is'."
      };
      modified = true;
    }

    if (exercises[42]) {
      exercises[42] = {
        ...exercises[42],
        type: 'multiple_choice',
        question: 'Find the underlined part that needs correction:\nTo learn (A) a foreign language (B) require (C) great patience and (D) effort.',
        options: ['A. a foreign language', 'B. require', 'C. great patience', 'D. effort'],
        correct_answer: 'B. require',
        explanation: "Mệnh đề bắt đầu bằng động từ nguyên mẫu có 'To' (To-V) làm chủ ngữ thì động từ chính luôn chia ở ngôi thứ 3 số ít: require → requires."
      };
      modified = true;
    }

    if (exercises[43]) {
      exercises[43] = {
        ...exercises[43],
        type: 'multiple_choice',
        question: 'Find the underlined part that needs correction:\nOne of (A) my best friends (B) currently (C) live (D) in Tokyo.',
        options: ['A. my best friends', 'B. currently', 'C. live', 'D. in Tokyo'],
        correct_answer: 'C. live',
        explanation: "Cấu trúc 'One of + danh từ số nhiều' có chủ ngữ cốt lõi là 'One' (số ít) → động từ phải chia số ít: live → lives."
      };
      modified = true;
    }

    if (exercises[44]) {
      exercises[44] = {
        ...exercises[44],
        type: 'multiple_choice',
        question: 'Find the underlined part that needs correction:\nA pair (A) of expensive (B) glasses (C) are left on (D) the desk.',
        options: ['A. of expensive', 'B. glasses', 'C. are left on', 'D. the desk'],
        correct_answer: 'C. are left on',
        explanation: "Cấu trúc 'A pair of + danh từ số nhiều' có chủ ngữ cốt lõi là 'A pair' (số ít) → động từ to be phải chia 'is' thay vì 'are'."
      };
      modified = true;
    }

    // Q#46-50: Cat H (add pedagogical explanations)
    const b1_exps: Record<number, string> = {
      45: "Chuyển đổi từ cấu trúc 'S + be + a/an + adj + noun' sang 'S + verb + adv': 'a good football player' → 'plays football very well'.",
      46: "Cấu trúc 'It is not true that...' tương đương với câu phủ định ở thì Hiện tại đơn: 'My brother doesn't like coffee'.",
      47: "Viết lại câu hỏi dùng động từ thường 'study': mượn trợ động từ 'Do' đứng đầu câu hỏi thì Hiện tại đơn.",
      48: "Chuyển đổi câu sang cấu trúc chủ động với động từ 'like': 'S + like + something + for breakfast'.",
      49: 'Câu hoàn chỉnh gồm đầy đủ thành phần cốt lõi: Chủ ngữ (I) + Động từ (love) + Tân ngữ (English) + Trạng từ (very much).'
    };
    for (const [idxStr, exp] of Object.entries(b1_exps)) {
      const idx = Number(idxStr);
      if (exercises[idx]) {
        exercises[idx].explanation = exp;
        modified = true;
      }
    }
  }

  // --- 2. BUỔI 2: Hiện Tại Đơn vs Hiện Tại Tiếp Diễn ---
  if (b === 2) {
    // Q#10: Cat A
    if (exercises[9]) {
      exercises[9] = {
        ...exercises[9],
        type: 'fill_blank',
        options: [],
        question: 'My sister ______ (not / like) drinking coffee in the morning.',
        correct_answer: "doesn't like",
        explanation: "Chủ ngữ 'My sister' là ngôi thứ ba số ít, câu phủ định thì Hiện tại đơn mượn trợ động từ doesn't + V-bare → doesn't like."
      };
      modified = true;
    }

    // Q#16: Cat A
    if (exercises[15]) {
      exercises[15] = {
        ...exercises[15],
        type: 'fill_blank',
        options: [],
        question: 'Why ______ you ______ (always / make) noise when I am studying?',
        correct_answer: 'are / always making',
        explanation: "Cấu trúc Hiện tại tiếp diễn kết hợp với 'always' diễn tả sự phàn nàn, bực mình về một hành vi tiêu cực lặp đi lặp lại."
      };
      modified = true;
    }

    // Q#27-30: Cat C & H
    if (exercises[26]) {
      exercises[26] = {
        ...exercises[26],
        type: 'multiple_choice',
        question: 'Find the underlined part that needs correction:\nListen! The little birds (A) sing (B) very sweetly (C) in the morning (D) garden.',
        options: ['A. sing', 'B. very sweetly', 'C. in the morning', 'D. garden'],
        correct_answer: 'A. sing',
        explanation: "Dấu hiệu cảm thán 'Listen!' báo hiệu hành động đang diễn ra tại thời điểm nói → chia thì Hiện tại tiếp diễn: sing → are singing."
      };
      modified = true;
    }

    if (exercises[27]) {
      exercises[27] = {
        ...exercises[27],
        type: 'multiple_choice',
        question: 'Find the underlined part that needs correction:\nI (A) am needing (B) your advice on (C) this project (D) at the moment.',
        options: ['A. am needing', 'B. your advice', 'C. this project', 'D. at the moment'],
        correct_answer: 'A. am needing',
        explanation: "'Need' là động từ trạng thái (stative verb) chỉ nhu cầu, không dùng ở thì tiếp diễn (-ing) → chia Hiện tại đơn: am needing → need."
      };
      modified = true;
    }

    if (exercises[28]) {
      exercises[28] = {
        ...exercises[28],
        type: 'multiple_choice',
        question: 'Find the underlined part that needs correction:\nNormally he (A) is driving (B) his car to work, but (C) today he (D) takes the bus.',
        options: ['A. is driving', 'B. his car', 'C. today he', 'D. takes'],
        correct_answer: 'A. is driving',
        explanation: "Trạng từ 'Normally' chỉ thói quen thường nhật lặp đi lặp lại → chia thì Hiện tại đơn: is driving → drives."
      };
      modified = true;
    }

    if (exercises[29]) {
      exercises[29] = {
        ...exercises[29],
        type: 'multiple_choice',
        question: 'Find the underlined part that needs correction:\nShe (A) is thinking (B) that living in (C) the countryside is (D) very peaceful.',
        options: ['A. is thinking', 'B. that living', 'C. the countryside', 'D. very peaceful'],
        correct_answer: 'A. is thinking',
        explanation: "Khi 'think' diễn tả quan điểm ('cho rằng / nghĩ rằng') thì đây là động từ trạng thái không chia tiếp diễn: is thinking → thinks."
      };
      modified = true;
    }

    // Q#31-35: Cat H
    const b2_exps: Record<number, string> = {
      30: "Cụm từ chỉ thói quen 'It is a habit of... to V' được viết lại dùng trạng từ tần suất 'usually' kết hợp thì Hiện tại đơn.",
      31: "Dấu hiệu mệnh lệnh 'Look!' kết hợp hiện tượng trời đang mưa tại thời điểm nói → dùng Hiện tại tiếp diễn: 'It is raining'.",
      32: "Cấu trúc Hiện tại tiếp diễn kết hợp trạng từ 'always' dùng để phàn nàn, bực mình về một hành vi tiêu cực lặp đi lặp lại.",
      33: "Hỏi ý kiến, quan điểm của ai về vấn đề gì: 'What do you think about...?' tương đương 'What is your opinion about...?'.",
      34: "Chuyển đổi diễn đạt nghề nghiệp: 'S + be + a/an + nghề nghiệp' tương đương 'S + work(s) as + a/an + nghề nghiệp'."
    };
    for (const [idxStr, exp] of Object.entries(b2_exps)) {
      const idx = Number(idxStr);
      if (exercises[idx]) {
        exercises[idx].explanation = exp;
        modified = true;
      }
    }
  }

  // --- 3. BUỔI 3: Quá Khứ Đơn vs Quá Khứ Tiếp Diễn ---
  if (b === 3) {
    // Q#9: Cat H
    if (exercises[8]) {
      exercises[8].explanation = "Dấu hiệu 'ten minutes ago' chỉ thời gian xác định trong quá khứ → chia thì Quá khứ đơn: drive → drove.";
      modified = true;
    }

    // Q#10: Cat A & H
    if (exercises[9]) {
      exercises[9] = {
        ...exercises[9],
        type: 'fill_blank',
        options: [],
        question: 'I ______ (not / have) any trouble with my car last week.',
        correct_answer: "didn't have",
        explanation: "Dấu hiệu 'last week' chỉ mốc thời gian quá khứ, câu phủ định thì Quá khứ đơn mượn trợ động từ 'didn't' + V nguyên mẫu: didn't have."
      };
      modified = true;
    }

    // Q#12-20: Cat H
    const b3_exps_1: Record<number, string> = {
      11: 'Chuỗi các hành động liên tiếp xảy ra trong quá khứ đều chia ở thì Quá khứ đơn (V2/ed): got, locked, walked.',
      12: "Thời điểm xác định trong quá khứ 'At 7 p.m. yesterday' diễn tả hành động đang diễn ra → chia Quá khứ tiếp diễn: was watching.",
      13: "Cụm từ 'At this time last year' chỉ thời điểm xác định trong quá khứ → chia Quá khứ tiếp diễn với chủ ngữ số nhiều 'we': were learning.",
      14: "Thời điểm cụ thể trong quá khứ 'at 3 p.m. yesterday' → chia thì Quá khứ tiếp diễn với chủ ngữ 'Marry': was watering.",
      15: 'Hành động tắm đang diễn ra trong quá khứ thì có hành động gọi điện chen ngang → hành động đang diễn ra chia Quá khứ tiếp diễn: was having.',
      16: 'Hành động ăn tối đang diễn ra (chia Quá khứ tiếp diễn: were having) thì hành động mất điện chen ngang (chia Quá khứ đơn: went).',
      17: 'Hành động đến chen vào (chia Quá khứ đơn: arrived) khi anh ấy vẫn đang ngủ (chia Quá khứ tiếp diễn: was sleeping).',
      18: 'Hành động đang sang đường (chia Quá khứ tiếp diễn: were crossing) thì nhìn thấy vụ tai nạn (hành động nhận thức/chen ngang: saw).',
      19: "Hai hành động diễn ra song song cùng lúc trong quá khứ nối bằng 'While' đều chia thì Quá khứ tiếp diễn: was watching / was reading."
    };
    for (const [idxStr, exp] of Object.entries(b3_exps_1)) {
      const idx = Number(idxStr);
      if (exercises[idx]) {
        exercises[idx].explanation = exp;
        modified = true;
      }
    }

    // Q#23-28: Cat H
    const b3_exps_2: Record<number, string> = {
      22: 'Hành động đọc sách đang diễn ra trong quá khứ khi hành động khác (came) chen vào → chia Quá khứ tiếp diễn: was reading.',
      23: "Hai hành động diễn ra song song đồng thời trong quá khứ nối bằng 'While' → chia Quá khứ tiếp diễn: was doing.",
      24: "Dấu hiệu 'three years ago' chỉ mốc thời gian quá khứ đơn giản → chia Quá khứ đơn: went.",
      25: "Thời điểm xác định trong quá khứ 'At 10 p.m. yesterday' → chia Quá khứ tiếp diễn với chủ ngữ 'we': were studying.",
      26: 'Hành động đánh mất chìa khóa là hành động tức thời, chen ngang vào hành động đi dạo trong công viên → chia Quá khứ đơn: lost.',
      27: "'Know' là động từ trạng thái chỉ nhận thức, không dùng ở dạng tiếp diễn → chia Quá khứ đơn phủ định: didn't know."
    };
    for (const [idxStr, exp] of Object.entries(b3_exps_2)) {
      const idx = Number(idxStr);
      if (exercises[idx]) {
        exercises[idx].explanation = exp;
        modified = true;
      }
    }

    // Q#29-32: Cat B & H (remove leaked tags, correct answer keys)
    if (exercises[28]) {
      exercises[28] = {
        ...exercises[28],
        question: 'While I was driving home, I ______ (see) a terrible accident on the road.',
        correct_answer: 'saw',
        explanation: "Động từ tri giác 'see' chỉ hành động tức thời xen vào hành động lái xe đang diễn ra → chia Quá khứ đơn: saw."
      };
      modified = true;
    }

    if (exercises[29]) {
      exercises[29] = {
        ...exercises[29],
        question: 'Yesterday at 7 p.m., my father ______ (read) a newspaper while my mother was cooking.',
        correct_answer: 'was reading',
        explanation: "Thời điểm cụ thể 'Yesterday at 7 p.m.' và hai hành động diễn ra song song (nối bằng while) → chia Quá khứ tiếp diễn: was reading."
      };
      modified = true;
    }

    if (exercises[30]) {
      exercises[30] = {
        ...exercises[30],
        question: 'Did your sister ______ (go) to the doctor when she felt sick?',
        correct_answer: 'go',
        explanation: "Đã có trợ động từ 'Did' ở đầu câu hỏi thì Quá khứ đơn thì động từ chính theo sau phải ở dạng nguyên mẫu không chia (bare infinitive): go."
      };
      modified = true;
    }

    if (exercises[31]) {
      exercises[31] = {
        ...exercises[31],
        question: 'While the boys ______ (play) football, their coach was taking notes in the yard.',
        correct_answer: 'were playing',
        explanation: "Chủ ngữ 'the boys' là danh từ số nhiều, kết hợp liên từ 'While' diễn tả hành động đang diễn ra → chia Quá khứ tiếp diễn: were playing."
      };
      modified = true;
    }
  }

  // --- 4. BUỔI 4: Hiện Tại Hoàn Thành vs Quá Khứ Hoàn Thành ---
  if (b === 4) {
    // Q#9, 10, 14, 15, 19, 21: Cat A
    if (exercises[8]) {
      exercises[8] = {
        ...exercises[8],
        type: 'fill_blank',
        options: [],
        question: 'I ______ (already / finish) my exercise.',
        correct_answer: 'have already finished',
        explanation: "Trạng từ 'already' đứng giữa trợ động từ have/has và V3/ed trong thì Hiện tại hoàn thành → have already finished."
      };
      modified = true;
    }

    if (exercises[9]) {
      exercises[9] = {
        ...exercises[9],
        type: 'fill_blank',
        options: [],
        question: 'Rashid ______ (just / pass) his driving test.',
        correct_answer: 'has just passed',
        explanation: "Chủ ngữ 'Rashid' (ngôi thứ 3 số ít), trạng từ 'just' đứng giữa has và V3/ed → has just passed."
      };
      modified = true;
    }

    if (exercises[13]) {
      exercises[13] = {
        ...exercises[13],
        type: 'fill_blank',
        options: [],
        question: 'The teacher ______ (already / tell) us to be quiet.',
        correct_answer: 'has already told',
        explanation: "Chủ ngữ 'The teacher' (số ít) đi với has, 'already' đứng trước V3 (told) → has already told."
      };
      modified = true;
    }

    if (exercises[14]) {
      exercises[14] = {
        ...exercises[14],
        type: 'fill_blank',
        options: [],
        question: 'She ______ (not / see) him since Christmas.',
        correct_answer: "hasn't seen",
        explanation: "Dấu hiệu 'since Christmas' chỉ mốc thời gian, câu phủ định thì Hiện tại hoàn thành với chủ ngữ 'She' → hasn't seen."
      };
      modified = true;
    }

    if (exercises[18]) {
      exercises[18] = {
        ...exercises[18],
        type: 'fill_blank',
        options: [],
        question: 'We ______ (not / meet) each other since we left high school.',
        correct_answer: "haven't met",
        explanation: "Cấu trúc 'since + mốc quá khứ', mệnh đề chính chia Hiện tại hoàn thành phủ định với chủ ngữ 'We' → haven't met."
      };
      modified = true;
    }

    if (exercises[20]) {
      exercises[20] = {
        ...exercises[20],
        type: 'fill_blank',
        options: [],
        question: 'I ______ (never / try) Japanese food before.',
        correct_answer: 'have never tried',
        explanation: "Trạng từ 'never' đứng giữa have và V3 (tried) trong thì Hiện tại hoàn thành → have never tried."
      };
      modified = true;
    }

    // Q#36: Cat H
    if (exercises[35]) {
      exercises[35].explanation = "Cấu trúc viết lại câu kinh điển: 'S + have/has never + V3/ed + before' tương đương 'This is the first time + S + have/has (ever) + V3/ed'.";
      modified = true;
    }
  }

  // --- 5. BUỔI 5: Các Thì Tương Lai & Phối Hợp Thì ---
  if (b === 5) {
    // Q#6: Cat A
    if (exercises[5]) {
      exercises[5] = {
        ...exercises[5],
        type: 'fill_blank',
        options: [],
        question: 'I promise I ______ (not / tell) anyone your secret.',
        correct_answer: "won't tell",
        explanation: "Động từ 'promise' (hứa) diễn tả lời hứa trong tương lai, phủ định dùng won't + V-bare → won't tell."
      };
      modified = true;
    }

    // Q#35-38: Cat A & H
    if (exercises[34]) {
      exercises[34] = {
        ...exercises[34],
        type: 'fill_blank',
        options: [],
        question: 'I intend to visit my grandparents this weekend. (Viết lại dùng going to)\n➔ I am ______',
        correct_answer: 'going to visit my grandparents this weekend.',
        explanation: "Cấu trúc 'be going to + V' dùng để diễn tả dự định, kế hoạch đã có từ trước: 'I am going to visit my grandparents this weekend'."
      };
      modified = true;
    }

    if (exercises[35]) {
      exercises[35] = {
        ...exercises[35],
        type: 'fill_blank',
        options: [],
        question: 'They plan to finish the project before 5 p.m. (Viết lại dùng will have finished)\n➔ By 5 p.m, they ______',
        correct_answer: 'will have finished the project.',
        explanation: "Cấu trúc tương lai hoàn thành 'will have + V3/ed' diễn tả hành động sẽ hoàn tất trước một mốc thời gian trong tương lai (By 5 p.m)."
      };
      modified = true;
    }

    if (exercises[36]) {
      exercises[36] = {
        ...exercises[36],
        type: 'fill_blank',
        options: [],
        question: 'I will call you immediately after I get the test results. (Viết lại dùng as soon as)\n➔ As soon as ______',
        correct_answer: 'I get the test results, I will call you.',
        explanation: "Liên từ 'as soon as' dùng trong mệnh đề trạng ngữ chỉ thời gian tương lai, động từ trong mệnh đề chia thì Hiện tại đơn."
      };
      modified = true;
    }

    if (exercises[37]) {
      exercises[37] = {
        ...exercises[37],
        type: 'fill_blank',
        options: [],
        question: 'He plans to take an exam at 8 a.m tomorrow. (Viết lại dùng will be taking)\n➔ At 8 a.m tomorrow, he ______',
        correct_answer: 'will be taking an exam.',
        explanation: "Cấu trúc tương lai tiếp diễn 'will be + V-ing' diễn tả hành động đang xảy ra tại một thời điểm xác định trong tương lai (At 8 a.m tomorrow)."
      };
      modified = true;
    }

    // Q#39: Cat H
    if (exercises[38]) {
      exercises[38].explanation = "Cấu trúc phối hợp thì: 'By the time + S + V(hiện tại đơn), S + will have + V3/ed (tương lai hoàn thành)'.";
      modified = true;
    }
  }

  // --- 6. BUỔI 6: Câu Hỏi Đuôi Toàn Diện ---
  if (b === 6) {
    // LaTeX in theory_vi and theory
    if (theory_vi) {
      const prevTheory = theory_vi;
      theory_vi = theory_vi
        .replace(/\$\\rightarrow\$/g, '→')
        .replace(/\\rightarrow/g, '→')
        .replace(/\$\\nearrow\$/g, '↗')
        .replace(/\\nearrow/g, '↗')
        .replace(/\$\\searrow\$/g, '↘')
        .replace(/\\searrow/g, '↘')
        .replace(/BẪY ĐIỂM 9-10/g, 'DẠNG ĐẶC BIỆT NÂNG CAO');
      if (theory_vi !== prevTheory) modified = true;
    }
    if (theory) {
      const prevTheory = theory;
      theory = theory
        .replace(/\$\\rightarrow\$/g, '→')
        .replace(/\\rightarrow/g, '→')
        .replace(/\$\\nearrow\$/g, '↗')
        .replace(/\\nearrow/g, '↗')
        .replace(/\$\\searrow\$/g, '↘')
        .replace(/\\searrow/g, '↘')
        .replace(/BẪY ĐIỂM 9-10/g, 'DẠNG ĐẶC BIỆT NÂNG CAO');
      if (theory !== prevTheory) modified = true;
    }

    // Cat F: Replace off-topic questions #16-60 with 25 authentic drills
    // Keep #1-15 and append 25 high quality drills
    const retained15 = exercises.slice(0, 15);
    exercises.length = 0;
    exercises.push(...retained15, ...B06_TAG_QUESTION_DRILLS);
    modified = true;
  }

  // --- 7. BUỔI 7: Tổng Ôn & Phản Xạ Chặng 1 ---
  if (b === 7) {
    // Cat D: Reconstruct Q#16-20 from broken cloze fragments
    if (exercises[15]) {
      exercises[15] = {
        ...exercises[15],
        type: 'multiple_choice',
        question: 'Last week, our school ________ a field trip to the national history museum.',
        options: ['A. organizes', 'B. organized', 'C. has organized', 'D. was organizing'],
        correct_answer: 'organized',
        explanation: "Dấu hiệu 'Last week' chỉ thời gian xác định trong quá khứ → chia thì Quá khứ đơn (Past Simple): organized."
      };
      modified = true;
    }

    if (exercises[16]) {
      exercises[16] = {
        ...exercises[16],
        type: 'multiple_choice',
        question: 'By the time the bus arrived at the museum, the rain ________.',
        options: ['A. stopped', 'B. has stopped', 'C. had stopped', 'D. stops'],
        correct_answer: 'had stopped',
        explanation: "Cấu trúc 'By the time + QKĐ' diễn tả hành động tạnh mưa đã hoàn tất trước khi xe buýt tới → chia Quá khứ hoàn thành: had stopped."
      };
      modified = true;
    }

    if (exercises[17]) {
      exercises[17] = {
        ...exercises[17],
        type: 'multiple_choice',
        question: 'The exhibition was very informative and interesting, ________?',
        options: ['A. was it', "B. wasn't it", "C. didn't it", 'D. did it'],
        correct_answer: "wasn't it",
        explanation: "Mệnh đề chính dùng 'The exhibition was' (khẳng định với to be) → câu hỏi đuôi ở dạng phủ định: wasn't it?"
      };
      modified = true;
    }

    if (exercises[18]) {
      exercises[18] = {
        ...exercises[18],
        type: 'multiple_choice',
        question: 'I think history helps us understand the modern world, ________?',
        options: ["A. doesn't it", "B. don't I", 'C. is it', 'D. does it'],
        correct_answer: "doesn't it",
        explanation: "Với cấu trúc 'I think + mệnh đề phụ', câu hỏi đuôi chia theo mệnh đề phụ 'history helps...' (khẳng định thì HTĐ) → doesn't it?"
      };
      modified = true;
    }

    if (exercises[19]) {
      exercises[19] = {
        ...exercises[19],
        type: 'multiple_choice',
        question: 'Since they returned from the museum, the students ________ many wonderful memories.',
        options: ['A. share', 'B. shared', 'C. have shared', 'D. had shared'],
        correct_answer: 'have shared',
        explanation: "Cấu trúc 'Since + mốc quá khứ', mệnh đề chính diễn tả hành động kéo dài đến hiện tại → chia Hiện tại hoàn thành: have shared."
      };
      modified = true;
    }
  }

  // --- 8. BUỔI 8: Câu Bị Động ---
  if (b === 8) {
    // Cat E & F: Replace isolated numbers (1)-(8) and off-topic S-V agreement with 8 authentic, high-quality Passive Voice questions
    const b8_sentences: Array<{ q: string; ans: string; fb: string }> = [
      {
        q: 'Our school English club ______ (found) by a group of dedicated teachers three years ago.',
        ans: 'was founded',
        fb: "Cấu trúc câu bị động thì Quá khứ đơn với chủ ngữ số ít 'Our school club': 'was + V3/ed' → was founded."
      },
      {
        q: 'A large sum of money ______ (donate) to the club by local sponsors last month.',
        ans: 'was donated',
        fb: "Chủ ngữ 'A large sum of money' là danh từ không đếm được, câu bị động thì Quá khứ đơn: 'was + V3/ed' → was donated."
      },
      {
        q: 'A number of new projects ______ (launch) by the students this semester.',
        ans: 'have been launched',
        fb: "Cấu trúc 'A number of + N số nhiều' đi với động từ số nhiều, thể bị động thì Hiện tại hoàn thành: 'have been + V3/ed' → have been launched."
      },
      {
        q: 'Neither the club members nor our team leader ______ (invite) to the international gala yesterday.',
        ans: 'was invited',
        fb: "Cấu trúc 'Neither... nor...' chia theo chủ ngữ gần nhất ('our leader' - số ít), bị động thì Quá khứ đơn: 'was + V3/ed' → was invited."
      },
      {
        q: 'Each of the conference rooms ______ (equip) with modern audio-visual systems.',
        ans: 'is equipped',
        fb: "Cấu trúc 'Each of + N số nhiều' đi với động từ số ít, thể bị động thì Hiện tại đơn: 'is + V3/ed' → is equipped."
      },
      {
        q: 'Mathematics ______ (be) taught by Professor Davis every Monday morning.',
        ans: 'is',
        fb: "'Mathematics' là tên môn học (danh từ số ít), ở câu bị động thì Hiện tại đơn: 'is + V3/ed' (is taught) → chia to-be 'is'."
      },
      {
        q: 'Both physics and chemistry ______ (consider) core science subjects by the ministry.',
        ans: 'are considered',
        fb: "Hai môn học nối bằng 'and' làm chủ ngữ số nhiều, thể bị động thì Hiện tại đơn: 'are + V3/ed' → are considered."
      },
      {
        q: 'It ______ (expect) that more extracurricular activities will be organized next year.',
        ans: 'is expected',
        fb: "Cấu trúc bị động khách quan (impersonal passive): 'It is + V3/ed + that...' → is expected."
      }
    ];

    b8_sentences.forEach((item, i) => {
      const idx = 41 + i;
      if (exercises[idx]) {
        exercises[idx] = {
          ...exercises[idx],
          type: 'fill_blank',
          options: [],
          question: item.q,
          correct_answer: item.ans,
          explanation: item.fb
        };
        modified = true;
      }
    });
  }

  // --- 10. BUỔI 10: Các Cấu Trúc So Sánh ---
  if (b === 10) {
    if (theory_vi) {
      const prevTheory = theory_vi;
      theory_vi = theory_vi
        .replace(/\$\\rightarrow\$/g, '→')
        .replace(/\\rightarrow/g, '→');
      if (theory_vi !== prevTheory) modified = true;
    }
    if (theory) {
      const prevTheory = theory;
      theory = theory
        .replace(/\$\\rightarrow\$/g, '→')
        .replace(/\\rightarrow/g, '→');
      if (theory !== prevTheory) modified = true;
    }
  }

  // --- 22. BUỔI 22: Cụm Động Từ Thông Dụng ---
  if (b === 22) {
    if (theory_vi) {
      const prevTheory = theory_vi;
      theory_vi = theory_vi
        .replace(/thuộc làu 16 cụm 2 từ kinh điển hay thi nhất/g, 'ghi nhớ tự nhiên theo ngữ cảnh 16 cụm 2 từ kinh điển và thông dụng nhất')
        .replace(/bẻ khóa toàn bộ 13 cụm động từ 3 từ bẫy điểm 8\+/g, 'nắm vững 13 cụm động từ 3 từ nâng cao')
        .replace(/trong 10 giây\/câu/g, 'một cách tự tin, chuẩn xác');
      if (theory_vi !== prevTheory) modified = true;
    }
    if (theory) {
      const prevTheory = theory;
      theory = theory
        .replace(/thuộc làu 16 cụm 2 từ kinh điển hay thi nhất/g, 'ghi nhớ tự nhiên theo ngữ cảnh 16 cụm 2 từ kinh điển và thông dụng nhất')
        .replace(/bẻ khóa toàn bộ 13 cụm động từ 3 từ bẫy điểm 8\+/g, 'nắm vững 13 cụm động từ 3 từ nâng cao')
        .replace(/trong 10 giây\/câu/g, 'một cách tự tin, chuẩn xác');
      if (theory !== prevTheory) modified = true;
    }
  }

  return { exercises, theory_vi, theory, modified };
}

interface VerificationReport {
  leakedStems: Array<{ buoi: number; qIdx: number; question: string }>;
  unwinnableMcqs: Array<{ buoi: number; qIdx: number; question: string; ans: string; options: string[] }>;
  duplicateOptions: Array<{ buoi: number; qIdx: number; options: string[] }>;
  missingExplanations: Array<{ buoi: number; qIdx: number; question: string }>;
  isolatedClozeGaps: Array<{ buoi: number; qIdx: number; question: string }>;
  latexMathIssues: Array<{ buoi: number; issue: string; matches: string[] }>;
}

function verifyLessons(lessons: GrammarLessonRow[]): VerificationReport {
  const report: VerificationReport = {
    leakedStems: [],
    unwinnableMcqs: [],
    duplicateOptions: [],
    missingExplanations: [],
    isolatedClozeGaps: [],
    latexMathIssues: []
  };

  for (const l of lessons) {
    const b = l.order_index;
    // Check LaTeX in both theory_vi and theory
    const checkLatexInField = (txt: string | null, fieldName: string) => {
      if (!txt) return;
      const dollarMatches = txt.match(/\$[^\$\n]+\$/g) || [];
      const nonPrice = dollarMatches.filter(m => !/^\$\d+(?:\.\d+)?$/.test(m));
      const hasLatexArrows = txt.includes('\\rightarrow') || txt.includes('\\nearrow') || txt.includes('\\searrow');
      if (nonPrice.length > 0 || hasLatexArrows) {
        report.latexMathIssues.push({
          buoi: b,
          issue: `[${fieldName}] ` + (hasLatexArrows ? 'LaTeX arrow syntax found' : 'Raw math delimiters found'),
          matches: [...nonPrice, ...(hasLatexArrows ? ['LaTeX arrows'] : [])]
        });
      }
    };
    checkLatexInField(l.theory_vi, 'theory_vi');
    checkLatexInField(l.theory, 'theory');

    // Check exercises
    const exercises = l.exercises || [];
    exercises.forEach((ex, idx) => {
      const q = (ex.question || ex.q || '').trim();
      const opts = ex.options || ex.opts || [];
      const ans = ex.correct_answer !== undefined ? ex.correct_answer : ex.answer;
      const fb = (ex.explanation || ex.fb || '').trim();
      const type = ex.type || 'multiple_choice';

      // 1. Check leaked stems
      if (/\([A-D]\s*→\s*[^)]+\)/i.test(q)) {
        report.leakedStems.push({ buoi: b, qIdx: idx + 1, question: q });
      }

      // 2. Check isolated cloze numbers
      if (/^\(\d+\)$/.test(q)) {
        report.isolatedClozeGaps.push({ buoi: b, qIdx: idx + 1, question: q });
      }

      // 3. Check missing explanation
      if (!fb) {
        report.missingExplanations.push({ buoi: b, qIdx: idx + 1, question: q });
      }

      // 4. Check MCQ validity
      if ((type === 'multiple_choice' || type === 'mcq') && opts.length > 0) {
        const cleanOptions = opts.map(o => cleanAns(o.replace(/^[A-D]\.\s*/i, '')));
        const unique = new Set(cleanOptions);
        if (unique.size < cleanOptions.length) {
          report.duplicateOptions.push({ buoi: b, qIdx: idx + 1, options: opts });
        }

        const matched = opts.some((o, optIdx) => {
          const letter = String.fromCharCode(65 + optIdx);
          const cleanO = cleanAns(o.replace(/^[A-D]\.\s*/i, ''));
          const cleanA = cleanAns(String(ans).replace(/^[A-D]\.\s*/i, ''));
          return cleanO === cleanA || letter === String(ans).trim().toUpperCase();
        });

        if (!matched) {
          report.unwinnableMcqs.push({
            buoi: b,
            qIdx: idx + 1,
            question: q,
            ans: String(ans),
            options: opts
          });
        }
      }
    });
  }

  return report;
}

async function main() {
  const isApply = process.argv.includes('--apply');
  const isDry = process.argv.includes('--dry') || !isApply;

  console.log('================================================================');
  console.log('       LINGOPRO GRAMMAR CURRICULUM REMEDIATION ENGINE           ');
  console.log('================================================================');
  console.log(`Execution Mode: ${isApply ? '🚀 LIVE DATABASE APPLY (--apply)' : '🔍 DRY-RUN PREVIEW (--dry)'}\n`);

  console.log('[1/4] Fetching all 25 grammar lessons from Supabase...');
  const { data: lessons, error: fetchErr } = await sb
    .from('grammar_lessons')
    .select('id, topic_id, title, order_index, theory_vi, theory, sections, examples, exercises')
    .order('order_index');

  if (fetchErr || !lessons) {
    console.error('[FATAL] Failed to fetch grammar_lessons:', fetchErr);
    process.exit(1);
  }

  console.log(`Successfully fetched ${lessons.length} lessons from Supabase.\n`);

  // Snapshot before
  const beforeReport = verifyLessons(lessons);
  console.log('[2/4] Initial Database State (Before Remediation):');
  console.log(`  - Leaked Stems:           ${beforeReport.leakedStems.length}`);
  console.log(`  - Unwinnable MCQs:        ${beforeReport.unwinnableMcqs.length}`);
  console.log(`  - Duplicate MCQ Options:  ${beforeReport.duplicateOptions.length}`);
  console.log(`  - Missing Explanations:   ${beforeReport.missingExplanations.length}`);
  console.log(`  - Isolated Cloze Gaps:    ${beforeReport.isolatedClozeGaps.length}`);
  console.log(`  - LaTeX Math in Theory:   ${beforeReport.latexMathIssues.length}\n`);

  // Save backup
  const backupPath = path.resolve(process.cwd(), 'tmp/pre_remediation_backup.json');
  fs.mkdirSync(path.dirname(backupPath), { recursive: true });
  fs.writeFileSync(backupPath, JSON.stringify(lessons, null, 2), 'utf8');
  console.log(`Saved pre-remediation backup to: ${backupPath}\n`);

  console.log('[3/4] Processing surgical remediations across lessons...');
  const modifiedLessons: Array<{ id: string; order_index: number; title: string; exercises: ExerciseItem[]; theory_vi: string | null; theory: string | null }> = [];

  for (const l of lessons) {
    const { exercises, theory_vi, theory, modified } = remediateLesson(l);
    if (modified) {
      modifiedLessons.push({
        id: l.id,
        order_index: l.order_index,
        title: l.title,
        exercises,
        theory_vi,
        theory
      });
      console.log(`  ✓ Buổi ${l.order_index} (${l.title}): Remediated (New Ex Count: ${exercises.length})`);
    }
  }

  console.log(`\nTotal lessons modified: ${modifiedLessons.length} of ${lessons.length}`);

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 5, initialDelayMs = 1500): Promise<T> {
  let lastErr: unknown;
  let delay = initialDelayMs;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      console.warn(`  [WARN] Supabase call failed (attempt ${attempt}/${maxRetries}): ${(err as Error)?.message || err}. Retrying in ${delay}ms...`);
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 1.5;
      }
    }
  }
  throw lastErr;
}

  if (isApply) {
    console.log('\nApplying updates to Supabase database...');
    for (const item of modifiedLessons) {
      await withRetry(async () => {
        const { error: updateErr } = await sb
          .from('grammar_lessons')
          .update({
            exercises: item.exercises,
            theory_vi: item.theory_vi,
            theory: item.theory
          })
          .eq('id', item.id);

        if (updateErr) {
          throw updateErr;
        }
      });
      console.log(`  ✓ Updated Buổi ${item.order_index} [id: ${item.id}] successfully.`);
      // Small pause between row updates to prevent socket exhaustion / rate-limiting
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    console.log('\n[4/4] Verifying against LIVE Supabase database after migration...');
    const updatedLessons = await withRetry(async () => {
      const { data, error: verifyFetchErr } = await sb
        .from('grammar_lessons')
        .select('id, topic_id, title, order_index, theory_vi, theory, sections, examples, exercises')
        .order('order_index');

      if (verifyFetchErr || !data) {
        throw verifyFetchErr || new Error('No lessons returned');
      }
      return data;
    });

    const afterReport = verifyLessons(updatedLessons);
    console.log('\n================================================================');
    console.log('              POST-MIGRATION VERIFICATION AUDIT                 ');
    console.log('================================================================');
    console.log(`  - Leaked Stems:           ${afterReport.leakedStems.length} (Target: 0)`);
    console.log(`  - Unwinnable MCQs:        ${afterReport.unwinnableMcqs.length} (Target: 0)`);
    console.log(`  - Duplicate MCQ Options:  ${afterReport.duplicateOptions.length} (Target: 0)`);
    console.log(`  - Missing Explanations:   ${afterReport.missingExplanations.length} (Target: 0)`);
    console.log(`  - Isolated Cloze Gaps:    ${afterReport.isolatedClozeGaps.length} (Target: 0)`);
    console.log(`  - LaTeX Math in Theory:   ${afterReport.latexMathIssues.length} (Target: 0)`);

    const hasFailures =
      afterReport.leakedStems.length > 0 ||
      afterReport.unwinnableMcqs.length > 0 ||
      afterReport.duplicateOptions.length > 0 ||
      afterReport.missingExplanations.length > 0 ||
      afterReport.isolatedClozeGaps.length > 0 ||
      afterReport.latexMathIssues.length > 0;

    if (hasFailures) {
      console.error('\n❌ [FAIL] Verification detected remaining issues in database!');
      process.exit(1);
    } else {
      console.log('\n✅ [PASS] All 54+ defects remediated. 100% clean and verified against Supabase!');
    }
  } else {
    // In dry-run mode, verify in-memory transformed list
    console.log('\n[4/4] Verifying in-memory transformed lessons (Dry-Run Mode)...');
    const dryLessons = lessons.map(l => {
      const match = modifiedLessons.find(m => m.id === l.id);
      if (match) {
        return { ...l, exercises: match.exercises, theory_vi: match.theory_vi, theory: match.theory };
      }
      return l;
    });

    const dryReport = verifyLessons(dryLessons);
    console.log('\n================================================================');
    console.log('                 DRY-RUN VERIFICATION AUDIT                     ');
    console.log('================================================================');
    console.log(`  - Leaked Stems:           ${dryReport.leakedStems.length} (Target: 0)`);
    console.log(`  - Unwinnable MCQs:        ${dryReport.unwinnableMcqs.length} (Target: 0)`);
    console.log(`  - Duplicate MCQ Options:  ${dryReport.duplicateOptions.length} (Target: 0)`);
    console.log(`  - Missing Explanations:   ${dryReport.missingExplanations.length} (Target: 0)`);
    console.log(`  - Isolated Cloze Gaps:    ${dryReport.isolatedClozeGaps.length} (Target: 0)`);
    console.log(`  - LaTeX Math in Theory:   ${dryReport.latexMathIssues.length} (Target: 0)`);
    console.log('\nRun with `--apply` to commit these changes to the Supabase database.');
  }
}

main().catch(err => {
  console.error('[FATAL ERROR]', err);
  process.exit(1);
});
