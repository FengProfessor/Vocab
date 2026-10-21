import { EnumParser } from '@/lib/enumParser';
import { CertLevel } from '@/types/enums/CertLevel';
import { PartOfSpeechType } from '@/types/enums/PartOfSpeechType';
import { SrsCardState } from '@/types/enums/SrsCardState';
import { ServerWordWithSrsDto } from '@/types/vocab/ServerWordWithSrsDto';
import { VocabWordDto } from '@/types/vocab/VocabWordDto';

/** Default FSRS ease factor used when the server does not expose one. */
const DEFAULT_EASE_FACTOR = 2.5;

/**
 * Maps API vocabulary payloads onto the client flashcard model while preserving the server-side FSRS state.
 */
export class VocabWordMapper {
  /**
   * Converts a `GET /api/v1/vocab/due` item into a flashcard keeping its real server id and schedule.
   */
  public static fromServer(dto: ServerWordWithSrsDto): VocabWordDto {
    const cardState = EnumParser.parse(SrsCardState, dto.srsState, SrsCardState.New);
    return {
      id: dto.id,
      word: dto.term,
      phonetic: dto.ipa,
      partOfSpeech: EnumParser.parse(PartOfSpeechType, dto.partOfSpeech, PartOfSpeechType.Noun),
      meaningVi: dto.translation,
      definitionEn: dto.topic,
      exampleEn: dto.exampleSentence ?? '',
      exampleVi: dto.exampleTranslation ?? '',
      certLevel: EnumParser.parse(CertLevel, dto.level, CertLevel.B1),
      audioUrl: null,
      cardState,
      nextReviewAt: dto.nextReviewDate
        ? new Date(dto.nextReviewDate).toISOString()
        : new Date().toISOString(),
      intervalDays: dto.intervalDays,
      easeFactor: DEFAULT_EASE_FACTOR,
      repetitions: cardState === SrsCardState.New ? 0 : 1,
      stability: dto.stability,
      difficulty: dto.difficulty,
      lapses: 0,
    };
  }
}
