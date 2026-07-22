/**
 * Gold lesson packs A0 core — hand-authored, not mass-API.
 * Shape: { title, theory_vi, sections, examples, seed_exercises }
 */

/** @typedef {import('../../src/lib/supabase').GrammarSections} GrammarSections */

function ex(en, vi, note) {
  return { en, vi, note };
}
function mcq(q, opts, answer, fb, case_id) {
  return { type: 'mcq', q, opts, answer, fb, case_id };
}
function fill(q, opts, answer, fb, case_id) {
  return { type: 'fill', q, opts, answer, fb, case_id };
}
function err(q, opts, answer, fb, case_id) {
  return { type: 'error', q, opts, answer, fb, case_id };
}
function tf(q, answer, fb, case_id) {
  return { type: 'tf', q, answer, fb, case_id };
}

export const GOLD_A0 = {
  'personal-pronouns': {
    title: 'Đại từ nhân xưng',
    theory_vi: `**Đại từ nhân xưng** thay cho người/vật: **I/you/he/she/it/we/they** (chủ ngữ) và **me/you/him/her/it/us/them** (tân ngữ).

## Bảng
| Chủ ngữ (S) | Tân ngữ (O) |
| I | me |
| you | you |
| he | him |
| she | her |
| it | it |
| we | us |
| they | them |

## Lỗi VN
- ❌ Me am student → ✅ I am a student
- ❌ Give I the book → ✅ Give me the book`,
    sections: {
      definition:
        '**Personal pronouns** thay thế danh từ chỉ người/vật. Có **chủ ngữ (Subject)** và **tân ngữ (Object)** — tiếng Việt không đổi hình → hay nhầm *I/me*.',
      usage: [
        { icon: '👤', label: 'Chủ ngữ (S)', en: 'She likes music.', vi: 'Đứng trước động từ chính.' },
        { icon: '🎯', label: 'Tân ngữ (O)', en: 'I like her.', vi: 'Sau động từ / giới từ.' },
        { icon: '🔄', label: 'Đổi theo ngôi', en: 'He → him · We → us', vi: 'Học theo cặp.' },
        { icon: '⚠️', label: 'Bẫy VN', en: 'Me am tired. ✗', vi: 'Không dùng me làm chủ ngữ.' },
      ],
      formula: {
        rows: [
          { 'Chủ ngữ (S)': 'I', 'Tân ngữ (O)': 'me', 'Ví dụ': 'I see him. · He sees me.' },
          { 'Chủ ngữ (S)': 'you', 'Tân ngữ (O)': 'you', 'Ví dụ': 'You help me. · I help you.' },
          { 'Chủ ngữ (S)': 'he', 'Tân ngữ (O)': 'him', 'Ví dụ': 'He sees me. · I see him.' },
          { 'Chủ ngữ (S)': 'she', 'Tân ngữ (O)': 'her', 'Ví dụ': 'She helps us. · I help her.' },
          { 'Chủ ngữ (S)': 'it', 'Tân ngữ (O)': 'it', 'Ví dụ': 'It is a cat. · I like it.' },
          { 'Chủ ngữ (S)': 'we', 'Tân ngữ (O)': 'us', 'Ví dụ': 'We live here. · Come with us.' },
          { 'Chủ ngữ (S)': 'they', 'Tân ngữ (O)': 'them', 'Ví dụ': 'They are students. · I know them.' },
        ],
        note: 'Sau giới từ (with/for/to/from) luôn dùng **tân ngữ (Object)**: with me, for him, to us.',
      },
      rules: [
        { case: 'Chủ ngữ (Subject)', rule: 'trước V', example: 'I / he / they work' },
        { case: 'Tân ngữ sau động từ', rule: 'sau V', example: 'help me · see them · call him' },
        { case: 'Tân ngữ sau giới từ', rule: 'sau giới từ', example: 'for her · with us · between you and me' },
        { case: 'it', rule: 'vật / động vật / tình huống', example: 'It is cold. · Look at it.' },
      ],
      signals: ['I/me', 'he/him', 'she/her', 'we/us', 'they/them'],
      mistakes: [
        { wrong: 'Me am a student.', right: 'I am a student.', why: 'me không làm chủ ngữ' },
        { wrong: 'Give I the pen.', right: 'Give me the pen.', why: 'sau V dùng object' },
        { wrong: 'Between you and I', right: 'Between you and me', why: 'sau giới từ = object' },
        { wrong: 'Her is my sister.', right: 'She is my sister.', why: 'her là object' },
        { wrong: 'I like they.', right: 'I like them.', why: 'they = subject; them = object' },
        { wrong: 'Him is my friend.', right: 'He is my friend.', why: 'him không làm chủ ngữ' },
        { wrong: 'This is for I.', right: 'This is for me.', why: 'sau for = object' },
      ],
      tips: 'Hỏi: “Ai làm?” → Subject (I/he/she…). “Ai nhận?” / sau giới từ → Object (me/him/her…).',
      comparison: '**I vs me:** I work (S) · Call me (O). **She vs her:** She runs · I know her.',
    },
    examples: [
      ex('I am a student.', 'Tôi là học sinh.', 'I = S'),
      ex('She likes music.', 'Cô ấy thích nhạc.', 'she = S'),
      ex('They live near us.', 'Họ sống gần chúng tôi.', 'they=S · us=O'),
      ex('Can you help me?', 'Bạn giúp tôi được không?', 'you=S · me=O'),
      ex('He sent her an email.', 'Anh ấy gửi email cho cô ấy.', 'he=S · her=O'),
      ex('Come with us.', 'Đi với chúng tôi.', 'us sau giới từ'),
      ex('I know them.', 'Tôi biết họ.', 'them = O'),
      ex('It is raining.', 'Trời đang mưa.', 'it = tình huống'),
      ex('This book is for him.', 'Cuốn sách này cho anh ấy.', 'him sau for'),
      ex('We see you every day.', 'Chúng tôi gặp bạn mỗi ngày.', 'we=S · you=O'),
      ex('Tell them the truth.', 'Nói sự thật với họ.', 'them = O'),
      ex('Between you and me, it is hard.', 'Giữa chúng ta, việc này khó.', 'me sau between'),
    ],
    seed_exercises: [
      mcq('Chọn chủ ngữ đúng: ___ am happy.', ['Me', 'I', 'My'], 'I', 'I = subject', 'subj'),
      mcq('Chọn tân ngữ đúng: Call ___.', ['I', 'me', 'my'], 'me', 'sau V = object', 'obj'),
      mcq('___ is my brother. (he/him)', ['He', 'Him'], 'He', 'subject', 'subj'),
      fill('Give ___ the book. (she/her)', ['her', 'she'], 'her', 'object', 'obj'),
      err('Sửa: Me and Tom are friends.', ['Tom and I are friends.', 'I and Tom is friends.', 'Me and Tom is friends.'], 'Tom and I are friends.', 'I = subject; lịch sự đưa mình sau', 'subj'),
      tf('"Them" can be a subject.', false, 'them = object', 'obj'),
      mcq('This gift is for ___.', ['we', 'us', 'I'], 'us', 'sau for = object', 'obj'),
      fill('___ like pizza. (They/Them)', ['They', 'Them'], 'They', 'subject', 'subj'),
      mcq('I sit between Tom and ___.', ['I', 'me'], 'me', 'sau between', 'obj'),
      err('Sửa: Her is tired.', ['She is tired.', 'Her are tired.', 'Hers is tired.'], 'She is tired.', 'she = subject', 'subj'),
      mcq('Look at ___. (it/its)', ['it', 'its'], 'it', 'object pronoun', 'obj'),
      fill('Help ___, please. (we/us)', ['us', 'we'], 'us', 'object', 'obj'),
      mcq('I know ___. (they/them)', ['they', 'them'], 'them', 'object after V', 'obj'),
      fill('This is for ___. (I/me)', ['me', 'I'], 'me', 'object after for', 'obj'),
      mcq('___ are students. (We/Us)', ['We', 'Us'], 'We', 'subject', 'subj'),
      err('Sửa: Him is my friend.', ['He is my friend.', 'Him are my friend.', 'His is my friend.'], 'He is my friend.', 'him ≠ subject', 'subj'),
    ],
  },

  'verb-to-be': {
    title: 'Động từ to be (am / is / are)',
    theory_vi: `**To be** hiện tại: **am / is / are** — nói *là ai, như thế nào, ở đâu, bao nhiêu tuổi…*
**Không** dùng do/does với to be.

| Subject | + | − | ? |
| I | am | am not | Am I…? |
| he/she/it | is | is not (isn't) | Is he…? |
| you/we/they | are | are not (aren't) | Are you…? |`,
    sections: {
      definition:
        '**To be (am/is/are)** = động từ *là / thì / ở*. Dùng cho danh tính, tính chất, cảm xúc, vị trí, tuổi, quốc tịch. Tự tạo phủ định (*not*) và câu hỏi (đảo to be) — **không** cần *do/does*.',
      usage: [
        { icon: '👤', label: 'Danh tính / nghề', en: 'I am a student.', vi: 'Là ai / nghề gì.' },
        { icon: '😊', label: 'Tính chất / cảm xúc', en: 'She is happy. · It is cold.', vi: 'Như thế nào.' },
        { icon: '📍', label: 'Vị trí', en: 'The keys are on the table.', vi: 'Ở đâu.' },
        { icon: '🎂', label: 'Tuổi / quốc tịch', en: 'He is 10. · They are Vietnamese.', vi: 'Số tuổi, nguồn gốc.' },
      ],
      formula: {
        rows: [
          { 'Chủ ngữ': 'I', '+': 'am', '−': "am not", '?': 'Am I …?' },
          { 'Chủ ngữ': 'he / she / it', '+': 'is', '−': "is not / isn't", '?': 'Is he/she/it …?' },
          { 'Chủ ngữ': 'you / we / they', '+': 'are', '−': "are not / aren't", '?': 'Are you/we/they …?' },
        ],
        note: 'Khẳng định: S + am/is/are + … · Phủ định: S + am/is/are + not · Hỏi: Am/Is/Are + S + …?',
      },
      rules: [
        { case: 'I', rule: '→ am', example: 'I am ready.' },
        { case: 'he/she/it / danh từ số ít', rule: '→ is', example: 'She is a teacher. · The book is new.' },
        { case: 'you/we/they / danh từ số nhiều', rule: '→ are', example: 'You are kind. · The books are new.' },
        { case: 'Phủ định', rule: 'be + not', example: "He isn't here. · They aren't ready." },
        { case: 'Nghi vấn', rule: 'Be + S …?', example: 'Are you OK? · Is it late?' },
        { case: 'Trả lời ngắn', rule: 'Yes, S + be / No, S + be + not', example: "Yes, I am. · No, she isn't." },
      ],
      signals: ['am', 'is', 'are', "isn't", "aren't", 'Am/Is/Are …?'],
      mistakes: [
        { wrong: 'I is a student.', right: 'I am a student.', why: 'I → am' },
        { wrong: 'They is happy.', right: 'They are happy.', why: 'they → are' },
        { wrong: 'She not is tired.', right: "She is not tired. / She isn't tired.", why: 'not sau be' },
        { wrong: 'Do you are ready?', right: 'Are you ready?', why: 'to be không dùng do' },
        { wrong: 'He student.', right: 'He is a student.', why: 'cần to be' },
        { wrong: 'Is you OK?', right: 'Are you OK?', why: 'you → are' },
      ],
      tips: 'Nhớ 3 ô: **I am · one is · many are**. Hỏi = đảo be lên đầu. Phủ định = be + not. Đừng thêm do/does.',
      comparison:
        '**To be vs Present Simple action:** *She is a doctor* (be) vs *She works* (V). Câu hỏi be: *Is she…?* · Câu hỏi V: *Does she work?*',
      timeline: {
        caption: 'To be — hiện tại',
        points: [
          { label: 'Now', note: 'am/is/are' },
          { label: 'Past (sau)', note: 'was/were' },
        ],
      },
    },
    examples: [
      ex('I am a student.', 'Tôi là học sinh.', 'I + am'),
      ex('She is happy.', 'Cô ấy vui.', 'she + is'),
      ex('They are my friends.', 'Họ là bạn tôi.', 'they + are'),
      ex('The keys are on the table.', 'Chìa khóa ở trên bàn.', 'plural N + are'),
      ex("He isn't at home.", 'Anh ấy không ở nhà.', 'is + not'),
      ex("We aren't ready.", 'Chúng tôi chưa sẵn sàng.', "aren't"),
      ex('Are you a teacher?', 'Bạn có phải giáo viên không?', 'Are + you'),
      ex('Is it cold today?', 'Hôm nay có lạnh không?', 'Is + it'),
      ex('Yes, I am. / No, I am not.', 'Có. / Không.', 'short answers'),
      ex('My name is Linh.', 'Tên tôi là Linh.', 'is + name'),
      ex('This book is new.', 'Cuốn sách này mới.', 'singular N + is'),
      ex('Those shoes are expensive.', 'Đôi giày đó đắt.', 'plural + are'),
      ex('I am 15 years old.', 'Tôi 15 tuổi.', 'age'),
      ex('They are Vietnamese.', 'Họ là người Việt.', 'nationality'),
    ],
    seed_exercises: [
      mcq('I ___ a student.', ['am', 'is', 'are'], 'am', 'I → am', 'I_am'),
      mcq('She ___ tired.', ['am', 'is', 'are'], 'is', 'she → is', 'she_is'),
      mcq('They ___ at school.', ['am', 'is', 'are'], 'are', 'they → are', 'they_are'),
      mcq('___ you ready?', ['Am', 'Is', 'Are'], 'Are', 'you → Are', 'Q'),
      fill('He ___ not here. (is/are)', ['is', 'are'], 'is', 'he → is', 'neg'),
      err('Sửa: Do you are happy?', ['Are you happy?', 'Do you is happy?', 'You are happy?'], 'Are you happy?', 'không dùng do với be', 'Q'),
      err('Sửa: I is fine.', ['I am fine.', 'I are fine.', 'Me is fine.'], 'I am fine.', 'I → am', 'I_am'),
      tf('We use "do" with to be in questions.', false, 'to be tự đảo', 'Q'),
      mcq('The books ___ on the desk.', ['is', 'are', 'am'], 'are', 'plural N → are', 'they_are'),
      mcq('___ she a doctor?', ['Am', 'Is', 'Are'], 'Is', 'she → Is', 'Q'),
      fill('I ___ not hungry. (am/is)', ['am', 'is'], 'am', 'I → am', 'neg'),
      mcq("They ___ students. (short: aren't)", ["isn't", "aren't", "am not"], "aren't", 'they → are + not', 'neg'),
      err('Sửa: She not is at home.', ["She isn't at home.", 'She not at home.', 'She does not is at home.'], "She isn't at home.", 'not sau is', 'neg'),
      mcq('My brother ___ 12 years old.', ['am', 'is', 'are'], 'is', 'singular → is', 'she_is'),
      mcq("Are you ready? — Yes, ___.", ['I am', 'I is', 'I are'], 'I am', 'short answer', 'short'),
      fill('Where ___ she? (is/are)', ['is', 'are'], 'is', 'Wh- + be', 'Q'),
      mcq('It ___ cold today.', ['am', 'is', 'are'], 'is', 'weather it is', 'it_is'),
      mcq("They ___ at home. (negative short)", ["isn't", "aren't", "am not"], "aren't", 'they + are + not', 'neg'),
    ],
  },

  'present-simple': {
    title: 'Thì Hiện tại đơn',
    theory_vi: `**Present Simple** = thói quen, sự thật, lịch trình.
- I/you/we/they + V
- he/she/it + V-s/es
- Phủ định: don't / doesn't + V (nguyên thể)
- Hỏi: Do / Does + S + V?

## Lỗi
- ❌ He go → ✅ He goes
- ❌ She doesn't goes → ✅ She doesn't go`,
    sections: {
      definition:
        '**Present Simple** diễn tả **thói quen**, **sự thật**, **lịch trình cố định**, và một số **trạng thái** (like, want, know). Không phải “đang xảy ra ngay lúc nói” (cái đó là Present Continuous).',
      usage: [
        { icon: '🔁', label: 'Thói quen', en: 'I drink coffee every morning.', vi: 'always / usually / every day…' },
        { icon: '🌍', label: 'Sự thật', en: 'The sun rises in the east.', vi: 'chân lý / fact' },
        { icon: '🕐', label: 'Lịch trình', en: 'The bus leaves at 7.', vi: 'thời gian biểu' },
        { icon: '💭', label: 'Trạng thái / sở thích', en: 'She likes English. · I have a cat.', vi: 'stative verbs' },
      ],
      formula: {
        rows: [
          { 'Dạng': '+ I/you/we/they', 'Cấu trúc': 'S + V', 'Ví dụ': 'I work. · They play.' },
          { 'Dạng': '+ he/she/it', 'Cấu trúc': 'S + V-s/es', 'Ví dụ': 'She works. · He watches.' },
          { 'Dạng': '− I/you/we/they', 'Cấu trúc': "S + don't + V", 'Ví dụ': "I don't work." },
          { 'Dạng': '− he/she/it', 'Cấu trúc': "S + doesn't + V", 'Ví dụ': "She doesn't work." },
          { 'Dạng': '? I/you/we/they', 'Cấu trúc': 'Do + S + V?', 'Ví dụ': 'Do you work?' },
          { 'Dạng': '? he/she/it', 'Cấu trúc': 'Does + S + V?', 'Ví dụ': 'Does she work?' },
        ],
        note: "Sau don't/doesn't/Do/Does: động từ **về nguyên thể** (không -s).",
      },
      rules: [
        { case: 'he/she/it + s', rule: 'thêm -s', example: 'play → plays · like → likes' },
        { case: 'ch/sh/s/x/o + es', rule: 'thêm -es', example: 'watch → watches · go → goes · do → does' },
        { case: 'consonant + y', rule: 'y → ies', example: 'study → studies · fly → flies' },
        { case: 'vowel + y', rule: 'chỉ + s', example: 'play → plays · buy → buys' },
        { case: "don't/doesn't", rule: 'V nguyên thể', example: "He doesn't go. (not doesn't goes)" },
        { case: 'Does…?', rule: 'V nguyên thể', example: 'Does she like tea?' },
      ],
      signals: ['always', 'usually', 'often', 'every day', 'on Mondays', 'sometimes', 'never'],
      mistakes: [
        { wrong: 'He go to school.', right: 'He goes to school.', why: 'he/she/it + -s' },
        { wrong: "She doesn't goes.", right: "She doesn't go.", why: "doesn't + V nguyên thể" },
        { wrong: 'Does he works?', right: 'Does he work?', why: 'Does + V nguyên thể' },
        { wrong: 'I works here.', right: 'I work here.', why: 'I không thêm -s' },
        { wrong: 'She studys English.', right: 'She studies English.', why: 'consonant+y → ies' },
      ],
      tips: '2 hộp: **I/you/we/they = V** · **he/she/it = V-s**. Gặp do/does → xóa -s trên V chính.',
      comparison:
        '**Present Simple vs Continuous:** *I work every day* (thói quen) · *I am working now* (đang xảy ra). **To be** không dùng do: *Is she…?* không *Does she is…?*',
      timeline: {
        caption: 'Present Simple — thói quen / sự thật (không gắn 1 điểm “now”)',
        points: [
          { label: 'Past', note: '—' },
          { label: 'Usually', note: 'habits' },
          { label: 'Future schedule', note: 'timetable' },
        ],
      },
    },
    examples: [
      ex('I work every day.', 'Tôi làm việc mỗi ngày.', 'I + V'),
      ex('She teaches English.', 'Cô ấy dạy tiếng Anh.', 'she + -s'),
      ex('He watches TV at night.', 'Anh ấy xem TV tối.', 'ch → es'),
      ex('She studies math.', 'Cô ấy học toán.', 'y → ies'),
      ex('They play football.', 'Họ chơi bóng đá.', 'they + V'),
      ex("I don't like coffee.", 'Tôi không thích cà phê.', "don't + V"),
      ex("He doesn't go out on Mondays.", 'Thứ Hai anh ấy không ra ngoài.', "doesn't + V"),
      ex('Do you live here?', 'Bạn sống ở đây chứ?', 'Do + S + V'),
      ex('Does she work?', 'Cô ấy có làm việc không?', 'Does + S + V'),
      ex('The bus leaves at 7 a.m.', 'Xe buýt rời lúc 7h.', 'timetable'),
      ex('Water boils at 100°C.', 'Nước sôi ở 100°C.', 'fact'),
      ex('She always gets up early.', 'Cô ấy luôn dậy sớm.', 'frequency'),
      ex('My parents live in Hue.', 'Bố mẹ tôi sống ở Huế.', 'plural + V'),
      ex("It doesn't rain much here.", 'Ở đây ít mưa.', 'it + doesn\'t'),
    ],
    seed_exercises: [
      mcq('She ___ English. (teach)', ['teach', 'teaches', 'teaching'], 'teaches', 'she + -es', 's_form'),
      mcq('I ___ to school. (go)', ['go', 'goes', 'going'], 'go', 'I + V', 'base'),
      mcq("He doesn't ___ coffee. (like)", ['likes', 'like', 'liking'], 'like', "doesn't + V", 'neg'),
      fill('___ you live here? (Do/Does)', ['Do', 'Does'], 'Do', 'you → Do', 'Q'),
      fill('___ she work? (Do/Does)', ['Does', 'Do'], 'Does', 'she → Does', 'Q'),
      err('Sửa: He go every day.', ['He goes every day.', 'He going every day.', 'He is go every day.'], 'He goes every day.', 'he + -s', 's_form'),
      err("Sửa: She doesn't goes.", ["She doesn't go.", "She don't go.", "She doesn't goes not."], "She doesn't go.", "doesn't + V", 'neg'),
      tf('After "does", the verb takes -s.', false, 'Does + V nguyên thể', 'Q'),
      mcq('study → he/she form?', ['studys', 'studies', 'study'], 'studies', 'y→ies', 'spell'),
      mcq('watch → he/she form?', ['watchs', 'watches', 'watch'], 'watches', '+es', 'spell'),
      fill('They ___ (not/play) tennis.', ["don't play", "doesn't play"], "don't play", 'they + don\'t', 'neg'),
      mcq('The train ___ at 9. (leave)', ['leave', 'leaves', 'leaving'], 'leaves', 'timetable + -s', 's_form'),
      err('Sửa: Does he works here?', ['Does he work here?', 'Do he work here?', 'Does he working here?'], 'Does he work here?', 'Does + V', 'Q'),
      mcq('I ___ breakfast at 7. (have)', ['has', 'have', 'haves'], 'have', 'I + V', 'base'),
      fill("She ___ (not/like) tea.", ["doesn't like", "don't like"], "doesn't like", "doesn't + V", 'neg'),
      mcq('Does he work? — Yes, he ___.', ['do', 'does', 'is'], 'does', 'short answer', 'short'),
      mcq('She ___ always late.', ['is', 'works', 'work', 'are'], 'is', 'be + adj: is late (not works late)', 'be'),
      mcq('She ___ hard every day.', ['works', 'work', 'working'], 'works', 'habit he/she + V-s', 's_form'),
      err('Sửa: I am work every day.', ['I work every day.', 'I am working every day.', 'I works every day.'], 'I work every day.', 'habit → Simple, not continuous', 'contrast'),
    ],
  },

  'present-continuous': {
    title: 'Thì Hiện tại tiếp diễn',
    theory_vi: `**Present Continuous** = đang xảy ra (now) / kế hoạch gần đã sắp xếp.
'Dạng': **am/is/are + V-ing**

## Spelling -ing
- make → making (bỏ e)
- run → running (gấp phụ âm)
- play → playing (giữ y)

## Khác Present Simple
- I work every day. (thói quen)
- I am working now. (đang làm)`,
    sections: {
      definition:
        '**Present Continuous (am/is/are + V-ing)** = hành động **đang diễn ra** lúc nói, tạm thời, hoặc **kế hoạch tương lai đã sắp** (tonight, tomorrow).',
      usage: [
        { icon: '⏱️', label: 'Now / at the moment', en: 'I am studying now.', vi: 'Đang xảy ra.' },
        { icon: '📅', label: 'Kế hoạch đã arrange', en: 'I am meeting Tom tomorrow.', vi: 'future arrangement' },
        { icon: '🔄', label: 'Tạm thời', en: 'She is living in Da Nang this month.', vi: 'không phải vĩnh viễn' },
        { icon: '🚫', label: 'Hiếm với stative', en: 'I know (not am knowing)', vi: 'know/like/want thường Simple' },
      ],
      formula: {
        rows: [
          { 'Dạng': '+', 'Cấu trúc': 'S + am/is/are + V-ing', 'Ví dụ': 'She is reading.' },
          { 'Dạng': '−', 'Cấu trúc': "S + am/is/are + not + V-ing", 'Ví dụ': "He isn't sleeping." },
          { 'Dạng': '?', 'Cấu trúc': 'Am/Is/Are + S + V-ing?', 'Ví dụ': 'Are you working?' },
        ],
        note: 'Be chia theo chủ ngữ; V luôn -ing.',
      },
      rules: [
        { case: 'most verbs', rule: '+ ing', example: 'play → playing' },
        { case: 'e câm', rule: 'bỏ e + ing', example: 'make → making · write → writing' },
        { case: 'CVC stress', rule: 'gấp phụ âm', example: 'run → running · sit → sitting' },
        { case: 'ie', rule: 'ie → ying', example: 'lie → lying' },
        { case: 'I', rule: 'am + V-ing', example: 'I am eating.' },
        { case: 'he/she/it', rule: 'is + V-ing', example: 'She is eating.' },
        { case: 'you/we/they', rule: 'are + V-ing', example: 'They are eating.' },
      ],
      signals: ['now', 'at the moment', 'Look!', 'Listen!', 'today', 'this week', 'tonight'],
      mistakes: [
        { wrong: 'She working now.', right: 'She is working now.', why: 'thiếu be' },
        { wrong: 'I am play football.', right: 'I am playing football.', why: 'cần -ing' },
        { wrong: 'He is runing.', right: 'He is running.', why: 'gấp n' },
        { wrong: 'I am know the answer.', right: 'I know the answer.', why: 'stative → Simple' },
        { wrong: 'Does she is working?', right: 'Is she working?', why: 'không do + be' },
      ],
      tips: 'Nhìn tín hiệu *now/Look!* → Continuous. Thói quen *every day* → Simple. Form luôn **be + V-ing**.',
      comparison:
        '**Simple:** habits/facts (*I work*). **Continuous:** happening now (*I am working*). Đừng trộn: *I am work* ✗ · *I working* ✗.',
      timeline: {
        caption: 'Continuous ôm lấy thời điểm “now”',
        points: [
          { label: 'Start', note: 'đã bắt đầu' },
          { label: 'NOW', note: 'đang diễn ra' },
          { label: 'End', note: 'chưa xong / sắp xong' },
        ],
      },
    },
    examples: [
      ex('I am studying English now.', 'Tôi đang học tiếng Anh.', 'now'),
      ex('She is cooking dinner.', 'Cô ấy đang nấu bữa tối.', 'is + V-ing'),
      ex('They are playing football.', 'Họ đang chơi bóng.', 'are + V-ing'),
      ex("He isn't sleeping.", 'Anh ấy không ngủ.', 'negative'),
      ex('Are you listening?', 'Bạn có đang nghe không?', 'question'),
      ex('Look! It is raining.', 'Nhìn kìa! Trời đang mưa.', 'Look!'),
      ex('I am meeting my teacher tomorrow.', 'Mai tôi gặp giáo viên.', 'arrangement'),
      ex('She is writing an email.', 'Cô ấy đang viết email.', 'bỏ e'),
      ex('He is running fast.', 'Anh ấy đang chạy nhanh.', 'gấp n'),
      ex('We are having lunch at the moment.', 'Chúng tôi đang ăn trưa.', 'at the moment'),
      ex("I'm not working this week.", 'Tuần này tôi không làm.', 'temporary'),
      ex('What are you doing?', 'Bạn đang làm gì?', 'Wh- + continuous'),
    ],
    seed_exercises: [
      mcq('She ___ now. (work)', ['works', 'is working', 'working'], 'is working', 'be + V-ing', 'form'),
      mcq('I ___ TV at the moment. (watch)', ['watch', 'am watching', 'watches'], 'am watching', 'I + am', 'form'),
      fill('They ___ (not/play) now.', ["aren't playing", "don't play"], "aren't playing", 'continuous neg', 'neg'),
      mcq('run → -ing?', ['runing', 'running', 'runeing'], 'running', 'gấp n', 'spell'),
      mcq('make → -ing?', ['makeing', 'making', 'makking'], 'making', 'bỏ e', 'spell'),
      err('Sửa: She working now.', ['She is working now.', 'She works now.', 'She is work now.'], 'She is working now.', 'thiếu is', 'form'),
      err('Sửa: I am know him.', ['I know him.', 'I am knowing him.', 'I knows him.'], 'I know him.', 'stative', 'stative'),
      tf('We use "do" with Present Continuous questions.', false, 'đảo be', 'Q'),
      mcq('___ you listening?', ['Do', 'Are', 'Is'], 'Are', 'Are + S + V-ing', 'Q'),
      fill('He ___ (write) an email now.', ['is writing', 'writes'], 'is writing', 'now → continuous', 'form'),
      mcq('Every day I ___ coffee. (drink)', ['am drinking', 'drink', 'drinks'], 'drink', 'habit → Simple', 'contrast'),
      mcq('Look! The bus ___. (come)', ['comes', 'is coming', 'come'], 'is coming', 'Look! → Cont', 'contrast'),
      mcq('sit → -ing?', ['siting', 'sitting', 'siteing'], 'sitting', 'gấp t', 'spell'),
      fill('I ___ (not/work) at the moment.', ["am not working", "don't work"], 'am not working', 'now → Cont neg', 'neg'),
      err('Sửa: She working now.', ['She is working now.', 'She works now.', 'She is work now.'], 'She is working now.', 'thiếu is', 'form'),
    ],
  },

  'past-simple': {
    title: 'Thì Quá khứ đơn',
    theory_vi: `**Past Simple** = việc đã xảy ra và **kết thúc** trong quá khứ.
- Regular: V + **-ed** (work → worked)
- Irregular: học thuộc (go → went, have → had)
- be: **was / were**
- Phủ định: didn't + V · Hỏi: Did + S + V?`,
    sections: {
      definition:
        '**Past Simple** nói về hành động/sự việc **đã xảy ra và chấm dứt** trong quá khứ (yesterday, last week, in 2020).',
      usage: [
        { icon: '📅', label: 'Thời điểm quá khứ', en: 'I visited Hue last year.', vi: 'yesterday / last… / ago' },
        { icon: '✅', label: 'Chuỗi việc đã xong', en: 'I woke up, ate, and left.', vi: 'kể chuyện quá khứ' },
        { icon: '👤', label: 'be trong quá khứ', en: 'I was tired. · They were at home.', vi: 'was/were' },
      ],
      formula: {
        rows: [
          { 'Dạng': '+ có quy tắc (V-ed)', 'Cấu trúc': 'S + V-ed', 'Ví dụ': 'I worked yesterday.' },
          { 'Dạng': '+ bất quy tắc (V2)', 'Cấu trúc': 'S + V2', 'Ví dụ': 'She went home.' },
          { 'Dạng': '+ be', 'Cấu trúc': 'S + was/were', 'Ví dụ': 'He was happy. · We were late.' },
          { 'Dạng': '−', 'Cấu trúc': "S + didn't + V", 'Ví dụ': "I didn't go." },
          { 'Dạng': '?', 'Cấu trúc': 'Did + S + V?', 'Ví dụ': 'Did you see it?' },
        ],
        note: "Sau didn't / Did: động từ **nguyên thể** (không V-ed/V2).",
      },
      rules: [
        { case: 'regular +ed', rule: 'work→worked · play→played', example: 'wanted · cleaned' },
        { case: 'e + d', rule: 'like→liked', example: 'lived · used' },
        { case: 'consonant+y', rule: 'y→ied', example: 'study→studied' },
        { case: 'CVC short', rule: 'gấp phụ âm + ed', example: 'stop→stopped' },
        { case: 'I/he/she/it be', rule: 'was', example: 'I was · She was' },
        { case: 'you/we/they be', rule: 'were', example: 'You were · They were' },
        { case: 'high-freq irregular', rule: 'học list', example: 'go→went · have→had · see→saw · do→did · eat→ate · get→got · make→made · come→came' },
      ],
      signals: ['yesterday', 'last night/week/year', 'ago', 'in 2019', 'when I was young'],
      mistakes: [
        { wrong: 'I did went.', right: 'I went. / I did go. (nhấn mạnh)', why: "didn't/Did + V nguyên thể; khẳng định thường chỉ V2" },
        { wrong: "She didn't went.", right: "She didn't go.", why: "didn't + V" },
        { wrong: 'Did you went?', right: 'Did you go?', why: 'Did + V' },
        { wrong: 'I was go home.', right: 'I went home.', why: 'không was + V1' },
        { wrong: 'They was happy.', right: 'They were happy.', why: 'they → were' },
      ],
      tips: 'Có mốc quá khứ rõ (*yesterday*) → Past Simple. Regular = -ed. Irregular = list. did/didn\'t → V nguyên thể.',
      comparison:
        '**Past Simple:** đã xong (*I ate*). **Present Perfect (A2+):** liên hệ hiện tại (*I have eaten*). Beginner: nắm Past Simple trước.',
      timeline: {
        caption: 'Past Simple = xong trong quá khứ',
        points: [
          { label: 'PAST', note: 'happened' },
          { label: 'X', note: 'finished' },
          { label: 'NOW', note: 'không còn diễn ra' },
        ],
      },
    },
    examples: [
      ex('I visited my grandma yesterday.', 'Hôm qua tôi thăm bà.', 'regular -ed'),
      ex('She studied English last night.', 'Tối qua cô ấy học tiếng Anh.', 'y→ied'),
      ex('He stopped the car.', 'Anh ấy dừng xe.', 'gấp p'),
      ex('I went to school.', 'Tôi đã đến trường.', 'go→went'),
      ex('They had breakfast at 7.', 'Họ ăn sáng lúc 7h.', 'have→had'),
      ex('She saw a movie.', 'Cô ấy xem phim.', 'see→saw'),
      ex('I was tired.', 'Tôi mệt.', 'was'),
      ex('They were at home.', 'Họ ở nhà.', 'were'),
      ex("I didn't go out.", 'Tôi không ra ngoài.', "didn't + V"),
      ex('Did you finish your homework?', 'Bạn làm xong bài chưa?', 'Did + V'),
      ex('We ate pho yesterday.', 'Hôm qua chúng tôi ăn phở.', 'eat→ate'),
      ex('He got up early.', 'Anh ấy dậy sớm.', 'get→got'),
      ex('I made a cake.', 'Tôi làm bánh.', 'make→made'),
      ex('She came late.', 'Cô ấy đến muộn.', 'come→came'),
    ],
    seed_exercises: [
      mcq('I ___ TV yesterday. (watch)', ['watch', 'watched', 'watching'], 'watched', '+ed', 'reg'),
      mcq('She ___ to Hue last year. (go)', ['go', 'goes', 'went'], 'went', 'irregular', 'irreg'),
      mcq("He didn't ___ the email. (send)", ['sent', 'send', 'sends'], 'send', "didn't + V", 'neg'),
      fill('___ you see that? (Did/Do)', ['Did', 'Do'], 'Did', 'past Q', 'Q'),
      mcq('They ___ happy yesterday. (be)', ['was', 'were', 'are'], 'were', 'they → were', 'be'),
      mcq('I ___ late. (be)', ['was', 'were', 'am'], 'was', 'I → was', 'be'),
      err("Sửa: She didn't went home.", ["She didn't go home.", 'She didn\'t gone home.', 'She not went home.'], "She didn't go home.", "didn't + V", 'neg'),
      err('Sửa: Did you ate pho?', ['Did you eat pho?', 'Did you eaten pho?', 'Do you ate pho?'], 'Did you eat pho?', 'Did + V', 'Q'),
      tf('After "did", we use the past form of the verb.', false, 'Did + V1', 'Q'),
      mcq('study → past?', ['studyed', 'studied', 'studyd'], 'studied', 'y→ied', 'reg'),
      mcq('stop → past?', ['stoped', 'stopped', 'stopt'], 'stopped', 'gấp p', 'reg'),
      fill('He ___ (have) a cold last week.', ['had', 'haved'], 'had', 'irregular', 'irreg'),
      mcq('We ___ dinner at 6. (eat)', ['eated', 'ate', 'eaten'], 'ate', 'eat→ate', 'irreg'),
      err('Sửa: They was at school.', ['They were at school.', 'They is at school.', 'They be at school.'], 'They were at school.', 'they → were', 'be'),
      mcq('They ___ happy yesterday. (was/were)', ['was', 'were'], 'were', 'they → were', 'be'),
      fill('___ she at home last night? (Was/Were)', ['Was', 'Were'], 'Was', 'she → Was', 'be_Q'),
      mcq("He ___ at school. (negative be)", ["wasn't", "weren't", "didn't"], "wasn't", 'he → was + not', 'be_neg'),
      fill('I ___ (see) a movie last week.', ['saw', 'seed'], 'saw', 'see→saw', 'irreg'),
      mcq('buy → past?', ['buyed', 'bought', 'buys'], 'bought', 'irregular', 'irreg'),
    ],
  },

  demonstratives: {
    title: 'Từ chỉ định (this/that/these/those)',
    theory_vi: `**Demonstratives** chỉ người/vật gần–xa, số ít–nhiều:

| Số | Gần (near) | Xa (far) |
| --- | --- | --- |
| Số ít | **this** | **that** |
| Số nhiều | **these** | **those** |

+ be: **This is…** · **These are…**  
Có thể đứng một mình: I like this. / Look at those.  
**that day/year** = thời điểm xa (không chỉ khoảng cách vật lý).`,
    sections: {
      definition:
        '**This / that / these / those** = từ chỉ định. Chọn theo **khoảng cách** (gần/xa) và **số** (ít/nhiều). Tiếng Việt dùng “này/đó/kia” — không đổi theo số → hay nhầm *this/these*.',
      usage: [
        { icon: '👆', label: 'this = gần + số ít', en: 'This book is new.', vi: 'Đang cầm / gần người nói.' },
        { icon: '👉', label: 'that = xa + số ít', en: 'That car is expensive.', vi: 'Xa hơn / chỉ sang chỗ khác.' },
        { icon: '👇', label: 'these = gần + số nhiều', en: 'These shoes are nice.', vi: 'Nhiều + gần.' },
        { icon: '👉👉', label: 'those = xa + số nhiều', en: 'Those people are teachers.', vi: 'Nhiều + xa.' },
        { icon: '📅', label: 'that + time', en: 'That day was special.', vi: 'Thời điểm đã qua / xa.' },
      ],
      formula: {
        rows: [
          { Word: 'this', Number: 'singular', Distance: 'near', 'With be': 'This is a pen.' },
          { Word: 'that', Number: 'singular', Distance: 'far / past time', 'With be': 'That is a car. · That day was fun.' },
          { Word: 'these', Number: 'plural', Distance: 'near', 'With be': 'These are pens.' },
          { Word: 'those', Number: 'plural', Distance: 'far', 'With be': 'Those are cars.' },
        ],
        note: 'this/that + N singular (+ is) · these/those + N plural (+ are). Không dùng this/these cho thời tiết (→ It is cold).',
      },
      rules: [
        { case: 'this + N', rule: 'số ít gần', example: 'this phone · this room' },
        { case: 'that + N', rule: 'số ít xa', example: 'that building' },
        { case: 'that + time', rule: 'thời điểm xa', example: 'that day · that year · that morning' },
        { case: 'these + N', rule: 'số nhiều gần', example: 'these keys · these apples' },
        { case: 'those + N', rule: 'số nhiều xa', example: 'those mountains' },
        { case: 'this/that + is', rule: 'số ít + is', example: 'This is my bag.' },
        { case: 'these/those + are', rule: 'số nhiều + are', example: 'These are my bags.' },
        { case: 'pronoun alone', rule: 'không cần N', example: 'I like this. · Look at those. · this one' },
      ],
      signals: ['here', 'there', 'near me', 'over there', 'Look!'],
      mistakes: [
        { wrong: 'This books are new.', right: 'These books are new.', why: 'books = plural → these' },
        { wrong: 'These is my pen.', right: 'This is my pen.', why: 'pen = singular → this + is' },
        { wrong: 'That are my friends.', right: 'Those are my friends.', why: 'friends = plural → those + are' },
        { wrong: 'I like this shoes.', right: 'I like these shoes.', why: 'shoes = plural' },
        { wrong: 'Those is a school.', right: 'That is a school.', why: 'school = singular → that + is' },
      ],
      tips: 'Checklist: (1) một hay nhiều? (2) gần hay xa? → this/that/these/those. Nhớ: **these/those + are**.',
      comparison:
        '**this vs these:** one near vs many near. **that vs those:** one far vs many far. **the** = đã xác định, không nói “gần/xa”.',
    },
    examples: [
      ex('This is my phone.', 'Đây là điện thoại của tôi.', 'this + is'),
      ex('That is her house.', 'Kia là nhà cô ấy.', 'that + is'),
      ex('These are my keys.', 'Đây là chìa khóa của tôi.', 'these + are'),
      ex('Those are tall buildings.', 'Kia là những tòa nhà cao.', 'those + are'),
      ex('I like this song.', 'Tôi thích bài hát này.', 'this + N'),
      ex('Look at that bird.', 'Nhìn con chim kia.', 'that + N'),
      ex('Can I try these shoes?', 'Tôi thử đôi giày này được không?', 'these + plural'),
      ex('Who are those people?', 'Những người kia là ai?', 'those + plural'),
      ex('This book is interesting.', 'Cuốn sách này hay.', 'this + N + is'),
      ex('These books are heavy.', 'Những cuốn sách này nặng.', 'these + N + are'),
      ex('I want that one.', 'Tôi muốn cái kia.', 'that pronoun'),
      ex('Give me these, please.', 'Cho tôi những cái này.', 'these alone'),
    ],
    seed_exercises: [
      mcq('___ is my bag. (gần, 1 cái)', ['This', 'These', 'Those'], 'This', 'sg near', 'this'),
      mcq('___ are my bags. (gần, nhiều)', ['This', 'These', 'That'], 'These', 'pl near', 'these'),
      mcq('___ car over there is red.', ['This', 'That', 'These'], 'That', 'sg far', 'that'),
      mcq('___ people over there are teachers.', ['This', 'That', 'Those'], 'Those', 'pl far', 'those'),
      fill('___ is a pen. (This/These)', ['This', 'These'], 'This', 'sg + is', 'this'),
      fill('___ are pens. (This/These)', ['These', 'This'], 'These', 'pl + are', 'these'),
      err('Find the error: This books are new.', ['These books are new.', 'This book are new.', 'These book is new.'], 'These books are new.', 'plural → these', 'these'),
      err('Find the error: Those is my friend.', ['That is my friend.', 'Those are my friend.', 'This are my friend.'], 'That is my friend.', 'sg → that + is', 'that'),
      tf('We say "These is my keys."', false, 'These are…', 'these'),
      mcq('I like ___ shoes. (gần, plural)', ['this', 'that', 'these'], 'these', 'pl near', 'these'),
      mcq('___ day was special. (thời điểm xa)', ['This', 'That', 'These'], 'That', 'that + time', 'that_time'),
      fill('Look at ___ birds in the sky. (those/this)', ['those', 'this'], 'those', 'pl far', 'those'),
      fill('These ___ my keys. (is/are)', ['are', 'is'], 'are', 'these + are', 'agr'),
      fill('This ___ my pen. (is/are)', ['is', 'are'], 'is', 'this + is', 'agr'),
      fill('Those ___ my friends. (is/are)', ['are', 'is'], 'are', 'those + are', 'agr'),
      err('Find the error: These is my apple.', ['This is my apple.', 'These are my apple.', 'Those is my apple.'], 'This is my apple.', 'apple sg → this is', 'this'),
      mcq('Choose: near me + many books', ['this book', 'these books', 'that book'], 'these books', 'pl near', 'these'),
      tf('"That" is used with plural nouns.', false, 'that = singular', 'that'),
      mcq('___ apples here are fresh. (near)', ['That', 'These', 'This'], 'These', 'pl near → these', 'these'),
      mcq('___ mountain over there is high.', ['This', 'That', 'These'], 'That', 'sg far', 'that'),
      fill('I want ___ one, not that one. (this/these)', ['this', 'these'], 'this', 'sg', 'this'),
      tf('We use "This is cold today" for weather.', false, 'Weather: It is cold (not This is cold)', 'weather'),
    ],
  },

  possessives: {
    title: 'Tính từ & đại từ sở hữu',
    theory_vi: `**Possessive adjectives** đứng trước N: my/your/his/her/its/our/their + N  
**Possessive pronouns** đứng một mình: mine/yours/his/hers/ours/theirs (không + N)

's : Tom's bag · the girl's name  
Không: it's = it is (khác its) `,
    sections: {
      definition:
        '**Sở hữu:** (1) **tính từ sở hữu** (*my book*) — luôn + danh từ; (2) **đại từ sở hữu** (*mine*) — không + danh từ; (3) **\'s** với người/động vật (*Linh\'s phone*).',
      usage: [
        { icon: '📎', label: 'Adj + N', en: 'This is my bag.', vi: 'my/your/his/her/its/our/their + N' },
        { icon: '🔄', label: 'Pronoun alone', en: 'This bag is mine.', vi: 'mine/yours/his/hers/ours/theirs' },
        { icon: '👤', label: "'s ownership", en: "Tom's car · my sister's room", vi: 'người/động vật + \'s' },
        { icon: '⚠️', label: "its vs it's", en: "The dog wagged its tail. · It's late.", vi: "its = sở hữu; it's = it is" },
      ],
      formula: {
        rows: [
          { 'Chủ ngữ': 'I', 'Tính từ sở hữu': 'my + N', 'Đại từ sở hữu': 'mine', 'Ví dụ': 'my book · The book is mine.' },
          { 'Chủ ngữ': 'you', 'Tính từ sở hữu': 'your + N', 'Đại từ sở hữu': 'yours', 'Ví dụ': 'your pen · It is yours.' },
          { 'Chủ ngữ': 'he', 'Tính từ sở hữu': 'his + N', 'Đại từ sở hữu': 'his', 'Ví dụ': 'his phone · It is his.' },
          { 'Chủ ngữ': 'she', 'Tính từ sở hữu': 'her + N', 'Đại từ sở hữu': 'hers', 'Ví dụ': 'her bag · It is hers.' },
          { 'Chủ ngữ': 'it', 'Tính từ sở hữu': 'its + N', 'Đại từ sở hữu': '—', 'Ví dụ': 'its name (rarely alone)' },
          { 'Chủ ngữ': 'we', 'Tính từ sở hữu': 'our + N', 'Đại từ sở hữu': 'ours', 'Ví dụ': 'our house · It is ours.' },
          { 'Chủ ngữ': 'they', 'Tính từ sở hữu': 'their + N', 'Đại từ sở hữu': 'theirs', 'Ví dụ': 'their keys · They are theirs.' },
          { 'Chủ ngữ': "name + 's", 'Tính từ sở hữu': "Tom's + N", 'Đại từ sở hữu': '—', 'Ví dụ': "Tom's car · Linh's bag" },
          { 'Chủ ngữ': "plural -s'", 'Tính từ sở hữu': "girls' / parents' + N", 'Đại từ sở hữu': '—', 'Ví dụ': "the girls' room · my parents' car" },
        ],
        note: "Không nói *mine book*. Có N → adj (my). Không N → pronoun (mine). its = sở hữu; it's = it is. their ≠ there ≠ they're.",
      },
      rules: [
        { case: 'possessive adj', rule: 'ALWAYS + noun', example: 'my/your/his/her/its/our/their + N' },
        { case: 'possessive pronoun', rule: 'NO noun after', example: 'mine/yours/his/hers/ours/theirs' },
        { case: "singular 's", rule: "name + 's", example: "Linh's bag · the boy's bike" },
        { case: "plural -s'", rule: "plural N + '", example: "the girls' room · my parents' car" },
        { case: "its", rule: 'ownership (no apostrophe)', example: 'The cat cleaned its fur.' },
        { case: "it's", rule: 'it is / it has', example: "It's cold. · It's got a name." },
      ],
      signals: ['my', 'your', 'his', 'her', 'its', 'our', 'their', 'mine', 'yours', "'s"],
      mistakes: [
        { wrong: 'This is mine book.', right: 'This is my book. / This book is mine.', why: 'mine không + N' },
        { wrong: 'This is her\'s bag.', right: 'This is her bag. / This bag is hers.', why: 'her + N; hers alone' },
        { wrong: "The dog wagged it's tail.", right: 'The dog wagged its tail.', why: "its = sở hữu" },
        { wrong: "Toms car", right: "Tom's car", why: "cần 's" },
        { wrong: 'Their is a book on the table.', right: 'There is a book… / Their book is…', why: 'their ≠ there' },
        { wrong: 'This is your.', right: 'This is yours.', why: 'pronoun = yours' },
      ],
      tips: 'Có danh từ sau không? **Có → my/your…** · **Không → mine/yours…**. its = sở hữu; it\'s = it is.',
      comparison:
        "**my vs mine:** my bag / The bag is mine. **her vs hers:** her phone / It is hers. **'s vs of:** person's name (Tom's) vs of the city (the name of the city).",
    },
    examples: [
      ex('This is my book.', 'Đây là sách của tôi.', 'my + N'),
      ex('This book is mine.', 'Cuốn sách này là của tôi.', 'mine alone'),
      ex('Is this your phone?', 'Đây có phải điện thoại bạn không?', 'your + N'),
      ex('Yes, it is mine. / Is this yours? — Yes, it is.', 'Của tôi. / Của bạn à? — Đúng.', 'mine / yours đúng ngôi'),
      ex("That is Tom's bag.", 'Kia là túi của Tom.', "'s"),
      ex('Her name is Mai.', 'Tên cô ấy là Mai.', 'her + N'),
      ex('The red bag is hers.', 'Túi đỏ là của cô ấy.', 'hers'),
      ex('Our school is big.', 'Trường chúng tôi lớn.', 'our + N'),
      ex('This classroom is ours.', 'Lớp này là của chúng tôi.', 'ours'),
      ex('Their house is near the park.', 'Nhà họ gần công viên.', 'their + N'),
      ex('The keys are theirs.', 'Chìa khóa là của họ.', 'theirs'),
      ex('The dog wagged its tail.', 'Con chó vẫy đuôi.', 'its'),
      ex("It's a sunny day.", 'Hôm nay trời nắng.', "it's = it is"),
      ex("My parents' car is new.", 'Xe bố mẹ tôi mới.', "plural '"),
    ],
    seed_exercises: [
      mcq('This is ___ book. (I)', ['I', 'my', 'mine'], 'my', 'adj + N', 'adj'),
      mcq('This book is ___. (I)', ['my', 'mine', 'me'], 'mine', 'pronoun alone', 'pron'),
      mcq("___ name is Linh. (She)", ['She', 'Her', 'Hers'], 'Her', 'her + N', 'adj'),
      fill('The bag is ___. (she → hers/her)', ['hers', 'her'], 'hers', 'no N', 'pron'),
      err("Find the error: This is mine pen.", ['This is my pen.', 'This is mine pens.', 'This pen is my.'], 'This is my pen.', 'mine ≠ +N', 'adj'),
      err("Find the error: The cat washed it's face.", ["The cat washed its face.", "The cat washed it face.", "The cat washed its' face."], 'The cat washed its face.', "its ownership", 'its'),
      mcq("___ car is red. (Tom)", ["Toms", "Tom's", 'Tom'], "Tom's", "'s", 'apos'),
      tf('We can say "yours book".', false, 'your book / yours', 'adj'),
      fill('Is this ___? (you → your/yours)', ['yours', 'your'], 'yours', 'alone', 'pron'),
      mcq('This house is ___. (we)', ['our', 'ours', 'us'], 'ours', 'pronoun', 'pron'),
      mcq('___ keys are on the table. (they)', ['They', 'Their', 'Theirs'], 'Their', 'adj + N', 'adj'),
      err('Find the error: This is her\'s.', ["This is hers.", "This is her.", "This is she's."], 'This is hers.', "hers no 's", 'pron'),
      mcq("The ___ room is tidy. (girls plural)", ["girl's", "girls'", 'girls'], "girls'", "plural possessive", 'apos'),
      tf('"Its" means "it is".', false, "it's = it is; its = ownership", 'its'),
      fill('That phone is ___. (he)', ['his', 'him'], 'his', 'pronoun his', 'pron'),
      mcq('I like ___ teacher. (we)', ['us', 'our', 'ours'], 'our', 'adj + N', 'adj'),
      fill('The dog wagged ___ tail. (its/it\'s)', ['its', "it's"], 'its', 'ownership its', 'its'),
      fill("___ raining. (It's/Its)", ["It's", 'Its'], "It's", "it's = it is", 'its'),
      mcq('___ is a book on the table. (There/Their/They\'re)', ['There', 'Their', "They're"], 'There', 'there is existence', 'there'),
      mcq("My ___ car is new. (parents)", ["parent's", "parents'", 'parents'], "parents'", 'plural possessive', 'apos'),
    ],
  },

  'there-is-there-are': {
    title: 'There is / There are',
    theory_vi: `**There is** + singular / uncountable  
**There are** + plural  

- There is a book. · There is some water.  
- There are two chairs.  
- Phủ định: There isn't / There aren't  
- Hỏi: Is there…? / Are there…?`,
    sections: {
      definition:
        '**There is / There are** giới thiệu **sự tồn tại** (có cái gì ở đâu), không dịch word-by-word “Ở đó là”. Chọn **is/are** theo danh từ **đi sau**.',
      usage: [
        { icon: '1️⃣', label: 'There is + singular', en: 'There is a cat in the room.', vi: '1 vật đếm được.' },
        { icon: '🌊', label: 'There is + U', en: 'There is some milk.', vi: 'uncountable → is' },
        { icon: '🔢', label: 'There are + plural', en: 'There are three windows.', vi: 'số nhiều.' },
        { icon: '📍', label: 'Nơi chốn', en: 'There is a park near my house.', vi: 'hay + place phrase' },
      ],
      formula: {
        rows: [
          { 'Dạng': '+ số ít / U', 'Cấu trúc': 'There is + N…', 'Ví dụ': 'There is a book. · There is water.' },
          { 'Dạng': '+ số nhiều', 'Cấu trúc': 'There are + N…', 'Ví dụ': 'There are two books.' },
          { 'Dạng': '− singular / U', 'Cấu trúc': "There isn't / is not…", 'Ví dụ': "There isn't a pen." },
          { 'Dạng': '− plural', 'Cấu trúc': "There aren't / are not…", 'Ví dụ': "There aren't any chairs." },
          { 'Dạng': '? số ít / U', 'Cấu trúc': 'Is there …?', 'Ví dụ': 'Is there a bank near here?' },
          { 'Dạng': '? số nhiều', 'Cấu trúc': 'Are there …?', 'Ví dụ': 'Are there any questions?' },
        ],
        note: 'Nhìn **danh từ sau** to be. some/any thường đi kèm. Short: Yes, there is. / No, there aren\'t.',
      },
      rules: [
        { case: 'a/an + singular', rule: 'There is', example: 'There is an apple.' },
        { case: 'plural / many', rule: 'There are', example: 'There are many students.' },
        { case: 'uncountable', rule: 'There is', example: 'There is rice on the table.' },
        { case: 'any (neg/Q)', rule: "isn't/aren't + any · Is/Are there any…?", example: "There aren't any eggs." },
        { case: 'short answers', rule: 'Yes, there is/are. No, there isn\'t/aren\'t.', example: 'Yes, there is.' },
      ],
      signals: ['there is', 'there are', 'near here', 'in the room', 'any', 'some'],
      mistakes: [
        { wrong: 'There have a book.', right: 'There is a book.', why: 'không dùng have trong cấu trúc này' },
        { wrong: 'There is two cats.', right: 'There are two cats.', why: 'plural → are' },
        { wrong: 'There are a book.', right: 'There is a book.', why: 'singular → is' },
        { wrong: 'Is there many people?', right: 'Are there many people?', why: 'people = plural' },
        { wrong: 'There is any milk? (wrong word order)', right: 'Is there any milk?', why: 'đảo is' },
        { wrong: 'Has there a park?', right: 'Is there a park?', why: 'Is there, not Has there (A0)' },
      ],
      tips: 'Hỏi: danh từ sau là **1 / U** → is; **nhiều** → are. Đừng dịch “Ở đó có” rồi dùng *have*.',
      comparison:
        '**There is a book** (tồn tại) vs **The book is on the table** (vị trí của vật đã biết). **Have got:** I have a book (sở hữu) ≠ There is a book (có/xuất hiện trong không gian).',
    },
    examples: [
      ex('There is a book on the desk.', 'Có một cuốn sách trên bàn.', 'is + singular'),
      ex('There are two chairs.', 'Có hai cái ghế.', 'are + plural'),
      ex('There is some water in the bottle.', 'Có một ít nước trong chai.', 'is + U'),
      ex("There isn't a supermarket here.", 'Ở đây không có siêu thị.', "isn't"),
      ex("There aren't any cookies left.", 'Không còn bánh quy.', "aren't + any"),
      ex('Is there a bank near here?', 'Gần đây có ngân hàng không?', 'Is there'),
      ex('Are there any questions?', 'Có câu hỏi nào không?', 'Are there'),
      ex('Yes, there is. / No, there isn\'t.', 'Có. / Không.', 'short answers'),
      ex('There is a park next to my school.', 'Có công viên cạnh trường.', 'place'),
      ex('There are many students in the class.', 'Có nhiều học sinh trong lớp.', 'many + pl'),
      ex('There is a lot of homework today.', 'Hôm nay có nhiều bài tập.', 'U + is'),
      ex('There were three apples yesterday.', 'Hôm qua có 3 quả táo.', 'past (preview A1)'),
    ],
    seed_exercises: [
      mcq('There ___ a book on the table.', ['is', 'are', 'am'], 'is', 'singular', 'is'),
      mcq('There ___ two books on the table.', ['is', 'are', 'am'], 'are', 'plural', 'are'),
      mcq('There ___ some milk in the fridge.', ['is', 'are'], 'is', 'U → is', 'is_U'),
      fill("There ___ any chairs. (aren't/isn't)", ["aren't", "isn't"], "aren't", 'plural neg', 'neg'),
      mcq('___ there a park near here?', ['Is', 'Are', 'Do'], 'Is', 'Is there + sg', 'Q'),
      mcq('___ there any apples?', ['Is', 'Are', 'Does'], 'Are', 'Are there + pl', 'Q'),
      err('Find the error: There have a cat.', ['There is a cat.', 'There are a cat.', 'There has a cat.'], 'There is a cat.', 'no have', 'form'),
      err('Find the error: There is three windows.', ['There are three windows.', 'There is three window.', 'There be three windows.'], 'There are three windows.', 'plural → are', 'are'),
      tf('We say "There are a book."', false, 'singular → There is', 'is'),
      fill('There ___ a lot of rice. (is/are)', ['is', 'are'], 'is', 'U', 'is_U'),
      mcq("There ___ any water. (negative)", ["isn't", "aren't", "don't"], "isn't", 'U neg', 'neg'),
      mcq('Are there any cookies? — Yes, ___.', ['there is', 'there are', 'they are'], 'there are', 'short answer pl', 'short'),
      mcq('Is there a park? — Yes, ___.', ['there is', 'there are', 'it is'], 'there is', 'short answer sg', 'short'),
      mcq("Are there any eggs? — No, ___.", ["there isn't", "there aren't", "they aren't"], "there aren't", 'short neg pl', 'short'),
      err('Find the error: Is there many people?', ['Are there many people?', 'Is there much people?', 'Are there much people?'], 'Are there many people?', 'people plural', 'Q'),
      mcq('There ___ an orange on the plate.', ['is', 'are'], 'is', 'an + singular', 'is'),
      fill('___ there any milk? (Is/Are)', ['Is', 'Are'], 'Is', 'U question', 'Q'),
      tf('"There is some water" is correct.', true, 'U + is + some', 'is_U'),
      mcq('Room: two windows. Choose:', ['I have two windows in the room.', 'There are two windows in the room.', 'There is two windows in the room.'], 'There are two windows in the room.', 'existence not possession', 'vs_have'),
      mcq('I own a book. Choose best:', ["I've got a book.", 'There is a book (my ownership).', 'There are a book.'], "I've got a book.", 'ownership = have got', 'vs_have'),
    ],
  },

  'have-got': {
    title: 'Have got / has got',
    theory_vi: `**have got / has got** = có, sở hữu (British rất phổ biến).
- I/you/we/they **have got**
- he/she/it **has got**
- Phủ định: haven't got / hasn't got
- Hỏi: Have/Has + S + got…?

Cùng nghĩa gần với **have/has** (I have a car).`,
    sections: {
      definition:
        '**Have got / has got** diễn tả **sở hữu**, quan hệ gia đình, đặc điểm (mắt/tóc), bệnh nhẹ. Phổ biến trong tiếng Anh Anh. Nghĩa gần *have/has*.',
      usage: [
        { icon: '🎒', label: 'Đồ vật sở hữu', en: "I've got a new phone.", vi: 'có cái gì' },
        { icon: '👨‍👩‍👧', label: 'Gia đình', en: "She's got two brothers.", vi: 'có anh chị em' },
        { icon: '👀', label: 'Đặc điểm', en: "He's got blue eyes.", vi: 'mắt/tóc…' },
        { icon: '🤒', label: 'Cảm/bệnh nhẹ', en: "I've got a headache.", vi: 'bị đau…' },
      ],
      formula: {
        rows: [
          { 'Chủ ngữ': 'I/you/we/they', '+': 'have got + N', '−': "haven't got + N", '?': 'Have + S + got + N?', 'Ví dụ': "I've got a bike." },
          { 'Chủ ngữ': 'he/she/it', '+': 'has got + N', '−': "hasn't got + N", '?': 'Has + S + got + N?', 'Ví dụ': "She's got a cat." },
          { 'Chủ ngữ': 'Trả lời ngắn', '+': 'Yes, I have. / Yes, she has.', '−': "No, I haven't. / No, he hasn't.", '?': '—', 'Ví dụ': "Have you got…? — Yes, I have. (no 'got')" },
        ],
        note: "Short answer không lặp got. AmE hay dùng have/has không got (Do you have…?). Không trộn Do + have got.",
      },
      rules: [
        { case: 'I/you/we/they', rule: 'have got', example: "I've got a bike." },
        { case: 'he/she/it', rule: 'has got', example: "She's got a cat." },
        { case: 'negative', rule: "haven't/hasn't got", example: "I haven't got time." },
        { case: 'question', rule: 'Have/Has + S + got…?', example: 'Have you got a pen?' },
        { case: 'short answer', rule: 'Yes, I have. / No, he hasn\'t.', example: 'Has she got a car? — Yes, she has.' },
        { case: 'vs have', rule: 'have got ≈ have (possession)', example: 'I have a car. = I\'ve got a car.' },
      ],
      signals: ["'ve got", "'s got", 'have you got', 'has she got', "haven't got"],
      mistakes: [
        { wrong: 'She have got a dog.', right: "She has got a dog. / She's got a dog.", why: 'she → has' },
        { wrong: 'I has got a pen.', right: "I have got a pen. / I've got a pen.", why: 'I → have' },
        { wrong: 'Have she got a car?', right: 'Has she got a car?', why: 'she → Has' },
        { wrong: "He haven't got money.", right: "He hasn't got money.", why: 'he → hasn\'t' },
        { wrong: 'I got a book. (present possession British)', right: "I've got a book.", why: 'cần have/has + got (possession now)' },
        { wrong: 'Do you have got a pen?', right: 'Have you got a pen? / Do you have a pen?', why: 'không trộn do + have got' },
      ],
      tips: "Nhớ 2 hàng: **I/you/we/they have got** · **he/she/it has got**. Hỏi = Have/Has lên đầu + got. Short answer: Yes, I **have** (không *got*).",
      comparison:
        "**have got (BrE)** ≈ **have (AmE)** cho sở hữu. **There is:** tồn tại trong không gian. **I've got a book** (tôi sở hữu) ≠ **There is a book** (có một cuốn ở đó).",
    },
    examples: [
      ex("I've got a new laptop.", 'Tôi có laptop mới.', 'I + have got'),
      ex("She's got two sisters.", 'Cô ấy có hai chị/em gái.', 'she + has got'),
      ex("We've got a small house.", 'Chúng tôi có nhà nhỏ.', 'we + have got'),
      ex("He hasn't got a bike.", 'Anh ấy không có xe đạp.', "hasn't got"),
      ex("They haven't got any milk.", 'Họ không có sữa.', "haven't got + any"),
      ex('Have you got a pen?', 'Bạn có bút không?', 'Have + got'),
      ex('Has she got blue eyes?', 'Cô ấy có mắt xanh không?', 'Has + got'),
      ex('Yes, I have. / No, I haven\'t.', 'Có. / Không.', 'short answers'),
      ex("I've got a headache.", 'Tôi bị đau đầu.', 'illness'),
      ex("The house has got a big garden.", 'Ngôi nhà có vườn lớn.', 'has got + place feature'),
      ex("I haven't got much time.", 'Tôi không có nhiều thời gian.', 'U'),
      ex("He's got short hair.", 'Anh ấy tóc ngắn.', 'appearance'),
    ],
    seed_exercises: [
      mcq("I ___ a new phone.", ["'ve got", "'s got", 'got'], "'ve got", 'I → have got', 'have'),
      mcq("She ___ two brothers.", ["'ve got", "'s got", 'have got'], "'s got", 'she → has got', 'has'),
      fill("He ___ got a car. (has/have)", ['has', 'have'], 'has', 'he → has', 'has'),
      mcq("I ___ got any money. (negative)", ["haven't", "hasn't", "don't"], "haven't", 'I → haven\'t', 'neg'),
      mcq('___ you got a minute?', ['Have', 'Has', 'Do'], 'Have', 'Have + S + got', 'Q'),
      mcq('___ she got a cat?', ['Have', 'Has', 'Does'], 'Has', 'Has + she + got', 'Q'),
      err('Find the error: She have got a dog.', ["She's got a dog.", 'She have a dog got.', 'She got have a dog.'], "She's got a dog.", 'she → has', 'has'),
      err('Find the error: Do you have got a pen?', ['Have you got a pen?', 'Do you got a pen?', 'Has you got a pen?'], 'Have you got a pen?', 'no do + have got', 'Q'),
      tf('After "has", we use "got" in "has got".', true, 'has got', 'has'),
      fill("They ___ got any questions. (haven't/hasn't)", ["haven't", "hasn't"], "haven't", 'they', 'neg'),
      mcq("Yes, she ___. (short answer to Has she got…?)", ['has', 'got', 'is'], 'has', 'short = has', 'short'),
      mcq("Have you got a pen? — Yes, I ___.", ['have', 'got', 'has'], 'have', 'short answer no got', 'short'),
      err("Find the error: I has got a bike.", ["I've got a bike.", 'I has a bike got.', 'I got a bike has.'], "I've got a bike.", 'I → have', 'have'),
      mcq('We ___ got a big garden.', ['has', 'have', 'is'], 'have', 'we → have got', 'have'),
      tf('"Have you got a pen?" means roughly the same as "Do you have a pen?"', true, 'possession', 'vs_have'),
      fill("It ___ got a long name. (has/have)", ['has', 'have'], 'has', 'it → has', 'has'),
      tf('We say "Yes, she got." as a short answer.', false, 'Yes, she has. (not got)', 'short'),
      err('Find the error (possession now): I got a pen.', ["I've got a pen.", 'I getting a pen.', 'I has got a pen.'], "I've got a pen.", 'need have/has + got', 'form'),
      mcq("She has ___ a headache.", ['got', 'get', 'getting'], 'got', 'has got', 'has'),
    ],
  },
};
