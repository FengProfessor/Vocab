import { VstepSkillDefinition } from '@/config/types/VstepSkillDefinition';

/**
 * The four VSTEP skills in official order.
 */
export const VSTEP_SKILLS: readonly VstepSkillDefinition[] = [
  { key: 'listening', label: 'Nghe hiểu (Listening)' },
  { key: 'reading', label: 'Đọc hiểu (Reading)' },
  { key: 'writing', label: 'Viết luận (Writing)' },
  { key: 'speaking', label: 'Nói trực tiếp (Speaking)' },
];

/** Minimum essay length accepted by the API validator (characters). */
export const VSTEP_ESSAY_MIN_CHARACTERS = 30;

/**
 * Test identifier used when the learner enters their own section scores.
 * TODO: [Backend API Required] VSTEP mock-test catalog (legacy src/app/vstep) so real test ids can be submitted.
 */
export const VSTEP_SELF_ASSESSMENT_TEST_ID = 'self-assessment';
