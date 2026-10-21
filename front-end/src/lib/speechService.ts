/**
 * Browser text-to-speech helper shared by every feature that plays word or sentence audio
 * (flashcards, spelling, dictionary, TOEIC dictation).
 */
export class SpeechService {
  private static readonly DEFAULT_LANGUAGE = 'en-US';

  /**
   * Whether the current browser exposes the Web Speech synthesis API.
   */
  public static isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  /**
   * Speaks the given text, cancelling any utterance already in progress.
   * @param text Text to pronounce.
   * @param rate Playback speed multiplier (1 = normal).
   * @param language BCP-47 language tag.
   */
  public static speak(
    text: string,
    rate: number = 1,
    language: string = SpeechService.DEFAULT_LANGUAGE
  ): void {
    if (!SpeechService.isSupported() || !text.trim()) {
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    utterance.rate = rate;
    window.speechSynthesis.speak(utterance);
  }

  /**
   * Stops any utterance currently being spoken.
   */
  public static stop(): void {
    if (SpeechService.isSupported()) {
      window.speechSynthesis.cancel();
    }
  }
}
