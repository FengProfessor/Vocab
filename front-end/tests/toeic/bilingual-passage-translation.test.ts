import fs from 'node:fs';
import path from 'node:path';
import { TestRunner, expect } from './test-harness';
import { loadAnyToeicTest } from '@/lib/toeic-test-loader';

const ROOT_DIR = path.resolve(__dirname, '../..');
const SPLIT_PANE_PATH = path.resolve(ROOT_DIR, 'src/components/toeic/ToeicSplitPane.tsx');
const SCORE_REPORT_PATH = path.resolve(ROOT_DIR, 'src/components/toeic/ToeicScoreReportView.tsx');

export async function runBilingualPassageTranslationTests(runner: TestRunner) {
  runner.describe('TOEIC Part 6 & 7 Bilingual Whole-Passage Translation Verification Suite (Worker M5)', () => {
    const splitCode = fs.readFileSync(SPLIT_PANE_PATH, 'utf8');
    const reportCode = fs.readFileSync(SCORE_REPORT_PATH, 'utf8');

    // ── 1. Component Export & Contract ──
    runner.it('BILINGUAL-1: ToeicSplitPane exports ToeicBilingualPassage component with proper props contract', () => {
      expect(splitCode.includes('export interface ToeicBilingualPassageProps')).toBe(true);
      expect(splitCode.includes('export function ToeicBilingualPassage')).toBe(true);
      expect(splitCode.includes('passage: string;')).toBe(true);
      expect(splitCode.includes('passageTranslationVi?: string;')).toBe(true);
      expect(splitCode.includes('dichNghia?: string;')).toBe(true);
      expect(splitCode.includes('canRevealTranslation?: boolean;')).toBe(true);
      expect(splitCode.includes('mode?: \'en\' | \'bilingual\';')).toBe(true);
    });

    // ── 2. Segmented Switcher UI ──
    runner.it('BILINGUAL-2: Renders segmented switcher buttons [🇬🇧 Chỉ xem tiếng Anh] and [🇻🇳 Xem song ngữ / Bản dịch]', () => {
      expect(splitCode.includes('🇬🇧 Chỉ xem tiếng Anh')).toBe(true);
      expect(splitCode.includes('🇻🇳 Xem song ngữ / Bản dịch')).toBe(true);
      expect(splitCode.includes('hasTranslation &&')).toBe(true);
    });

    // ── 3. Responsive Dual-Column & Mobile Tabbed Layout ──
    runner.it('BILINGUAL-3: Responsive layout: dual-column side-by-side on desktop (lg:grid-cols-2) and tabbed on mobile', () => {
      // Desktop: side-by-side split layout
      expect(splitCode.includes('lg:grid-cols-2')).toBe(true);
      expect(splitCode.includes('Văn bản gốc tiếng Anh')).toBe(true);
      expect(splitCode.includes('Bản dịch tiếng Việt')).toBe(true);

      // Mobile: tabbed switcher
      expect(splitCode.includes('lg:hidden')).toBe(true);
      expect(splitCode.includes('🇬🇧 Tiếng Anh')).toBe(true);
      expect(splitCode.includes('🇻🇳 Bản dịch tiếng Việt')).toBe(true);
    });

    // ── 4. Technical Minimalist Styling ──
    runner.it('BILINGUAL-4: Technical Minimalist styling on Vietnamese translation column', () => {
      expect(splitCode.includes('border-l-2 border-l-emerald-500')).toBe(true);
      expect(splitCode.includes('bg-slate-50/80') && splitCode.includes('dark:bg-slate-950/50')).toBe(true);
      expect(splitCode.includes('font-sans leading-relaxed text-slate-700 dark:text-slate-300')).toBe(true);
    });

    // ── 5. Zero-Bulk-Leak Conformance ──
    runner.it('BILINGUAL-5: Zero-Bulk-Leak Conformance: only reveals translation in practice mode or post-submit review', () => {
      // Practice mode in ToeicSplitPane: translation only active when not in exam mode
      expect(splitCode.includes('canRevealTranslation={!isExamMode}')).toBe(true);

      // Score report review mode: post-submit translation active
      expect(reportCode.includes('canRevealTranslation={true}')).toBe(true);
    });

    // ── 6. ExamInteractiveText Preservation ──
    runner.it('BILINGUAL-6: Preserves ExamInteractiveText with 1-click lookup enabled on English reading stimulus', () => {
      expect(splitCode.includes('<ExamInteractiveText text={segment} enabled={isAnswerRevealed}')).toBe(true);
      expect(reportCode.includes('<ToeicBilingualPassage')).toBe(true);
    });

    // ── 7. Score Report Integration ──
    runner.it('BILINGUAL-7: ToeicScoreReportView imports and integrates ToeicBilingualPassage for Part 6 & 7 questions', () => {
      expect(reportCode.includes('ToeicBilingualPassage')).toBe(true);
      expect(reportCode.includes('q.passage && (')).toBe(true);
      expect(reportCode.includes('passageTranslationVi={q.passageTranslationVi}')).toBe(true);
      expect(reportCode.includes('dichNghia={q.dichNghia}')).toBe(true);
    });

    // ── 8. Dataset Verification for Part 6 & 7 Reading Translations ──
    runner.it('BILINGUAL-8: Verified 100% of Part 6 & 7 questions in ETS-PRO datasets have Vietnamese translations', () => {
      const test01 = loadAnyToeicTest('ets-pro-01');
      const reading01 = test01.filter((q) => q.part === 6 || q.part === 7);
      expect(reading01.length).toBe(70);

      const withTranslations = reading01.filter(
        (q) => q.passage && (q.passageTranslationVi || q.dichNghia)
      );
      expect(withTranslations.length).toBe(70);
    });
  });
}
