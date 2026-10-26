import { callServerOriginApi, normalizePayloadData } from '@/shared/api/client';

/**
 * Domain API service for Interactive Listening Practice & Audio Media.
 */
export class ListeningApi {
  /**
   * Generates or resolves text-to-speech audio for a listening prompt.
   */
  public static async synthesizeTts(rawBody: unknown) {
    return callServerOriginApi('/api/tts', {
      method: 'POST',
      data: normalizePayloadData(rawBody),
    });
  }
}
