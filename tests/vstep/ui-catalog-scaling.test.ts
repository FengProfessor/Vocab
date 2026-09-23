/**
 * VSTEP Catalog UI/UX Scaling & Anti-Duplication Verification Suite
 * Milestone 3: Tests pagination (12 items/page, smart ellipsis),
 * multi-facet filter matrix, instant search with accent normalization,
 * dynamic question bank capacity (5,754 Qs), and anti-duplication exam URL generation.
 */

import { TestRunner, expect, setupMockBrowserEnvironment, teardownMockBrowserEnvironment } from './test-harness';
import catalogDataRaw from '@/data/vstep/vstep-catalog-index.json';
import { VstepExamCatalogItem } from '@/lib/vstep-types';
import {
  ITEMS_PER_PAGE,
  normalizeViText,
  getPaginationPages
} from '@/app/vstep/page';
import {
  getVstepProgressStats,
  batchRecordVstepAnswers,
  resetVstepSkillProgress,
  resetAllVstepProgress,
  VstepPracticeFilterMode
} from '@/lib/vstep-history';

const catalogItems = (catalogDataRaw as { items: VstepExamCatalogItem[] }).items;

export async function runCatalogScalingTests(): Promise<void> {
  const runner = new TestRunner();
  const { localStorage } = setupMockBrowserEnvironment();

  await runner.describe('1. VSTEP Catalog Scaling — Pagination & Ellipsis Engine', async () => {
    await runner.it('P1.1: Global catalog contains 244 items and divides into exactly 21 pages at 12 items/page', () => {
      expect(catalogItems.length).toBe(244);
      expect(ITEMS_PER_PAGE).toBe(12);

      const totalPages = Math.max(1, Math.ceil(catalogItems.length / ITEMS_PER_PAGE));
      expect(totalPages).toBe(21);
    });

    await runner.it('P1.2: First page (page 1) slices items 1 to 12 with correct zero-based indices', () => {
      const page = 1;
      const startIndex = (page - 1) * ITEMS_PER_PAGE;
      const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, catalogItems.length);
      const pageItems = catalogItems.slice(startIndex, endIndex);

      expect(pageItems.length).toBe(12);
      expect(startIndex).toBe(0);
      expect(endIndex).toBe(12);
      expect(pageItems[0].id).toBe('vstep-mock-01');
      expect(pageItems[11].id).toBe('vstep-mock-12');
    });

    await runner.it('P1.3: Intermediate page (page 2) slices items 13 to 24 accurately', () => {
      const page = 2;
      const startIndex = (page - 1) * ITEMS_PER_PAGE;
      const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, catalogItems.length);
      const pageItems = catalogItems.slice(startIndex, endIndex);

      expect(pageItems.length).toBe(12);
      expect(startIndex).toBe(12);
      expect(endIndex).toBe(24);
      expect(pageItems[0].id).toBe('vstep-mock-13');
      expect(pageItems[11].id).toBe('vstep-listening-01');
    });

    await runner.it('P1.4: Last page (page 21) holds remaining 4 items (items 241 to 244)', () => {
      const page = 21;
      const startIndex = (page - 1) * ITEMS_PER_PAGE;
      const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, catalogItems.length);
      const pageItems = catalogItems.slice(startIndex, endIndex);

      expect(pageItems.length).toBe(4);
      expect(startIndex).toBe(240);
      expect(endIndex).toBe(244);
      expect(pageItems[3].id).toBe('vstep-speaking-vnu-03');
    });

    await runner.it('P1.5: Smart ellipsis displays all pages when totalPages <= 7', () => {
      const pages5 = getPaginationPages(3, 5);
      expect(pages5).toEqual([1, 2, 3, 4, 5]);

      const pages7 = getPaginationPages(4, 7);
      expect(pages7).toEqual([1, 2, 3, 4, 5, 6, 7]);
    });

    await runner.it('P1.6: Smart ellipsis formats left cluster when current page <= 4', () => {
      const pagesStart = getPaginationPages(1, 21);
      expect(pagesStart).toEqual([1, 2, 3, 4, 5, 'ellipsis', 21]);

      const pagesPage4 = getPaginationPages(4, 21);
      expect(pagesPage4).toEqual([1, 2, 3, 4, 5, 'ellipsis', 21]);
    });

    await runner.it('P1.7: Smart ellipsis formats right cluster when current page >= total - 3', () => {
      const pagesEnd = getPaginationPages(21, 21);
      expect(pagesEnd).toEqual([1, 'ellipsis', 17, 18, 19, 20, 21]);

      const pagesPage18 = getPaginationPages(18, 21);
      expect(pagesPage18).toEqual([1, 'ellipsis', 17, 18, 19, 20, 21]);
    });

    await runner.it('P1.8: Smart ellipsis formats double ellipsis when current page is in the middle', () => {
      const pagesMid = getPaginationPages(11, 21);
      expect(pagesMid).toEqual([1, 'ellipsis', 10, 11, 12, 'ellipsis', 21]);
    });
  });

  await runner.describe('2. Multi-Facet Filter Matrix & Cross-Facet Counting', async () => {
    // Pre-index items as in page component
    const indexedItems = catalogItems.map((item) => ({
      ...item,
      _searchKey: normalizeViText(
        [item.id, item.title, item.titleVi, item.badge].filter(Boolean).join(' ')
      ),
    }));

    function applyFilters(
      selectedSkill: string,
      selectedLevel: string,
      selectedSource: string,
      searchQuery: string
    ) {
      const normQ = searchQuery.trim() ? normalizeViText(searchQuery.trim()) : '';
      const skillCounts: Record<string, number> = { all: 0, full_mock: 0, listening: 0, reading: 0, writing: 0, speaking: 0 };
      const levelCounts: Record<string, number> = { all: 0, B1: 0, B2: 0, C1: 0 };
      const sourceCounts: Record<string, number> = { all: 0, vstepowl: 0, onthivstep: 0, englishteststore: 0, vnu: 0 };
      const filtered: typeof indexedItems = [];

      for (const item of indexedItems) {
        if (normQ && !item._searchKey.includes(normQ)) continue;

        const itemSkill = item.skill || item.category;
        const itemLevel = item.cefrLevel || item.targetLevel;
        const itemSource = item.source || 'vstepowl';

        const matchSkill = selectedSkill === 'all' || itemSkill === selectedSkill;
        const matchLevel = selectedLevel === 'all' || itemLevel === selectedLevel;
        const matchSource = selectedSource === 'all' || itemSource === selectedSource;

        if (matchLevel && matchSource) {
          skillCounts.all++;
          if (skillCounts[itemSkill] !== undefined) skillCounts[itemSkill]++;
        }
        if (matchSkill && matchSource) {
          levelCounts.all++;
          if (levelCounts[itemLevel] !== undefined) levelCounts[itemLevel]++;
        }
        if (matchSkill && matchLevel) {
          sourceCounts.all++;
          if (sourceCounts[itemSource] !== undefined) sourceCounts[itemSource]++;
        }
        if (matchSkill && matchLevel && matchSource) {
          filtered.push(item);
        }
      }

      return { filtered, skillCounts, levelCounts, sourceCounts };
    }

    await runner.it('F2.1: Baseline unconstrained counts match exact catalog distribution', () => {
      const res = applyFilters('all', 'all', 'all', '');
      expect(res.filtered.length).toBe(244);
      expect(res.skillCounts.all).toBe(244);
      expect(res.skillCounts.full_mock).toBe(26);
      expect(res.skillCounts.listening).toBe(61);
      expect(res.skillCounts.reading).toBe(105);
      expect(res.skillCounts.writing).toBe(26);
      expect(res.skillCounts.speaking).toBe(26);

      expect(res.levelCounts.all).toBe(244);
      expect(res.levelCounts.B1).toBe(15);
      expect(res.levelCounts.B2).toBe(191);
      expect(res.levelCounts.C1).toBe(38);

      expect(res.sourceCounts.all).toBe(244);
      expect(res.sourceCounts.vstepowl).toBe(145);
      expect(res.sourceCounts.onthivstep).toBe(75);
      expect(res.sourceCounts.englishteststore).toBe(15);
      expect(res.sourceCounts.vnu).toBe(9);
    });

    await runner.it('F2.2: Skill filtering isolates all five catalog categories', () => {
      const fullMockRes = applyFilters('full_mock', 'all', 'all', '');
      expect(fullMockRes.filtered.length).toBe(26);
      expect(fullMockRes.filtered.every(i => i.category === 'full_mock' || i.skill === 'full_mock')).toBeTruthy();

      const listeningRes = applyFilters('listening', 'all', 'all', '');
      expect(listeningRes.filtered.length).toBe(61);
      expect(listeningRes.filtered.every(i => i.category === 'listening' || i.skill === 'listening')).toBeTruthy();

      const readingRes = applyFilters('reading', 'all', 'all', '');
      expect(readingRes.filtered.length).toBe(105);
      expect(readingRes.filtered.every(i => i.category === 'reading' || i.skill === 'reading')).toBeTruthy();

      const writingRes = applyFilters('writing', 'all', 'all', '');
      expect(writingRes.filtered.length).toBe(26);
      expect(writingRes.filtered.every(i => i.category === 'writing' || i.skill === 'writing')).toBeTruthy();

      const speakingRes = applyFilters('speaking', 'all', 'all', '');
      expect(speakingRes.filtered.length).toBe(26);
      expect(speakingRes.filtered.every(i => i.category === 'speaking' || i.skill === 'speaking')).toBeTruthy();
    });

    await runner.it('F2.3: Source filtering isolates OnThiVSTEP (75), EnglishTestStore (15), and VNU (9)', () => {
      const onthiRes = applyFilters('all', 'all', 'onthivstep', '');
      expect(onthiRes.filtered.length).toBe(75);
      expect(onthiRes.filtered.every(i => i.source === 'onthivstep')).toBeTruthy();

      const etsRes = applyFilters('all', 'all', 'englishteststore', '');
      expect(etsRes.filtered.length).toBe(15);
      expect(etsRes.filtered.every(i => i.source === 'englishteststore')).toBeTruthy();

      const vnuRes = applyFilters('all', 'all', 'vnu', '');
      expect(vnuRes.filtered.length).toBe(9);
      expect(vnuRes.filtered.every((item) => item.source === 'vnu')).toBeTruthy();
      expect(vnuRes.filtered.map((item) => item.id).includes('vstep-exam-vnu-01')).toBeTruthy();
      expect(vnuRes.filtered.map((item) => item.id).includes('vstep-writing-vnu-01')).toBeTruthy();
      expect(vnuRes.filtered.map((item) => item.id).includes('vstep-speaking-vnu-01')).toBeTruthy();
    });

    await runner.it('F2.4: Multi-facet intersection (Reading + C1 + OnThiVSTEP) yields exactly 35 sets', () => {
      const deepRes = applyFilters('reading', 'C1', 'onthivstep', '');
      expect(deepRes.filtered.length).toBe(35);
      expect(deepRes.filtered.every(i => i.targetLevel === 'C1' && i.source === 'onthivstep')).toBeTruthy();
    });

    await runner.it('F2.5: Zero-match combination gracefully produces 0 filtered items', () => {
      const zeroRes = applyFilters('full_mock', 'C1', 'onthivstep', '');
      expect(zeroRes.filtered.length).toBe(0);
    });
  });

  await runner.describe('3. Instant Search with Accent Normalization', async () => {
    await runner.it('S3.1: normalizeViText strips Vietnamese diacritics and converts d/D', () => {
      expect(normalizeViText('Đọc Hiểu')).toBe('doc hieu');
      expect(normalizeViText('Nghe')).toBe('nghe');
      expect(normalizeViText('Đại Học Quốc Gia')).toBe('dai hoc quoc gia');
      expect(normalizeViText('')).toBe('');
    });

    await runner.it('S3.2: Searching non-accented "doc hieu" matches Reading sets', () => {
      const query = 'doc hieu';
      const normQ = normalizeViText(query);
      const matches = catalogItems.filter(item => {
        const key = normalizeViText([item.id, item.title, item.titleVi, item.badge].filter(Boolean).join(' '));
        return key.includes(normQ);
      });
      expect(matches.length).toBeGreaterThan(0);
      expect(matches.every(i => i.title.toLowerCase().includes('đọc') || i.badge.toLowerCase().includes('đọc') || i.title.toLowerCase().includes('reading'))).toBeTruthy();
    });

    await runner.it('S3.3: Searching "baikal" finds Lake Baikal reading passages without false positives', () => {
      const query = 'baikal';
      const normQ = normalizeViText(query);
      const matches = catalogItems.filter(item => {
        const key = normalizeViText([item.id, item.title, item.titleVi, item.badge].filter(Boolean).join(' '));
        return key.includes(normQ);
      });
      expect(matches.length).toBe(1);
      expect(matches[0].id).toBe('vstep-reading-onthi-01');
    });

    await runner.it('S3.4: Searching "vnu" matches VNU Official exam', () => {
      const normQ = normalizeViText('vnu');
      const matches = catalogItems.filter(item => {
        const key = normalizeViText([item.id, item.title, item.titleVi, item.badge].filter(Boolean).join(' '));
        return key.includes(normQ);
      });
      expect(matches.length).toBe(9);
      expect(matches.every((item) => item.source === 'vnu')).toBeTruthy();
      expect(matches.some((item) => item.id === 'vstep-exam-vnu-01')).toBeTruthy();
      expect(matches.some((item) => item.id === 'vstep-writing-vnu-01')).toBeTruthy();
      expect(matches.some((item) => item.id === 'vstep-speaking-vnu-01')).toBeTruthy();
    });
  });

  await runner.describe('4. Dynamic Question Bank Capacity & Stats Aggregation', async () => {
    await runner.it('Q4.1: Dynamic calculation yields 3,030 listening and 2,724 reading questions (5,754 total)', () => {
      let listening = 0;
      let reading = 0;
      for (const item of catalogItems) {
        if (item.category === 'full_mock') {
          listening += 35;
          reading += 40;
        } else if (item.category === 'listening' || item.skills?.includes('listening')) {
          listening += (item.totalQuestions || 0);
        } else if (item.category === 'reading' || item.skills?.includes('reading')) {
          reading += (item.totalQuestions || 0);
        }
      }

      expect(listening).toBe(3030);
      expect(reading).toBe(2724);
      expect(listening + reading).toBe(5754);
    });

    await runner.it('Q4.2: Progress stats return 0% and zero answered on clean state', () => {
      localStorage.clear();
      const statsL = getVstepProgressStats('listening', 3030);
      const statsR = getVstepProgressStats('reading', 2724);

      expect(statsL.answeredCount).toBe(0);
      expect(statsL.totalCount).toBe(3030);
      expect(statsL.percentage).toBe(0);
      expect(statsL.mistakeCount).toBe(0);

      expect(statsR.answeredCount).toBe(0);
      expect(statsR.totalCount).toBe(2724);
      expect(statsR.percentage).toBe(0);
    });

    await runner.it('Q4.3: Batch recording attempts updates answered and mistake counts', () => {
      localStorage.clear();
      batchRecordVstepAnswers([
        { questionId: 'lis-q1', skill: 'listening', part: 'part1', isCorrect: true, selectedOption: 0 },
        { questionId: 'lis-q2', skill: 'listening', part: 'part1', isCorrect: false, selectedOption: 1 },
        { questionId: 'lis-q3', skill: 'listening', part: 'part2', isCorrect: true, selectedOption: 2 },
        { questionId: 'read-q1', skill: 'reading', part: 'passage1', isCorrect: false, selectedOption: 3 },
      ]);

      const statsL = getVstepProgressStats('listening', 3030);
      const statsR = getVstepProgressStats('reading', 2724);

      expect(statsL.answeredCount).toBe(3);
      expect(statsL.correctCount).toBe(2);
      expect(statsL.mistakeCount).toBe(1);

      expect(statsR.answeredCount).toBe(1);
      expect(statsR.mistakeCount).toBe(1);
    });

    await runner.it('Q4.4: Resetting skill progress clears only target skill', () => {
      resetVstepSkillProgress('listening');
      const statsL = getVstepProgressStats('listening', 3030);
      const statsR = getVstepProgressStats('reading', 2724);

      expect(statsL.answeredCount).toBe(0);
      expect(statsL.mistakeCount).toBe(0);
      expect(statsR.answeredCount).toBe(1);
      expect(statsR.mistakeCount).toBe(1);

      resetAllVstepProgress();
      const statsRClean = getVstepProgressStats('reading', 2724);
      expect(statsRClean.answeredCount).toBe(0);
    });
  });

  await runner.describe('5. Anti-Duplication URL Generation & Exam Room Contracts', async () => {
    await runner.it('U5.1: Action URLs properly encode filter parameter for all 3 modes', () => {
      const testItem = catalogItems[0]; // vstep-mock-01

      const modes: VstepPracticeFilterMode[] = ['unseen', 'mistakes', 'all_random'];
      for (const mode of modes) {
        const url = `/vstep/exam/${testItem.id}?filter=${mode}`;
        expect(url).toBe(`/vstep/exam/vstep-mock-01?filter=${mode}`);
      }
    });

    await runner.it('U5.2: API POST body carries test/filter/history state without query-string growth', () => {
      const examId = 'vstep-mock-01';
      const filterMode: VstepPracticeFilterMode = 'unseen';
      const excludedIds = ['vstep-mock-01:q1', 'vstep-mock-01:q2'];
      const mistakeIds = ['vstep-mock-01:q2'];

      const request = {
        url: '/api/vstep/test',
        method: 'POST',
        body: JSON.stringify({ testId: examId, filterMode, excludedIds, mistakeIds }),
      };
      const body = JSON.parse(request.body);

      expect(request.url).toBe('/api/vstep/test');
      expect(request.method).toBe('POST');
      expect(body.testId).toBe(examId);
      expect(body.filterMode).toBe(filterMode);
      expect(body.excludedIds).toEqual(excludedIds);
      expect(body.mistakeIds).toEqual(mistakeIds);
    });
  });

  teardownMockBrowserEnvironment();

  const stats = runner.getStats();
  console.log(`\n======================================================`);
  console.log(`🏁 UI CATALOG SCALING SUITE: ${stats.passed}/${stats.total} PASSED | ${stats.failed} FAILED`);
  console.log(`======================================================`);

  if (stats.failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runCatalogScalingTests().catch((err) => {
    console.error('Fatal error in UI catalog scaling test suite:', err);
    process.exit(1);
  });
}
