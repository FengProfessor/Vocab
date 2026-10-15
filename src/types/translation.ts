export type PhraseType = 'phrasal_verb' | 'collocation' | 'idiom' | 'grammar_pattern';

export interface ExtractedPhrase {
  phrase: string;
  baseForm: string;
  meaningVi: string;
  type: PhraseType;
  ipa?: string;
  example?: string;
}

export interface SmartTranslateResult {
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  fromCache: boolean;
  provider: string;
  extractedPhrases?: ExtractedPhrase[];
}
