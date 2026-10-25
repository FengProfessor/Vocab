/**
 * LingoPro Hybrid Speech-to-Text (STT) Subsystem
 * File: src/lib/speaking/stt/index.ts
 *
 * Unified entry point and factory for STT services:
 * - WebSpeechProvider: native browser Web Speech API (zero latency, zero cost)
 * - WhisperProvider: cloud audio transcription adapter (OpenAI / Groq Whisper API)
 * - createSTTService: auto-detecting factory with seamless fallbacks
 */

import type { ISTTService, STTServiceConfig } from './types';
import { WebSpeechProvider } from './web-speech-provider';
import { WhisperProvider } from './whisper-provider';

export * from './types';
export * from './web-speech-provider';
export * from './whisper-provider';

export type STTServiceSelection = 'auto' | 'webspeech' | 'whisper' | 'mock';

/**
 * Factory that instantiates the optimal STT service.
 * - 'auto': Checks browser capabilities. Uses WebSpeechProvider if available, otherwise falls back to WhisperProvider.
 * - 'webspeech': Strictly instantiates WebSpeechProvider.
 * - 'whisper': Strictly instantiates WhisperProvider.
 * - 'mock': Instantiates WhisperProvider configured in mock stub mode.
 *
 * @param type Service selection strategy (default: 'auto')
 * @param config Optional service configuration (language, endpoints, delay, etc.)
 */
export function createSTTService(
  type: STTServiceSelection = 'auto',
  config?: STTServiceConfig
): ISTTService {
  if (config?.hasBrowserSpeech === false) {
    return new WhisperProvider(config);
  }

  switch (type) {
    case 'webspeech':
      return new WebSpeechProvider(config);

    case 'whisper':
      return new WhisperProvider(config);

    case 'mock':
      return new WhisperProvider({
        ...config,
        mockMode: true,
      });

    case 'auto':
    default:
      if (WebSpeechProvider.isSupported()) {
        return new WebSpeechProvider(config);
      }
      return new WhisperProvider(config);
  }
}

/**
 * Quick capability check helper for UI rendering and feature gating.
 */
export function checkSTTCapability(type: STTServiceSelection = 'auto'): {
  webSpeechSupported: boolean;
  whisperSupported: boolean;
  recommendedProvider: 'webspeech' | 'whisper';
  isRequestedSupported: boolean;
} {
  const webSpeechSupported = WebSpeechProvider.isSupported();
  const whisperSupported = WhisperProvider.isSupported();
  const isRequestedSupported =
    type === 'webspeech'
      ? webSpeechSupported
      : type === 'whisper' || type === 'mock'
        ? whisperSupported
        : webSpeechSupported || whisperSupported;

  return {
    webSpeechSupported,
    whisperSupported,
    recommendedProvider: webSpeechSupported ? 'webspeech' : 'whisper',
    isRequestedSupported,
  };
}
