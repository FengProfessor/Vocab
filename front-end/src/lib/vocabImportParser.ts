import { EnumParser } from '@/lib/enumParser';
import { CertLevel } from '@/types/enums/CertLevel';
import { PartOfSpeechType } from '@/types/enums/PartOfSpeechType';
import { VocabImportItemDto } from '@/types/vocab/VocabImportItemDto';

/** Delimiters accepted between columns (comma, semicolon, tab or pipe). */
const COLUMN_DELIMITER = /[,;|\t]/;

/** Common abbreviations mapped to their part-of-speech member. */
const POS_ALIASES: Readonly<Record<string, PartOfSpeechType>> = {
  n: PartOfSpeechType.Noun,
  v: PartOfSpeechType.Verb,
  adj: PartOfSpeechType.Adjective,
  a: PartOfSpeechType.Adjective,
  adv: PartOfSpeechType.Adverb,
  prep: PartOfSpeechType.Preposition,
  conj: PartOfSpeechType.Conjunction,
  pron: PartOfSpeechType.Pronoun,
};

/**
 * Parser for the bulk import text box (ported from legacy src/app/import):
 * `word, part of speech, Vietnamese meaning[, example sentence]` per line.
 */
export class VocabImportParser {
  /**
   * Parses pasted text into import rows; rows missing mandatory columns carry an error message.
   */
  public static parse(rawText: string, defaultLevel: CertLevel): VocabImportItemDto[] {
    const seen = new Set<string>();

    return rawText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line, index) => {
        const [word = '', pos = '', meaning = '', example = ''] = line
          .split(COLUMN_DELIMITER)
          .map((part) => part.trim());

        const key = `import-${index}`;
        const base = {
          key,
          word,
          phonetic: '',
          partOfSpeech: VocabImportParser.parsePartOfSpeech(pos),
          meaningVi: meaning,
          exampleEn: example,
          certLevel: defaultLevel,
        };

        if (!word || !meaning) {
          return { ...base, errorMessage: 'Thiếu từ vựng hoặc nghĩa tiếng Việt' };
        }
        const normalized = word.toLowerCase();
        if (seen.has(normalized)) {
          return { ...base, errorMessage: 'Từ bị trùng trong danh sách nhập' };
        }
        seen.add(normalized);
        return base;
      });
  }

  /**
   * Resolves a free-form part-of-speech label (full name or abbreviation) to the enum.
   */
  public static parsePartOfSpeech(raw: string): PartOfSpeechType {
    const normalized = raw.trim().toLowerCase().replace(/\.$/, '');
    return (
      POS_ALIASES[normalized] ??
      EnumParser.parse(PartOfSpeechType, raw.replace(/\s+/g, ''), PartOfSpeechType.Noun)
    );
  }
}
