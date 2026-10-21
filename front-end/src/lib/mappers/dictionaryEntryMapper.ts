import { JsonUtils } from '@/lib/jsonUtils';
import { NewVocabWordInput } from '@/stores/types/NewVocabWordInput';
import { CertLevel } from '@/types/enums/CertLevel';
import { PartOfSpeechType } from '@/types/enums/PartOfSpeechType';
import { EnumParser } from '@/lib/enumParser';
import { DictionaryEntryData } from '@/types/dictionary/DictionaryEntryData';
import { DictionarySenseItem } from '@/types/dictionary/DictionarySenseItem';
import { ServerDictionaryEntryDto } from '@/types/dictionary/ServerDictionaryEntryDto';

/**
 * Maps the dictionary API payload (JSON string columns) onto the view model and the FSRS deck.
 */
export class DictionaryEntryMapper {
  /**
   * Parses the *Json columns of the API entry into typed collections.
   */
  public static fromServer(dto: ServerDictionaryEntryDto): DictionaryEntryData {
    return {
      id: dto.id,
      term: dto.term,
      ipa: dto.ipa,
      partOfSpeech: dto.partOfSpeech,
      senses: JsonUtils.parseArray<DictionarySenseItem>(dto.definitionsJson),
      collocations: JsonUtils.parseArray<string>(dto.collocationsJson),
      synonyms: JsonUtils.parseArray<string>(dto.synonymsJson),
      antonyms: JsonUtils.parseArray<string>(dto.antonymsJson),
    };
  }

  /**
   * Builds the deck word for an entry using its first (or best contextual) sense.
   */
  public static toDeckWord(entry: DictionaryEntryData, certLevel: CertLevel): NewVocabWordInput {
    const sense = entry.senses[0];
    return {
      word: entry.term,
      phonetic: entry.ipa,
      partOfSpeech: EnumParser.parse(PartOfSpeechType, entry.partOfSpeech, PartOfSpeechType.Noun),
      meaningVi: sense?.vi ?? '',
      definitionEn: sense?.en ?? '',
      exampleEn: sense?.example ?? '',
      exampleVi: '',
      certLevel,
      audioUrl: null,
    };
  }
}
