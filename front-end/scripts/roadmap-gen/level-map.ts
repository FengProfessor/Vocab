/**
 * Level Map — nguồn sự thật duy nhất gán nội dung vào 5 cấp lộ trình A0→B2.
 *
 * Nguồn nghiên cứu (NLM, 2026-07-02):
 * - Grammar: docs/roadmap-research/02-grammar-level-map.md (English Grammar Profile + British Council + Murphy)
 * - Vocab:   docs/roadmap-research/03-vocab-level-map.md (Oxford 3000/5000 + Cambridge Vocabulary Profile)
 * - Pronunciation: docs/roadmap-research/01-pronunciation-vn.md (functional load cho người Việt)
 *
 * Thứ tự phần tử trong mảng = thứ tự dạy khuyến nghị.
 */

export type RoadmapLevelId = 'A0' | 'A1' | 'A2' | 'B1' | 'B2';

export const LEVELS: { id: RoadmapLevelId; title: string; titleVi: string; description: string }[] = [
  { id: 'A0', title: 'Foundation', titleVi: 'Mất gốc', description: 'Bắt đầu từ con số 0: câu tự giới thiệu, từ sinh tồn, âm cơ bản.' },
  { id: 'A1', title: 'Beginner', titleVi: 'Sơ cấp 1', description: 'Nói về bản thân, gia đình, sinh hoạt hằng ngày bằng câu đơn.' },
  { id: 'A2', title: 'Elementary', titleVi: 'Sơ cấp 2', description: 'Giao tiếp tình huống: đi lại, mua sắm, khám bệnh, kể chuyện quá khứ.' },
  { id: 'B1', title: 'Intermediate', titleVi: 'Trung cấp', description: 'Diễn đạt ý kiến, kể trải nghiệm, công việc và học tập độc lập.' },
  { id: 'B2', title: 'Upper-Intermediate', titleVi: 'Trung cao', description: 'Tranh luận, đọc hiểu sâu, nền tảng học thuật và luyện thi.' },
];

/** Grammar topic slug → cấp, theo thứ tự dạy trong từng cấp (62 topic). */
export const GRAMMAR_LEVEL_MAP: Record<RoadmapLevelId, string[]> = {
  A0: ['personal-pronouns', 'verb-to-be', 'demonstratives', 'possessives', 'plural-nouns', 'adjectives-basic'],
  A1: [
    // there-is/are + articles TRƯỚC present-simple: xây dựng tư duy cấu trúc tồn tại & đồ vật,
    // present-simple TRƯỚC have-got: dạy do-support xong mới tới "have got",
    // tránh lỗi "Do you have got?" của học viên Việt (teacher review 06 mục A)
    'there-is-there-are', 'articles', 'present-simple', 'have-got',
    'wh-questions', 'adverbs-frequency', 'present-continuous',
    'prepositions-place', 'imperatives', 'modals-ability',
  ],
  A2: [
    'countable-uncountable', 'quantifiers', 'prepositions-time', 'past-simple',
    'past-continuous', 'be-going-to', 'future-will', 'comparatives-superlatives',
    'modals-permission', 'modals-obligation', 'modals-advice', 'conditionals-0-1',
  ],
  B1: [
    // used-to làm CẦU NỐI từ past-simple (A2) sang perfect; chèn topic "dễ thở"
    // (conjunctions, phrasal-verbs, question-tags) xen giữa cụm perfect để không dồn
    // 3 thì hoàn thành liền nhau — cửa ải khó nhất của người Việt (teacher review mục A)
    'used-to', 'present-perfect', 'conjunctions-linking', 'present-perfect-continuous',
    'phrasal-verbs', 'past-perfect', 'future-continuous', 'passive-voice',
    'gerunds-infinitives', 'reported-speech', 'relative-clauses', 'question-tags',
    'second-conditional', 'third-conditional', 'modals-deduction',
  ],
  B2: [
    'past-perfect-continuous', 'future-perfect', 'future-in-the-past', 'mixed-conditionals',
    'wish-if-only', 'modals-perfect', 'causative', 'advanced-passive',
    'advanced-relative-clauses', 'participle-clauses', 'ellipsis-substitution', 'subjunctive',
    'emphasis-structures', 'cleft-sentences', 'inversion', 'discourse-markers',
    'nominalisation', 'hedging-language', 'grammatical-collocations',
  ],
};

/** Map cấp lộ trình → level 3 bậc trong DB grammar_topics (giữ nguyên schema cũ). */
export const GRAMMAR_DB_LEVEL: Record<RoadmapLevelId, 'beginner' | 'intermediate' | 'advanced'> = {
  A0: 'beginner',
  A1: 'beginner',
  A2: 'beginner',
  B1: 'intermediate',
  B2: 'advanced',
};

/** Pronunciation lesson id → cấp (id khớp src/data/pronunciation/lessons-v1.json). */
export const PRONUNCIATION_LEVEL_MAP: Record<RoadmapLevelId, string[]> = {
  // A0: 6 chặng — 4 bài phát âm sửa lỗi nuốt âm cuối & trọng âm từ sinh tồn
  A0: ['word-stress-basics', 'initial-p-b', 'final-stops-ptk', 'final-s-z'],
  // A1: 10 chặng — 4 bài rèn luyện nguyên âm căng/chùng và phụ âm trượt
  A1: ['w-initial', 'vowel-i-long-short', 'j-glide', 'final-l-n'],
  // final-clusters-ed đặt vị trí #3 để slot rơi sát chặng past-simple (unit 4 A2) —
  // dạy quá khứ phải dạy đọc -ed cùng lúc (teacher review 06, fix #2)
  A2: ['sentence-rhythm', 's-vs-sh', 'final-clusters-ed', 'vowel-u-long-short', 'vowel-ae-e', 'final-n-ng', 'basic-intonation'],
  B1: ['schwa', 'weak-forms', 'linking', 'v-f-final', 'th-voiceless'],
  B2: ['th-voiced', 'vowel-uh-ah', 'diphthongs', 'r-l-z', 'ch-j', 'vowel-aw-o'],
};

/**
 * Rules lọc subtopic theo cấp (regex trên TITLE) — vá lỗi "gói lạc cấp" teacher review 06:
 * A0 học "Higher Education", A1 dính 6 chặng thể thao, A2 "Gender Equality"...
 * block ưu tiên hơn allow; không có allow = nhận mọi title không bị block.
 */
export const SUBTOPIC_LEVEL_RULES: Record<RoadmapLevelId, { allow?: RegExp; block?: RegExp }> = {
  A0: {
    allow: /family|friend|home|hous|food|drink|color|colour|number|greeting|animal|pet|body|cloth|time|day/i,
    block: /education|cultural|diversity|university|sea games|system|academ/i,
  },
  A1: {
    allow: /family|friend|home|hous|apartment|food|drink|cook|eat|cloth|animal|pet|weather|hobb|music|time|day|daily|routine|body|health|life|living|feeling|emotion|travel|transport|action|verb|gia đình|cơ thể|sức khỏe|ăn uống|nhà cửa|thời gian|thiên nhiên|du lịch|cảm xúc|tính từ|động từ/i,
    block: /education|system|primary|secondary|school system|sea games|gender|community|higher education|cultural|diversity|academ|water sports|ý tưởng/i,
  },
  A2: {
    // Chỉ chặn chủ đề rõ ràng B1+; sports/entertainment vẫn cho (kho A2 mỏng nếu chặn hết)
    // nhưng route priority đặt đời sống/sức khỏe/du lịch TRƯỚC nên thể thao không mở màn cấp
    block: /gender|better community|academ|undersea|space conquest|electronic|assessment|sea games|cultural|higher education|water sports|mass media/i,
  },
  B1: {
    block: /idiom|sea games/i,
  },
  B2: {
    // "Expression with X" = 22 subtopic thành ngữ vụn — chặn để idiom chỉ còn là gia vị,
    // nhường chỗ cho kho học thuật IELTS (Education/Environment/Society/Law...)
    block: /expression with/i,
  },
};

/** Mỗi subtopic đóng góp tối đa N pack cho một cấp — chống độc canh 7 chặng cùng chủ đề. */
export const MAX_PACKS_PER_SUBTOPIC = 4;

/**
 * Dịch tên subtopic tiếng Anh → tiếng Việt cho step title (teacher review: tên gói còn thô).
 * Key = title đã bỏ hậu tố "1/6", so khớp không phân biệt hoa thường.
 */
export const SUBTOPIC_TITLE_VI: Record<string, string> = {
  'actions - behaviour': 'Hành động & Ứng xử',
  'artificial intelligence': 'Trí tuệ nhân tạo',
  'business': 'Kinh doanh',
  'clothes': 'Quần áo & Trang phục',
  'communication - contact - information': 'Giao tiếp & Thông tin',
  'ecotourism': 'Du lịch sinh thái',
  'education': 'Giáo dục',
  'endangered species': 'Loài vật nguy cấp',
  'entertainment and media': 'Giải trí & Truyền thông',
  'environment & climate': 'Môi trường & Khí hậu',
  'family': 'Gia đình',
  'family life': 'Đời sống gia đình',
  'family and relationships': 'Gia đình & Các mối quan hệ',
  'films and books': 'Phim & Sách',
  'health & medicine': 'Sức khỏe & Y tế',
  'health and lifestyle': 'Sức khỏe & Lối sống',
  'health and sickness': 'Sức khỏe & Bệnh tật',
  'health and diseases': 'Sức khỏe & Bệnh tật',
  'inventions': 'Phát minh',
  'law & social problems': 'Pháp luật & Vấn đề xã hội',
  'life stories': 'Câu chuyện cuộc đời',
  'media & entertainment': 'Truyền thông & Giải trí',
  'music': 'Âm nhạc',
  'new ways to learn': 'Cách học mới',
  'preserving the environment': 'Bảo vệ môi trường',
  'school education system': 'Hệ thống giáo dục',
  'science & technology': 'Khoa học & Công nghệ',
  'science and technology': 'Khoa học & Công nghệ',
  'society & culture': 'Xã hội & Văn hóa',
  'sports': 'Thể thao',
  'sports and entertainment': 'Thể thao & Giải trí',
  'the mass media': 'Truyền thông đại chúng',
  'travel & urbanization': 'Du lịch & Đô thị hóa',
  'urbanization': 'Đô thị hóa',
  'water sports': 'Thể thao dưới nước',
  'your body and you': 'Cơ thể của bạn',
  'ambition and determination': 'Hoài bão & Quyết tâm',
  'authority - power': 'Quyền lực',
  'economic reforms': 'Cải cách kinh tế',
  'money': 'Tiền bạc',
  'work': 'Công việc',
  'employment - jobs': 'Việc làm & Nghề nghiệp',
  'future jobs': 'Nghề nghiệp tương lai',
  'being independent': 'Sống tự lập',
  'the generation gap': 'Khoảng cách thế hệ',
  'global warming': 'Nóng lên toàn cầu',
  'further education': 'Học lên cao',
  'efficiency - competence': 'Hiệu quả & Năng lực',
  'success and failure': 'Thành công & Thất bại',
  'cultural identity': 'Bản sắc văn hóa',
  'the world of work': 'Thế giới công việc',
  'lifelong learning': 'Học tập suốt đời',
  'gia đình & quan hệ': 'Gia đình & Mối quan hệ',
  'cơ thể & sức khỏe': 'Cơ thể & Sức khỏe',
  'ăn uống & nhà bếp': 'Ăn uống & Nhà bếp',
  'nhà cửa & đồ dùng': 'Nhà cửa & Đồ dùng',
  'học tập & trường lớp': 'Học tập & Trường lớp',
  'du lịch & giao thông': 'Du lịch & Giao thông',
  'thiên nhiên & môi trường': 'Thiên nhiên & Môi trường',
  'tiền bạc & mua sắm': 'Tiền bạc & Mua sắm',
  'thời gian & nơi chốn': 'Thời gian & Nơi chốn',
  'cảm xúc & tính cách': 'Cảm xúc & Tính cách',
  'động từ cốt lõi & hành động': 'Động từ cốt lõi & Hành động',
  'tính từ & mô tả': 'Tính từ & Mô tả',
};

/** Trả tên tiếng Việt cho subtopic title (bỏ hậu tố phân số "1/6"); null nếu chưa có bản dịch. */
export function subtopicTitleVi(title: string): string | null {
  const base = title.replace(/\s*·\s*chặng\s*\d+\/\d+\s*$/i, '').replace(/\s*\d+\/\d+\s*$/, '').trim().toLowerCase();
  return SUBTOPIC_TITLE_VI[base] ?? null;
}

/**
 * Vocab: catalog-v3 route ưu tiên theo cấp (dùng khi generate unit — chọn subtopic
 * từ các route này theo thứ tự, lọc published). Chi tiết subtopic cụ thể chọn trong generate.ts.
 */
export const VOCAB_ROUTE_PRIORITY: Record<RoadmapLevelId, string[]> = {
  // A0 dùng trọn vẹn 12 starter packs (144 từ sinh tồn)
  A0: ['doi-song', 'du-lich', 'hoc-tap'],
  // A1: Ưu tiên kho Oxford 3000 nền tảng (Gia đình, Ăn uống, Nhà cửa, Cơ thể, Thời gian) + đời sống, du lịch, sức khỏe
  A1: ['oxford-core', 'doi-song', 'du-lich', 'suc-khoe', 'thpt-lop-10'],
  A2: ['du-lich', 'suc-khoe', 'doi-song', 'hoc-tap', 'thpt-lop-10', 'cong-nghe'],
  // Mở màn B1 bằng đời sống/sức khỏe/công nghệ (chủ đề gần gũi) thay vì TOEIC collocations;
  // di-lam (chứa "200 Collocations TOEIC") đẩy xuống giữa (teacher review mục B)
  B1: ['doi-song', 'suc-khoe', 'cong-nghe', 'di-lam', 'thpt-lop-11'],
  // ielts đứng đầu: kho học thuật thật (Education/Environment/Science/Society/Law);
  // hoc-thuat thực chất toàn idiom/phrasal — đẩy xuống cuối làm gia vị (teacher review 06)
  B2: ['ielts', 'thpt-lop-12', 'toeic', 'hoc-thuat', 'di-lam'],
};
