/**
 * Wordbanks batch 2 — chủ đề A0–A1 còn thiếu / mỏng.
 * Header + ghi chú VI; ví dụ EN giữ để học.
 * Merge qua banksForSlug trong wordbanks-dense.mjs
 */

/** @typedef {{ title: string, icon?: string, note?: string, rows: Record<string,string>[] }} Bank */

// ─── personal-pronouns ──────────────────────────────────────────────────────

/** @type {Bank[]} */
export const PERSONAL_PRONOUN_BANKS = [
  {
    title: 'Đại từ nhân xưng · chủ ngữ ↔ tân ngữ (bảng đủ)',
    icon: '👤',
    note: 'Chủ ngữ đứng trước động từ. Tân ngữ đứng sau động từ / giới từ.',
    rows: [
      { 'Chủ ngữ': 'I', 'Tân ngữ': 'me', 'Nghĩa': 'tôi', 'Ví dụ': 'I see him. · Call me.' },
      { 'Chủ ngữ': 'you', 'Tân ngữ': 'you', 'Nghĩa': 'bạn / các bạn', 'Ví dụ': 'You help me. · I help you.' },
      { 'Chủ ngữ': 'he', 'Tân ngữ': 'him', 'Nghĩa': 'anh ấy', 'Ví dụ': 'He is tall. · I know him.' },
      { 'Chủ ngữ': 'she', 'Tân ngữ': 'her', 'Nghĩa': 'cô ấy', 'Ví dụ': 'She runs. · I like her.' },
      { 'Chủ ngữ': 'it', 'Tân ngữ': 'it', 'Nghĩa': 'nó (vật / tình huống)', 'Ví dụ': 'It is cold. · Look at it.' },
      { 'Chủ ngữ': 'we', 'Tân ngữ': 'us', 'Nghĩa': 'chúng tôi / ta', 'Ví dụ': 'We live here. · Come with us.' },
      { 'Chủ ngữ': 'they', 'Tân ngữ': 'them', 'Nghĩa': 'họ / chúng', 'Ví dụ': 'They are students. · I know them.' },
    ],
  },
  {
    title: 'Sau giới từ · luôn tân ngữ (bẫy đề)',
    icon: '🔗',
    note: 'for / with / to / from / between / about + **tân ngữ** (me, him, her…), không I/he/she.',
    rows: [
      { 'Giới từ': 'for', 'Đúng': 'for me / for him / for us', 'Sai hay gặp': 'for I · for he' },
      { 'Giới từ': 'with', 'Đúng': 'with her / with them', 'Sai hay gặp': 'with she · with they' },
      { 'Giới từ': 'to', 'Đúng': 'to me / to us', 'Sai hay gặp': 'to I' },
      { 'Giới từ': 'from', 'Đúng': 'from him / from them', 'Sai hay gặp': 'from he' },
      { 'Giới từ': 'between', 'Đúng': 'between you and me', 'Sai hay gặp': 'between you and I' },
      { 'Giới từ': 'about', 'Đúng': 'about her / about it', 'Sai hay gặp': 'about she' },
      { 'Giới từ': 'at', 'Đúng': 'look at me / look at them', 'Sai hay gặp': 'look at I' },
      { 'Giới từ': 'of', 'Đúng': 'proud of him', 'Sai hay gặp': 'proud of he' },
    ],
  },
  {
    title: 'Lỗi VN hay gặp · I/me she/her',
    icon: '⚠️',
    rows: [
      { Sai: 'Me am a student.', Đúng: 'I am a student.', 'Vì sao': 'me không làm chủ ngữ' },
      { Sai: 'Give I the pen.', Đúng: 'Give me the pen.', 'Vì sao': 'sau động từ = tân ngữ' },
      { Sai: 'Her is tired.', Đúng: 'She is tired.', 'Vì sao': 'her = tân ngữ / sở hữu' },
      { Sai: 'I like they.', Đúng: 'I like them.', 'Vì sao': 'they = chủ ngữ' },
      { Sai: 'Him is my friend.', Đúng: 'He is my friend.', 'Vì sao': 'him = tân ngữ' },
      { Sai: 'This is for I.', Đúng: 'This is for me.', 'Vì sao': 'sau for = tân ngữ' },
      { Sai: 'Me and Tom are friends.', Đúng: 'Tom and I are friends.', 'Vì sao': 'chủ ngữ = I; lịch sự để mình sau' },
      { Sai: 'Between you and I', Đúng: 'Between you and me', 'Vì sao': 'sau between = tân ngữ' },
    ],
  },
];

// ─── have-got ───────────────────────────────────────────────────────────────

/** @type {Bank[]} */
export const HAVE_GOT_BANKS = [
  {
    title: 'Have got / has got · bảng đầy đủ',
    icon: '🎒',
    note: 'have got = have (sở hữu). Rút gọn: I’ve got · She’s got. Phủ định: haven’t / hasn’t got.',
    rows: [
      { 'Chủ ngữ': 'I', 'Khẳng định (+)': "I have got / I've got", 'Phủ định (−)': "I have not got / haven't got", 'Nghi vấn (?)': 'Have I got …?' },
      { 'Chủ ngữ': 'you', 'Khẳng định (+)': "you have got / you've got", 'Phủ định (−)': "you haven't got", 'Nghi vấn (?)': 'Have you got …?' },
      { 'Chủ ngữ': 'we', 'Khẳng định (+)': "we have got / we've got", 'Phủ định (−)': "we haven't got", 'Nghi vấn (?)': 'Have we got …?' },
      { 'Chủ ngữ': 'they', 'Khẳng định (+)': "they have got / they've got", 'Phủ định (−)': "they haven't got", 'Nghi vấn (?)': 'Have they got …?' },
      { 'Chủ ngữ': 'he', 'Khẳng định (+)': "he has got / he's got", 'Phủ định (−)': "he hasn't got", 'Nghi vấn (?)': 'Has he got …?' },
      { 'Chủ ngữ': 'she', 'Khẳng định (+)': "she has got / she's got", 'Phủ định (−)': "she hasn't got", 'Nghi vấn (?)': 'Has she got …?' },
      { 'Chủ ngữ': 'it', 'Khẳng định (+)': "it has got / it's got", 'Phủ định (−)': "it hasn't got", 'Nghi vấn (?)': 'Has it got …?' },
    ],
  },
  {
    title: 'Have got vs have · short answers',
    icon: '💬',
    note: 'Trả lời ngắn: Yes, I have. / No, she hasn’t. — **không** lặp got.',
    rows: [
      { Câu: 'Have you got a pen?', 'Trả lời ngắn': "Yes, I have. / No, I haven't.", Ghi_chú: 'không Yes, I have got' },
      { Câu: 'Has she got a car?', 'Trả lời ngắn': "Yes, she has. / No, she hasn't.", Ghi_chú: 'has / hasn\'t' },
      { Câu: 'Have they got time?', 'Trả lời ngắn': "Yes, they have. / No, they haven't.", Ghi_chú: '—' },
      { Câu: "I've got two brothers.", 'Nghĩa': 'Tôi có hai anh/em trai.', Ghi_chú: 'sở hữu / gia đình' },
      { Câu: "She's got long hair.", 'Nghĩa': 'Cô ấy có tóc dài.', Ghi_chú: 'đặc điểm' },
      { Câu: "We haven't got any milk.", 'Nghĩa': 'Chúng tôi không có sữa.', Ghi_chú: 'any + phủ định' },
    ],
  },
  {
    title: 'Have got · lỗi hay gặp',
    icon: '⚠️',
    rows: [
      { Sai: 'He have got a bike.', Đúng: 'He has got a bike.', 'Vì sao': 'he/she/it → has' },
      { Sai: 'She haves got a cat.', Đúng: 'She has got a cat.', 'Vì sao': 'không haves' },
      { Sai: "Do you have got a pen?", Đúng: 'Have you got a pen? / Do you have a pen?', 'Vì sao': 'không trộn do + have got' },
      { Sai: "Yes, I have got.", Đúng: 'Yes, I have.', 'Vì sao': 'short answer không got' },
      { Sai: "I hasn't got time.", Đúng: "I haven't got time.", 'Vì sao': 'I → haven\'t' },
    ],
  },
];

// ─── wh-questions ───────────────────────────────────────────────────────────

/** @type {Bank[]} */
export const WH_QUESTION_BANKS = [
  {
    title: 'Từ để hỏi WH · nghĩa + ví dụ',
    icon: '❓',
    note: 'WH + trợ động từ + chủ ngữ + V…? Với to be: WH + am/is/are + S…?',
    rows: [
      { 'Từ hỏi': 'What', 'Hỏi về': 'cái gì / việc gì', 'Ví dụ': 'What is this? · What do you want?' },
      { 'Từ hỏi': 'Who', 'Hỏi về': 'ai (người)', 'Ví dụ': 'Who is she? · Who do you like?' },
      { 'Từ hỏi': 'Where', 'Hỏi về': 'ở đâu', 'Ví dụ': 'Where do you live? · Where is the bank?' },
      { 'Từ hỏi': 'When', 'Hỏi về': 'khi nào', 'Ví dụ': 'When is your birthday? · When do you study?' },
      { 'Từ hỏi': 'Why', 'Hỏi về': 'tại sao', 'Ví dụ': 'Why are you late? · Why do you study English?' },
      { 'Từ hỏi': 'How', 'Hỏi về': 'như thế nào / bằng cách nào', 'Ví dụ': 'How are you? · How do you go to school?' },
      { 'Từ hỏi': 'Which', 'Hỏi về': 'cái nào (lựa chọn)', 'Ví dụ': 'Which colour do you like?' },
      { 'Từ hỏi': 'Whose', 'Hỏi về': 'của ai', 'Ví dụ': 'Whose bag is this?' },
      { 'Từ hỏi': 'How old', 'Hỏi về': 'bao nhiêu tuổi', 'Ví dụ': 'How old are you?' },
      { 'Từ hỏi': 'How many', 'Hỏi về': 'bao nhiêu (C số nhiều)', 'Ví dụ': 'How many books do you have?' },
      { 'Từ hỏi': 'How much', 'Hỏi về': 'bao nhiêu (U / giá)', 'Ví dụ': 'How much water? · How much is it?' },
      { 'Từ hỏi': 'How often', 'Hỏi về': 'bao lâu một lần', 'Ví dụ': 'How often do you exercise?' },
      { 'Từ hỏi': 'How long', 'Hỏi về': 'bao lâu / dài bao nhiêu', 'Ví dụ': 'How long is the film?' },
      { 'Từ hỏi': 'How far', 'Hỏi về': 'bao xa', 'Ví dụ': 'How far is the station?' },
    ],
  },
  {
    title: 'Công thức hỏi · to be vs do/does/did',
    icon: '🧩',
    rows: [
      { 'Loại': 'To be hiện tại', 'Cấu trúc': 'WH + am/is/are + S + …?', 'Ví dụ': 'Where are you? · What is that?' },
      { 'Loại': 'Hiện tại đơn (I/you/we/they)', 'Cấu trúc': 'WH + do + S + V1 …?', 'Ví dụ': 'Where do you live?' },
      { 'Loại': 'Hiện tại đơn (he/she/it)', 'Cấu trúc': 'WH + does + S + V1 …?', 'Ví dụ': 'What does she want?' },
      { 'Loại': 'Quá khứ đơn', 'Cấu trúc': 'WH + did + S + V1 …?', 'Ví dụ': 'When did you arrive?' },
      { 'Loại': 'Who làm chủ ngữ', 'Cấu trúc': 'Who + V …? (không do/does)', 'Ví dụ': 'Who lives here? · Who broke it?' },
      { 'Loại': 'What/Which + N', 'Cấu trúc': 'What/Which + N + …?', 'Ví dụ': 'What colour is it? · Which bus…?' },
    ],
  },
  {
    title: 'WH · lỗi hay gặp',
    icon: '⚠️',
    rows: [
      { Sai: 'Where you live?', Đúng: 'Where do you live?', 'Vì sao': 'thiếu do' },
      { Sai: 'What she wants?', Đúng: 'What does she want?', 'Vì sao': 'does + V1 (không wants)' },
      { Sai: 'How many water…?', Đúng: 'How much water…?', 'Vì sao': 'water = U → much' },
      { Sai: 'How much books…?', Đúng: 'How many books…?', 'Vì sao': 'books = C → many' },
      { Sai: 'Why you are late?', Đúng: 'Why are you late?', 'Vì sao': 'đảo to be' },
      { Sai: 'Who does live here?', Đúng: 'Who lives here?', 'Vì sao': 'Who = chủ ngữ → không does' },
    ],
  },
];

// ─── present-continuous ─────────────────────────────────────────────────────

/** @type {Bank[]} */
export const PRESENT_CONTINUOUS_BANKS = [
  {
    title: 'Hiện tại tiếp diễn · am/is/are + V-ing',
    icon: '▶️',
    note: 'Đang xảy ra bây giờ / quanh hiện tại. Dấu hiệu: now, right now, at the moment, today, Look!, Listen!',
    rows: [
      { 'Chủ ngữ': 'I', 'Khẳng định (+)': 'am + V-ing', 'Phủ định (−)': "am not / I'm not + V-ing", 'Nghi vấn (?)': 'Am I + V-ing…?' },
      { 'Chủ ngữ': 'he / she / it', 'Khẳng định (+)': 'is + V-ing', 'Phủ định (−)': "isn't + V-ing", 'Nghi vấn (?)': 'Is he/she/it + V-ing…?' },
      { 'Chủ ngữ': 'you / we / they', 'Khẳng định (+)': 'are + V-ing', 'Phủ định (−)': "aren't + V-ing", 'Nghi vấn (?)': 'Are you/we/they + V-ing…?' },
    ],
  },
  {
    title: 'Chính tả V-ing (list dài)',
    icon: '✍️',
    note: 'Học theo rule: +ing · bỏ e +ing · gấp phụ âm · ie→y+ing.',
    rows: [
      { 'Quy tắc': '+ ing (thường)', 'V1': 'play', 'V-ing': 'playing', 'Ví dụ': 'She is playing.' },
      { 'Quy tắc': '+ ing (thường)', 'V1': 'read', 'V-ing': 'reading', 'Ví dụ': 'I am reading.' },
      { 'Quy tắc': '+ ing (thường)', 'V1': 'watch', 'V-ing': 'watching', 'Ví dụ': 'They are watching TV.' },
      { 'Quy tắc': '+ ing (thường)', 'V1': 'go', 'V-ing': 'going', 'Ví dụ': 'We are going home.' },
      { 'Quy tắc': '+ ing (thường)', 'V1': 'study', 'V-ing': 'studying', 'Ví dụ': 'He is studying.' },
      { 'Quy tắc': 'bỏ e + ing', 'V1': 'write', 'V-ing': 'writing', 'Ví dụ': 'She is writing.' },
      { 'Quy tắc': 'bỏ e + ing', 'V1': 'make', 'V-ing': 'making', 'Ví dụ': 'I am making tea.' },
      { 'Quy tắc': 'bỏ e + ing', 'V1': 'come', 'V-ing': 'coming', 'Ví dụ': 'He is coming.' },
      { 'Quy tắc': 'bỏ e + ing', 'V1': 'have', 'V-ing': 'having', 'Ví dụ': 'We are having lunch.' },
      { 'Quy tắc': 'bỏ e + ing', 'V1': 'live', 'V-ing': 'living', 'Ví dụ': 'She is living here.' },
      { 'Quy tắc': 'bỏ e + ing', 'V1': 'take', 'V-ing': 'taking', 'Ví dụ': 'He is taking a photo.' },
      { 'Quy tắc': 'gấp phụ âm + ing', 'V1': 'run', 'V-ing': 'running', 'Ví dụ': 'She is running.' },
      { 'Quy tắc': 'gấp phụ âm + ing', 'V1': 'swim', 'V-ing': 'swimming', 'Ví dụ': 'They are swimming.' },
      { 'Quy tắc': 'gấp phụ âm + ing', 'V1': 'sit', 'V-ing': 'sitting', 'Ví dụ': 'I am sitting.' },
      { 'Quy tắc': 'gấp phụ âm + ing', 'V1': 'get', 'V-ing': 'getting', 'Ví dụ': 'It is getting late.' },
      { 'Quy tắc': 'gấp phụ âm + ing', 'V1': 'stop', 'V-ing': 'stopping', 'Ví dụ': 'The bus is stopping.' },
      { 'Quy tắc': 'gấp phụ âm + ing', 'V1': 'put', 'V-ing': 'putting', 'Ví dụ': 'She is putting it away.' },
      { 'Quy tắc': 'ie → y + ing', 'V1': 'lie', 'V-ing': 'lying', 'Ví dụ': 'He is lying down.' },
      { 'Quy tắc': 'ie → y + ing', 'V1': 'die', 'V-ing': 'dying', 'Ví dụ': 'The plant is dying.' },
      { 'Quy tắc': 'giữ e (hiếm)', 'V1': 'see', 'V-ing': 'seeing', 'Ví dụ': 'I am seeing the doctor.' },
    ],
  },
  {
    title: 'Động từ trạng thái · thường KHÔNG dùng tiếp diễn',
    icon: '🧊',
    note: 'Stative verbs: like, love, want, know, believe, understand, need, have (sở hữu)… → Hiện tại đơn.',
    rows: [
      { 'Động từ': 'like / love / hate', 'Sai': 'I am liking pizza.', 'Đúng': 'I like pizza.' },
      { 'Động từ': 'want / need', 'Sai': 'She is wanting water.', 'Đúng': 'She wants water.' },
      { 'Động từ': 'know / understand', 'Sai': 'I am knowing him.', 'Đúng': 'I know him.' },
      { 'Động từ': 'believe / think (ý kiến)', 'Sai': 'I am thinking he is right. (ý kiến)', 'Đúng': 'I think he is right.' },
      { 'Động từ': 'have (sở hữu)', 'Sai': 'I am having a car.', 'Đúng': 'I have a car.' },
      { 'Động từ': 'have (ăn/uống — OK tiếp diễn)', 'Sai': '—', 'Đúng': 'I am having lunch now.' },
      { 'Động từ': 'see (nhìn thấy)', 'Sai': 'I am seeing a bird. (thường)', 'Đúng': 'I can see a bird. / I see a bird.' },
      { 'Động từ': 'hear', 'Sai': 'I am hearing music.', 'Đúng': 'I can hear music. / I hear music.' },
    ],
  },
  {
    title: 'Present Simple vs Continuous · đối chiếu',
    icon: '⚖️',
    rows: [
      { 'Hiện tại đơn': 'habits / facts', 'Hiện tại tiếp diễn': 'now / temporary', 'Ví dụ đơn': 'I work every day.', 'Ví dụ TD': 'I am working now.' },
      { 'Hiện tại đơn': 'always, usually, often…', 'Hiện tại tiếp diễn': 'now, at the moment…', 'Ví dụ đơn': 'She usually cooks.', 'Ví dụ TD': 'She is cooking now.' },
      { 'Hiện tại đơn': 'he/she + V-s', 'Hiện tại tiếp diễn': 'is + V-ing', 'Ví dụ đơn': 'He plays football.', 'Ví dụ TD': 'He is playing football.' },
    ],
  },
];

// ─── past-continuous ────────────────────────────────────────────────────────

/** @type {Bank[]} */
export const PAST_CONTINUOUS_BANKS = [
  {
    title: 'Quá khứ tiếp diễn · was/were + V-ing',
    icon: '⏪',
    note: 'Hành động đang diễn ra tại một thời điểm trong quá khứ / bị ngắt bởi hành động khác.',
    rows: [
      { 'Chủ ngữ': 'I / he / she / it', 'Khẳng định (+)': 'was + V-ing', 'Phủ định (−)': "wasn't + V-ing", 'Nghi vấn (?)': 'Was I/he/she/it + V-ing…?' },
      { 'Chủ ngữ': 'you / we / they', 'Khẳng định (+)': 'were + V-ing', 'Phủ định (−)': "weren't + V-ing", 'Nghi vấn (?)': 'Were you/we/they + V-ing…?' },
    ],
  },
  {
    title: 'when / while · Past Continuous + Past Simple',
    icon: '⏱️',
    note: 'while + QKTD (đang diễn ra) · when + QKĐ (hành động cắt ngang).',
    rows: [
      { 'Mẫu': 'S + was/were + V-ing + when + S + V2', 'Ví dụ': 'I was sleeping when the phone rang.' },
      { 'Mẫu': 'When + S + V2, S + was/were + V-ing', 'Ví dụ': 'When she arrived, we were eating.' },
      { 'Mẫu': 'S + was/were + V-ing + while + S + was/were + V-ing', 'Ví dụ': 'I was reading while he was cooking.' },
      { 'Mẫu': 'While + S + was/were + V-ing, S + V2', 'Ví dụ': 'While I was walking, I saw Tom.' },
      { 'Mẫu': 'At 8 p.m. yesterday…', 'Ví dụ': 'At 8 p.m. yesterday I was watching TV.' },
    ],
  },
  {
    title: 'Past Continuous · lỗi hay gặp',
    icon: '⚠️',
    rows: [
      { Sai: 'I were watching TV.', Đúng: 'I was watching TV.', 'Vì sao': 'I → was' },
      { Sai: 'They was playing.', Đúng: 'They were playing.', 'Vì sao': 'they → were' },
      { Sai: 'She was cook dinner.', Đúng: 'She was cooking dinner.', 'Vì sao': 'cần V-ing' },
      { Sai: 'I slept when the phone was ringing. (nếu phone cắt ngang)', Đúng: 'I was sleeping when the phone rang.', 'Vì sao': 'đang ngủ = QKTD; chuông reo = QKĐ' },
    ],
  },
];

// ─── be-going-to ────────────────────────────────────────────────────────────

/** @type {Bank[]} */
export const BE_GOING_TO_BANKS = [
  {
    title: 'be going to · bảng đầy đủ',
    icon: '➡️',
    note: 'Kế hoạch đã định / dự đoán có căn cứ (dấu hiệu thấy được).',
    rows: [
      { 'Chủ ngữ': 'I', 'Khẳng định (+)': "am going to + V1", 'Phủ định (−)': "am not going to + V1", 'Nghi vấn (?)': 'Am I going to + V1…?' },
      { 'Chủ ngữ': 'he / she / it', 'Khẳng định (+)': 'is going to + V1', 'Phủ định (−)': "isn't going to + V1", 'Nghi vấn (?)': 'Is he going to + V1…?' },
      { 'Chủ ngữ': 'you / we / they', 'Khẳng định (+)': 'are going to + V1', 'Phủ định (−)': "aren't going to + V1", 'Nghi vấn (?)': 'Are you going to + V1…?' },
    ],
  },
  {
    title: 'be going to · case dùng',
    icon: '📋',
    rows: [
      { 'Trường hợp': 'Kế hoạch / ý định', 'Ví dụ': "I'm going to study medicine." },
      { 'Trường hợp': 'Dự đoán có dấu hiệu', 'Ví dụ': 'Look at those clouds! It is going to rain.' },
      { 'Trường hợp': 'Sắp xảy ra (gần)', 'Ví dụ': 'Be careful! You are going to fall.' },
      { 'Trường hợp': 'Phủ định', 'Ví dụ': "She isn't going to come." },
      { 'Trường hợp': 'Hỏi', 'Ví dụ': 'What are you going to do this weekend?' },
    ],
  },
  {
    title: 'going to · lỗi hay gặp',
    icon: '⚠️',
    rows: [
      { Sai: 'I going to buy a car.', Đúng: "I'm going to buy a car.", 'Vì sao': 'thiếu be (am/is/are)' },
      { Sai: 'She is going buy a car.', Đúng: 'She is going to buy a car.', 'Vì sao': 'cần to + V1' },
      { Sai: 'They is going to leave.', Đúng: 'They are going to leave.', 'Vì sao': 'they → are' },
      { Sai: 'He going to rains.', Đúng: 'It is going to rain.', 'Vì sao': 'be + going to + V1' },
    ],
  },
];

// ─── future-will ────────────────────────────────────────────────────────────

/** @type {Bank[]} */
export const FUTURE_WILL_BANKS = [
  {
    title: 'will · bảng đầy đủ',
    icon: '🔮',
    note: 'will + V1 cho mọi ngôi. Phủ định: won’t. Nghi vấn: Will + S + V1…?',
    rows: [
      { 'Chủ ngữ': 'I / you / he / she / it / we / they', 'Khẳng định (+)': 'will + V1', 'Phủ định (−)': "will not / won't + V1", 'Nghi vấn (?)': 'Will + S + V1…?' },
      { 'Rút gọn': "I'll / you'll / he'll / she'll / we'll / they'll", 'Ví dụ': "I'll help you. · She'll call later." },
    ],
  },
  {
    title: 'will · các trường hợp dùng',
    icon: '📌',
    rows: [
      { 'Trường hợp': 'Quyết định tức thì', 'Ví dụ': "The phone is ringing. I'll answer it." },
      { 'Trường hợp': 'Lời hứa', 'Ví dụ': "I'll call you tonight. · I won't tell anyone." },
      { 'Trường hợp': 'Đề nghị giúp', 'Ví dụ': "I'll carry your bag." },
      { 'Trường hợp': 'Dự đoán (ý kiến)', 'Ví dụ': 'I think it will rain tomorrow.' },
      { 'Trường hợp': 'Từ chối / won’t', 'Ví dụ': "The door won't open." },
      { 'Trường hợp': 'Probably / maybe / I think…', 'Ví dụ': 'She will probably win.' },
    ],
  },
  {
    title: 'will vs be going to (đối chiếu thi)',
    icon: '⚖️',
    rows: [
      { will: 'quyết định lúc nói', 'be going to': 'kế hoạch đã định trước', 'Ví dụ will': "I'm tired. I'll go to bed.", 'Ví dụ going to': "I'm going to visit grandma this Sunday. (đã lên lịch)" },
      { will: 'dự đoán ý kiến', 'be going to': 'dự đoán có dấu hiệu', 'Ví dụ will': 'I think he will pass.', 'Ví dụ going to': 'Look! He is going to fall.' },
      { will: "I'll help (đề nghị)", 'be going to': '—', 'Ví dụ will': "I'll open the door.", 'Ví dụ going to': '—' },
    ],
  },
  {
    title: 'will · lỗi hay gặp',
    icon: '⚠️',
    rows: [
      { Sai: 'She will goes.', Đúng: 'She will go.', 'Vì sao': 'will + V1 (không -s)' },
      { Sai: 'Will you to help me?', Đúng: 'Will you help me?', 'Vì sao': 'không to sau will' },
      { Sai: 'I will can swim.', Đúng: 'I will be able to swim. / I can swim.', 'Vì sao': 'không will + can' },
      { Sai: 'I think I am going to help you. (lúc quyết định tức thì)', Đúng: "I'll help you.", 'Vì sao': 'quyết định lúc nói → will' },
    ],
  },
];

// ─── imperatives ────────────────────────────────────────────────────────────

/** @type {Bank[]} */
export const IMPERATIVE_BANKS = [
  {
    title: 'Câu mệnh lệnh · khẳng định / phủ định',
    icon: '📢',
    note: 'Khẳng định: V1 (+ …). Phủ định: Don’t + V1. Lịch sự: Please + V1 / Can you…?',
    rows: [
      { 'Dạng': 'Khẳng định', 'Cấu trúc': 'V1 + …', 'Ví dụ': 'Open the door. · Sit down. · Listen carefully.' },
      { 'Dạng': 'Phủ định', 'Cấu trúc': "Don't + V1", 'Ví dụ': "Don't run. · Don't touch that. · Don't be late." },
      { 'Dạng': 'Let’s (rủ)', 'Cấu trúc': "Let's + V1", 'Ví dụ': "Let's go. · Let's eat." },
      { 'Dạng': "Let's not", 'Cấu trúc': "Let's not + V1", 'Ví dụ': "Let's not wait." },
      { 'Dạng': 'Please', 'Cấu trúc': 'Please + V1', 'Ví dụ': 'Please help me. · Please sit down.' },
      { 'Dạng': 'Lịch sự hỏi', 'Cấu trúc': 'Can/Could you + V1…?', 'Ví dụ': 'Can you open the window, please?' },
    ],
  },
  {
    title: 'Mệnh lệnh · động từ hay dùng (list)',
    icon: '📝',
    rows: [
      { 'V1': 'open / close', 'Ví dụ': 'Open your book. · Close the window.' },
      { 'V1': 'sit / stand', 'Ví dụ': 'Sit down. · Stand up.' },
      { 'V1': 'look / listen / watch', 'Ví dụ': 'Look at the board. · Listen to me.' },
      { 'V1': 'come / go / stop', 'Ví dụ': 'Come here. · Go away. · Stop talking.' },
      { 'V1': 'write / read / say', 'Ví dụ': 'Write your name. · Read page 10.' },
      { 'V1': 'turn on / turn off', 'Ví dụ': 'Turn off the light.' },
      { 'V1': 'put / take', 'Ví dụ': 'Put it on the table. · Take your bag.' },
      { 'V1': 'be + adj', 'Ví dụ': 'Be quiet. · Be careful. · Be kind.' },
      { 'V1': "don't + be", 'Ví dụ': "Don't be silly. · Don't be late." },
      { 'V1': 'let’s', 'Ví dụ': "Let's start. · Let's practice." },
    ],
  },
];

// ─── adjectives-basic ───────────────────────────────────────────────────────

/** @type {Bank[]} */
export const ADJECTIVES_BASIC_BANKS = [
  {
    title: 'Tính từ · vị trí (trước N / sau be)',
    icon: '🎨',
    note: 'Adj đứng trước danh từ hoặc sau be/look/feel… Không có số nhiều: *a reds car*.',
    rows: [
      { 'Vị trí': 'Trước danh từ', 'Ví dụ': 'a big house · a happy child · an old book' },
      { 'Vị trí': 'Sau to be', 'Ví dụ': 'The house is big. · She is happy.' },
      { 'Vị trí': 'Sau look / feel / seem', 'Ví dụ': 'You look tired. · It seems easy.' },
      { 'Vị trí': 'Không -s với số nhiều', 'Ví dụ': 'big houses (không bigs houses)' },
      { 'Vị trí': 'Thứ tự hay gặp (A0–A1)', 'Ví dụ': 'a small red bag · a young Vietnamese student' },
    ],
  },
  {
    title: 'Tính từ đối lập hay gặp (list ôn thi)',
    icon: '🔀',
    rows: [
      { 'Tính từ': 'big / large', 'Trái nghĩa': 'small / little', 'Ví dụ': 'a big city · a small room' },
      { 'Tính từ': 'tall', 'Trái nghĩa': 'short', 'Ví dụ': 'a tall man · a short girl' },
      { 'Tính từ': 'long', 'Trái nghĩa': 'short', 'Ví dụ': 'long hair · a short film' },
      { 'Tính từ': 'old', 'Trái nghĩa': 'new / young', 'Ví dụ': 'an old car · a young teacher' },
      { 'Tính từ': 'hot', 'Trái nghĩa': 'cold', 'Ví dụ': 'hot weather · cold water' },
      { 'Tính từ': 'happy', 'Trái nghĩa': 'sad', 'Ví dụ': 'She is happy. · He looks sad.' },
      { 'Tính từ': 'easy', 'Trái nghĩa': 'difficult / hard', 'Ví dụ': 'an easy test · a hard question' },
      { 'Tính từ': 'fast / quick', 'Trái nghĩa': 'slow', 'Ví dụ': 'a fast train · a slow bus' },
      { 'Tính từ': 'good', 'Trái nghĩa': 'bad', 'Ví dụ': 'good news · a bad day' },
      { 'Tính từ': 'rich', 'Trái nghĩa': 'poor', 'Ví dụ': 'a rich man · a poor family' },
      { 'Tính từ': 'clean', 'Trái nghĩa': 'dirty', 'Ví dụ': 'a clean room · dirty shoes' },
      { 'Tính từ': 'full', 'Trái nghĩa': 'empty', 'Ví dụ': 'a full bottle · an empty box' },
      { 'Tính từ': 'open', 'Trái nghĩa': 'closed', 'Ví dụ': 'The shop is open / closed.' },
      { 'Tính từ': 'right / correct', 'Trái nghĩa': 'wrong', 'Ví dụ': 'the right answer' },
      { 'Tính từ': 'early', 'Trái nghĩa': 'late', 'Ví dụ': 'early morning · late night' },
      { 'Tính từ': 'expensive', 'Trái nghĩa': 'cheap', 'Ví dụ': 'an expensive phone · a cheap ticket' },
      { 'Tính từ': 'beautiful / pretty', 'Trái nghĩa': 'ugly', 'Ví dụ': 'a beautiful flower' },
      { 'Tính từ': 'strong', 'Trái nghĩa': 'weak', 'Ví dụ': 'a strong wind' },
      { 'Tính từ': 'heavy', 'Trái nghĩa': 'light', 'Ví dụ': 'a heavy bag · a light jacket' },
      { 'Tính từ': 'noisy', 'Trái nghĩa': 'quiet', 'Ví dụ': 'a noisy street · a quiet room' },
    ],
  },
  {
    title: 'Tính từ cảm xúc / trạng thái (hay dùng với be)',
    icon: '😊',
    rows: [
      { 'Tính từ': 'happy / glad', 'Ví dụ': 'I am happy.' },
      { 'Tính từ': 'sad / upset', 'Ví dụ': 'She is sad.' },
      { 'Tính từ': 'angry', 'Ví dụ': 'He is angry.' },
      { 'Tính từ': 'tired / sleepy', 'Ví dụ': 'I am tired.' },
      { 'Tính từ': 'hungry / thirsty', 'Ví dụ': 'We are hungry.' },
      { 'Tính từ': 'scared / afraid', 'Ví dụ': 'The child is afraid.' },
      { 'Tính từ': 'bored / interested', 'Ví dụ': 'I am bored. · She is interested.' },
      { 'Tính từ': 'busy / free', 'Ví dụ': 'Are you free tomorrow?' },
      { 'Tính từ': 'ill / sick / well', 'Ví dụ': 'He is ill. · I am well.' },
      { 'Tính từ': 'ready', 'Ví dụ': 'Are you ready?' },
    ],
  },
];

// ─── modals: ability / permission / obligation / advice ─────────────────────

/** @type {Bank[]} */
export const MODALS_ABILITY_BANKS = [
  {
    title: 'can / could / be able to · khả năng',
    icon: '💪',
    note: 'can + V1 (mọi ngôi). could = quá khứ / lịch sự. be able to = thì khác được.',
    rows: [
      { 'Dạng': 'can', 'Nghĩa': 'có thể (hiện tại)', 'Ví dụ': 'I can swim. · She can speak English.' },
      { 'Dạng': "can't / cannot", 'Nghĩa': 'không thể', 'Ví dụ': "I can't drive. · He cannot come." },
      { 'Dạng': 'Can + S + V1…?', 'Nghĩa': 'hỏi khả năng / xin phép', 'Ví dụ': 'Can you help me? · Can I sit here?' },
      { 'Dạng': 'could (quá khứ)', 'Nghĩa': 'đã có thể / thói quen QK', 'Ví dụ': 'I could swim when I was five.' },
      { 'Dạng': 'could (lịch sự)', 'Nghĩa': 'nhờ vả lịch sự', 'Ví dụ': 'Could you open the window?' },
      { 'Dạng': 'be able to', 'Nghĩa': 'có thể (linh hoạt thì)', 'Ví dụ': 'I will be able to come tomorrow.' },
      { 'Dạng': 'was/were able to', 'Nghĩa': 'đã làm được (1 lần cụ thể)', 'Ví dụ': 'I was able to finish on time.' },
    ],
  },
  {
    title: 'can · lỗi hay gặp',
    icon: '⚠️',
    rows: [
      { Sai: 'She cans swim.', Đúng: 'She can swim.', 'Vì sao': 'modal không -s' },
      { Sai: 'I can to swim.', Đúng: 'I can swim.', 'Vì sao': 'can + V1 (không to)' },
      { Sai: 'He can swims.', Đúng: 'He can swim.', 'Vì sao': 'không V-s sau can' },
      { Sai: 'Do you can swim?', Đúng: 'Can you swim?', 'Vì sao': 'đảo can, không do' },
    ],
  },
];

/** @type {Bank[]} */
export const MODALS_PERMISSION_BANKS = [
  {
    title: 'Xin phép / cho phép · can / could / may / may I',
    icon: '🙋',
    rows: [
      { 'Mẫu': 'Can I + V1…?', 'Mức': 'thân mật', 'Ví dụ': 'Can I borrow your pen?' },
      { 'Mẫu': 'Could I + V1…?', 'Mức': 'lịch sự hơn', 'Ví dụ': 'Could I open the window?' },
      { 'Mẫu': 'May I + V1…?', 'Mức': 'trang trọng', 'Ví dụ': 'May I come in?' },
      { 'Mẫu': 'Can you + V1…?', 'Mức': 'nhờ vả', 'Ví dụ': 'Can you help me?' },
      { 'Mẫu': 'Could you + V1…?', 'Mức': 'nhờ vả lịch sự', 'Ví dụ': 'Could you wait a minute?' },
      { 'Mẫu': 'You can / may + V1', 'Mức': 'cho phép', 'Ví dụ': 'You can go now. · You may leave.' },
      { 'Mẫu': "You can't / may not + V1", 'Mức': 'không cho', 'Ví dụ': "You can't park here." },
      { 'Mẫu': 'Do you mind if I…?', 'Mức': 'rất lịch sự', 'Ví dụ': 'Do you mind if I sit here?' },
    ],
  },
];

/** @type {Bank[]} */
export const MODALS_OBLIGATION_BANKS = [
  {
    title: 'Bắt buộc / cấm · must / have to / mustn’t / don’t have to',
    icon: '📜',
    note: 'must ≈ người nói bắt buộc. have to ≈ quy định bên ngoài. mustn’t = cấm. don’t have to = không cần.',
    rows: [
      { 'Mẫu': 'must + V1', 'Nghĩa': 'phải (mạnh)', 'Ví dụ': 'You must wear a helmet.' },
      { 'Mẫu': 'have to + V1', 'Nghĩa': 'phải (bắt buộc bên ngoài)', 'Ví dụ': 'I have to get up early.' },
      { 'Mẫu': 'has to + V1', 'Nghĩa': 'he/she/it phải', 'Ví dụ': 'She has to work on Sunday.' },
      { 'Mẫu': "mustn't + V1", 'Nghĩa': 'cấm / không được', 'Ví dụ': "You mustn't smoke here." },
      { 'Mẫu': "don't / doesn't have to + V1", 'Nghĩa': 'không cần (không bắt buộc)', 'Ví dụ': "You don't have to come." },
      { 'Mẫu': 'need to + V1', 'Nghĩa': 'cần', 'Ví dụ': 'I need to study more.' },
      { 'Mẫu': "needn't + V1", 'Nghĩa': 'không cần (BrE)', 'Ví dụ': "You needn't worry." },
      { 'Mẫu': 'had to + V1', 'Nghĩa': 'đã phải (quá khứ của must/have to)', 'Ví dụ': 'I had to leave early.' },
    ],
  },
  {
    title: "mustn’t vs don’t have to (bẫy đề)",
    icon: '⚠️',
    rows: [
      { Sai: "You don't have to smoke here. (muốn nói cấm)", Đúng: "You mustn't smoke here.", 'Vì sao': "mustn't = cấm; don't have to = không bắt buộc" },
      { Sai: "You mustn't come if you're busy. (muốn nói không cần)", Đúng: "You don't have to come if you're busy.", 'Vì sao': 'không bắt buộc ≠ cấm' },
      { 'Đúng': "Children must go to school.", 'Nghĩa': 'Trẻ em phải đi học.' },
      { 'Đúng': "You don't have to wear a tie.", 'Nghĩa': 'Bạn không cần đeo cà vạt.' },
    ],
  },
];

/** @type {Bank[]} */
export const MODALS_ADVICE_BANKS = [
  {
    title: 'Khuyên bảo · should / shouldn’t / ought to / had better',
    icon: '💡',
    rows: [
      { 'Mẫu': 'should + V1', 'Nghĩa': 'nên', 'Ví dụ': 'You should sleep more.' },
      { 'Mẫu': "shouldn't + V1", 'Nghĩa': 'không nên', 'Ví dụ': "You shouldn't eat too much sugar." },
      { 'Mẫu': 'Should I + V1…?', 'Nghĩa': 'tôi có nên…?', 'Ví dụ': 'Should I call her?' },
      { 'Mẫu': 'ought to + V1', 'Nghĩa': 'nên (hơi trang trọng)', 'Ví dụ': 'You ought to see a doctor.' },
      { 'Mẫu': "had better + V1", 'Nghĩa': 'nên… (cảnh báo / mạnh hơn)', 'Ví dụ': "You'd better hurry." },
      { 'Mẫu': "had better not + V1", 'Nghĩa': 'tốt hơn là đừng', 'Ví dụ': "You'd better not be late." },
      { 'Mẫu': 'Why don’t you + V1…?', 'Nghĩa': 'sao bạn không…? (gợi ý)', 'Ví dụ': "Why don't you take a break?" },
      { 'Mẫu': 'If I were you, I would…', 'Nghĩa': 'nếu tôi là bạn…', 'Ví dụ': 'If I were you, I would study harder.' },
    ],
  },
  {
    title: 'should · lỗi hay gặp',
    icon: '⚠️',
    rows: [
      { Sai: 'You should to go.', Đúng: 'You should go.', 'Vì sao': 'should + V1' },
      { Sai: 'He shoulds study.', Đúng: 'He should study.', 'Vì sao': 'không -s' },
      { Sai: 'You should going.', Đúng: 'You should go.', 'Vì sao': 'không V-ing sau should (trừ should be V-ing)' },
    ],
  },
];

// ─── conditionals 0–1 ───────────────────────────────────────────────────────

/** @type {Bank[]} */
export const CONDITIONALS_01_BANKS = [
  {
    title: 'Câu điều kiện loại 0 · sự thật / thói quen',
    icon: '0️⃣',
    note: 'If + Hiện tại đơn, Hiện tại đơn. = luôn đúng.',
    rows: [
      { 'Cấu trúc': 'If + S + V (HTĐ), S + V (HTĐ)', 'Ví dụ': 'If you heat ice, it melts.' },
      { 'Cấu trúc': 'If + S + V, S + V', 'Ví dụ': 'If I am tired, I go to bed early.' },
      { 'Cấu trúc': 'When ≈ If (loại 0)', 'Ví dụ': 'When water reaches 100°C, it boils.' },
      { 'Cấu trúc': 'Mệnh lệnh + if', 'Ví dụ': 'Call me if you need help.' },
    ],
  },
  {
    title: 'Câu điều kiện loại 1 · có thể xảy ra ở tương lai',
    icon: '1️⃣',
    note: 'If + Hiện tại đơn, will + V1. Có thể dùng can/may/might/imperative ở mệnh đề chính.',
    rows: [
      { 'Cấu trúc': 'If + S + V (HTĐ), S + will + V1', 'Ví dụ': 'If it rains, I will stay home.' },
      { 'Cấu trúc': 'If + S + V, S + can + V1', 'Ví dụ': 'If you finish early, you can go home.' },
      { 'Cấu trúc': 'If + S + V, imperative', 'Ví dụ': 'If you see Tom, tell him to call me.' },
      { 'Cấu trúc': 'Unless = if not', 'Ví dụ': "Unless you hurry, you will miss the bus." },
      { 'Cấu trúc': 'Đảo mệnh đề', 'Ví dụ': 'I will call you if I arrive early.' },
    ],
  },
  {
    title: 'Loại 0 vs 1 · đối chiếu + lỗi',
    icon: '⚖️',
    rows: [
      { 'Loại 0': 'sự thật / luôn xảy ra', 'Loại 1': 'tương lai có thể', 'Ví dụ 0': 'If you mix red and blue, you get purple.', 'Ví dụ 1': 'If you study, you will pass.' },
      { Sai: 'If it will rain, I will stay.', Đúng: 'If it rains, I will stay.', 'Vì sao': 'if-clause không will (loại 1 chuẩn)' },
      { Sai: 'If I will be free, I call you.', Đúng: 'If I am free, I will call you.', 'Vì sao': 'HTĐ trong if; will ở mệnh đề chính' },
      { Sai: 'If you heat ice, it will melts. (sự thật khoa học → 0)', Đúng: 'If you heat ice, it melts.', 'Vì sao': 'loại 0: hai vế HTĐ' },
    ],
  },
];

// ─── thicken thin banks ─────────────────────────────────────────────────────

/** @type {Bank[]} */
export const DEMONSTRATIVES_EXTRA = [
  {
    title: 'This / that / these / those · dùng làm đại từ hoặc tính từ',
    icon: '👆',
    rows: [
      { 'Từ': 'this', 'Vai trò': 'tính từ + N số ít', 'Ví dụ': 'This book is new.' },
      { 'Từ': 'this', 'Vai trò': 'đại từ số ít', 'Ví dụ': 'This is my pen.' },
      { 'Từ': 'that', 'Vai trò': 'tính từ + N số ít (xa)', 'Ví dụ': 'That car is expensive.' },
      { 'Từ': 'that', 'Vai trò': 'đại từ số ít (xa)', 'Ví dụ': 'That is her house.' },
      { 'Từ': 'these', 'Vai trò': 'tính từ + N số nhiều (gần)', 'Ví dụ': 'These shoes are nice.' },
      { 'Từ': 'these', 'Vai trò': 'đại từ số nhiều (gần)', 'Ví dụ': 'These are my keys.' },
      { 'Từ': 'those', 'Vai trò': 'tính từ + N số nhiều (xa)', 'Ví dụ': 'Those people are teachers.' },
      { 'Từ': 'those', 'Vai trò': 'đại từ số nhiều (xa)', 'Ví dụ': 'Those are stars.' },
    ],
  },
  {
    title: 'Demonstratives · lỗi hay gặp',
    icon: '⚠️',
    rows: [
      { Sai: 'This books are new.', Đúng: 'These books are new.', 'Vì sao': 'số nhiều gần → these' },
      { Sai: 'Those is my bag.', Đúng: 'That is my bag. / Those are my bags.', 'Vì sao': 'khớp số' },
      { Sai: 'I like this shoes.', Đúng: 'I like these shoes.', 'Vì sao': 'shoes số nhiều' },
      { Sai: 'That are my friends.', Đúng: 'Those are my friends.', 'Vì sao': 'số nhiều xa → those' },
    ],
  },
];

/** @type {Bank[]} */
export const THERE_IS_EXTRA = [
  {
    title: 'There is / are · some / any / a lot of',
    icon: '📦',
    rows: [
      { 'Mẫu': 'There is + a/an + C số ít', 'Ví dụ': 'There is a cat under the table.' },
      { 'Mẫu': 'There is + some + U', 'Ví dụ': 'There is some milk in the fridge.' },
      { 'Mẫu': 'There are + số / some + C số nhiều', 'Ví dụ': 'There are three chairs. · There are some apples.' },
      { 'Mẫu': "There isn't + a/any", 'Ví dụ': "There isn't a pen. · There isn't any water." },
      { 'Mẫu': "There aren't + any / số", 'Ví dụ': "There aren't any eggs." },
      { 'Mẫu': 'Is there …? / Are there …?', 'Ví dụ': 'Is there a bank? · Are there any questions?' },
      { 'Mẫu': 'How many … are there?', 'Ví dụ': 'How many students are there?' },
      { 'Mẫu': 'There is vs They are', 'Ví dụ': 'There is a book. (giới thiệu) · They are books. (chỉ định)' },
    ],
  },
  {
    title: 'There is/are · lỗi hay gặp',
    icon: '⚠️',
    rows: [
      { Sai: 'There have a book.', Đúng: 'There is a book.', 'Vì sao': 'không there have' },
      { Sai: 'There is many people.', Đúng: 'There are many people.', 'Vì sao': 'people số nhiều → are' },
      { Sai: 'There are a book.', Đúng: 'There is a book.', 'Vì sao': 'số ít → is' },
      { Sai: 'Is there any books?', Đúng: 'Are there any books?', 'Vì sao': 'books số nhiều' },
      { Sai: 'There is the book on the table. (lần đầu, chưa xác định)', Đúng: 'There is a book on the table.', 'Vì sao': 'giới thiệu → a/an' },
    ],
  },
];

/** Map slug → banks (batch 2 only; dense merges) */
export function batch2ForSlug(slug) {
  const map = {
    'personal-pronouns': PERSONAL_PRONOUN_BANKS,
    'have-got': HAVE_GOT_BANKS,
    'wh-questions': WH_QUESTION_BANKS,
    'present-continuous': PRESENT_CONTINUOUS_BANKS,
    'past-continuous': PAST_CONTINUOUS_BANKS,
    'be-going-to': BE_GOING_TO_BANKS,
    'future-will': FUTURE_WILL_BANKS,
    imperatives: IMPERATIVE_BANKS,
    'adjectives-basic': ADJECTIVES_BASIC_BANKS,
    'modals-ability': MODALS_ABILITY_BANKS,
    'modals-permission': MODALS_PERMISSION_BANKS,
    'modals-obligation': MODALS_OBLIGATION_BANKS,
    'modals-advice': MODALS_ADVICE_BANKS,
    'conditionals-0-1': CONDITIONALS_01_BANKS,
    demonstratives: DEMONSTRATIVES_EXTRA,
    'there-is-there-are': THERE_IS_EXTRA,
  };
  return map[slug] || null;
}
