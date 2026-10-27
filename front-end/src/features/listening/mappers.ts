import type { TranscriptCueDto } from '@/features/listening/types';

export function mapTranscriptCue(raw: Partial<TranscriptCueDto>, index = 0): TranscriptCueDto {
  return {
    index: typeof raw.index === 'number' ? raw.index : index,
    startTime: typeof raw.startTime === 'number' ? raw.startTime : 0,
    endTime: typeof raw.endTime === 'number' ? raw.endTime : 0,
    text: String(raw.text ?? ''),
    translation: raw.translation,
    speaker: raw.speaker,
  };
}
