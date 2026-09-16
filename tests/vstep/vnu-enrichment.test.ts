/**
 * VNU Test Enrichment Verification Suite
 * File: tests/vstep/vnu-enrichment.test.ts
 */

import { TestRunner, expect } from './test-harness';
import { loadRawVstepExam, resolveExamFilePath, stripSensitiveVstepData } from '@/lib/vstep-test-loader';
import catalogDataRaw from '@/data/vstep/vstep-catalog-index.json';

export async function runVnuEnrichmentTests(runner?: TestRunner): Promise<TestRunner> {
  const r = runner || new TestRunner();

  await r.describe('VNU Test Suite — Enrichment & Pedagogical Quality', async () => {
    const vnuExamIds = ['vstep-exam-vnu-01', 'vstep-exam-vnu-02', 'vstep-exam-vnu-03'];

    await r.it('VNU-1.1: All 3 VNU exams exist on disk and resolve through canonical route rules', () => {
      for (const id of vnuExamIds) {
        const filePath = resolveExamFilePath(id);
        expect(filePath).not.toBeNull();
      }
    });

    await r.it('VNU-1.2: All 3 VNU exams load successfully and conform to 4-skill VSTEP schema', () => {
      for (const id of vnuExamIds) {
        const exam = loadRawVstepExam(id);
        expect(exam).toBeDefined();
        expect(exam!.sections.length).toBe(4);
        
        const listening = exam!.sections.find((s) => s.type === 'listening');
        const reading = exam!.sections.find((s) => s.type === 'reading');
        const writing = exam!.sections.find((s) => s.type === 'writing');
        const speaking = exam!.sections.find((s) => s.type === 'speaking');

        expect(listening).toBeDefined();
        expect(reading).toBeDefined();
        expect(writing).toBeDefined();
        expect(speaking).toBeDefined();

        expect(listening!.tasks.length).toBe(3);
        expect(reading!.tasks.length).toBe(4);
        expect(writing!.tasks.length).toBe(2);
        expect(speaking!.tasks.length).toBe(3);
      }
    });

    await r.it('VNU-2.1: Reading answers across all 3 VNU exams have natural balanced distribution (not all-A)', () => {
      for (const id of vnuExamIds) {
        const exam = loadRawVstepExam(id)!;
        const reading = exam.sections.find((s) => s.type === 'reading')!;
        const answers = reading.tasks.flatMap((t) => (t.questions || []).map((q) => q.answer));
        
        expect(answers.length).toBe(40);
        
        // Count distribution of 0 (A), 1 (B), 2 (C), 3 (D)
        const counts = [0, 1, 2, 3].map((opt) => answers.filter((a) => a === opt).length);
        
        // Each option must appear at least 5 times out of 40 questions
        for (let i = 0; i < 4; i++) {
          expect(counts[i] >= 5).toBe(true);
        }
        
        // No option should exceed 20 (50%)
        for (let i = 0; i < 4; i++) {
          expect(counts[i] <= 20).toBe(true);
        }
      }
    });

    await r.it('VNU-2.2: Listening answers across all 3 VNU exams have natural balanced distribution', () => {
      for (const id of vnuExamIds) {
        const exam = loadRawVstepExam(id)!;
        const listening = exam.sections.find((s) => s.type === 'listening')!;
        const answers = listening.tasks.flatMap((t) => (t.questions || []).map((q) => q.answer));
        
        expect(answers.length).toBe(35);
        
        const counts = [0, 1, 2, 3].map((opt) => answers.filter((a) => a === opt).length);
        
        // Each option should appear at least 4 times out of 35
        for (let i = 0; i < 4; i++) {
          expect(counts[i] >= 4).toBe(true);
        }
      }
    });

    await r.it('VNU-3.1: All questions possess rich Vietnamese explanations with text citation and analysis', () => {
      for (const id of vnuExamIds) {
        const exam = loadRawVstepExam(id)!;
        const mcqQuestions = exam.sections
          .filter((s) => s.type === 'listening' || s.type === 'reading')
          .flatMap((s) => s.tasks.flatMap((t) => t.questions || []));
        
        expect(mcqQuestions.length).toBe(75);
        
        for (const q of mcqQuestions) {
          expect(typeof q.explanationVi).toBe('string');
          expect(q.explanationVi!.length >= 25).toBe(true);
        }
      }
    });

    await r.it('VNU-3.2: Listening tasks include complete conversational or lecture tapescripts', () => {
      for (const id of vnuExamIds) {
        const exam = loadRawVstepExam(id)!;
        const listening = exam.sections.find((s) => s.type === 'listening')!;
        
        for (const task of listening.tasks) {
          expect(typeof task.tapescript).toBe('string');
          expect(task.tapescript!.length > 100).toBe(true);
        }
      }
    });

    await r.it('VNU-3.3: Writing and Speaking tasks contain high-scoring Band C1 model responses', () => {
      for (const id of vnuExamIds) {
        const exam = loadRawVstepExam(id)!;
        const writing = exam.sections.find((s) => s.type === 'writing')!;
        const speaking = exam.sections.find((s) => s.type === 'speaking')!;
        
        for (const task of writing.tasks) {
          expect(typeof task.suggestion).toBe('string');
          expect(task.suggestion!.length >= 100).toBe(true);
        }

        for (const task of speaking.tasks) {
          expect(typeof task.suggestion).toBe('string');
          expect(task.suggestion!.length >= 50).toBe(true);
        }
      }
    });

    await r.it('VNU-4.1: stripSensitiveVstepData cleanly sanitizes sensitive fields across all 3 VNU exams', () => {
      for (const id of vnuExamIds) {
        const exam = loadRawVstepExam(id)!;
        const stripped = stripSensitiveVstepData(exam);
        
        // Ensure no answers or explanations leak to client
        const strippedQuestions = stripped.sections.flatMap((s) => s.tasks.flatMap((t) => t.questions || []));
        for (const q of strippedQuestions) {
          expect((q as any).answer).toBeUndefined();
          expect((q as any).explanationVi).toBeUndefined();
        }

        for (const s of stripped.sections) {
          for (const t of s.tasks) {
            expect((t as any).tapescript).toBeUndefined();
          }
        }
      }
    });

    await r.it('VNU-4.2: Catalog metadata reflects VNU source update with 3 items', () => {
      const catalog = catalogDataRaw as any;
      const vnuSource = catalog.sources.find((s: any) => s.id === 'vnu');
      expect(vnuSource).toBeDefined();
      expect(vnuSource.totalItems).toBe(3);

      const vnuItems = catalog.items.filter((it: any) => it.source === 'vnu');
      expect(vnuItems.length).toBe(3);
    });
  });

  return r;
}

// Standalone execution
if (process.argv[1]?.includes('vnu-enrichment.test')) {
  const runner = new TestRunner();
  runVnuEnrichmentTests(runner).then((r) => {
    const stats = r.getStats();
    console.log(`\n==================================================`);
    console.log(`  VNU Enrichment Test Suite: ${stats.passed}/${stats.total} PASSED (${stats.durationMs}ms)`);
    console.log(`==================================================\n`);
    if (stats.failed > 0) {
      process.exit(1);
    }
  });
}
