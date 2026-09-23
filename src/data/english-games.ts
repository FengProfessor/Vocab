export interface GameWord {
  id: string;
  word: string;
  translation: string;
  example?: string;
}

export type GameMode = 'memory' | 'sprint' | 'scramble' | 'sentence' | 'grammar' | 'detective';
export type GameTopic = 'daily' | 'travel' | 'work';

export const GAME_MODES = [
  { id: 'memory', title: 'Lật thẻ tìm đôi', emoji: '🧩', category: 'vocab', label: 'Trí nhớ', description: 'Lật hai thẻ để tìm từ và nghĩa. Nhớ vị trí, nối thật khéo!', color: 'from-violet-500 to-indigo-600' },
  { id: 'sprint', title: 'Đường đua từ vựng', emoji: '🏎️', category: 'vocab', label: '60 giây', description: 'Chọn từ đúng, nối combo. Đồng hồ nghỉ khi bạn đọc lời giải.', color: 'from-orange-400 to-rose-500' },
  { id: 'scramble', title: 'Giải mã chữ cái', emoji: '🔤', category: 'vocab', label: 'Chính tả', description: 'Chạm các chữ cái để giải mã từ bí mật theo nghĩa gợi ý.', color: 'from-cyan-500 to-blue-600' },
  { id: 'sentence', title: 'Xưởng lắp ráp câu', emoji: '🛠️', category: 'grammar', label: 'Trật tự từ', description: 'Ghép những mảnh từ thành câu hoàn chỉnh theo gợi ý.', color: 'from-emerald-400 to-teal-600' },
  { id: 'grammar', title: 'Cầu ngữ pháp', emoji: '🌉', category: 'grammar', label: 'Điền chỗ trống', description: 'Tìm mảnh ghép còn thiếu để bước qua từng nhịp cầu.', color: 'from-blue-500 to-indigo-600' },
  { id: 'detective', title: 'Thám tử săn lỗi', emoji: '🔎', category: 'grammar', label: 'Tìm & sửa lỗi', description: 'Phát hiện từ sai trong câu, rồi khám phá cách sửa.', color: 'from-fuchsia-500 to-purple-600' },
] as const satisfies ReadonlyArray<{ id: GameMode; title: string; emoji: string; category: string; label: string; description: string; color: string }>;

export const GAME_TOPICS: Record<GameTopic, { title: string; emoji: string; words: GameWord[] }> = {
  daily: { title: 'Đời sống', emoji: '☀️', words: [
    { id: 'd1', word: 'breakfast', translation: 'bữa sáng', example: 'I have breakfast at seven.' },
    { id: 'd2', word: 'kitchen', translation: 'nhà bếp', example: 'She is cooking in the kitchen.' },
    { id: 'd3', word: 'neighbor', translation: 'hàng xóm', example: 'Our neighbor is very friendly.' },
    { id: 'd4', word: 'thirsty', translation: 'khát nước', example: 'I am thirsty. Can I have some water?' },
    { id: 'd5', word: 'borrow', translation: 'mượn', example: 'Can I borrow your pen?' },
    { id: 'd6', word: 'usually', translation: 'thường xuyên', example: 'I usually walk to school.' },
    { id: 'd7', word: 'laundry', translation: 'quần áo cần giặt', example: 'I do the laundry on Sundays.' },
    { id: 'd8', word: 'healthy', translation: 'khỏe mạnh', example: 'Exercise keeps you healthy.' },
    { id: 'd9', word: 'quiet', translation: 'yên tĩnh', example: 'The library is quiet.' },
    { id: 'd10', word: 'wallet', translation: 'ví tiền', example: 'My wallet is in my bag.' },
  ] },
  travel: { title: 'Du lịch', emoji: '✈️', words: [
    { id: 't1', word: 'airport', translation: 'sân bay', example: 'We arrived at the airport early.' },
    { id: 't2', word: 'ticket', translation: 'vé', example: 'I bought a train ticket.' },
    { id: 't3', word: 'luggage', translation: 'hành lý', example: 'My luggage is heavy.' },
    { id: 't4', word: 'journey', translation: 'chuyến hành trình', example: 'The journey took three hours.' },
    { id: 't5', word: 'passport', translation: 'hộ chiếu', example: 'Please show your passport.' },
    { id: 't6', word: 'arrive', translation: 'đến nơi', example: 'We will arrive tomorrow.' },
    { id: 't7', word: 'bridge', translation: 'cây cầu', example: 'Walk across the bridge.' },
    { id: 't8', word: 'explore', translation: 'khám phá', example: 'We want to explore the city.' },
    { id: 't9', word: 'crowded', translation: 'đông đúc', example: 'The bus is crowded.' },
    { id: 't10', word: 'suitcase', translation: 'va li', example: 'She packed her suitcase.' },
  ] },
  work: { title: 'Học tập & công việc', emoji: '💼', words: [
    { id: 'w1', word: 'meeting', translation: 'cuộc họp', example: 'The meeting starts at nine.' },
    { id: 'w2', word: 'deadline', translation: 'hạn chót', example: 'The deadline is Friday.' },
    { id: 'w3', word: 'improve', translation: 'cải thiện', example: 'I want to improve my English.' },
    { id: 'w4', word: 'prepare', translation: 'chuẩn bị', example: 'Let us prepare for the test.' },
    { id: 'w5', word: 'explain', translation: 'giải thích', example: 'Can you explain this rule?' },
    { id: 'w6', word: 'achieve', translation: 'đạt được', example: 'You can achieve your goals.' },
    { id: 'w7', word: 'project', translation: 'dự án', example: 'We are working on a new project.' },
    { id: 'w8', word: 'colleague', translation: 'đồng nghiệp', example: 'My colleague helped me today.' },
    { id: 'w9', word: 'schedule', translation: 'lịch trình', example: 'Please check the schedule.' },
    { id: 'w10', word: 'confident', translation: 'tự tin', example: 'I feel confident about the exam.' },
  ] },
};

export interface GrammarPuzzle {
  id: string;
  prompt: string;
  options: string[];
  answer: string;
  explanation: string;
}

export const GRAMMAR_PUZZLES: GrammarPuzzle[] = [
  { id: 'g1', prompt: 'She ___ to school every day.', options: ['go', 'goes', 'going', 'gone'], answer: 'goes', explanation: 'Every day diễn tả thói quen. Hiện tại đơn với she: go → goes.' },
  { id: 'g2', prompt: 'Look! The children ___ in the garden.', options: ['play', 'plays', 'are playing', 'played'], answer: 'are playing', explanation: 'Look! hướng đến hành động đang xảy ra. Children là số nhiều: are + V-ing.' },
  { id: 'g3', prompt: 'We ___ a movie last night.', options: ['watch', 'watched', 'watching', 'watches'], answer: 'watched', explanation: 'Last night là thời điểm quá khứ đã kết thúc. Watch là động từ có quy tắc: thêm -ed.' },
  { id: 'g4', prompt: 'There is ___ apple on the table.', options: ['a', 'an', 'many', 'any'], answer: 'an', explanation: 'Apple bắt đầu bằng âm nguyên âm, là danh từ đếm được số ít: dùng an.' },
  { id: 'g5', prompt: 'How ___ water do you drink every day?', options: ['many', 'much', 'few', 'a'], answer: 'much', explanation: 'Water không đếm được: hỏi lượng bằng how much. How many đi với danh từ đếm được số nhiều.' },
  { id: 'g6', prompt: 'My sister is taller ___ me.', options: ['as', 'that', 'than', 'to'], answer: 'than', explanation: 'So sánh hơn: tính từ ngắn + -er + than. Tall → taller than.' },
  { id: 'g7', prompt: 'I have lived here ___ 2020.', options: ['for', 'since', 'during', 'at'], answer: 'since', explanation: 'Since đi với mốc bắt đầu (2020). For đi với khoảng thời gian (six years).' },
  { id: 'g8', prompt: 'You ___ wear a seat belt. It is required.', options: ['must', 'might', 'would', 'can'], answer: 'must', explanation: 'Must diễn tả điều bắt buộc. Sau must dùng động từ nguyên mẫu: must wear.' },
  { id: 'g9', prompt: 'I enjoy ___ books in my free time.', options: ['read', 'reads', 'reading', 'to read'], answer: 'reading', explanation: 'Sau enjoy dùng V-ing: enjoy reading. Ghi nhớ theo cụm enjoy doing something.' },
  { id: 'g10', prompt: 'If it rains tomorrow, we ___ at home.', options: ['will stay', 'stayed', 'staying', 'have stayed'], answer: 'will stay', explanation: 'Điều kiện loại 1: If + hiện tại đơn, will + động từ nguyên mẫu; diễn tả khả năng trong tương lai.' },
  { id: 'g11', prompt: 'The keys are ___ the table, next to the vase.', options: ['on', 'into', 'between', 'through'], answer: 'on', explanation: 'On diễn tả vật ở trên bề mặt và tiếp xúc với bề mặt đó: on the table.' },
  { id: 'g12', prompt: 'This book ___ by a famous author in 1995.', options: ['wrote', 'was written', 'is writing', 'has written'], answer: 'was written', explanation: 'Sách được viết → bị động. In 1995 → quá khứ: was + written (V3 của write).' },
];

export const SENTENCE_PUZZLES = [
  { id: 's1', answer: 'She drinks coffee every morning', prompt: 'Cô ấy uống cà phê mỗi sáng.', explanation: 'Chủ ngữ + động từ + tân ngữ + thời gian. She → drinks.' },
  { id: 's2', answer: 'They are playing football now', prompt: 'Họ đang chơi bóng đá bây giờ.', explanation: 'Hiện tại tiếp diễn: They + are + playing; now thường ở cuối câu.' },
  { id: 's3', answer: 'I bought a new phone yesterday', prompt: 'Tôi đã mua một chiếc điện thoại mới hôm qua. Đặt thời gian ở cuối câu.', explanation: 'Quá khứ của buy là bought. Tính từ new đứng trước danh từ phone.' },
  { id: 's4', answer: 'Can you help me please', prompt: 'Bạn có thể giúp tôi không? Bắt đầu với Can, kết thúc với please.', explanation: 'Câu hỏi với can: Can + chủ ngữ + động từ nguyên mẫu + tân ngữ?' },
  { id: 's5', answer: 'There are two books on the desk', prompt: 'Có hai quyển sách trên bàn.', explanation: 'There are + danh từ số nhiều. Two books → are, không dùng is.' },
  { id: 's6', answer: 'My brother is taller than me', prompt: 'Anh trai tôi cao hơn tôi.', explanation: 'So sánh hơn: S + be + taller + than + người được so sánh.' },
  { id: 's7', answer: 'We have lived here for ten years', prompt: 'Chúng tôi đã sống ở đây được mười năm.', explanation: 'Have + V3 diễn tả việc bắt đầu trước đây và còn tiếp diễn. For + khoảng thời gian.' },
  { id: 's8', answer: 'I would like a cup of tea', prompt: 'Tôi muốn một tách trà. Dùng cách nói lịch sự với would.', explanation: 'Would like + danh từ là cách bày tỏ mong muốn lịch sự.' },
  { id: 's9', answer: 'She does not like cold weather', prompt: 'Cô ấy không thích thời tiết lạnh.', explanation: 'Phủ định hiện tại đơn: She + does not + like (động từ không thêm -s).' },
  { id: 's10', answer: 'How often do you exercise', prompt: 'Bạn tập thể dục bao lâu một lần?', explanation: 'How often hỏi tần suất. Sau do, dùng chủ ngữ + động từ nguyên mẫu.' },
];

export const DETECTIVE_PUZZLES = [
  { id: 'e1', sentence: 'She go to school every day', wrongIndex: 1, replacement: 'goes', explanation: 'She là ngôi thứ ba số ít. Hiện tại đơn: go → goes.' },
  { id: 'e2', sentence: 'I am interested on music', wrongIndex: 3, replacement: 'in', explanation: 'Cụm cố định: be interested in something (quan tâm, hứng thú với điều gì).' },
  { id: 'e3', sentence: 'He can speaks English well', wrongIndex: 2, replacement: 'speak', explanation: 'Sau động từ khuyết thiếu can luôn dùng động từ nguyên mẫu không to.' },
  { id: 'e4', sentence: 'We was at home yesterday', wrongIndex: 1, replacement: 'were', explanation: 'Quá khứ của be: I/he/she/it → was; you/we/they → were.' },
  { id: 'e5', sentence: 'There are three childs outside', wrongIndex: 3, replacement: 'children', explanation: 'Child có số nhiều bất quy tắc là children, không phải childs.' },
  { id: 'e6', sentence: 'She is tall than me', wrongIndex: 2, replacement: 'taller', explanation: 'Tall là tính từ ngắn. So sánh hơn dùng taller than, không dùng tall than.' },
  { id: 'e7', sentence: 'I have lived here since five years', wrongIndex: 4, replacement: 'for', explanation: 'Five years là khoảng thời gian: dùng for. Since đi với mốc bắt đầu.' },
  { id: 'e8', sentence: 'He did not went to work', wrongIndex: 3, replacement: 'go', explanation: 'Did đã thể hiện quá khứ. Động từ chính trở về nguyên mẫu: did not go.' },
  { id: 'e9', sentence: 'I want to buying a book', wrongIndex: 3, replacement: 'buy', explanation: 'Want + to + động từ nguyên mẫu: want to buy.' },
  { id: 'e10', sentence: 'These books belongs to me', wrongIndex: 2, replacement: 'belong', explanation: 'These books là số nhiều. Hiện tại đơn dùng belong, không thêm -s.' },
];
