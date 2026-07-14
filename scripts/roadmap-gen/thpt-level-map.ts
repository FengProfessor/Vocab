/**
 * THPT hybrid — bám ĐÚNG subtopic trong catalog-v3 (route thpt-lop-10/11/12),
 * không bịa unit SGK chưa ingest.
 *
 * Vocab = pack catalog. Grammar = slug CEFR (cùng grammar_lessons).
 * unitTitle = title subtopic catalog (khớp exact / normalize).
 */

export type ThptGrade = 'lop-10' | 'lop-11' | 'lop-12';

export interface ThptUnitDef {
  /** Title subtopic catalog — HIỂN THỊ TIẾNG ANH (giữ tên SGK gốc) */
  unitTitle: string;
  grammar: string[];
  /** Skill titles: English labels for path UI */
  skills?: { type: string; ref: string; title: string }[];
}

/** Lớp 10 — 10 subtopic catalog; display = English unitTitle */
export const GS10: ThptUnitDef[] = [
  { unitTitle: 'Family Life', grammar: ['present-simple', 'present-continuous'] },
  { unitTitle: 'Your Body And You', grammar: ['have-got', 'modals-ability'] },
  { unitTitle: 'Music', grammar: ['gerunds-infinitives'],
    skills: [{ type: 'announcement', ref: 'ann-10-1', title: 'Announcement (gap-fill)' }] },
  { unitTitle: 'For A Better Community', grammar: ['past-simple', 'past-continuous'],
    skills: [{ type: 'reading', ref: 'rd-10-1', title: 'Reading comprehension' }] },
  { unitTitle: 'Inventions', grammar: ['present-perfect', 'passive-voice'] },
  { unitTitle: 'Gender Equality', grammar: ['advanced-passive', 'modals-obligation'] },
  { unitTitle: 'Cultural Diversity', grammar: ['comparatives-superlatives', 'relative-clauses'] },
  { unitTitle: 'New Ways To Learn', grammar: ['relative-clauses', 'articles'] },
  { unitTitle: 'Preserving The Environment', grammar: ['reported-speech', 'conditionals-0-1'] },
  { unitTitle: 'Ecotourism', grammar: ['second-conditional', 'future-will'],
    skills: [{ type: 'exam', ref: 'exam-10-1', title: 'Mini test — Grade 10' }] },
];

/** Lớp 11 — 10 subtopic catalog */
export const GS11: ThptUnitDef[] = [
  { unitTitle: 'A Long and Healthy Life', grammar: ['present-perfect', 'past-simple'] },
  { unitTitle: 'The Generation Gap', grammar: ['modals-obligation', 'modals-advice'] },
  { unitTitle: 'Cities of the Future', grammar: ['present-continuous', 'be-going-to'] },
  { unitTitle: 'ASEAN and ASEAN Youth', grammar: ['gerunds-infinitives'],
    skills: [{ type: 'leaflet', ref: 'lea-11-1', title: 'Leaflet (gap-fill)' }] },
  { unitTitle: 'Global Warming', grammar: ['participle-clauses', 'passive-voice'] },
  { unitTitle: 'Preserving Our Heritage', grammar: ['gerunds-infinitives', 'relative-clauses'],
    skills: [{ type: 'arrange', ref: 'arr-11-1', title: 'Sentence arrangement' }] },
  { unitTitle: 'Education Options for School-Leavers', grammar: ['present-perfect-continuous', 'conditionals-0-1'] },
  { unitTitle: 'Becoming Independent', grammar: ['cleft-sentences', 'modals-deduction'] },
  { unitTitle: 'Social Issues', grammar: ['conjunctions-linking', 'discourse-markers'] },
  { unitTitle: 'Healthy Lifestyle and Longevity', grammar: ['second-conditional', 'third-conditional'],
    skills: [{ type: 'exam', ref: 'exam-11-1', title: 'Mini test — Grade 11' }] },
];

/**
 * Lớp 12 — 7 subtopic published in catalog (English titles only).
 */
export const GS12: ThptUnitDef[] = [
  { unitTitle: 'Life Stories', grammar: ['past-simple', 'past-continuous'],
    skills: [{ type: 'announcement', ref: 'ann-12-1', title: 'Announcement (exam format)' }] },
  { unitTitle: 'Cultural Identity', grammar: ['relative-clauses', 'articles'],
    skills: [{ type: 'leaflet', ref: 'lea-12-1', title: 'Leaflet (exam format)' }] },
  { unitTitle: 'Urbanization', grammar: ['comparatives-superlatives', 'passive-voice'],
    skills: [{ type: 'arrange', ref: 'arr-12-1', title: 'Sentence arrangement' }] },
  { unitTitle: 'The World Of Work', grammar: ['present-perfect', 'used-to'],
    skills: [{ type: 'cloze', ref: 'clo-12-1', title: 'Cloze test' }] },
  { unitTitle: 'Artificial Intelligence', grammar: ['mixed-conditionals', 'third-conditional'],
    skills: [{ type: 'reading', ref: 'rd-12-1', title: 'Reading (exam)' }] },
  { unitTitle: 'Endangered Species', grammar: ['advanced-passive', 'participle-clauses'] },
  { unitTitle: 'Lifelong Learning', grammar: ['discourse-markers', 'nominalisation'],
    skills: [{ type: 'exam', ref: 'exam-12-1', title: 'Mini graduation test' }] },
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
    // titleVi used in journey banner — keep English for unit path consistency
    titleVi: 'Grade 10 — Global Success',
    description: '10 units from catalog: Family Life → Ecotourism · vocab packs + CEFR grammar + exam skills.',
    routeId: 'thpt-lop-10',
    units: GS10,
  },
  {
    id: 'lop-11',
    title: 'Grade 11 — Global Success',
    titleVi: 'Grade 11 — Global Success',
    description: '10 units: Healthy life → Longevity · participle, cleft, exam skills.',
    routeId: 'thpt-lop-11',
    units: GS11,
  },
  {
    id: 'lop-12',
    title: 'Grade 12 — Global Success + exam 2025',
    titleVi: 'Grade 12 — Global Success + exam 2025',
    description: '7 units in catalog (+ 2025 exam-format skills). More SGK units when catalog is extended.',
    routeId: 'thpt-lop-12',
    units: GS12,
  },
];
