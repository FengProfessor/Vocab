/**
 * THPT hybrid — catalog thpt-lop-10/11/12 (English SGK titles).
 * Vocab = pack catalog. Grammar = CEFR slug.
 */

export type ThptGrade = 'lop-10' | 'lop-11' | 'lop-12';

export interface ThptUnitDef {
  unitTitle: string;
  grammar: string[];
  skills?: { type: string; ref: string; title: string }[];
}

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

/** Full 10 G12 units after pro3m enrich (empty units filled). */
export const GS12: ThptUnitDef[] = [
  { unitTitle: 'Life Stories', grammar: ['past-simple', 'past-continuous'],
    skills: [{ type: 'announcement', ref: 'ann-12-1', title: 'Announcement (exam format)' }] },
  { unitTitle: 'Urbanization', grammar: ['comparatives-superlatives', 'passive-voice'],
    skills: [{ type: 'arrange', ref: 'arr-12-1', title: 'Sentence arrangement' }] },
  { unitTitle: 'The Green Movement', grammar: ['conditionals-0-1', 'second-conditional'],
    skills: [{ type: 'leaflet', ref: 'lea-12-1', title: 'Leaflet (exam format)' }] },
  { unitTitle: 'The Mass Media', grammar: ['reported-speech', 'relative-clauses'],
    skills: [{ type: 'cloze', ref: 'clo-12-1', title: 'Cloze test' }] },
  { unitTitle: 'Cultural Identity', grammar: ['articles', 'relative-clauses'] },
  { unitTitle: 'Endangered Species', grammar: ['advanced-passive', 'participle-clauses'],
    skills: [{ type: 'reading', ref: 'rd-12-1', title: 'Reading (exam)' }] },
  { unitTitle: 'Artificial Intelligence', grammar: ['mixed-conditionals', 'third-conditional'] },
  { unitTitle: 'The World Of Work', grammar: ['present-perfect', 'used-to'] },
  { unitTitle: 'Choosing A Career', grammar: ['gerunds-infinitives', 'phrasal-verbs'] },
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
    titleVi: 'Grade 10 — Global Success',
    description: '10 units: Family Life → Ecotourism · catalog vocab + CEFR grammar + exam skills.',
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
    description: '10 units: Life Stories → Lifelong Learning · full catalog after enrich.',
    routeId: 'thpt-lop-12',
    units: GS12,
  },
];
