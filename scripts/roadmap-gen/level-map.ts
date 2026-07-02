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
  A0: ['personal-pronouns', 'verb-to-be', 'demonstratives', 'possessives'],
  A1: [
    'plural-nouns', 'adjectives-basic', 'there-is-there-are', 'articles', 'have-got',
    'present-simple', 'wh-questions', 'adverbs-frequency', 'present-continuous',
    'prepositions-place', 'imperatives', 'modals-ability',
  ],
  A2: [
    'countable-uncountable', 'quantifiers', 'prepositions-time', 'past-simple',
    'past-continuous', 'be-going-to', 'future-will', 'comparatives-superlatives',
    'modals-permission', 'modals-obligation', 'modals-advice', 'conditionals-0-1',
  ],
  B1: [
    'present-perfect', 'present-perfect-continuous', 'past-perfect', 'used-to',
    'future-continuous', 'conjunctions-linking', 'gerunds-infinitives', 'passive-voice',
    'reported-speech', 'relative-clauses', 'second-conditional', 'third-conditional',
    'modals-deduction', 'question-tags', 'phrasal-verbs',
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
  A0: ['word-stress-basics', 'final-stops-ptk', 'final-s-z'],
  A1: ['initial-p-b', 'vowel-i-long-short', 'final-l-n'],
  A2: ['sentence-rhythm', 's-vs-sh', 'vowel-u-long-short', 'vowel-ae-e', 'final-n-ng', 'basic-intonation'],
  B1: ['schwa', 'weak-forms', 'linking', 'v-f-final', 'th-voiceless', 'final-clusters-ed'],
  B2: ['th-voiced', 'vowel-uh-ah', 'diphthongs', 'r-l-z', 'ch-j', 'vowel-aw-o'],
};

/**
 * Vocab: catalog-v3 route ưu tiên theo cấp (dùng khi generate unit — chọn subtopic
 * từ các route này theo thứ tự, lọc published). Chi tiết subtopic cụ thể chọn trong generate.ts.
 */
export const VOCAB_ROUTE_PRIORITY: Record<RoadmapLevelId, string[]> = {
  A0: ['doi-song'],
  A1: ['doi-song', 'du-lich', 'hoc-tap'],
  A2: ['du-lich', 'suc-khoe', 'hoc-tap', 'thpt-lop-10'],
  B1: ['di-lam', 'cong-nghe', 'suc-khoe', 'thpt-lop-11', 'doi-song'],
  B2: ['hoc-thuat', 'thpt-lop-12', 'ielts', 'toeic', 'di-lam'],
};
