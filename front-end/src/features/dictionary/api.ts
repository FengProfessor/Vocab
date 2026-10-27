import {
  callDotNetRaw,
  callServerOriginApi,
  LegacyRequestOptions,
  normalizePayloadData,
} from '@/shared/api/client';
import { withResponseCompat } from '@/shared/api/unwrap';
import {
  mapDictionaryLookupResponse,
  mapOcrExtractResponse,
} from '@/features/dictionary/mappers';

/**
 * Domain API service for Dictionary Lookup, AI Sentence/Speaking Coaching, OCR, Translation, and Speech.
 */
export class DictionaryApi {
  /**
   * Looks up a word or phrase in the canonical `.NET 10` dictionary (`GET /api/v1/dictionary/lookup`).
   */
  public static async lookup(
    input: string | { word?: string; term?: string; context?: string } | Record<string, unknown>,
    options?: LegacyRequestOptions,
  ) {
    let term = '';
    let context: string | undefined;
    if (typeof input === 'string') {
      if (input.includes('?')) {
        const sp = new URLSearchParams(input.slice(input.indexOf('?') + 1));
        term = (sp.get('word') || sp.get('term') || '').trim();
        context = sp.get('context') || undefined;
      } else {
        term = input.trim();
      }
    } else {
      const parsed = normalizePayloadData(input);
      term = String(parsed.word ?? parsed.term ?? '').trim();
      context = parsed.context ? String(parsed.context) : undefined;
    }

    const params: Record<string, unknown> = { term };
    if (context) params.context = context;

    const { ok, status, body } = await callDotNetRaw<Record<string, unknown>>('/dictionary/lookup', {
      method: 'GET',
      params,
      signal: options?.signal,
    });
    const payload = mapDictionaryLookupResponse(body?.data, ok, body?.message);
    return withResponseCompat(payload, status, ok);
  }

  /**
   * Performs AI-assisted word lookup via `.NET 10` dictionary endpoint (`GET /api/v1/dictionary/lookup`).
   */
  public static async aiLookup(rawBody: unknown, options?: LegacyRequestOptions) {
    return DictionaryApi.lookup(normalizePayloadData(rawBody), options);
  }

  /**
   * Performs AI phrase/collocation lookup.
   */
  public static async aiPhraseLookup(rawBody: unknown, options?: LegacyRequestOptions) {
    return callServerOriginApi('/api/dictionary/ai-phrase-lookup', {
      method: 'POST',
      data: normalizePayloadData(rawBody),
      signal: options?.signal,
    });
  }

  /**
   * Queries external Wiktionary/fallback dictionary (`GET /api/dictionary/external`).
   */
  public static async lookupExternal(word: string, options?: LegacyRequestOptions) {
    let cleanWord = word.trim();
    if (cleanWord.includes('?')) {
      const sp = new URLSearchParams(cleanWord.slice(cleanWord.indexOf('?') + 1));
      cleanWord = (sp.get('word') || sp.get('term') || cleanWord).trim();
    }
    return callServerOriginApi('/api/dictionary/external', {
      method: 'GET',
      params: { word: cleanWord },
      signal: options?.signal,
    });
  }

  /**
   * Queries autocomplete/fuzzy suggestions (`GET /api/dictionary/suggest`).
   */
  public static async suggest(queryOrUrl: string, options?: LegacyRequestOptions) {
    let q = queryOrUrl.trim();
    if (q.includes('?')) {
      const sp = new URLSearchParams(q.slice(q.indexOf('?') + 1));
      q = (sp.get('q') || q).trim();
    }
    return callServerOriginApi('/api/dictionary/suggest', {
      method: 'GET',
      params: { q },
      signal: options?.signal,
    });
  }

  /**
   * Extracts English vocabulary words from a base64-encoded image via `POST /api/v1/dictionary/ocr/extract`.
   */
  public static async extractOcrWords(rawBody: unknown) {
    const body = normalizePayloadData(rawBody);
    const { ok, status, body: resBody } = await callDotNetRaw<string[]>(
      '/dictionary/ocr/extract',
      {
        method: 'POST',
        data: {
          base64Image: body.image || body.base64Image || '',
          mimeType: body.mimeType || 'image/jpeg',
        },
      },
    );
    const payload = mapOcrExtractResponse(resBody?.data, ok);
    return withResponseCompat(payload, status, ok);
  }

  /**
   * Analyzes a sentence syntactically via `POST /api/v1/ai-coaching/sentence/analyze`.
   */
  public static async analyzeSentence(rawBody: unknown, options?: LegacyRequestOptions) {
    const body = normalizePayloadData(rawBody);
    const { ok, status, body: resBody } = await callDotNetRaw<Record<string, unknown>>(
      '/ai-coaching/sentence/analyze',
      {
        method: 'POST',
        data: {
          sentence: body.sentence || body.text || '',
          targetWord: body.targetWord || body.word || null,
        },
        signal: options?.signal,
      },
    );
    return withResponseCompat(
      {
        success: ok,
        data: resBody?.data,
        ...(resBody?.data && typeof resBody.data === 'object' ? resBody.data : {}),
        error: ok ? undefined : resBody?.message,
      },
      status,
      ok,
    );
  }

  /**
   * Evaluates a speaking dialogue turn via `POST /api/v1/ai-coaching/speaking/dialogue`.
   */
  public static async evaluateSpeakingDialogue(rawBody: unknown) {
    const body = normalizePayloadData(rawBody);
    const { ok, status, body: resBody } = await callDotNetRaw<Record<string, unknown>>(
      '/ai-coaching/speaking/dialogue',
      {
        method: 'POST',
        data: {
          scenarioPrompt: body.scenarioPrompt || body.topic || 'Daily conversation',
          userTranscript: body.userTranscript || body.transcript || body.text || '',
          targetWords: body.targetWords || [],
        },
      },
    );
    return withResponseCompat(
      {
        success: ok,
        data: resBody?.data,
        ...(resBody?.data && typeof resBody.data === 'object' ? resBody.data : {}),
        error: ok ? undefined : resBody?.message,
      },
      status,
      ok,
    );
  }

  /**
   * Translates text between languages (`/api/translate`).
   */
  public static async translate(rawBody: unknown, options?: LegacyRequestOptions) {
    return callServerOriginApi('/api/translate', {
      method: 'POST',
      data: normalizePayloadData(rawBody),
      signal: options?.signal,
    });
  }

  /**
   * Loads listening video details by ID (`/api/listening/video`).
   */
  public static async getListeningVideo(videoId: string) {
    return callServerOriginApi('/api/listening/video', {
      method: 'GET',
      params: { id: videoId },
    });
  }
}
