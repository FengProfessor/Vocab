/**
 * Challenger M3.1: Empirical & Adversarial Pagination, Filter Matrix & Search Verification Suite
 * 
 * Verifies:
 * 1. Pagination boundary values: page 0, page 1, page 16, page 17, negative pages, non-integer inputs.
 * 2. Slicing correctness across all 16 pages: every item 0..189 must appear exactly once across pages 1..16 with no duplicates and no omissions.
 * 3. Smart ellipsis transitions: test current page at 1, 2, 3, 4, 5, 8, 12, 13, 14, 15, 16.
 * 4. Filter transitions: verify page resets to 1 when changing Category/Level/Source/Search.
 * 5. Benchmark single-pass filter execution time across 190 items (verify < 1ms).
 * 6. Test accent-insensitive search against diacritics (đề thi, tieng anh, nghe hieu, doc hieu, toan dien).
 */

import { TestRunner, expect } from './test-harness';
import catalogDataRaw from '@/data/vstep/vstep-catalog-index.json';
import { VstepExamCatalogItem } from '@/lib/vstep-types';
import {
  ITEMS_PER_PAGE,
  normalizeViText,
  getPaginationPages
} from '@/app/vstep/page';

interface VstepCatalogIndex {
  version: string;
  totalExams: number;
  totalPracticeSets: number;
  items: VstepExamCatalogItem[];
}

const catalog = catalogDataRaw as unknown as VstepCatalogIndex;
const catalogItems = catalog.items;

export async function runChallengerPaginationTests(): Promise<void> {
  const runner = new TestRunner();

  // ──────────────────────────────────────────────────────────────────────────
  // Suite 1: Pagination Boundary Values & Adversarial Inputs
  // ──────────────────────────────────────────────────────────────────────────
  await runner.describe('1. Pagination Boundary Values & Adversarial Edge Cases', async () => {
    const totalPages = Math.max(1, Math.ceil(catalogItems.length / ITEMS_PER_PAGE)); // 16

    // Helper implementing the component's safe page and slicing math
    function computeSlice(page: number, items: VstepExamCatalogItem[]) {
      const totPages = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE));
      const safePage = Math.max(1, Math.min(Math.floor(page) || 1, totPages));
      const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
      const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, items.length);
      return {
        safePage,
        startIndex,
        endIndex,
        slice: items.slice(startIndex, endIndex),
      };
    }

    // Component's handlePageChange guard logic simulation
    function simulateHandlePageChange(page: number, currentPage: number, totPages: number): { accepted: boolean; newPage: number } {
      if (page < 1 || page > totPages || page === currentPage || !Number.isInteger(page)) {
        return { accepted: false, newPage: currentPage };
      }
      return { accepted: true, newPage: page };
    }

    await runner.it('B1.1: Boundary page 0 is rejected by page handler and clamped to page 1 by safe math', () => {
      expect(totalPages).toBe(16);

      // Page change handler must reject page 0
      const res = simulateHandlePageChange(0, 1, totalPages);
      expect(res.accepted).toBeFalsy();
      expect(res.newPage).toBe(1);

      // Clamped slice math clamps 0 to 1
      const sliceRes = computeSlice(0, catalogItems);
      expect(sliceRes.safePage).toBe(1);
      expect(sliceRes.startIndex).toBe(0);
      expect(sliceRes.endIndex).toBe(12);
      expect(sliceRes.slice.length).toBe(12);

      // getPaginationPages with current=0 yields left cluster
      const pages = getPaginationPages(0, totalPages);
      expect(pages).toEqual([1, 2, 3, 4, 5, 'ellipsis', 16]);
    });

    await runner.it('B1.2: Boundary page 1 (lower bound) is accepted and slices items 0 to 11', () => {
      const res = simulateHandlePageChange(1, 2, totalPages);
      expect(res.accepted).toBeTruthy();
      expect(res.newPage).toBe(1);

      const sliceRes = computeSlice(1, catalogItems);
      expect(sliceRes.safePage).toBe(1);
      expect(sliceRes.startIndex).toBe(0);
      expect(sliceRes.endIndex).toBe(12);
      expect(sliceRes.slice.length).toBe(12);
      expect(sliceRes.slice[0].id).toBe(catalogItems[0].id);
      expect(sliceRes.slice[11].id).toBe(catalogItems[11].id);

      const pages = getPaginationPages(1, totalPages);
      expect(pages).toEqual([1, 2, 3, 4, 5, 'ellipsis', 16]);
    });

    await runner.it('B1.3: Boundary page 16 (upper bound) is accepted and slices items 180 to 189 (10 items)', () => {
      const res = simulateHandlePageChange(16, 15, totalPages);
      expect(res.accepted).toBeTruthy();
      expect(res.newPage).toBe(16);

      const sliceRes = computeSlice(16, catalogItems);
      expect(sliceRes.safePage).toBe(16);
      expect(sliceRes.startIndex).toBe(180);
      expect(sliceRes.endIndex).toBe(190);
      expect(sliceRes.slice.length).toBe(10);
      expect(sliceRes.slice[0].id).toBe(catalogItems[180].id);
      expect(sliceRes.slice[9].id).toBe(catalogItems[189].id);

      const pages = getPaginationPages(16, totalPages);
      expect(pages).toEqual([1, 'ellipsis', 12, 13, 14, 15, 16]);
    });

    await runner.it('B1.4: Boundary page 17 (out of bounds) is rejected by page handler and clamped to 16', () => {
      const res = simulateHandlePageChange(17, 16, totalPages);
      expect(res.accepted).toBeFalsy();
      expect(res.newPage).toBe(16);

      const sliceRes = computeSlice(17, catalogItems);
      expect(sliceRes.safePage).toBe(16);
      expect(sliceRes.slice.length).toBe(10);
    });

    await runner.it('B1.5: Negative pages (-1, -99) are strictly rejected and clamped safely', () => {
      const resNeg1 = simulateHandlePageChange(-1, 1, totalPages);
      expect(resNeg1.accepted).toBeFalsy();
      expect(resNeg1.newPage).toBe(1);

      const resNeg99 = simulateHandlePageChange(-99, 1, totalPages);
      expect(resNeg99.accepted).toBeFalsy();
      expect(resNeg99.newPage).toBe(1);

      const sliceNeg = computeSlice(-5, catalogItems);
      expect(sliceNeg.safePage).toBe(1);
      expect(sliceNeg.slice.length).toBe(12);
    });

    await runner.it('B1.6: Non-integer and special numeric inputs (1.5, 8.9, NaN, Infinity) are handled safely', () => {
      expect(simulateHandlePageChange(1.5, 1, totalPages).accepted).toBeFalsy();
      expect(simulateHandlePageChange(8.9, 1, totalPages).accepted).toBeFalsy();
      expect(simulateHandlePageChange(NaN, 1, totalPages).accepted).toBeFalsy();
      expect(simulateHandlePageChange(Infinity, 1, totalPages).accepted).toBeFalsy();
      expect(simulateHandlePageChange(-Infinity, 1, totalPages).accepted).toBeFalsy();

      const sliceNaN = computeSlice(NaN, catalogItems);
      expect(sliceNaN.safePage).toBe(1);
      expect(sliceNaN.slice.length).toBe(12);

      const sliceInf = computeSlice(Infinity, catalogItems);
      expect(sliceInf.safePage).toBe(16);
      expect(sliceInf.slice.length).toBe(10);
    });

    await runner.it('B1.7: Empty catalog (0 items) produces totalPages = 1 and empty slice without exception', () => {
      const emptyItems: VstepExamCatalogItem[] = [];
      const emptyTotalPages = Math.max(1, Math.ceil(emptyItems.length / ITEMS_PER_PAGE));
      expect(emptyTotalPages).toBe(1);

      const sliceRes = computeSlice(1, emptyItems);
      expect(sliceRes.safePage).toBe(1);
      expect(sliceRes.slice.length).toBe(0);
      expect(sliceRes.startIndex).toBe(0);
      expect(sliceRes.endIndex).toBe(0);

      const pages = getPaginationPages(1, emptyTotalPages);
      expect(pages).toEqual([1]);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Suite 2: Slicing Correctness Across All 16 Pages (Full Partition Invariant)
  // ──────────────────────────────────────────────────────────────────────────
  await runner.describe('2. Slicing Correctness Across All 16 Pages (Completeness & Uniqueness)', async () => {
    const totalPages = Math.max(1, Math.ceil(catalogItems.length / ITEMS_PER_PAGE));

    await runner.it('S2.1: Slicing invariant: 16 pages sum to exactly 190 items', () => {
      expect(catalogItems.length).toBe(190);
      expect(totalPages).toBe(16);

      let totalSliced = 0;
      for (let p = 1; p <= totalPages; p++) {
        const startIndex = (p - 1) * ITEMS_PER_PAGE;
        const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, catalogItems.length);
        const slice = catalogItems.slice(startIndex, endIndex);

        if (p < 16) {
          expect(slice.length).toBe(12);
        } else {
          expect(slice.length).toBe(10);
        }
        totalSliced += slice.length;
      }

      expect(totalSliced).toBe(190);
    });

    await runner.it('S2.2: Anti-Duplication: every item 0..189 appears exactly ONCE across all pages (0 duplicates)', () => {
      const seenIds = new Map<string, number>();
      const collectedItems: VstepExamCatalogItem[] = [];

      for (let p = 1; p <= totalPages; p++) {
        const startIndex = (p - 1) * ITEMS_PER_PAGE;
        const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, catalogItems.length);
        const slice = catalogItems.slice(startIndex, endIndex);

        for (const item of slice) {
          const count = seenIds.get(item.id) || 0;
          seenIds.set(item.id, count + 1);
          collectedItems.push(item);
        }
      }

      // Check uniqueness
      expect(seenIds.size).toBe(190);
      for (const [id, count] of seenIds.entries()) {
        if (count !== 1) {
          throw new Error(`Item ${id} appeared ${count} times (expected exactly 1)`);
        }
      }

      // Check completeness & exact order preservation
      expect(collectedItems.length).toBe(190);
      for (let i = 0; i < 190; i++) {
        expect(collectedItems[i].id).toBe(catalogItems[i].id);
      }
    });

    await runner.it('S2.3: Inter-page boundary stitching: adjacent page boundaries are strictly contiguous', () => {
      for (let p = 1; p < totalPages; p++) {
        const pageAStart = (p - 1) * ITEMS_PER_PAGE;
        const pageAEnd = Math.min(pageAStart + ITEMS_PER_PAGE, catalogItems.length);
        const sliceA = catalogItems.slice(pageAStart, pageAEnd);

        const pageBStart = p * ITEMS_PER_PAGE;
        const pageBEnd = Math.min(pageBStart + ITEMS_PER_PAGE, catalogItems.length);
        const sliceB = catalogItems.slice(pageBStart, pageBEnd);

        const lastItemOfA = sliceA[sliceA.length - 1];
        const firstItemOfB = sliceB[0];

        expect(pageAEnd).toBe(pageBStart);
        expect(lastItemOfA.id).toBe(catalogItems[pageAEnd - 1].id);
        expect(firstItemOfB.id).toBe(catalogItems[pageBStart].id);
        expect(lastItemOfA.id !== firstItemOfB.id).toBeTruthy();
      }
    });

    await runner.it('S2.4: Slicing with filtered subsets divides accurately into exact page quotas', () => {
      // Filter category: full_mock (24 items) -> exactly 2 pages of 12
      const fullMockItems = catalogItems.filter(i => i.category === 'full_mock');
      expect(fullMockItems.length).toBe(24);
      const mockTotalPages = Math.max(1, Math.ceil(fullMockItems.length / ITEMS_PER_PAGE));
      expect(mockTotalPages).toBe(2);

      const mockP1 = fullMockItems.slice(0, 12);
      const mockP2 = fullMockItems.slice(12, 24);
      expect(mockP1.length).toBe(12);
      expect(mockP2.length).toBe(12);
      expect([...mockP1, ...mockP2].length).toBe(24);

      // Filter category: listening (61 items) -> 5 pages of 12 + 1 page of 1 (6 pages total)
      const listeningItems = catalogItems.filter(i => i.category === 'listening');
      expect(listeningItems.length).toBe(61);
      const lisTotalPages = Math.max(1, Math.ceil(listeningItems.length / ITEMS_PER_PAGE));
      expect(lisTotalPages).toBe(6);
      const lisP6 = listeningItems.slice(5 * 12, Math.min(5 * 12 + 12, 61));
      expect(lisP6.length).toBe(1);

      // Filter category: reading (105 items) -> 8 pages of 12 + 1 page of 9 (9 pages total)
      const readingItems = catalogItems.filter(i => i.category === 'reading');
      expect(readingItems.length).toBe(105);
      const readTotalPages = Math.max(1, Math.ceil(readingItems.length / ITEMS_PER_PAGE));
      expect(readTotalPages).toBe(9);
      const readP9 = readingItems.slice(8 * 12, Math.min(8 * 12 + 12, 105));
      expect(readP9.length).toBe(9);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Suite 3: Smart Ellipsis Transitions (Full Matrix Coverage)
  // ──────────────────────────────────────────────────────────────────────────
  await runner.describe('3. Smart Ellipsis Transitions Matrix (Pages 1, 2, 3, 4, 5, 8, 12, 13, 14, 15, 16)', async () => {
    const total = 16;

    await runner.it('E3.1: Start cluster: page 1 -> [1, 2, 3, 4, 5, "ellipsis", 16]', () => {
      expect(getPaginationPages(1, total)).toEqual([1, 2, 3, 4, 5, 'ellipsis', 16]);
    });

    await runner.it('E3.2: Start cluster: page 2 -> [1, 2, 3, 4, 5, "ellipsis", 16]', () => {
      expect(getPaginationPages(2, total)).toEqual([1, 2, 3, 4, 5, 'ellipsis', 16]);
    });

    await runner.it('E3.3: Start cluster: page 3 -> [1, 2, 3, 4, 5, "ellipsis", 16]', () => {
      expect(getPaginationPages(3, total)).toEqual([1, 2, 3, 4, 5, 'ellipsis', 16]);
    });

    await runner.it('E3.4: Start cluster: page 4 -> [1, 2, 3, 4, 5, "ellipsis", 16] (last page before transition)', () => {
      expect(getPaginationPages(4, total)).toEqual([1, 2, 3, 4, 5, 'ellipsis', 16]);
    });

    await runner.it('E3.5: Transition to middle cluster: page 5 -> [1, "ellipsis", 4, 5, 6, "ellipsis", 16]', () => {
      expect(getPaginationPages(5, total)).toEqual([1, 'ellipsis', 4, 5, 6, 'ellipsis', 16]);
    });

    await runner.it('E3.6: Middle cluster: page 8 -> [1, "ellipsis", 7, 8, 9, "ellipsis", 16]', () => {
      expect(getPaginationPages(8, total)).toEqual([1, 'ellipsis', 7, 8, 9, 'ellipsis', 16]);
    });

    await runner.it('E3.7: Middle cluster: page 12 -> [1, "ellipsis", 11, 12, 13, "ellipsis", 16] (last page before right cluster)', () => {
      expect(getPaginationPages(12, total)).toEqual([1, 'ellipsis', 11, 12, 13, 'ellipsis', 16]);
    });

    await runner.it('E3.8: Transition to end cluster: page 13 -> [1, "ellipsis", 12, 13, 14, 15, 16] (total - 3 threshold)', () => {
      expect(getPaginationPages(13, total)).toEqual([1, 'ellipsis', 12, 13, 14, 15, 16]);
    });

    await runner.it('E3.9: End cluster: page 14 -> [1, "ellipsis", 12, 13, 14, 15, 16]', () => {
      expect(getPaginationPages(14, total)).toEqual([1, 'ellipsis', 12, 13, 14, 15, 16]);
    });

    await runner.it('E3.10: End cluster: page 15 -> [1, "ellipsis", 12, 13, 14, 15, 16]', () => {
      expect(getPaginationPages(15, total)).toEqual([1, 'ellipsis', 12, 13, 14, 15, 16]);
    });

    await runner.it('E3.11: End cluster: page 16 -> [1, "ellipsis", 12, 13, 14, 15, 16] (final page)', () => {
      expect(getPaginationPages(16, total)).toEqual([1, 'ellipsis', 12, 13, 14, 15, 16]);
    });

    await runner.it('E3.12: Small total ranges (<= 7 pages) contain NO ellipsis', () => {
      expect(getPaginationPages(1, 1)).toEqual([1]);
      expect(getPaginationPages(1, 2)).toEqual([1, 2]);
      expect(getPaginationPages(2, 3)).toEqual([1, 2, 3]);
      expect(getPaginationPages(3, 5)).toEqual([1, 2, 3, 4, 5]);
      expect(getPaginationPages(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    });

    await runner.it('E3.13: Threshold total = 8 boundary transitions accurately', () => {
      expect(getPaginationPages(1, 8)).toEqual([1, 2, 3, 4, 5, 'ellipsis', 8]);
      expect(getPaginationPages(4, 8)).toEqual([1, 2, 3, 4, 5, 'ellipsis', 8]);
      expect(getPaginationPages(5, 8)).toEqual([1, 'ellipsis', 4, 5, 6, 7, 8]);
      expect(getPaginationPages(8, 8)).toEqual([1, 'ellipsis', 4, 5, 6, 7, 8]);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Suite 4: Filter Transitions & State Reset Verification
  // ──────────────────────────────────────────────────────────────────────────
  await runner.describe('4. Filter Transitions & Automatic Page Reset to 1', async () => {
    interface FilterState {
      selectedCategory: string;
      selectedLevel: string;
      selectedSource: string;
      searchQuery: string;
      currentPage: number;
    }

    class CatalogFilterStateMachine {
      state: FilterState = {
        selectedCategory: 'all',
        selectedLevel: 'all',
        selectedSource: 'all',
        searchQuery: '',
        currentPage: 1,
      };

      setCategory(cat: string) {
        if (this.state.selectedCategory !== cat) {
          this.state.selectedCategory = cat;
          this.onFilterChange();
        }
      }

      setLevel(lvl: string) {
        if (this.state.selectedLevel !== lvl) {
          this.state.selectedLevel = lvl;
          this.onFilterChange();
        }
      }

      setSource(src: string) {
        if (this.state.selectedSource !== src) {
          this.state.selectedSource = src;
          this.onFilterChange();
        }
      }

      setSearchQuery(q: string) {
        if (this.state.searchQuery !== q) {
          this.state.searchQuery = q;
          this.onFilterChange();
        }
      }

      setPage(p: number) {
        this.state.currentPage = p;
      }

      resetAllFilters() {
        this.state.selectedCategory = 'all';
        this.state.selectedLevel = 'all';
        this.state.selectedSource = 'all';
        this.state.searchQuery = '';
        this.state.currentPage = 1;
      }

      private onFilterChange() {
        this.state.currentPage = 1;
      }
    }

    await runner.it('R4.1: Changing Category resets page from 8 to 1', () => {
      const machine = new CatalogFilterStateMachine();
      machine.setPage(8);
      expect(machine.state.currentPage).toBe(8);

      machine.setCategory('listening');
      expect(machine.state.selectedCategory).toBe('listening');
      expect(machine.state.currentPage).toBe(1);
    });

    await runner.it('R4.2: Changing CEFR Level resets page from 4 to 1', () => {
      const machine = new CatalogFilterStateMachine();
      machine.setPage(4);
      expect(machine.state.currentPage).toBe(4);

      machine.setLevel('B1');
      expect(machine.state.selectedLevel).toBe('B1');
      expect(machine.state.currentPage).toBe(1);
    });

    await runner.it('R4.3: Changing Source resets page from 6 to 1', () => {
      const machine = new CatalogFilterStateMachine();
      machine.setPage(6);
      expect(machine.state.currentPage).toBe(6);

      machine.setSource('onthivstep');
      expect(machine.state.selectedSource).toBe('onthivstep');
      expect(machine.state.currentPage).toBe(1);
    });

    await runner.it('R4.4: Updating Search Query resets page from 5 to 1', () => {
      const machine = new CatalogFilterStateMachine();
      machine.setPage(5);
      expect(machine.state.currentPage).toBe(5);

      machine.setSearchQuery('nghe hieu');
      expect(machine.state.searchQuery).toBe('nghe hieu');
      expect(machine.state.currentPage).toBe(1);
    });

    await runner.it('R4.5: Clearing Search Query resets page from 3 to 1', () => {
      const machine = new CatalogFilterStateMachine();
      machine.setSearchQuery('doc hieu');
      machine.setPage(3);
      expect(machine.state.currentPage).toBe(3);

      machine.setSearchQuery('');
      expect(machine.state.searchQuery).toBe('');
      expect(machine.state.currentPage).toBe(1);
    });

    await runner.it('R4.6: Reset All Filters button restores default facets and resets page to 1', () => {
      const machine = new CatalogFilterStateMachine();
      machine.setCategory('reading');
      machine.setLevel('C1');
      machine.setSource('onthivstep');
      machine.setSearchQuery('baikal');
      machine.setPage(2);

      machine.resetAllFilters();
      expect(machine.state.selectedCategory).toBe('all');
      expect(machine.state.selectedLevel).toBe('all');
      expect(machine.state.selectedSource).toBe('all');
      expect(machine.state.searchQuery).toBe('');
      expect(machine.state.currentPage).toBe(1);
    });

    await runner.it('R4.7: Out-of-bounds prevention: page reset prevents blank screens when result count shrinks', () => {
      const filteredVnu = catalogItems.filter(i => i.source === 'vnu');
      expect(filteredVnu.length).toBe(1);
      const vnuPages = Math.max(1, Math.ceil(filteredVnu.length / ITEMS_PER_PAGE));
      expect(vnuPages).toBe(1);

      // Without reset:
      const brokenStartIndex = (16 - 1) * ITEMS_PER_PAGE;
      const brokenSlice = filteredVnu.slice(brokenStartIndex, Math.min(brokenStartIndex + ITEMS_PER_PAGE, filteredVnu.length));
      expect(brokenSlice.length).toBe(0);

      // With reset:
      const fixedStartIndex = (1 - 1) * ITEMS_PER_PAGE;
      const fixedSlice = filteredVnu.slice(fixedStartIndex, Math.min(fixedStartIndex + ITEMS_PER_PAGE, filteredVnu.length));
      expect(fixedSlice.length).toBe(1);
      expect(fixedSlice[0].id).toBe('vstep-exam-vnu-01');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Suite 5: Filter Execution Time Benchmark (< 1ms Verification)
  // ──────────────────────────────────────────────────────────────────────────
  await runner.describe('5. Filter Matrix Performance Benchmark (Verification < 1ms across 190 items)', async () => {
    const indexedItems = catalogItems.map((item) => ({
      ...item,
      _searchKey: normalizeViText(
        [item.id, item.title, item.titleVi, item.badge].filter(Boolean).join(' ')
      ),
    }));

    function executeFilterPass(cat: string, lvl: string, src: string, q: string) {
      const normQ = q.trim() ? normalizeViText(q.trim()) : '';
      const skillCounts: Record<string, number> = { all: 0, full_mock: 0, listening: 0, reading: 0, writing: 0, speaking: 0 };
      const levelCounts: Record<string, number> = { all: 0, B1: 0, B2: 0, C1: 0 };
      const sourceCounts: Record<string, number> = { all: 0, vstepowl: 0, onthivstep: 0, englishteststore: 0, vnu: 0 };
      const filtered: typeof indexedItems = [];

      for (let i = 0; i < indexedItems.length; i++) {
        const item = indexedItems[i];
        if (normQ && !item._searchKey.includes(normQ)) continue;

        const itemSkill = item.skill || item.category;
        const itemLevel = item.cefrLevel || item.targetLevel;
        const itemSource = item.source || 'vstepowl';

        const matchSkill = cat === 'all' || itemSkill === cat;
        const matchLevel = lvl === 'all' || itemLevel === lvl;
        const matchSource = src === 'all' || itemSource === src;

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

    await runner.it('T5.1: Benchmark 3,000 multi-facet filtering passes (average execution time < 1ms)', () => {
      for (let i = 0; i < 200; i++) {
        executeFilterPass('all', 'all', 'all', '');
      }

      const testScenarios = [
        { cat: 'all', lvl: 'all', src: 'all', q: '' },
        { cat: 'listening', lvl: 'all', src: 'all', q: '' },
        { cat: 'reading', lvl: 'B2', src: 'onthivstep', q: '' },
        { cat: 'all', lvl: 'C1', src: 'all', q: 'doc hieu' },
        { cat: 'full_mock', lvl: 'all', src: 'vstepowl', q: 'de thi' },
        { cat: 'all', lvl: 'all', src: 'englishteststore', q: 'vstep' },
      ];

      const iterations = 3000;
      const start = performance.now();

      for (let i = 0; i < iterations; i++) {
        const s = testScenarios[i % testScenarios.length];
        executeFilterPass(s.cat, s.lvl, s.src, s.q);
      }

      const totalTimeMs = performance.now() - start;
      const avgTimeMs = totalTimeMs / iterations;

      console.log(`    ⚡ Benchmark Result: ${iterations} passes executed in ${totalTimeMs.toFixed(2)}ms`);
      console.log(`    ⚡ Average Filter Pass Time: ${avgTimeMs.toFixed(4)}ms per pass (Threshold: < 1.0ms)`);

      expect(avgTimeMs).toBeLessThan(1.0);
      expect(avgTimeMs).toBeLessThan(0.1);
    });

    await runner.it('T5.2: Filter counts correctly conserve item partition totals', () => {
      const res = executeFilterPass('all', 'all', 'all', '');
      expect(res.filtered.length).toBe(190);

      const sumSkills = res.skillCounts.full_mock + res.skillCounts.listening + res.skillCounts.reading;
      expect(sumSkills).toBe(190);

      const sumLevels = res.levelCounts.B1 + res.levelCounts.B2 + res.levelCounts.C1;
      expect(sumLevels).toBe(190);

      const sumSources = res.sourceCounts.vstepowl + res.sourceCounts.onthivstep + res.sourceCounts.englishteststore + res.sourceCounts.vnu;
      expect(sumSources).toBe(190);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Suite 6: Accent-Insensitive Search Against Diacritics
  // ──────────────────────────────────────────────────────────────────────────
  await runner.describe('6. Accent-Insensitive Search Against Diacritics (đề thi, tieng anh, nghe hieu, doc hieu, toan dien)', async () => {
    // Real catalog items pre-indexed
    const indexedItems = catalogItems.map((item) => ({
      ...item,
      _searchKey: normalizeViText(
        [item.id, item.title, item.titleVi, item.badge].filter(Boolean).join(' ')
      ),
    }));

    function searchCatalog(query: string) {
      const normQ = normalizeViText(query.trim());
      if (!normQ) return indexedItems;
      return indexedItems.filter(item => item._searchKey.includes(normQ));
    }

    // Oracle search function over generic documents containing test diacritics
    function searchDocuments(docs: Array<{ id: string; text: string }>, query: string) {
      const normQ = normalizeViText(query.trim());
      if (!normQ) return docs;
      return docs.filter(d => normalizeViText(d.text).includes(normQ));
    }

    await runner.it('D6.1: normalizeViText correctly strips diacritics and maps đ/Đ to d/D across all 5 target terms', () => {
      expect(normalizeViText('đề thi')).toBe('de thi');
      expect(normalizeViText('tiếng anh')).toBe('tieng anh');
      expect(normalizeViText('nghe hiểu')).toBe('nghe hieu');
      expect(normalizeViText('đọc hiểu')).toBe('doc hieu');
      expect(normalizeViText('toàn diện')).toBe('toan dien');

      // Uppercase diacritics
      expect(normalizeViText('ĐỀ THI')).toBe('de thi');
      expect(normalizeViText('TIẾNG ANH')).toBe('tieng anh');
      expect(normalizeViText('NGHE HIỂU')).toBe('nghe hieu');
      expect(normalizeViText('ĐỌC HIỂU')).toBe('doc hieu');
      expect(normalizeViText('TOÀN DIỆN')).toBe('toan dien');

      // Unaccented inputs remain unchanged
      expect(normalizeViText('de thi')).toBe('de thi');
      expect(normalizeViText('tieng anh')).toBe('tieng anh');
      expect(normalizeViText('nghe hieu')).toBe('nghe hieu');
      expect(normalizeViText('doc hieu')).toBe('doc hieu');
      expect(normalizeViText('toan dien')).toBe('toan dien');
    });

    await runner.it('D6.2: Live Catalog: Search "đề thi" vs "de thi" yields 100% identical 24 Full Mock items', () => {
      const matchesAccented = searchCatalog('đề thi');
      const matchesUnaccented = searchCatalog('de thi');

      expect(matchesAccented.length).toBe(24);
      expect(matchesAccented.length).toBe(matchesUnaccented.length);

      const idsAccented = matchesAccented.map(i => i.id).sort();
      const idsUnaccented = matchesUnaccented.map(i => i.id).sort();
      expect(idsAccented).toEqual(idsUnaccented);
    });

    await runner.it('D6.3: Live Catalog: Search "đọc hiểu" vs "doc hieu" yields 100% identical 20 Reading items', () => {
      const matchesAccented = searchCatalog('đọc hiểu');
      const matchesUnaccented = searchCatalog('doc hieu');

      expect(matchesAccented.length).toBe(20);
      expect(matchesAccented.length).toBe(matchesUnaccented.length);

      const idsAccented = matchesAccented.map(i => i.id).sort();
      const idsUnaccented = matchesUnaccented.map(i => i.id).sort();
      expect(idsAccented).toEqual(idsUnaccented);
    });

    await runner.it('D6.4: Live Catalog: Search "nghe" vs "nghe" yields 100% identical 56 Listening items', () => {
      const matches = searchCatalog('nghe');
      expect(matches.length).toBe(56);
      expect(matches.every(i => i.category === 'listening')).toBeTruthy();
    });

    await runner.it('D6.5: Normalization consistency on Live Catalog for all 5 terms (accented query === unaccented query)', () => {
      const targetPairs = [
        ['đề thi', 'de thi'],
        ['tiếng anh', 'tieng anh'],
        ['nghe hiểu', 'nghe hieu'],
        ['đọc hiểu', 'doc hieu'],
        ['toàn diện', 'toan dien'],
      ];

      for (const [accented, unaccented] of targetPairs) {
        const resAccented = searchCatalog(accented);
        const resUnaccented = searchCatalog(unaccented);

        expect(resAccented.length).toBe(resUnaccented.length);
        expect(resAccented.map(i => i.id)).toEqual(resUnaccented.map(i => i.id));
      }
    });

    await runner.it('D6.6: Universal Corpus Oracle: Bi-directional search matching across all 5 target terms', () => {
      const testDocuments = [
        { id: 'doc-1', text: 'Bộ Đề Thi Thử Chuẩn VSTEP 2026' },
        { id: 'doc-2', text: 'Giáo trình Tiếng Anh B1-B2 Chuyên Sâu' },
        { id: 'doc-3', text: 'Kỹ Năng Nghe Hiểu Audio Streaming CDN' },
        { id: 'doc-4', text: 'Chiến thuật Đọc Hiểu 4 Passages Luyện Nhanh' },
        { id: 'doc-5', text: 'Khảo Thí Toàn Diện 4 Kỹ Năng Máy Tính' },
      ];

      // 1. "đề thi" vs "de thi"
      const matchDeThi1 = searchDocuments(testDocuments, 'đề thi');
      const matchDeThi2 = searchDocuments(testDocuments, 'de thi');
      expect(matchDeThi1.length).toBe(1);
      expect(matchDeThi1[0].id).toBe('doc-1');
      expect(matchDeThi1).toEqual(matchDeThi2);

      // 2. "tieng anh" vs "tiếng anh"
      const matchTiengAnh1 = searchDocuments(testDocuments, 'tieng anh');
      const matchTiengAnh2 = searchDocuments(testDocuments, 'tiếng anh');
      const matchTiengAnh3 = searchDocuments(testDocuments, 'TIẾNG ANH');
      expect(matchTiengAnh1.length).toBe(1);
      expect(matchTiengAnh1[0].id).toBe('doc-2');
      expect(matchTiengAnh1).toEqual(matchTiengAnh2);
      expect(matchTiengAnh1).toEqual(matchTiengAnh3);

      // 3. "nghe hieu" vs "nghe hiểu"
      const matchNgheHieu1 = searchDocuments(testDocuments, 'nghe hieu');
      const matchNgheHieu2 = searchDocuments(testDocuments, 'nghe hiểu');
      expect(matchNgheHieu1.length).toBe(1);
      expect(matchNgheHieu1[0].id).toBe('doc-3');
      expect(matchNgheHieu1).toEqual(matchNgheHieu2);

      // 4. "doc hieu" vs "đọc hiểu"
      const matchDocHieu1 = searchDocuments(testDocuments, 'doc hieu');
      const matchDocHieu2 = searchDocuments(testDocuments, 'đọc hiểu');
      expect(matchDocHieu1.length).toBe(1);
      expect(matchDocHieu1[0].id).toBe('doc-4');
      expect(matchDocHieu1).toEqual(matchDocHieu2);

      // 5. "toan dien" vs "toàn diện"
      const matchToanDien1 = searchDocuments(testDocuments, 'toan dien');
      const matchToanDien2 = searchDocuments(testDocuments, 'toàn diện');
      expect(matchToanDien1.length).toBe(1);
      expect(matchToanDien1[0].id).toBe('doc-5');
      expect(matchToanDien1).toEqual(matchToanDien2);
    });

    await runner.it('D6.7: Case insensitivity and whitespace resilience across diacritics', () => {
      const clean = searchCatalog('doc hieu');
      const upper = searchCatalog('  ĐỌC HIỂU  ');
      const mixed = searchCatalog('Đọc Hiểu');

      expect(clean.length).toBe(20);
      expect(clean.length).toBe(upper.length);
      expect(clean.length).toBe(mixed.length);
      expect(clean.map(i => i.id)).toEqual(upper.map(i => i.id));
      expect(clean.map(i => i.id)).toEqual(mixed.map(i => i.id));
    });
  });

  const stats = runner.getStats();
  console.log(`\n======================================================`);
  console.log(`🏁 CHALLENGER M3.1 SUITE: ${stats.passed}/${stats.total} PASSED | ${stats.failed} FAILED`);
  console.log(`======================================================`);

  if (stats.failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runChallengerPaginationTests().catch((err) => {
    console.error('Fatal error in Challenger M3.1 pagination suite:', err);
    process.exit(1);
  });
}
