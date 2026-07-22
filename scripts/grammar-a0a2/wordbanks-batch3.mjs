/**
 * Wordbanks batch 3 — A2 (và vài điểm A1+/B1 mỏng).
 * Rõ ràng, chi tiết: công thức + list case + lỗi VN + đối chiếu.
 * Header VI; ví dụ EN giữ để học.
 */

/** @typedef {{ title: string, icon?: string, note?: string, rows: Record<string,string>[] }} Bank */

// ─── present perfect ────────────────────────────────────────────────────────

/** @type {Bank[]} */
export const PRESENT_PERFECT_BANKS = [
  {
    title: 'Hiện tại hoàn thành · have/has + V3',
    icon: '✅',
    note: 'have/has + quá khứ phân từ (V3). I/you/we/they → have · he/she/it → has.',
    rows: [
      { 'Chủ ngữ': 'I / you / we / they', 'Khẳng định (+)': 'have + V3', 'Phủ định (−)': "have not / haven't + V3", 'Nghi vấn (?)': 'Have + S + V3…?' },
      { 'Chủ ngữ': 'he / she / it', 'Khẳng định (+)': 'has + V3', 'Phủ định (−)': "has not / hasn't + V3", 'Nghi vấn (?)': 'Has + S + V3…?' },
      { 'Rút gọn': "I've / you've / we've / they've / he's / she's / it's", 'Ví dụ': "I've finished. · She's gone." },
    ],
  },
  {
    title: 'Khi nào dùng Present Perfect (case thi)',
    icon: '📌',
    rows: [
      { 'Trường hợp': 'Kinh nghiệm (ever / never)', 'Ví dụ': 'Have you ever been to Japan? · I have never eaten sushi.' },
      { 'Trường hợp': 'Vừa mới (just / already / yet)', 'Ví dụ': "I've just arrived. · She has already left. · Have you finished yet?" },
      { 'Trường hợp': 'Kéo dài đến hiện tại (for / since)', 'Ví dụ': 'I have lived here for 5 years. · since 2020' },
      { 'Trường hợp': 'Kết quả còn liên quan hiện tại', 'Ví dụ': "I've lost my keys. (vẫn chưa tìm thấy)" },
      { 'Trường hợp': 'How long…?', 'Ví dụ': 'How long have you known him?' },
      { 'Trường hợp': 'This is the first time…', 'Ví dụ': "This is the first time I've driven a car." },
      { 'Trường hợp': 'so far / up to now / recently / lately', 'Ví dụ': 'I have read three books so far.' },
    ],
  },
  {
    title: 'Dấu hiệu · for / since / already / yet / just / ever / never',
    icon: '🔍',
    rows: [
      { 'Dấu hiệu': 'for + khoảng thời gian', 'Nghĩa': 'trong (bao lâu)', 'Ví dụ': 'for two hours · for a long time · for ages' },
      { 'Dấu hiệu': 'since + mốc thời gian', 'Nghĩa': 'từ (khi nào)', 'Ví dụ': 'since Monday · since 2019 · since I was a child' },
      { 'Dấu hiệu': 'just', 'Nghĩa': 'vừa mới', 'Ví dụ': "I've just eaten." },
      { 'Dấu hiệu': 'already', 'Nghĩa': 'đã… rồi (khẳng định / nghi vấn)', 'Ví dụ': 'She has already done it.' },
      { 'Dấu hiệu': 'yet', 'Nghĩa': 'đã… chưa? / vẫn chưa (−)', 'Ví dụ': "Have you finished yet? · I haven't finished yet." },
      { 'Dấu hiệu': 'ever', 'Nghĩa': 'đã từng? (thường ?)', 'Ví dụ': 'Have you ever tried this?' },
      { 'Dấu hiệu': 'never', 'Nghĩa': 'chưa bao giờ', 'Ví dụ': 'I have never seen snow.' },
      { 'Dấu hiệu': 'recently / lately', 'Nghĩa': 'gần đây', 'Ví dụ': 'I have been busy lately.' },
      { 'Dấu hiệu': 'so far / up to now', 'Nghĩa': 'cho đến nay', 'Ví dụ': 'So far, we have learned a lot.' },
      { 'Dấu hiệu': 'already vs yet', 'Nghĩa': 'already (+/?) · yet (?/−)', 'Ví dụ': "I've already done it. · Not yet." },
    ],
  },
  {
    title: 'Present Perfect vs Past Simple (bẫy đề lớn)',
    icon: '⚖️',
    note: 'PP = liên quan hiện tại / không nêu thời điểm cụ thể. PS = thời điểm quá khứ xác định (yesterday, last…, in 2010, ago).',
    rows: [
      { 'Hiện tại hoàn thành': 'I have lost my keys.', 'Quá khứ đơn': 'I lost my keys yesterday.', 'Ghi chú': 'PP: vẫn mất · PS: thời điểm rõ' },
      { 'Hiện tại hoàn thành': 'Have you ever been to Hue?', 'Quá khứ đơn': 'Did you go to Hue last year?', 'Ghi chú': 'ever = kinh nghiệm · last year = PS' },
      { 'Hiện tại hoàn thành': 'She has lived here for 3 years.', 'Quá khứ đơn': 'She lived here for 3 years. (đã chuyển đi)', 'Ghi chú': 'for + PP = vẫn còn' },
      { 'Hiện tại hoàn thành': "I've just finished.", 'Quá khứ đơn': 'I finished an hour ago.', 'Ghi chú': 'just vs ago' },
      { 'Không dùng PP với': 'yesterday / last week / ago / in 2019 / when I was…', 'Dùng': 'Past Simple', 'Ví dụ': 'I saw him yesterday. (không have seen… yesterday)' },
    ],
  },
  {
    title: 'V3 hay gặp (ôn kèm PP)',
    icon: '⚡',
    rows: [
      { V1: 'be', V3: 'been', 'Ví dụ': 'I have been busy.' },
      { V1: 'go', V3: 'gone / been', 'Ví dụ': "She's gone to school. (chưa về) · I've been to Da Nang. (đã từng / đã về)" },
      { V1: 'do', V3: 'done', 'Ví dụ': 'Have you done your homework?' },
      { V1: 'see', V3: 'seen', 'Ví dụ': 'I have seen that film.' },
      { V1: 'eat', V3: 'eaten', 'Ví dụ': "I've already eaten." },
      { V1: 'write', V3: 'written', 'Ví dụ': 'She has written three emails.' },
      { V1: 'take', V3: 'taken', 'Ví dụ': 'He has taken the test.' },
      { V1: 'make', V3: 'made', 'Ví dụ': "I've made a mistake." },
      { V1: 'have', V3: 'had', 'Ví dụ': 'We have had lunch.' },
      { V1: 'get', V3: 'got / gotten', 'Ví dụ': "I've got better. / AmE gotten" },
      { V1: 'know', V3: 'known', 'Ví dụ': 'I have known her for years.' },
      { V1: 'lose', V3: 'lost', 'Ví dụ': "I've lost my phone." },
      { V1: 'find', V3: 'found', 'Ví dụ': 'Have you found it?' },
      { V1: 'leave', V3: 'left', 'Ví dụ': 'They have left.' },
      { V1: 'buy', V3: 'bought', 'Ví dụ': "She's bought a new bag." },
      { V1: 'come', V3: 'come', 'Ví dụ': 'Has he come yet?' },
      { V1: 'read', V3: 'read', 'Ví dụ': 'I have read the book.' },
      { V1: 'speak', V3: 'spoken', 'Ví dụ': 'Have you spoken to her?' },
    ],
  },
  {
    title: 'Present Perfect · lỗi VN hay gặp',
    icon: '⚠️',
    rows: [
      { Sai: 'I have saw that movie.', Đúng: 'I have seen that movie.', 'Vì sao': 'cần V3 (seen), không V2' },
      { Sai: 'She have finished.', Đúng: 'She has finished.', 'Vì sao': 'she → has' },
      { Sai: 'I have finished yesterday.', Đúng: 'I finished yesterday.', 'Vì sao': 'yesterday → Past Simple' },
      { Sai: 'Did you ever go to Japan?', Đúng: 'Have you ever been to Japan?', 'Vì sao': 'ever (kinh nghiệm) → PP' },
      { Sai: 'I am living here for 5 years.', Đúng: 'I have lived / have been living here for 5 years.', 'Vì sao': 'for + đến hiện tại → PP' },
      { Sai: "I haven't finished already.", Đúng: "I haven't finished yet.", 'Vì sao': 'phủ định → yet' },
    ],
  },
];

// ─── present perfect continuous ─────────────────────────────────────────────

/** @type {Bank[]} */
export const PRESENT_PERFECT_CONT_BANKS = [
  {
    title: 'Hiện tại hoàn thành tiếp diễn · have/has been + V-ing',
    icon: '🔄',
    note: 'Nhấn mạnh hành động kéo dài / vừa mới dừng và còn dấu hiệu. for / since / How long…?',
    rows: [
      { 'Chủ ngữ': 'I / you / we / they', 'Cấu trúc': 'have been + V-ing', 'Ví dụ': 'I have been waiting for an hour.' },
      { 'Chủ ngữ': 'he / she / it', 'Cấu trúc': 'has been + V-ing', 'Ví dụ': 'She has been studying all morning.' },
      { 'Phủ định': "haven't / hasn't been + V-ing", 'Ví dụ': "He hasn't been sleeping well." },
      { 'Nghi vấn': 'Have/Has + S + been + V-ing…?', 'Ví dụ': 'Have you been crying?' },
    ],
  },
  {
    title: 'PP vs PPC · khi nào chọn dạng nào',
    icon: '⚖️',
    rows: [
      { 'Present Perfect': 'kết quả / số lượng / hoàn thành', 'PPC': 'kéo dài / đang diễn tiến', 'Ví dụ PP': 'I have written three emails.', 'Ví dụ PPC': 'I have been writing emails all morning.' },
      { 'Present Perfect': 'live / work / know (thường PP đơn)', 'PPC': 'wait / study / rain (kéo dài rõ)', 'Ví dụ PP': 'I have known her for years.', 'Ví dụ PPC': 'It has been raining since noon.' },
      { 'Cả hai OK': 'live / work / study + for/since', 'Ghi chú': 'PPC nhấn “vẫn đang / liên tục”', 'Ví dụ PP': 'I have lived here for 5 years.', 'Ví dụ PPC': 'I have been living here for 5 years.' },
    ],
  },
  {
    title: 'PPC · lỗi hay gặp',
    icon: '⚠️',
    rows: [
      { Sai: 'I have been know him for years.', Đúng: 'I have known him for years.', 'Vì sao': 'know = stative → không PPC' },
      { Sai: 'She has been written three pages.', Đúng: 'She has written three pages. / She has been writing…', 'Vì sao': 'số lượng hoàn thành → PP; been + V-ing' },
      { Sai: 'How long are you waiting?', Đúng: 'How long have you been waiting?', 'Vì sao': 'từ quá khứ đến giờ → PPC' },
    ],
  },
];

// ─── past perfect ───────────────────────────────────────────────────────────

/** @type {Bank[]} */
export const PAST_PERFECT_BANKS = [
  {
    title: 'Quá khứ hoàn thành · had + V3',
    icon: '⏪',
    note: 'had + V3 cho mọi ngôi. Hành động xảy ra **trước** một mốc/hành động quá khứ khác.',
    rows: [
      { 'Khẳng định (+)': 'S + had + V3', 'Ví dụ': 'I had finished before he arrived.' },
      { 'Phủ định (−)': "S + hadn't + V3", 'Ví dụ': "She hadn't seen the film before." },
      { 'Nghi vấn (?)': 'Had + S + V3…?', 'Ví dụ': 'Had you met him before the party?' },
      { 'Rút gọn': "I'd / you'd / he'd / she'd / we'd / they'd + V3", 'Ví dụ': "I'd already left." },
    ],
  },
  {
    title: 'Past Perfect · dấu hiệu & mẫu câu',
    icon: '📌',
    rows: [
      { 'Mẫu': 'S + had + V3 + before + S + V2', 'Ví dụ': 'I had eaten before I went out.' },
      { 'Mẫu': 'After + S + had + V3, S + V2', 'Ví dụ': 'After she had done homework, she watched TV.' },
      { 'Mẫu': 'When + S + V2, S + had + V3 (trước đó)', 'Ví dụ': 'When we arrived, the train had left.' },
      { 'Mẫu': 'by the time + S + V2, S + had + V3', 'Ví dụ': 'By the time I got home, he had cooked dinner.' },
      { 'Mẫu': 'already / never / just + Past Perfect', 'Ví dụ': 'I had never flown before that day.' },
      { 'Mẫu': 'It was the first time + S + had + V3', 'Ví dụ': 'It was the first time I had driven.' },
    ],
  },
  {
    title: 'Past Simple vs Past Perfect',
    icon: '⚖️',
    rows: [
      { 'Trường hợp': 'Chỉ 1 hành động quá khứ', 'Dùng': 'Past Simple', 'Ví dụ': 'I finished at 8.' },
      { 'Trường hợp': '2 hành động — cái trước', 'Dùng': 'Past Perfect + Past Simple (cái sau)', 'Ví dụ': 'I had finished before she called.' },
      { Sai: 'When I arrived, he left. (nếu muốn “đã rời trước”)', Đúng: 'When I arrived, he had left.', 'Vì sao': 'rời đi xảy ra trước lúc tới' },
      { Sai: 'I had finished yesterday at 5. (chỉ 1 mốc, không cần)', Đúng: 'I finished yesterday at 5.', 'Vì sao': 'không có hành động QK khác để so' },
    ],
  },
];

// ─── past perfect continuous (if topic exists) - skip if not in DB
// ─── passive voice ──────────────────────────────────────────────────────────

/** @type {Bank[]} */
export const PASSIVE_BANKS = [
  {
    title: 'Câu bị động · be + V3 (các thì chính)',
    icon: '🔁',
    note: 'Tân ngữ chủ động → chủ ngữ bị động. Agent: by + N (có thể bỏ nếu không quan trọng).',
    rows: [
      { 'Thì': 'Hiện tại đơn', 'Cấu trúc': 'am/is/are + V3', 'Ví dụ': 'English is spoken here. · The room is cleaned every day.' },
      { 'Thì': 'Hiện tại tiếp diễn', 'Cấu trúc': 'am/is/are + being + V3', 'Ví dụ': 'The house is being painted.' },
      { 'Thì': 'Quá khứ đơn', 'Cấu trúc': 'was/were + V3', 'Ví dụ': 'The letter was sent yesterday.' },
      { 'Thì': 'Quá khứ tiếp diễn', 'Cấu trúc': 'was/were + being + V3', 'Ví dụ': 'The car was being repaired.' },
      { 'Thì': 'Hiện tại hoàn thành', 'Cấu trúc': 'have/has been + V3', 'Ví dụ': 'The work has been finished.' },
      { 'Thì': 'Quá khứ hoàn thành', 'Cấu trúc': 'had been + V3', 'Ví dụ': 'The window had been broken.' },
      { 'Thì': 'Tương lai will', 'Cấu trúc': 'will be + V3', 'Ví dụ': 'The results will be announced tomorrow.' },
      { 'Thì': 'be going to', 'Cấu trúc': 'am/is/are going to be + V3', 'Ví dụ': 'The bridge is going to be built.' },
      { 'Thì': 'Modal', 'Cấu trúc': 'can/must/should + be + V3', 'Ví dụ': 'This must be done carefully. · It can be fixed.' },
    ],
  },
  {
    title: 'Chủ động → bị động (các bước)',
    icon: '🧩',
    rows: [
      { Bước: '1', 'Làm gì': 'Xác định tân ngữ → làm chủ ngữ mới', 'Ví dụ': 'Someone stole my bike. → My bike…' },
      { Bước: '2', 'Làm gì': 'Chia be đúng thì của V chính', 'Ví dụ': 'stole (QKĐ) → was/were' },
      { Bước: '3', 'Làm gì': 'V chính → V3', 'Ví dụ': 'stolen' },
      { Bước: '4', 'Làm gì': 'by + chủ ngữ cũ (nếu cần)', 'Ví dụ': 'My bike was stolen (by someone).' },
      { 'Chủ động': 'They build houses.', 'Bị động': 'Houses are built.' },
      { 'Chủ động': 'She wrote the email.', 'Bị động': 'The email was written (by her).' },
      { 'Chủ động': 'People speak English here.', 'Bị động': 'English is spoken here.' },
      { 'Chủ động': 'Someone has cleaned the room.', 'Bị động': 'The room has been cleaned.' },
      { 'Chủ động': 'They will open a new shop.', 'Bị động': 'A new shop will be opened.' },
      { 'Chủ động': 'You must finish this.', 'Bị động': 'This must be finished.' },
    ],
  },
  {
    title: 'Bị động · lỗi hay gặp',
    icon: '⚠️',
    rows: [
      { Sai: 'The letter was write yesterday.', Đúng: 'The letter was written yesterday.', 'Vì sao': 'be + V3' },
      { Sai: 'English spoken here.', Đúng: 'English is spoken here.', 'Vì sao': 'thiếu be' },
      { Sai: 'The room has cleaned.', Đúng: 'The room has been cleaned.', 'Vì sao': 'PP bị động: have been + V3' },
      { Sai: 'The cake was ate.', Đúng: 'The cake was eaten.', 'Vì sao': 'V3 = eaten' },
      { Sai: 'I was given me a book. (trộn)', Đúng: 'I was given a book. / A book was given to me.', 'Vì sao': '2 tân ngữ → 2 cách bị động' },
    ],
  },
];

// ─── reported speech ────────────────────────────────────────────────────────

/** @type {Bank[]} */
export const REPORTED_SPEECH_BANKS = [
  {
    title: 'Tường thuật · lùi thì (backshift) khi reporting verb QK',
    icon: '💬',
    note: 'Said / told + (that)… Thường lùi thì. told + tân ngữ (told me).',
    rows: [
      { 'Trực tiếp (thì)': 'Hiện tại đơn', 'Gián tiếp': 'Quá khứ đơn', 'Ví dụ': '"I work here." → He said he worked there.' },
      { 'Trực tiếp (thì)': 'Hiện tại tiếp diễn', 'Gián tiếp': 'Quá khứ tiếp diễn', 'Ví dụ': '"I am reading." → She said she was reading.' },
      { 'Trực tiếp (thì)': 'Quá khứ đơn', 'Gián tiếp': 'Quá khứ hoàn thành', 'Ví dụ': '"I saw her." → He said he had seen her.' },
      { 'Trực tiếp (thì)': 'Hiện tại hoàn thành', 'Gián tiếp': 'Quá khứ hoàn thành', 'Ví dụ': '"I have finished." → She said she had finished.' },
      { 'Trực tiếp (thì)': 'will', 'Gián tiếp': 'would', 'Ví dụ': '"I will call." → He said he would call.' },
      { 'Trực tiếp (thì)': 'can', 'Gián tiếp': 'could', 'Ví dụ': '"I can swim." → She said she could swim.' },
      { 'Trực tiếp (thì)': 'may', 'Gián tiếp': 'might', 'Ví dụ': '"I may come." → He said he might come.' },
      { 'Trực tiếp (thì)': 'must / have to', 'Gián tiếp': 'had to (thường)', 'Ví dụ': '"I must go." → She said she had to go.' },
    ],
  },
  {
    title: 'Đổi đại từ / trạng từ chỉ thời gian–nơi chốn',
    icon: '🔄',
    rows: [
      { 'Trực tiếp': 'this / these', 'Gián tiếp': 'that / those', 'Ví dụ': '"I like this." → He said he liked that.' },
      { 'Trực tiếp': 'here', 'Gián tiếp': 'there', 'Ví dụ': '"I live here." → She said she lived there.' },
      { 'Trực tiếp': 'now', 'Gián tiếp': 'then', 'Ví dụ': '"I am busy now." → He said he was busy then.' },
      { 'Trực tiếp': 'today', 'Gián tiếp': 'that day', 'Ví dụ': '"I will go today." → She said she would go that day.' },
      { 'Trực tiếp': 'tomorrow', 'Gián tiếp': 'the next day / the following day', 'Ví dụ': '"See you tomorrow." → He said he would see me the next day.' },
      { 'Trực tiếp': 'yesterday', 'Gián tiếp': 'the day before / the previous day', 'Ví dụ': '"I came yesterday." → She said she had come the day before.' },
      { 'Trực tiếp': 'last week', 'Gián tiếp': 'the week before', 'Ví dụ': '"I met him last week." → … the week before.' },
      { 'Trực tiếp': 'next week', 'Gián tiếp': 'the following week', 'Ví dụ': '"I leave next week." → … the following week.' },
      { 'Trực tiếp': 'ago', 'Gián tiếp': 'before', 'Ví dụ': '"I left 2 days ago." → … two days before.' },
    ],
  },
  {
    title: 'Câu hỏi / mệnh lệnh tường thuật',
    icon: '❓',
    rows: [
      { 'Loại': 'Yes/No question', 'Cấu trúc': 'asked + if/whether + S + V (trật tự khẳng định)', 'Ví dụ': '"Do you like tea?" → He asked if I liked tea.' },
      { 'Loại': 'WH question', 'Cấu trúc': 'asked + WH + S + V', 'Ví dụ': '"Where do you live?" → She asked where I lived.' },
      { 'Loại': 'Mệnh lệnh (+)', 'Cấu trúc': 'told/asked + O + to + V1', 'Ví dụ': '"Sit down." → He told me to sit down.' },
      { 'Loại': 'Mệnh lệnh (−)', 'Cấu trúc': 'told/asked + O + not to + V1', 'Ví dụ': "\"Don't go.\" → She told me not to go." },
      { 'Loại': 'said vs told', 'Cấu trúc': 'said (that)… · told + người + (that)…', 'Ví dụ': 'He said he was tired. · He told me he was tired.' },
    ],
  },
  {
    title: 'Reported speech · lỗi hay gặp',
    icon: '⚠️',
    rows: [
      { Sai: 'He said me he was tired.', Đúng: 'He told me he was tired. / He said he was tired.', 'Vì sao': 'said không + tân ngữ người trực tiếp' },
      { Sai: 'She asked where did I live.', Đúng: 'She asked where I lived.', 'Vì sao': 'không đảo trợ động từ trong GI' },
      { Sai: 'He told to me to go.', Đúng: 'He told me to go.', 'Vì sao': 'told + O (không to me) + to V' },
      { Sai: 'She said she will come. (nếu said ở QK & đã lùi)', Đúng: 'She said she would come.', 'Vì sao': 'will → would' },
    ],
  },
];

// ─── relative clauses ───────────────────────────────────────────────────────

/** @type {Bank[]} */
export const RELATIVE_CLAUSE_BANKS = [
  {
    title: 'Đại từ quan hệ · who / which / that / whose / where / when',
    icon: '🔗',
    note: 'Mệnh đề quan hệ bổ nghĩa cho danh từ đứng trước.',
    rows: [
      { 'Đại từ': 'who', 'Thay': 'người (chủ ngữ / tân ngữ)', 'Ví dụ': 'The man who lives next door is a doctor.' },
      { 'Đại từ': 'whom', 'Thay': 'người (tân ngữ, formal)', 'Ví dụ': 'The woman whom I met is kind. (thường dùng who/that)' },
      { 'Đại từ': 'which', 'Thay': 'vật / thú / cả mệnh đề', 'Ví dụ': 'The book which I bought is good.' },
      { 'Đại từ': 'that', 'Thay': 'người hoặc vật (defining)', 'Ví dụ': 'The car that I drive is old.' },
      { 'Đại từ': 'whose', 'Thay': 'sở hữu (người/vật)', 'Ví dụ': 'The girl whose phone is ringing…' },
      { 'Đại từ': 'where', 'Thay': 'nơi chốn', 'Ví dụ': 'This is the house where I was born.' },
      { 'Đại từ': 'when', 'Thay': 'thời gian', 'Ví dụ': 'I remember the day when we met.' },
      { 'Đại từ': 'why', 'Thay': 'lý do (the reason why)', 'Ví dụ': 'That is the reason why I left.' },
    ],
  },
  {
    title: 'Defining vs Non-defining',
    icon: '📌',
    rows: [
      { 'Loại': 'Defining (xác định)', 'Dấu phẩy': 'không phẩy', 'that': 'được dùng', 'Ví dụ': 'Students who study hard pass the exam.' },
      { 'Loại': 'Non-defining (bổ sung)', 'Dấu phẩy': 'có phẩy', 'that': 'KHÔNG dùng that', 'Ví dụ': 'My brother, who lives in Hue, is a teacher.' },
      { 'Loại': 'Bỏ đại từ (tân ngữ, defining)', 'Khi': 'who/which/that = tân ngữ', 'Ví dụ': 'The book (that) I read was long.' },
      { 'Loại': 'Không bỏ', 'Khi': 'who/which = chủ ngữ', 'Ví dụ': 'The man who called you… (không bỏ who)' },
    ],
  },
  {
    title: 'Relative · lỗi hay gặp',
    icon: '⚠️',
    rows: [
      { Sai: 'The man which lives here…', Đúng: 'The man who/that lives here…', 'Vì sao': 'người → who/that' },
      { Sai: 'The book who I bought…', Đúng: 'The book which/that I bought…', 'Vì sao': 'vật → which/that' },
      { Sai: 'My father, that is 50,…', Đúng: 'My father, who is 50,…', 'Vì sao': 'non-defining không that' },
      { Sai: 'The girl who her phone…', Đúng: 'The girl whose phone…', 'Vì sao': 'sở hữu → whose' },
      { Sai: 'The house which I live…', Đúng: 'The house where I live… / which I live in…', 'Vì sao': 'nơi chốn → where hoặc giới từ' },
    ],
  },
];

// ─── gerunds & infinitives ──────────────────────────────────────────────────

/** @type {Bank[]} */
export const GERUND_INFINITIVE_BANKS = [
  {
    title: 'V-ing (gerund) sau động từ / giới từ (list thi)',
    icon: '📎',
    note: 'Gerund = V-ing dùng như danh từ. Sau giới từ luôn V-ing.',
    rows: [
      { 'Động từ / cấu trúc': 'enjoy', 'Sau đó': 'V-ing', 'Ví dụ': 'I enjoy reading.' },
      { 'Động từ / cấu trúc': 'finish', 'Sau đó': 'V-ing', 'Ví dụ': 'She finished writing.' },
      { 'Động từ / cấu trúc': 'mind', 'Sau đó': 'V-ing', 'Ví dụ': 'Do you mind waiting?' },
      { 'Động từ / cấu trúc': 'keep / keep on', 'Sau đó': 'V-ing', 'Ví dụ': 'Keep going!' },
      { 'Động từ / cấu trúc': 'practice', 'Sau đó': 'V-ing', 'Ví dụ': 'Practice speaking English.' },
      { 'Động từ / cấu trúc': 'suggest', 'Sau đó': 'V-ing', 'Ví dụ': 'I suggest taking a taxi.' },
      { 'Động từ / cấu trúc': 'avoid', 'Sau đó': 'V-ing', 'Ví dụ': 'Avoid eating too much sugar.' },
      { 'Động từ / cấu trúc': 'consider', 'Sau đó': 'V-ing', 'Ví dụ': 'We considered moving.' },
      { 'Động từ / cấu trúc': 'dislike / hate / like (thường)', 'Sau đó': 'V-ing (hoặc to V)', 'Ví dụ': 'I like swimming. / I like to swim.' },
      { 'Động từ / cấu trúc': 'feel like', 'Sau đó': 'V-ing', 'Ví dụ': 'I feel like sleeping.' },
      { 'Động từ / cấu trúc': 'look forward to', 'Sau đó': 'V-ing', 'Ví dụ': 'I look forward to meeting you.' },
      { 'Động từ / cấu trúc': 'be used to / get used to', 'Sau đó': 'V-ing', 'Ví dụ': 'I am used to getting up early.' },
      { 'Động từ / cấu trúc': 'be good at / interested in…', 'Sau đó': 'V-ing', 'Ví dụ': 'She is good at drawing.' },
      { 'Động từ / cấu trúc': 'after / before / without / by', 'Sau đó': 'V-ing', 'Ví dụ': 'After finishing, go home. · without saying goodbye' },
      { 'Động từ / cấu trúc': 'spend time', 'Sau đó': 'V-ing', 'Ví dụ': 'I spend time reading.' },
      { 'Động từ / cấu trúc': "can't help / can't stand", 'Sau đó': 'V-ing', 'Ví dụ': "I can't help laughing." },
    ],
  },
  {
    title: 'to V (infinitive) sau động từ (list thi)',
    icon: '➡️',
    rows: [
      { 'Động từ / cấu trúc': 'want / would like', 'Sau đó': 'to V', 'Ví dụ': 'I want to learn English.' },
      { 'Động từ / cấu trúc': 'need / hope / plan', 'Sau đó': 'to V', 'Ví dụ': 'We plan to travel.' },
      { 'Động từ / cấu trúc': 'decide / agree / refuse', 'Sau đó': 'to V', 'Ví dụ': 'She decided to stay.' },
      { 'Động từ / cấu trúc': 'promise / offer / threaten', 'Sau đó': 'to V', 'Ví dụ': 'He promised to help.' },
      { 'Động từ / cấu trúc': 'learn / manage / fail', 'Sau đó': 'to V', 'Ví dụ': 'I managed to finish.' },
      { 'Động từ / cấu trúc': 'seem / appear / tend', 'Sau đó': 'to V', 'Ví dụ': 'She seems to be tired.' },
      { 'Động từ / cấu trúc': 'afford / deserve', 'Sau đó': 'to V', 'Ví dụ': "I can't afford to buy it." },
      { 'Động từ / cấu trúc': 'ask / tell / want + O', 'Sau đó': 'to V', 'Ví dụ': 'She told me to wait.' },
      { 'Động từ / cấu trúc': 'It is adj + to V', 'Sau đó': 'to V', 'Ví dụ': 'It is easy to learn.' },
      { 'Động từ / cấu trúc': 'too adj / enough', 'Sau đó': 'to V', 'Ví dụ': 'too tired to walk · old enough to drive' },
      { 'Động từ / cấu trúc': 'in order to / so as to', 'Sau đó': 'to V', 'Ví dụ': 'I study in order to pass.' },
    ],
  },
  {
    title: 'V-ing vs to V · nghĩa khác (bẫy đề)',
    icon: '🔀',
    rows: [
      { 'Động từ': 'stop + V-ing', 'Nghĩa': 'dừng hẳn việc đang làm', 'Ví dụ': 'He stopped smoking. (bỏ thuốc)' },
      { 'Động từ': 'stop + to V', 'Nghĩa': 'dừng lại để làm việc khác', 'Ví dụ': 'He stopped to smoke. (dừng lại để hút)' },
      { 'Động từ': 'remember + V-ing', 'Nghĩa': 'nhớ đã làm', 'Ví dụ': 'I remember locking the door.' },
      { 'Động từ': 'remember + to V', 'Nghĩa': 'nhớ phải làm', 'Ví dụ': 'Remember to lock the door.' },
      { 'Động từ': 'forget + V-ing', 'Nghĩa': 'quên đã từng làm', 'Ví dụ': "I'll never forget meeting her." },
      { 'Động từ': 'forget + to V', 'Nghĩa': 'quên phải làm', 'Ví dụ': 'I forgot to call you.' },
      { 'Động từ': 'try + V-ing', 'Nghĩa': 'thử cách', 'Ví dụ': 'Try restarting the phone.' },
      { 'Động từ': 'try + to V', 'Nghĩa': 'cố gắng', 'Ví dụ': 'I tried to open the door.' },
      { 'Động từ': 'regret + V-ing', 'Nghĩa': 'tiếc đã làm', 'Ví dụ': 'I regret saying that.' },
      { 'Động từ': 'regret + to V', 'Nghĩa': 'rất tiếc phải (formal)', 'Ví dụ': 'We regret to inform you…' },
      { 'Động từ': 'used to + V', 'Nghĩa': 'đã từng (thói quen QK)', 'Ví dụ': 'I used to play football.' },
      { 'Động từ': 'be used to + V-ing', 'Nghĩa': 'quen với', 'Ví dụ': 'I am used to playing…' },
    ],
  },
  {
    title: 'Gerund / Infinitive · lỗi hay gặp',
    icon: '⚠️',
    rows: [
      { Sai: 'I enjoy to read.', Đúng: 'I enjoy reading.', 'Vì sao': 'enjoy + V-ing' },
      { Sai: 'I want going home.', Đúng: 'I want to go home.', 'Vì sao': 'want + to V' },
      { Sai: 'I look forward to meet you.', Đúng: 'I look forward to meeting you.', 'Vì sao': 'to là giới từ → V-ing' },
      { Sai: 'I am used to get up early.', Đúng: 'I am used to getting up early.', 'Vì sao': 'be used to + V-ing' },
      { Sai: 'She suggested to go out.', Đúng: 'She suggested going out.', 'Vì sao': 'suggest + V-ing' },
    ],
  },
];

// ─── used to ────────────────────────────────────────────────────────────────

/** @type {Bank[]} */
export const USED_TO_BANKS = [
  {
    title: 'used to + V1 · thói quen / trạng thái quá khứ không còn',
    icon: '📟',
    rows: [
      { 'Khẳng định (+)': 'S + used to + V1', 'Ví dụ': 'I used to play football every day.' },
      { 'Phủ định (−)': "S + didn't use to + V1", 'Ví dụ': "She didn't use to like coffee." },
      { 'Nghi vấn (?)': 'Did + S + use to + V1…?', 'Ví dụ': 'Did you use to live here?' },
      { 'Nghĩa': 'đã từng nhưng không còn', 'Ví dụ': 'There used to be a cinema here.' },
    ],
  },
  {
    title: 'used to vs be used to vs get used to',
    icon: '⚖️',
    rows: [
      { 'Cấu trúc': 'used to + V1', 'Nghĩa': 'đã từng (QK)', 'Ví dụ': 'I used to smoke. (đã bỏ)' },
      { 'Cấu trúc': 'be used to + N / V-ing', 'Nghĩa': 'quen với (hiện tại)', 'Ví dụ': 'I am used to the noise. · used to getting up early' },
      { 'Cấu trúc': 'get used to + N / V-ing', 'Nghĩa': 'trở nên quen', 'Ví dụ': 'You will get used to it.' },
      { Sai: 'I am used to wake up early.', Đúng: 'I am used to waking up early. / I used to wake up early.', 'Vì sao': 'be used to + V-ing · used to + V1' },
      { Sai: 'I used to waking up early.', Đúng: 'I used to wake up early.', 'Vì sao': 'used to + V1' },
    ],
  },
];

// ─── question tags ──────────────────────────────────────────────────────────

/** @type {Bank[]} */
export const QUESTION_TAG_BANKS = [
  {
    title: 'Question tags · quy tắc chính',
    icon: '🏷️',
    note: 'Câu khẳng định → tag phủ định. Câu phủ định → tag khẳng định. Trùng trợ động từ / thì.',
    rows: [
      { 'Câu chính': "You're a student,", 'Tag': "aren't you?", 'Ghi chú': 'be → be' },
      { 'Câu chính': "She isn't tired,", 'Tag': 'is she?', 'Ghi chú': 'phủ định → tag +' },
      { 'Câu chính': 'You work here,', 'Tag': "don't you?", 'Ghi chú': 'HTĐ → do/does' },
      { 'Câu chính': 'He works hard,', 'Tag': "doesn't he?", 'Ghi chú': 'he + does' },
      { 'Câu chính': "They don't like tea,", 'Tag': 'do they?', 'Ghi chú': "don't → do" },
      { 'Câu chính': 'She went home,', 'Tag': "didn't she?", 'Ghi chú': 'QKĐ → did' },
      { 'Câu chính': "You've finished,", 'Tag': "haven't you?", 'Ghi chú': 'have/has PP' },
      { 'Câu chính': 'He can swim,', 'Tag': "can't he?", 'Ghi chú': 'modal lặp' },
      { 'Câu chính': "You won't tell,", 'Tag': 'will you?', 'Ghi chú': "won't → will" },
      { 'Câu chính': "Let's go,", 'Tag': 'shall we?', 'Ghi chú': "cố định Let's" },
      { 'Câu chính': 'Open the door,', 'Tag': 'will you? / would you?', 'Ghi chú': 'mệnh lệnh' },
      { 'Câu chính': "Don't be late,", 'Tag': 'will you?', 'Ghi chú': 'mệnh lệnh phủ định' },
      { 'Câu chính': "I'm late,", 'Tag': "aren't I?", 'Ghi chú': "I am → aren't I (không amn't I)" },
      { 'Câu chính': 'There is a book,', 'Tag': "isn't there?", 'Ghi chú': 'there → there' },
      { 'Câu chính': 'This is yours,', 'Tag': "isn't it?", 'Ghi chú': 'this/that → it' },
      { 'Câu chính': 'Everyone is ready,', 'Tag': "aren't they?", 'Ghi chú': 'everyone → they' },
    ],
  },
  {
    title: 'Question tags · lỗi hay gặp',
    icon: '⚠️',
    rows: [
      { Sai: "You're tired, are you?", Đúng: "You're tired, aren't you?", 'Vì sao': '+ → tag −' },
      { Sai: 'She works, does she?', Đúng: "She works, doesn't she?", 'Vì sao': 'khẳng định → tag phủ định' },
      { Sai: "I'm right, am not I?", Đúng: "I'm right, aren't I?", 'Vì sao': "aren't I cố định" },
      { Sai: "Let's start, will we?", Đúng: "Let's start, shall we?", 'Vì sao': "Let's → shall we" },
    ],
  },
];

// ─── second / third conditional ─────────────────────────────────────────────

/** @type {Bank[]} */
export const SECOND_CONDITIONAL_BANKS = [
  {
    title: 'Điều kiện loại 2 · giả định hiện tại / trái hiện tại',
    icon: '2️⃣',
    note: 'If + Past Simple, would/could/might + V1. Be → were (formal/mọi ngôi) hoặc was (thân mật).',
    rows: [
      { 'Cấu trúc': 'If + S + V2, S + would + V1', 'Ví dụ': 'If I had more money, I would travel.' },
      { 'Cấu trúc': 'If + S + were…, S + would + V1', 'Ví dụ': 'If I were you, I would study harder.' },
      { 'Cấu trúc': 'If + S + V2, S + could + V1', 'Ví dụ': 'If I spoke English well, I could work abroad.' },
      { 'Cấu trúc': 'If + S + V2, S + might + V1', 'Ví dụ': 'If you asked her, she might help.' },
      { 'Cấu trúc': 'would + V1 + if + Past Simple', 'Ví dụ': 'I would help if I had time.' },
      { 'Cấu trúc': "If + S + didn't + V1…", 'Ví dụ': "If he didn't live so far, we would meet more." },
      { 'Cấu trúc': 'What would you do if…?', 'Ví dụ': 'What would you do if you won the lottery?' },
    ],
  },
  {
    title: 'Loại 2 · ví dụ tình huống (list)',
    icon: '📋',
    rows: [
      { 'Tình huống': 'Lời khuyên (If I were you)', 'Ví dụ': 'If I were you, I would see a doctor.' },
      { 'Tình huống': 'Ước không thật hiện tại', 'Ví dụ': 'If I lived near the sea, I would swim every day.' },
      { 'Tình huống': 'Khả năng giả định', 'Ví dụ': 'If we had a car, we could go now.' },
      { 'Tình huống': 'Phủ định', 'Ví dụ': "If she weren't busy, she would come." },
    ],
  },
  {
    title: 'Loại 1 vs 2 · lỗi',
    icon: '⚖️',
    rows: [
      { 'Loại 1': 'có thể xảy ra (tương lai)', 'Loại 2': 'không thật / khó xảy ra (hiện tại)', 'Ví dụ 1': 'If I am free, I will call you.', 'Ví dụ 2': 'If I were free, I would call you.' },
      { Sai: 'If I will be rich, I would buy…', Đúng: 'If I were rich, I would buy…', 'Vì sao': 'loại 2: if + QKĐ' },
      { Sai: 'If I was you… (thi formal)', Đúng: 'If I were you…', 'Vì sao': 'were khuyến nghị trong đề' },
      { Sai: 'If I knew, I will tell you.', Đúng: 'If I knew, I would tell you.', 'Vì sao': 'mệnh đề chính loại 2: would + V1' },
    ],
  },
];

/** @type {Bank[]} */
export const THIRD_CONDITIONAL_BANKS = [
  {
    title: 'Điều kiện loại 3 · giả định quá khứ (không thể đổi)',
    icon: '3️⃣',
    note: 'If + Past Perfect, would have + V3. Diễn tả tiếc nuối / giả định về quá khứ.',
    rows: [
      { 'Cấu trúc': 'If + S + had + V3, S + would have + V3', 'Ví dụ': 'If I had studied, I would have passed.' },
      { 'Cấu trúc': "If + S + hadn't + V3…", 'Ví dụ': "If she hadn't been late, she would have caught the bus." },
      { 'Cấu trúc': 'would have + V3 + if + had + V3', 'Ví dụ': 'I would have called if I had known.' },
      { 'Cấu trúc': 'could have + V3', 'Ví dụ': 'If we had left earlier, we could have arrived on time.' },
      { 'Cấu trúc': 'might have + V3', 'Ví dụ': 'If you had asked, I might have helped.' },
      { 'Cấu trúc': "wouldn't have + V3", 'Ví dụ': "If he had driven carefully, he wouldn't have crashed." },
    ],
  },
  {
    title: 'Loại 3 · tình huống',
    icon: '📋',
    rows: [
      { 'Tình huống': 'Tiếc vì không học', 'Ví dụ': "If I had worked harder, I would have got a better job." },
      { 'Tình huống': 'Tiếc vì không mang ô', 'Ví dụ': "If I had taken an umbrella, I wouldn't have got wet." },
      { 'Tình huống': 'Kết quả khác trong QK', 'Ví dụ': 'If they had invited me, I would have gone.' },
    ],
  },
  {
    title: 'Loại 2 vs 3 + lỗi',
    icon: '⚠️',
    rows: [
      { 'Loại 2': 'hiện tại không thật', 'Loại 3': 'quá khứ không thật', 'Ví dụ 2': 'If I knew, I would tell you.', 'Ví dụ 3': 'If I had known, I would have told you.' },
      { Sai: 'If I would have studied, I would have passed.', Đúng: 'If I had studied, I would have passed.', 'Vì sao': 'if-clause: had + V3 (không would have)' },
      { Sai: 'If I had studied, I would pass.', Đúng: 'If I had studied, I would have passed.', 'Vì sao': 'mệnh đề chính loại 3: would have + V3' },
      { Sai: 'If I studied harder, I would have passed. (trộn)', Đúng: 'If I had studied harder, I would have passed.', 'Vì sao': 'cả 2 vế phải khớp loại 3' },
    ],
  },
];

// ─── future continuous ──────────────────────────────────────────────────────

/** @type {Bank[]} */
export const FUTURE_CONTINUOUS_BANKS = [
  {
    title: 'Tương lai tiếp diễn · will be + V-ing',
    icon: '🔮',
    note: 'Hành động sẽ đang diễn ra tại một thời điểm trong tương lai.',
    rows: [
      { 'Khẳng định (+)': 'S + will be + V-ing', 'Ví dụ': 'This time tomorrow I will be flying to Ha Noi.' },
      { 'Phủ định (−)': "S + won't be + V-ing", 'Ví dụ': "I won't be working on Sunday." },
      { 'Nghi vấn (?)': 'Will + S + be + V-ing…?', 'Ví dụ': 'Will you be using the car tonight?' },
      { 'Rút gọn': "I'll be / she'll be / they'll be + V-ing", 'Ví dụ': "I'll be waiting outside." },
    ],
  },
  {
    title: 'Dấu hiệu & tình huống dùng',
    icon: '📌',
    rows: [
      { 'Dấu hiệu': 'this time tomorrow / next week', 'Ví dụ': 'This time next week we will be lying on the beach.' },
      { 'Dấu hiệu': 'at + giờ + tomorrow / next…', 'Ví dụ': 'At 8 p.m. tomorrow she will be studying.' },
      { 'Dấu hiệu': 'all day / all morning tomorrow', 'Ví dụ': 'I will be working all day tomorrow.' },
      { 'Tình huống': 'lịch trình / hành động song song tương lai', 'Ví dụ': 'While you are cooking, I will be setting the table.' },
      { 'Tình huống': 'hỏi lịch sự về kế hoạch', 'Ví dụ': 'Will you be using the printer later?' },
      { 'Tình huống': 'đừng gọi vào lúc… (sẽ đang…)', 'Ví dụ': "Don't call at midnight — I'll be sleeping." },
    ],
  },
  {
    title: 'will vs will be V-ing · lỗi',
    icon: '⚖️',
    rows: [
      { will: 'quyết định / dự đoán / hứa', 'will be V-ing': 'đang diễn ra tại mốc tương lai', 'Ví dụ will': "I'll call you later.", 'Ví dụ FC': "Don't call at 8 — I'll be sleeping." },
      { Sai: 'I will working tomorrow at 9.', Đúng: 'I will be working tomorrow at 9.', 'Vì sao': 'will be + V-ing' },
      { Sai: 'She will be work.', Đúng: 'She will be working.', 'Vì sao': 'cần V-ing' },
      { Sai: 'Will be you using the car?', Đúng: 'Will you be using the car?', 'Vì sao': 'Will + S + be + V-ing' },
    ],
  },
];

// ─── modals deduction ───────────────────────────────────────────────────────

/** @type {Bank[]} */
export const MODALS_DEDUCTION_BANKS = [
  {
    title: "Suy đoán · must / might / may / could / can't",
    icon: '🕵️',
    note: "must = chắc chắn có · might/may/could = có lẽ · can't = chắc chắn không.",
    rows: [
      { 'Modal': 'must + V1', 'Mức chắc': 'rất chắc (có)', 'Ví dụ': 'She must be tired. (trông mệt)' },
      { 'Modal': 'might / may + V1', 'Mức chắc': 'có thể', 'Ví dụ': 'He might be at home.' },
      { 'Modal': 'could + V1', 'Mức chắc': 'có thể (khả năng)', 'Ví dụ': 'It could be true.' },
      { 'Modal': "can't + V1", 'Mức chắc': 'chắc chắn không', 'Ví dụ': "He can't be serious." },
      { 'Modal': 'must have + V3', 'Mức chắc': 'chắc đã… (QK)', 'Ví dụ': 'She must have left. (không thấy cô ấy)' },
      { 'Modal': 'might/may have + V3', 'Mức chắc': 'có lẽ đã…', 'Ví dụ': 'He might have forgotten.' },
      { 'Modal': "can't have + V3", 'Mức chắc': 'chắc đã không…', 'Ví dụ': "She can't have done that." },
      { 'Modal': 'should have + V3', 'Mức chắc': 'lẽ ra đã… (tiếc / trách)', 'Ví dụ': 'You should have told me.' },
    ],
  },
  {
    title: "must vs can't (suy đoán) · lỗi",
    icon: '⚠️',
    rows: [
      { Sai: "He mustn't be at home. (muốn nói chắc không)", Đúng: "He can't be at home.", 'Vì sao': "suy đoán phủ định mạnh → can't (mustn't = cấm)" },
      { Sai: 'She must to be tired.', Đúng: 'She must be tired.', 'Vì sao': 'must + V1' },
      { 'Đối chiếu': 'must = chắc có · can\'t = chắc không · might = có lẽ', 'Ví dụ': "The lights are on — she must be home. · The lights are off — she can't be home." },
    ],
  },
];

// ─── conjunctions / linking ─────────────────────────────────────────────────

/** @type {Bank[]} */
export const CONJUNCTIONS_BANKS = [
  {
    title: 'Liên từ / từ nối · and / but / or / so / because…',
    icon: '🔗',
    rows: [
      { 'Từ nối': 'and', 'Nghĩa': 'và', 'Ví dụ': 'I like tea and coffee.' },
      { 'Từ nối': 'but', 'Nghĩa': 'nhưng', 'Ví dụ': 'I am tired but happy.' },
      { 'Từ nối': 'or', 'Nghĩa': 'hoặc', 'Ví dụ': 'Do you want tea or coffee?' },
      { 'Từ nối': 'so', 'Nghĩa': 'vì vậy', 'Ví dụ': 'It was late, so I went home.' },
      { 'Từ nối': 'because', 'Nghĩa': 'bởi vì', 'Ví dụ': 'I stayed home because it rained.' },
      { 'Từ nối': 'because of + N', 'Nghĩa': 'vì (danh từ)', 'Ví dụ': 'because of the rain' },
      { 'Từ nối': 'although / though', 'Nghĩa': 'mặc dù', 'Ví dụ': 'Although I was tired, I finished.' },
      { 'Từ nối': 'even though', 'Nghĩa': 'mặc dù (mạnh hơn)', 'Ví dụ': 'Even though it was cold, we went out.' },
      { 'Từ nối': 'however', 'Nghĩa': 'tuy nhiên (đầu câu / giữa)', 'Ví dụ': 'I was tired. However, I continued.' },
      { 'Từ nối': 'therefore / as a result', 'Nghĩa': 'do đó', 'Ví dụ': 'He was late; therefore, he missed the bus.' },
      { 'Từ nối': 'if / unless', 'Nghĩa': 'nếu / trừ khi', 'Ví dụ': "Unless you hurry, you'll be late." },
      { 'Từ nối': 'when / while / as soon as / until', 'Nghĩa': 'thời gian', 'Ví dụ': 'Call me when you arrive. · Wait until I come.' },
      { 'Từ nối': 'before / after', 'Nghĩa': 'trước / sau', 'Ví dụ': 'Wash your hands before you eat.' },
      { 'Từ nối': 'both… and…', 'Nghĩa': 'cả… và…', 'Ví dụ': 'both English and French' },
      { 'Từ nối': 'either… or…', 'Nghĩa': 'hoặc… hoặc…', 'Ví dụ': 'either tea or coffee' },
      { 'Từ nối': 'neither… nor…', 'Nghĩa': 'không… cũng không…', 'Ví dụ': 'neither tired nor hungry' },
      { 'Từ nối': 'not only… but also…', 'Nghĩa': 'không chỉ… mà còn…', 'Ví dụ': 'not only smart but also kind' },
    ],
  },
  {
    title: 'because vs because of · although vs however',
    icon: '⚠️',
    rows: [
      { Sai: 'I stayed home because of it rained.', Đúng: 'I stayed home because it rained. / because of the rain.', 'Vì sao': 'because + mệnh đề · because of + N' },
      { Sai: 'Although I was tired, but I finished.', Đúng: 'Although I was tired, I finished.', 'Vì sao': 'không although… but…' },
      { Sai: 'However I was tired, I finished.', Đúng: 'I was tired. However, I finished. / Although I was tired…', 'Vì sao': 'however không nối như although' },
    ],
  },
];

// ─── phrasal verbs (starter dense list for A2 topic) ────────────────────────

/** @type {Bank[]} */
export const PHRASAL_VERBS_BANKS = [
  {
    title: 'Phrasal verbs hay gặp A2 (list ôn)',
    icon: '🧩',
    note: 'Động từ + giới từ/trạng từ. Học theo cụm + ví dụ, không dịch từng từ.',
    rows: [
      { 'Cụm': 'wake up', 'Nghĩa': 'thức dậy', 'Ví dụ': 'I wake up at 6.' },
      { 'Cụm': 'get up', 'Nghĩa': 'ngồi dậy / ra khỏi giường', 'Ví dụ': 'She gets up early.' },
      { 'Cụm': 'turn on / turn off', 'Nghĩa': 'bật / tắt', 'Ví dụ': 'Turn off the light.' },
      { 'Cụm': 'turn up / turn down', 'Nghĩa': 'vặn to / nhỏ (âm lượng)', 'Ví dụ': 'Turn down the music.' },
      { 'Cụm': 'look for', 'Nghĩa': 'tìm kiếm', 'Ví dụ': "I'm looking for my keys." },
      { 'Cụm': 'look after', 'Nghĩa': 'chăm sóc', 'Ví dụ': 'She looks after her brother.' },
      { 'Cụm': 'look forward to + V-ing', 'Nghĩa': 'mong đợi', 'Ví dụ': 'I look forward to seeing you.' },
      { 'Cụm': 'give up', 'Nghĩa': 'từ bỏ', 'Ví dụ': 'He gave up smoking.' },
      { 'Cụm': 'put on / take off', 'Nghĩa': 'mặc vào / cởi ra', 'Ví dụ': 'Put on your coat. · Take off your shoes.' },
      { 'Cụm': 'pick up', 'Nghĩa': 'nhặt / đón', 'Ví dụ': "I'll pick you up at 7." },
      { 'Cụm': 'drop off', 'Nghĩa': 'trả / thả (ai đó)', 'Ví dụ': 'Can you drop me off at school?' },
      { 'Cụm': 'run out of', 'Nghĩa': 'hết (cái gì)', 'Ví dụ': 'We have run out of milk.' },
      { 'Cụm': 'find out', 'Nghĩa': 'tìm ra / phát hiện', 'Ví dụ': 'I found out the truth.' },
      { 'Cụm': 'fill in / fill out', 'Nghĩa': 'điền (form)', 'Ví dụ': 'Fill in this form.' },
      { 'Cụm': 'grow up', 'Nghĩa': 'lớn lên', 'Ví dụ': 'I grew up in Da Nang.' },
      { 'Cụm': 'break down', 'Nghĩa': 'hỏng (máy) / sụp đổ', 'Ví dụ': 'My car broke down.' },
      { 'Cụm': 'come back / go back', 'Nghĩa': 'quay lại', 'Ví dụ': 'Come back soon.' },
      { 'Cụm': 'get on / get off', 'Nghĩa': 'lên / xuống (xe buýt…)', 'Ví dụ': 'Get on the bus. · Get off at the next stop.' },
      { 'Cụm': 'get on with', 'Nghĩa': 'hòa hợp với', 'Ví dụ': 'I get on well with my classmates.' },
      { 'Cụm': 'take care of', 'Nghĩa': 'chăm sóc', 'Ví dụ': 'Take care of yourself.' },
      { 'Cụm': 'make up', 'Nghĩa': 'bịa / trang điểm / làm lành', 'Ví dụ': "Don't make up stories." },
      { 'Cụm': 'set up', 'Nghĩa': 'thiết lập / thành lập', 'Ví dụ': 'They set up a company.' },
      { 'Cụm': 'carry on / go on', 'Nghĩa': 'tiếp tục', 'Ví dụ': 'Carry on working.' },
      { 'Cụm': 'work out', 'Nghĩa': 'tập gym / giải ra', 'Ví dụ': 'I work out at the gym. · I worked out the answer.' },
    ],
  },
  {
    title: 'Phrasal · tách được / không tách (A2 nhận biết)',
    icon: '📌',
    rows: [
      { 'Loại': 'Tách được (V + O + particle)', 'Ví dụ': 'Turn the light off. · Turn it off. (không turn off it)' },
      { 'Loại': 'Không tách (V + particle + O)', 'Ví dụ': 'Look after the baby. · Look after him. (không look the baby after)' },
      { 'Mẹo': 'đại từ tân ngữ (it/him/them) đứng giữa nếu tách được', 'Ví dụ': 'Put it on. · Take them off.' },
    ],
  },
];

// ─── map ────────────────────────────────────────────────────────────────────

export function batch3ForSlug(slug) {
  const map = {
    'present-perfect': PRESENT_PERFECT_BANKS,
    'present-perfect-continuous': PRESENT_PERFECT_CONT_BANKS,
    'past-perfect': PAST_PERFECT_BANKS,
    'passive-voice': PASSIVE_BANKS,
    'reported-speech': REPORTED_SPEECH_BANKS,
    'relative-clauses': RELATIVE_CLAUSE_BANKS,
    'gerunds-infinitives': GERUND_INFINITIVE_BANKS,
    'used-to': USED_TO_BANKS,
    'question-tags': QUESTION_TAG_BANKS,
    'second-conditional': SECOND_CONDITIONAL_BANKS,
    'third-conditional': THIRD_CONDITIONAL_BANKS,
    'future-continuous': FUTURE_CONTINUOUS_BANKS,
    'modals-deduction': MODALS_DEDUCTION_BANKS,
    'conjunctions-linking': CONJUNCTIONS_BANKS,
    'phrasal-verbs': PHRASAL_VERBS_BANKS,
  };
  return map[slug] || null;
}
