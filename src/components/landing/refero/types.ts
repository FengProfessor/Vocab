export type AudienceType = 'exam' | 'busy' | 'teacher';

export interface AudienceTrack {
  id: AudienceType;
  label: string;
  badge: string;
  title: string;
  description: string;
  stats: { label: string; value: string }[];
  highlights: string[];
}

export interface BentoFeature {
  id: string;
  title: string;
  tag: string;
  description: string;
  colSpan?: string;
  accentColor?: string;
}

export interface PlaygroundSampleWord {
  word: string;
  ipa: string;
  pos: string;
  cefr: string;
  meaning: string;
  exampleEn: string;
  exampleVi: string;
  collocations: string[];
  aiNuance: string;
}

export interface ComparisonRow {
  feature: string;
  lingopro: string | boolean;
  anki: string | boolean;
  traditional: string | boolean;
  highlight?: boolean;
}
