export interface ServerDictionaryEntryDto {
  id: string;
  term: string;
  ipa: string;
  partOfSpeech: string;
  definitionsJson: string;
  collocationsJson: string;
  synonymsJson: string;
  antonymsJson: string;
  bestContextualSenseIndex: number | null;
}
