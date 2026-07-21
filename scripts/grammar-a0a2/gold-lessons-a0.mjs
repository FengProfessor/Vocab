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
          { 'Chủ ngữ (S)': 'I', 'Tân ngữ (O)': 'me', Ví_dụ: 'I see him. · He sees me.' },
          { 'Chủ ngữ (S)': 'you', 'Tân ngữ (O)': 'you', Ví_dụ: 'You help me. · I help you.' },
          { 'Chủ ngữ (S)': 'he', 'Tân ngữ (O)': 'him', Ví_dụ: 'He sees me. · I see him.' },
          { 'Chủ ngữ (S)': 'she', 'Tân ngữ (O)': 'her', Ví_dụ: 'She helps us. · I help her.' },
          { 'Chủ ngữ (S)': 'it', 'Tân ngữ (O)': 'it', Ví_dụ: 'It is a cat. · I like it.' },
          { 'Chủ ngữ (S)': 'we', 'Tân ngữ (O)': 'us', Ví_dụ: 'We live here. · Come with us.' },
          { 'Chủ ngữ (S)': 'they', 'Tân ngữ (O)': 'them', Ví_dụ: 'They are students. · I know them.' },
        ],
        note: 'Sau giới từ (with/for/to/from) luôn dùng **Object**: with me, for him, to us.',
      },
      rules: [
        { case: 'Subject', rule: 'trước V', example: 'I / he / they work' },
        { case: 'Object after V', rule: 'sau V', example: 'help me · see them · call him' },
        { case: 'Object after prep', rule: 'sau giới từ', example: 'for her · with us · between you and me' },
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
          { Subject: 'I', '+': 'am', '−': "am not", '?': 'Am I …?' },
          { Subject: 'he / she / it', '+': 'is', '−': "is not / isn't", '?': 'Is he/she/it …?' },
          { Subject: 'you / we / they', '+': 'are', '−': "are not / aren't", '?': 'Are you/we/they …?' },
        ],
        note: 'Khẳng định: S + am/is/are + … · Phủ định: S + am/is/are + not · Hỏi: Am/Is/Are + S + …?',
      },
      rules: [
        { case: 'I', rule: '→ am', example: 'I am ready.' },
        { case: 'he/she/it / singular N', rule: '→ is', example: 'She is a teacher. · The book is new.' },
        { case: 'you/we/they / plural N', rule: '→ are', example: 'You are kind. · The books are new.' },
        { case: 'Negative', rule: 'be + not', example: "He isn't here. · They aren't ready." },
        { case: 'Question', rule: 'Be + S …?', example: 'Are you OK? · Is it late?' },
        { case: 'Short answers', rule: 'Yes, S + be / No, S + be + not', example: "Yes, I am. · No, she isn't." },
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
          { Form: '+ I/you/we/they', Structure: 'S + V', Example: 'I work. · They play.' },
          { Form: '+ he/she/it', Structure: 'S + V-s/es', Example: 'She works. · He watches.' },
          { Form: '− I/you/we/they', Structure: "S + don't + V", Example: "I don't work." },
          { Form: '− he/she/it', Structure: "S + doesn't + V", Example: "She doesn't work." },
          { Form: '? I/you/we/they', Structure: 'Do + S + V?', Example: 'Do you work?' },
          { Form: '? he/she/it', Structure: 'Does + S + V?', Example: 'Does she work?' },
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
      mcq('She ___ always late. (be → Present Simple with be is different; action: work)', ['work', 'works', 'working'], 'works', 'habit he/she', 's_form'),
      err('Sửa: I am work every day.', ['I work every day.', 'I am working every day.', 'I works every day.'], 'I work every day.', 'habit → Simple, not continuous', 'contrast'),
    ],
  },

  'present-continuous': {
    title: 'Thì Hiện tại tiếp diễn',
    theory_vi: `**Present Continuous** = đang xảy ra (now) / kế hoạch gần đã sắp xếp.
Form: **am/is/are + V-ing**

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
          { Form: '+', Structure: 'S + am/is/are + V-ing', Example: 'She is reading.' },
          { Form: '−', Structure: "S + am/is/are + not + V-ing", Example: "He isn't sleeping." },
          { Form: '?', Structure: 'Am/Is/Are + S + V-ing?', Example: 'Are you working?' },
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
          { Form: '+ regular', Structure: 'S + V-ed', Example: 'I worked yesterday.' },
          { Form: '+ irregular', Structure: 'S + V2', Example: 'She went home.' },
          { Form: '+ be', Structure: 'S + was/were', Example: 'He was happy. · We were late.' },
          { Form: '−', Structure: "S + didn't + V", Example: "I didn't go." },
          { Form: '?', Structure: 'Did + S + V?', Example: 'Did you see it?' },
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
};
