import { DictionarySenseItem } from '@/types/dictionary/DictionarySenseItem';

export interface DictionaryEntryData {
  id: string;
  term: string;
  ipa: string;
  partOfSpeech: string;
  senses: DictionarySenseItem[];
  collocations: string[];
  synonyms: string[];
  antonyms: string[];
}
