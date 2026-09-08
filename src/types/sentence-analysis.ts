export type SpanRole =
  | 'S'
  | 'V'
  | 'O'
  | 'clause'
  | 'adverb'
  | 'pp'
  | 'linker'
  | 'other';

export interface SentenceSpan {
  text: string;
  role: SpanRole;
  label_vi: string;
  clause_id?: string;
}

export interface SentenceChunk {
  text: string;
  base: string;
  meaning_vi: string;
  pos?: string;
  from_db?: boolean;
  ipa?: string;
}

export interface SentenceKernel {
  text: string;
  s: string;
  v: string;
  o?: string;
  translation_vi: string;
}

export interface MainClauseSubject {
  text: string;
  head: string;
}

export interface MainClauseVerb {
  text: string;
  head?: string;
  tense?: string;
}

export interface MainClauseObject {
  text: string;
  head: string;
}

export interface MainClauseAnalysis {
  subject: MainClauseSubject;
  verb: MainClauseVerb;
  object?: MainClauseObject;
  translation_vi: string;
}

export type SecondaryClauseType =
  | 'participle_result'
  | 'relative_clause'
  | 'adverbial_clause'
  | 'prepositional_phrase'
  | 'coordinate_clause'
  | 'other';

export interface SecondaryClause {
  type: SecondaryClauseType;
  type_label_vi: string;
  text: string;
  linker?: string;
  action?: string;
  target?: string;
  translation_vi: string;
}

export interface SentenceSegment {
  text: string;
  role: 'S' | 'V' | 'O' | 'C' | 'modifier' | 'frame' | 'adverb' | 'pp' | 'clause' | 'other';
  label_vi: string;
  keep: boolean;
}

export interface SentenceBuildLevel {
  level: number;
  text: string;
  slot_vi: string;
}

export interface SentenceLogic {
  pattern: string;
  a: string;
  b: string;
  formula_vi: string;
}

export interface SentenceAnalysisData {
  sentence: string;
  translation_vi: string;
  structure?: string;
  kernel?: SentenceKernel;
  main_clause?: MainClauseAnalysis;
  secondary_clauses?: SecondaryClause[];
  spans?: SentenceSpan[];
  logic?: SentenceLogic;
  segments?: SentenceSegment[];
  build_levels?: SentenceBuildLevel[];
  chunks: SentenceChunk[];
  notes?: string[];
}
