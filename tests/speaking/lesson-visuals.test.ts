/**
 * Kiểm tra tranh minh họa lộ trình Speaking 32 bài.
 * Chạy: npx tsx tests/speaking/lesson-visuals.test.ts
 *
 * Bảo đảm:
 * 1. Mỗi bài trong allCurriculumLessons có manifest tranh, và manifest không thừa mã bài lạ.
 * 2. Mọi mã OpenMoji được tham chiếu đều có file SVG trong public/speaking/openmoji/.
 * 3. Mỗi khóa trong `words` khớp một từ thật của bài (từ luyện âm, cặp âm tối thiểu, từ vựng).
 * 4. SPEAKING_PHASE_CONFIGS.lessonIds trùng với mã bài thật theo đúng thứ tự.
 * 5. isLearnerSpeaker nhận đúng vai người học ở cả 3 chặng (Learner/Candidate).
 */
import { existsSync } from 'fs';
import path from 'path';
import { allCurriculumLessons, getCurriculumLessonsByPhase, SPEAKING_PHASE_CONFIGS } from '@/data/speaking/curriculum';
import type { SpeakingPhaseId } from '@/types/speaking-curriculum';
import { getAllLessonVisualIds, getLessonVisual, isLearnerSpeaker } from '@/lib/speaking/lesson-visuals';

let failures = 0;
function check(condition: boolean, message: string) {
  if (condition) return;
  failures += 1;
  console.error(`  FAIL ${message}`);
}

const svgDir = path.join(process.cwd(), 'public', 'speaking', 'openmoji');
const lessonIds = new Set(allCurriculumLessons.map((l) => l.id));

for (const id of getAllLessonVisualIds()) {
  check(lessonIds.has(id), `visuals.json có mã bài không tồn tại: ${id}`);
}

for (const lesson of allCurriculumLessons) {
  const visual = getLessonVisual(lesson.id);
  check(Boolean(visual), `${lesson.id} chưa có tranh bối cảnh`);
  if (!visual) continue;

  check(visual.goalVi.trim().length >= 10, `${lesson.id} thiếu mục tiêu goalVi`);
  check(visual.props.length >= 3, `${lesson.id} cần ≥3 đạo cụ minh họa`);

  const hexes = [
    visual.place.hex,
    visual.partner.hex,
    visual.learner.hex,
    ...visual.props.map((p) => p.hex),
    ...Object.values(visual.words),
  ];
  for (const hex of hexes) {
    check(existsSync(path.join(svgDir, `${hex}.svg`)), `${lesson.id}: thiếu SVG ${hex}`);
  }

  const lessonTerms = new Set(
    [
      ...(lesson.stage1Phonetics.targetPracticeWords || []).map((w) => w.word),
      ...(lesson.stage1Phonetics.minimalPairs || []).flatMap((p) => [p.wordA, p.wordB]),
      ...(lesson.stage2CorePatterns.highFrequencyVocab || []).map((v) => v.term),
    ].map((t) => t.trim().toLowerCase())
  );
  for (const term of Object.keys(visual.words)) {
    check(lessonTerms.has(term.toLowerCase()), `${lesson.id}: từ "${term}" trong visuals.json không có trong bài`);
  }

  for (const turn of lesson.stage3GuidedDialogue.turns) {
    if (['learner', 'candidate'].includes(turn.speaker.toLowerCase())) {
      check(isLearnerSpeaker(turn.speaker), `${lesson.id}: không nhận ra vai người học "${turn.speaker}"`);
    }
  }
}

for (const [phaseId, config] of Object.entries(SPEAKING_PHASE_CONFIGS)) {
  const actual = getCurriculumLessonsByPhase(phaseId as SpeakingPhaseId).map((l) => l.id);
  check(
    JSON.stringify(config.lessonIds) === JSON.stringify(actual),
    `${phaseId}.lessonIds lệch so với dữ liệu bài học`
  );
}

check(!isLearnerSpeaker('Partner'), 'Partner bị nhận nhầm là người học');
check(!isLearnerSpeaker('Examiner'), 'Examiner bị nhận nhầm là người học');
check(isLearnerSpeaker('Candidate'), 'Candidate phải là người học');

if (failures > 0) {
  console.error(`[lesson-visuals] ${failures} lỗi`);
  process.exit(1);
}
console.log(`[lesson-visuals] PASS — ${allCurriculumLessons.length} bài, mọi tranh và mã bài hợp lệ`);
