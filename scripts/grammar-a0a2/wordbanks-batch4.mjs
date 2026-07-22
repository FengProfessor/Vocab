/**
 * Wordbanks batch 4 — Advanced (B2+).
 * Công thức + case + lỗi + đối chiếu. Header VI; ví dụ EN giữ để học.
 */

/** @typedef {{ title: string, icon?: string, note?: string, rows: Record<string,string>[] }} Bank */

// ─── past perfect continuous ────────────────────────────────────────────────

/** @type {Bank[]} */
export const PAST_PERFECT_CONT_BANKS = [
  {
    title: 'Quá khứ hoàn thành tiếp diễn · had been + V-ing',
    icon: '⏪',
    note: 'Hành động kéo dài **trước** một mốc/hành động quá khứ khác. for / since / How long…?',
    rows: [
      { 'Khẳng định (+)': 'S + had been + V-ing', 'Ví dụ': 'I had been waiting for an hour when she arrived.' },
      { 'Phủ định (−)': "S + hadn't been + V-ing", 'Ví dụ': "He hadn't been sleeping well before the exam." },
      { 'Nghi vấn (?)': 'Had + S + been + V-ing…?', 'Ví dụ': 'Had you been working there long before you left?' },
      { 'Rút gọn': "I'd been / she'd been + V-ing", 'Ví dụ': "I'd been studying all night." },
    ],
  },
  {
    title: 'Past Perfect vs Past Perfect Continuous',
    icon: '⚖️',
    rows: [
      { 'Past Perfect': 'hoàn thành / kết quả trước mốc QK', 'PPC': 'kéo dài / đang diễn ra trước mốc QK', 'Ví dụ PP': 'I had written three emails before lunch.', 'Ví dụ PPC': 'I had been writing emails all morning before lunch.' },
      { 'Past Perfect': 'know / be / have (stative)', 'PPC': 'wait / work / rain / study…', 'Ví dụ PP': 'I had known her for years before we married.', 'Ví dụ PPC': 'It had been raining for hours when we left.' },
      { 'Dấu hiệu': 'for / since + before / when + Past Simple', 'Ví dụ': 'She had been living there for 10 years when she moved.' },
    ],
  },
  {
    title: 'Past Perfect Continuous · lỗi hay gặp',
    icon: '⚠️',
    rows: [
      { Sai: 'I had been know him for years.', Đúng: 'I had known him for years.', 'Vì sao': 'know = stative → không PPC' },
      { Sai: 'She had been wrote all morning.', Đúng: 'She had been writing all morning.', 'Vì sao': 'had been + V-ing' },
      { Sai: 'I was waiting for an hour when she arrived. (nếu nhấn “đã chờ trước đó”)', Đúng: 'I had been waiting for an hour when she arrived.', 'Vì sao': 'kéo dài trước mốc QK → Past Perfect Continuous' },
    ],
  },
];

// ─── future perfect ─────────────────────────────────────────────────────────

/** @type {Bank[]} */
export const FUTURE_PERFECT_BANKS = [
  {
    title: 'Tương lai hoàn thành · will have + V3',
    icon: '🔮',
    note: 'Hoàn thành **trước** một mốc tương lai. Dấu hiệu: by + thời điểm, by the time, before…',
    rows: [
      { 'Khẳng định (+)': 'S + will have + V3', 'Ví dụ': 'By 2030, I will have graduated.' },
      { 'Phủ định (−)': "S + won't have + V3", 'Ví dụ': "She won't have finished by Friday." },
      { 'Nghi vấn (?)': 'Will + S + have + V3…?', 'Ví dụ': 'Will you have completed the report by Monday?' },
      { 'Rút gọn': "I'll have / she'll have + V3", 'Ví dụ': "I'll have left by then." },
    ],
  },
  {
    title: 'Dấu hiệu & tình huống',
    icon: '📌',
    rows: [
      { 'Dấu hiệu': 'by + mốc tương lai', 'Ví dụ': 'by tomorrow · by next year · by 8 p.m. · by the end of the month' },
      { 'Dấu hiệu': 'by the time + S + V (HTĐ)', 'Ví dụ': 'By the time you arrive, we will have left.' },
      { 'Dấu hiệu': 'before + mốc TL', 'Ví dụ': 'I will have finished before the meeting starts.' },
      { 'Tình huống': 'dự đoán đã xong trước mốc', 'Ví dụ': 'In two years, she will have saved enough money.' },
      { 'Tình huống': 'nhấn hoàn thành trước deadline', 'Ví dụ': 'They will have built the bridge by 2028.' },
    ],
  },
  {
    title: 'will vs will have · lỗi',
    icon: '⚠️',
    rows: [
      { will: 'sẽ xảy ra (chung)', 'will have': 'sẽ đã xong trước mốc', 'Ví dụ will': 'I will finish tomorrow.', 'Ví dụ FP': 'I will have finished by tomorrow evening.' },
      { Sai: 'By next year I will graduate. (nếu nhấn “đã xong trước đó”)', Đúng: 'By next year I will have graduated.', 'Vì sao': 'by + mốc → Future Perfect hay gặp' },
      { Sai: 'I will have finish by 5.', Đúng: 'I will have finished by 5.', 'Vì sao': 'will have + V3' },
      { Sai: 'By the time you will arrive, we will have left.', Đúng: 'By the time you arrive, we will have left.', 'Vì sao': 'after by the time: HTĐ (không will)' },
    ],
  },
];

// ─── future in the past ─────────────────────────────────────────────────────

/** @type {Bank[]} */
export const FUTURE_IN_PAST_BANKS = [
  {
    title: 'Tương lai trong quá khứ · would / was going to / was to…',
    icon: '🕰️',
    note: 'Nhìn từ quá khứ nói về “tương lai” tính từ lúc đó.',
    rows: [
      { 'Cấu trúc': 'would + V1', 'Nghĩa': 'sẽ… (từ góc QK)', 'Ví dụ': 'He said he would call later. · I knew she would win.' },
      { 'Cấu trúc': 'was/were going to + V1', 'Nghĩa': 'đã định / suýt (có thể không xảy ra)', 'Ví dụ': "I was going to call you, but I forgot." },
      { 'Cấu trúc': 'was/were about to + V1', 'Nghĩa': 'sắp… thì…', 'Ví dụ': 'I was about to leave when the phone rang.' },
      { 'Cấu trúc': 'was/were to + V1', 'Nghĩa': 'theo kế hoạch / định mệnh (formal)', 'Ví dụ': 'He was to become the next CEO.' },
      { 'Cấu trúc': 'would be + V-ing', 'Nghĩa': 'sẽ đang… (từ QK)', 'Ví dụ': 'I thought you would be sleeping.' },
      { 'Cấu trúc': 'would have + V3', 'Nghĩa': 'sẽ đã… (từ QK / giả định)', 'Ví dụ': 'I thought she would have arrived by then.' },
    ],
  },
  {
    title: 'was going to · case đặc biệt',
    icon: '📌',
    rows: [
      { 'Trường hợp': 'Kế hoạch QK đã định', 'Ví dụ': 'We were going to visit Hue last summer.' },
      { 'Trường hợp': 'Dự định không thành', 'Ví dụ': "I was going to buy it, but it was too expensive." },
      { 'Trường hợp': 'Dấu hiệu lúc đó (dự đoán QK)', 'Ví dụ': 'The sky was dark — it was going to rain.' },
      { Sai: 'I will going to call you yesterday.', Đúng: 'I was going to call you yesterday.', 'Vì sao': 'tương lai-trong-QK → was/were going to' },
      { Sai: 'He said he will come.', Đúng: 'He said he would come.', 'Vì sao': 'said (QK) → would' },
    ],
  },
];

// ─── mixed conditionals ─────────────────────────────────────────────────────

/** @type {Bank[]} */
export const MIXED_CONDITIONAL_BANKS = [
  {
    title: 'Điều kiện hỗn hợp · 2 mẫu chính',
    icon: '🔀',
    note: 'Trộn loại 2 + 3: nguyên nhân một thời, kết quả thời khác.',
    rows: [
      {
        'Mẫu': 'A · If + Past Perfect, would + V1',
        'Nghĩa': 'QK khác → kết quả hiện tại khác',
        'Ví dụ': "If I had studied medicine, I would be a doctor now.",
      },
      {
        'Mẫu': 'B · If + Past Simple, would have + V3',
        'Nghĩa': 'Hiện tại khác (thường xuyên) → kết quả QK khác',
        'Ví dụ': "If I weren't afraid of flying, I would have gone to Japan last year.",
      },
      {
        'Mẫu': 'A · If + had + V3, could/might + V1',
        'Nghĩa': 'QK → khả năng hiện tại',
        'Ví dụ': "If she had taken the job, she might be living in Singapore now.",
      },
      {
        'Mẫu': 'B · If + V2, might/could have + V3',
        'Nghĩa': 'tính cách/trạng thái hiện tại → QK khác',
        'Ví dụ': "If he were more careful, he wouldn't have crashed.",
      },
    ],
  },
  {
    title: 'Đối chiếu loại 2 / 3 / mixed',
    icon: '⚖️',
    rows: [
      { 'Loại 2': 'If I knew, I would tell you. (HT)', 'Loại 3': 'If I had known, I would have told you. (QK)', 'Mixed A': "If I had known, I would tell you now. (ít gặp hơn A chuẩn)" },
      { 'Mixed A (phổ biến)': "If I had saved money, I would own a house now.", 'Giải': 'không tiết kiệm (QK) → không có nhà (HT)' },
      { 'Mixed B (phổ biến)': "If I didn't have to work, I would have gone to the party.", 'Giải': 'phải làm việc (HT) → đã không đi tiệc (QK)' },
    ],
  },
  {
    title: 'Mixed conditionals · lỗi',
    icon: '⚠️',
    rows: [
      { Sai: 'If I would have studied, I would be a doctor now.', Đúng: 'If I had studied, I would be a doctor now.', 'Vì sao': 'if-clause mixed A: had + V3' },
      { Sai: 'If I had studied, I would have been a doctor now.', Đúng: 'If I had studied, I would be a doctor now.', 'Vì sao': 'kết quả hiện tại → would + V1 (không would have)' },
      { Sai: 'If I am rich, I would have bought it.', Đúng: 'If I were rich, I would have bought it.', 'Vì sao': 'mixed B: if + QKĐ' },
    ],
  },
];

// ─── wish / if only ─────────────────────────────────────────────────────────

/** @type {Bank[]} */
export const WISH_IF_ONLY_BANKS = [
  {
    title: 'wish / if only · 3 thì chính',
    icon: '🌟',
    note: 'Ước trái sự thật. if only = wish (mạnh / cảm xúc hơn).',
    rows: [
      { 'Cấu trúc': 'wish + Past Simple', 'Nghĩa': 'ước hiện tại khác', 'Ví dụ': 'I wish I had more time. · I wish I were taller.' },
      { 'Cấu trúc': 'wish + Past Perfect', 'Nghĩa': 'ước quá khứ khác (tiếc)', 'Ví dụ': 'I wish I had studied harder. · If only I had known.' },
      { 'Cấu trúc': 'wish + would + V1', 'Nghĩa': 'ước ai đó thay đổi / phàn nàn tương lai', 'Ví dụ': 'I wish you would listen. · I wish it would stop raining.' },
      { 'Cấu trúc': 'if only + Past Simple', 'Nghĩa': 'giá như (HT)', 'Ví dụ': 'If only I spoke English fluently.' },
      { 'Cấu trúc': 'if only + Past Perfect', 'Nghĩa': 'giá như (QK)', 'Ví dụ': 'If only I had taken that job.' },
      { 'Cấu trúc': 'wish + could + V1', 'Nghĩa': 'ước có khả năng', 'Ví dụ': 'I wish I could fly. · I wish I could help you.' },
    ],
  },
  {
    title: 'wish · be / hope · phân biệt',
    icon: '📌',
    rows: [
      { 'wish': 'trái sự thật / khó xảy ra', 'hope': 'có thể xảy ra', 'Ví dụ wish': 'I wish I were on holiday. (đang không)', 'Ví dụ hope': 'I hope you pass the exam.' },
      { 'wish + were': 'formal / đề thi ưa were', 'Ví dụ': 'I wish I were rich. (cũng gặp was thân mật)' },
      { 'Không': 'wish + will', 'Đúng': 'wish + would / Past…', 'Ví dụ': "I wish he would call. (không I wish he will call)" },
      { 'Không': 'wish + V1 (HTĐ) cho trái HT', 'Đúng': 'wish + V2', 'Ví dụ': 'I wish I knew. (không I wish I know)' },
    ],
  },
  {
    title: 'wish · lỗi hay gặp',
    icon: '⚠️',
    rows: [
      { Sai: 'I wish I am rich.', Đúng: 'I wish I were / was rich.', 'Vì sao': 'wish + Past cho hiện tại' },
      { Sai: 'I wish I studied yesterday.', Đúng: 'I wish I had studied yesterday.', 'Vì sao': 'ước QK → Past Perfect' },
      { Sai: 'I wish you will stop smoking.', Đúng: 'I wish you would stop smoking.', 'Vì sao': 'phàn nàn / muốn thay đổi → would' },
      { Sai: 'I hope I were taller.', Đúng: 'I wish I were taller. / I hope to be taller. (khác nghĩa)', 'Vì sao': 'hope không dùng như wish trái sự thật' },
    ],
  },
];

// ─── modals perfect ─────────────────────────────────────────────────────────

/** @type {Bank[]} */
export const MODALS_PERFECT_BANKS = [
  {
    title: 'Modal + have + V3 · bảng đầy đủ',
    icon: '🧩',
    note: 'Nói về quá khứ: khả năng / suy đoán / trách / tiếc.',
    rows: [
      { 'Cấu trúc': 'must have + V3', 'Nghĩa': 'chắc đã…', 'Ví dụ': 'She must have left — her bag is gone.' },
      { 'Cấu trúc': "can't / couldn't have + V3", 'Nghĩa': 'chắc đã không…', 'Ví dụ': "He can't have done that — he's honest." },
      { 'Cấu trúc': 'might / may have + V3', 'Nghĩa': 'có lẽ đã…', 'Ví dụ': 'She might have forgotten the meeting.' },
      { 'Cấu trúc': 'could have + V3', 'Nghĩa': 'đã có thể… (nhưng không)', 'Ví dụ': 'You could have told me earlier.' },
      { 'Cấu trúc': 'should have + V3', 'Nghĩa': 'lẽ ra đã… (tiếc / trách)', 'Ví dụ': 'You should have studied more.' },
      { 'Cấu trúc': "shouldn't have + V3", 'Nghĩa': 'lẽ ra không nên đã…', 'Ví dụ': "You shouldn't have said that." },
      { 'Cấu trúc': 'ought to have + V3', 'Nghĩa': 'lẽ ra đã… (formal)', 'Ví dụ': 'He ought to have apologised.' },
      { 'Cấu trúc': 'needn’t have + V3', 'Nghĩa': 'đã… không cần thiết (nhưng đã làm)', 'Ví dụ': "You needn't have bought more bread. (đã mua thừa)" },
      { 'Cấu trúc': "didn't need to + V1", 'Nghĩa': 'không cần (và thường không làm)', 'Ví dụ': "I didn't need to buy bread. (không mua)" },
      { 'Cấu trúc': 'would have + V3', 'Nghĩa': 'đã sẽ… (điều kiện loại 3)', 'Ví dụ': 'I would have helped if I had known.' },
    ],
  },
  {
    title: "should have vs could have vs needn't have",
    icon: '⚖️',
    rows: [
      { 'should have': 'lẽ ra nên (trách / tiếc)', 'Ví dụ': 'You should have worn a coat.' },
      { 'could have': 'đã có khả năng / cơ hội (không tận dụng)', 'Ví dụ': 'You could have won if you had tried.' },
      { "needn't have": 'đã làm việc không cần', 'Ví dụ': "You needn't have cooked so much food." },
      { "didn't need to": 'không cần làm (thường không làm)', 'Ví dụ': "I didn't need to cook — we ordered pizza." },
      { 'must have': 'suy đoán chắc chắn QK', 'Ví dụ': 'It must have rained — the ground is wet.' },
    ],
  },
  {
    title: 'Modal perfect · lỗi',
    icon: '⚠️',
    rows: [
      { Sai: 'You should had studied.', Đúng: 'You should have studied.', 'Vì sao': 'modal + have + V3' },
      { Sai: 'She must has left.', Đúng: 'She must have left.', 'Vì sao': 'have không chia has sau modal' },
      { Sai: "He mustn't have been there. (muốn nói chắc không)", Đúng: "He can't have been there.", 'Vì sao': "suy đoán phủ định mạnh QK → can't have" },
      { Sai: "You needn't have to come.", Đúng: "You needn't have come. / You didn't need to come.", 'Vì sao': "needn't have + V3" },
    ],
  },
];

// ─── causative ──────────────────────────────────────────────────────────────

/** @type {Bank[]} */
export const CAUSATIVE_BANKS = [
  {
    title: 'Thể sai bảo · have/get something done',
    icon: '🛠️',
    note: 'Thuê / nhờ ai đó làm cho mình. have/get + object + V3.',
    rows: [
      { 'Cấu trúc': 'have + O + V3', 'Nghĩa': 'nhờ/thuê làm (trung tính)', 'Ví dụ': 'I had my hair cut. · We had the house painted.' },
      { 'Cấu trúc': 'get + O + V3', 'Nghĩa': 'nhờ làm (thân mật / nỗ lực hơn)', 'Ví dụ': 'I got my phone fixed.' },
      { 'Cấu trúc': 'have + O + V1', 'Nghĩa': 'bảo ai làm (have + người + V1)', 'Ví dụ': 'I had the mechanic check the brakes.' },
      { 'Cấu trúc': 'get + O + to V', 'Nghĩa': 'thuyết phục ai làm', 'Ví dụ': 'I got him to help me.' },
      { 'Cấu trúc': 'make + O + V1', 'Nghĩa': 'bắt / khiến ai làm', 'Ví dụ': 'The teacher made us rewrite the essay.' },
      { 'Cấu trúc': 'let + O + V1', 'Nghĩa': 'cho phép ai làm', 'Ví dụ': 'My parents let me go out.' },
      { 'Cấu trúc': 'help + O + (to) V1', 'Nghĩa': 'giúp ai làm', 'Ví dụ': 'She helped me (to) carry the bags.' },
    ],
  },
  {
    title: 'have/get something done · các thì',
    icon: '📌',
    rows: [
      { 'Thì': 'Hiện tại', 'Ví dụ': 'I have my car serviced every year.' },
      { 'Thì': 'Quá khứ', 'Ví dụ': 'I had my laptop repaired yesterday.' },
      { 'Thì': 'Hiện tại hoàn thành', 'Ví dụ': "I've just had my eyes tested." },
      { 'Thì': 'Tương lai', 'Ví dụ': "I'll have the documents translated tomorrow." },
      { 'Thì': 'be going to', 'Ví dụ': "I'm going to get my room painted." },
      { 'Thì': 'Modal', 'Ví dụ': 'You should have your teeth checked.' },
    ],
  },
  {
    title: 'Causative · lỗi hay gặp',
    icon: '⚠️',
    rows: [
      { Sai: 'I cut my hair yesterday. (nếu thợ cắt)', Đúng: 'I had my hair cut yesterday.', 'Vì sao': 'mình không tự cắt → causative' },
      { Sai: 'I had cut my hair. (nhầm Past Perfect)', Đúng: 'I had my hair cut.', 'Vì sao': 'have + O + V3 (không had cut = tự cắt xong)' },
      { Sai: 'I made him to cry.', Đúng: 'I made him cry.', 'Vì sao': 'make + O + V1 (không to)' },
      { Sai: 'I let him to go.', Đúng: 'I let him go.', 'Vì sao': 'let + O + V1' },
      { Sai: 'I got my car repairing.', Đúng: 'I got my car repaired.', 'Vì sao': 'get + O + V3' },
    ],
  },
];

// ─── advanced passive ───────────────────────────────────────────────────────

/** @type {Bank[]} */
export const ADVANCED_PASSIVE_BANKS = [
  {
    title: 'Bị động nâng cao · dạng đặc biệt',
    icon: '🔁',
    rows: [
      { 'Dạng': 'It is said that + S + V', 'Ví dụ': 'It is said that he is very rich.' },
      { 'Dạng': 'S + be said to + V1 / to have + V3', 'Ví dụ': 'He is said to be very rich. · He is said to have left the country.' },
      { 'Dạng': 'It is believed / thought / known / reported that…', 'Ví dụ': 'It is believed that the company will expand.' },
      { 'Dạng': 'S + is believed to + V…', 'Ví dụ': 'The company is believed to be expanding.' },
      { 'Dạng': 'have/get + O + V3 (causative passive feel)', 'Ví dụ': 'I had my wallet stolen. (bị mất cắp)' },
      { 'Dạng': 'need + V-ing = need to be + V3', 'Ví dụ': 'The car needs washing. = The car needs to be washed.' },
      { 'Dạng': 'be supposed to + V1', 'Ví dụ': 'You are supposed to wear a uniform.' },
      { 'Dạng': 'Modal perfect passive', 'Ví dụ': 'The work should have been finished. · It must have been stolen.' },
      { 'Dạng': 'Double object passive', 'Ví dụ': 'I was given a book. · A book was given to me.' },
      { 'Dạng': 'Passive + by / with / in', 'Ví dụ': 'filled with water · covered in snow · written by her' },
    ],
  },
  {
    title: 'Reporting verbs bị động (list thi)',
    icon: '📰',
    rows: [
      { 'Động từ': 'say', 'Mẫu': 'is said to… / It is said that…', 'Ví dụ': 'She is said to speak five languages.' },
      { 'Động từ': 'believe', 'Mẫu': 'is believed to…', 'Ví dụ': 'He is believed to be hiding.' },
      { 'Động từ': 'think', 'Mẫu': 'is thought to…', 'Ví dụ': 'The castle is thought to be 500 years old.' },
      { 'Động từ': 'report', 'Mẫu': 'is reported to…', 'Ví dụ': 'They are reported to have escaped.' },
      { 'Động từ': 'know', 'Mẫu': 'is known to…', 'Ví dụ': 'She is known to be strict.' },
      { 'Động từ': 'expect', 'Mẫu': 'is expected to…', 'Ví dụ': 'The president is expected to arrive soon.' },
      { 'Động từ': 'consider', 'Mẫu': 'is considered (to be)…', 'Ví dụ': 'He is considered (to be) a genius.' },
      { 'Động từ': 'allege', 'Mẫu': 'is alleged to…', 'Ví dụ': 'He is alleged to have stolen money.' },
    ],
  },
  {
    title: 'Advanced passive · lỗi',
    icon: '⚠️',
    rows: [
      { Sai: 'It is said he to be rich.', Đúng: 'It is said that he is rich. / He is said to be rich.', 'Vì sao': '2 mẫu chuẩn' },
      { Sai: 'The work should have finished.', Đúng: 'The work should have been finished.', 'Vì sao': 'bị động: have been + V3' },
      { Sai: 'I am said that…', Đúng: 'It is said that… / I am said to…', 'Vì sao': 'It is said that + mệnh đề' },
    ],
  },
];

// ─── advanced relative clauses ──────────────────────────────────────────────

/** @type {Bank[]} */
export const ADVANCED_RELATIVE_BANKS = [
  {
    title: 'Mệnh đề quan hệ nâng cao · of which / whom / preposition',
    icon: '🔗',
    rows: [
      { 'Dạng': 'preposition + which/whom (formal)', 'Ví dụ': 'the house in which I live · the person to whom I spoke' },
      { 'Dạng': 'which/whom + preposition cuối (thân mật)', 'Ví dụ': 'the house which I live in · the person who I spoke to' },
      { 'Dạng': 'all / many / some / none of whom/which', 'Ví dụ': 'I have three brothers, all of whom are teachers. · books, many of which are old' },
      { 'Dạng': 'the + N + of which', 'Ví dụ': 'a company the name of which I forget → whose name…' },
      { 'Dạng': 'which thay cả mệnh đề', 'Ví dụ': 'He passed the exam, which surprised everyone.' },
      { 'Dạng': 'what = the thing that', 'Ví dụ': 'What you need is rest. · Tell me what happened.' },
      { 'Dạng': 'whoever / whatever / wherever', 'Ví dụ': 'Whoever arrives first can start. · Do whatever you want.' },
      { 'Dạng': 'Reduced relative (V-ing / V3)', 'Ví dụ': 'People living nearby… · The book written by her…' },
      { 'Dạng': 'Quantifier + of + which/whom', 'Ví dụ': 'students, few of whom passed · cars, some of which are electric' },
    ],
  },
  {
    title: 'Reduced relative clauses',
    icon: '✂️',
    rows: [
      { 'Đầy đủ': 'who/which + be + V-ing', 'Rút gọn': 'V-ing…', 'Ví dụ': 'The man who is talking… → The man talking…' },
      { 'Đầy đủ': 'who/which + be + V3', 'Rút gọn': 'V3…', 'Ví dụ': 'The letters which were sent… → The letters sent…' },
      { 'Đầy đủ': 'who/which + be + adj/N', 'Rút gọn': 'adj/N… (cẩn thận)', 'Ví dụ': 'Anyone who is interested… → Anyone interested…' },
      { 'Không rút khi': 'defining + thì đơn giản active không be', 'Ví dụ': 'The man who lives here… (không The man lives here… như relative)' },
    ],
  },
  {
    title: 'Advanced relative · lỗi',
    icon: '⚠️',
    rows: [
      { Sai: 'the person to who I spoke', Đúng: 'the person to whom I spoke / who I spoke to', 'Vì sao': 'sau giới từ formal → whom' },
      { Sai: 'He passed, that surprised me.', Đúng: 'He passed, which surprised me.', 'Vì sao': 'which thay cả mệnh đề; non-defining không that' },
      { Sai: 'all of which are teachers (về người)', Đúng: 'all of whom are teachers', 'Vì sao': 'người → whom' },
    ],
  },
];

// ─── participle clauses ─────────────────────────────────────────────────────

/** @type {Bank[]} */
export const PARTICIPLE_CLAUSE_BANKS = [
  {
    title: 'Mệnh đề phân từ · V-ing / V3 / being + V3',
    icon: '🌿',
    note: 'Rút gọn mệnh đề cùng chủ ngữ; trang trọng / viết học thuật.',
    rows: [
      { 'Dạng': 'V-ing (chủ động, đồng thời / nguyên nhân)', 'Ví dụ': 'Walking down the street, I met Tom. · Feeling tired, she went to bed.' },
      { 'Dạng': 'Having + V3 (hoàn thành trước)', 'Ví dụ': 'Having finished homework, he watched TV.' },
      { 'Dạng': 'V3 (bị động)', 'Ví dụ': 'Built in 1990, the bridge is still strong. · Shocked by the news, she sat down.' },
      { 'Dạng': 'Being + V3 (bị động đang / nguyên nhân)', 'Ví dụ': 'Being delayed by traffic, we missed the flight.' },
      { 'Dạng': 'Not + V-ing / Not having + V3', 'Ví dụ': 'Not knowing the answer, I stayed silent. · Not having slept, I felt awful.' },
      { 'Dạng': 'With + N + V-ing/V3', 'Ví dụ': 'With the exams approaching, students are stressed. · With the work finished, we left.' },
    ],
  },
  {
    title: 'Participle · quan hệ thời gian / nguyên nhân',
    icon: '📌',
    rows: [
      { 'Ý': 'đồng thời', 'Ví dụ': 'She sat smiling at me.' },
      { 'Ý': 'nguyên nhân', 'Ví dụ': 'Being hungry, I made a sandwich.' },
      { 'Ý': 'sau khi (having + V3)', 'Ví dụ': 'Having locked the door, I left.' },
      { 'Ý': 'điều kiện (ít gặp hơn)', 'Ví dụ': 'Treated with care, the plant will grow well.' },
      { 'Ý': 'kết quả', 'Ví dụ': 'The bomb exploded, killing three people.' },
    ],
  },
  {
    title: 'Participle · lỗi (dangling)',
    icon: '⚠️',
    rows: [
      { Sai: 'Walking down the street, a car hit me.', Đúng: 'Walking down the street, I was hit by a car. / While I was walking…, a car hit me.', 'Vì sao': 'chủ ngữ mệnh đề chính phải là người đang walking' },
      { Sai: 'Having finished the test, the teacher collected the papers. (nếu HS làm bài)', Đúng: 'Having finished the test, the students handed in the papers.', 'Vì sao': 'who finished = students' },
      { Sai: 'After finished homework, he went out.', Đúng: 'Having finished homework, he went out. / After finishing…', 'Vì sao': 'having + V3 hoặc after + V-ing' },
    ],
  },
];

// ─── ellipsis & substitution ────────────────────────────────────────────────

/** @type {Bank[]} */
export const ELLIPSIS_BANKS = [
  {
    title: 'Lược bỏ (ellipsis) · tránh lặp',
    icon: '✂️',
    rows: [
      { 'Dạng': 'bỏ động từ sau trợ động từ', 'Ví dụ': 'She can swim better than I can (swim).' },
      { 'Dạng': 'bỏ mệnh đề sau liên từ', 'Ví dụ': "If (it is) possible, call me. · When (you are) ready, start." },
      { 'Dạng': 'bỏ chủ ngữ + be trong phụ đề', 'Ví dụ': 'While (I was) waiting, I read a book.' },
      { 'Dạng': 'So / Neither + trợ + S', 'Ví dụ': "I like tea. — So do I. · I don't smoke. — Neither do I." },
      { 'Dạng': 'short answers', 'Ví dụ': 'Did you go? — Yes, I did. / No, I didn\'t.' },
      { 'Dạng': 'to thay to-infinitive clause', 'Ví dụ': "Would you like to join? — I'd love to (join)." },
      { 'Dạng': 'bỏ that trong mệnh đề', 'Ví dụ': 'I think (that) she is right.' },
    ],
  },
  {
    title: 'Thay thế (substitution) · one / ones / do so / so / not',
    icon: '🔄',
    rows: [
      { 'Từ': 'one / ones', 'Thay': 'danh từ đếm được', 'Ví dụ': 'I need a pen. Do you have one? · red ones' },
      { 'Từ': 'do / does / did', 'Thay': 'động từ thường', 'Ví dụ': 'She likes tea and so does he.' },
      { 'Từ': 'do so / do it / do that', 'Thay': 'cả hành động', 'Ví dụ': 'She asked me to wait, and I did so.' },
      { 'Từ': 'so', 'Thay': 'mệnh đề khẳng định (think/hope/say…)', 'Ví dụ': 'Is she coming? — I think so.' },
      { 'Từ': 'not', 'Thay': 'mệnh đề phủ định', 'Ví dụ': 'Is she coming? — I hope not. · I think not. (formal)' },
      { 'Từ': 'that / those', 'Thay': 'N đã nêu (viết)', 'Ví dụ': "The climate here is milder than that of Hanoi." },
    ],
  },
  {
    title: 'So / Neither · bảng',
    icon: '📋',
    rows: [
      { 'Câu trước (+)': 'I am tired.', 'Đồng tình': 'So am I.', 'Phủ định đối': "I'm not." },
      { 'Câu trước (+)': 'She works hard.', 'Đồng tình': 'So does he.', 'Ghi chú': 'trợ động từ khớp thì' },
      { 'Câu trước (−)': "I don't like fish.", 'Đồng tình (−)': 'Neither / Nor do I.', 'Ghi chú': 'Neither = Nor' },
      { 'Câu trước (−)': "She can't swim.", 'Đồng tình (−)': 'Neither can I.', 'Ghi chú': 'lặp modal' },
      { Sai: 'I like tea. — So I do.', Đúng: 'I like tea. — So do I.', 'Vì sao': 'đảo trợ động từ + S' },
      { Sai: "I don't smoke. — So don't I.", Đúng: "I don't smoke. — Neither do I.", 'Vì sao': 'phủ định đồng tình → Neither' },
    ],
  },
];

// ─── subjunctive ────────────────────────────────────────────────────────────

/** @type {Bank[]} */
export const SUBJUNCTIVE_BANKS = [
  {
    title: 'Thức giả định (subjunctive) · dạng hiện tại',
    icon: '📜',
    note: 'V1 cho mọi ngôi (không -s). Trang trọng / formal English, đề IELTS/academic.',
    rows: [
      { 'Cấu trúc': 'suggest / recommend / insist / demand / require / propose + that + S + V1', 'Ví dụ': 'I suggest that he study harder. · They insisted that she leave.' },
      { 'Cấu trúc': 'It is essential / important / vital / necessary that + S + V1', 'Ví dụ': 'It is important that every student be on time.' },
      { 'Cấu trúc': 'phủ định: that + S + not + V1', 'Ví dụ': 'She requested that he not call her again.' },
      { 'Cấu trúc': 'be trong subjunctive', 'Ví dụ': 'The boss demanded that the report be finished today.' },
      { 'Cấu trúc': 'were (unreal past) — wish / if / as if', 'Ví dụ': 'If I were you… · She acts as if she were the boss.' },
      { 'Cấu trúc': 'BrE thay thế: should + V1', 'Ví dụ': 'I suggest that he should study harder.' },
    ],
  },
  {
    title: 'Động từ / tính từ dẫn subjunctive (list)',
    icon: '📌',
    rows: [
      { 'Động từ': 'suggest, recommend, advise, propose', 'Ví dụ': 'I recommend that she apply now.' },
      { 'Động từ': 'insist, demand, require, request, order', 'Ví dụ': 'They required that every guest wear a mask.' },
      { 'Động từ': 'ask (yêu cầu formal)', 'Ví dụ': 'He asked that the rule be changed.' },
      { 'Tính từ': 'important, essential, vital, necessary, crucial', 'Ví dụ': 'It is vital that he arrive early.' },
      { 'Tính từ': 'desirable, preferable, urgent', 'Ví dụ': 'It is desirable that the law be revised.' },
      { 'Danh từ': 'recommendation, suggestion, demand, requirement', 'Ví dụ': 'There was a demand that the tax be lowered.' },
    ],
  },
  {
    title: 'Subjunctive · lỗi',
    icon: '⚠️',
    rows: [
      { Sai: 'I suggest that he studies harder. (AmE formal đề)', Đúng: 'I suggest that he study harder.', 'Vì sao': 'subjunctive: V1 không -s' },
      { Sai: 'It is important that she is present.', Đúng: 'It is important that she be present.', 'Vì sao': 'be không is trong mandative subjunctive' },
      { Sai: 'I suggest him to study.', Đúng: 'I suggest that he study. / I suggest studying.', 'Vì sao': 'suggest không + O + to V' },
    ],
  },
];

// ─── emphasis ───────────────────────────────────────────────────────────────

/** @type {Bank[]} */
export const EMPHASIS_BANKS = [
  {
    title: 'Cấu trúc nhấn mạnh · do / what / it / đảo',
    icon: '❗',
    rows: [
      { 'Dạng': 'do / does / did + V1 (nhấn động từ)', 'Ví dụ': 'I do like this song. · She does work hard. · I did tell you!' },
      { 'Dạng': 'What-clause + be (nhấn thông tin)', 'Ví dụ': 'What I need is a rest. · What happened was unexpected.' },
      { 'Dạng': 'All + S + V + be…', 'Ví dụ': 'All I want is peace. · All she did was cry.' },
      { 'Dạng': 'It is/was … that/who… (cleft)', 'Ví dụ': 'It was Tom who broke the vase. · It is English that I love.' },
      { 'Dạng': 'emphatic reflexive', 'Ví dụ': 'I myself cleaned the room. · The president himself attended.' },
      { 'Dạng': 'so + adj + that / such + N + that', 'Ví dụ': 'so tired that… · such a good book that…' },
      { 'Dạng': 'never / rarely + inversion', 'Ví dụ': 'Never have I seen such chaos.' },
      { 'Dạng': 'the + comparative, the + comparative', 'Ví dụ': 'The more you practice, the better you get.' },
    ],
  },
  {
    title: 'do/does/did nhấn mạnh · lưu ý',
    icon: '📌',
    rows: [
      { 'Khẳng định nhấn': 'S + do/does/did + V1', 'Ví dụ': 'I do understand.' },
      { 'Không dùng với': 'be / modal đã có sẵn (thường)', 'Ví dụ': 'I am happy. (không I do be happy)' },
      { 'Mệnh lệnh nhấn': 'Do + V1', 'Ví dụ': 'Do sit down. · Do be quiet.' },
      { Sai: 'She does works hard.', Đúng: 'She does work hard.', 'Vì sao': 'does + V1 (không -s)' },
      { Sai: 'I did went there.', Đúng: 'I did go there.', 'Vì sao': 'did + V1' },
    ],
  },
];

// ─── cleft sentences ────────────────────────────────────────────────────────

/** @type {Bank[]} */
export const CLEFT_BANKS = [
  {
    title: 'Câu chẻ (cleft) · It-cleft & Wh-cleft',
    icon: '🪓',
    note: 'Tách thông tin để nhấn mạnh một thành phần.',
    rows: [
      { 'Loại': 'It-cleft', 'Cấu trúc': 'It is/was + nhấn mạnh + that/who + mệnh đề', 'Ví dụ': 'It was yesterday that I met her. · It is money that we need.' },
      { 'Loại': 'It-cleft (người)', 'Cấu trúc': 'It is/was + người + who/that…', 'Ví dụ': 'It was my teacher who helped me.' },
      { 'Loại': 'Wh-cleft (pseudo-cleft)', 'Cấu trúc': 'What + mệnh đề + be + nhấn mạnh', 'Ví dụ': 'What I hate is waiting. · What you need is practice.' },
      { 'Loại': 'All-cleft', 'Cấu trúc': 'All + S + V + be…', 'Ví dụ': 'All he wants is a chance.' },
      { 'Loại': 'The reason why / The place where / The day when', 'Ví dụ': 'The reason why I left was the salary. · The place where we met was a café.' },
      { 'Loại': 'The person who / The thing that', 'Ví dụ': 'The person who called was Linh.' },
    ],
  },
  {
    title: 'Cleft · biến đổi từ câu thường',
    icon: '🧩',
    rows: [
      { 'Câu thường': 'Tom broke the window yesterday.', 'Nhấn chủ ngữ': 'It was Tom who/that broke the window yesterday.' },
      { 'Câu thường': 'Tom broke the window yesterday.', 'Nhấn tân ngữ': 'It was the window that Tom broke yesterday.' },
      { 'Câu thường': 'Tom broke the window yesterday.', 'Nhấn thời gian': 'It was yesterday that Tom broke the window.' },
      { 'Câu thường': 'I need a holiday.', 'Wh-cleft': 'What I need is a holiday.' },
      { 'Câu thường': 'She wants only peace.', 'All-cleft': 'All she wants is peace.' },
    ],
  },
  {
    title: 'Cleft · lỗi',
    icon: '⚠️',
    rows: [
      { Sai: 'It was Tom which broke it.', Đúng: 'It was Tom who/that broke it.', 'Vì sao': 'người → who/that' },
      { Sai: 'What I need are rest.', Đúng: 'What I need is rest.', 'Vì sao': 'what-clause thường + is' },
      { Sai: 'It was in the park where I met her. (trộn)', Đúng: 'It was in the park that I met her. / The park is where I met her.', 'Vì sao': 'It-cleft: that (không where sau place đã in the park)' },
    ],
  },
];

// ─── inversion ──────────────────────────────────────────────────────────────

/** @type {Bank[]} */
export const INVERSION_BANKS = [
  {
    title: 'Đảo ngữ · Never / Rarely / Hardly / Not only…',
    icon: '🔃',
    note: 'Trạng từ phủ định/bán phủ định đầu câu → đảo trợ động từ + S (+ V).',
    rows: [
      { 'Mở đầu': 'Never / Rarely / Seldom', 'Cấu trúc': 'Never + trợ + S + V…', 'Ví dụ': 'Never have I seen such a mess. · Rarely does he arrive late.' },
      { 'Mở đầu': 'Hardly / Scarcely / Barely … when', 'Cấu trúc': 'Hardly + had + S + V3 when…', 'Ví dụ': 'Hardly had I sat down when the phone rang.' },
      { 'Mở đầu': 'No sooner … than', 'Cấu trúc': 'No sooner + had + S + V3 than…', 'Ví dụ': 'No sooner had we left than it rained.' },
      { 'Mở đầu': 'Not only … but also', 'Cấu trúc': 'Not only + trợ + S + V, but … also…', 'Ví dụ': 'Not only did she win, but she also broke the record.' },
      { 'Mở đầu': 'Under no circumstances / On no account', 'Cấu trúc': 'Under no circumstances + trợ + S + V', 'Ví dụ': 'Under no circumstances should you open that door.' },
      { 'Mở đầu': 'Little', 'Cấu trúc': 'Little + trợ + S + V', 'Ví dụ': 'Little did he know the truth.' },
      { 'Mở đầu': 'Not until / Only when / Only after', 'Cấu trúc': 'Not until … + trợ + S + V', 'Ví dụ': 'Not until midnight did we leave. · Only after dark did they arrive.' },
      { 'Mở đầu': 'Only by / Only if / Only then', 'Ví dụ': 'Only by working hard can you succeed. · Only then did I understand.' },
      { 'Mở đầu': 'So + adj + be/trợ + S', 'Ví dụ': 'So beautiful was the view that we stopped.' },
      { 'Mở đầu': 'Such + be + N', 'Ví dụ': 'Such was the noise that I couldn\'t sleep.' },
    ],
  },
  {
    title: 'Đảo ngữ câu điều kiện (formal)',
    icon: '📌',
    rows: [
      { 'Loại 1': 'Should + S + V1, …', 'Ví dụ': 'Should you need help, call me. (= If you need…)' },
      { 'Loại 2': 'Were + S + (to V)…, …', 'Ví dụ': 'Were I rich, I would travel. · Were she to ask, I would help.' },
      { 'Loại 3': 'Had + S + V3, …', 'Ví dụ': 'Had I known, I would have come. (= If I had known…)' },
      { 'Phủ định loại 3': 'Had + S + not + V3', 'Ví dụ': "Had she not helped, we would have failed." },
    ],
  },
  {
    title: 'Inversion · lỗi',
    icon: '⚠️',
    rows: [
      { Sai: 'Never I have seen this.', Đúng: 'Never have I seen this.', 'Vì sao': 'đảo trợ + S' },
      { Sai: 'No sooner I had left than it rained.', Đúng: 'No sooner had I left than it rained.', 'Vì sao': 'had + S + V3' },
      { Sai: 'Not only she won, but she also…', Đúng: 'Not only did she win, but she also…', 'Vì sao': 'Not only + đảo' },
      { Sai: 'Hardly I sat down when…', Đúng: 'Hardly had I sat down when…', 'Vì sao': 'Hardly + had + S + V3' },
    ],
  },
];

// ─── discourse markers ──────────────────────────────────────────────────────

/** @type {Bank[]} */
export const DISCOURSE_MARKER_BANKS = [
  {
    title: 'Từ nối diễn ngôn · theo chức năng (list thi / writing)',
    icon: '🗣️',
    rows: [
      { 'Chức năng': 'Thêm ý', 'Từ nối': 'furthermore · moreover · in addition · besides · also · what is more', 'Ví dụ': 'Furthermore, the cost is high.' },
      { 'Chức năng': 'Đối lập', 'Từ nối': 'however · nevertheless · nonetheless · on the other hand · in contrast · yet', 'Ví dụ': 'However, results were mixed.' },
      { 'Chức năng': 'Kết quả', 'Từ nối': 'therefore · thus · consequently · as a result · hence', 'Ví dụ': 'Therefore, we postponed the launch.' },
      { 'Chức năng': 'Ví dụ', 'Từ nối': 'for example · for instance · such as · namely · e.g.', 'Ví dụ': 'For instance, Singapore…' },
      { 'Chức năng': 'Nêu ý kiến', 'Từ nối': 'in my view · personally · as far as I am concerned · it seems to me', 'Ví dụ': 'In my view, education matters most.' },
      { 'Chức năng': 'Sắp xếp', 'Từ nối': 'firstly · secondly · finally · to begin with · last but not least', 'Ví dụ': 'Firstly, we need data.' },
      { 'Chức năng': 'Tóm tắt', 'Từ nối': 'in conclusion · to sum up · overall · in short · all in all', 'Ví dụ': 'In conclusion, the policy works.' },
      { 'Chức năng': 'Nhượng bộ', 'Từ nối': 'although · even though · despite · in spite of · while · whereas', 'Ví dụ': 'Despite the rain, we continued.' },
      { 'Chức năng': 'Điều kiện', 'Từ nối': 'if · unless · provided that · as long as · otherwise', 'Ví dụ': 'Otherwise, we will fail.' },
      { 'Chức năng': 'Làm rõ', 'Từ nối': 'in other words · that is (to say) · i.e. · to put it another way', 'Ví dụ': 'In other words, we must act now.' },
      { 'Chức năng': 'So sánh', 'Từ nối': 'similarly · likewise · equally · in the same way', 'Ví dụ': 'Similarly, demand rose.' },
      { 'Chức năng': 'Chuyển chủ đề', 'Từ nối': 'as for · regarding · with regard to · as far as X is concerned', 'Ví dụ': 'As for cost, it is acceptable.' },
    ],
  },
  {
    title: 'despite / although / however · khớp cấu trúc',
    icon: '⚠️',
    rows: [
      { 'Từ': 'although / even though', 'Đi với': 'S + V', 'Ví dụ': 'Although it rained, we went out.' },
      { 'Từ': 'despite / in spite of', 'Đi với': 'N / V-ing / the fact that…', 'Ví dụ': 'Despite the rain… · Despite feeling tired…' },
      { 'Từ': 'however', 'Đi với': 'câu mới (thường có phẩy)', 'Ví dụ': 'It rained. However, we went out.' },
      { Sai: 'Despite it rained…', Đúng: 'Despite the rain… / Although it rained…', 'Vì sao': 'despite + N/V-ing' },
      { Sai: 'Although the rain, we went.', Đúng: 'Despite the rain… / Although it rained…', 'Vì sao': 'although + mệnh đề' },
      { Sai: 'However it rained, we went.', Đúng: 'Although it rained… / It rained. However, we…', 'Vì sao': 'however không = although' },
    ],
  },
];

// ─── nominalisation ─────────────────────────────────────────────────────────

/** @type {Bank[]} */
export const NOMINALISATION_BANKS = [
  {
    title: 'Danh từ hóa · V/Adj → N (viết academic)',
    icon: '📚',
    note: 'Biến quá trình thành danh từ → văn phong trang trọng, khách quan hơn.',
    rows: [
      { 'Gốc': 'decide → decision', 'Câu động từ': 'We decided to expand.', 'Câu danh từ hóa': 'Our decision to expand…' },
      { 'Gốc': 'develop → development', 'Câu động từ': 'The city developed rapidly.', 'Câu danh từ hóa': 'The rapid development of the city…' },
      { 'Gốc': 'pollute → pollution', 'Câu động từ': 'Factories pollute the river.', 'Câu danh từ hóa': 'Pollution of the river by factories…' },
      { 'Gốc': 'fail → failure', 'Câu động từ': 'The plan failed.', 'Câu danh từ hóa': 'The failure of the plan…' },
      { 'Gốc': 'improve → improvement', 'Câu động từ': 'Scores improved.', 'Câu danh từ hóa': 'An improvement in scores…' },
      { 'Gốc': 'analyze → analysis', 'Câu động từ': 'We analyzed the data.', 'Câu danh từ hóa': 'An analysis of the data…' },
      { 'Gốc': 'require → requirement', 'Câu động từ': 'The job requires skill.', 'Câu danh từ hóa': 'The skill requirements of the job…' },
      { 'Gốc': 'important → importance', 'Câu động từ': 'Education is important.', 'Câu danh từ hóa': 'The importance of education…' },
      { 'Gốc': 'different → difference', 'Câu động từ': 'They differ greatly.', 'Câu danh từ hóa': 'A great difference between them…' },
      { 'Gốc': 'grow → growth', 'Câu động từ': 'The economy grew.', 'Câu danh từ hóa': 'Economic growth…' },
    ],
  },
  {
    title: 'Mẫu danh từ hóa hay dùng',
    icon: '📌',
    rows: [
      { 'Mẫu': 'the + N + of + N', 'Ví dụ': 'the destruction of forests · the publication of the report' },
      { 'Mẫu': "N's + N / N of N", 'Ví dụ': "the government's decision · the decision of the government" },
      { 'Mẫu': 'there is/was + a/an + N', 'Ví dụ': 'There was a sharp increase in prices.' },
      { 'Mẫu': 'N + in / of / for / between', 'Ví dụ': 'a rise in unemployment · the need for change · the gap between rich and poor' },
      { 'Động từ “rỗng” + N': 'make / take / have / give + N', 'Ví dụ': 'make a decision · take action · have an impact · give consideration to' },
    ],
  },
  {
    title: 'Nominalisation · lỗi / lưu ý',
    icon: '⚠️',
    rows: [
      { 'Lưu ý': 'đừng lạm dụng — văn nói vẫn cần động từ sống', 'Ví dụ': 'We improved the system. (tự nhiên) vs There was an improvement… (formal)' },
      { Sai: 'The increasing of prices…', Đúng: 'The increase in prices…', 'Vì sao': 'increase (N) + in' },
      { Sai: 'Pollution is increase.', Đúng: 'Pollution is increasing. / There is an increase in pollution.', 'Vì sao': 'cần V hoặc cấu trúc N đúng' },
    ],
  },
];

// ─── hedging ────────────────────────────────────────────────────────────────

/** @type {Bank[]} */
export const HEDGING_BANKS = [
  {
    title: 'Hedging · làm mềm khẳng định (academic / IELTS)',
    icon: '🛡️',
    note: 'Tránh tuyệt đối hóa: always / never / all / prove… → may / might / tend to / suggest…',
    rows: [
      { 'Cứng (tránh)': 'This proves that…', 'Mềm (hedge)': 'This suggests / indicates that…', 'Ghi chú': 'suggest < prove' },
      { 'Cứng (tránh)': 'All people believe…', 'Mềm (hedge)': 'Many people believe… · It is widely believed…', 'Ghi chú': 'tránh all' },
      { 'Cứng (tránh)': 'X always causes Y.', 'Mềm (hedge)': 'X often / tends to cause Y. · X can lead to Y.', 'Ghi chú': 'tend to / can' },
      { 'Cứng (tránh)': 'The results show definitely…', 'Mềm (hedge)': 'The results appear to show… · It seems that…', 'Ghi chú': 'appear / seem' },
      { 'Modal': 'may / might / could', 'Ví dụ': 'This may explain the decline.' },
      { 'Động từ': 'seem / appear / tend / indicate / suggest / imply', 'Ví dụ': 'Prices tend to rise in summer.' },
      { 'Trạng từ': 'possibly · probably · perhaps · arguably · relatively · approximately', 'Ví dụ': 'This is arguably the best option.' },
      { 'Cụm': 'It is likely that… · There is a tendency for… · To some extent…', 'Ví dụ': 'To some extent, culture shapes behaviour.' },
      { 'Cụm': 'in most cases · in general · on the whole · broadly speaking', 'Ví dụ': 'In general, students prefer…' },
      { 'Cụm': 'It can be argued that… · One possible explanation is…', 'Ví dụ': 'One possible explanation is inflation.' },
    ],
  },
  {
    title: 'Hedging · thang độ chắc chắn',
    icon: '📊',
    rows: [
      { 'Mức': 'Rất chắc (ít hedge)', 'Ngôn ngữ': 'will · must · clearly · obviously · prove', 'Ví dụ': 'This clearly shows a rise.' },
      { 'Mức': 'Khá chắc', 'Ngôn ngữ': 'probably · likely · should · indicate', 'Ví dụ': 'This is likely to continue.' },
      { 'Mức': 'Trung bình', 'Ngôn ngữ': 'may · might · could · suggest · appear', 'Ví dụ': 'This may be due to cost.' },
      { 'Mức': 'Thấp / thận trọng', 'Ngôn ngữ': 'possibly · perhaps · it is possible that', 'Ví dụ': 'It is possible that the sample is biased.' },
    ],
  },
];

// ─── grammatical collocations ───────────────────────────────────────────────

/** @type {Bank[]} */
export const GRAM_COLLOCATION_BANKS = [
  {
    title: 'Kết hợp ngữ pháp · V + preposition (list hay sai)',
    icon: '🧲',
    rows: [
      { 'Cụm': 'depend on', 'Sai hay gặp': 'depend of / depend from', 'Ví dụ': 'It depends on the weather.' },
      { 'Cụm': 'rely on', 'Sai hay gặp': 'rely in', 'Ví dụ': 'You can rely on me.' },
      { 'Cụm': 'consist of', 'Sai hay gặp': 'consist in (khác nghĩa) / include of', 'Ví dụ': 'The team consists of 11 players.' },
      { 'Cụm': 'belong to', 'Sai hay gặp': 'belong of', 'Ví dụ': 'This book belongs to me.' },
      { 'Cụm': 'listen to', 'Sai hay gặp': 'listen (thiếu to)', 'Ví dụ': 'Listen to the teacher.' },
      { 'Cụm': 'wait for', 'Sai hay gặp': 'wait (thiếu for) + người', 'Ví dụ': 'Wait for me.' },
      { 'Cụm': 'look at / look for / look after', 'Sai hay gặp': 'nhầm 3 cụm', 'Ví dụ': 'look at the board · look for keys · look after kids' },
      { 'Cụm': '//arrive at (small) / arrive in (big)', 'Sai hay gặp': 'arrive to', 'Ví dụ': 'arrive at the station · arrive in Hanoi' },
      { 'Cụm': 'discuss + O (no about)', 'Sai hay gặp': 'discuss about', 'Ví dụ': 'We discussed the plan.' },
      { 'Cụm': 'enter + O (no into, nghĩa vào chỗ)', 'Sai hay gặp': 'enter into the room', 'Ví dụ': 'enter the room · enter into an agreement (idiom OK)' },
      { 'Cụm': 'emphasize + O / put emphasis on', 'Sai hay gặp': 'emphasize on', 'Ví dụ': 'She emphasized the risk.' },
      { 'Cụm': 'oppose + O / be opposed to', 'Sai hay gặp': 'oppose to + N (thiếu be)', 'Ví dụ': 'They oppose the plan. · are opposed to the plan' },
      { 'Cụm': 'prefer A to B', 'Sai hay gặp': 'prefer A than B', 'Ví dụ': 'I prefer tea to coffee.' },
      { 'Cụm': 'married to', 'Sai hay gặp': 'married with', 'Ví dụ': 'She is married to a doctor.' },
      { 'Cụm': 'good at / interested in / afraid of / proud of / famous for', 'Sai hay gặp': 'good in · interested on', 'Ví dụ': 'good at maths · interested in art' },
      { 'Cụm': 'similar to / different from', 'Sai hay gặp': 'different of · similar with', 'Ví dụ': 'different from mine' },
      { 'Cụm': 'responsible for', 'Sai hay gặp': 'responsible of', 'Ví dụ': 'responsible for the project' },
      { 'Cụm': 'aware of / capable of + V-ing', 'Sai hay gặp': 'capable to', 'Ví dụ': 'capable of solving…' },
      { 'Cụm': 'prevent A from V-ing', 'Sai hay gặp': 'prevent A to V', 'Ví dụ': 'prevent him from leaving' },
      { 'Cụm': 'spend time / money on + N / V-ing', 'Sai hay gặp': 'spend for', 'Ví dụ': 'spend time on homework' },
    ],
  },
  {
    title: 'V + V-ing / to V · collocation ngữ pháp',
    icon: '📎',
    rows: [
      { 'Cụm': 'look forward to + V-ing', 'Sai hay gặp': 'look forward to V1', 'Ví dụ': 'look forward to meeting you' },
      { 'Cụm': 'be used to + V-ing', 'Sai hay gặp': 'be used to V1', 'Ví dụ': 'be used to working nights' },
      { 'Cụm': 'object to + V-ing', 'Sai hay gặp': 'object to V1', 'Ví dụ': 'object to paying more' },
      { 'Cụm': 'confess to + V-ing', 'Sai hay gặp': 'confess to V1', 'Ví dụ': 'confess to lying' },
      { 'Cụm': 'succeed in + V-ing', 'Sai hay gặp': 'succeed to V', 'Ví dụ': 'succeed in passing' },
      { 'Cụm': 'dream of / about + V-ing', 'Sai hay gặp': 'dream to V', 'Ví dụ': 'dream of becoming…' },
      { 'Cụm': 'apologize for + V-ing', 'Sai hay gặp': 'apologize to V', 'Ví dụ': 'apologize for being late' },
      { 'Cụm': 'thank A for + V-ing', 'Sai hay gặp': 'thank for A to V', 'Ví dụ': 'thank you for helping' },
      { 'Cụm': 'have difficulty (in) + V-ing', 'Sai hay gặp': 'have difficulty to V', 'Ví dụ': 'have difficulty understanding' },
      { 'Cụm': 'be busy + V-ing', 'Sai hay gặp': 'be busy to V', 'Ví dụ': 'be busy preparing' },
    ],
  },
  {
    title: 'Adjective / noun + preposition (list thi)',
    icon: '📌',
    rows: [
      { 'Cụm': 'angry at/with · annoyed with · pleased with', 'Ví dụ': 'angry with him · pleased with the result' },
      { 'Cụm': 'keen on · fond of · crazy about', 'Ví dụ': 'keen on football' },
      { 'Cụm': 'tired of · bored with · fed up with', 'Ví dụ': 'tired of waiting' },
      { 'Cụm': 'aware of · conscious of · jealous of · envious of', 'Ví dụ': 'aware of the risk' },
      { 'Cụm': 'solution to · answer to · key to · reaction to', 'Ví dụ': 'solution to the problem (không of)' },
      { 'Cụm': 'reason for · cause of · effect on · impact on', 'Ví dụ': 'reason for leaving · effect on health' },
      { 'Cụm': 'increase in · decrease in · rise in · fall in', 'Ví dụ': 'an increase in sales' },
      { 'Cụm': 'in conclusion · on purpose · by chance · in advance · under pressure', 'Ví dụ': 'on purpose · by chance' },
    ],
  },
];

// ─── map ────────────────────────────────────────────────────────────────────

export function batch4ForSlug(slug) {
  const map = {
    'past-perfect-continuous': PAST_PERFECT_CONT_BANKS,
    'future-perfect': FUTURE_PERFECT_BANKS,
    'future-in-the-past': FUTURE_IN_PAST_BANKS,
    'mixed-conditionals': MIXED_CONDITIONAL_BANKS,
    'wish-if-only': WISH_IF_ONLY_BANKS,
    'modals-perfect': MODALS_PERFECT_BANKS,
    causative: CAUSATIVE_BANKS,
    'advanced-passive': ADVANCED_PASSIVE_BANKS,
    'advanced-relative-clauses': ADVANCED_RELATIVE_BANKS,
    'participle-clauses': PARTICIPLE_CLAUSE_BANKS,
    'ellipsis-substitution': ELLIPSIS_BANKS,
    subjunctive: SUBJUNCTIVE_BANKS,
    'emphasis-structures': EMPHASIS_BANKS,
    'cleft-sentences': CLEFT_BANKS,
    inversion: INVERSION_BANKS,
    'discourse-markers': DISCOURSE_MARKER_BANKS,
    nominalisation: NOMINALISATION_BANKS,
    'hedging-language': HEDGING_BANKS,
    'grammatical-collocations': GRAM_COLLOCATION_BANKS,
  };
  return map[slug] || null;
}
