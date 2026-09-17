import { ToeicSpeakingExam, ToeicSpeakingQuestion } from './types';
import { TOEIC_SPEAKING_TEST_01 } from './dataset';

export * from './types';
export * from './dataset';

export const TOEIC_SPEAKING_TESTS: ToeicSpeakingExam[] = [
  TOEIC_SPEAKING_TEST_01,
];

export function getToeicSpeakingTestById(id: string): ToeicSpeakingExam | undefined {
  return TOEIC_SPEAKING_TESTS.find((t) => t.id === id);
}
