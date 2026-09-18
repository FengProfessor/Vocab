/**
 * VSTEP Speaking Ecosystem Verification Suite
 * File: tests/vstep/speaking.test.ts
 */

import { TestRunner, expect } from './test-harness';
import {
  VSTEP_SPEAKING_PART1_TOPICS,
  VSTEP_SPEAKING_PART2_SCENARIOS,
  VSTEP_SPEAKING_PART3_TOPICS,
  VSTEP_FULL_SPEAKING_EXAMS,
  getVstepSpeakingExamById,
  getVstepPart1TopicById,
  getVstepPart2ScenarioById,
  getVstepPart3TopicById,
} from '@/data/vstep/speaking';

export async function runVstepSpeakingTests(runner?: TestRunner): Promise<TestRunner> {
  const r = runner || new TestRunner();

  await r.describe('VSTEP Speaking — Part 1: Social Interaction Quality', async () => {
    await r.it('VSP-P1.1: At least 15 authentic Part 1 topics exist with background and examiner criteria', () => {
      expect(VSTEP_SPEAKING_PART1_TOPICS.length >= 15).toBe(true);
      for (const topic of VSTEP_SPEAKING_PART1_TOPICS) {
        expect(topic.backgroundOverviewVi !== undefined).toBe(true);
        expect(topic.backgroundOverviewVi!.length > 20).toBe(true);
        expect(topic.examinerCriteriaVi !== undefined).toBe(true);
        expect(topic.examinerCriteriaVi!.length > 20).toBe(true);
      }
    });

    await r.it('VSP-P1.2: Every topic has 3 questions, each with B1, B2, and C1 model responses', () => {
      for (const topic of VSTEP_SPEAKING_PART1_TOPICS) {
        expect(topic.id.length > 0).toBe(true);
        expect(topic.topicName.length > 0).toBe(true);
        expect(topic.questions.length).toBe(3);

        for (const q of topic.questions) {
          expect(q.question.length > 10).toBe(true);
          expect(q.questionVi.length > 5).toBe(true);
          expect(q.sampleB1.length > 20).toBe(true);
          expect(q.sampleB2.length > 30).toBe(true);
          expect(q.sampleC1.length > 40).toBe(true);
          expect(q.keyVocabulary.length >= 2).toBe(true);

          for (const vocab of q.keyVocabulary) {
            expect(vocab.term.length > 0).toBe(true);
            expect(vocab.meaningVi.length > 0).toBe(true);
          }
        }
      }
    });

    await r.it('VSP-P1.3: Lookup helper getVstepPart1TopicById retrieves correctly', () => {
      const topic = getVstepPart1TopicById('vstep-p1-hometown');
      expect(topic).toBeDefined();
      expect(topic!.topicName).toBe('Hometown & Living Area');
    });
  });

  await r.describe('VSTEP Speaking — Part 2: Solution Discussion Quality', async () => {
    await r.it('VSP-P2.1: At least 7 authentic Part 2 scenarios exist with stakeholder analyses', () => {
      expect(VSTEP_SPEAKING_PART2_SCENARIOS.length >= 7).toBe(true);
      for (const sc of VSTEP_SPEAKING_PART2_SCENARIOS) {
        expect(sc.backgroundContextVi !== undefined).toBe(true);
        expect(sc.backgroundContextVi!.length > 20).toBe(true);
        expect(sc.stakeholdersAnalysisVi !== undefined).toBe(true);
        expect(sc.stakeholdersAnalysisVi!.length >= 3).toBe(true);
      }
    });

    await r.it('VSP-P2.2: Every scenario has 3 options, an optimal recommendation, and complete ICE breakdown', () => {
      for (const sc of VSTEP_SPEAKING_PART2_SCENARIOS) {
        expect(sc.options.length).toBe(3);
        const optIds = sc.options.map((o) => o.id);
        expect(optIds.includes(sc.recommendedChoice)).toBe(true);

        expect(sc.iceBreakdown.introduction.length > 10).toBe(true);
        expect(sc.iceBreakdown.comparisonAndCounter.length > 10).toBe(true);
        expect(sc.iceBreakdown.endAndConclusion.length > 10).toBe(true);

        expect(sc.sampleSpeechB2.length > 100).toBe(true);
        expect(sc.sampleSpeechC1.length > 150).toBe(true);
        expect(sc.prepTimeSeconds).toBe(60);
        expect(sc.speakTimeSeconds).toBe(180);
      }
    });

    await r.it('VSP-P2.3: Lookup helper getVstepPart2ScenarioById retrieves correctly', () => {
      const sc = getVstepPart2ScenarioById('vstep-p2-laptop');
      expect(sc).toBeDefined();
      expect(sc!.title).toBe('Graduation Gift for Younger Sibling');
    });
  });

  await r.describe('VSTEP Speaking — Part 3: Topic Development & Follow-up Quality', async () => {
    await r.it('VSP-P3.1: At least 8 Part 3 topics have mindmaps, socio-economic contexts, and academic citations', () => {
      expect(VSTEP_SPEAKING_PART3_TOPICS.length >= 8).toBe(true);
      for (const tp of VSTEP_SPEAKING_PART3_TOPICS) {
        expect(tp.mindmap.centerIdea.length > 5).toBe(true);
        expect(tp.mindmap.givenBranches.length).toBe(3);
        expect(tp.mindmap.customBranchPlaceholder.length > 5).toBe(true);

        expect(tp.socioEconomicContextVi !== undefined).toBe(true);
        expect(tp.socioEconomicContextVi!.length > 30).toBe(true);
        expect(tp.academicCitationsVi !== undefined).toBe(true);
        expect(tp.academicCitationsVi!.length >= 2).toBe(true);

        for (const cit of tp.academicCitationsVi!) {
          expect(cit.length > 10).toBe(true);
        }

        expect(tp.followUpQuestions.length).toBe(3);
        for (const fq of tp.followUpQuestions) {
          expect(fq.question.length > 10).toBe(true);
          expect(fq.questionVi.length > 5).toBe(true);
          expect(fq.sampleAnswer.length > 30).toBe(true);
        }

        expect(tp.sampleSpeechB2.length > 150).toBe(true);
        expect(tp.sampleSpeechC1.length > 200).toBe(true);
      }
    });

    await r.it('VSP-P3.2: Lookup helper getVstepPart3TopicById retrieves correctly', () => {
      const tp = getVstepPart3TopicById('vstep-p3-online-learning');
      expect(tp).toBeDefined();
      expect(tp!.topicTitle).toBe('The Ascendance of Online Learning in Modern Education');
    });
  });

  await r.describe('VSTEP Speaking — Full 12-minute Mock Exam Integrity', async () => {
    await r.it('VSP-FULL.1: At least 8 full mock exams aggregate Part 1, 2, and 3 with exam context', () => {
      expect(VSTEP_FULL_SPEAKING_EXAMS.length >= 8).toBe(true);

      for (const exam of VSTEP_FULL_SPEAKING_EXAMS) {
        expect(exam.id.length > 0).toBe(true);
        expect(exam.totalDurationMinutes).toBe(12);
        expect(exam.part1.questions.length).toBe(3);
        expect(exam.part2.options.length).toBe(3);
        expect(exam.part3.followUpQuestions.length).toBe(3);
        expect(exam.examContextVi !== undefined).toBe(true);
        expect(exam.examContextVi!.length > 20).toBe(true);
      }
    });

    await r.it('VSP-FULL.2: getVstepSpeakingExamById retrieves valid exam', () => {
      const exam = getVstepSpeakingExamById('vstep-speaking-exam-01');
      expect(exam).toBeDefined();
      expect(exam!.targetLevel).toBe('B2');
    });
  });

  return r;
}

if (require.main === module) {
  runVstepSpeakingTests().then((runner) => {
    const stats = runner.getStats();
    console.log(`\nTotal: ${stats.total} | Passed: ${stats.passed} | Failed: ${stats.failed}`);
    if (stats.failed > 0) process.exit(1);
  });
}
