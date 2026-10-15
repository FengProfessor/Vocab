import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  recordVnuB3Attempt,
  getVnuB3ExamHistoryMap,
  getVnuB3DraftStatusMap,
  VNU_B3_HISTORY_STORAGE_KEY,
  VNU_B3_DRAFT_PREFIX,
} from '../../src/lib/vnu-bac-3/history';
import { getVstepDraftStatusMap } from '../../src/lib/vstep-history';

function createMockLocalStorage() {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    getItem(k: string) {
      return store.has(k) ? store.get(k)! : null;
    },
    setItem(k: string, v: string) {
      store.set(k, String(v));
    },
    removeItem(k: string) {
      store.delete(k);
    },
    clear() {
      store.clear();
    },
  };
}

test('VP-1: VNU Bac 3 history records attempts and computes highestScore accurately', () => {
  const mockStorage = createMockLocalStorage();
  (globalThis as unknown as { window: unknown; localStorage: unknown }).window = {
    localStorage: mockStorage,
    dispatchEvent: () => true,
  };
  (globalThis as unknown as { localStorage: unknown }).localStorage = mockStorage;

  recordVnuB3Attempt({
    examId: 'vnu-bac-3-mock-01',
    examTitle: 'Đề thi mẫu số 01',
    mode: 'full_simulation',
    durationSeconds: 3600,
    result: {
      examId: 'vnu-bac-3-mock-01',
      overallScore: 6.5,
      readingScore: 7.0,
      listeningScore: 6.0,
      readingCorrect: 28,
      readingTotal: 40,
      listeningCorrect: 21,
      listeningTotal: 35,
      isPassed: true,
      statusLabel: 'ĐẠT (BẬC 3 / B1)',
      timeSpentSeconds: 3600,
      submittedAt: new Date().toISOString(),
      partBreakdown: {},
    },
  });

  recordVnuB3Attempt({
    examId: 'vnu-bac-3-mock-01',
    examTitle: 'Đề thi mẫu số 01',
    mode: 'full_simulation',
    durationSeconds: 3400,
    result: {
      examId: 'vnu-bac-3-mock-01',
      overallScore: 8.0,
      readingScore: 8.5,
      listeningScore: 7.5,
      readingCorrect: 34,
      readingTotal: 40,
      listeningCorrect: 26,
      listeningTotal: 35,
      isPassed: true,
      statusLabel: 'ĐẠT (BẬC 3 / B1)',
      timeSpentSeconds: 3400,
      submittedAt: new Date().toISOString(),
      partBreakdown: {},
    },
  });

  const summaries = getVnuB3ExamHistoryMap();
  assert.ok(summaries['vnu-bac-3-mock-01']);
  assert.equal(summaries['vnu-bac-3-mock-01'].attemptCount, 2);
  assert.equal(summaries['vnu-bac-3-mock-01'].highestScore, 8.0);
  assert.equal(summaries['vnu-bac-3-mock-01'].lastScore, 8.0);
  assert.equal(summaries['vnu-bac-3-mock-01'].passed, true);

  const raw = mockStorage.getItem(VNU_B3_HISTORY_STORAGE_KEY);
  assert.ok(raw);
});

test('VP-2: getVnuB3DraftStatusMap detects active VNU drafts with MCQ or writing drafts', () => {
  const mockStorage = createMockLocalStorage();
  (globalThis as unknown as { window: unknown; localStorage: unknown }).window = {
    localStorage: mockStorage,
  };
  (globalThis as unknown as { localStorage: unknown }).localStorage = mockStorage;

  mockStorage.setItem(
    `${VNU_B3_DRAFT_PREFIX}vnu-bac-3-mock-02_full_simulation`,
    JSON.stringify({
      examId: 'vnu-bac-3-mock-02',
      answers: { q1: 'A', q2: 'C' },
      writingDrafts: { w1: 'Dear Sir, I am writing to inquire...' },
      updatedAt: 1700000000000,
    })
  );

  // Empty draft should be ignored
  mockStorage.setItem(
    `${VNU_B3_DRAFT_PREFIX}vnu-bac-3-mock-03_full_simulation`,
    JSON.stringify({
      examId: 'vnu-bac-3-mock-03',
      answers: {},
      writingDrafts: {},
      updatedAt: 1700000000000,
    })
  );

  const draftMap = getVnuB3DraftStatusMap(['vnu-bac-3-mock-02', 'vnu-bac-3-mock-03']);
  assert.ok(draftMap['vnu-bac-3-mock-02']);
  assert.equal(draftMap['vnu-bac-3-mock-02'].answeredCount, 2);
  assert.equal(draftMap['vnu-bac-3-mock-02'].writingDraftCount, 1);
  assert.equal(draftMap['vnu-bac-3-mock-03'], undefined);
});

test('VP-3: getVstepDraftStatusMap resolves examId from both explicit examId property and key suffixes', () => {
  const mockStorage = createMockLocalStorage();
  (globalThis as unknown as { window: unknown; localStorage: unknown }).window = {
    localStorage: mockStorage,
  };
  (globalThis as unknown as { localStorage: unknown }).localStorage = mockStorage;

  // Explicit examId in payload
  mockStorage.setItem(
    'vstep_draft_vstep-mock-01_unseen_writing',
    JSON.stringify({
      examId: 'vstep-mock-01',
      skill: 'writing',
      answers: {},
      writing: { task1: 'Hello friend, how are you doing today?' },
      updatedAt: 1700000005000,
    })
  );

  // Legacy draft without examId property in payload
  mockStorage.setItem(
    'vstep_draft_vstep-reading-set-05_mistakes_reading',
    JSON.stringify({
      answers: { q1: 0, q2: 2, q3: 1 },
      writing: {},
      updatedAt: 1700000009000,
    })
  );

  const draftMap = getVstepDraftStatusMap();
  assert.ok(draftMap['vstep-mock-01']);
  assert.equal(draftMap['vstep-mock-01'].writingCount, 1);
  assert.ok(draftMap['vstep-reading-set-05']);
  assert.equal(draftMap['vstep-reading-set-05'].answeredCount, 3);
});

test('VP-4: Database constraint migration and fallback logic exist for vstep and vnu-bac-3 tracks', () => {
  const root = process.cwd();
  const migrationPath = path.join(
    root,
    'supabase/migrations/20261014_roadmap_vstep_vnu_tracks.sql'
  );
  assert.ok(fs.existsSync(migrationPath), 'Migration 20261014_roadmap_vstep_vnu_tracks.sql must exist');
  const migrationSql = fs.readFileSync(migrationPath, 'utf8');
  assert.ok(migrationSql.includes("'vstep'") && migrationSql.includes("'vnu-bac-3'"));

  const vnuSubmit = fs.readFileSync(
    path.join(root, 'src/app/api/vnu-bac-3/submit/route.ts'),
    'utf8'
  );
  assert.ok(
    vnuSubmit.includes("track: 'vnu-bac-3'") && vnuSubmit.includes("track: 'cefr'"),
    'VNU submit route must support vnu-bac-3 track with cefr fallback'
  );

  const vstepSubmit = fs.readFileSync(
    path.join(root, 'src/app/api/vstep/submit/route.ts'),
    'utf8'
  );
  assert.ok(
    vstepSubmit.includes("track: 'vstep'") && vstepSubmit.includes("track: 'cefr'"),
    'VSTEP submit route must support vstep track with cefr fallback'
  );
});

test('VP-5: ActionSelectionModal, VstepPage, and VnuSplitPane match persistence keys and responsive rules', () => {
  const root = process.cwd();
  const modalCode = fs.readFileSync(
    path.join(root, 'src/components/student/ActionSelectionModal.tsx'),
    'utf8'
  );
  assert.ok(
    modalCode.includes("localStorage.getItem('lingo_toeic_completed_lessons')"),
    'ActionSelectionModal must read lingo_toeic_completed_lessons'
  );
  assert.ok(
    modalCode.includes("localStorage.getItem('lingo_toeic_exam_history')"),
    'ActionSelectionModal must read lingo_toeic_exam_history'
  );

  const vstepPageCode = fs.readFileSync(path.join(root, 'src/app/vstep/page.tsx'), 'utf8');
  assert.ok(
    vstepPageCode.includes("hasDraft ? 'Tiếp Tục Thi' : 'Vào Phòng Thi (172p)'"),
    'VstepPage must render Tiếp Tục Thi when draft exists'
  );
  assert.ok(
    vstepPageCode.includes("hasDraft ? 'Tiếp Tục Luyện' : 'Luyện Tập Ngay'"),
    'VstepPage Practice Grid View must render Tiếp Tục Luyện when draft exists'
  );

  const vnuSplitPaneCode = fs.readFileSync(
    path.join(root, 'src/components/vnu-bac-3/VnuSplitPane.tsx'),
    'utf8'
  );
  assert.ok(
    !vnuSplitPaneCode.includes('gap-4 h-[calc(100vh-140px)]'),
    'VnuSplitPane must not force fixed h-[calc(100vh-140px)] on mobile stacked grid'
  );
  assert.ok(
    vnuSplitPaneCode.includes('lg:h-[calc(100vh-140px)]'),
    'VnuSplitPane must use lg:h-[calc(100vh-140px)] for desktop split pane'
  );
});
