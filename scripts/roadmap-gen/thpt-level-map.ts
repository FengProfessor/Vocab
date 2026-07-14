/**
 * THPT hybrid — bám ĐÚNG subtopic trong catalog-v3 (route thpt-lop-10/11/12),
 * không bịa unit SGK chưa ingest.
 *
 * Vocab = pack catalog. Grammar = slug CEFR (cùng grammar_lessons).
 * unitTitle = title subtopic catalog (khớp exact / normalize).
 */

export type ThptGrade = 'lop-10' | 'lop-11' | 'lop-12';

export interface ThptUnitDef {
  /** Title subtopic trong catalog-v3 (khớp exact không phân biệt hoa thường) */
  unitTitle: string;
  titleVi: string;
  grammar: string[];
  skills?: { type: string; ref: string; title: string }[];
}

/** Lớp 10 — 10 subtopic catalog hiện có */
export const GS10: ThptUnitDef[] = [
  { unitTitle: 'Family Life', titleVi: 'Đời sống gia đình', grammar: ['present-simple', 'present-continuous'] },
  { unitTitle: 'Your Body And You', titleVi: 'Cơ thể & sức khỏe', grammar: ['have-got', 'modals-ability'] },
  { unitTitle: 'Music', titleVi: 'Âm nhạc', grammar: ['gerunds-infinitives'],
    skills: [{ type: 'announcement', ref: 'ann-10-1', title: 'Đọc điền thông báo' }] },
  { unitTitle: 'For A Better Community', titleVi: 'Vì cộng đồng tốt hơn', grammar: ['past-simple', 'past-continuous'],
    skills: [{ type: 'reading', ref: 'rd-10-1', title: 'Đọc hiểu ngắn' }] },
  { unitTitle: 'Inventions', titleVi: 'Phát minh', grammar: ['present-perfect', 'passive-voice'] },
  { unitTitle: 'Gender Equality', titleVi: 'Bình đẳng giới', grammar: ['advanced-passive', 'modals-obligation'] },
  { unitTitle: 'Cultural Diversity', titleVi: 'Đa dạng văn hóa', grammar: ['comparatives-superlatives', 'relative-clauses'] },
  { unitTitle: 'New Ways To Learn', titleVi: 'Cách học mới', grammar: ['relative-clauses', 'articles'] },
  { unitTitle: 'Preserving The Environment', titleVi: 'Bảo vệ môi trường', grammar: ['reported-speech', 'conditionals-0-1'] },
  { unitTitle: 'Ecotourism', titleVi: 'Du lịch sinh thái', grammar: ['second-conditional', 'future-will'],
    skills: [{ type: 'exam', ref: 'exam-10-1', title: 'Đề mini lớp 10' }] },
];

/** Lớp 11 — 10 subtopic catalog */
export const GS11: ThptUnitDef[] = [
  { unitTitle: 'A Long and Healthy Life', titleVi: 'Sống khỏe dài lâu', grammar: ['present-perfect', 'past-simple'] },
  { unitTitle: 'The Generation Gap', titleVi: 'Khoảng cách thế hệ', grammar: ['modals-obligation', 'modals-advice'] },
  { unitTitle: 'Cities of the Future', titleVi: 'Đô thị tương lai', grammar: ['present-continuous', 'be-going-to'] },
  { unitTitle: 'ASEAN and ASEAN Youth', titleVi: 'ASEAN & thanh niên', grammar: ['gerunds-infinitives'],
    skills: [{ type: 'leaflet', ref: 'lea-11-1', title: 'Đọc tờ rơi' }] },
  { unitTitle: 'Global Warming', titleVi: 'Nóng lên toàn cầu', grammar: ['participle-clauses', 'passive-voice'] },
  { unitTitle: 'Preserving Our Heritage', titleVi: 'Bảo tồn di sản', grammar: ['gerunds-infinitives', 'relative-clauses'],
    skills: [{ type: 'arrange', ref: 'arr-11-1', title: 'Sắp xếp đoạn' }] },
  { unitTitle: 'Education Options for School-Leavers', titleVi: 'Lựa chọn học tiếp', grammar: ['present-perfect-continuous', 'conditionals-0-1'] },
  { unitTitle: 'Becoming Independent', titleVi: 'Trở nên độc lập', grammar: ['cleft-sentences', 'modals-deduction'] },
  { unitTitle: 'Social Issues', titleVi: 'Vấn đề xã hội', grammar: ['conjunctions-linking', 'discourse-markers'] },
  { unitTitle: 'Healthy Lifestyle and Longevity', titleVi: 'Lối sống & trường thọ', grammar: ['second-conditional', 'third-conditional'],
    skills: [{ type: 'exam', ref: 'exam-11-1', title: 'Đề mini lớp 11' }] },
];

/**
 * Lớp 12 — catalog chỉ có 7 subtopic published → 7 unit + không bịa unit trống.
 * (Thiếu mass media / career paths / green living trong catalog — bổ sung khi ingest.)
 */
export const GS12: ThptUnitDef[] = [
  { unitTitle: 'Life Stories', titleVi: 'Câu chuyện cuộc đời', grammar: ['past-simple', 'past-continuous'],
    skills: [{ type: 'announcement', ref: 'ann-12-1', title: 'Thông báo (dạng đề)' }] },
  { unitTitle: 'Cultural Identity', titleVi: 'Bản sắc văn hóa', grammar: ['relative-clauses', 'articles'],
    skills: [{ type: 'leaflet', ref: 'lea-12-1', title: 'Tờ rơi (dạng đề)' }] },
  { unitTitle: 'Urbanization', titleVi: 'Đô thị hóa', grammar: ['comparatives-superlatives', 'passive-voice'],
    skills: [{ type: 'arrange', ref: 'arr-12-1', title: 'Sắp xếp đoạn' }] },
  { unitTitle: 'The World Of Work', titleVi: 'Thế giới công việc', grammar: ['present-perfect', 'used-to'],
    skills: [{ type: 'cloze', ref: 'clo-12-1', title: 'Cloze test' }] },
  { unitTitle: 'Artificial Intelligence', titleVi: 'Trí tuệ nhân tạo', grammar: ['mixed-conditionals', 'third-conditional'],
    skills: [{ type: 'reading', ref: 'rd-12-1', title: 'Đọc hiểu đề' }] },
  { unitTitle: 'Endangered Species', titleVi: 'Loài nguy cấp', grammar: ['advanced-passive', 'participle-clauses'] },
  { unitTitle: 'Lifelong Learning', titleVi: 'Học tập suốt đời', grammar: ['discourse-markers', 'nominalisation'],
    skills: [{ type: 'exam', ref: 'exam-12-1', title: 'Đề mini tốt nghiệp' }] },
];

export const THPT_GRADES: {
  id: ThptGrade;
  title: string;
  titleVi: string;
  description: string;
  routeId: string;
  units: ThptUnitDef[];
}[] = [
  {
    id: 'lop-10',
    title: 'Grade 10 — Global Success',
    titleVi: 'Lớp 10 — Global Success',
    description: '10 unit đúng catalog: Family Life → Ecotourism · vocab kho + ngữ pháp CEFR + skill đề.',
    routeId: 'thpt-lop-10',
    units: GS10,
  },
  {
    id: 'lop-11',
    title: 'Grade 11 — Global Success',
    titleVi: 'Lớp 11 — Global Success',
    description: '10 unit catalog: Healthy life → Longevity · participle, cleft, skill đề.',
    routeId: 'thpt-lop-11',
    units: GS11,
  },
  {
    id: 'lop-12',
    title: 'Grade 12 — Global Success + đề 2025',
    titleVi: 'Lớp 12 — Global Success & ôn đề',
    description: '7 unit có trong kho (+ skill 6 dạng đề 2025). Unit SGK còn thiếu sẽ bổ sung khi ingest catalog.',
    routeId: 'thpt-lop-12',
    units: GS12,
  },
];
