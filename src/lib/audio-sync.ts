import { speak } from './study';

/**
 * Transition Helper for learning and review sessions.
 * Awaits vocabulary pronunciation to completion, then adds a peaceful buffer
 * (default 400ms, configurable 300–500ms) before resolving.
 *
 * Guaranteed fail-safe against hanging browser audio engines via maxWaitMs race guard.
 *
 * @param word Vocabulary word to pronounce.
 * @param bufferMs Peaceful buffer interval after audio ends (default 400ms).
 * @param maxWaitMs Maximum safety timeout for audio playback (default 3000ms).
 */
export async function playWordWithBuffer(
  word: string,
  bufferMs = 400,
  maxWaitMs = 3000,
): Promise<void> {
  if (typeof window === 'undefined') return;
  const trimmed = word?.trim();
  if (!trimmed) return;

  const audioPromise = speak(trimmed, 1.0);

  // Safety timeout guard: ensures muted/headless browsers never stall the session
  const timeoutPromise = new Promise<void>((resolve) => {
    window.setTimeout(resolve, maxWaitMs);
  });

  await Promise.race([audioPromise, timeoutPromise]);

  // Peaceful post-audio buffer (300-500ms)
  if (bufferMs > 0) {
    await new Promise<void>((resolve) => {
      window.setTimeout(resolve, bufferMs);
    });
  }
}
